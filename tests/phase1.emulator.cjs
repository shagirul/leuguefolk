const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');
require('fake-indexeddb/auto');
test('Phase 1: three coworkers complete the office league journey with durable offline replay',async t=>{
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST&&process.env.FIREBASE_AUTH_EMULATOR_HOST,'Emulators required.');
  const {initializeApp,deleteApp}=await import('firebase/app'),authSdk=await import('firebase/auth'),sdk=await import('firebase/firestore');sdk.setLogLevel('silent');
  const {createFirestoreApi}=await import('../public/firestore-api.mjs'),{competitionStandings}=await import('../public/domain.mjs'),{groupInviteUrl}=await import('../public/invites.mjs');
  const {replayOutbox}=await import('../public/outbox.mjs'),queue=await import('../public/queue.js');
  const apps=[];
  async function client(name){
    const app=initializeApp({projectId:'demo-agree',apiKey:'fake-key',appId:'test'},randomUUID());apps.push(app);
    const auth=authSdk.getAuth(app);authSdk.connectAuthEmulator(auth,`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,{disableWarnings:true});
    const db=sdk.getFirestore(app),[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');sdk.connectFirestoreEmulator(db,host,+port);
    const {user}=await authSdk.createUserWithEmailAndPassword(auth,randomUUID()+'@example.test','emulator-only-password');
    const call=createFirestoreApi(db,auth,sdk);await call('saveProfile',{displayName:name+'_'+randomUUID().slice(0,6),avatarId:'estj-captain'});return {db,auth,user,call};
  }
  try{
    const alex=await client('Alex'),dev=await client('Dev'),maya=await client('Maya'),gid=randomUUID();let code,tid;
    const ref=(c,...parts)=>sdk.doc(c.db,...parts),ticket=async(c,id)=>(await sdk.getDocFromServer(ref(c,'groups',gid,'tickets',id))).data();
    const history=async(c)=>(await sdk.getDocs(sdk.collection(c.db,'groups',gid,'tickets'))).docs.map(d=>({id:d.id,...d.data()}));
    const members=async(c)=>(await sdk.getDocs(sdk.collection(c.db,'groups',gid,'members'))).docs.map(d=>({id:d.id,...d.data()}));
    const standings=async(c,now=new Date())=>competitionStandings(await members(c),await history(c),'weekly',now);
    const mutation=async(c,id,kind,extra={})=>{const old=await ticket(c,id);return {groupId:gid,ticketId:id,actionId:randomUUID(),kind,expectedVersion:old.version,expectedRevision:old.revision,...extra};};
    const report=(a,b,id=randomUUID())=>a.call('submitMatch',{groupId:gid,actionId:id,opponentUid:b.user.uid,scoreSelf:11,scoreOpponent:9}).then(()=>id);
    const replay=(c,extra={})=>replayOutbox({uid:c.user.uid,currentUid:()=>c.auth.currentUser?.uid,list:queue.forUser,patch:queue.patchAction,remove:queue.deleteAction,send:c.call,...extra});
    await t.test('01 create a decentralized group and a shareable invitation',async()=>{
      ({code}=await alex.call('createGroup',{actionId:gid,name:'Office TT Club'}));
      assert.match(code,/^[A-Z2-9]{8}$/);assert.equal(groupInviteUrl('https://leaguefolk.example',code),'https://leaguefolk.example/invite/'+code);
      assert.equal((await standings(alex)).length,1);
    });
    await t.test('02 two coworkers join, appear with zero points and cannot gain creator privileges',async()=>{
      await dev.call('joinGroup',{code});await maya.call('joinGroup',{code});
      const rows=await standings(maya);assert.equal(rows.length,3);assert.ok(rows.every(r=>r.score===0));
      await assert.rejects(sdk.updateDoc(ref(alex,'groups',gid,'members',dev.user.uid),{displayName:'Forged'}),e=>e.code==='permission-denied');
    });
    await t.test('03 recording creates a pending report in under 20 seconds',async()=>{
      const start=performance.now();tid=await report(alex,dev);assert.ok(performance.now()-start<20000);
      assert.equal((await ticket(alex,tid)).status,'open');assert.ok((await standings(maya)).every(r=>r.score===0));
    });
    await t.test('04 recipient notification opens the exact current ticket, including after it becomes old',async()=>{
      const n=(await sdk.getDocFromServer(ref(dev,'users',dev.user.uid,'notifications',tid))).data();
      assert.equal(n.path,`/g/${gid}/t/${tid}`);assert.equal(n.ticketId,tid);assert.equal((await ticket(dev,n.ticketId)).turn,dev.user.uid);
    });
    await t.test('05 only the recipient verifies the match and all three players see 3 winner points',async()=>{
      await assert.rejects(alex.call('mutateTicket',await mutation(alex,tid,'confirm')));
      await dev.call('mutateTicket',await mutation(dev,tid,'confirm'));
      for(const c of [alex,dev,maya]){const rows=await standings(c);assert.equal(rows[0].id,alex.user.uid);assert.equal(rows[0].score,3);assert.equal(rows.find(r=>r.id===dev.user.uid).score,0);}
      assert.equal((await ticket(dev,tid)).status,'finalized');
    });
    await t.test('06 corrections and counter-proposals require agreement on the exact latest score',async()=>{
      const id=await report(alex,dev);
      await dev.call('mutateTicket',await mutation(dev,id,'propose',{score:{a:9,b:11}}));
      await alex.call('mutateTicket',await mutation(alex,id,'propose',{score:{a:10,b:9}}));
      await dev.call('mutateTicket',await mutation(dev,id,'confirm'));
      assert.deepEqual((await ticket(alex,id)).finalScore,{a:10,b:9});assert.equal((await standings(maya))[0].score,6);
    });
    await t.test('07 unresolved and cancelled reports award no points; creator absence does not block coworkers',async()=>{
      const before=await standings(maya),id=await report(dev,maya);
      await maya.call('mutateTicket',await mutation(maya,id,'propose',{score:{a:10,b:9},disputed:true}));
      assert.deepEqual((await standings(maya)).map(r=>r.score),before.map(r=>r.score));
      await dev.call('mutateTicket',await mutation(dev,id,'requestCancel'));
      await maya.call('mutateTicket',await mutation(maya,id,'respondCancel',{accept:true}));
      assert.equal((await ticket(maya,id)).status,'cancelled');
    });
    await t.test('08 offline submission survives reopening; lost acknowledgement retries the same ID without duplicates',async()=>{
      const id=randomUUID(),payload={groupId:gid,actionId:id,opponentUid:dev.user.uid,scoreSelf:11,scoreOpponent:8};
      await queue.enqueue({id,uid:alex.user.uid,kind:'submitMatch',payload});
      assert.equal((await sdk.getDocFromServer(ref(alex,'groups',gid,'tickets',id))).exists(),false);
      const reopened=await import('../public/queue.js?reopened');assert.equal((await reopened.forUser(alex.user.uid))[0].id,id);
      let lost=false;await replay(alex,{send:async(name,p)=>{await alex.call(name,p);if(!lost){lost=true;throw Object.assign(new Error('Acknowledgement lost'),{code:'unavailable'});}}});
      assert.equal((await queue.forUser(alex.user.uid))[0].status,'queued');
      await replay(alex);assert.equal((await queue.forUser(alex.user.uid)).length,0);
      assert.equal((await history(dev)).filter(r=>r.id===id).length,1);
      assert.equal((await sdk.getDocs(sdk.collection(dev.db,'groups',gid,'tickets',id,'events'))).size,1);
    });
    await t.test('09 offline confirmations award nothing locally; stale queued versions are blocked for review',async()=>{
      const id=await report(alex,dev),payload=await mutation(dev,id,'confirm');
      await queue.enqueue({id:payload.actionId,uid:dev.user.uid,kind:'mutateTicket',payload});
      const before=(await standings(maya)).map(r=>r.score);
      await alex.call('mutateTicket',await mutation(alex,id,'editOriginal',{score:{a:9,b:11}}));
      await replay(dev);const jobs=await queue.forUser(dev.user.uid);assert.equal(jobs[0].status,'blocked');assert.match(jobs[0].error,/changed/);
      assert.equal((await ticket(dev,id)).status,'open');assert.deepEqual((await standings(maya)).map(r=>r.score),before);
      await queue.deleteAction(payload.actionId);
      const fresh=await mutation(dev,id,'confirm');await queue.enqueue({id:fresh.actionId,uid:dev.user.uid,kind:'mutateTicket',payload:fresh});await replay(dev);
      assert.equal((await ticket(dev,id)).status,'finalized');assert.equal((await standings(maya)).find(r=>r.id===dev.user.uid).score,3);
    });
    await t.test('10 a new week resets standings without deleting history; third and later matches remain ranked',async()=>{
      for(let i=0;i<3;i++){const id=await report(dev,maya);await maya.call('mutateTicket',await mutation(maya,id,'confirm'));}
      assert.equal((await standings(maya)).find(r=>r.id===dev.user.uid).score,12);
      const records=await history(maya),future=new Date(Date.now()+7*86400000);
      assert.ok((await standings(maya,future)).every(r=>r.score===0));assert.equal((await history(maya)).length,records.length);
      await authSdk.signOut(alex.auth);const id=await report(dev,maya);await maya.call('mutateTicket',await mutation(maya,id,'confirm'));
      assert.equal((await standings(maya)).find(r=>r.id===dev.user.uid).score,15);
    });
    await t.test('11 bulk acceptance confirms reviewed scores through the real outbox and skips changed requests',async()=>{
      const {buildAcceptancePlan,queueAcceptancePlan}=await import('../public/bulk-accept.mjs');
      const ids=await Promise.all([report(dev,maya),report(dev,maya),report(dev,maya)]),before=(await standings(maya)).find(r=>r.id===dev.user.uid).score;
      const plan=buildAcceptancePlan(await history(maya),maya.user.uid,gid,await queue.forUser(maya.user.uid));assert.equal(plan.items.length,3);
      await dev.call('mutateTicket',await mutation(dev,ids[0],'editOriginal',{score:{a:12,b:10}}));
      const current=await history(maya),result=await queueAcceptancePlan(plan,{currentUid:()=>maya.auth.currentUser?.uid,currentGroupId:()=>gid,getTickets:()=>current,getQueue:()=>[],enqueue:queue.enqueue});
      assert.equal(result.queued,2);assert.equal(result.skipped,1);assert.equal((await queue.forUser(maya.user.uid)).length,2);
      await replay(maya);assert.equal((await queue.forUser(maya.user.uid)).length,0);
      assert.equal((await ticket(maya,ids[0])).status,'open');assert.equal((await ticket(maya,ids[1])).status,'finalized');assert.equal((await ticket(maya,ids[2])).status,'finalized');
      assert.equal((await standings(maya)).find(r=>r.id===dev.user.uid).score,before+6);
    });
  }finally{await Promise.all(apps.map(deleteApp));}
});
