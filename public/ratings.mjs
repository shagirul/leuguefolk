import {rating,rate,predictWin} from './vendor/openskill.mjs';
import {periodKeys} from './periods.mjs';

// Versioned pilot policy. The verified tickets and their audit events are the
// durable ledger; no client-written rating/points balance is ever trusted.
export const RATING_POLICY=Object.freeze({version:'openskill-5.0.1-pilot-1',provisionalMatches:5,maxEstablishedSigma:20/3,pairLimit:2,twoPlayerPairLimit:3,minWeeklyMatches:2,inactivityGraceDays:7,inactivityVariancePerDay:(25/30)**2});
const DAY=86400000,INITIAL_SIGMA=25/3;
const stamp=value=>{const n=value?.toMillis?.()??+(value?.toDate?.()||new Date(value??NaN));return Number.isFinite(n)?n:null;};
export const displayedSkill=r=>Math.round(1000+10*(r.mu-25));
export const pointsForChance=chance=>chance>.65?3:chance<.35?5:4;
export function agedRating(player,at){
  const idle=player.lastAt==null?0:Math.max(0,(at-player.lastAt)/DAY-RATING_POLICY.inactivityGraceDays);
  return {mu:player.mu,sigma:Math.min(INITIAL_SIGMA,Math.sqrt(player.sigma**2+idle*RATING_POLICY.inactivityVariancePerDay))};
}
export function activePlayers(members,at,participants=[]){
  return new Set([...members.filter(m=>(!m.sportId||m.sportId==='table-tennis')&&(stamp(m.joinedAt)==null||stamp(m.joinedAt)<=at)).map(m=>m.id),...participants]).size;
}
export function verifiedHistory(tickets,{groupId,now=new Date()}={}){
  const latest=new Map(),end=stamp(now)??Date.now();
  for(const t of tickets){
    if(groupId&&t.groupId!==groupId||t.sportId&&t.sportId!=='table-tennis')continue;
    // Production tickets have IDs. A missing ID is not safe to replay or deduplicate.
    if(t.id==null||!t.playerA||!t.playerB||t.playerA===t.playerB)continue;
    const old=latest.get(String(t.id));
    if(!old||(+t.version||0)>(+old.version||0)||((+t.version||0)===(+old.version||0)&&(stamp(t.updatedAt)||0)>=(stamp(old.updatedAt)||0)))latest.set(String(t.id),t);
  }
  return [...latest.values()].map(t=>({...t,id:String(t.id),at:stamp(t.createdAt)}))
    .filter(t=>t.status==='finalized'&&t.at!=null&&t.at<=end&&[t.finalScore?.a,t.finalScore?.b].every(v=>Number.isInteger(v)&&v>=0&&v<=200))
    .sort((a,b)=>a.at-b.at||(a.id<b.id?-1:a.id>b.id?1:0));
}
export function buildRankedLedger({members=[],tickets=[],groupId,now=new Date()}={}){
  const history=verifiedHistory(tickets,{groupId,now}),players=new Map(),events=[],pairCounts=new Map();
  const ensure=id=>{if(!players.has(id))players.set(id,{id,...rating(),rankedPlayed:0,wins:0,losses:0,draws:0,lastAt:null});return players.get(id);};
  members.forEach(m=>ensure(m.id));
  for(const t of history){
    const a=ensure(t.playerA),b=ensure(t.playerB),keys=periodKeys(new Date(t.at));
    const pairKey=JSON.stringify([keys.weekKey,...[a.id,b.id].sort()]),used=pairCounts.get(pairKey)||0;
    const pairLimit=activePlayers(members,t.at,[a.id,b.id])<=2?RATING_POLICY.twoPlayerPairLimit:RATING_POLICY.pairLimit;
    const casual=t.mode==='casual'||t.ranked===false,eligible=!casual&&used<pairLimit;
    const event={id:t.id,ticketId:t.id,sourceVersion:t.version||1,policyVersion:RATING_POLICY.version,at:t.at,...keys,playerA:a.id,playerB:b.id,score:{...t.finalScore},eligible,reason:casual?'casual':eligible?'ranked':'pair-limit',pairLimit,points:{[a.id]:0,[b.id]:0},before:null,after:null,winChance:null};
    if(eligible){
      pairCounts.set(pairKey,used+1);
      const ra=agedRating(a,t.at),rb=agedRating(b,t.at),chance=predictWin([[ra],[rb]]);
      const winner=t.finalScore.a>t.finalScore.b?a.id:t.finalScore.b>t.finalScore.a?b.id:null;
      event.before={[a.id]:ra,[b.id]:rb};event.winChance={[a.id]:chance[0],[b.id]:chance[1]};
      if(winner)event.points[winner]=pointsForChance(event.winChance[winner]);
      // Outcome only: score margin and streak never enter OpenSkill.
      const [[nextA],[nextB]]=rate([[ra],[rb]],{rank:winner===a.id?[1,2]:winner===b.id?[2,1]:[1,1]});
      event.after={[a.id]:nextA,[b.id]:nextB};
      for(const [player,next] of [[a,nextA],[b,nextB]])Object.assign(player,next,{rankedPlayed:player.rankedPlayed+1,lastAt:t.at,wins:player.wins+(winner===player.id?1:0),losses:player.losses+(winner&&winner!==player.id?1:0),draws:player.draws+(!winner?1:0)});
    }
    events.push(event);
  }
  const end=stamp(now)??Date.now();
  for(const player of players.values()){
    Object.assign(player,agedRating(player,end));player.skill=displayedSkill(player);
    player.provisional=player.rankedPlayed<RATING_POLICY.provisionalMatches||player.sigma>RATING_POLICY.maxEstablishedSigma;
  }
  return {policyVersion:RATING_POLICY.version,events,players,history,groupId};
}
export function championshipStandings(members,ledger,period='weekly',now=new Date()){
  const monthly=period==='monthly',key=monthly?'monthKey':'weekKey',season=periodKeys(now)[key];
  const rows=new Map(members.map(m=>[m.id,{id:m.id,name:m.displayName||'Player',score:0,played:0,wins:0,losses:0,draws:0,opponents:new Set()}]));
  for(const event of ledger.events){
    if(!event.eligible||event[key]!==season)continue;
    for(const id of [event.playerA,event.playerB]){
      const row=rows.get(id);if(!row)continue;
      const winner=event.points[id]>0,draw=event.score.a===event.score.b;
      row.score+=event.points[id];row.played++;row.wins+=winner?1:0;row.losses+=!winner&&!draw?1:0;row.draws+=draw?1:0;
      row.opponents.add(id===event.playerA?event.playerB:event.playerA);
    }
  }
  const minOpponents=activePlayers(members,+now)<=2?1:2;
  const sorted=[...rows.values()].map(row=>({...row,opponents:[...row.opponents],championshipEligible:monthly?row.played>0:row.played>=RATING_POLICY.minWeeklyMatches&&row.opponents.size>=minOpponents,minOpponents})).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  sorted.forEach((row,i)=>{row.rank=i&&row.score===sorted[i-1].score?sorted[i-1].rank:i+1;});
  const leaders=sorted.filter(row=>row.score>0&&row.score===sorted[0]?.score);
  sorted.forEach(row=>{row.champion=leaders.length===1&&leaders[0]===row&&row.championshipEligible;});
  return sorted;
}
export function skillStandings(members,ledger){
  const rows=members.map(m=>({...ledger.players.get(m.id),id:m.id,name:m.displayName||'Player',score:ledger.players.get(m.id)?.skill??1000,played:ledger.players.get(m.id)?.rankedPlayed||0}));
  rows.sort((a,b)=>Number(a.provisional)-Number(b.provisional)||b.score-a.score||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  let previous=null;
  rows.forEach((row,i)=>{row.rank=row.provisional?null:previous&&previous.score===row.score?previous.rank:i+1;if(!row.provisional)previous=row;});
  return rows;
}
