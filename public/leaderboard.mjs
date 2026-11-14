import {characterCard,playerAvatar,profileAvatar} from './avatars.mjs';
import {accountIcon,renderLeagueHeader,renderLeagueNavigation} from './account.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const count=value=>Number(value||0).toLocaleString('en-IN');

function podiumPlayer(player){
  if(!player)return '<div class="leaderboard-podium-space" aria-hidden="true"></div>';
  return `<div class="leaderboard-podium-player podium-place-${player.rank}" aria-label="Rank ${player.rank}, ${esc(player.name)}, ${count(player.score)} points">
    <div class="leaderboard-podium-art">${profileAvatar(player.id,player.avatarId,player.name,true)}<span class="leaderboard-place">${player.rank===1?accountIcon('trophy'):player.rank}</span></div>
    <button class="leaderboard-profile-name" data-action="openPlayer" data-id="${esc(player.id)}"><strong title="${esc(player.name)}">${esc(player.name)}</strong></button><span class="leaderboard-podium-xp">${count(player.score)} <small>Points</small></span>
    <div class="leaderboard-podium-step" aria-hidden="true"><span>${String(player.rank).padStart(2,'0')}</span></div>
  </div>`;
}

export function renderLeaderboardPage({scores=[],members=[],user,profile={},group={},period='weekly',online=true,queue=[],unread=false,dialog=''}){
  const activePeriod=period==='monthly'?'monthly':'weekly',memberById=new Map(members.map(m=>[m.id,m]));
  const players=scores.map((score,i)=>{const member=memberById.get(score.id)||{},isYou=score.id===user?.uid;return {...score,rank:score.rank||i+1,isYou,name:(isYou?profile.displayName:null)||member.displayName||'Player',avatarId:isYou?profile.avatarId:member.avatarId};});
  const leaders=players.filter(p=>p.score>0).slice(0,3),own=players.find(p=>p.isYou);
  const waiting=queue.filter(job=>job.status!=='blocked').length,blocked=queue.length-waiting;
  return `<div class="account-page leaderboard-page">${renderLeagueHeader({title:'Leaderboard',group,unread})}
    <main class="account-body leaderboard-body" aria-label="${esc(group.name||'Group')} leaderboard">
      ${online?'':'<p class="leaderboard-status" role="status">Offline · Showing saved standings</p>'}
      ${queue.length?`<button class="leaderboard-outbox" data-action="outbox">${waiting?`${waiting} waiting to sync`:''}${waiting&&blocked?' · ':''}${blocked?`${blocked} need review`:''}<span>Review ${accountIcon('chevron')}</span></button>`:''}
      <div class="leaderboard-periods" role="tablist" aria-label="Ranking period">${[['weekly','Week'],['monthly','Month']].map(([value,label])=>`<button id="leaderboard-tab-${value}" role="tab" aria-selected="${activePeriod===value}" aria-controls="leaderboard-panel" tabindex="${activePeriod===value?0:-1}" data-action="period" data-value="${value}">${label}</button>`).join('')}</div>
      <section id="leaderboard-panel" role="tabpanel" aria-labelledby="leaderboard-tab-${activePeriod}">
        ${leaders.length?`<section class="leaderboard-podium" aria-label="Top players">${[leaders[1],leaders[0],leaders[2]].map(podiumPlayer).join('')}</section>`:`<section class="leaderboard-empty">${accountIcon('trophy')}<h2>Your next match starts here.</h2><p>${players.length<2?"Waiting for opponents. Invite a coworker to play.":"Agree on a score. Make your mark."}</p>${players.length<2?'<button class="leaderboard-text-button" data-action="accountInvite">Invite a friend '+accountIcon('chevron')+'</button>':''}</section>`}
        ${own?`<section class="leaderboard-your-position" aria-label="Your position">${profileAvatar(own.id,own.avatarId,own.name)}<div><span>Your position</span><strong>#${own.rank} <small>of ${players.length}</small></strong></div><p><strong>${count(own.score)}</strong><span>Points</span></p></section>`:''}
        <div class="leaderboard-list-heading"><h2>All players <span>${count(players.length)}</span></h2><span>Points</span></div>
        <ol class="leaderboard-list" aria-label="Player rankings">${players.map(p=>`<li class="leaderboard-row ${p.isYou?'is-you':''}" aria-label="Rank ${p.rank}, ${esc(p.name)}${p.isYou?', you':''}, ${count(p.score)} points"><span class="leaderboard-row-rank" aria-hidden="true">${p.rank}</span>${profileAvatar(p.id,p.avatarId,p.name)}<div class="leaderboard-row-player"><div><button class="leaderboard-profile-name" data-action="openPlayer" data-id="${esc(p.id)}"><strong title="${esc(p.name)}">${esc(p.name)}</strong></button>${p.isYou?'<span class="leaderboard-you">You</span>':''}</div><small>${count(p.wins)}–${count(p.losses??p.played-p.wins)} W–L${p.draws?` · ${count(p.draws)} drawn`:""}</small></div><strong class="leaderboard-row-score">${count(p.score)}</strong></li>`).join('')}</ol>
        ${players.length?'':'<p class="leaderboard-no-players">Players will appear when they join your group.</p>'}
      </section>
      <details class="leaderboard-rules"><summary>How rankings work</summary><p>A win earns 3 points. Losses and draws earn 0. Every match is ranked, with no match limit. Only results agreed by both players count. Equal points share a rank.</p><p>Weeks start on Monday. Seasons use the match submission date in Asia/Kolkata, so a later confirmation can update an earlier period.</p></details>
    </main><button class="leaderboard-fab" data-action="newMatch" aria-label="Record a match" title="Tap to record · Hold for recent opponents" aria-keyshortcuts="Shift+Enter">${accountIcon('plus')}</button>${renderLeagueNavigation('leaderboard')}</div>${dialog}`;
}
