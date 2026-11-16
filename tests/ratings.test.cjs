const test=require('node:test'),assert=require('node:assert/strict');
const members=[{id:'a',displayName:'Alex'},{id:'b',displayName:'Bea'},{id:'c',displayName:'Cam'}],now=new Date('2026-11-29T10:00:00Z');
const match=(id,winner='a',extra={})=>({id:String(id),groupId:'club',playerA:'a',playerB:'b',status:'finalized',version:1,createdAt:new Date('2026-11-10T10:00:00Z'),finalScore:winner==='a'?{a:11,b:8}:winner==='b'?{a:8,b:11}:{a:10,b:10},...extra});
const load=()=>import('../public/ratings.mjs');
test('new players start at 1000, losses reduce skill and no score-margin or streak bonus enters OpenSkill',async()=>{
 const {buildRankedLedger}=await load();
 const empty=buildRankedLedger({members,now});assert.equal(empty.players.get('a').skill,1000);assert.equal(empty.players.get('a').provisional,true);
 const calc=finalScore=>buildRankedLedger({members,tickets:[match(1,'a',{finalScore})],now});
 const close=calc({a:11,b:9}),wide=calc({a:200,b:0});assert.equal(close.players.get('a').mu,wide.players.get('a').mu);
 assert.ok(close.players.get('a').skill>1000);assert.ok(close.players.get('b').skill<1000);
 assert.equal(close.events[0].points.a,4);assert.equal(close.events[0].winChance.a,.5);
});
test('probability bands use exact unrounded thresholds, before the result',async()=>{
 const {pointsForChance,buildRankedLedger}=await load();
 assert.deepEqual([.34,.35,.65,.66].map(pointsForChance),[5,4,4,3]);
 const tickets=Array.from({length:8},(_,i)=>match(i,'a',{createdAt:new Date(Date.UTC(2026,8,1+i*7))}));
 const ledger=buildRankedLedger({members,tickets:[...tickets,match('upset','b',{createdAt:new Date('2026-11-10T11:00:00Z')})],now});
 const upset=ledger.events.at(-1);assert.ok(upset.winChance.b<.35);assert.equal(upset.points.b,5);assert.equal(upset.before.b.mu,ledger.events.at(-2).after.b.mu);
});
test('pair limits are symmetric, reset weekly, and treat two-member clubs differently; draws use a slot',async()=>{
 const {buildRankedLedger}=await load();
 const tickets=[match(1),match(2,null,{playerA:'b',playerB:'a'}),match(3),match(4,'a',{createdAt:new Date('2026-11-17T10:00:00Z')})];
 let events=buildRankedLedger({members,tickets,now}).events;assert.deepEqual(events.map(e=>e.eligible),[true,true,false,true]);
 assert.equal(events[1].points.a,0);assert.equal(events[2].reason,'pair-limit');
 events=buildRankedLedger({members:members.slice(0,2),tickets,now}).events;assert.deepEqual(events.map(e=>e.eligible),[true,true,true,true]);
});
test('casual, pending, void and other-club results never affect skill or points, but verified casual history survives',async()=>{
 const {buildRankedLedger}=await load();
 const tickets=[match(1,'a',{mode:'casual'}),match(2,'a',{status:'open'}),match(3,'a',{status:'cancelled'}),match(4,'a',{groupId:'other'})];
 const ledger=buildRankedLedger({members,tickets,groupId:'club',now});assert.equal(ledger.players.get('a').skill,1000);assert.equal(ledger.events.length,1);assert.equal(ledger.history.length,1);
});
test('late joins do not retroactively lower pair limits, and a void promotes the next eligible meeting',async()=>{
 const {buildRankedLedger}=await load();
 const roster=members.map(m=>m.id==='c'?{...m,joinedAt:new Date('2026-11-11T00:00:00Z')}:m);
 const tickets=[match(1),match(2),match(3),match(4,'a',{createdAt:new Date('2026-11-11T10:00:00Z')})];
 assert.deepEqual(buildRankedLedger({members:roster,tickets,now}).events.map(e=>e.eligible),[true,true,true,false]);
 const capped=buildRankedLedger({members,tickets:[...tickets,{...tickets[0],version:2,status:'cancelled'}],now});
 assert.deepEqual(capped.events.map(e=>[e.id,e.eligible]),[['2',true],['3',true],['4',false]]);
});
test('replay is deterministic, uses latest ticket versions and recomputes every dependent prediction after a correction or void',async()=>{
 const {buildRankedLedger}=await load();
 const first=match(1),second=match(2,'b',{createdAt:new Date('2026-11-17T10:00:00Z')}),tickets=[first,second];
 const original=buildRankedLedger({members,tickets,now}),reordered=buildRankedLedger({members,tickets:[second,first,first],now});assert.deepEqual(original.events,reordered.events);
 const corrected={...first,version:2,finalScore:{a:8,b:11}},updated=buildRankedLedger({members,tickets:[...tickets,corrected],now});
 assert.notEqual(updated.events[1].winChance.a,original.events[1].winChance.a);
 assert.equal(updated.events[0].points.b,4);assert.equal(updated.events[0].sourceVersion,2);
 const voided=buildRankedLedger({members,tickets:[...tickets,{...corrected,status:'cancelled',version:3}],now});assert.equal(voided.events.length,1);assert.equal(voided.events[0].winChance.a,.5);
 assert.deepEqual(tickets,[first,second],'Replay must not modify source records');
});
test('skill never resets weekly; provisional players remain separate until history and confidence qualify',async()=>{
 const {buildRankedLedger,skillStandings,agedRating}=await load();
 const tickets=Array.from({length:5},(_,i)=>match(i,i%2?'b':'a',{createdAt:new Date(Date.UTC(2026,10,1+i*2))}));
 const ledger=buildRankedLedger({members:members.slice(0,2),tickets,now:new Date('2026-11-10T10:00:00Z')});
 assert.equal(ledger.players.get('a').rankedPlayed,5);assert.equal(ledger.players.get('a').provisional,true,'Five matches alone do not guarantee confidence');
 const established=buildRankedLedger({members,tickets:Array.from({length:18},(_,i)=>match(i,i%2?'b':'a',{createdAt:new Date(Date.UTC(2026,5,1+i*7))})),now:new Date(Date.UTC(2026,5,1+17*7+1))});assert.equal(established.players.get('a').provisional,false);
 const rows=skillStandings(members,buildRankedLedger({members,tickets:[],now}));assert.ok(rows.every(r=>r.rank===null));
 const early=buildRankedLedger({members,tickets:[match(1)],now:new Date('2026-11-15T18:29:59Z')}),later=buildRankedLedger({members,tickets:[match(1)],now:new Date('2026-11-15T18:30:00Z')});assert.equal(early.players.get('a').skill,later.players.get('a').skill);
 assert.ok(agedRating({mu:25,sigma:2,lastAt:0},45*86400000).sigma>2);
});
test('championships require activity and opponent variety, use points in both periods, and never break ties by name',async()=>{
 const {buildRankedLedger,championshipStandings}=await load();
 const date=new Date('2026-11-10T11:00:00Z'),tickets=[match(1),match(2,'a',{playerB:'c'})];
 const ledger=buildRankedLedger({members,tickets,now:date});
 for(const period of ['weekly','monthly']){const rows=championshipStandings(members,ledger,period,date);assert.equal(rows[0].score,8);assert.equal(rows[0].champion,true);}
 const only=championshipStandings(members,buildRankedLedger({members,tickets:[match(1)],now:date}),'weekly',date);assert.equal(only[0].champion,false);
 const two=championshipStandings(members.slice(0,2),buildRankedLedger({members:members.slice(0,2),tickets:[match(1),match(2)],now:date}),'weekly',date);assert.equal(two[0].champion,true);
 const ties=championshipStandings(members,buildRankedLedger({members,tickets:[match(1),match(2,'b',{playerA:'b',playerB:'c',finalScore:{a:11,b:8}})],now:date}),'weekly',date);assert.equal(ties[0].rank,ties[1].rank);assert.ok(ties.every(p=>!p.champion));
});
