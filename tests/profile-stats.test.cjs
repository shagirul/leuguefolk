const test=require('node:test'),assert=require('node:assert/strict');

test('profile stats use only the player’s verified scores, from either side of a match',async()=>{
  const {summarizeProfile}=await import('../public/account.mjs');
  const match=(id,a,b,extra={})=>({id,playerA:'me',playerB:'friend',status:'finalized',finalScore:{a,b},createdAt:new Date(2026,0,id),...extra});
  const stats=summarizeProfile([
    match(1,21,10),match(2,15,21,{playerA:'friend',playerB:'me'}),match(3,8,21),match(4,12,12),
    match(5,200,0,{status:'open'}),match(6,200,0,{status:'cancelled'}),
    match(7,200,0,{playerA:'other'}),match(8,201,0),match(9,1.5,0),
    match(10,21,19,{amendment:{kind:'score',score:{a:0,b:100}}})
  ],'me');
  assert.equal(stats.played,5);assert.equal(stats.wins,3);assert.equal(stats.losses,1);assert.equal(stats.draws,1);
  assert.equal(stats.winRate,60);assert.equal(stats.xp,166);assert.equal(stats.level,2);assert.equal(stats.levelProgress,66);assert.equal(stats.toNext,34);
  assert.equal(stats.pointsScored,83);assert.equal(stats.pointsConceded,77);assert.equal(stats.pdRatio,83/77);
  assert.equal(stats.bestStreak,2);assert.deepEqual(stats.recent.map(m=>m.result),['W','D','L','W','W']);
});

test('new accounts have honest zero-match stats and level one progress',async()=>{
  const {summarizeProfile,accountAchievements}=await import('../public/account.mjs');
  const stats=summarizeProfile([],'me');
  assert.equal(stats.played,0);assert.equal(stats.wins,0);assert.equal(stats.xp,0);assert.equal(stats.winRate,0);
  assert.equal(stats.pdRatio,null);
  assert.equal(stats.level,1);assert.equal(stats.levelProgress,0);assert.equal(stats.toNext,100);assert.deepEqual(stats.recent,[]);
  assert.equal(accountAchievements({tickets:[],uid:'me',groupId:'club'}).filter(a=>a.unlocked).length,0);
});

test('P/D uses total points, handles shutouts and reflects agreed corrections and voids',async()=>{
  const {summarizeProfile,renderAccountPage}=await import('../public/account.mjs');
  const a={id:'a',playerA:'me',playerB:'friend',status:'finalized',finalScore:{a:11,b:0}},b={...a,id:'b',playerA:'friend',playerB:'me',finalScore:{a:11,b:9}};
  assert.equal(summarizeProfile([a],'me').pdRatio,Infinity);
  assert.equal(summarizeProfile([a,b],'me').pdRatio,20/11);
  assert.equal(summarizeProfile([a,{...b,finalScore:{a:11,b:5}}],'me').pdRatio,16/11);
  assert.equal(summarizeProfile([a,{...b,status:'cancelled'}],'me').pdRatio,Infinity);
  const html=renderAccountPage({user:{uid:'me'},profile:{displayName:'Alex'},tickets:[a,b]});
  assert.match(html,/<strong>1\.82<\/strong><small>P\/D ratio/);assert.match(html,/Total matches/);assert.match(html,/Win ratio/);assert.match(html,/Points scored ÷ points conceded · 20 ÷ 11/);
});

test('profile tracks real win streaks and exact XP level boundaries',async()=>{
  const {summarizeProfile}=await import('../public/account.mjs');
  const tickets=Array.from({length:10},(_,i)=>({id:String(i),playerA:'me',playerB:'friend',status:'finalized',finalScore:{a:20,b:i<6?10:21},createdAt:{toDate:()=>new Date(2026,0,i+1)}}));
  const stats=summarizeProfile(tickets,'me');
  assert.equal(stats.wins,6);assert.equal(stats.played,10);assert.equal(stats.bestStreak,6);assert.equal(stats.xp,400);
  assert.equal(stats.level,5);assert.equal(stats.levelProgress,0);assert.equal(stats.toNext,100);
});
