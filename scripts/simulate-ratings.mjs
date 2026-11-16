import {buildRankedLedger,championshipStandings} from '../public/ratings.mjs';
import assert from 'node:assert/strict';
export function simulateRatings(){
  const members=[['expert','Occasional expert'],['learner','Improving beginner'],['regular','Frequent average'],['peer','Peer']].map(([id,displayName])=>({id,displayName}));
  const tickets=[],weeks=[];let number=0,initialLearner;
  for(let week=0;week<4;week++){
    const start=Date.UTC(2026,9,5+week*7,5);
    const play=(a,b,winner)=>tickets.push({id:String(++number).padStart(4,'0'),groupId:'simulation',playerA:a,playerB:b,status:'finalized',version:1,createdAt:new Date(start+number*60000),finalScore:winner===a?{a:11,b:8}:{a:8,b:11}});
    play('expert','regular','expert');play('expert','learner','expert');
    for(let game=0;game<8;game++)play('regular','learner',week===0?'regular':week===1&&game===0?'regular':'learner');
    for(let game=0;game<8;game++)play('regular','peer',week<2||game%2===0?'regular':'peer');
    for(let game=0;game<2;game++)play('learner','peer',week===0?'peer':week===1&&game===0?'peer':'learner');
    const now=new Date(start+6*86400000),ledger=buildRankedLedger({members,tickets,now}),standings=championshipStandings(members,ledger,'weekly',now);
    if(week===0)initialLearner=ledger.players.get('learner').skill;
    weeks.push({week:week+1,champion:standings.find(p=>p.champion)?.name||null,standings:standings.map(p=>({name:p.name,points:p.score,eligibleGames:p.played,qualified:p.championshipEligible})),skill:[...ledger.players.values()].map(p=>({id:p.id,skill:p.skill,provisional:p.provisional,eligibleGames:p.rankedPlayed}))});
  }
  const now=new Date('2026-11-01T12:00:00Z'),ledger=buildRankedLedger({members,tickets,now});
  const eligibleIds=new Set(ledger.events.filter(e=>e.eligible).map(e=>e.id)),withoutExtra=buildRankedLedger({members,tickets:tickets.filter(t=>eligibleIds.has(t.id)),now});
  for(const p of ledger.players.values())assert.equal(p.mu,withoutExtra.players.get(p.id).mu,'Extra repeated matches must have no rating effect');
  assert.ok(ledger.players.get('learner').skill>initialLearner,'Improvement should be reflected');
  assert.ok(ledger.players.get('expert').skill>ledger.players.get('regular').skill,'Match volume alone should not beat the expert estimate');
  const lastWeek=ledger.events.filter(e=>e.eligible&&e.weekKey==='2026-10-26');
  const predictionsCorrect=lastWeek.filter(e=>{const predicted=e.winChance[e.playerA]>.5?e.playerA:e.playerB;return e.points[predicted]>0;}).length;
  return {policy:ledger.policyVersion,weeks,totalReports:tickets.length,eligibleRankedGames:eligibleIds.size,excludedRepeatedGames:tickets.length-eligibleIds.size,holdoutWeek:{predictionsCorrect,games:lastWeek.length,accuracy:predictionsCorrect/lastWeek.length},checks:['Repeated excess games do not change ratings','Improver gains skill','Expert skill estimate exceeds frequent average'],note:'Illustrative pilot simulation, not proof of calibrated real-world predictions. Expert remains provisional until history and confidence qualify.'};
}
if(process.argv[1]?.endsWith('simulate-ratings.mjs'))console.log(JSON.stringify(simulateRatings(),null,2));
