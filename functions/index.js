'use strict';
const crypto=require('node:crypto');
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {onDocumentCreated}=require('firebase-functions/v2/firestore');
const {logger}=require('firebase-functions');
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,Timestamp,FieldValue}=require('firebase-admin/firestore');
const {getMessaging}=require('firebase-admin/messaging');
const {advance,periodKeys,validScore,note,fail}=require('./domain.cjs');
initializeApp();
const db=getFirestore();
const REGION='asia-south1';
const opts={region:REGION,timeoutSeconds:30,maxInstances:30};
const fn=(handler)=>onCall(opts,async(req)=>{
  try { if(!req.auth?.uid) throw new HttpsError('unauthenticated','Sign in first.'); return await handler(req.data||{},req.auth.uid); }
  catch(e){ if(e instanceof HttpsError) throw e; logger.warn('Callable denied or failed',{code:e.code||'internal',message:e.message});
    if(['permission-denied','invalid-argument','failed-precondition','already-exists','not-found','resource-exhausted'].includes(e.code)) throw new HttpsError(e.code,e.message);
    throw new HttpsError('internal','The request could not be completed. Try again.'); }
});
function checkId(s){if(typeof s!=='string'||!(/^[a-f\d-]{36}$/i).test(s)) fail('Invalid action ID.','invalid-argument');return s;}
function checkGid(s){return checkId(s);}
function checkText(s,min=1,max=50){if(typeof s!=='string'||s.trim().length<min||s.trim().length>max) fail(`Enter ${min}–${max} characters.`,'invalid-argument');return s.trim();}
const userRef=uid=>db.doc(`users/${uid}`);
const groupRef=gid=>db.doc(`groups/${gid}`);
const memberRef=(gid,uid)=>groupRef(gid).collection('members').doc(uid);
const opRef=(gid,id)=>groupRef(gid).collection('operations').doc(id);
const ticketRef=(gid,tid)=>groupRef(gid).collection('tickets').doc(tid);
const notif=(uid,actionId,kind,title,body,gid,tid,now)=>({
  ref:userRef(uid).collection('notifications').doc(actionId),
  data:{kind,title,body,groupId:gid,ticketId:tid,path:`/g/${gid}/t/${tid}`,createdAt:now,readAt:null,pushState:'pending'}
});
exports.saveProfile=fn(async(data,uid)=>{
  const displayName=checkText(data.displayName,2,32);
  await userRef(uid).set({displayName,updatedAt:FieldValue.serverTimestamp(),createdAt:FieldValue.serverTimestamp()}, {merge:true});
  // Existing group name snapshots intentionally aren't changed automatically.
  return {ok:true};
});
exports.createGroup=fn(async(data,uid)=>{
  const groupId=checkGid(data.actionId);const name=checkText(data.name,2,52);
  const own=await userRef(uid).get();if(!own.exists||!own.data()?.displayName) fail('Set up your profile first.');
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for(let attempt=0;attempt<5;attempt++){
    const code=Array.from(crypto.randomBytes(8),n=>alphabet[n%alphabet.length]).join('');
    try{
      const result=await db.runTransaction(async(tx)=>{
        const [g,c]=await Promise.all([tx.get(groupRef(groupId)),tx.get(db.doc(`inviteCodes/${code}`))]);
        if(g.exists){if(g.data()?.creatorUid!==uid) fail('Group ID belongs to a different user.');return {groupId,code:g.data().inviteCode};}
        if(c.exists) fail('Invite code collision.','already-exists');
        const now=Timestamp.now();
        tx.create(groupRef(groupId),{name,creatorUid:uid,inviteCode:code,createdAt:now,memberCount:1,timeZone:'Asia/Kolkata'});
        tx.create(db.doc(`inviteCodes/${code}`),{groupId,createdAt:now});
        tx.create(memberRef(groupId,uid),{displayName:own.data().displayName,joinedAt:now});
        tx.set(userRef(uid).collection('memberships').doc(groupId),{groupId,name,joinedAt:now});
        return {groupId,code};
      });return result;
    }catch(e){if(e.code==='already-exists'&&e.message==='Invite code collision.') continue;throw e;}
  }fail('Could not allocate invitation code, please retry.');
});
exports.joinGroup=fn(async(data,uid)=>{
  const code=String(data.code||'').replace(/\s/g,'').toUpperCase();
  if(!/^[A-Z2-9]{8}$/.test(code)) fail('Enter a valid 8-character invite code.','invalid-argument');
  const own=await userRef(uid).get(); if(!own.exists||!own.data().displayName) fail('Set up your profile first.');
  return db.runTransaction(async(tx)=>{
    const index=await tx.get(db.doc(`inviteCodes/${code}`));if(!index.exists) fail('Invite code not found.','not-found');
    const groupId=index.data().groupId;
    const [g,m]=await Promise.all([tx.get(groupRef(groupId)),tx.get(memberRef(groupId,uid))]);
    if(!g.exists) fail('Group no longer exists.','not-found');
    if(!m.exists){
      const now=Timestamp.now();
      tx.create(memberRef(groupId,uid),{displayName:own.data().displayName,joinedAt:now});
      tx.update(groupRef(groupId),{memberCount:FieldValue.increment(1)});
    }
    tx.set(userRef(uid).collection('memberships').doc(groupId),{groupId,name:g.data().name,joinedAt:m.exists?m.data().joinedAt:Timestamp.now()},{merge:true});
    return {groupId,name:g.data().name};
  });
});
exports.submitMatch=fn(async(data,uid)=>{
  const gid=checkGid(data.groupId), actionId=checkId(data.actionId);
  const opponent=checkText(data.opponentUid,10,128);
  if(uid===opponent) fail('You cannot play yourself.','invalid-argument');
  const score=validScore({a:data.scoreSelf,b:data.scoreOpponent});
  const textNote=note(data.note); const now=Timestamp.now();
  const keys=periodKeys(now.toDate());
  const ref=ticketRef(gid,actionId);
  return db.runTransaction(async(tx)=>{
    const [prior,ma,mb]=await Promise.all([
      tx.get(ref),tx.get(memberRef(gid,uid)),tx.get(memberRef(gid,opponent))
    ]);
    if(prior.exists){if(prior.data().playerA!==uid) fail('Ticket ID already used.');return {ticketId:actionId,replayed:true};}
    if(!ma.exists||!mb.exists) fail('Both players must belong to the group.','permission-denied');
    const ticket={groupId:gid,playerA:uid,playerB:opponent,createdBy:uid,createdAt:now,playedAt:now,updatedAt:now,
      ...keys,status:'open',revision:1,turn:opponent,disputed:false,
      proposal:{score,by:uid,note:textNote,at:now},finalScore:null,finalizedAt:null,cancellation:null,amendment:null};
    tx.create(ref,ticket);
    tx.create(ref.collection('events').doc(actionId),{kind:'submitted',actor:uid,score,at:now,note:textNote});
    const n=notif(opponent,actionId,'match_submitted','New match to confirm',`${ma.data().displayName} submitted a score.`,gid,actionId,now);
    tx.create(n.ref,n.data);
    return {ticketId:actionId};
  });
});
exports.mutateTicket=fn(async(data,uid)=>{
  const gid=checkGid(data.groupId),tid=checkId(data.ticketId),aid=checkId(data.actionId);
  const kind=String(data.kind||'');
  const ref=ticketRef(gid,tid),ore=opRef(gid,aid);
  return db.runTransaction(async(tx)=>{
    const [prev,doc,member]=await Promise.all([tx.get(ore),tx.get(ref),tx.get(memberRef(gid,uid))]);
    if(prev.exists){if(prev.data().actor!==uid||prev.data().ticketId!==tid) fail('Action ID already used.');return {ticketId:tid,replayed:true};}
    if(!member.exists) fail('You are no longer a group member.','permission-denied');
    if(!doc.exists) fail('Match no longer exists.','not-found');
    const t=doc.data(), now=Timestamp.now();
    const {next,event,target,title,body}=advance(t,kind,uid,data,now);
    tx.update(ref,next);
    tx.create(ore,{actor:uid,ticketId:tid,kind,createdAt:now});
    tx.create(ref.collection('events').doc(aid),event);
    const n=notif(target,aid,kind,title,body,gid,tid,now);tx.create(n.ref,n.data);
    return {ticketId:tid,status:next.status};
  });
});
exports.registerDevice=fn(async(data,uid)=>{
  const did=checkId(data.deviceId);
  const token=String(data.token||'');if(token.length<30||token.length>4096)fail('Invalid push token.','invalid-argument');
  let origin; try{origin=new URL(data.origin).origin;}catch{fail('Invalid push origin.','invalid-argument');}
  if(!origin.startsWith('https://')||origin.length>180)fail('Push requires an HTTPS origin.','invalid-argument');
  await userRef(uid).collection('devices').doc(did).set({token,origin,updatedAt:FieldValue.serverTimestamp()},{merge:true});
  return {ok:true};
});
exports.removeDevice=fn(async(data,uid)=>{await userRef(uid).collection('devices').doc(checkId(data.deviceId)).delete();return {ok:true};});
exports.pushInboxNotification=onDocumentCreated({document:'users/{userId}/notifications/{notificationId}',region:REGION,retry:false},async(event)=>{
  const {userId,notificationId}=event.params;
  const ref=event.data?.ref;if(!ref) return;
  // Claim once before sending: avoids typical duplicate delivery when Firestore triggers retry.
  // If the function crashes after claiming, inbox remains durable, but push can be missed.
  const claimed=await db.runTransaction(async tx=>{
    const doc=await tx.get(ref); if(!doc.exists||doc.data().pushState!=='pending')return false;
    tx.update(ref,{pushState:'claimed',pushClaimedAt:Timestamp.now()});return true;
  });
  if(!claimed)return;
  const n=event.data.data();
  const devices=await userRef(userId).collection('devices').get();
  if(devices.empty){await ref.update({pushState:'no_devices'});return;}
  let successes=0,failures=0;
  for(const dev of devices.docs){
    const d=dev.data();
    try{
      const url=`${d.origin}${n.path}?n=${encodeURIComponent(notificationId)}`;
      await getMessaging().send({token:d.token,
        notification:{title:n.title,body:n.body},
        data:{kind:String(n.kind||''),groupId:String(n.groupId||''),ticketId:String(n.ticketId||''),path:n.path,notificationId},
        webpush:{fcmOptions:{link:url},headers:{TTL:'86400',Urgency:'high'},notification:{icon:`${d.origin}/icons/icon-192.png`,badge:`${d.origin}/icons/icon-192.png`,tag:notificationId,renotify:false}}
      }); successes++;
    }catch(e){failures++;logger.warn('FCM delivery failed',{uid:userId,code:e.code,message:e.message});
      if(['messaging/registration-token-not-registered','messaging/invalid-registration-token'].includes(e.code)) await dev.ref.delete();}
  }
  await ref.update({pushState:successes?'sent':'failed',pushSuccesses:successes,pushFailures:failures,pushCompletedAt:Timestamp.now()});
});
