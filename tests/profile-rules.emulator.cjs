const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');

test('unique usernames are reserved atomically and profiles remain owner-only',async t=>{
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST&&process.env.FIREBASE_AUTH_EMULATOR_HOST,'Use npm run test:rules; never a live project.');
  const {initializeApp,deleteApp}=await import('firebase/app');
  const {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,signOut}=await import('firebase/auth');
  const sdk=await import('firebase/firestore');sdk.setLogLevel('silent');
  const {createFirestoreApi}=await import('../public/firestore-api.mjs');
  const {doc,setDoc,updateDoc,getDocFromServer,getDocs,collection,deleteDoc,serverTimestamp,writeBatch}=sdk;
  const apps=[];
  const name=prefix=>prefix+'_'+randomUUID().slice(0,8);
  async function client(){
    const app=initializeApp({projectId:'demo-agree',apiKey:'fake-key',appId:'demo-app'},randomUUID());apps.push(app);
    const auth=getAuth(app);connectAuthEmulator(auth,`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,{disableWarnings:true});
    const store=sdk.getFirestore(app),[host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');sdk.connectFirestoreEmulator(store,host,+port);
    const {user}=await createUserWithEmailAndPassword(auth,randomUUID()+'@example.test','emulator-only-password');
    return {auth,store,user,call:createFirestoreApi(store,auth,sdk)};
  }
  const denied=promise=>assert.rejects(promise,e=>e.code==='permission-denied');
  try{
    const alice=await client(),bob=await client(),charlie=await client(),legacy=await client();
    const chosen=name('Alice'),canonical=chosen.toLowerCase(),own=doc(alice.store,'users',alice.user.uid);
    await t.test('a profile and its username reservation must be committed together',async()=>{
      await denied(setDoc(own,{displayName:chosen,username:canonical,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
      await alice.call('saveProfile',{displayName:chosen});
      assert.equal((await getDocFromServer(own)).data().username,canonical);
      assert.equal((await getDocFromServer(doc(alice.store,'usernames',canonical))).data().uid,alice.user.uid);
      await assert.rejects(bob.call('saveProfile',{displayName:chosen.toUpperCase()}),/already taken/);
    });
    await t.test('simultaneous claims have exactly one winner, including different capitalization',async()=>{
      const shared=name('shared');
      const outcomes=await Promise.allSettled([bob.call('saveProfile',{displayName:shared}),charlie.call('saveProfile',{displayName:shared.toUpperCase()})]);
      assert.equal(outcomes.filter(o=>o.status==='fulfilled').length,1);
      assert.match(outcomes.find(o=>o.status==='rejected').reason.message,/already taken/);
    });
    await t.test('clients cannot rename a reserved username, squat extra names, or steal another reservation',async()=>{
      const replacement=name('newname');
      await assert.rejects(alice.call('saveProfile',{displayName:replacement}),/cannot be changed/);
      await denied(setDoc(doc(alice.store,'usernames',replacement),{uid:alice.user.uid,createdAt:serverTimestamp()}));
      await denied(updateDoc(doc(bob.store,'usernames',canonical),{uid:bob.user.uid}));
      const batch=writeBatch(alice.store);
      batch.set(doc(alice.store,'usernames',replacement),{uid:alice.user.uid,createdAt:serverTimestamp()});
      batch.update(own,{username:replacement,displayName:replacement,updatedAt:serverTimestamp()});
      await denied(batch.commit());
    });
    await t.test('profile data is private and privileged/invalid fields remain denied',async()=>{
      await denied(getDocFromServer(doc(bob.store,'users',alice.user.uid)));
      await denied(updateDoc(doc(bob.store,'users',alice.user.uid),{displayName:chosen,updatedAt:serverTimestamp()}));
      await denied(updateDoc(own,{admin:true,updatedAt:serverTimestamp()}));
      await denied(updateDoc(own,{createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
      await denied(updateDoc(own,{displayName:'A',updatedAt:serverTimestamp()}));
      await denied(updateDoc(own,{displayName:'bad name',updatedAt:serverTimestamp()}));
      await denied(deleteDoc(own));await denied(getDocs(collection(alice.store,'usernames')));
    });
    await t.test('onboarding upgrades a legacy profile without changing its creation timestamp',async()=>{
      const created='2026-01-01T00:00:00.000Z';
      const response=await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/demo-agree/databases/(default)/documents/users/${legacy.user.uid}`,{
        method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},
        body:JSON.stringify({fields:{displayName:{stringValue:'Legacy Name'},createdAt:{timestampValue:created},updatedAt:{timestampValue:created}}})
      });assert.equal(response.ok,true);
      const chosen=name('legacy');await legacy.call('saveProfile',{displayName:chosen});
      const result=(await getDocFromServer(doc(legacy.store,'users',legacy.user.uid))).data();
      assert.equal(result.createdAt.toDate().toISOString(),created);assert.equal(result.username,chosen);
    });
    await t.test('profile name snapshots in existing groups stay synchronized',async()=>{
      const gid=randomUUID();await alice.call('createGroup',{actionId:gid,name:'Username test'});
      await alice.call('saveProfile',{displayName:chosen.toUpperCase()});
      assert.equal((await getDocFromServer(doc(alice.store,'groups',gid,'members',alice.user.uid))).data().displayName,chosen.toUpperCase());
      await denied(updateDoc(doc(alice.store,'groups',gid,'members',alice.user.uid),{displayName:'Fake'}));
    });
    await t.test('unauthenticated username claims are denied',async()=>{
      await signOut(bob.auth);
      await denied(setDoc(doc(bob.store,'usernames',name('anon')),{uid:bob.user.uid,createdAt:serverTimestamp()}));
    });
  }finally{await Promise.all(apps.map(deleteApp));}
});
