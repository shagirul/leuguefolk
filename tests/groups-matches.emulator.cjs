const test=require('node:test'),assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');

test('direct Firestore group and match workflow is authorized by deployed-style rules',async t=>{
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST&&process.env.FIREBASE_AUTH_EMULATOR_HOST,'Use npm run test:rules; never a live project.');
  const {initializeApp,deleteApp}=await import('firebase/app');
  const {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,signOut}=await import('firebase/auth');
  const sdk=await import('firebase/firestore');sdk.setLogLevel('silent');
  const {createFirestoreApi}=await import('../public/firestore-api.mjs');
  const {doc,setDoc,getDocFromServer,getDocs,collection,serverTimestamp,writeBatch,updateDoc,query,orderBy,limit}=sdk;
  const {buildGroupPreview}=await import('../public/invites.mjs');
  const apps=[];
  async function client(name){
    const app=initializeApp({projectId:'demo-agree',apiKey:'fake-key',appId:'demo-app'},`${name}-${randomUUID()}`);apps.push(app);
    const auth=getAuth(app);connectAuthEmulator(auth,`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,{disableWarnings:true});
    const store=sdk.getFirestore(app),[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');sdk.connectFirestoreEmulator(store,host,+port);
    const {user}=await createUserWithEmailAndPassword(auth,`${randomUUID()}@example.test`,'emulator-only-password');
    const call=createFirestoreApi(store,auth,sdk);
    await call('saveProfile',{displayName:name+'_'+randomUUID().slice(0,6)});
      return {store,user,call,auth};
  }
  const denied=p=>assert.rejects(p,e=>e.code==='permission-denied');
  try{
    const alice=await client('Alice'),bob=await client('Bob'),outsider=await client('Outsider'),charlie=await client('Charlie');
    const gid=randomUUID();let code;
    const ticketRef=(c,tid)=>doc(c.store,'groups',gid,'tickets',tid);
    const current=async(c,tid)=>(await getDocFromServer(ticketRef(c,tid))).data();
    async function submit(a=alice,b=bob){const tid=randomUUID();await a.call('submitMatch',{groupId:gid,actionId:tid,opponentUid:b.user.uid,scoreSelf:21,scoreOpponent:17,note:'Game'});return tid;}
    async function mutate(c,tid,kind,extra={}){
      const old=await current(c,tid);
      try{return await c.call('mutateTicket',{groupId:gid,ticketId:tid,actionId:randomUUID(),kind,expectedVersion:old.version,expectedRevision:kind==='counterAmendment'||kind==='respondAmendment'?old.amendment?.revision:old.revision,...extra});}catch(e){e.message=kind+': '+e.message;throw e;}
    }
    // Forge a COMPLETE batch, bypassing client validation, so denial tests the actual Rules.
    async function forge(c,tid,kind,changes,forgeRanks=false){
      const old=await current(c,tid),aid=randomUUID(),now=serverTimestamp();
      const next={...old,...changes,version:old.version+1,updatedAt:now,action:{id:aid,kind,actor:c.user.uid}};
      const target=c.user.uid===next.playerA?next.playerB:next.playerA;
      const event={kind,actor:c.user.uid,note:'',at:now};
      if(['propose','editOriginal'].includes(kind))event.score=next.proposal.score;
      if(kind==='confirm')event.score=next.finalScore;
      if(['startAmendment','counterAmendment'].includes(kind))event.score=next.amendment.score;
      const batch=writeBatch(c.store);
      batch.set(ticketRef(c,tid),next);
      batch.set(doc(c.store,'groups',gid,'operations',aid),{actor:c.user.uid,ticketId:tid,kind,version:next.version,createdAt:now});
      batch.set(doc(c.store,'groups',gid,'tickets',tid,'events',aid),event);
      batch.set(doc(c.store,'users',target,'notifications',aid),{kind,title:'Match updated',body:'Open your match to review.',groupId:gid,ticketId:tid,path:`/g/${gid}/t/${tid}`,createdAt:now,readAt:null});
      if(forgeRanks)for(const [i,uid] of [next.playerA,next.playerB].entries()){
        const ref=doc(c.store,'inviteCodes',code,'players',uid),player=(await getDocFromServer(ref)).data();
        batch.set(ref,{...player,xp:player.xp+next.finalScore[i===0?'a':'b']*2+(i===0?1:0),played:player.played+1,wins:player.wins+(i===0?1:0),lastTicketId:tid,lastActionId:aid,updatedAt:now});
      }
      return batch.commit();
    }
    await t.test('create and retry a group, join by code, and repeat joins without extra members',async()=>{
      const made=await alice.call('createGroup',{actionId:gid,name:'Friday games'});code=made.code;
      assert.equal((await alice.call('createGroup',{actionId:gid,name:'Friday games'})).code,code);
      await bob.call('joinGroup',{code:code.toLowerCase()});await bob.call('joinGroup',{code});await charlie.call('joinGroup',{code});
      assert.equal((await getDocs(collection(alice.store,'groups',gid,'members'))).size,3);
      assert.equal((await getDocFromServer(doc(bob.store,'users',bob.user.uid,'memberships',gid))).data().name,'Friday games');
    });
    await t.test('outsiders cannot read groups, enumerate invites, forge a membership, or submit matches',async()=>{
      await denied(getDocFromServer(doc(outsider.store,'groups',gid)));
      await denied(getDocs(collection(outsider.store,'inviteCodes')));
      await denied(setDoc(doc(outsider.store,'groups',gid,'members',outsider.user.uid),{displayName:'Outsider',inviteCode:'WRONG222',joinedAt:serverTimestamp()}));
      await denied(outsider.call('submitMatch',{groupId:gid,actionId:randomUUID(),opponentUid:alice.user.uid,scoreSelf:1,scoreOpponent:0}));
    });
    await t.test('submission atomically creates a match, event, operation and private inbox notification',async()=>{
      const tid=await submit(),match=await current(bob,tid);
      assert.equal(match.status,'open');assert.equal(match.turn,bob.user.uid);assert.equal(match.version,1);
      const notice=await getDocFromServer(doc(bob.store,'users',bob.user.uid,'notifications',tid));
      assert.equal(notice.data().path,`/g/${gid}/t/${tid}`);
      assert.equal((await getDocs(collection(bob.store,'groups',gid,'tickets',tid,'events'))).size,1);
      await bob.call('submitMatch',{groupId:gid,actionId:randomUUID(),opponentUid:alice.user.uid,scoreSelf:4,scoreOpponent:3});
      assert.equal((await alice.call('submitMatch',{groupId:gid,actionId:tid,opponentUid:bob.user.uid,scoreSelf:21,scoreOpponent:17})).replayed,true);
    });
    await t.test('only the recipient confirms the exact score; direct forged batches are denied',async()=>{
      const tid=await submit();
      await assert.rejects(mutate(alice,tid,'confirm'),/receiving/);
      await denied(forge(alice,tid,'confirm',{status:'finalized',turn:null,finalScore:{a:21,b:17},finalizedAt:serverTimestamp()}));
      await denied(forge(bob,tid,'confirm',{status:'finalized',turn:null,finalScore:{a:200,b:0},finalizedAt:serverTimestamp()}));
      await denied(forge(charlie,tid,'confirm',{status:'finalized',turn:null,finalScore:{a:21,b:17},finalizedAt:serverTimestamp()}));
      await denied(forge(bob,tid,'confirm',{status:'finalized',turn:null,finalScore:{a:21,b:17},finalizedAt:serverTimestamp()}));
      await denied(forge(bob,tid,'confirm',{status:'finalized',turn:null,finalScore:{a:21,b:17},finalizedAt:serverTimestamp()},true));
      await mutate(bob,tid,'confirm');assert.deepEqual((await current(alice,tid)).finalScore,{a:21,b:17});
    });
    await t.test('corrections, disputes and counters change turn; stale queued versions are rejected',async()=>{
      const tid=await submit();
      const stale={groupId:gid,ticketId:tid,actionId:randomUUID(),kind:'confirm',expectedVersion:1,expectedRevision:1};
      await mutate(bob,tid,'propose',{score:{a:20,b:17},disputed:true});
      await assert.rejects(bob.call('mutateTicket',stale),/changed while/);
      await mutate(alice,tid,'propose',{score:{a:20,b:18}});await mutate(bob,tid,'confirm');
      const result=await current(alice,tid);assert.deepEqual(result.finalScore,{a:20,b:18});assert.equal(result.disputed,true);
    });
    await t.test('original edits, original withdrawal and both cancellation responses work',async()=>{
      let tid=await submit();await mutate(alice,tid,'editOriginal',{score:{a:22,b:17}});await mutate(bob,tid,'confirm');
      tid=await submit();await mutate(alice,tid,'withdrawOriginal');assert.equal((await current(bob,tid)).status,'cancelled');
      tid=await submit();await mutate(alice,tid,'requestCancel');await mutate(bob,tid,'respondCancel',{accept:false});
      assert.equal((await current(alice,tid)).status,'open');
      await mutate(bob,tid,'requestCancel');await mutate(alice,tid,'respondCancel',{accept:true});assert.equal((await current(bob,tid)).status,'cancelled');
    });
    await t.test('verified amendments preserve XP until accepted, support counters and rejection, and require mutual void',async()=>{
      const tid=await submit();await mutate(bob,tid,'confirm');
      await mutate(alice,tid,'startAmendment',{amendmentKind:'score',score:{a:22,b:18}});
      assert.deepEqual((await current(bob,tid)).finalScore,{a:21,b:17});
      await mutate(bob,tid,'counterAmendment',{score:{a:22,b:19}});await mutate(alice,tid,'respondAmendment',{accept:true});
      assert.deepEqual((await current(bob,tid)).finalScore,{a:22,b:19});
      await mutate(bob,tid,'startAmendment',{amendmentKind:'void'});await mutate(alice,tid,'respondAmendment',{accept:false});
      assert.equal((await current(bob,tid)).status,'finalized');
      await mutate(alice,tid,'startAmendment',{amendmentKind:'void'});await mutate(bob,tid,'respondAmendment',{accept:true});
      const result=await current(alice,tid);assert.equal(result.status,'cancelled');assert.equal(result.finalScore,null);
    });
    await t.test('the same action retries once; concurrent actions cannot both commit a stale version',async()=>{
      const tid=await submit();
      const data={groupId:gid,ticketId:tid,actionId:randomUUID(),kind:'confirm',expectedVersion:1,expectedRevision:1};
      await bob.call('mutateTicket',data);assert.equal((await bob.call('mutateTicket',data)).replayed,true);
      assert.equal((await getDocs(collection(alice.store,'groups',gid,'tickets',tid,'events'))).size,2);
      const next=await submit();const base={groupId:gid,ticketId:next,kind:'propose',expectedVersion:1,expectedRevision:1,score:{a:20,b:18}};
      const outcomes=await Promise.allSettled([bob.call('mutateTicket',{...base,actionId:randomUUID()}),bob.call('mutateTicket',{...base,actionId:randomUUID()})]);
      assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);assert.equal((await current(alice,next)).version,2);
    });
    await t.test('invalid scores, immutable participant/season fields and unbundled changes are denied',async()=>{
      const tid=await submit(),old=await current(bob,tid),now=serverTimestamp();
      await denied(forge(bob,tid,'propose',{revision:2,turn:alice.user.uid,proposal:{score:{a:201,b:0},by:bob.user.uid,note:'',at:now}}));
      await denied(forge(bob,tid,'confirm',{status:'finalized',turn:null,finalScore:old.proposal.score,finalizedAt:now,createdAt:now}));
      await denied(forge(bob,tid,'confirm',{status:'finalized',turn:null,finalScore:old.proposal.score,finalizedAt:now,weekKey:'1900-01-01'}));
      await denied(updateDoc(ticketRef(bob,tid),{status:'finalized',finalScore:old.proposal.score,turn:null,finalizedAt:now,updatedAt:now,version:2,action:{id:randomUUID(),actor:bob.user.uid,kind:'confirm'}}));
    });
    await t.test('inbox read markers belong to the recipient and notification contents cannot be forged',async()=>{
      const tid=await submit();
      await updateDoc(doc(bob.store,'users',bob.user.uid,'notifications',tid),{readAt:serverTimestamp()});
      await denied(updateDoc(doc(alice.store,'users',bob.user.uid,'notifications',tid),{readAt:serverTimestamp()}));
      await denied(updateDoc(doc(bob.store,'users',bob.user.uid,'notifications',tid),{body:'Forged'}));
    });
    await t.test('concurrent confirmations, corrections, replay and voids leave exact all-time invite rankings',async()=>{
      const tickets=await Promise.all([submit(),submit()]);await Promise.all(tickets.map(tid=>mutate(bob,tid,'confirm')));
      const members=(await getDocs(collection(alice.store,'groups',gid,'members'))).docs.map(d=>({id:d.id,...d.data()}));
      const matches=(await getDocs(collection(alice.store,'groups',gid,'tickets'))).docs.map(d=>({id:d.id,...d.data()}));
      for(const player of buildGroupPreview(members,matches)){
        const actual=(await getDocFromServer(doc(alice.store,'inviteCodes',code,'players',player.id))).data();
        for(const key of ['xp','played','wins'])assert.equal(actual[key],player[key],key+' for '+player.id);
      }
    });
    await t.test('invite holders can read at most 20 preview records per query, with private group data still denied',async()=>{
      const players=collection(outsider.store,'inviteCodes',code,'players');
      const preview=await getDocs(query(players,orderBy('xp','desc'),orderBy('wins','desc'),orderBy('displayName'),limit(20)));
      assert.equal(preview.size,3);assert.ok(preview.docs[0].data().xp>0);
      await denied(getDocs(players));await denied(getDocs(query(players,limit(21))));
      await denied(getDocs(collection(outsider.store,'groups',gid,'members')));
      await denied(getDocs(collection(outsider.store,'groups',gid,'tickets')));
      await denied(getDocFromServer(doc(outsider.store,'users',alice.user.uid)));
      await denied(updateDoc(doc(alice.store,'inviteCodes',code,'players',alice.user.uid),{xp:999999,updatedAt:serverTimestamp()}));
      await denied(updateDoc(doc(bob.store,'inviteCodes',code,'players',alice.user.uid),{displayName:'Fake',updatedAt:serverTimestamp()}));
      await signOut(outsider.auth);await denied(getDocs(query(players,limit(20))));
    });
    await t.test('the Admin backfill is read-only by default and its applied result survives the next confirmation',async()=>{
      const {initializeApp:adminApp,deleteApp:deleteAdminApp}=await import('firebase-admin/app');
      const {getFirestore:adminStore}=await import('firebase-admin/firestore');
      const {backfillGroup}=await import('../scripts/backfill-invite-players.mjs');
      const admin=adminApp({projectId:'demo-agree'},'migration-'+randomUUID()),db=adminStore(admin),ref=db.collection('groups').doc(gid);
      try{
        const before=(await db.collection('inviteCodes').doc(code).collection('players').doc(alice.user.uid).get()).data();
        assert.equal((await backfillGroup(db,ref)).written,false);
        assert.equal((await db.collection('inviteCodes').doc(code).collection('players').doc(alice.user.uid).get()).data().lastActionId,before.lastActionId);
        assert.equal((await backfillGroup(db,ref,{write:true})).players,3);
        const tid=await submit();await mutate(bob,tid,'confirm');
        const after=(await getDocFromServer(doc(alice.store,'inviteCodes',code,'players',alice.user.uid))).data();
        assert.equal(after.xp,before.xp+42);
      }finally{await deleteAdminApp(admin);}
    });
  }finally{await Promise.all(apps.map(deleteApp));}
});
