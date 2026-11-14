const test=require('node:test'),assert=require('node:assert/strict');
const gid='club',uid='me',members=[{id:'me',displayName:'You'},{id:'dev',displayName:'Dev'},{id:'maya',displayName:'Maya'}];
const now=new Date('2026-11-14T09:00:00Z');
const match=(id,result='W',opponent='dev',extra={})=>({id:String(id),groupId:gid,playerA:uid,playerB:opponent,status:'finalized',finalScore:{a:result==='W'?11:result==='L'?8:10,b:result==='W'?8:result==='L'?11:10},createdAt:new Date(Date.UTC(2026,10,10,0,Number(id)||0)),...extra});
const context=tickets=>({tickets,uid,groupId:gid,members,now});
const row=(all,id)=>all.find(a=>a.id===id);

test('catalog has six supplied stones and only verified exact standard 11–0 earns Whitewash',async()=>{
  const {ACHIEVEMENT_CATALOG,calculateAchievements}=await import('../public/achievements.mjs');
  assert.equal(ACHIEVEMENT_CATALOG.length,6);
  const w=match(1,'W','dev',{finalScore:{a:11,b:0}}),reverse={...w,id:'reverse',playerA:'dev',playerB:'me',finalScore:{a:0,b:11}};
  const result=calculateAchievements(context([w,w,reverse,{...w,id:'open',status:'open'},{...w,id:'badminton',sportId:'badminton'},{...w,id:'group',groupId:'elsewhere'},{...w,id:'format',format:'best-of-three'},{...w,id:'twelve',finalScore:{a:12,b:0}},{...w,id:'invalid',finalScore:{a:11,b:NaN}}]));
  assert.equal(row(result,'whitewash').count,2);assert.equal(row(result,'whitewash').noProgress,true);
  assert.ok(result.every(a=>a.asset.endsWith('.png')&&a.rule&&a.reset));
});

test('ranked streaks repeat in non-overlapping blocks and rival streaks are independent',async()=>{
  const {calculateAchievements}=await import('../public/achievements.mjs');
  const wins=Array.from({length:10},(_,i)=>match(i+1));
  let result=calculateAchievements(context(wins));assert.equal(row(result,'untouchable').count,2);assert.equal(row(result,'rival-dominator').count,2);assert.equal(row(result,'untouchable').progress,0);
  result=calculateAchievements(context([...wins,match(11,'L','maya'),match(12),match(13,'L','dev',{mode:'casual'}),match(14)]));
  assert.equal(row(result,'untouchable').progress,2);assert.equal(row(result,'rival-dominator').progress,2);assert.equal(row(result,'untouchable').count,2);
  result=calculateAchievements(context([match(1),match(2),match(3),match(4),match(5,'L','maya'),match(6)]));
  assert.equal(row(result,'untouchable').count,0);assert.equal(row(result,'rival-dominator').count,1);
});

test('streak order uses immutable played order, not arrival or confirmation order; amendments and voids rebuild',async()=>{
  const {calculateAchievements}=await import('../public/achievements.mjs');
  const data=Array.from({length:5},(_,i)=>match(i+1,'W','dev',{finalizedAt:new Date(+now-i*1000)}));
  assert.equal(row(calculateAchievements(context([...data].reverse())),'untouchable').count,1);
  const changed=data.map(t=>t.id==='3'?{...t,finalScore:{a:8,b:11},version:2}:t);
  assert.equal(row(calculateAchievements(context(changed)),'untouchable').count,0);
  assert.equal(row(calculateAchievements(context([...data,{...data[2],version:2,status:'cancelled'}])),'untouchable').count,0);
  assert.equal(row(calculateAchievements(context(data.map(t=>({...t,amendment:{kind:'score',score:{a:0,b:11}}})))),'untouchable').count,1);
});

test('Table Conqueror needs two different opponents, freezes the roster, and losses reset the attempt',async()=>{
  const {calculateAchievements}=await import('../public/achievements.mjs');
  let c=row(calculateAchievements(context([match(1),match(2),match(3,'W','maya')])),'table-conqueror');assert.equal(c.count,1);assert.deepEqual(c.occurrences[0].rosterIds,['dev','maya']);
  c=row(calculateAchievements(context([match(1),match(2,'L'),match(3,'W','maya')])),'table-conqueror');assert.equal(c.count,0);assert.equal(c.progress,1);
  c=row(calculateAchievements(context([match(1),match(2,'D'),match(3,'W','maya')])),'table-conqueror');assert.equal(c.count,1);
  c=row(calculateAchievements({...context([match(1),match(3,'W','maya')]),members:[...members,{id:'new',joinedAt:new Date('2026-11-10T00:02:00Z')}]}),'table-conqueror');assert.equal(c.count,1);
  c=row(calculateAchievements({...context([match(1),match(2)]),members:members.slice(0,2)}),'table-conqueror');assert.equal(c.count,0);assert.equal(c.target,2);
});

function weeklyGame(id,date,opponent='dev',extra={}){return match(id,'W',opponent,{createdAt:new Date(date),...extra});}
test('Three-Peat uses three closed consecutive solo championships; ties, gaps and current weeks do not award',async()=>{
  const {calculateAchievements}=await import('../public/achievements.mjs');
  const weeks=[weeklyGame(1,'2026-10-20T05:00:00Z'),weeklyGame(2,'2026-10-27T05:00:00Z'),weeklyGame(3,'2026-11-03T05:00:00Z')];
  let a=row(calculateAchievements(context(weeks)),'three-peat');assert.equal(a.count,1);assert.equal(a.latest.weekKey,'2026-11-02');
  a=row(calculateAchievements(context(weeks.slice(1))),'three-peat');assert.equal(a.progress,2);assert.equal(a.count,0);
  a=row(calculateAchievements(context(weeks.filter(t=>t.id!=='2'))),'three-peat');assert.equal(a.count,0);assert.equal(a.progress,1);
  a=row(calculateAchievements(context([...weeks.slice(1),weeklyGame(4,'2026-11-10T05:00:00Z')])),'three-peat');assert.equal(a.count,0);assert.equal(a.progress,2);
  const tie=weeklyGame(4,'2026-11-03T06:00:00Z','dev',{playerA:'maya',playerB:'dev'});
  a=row(calculateAchievements(context([...weeks,tie])),'three-peat');assert.equal(a.count,0);assert.equal(a.progress,0);
});

test('Perfect Reign is awarded only after week close with three wins, two opponents, no losses and a sole lead',async()=>{
  const {calculateAchievements}=await import('../public/achievements.mjs');
  const games=[weeklyGame(1,'2026-11-03T05:00:00Z'),weeklyGame(2,'2026-11-03T06:00:00Z','maya'),weeklyGame(3,'2026-11-03T07:00:00Z')];
  const calc=data=>row(calculateAchievements(context(data)),'perfect-reign');
  assert.equal(calc(games).count,1);assert.equal(calc(games.map(t=>({...t,playerB:'dev'}))).count,0);
  assert.equal(calc([...games,weeklyGame(4,'2026-11-03T08:00:00Z','dev',{finalScore:{a:8,b:11}})]).count,0);
  assert.equal(calc(games.map(t=>({...t,createdAt:new Date('2026-11-10T05:00:00Z')}))).count,0);
  const live=calc(games.map(t=>({...t,createdAt:new Date('2026-11-10T05:00:00Z')})));assert.equal(live.progress,4);assert.ok(live.conditions.every(c=>c.met));
});
