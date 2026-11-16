import {periodKeys} from './periods.mjs';
import {buildRankedLedger,championshipStandings} from './ratings.mjs';

// Presentation state is separate from the six stable achievement identities.
export const LOCKED_ACHIEVEMENT_ASSET='locked_placeholder.png';
export const achievementStoneAsset=achievement=>achievement.unlocked?achievement.asset:LOCKED_ACHIEVEMENT_ASSET;

export const ACHIEVEMENT_CATALOG=Object.freeze([
  {id:'whitewash',name:'Whitewash',asset:'01_whitewash.png',description:'A perfect victory. Not a single point conceded.',rule:'Win one eligible ranked table tennis game exactly 11–0.',reset:'Each qualifying game earns one stone. Other results do not reset your collection.',unit:'perfect games',target:1,noProgress:true},
  {id:'untouchable',name:'The Untouchable',asset:'02_the_untouchable.png',description:'Five victories. Zero defeats.',rule:'Win 5 ranked matches in a row against any opponents.',reset:'A loss or draw resets this streak. Casual games do not affect it. Every separate block of 5 wins earns a stone.',unit:'consecutive wins',target:5},
  {id:'rival-dominator',name:'Rival Dominator',asset:'03_rival_dominator.png',description:'One opponent. Five consecutive victories.',rule:'Beat the same opponent in 5 consecutive ranked meetings. You can play other people in between.',reset:'A loss or draw against that opponent resets only their streak. Every separate block of 5 wins earns a stone.',unit:'wins against one rival',target:5},
  {id:'three-peat',name:'Three-Peat',asset:'04_three_peat.png',description:'Three weeks. Three championships. One champion.',rule:'Win the weekly championship for 3 consecutive completed weeks. Each week needs 2 eligible ranked matches and 2 opponents in a 3+ player club; tied leaders do not qualify.',reset:'A week with no sole champion, no games, or another champion breaks the streak. Every separate run of 3 weeks earns a stone.',unit:'consecutive weeks',target:3},
  {id:'table-conqueror',name:'Table Conqueror',asset:'05_table_conqueror.png',description:'Every opponent defeated. Not a single loss.',rule:'Beat every eligible club opponent during one unbeaten ranked run. You need at least 2 different opponents.',reset:'A ranked loss resets this attempt. Draws do not add opponents or reset it. The opponent list is fixed at your first win. After earning a stone, a new attempt begins.',unit:'opponents defeated',target:2},
  {id:'perfect-reign',name:'Perfect Reign',asset:'06_perfect_reign.png',description:'An undefeated champion. An undisputed reign.',rule:'Finish a week as the sole points leader with at least 3 ranked wins, victories over 2 different opponents, and no losses.',reset:'A ranked loss rules out the current week. Each new week is a fresh attempt; tied leaders do not earn a championship stone.',unit:'requirements met',target:4}
]);

const stamp=value=>{const n=+(value?.toDate?.()||new Date(value??NaN));return Number.isFinite(n)?n:null;};
const weekStamp=key=>Date.parse(key+'T00:00:00Z');
const day=86400000,week=7*day;
const nextWeek=key=>new Date(weekStamp(key)+week).toISOString().slice(0,10);
const closeAt=key=>Date.parse(nextWeek(key)+'T00:00:00+05:30');

function weekResult(tickets,uid,members,ledger,at){
  const standings=championshipStandings(members,ledger,'weekly',new Date(at)),row=standings.find(p=>p.id===uid);
  const own={wins:row?.wins||0,losses:row?.losses||0,draws:row?.draws||0,opponents:new Set()};
  for(const t of tickets)if((t.playerA===uid&&t.finalScore.a>t.finalScore.b)||(t.playerB===uid&&t.finalScore.b>t.finalScore.a))own.opponents.add(t.playerA===uid?t.playerB:t.playerA);
  return {...own,champion:standings.find(p=>p.champion)?.id||null,rank:row?.rank||null,points:row?.score||0};
}

export function calculateAchievements({tickets=[],uid,groupId,members=[],now=new Date()}={}){
  const current=stamp(now)??Date.now(),ledger=buildRankedLedger({tickets,members,groupId,now:new Date(current)}),eligible=new Set(ledger.events.filter(e=>e.eligible).map(e=>e.id)),all=ledger.history.filter(t=>eligible.has(t.id)).map(t=>({...t,seasonAt:t.at})),own=all.filter(t=>[t.playerA,t.playerB].includes(uid)).map(t=>{
    const a=t.playerA===uid,ownScore=a?t.finalScore.a:t.finalScore.b,otherScore=a?t.finalScore.b:t.finalScore.a;
    return {...t,ownScore,otherScore,opponentId:a?t.playerB:t.playerA,result:ownScore>otherScore?'W':ownScore<otherScore?'L':'D'};
  }),byId=new Map(members.map(m=>[m.id,m]));
  const result=ACHIEVEMENT_CATALOG.map(a=>({...a,count:0,progress:0,unlocked:false,occurrences:[],details:[]})),get=id=>result.find(a=>a.id===id);
  const award=(id,t,extra={})=>get(id).occurrences.push({id:id+':'+(extra.weekKey||t.id),at:t.at,ticketId:t.id,...extra});
  const white=get('whitewash'),untouchable=get('untouchable'),rival=get('rival-dominator'),conqueror=get('table-conqueror');
  let run=0,conquest=null;const rivals=new Map();
  const eligibleAt=at=>members.filter(m=>m.id!==uid&&(!m.sportId||m.sportId==='table-tennis')&&(stamp(m.joinedAt)===null||stamp(m.joinedAt)<=at)).map(m=>m.id);
  for(const t of own){
    // A legacy exact 11–0 is a single standard game. Explicit other formats are excluded.
    if(t.ownScore===11&&t.otherScore===0&&(!t.format||['singles-11','single-game-11','standard-11','single'].includes(t.format)))award('whitewash',t,{opponentId:t.opponentId});
    if(t.result==='W'){
      run++;if(run===5){award('untouchable',t,{opponentId:t.opponentId});run=0;}
      const r=(rivals.get(t.opponentId)||0)+1;
      if(r===5){award('rival-dominator',t,{opponentId:t.opponentId});rivals.set(t.opponentId,0);}else rivals.set(t.opponentId,r);
      if(!conquest){const roster=eligibleAt(t.at);if(roster.length>=2)conquest={roster,defeated:new Set(),startedAt:t.at};}
      if(conquest?.roster.includes(t.opponentId))conquest.defeated.add(t.opponentId);
      if(conquest&&conquest.defeated.size===conquest.roster.length){award('table-conqueror',t,{opponentId:t.opponentId,rosterIds:[...conquest.roster]});conquest=null;}
    }else{run=0;rivals.set(t.opponentId,0);if(t.result==='L')conquest=null;}
  }
  white.progress=white.occurrences.length?1:0;white.progressText=white.progress?'Win another verified 11–0 for your next stone.':'Your first perfect 11–0';
  untouchable.progress=run;untouchable.progressText=`${run}/5 consecutive ranked wins`;
  rival.opponentProgress=[...rivals].map(([opponentId,progress])=>({opponentId,name:byId.get(opponentId)?.displayName||'Former player',progress,target:5})).sort((a,b)=>b.progress-a.progress||a.name.localeCompare(b.name));
  const leadingRival=rival.opponentProgress[0];rival.progress=leadingRival?.progress||0;rival.progressText=leadingRival?`${rival.progress}/5 against ${leadingRival.name}`:'0/5 against one opponent';
  conqueror.rosterIds=conquest?.roster||eligibleAt(current);conqueror.defeatedIds=[...(conquest?.defeated||[])];conqueror.target=Math.max(2,conqueror.rosterIds.length);conqueror.progress=conqueror.defeatedIds.length;
  conqueror.progressText=conqueror.rosterIds.length<2?'Needs 2 eligible opponents':`${conqueror.progress}/${conqueror.target} different opponents`;
  conqueror.details=conqueror.rosterIds.map(id=>({label:byId.get(id)?.displayName||'Former player',value:conqueror.defeatedIds.includes(id)?'Defeated':'Still to beat'}));

  const weeks=new Map(),currentWeek=periodKeys(new Date(current)).weekKey;
  for(const t of all){const key=periodKeys(new Date(t.seasonAt)).weekKey;if(!weeks.has(key))weeks.set(key,[]);weeks.get(key).push(t);}
  const three=get('three-peat'),perfect=get('perfect-reign');let championshipRun=0,previous=null;
  const completed=[...weeks.keys()].filter(key=>key<currentWeek).sort();
  for(const key of completed){
    const standing=weekResult(weeks.get(key),uid,members,ledger,closeAt(key)-1);
    if(previous&&weekStamp(key)-weekStamp(previous)!==week)championshipRun=0;
    if(standing.champion===uid){
      championshipRun++;
      if(championshipRun===3){three.occurrences.push({id:'three-peat:'+key,weekKey:key,at:closeAt(key)});championshipRun=0;}
      if(standing.wins>=3&&standing.losses===0&&standing.opponents.size>=2)perfect.occurrences.push({id:'perfect-reign:'+key,weekKey:key,at:closeAt(key)});
    }else championshipRun=0;
    previous=key;
  }
  // An empty or unplayed just-completed week also interrupts a championship run.
  if(!previous||weekStamp(currentWeek)-weekStamp(previous)!==week)championshipRun=0;
  three.progress=championshipRun;three.progressText=`${championshipRun}/3 completed championship weeks`;
  const live=weekResult(weeks.get(currentWeek)||[],uid,members,ledger,current);
  perfect.weekKey=currentWeek;
  perfect.conditions=[{label:'3 ranked wins',current:live.wins,target:3,met:live.wins>=3,value:`${Math.min(live.wins,3)}/3`},{label:'2 different opponents',current:live.opponents.size,target:2,met:live.opponents.size>=2,value:`${Math.min(live.opponents.size,2)}/2`},{label:'No losses',current:live.losses,target:0,met:live.losses===0&&live.wins+live.draws>0,value:String(live.losses)+' losses'},{label:'Sole weekly leader',current:live.rank,target:1,met:live.champion===uid,value:live.rank?'#'+live.rank:'No games yet'}];
  perfect.progress=perfect.conditions.filter(c=>c.met).length;perfect.progressText=live.losses?'Try again next week':`${Math.min(live.wins,3)}/3 wins · ${Math.min(live.opponents.size,2)}/2 opponents`;
  perfect.details=perfect.conditions.map(c=>({label:c.label,value:c.value}));
  three.details=[{label:'Championship rule',value:'Sole points leader in a completed week'},{label:'Week closes',value:'Monday, 00:00 Asia/Kolkata'}];
  for(const a of result){a.count=a.occurrences.length;a.unlocked=a.count>0;a.latest=a.occurrences.at(-1)||null;}
  return result;
}
