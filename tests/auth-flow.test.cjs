const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

// Exercise the app's real event handlers and auth observer with SDK/DOM boundaries mocked.
async function fixture({loginError,signupError,resetError,resetWait}={}){
  const {createFirestoreApi}=await import('../public/firestore-api.mjs');
  const events={},profiles=new Map(),writes=[],popups=[],resets=[];
  const root={innerHTML:''},toast={classList:{add(){},remove(){}},textContent:'',style:{}};
  const auth={currentUser:null};let observer,popup=async()=>({user:auth.currentUser});
  const location={pathname:'/g/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/t/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',protocol:'https:',hostname:'app.example',origin:'https://app.example'};
  const context=vm.createContext({
    console:{...console,error(){}},Intl,Date,location,navigator:{onLine:true},
    self:{AGREE_FIREBASE:{firebaseConfig:{apiKey:'test',appId:'test'},features:{leaderboards:false,push:false}}},
    window:{addEventListener(){},scrollTo(){}},
    document:{getElementById:id=>id==='app'?root:toast,addEventListener:(name,handler)=>{events[name]=handler;}},
    setInterval(){},setTimeout(){},clearTimeout(){},
    FormData:class{constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}},
    initializeApp:()=>({}),getAuth:()=>auth,createFirestoreApi,
    GoogleAuthProvider:class{setCustomParameters(params){this.params=params;}},
    signInWithPopup:async(a,p)=>{popups.push({auth:a,provider:p});return popup();},
    onAuthStateChanged:(_,cb)=>{observer=cb;},
    initializeFirestore:()=>({}),persistentLocalCache:()=>({}),persistentMultipleTabManager:()=>({}),
    doc:(_, ...parts)=>parts.join('/'),
    collection:(_, ...parts)=>parts.join('/'),getDocs:async()=>({docs:[]}),
    updateDoc:async(path,data)=>profiles.set(path,{...profiles.get(path),...data}),
    runTransaction:async(_,handler)=>{
      const pending=[];
      const result=await handler({get:async path=>({exists:()=>profiles.has(path),data:()=>profiles.get(path)}),set:(path,data,options)=>pending.push({path,data,options})});
      for(const {path,data,options} of pending){writes.push({path,data});profiles.set(path,options?.merge?{...profiles.get(path),...data}:data);}
      return result;
    },
    getDoc:async path=>({exists:()=>profiles.has(path),data:()=>profiles.get(path)}),
    setDoc:async(path,data)=>{writes.push({path,data});profiles.set(path,{...profiles.get(path),...data});},
    serverTimestamp:()=>({serverTimestamp:true}),
    getFunctions:()=>{throw Error('Spark auth must not initialize Cloud Functions');},
    createUserWithEmailAndPassword:async(_,email)=>{if(signupError)throw signupError;auth.currentUser={uid:'email-user',email};await observer(auth.currentUser);return {user:auth.currentUser};},
    signInWithEmailAndPassword:async(_,email)=>{if(loginError)throw loginError;auth.currentUser={uid:'email-user',email};await observer(auth.currentUser);},
    sendPasswordResetEmail:async(_,email)=>{resets.push(email);if(resetWait)await resetWait;if(resetError)throw resetError;},
    updateProfile:async(user,data)=>Object.assign(user,data)
  });
  const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8').split('\n').filter(l=>!l.startsWith('import ')).join('\n');
  vm.runInContext(source,context);
  await observer(null);
  return {
    root,toast,auth,location,profiles,writes,popups,resets,
    rankings(data,period='weekly'){context.testRankState=data;context.testRankPeriod=period;return vm.runInContext('Object.assign(state,testRankState);statFor(testRankPeriod)',context);},
    setPopup(fn){popup=fn;},
    changeUser:async user=>{auth.currentUser=user;await observer(user);},
    click:action=>events.click({target:{closest:()=>({dataset:{action}})}}),
    submit:(values,formId='authForm')=>events.submit({preventDefault(){},target:{id:formId,values,querySelector:()=>({disabled:false,isConnected:false})}})
  };
}
const googleUser={uid:'google-user',email:'player@example.test',displayName:'  Google Player  ',providerData:[{providerId:'google.com'}]};

test('onboarding offers two options and email opens the login and signup flow',async()=>{
  const f=await fixture();
  assert.match(f.root.innerHTML,/Continue with Google/);assert.match(f.root.innerHTML,/Continue with email/);assert.doesNotMatch(f.root.innerHTML,/<form/);
  await f.click('emailSignIn');assert.match(f.root.innerHTML,/name="email"/);assert.match(f.root.innerHTML,/name="password"/);
  await f.click('switchAuth');
  assert.match(f.root.innerHTML,/Create account/);assert.match(f.root.innerHTML,/Continue with Google/);
});
test('Google login requires choosing a unique username and preserves the match deep link',async()=>{
  const f=await fixture();const path=f.location.pathname;
  f.setPopup(async()=>{await f.changeUser(googleUser);return {user:googleUser};});
  await f.click('googleSignIn');
  assert.equal(f.popups.length,1);assert.equal(f.popups[0].provider.params.prompt,'select_account');
  assert.equal(f.profiles.has('users/google-user'),false);assert.match(f.root.innerHTML,/Choose your unique username/);
  await f.submit({displayName:'Google_Player'},'profileForm');
  assert.equal(f.profiles.get('users/google-user').username,'google_player');
  assert.match(f.root.innerHTML,/Welcome, Google_Player/);assert.equal(f.location.pathname,path);
});
test('returning Google users keep their chosen profile name',async()=>{
  const f=await fixture();f.profiles.set('users/google-user',{displayName:'Chosen_Name',username:'chosen_name'});
  await f.changeUser(googleUser);
  assert.match(f.root.innerHTML,/Welcome, Chosen_Name/);assert.equal(f.writes.length,0);
});
test('legacy profiles choose a username and can retry an already-taken name',async()=>{
  const f=await fixture();f.profiles.set('users/google-user',{displayName:'Legacy Name'});
  f.profiles.set('usernames/taken_name',{uid:'someone-else'});
  await f.changeUser(googleUser);assert.match(f.root.innerHTML,/Choose your unique username/);
  await f.submit({displayName:'Taken_Name'},'profileForm');
  assert.match(f.toast.textContent,/already taken/);assert.equal(f.profiles.get('users/google-user').username,undefined);
  await f.submit({displayName:'Available_Name'},'profileForm');
  assert.equal(f.profiles.get('users/google-user').username,'available_name');assert.match(f.root.innerHTML,/Welcome, Available_Name/);
});
test('popup cancellation restores the auth form and duplicate clicks open only one popup',async()=>{
  const f=await fixture();let reject;
  f.setPopup(()=>new Promise((_,r)=>{reject=r;}));
  const pending=f.click('googleSignIn');await f.click('googleSignIn');
  assert.equal(f.popups.length,1);assert.match(f.root.innerHTML,/Connecting to Google/);
  reject({code:'auth/popup-closed-by-user'});await pending;
  assert.match(f.root.innerHTML,/Continue with Google/);assert.equal(f.toast.textContent,'');
});
test('unavailable Google provider gives an email fallback without trapping the form',async()=>{
  const f=await fixture();f.setPopup(async()=>{throw {code:'auth/operation-not-allowed'};});
  await f.click('googleSignIn');
  assert.match(f.toast.textContent,/email and password/);assert.match(f.root.innerHTML,/Continue with Google/);
});
test('email signup and subsequent email login still save and load the profile on Spark',async()=>{
  const f=await fixture();await f.click('switchAuth');
  await f.submit({email:'player@example.test',password:'test-password',displayName:'Email_Player'});
  assert.equal(f.profiles.get('users/email-user').username,'email_player');assert.match(f.root.innerHTML,/Welcome, Email_Player/);
  await f.changeUser(null);await f.click('emailSignIn');
  await f.submit({email:'player@example.test',password:'test-password'});
  assert.match(f.root.innerHTML,/Welcome, Email_Player/);assert.equal(f.popups.length,0);
});
test('failed login shows actionable toasts without clearing the form or exposing account existence for combined errors',async()=>{
  for(const [code,expected] of [
    ['auth/invalid-credential',/Email or password is incorrect.*Create account.*Google/],
    ['auth/user-not-found',/No account was found.*Create account/],
    ['auth/wrong-password',/Incorrect password/],
    ['auth/network-request-failed',/internet connection/],
    ['auth/too-many-requests',/Too many sign-in attempts/]
  ]){
    const f=await fixture({loginError:{code,message:`Firebase: Error (${code}).`}});await f.click('emailSignIn');const before=f.root.innerHTML;
    await f.submit({email:'player@example.test',password:'test-password'});
    assert.match(f.toast.textContent,expected);assert.equal(f.root.innerHTML,before);assert.equal(f.auth.currentUser,null);
    await f.click('switchAuth');await f.click('switchAuth');
    assert.doesNotMatch(f.root.innerHTML,/disabled/);
  }
});
test('duplicate signup explains how to sign in and unknown auth errors retain their diagnostic code',async()=>{
  const f=await fixture({signupError:{code:'auth/email-already-in-use'}});await f.click('switchAuth');
  await f.submit({email:'player@example.test',password:'test-password',displayName:'Player'});
  assert.match(f.toast.textContent,/already uses this email.*Sign in instead/);
  const unknown=await fixture({loginError:{code:'auth/internal-error',message:'Firebase: Error (auth/internal-error).'}});
  await unknown.submit({email:'player@example.test',password:'test-password'});
  assert.match(unknown.toast.textContent,/auth\/internal-error/);
});
test('leaderboards count only verified scores in the server creation-date season',async()=>{
  const f=await fixture(),now=new Date(),old=new Date(now.getTime()-40*86400000);
  const base={playerA:'alice',playerB:'bob',createdAt:now,status:'finalized',finalScore:{a:21,b:17}};
  const data={members:[{id:'alice',displayName:'Alice'},{id:'bob',displayName:'Bob'}],tickets:[
    base,{...base,finalScore:{a:9,b:10}},
    {...base,status:'open',finalScore:null},
    {...base,status:'cancelled',finalScore:{a:200,b:200}},
    {...base,createdAt:old,weekKey:'forged',monthKey:'forged',finalScore:{a:200,b:200}}
  ]};
  for(const period of ['weekly','monthly']){
    const ranks=f.rankings(data,period);
    assert.equal(ranks[0].id,'alice');assert.equal(ranks[0].score,60);assert.equal(ranks[1].score,54);
    assert.equal(ranks[0].played,2);assert.equal(ranks[0].wins,1);assert.equal(ranks[1].wins,1);
  }
});


test('password reset sends only the email and returns to sign in with that email',async()=>{
  const f=await fixture();await f.click('emailSignIn');await f.click('forgotPassword');
  assert.match(f.root.innerHTML,/Send reset link/);assert.doesNotMatch(f.root.innerHTML,/name="password"/);
  await f.submit({email:'  player@example.test  '});
  assert.deepEqual(f.resets,['player@example.test']);assert.match(f.root.innerHTML,/Check your inbox/);assert.equal(f.auth.currentUser,null);
  await f.click('emailSignIn');assert.match(f.root.innerHTML,/value="player@example.test"/);assert.match(f.root.innerHTML,/name="password"/);
  await f.click('authWelcome');assert.doesNotMatch(f.root.innerHTML,/<form/);
});

test('password reset keeps account existence private and allows a retry after network errors',async()=>{
  const missing=await fixture({resetError:{code:'auth/user-not-found'}});await missing.click('forgotPassword');await missing.submit({email:'missing@example.test'});
  assert.match(missing.root.innerHTML,/Check your inbox/);assert.equal(missing.toast.textContent,'');
  const offline=await fixture({resetError:{code:'auth/network-request-failed'}});await offline.click('forgotPassword');await offline.submit({email:'player@example.test'});
  assert.match(offline.toast.textContent,/internet connection/);assert.doesNotMatch(offline.root.innerHTML,/Check your inbox/);
  await offline.submit({email:'player@example.test'});assert.equal(offline.resets.length,2);
});

test('pending email operations block duplicate submits and screen changes',async()=>{
  let release;const resetWait=new Promise(resolve=>{release=resolve;});
  const f=await fixture({resetWait});await f.click('forgotPassword');
  const first=f.submit({email:'player@example.test'});await f.submit({email:'other@example.test'});await f.click('authWelcome');release();await first;
  assert.deepEqual(f.resets,['player@example.test']);assert.match(f.root.innerHTML,/Check your inbox/);
});
