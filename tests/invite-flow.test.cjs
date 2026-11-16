const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const gid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',code='PLAY24AB';
const memory=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));

async function fixture({storage=memory(),records=new Map(),path='/invite/'+code,joinHook}={}){
  const avatars=await import('../public/avatars.mjs'),account=await import('../public/account.mjs'),invites=await import('../public/invites.mjs'),leaderboard=await import('../public/leaderboard.mjs');
  const pwa=await import('../public/pwa.mjs');
  const competition={...pwa,...await import('../public/domain.mjs'),...await import('../public/outbox.mjs'),...await import('../public/record-match.mjs'),...await import('../public/activity.mjs'),...await import('../public/bulk-accept.mjs'),...await import('../public/matchups.mjs')};
  const {createFirestoreApi}=await import('../public/firestore-api.mjs');
  const initial=new URL(path,'https://app.test'),location={pathname:initial.pathname,search:initial.search,origin:initial.origin},events={},windowEvents={},writes=[],shared=[];
  const root={innerHTML:''},toast={textContent:'',classList:{add(){},remove(){}},style:{}},auth={currentUser:null};let observer;
  const history={};for(const method of ['pushState','replaceState'])history[method]=(_,__,path)=>{const url=new URL(path,location.origin);location.pathname=url.pathname;location.search=url.search;};
  const snapshot=path=>({id:path.split('/').at(-1),exists:()=>records.has(path),data:()=>records.get(path)});
  const getDoc=async path=>snapshot(path);
  const getDocs=async input=>{
    const path=typeof input==='string'?input:input.path,options=input.constraints||[];
    let docs=[...records.keys()].filter(key=>key.startsWith(path+'/')&&key.slice(path.length+1).indexOf('/')<0).map(snapshot);
    const order=options.filter(o=>o.kind==='order');docs.sort((a,b)=>{for(const o of order){const av=a.data()[o.key],bv=b.data()[o.key],diff=typeof av==='number'?av-bv:String(av).localeCompare(String(bv));if(diff)return o.direction==='desc'?-diff:diff;}return a.id.localeCompare(b.id);});
    docs=docs.slice(0,options.find(o=>o.kind==='limit')?.count||Infinity);return {docs};
  };
  const changeUser=async uid=>{auth.currentUser=uid?{uid,email:uid+'@example.test',displayName:'New_Player'}:null;await observer(auth.currentUser);await settle();};
  const context=vm.createContext({console:{...console,warn(){},error(){}},Intl,Date,URL,URLSearchParams,crypto:require('node:crypto').webcrypto,location,history,localStorage:storage,
    self:{AGREE_FIREBASE:{firebaseConfig:{apiKey:'test',appId:'test'},features:{leaderboards:true,push:false}}},navigator:{onLine:true,clipboard:{writeText:async text=>shared.push(text)}},
    window:{addEventListener:(name,fn)=>windowEvents[name]=fn,scrollTo(){}},document:{getElementById:id=>id==='app'?root:id==='toast'?toast:null,addEventListener:(name,fn)=>events[name]=fn,querySelector(){return null;},querySelectorAll:()=>[]},
    setInterval(){},setTimeout(){},clearTimeout(){},...avatars,...account,...invites,...competition,...leaderboard,
    FormData:class{constructor(form){this.values=form.values;}[Symbol.iterator](){return Object.entries(this.values)[Symbol.iterator]();}},
    initializeApp:()=>({}),getAuth:()=>auth,onAuthStateChanged:(_,cb)=>observer=cb,initializeFirestore:()=>({}),persistentLocalCache:()=>({}),persistentMultipleTabManager:()=>({}),
    doc:(_, ...parts)=>parts.join('/'),collection:(_, ...parts)=>parts.join('/'),query:(path,...constraints)=>({path,constraints}),orderBy:(key,direction='asc')=>({kind:'order',key,direction}),limit:count=>({kind:'limit',count}),
    getDoc,getDocs,onSnapshot:()=>()=>{},serverTimestamp:()=>new Date(),increment:value=>({increment:value}),updateProfile:async()=>{},
    createFirestoreApi:(...args)=>{const api=createFirestoreApi(...args);return (name,data)=>name==='joinGroup'&&joinHook?joinHook(data,auth.currentUser):api(name,data);},
    runTransaction:async(_,handler)=>{const pending=[];const result=await handler({get:getDoc,set:(path,data,options)=>pending.push({path,data,options}),update:(path,data)=>pending.push({path,data,options:{merge:true}})});for(const write of pending){records.set(write.path,write.options?.merge?{...records.get(write.path),...write.data}:write.data);writes.push(write);}return result;},
    forUser:async()=>[],enqueue:async()=>{},patchAction:async()=>{},deleteAction:async()=>{},
    GoogleAuthProvider:class{setCustomParameters(){}},signInWithPopup:async()=>changeUser('new-user'),signOut:async()=>changeUser(null),
    createUserWithEmailAndPassword:async()=>changeUser('new-user'),signInWithEmailAndPassword:async()=>changeUser('new-user'),sendPasswordResetEmail:async()=>{}
  });
  records.set('inviteCodes/'+code,{groupId:gid,name:'Weekend Rally'});records.set('groups/'+gid,{id:gid,name:'Weekend Rally',inviteCode:code});
  for(let i=0;i<23;i++)records.set(`inviteCodes/${code}/players/player-${i}`,{displayName:'Player_'+i,avatarId:avatars.AVATARS[i%avatars.AVATARS.length].id,xp:1000-i*2,wins:23-i,played:23});
  vm.runInContext(fs.readFileSync('public/app.js','utf8').split('\n').filter(line=>!line.startsWith('import ')).join('\n'),context);await observer(null);
  return {root,records,storage,location,writes,shared,run:expression=>vm.runInContext(expression,context),changeUser,
    setJoinHook:fn=>joinHook=fn,
    async signInReady(uid='new-user'){records.set('users/'+uid,{displayName:'New_Player',username:'new_player',avatarId:'istj-anchor'});await changeUser(uid);},
    async click(action,data={}){await events.click({target:{closest:()=>({dataset:{action,...data}})}});await settle();},
    async submit(values,id='authForm'){await events.submit({preventDefault(){},target:{id,values,querySelector:()=>({disabled:false,isConnected:false})}});await settle();}
  };
}

test('email, reset, signup and username/avatar setup retain the invite, without joining until consent',async()=>{
  const f=await fixture();
  await f.click('emailSignIn');await f.click('forgotPassword');await f.submit({email:'new@example.test'});
  await f.click('emailSignIn');await f.click('switchAuth');await f.submit({email:'new@example.test',password:'test-only-password'});
  assert.match(f.root.innerHTML,/Choose your name/);assert.equal(f.run('state.pendingInvite.code'),code);
  await f.submit({displayName:'New_Player',avatarId:'istj-anchor'},'profileForm');
  assert.match(f.root.innerHTML,/Join group/);assert.match(f.root.innerHTML,/Weekend Rally/);
  assert.equal((f.root.innerHTML.match(/<li aria-label=/g)||[]).length,20);
  assert.equal(f.records.has(`groups/${gid}/members/new-user`),false);
  await f.click('acceptInvite');
  assert.equal(f.records.has(`groups/${gid}/members/new-user`),true);assert.equal(f.run('state.pendingInvite'),null);
  assert.equal(f.storage.getItem('leaguefolk-pending-invite-v1'),null);assert.equal(f.location.pathname,`/g/${gid}/leaderboard`);
});

test('Google onboarding and a fresh app instance restore the invitation even from the root URL',async()=>{
  const f=await fixture();await f.click('googleSignIn');assert.match(f.root.innerHTML,/Choose your name/);
  const reopened=await fixture({storage:f.storage,records:f.records,path:'/'});await reopened.changeUser('new-user');
  assert.equal(reopened.run('state.pendingInvite.code'),code);assert.match(reopened.root.innerHTML,/Choose your name/);
  await reopened.submit({displayName:'New_Player',avatarId:'infp-dreamer'},'profileForm');assert.match(reopened.root.innerHTML,/Join group/);
  await reopened.click('declineInvite');assert.equal(reopened.run('state.pendingInvite'),null);assert.equal(reopened.location.pathname,'/');
  assert.equal(reopened.records.has(`groups/${gid}/members/new-user`),false);
  const third=await fixture({storage:reopened.storage,records:reopened.records,path:'/'});await third.changeUser('new-user');assert.equal(third.run('state.pendingInvite'),null);
});

test('a failed join preserves the intent for reload and retry',async()=>{
  const f=await fixture({joinHook:async()=>{throw {code:'unavailable'};}});await f.signInReady();await f.click('acceptInvite');
  assert.equal(f.run('state.pendingInvite.code'),code);assert.match(f.root.innerHTML,/Could not join/);
  const retried=await fixture({storage:f.storage,records:f.records,path:'/'});await retried.changeUser('new-user');await retried.click('acceptInvite');
  assert.equal(retried.run('state.pendingInvite'),null);assert.equal(retried.records.has(`groups/${gid}/members/new-user`),true);
});

test('a completion from a previous signed-in account cannot consume the current invitation',async()=>{
  let finish,requests=0;const pending=new Promise(resolve=>finish=resolve);
  const f=await fixture({joinHook:()=>{requests++;return pending;}});await f.signInReady('first-user');
  const click=f.click('acceptInvite');await settle();await f.click('acceptInvite');assert.equal(requests,1);await f.signInReady('second-user');
  finish({groupId:gid,name:'Weekend Rally'});await click;
  assert.equal(f.run('state.pendingInvite.code'),code);assert.equal(f.run('state.user.uid'),'second-user');assert.match(f.root.innerHTML,/Join group/);
});

test('switching accounts from the join card retains the invitation through sign-in',async()=>{
  const f=await fixture();await f.signInReady();await f.click('logout');
  assert.equal(f.run('state.pendingInvite.code'),code);assert.equal(f.run('state.user'),null);assert.match(f.location.search,/invite=PLAY24AB/);
  await f.click('googleSignIn');assert.match(f.root.innerHTML,/Join group/);assert.equal(f.records.has(`groups/${gid}/members/new-user`),false);
});

test('blocked storage uses the URL fallback, newer links replace old ones, and malformed links never reuse a stale invite',async()=>{
  const {createInviteIntentStore}=await import('../public/invites.mjs');
  const blocked={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
  const first=createInviteIntentStore(blocked,{pathname:'/invite/'+code});
  const path=first.path('/g/'+gid+'/profile'),url=new URL(path,'https://app.test');
  assert.equal(createInviteIntentStore(blocked,url).get().code,code);
  const storage=memory(),intent=createInviteIntentStore(storage,{pathname:'/invite/'+code});
  intent.capture({pathname:'/invite/NEW234AB'});assert.equal(intent.get().code,'NEW234AB');
  intent.capture({pathname:'/invite/bad'});assert.equal(intent.get().invalid,true);
  intent.clear();assert.equal(createInviteIntentStore(storage,{pathname:'/'}).get(),null);
});

test('group tiles cap actual avatars at three and sharing uses the selected tile’s own invitation',async()=>{
  const {renderGroupTiles}=await import('../public/invites.mjs');
  const html=renderGroupTiles([{groupId:gid,name:'Weekend Rally'}],{[gid]:{members:[{avatarId:'estj-captain'},{avatarId:'istj-anchor'},{avatarId:'infp-dreamer'},{avatarId:'enfj-catalyst'}]}},gid);
  assert.equal((html.match(/class="avatar /g)||[]).length,3);assert.doesNotMatch(html,/enfj-catalyst.webp/);assert.match(html,/data-action="shareGroupInvite"/);
  const f=await fixture({path:'/'});await f.signInReady();
  f.run(`state.memberships=[{groupId:'${gid}',name:'Weekend Rally'}];state.groupTiles['${gid}']={group:{name:'Weekend Rally',inviteCode:'${code}'}};`);
  await f.click('shareGroupInvite',{id:gid});assert.match(f.shared[0],new RegExp('/invite/'+code));assert.equal(f.run('state.groupId'),null);
});

test('resolving an older invitation in another tab cannot erase a newer stored invitation',async()=>{
  const {createInviteIntentStore}=await import('../public/invites.mjs'),storage=memory();
  const first=createInviteIntentStore(storage,{pathname:'/invite/'+code});
  createInviteIntentStore(storage,{pathname:'/invite/NEW234AB'});
  first.clear();assert.equal(first.get(),null);assert.equal(createInviteIntentStore(storage,{pathname:'/'}).get().code,'NEW234AB');
});

test('malformed invitation URLs produce a dismissible error without crashing routing',async()=>{
  const f=await fixture({path:'/invite/%bad'});await f.signInReady();
  assert.match(f.root.innerHTML,/This invitation link is invalid/);assert.equal(f.records.has(`groups/${gid}/members/new-user`),false);
  await f.click('declineInvite');assert.equal(f.run('state.pendingInvite'),null);assert.equal(f.location.pathname,'/');
});
