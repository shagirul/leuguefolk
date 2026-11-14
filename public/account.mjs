import {avatarFor,characterCard,playerAvatar} from './avatars.mjs';
import {calculateAchievements,achievementStoneAsset} from './achievements.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=value=>{const date=value?.toDate?value.toDate():value;const result=+new Date(date||0);return Number.isFinite(result)?result:0;};
const score=value=>Number.isInteger(value)&&value>=0&&value<=200;

export function bindScrollHeader(scroller){
  let last=0,direction=0,travel=0;
  const reveal=()=>scroller.classList?.remove('is-header-hidden');
  const reset=()=>{last=0;direction=0;travel=0;reveal();scroller.classList?.remove('is-header-scrolled');};
  scroller.addEventListener?.('scroll',()=>{
    const header=scroller.querySelector?.('.account-page>.account-top');
    const max=Math.max(0,scroller.scrollHeight-scroller.clientHeight),y=Math.max(0,Math.min(max,scroller.scrollTop)),delta=y-last;
    last=y;
    scroller.classList?.[header&&y>8?'add':'remove']('is-header-scrolled');
    if(!header||y<=8||max-y<=2||scroller.querySelector?.('.modal-backdrop')){travel=0;direction=0;reveal();return;}
    if(!delta)return;
    const next=delta>0?1:-1;travel=next===direction?travel+Math.abs(delta):Math.abs(delta);direction=next;
    if(next<0&&travel>=6){reveal();travel=0;}
    else if(next>0&&y>(header.offsetHeight||60)+16&&travel>=12){scroller.classList?.add('is-header-hidden');travel=0;}
  },{passive:true});
  scroller.addEventListener?.('focusin',e=>{if(e.target.closest?.('.account-top'))reveal();});
  return {reset};
}

// The active group's complete ticket snapshot is already available offline and live.
// Pending corrections retain their verified score until both players accept a change.
export function summarizeProfile(tickets,uid){
  const matches=tickets.filter(t=>t.status==='finalized'&&t.playerA!==t.playerB&&[t.playerA,t.playerB].includes(uid)&&score(t.finalScore?.a)&&score(t.finalScore?.b))
    .map(t=>{const own=t.playerA===uid?t.finalScore.a:t.finalScore.b,opponent=t.playerA===uid?t.finalScore.b:t.finalScore.a;return {id:t.id,own,opponent,result:own>opponent?'W':own<opponent?'L':'D',at:time(t.createdAt)};})
    .sort((a,b)=>a.at-b.at||String(a.id||'').localeCompare(String(b.id||'')));
  const played=matches.length,wins=matches.filter(m=>m.result==='W').length,draws=matches.filter(m=>m.result==='D').length;
  const points=matches.reduce((sum,m)=>sum+m.own,0),pointsConceded=matches.reduce((sum,m)=>sum+m.opponent,0),xp=points*2;
  let streak=0,bestStreak=0;for(const match of matches){streak=match.result==='W'?streak+1:0;bestStreak=Math.max(bestStreak,streak);}
  return {played,wins,draws,losses:played-wins-draws,winRate:played?Math.round(wins/played*100):0,pointsScored:points,pointsConceded,pdRatio:pointsConceded?points/pointsConceded:points?Infinity:null,xp,level:1+Math.floor(xp/100),levelProgress:xp%100,toNext:100-xp%100,bestStreak,averageScore:played?Math.round(points/played):0,recent:matches.slice(-5).reverse()};
}

export const accountAchievements=context=>calculateAchievements(context);

const paths={
  trophy:'<path d="M8 3h8v6a4 4 0 0 1-8 0V3Z"/><path d="M8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 2v6m-4 2h8"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="m12 12 8-8m-1 0h2v2"/>',
  flag:'<path d="M5 21V3m0 1c5-4 9 4 14 0v9c-5 4-9-4-14 0"/>',
  medal:'<circle cx="12" cy="15" r="6"/><path d="m8 10-3-7h5l2 6 2-6h5l-3 7m-6 5 1.3 1.3L14 14"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7l1-7Z"/>',
  star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  settings:'<path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3H9Z"/><circle cx="12" cy="12" r="3"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M15 5V4a1 1 0 0 0-1-1H5a2 2 0 0 0-2 2v9a1 1 0 0 0 1 1h1"/>',
  pencil:'<path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2"/>',
  group:'<rect x="3" y="8" width="13" height="13" rx="4" fill="currentColor" opacity=".25" stroke="none"/><rect x="8" y="3" width="13" height="13" rx="4" fill="currentColor" stroke="none"/>',
  bell:'<path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3Zm5 3h4"/>',
  user:'<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  gem:'<path d="m8 3-5 7 9 11 9-11-5-7H8Z"/><path d="M3 10h18M8 3l4 18 4-18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  share:'<path d="M12 15V3m-4 4 4-4 4 4M8 11H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-2"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>'
};
export function accountIcon(name){return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[name]||paths.star}</svg>`;}

export function createCharacterTooltipController(document,{setTimer=setTimeout,clearTimer=clearTimeout,now=Date.now}={}){
  let current=null,hideTimer=null,fadeTimer=null;
  const elements=()=>({button:document.querySelector?.('[data-action="characterInfo"]'),tooltip:document.getElementById?.('characterTooltip')});
  function reset(){clearTimer(hideTimer);clearTimer(fadeTimer);hideTimer=fadeTimer=null;current=null;const {button,tooltip}=elements();if(tooltip){tooltip.hidden=true;tooltip.classList.remove('is-leaving');}button?.setAttribute('aria-expanded','false');button?.removeAttribute('aria-describedby');}
  function paint(){const {button,tooltip}=elements();if(!current||!button||!tooltip||button.dataset.characterId!==current.id){reset();return;}tooltip.hidden=false;tooltip.classList.toggle('is-leaving',current.phase==='leaving');button.setAttribute('aria-expanded','true');button.setAttribute('aria-describedby','characterTooltip');}
  function hide({immediate=false}={}){clearTimer(hideTimer);clearTimer(fadeTimer);if(!current)return;if(immediate){reset();return;}current.phase='leaving';paint();if(current)fadeTimer=setTimer(reset,180);}
  return {isOpen:()=>!!current,hide,sync(){if(current){if(current.phase==='visible'&&now()>=current.until)reset();else paint();}},toggle(button){
    if(current?.id===button.dataset.characterId&&current.phase==='visible'){hide();return;}
    reset();current={id:button.dataset.characterId,phase:'visible',until:now()+4500};paint();if(current)hideTimer=setTimer(()=>hide(),4500);
  }};
}

function groupInitials(name){
  const words=String(name||'Your group').match(/[\p{L}\p{N}]+/gu)||['Your','group'];
  return (words.length>1?Array.from(words[0])[0]+Array.from(words[1])[0]:Array.from(words[0]).slice(0,2).join('')).toLocaleUpperCase();
}
export function renderLeagueHeader({title,group,back=false,settings=false,unread=false,inboxActive=false}){
  return `<header class="account-top league-header ${settings?'has-settings':''} ${back?'has-back':''}">${back?`<button class="account-icon-button league-header-back" data-action="back" aria-label="Back">${accountIcon('chevron')}</button>`:''}<h1 title="${esc(title)}">${esc(title)}</h1><div class="league-header-actions">${group?`<button class="account-icon-button league-header-notifications ${inboxActive?'is-active':''}" data-action="nav" data-view="inbox" aria-label="Inbox" title="Notifications" ${inboxActive?'aria-current="page"':''} ${unread?'aria-describedby="headerUnread"':''}>${accountIcon('bell')}${unread?'<i aria-hidden="true"></i><span id="headerUnread" class="character-sr-only">Unread notifications</span>':''}</button>`:''}${group?`<button class="league-group-picker" data-action="groupSwitch" aria-haspopup="dialog" aria-label="Choose a group, current group ${esc(group.name||'Your group')}" title="${esc(group.name||'Your group')}"><span class="league-group-symbol" aria-hidden="true">${esc(groupInitials(group.name))}</span></button>`:''}${settings?`<button class="account-icon-button league-header-settings" data-action="accountSettings" aria-label="Account settings">${accountIcon('settings')}</button>`:''}</div></header>`;
}

export function renderLeagueNavigation(active='profile'){
  return `<nav class="account-nav" aria-label="Main navigation">${[['leaderboard','trophy','Ranks'],['matches','activity','Matches'],['matchups','users','Matchups'],['profile','user','Profile']].map(([view,icon,label])=>`<button class="${view===active?'is-active':''}" data-action="nav" data-view="${view}" aria-label="${label}" ${view===active?'aria-current="page"':''}>${accountIcon(icon)}<span>${label}</span></button>`).join('')}</nav>`;
}

function levelRail(stats){
  return `<section class="account-level-rail" aria-label="Level milestones"><div class="account-current-level"><span class="account-level-gem">${accountIcon('gem')}</span><strong>Level ${stats.level}</strong><small>${stats.xp} XP earned</small></div><div class="account-level-steps">${Array.from({length:5},(_,i)=>`<div class="account-level-step ${i===0?'is-current':''}" aria-label="Level ${stats.level+i}${i===0?', current':', locked'}"><span>L${stats.level+i}</span>${accountIcon('gem')}<small>${(stats.level+i-1)*100} XP</small></div>`).join('')}</div></section>`;
}
function achievementsContent(achievements,isOwn=true){
  const unlocked=achievements.filter(a=>a.unlocked).length;
  return `<div class="account-section-heading achievement-heading"><h3>${isOwn?'Your collection':'Collection'}</h3><span>${unlocked} / ${achievements.length} earned</span></div><div class="account-achievements stone-collection">${achievements.map(a=>`<button class="account-achievement stone-tile stone-${a.id} ${a.unlocked?'is-unlocked':''}" data-action="accountAchievement" data-id="${a.id}" aria-label="${esc(a.name)}, earned ${a.count} ${a.count===1?'time':'times'}. ${esc(a.progressText)}. See how to earn."><span class="stone-art"><img src="/assets/achievements/${esc(achievementStoneAsset(a))}" width="1254" height="1254" alt="" decoding="async" draggable="false"><strong class="stone-name">${esc(a.name)}</strong><span class="stone-count" aria-label="${a.count} earned">${a.count}</span></span></button>`).join('')}</div>`;
}

export function renderAchievementDetail(a,{members=[],group,playerName}={}){
  if(!a)return '';
  const person=id=>members.find(m=>m.id===id)?.displayName||'a former player';
  const date=at=>new Date(at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  const progress=a.target>0?Math.min(100,a.progress/a.target*100):0;
  const pathDetails=(['three-peat','perfect-reign'].includes(a.id)?'<p class="stone-week-note">Awarded after the week closes on Monday, 00:00 IST. Tied leaders do not earn a championship stone. Closed weeks recalculate if a result changes.</p>':'')+(a.id==='table-conqueror'&&a.details?.length?`<div class="stone-rivals">${a.details.map(p=>`<div><span>${esc(p.label)}</span><b>${esc(p.value)}</b></div>`).join('')}</div>`:'');
  return `<div class="stone-detail stone-${a.id}"><div class="stone-detail-art"><img src="/assets/achievements/${esc(a.asset)}" width="512" height="512" alt="${esc(a.name)} stone"><span class="stone-count" aria-label="${a.count} earned">${a.count}</span></div><p class="stone-eyebrow">${a.count?`EARNED ${a.count} ${a.count===1?'TIME':'TIMES'}`:'WAITING TO BE EARNED'}</p><h2>${esc(a.name)}</h2><p class="stone-description">“${esc(a.description)}”</p><section class="stone-path"><h3>How to earn</h3><p>${esc(a.rule)}</p>${a.reset?`<div class="stone-reset">${accountIcon('info')}<span>${esc(a.reset)}</span></div>`:''}</section><section class="stone-progress-section"><div class="stone-progress-title"><h3>${playerName?esc(playerName)+'’s progress':a.count?'Your next stone':'Your progress'}</h3>${a.id!=='whitewash'&&a.target>0?`<span>${a.progress} / ${a.target}</span>`:''}</div>${a.id!=='whitewash'&&a.target>0?`<div class="account-progress" role="progressbar" aria-label="${esc(a.name)} progress" aria-valuemin="0" aria-valuemax="${a.target}" aria-valuenow="${Math.min(a.progress,a.target)}"><span style="width:${progress}%"></span></div>`:''}<p>${esc(a.progressText)}</p>${pathDetails}${a.conditions?.length?`<ul class="stone-checklist">${a.conditions.map(c=>`<li class="${c.met?'is-met':''}"><span>${accountIcon(c.met?'check':'lock')}</span><span>${esc(c.label)}</span><b>${esc(c.value??'')}</b></li>`).join('')}</ul>`:''}${a.opponentProgress?.length?`<div class="stone-rivals">${a.opponentProgress.slice().sort((x,y)=>y.progress-x.progress).slice(0,5).map(p=>`<div><span>${esc(p.name||person(p.opponentId))}</span><b>${p.progress} / ${p.target}</b></div>`).join('')}</div>`:''}</section>${a.occurrences.length?`<section class="stone-history"><h3>Earned moments</h3>${a.occurrences.slice().reverse().slice(0,5).map(o=>o.ticketId?`<button data-action="openTicket" data-id="${esc(o.ticketId)}"><span><strong>${esc(o.opponentId?'Against '+person(o.opponentId):'Verified match')}</strong><small>Played ${esc(date(o.at))}</small></span>${accountIcon('chevron')}</button>`:`<div><strong>Week of ${esc(date(o.weekKey+'T00:00:00+05:30'))}</strong><small>Closed ${esc(date(o.at))}</small></div>`).join('')}</section>`:''}<p class="stone-verification">${accountIcon('check')}Verified results only${group?' · '+esc(group.name):''}</p></div><button type="button" class="btn ghost" data-action="closeDialog">Got it</button>`;
}
function statsContent(stats){
  return `<div class="account-section-heading"><h3>Recent form</h3><span>Last ${stats.recent.length} verified</span></div>${stats.recent.length?`<div class="account-form-results">${stats.recent.map(m=>`<div class="account-result result-${m.result.toLowerCase()}" aria-label="${m.result==='W'?'Won':m.result==='L'?'Lost':'Draw'}, ${m.own} to ${m.opponent}"><strong>${m.result}</strong><small>${m.own}–${m.opponent}</small></div>`).join('')}</div>`:'<p class="account-empty">Your first agreed match starts your story.</p>'}<div class="account-detail-stats"><div><span>Best win streak</span><strong>${stats.bestStreak}</strong></div><div><span>Average score</span><strong>${stats.averageScore}</strong></div><div><span>Losses</span><strong>${stats.losses}</strong></div><div><span>Draws</span><strong>${stats.draws}</strong></div></div>`;
}

export function renderAccountPage({profile,user,group,members=[],tickets=[],tab='achievements',backendEnabled=true,online=true,unread=false,dialog='',viewerUid=user?.uid}){
  const isOwn=viewerUid===user.uid;
  const scopedTickets=tickets.filter(t=>(!group?.id||t.groupId===group.id)&&(!t.sportId||t.sportId==='table-tennis'));
  const stats=summarizeProfile(scopedTickets,user.uid),achievements=accountAchievements({tickets:scopedTickets,uid:user.uid,groupId:group?.id,members}),name=profile.displayName||'Player';
  const character=avatarFor(profile.avatarId),artRatio=((512-character.artBounds[1])/512*character.artScale).toFixed(5);
  const activeTab=tab==='stats'?'stats':'achievements';
  return `<div class="account-page">${renderLeagueHeader({title:isOwn?'Profile':'Player profile',back:!isOwn,group:backendEnabled?group:null,unread})}<main class="account-body" aria-label="Welcome, ${esc(name)}">
    <section class="account-hero" style="--profile-art-ratio:${artRatio}" aria-label="${isOwn?'Your player':esc(name)}">${isOwn?`<button class="account-character" data-action="editProfile" aria-label="Change character">${characterCard(character.id)}<span class="account-avatar-edit">${accountIcon('pencil')}</span></button>`:`<div class="account-character is-readonly">${characterCard(character.id)}</div>`}<div class="account-identity"><h2 title="${esc(name)}">${esc(name)}</h2><div class="account-character-meta"><button class="account-character-badge" data-action="characterInfo" data-character-id="${character.id}" aria-label="About ${esc(character.name)}" aria-expanded="false"><span class="account-character-badge-surface"><span>${esc(character.name)}</span>${accountIcon('info')}</span></button><div id="characterTooltip" class="account-character-tooltip" role="tooltip" aria-live="polite" aria-atomic="true" hidden>“${esc(character.description)}”</div></div><div class="account-level-meta"><strong>Level ${stats.level}</strong><span>${stats.xp} XP</span></div><div class="account-progress" role="progressbar" aria-label="Level progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${stats.levelProgress}"><span style="width:${stats.levelProgress}%"></span></div><p class="account-progress-caption">${stats.toNext} XP to level ${stats.level+1}</p></div></section>
    <section class="account-highlights" aria-label="Match statistics">${[[stats.played,'Total matches','matches-played',`${stats.played} verified matches`],[stats.played?stats.winRate+'%':'—','Win ratio','win-ratio','Wins ÷ total verified matches'],[stats.pdRatio===null?'—':stats.pdRatio===Infinity?'∞':stats.pdRatio.toFixed(2),'P/D ratio','pd-ratio',`Points scored ÷ points conceded · ${stats.pointsScored} ÷ ${stats.pointsConceded}. Higher means you score more while conceding fewer.`]].map(([value,label,icon,hint])=>`<div class="account-highlight" title="${esc(hint)}"><img src="/assets/stats/${icon}.png" width="44" height="44" alt=""><div><strong>${value}</strong><small>${label}</small></div></div>`).join('')}</section>
    <p class="account-scope">${group?'All-time verified matches':'Your verified match stats appear here'}${online?'':' · Offline'}</p>
    <div class="account-tabs" role="tablist" aria-label="Profile sections">${[['stats',isOwn?'My stats':'Stats'],['achievements','Achievements']].map(([value,label])=>`<button id="account-tab-${value}" role="tab" aria-selected="${activeTab===value}" aria-controls="account-tab-panel" tabindex="${activeTab===value?0:-1}" data-action="profileTab" data-value="${value}">${label}</button>`).join('')}</div>
    <section id="account-tab-panel" role="tabpanel" aria-labelledby="account-tab-${activeTab}">${activeTab==='achievements'?achievementsContent(achievements,isOwn):levelRail(stats)+statsContent(stats)}</section>
    ${isOwn&&backendEnabled&&group?`<button class="account-group-row" data-action="accountInvite"><span class="league-group-avatars" aria-hidden="true">${members.length?members.slice(0,3).map(m=>playerAvatar(m.id===user.uid?profile.avatarId:m.avatarId)).join(''):`<span class="league-group-symbol">${esc(groupInitials(group.name))}</span>`}</span><span class="account-group-copy"><strong>${esc(group.name)}</strong><small>${members.length?`${members.length} ${members.length===1?'player':'players'} · `:''}Invite friends</small></span><span class="account-group-invite" aria-hidden="true">${accountIcon('share')}</span></button>`:''}
    <p class="account-fine-print">${group?'Stats and achievements are for this group. ':''}Every 100 verified XP adds a level.</p>
    ${isOwn?`<button class="account-sign-out" data-action="logout">Sign out</button>`:`<div class="player-profile-actions"><button class="btn secondary" data-action="openMatchup" data-id="${esc(user.uid)}">Your matchup</button><button class="btn" data-action="recordOpponent" data-id="${esc(user.uid)}">Record match</button></div>`}
    </main>${backendEnabled?renderLeagueNavigation(isOwn?'profile':''):''}</div>${dialog}`;
}
