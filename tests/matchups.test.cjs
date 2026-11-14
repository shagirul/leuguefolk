const test=require('node:test'),assert=require('node:assert/strict');
const game=(id,a,b,extra={})=>({id,groupId:'club',playerA:'me',playerB:'dev',status:'finalized',finalScore:{a,b},createdAt:new Date('2026-11-'+id+'T10:00:00Z'),...extra});
test('head-to-head uses both submission directions and opposite viewer perspectives',async()=>{
 const {matchupStats}=await import('../public/matchups.mjs');const tickets=[game('10',11,9),game('11',11,8,{playerA:'dev',playerB:'me'}),game('12',10,10)];
 const me=matchupStats(tickets,'me','dev','club'),dev=matchupStats(tickets,'dev','me','club');assert.equal(me.played,3);assert.equal(me.wins,1);assert.equal(me.losses,1);assert.equal(me.draws,1);assert.equal(me.winRate,33);assert.equal(dev.wins,me.losses);assert.equal(dev.losses,me.wins);
});
test('pending, voided, other-club and other-sport matches never affect the record; agreed corrections recalculate it',async()=>{
 const {matchupStats}=await import('../public/matchups.mjs');const source=game('10',11,9),tickets=[source,game('11',11,9,{status:'open',finalScore:null}),game('12',11,9,{status:'cancelled'}),game('13',11,9,{groupId:'other'}),game('14',11,9,{sportId:'badminton'})];
 assert.equal(matchupStats(tickets,'me','dev','club').played,1);const before=matchupStats(tickets,'me','dev','club').fingerprint;
 source.amendment={score:{a:9,b:11}};assert.equal(matchupStats(tickets,'me','dev','club').wins,1);
 source.finalScore={a:9,b:11};source.amendment=null;const after=matchupStats(tickets,'me','dev','club');assert.equal(after.losses,1);assert.notEqual(after.fingerprint,before);
 source.status='cancelled';assert.equal(matchupStats(tickets,'me','dev','club').played,0);
});
test('goals and featured matchups require real history; draws break streaks and new players have no invented rivalry',async()=>{
 const {matchupStats,matchupGoal,isFeaturedMatchup}=await import('../public/matchups.mjs');const now=Date.parse('2026-11-14T12:00:00Z');
 assert.equal(matchupGoal(matchupStats([],'me','dev','club'),'Dev').title,'First meeting');
 const losing=matchupStats([game('10',9,11),game('11',8,11)],'me','dev','club');assert.equal(matchupGoal(losing,'Dev').title,'First victory');assert.equal(isFeaturedMatchup(losing,now),false);
 const tied=matchupStats([game('10',11,9),game('11',8,11)],'me','dev','club');assert.equal(matchupGoal(tied,'Dev').title,'Break the tie');assert.equal(isFeaturedMatchup(tied,now),true);assert.equal(isFeaturedMatchup(tied,now+60*86400000),false);
 const streak=matchupStats([game('10',11,9),game('11',11,8),game('12',10,10)],'me','dev','club');assert.equal(streak.streak,0);assert.equal(streak.bestStreak,2);
});
test('Club All includes self without a record action, unplayed opponents get first-match UI and played rows show factual records',async()=>{
 const {renderMatchups}=await import('../public/matchups.mjs'),members=[{id:'me',displayName:'Alex'},{id:'dev',displayName:'Dev'},{id:'maya',displayName:'Maya'}],args={members,profile:{displayName:'Alex'},user:{uid:'me'},group:{id:'club'},tickets:[game('10',11,9)]};
 const club=renderMatchups({...args,tab:'club'});assert.match(club,/data-id="maya"/);assert.doesNotMatch(club,/data-action="recordOpponent" data-id="me"/);assert.match(club,/this week/);
 const mine=renderMatchups(args);assert.match(mine,/data-id="dev"/);assert.doesNotMatch(mine,/data-id="maya"/);assert.match(mine,/Lifetime records/);
 const detail=renderMatchups({...args,opponentId:'maya'});assert.match(detail,/First meeting/);assert.match(detail,/data-action="recordOpponent" data-id="maya"/);assert.doesNotMatch(detail,/Verified history/);
 const history=renderMatchups({...args,opponentId:'dev'});assert.match(history,/data-action="openTicket" data-id="10"/);assert.match(history,/Ranked/);
});
test('new-result indicators clear for the reviewed fingerprint and player names are escaped',async()=>{
 const {renderMatchups,matchupStats}=await import('../public/matchups.mjs'),tickets=[game('10',11,9)],args={tickets,user:{uid:'me'},group:{id:'club'},members:[{id:'dev',displayName:'<script>x</script>'}],profile:{displayName:'Alex'}};
 assert.match(renderMatchups(args),/New result/);assert.doesNotMatch(renderMatchups({...args,seen:{dev:matchupStats(tickets,'me','dev','club').fingerprint}}),/New result/);assert.doesNotMatch(renderMatchups(args),/<script>/);
});
