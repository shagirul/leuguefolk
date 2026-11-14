import {eligibleScoreRequests} from './bulk-accept.mjs';
import {playerAvatar,profileAvatar} from './avatars.mjs';
import {accountIcon} from './account.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time=value=>+(value?.toDate?.()||new Date(value||0));
const date=value=>time(value)?new Date(time(value)).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'Just now';
export function matchNeedsYou(t,uid){return t.status==='open'?(t.cancellation?.turn||t.turn)===uid:t.status==='finalized'&&t.amendment?.turn===uid;}
export function matchIsSent(t,uid){
  if(!uid||![t.playerA,t.playerB].includes(uid)||matchNeedsYou(t,uid))return false;
  if(t.status==='cancelled')return t.createdBy===uid||t.playerA===uid;
  if(t.status==='finalized')return t.amendment?.by===uid;
  return t.status==='open'&&(t.cancellation?t.cancellation.by===uid:t.proposal?.by===uid);
}
export function matchLabel(t){
  if(t.status==='cancelled')return ['Cancelled','muted'];
  if(t.status==='finalized')return t.amendment?['Change pending','amber']:['Verified','green'];
  if(t.cancellation)return ['Cancel requested','amber'];
  if(t.disputed)return ['Disputed','red'];
  return t.revision>1?['Correction proposed','purple']:['Awaiting review','amber'];
}
const status=t=>{const [label,tone]=matchLabel(t);return `<span class="activity-status is-${tone}">${esc(label)}</span>`;};
function identities(members,profile,user){const byId=new Map(members.map(m=>[m.id,m]));return id=>id===user?.uid?{...byId.get(id),...profile,displayName:profile.displayName||byId.get(id)?.displayName||'You'}:byId.get(id)||{displayName:'Player'};}
const empty=(icon,title,body)=>`<section class="activity-empty">${accountIcon(icon)}<h2>${title}</h2><p>${body}</p></section>`;

export function matchTimeLabel(value,now=new Date()){
  const stamp=time(value);if(!stamp||!Number.isFinite(stamp))return '';
  const d=new Date(stamp),calendar=v=>Date.UTC(v.getFullYear(),v.getMonth(),v.getDate()),days=Math.round((calendar(now)-calendar(d))/86400000);
  if(days===0)return d.toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
  if(days===1)return 'Yesterday';
  if(days>1&&days<7)return d.toLocaleDateString('en-IN',{weekday:'long'});
  return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',...(d.getFullYear()!==now.getFullYear()?{year:'numeric'}:{})});
}
export function renderMatchesContent({tickets=[],members=[],profile={},user,queue=[],tab='requests',now=new Date(),bulkBusy=false}){
  const person=identities(members,profile,user),actionCount=tickets.filter(t=>matchNeedsYou(t,user?.uid)).length;
  const matches=tickets.filter(t=>tab==='requests'?matchNeedsYou(t,user?.uid):tab==='verified'?t.status==='finalized':matchIsSent(t,user?.uid)).sort((a,b)=>time(b.updatedAt||b.createdAt)-time(a.updatedAt||a.createdAt));
  const queued=tab==='sent'?queue.filter(q=>q.kind==='submitMatch'&&!tickets.some(t=>t.id===q.id)):[];
  const eligible=eligibleScoreRequests(tickets,user?.uid,queue);
  const stamp=value=>`<time class="match-chat-time" title="${esc(date(value))}" ${time(value)?`datetime="${new Date(time(value)).toISOString()}"`:''}>${esc(matchTimeLabel(value,now))}</time>`;
  return `<section class="activity-matches"><div class="activity-tabs" role="tablist" aria-label="Match filters">${[['sent','Sent'],['requests','Requests'],['verified','Verified']].map(([value,label])=>`<button id="match-tab-${value}" role="tab" aria-selected="${tab===value}" aria-controls="match-list" tabindex="${tab===value?0:-1}" data-action="matchTab" data-value="${value}">${label}${value==='requests'&&actionCount?`<span>${actionCount}</span>`:''}</button>`).join('')}</div>
  ${tab==='requests'?`<div class="match-request-toolbar"><span>${actionCount} ${actionCount===1?'request':'requests'}</span><button type="button" data-action="acceptAll" ${!eligible.length||bulkBusy?'disabled':''}>${bulkBusy?'Accepting…':'Accept all'}</button></div>`:''}
  <div id="match-list" role="tabpanel" aria-labelledby="match-tab-${tab}" class="activity-list match-chat-list">${queued.map(q=>`<div class="activity-match chat-match queued-chat">${profileAvatar(q.payload.opponentUid,person(q.payload.opponentUid).avatarId,person(q.payload.opponentUid).displayName)}<button class="match-chat-open" data-action="outbox"><span class="match-chat-copy"><span class="match-chat-top"><strong>${esc(person(q.payload.opponentUid).displayName)}</strong>${stamp(q.createdAt)}</span><span class="match-chat-preview is-pending"><strong>${esc(q.payload.scoreSelf)}–${esc(q.payload.scoreOpponent)}</strong><small>${q.status==='blocked'?'Needs review':'Queued — waiting for connection'}</small></span></span></button></div>`).join('')}
  ${matches.map(t=>{
    const involved=[t.playerA,t.playerB].includes(user?.uid),left=involved?user.uid:t.playerA,right=involved?(t.playerA===user.uid?t.playerB:t.playerA):t.playerB;
    const first=person(left),second=person(right),score=t.finalScore||t.proposal?.score,a=left===t.playerA?score?.a:score?.b,b=right===t.playerB?score?.b:score?.a,turn=matchNeedsYou(t,user?.uid),at=t.updatedAt||t.createdAt;
    const verified=t.status==='finalized',result=verified&&involved?(a>b?'win':a<b?'loss':'draw'):'pending';
    const localPending=queue.some(q=>q.payload?.ticketId===t.id&&q.status!=='blocked');
    const subtitle=localPending?'Queued':t.status==='cancelled'?'Cancelled':verified?(involved?(result==='win'?'Won':result==='loss'?'Lost':'Draw'):'Final score'):turn?'Your turn':'Waiting';
    const name=involved?second.displayName:first.displayName+' · '+second.displayName;
    return `<div class="match-swipe-row"><button class="match-swipe-action" type="button" data-action="recordOpponent" data-id="${esc(right)}" aria-label="Record match with ${esc(second.displayName)}" tabindex="-1" title="Record match with ${esc(second.displayName)}">${accountIcon('plus')}<span>Match</span></button><div class="activity-match chat-match" tabindex="-1"><button type="button" class="activity-match-avatar player-profile-link" data-action="openPlayer" data-id="${esc(right)}" aria-label="View ${esc(second.displayName)}’s profile">${playerAvatar(second.avatarId)}</button><button class="match-chat-open" data-action="openTicket" data-id="${esc(t.id)}" aria-label="${esc(involved?'You':first.displayName)} ${esc(a??'—')}, ${esc(second.displayName)} ${esc(b??'—')}, ${esc(matchLabel(t)[0])}${turn?', your turn':''}" aria-description="Swipe left or press Arrow Left to record another match with ${esc(second.displayName)}"><span class="match-chat-copy"><span class="match-chat-top"><strong>${esc(name)}</strong>${stamp(at)}</span><span class="match-chat-preview is-${result}"><strong>${esc(a??'—')}–${esc(b??'—')}</strong><small>${subtitle}</small></span></span></button></div></div>`;
  }).join('')}${!matches.length&&!queued.length?empty('activity',tab==='requests'?'All caught up.':tab==='verified'?'No verified games yet.':'No sent requests yet.',tab==='requests'?'New score requests will appear here.':'Play a game, then agree on the score.'):''}</div></section><button class="leaderboard-fab" data-action="newMatch" aria-label="Record a match" title="Tap to record · Hold for recent opponents" aria-keyshortcuts="Shift+Enter">${accountIcon('plus')}</button>`;
}

export function mountMatchSwipes(root){
  root.querySelectorAll?.('.match-swipe-row').forEach(wrapper=>{
    const row=wrapper.querySelector('.chat-match'),action=wrapper.querySelector('.match-swipe-action');let drag=null,suppressUntil=0;
    const setOpen=open=>{wrapper.classList.toggle('is-open',open);wrapper.classList.remove('is-swiping');wrapper.style.removeProperty('--swipe-x');action.tabIndex=open?0:-1;};
    const release=()=>{if(drag&&row.hasPointerCapture?.(drag.id))row.releasePointerCapture(drag.id);drag=null;};
    row.addEventListener('pointerdown',event=>{if(event.button!==0||event.isPrimary===false)return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,start:wrapper.classList.contains('is-open')?-76:0,moved:false,offset:0};});
    row.addEventListener('pointermove',event=>{
      if(!drag||drag.id!==event.pointerId)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.moved){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){release();return;}if(Math.abs(dx)<8)return;drag.moved=true;row.setPointerCapture?.(event.pointerId);wrapper.classList.add('is-swiping');}
      event.preventDefault();drag.offset=Math.max(-76,Math.min(0,drag.start+dx));wrapper.style.setProperty('--swipe-x',drag.offset+'px');
    },{passive:false});
    row.addEventListener('pointerup',event=>{if(!drag||drag.id!==event.pointerId)return;if(drag.moved){suppressUntil=Date.now()+300;setOpen(drag.offset<-32);}release();});
    row.addEventListener('pointercancel',()=>{if(drag?.moved){suppressUntil=Date.now()+300;setOpen(drag.start<0);}release();});
    row.addEventListener('click',event=>{if(Date.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},true);
    row.addEventListener('contextmenu',event=>{event.preventDefault();setOpen(true);action.focus();});
    wrapper.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();setOpen(true);action.focus();}else if(['ArrowRight','Escape'].includes(event.key)){event.preventDefault();setOpen(false);row.focus();}});
  });
}

export function renderInboxContent({notifications=[],tickets=[],members=[],profile={},user,group,groups=[]}){
  const person=identities(members,profile,user),unread=notifications.filter(n=>!n.readAt).length;
  return `<section class="activity-inbox"><div class="activity-section-heading"><h2>Your updates</h2><span>${unread?`${unread} unread`:'All read'}</span></div><div class="activity-list">${notifications.slice().sort((a,b)=>time(b.createdAt)-time(a.createdAt)).map(n=>{
    const t=n.groupId===group?.id?tickets.find(t=>t.id===n.ticketId):null,opponent=t?person(t.playerA===user?.uid?t.playerB:t.playerA):null;
    const action=t&&matchNeedsYou(t,user?.uid),current=t?matchLabel(t)[0]:null;
    const title=t?(action?'Score needs your review':t.amendment?'Change pending':t.status==='finalized'?'Score verified':t.status==='cancelled'?'Match cancelled':current):'Match update';
    const score=t?.finalScore||t?.proposal?.score,groupName=groups.find(g=>g.groupId===n.groupId)?.name;
    return `<div class="activity-update ${n.readAt?'':'is-unread'}" ${opponent?`data-has-profile="true"`:""} data-id="${esc(n.id)}" aria-label="${esc(title)}${opponent?', '+esc(opponent.displayName):''}${n.readAt?'':', unread'}">${opponent?`<button type="button" class="activity-update-avatar player-profile-link" data-action="openPlayer" data-id="${esc(t.playerA===user.uid?t.playerB:t.playerA)}" aria-label="View ${esc(opponent.displayName)}’s profile">${playerAvatar(opponent.avatarId)}${n.readAt?'':'<i aria-hidden="true"></i>'}</button>`:`<span class="activity-update-avatar"><span class="activity-row-icon">${accountIcon('bell')}</span></span>`}<button class="match-chat-open" data-action="openNotification" data-id="${esc(n.id)}"><span class="activity-row-copy"><strong>${esc(title)}</strong><span>${opponent?`vs ${esc(opponent.displayName)}${score?` · You ${esc(t.playerA===user.uid?score.a:score.b)}–${esc(t.playerA===user.uid?score.b:score.a)}`:''}`:esc(groupName||'Open the latest match')}</span><small>${date(n.createdAt)}${groupName&&n.groupId!==group?.id?' · '+esc(groupName):''}</small></span>${accountIcon('chevron')}</button></div>`;
  }).join('')}${notifications.length?'':empty('bell','You’re all caught up.','Score requests and match updates will appear here.')}</div></section>`;
}
