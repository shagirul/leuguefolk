const test=require('node:test'),assert=require('node:assert/strict'),{randomUUID}=require('node:crypto');

test('password-reset email action completes and the new password signs in',async()=>{
  assert.ok(process.env.FIREBASE_AUTH_EMULATOR_HOST,'Use npm run test:rules; never send test emails from a live project.');
  const {initializeApp,deleteApp}=await import('firebase/app');
  const sdk=await import('firebase/auth');
  const app=initializeApp({projectId:'demo-agree',apiKey:'fake-key',appId:'demo-app'},randomUUID());
  try{
    const auth=sdk.getAuth(app);sdk.connectAuthEmulator(auth,`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}`,{disableWarnings:true});
    const email=randomUUID()+'@example.test',password='initial-password-123',nextPassword='replacement-password-456';
    const {user}=await sdk.createUserWithEmailAndPassword(auth,email,password);await sdk.signOut(auth);
    await sdk.sendPasswordResetEmail(auth,email);
    const response=await fetch(`http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/demo-agree/oobCodes`);
    const {oobCodes}=await response.json();
    const reset=oobCodes.find(item=>item.email===email&&item.requestType==='PASSWORD_RESET');assert.ok(reset);
    assert.equal(await sdk.verifyPasswordResetCode(auth,reset.oobCode),email);
    await sdk.confirmPasswordReset(auth,reset.oobCode,nextPassword);
    await assert.rejects(sdk.signInWithEmailAndPassword(auth,email,password));
    assert.equal((await sdk.signInWithEmailAndPassword(auth,email,nextPassword)).user.uid,user.uid);
    await assert.rejects(sdk.confirmPasswordReset(auth,reset.oobCode,'another-password-789'));
  }finally{await deleteApp(app);}
});
