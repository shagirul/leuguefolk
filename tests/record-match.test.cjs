const test=require('node:test'),assert=require('node:assert/strict');
test('single-game shortcut derives exact scores through deuce and reverses them when the opponent wins',async()=>{
  const {standardGameScore}=await import('../public/record-match.mjs');
  for(const [loser,win] of [[0,11],[9,11],[10,12],[11,13],[18,20],[198,200]]){
    assert.deepEqual(standardGameScore(loser),{a:win,b:loser});assert.deepEqual(standardGameScore(loser,'opponent'),{a:loser,b:win});
  }
  for(const bad of ['',null,undefined,-1,199,1.5,'abc'])assert.throws(()=>standardGameScore(bad),/Choose the losing score/);
  assert.throws(()=>standardGameScore(9,'unknown'),/Choose who won/);
});
test('suggestions are deterministic: last opponent, 30-day frequency, favorites, remaining members',async()=>{
  const {suggestedOpponents}=await import('../public/record-match.mjs'),now=Date.parse('2026-11-14T10:00:00Z');
  const members=['me','last','frequent','favorite','new','removed'].map(id=>({id,displayName:id}));
  const ticket=(id,days,status='finalized')=>({playerA:'me',playerB:id,createdAt:new Date(now-days*86400000),status});
  const tickets=[ticket('last',0),ticket('frequent',1),ticket('frequent',2),ticket('frequent',3),ticket('removed',31),ticket('new',0,'open'),ticket('new',0,'cancelled'),ticket('outsider',0),{...ticket('new',0),playerA:'someone-else'}];
  const rows=suggestedOpponents(members,tickets,'me',{favorites:['favorite'],now});
  assert.deepEqual(rows.map(m=>m.id),['last','frequent','favorite','removed','new']);assert.equal(rows.find(m=>m.id==='removed').frequency,0);
  assert.deepEqual(suggestedOpponents(members,tickets,'me',{favorites:['favorite'],now}),rows);
});
test('small groups show only their opponents; larger groups gain search, and scores require an explicit selection',async()=>{
  const {renderMatchComposer}=await import('../public/record-match.mjs');
  const opponents=[{id:'dev',displayName:'Dev',avatarId:'istj-anchor'},{id:'maya',displayName:'Maya',avatarId:'isfj-guardian'}];
  const picker=renderMatchComposer({opponents});assert.equal((picker.match(/class="record-opponent"/g)||[]).length,2);assert.doesNotMatch(picker,/type="search"|type="submit"/);
  assert.match(renderMatchComposer({opponents:Array.from({length:8},(_,i)=>({id:String(i),displayName:'Player '+i}))}),/type="search"/);
  const initial=renderMatchComposer({opponents,draft:{opponentUid:'dev'}});assert.match(initial,/value="self"[^>]*checked/);assert.match(initial,/type="submit" disabled/);assert.match(initial,/Choose the losing score/);
  const selected=renderMatchComposer({opponents,draft:{opponentUid:'dev',losingScore:'10',winner:'opponent'}});assert.match(selected,/12/);assert.doesNotMatch(selected,/type="submit" disabled/);
  const full=renderMatchComposer({opponents,draft:{opponentUid:'dev',scoreMode:'full',scoreSelf:7,scoreOpponent:5}});assert.match(full,/name="scoreSelf"[^>]*value="7"/);assert.match(full,/name="scoreOpponent"[^>]*value="5"/);assert.doesNotMatch(full,/data-score-drum/);
});

function gestureFixture(){
  const events=new Map(),chosen=[],classes=new Set(),buttons=[0,1].map(i=>({classList:{toggle(){}},getBoundingClientRect:()=>({left:10+i*60,right:60+i*60,top:100,bottom:160})}));let tray;
  const button={classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},setPointerCapture(){},hasPointerCapture:()=>false};
  const document={visibilityState:'visible',addEventListener:(type,fn)=>events.set(type,[...(events.get(type)||[]),fn]),body:{append(){}},createElement:()=>tray={className:'',setAttribute(){},addEventListener(){},remove(){},querySelectorAll:()=>buttons,querySelector:()=>({textContent:''})}};
  const event=(extra={})=>({button:0,isPrimary:true,pointerId:1,clientX:200,clientY:200,target:{closest:selector=>selector==='.leaderboard-fab'?button:null},preventDefault(){},stopImmediatePropagation(){this.stopped=true;},...extra});
  return {document,chosen,classes,event,emit:(name,e)=>events.get(name)?.forEach(fn=>fn(e)),button};
}
test('hold, glide and release selects exactly once; the generated click never opens a second flow',async()=>{
  const {bindQuickOpponents}=await import('../public/record-match.mjs'),f=gestureFixture();
  bindQuickOpponents(f.document,{getOpponents:()=>[{id:'dev',displayName:'Dev'},{id:'maya',displayName:'Maya'}],onChoose:id=>f.chosen.push(id)});
  f.emit('pointerdown',f.event());await new Promise(r=>setTimeout(r,300));assert.equal(f.classes.has('is-quick-open'),true);
  f.emit('pointermove',f.event({clientX:90,clientY:130}));assert.equal(f.chosen.length,0);
  f.emit('pointerup',f.event({clientX:90,clientY:130}));assert.deepEqual(f.chosen,['maya']);
  const click=f.event();f.emit('click',click);assert.equal(click.stopped,true);assert.equal(f.classes.has('is-quick-open'),false);
});
test('cancelled holds and releasing outside the avatar tray never create a score or choose an opponent',async()=>{
  const {bindQuickOpponents}=await import('../public/record-match.mjs'),f=gestureFixture();
  bindQuickOpponents(f.document,{getOpponents:()=>[{id:'dev',displayName:'Dev'}],onChoose:id=>f.chosen.push(id)});
  f.emit('pointerdown',f.event());f.emit('pointercancel',f.event());await new Promise(r=>setTimeout(r,300));assert.equal(f.classes.size,0);
  f.emit('pointerdown',f.event());await new Promise(r=>setTimeout(r,300));f.emit('pointerup',f.event());assert.deepEqual(f.chosen,[]);assert.equal(f.classes.size,0);
});
