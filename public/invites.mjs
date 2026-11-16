import {avatarFor,playerAvatar} from './avatars.mjs';
import {accountIcon,renderLeagueHeader} from './account.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const normalizeInvite=value=>{const code=String(value||'').replace(/\s/g,'').toUpperCase();return /^[A-Z2-9]{8}$/.test(code)?code:null;};
const storageKey='leaguefolk-pending-invite-v1';
export function inviteFromLocation(location){
  const match=String(location.pathname||'').match(/^\/invite\/([^/]+)\/?$/i);
  return normalizeInvite(match?.[1]||new URLSearchParams(location.search||'').get('invite'));
}
// The URL is a fallback when storage is blocked. Auth/profile renders never consume an invite.
export function createInviteIntentStore(storage,location){
  let pending=null;
  try{const saved=JSON.parse(storage?.getItem(storageKey)||'null');if(normalizeInvite(saved?.code))pending={code:normalizeInvite(saved.code)};else if(saved?.invalid)pending={invalid:true};}catch{}
  const set=code=>{const valid=normalizeInvite(code);if(!valid)return null;pending={code:valid};try{storage?.setItem(storageKey,JSON.stringify(pending));}catch{}return pending;};
  const capture=next=>{const code=inviteFromLocation(next);if(code)return set(code);if(/^\/invite(?:\/|$)/i.test(next.pathname||'')||new URLSearchParams(next.search||'').has('invite')){pending={invalid:true};try{storage?.setItem(storageKey,JSON.stringify(pending));}catch{}}return pending;};
  capture(location);
  return {get:()=>pending,set,capture,clear(){const resolved=pending;pending=null;try{const saved=JSON.parse(storage?.getItem(storageKey)||'null');if(saved?.code===resolved?.code&&!!saved?.invalid===!!resolved?.invalid)storage?.removeItem(storageKey);}catch{}},path(path){
    if(!pending)return path;
    const url=new URL(path,'https://leaguefolk.invalid');if(!pending.invalid&&url.pathname===`/invite/${pending.code}`)return url.pathname+url.search+url.hash;url.searchParams.set('invite',pending.code||'invalid');return url.pathname+url.search+url.hash;
  }};
}
export function groupInviteUrl(origin,code){const valid=normalizeInvite(code);if(!valid)throw new Error('This group does not have a valid invitation.');return `${origin}/invite/${valid}`;}

export function renderGroupTiles(groups,tiles={},activeId=null){
  return `<div class="league-group-options">${groups.map(g=>{
    const players=(tiles[g.groupId]?.members||[]).slice(0,3),selected=g.groupId===activeId;
    return `<div class="league-group-row ${selected?'is-selected':''}"><button class="league-group-option" data-action="switchGroup" data-id="${esc(g.groupId)}" aria-current="${selected}" title="${esc(g.name)}"><span class="league-group-avatars" aria-hidden="true">${players.length?players.map(p=>playerAvatar(p.avatarId)).join(''):accountIcon('group')}</span><strong>${esc(g.name)}</strong></button><button class="league-group-share" data-action="shareGroupInvite" data-id="${esc(g.groupId)}" aria-label="Share invitation to ${esc(g.name)}" title="Share invitation">${accountIcon('share')}</button></div>`;
  }).join('')}</div>`;
}

export function renderInvitePage({invite,profile={},loading=false,busy=false,error='',online=true}){
  const players=(invite?.players||[]).slice(0,20);
  return `<div class="account-page invite-page">${renderLeagueHeader({title:'Invitation'})}<main class="account-body invite-body"><section class="invite-card" aria-busy="${loading||busy}">
    ${loading?'<div class="invite-loading" role="status"><span></span>Opening invitation…</div>':invite?`
      ${players.length?`<div class="invite-roster-heading"><h2>Club players</h2><span>Verified history</span></div><ol class="invite-player-grid" aria-label="Top group players">${players.map((p,i)=>`<li aria-label="${i+1}. ${esc(p.displayName)}, ${Number(p.wins||0)} verified wins">${playerAvatar(p.avatarId)}<span title="${esc(p.displayName)}">${esc(p.displayName)}</span></li>`).join('')}</ol>`:''}
      <span class="invite-group-mark">${accountIcon('group')}</span><h1>${invite.alreadyMember?'You’re already in':`Join`} <span>${esc(invite.name)}${invite.alreadyMember?'':'?'}</span></h1>
      <p class="invite-description">${invite.alreadyMember?'Your group is ready.':'Your next match starts here.'}</p>
      `:`<span class="invite-group-mark">${accountIcon('group')}</span><h1>Group invitation</h1>`}
    ${error?`<p class="invite-error" role="alert">${esc(error)}</p>`:''}
    ${!online?'<p class="invite-error" role="status">Reconnect to open this invitation.</p>':''}
    <div class="invite-actions"><button class="btn secondary" data-action="declineInvite" ${busy?'disabled':''}>Decline</button>${invite?`<button class="btn" data-action="acceptInvite" ${busy||!online?'disabled':''}>${busy?'Joining…':invite.alreadyMember?'Open group':'Join group'}</button>`:`<button class="btn" data-action="retryInvite" ${loading||!online?'disabled':''}>Try again</button>`}</div>
    ${profile?.username?`<p class="invite-account"><span>@${esc(profile.username)}</span><button data-action="logout" ${busy?'disabled':''}>Switch account</button></p>`:''}
  </section></main></div>`;
}

export function verifiedContribution(ticket,uid){
  if(ticket?.status!=='finalized'||!ticket.finalScore||![ticket.playerA,ticket.playerB].includes(uid))return {xp:0,played:0,wins:0};
  const own=ticket.playerA===uid?ticket.finalScore.a:ticket.finalScore.b,other=ticket.playerA===uid?ticket.finalScore.b:ticket.finalScore.a;
  return {xp:0,played:1,wins:own>other?1:0};
}

// Shared by the one-time Admin migration and its tests. No client may write an arbitrary balance.
export function buildGroupPreview(members,tickets){
  const players=new Map(members.map(member=>[member.id,{id:member.id,displayName:member.displayName,avatarId:avatarFor(member.avatarId).id,xp:0,played:0,wins:0}]));
  for(const ticket of tickets){
    if(ticket.status!=='finalized'||!players.has(ticket.playerA)||!players.has(ticket.playerB))continue;
    if(ticket.playerA===ticket.playerB||![ticket.finalScore?.a,ticket.finalScore?.b].every(score=>Number.isInteger(score)&&score>=0&&score<=200))throw new Error('Invalid verified match: '+ticket.id);
    for(const uid of [ticket.playerA,ticket.playerB]){const contribution=verifiedContribution(ticket,uid),player=players.get(uid);for(const key of ['xp','played','wins'])player[key]+=contribution[key];}
  }
  return [...players.values()];
}
