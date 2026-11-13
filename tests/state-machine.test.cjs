const test=require('node:test'),assert=require('node:assert/strict');
let advance,periodKeys,scorePoints,validScore;
test.before(async()=>{({advance,periodKeys,scorePoints,validScore}=await import('../public/domain.mjs'));});
const alice='alice',bob='bob';
const now=new Date('2026-11-12T11:00:00.000Z');
function ticket(){return {playerA:alice,playerB:bob,status:'open',revision:1,turn:bob,disputed:false,proposal:{score:{a:21,b:17},by:alice,note:'',at:now},finalScore:null,amendment:null,cancellation:null};}
function move(t,kind,actor,input={}){return advance(t,kind,actor,input,now).next;}
test('opponent may confirm and finalize original score',()=>{
 const t=move(ticket(),'confirm',bob,{expectedRevision:1});
 assert.equal(t.status,'finalized');assert.deepEqual(t.finalScore,{a:21,b:17});assert.equal(t.turn,null);
});
test('reporter cannot confirm their own score',()=>{
 assert.throws(()=>move(ticket(),'confirm',alice,{expectedRevision:1}),/Only the player receiving/);
});
test('corrected score needs reporter confirmation',()=>{
 const counter=move(ticket(),'propose',bob,{score:{a:19,b:17},expectedRevision:1,note:'The first point was replayed.'});
 assert.equal(counter.turn,alice);assert.equal(counter.revision,2);assert.deepEqual(counter.proposal.score,{a:19,b:17});
 assert.throws(()=>move(counter,'confirm',bob,{expectedRevision:2}),/Only the player receiving/);
 const final=move(counter,'confirm',alice,{expectedRevision:2});assert.deepEqual(final.finalScore,{a:19,b:17});
});
test('multi-step score negotiation never self-approves',()=>{
 let t=ticket();t=move(t,'propose',bob,{expectedRevision:1,score:{a:19,b:17}});
 t=move(t,'propose',alice,{expectedRevision:2,score:{a:20,b:17}});
 assert.equal(t.turn,bob);assert.equal(t.status,'open');
 t=move(t,'confirm',bob,{expectedRevision:3});assert.deepEqual(t.finalScore,{a:20,b:17});
});
test('dispute remains non-final until mutual agreement',()=>{
 const t=move(ticket(),'propose',bob,{expectedRevision:1,score:{a:18,b:18},disputed:true});
 assert.equal(t.disputed,true);assert.equal(t.status,'open');
});
test('stale offline confirmation is rejected',()=>{
 const t=move(ticket(),'editOriginal',alice,{expectedRevision:1,score:{a:20,b:17}});
 assert.throws(()=>move(t,'confirm',bob,{expectedRevision:1}),/This score changed while you were away/);
});
test('reporter can edit only untouched report',()=>{
 const t=move(ticket(),'editOriginal',alice,{expectedRevision:1,score:{a:20,b:17}});
 assert.deepEqual(t.proposal.score,{a:20,b:17});assert.equal(t.turn,bob);
 assert.throws(()=>move(t,'editOriginal',alice,{expectedRevision:2,score:{a:19,b:17}}),/only your original/i);
});
test('reporter can withdraw unanswered original; no XP',()=>{
 const t=move(ticket(),'withdrawOriginal',alice,{expectedRevision:1});assert.equal(t.status,'cancelled');assert.equal(t.finalScore,null);
 assert.throws(()=>move(ticket(),'withdrawOriginal',bob,{expectedRevision:1}),/Only the reporter/);
});
test('mutual cancellation requires other player',()=>{
 const request=move(ticket(),'requestCancel',alice,{expectedRevision:1,note:'Wrong match'});
 assert.equal(request.cancellation.turn,bob);
 assert.throws(()=>move(request,'respondCancel',alice,{expectedRevision:1,accept:true}),/Only the other player/);
 const declined=move(request,'respondCancel',bob,{expectedRevision:1,accept:false});
 assert.equal(declined.status,'open');assert.equal(declined.cancellation,null);
 const cancelled=move(request,'respondCancel',bob,{expectedRevision:1,accept:true});
 assert.equal(cancelled.status,'cancelled');
});
test('confirmed match stays unchanged during requested amendment',()=>{
 const verified=move(ticket(),'confirm',bob,{expectedRevision:1});
 const requested=move(verified,'startAmendment',alice,{amendmentKind:'score',score:{a:18,b:17}});
 assert.deepEqual(requested.finalScore,{a:21,b:17});assert.equal(requested.status,'finalized');
 const rejected=move(requested,'respondAmendment',bob,{expectedRevision:1,accept:false});
 assert.deepEqual(rejected.finalScore,{a:21,b:17});assert.equal(rejected.amendment,null);
});
test('score amendment supports counter and agreement; no unilateral changes',()=>{
 let t=move(ticket(),'confirm',bob,{expectedRevision:1});
 t=move(t,'startAmendment',alice,{amendmentKind:'score',score:{a:18,b:17}});
 t=move(t,'counterAmendment',bob,{expectedRevision:1,score:{a:19,b:17}});
 assert.deepEqual(t.finalScore,{a:21,b:17});
 t=move(t,'respondAmendment',alice,{expectedRevision:2,accept:true});
 assert.deepEqual(t.finalScore,{a:19,b:17});assert.equal(t.amendment,null);
});
test('mutual void does not cancel before acceptance',()=>{
 let t=move(ticket(),'confirm',bob,{expectedRevision:1});
 t=move(t,'startAmendment',alice,{amendmentKind:'void'});
 assert.equal(t.status,'finalized');
 t=move(t,'respondAmendment',bob,{expectedRevision:1,accept:true});
 assert.equal(t.status,'cancelled');assert.equal(t.finalScore,null);
});
test('invalid scores and nonplayers are rejected',()=>{
 assert.throws(()=>validScore({a:-1,b:10}),/whole numbers/);
 assert.throws(()=>validScore({a:2.5,b:10}),/whole numbers/);
 assert.throws(()=>move(ticket(),'confirm','stranger',{expectedRevision:1}),/not a player/);
});
test('weekly and monthly keys use India time and Monday',()=>{
 assert.deepEqual(periodKeys(new Date('2026-11-08T20:00:00Z')),{monthKey:'2026-11',weekKey:'2026-11-09'}); // Mon Nov 9 01:30 IST
 assert.deepEqual(periodKeys(new Date('2026-11-30T20:00:00Z')),{monthKey:'2026-12',weekKey:'2026-11-30'});
 assert.equal(scorePoints(21),42);
});
