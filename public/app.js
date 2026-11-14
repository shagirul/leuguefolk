import {renderMatchups,matchupStats,matchupGoal} from '/matchups.mjs';
import {buildAcceptancePlan,queueAcceptancePlan} from '/bulk-accept.mjs';
import {renderMatchesContent,renderInboxContent,matchNeedsYou,mountMatchSwipes} from '/activity.mjs';
import {suggestedOpponents,standardGameScore,renderMatchComposer,mountMatchComposer,bindQuickOpponents} from '/record-match.mjs';
import {replayOutbox} from '/outbox.mjs';
import {competitionStandings,competitionPoints} from '/domain.mjs';
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,connectAuthEmulator,GoogleAuthProvider,signInWithPopup,createUserWithEmailAndPassword,signInWithEmailAndPassword,sendPasswordResetEmail,signOut,onAuthStateChanged,updateProfile} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,connectFirestoreEmulator,doc,collection,onSnapshot,getDoc,getDocs,updateDoc,runTransaction,serverTimestamp,increment,query,orderBy,limit,initializeFirestore,persistentLocalCache,persistentMultipleTabManager} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import {createFirestoreApi} from '/firestore-api.mjs';
import {renderAccountPage,renderLeagueHeader,renderLeagueNavigation,summarizeProfile,accountAchievements,renderAchievementDetail,accountIcon,createCharacterTooltipController,bindScrollHeader} from '/account.mjs';
import {renderLeaderboardPage} from '/leaderboard.mjs';
import {createInviteIntentStore,normalizeInvite,groupInviteUrl,renderGroupTiles,renderInvitePage} from '/invites.mjs';
import {avatarFor,validAvatar,randomAvatar,playerAvatar,profileAvatar,avatarPicker,updateAvatarPicker,stepAvatarPicker,bindAvatarGestures} from '/avatars.mjs';
import {getMessaging,getToken,deleteToken,onMessage,isSupported} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js';
import {enqueue,forUser,patchAction,deleteAction} from '/queue.js';
const root=document.getElementById('app');
const scrollHeader=bindScrollHeader(root);
const characterTooltip=createCharacterTooltipController(document,{setTimer:setTimeout,clearTimer:clearTimeout});
const settings=self.AGREE_FIREBASE||{};
const backendEnabled=settings.features?.leaderboards!==false;
const pushEnabled=false; // No push sender is deployed on the Spark plan.
const ready=!!settings.firebaseConfig?.apiKey&&!settings.firebaseConfig.apiKey.startsWith('PASTE')&&!!settings.firebaseConfig.appId&&!settings.firebaseConfig.appId.startsWith('PASTE');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=s=>String(s??'').slice(0,100);
const uid=()=>crypto.randomUUID();
function readLocal(key){try{return globalThis.localStorage?.getItem(key)||null;}catch{return null;}}
function writeLocal(key,value){try{globalThis.localStorage?.setItem(key,value);}catch{}}
function removeLocal(key){try{globalThis.localStorage?.removeItem(key);}catch{}}
const inviteIntent=createInviteIntentStore({getItem:readLocal,setItem:writeLocal,removeItem:removeLocal},location);
const state={user:null,profile:null,memberships:[],groupTiles:{},pendingInvite:inviteIntent.get(),invite:null,inviteLoading:false,inviteBusy:false,inviteError:'',groupId:null,group:null,members:[],tickets:[],notifications:[],ticketEvents:[],queue:[],online:navigator.onLine,route:parsePath(),period:'weekly',matchupTab:'yours',matchTab:'requests',bulkAcceptBusy:false,profileTab:'achievements',dialog:null,draft:{},authMode:'welcome',authEmail:'',avatarId:randomAvatar().id,authBusy:false,notice:null,loadError:'',authLoading:true,groupLoading:false,showGroupPicker:false,initialized:false};
let closeQuickOpponents=()=>{},bulkAcceptVersion=0;
const unsub={};let firebaseApp,auth,store,firestoreApi,messaging=null,swReg=null,flushBusy=false,toastTimeout,lastPushSync=0;
let groupLoadTimer=null,groupListenerVersion=0;
let inviteLoadVersion=0;
function when(value){return value?.toDate?value.toDate():(value?new Date(value):null);}
function dateShort(value){const d=when(value);return d&&!Number.isNaN(+d)?d.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'Just now';}
function parsePath(){const p=String(location.pathname||'');const match=p.match(/^\/g\/([a-f0-9-]{36})(?:\/(t\/([a-f0-9-]{36})|matchups(?:\/([^/]+))?|players\/([^/]+)|matches|leaderboard|inbox|profile|new))?\/?$/i);if(!match)return {groupId:null,view:'leaderboard'};let playerId,opponentId;try{playerId=match[5]?decodeURIComponent(match[5]):null;}catch{}try{opponentId=match[4]?decodeURIComponent(match[4]):null;}catch{}return {groupId:match[1],view:match[2]?.startsWith('players/')?'player':match[3]?'ticket':match[2]?.startsWith('matchups')?'matchups':match[2]||'leaderboard',ticketId:match[3],opponentId,playerId};}
function periodKeys(date){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));const t=new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day));t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7);return {weekKey:t.toISOString().slice(0,10),monthKey:`${parts.year}-${parts.month}`};}
const userName=userId=>state.members.find(m=>m.id===userId)?.displayName||((state.user?.uid===userId)?(state.profile?.displayName||'You'):'Player');
const userAvatar=userId=>userId===state.user?.uid?state.profile?.avatarId:state.members.find(m=>m.id===userId)?.avatarId;
const other=t=>t.playerA===state.user?.uid?t.playerB:t.playerA;
const myGroup=()=>state.memberships.some(g=>g.groupId===state.groupId);
function navigate(path,replace=false){scrollHeader.reset();closeQuickOpponents();characterTooltip.hide({immediate:true});if(replace)history.replaceState({},'',inviteIntent.path(path));else history.pushState({},'',inviteIntent.path(path));state.showGroupPicker=false;state.route=parsePath();state.dialog=null;state.draft={};ensureRoute();render();root.scrollTo?.({top:0,behavior:'instant'});window.scrollTo({top:0,behavior:'instant'});}
function go(view){navigate(`/g/${state.groupId}/${view}`);}
function badge(text,tone='purple'){return `<span class="badge ${tone}">${esc(text)}</span>`;}
function toast(text,path=null,duration=5000){const t=document.getElementById('toast');t.textContent=path?text+' · Tap to open':text;t.onclick=path&&/^\/g\/[a-f\d-]{36}\//i.test(path)?()=>navigate(path):null;t.style.cursor=t.onclick?'pointer':'default';t.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>t.classList.remove('show'),duration);}
function errText(e){const v=String(e?.message||e||'Unexpected error').replace(/^Firebase:\s*/, '').replace(/\s*\(functions\/[\w-]+\)\.?/g,'').replace(/\s*\(auth\/[\w-]+\)\.?/g,'');return v.slice(0,240);}
function authErrorText(error){
  const messages={
    'auth/invalid-credential':'Email or password is incorrect. New here? Choose Create account. Joined with Google? Use Continue with Google.',
    'auth/user-not-found':'No account was found for this email. Choose Create account to register.',
    'auth/wrong-password':'Incorrect password. Please try again.',
    'auth/invalid-email':'Enter a valid email address.',
    'auth/email-already-in-use':'An account already uses this email. Sign in instead, or use Continue with Google if that is how you joined.',
    'auth/weak-password':'Choose a stronger password with at least 6 characters.',
    'auth/password-does-not-meet-requirements':'This password does not meet the account password requirements. Choose a stronger password.',
    'auth/operation-not-allowed':'Email/password sign-in is unavailable. Try Continue with Google.',
    'auth/too-many-requests':'Too many sign-in attempts. Wait a while before trying again.',
    'auth/network-request-failed':'Could not reach the sign-in service. Check your internet connection and try again.',
    'auth/user-disabled':'This account has been disabled. Contact the app owner.'
  };
  return messages[error?.code]||`${errText(error)}${error?.code?' ('+error.code+')':''}`;
}
function showAuthError(message){if(message)toast(message,null,8000);else{document.getElementById('toast').classList.remove('show');clearTimeout(toastTimeout);}}
function note(tone,body){return `<div class="notice ${tone}">${body}</div>`;}
function icon(s){return `<span aria-hidden="true">${s}</span>`;}
function button(label,action,kind='',attrs=''){return `<button type="button" class="btn ${kind}" data-action="${esc(action)}" ${attrs}>${label}</button>`;}
function subscribed(key,subscribe){unsub[key]?.();unsub[key]=subscribe;}
function unsubscribeAll(){Object.keys(unsub).forEach(k=>{unsub[k]?.();delete unsub[k];});}
function stopGroupListeners(){
  clearTimeout(groupLoadTimer);groupLoadTimer=null;groupListenerVersion++;state.groupLoading=false;
  ['group','members','tickets','events'].forEach(k=>{unsub[k]?.();delete unsub[k];});state.group=null;state.members=[];state.tickets=[];state.ticketEvents=[];
}
function groupPath(view='leaderboard'){return `/g/${state.groupId}/${view}`;}
function shell(title,content,active='leaderboard',back=false){
  const unread=state.notifications.some(n=>!n.readAt);
  const queueCount=state.queue.filter(q=>q.status==='queued').length,blocked=state.queue.filter(q=>q.status==='blocked').length;
  return `<div class="account-page activity-page">
    ${renderLeagueHeader({title,group:state.group,back,unread,inboxActive:active==='inbox'})}
    ${!state.online?`<div class="offline-strip">Offline · Matches are saved locally and sent when you reopen online</div>`:''}
    ${(queueCount||blocked)?`<div class="queue-strip"><span>↗ ${queueCount} queued — waiting for connection${blocked?` · ${blocked} needs review`:''}</span><button data-action="outbox">View outbox</button></div>`:''}
    <main class="account-body activity-body">${content}</main>
    ${renderLeagueNavigation(active)}</div>${state.dialog?modal():''}`;
}
function statFor(period){return competitionStandings(state.members,state.tickets,period);}
function leaderboardScreen(){return renderLeaderboardPage({scores:statFor(state.period),members:state.members,user:state.user,profile:state.profile,group:state.group,period:state.period,online:state.online,queue:state.queue,unread:state.notifications.some(n=>!n.readAt),dialog:state.dialog?modal():''});}
function status(t){if(t.status==='cancelled')return badge('Cancelled','red');if(t.status==='finalized')return t.amendment?badge('Change pending','amber'):badge('Verified','green');if(t.cancellation)return badge('Cancel requested','amber');if(t.disputed)return badge('Disputed','red');if(t.revision>1)return badge('Correction proposed','purple');return badge('Awaiting review','amber');}
function ticketsContent(){return renderMatchesContent({tickets:state.tickets,members:state.members,profile:state.profile,user:state.user,queue:state.queue,tab:state.matchTab,bulkBusy:state.bulkAcceptBusy});}
function needsMe(t){return matchNeedsYou(t,state.user?.uid);}
function scoreView(t,score){return `<div class="score-panel activity-score-panel"><div class="score-side"><span class="activity-score-avatar">${profileAvatar(t.playerA,userAvatar(t.playerA),userName(t.playerA))}</span><div class="score-number">${esc(score?.a??'—')}</div><div class="score-label">${esc(userName(t.playerA))}</div></div><div class="score-divider">–</div><div class="score-side"><span class="activity-score-avatar">${profileAvatar(t.playerB,userAvatar(t.playerB),userName(t.playerB))}</span><div class="score-number">${esc(score?.b??'—')}</div><div class="score-label">${esc(userName(t.playerB))}</div></div></div>`;}
function ticketContent(t){if(!t)return `${note('error','This match is not available. You may be offline without a cached copy, or the link may be incorrect.')}${button('Back to matches','matches','secondary')}`;
  const waiting=t.cancellation?.turn||t.amendment?.turn||t.turn;const myTurn=waiting===state.user.uid;
  const name=userName(other(t));
  const score=t.finalScore||t.proposal?.score;
  const pendingLocal=state.queue.find(q=>q.payload?.ticketId===t.id&&q.status!=='blocked');
  let body=`<div class="activity-ticket-meta"><span>${dateShort(t.createdAt)}</span>${status(t)}</div><div class="match-review-card">${scoreView(t,score)}<div class="small quiet text-center">${t.status==='finalized'?'Both agreed • Official result':t.status==='cancelled'?'Match cancelled':`Last proposed by ${esc(userName(t.proposal.by))}`}</div></div>`;
  if(pendingLocal)body+=note('warn','Your last action is queued on this device. Its result will appear after the server confirms it. You cannot submit another response until then.');
  if(t.status==='open'&&!pendingLocal){
    if(t.cancellation){body+=note('warn',`${esc(userName(t.cancellation.by))} requested to cancel this match.${t.cancellation.note?' Reason: '+esc(t.cancellation.note):''}`);
      body+=myTurn?`${button('Agree to cancel','acceptCancel')}${button('Keep this match open','declineCancel','outline')}`:note('','Waiting for the other player to respond to cancellation.');
    }else if(myTurn){body+=note('','Check both scores carefully. Approving makes this result official. A win earns 3 league points.');
      body+=`${button('✓ Confirm this score','confirm')}${button('Suggest a different score','suggest','secondary')}${button('Disagree / discuss','dispute','outline')}`;
    }else{body+=note('warn',`Waiting for <strong>${esc(userName(t.turn))}</strong> to review this score. They can confirm or propose a correction.`);
      if(t.playerA===state.user.uid&&t.revision===1)body+=button('Edit my original submission','editOriginal','secondary');
    }
    if(!t.cancellation){
      if(t.playerA===state.user.uid && t.revision===1)body+=`<div style="margin-top:8px">${button('Withdraw unanswered submission','withdrawOriginal','ghost')}</div>`;
      else body+=`<div style="margin-top:8px">${button('Request mutual cancellation','requestCancel','ghost')}</div>`;
    }
  }
  if(t.status==='finalized'){
    body+=`<div class="soft-card"><div class="row between"><span class="member-name">League points</span>${badge('Verified','green')}</div><div class="stat-row" style="margin-top:12px"><div class="stat"><big>+${competitionPoints(t,t.playerA)}</big><small>${esc(userName(t.playerA))}</small></div><div class="stat"><big>+${competitionPoints(t,t.playerB)}</big><small>${esc(userName(t.playerB))}</small></div></div></div>`;
    if([t.playerA,t.playerB].includes(state.user.uid)){
      const matchup=matchupStats(state.tickets,state.user.uid,other(t),state.groupId);
      const milestone=matchup.history.find(m=>m.result==='W')?.id===t.id?'First verified win against '+name:matchup.last?.id===t.id&&matchup.streak>=2?matchup.streak+' consecutive '+(matchup.streakResult==='W'?'wins':'losses')+' in this matchup':'';
      body+=`<div class="matchup-ticket-update"><span>Lifetime head-to-head</span><strong>${matchup.wins}–${matchup.losses} vs ${esc(name)}</strong>${milestone?`<small>${esc(milestone)}</small>`:''}<button data-action="openMatchup" data-id="${esc(other(t))}">View matchup →</button></div>`;
    }
    if(t.amendment){body+=note('warn',`${esc(userName(t.amendment.by))} requested ${t.amendment.kind==='void'?'to void this verified match':'a score correction'}. The original result continues to count until you both agree.`);
      if(t.amendment.kind==='score')body+=`<div class="soft-card"><div class="small quiet">Proposed replacement</div>${scoreView(t,t.amendment.score)}${t.amendment.note?`<div class="small quiet">“${esc(t.amendment.note)}”</div>`:''}</div>`;
      if(myTurn&&!pendingLocal)body+=`${button(t.amendment.kind==='void'?'Agree to void match':'Accept new verified score','acceptAmendment')}${t.amendment.kind==='score'?button('Counter with another score','counterAmendment','secondary'):''}${button('Decline change (keep original)','declineAmendment','outline')}`;
      else if(!pendingLocal)body+=note('','Waiting for the other player to review the proposed change.');
    }else if(!pendingLocal)body+=`${button('Propose a verified score change','amend','secondary')}${button('Request mutual void','voidMatch','ghost')}`;
  }
  if(t.status==='cancelled')body+=note('good','Cancelled by mutual agreement. No league points are counted for this match.');
  body+=`<div class="section-heading"><h2>Activity</h2><small>Permanent record</small></div><div class="timeline">${state.ticketEvents.length?state.ticketEvents.map(e=>`<div class="timeline-item"><strong>${esc(eventTitle(e.kind))}</strong><div class="muted">${esc(userName(e.actor))} · ${dateShort(e.at)}</div>${e.score?`<div class="small" style="margin-top:5px;font-weight:750">${e.score.a} – ${e.score.b}</div>`:''}${e.note?`<div class="small quiet" style="margin-top:5px">“${esc(e.note)}”</div>`:''}</div>`).join(''):`<div class="quiet small">Activity loads when online or previously cached.</div>`}</div>`;
  return body;
}
function eventTitle(s){return ({submitted:'Score submitted',withdrawOriginal:'Submission withdrawn',confirm:'Score verified',propose:'New score proposed',editOriginal:'Original score edited',requestCancel:'Cancellation requested',respondCancel:'Cancellation answered',startAmendment:'Verified result change requested',counterAmendment:'Counter-proposal sent',respondAmendment:'Change request answered'})[s]||s;}
function opponentFavorites(){try{const saved=JSON.parse(readLocal('leaguefolk-favorites:'+state.user?.uid+':'+state.groupId)||'[]');return Array.isArray(saved)?saved.filter(id=>typeof id==='string'):[];}catch{return [];}}
function recordOpponents(){return suggestedOpponents(state.members,state.tickets,state.user?.uid,{favorites:opponentFavorites()});}
function openRecordMatch(id){const opponent=state.members.find(m=>m.id===id&&m.id!==state.user?.uid);go('new');if(opponent){state.draft.opponentUid=opponent.id;render();}}
function newMatchContent(){return renderMatchComposer({opponents:recordOpponents(),profile:state.profile,draft:state.draft,online:state.online});}
function matchupSeen(){try{const data=JSON.parse(readLocal('leaguefolk-matchups:'+state.user?.uid+':'+state.groupId)||'{}');return data&&typeof data==='object'?data:{};}catch{return {};}}
function matchupContent(){
 const seen=matchupSeen(),id=state.route.opponentId;
 const html=renderMatchups({members:state.members,tickets:state.tickets,user:state.user,profile:state.profile,group:state.group,tab:state.matchupTab,opponentId:id,seen});
 if(id&&id!==state.user.uid){seen[id]=matchupStats(state.tickets,state.user.uid,id,state.groupId).fingerprint;writeLocal('leaguefolk-matchups:'+state.user.uid+':'+state.groupId,JSON.stringify(seen));}
 return html;
}
function inboxContent(){return renderInboxContent({notifications:state.notifications,tickets:state.tickets,members:state.members,profile:state.profile,user:state.user,group:state.group,groups:state.memberships});}
function scoreFields(t,mode){const base=mode==='amend'||mode==='counterAmendment'?t.amendment?.score||t.finalScore:t.proposal.score;
  return `<div class="soft-card"><div class="score-panel"><div class="score-side"><input type="number" name="scoreA" min="0" max="200" step="1" required class="input score-input" value="${esc(state.draft.scoreA??base?.a??0)}" aria-label="Score for ${esc(userName(t.playerA))}"/><div class="score-label">${esc(userName(t.playerA))}</div></div><div class="score-divider">–</div><div class="score-side"><input type="number" name="scoreB" min="0" max="200" step="1" required class="input score-input" value="${esc(state.draft.scoreB??base?.b??0)}" aria-label="Score for ${esc(userName(t.playerB))}"/><div class="score-label">${esc(userName(t.playerB))}</div></div></div></div>`;
}
function modal(){const d=state.dialog||{},t=state.tickets.find(t=>t.id===d.ticketId),kind=d.kind;
  const close=`<button type="button" class="btn ghost" data-action="closeDialog">Close</button>`;
  let inner='';
  if(kind==='groupSwitch')inner=`<h2>Your groups</h2>${renderGroupTiles(state.memberships,state.groupTiles,state.groupId)}${button('+ Create a group','openCreateGroup','secondary')}${button('Join with invite code','openJoinGroup','outline')}${close}`;
  if(kind==='accountSettings')inner=`<h2>Account settings</h2><p class="account-settings-meta">${esc(state.profile.displayName)}<br>${esc(state.user.email)}</p>${button('Change character','editProfile','secondary')}${backendEnabled?button('Switch group','groupSwitch','outline'):''}${button('Sign out','logout','ghost')}${close}`;
  if(kind==='accountInvite')inner=`<h2>Invite your friends</h2><p>Join ${esc(state.group?.name||'your group')} with this code.</p><div class="copy-code"><span>${esc(state.group?.inviteCode||'')}</span><button class="link-btn" data-action="copyInvite">Copy</button></div>${button('Share invitation','shareInvite','secondary')}${button('Switch group','groupSwitch','outline')}${close}`;
  if(kind==='accountAchievement'){
    const achievement=currentAchievements().find(a=>a.id===d.achievementId);
    if(achievement)inner=renderAchievementDetail(achievement,{members:state.members,group:state.group,playerName:state.route.view==='player'?userName(state.route.playerId):null});
  }
  if(kind==='editProfile')inner=`<form id="profileForm" class="account-character-editor"><h2>Choose your character</h2><input type="hidden" name="displayName" value="${esc(state.profile.displayName)}"/>${avatarPicker(state.avatarId)}<button class="btn" type="submit">Save</button></form>${close}`;
  if(kind==='createGroup')inner=`<h2>Create a group</h2><p>Everyone has equal rights. The first player only creates the invitation code.</p><form id="createGroupForm"><div class="field"><label>Group name</label><input class="input" name="name" maxlength="52" minlength="2" required placeholder="Friday Badminton"/></div><button class="btn" type="submit">Create group</button></form>${close}`;
  if(kind==='joinGroup')inner=`<h2>Join a leaderboard</h2><p>Ask a group member for their invitation code.</p><form id="joinGroupForm"><div class="field"><label>Invite code</label><input class="input" name="code" minlength="8" maxlength="8" autocapitalize="characters" required placeholder="ABCD23EF"/></div><button class="btn" type="submit">Join group</button></form>${close}`;
  if(kind==='outbox')inner=`<h2>Offline outbox</h2><p>Actions wait safely on this device. They only affect real scores after the server accepts them.</p>${state.queue.length?state.queue.map(q=>`<div class="soft-card"><div class="row between"><strong class="small">${esc(q.kind==='submitMatch'?'New match':eventTitle(q.payload?.kind||q.kind))}</strong>${badge(q.status==='blocked'?'Needs review':q.status==='queued'?'Queued':'Sending',q.status==='blocked'?'red':'amber')}</div><div class="small quiet" style="margin:8px 0">${q.status==='blocked'?esc(q.error||'Review current match state.'):q.status==='queued'?'Will send when this app reconnects.':'Sending…'}</div><div class="button-grid">${q.payload?.ticketId?button('Open match','outboxMatch','secondary',`data-id="${esc(q.payload.ticketId)}"`):'<span></span>'}${button('Discard','discardJob','outline',`data-id="${esc(q.id)}"`)}</div></div>`).join(''):`${note('good','Your outbox is empty.')}`}${button('Try sending now','flushNow','secondary')}${close}`;
  if(['suggest','dispute','editOriginal','amend','counterAmendment'].includes(kind)&&t){
    const heading={suggest:'Suggest a correction',dispute:'Discuss a disagreement',editOriginal:'Edit your submission',amend:'Change verified score',counterAmendment:'Counter the correction'}[kind];
    inner=`<h2>${heading}</h2><p>The other player must accept the exact score before anything is finalized.</p><form id="scoreForm">${scoreFields(t,kind)}
      <div class="field"><label>Message (optional)</label><textarea class="input" rows="2" name="note" maxlength="280" placeholder="Explain the change briefly…">${esc(state.draft.note||'')}</textarea></div>
      ${kind==='dispute'?note('warn','This flags the match as disputed. There is no admin and no forced outcome; the other person can agree or counter.'):''}
      <button class="btn" type="submit">${kind==='editOriginal'?'Save and notify opponent':kind==='amend'?'Request both-player approval':'Send score proposal'}</button></form>${close}`;
  }
  if(['requestCancel','voidMatch'].includes(kind)&&t){inner=`<h2>${kind==='voidMatch'?'Request to void verified match':'Request to cancel match'}</h2><p>This does not delete a result immediately. The other player must agree. If they decline, the current state stays in place.</p><form id="cancelForm"><div class="field"><label>Reason (optional)</label><textarea name="note" class="input" rows="2" maxlength="280" placeholder="Why cancel?">${esc(state.draft.note||'')}</textarea></div><button class="btn danger" type="submit">Send mutual cancellation request</button></form>${close}`;}
  if(kind==='acceptAll'){
    const plan=d.plan;
    inner=`<h2>Accept ${plan.items.length} scores?</h2><p>Confirm these exact scores. Changed requests will stay for review.${state.online?'':' Confirmations will queue until you reconnect.'}</p><ul class="bulk-score-review">${plan.items.map(item=>{const opponent=item.playerA===plan.uid?item.playerB:item.playerA,own=item.playerA===plan.uid?item.score.a:item.score.b,otherScore=item.playerA===plan.uid?item.score.b:item.score.a;return `<li>${playerAvatar(userAvatar(opponent))}<span><strong>${esc(userName(opponent))}</strong><small>You · Opponent</small></span><b>${own}<i>–</i>${otherScore}</b></li>`;}).join('')}</ul>${state.tickets.filter(needsMe).length>plan.items.length?'<p class="bulk-review-note">Cancellations, disputes and verified-score changes are reviewed individually.</p>':''}${button(state.bulkAcceptBusy?'Accepting…':'Accept '+plan.items.length+' scores','commitAcceptAll','',state.bulkAcceptBusy?'disabled':'')}${button('Cancel','closeDialog','ghost',state.bulkAcceptBusy?'disabled':'')}`;
  }
  if(kind==='confirmAction'&&t){inner=`<h2>Confirm this match?</h2><p>A verified win earns 3 points. ${state.online?"This score counts after the server confirms it.":"Your confirmation will be queued until you reconnect."}</p>${scoreView(t,t.proposal.score)}${button('Confirm exact score','commitConfirm')}${close}`;}
  if(kind==='enablePush')inner=`<h2>Turn on notifications</h2><p>Only enable if you want match requests and upcoming group updates delivered to this device. Tapping any match notification opens its exact match.</p>${button('Enable notifications','commitPush')}${close}`;
  return `<div class="modal-backdrop" data-action="backdrop"><section class="modal league-dialog ${['accountSettings','accountInvite','accountAchievement','editProfile','groupSwitch'].includes(kind)?'account-dialog':''}" role="dialog" aria-modal="true" aria-label="${esc(({acceptAll:'Accept scores',accountSettings:'Account settings',accountInvite:'Invite friends',accountAchievement:'Achievement details',editProfile:'Change character',groupSwitch:'Choose a group'})[kind]||kind)}"><button type="button" class="modal-handle" data-action="closeDialog" aria-label="Close drawer; drag down to dismiss" ${state.bulkAcceptBusy?'disabled':''}><span></span></button>${inner}</section></div>`;
}
function bindDrawerGestures(target,onDismiss){
  let drag=null,suppressClick=false;
  const reset=()=>{if(!drag)return;drag.sheet.classList.remove('is-dragging');drag.sheet.style.removeProperty('--drawer-y');drag=null;};
  target.addEventListener('pointerdown',e=>{
    const handle=e.target.closest?.('.modal-handle');if(!handle||handle.disabled||e.button!==0)return;
    const sheet=handle.closest('.modal');if(!sheet)return;
    suppressClick=false;drag={sheet,handle,id:e.pointerId,y:e.clientY,lastY:e.clientY,time:e.timeStamp,lastTime:e.timeStamp,velocity:0,distance:0};
    handle.setPointerCapture?.(e.pointerId);sheet.classList.add('is-dragging');
  });
  target.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    if(!drag.sheet.isConnected){reset();return;}
    const dt=e.timeStamp-drag.lastTime;if(dt>0)drag.velocity=(e.clientY-drag.lastY)/dt;
    drag.lastY=e.clientY;drag.lastTime=e.timeStamp;drag.distance=Math.max(0,e.clientY-drag.y);
    drag.sheet.style.setProperty('--drawer-y',drag.distance+'px');if(drag.distance>3)e.preventDefault();
  },{passive:false});
  target.addEventListener('pointerup',e=>{
    if(!drag||drag.id!==e.pointerId)return;
    const {sheet,distance,velocity,lastTime}=drag,threshold=Math.min(120,Math.max(64,sheet.getBoundingClientRect().height*.22));
    suppressClick=distance>5;reset();
    if(distance>=threshold||(distance>24&&velocity>.65&&e.timeStamp-lastTime<100)){
      sheet.classList.add('is-closing');setTimeout(()=>{if(sheet.isConnected)onDismiss(sheet);},180);
    }
  });
  target.addEventListener('pointercancel',()=>{suppressClick=!!drag&&drag.distance>5;reset();});
  target.addEventListener('lostpointercapture',()=>{if(drag)reset();});
  target.addEventListener('click',e=>{if(suppressClick){suppressClick=false;if(e.target.closest?.('.modal-handle')){e.preventDefault();e.stopImmediatePropagation();}}},true);
}
function render(){
  if(!ready){root.innerHTML=`<div class="auth-wrap"><div class="auth-card"><img class="logo-mark" src="/icons/icon-192x192.png" width="66" height="66" alt="" /><h1>Connect your Firebase app</h1><p>This PWA is intentionally not connected to anyone else's project.</p>${note('warn','Edit <strong>public/firebase-config.js</strong> and add your web app config and public VAPID key. Follow README.md to enable Firebase services and deploy.')}</div></div>`;return;}
  if(state.authLoading){root.innerHTML=`<div class="loading"><img class="logo-mark" src="/icons/icon-192x192.png" width="66" height="66" alt="" /><h1>Leaguefolk</h1><p>Loading your account…</p></div>`;return;}
  if(!state.user){root.innerHTML=authScreen();return;}
  if(!state.profile?.username||!validAvatar(state.profile.avatarId)){root.innerHTML=profileSetup();return;}
  if(!backendEnabled){root.innerHTML=accountScreen();characterTooltip.sync();return;}
  if(state.pendingInvite){root.innerHTML=inviteScreen();return;}
  if(state.showGroupPicker||!state.groupId||!myGroup()){root.innerHTML=groupsScreen();return;}
  if(!state.group){root.innerHTML=groupStatusScreen();return;}
  const v=state.route.view;
  const match=state.tickets.find(t=>t.id===state.route.ticketId);
  let content='',active=v,title='Leaderboard',back=false;
  if(v==='leaderboard'){root.innerHTML=leaderboardScreen();return;}
  else if(v==='matchups'){title=state.route.opponentId?'Matchup':'Matchups';content=matchupContent();active='matchups';back=!!state.route.opponentId;}
  else if(v==='matches'){title='Matches';content=ticketsContent();}
  else if(v==='new'){title='Record match';content=newMatchContent();active='matches';back=true;}
  else if(v==='ticket'){title='Match details';content=ticketContent(match);active='matches';back=true;}
  else if(v==='inbox'){title='Inbox';content=inboxContent();}
  else if(v==='profile'||v==='player'){root.innerHTML=accountScreen();characterTooltip.sync();return;}
  else {root.innerHTML=leaderboardScreen();return;}
  root.innerHTML=shell(title,content,active,back);
  if(v==='new')mountMatchComposer(root,value=>{state.draft.losingScore=String(value);});
  if(v==='matches')mountMatchSwipes(root);
}
function groupStatusScreen(){
  const title=state.groupLoading?'Loading group…':'Group unavailable';
  const message=state.groupLoading?'Getting the latest matches…':state.loadError||'Choose another group or try loading this group again.';
  return onboardingShell(`<section class="auth-panel"><h1>${title}</h1><p class="auth-description" role="status">${esc(message)}</p>${!state.groupLoading?button('Try again','retryGroup'):''}${button('Choose another group','showGroups','secondary')}</section>`);
}
function authScreen(){
  const mode=state.authMode,create=mode==='signup',reset=mode==='reset',sent=mode==='resetSent',welcome=mode==='welcome',disabled=state.authBusy?'disabled':'';
  const google=`<button type="button" class="btn auth-google" data-action="googleSignIn" ${disabled}><span class="auth-button-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z"/></svg></span><span class="auth-button-label">${state.authBusy==='google'?'Connecting to Google…':'Continue with Google'}</span></button>`;
  const emailField=`<div class="field"><label for="authEmail">Email address</label><input id="authEmail" class="input" type="email" name="email" value="${esc(state.authEmail)}" required autocomplete="email" inputmode="email" autocapitalize="none" spellcheck="false" placeholder="you@example.com"/></div>`;
  let content;
  if(welcome)content=`<section class="auth-welcome" aria-labelledby="welcomeTitle"><div class="auth-welcome-hero"><h1 id="welcomeTitle" class="onboarding-brand">Leaguefolk</h1></div><div class="auth-entry" aria-busy="${!!state.authBusy}">${google}<button type="button" class="btn auth-email" data-action="emailSignIn" ${disabled}><span class="auth-button-icon" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg></span><span class="auth-button-label">Continue with Email</span></button></div></section>`;
  else {
    const title=sent?'Check your inbox':reset?'Forgot password?':create?'Create your account':'Sign in with email';
    const description=sent?`If an account uses <strong>${esc(state.authEmail)}</strong>, a reset link is on its way. Check your spam folder too.`:reset?'We’ll email you a link to reset your password.':'';
    const passwordField=`<div class="field"><label for="authPassword">Password</label><input id="authPassword" class="input" type="password" name="password" ${create?'minlength="6"':''} required autocomplete="${create?'new-password':'current-password'}" placeholder="${create?'At least 6 characters':'Enter your password'}"/></div>`;
    const accountLinks=create?`<p class="auth-switch">Already have an account? <button type="button" class="link-btn" data-action="switchAuth" ${disabled}>Sign in</button></p>`:`<div class="auth-login-links"><button type="button" class="link-btn" data-action="switchAuth" ${disabled}>Create account</button><button type="button" class="link-btn" data-action="forgotPassword" ${disabled}>Forgot password?</button></div>`;
    content=`<section class="auth-panel auth-${mode}" aria-labelledby="authTitle" aria-busy="${!!state.authBusy}"><div class="auth-heading"><h1 id="authTitle" tabindex="-1">${title}</h1>${description?`<p class="auth-description">${description}</p>`:''}</div>${sent?`${button('Back to sign in','emailSignIn','',disabled)}<button type="button" class="link-btn auth-resend" data-action="forgotPassword" ${disabled}>Resend or try another email</button>`:`<form id="authForm">${emailField}${reset?'':passwordField}<button class="btn" type="submit" ${disabled}>${reset?'Send reset link':create?'Create account':'Sign in'}</button></form>${reset?'':`${accountLinks}<div class="auth-divider"><span>or</span></div>${google}`}`}</section>`;
  }
  return onboardingShell(content,welcome,'',welcome?null:{action:reset||sent?'emailSignIn':'authWelcome',label:reset||sent?'Back to sign in':'All sign-in options',disabled});
}
function onboardingShell(content,welcome=false,variant='',back=null){return `<main class="onboarding ${welcome?'is-welcome':'is-form'} ${variant}"><div class="onboarding-background" aria-hidden="true"></div>${welcome?'':`<header class="onboarding-header">${back?`<button type="button" class="account-icon-button auth-back" data-action="${esc(back.action)}" aria-label="${esc(back.label)}" ${back.disabled||''}>${accountIcon('chevron')}</button>`:'<span class="auth-header-spacer" aria-hidden="true"></span>'}<div class="onboarding-brand">Leaguefolk</div><span class="auth-header-spacer" aria-hidden="true"></span></header>`}<div class="onboarding-body">${content}</div></main>`;}
function changeAuthMode(mode){
  if(state.authBusy)return;
  state.authMode=mode;showAuthError('');render();
  focusAuthTitle();
}
function focusAuthTitle(){root.scrollTop=0;document.getElementById('authTitle')?.focus?.({preventScroll:true});}
async function signInWithGoogle(){
  if(state.authBusy)return;
  if(!state.online){toast('Connect to the internet to sign in with Google.');return;}
  showAuthError('');state.authBusy='google';render();
  try{
    const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
    await signInWithPopup(auth,provider);
  }catch(e){
    if(['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(e.code))return;
    const messages={
      'auth/popup-blocked':'Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again, or sign in with email.',
      'auth/operation-not-allowed':'Google sign-in is not available yet. Please sign in with email and password.',
      'auth/unauthorized-domain':'Google sign-in is not available on this website yet. Please sign in with email and password.',
      'auth/account-exists-with-different-credential':'An account already exists with this email. Sign in with your email and password.'
    };
    showAuthError(messages[e.code]||authErrorText(e));
  }finally{state.authBusy=false;render();}
}
function profileFields(){
  const suggested=(state.profile?.displayName||state.user?.displayName||'').replace(/[^A-Za-z0-9_]/g,'').slice(0,24);
  return `<div class="field"><label for="onboardingName">Username</label><input id="onboardingName" class="input" name="displayName" minlength="3" maxlength="24" pattern="[A-Za-z0-9_]{3,24}" title="Use 3–24 letters, numbers or underscores." required placeholder="Your username" autocomplete="username" value="${esc(suggested)}" ${state.profile?.username?'readonly':''}/></div>${avatarPicker(state.avatarId)}`;
}
function profileSetup(){const returning=!!state.profile?.username;return onboardingShell(`<section class="auth-panel player-setup" aria-labelledby="playerTitle"><header class="player-heading"><h1 id="playerTitle">${returning?'Choose your<br><span>character.</span>':'Choose your name<br><span>& character.</span>'}</h1></header><form id="profileForm">${returning?`<input type="hidden" name="displayName" value="${esc(state.profile.displayName)}"/>${avatarPicker(state.avatarId)}`:profileFields()}<button class="btn" type="submit">Continue</button></form></section>`,false,'is-player',{action:'logout',label:'Use a different account'});}
function currentAchievements(){return accountAchievements({tickets:state.tickets,uid:state.route.view==='player'?state.route.playerId:state.user.uid,groupId:state.groupId,members:state.members});}
function accountScreen(){const target=state.route.view==='player'?state.members.find(m=>m.id===state.route.playerId):null;if(state.route.view==='player'&&!target)return shell('Player profile','<div class="activity-empty"><h2>Player unavailable</h2><p>This player is not a current member of this group.</p></div>','',true);return renderAccountPage({viewerUid:state.user.uid,user:target?{uid:target.id}:state.user,profile:target||state.profile,group:state.group,members:state.members,tickets:state.tickets,tab:state.profileTab,backendEnabled,online:state.online,unread:state.notifications.some(n=>!n.readAt),dialog:state.dialog?modal():''});}
function groupsScreen(){return onboardingShell(`<section class="auth-panel"><h1>Choose a leaderboard</h1><p class="auth-description">You need an invitation to compete with friends, or you can start a new group.</p>${renderGroupTiles(state.memberships,state.groupTiles,state.groupId)}${button('+ Create a new group','openCreateGroup')}${button('Join with invitation code','openJoinGroup','secondary')}<div style="margin-top:16px">${button('Sign out','logout','ghost')}</div></section>`)+(state.dialog?modal():'');}
function inviteScreen(){
  if(!state.inviteLoading&&!state.invite&&!state.inviteError&&state.online)loadPendingInvite();
  return renderInvitePage({invite:state.invite,profile:state.profile,loading:state.inviteLoading,busy:state.inviteBusy,error:state.inviteError,online:state.online});
}
async function loadPendingInvite(){
  if(state.pendingInvite?.invalid){state.inviteError='This invitation link is invalid.';return;}
  const code=state.pendingInvite?.code,userId=state.user?.uid;
  if(!code||!userId||!state.profile?.username||!validAvatar(state.profile.avatarId)||!state.online)return;
  const generation=++inviteLoadVersion,active=()=>generation===inviteLoadVersion&&state.user?.uid===userId&&state.pendingInvite?.code===code;
  state.inviteLoading=true;state.inviteError='';render();
  try{
    const index=await getDoc(doc(store,'inviteCodes',code));
    if(!index.exists())throw {code:'not-found'};
    const {groupId,name}=index.data();
    const [players,own]=await Promise.all([getDocs(query(collection(store,'inviteCodes',code,'players'),orderBy('wins','desc'),limit(20))),getDoc(doc(store,'groups',groupId,'members',userId))]);
    if(active())state.invite={code,groupId,name,players:players.docs.map(d=>({id:d.id,...d.data()})),alreadyMember:own.exists()};
  }catch(e){if(active()){state.inviteError=e.code==='not-found'?'This invitation is no longer available.':'Could not open this invitation. Please try again.';console.warn('Invite preview unavailable',e);}}
  finally{if(active()){state.inviteLoading=false;render();}}
}
function clearPendingInvite(){inviteIntent.clear();inviteLoadVersion++;state.pendingInvite=null;state.invite=null;state.inviteLoading=false;state.inviteBusy=false;state.inviteError='';}
function openInvite(code){
  const valid=normalizeInvite(code);if(!valid)throw new Error('Enter a valid 8-character invite code.');
  state.pendingInvite=inviteIntent.set(valid);inviteLoadVersion++;state.invite=null;state.inviteError='';state.inviteLoading=false;state.inviteBusy=false;
  navigate('/invite/'+valid);
}
async function acceptPendingInvite(){
  if(state.inviteBusy||!state.invite||!state.online)return;
  const code=state.pendingInvite.code,userId=state.user.uid,invite=state.invite;
  const active=()=>state.user?.uid===userId&&state.pendingInvite?.code===code;
  state.inviteBusy=true;state.inviteError='';render();
  try{
    const result=invite.alreadyMember?invite:await call('joinGroup',{code});
    if(!active())return;
    if(!state.memberships.some(g=>g.groupId===result.groupId))state.memberships.push({groupId:result.groupId,name:result.name});
    clearPendingInvite();navigate(`/g/${result.groupId}/leaderboard`,true);toast(invite.alreadyMember?'Welcome back.':'You joined '+result.name+'.');
  }catch(e){if(active()){state.inviteError='Could not join the group. Please try again.';console.warn('Joining group failed',e);}}
  finally{if(active()){state.inviteBusy=false;render();}}
}
async function shareGroupInvitation(groupId){
  const userId=state.user?.uid;
  const membership=state.memberships.find(g=>g.groupId===groupId);if(!membership)throw new Error('You can only invite players to your groups.');
  let group=state.group?.id===groupId?state.group:state.groupTiles[groupId]?.group;
  if(!group){const info=await getDoc(doc(store,'groups',groupId));if(!info.exists())throw new Error('This group is unavailable.');group=info.data();}
  if(state.user?.uid!==userId)return;
  const url=groupInviteUrl(location.origin,group.inviteCode),text=`Join ${group.name} on Leaguefolk.`;
  if(navigator.share){try{await navigator.share({title:group.name+' · Leaguefolk',text,url});return;}catch(e){if(e.name==='AbortError')return;if(e.name!=='NotAllowedError')throw e;}}
  await navigator.clipboard.writeText(text+'\n'+url);toast('Invitation link copied.');
}
function syncGroupTiles(){
  const userId=state.user?.uid;if(!userId)return;
  const ids=new Set(state.memberships.map(g=>g.groupId));
  Object.keys(unsub).filter(key=>key.startsWith('tile:')&&!ids.has(key.slice(5))).forEach(key=>{unsub[key]?.();delete unsub[key];delete state.groupTiles[key.slice(5)];});
  for(const {groupId} of state.memberships){
    const key='tile:'+groupId;if(unsub[key])continue;
    const active=()=>state.user?.uid===userId&&state.memberships.some(g=>g.groupId===groupId);
    subscribed(key,onSnapshot(query(collection(store,'groups',groupId,'members'),orderBy('joinedAt'),limit(3)),snap=>{if(active()){state.groupTiles[groupId]={...state.groupTiles[groupId],members:snap.docs.map(d=>({id:d.id,...d.data()}))};render();}},e=>console.warn('Group avatars unavailable',e)));
    getDoc(doc(store,'groups',groupId)).then(snap=>{if(active()&&snap.exists()){state.groupTiles[groupId]={...state.groupTiles[groupId],group:snap.data()};render();}}).catch(e=>console.warn('Group invitation unavailable',e));
  }
}
async function call(name,data){if(!backendEnabled)throw new Error('Group leaderboards and matches are currently unavailable.');return firestoreApi(name,data);}
async function saveUserProfile(displayName,avatarId){const profile=await firestoreApi('saveProfile',{displayName,avatarId:avatarId||state.avatarId});state.avatarId=profile.avatarId;return profile;}
async function saveOutbox(action){await enqueue(action);await refreshOutbox();toast(state.online?'Sending safely…':'Saved offline. Will send when you reopen online.');
  if(state.online)flushOutbox();else if(swReg?.sync)swReg.sync.register('agree-queued-actions').catch(()=>{});
}
async function refreshOutbox(){try{state.queue=state.user?await forUser(state.user.uid):[];render();}catch(e){toast('Offline storage unavailable: '+errText(e));}}
async function flushOutbox(){if(!backendEnabled||flushBusy||!state.user||!state.profile?.username||!validAvatar(state.profile.avatarId)||!state.online)return;flushBusy=true;
  try{await replayOutbox({uid:state.user.uid,currentUid:()=>state.online&&state.user?.uid===auth.currentUser?.uid?state.user?.uid:null,list:forUser,patch:patchAction,send:call,remove:deleteAction,onSent:job=>toast(job.kind==='submitMatch'?'Score sent for confirmation':'Match updated ✓'),onBlocked:()=>toast('A queued action needs your review.')});
  }catch(e){console.warn('Outbox replay failed',e);}
  finally{flushBusy=false;await refreshOutbox();}
}
async function act(kind,t,extra={}){if(!t)return;
  if(state.queue.some(q=>q.payload?.ticketId===t.id&&q.status!=='blocked')){toast('An earlier action for this match is still queued.');return;}
  const payload={groupId:state.groupId,ticketId:t.id,actionId:uid(),kind,expectedVersion:t.version,expectedRevision:t.revision,...extra};
  await saveOutbox({id:payload.actionId,uid:state.user.uid,kind:'mutateTicket',payload});
  state.dialog=null;render();
}
function openAcceptAll(){
  if(state.bulkAcceptBusy)return;
  const plan=buildAcceptancePlan(state.tickets,state.user?.uid,state.groupId,state.queue);
  if(!plan.items.length){toast('No score requests are ready to accept.');return;}
  state.dialog={kind:'acceptAll',plan};render();
}
async function commitAcceptAll(){
  const plan=state.dialog?.kind==='acceptAll'?state.dialog.plan:null;
  if(!plan||state.bulkAcceptBusy)return;
  const operationVersion=++bulkAcceptVersion;state.bulkAcceptBusy=true;render();
  try{
    const result=await queueAcceptancePlan(plan,{currentUid:()=>auth.currentUser?.uid===state.user?.uid?state.user?.uid:null,currentGroupId:()=>state.groupId,getTickets:()=>state.tickets,getQueue:()=>state.queue,enqueue});
    if(state.user?.uid!==plan.uid||state.groupId!==plan.groupId)return;
    state.dialog=null;await refreshOutbox();
    toast(result.queued+' confirmations queued.'+(result.skipped?' '+result.skipped+' changed or need review.':'')+(result.failed?' '+result.failed+' could not be saved.':''));
    if(state.online)flushOutbox();
  }catch(error){toast(errText(error));}
  finally{if(operationVersion===bulkAcceptVersion){state.bulkAcceptBusy=false;render();}}
}
function openDialog(kind,t){characterTooltip.hide({immediate:true});state.dialog={kind,ticketId:t?.id};state.draft={};render();}
async function syncPushToken(){
  if(!pushEnabled)return;
  if(!state.user || !state.online || location.protocol!=='https:' || location.hostname==='localhost')return;
  if(!settings.vapidPublicKey || settings.vapidPublicKey.startsWith('PASTE'))return;
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  if(Date.now()-lastPushSync<3_600_000)return;
  try{
    if(!await isSupported())return;
    messaging=messaging||getMessaging(firebaseApp);
    swReg=swReg||await navigator.serviceWorker.register('/firebase-messaging-sw.js',{scope:'/'});
    const token=await getToken(messaging,{vapidKey:settings.vapidPublicKey,serviceWorkerRegistration:swReg});
    if(!token)return;
    let deviceId=localStorage.getItem('agree-device-id');if(!deviceId){deviceId=uid();localStorage.setItem('agree-device-id',deviceId);}
    await call('registerDevice',{deviceId,token,origin:location.origin});lastPushSync=Date.now();
  }catch(e){console.warn('Push refresh failed',e);}
}
async function enablePush(){
  if(!pushEnabled){toast('Push notifications are currently turned off.');return;}
  if(!('Notification' in window)||!('serviceWorker' in navigator)){toast('This browser does not support web push.');return;}
  if(location.protocol!=='https:' || location.hostname==='localhost'){toast('Real push requires the deployed HTTPS Firebase Hosting URL.');return;}
  if(!settings.vapidPublicKey||settings.vapidPublicKey.startsWith('PASTE')){toast('Add your public VAPID key in firebase-config.js.');return;}
  try{
    // Permission request happens immediately in the user click handler.
    const permission=await Notification.requestPermission();
    if(permission!=='granted'){toast('Permission was not granted. Enable it in browser settings.');return;}
    if(!await isSupported()){toast('Firebase Messaging is not supported in this browser.');return;}
    lastPushSync=0;await syncPushToken();
    if(!lastPushSync){toast('No push token was registered. Check browser support and VAPID settings.');return;}
    state.dialog=null;render();toast('Push enabled. Match notifications will open the right screen.');
  }catch(e){console.error(e);toast('Push setup: '+errText(e));}
}
function ensureRoute(){
  if(!backendEnabled||!state.user||!state.profile?.username||!validAvatar(state.profile.avatarId)||state.showGroupPicker||state.pendingInvite)return;
  const route=state.route;
  if(route.groupId&&state.memberships.some(g=>g.groupId===route.groupId)){
    if(state.groupId!==route.groupId){state.groupId=route.groupId;writeLocal('agree-group',route.groupId);listenGroup();}
    if(route.view==='ticket')listenEvents(route.ticketId);
    return;
  }
  if(route.groupId){state.groupId=null;stopGroupListeners();return;}
  const selected=state.memberships.some(g=>g.groupId===state.groupId)?state.groupId:(state.memberships.find(g=>g.groupId===readLocal('agree-group'))?.groupId||state.memberships[0]?.groupId);
  if(selected&&state.groupId!==selected){state.groupId=selected;writeLocal('agree-group',selected);listenGroup();}
  else if(!selected&&state.groupId){state.groupId=null;stopGroupListeners();}
}
function listenGroup(){
  if(!state.groupId||!store||!state.user)return;
  const id=state.groupId;
  stopGroupListeners();state.loadError='';state.groupLoading=true;
  const generation=groupListenerVersion;
  const active=()=>state.groupId===id&&generation===groupListenerVersion&&!state.showGroupPicker;
  const failGroup=message=>{if(!active())return;stopGroupListeners();state.loadError=message;render();};
  groupLoadTimer=setTimeout(()=>failGroup('This group is taking too long to load. Check your connection and try again.'),12000);
  subscribed('group',onSnapshot(doc(store,'groups',id),snap=>{
    if(!active())return;
    if(!snap.exists()){
      if(snap.metadata?.fromCache&&state.online)return;
      failGroup(state.online?'This group is no longer available. Choose another group or join using an invitation code.':'This group is not available offline. Reconnect and try again.');return;
    }
    clearTimeout(groupLoadTimer);groupLoadTimer=null;state.groupLoading=false;state.loadError='';state.group={id:snap.id,...snap.data()};render();
  },e=>failGroup(e.code==='permission-denied'?'You do not have access to this group. Choose another group or join with an invitation code.':'Could not load this group: '+errText(e))));
  subscribed('members',onSnapshot(collection(store,'groups',id,'members'),snap=>{if(!active())return;state.members=snap.docs.map(d=>({id:d.id,...d.data()}));render();},e=>{if(active())toast(errText(e));}));
  subscribed('tickets',onSnapshot(collection(store,'groups',id,'tickets'),snap=>{if(!active())return;state.tickets=snap.docs.map(d=>({id:d.id,...d.data()}));render();},e=>{if(active())toast(errText(e));}));
  if(state.route.view==='ticket')listenEvents(state.route.ticketId);
}
function listenEvents(ticketId){if(!state.groupId||!ticketId)return;const gid=state.groupId;
  subscribed('events',onSnapshot(collection(store,'groups',gid,'tickets',ticketId,'events'),snap=>{
    if(state.groupId!==gid||state.route.ticketId!==ticketId)return;
    state.ticketEvents=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(when(a.at)||0)-(when(b.at)||0));render();
  },e=>console.warn('Event timeline not available',e)));
}
function listenUser(uidValue){
  subscribed('memberships',onSnapshot(collection(store,'users',uidValue,'memberships'),snap=>{
    state.memberships=snap.docs.map(d=>({id:d.id,...d.data()}));
    syncGroupTiles();
    ensureRoute();render();
  },e=>toast(errText(e))));
  subscribed('notifications',onSnapshot(query(collection(store,'users',uidValue,'notifications'),orderBy('createdAt','desc'),limit(70)),snap=>{
    state.notifications=snap.docs.map(d=>({id:d.id,...d.data()}));render();
  },e=>toast(errText(e))));
}
async function authChanged(user){closeQuickOpponents();bulkAcceptVersion++;state.bulkAcceptBusy=false;state.dialog=null;state.draft={};
  characterTooltip.hide({immediate:true});
  unsubscribeAll();stopGroupListeners();inviteLoadVersion++;state.pendingInvite=inviteIntent.get();state.invite=null;state.inviteLoading=false;state.inviteBusy=false;state.inviteError='';state.groupTiles={};state.user=user;state.showGroupPicker=false;state.groupId=null;state.profile=null;state.memberships=[];state.notifications=[];state.queue=[];
  if(!user){state.avatarId=randomAvatar().id;state.authLoading=false;render();return;}
  try{const profile=await getDoc(doc(store,'users',user.uid));
    if(state.user?.uid!==user.uid)return;
    state.profile=profile.exists()?profile.data():state.profile;state.avatarId=validAvatar(state.profile?.avatarId)?state.profile.avatarId:avatarFor(state.avatarId).id;
    if(backendEnabled&&state.profile?.username&&validAvatar(state.profile.avatarId))listenUser(user.uid);state.authLoading=false;render();if(backendEnabled)await refreshOutbox();if(state.online){flushOutbox();syncPushToken();}}
  catch(e){state.authLoading=false;toast('Profile: '+errText(e));render();}
}
function start(){
  render();
  if(!ready)return;
  firebaseApp=initializeApp(settings.firebaseConfig);
  // Analytics is optional: blocked scripts or unsupported browsers must not prevent sign-in.
  if(settings.firebaseConfig.measurementId){
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js')
      .then(async ({getAnalytics,isSupported})=>{if(await isSupported())getAnalytics(firebaseApp);})
      .catch(e=>console.warn('Analytics unavailable',e));
  }
  auth=getAuth(firebaseApp);
  try{store=initializeFirestore(firebaseApp,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});}
  catch(e){console.warn('Persistent cache unavailable; using memory fallback',e);store=getFirestore(firebaseApp);}
  if(settings.emulators){
    if(!['localhost','127.0.0.1'].includes(location.hostname)||!settings.firebaseConfig.projectId.startsWith('demo-'))throw new Error('Emulator configuration requires a local demo project.');
    connectAuthEmulator(auth,'http://127.0.0.1:9199',{disableWarnings:true});
    connectFirestoreEmulator(store,'127.0.0.1',8180);
  }
  firestoreApi=createFirestoreApi(store,auth,{doc,runTransaction,serverTimestamp,increment,getDocs,collection});
  if(!settings.emulators&&'serviceWorker' in navigator){navigator.serviceWorker.register('/firebase-messaging-sw.js',{scope:'/'}).then(r=>{swReg=r;}).catch(e=>console.warn('PWA worker registration failed',e));
    navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='FLUSH_QUEUE')flushOutbox();});}
  if(pushEnabled)isSupported().then(s=>{if(!s)return; messaging=getMessaging(firebaseApp);onMessage(messaging,payload=>{
    toast(payload.notification?.title||'A match was updated.',payload.data?.path);
  });}).catch(e=>console.warn('FCM not supported',e));
  onAuthStateChanged(auth,authChanged);
}
window.addEventListener('popstate',()=>{const previous=state.pendingInvite?.code;state.pendingInvite=inviteIntent.capture(location);if(previous!==state.pendingInvite?.code){inviteLoadVersion++;state.invite=null;state.inviteLoading=false;state.inviteBusy=false;state.inviteError='';}state.showGroupPicker=false;state.route=parsePath();state.dialog=null;ensureRoute();render();});
window.addEventListener('online',()=>{state.online=true;if(state.pendingInvite&&!state.invite)state.inviteError='';render();flushOutbox();syncPushToken();});
window.addEventListener('offline',()=>{state.online=false;render();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){state.online=navigator.onLine;flushOutbox();syncPushToken();}});
setInterval(()=>{if(state.user&&navigator.onLine){state.online=true;flushOutbox();}},30000);
bindAvatarGestures(document,id=>{state.avatarId=id;});
bindDrawerGestures(document,()=>{if(!state.bulkAcceptBusy){state.dialog=null;render();}});
closeQuickOpponents=bindQuickOpponents(document,{getOpponents:()=>state.user&&state.group?recordOpponents():[],onChoose:id=>openRecordMatch(id)});
// Single delegated interaction layer keeps the markup simple.
document.addEventListener('click',async e=>{
  if(!e.target.closest?.('.account-character-meta'))characterTooltip.hide();
  const b=e.target.closest('[data-action]');if(!b)return;
  const action=b.dataset.action,id=b.dataset.id,t=state.tickets.find(v=>v.id===state.route.ticketId);
  try{
    if(action==='avatarPrevious'||action==='avatarNext'){const picker=b.closest('.character-picker');if(picker&&!picker.disabled)state.avatarId=stepAvatarPicker(picker,action==='avatarNext'?1:-1);}
    else if(action==='accountSettings')openDialog('accountSettings');
    else if(action==='accountInvite')openDialog('accountInvite');
    else if(action==='characterInfo')characterTooltip.toggle(b);
    else if(action==='profileTab'&&['stats','achievements'].includes(b.dataset.value)){state.profileTab=b.dataset.value;render();document.querySelector?.('#account-tab-'+state.profileTab)?.focus?.();}
    else if(action==='accountAchievement'){if(currentAchievements().some(a=>a.id===id)){state.dialog={kind:'accountAchievement',achievementId:id};render();}}
    else if(action==='editProfile'){state.avatarId=avatarFor(state.profile?.avatarId).id;openDialog('editProfile');}
    else if(action==='googleSignIn')await signInWithGoogle();
    else if(action==='retryGroup'){listenGroup();render();}
    else if(action==='showGroups'){state.showGroupPicker=true;state.groupId=null;stopGroupListeners();state.loadError='';history.replaceState({},'',inviteIntent.path('/'));state.route=parsePath();render();}
    else if(action==='openPlayer'){if(!state.members.some(m=>m.id===id)){toast('This player is not in the current group.');return;}state.playerReturnPath=location.pathname;state.profileTab='achievements';navigate('/g/'+state.groupId+'/'+(id===state.user.uid?'profile':'players/'+encodeURIComponent(id)));}
    else if(action==='back'){if(state.dialog){state.dialog=null;render();}else if(state.route.view==='player'){const path=state.playerReturnPath;state.playerReturnPath=null;navigate(path?.startsWith('/g/'+state.groupId+'/')?path:'/g/'+state.groupId+'/leaderboard');}else go(state.route.view==='matchups'?'matchups':'matches');}
    else if(action==='nav')go(b.dataset.view);
    else if(action==='newMatch')openRecordMatch();
    else if(action==='recordOpponent')openRecordMatch(id);
    else if(action==='openMatchup')navigate('/g/'+state.groupId+'/matchups/'+encodeURIComponent(id));
    else if(action==='matchupTab'){state.matchupTab=b.dataset.value==='club'?'club':'yours';render();document.querySelector?.('#matchup-tab-'+state.matchupTab)?.focus?.({preventScroll:true});}
    else if(action==='chooseOpponent'){if(state.members.some(m=>m.id===id&&id!==state.user.uid)){state.draft={opponentUid:id,note:state.draft.note||''};render();}}
    else if(action==='changeOpponent'){delete state.draft.opponentUid;render();}
    else if(action==='favoriteOpponent'){
      const favorites=opponentFavorites(),next=favorites.includes(id)?favorites.filter(v=>v!==id):[...favorites,id];
      writeLocal('leaguefolk-favorites:'+state.user.uid+':'+state.groupId,JSON.stringify(next));render();
    }
    else if(action==='scoreMode'){state.draft.scoreMode=b.dataset.value;render();}
    else if(action==='matches')go('matches');
    else if(action==='openTicket')navigate(`/g/${state.groupId}/t/${id}`);
    else if(action==='openNotification'){
      const n=state.notifications.find(v=>v.id===id);if(n){if(!n.readAt)updateDoc(doc(store,'users',state.user.uid,'notifications',id),{readAt:serverTimestamp()}).catch(()=>{});navigate(n.path);}
    }
    else if(action==='groupSwitch')openDialog('groupSwitch');
    else if(action==='shareGroupInvite')await shareGroupInvitation(id);
    else if(action==='acceptInvite')await acceptPendingInvite();
    else if(action==='declineInvite'&&!state.inviteBusy){clearPendingInvite();navigate('/',true);}
    else if(action==='retryInvite'&&!state.inviteBusy)await loadPendingInvite();
    else if(action==='openCreateGroup')openDialog('createGroup');
    else if(action==='openJoinGroup')openDialog('joinGroup');
    else if(action==='switchGroup'){state.dialog=null;navigate(`/g/${id}/leaderboard`);}
    else if(action==='closeDialog'){state.dialog=null;render();}
    else if(action==='backdrop'&&e.target===b){state.dialog=null;render();}
    else if(action==='period'&&['weekly','monthly'].includes(b.dataset.value)){state.period=b.dataset.value;render();document.querySelector?.('#leaderboard-tab-'+state.period)?.focus?.({preventScroll:true});}
    else if(action==='acceptAll')openAcceptAll();
    else if(action==='commitAcceptAll')await commitAcceptAll();
    else if(action==='matchTab'){state.matchTab=b.dataset.value;render();document.querySelector?.('#match-tab-'+state.matchTab)?.focus?.({preventScroll:true});}
    else if(action==='confirm')openDialog('confirmAction',t);
    else if(action==='commitConfirm'){await act('confirm',t);}
    else if(['suggest','dispute','editOriginal','amend','counterAmendment'].includes(action))openDialog(action,t);
    else if(action==='requestCancel'||action==='voidMatch')openDialog(action,t);
    else if(action==='withdrawOriginal'){if(confirm('Withdraw this unanswered match report? No league points will be counted.'))await act('withdrawOriginal',t);}
    else if(action==='acceptCancel')await act('respondCancel',t,{accept:true});
    else if(action==='declineCancel')await act('respondCancel',t,{accept:false});
    else if(action==='acceptAmendment')await act('respondAmendment',t,{expectedRevision:t.amendment.revision,accept:true});
    else if(action==='declineAmendment')await act('respondAmendment',t,{expectedRevision:t.amendment.revision,accept:false});
    else if(action==='copyInvite'){await navigator.clipboard.writeText(state.group.inviteCode);toast('Invite code copied.');}
    else if(action==='shareInvite')await shareGroupInvitation(state.groupId);
    else if(action==='outbox')openDialog('outbox');
    else if(action==='outboxMatch'){state.dialog=null;navigate(`/g/${state.groupId}/t/${id}`);}
    else if(action==='discardJob'){await deleteAction(id);await refreshOutbox();toast('Queued action discarded.');}
    else if(action==='flushNow')flushOutbox();
    else if(action==='enablePush')openDialog('enablePush');
    else if(action==='commitPush')await enablePush();
    else if(action==='switchAuth')changeAuthMode(state.authMode==='signup'?'login':'signup');
    else if(action==='emailSignIn')changeAuthMode('login');
    else if(action==='authWelcome')changeAuthMode('welcome');
    else if(action==='forgotPassword')changeAuthMode('reset');
    else if(action==='logout'){
      if(pushEnabled&&!state.online){toast('Reconnect before signing out so notifications can be disabled safely.');return;}
      const did=readLocal('agree-device-id');
      if(pushEnabled&&did){try{await call('removeDevice',{deviceId:did});if(messaging)await deleteToken(messaging);}catch(error){toast('Could not disable device push; retry online before signing out.');return;}}
      await signOut(auth);state.authMode='welcome';state.authEmail='';state.dialog=null;render();history.replaceState({},'',inviteIntent.path('/'));state.route=parsePath();toast('Signed out.');
    }
  }catch(error){console.error(error);toast(errText(error));}
});
function preserveDraft(e){if(e.target.name==='avatarId'){selectAvatar(e);return;}if(e.target.name==='email'&&e.target.closest?.('#authForm'))state.authEmail=e.target.value;const form=e.target.closest?.('form');if(!form||!['newMatchForm','scoreForm','cancelForm'].includes(form.id)||!e.target.name)return;state.draft[e.target.name]=e.target.value;}
function selectAvatar(e){
  state.avatarId=avatarFor(e.target.value).id;
  updateAvatarPicker(e.target.closest?.('.character-picker'),state.avatarId);
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&characterTooltip.isOpen()){e.preventDefault();characterTooltip.hide({immediate:true});return;}
  const matchupTab=e.target.closest?.('.matchup-tabs [role="tab"]');
  if(matchupTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();state.matchupTab=e.key==='Home'?'yours':e.key==='End'?'club':state.matchupTab==='yours'?'club':'yours';render();document.querySelector?.('#matchup-tab-'+state.matchupTab)?.focus?.({preventScroll:true});return;}
  const matchTab=e.target.closest?.('.activity-tabs [role="tab"]');
  if(matchTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const values=['sent','requests','verified'],index=values.indexOf(state.matchTab);state.matchTab=e.key==='Home'?'sent':e.key==='End'?'verified':values[(index+(e.key==='ArrowRight'?1:-1)+3)%3];render();document.querySelector?.('#match-tab-'+state.matchTab)?.focus?.({preventScroll:true});return;}
  const tab=e.target.closest?.('.account-tabs [role="tab"]');
  const periodTab=e.target.closest?.('.leaderboard-periods [role="tab"]');
  if(tab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();state.profileTab=e.key==='Home'?'stats':e.key==='End'?'achievements':state.profileTab==='stats'?'achievements':'stats';render();document.querySelector?.('#account-tab-'+state.profileTab)?.focus?.();}
  else if(periodTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();state.period=e.key==='Home'?'weekly':e.key==='End'?'monthly':state.period==='weekly'?'monthly':'weekly';render();document.querySelector?.('#leaderboard-tab-'+state.period)?.focus?.({preventScroll:true});}
  else if(e.key==='Escape'&&['accountSettings','accountInvite','accountAchievement','editProfile','groupSwitch'].includes(state.dialog?.kind)){const groupSwitch=state.dialog.kind==='groupSwitch';state.dialog=null;render();document.querySelector?.(groupSwitch?'[data-action="groupSwitch"]':'[data-action="accountSettings"]')?.focus?.({preventScroll:true});}
});
document.addEventListener('input',preserveDraft);document.addEventListener('change',preserveDraft);
document.addEventListener('submit',async e=>{
  const form=e.target;if(!['authForm','profileForm','createGroupForm','joinGroupForm','newMatchForm','scoreForm','cancelForm'].includes(form.id))return;
  e.preventDefault();
  if(form.id==='authForm'&&state.authBusy)return;
  const submit=form.querySelector('[type=submit]');if(submit?.disabled)return;if(submit)submit.disabled=true;
  const d=Object.fromEntries(new FormData(form));
  const picker=form.id==='profileForm'?form.querySelector('fieldset.character-picker'):null;if(picker)picker.disabled=true;
  if(form.id==='authForm'){showAuthError('');state.authBusy='email';state.authEmail=d.email.trim();document.querySelectorAll?.('.onboarding button, .onboarding input').forEach(el=>el.disabled=true);}
  try{
    if(form.id==='authForm'){
      if(!state.online)throw {code:'auth/network-request-failed'};
      if(state.authMode==='reset'){
        try{await sendPasswordResetEmail(auth,d.email.trim());}catch(error){if(error.code!=='auth/user-not-found')throw error;}
        state.authMode='resetSent';render();
      }else if(state.authMode==='signup'){
        await createUserWithEmailAndPassword(auth,d.email.trim(),d.password);
      }else await signInWithEmailAndPassword(auth,d.email.trim(),d.password);
    }else if(form.id==='profileForm'){
      state.profile=await saveUserProfile(d.displayName.trim(),d.avatarId);
      await updateProfile(auth.currentUser,{displayName:state.profile.displayName}).catch(e=>console.warn('Account display name could not be updated',e));
      if(backendEnabled)listenUser(auth.currentUser.uid);state.dialog=null;ensureRoute();render();if(state.online)flushOutbox();toast('Player saved.');
    }else if(form.id==='createGroupForm'){
      if(!state.online)throw new Error('Creating a group requires an internet connection.');
      const result=await call('createGroup',{actionId:uid(),name:d.name.trim()});state.dialog=null;
      navigate(`/g/${result.groupId}/leaderboard`);toast('Group created! Share its invite code.');
    }else if(form.id==='joinGroupForm'){
      openInvite(d.code);
    }else if(form.id==='newMatchForm'){
      if(!state.members.some(m=>m.id===d.opponentUid&&m.id!==state.user.uid))throw Error('Choose an opponent from your group.');
      const {a,b}=d.scoreMode==='standard'?standardGameScore(d.losingScore,d.winner):{a:Number(d.scoreSelf),b:Number(d.scoreOpponent)};if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||a>200||b<0||b>200)throw Error('Scores must be whole numbers from 0 to 200.');
      const possibleDuplicate=state.tickets.some(t=>{
        if(t.status==='cancelled')return false;
        if(![t.playerA,t.playerB].includes(state.user.uid)||![t.playerA,t.playerB].includes(d.opponentUid))return false;
        const recent=when(t.createdAt);if(!recent||Date.now()-recent.getTime()>45*60*1000)return false;
        const score=t.finalScore||t.proposal?.score;
        return t.playerA===state.user.uid?(score?.a===a&&score?.b===b):(score?.a===b&&score?.b===a);
      });
      if(possibleDuplicate&&!confirm('A match with the same opponent and score was recorded recently. Is this a NEW match?'))return;
      const actionId=uid();await saveOutbox({id:actionId,uid:state.user.uid,kind:'submitMatch',payload:{groupId:state.groupId,actionId,opponentUid:d.opponentUid,scoreSelf:a,scoreOpponent:b,note:d.note}});
      state.matchTab='sent';go('matches');
    }else if(form.id==='scoreForm'){
      const t=state.tickets.find(v=>v.id===state.dialog?.ticketId);
      if(!t)throw Error('Match not found.');
      const a=Number(d.scoreA),b=Number(d.scoreB);if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||a>200||b<0||b>200)throw Error('Scores must be whole numbers between 0 and 200.');
      const k=state.dialog.kind;
      const action=k==='editOriginal'?'editOriginal':k==='amend'?'startAmendment':k==='counterAmendment'?'counterAmendment':'propose';
      const extras={score:{a,b},note:d.note};if(k==='dispute')extras.disputed=true;
      if(k==='amend')extras.amendmentKind='score';if(k==='counterAmendment')extras.expectedRevision=t.amendment.revision;
      await act(action,t,extras);
    }else if(form.id==='cancelForm'){
      const t=state.tickets.find(v=>v.id===state.dialog?.ticketId);if(!t)throw Error('Match not found.');
      if(state.dialog.kind==='voidMatch')await act('startAmendment',t,{amendmentKind:'void',note:d.note});
      else await act('requestCancel',t,{note:d.note});
    }
  }catch(error){if(form.id==='authForm'&&!state.user)showAuthError(authErrorText(error));else{console.error(error);toast(errText(error));}}
  finally{if(picker)picker.disabled=false;if(form.id==='authForm'){state.authBusy=false;if(state.user||state.authMode==='resetSent'){render();focusAuthTitle();}else document.querySelectorAll?.('.onboarding button, .onboarding input').forEach(el=>el.disabled=false);}if(submit?.isConnected)submit.disabled=false;}
});
let displayedSeason=JSON.stringify(periodKeys(new Date()));
setInterval(()=>{const next=JSON.stringify(periodKeys(new Date()));if(next!==displayedSeason){displayedSeason=next;render();}},30000);
start();
