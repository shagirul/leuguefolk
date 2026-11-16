const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const gid='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
function fixture(){
  const watchers=[],timers=new Map(),events={},root={innerHTML:''};let timerId=0;
  const context=vm.createContext({createPwaController:()=>({sync(){},start(){}}),console,Intl,Date,bindScrollHeader:()=>({reset(){}}),navigator:{onLine:true},location:{pathname:'/',origin:'https://app.test'},
    self:{AGREE_FIREBASE:{firebaseConfig:{apiKey:'test',appId:'test'}}},randomAvatar:()=>({id:'istj-anchor'}),validAvatar:id=>id==='istj-anchor',bindAvatarGestures(){},bindQuickOpponents:()=>()=>{},createInviteIntentStore:()=>({get:()=>null,path:p=>p}),renderGroupTiles:()=>'',createCharacterTooltipController:()=>({hide(){},sync(){},isOpen:()=>false}),
    document:{getElementById:()=>root,addEventListener:(type,cb)=>{events[type]=cb;}},window:{addEventListener(){},scrollTo(){}},
    history:{replaceState(){},pushState(){}},localStorage:{getItem:()=>null,setItem(){}},
    setInterval(){},setTimeout:cb=>{const id=++timerId;timers.set(id,cb);return id;},clearTimeout:id=>timers.delete(id),
    doc:(_, ...parts)=>parts.join('/'),collection:(_, ...parts)=>parts.join('/'),
    onSnapshot:(path,next,error)=>{const entry={path,next,error,active:true};watchers.push(entry);return ()=>{entry.active=false;};}
  });
  const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8').split('\n').filter(l=>!l.startsWith('import ')).join('\n').replace(/\bstart\(\);\s*$/,'');
  vm.runInContext(source,context);
  vm.runInContext(`store={};auth={currentUser:{uid:'alice'}};state.user=auth.currentUser;state.profile={displayName:'Alice',username:'alice',avatarId:'istj-anchor'};state.authLoading=false;state.memberships=[{groupId:'${gid}',name:'My group'}];globalThis.originalRender=render;render=()=>{};`,context);
  const run=code=>vm.runInContext(code,context);
  return {root,watchers,timers,run,
    group:()=>watchers.filter(w=>w.path==='groups/'+gid).at(-1),
    click:action=>events.click({target:{closest:()=>({dataset:{action}})}}),
    snapshot:(exists,fromCache=false)=>({id:gid,exists:()=>exists,data:()=>({name:'My group'}),metadata:{fromCache}})
  };
}
test('membership refresh does not restart a loaded group listener or erase its state',()=>{
  const f=fixture();f.run('ensureRoute()');f.group().next(f.snapshot(true));f.run('ensureRoute()');
  assert.equal(f.watchers.filter(w=>w.path==='groups/'+gid).length,1);assert.equal(f.run('state.group.name'),'My group');assert.equal(f.run('state.groupLoading'),false);
});
test('missing groups and permission failures stop loading and offer recovery',()=>{
  for(const failure of ['missing','permission']){
    const f=fixture();f.run('ensureRoute()');
    if(failure==='missing'){f.group().next(f.snapshot(false,true));assert.equal(f.run('state.groupLoading'),true);f.group().next(f.snapshot(false,false));}
    else f.group().error({code:'permission-denied'});
    assert.equal(f.run('state.groupLoading'),false);assert.ok(f.run('state.loadError'));
    f.run('originalRender()');assert.match(f.root.innerHTML,/Group unavailable/);assert.match(f.root.innerHTML,/Try again/);assert.match(f.root.innerHTML,/Choose another group/);
  }
});
test('network timeout can retry, and an obsolete callback cannot overwrite the new group',async()=>{
  const f=fixture();f.run('ensureRoute()');const old=f.group();[...f.timers.values()][0]();
  assert.equal(f.run('state.groupLoading'),false);assert.match(f.run('state.loadError'),/too long/);
  await f.click('retryGroup');const current=f.group();old.error({code:'permission-denied'});assert.equal(f.run('state.groupLoading'),true);
  current.next(f.snapshot(true));old.next(f.snapshot(false));assert.equal(f.run('state.group.name'),'My group');assert.equal(f.run('state.loadError'),'');
});
test('offline missing data is actionable and group picker does not reopen a stale selection',async()=>{
  const f=fixture();f.run('state.online=false;ensureRoute()');f.group().next(f.snapshot(false,true));
  assert.match(f.run('state.loadError'),/offline/);await f.click('showGroups');f.run('ensureRoute()');
  assert.equal(f.run('state.groupId'),null);assert.equal(f.run('state.showGroupPicker'),true);assert.equal(f.watchers.filter(w=>w.active).length,0);
  f.run('originalRender()');assert.match(f.root.innerHTML,/Choose a leaderboard/);
});
