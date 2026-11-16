import {advance,validScore,note,fail} from './domain.mjs';
import {validAvatar,DEFAULT_AVATAR_ID} from './avatars.mjs';
import {verifiedContribution} from './invites.mjs';

// The browser coordinates atomic writes; Firestore Rules independently authorize every field.
// Inject the SDK so the same implementation can be exercised against the local emulators.
export function createFirestoreApi(store,auth,{doc,runTransaction,serverTimestamp,increment,getDocs,collection}){
  const id=value=>{if(typeof value!=='string'||!(/^[a-f\d-]{36}$/i).test(value))fail('Invalid action or group ID.','invalid-argument');return value;};
  const text=(value,min,max)=>{if(typeof value!=='string'||value.trim().length<min||value.trim().length>max)fail(`Enter ${min}–${max} characters.`,'invalid-argument');return value.trim();};
  const ref=(...parts)=>doc(store,...parts);
  const profile=uid=>ref('users',uid);
  const group=gid=>ref('groups',gid);
  const member=(gid,uid)=>ref('groups',gid,'members',uid);
  const membership=(uid,gid)=>ref('users',uid,'memberships',gid);
  const ticket=(gid,tid)=>ref('groups',gid,'tickets',tid);
  const operation=(gid,aid)=>ref('groups',gid,'operations',aid);
  const preview=(code,uid)=>ref('inviteCodes',code,'players',uid);
  const previewSeed=(own,now)=>({displayName:own.displayName,avatarId:own.avatarId||DEFAULT_AVATAR_ID,xp:0,played:0,wins:0,lastTicketId:null,lastActionId:null,updatedAt:now});
  async function saveProfile(data,uid){
    const displayName=text(data.displayName,3,24);
    if(!/^[A-Za-z0-9_]{3,24}$/.test(displayName))fail('Use 3–24 letters, numbers or underscores for your username.','invalid-argument');
    const username=displayName.toLowerCase();
    if(data.avatarId!==undefined&&!validAvatar(data.avatarId))fail('Choose a character from the tray.','invalid-argument');
    const result=await runTransaction(store,async tx=>{
      const [own,reserved]=await Promise.all([tx.get(profile(uid)),tx.get(ref('usernames',username))]);
      if(own.exists()&&own.data().username&&own.data().username!==username)fail('Your username cannot be changed after onboarding.');
      if(reserved.exists()&&reserved.data().uid!==uid)fail('That username is already taken. Please choose another.','already-exists');
      const now=serverTimestamp();
      const avatarId=data.avatarId||(validAvatar(own.data()?.avatarId)?own.data().avatarId:DEFAULT_AVATAR_ID);
      if(!reserved.exists())tx.set(ref('usernames',username),{uid,createdAt:now});
      tx.set(profile(uid),{displayName,username,avatarId,updatedAt:now,...(!own.exists()?{createdAt:now}:{})},{merge:true});
      return {displayName,username,avatarId};
    });
    // Refresh this player's name and character snapshots without changing group statistics.
    const groups=await getDocs(collection(store,'users',uid,'memberships'));
    await Promise.all(groups.docs.map(g=>runTransaction(store,async tx=>{
      const info=await tx.get(group(g.id));
      const card=info.exists()?await tx.get(preview(info.data().inviteCode,uid)):null;
      tx.set(member(g.id,uid),{displayName,avatarId:result.avatarId},{merge:true});
      if(card?.exists())tx.set(preview(info.data().inviteCode,uid),{displayName,avatarId:result.avatarId,updatedAt:serverTimestamp()},{merge:true});
    })));
    return result;
  }
  function writeAction(tx,gid,tid,aid,actor,kind,t,event,target){
    const now=serverTimestamp();
    tx.set(ticket(gid,tid),t);
    tx.set(operation(gid,aid),{actor,ticketId:tid,kind,version:t.version,createdAt:now});
    tx.set(ref('groups',gid,'tickets',tid,'events',aid),event);
    tx.set(ref('users',target,'notifications',aid),{
      kind,title:kind==='submitted'?'New match to confirm':'Match updated',
      body:kind==='submitted'?'A player submitted a score.':'Open your match to review.',
      groupId:gid,ticketId:tid,path:`/g/${gid}/t/${tid}`,createdAt:now,readAt:null
    });
  }
  async function createGroup(data,uid){
    const gid=id(data.actionId),name=text(data.name,2,52);
    const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for(let attempt=0;attempt<5;attempt++){
      const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),n=>alphabet[n%alphabet.length]).join('');
      try{return await runTransaction(store,async tx=>{
        const [g,invite,own]=await Promise.all([tx.get(group(gid)),tx.get(ref('inviteCodes',code)),tx.get(profile(uid))]);
        if(g.exists()){if(g.data().creatorUid!==uid)fail('Group ID already used.','already-exists');return {groupId:gid,code:g.data().inviteCode,replayed:true};}
        if(!own.exists()||!validAvatar(own.data().avatarId))fail('Choose your character first.');
        if(invite.exists())fail('Invite code collision.','already-exists');
        const now=serverTimestamp();
        tx.set(group(gid),{name,creatorUid:uid,inviteCode:code,createdAt:now,timeZone:'Asia/Kolkata'});
        tx.set(ref('inviteCodes',code),{groupId:gid,name,createdAt:now});
        tx.set(member(gid,uid),{displayName:own.data().displayName,avatarId:own.data().avatarId||DEFAULT_AVATAR_ID,joinedAt:now,inviteCode:code});
        tx.set(membership(uid,gid),{groupId:gid,name,joinedAt:now});
        tx.set(preview(code,uid),previewSeed(own.data(),now));
        return {groupId:gid,code};
      });}catch(e){if(e.code==='already-exists'&&e.message==='Invite code collision.')continue;throw e;}
    }
    fail('Could not allocate invitation code. Please try again.');
  }
  async function joinGroup(data,uid){
    const code=String(data.code||'').replace(/\s/g,'').toUpperCase();
    if(!/^[A-Z2-9]{8}$/.test(code))fail('Enter a valid 8-character invite code.','invalid-argument');
    return runTransaction(store,async tx=>{
      const [index,own]=await Promise.all([tx.get(ref('inviteCodes',code)),tx.get(profile(uid))]);
      if(!index.exists())fail('Invite code not found.','not-found');
      if(!own.exists()||!validAvatar(own.data().avatarId))fail('Choose your character first.');
      const {groupId:gid,name}=index.data();
      const [m,ownMembership]=await Promise.all([tx.get(member(gid,uid)),tx.get(membership(uid,gid))]);
      const now=serverTimestamp();
      if(!m.exists())tx.set(member(gid,uid),{displayName:own.data().displayName,avatarId:own.data().avatarId||DEFAULT_AVATAR_ID,joinedAt:now,inviteCode:code});
      if(!ownMembership.exists())tx.set(membership(uid,gid),{groupId:gid,name,joinedAt:m.exists()?m.data().joinedAt:now});
      if(!m.exists())tx.set(preview(code,uid),previewSeed(own.data(),now));
      return {groupId:gid,name};
    });
  }
  async function submitMatch(data,uid){
    const gid=id(data.groupId),aid=id(data.actionId),opponent=text(data.opponentUid,1,128);
    if(opponent===uid)fail('You cannot play yourself.','invalid-argument');
    const score=validScore({a:data.scoreSelf,b:data.scoreOpponent}),message=note(data.note),mode=data.mode??'ranked';
    if(!['ranked','casual'].includes(mode))fail('Choose ranked or casual.','invalid-argument');
    return runTransaction(store,async tx=>{
      const [old,op,ma,mb]=await Promise.all([tx.get(ticket(gid,aid)),tx.get(operation(gid,aid)),tx.get(member(gid,uid)),tx.get(member(gid,opponent))]);
      if(old.exists()){
        if(old.data().playerA!==uid||!op.exists()||op.data().actor!==uid||op.data().kind!=='submitted')fail('Ticket ID already used.','already-exists');
        return {ticketId:aid,replayed:true};
      }
      if(!ma.exists()||!mb.exists())fail('Both players must belong to the group.','permission-denied');
      const now=serverTimestamp();
      const t={groupId:gid,playerA:uid,playerB:opponent,createdBy:uid,createdAt:now,playedAt:now,updatedAt:now,
        mode,status:'open',revision:1,version:1,turn:opponent,disputed:false,
        proposal:{score,by:uid,note:message,at:now},finalScore:null,finalizedAt:null,cancellation:null,amendment:null,
        action:{id:aid,kind:'submitted',actor:uid}};
      writeAction(tx,gid,aid,aid,uid,'submitted',t,{kind:'submitted',actor:uid,score,note:message,at:now},opponent);
      return {ticketId:aid};
    });
  }
  async function mutateTicket(data,uid){
    const gid=id(data.groupId),tid=id(data.ticketId),aid=id(data.actionId),kind=String(data.kind||'');
    return runTransaction(store,async tx=>{
      const [op,current]=await Promise.all([tx.get(operation(gid,aid)),tx.get(ticket(gid,tid))]);
      if(op.exists()){
        if(op.data().actor!==uid||op.data().ticketId!==tid||op.data().kind!==kind)fail('Action ID already used.','already-exists');
        return {ticketId:tid,replayed:true};
      }
      if(!current.exists())fail('Match no longer exists.','not-found');
      const t=current.data();
      if(!Number.isInteger(data.expectedVersion)||data.expectedVersion!==t.version)fail('This match changed while you were away. Review the latest match before continuing.');
      const now=serverTimestamp();
      const {next,event,target}=advance(t,kind,uid,data,now);
      next.version=t.version+1;next.action={id:aid,kind,actor:uid};
      const before=[t.playerA,t.playerB].map(player=>verifiedContribution(t,player)),after=[t.playerA,t.playerB].map(player=>verifiedContribution(next,player));
      if(JSON.stringify(before)!==JSON.stringify(after)){
        const info=await tx.get(group(gid)),code=info.data()?.inviteCode;
        // Server increments compose correctly when different matches finish simultaneously.
        // Rules still check every delta against this exact old/new verified ticket.
        [t.playerA,t.playerB].forEach((player,i)=>{
          const delta=Object.fromEntries(['xp','played','wins'].map(key=>[key,increment(after[i][key]-before[i][key])]));
          tx.update(preview(code,player),{...delta,lastTicketId:tid,lastActionId:aid,updatedAt:now});
        });
      }
      writeAction(tx,gid,tid,aid,uid,kind,next,event,target);
      return {ticketId:tid,status:next.status};
    });
  }
  return async(name,data={})=>{
    const user=auth.currentUser;if(!user)fail('Sign in first.','unauthenticated');
    switch(name){
      case 'saveProfile':return saveProfile(data,user.uid);
      case 'createGroup':return createGroup(data,user.uid);
      case 'joinGroup':return joinGroup(data,user.uid);
      case 'submitMatch':return submitMatch(data,user.uid);
      case 'mutateTicket':return mutateTicket(data,user.uid);
      default:fail('This action is unavailable.','invalid-argument');
    }
  };
}
