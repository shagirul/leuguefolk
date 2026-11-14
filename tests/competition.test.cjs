const test=require('node:test'),assert=require('node:assert/strict');
const members=[{id:'a',displayName:'Alex'},{id:'d',displayName:'Dev'},{id:'m',displayName:'Maya'}];
const at=new Date('2026-11-13T08:00:00Z');
const match=(score,extra={})=>({playerA:'a',playerB:'d',status:'finalized',finalScore:score,createdAt:at,...extra});
test('all verified matches count: three points per win, zero for losses, draws and pending reports',async()=>{
  const {competitionStandings}=await import('../public/domain.mjs');
  const rows=competitionStandings(members,[...Array.from({length:5},()=>match({a:11,b:9})),match({a:200,b:200}),match(null,{status:'open'}),match(null,{status:'cancelled'})],'weekly',at);
  assert.deepEqual(rows.map(r=>[r.id,r.score,r.played,r.rank]),[['a',15,6,1],['d',0,6,2],['m',0,0,2]]);
  assert.equal(rows[1].losses,5);assert.equal(rows[1].draws,1);
});
test('equal points share competition ranks; score margins and name order do not break ties',async()=>{
  const {competitionStandings}=await import('../public/domain.mjs');
  const rows=competitionStandings(members,[match({a:11,b:9}),match({a:0,b:200})],'weekly',at);
  assert.deepEqual(rows.map(r=>[r.id,r.score,r.rank]),[['a',3,1],['d',3,1],['m',0,3]]);
});
test('Monday midnight in Asia/Kolkata resets standings while retaining previous results and monthly totals',async()=>{
  const {competitionStandings}=await import('../public/domain.mjs');
  const tickets=[match({a:11,b:9},{createdAt:new Date('2026-11-15T18:29:59.999Z')})];
  assert.equal(competitionStandings(members,tickets,'weekly',new Date('2026-11-15T18:29:59.999Z'))[0].score,3);
  assert.ok(competitionStandings(members,tickets,'weekly',new Date('2026-11-15T18:30:00Z')).every(r=>r.score===0));
  assert.equal(competitionStandings(members,tickets,'monthly',new Date('2026-11-15T18:30:00Z'))[0].score,3);
  assert.equal(tickets.length,1);assert.equal(tickets[0].status,'finalized');
});
test('late confirmations and accepted amendments affect the submission week; unresolved amendments retain the agreed result',async()=>{
  const {competitionStandings}=await import('../public/domain.mjs');
  const ticket=match({a:11,b:9},{finalizedAt:new Date('2026-11-23T10:00:00Z'),amendment:{score:{a:9,b:11}}});
  assert.equal(competitionStandings(members,[ticket],'weekly',at)[0].id,'a');
  ticket.finalScore={a:9,b:11};ticket.amendment=null;
  assert.equal(competitionStandings(members,[ticket],'weekly',at)[0].id,'d');
  assert.ok(competitionStandings(members,[ticket],'weekly',ticket.finalizedAt).every(r=>r.score===0));
});
