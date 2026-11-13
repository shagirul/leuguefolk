const test=require('node:test');
const assert=require('node:assert/strict');

test('profile writes are limited to the owner and cannot forge backend data',async()=>{
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST&&process.env.FIREBASE_AUTH_EMULATOR_HOST,'Run with npm run test:rules; never against a live project.');
  const {initializeApp,deleteApp}=await import('firebase/app');
  const {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,signOut}=await import('firebase/auth');
  const {getFirestore,connectFirestoreEmulator,doc,setDoc,updateDoc,getDoc,deleteDoc,serverTimestamp,setLogLevel}=await import('firebase/firestore');
  setLogLevel('silent');
  const apps=[];
  async function client(name){
    const app=initializeApp({projectId:'demo-agree',apiKey:'fake-key',appId:'demo-app'},name);apps.push(app);
    const auth=getAuth(app);connectAuthEmulator(auth,`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,{disableWarnings:true});
    const store=getFirestore(app);const [host,port]=process.env.FIRESTORE_EMULATOR_HOST.split(':');connectFirestoreEmulator(store,host,Number(port));
    const {user}=await createUserWithEmailAndPassword(auth,`${name}-${Date.now()}@example.test`,'emulator-only-password');
    return {auth,store,user};
  }
  const denied=promise=>assert.rejects(promise,e=>e.code==='permission-denied');
  try{
    const alice=await client('alice'),bob=await client('bob');
    const own=doc(alice.store,'users',alice.user.uid);
    await setDoc(own,{displayName:'Alice',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    assert.equal((await getDoc(own)).data().displayName,'Alice');
    await updateDoc(own,{displayName:'Alice updated',updatedAt:serverTimestamp()});
    assert.equal((await getDoc(own)).data().displayName,'Alice updated');
    await denied(updateDoc(own,{admin:true,updatedAt:serverTimestamp()}));
    await denied(updateDoc(own,{createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
    await denied(updateDoc(own,{displayName:'A',updatedAt:serverTimestamp()}));
    await denied(updateDoc(own,{displayName:'x'.repeat(33),updatedAt:serverTimestamp()}));
    await denied(deleteDoc(own));
    const foreign=doc(bob.store,'users',alice.user.uid);
    await denied(getDoc(foreign));
    await denied(updateDoc(foreign,{displayName:'Forged',updatedAt:serverTimestamp()}));
    await denied(setDoc(doc(bob.store,'users',bob.user.uid),{displayName:'Bob',admin:true,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
    await denied(setDoc(doc(alice.store,'groups','forged-group'),{creatorUid:alice.user.uid}));
    await denied(setDoc(doc(alice.store,'groups','forged-group','tickets','forged-ticket'),{status:'finalized'}));
    await denied(setDoc(doc(alice.store,'users',alice.user.uid,'memberships','forged-group'),{groupId:'forged-group'}));
    await signOut(bob.auth);
    await denied(setDoc(doc(bob.store,'users','anonymous'),{displayName:'Anonymous',createdAt:serverTimestamp(),updatedAt:serverTimestamp()}));
  }finally{await Promise.all(apps.map(deleteApp));}
});
