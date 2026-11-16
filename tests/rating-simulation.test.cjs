const test=require('node:test'),assert=require('node:assert/strict');
test('four-week expert, improver and frequent-average pilot separates skill and competition without rewarding repeat farming',async()=>{
 const {simulateRatings}=await import('../scripts/simulate-ratings.mjs');const result=simulateRatings();
 assert.equal(result.weeks.length,4);assert.ok(result.excludedRepeatedGames>0);assert.ok(result.holdoutWeek.games>0);
 assert.notEqual(result.weeks[0].champion,result.weeks[3].champion);
});
