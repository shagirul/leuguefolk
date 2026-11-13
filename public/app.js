import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,onAuthStateChanged,updateProfile} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {getFirestore,doc,collection,onSnapshot,getDoc,setDoc,updateDoc,runTransaction,serverTimestamp,query,orderBy,limit,initializeFirestore,persistentLocalCache,persistentMultipleTabManager} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js';
import {createFirestoreApi} from '/firestore-api.mjs';
import {getMessaging,getToken,deleteToken,onMessage,isSupported} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js';
import {enqueue,forUser,patchAction,deleteAction} from '/queue.js';
const root=document.getElementById('app');
const settings=self.AGREE_FIREBASE||{};
const backendEnabled=settings.features?.leaderboards!==false;
const pushEnabled=false; // No push sender is deployed on the Spark plan.
const ready=!!settings.firebaseConfig?.apiKey&&!settings.firebaseConfig.apiKey.startsWith('PASTE')&&!!settings.firebaseConfig.appId&&!settings.firebaseConfig.appId.startsWith('PASTE');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const short=s=>String(s??'').slice(0,100);
const uid=()=>crypto.randomUUID();
const state={user:null,profile:null,memberships:[],groupId:null,group:null,members:[],tickets:[],notifications:[],ticketEvents:[],queue:[],online:navigator.onLine,route:parsePath(),period:'weekly',matchTab:'all',dialog:null,draft:{},authMode:'login',authBusy:false,notice:null,loadError:'',authLoading:true,groupLoading:false,initialized:false};
const unsub={};let firebaseApp,auth,store,firestoreApi,messaging=null,swReg=null,flushBusy=false,toastTimeout,lastPushSync=0;
function when(value){return value?.toDate?value.toDate():(value?new Date(value):null);}
function dateShort(value){const d=when(value);return d&&!Number.isNaN(+d)?d.toLocaleString('en-IN',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'Just now';}
function parsePath(){const p=decodeURI(location.pathname);const match=p.match(/^\/g\/([a-f0-9-]{36})(?:\/(t\/([a-f0-9-]{36})|matches|leaderboard|inbox|profile|new))?\/?$/i);return match?{groupId:match[1],view:match[3]?'ticket':match[2]||'leaderboard',ticketId:match[3]}:{groupId:null,view:'leaderboard'};}
function periodKeys(date){const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));const t=new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day));t.setUTCDate(t.getUTCDate()-(t.getUTCDay()+6)%7);return {weekKey:t.toISOString().slice(0,10),monthKey:`${parts.year}-${parts.month}`};}
const userName=userId=>state.members.find(m=>m.id===userId)?.displayName||((state.user?.uid===userId)?(state.profile?.displayName||'You'):'Player');
const other=t=>t.playerA===state.user?.uid?t.playerB:t.playerA;
const myGroup=()=>state.memberships.some(g=>g.groupId===state.groupId);
function navigate(path){history.pushState({},'',path);state.route=parsePath();state.dialog=null;state.draft={};ensureRoute();render();window.scrollTo({top:0,behavior:'instant'});}
function go(view){navigate(`/g/${state.groupId}/${view}`);}
function badge(text,tone='purple'){return `<span class="badge ${tone}">${esc(text)}</span>`;}
function xp(score){return Number(score||0)*2;}
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
function stopGroupListeners(){['group','members','tickets','events'].forEach(k=>{unsub[k]?.();delete unsub[k];});state.group=null;state.members=[];state.tickets=[];state.ticketEvents=[];}
function groupPath(view='leaderboard'){return `/g/${state.groupId}/${view}`;}
function shell(title,content,active='leaderboard',back=false,side=''){
  const unread=state.notifications.some(n=>!n.readAt);
  const queueCount=state.queue.filter(q=>q.status==='queued').length,blocked=state.queue.filter(q=>q.status==='blocked').length;
  return `<div class="shell">
    <header class="top">${back?`<button class="top-back" data-action="back" aria-label="Back">‹</button>`:`<div class="brand-icon">A</div>`}
      <div class="grow"><h1>${esc(title)}</h1><div class="subtitle">${esc(state.group?.name||'Invite-only leaderboard')}</div></div>
      ${side||`<button class="top-action" data-action="groupSwitch" aria-label="Switch groups">Groups ⌄</button>`}</header>
    ${!state.online?`<div class="offline-strip">Offline · Matches are saved locally and sent when you reopen online</div>`:''}
    ${(queueCount||blocked)?`<div class="queue-strip"><span>↗ ${queueCount} waiting to send${blocked?` · ${blocked} needs review`:''}</span><button data-action="outbox">View outbox</button></div>`:''}
    <main class="content">${content}</main>
    <nav class="bottom-nav" aria-label="Main navigation">
      ${[['leaderboard','🏆','Ranks'],['matches','⚔','Matches'],['inbox','🔔','Inbox'],['profile','◉','Profile']].map(([v,i,l])=>`<button class="nav-btn ${active===v?'active':''}" data-action="nav" data-view="${v}" aria-label="${l}"><span class="nav-ico">${i}</span><span>${l}</span>${v==='inbox'&&unread?'<i class="nav-dot"></i>':''}</button>`).join('')}
    </nav></div>${state.dialog?modal():''}`;
}
function statFor(period){const ids=state.members.map(m=>m.id),now=periodKeys(new Date());const key=period==='weekly'?'weekKey':'monthKey';const scores=Object.fromEntries(ids.map(id=>[id,{id,score:0,played:0,wins:0}]));
  for(const t of state.tickets){const created=when(t.createdAt);if(t.status!=='finalized'||!t.finalScore||!created||periodKeys(created)[key]!==now[key])continue;
    const a=scores[t.playerA],b=scores[t.playerB];if(!a||!b)continue;
    a.score+=xp(t.finalScore.a);b.score+=xp(t.finalScore.b);a.played++;b.played++;if(t.finalScore.a>t.finalScore.b)a.wins++;if(t.finalScore.b>t.finalScore.a)b.wins++;
  }
  return Object.values(scores).sort((a,b)=>b.score-a.score||b.wins-a.wins||userName(a.id).localeCompare(userName(b.id)));
}
function rankContent(){const scores=statFor(state.period);const own=scores.findIndex(x=>x.id===state.user?.uid);
  return `<div class="feature-card"><div class="row between"><div><div class="small quiet">Your ${state.period} position</div><div style="font-size:36px;font-weight:900;margin:6px 0 3px">#${own+1} <span style="font-size:15px;color:var(--purple)">🏆</span></div><div class="small quiet">${scores[own]?.score||0} XP from agreed matches</div></div><div class="avatar" style="height:65px;width:65px;font-size:30px">⚡</div></div></div>
    <div class="tabs"><button class="tab ${state.period==='weekly'?'active':''}" data-action="period" data-value="weekly">This week</button><button class="tab ${state.period==='monthly'?'active':''}" data-action="period" data-value="monthly">This month</button></div>
    <div class="section-heading"><h2>Leaderboard</h2><small>${state.members.length} players</small></div>
    <div class="card">${scores.map((p,i)=>`<div class="row member ${p.id===state.user.uid?'member-you':''}"><div class="rank">${i<3?['🥇','🥈','🥉'][i]:i+1}</div><div class="avatar ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">${esc(userName(p.id).charAt(0).toUpperCase())}</div><div class="grow"><div class="member-name">${esc(userName(p.id))}${p.id===state.user.uid?' <span class="quiet small">(you)</span>':''}</div><div class="tiny quiet">${p.played} verified matches</div></div><div class="member-score">${p.score} <span class="tiny quiet">XP</span></div></div>`).join('')||'<div class="quiet">No members yet</div>'}</div>
    ${button('+ Record a match','newMatch')}
    <div class="footer-info">Only verified results count. Every match awards each player twice their own score as XP. Weekly and monthly seasons use the match submission date in Asia/Kolkata; later confirmation can update a previous period.</div>`;
}
function status(t){if(t.status==='cancelled')return badge('Cancelled','red');if(t.status==='finalized')return t.amendment?badge('Change pending','amber'):badge('Verified','green');if(t.cancellation)return badge('Cancel requested','amber');if(t.disputed)return badge('Disputed','red');if(t.revision>1)return badge('Negotiating','purple');return badge('Awaiting review','amber');}
function ticketsContent(){let arr=state.tickets.slice().sort((a,b)=>(when(b.createdAt)||0)-(when(a.createdAt)||0));if(state.matchTab==='action')arr=arr.filter(t=>needsMe(t));if(state.matchTab==='verified')arr=arr.filter(t=>t.status==='finalized');
  const counts=state.tickets.filter(needsMe).length;
  return `<div class="section-heading" style="margin-top:0"><h2>Your matches</h2><span class="pill">${state.tickets.length} total</span></div>
    ${button('+ Record a match','newMatch')}
    <div class="spacer"></div><div class="tabs"><button class="tab ${state.matchTab==='all'?'active':''}" data-action="matchTab" data-value="all">All</button><button class="tab ${state.matchTab==='action'?'active':''}" data-action="matchTab" data-value="action">Your turn (${counts})</button><button class="tab ${state.matchTab==='verified'?'active':''}" data-action="matchTab" data-value="verified">Verified</button></div>
    <div class="section-heading"><h2>${state.matchTab==='action'?'Waiting on you':'Match history'}</h2></div>
    ${arr.length?arr.map(t=>`<button class="ticket-row" data-action="openTicket" data-id="${esc(t.id)}"><div class="row between"><div class="row grow"><div class="avatar">${esc(userName(other(t)).charAt(0))}</div><div class="grow"><div class="member-name line-clamp">vs ${esc(userName(other(t)))}</div><div class="ticket-sub">${dateShort(t.createdAt)}</div></div></div>${status(t)}</div><div class="row between" style="margin-top:12px"><div class="ticket-score">${t.finalScore?`${t.finalScore.a} – ${t.finalScore.b}`:`${t.proposal.score.a} – ${t.proposal.score.b}`}</div><span class="small" style="color:${needsMe(t)?'var(--purple)':'var(--muted)'}">${needsMe(t)?'Respond now →':t.status==='open'?'View request →':'Details →'}</span></div></button>`).join(''):`<div class="center-empty"><div class="empty-icon">⚔</div><strong>No matches here</strong><span class="quiet small">${state.matchTab==='action'?'You are all caught up.':'Record a score to get started.'}</span></div>`}`;
}
function needsMe(t){const me=state.user?.uid;if(t.status==='open')return t.cancellation?t.cancellation.turn===me:t.turn===me;if(t.status==='finalized'&&t.amendment)return t.amendment.turn===me;return false;}
function scoreView(t,score){return `<div class="score-panel"><div class="score-side"><div class="score-number">${esc(score?.a??'—')}</div><div class="score-label">${esc(userName(t.playerA))}</div></div><div class="score-divider">–</div><div class="score-side"><div class="score-number">${esc(score?.b??'—')}</div><div class="score-label">${esc(userName(t.playerB))}</div></div></div>`;}
function ticketContent(t){if(!t)return `${note('error','This match is not available. You may be offline without a cached copy, or the link may be incorrect.')}${button('Back to matches','matches','secondary')}`;
  const waiting=t.cancellation?.turn||t.amendment?.turn||t.turn;const myTurn=waiting===state.user.uid;
  const name=userName(other(t));
  const score=t.finalScore||t.proposal?.score;
  const pendingLocal=state.queue.find(q=>q.payload?.ticketId===t.id&&q.status!=='blocked');
  let body=`<div class="row between"><div class="small quiet">Match with <strong>${esc(name)}</strong></div>${status(t)}</div><div class="card" style="margin-top:13px">${scoreView(t,score)}<div class="small quiet text-center">${t.status==='finalized'?'Both agreed • Official result':t.status==='cancelled'?'Match cancelled':`Last proposed by ${esc(userName(t.proposal.by))}`}</div></div>`;
  if(pendingLocal)body+=note('warn','Your last action is queued on this device. Its result will appear after the server confirms it. You cannot submit another response until then.');
  if(t.status==='open'&&!pendingLocal){
    if(t.cancellation){body+=note('warn',`${esc(userName(t.cancellation.by))} requested to cancel this match.${t.cancellation.note?' Reason: '+esc(t.cancellation.note):''}`);
      body+=myTurn?`${button('Agree to cancel','acceptCancel')}${button('Keep this match open','declineCancel','outline')}`:note('','Waiting for the other player to respond to cancellation.');
    }else if(myTurn){body+=note('','Check both scores carefully. Approving makes them official and adds XP to the leaderboard.');
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
    body+=`<div class="soft-card"><div class="row between"><span class="member-name">⚡ XP awarded</span>${badge('Verified','green')}</div><div class="stat-row" style="margin-top:12px"><div class="stat"><big>+${xp(t.finalScore.a)}</big><small>${esc(userName(t.playerA))}</small></div><div class="stat"><big>+${xp(t.finalScore.b)}</big><small>${esc(userName(t.playerB))}</small></div></div></div>`;
    if(t.amendment){body+=note('warn',`${esc(userName(t.amendment.by))} requested ${t.amendment.kind==='void'?'to void this verified match':'a score correction'}. The original result continues to count until you both agree.`);
      if(t.amendment.kind==='score')body+=`<div class="soft-card"><div class="small quiet">Proposed replacement</div>${scoreView(t,t.amendment.score)}${t.amendment.note?`<div class="small quiet">“${esc(t.amendment.note)}”</div>`:''}</div>`;
      if(myTurn&&!pendingLocal)body+=`${button(t.amendment.kind==='void'?'Agree to void match':'Accept new verified score','acceptAmendment')}${t.amendment.kind==='score'?button('Counter with another score','counterAmendment','secondary'):''}${button('Decline change (keep original)','declineAmendment','outline')}`;
      else if(!pendingLocal)body+=note('','Waiting for the other player to review the proposed change.');
    }else if(!pendingLocal)body+=`${button('Propose a verified score change','amend','secondary')}${button('Request mutual void','voidMatch','ghost')}`;
  }
  if(t.status==='cancelled')body+=note('good','Cancelled by mutual agreement. No XP is counted for this match.');
  body+=`<div class="section-heading"><h2>Activity</h2><small>Permanent record</small></div><div class="timeline">${state.ticketEvents.length?state.ticketEvents.map(e=>`<div class="timeline-item"><strong>${esc(eventTitle(e.kind))}</strong><div class="muted">${esc(userName(e.actor))} · ${dateShort(e.at)}</div>${e.score?`<div class="small" style="margin-top:5px;font-weight:750">${e.score.a} – ${e.score.b}</div>`:''}${e.note?`<div class="small quiet" style="margin-top:5px">“${esc(e.note)}”</div>`:''}</div>`).join(''):`<div class="quiet small">Activity loads when online or previously cached.</div>`}</div>`;
  return body;
}
function eventTitle(s){return ({submitted:'Score submitted',withdrawOriginal:'Submission withdrawn',confirm:'Score verified',propose:'New score proposed',editOriginal:'Original score edited',requestCancel:'Cancellation requested',respondCancel:'Cancellation answered',startAmendment:'Verified result change requested',counterAmendment:'Counter-proposal sent',respondAmendment:'Change request answered'})[s]||s;}
function newMatchContent(){const opponents=state.members.filter(m=>m.id!==state.user.uid);
  return `<div class="section-heading" style="margin-top:0"><h2>Record a match</h2></div><p class="small quiet" style="line-height:1.6">One player reports. The other confirms. XP is added only after agreement.</p>
    ${opponents.length?`<form id="newMatchForm"><div class="field"><label for="opponent">Who did you play?</label><select id="opponent" class="input select" name="opponentUid" required>${opponents.map((m,i)=>`<option value="${esc(m.id)}" ${state.draft.opponentUid?state.draft.opponentUid===m.id?'selected':'':i===0?'selected':''}>${esc(m.displayName)}</option>`).join('')}</select></div>
    <div class="soft-card"><div class="section-heading" style="margin-top:0"><h2>Enter match scores</h2></div><div class="score-panel"><div class="score-side"><input aria-label="Your score" class="input score-input" type="number" min="0" max="200" step="1" inputmode="numeric" name="scoreSelf" value="${esc(state.draft.scoreSelf??'21')}" required/><div class="score-label">You</div></div><div class="score-divider">–</div><div class="score-side"><input aria-label="Opponent score" class="input score-input" type="number" min="0" max="200" step="1" inputmode="numeric" name="scoreOpponent" value="${esc(state.draft.scoreOpponent??'17')}" required/><div class="score-label">Opponent</div></div></div></div>
    <div class="field"><label for="match-note">Note (optional)</label><textarea id="match-note" class="input" rows="2" name="note" maxlength="280" placeholder="Anything to clarify?">${esc(state.draft.note||'')}</textarea></div>
    <button type="submit" class="btn">Send score for confirmation</button>
    ${note('',state.online?'The other player will see the request in their in-app inbox.':'Offline: your request will be saved on this device and sent when you reopen online.')}
    </form>`:note('warn','Invite another player first to record a match.')}`;
}
function inboxContent(){const all=state.notifications;
  return `<div class="section-heading" style="margin-top:0"><h2>Activity inbox</h2><span class="pill">${all.filter(x=>!x.readAt).length} unread</span></div>${all.length?all.map(n=>`<button class="ticket-row" data-action="openNotification" data-id="${esc(n.id)}"><div class="row between"><span class="member-name">${esc(n.title)}</span>${!n.readAt?'<span class="pill">New</span>':''}</div><div class="small quiet" style="margin-top:8px;line-height:1.5">${esc(n.body)}</div><div class="tiny quiet" style="margin-top:9px">${dateShort(n.createdAt)} · Open match →</div></button>`).join(''):`<div class="center-empty"><div class="empty-icon">🔔</div><strong>No notifications yet</strong><span class="small quiet">Match requests and future activity will appear here.</span></div>`}`;
}
function profileContent(){const g=state.group;
  return `<div class="card"><div class="row"><div class="avatar" style="width:55px;height:55px;font-size:23px">${esc((state.profile?.displayName||'A').charAt(0))}</div><div><div class="member-name">${esc(state.profile?.displayName||'Player')}</div><div class="quiet small">${esc(state.user?.email||'')}</div></div></div></div>
    <div class="section-heading"><h2>Invite your friends</h2></div><div class="soft-card"><div class="small quiet" style="margin-bottom:10px">Anyone with this code can join your group. There is no admin.</div><div class="copy-code"><span>${esc(g?.inviteCode||'')}</span><button class="link-btn" data-action="copyInvite">Copy</button></div><div class="spacer"></div>${button('Share invitation','shareInvite','secondary')}</div>
    <div class="section-heading"><h2>Your groups</h2></div><div class="card"><div class="row between"><div><div class="member-name">${esc(g?.name||'')}</div><div class="small quiet">${state.members.length} members · Asia/Kolkata seasons</div></div>${badge('Joined','green')}</div></div>
    ${button('Switch / create another group','groupSwitch','secondary')}${button('Sign out','logout','ghost')}
    <p class="footer-info">No central admin. Both players must agree on the score or a cancellation. Verified results cannot be changed by one person alone.</p>`;
}
function scoreFields(t,mode){const base=mode==='amend'||mode==='counterAmendment'?t.amendment?.score||t.finalScore:t.proposal.score;
  return `<div class="soft-card"><div class="score-panel"><div class="score-side"><input type="number" name="scoreA" min="0" max="200" step="1" required class="input score-input" value="${esc(state.draft.scoreA??base?.a??0)}" aria-label="Score for ${esc(userName(t.playerA))}"/><div class="score-label">${esc(userName(t.playerA))}</div></div><div class="score-divider">–</div><div class="score-side"><input type="number" name="scoreB" min="0" max="200" step="1" required class="input score-input" value="${esc(state.draft.scoreB??base?.b??0)}" aria-label="Score for ${esc(userName(t.playerB))}"/><div class="score-label">${esc(userName(t.playerB))}</div></div></div></div>`;
}
function modal(){const d=state.dialog||{},t=state.tickets.find(t=>t.id===d.ticketId),kind=d.kind;
  const close=`<button type="button" class="btn ghost" data-action="closeDialog">Close</button>`;
  let inner='';
  if(kind==='groupSwitch')inner=`<h2>Your groups</h2><p>Choose a leaderboard or join another.</p>${state.memberships.map(g=>`<button class="group-item" data-action="switchGroup" data-id="${esc(g.groupId)}"><strong>${esc(g.name)}</strong><span>→</span></button>`).join('')}${button('+ Create a group','openCreateGroup','secondary')}${button('Join with invite code','openJoinGroup','outline')}${close}`;
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
  if(kind==='confirmAction'&&t){inner=`<h2>Confirm this match?</h2><p>Both players will receive XP. This result becomes official immediately.</p>${scoreView(t,t.proposal.score)}${button('Confirm exact score','commitConfirm')}${close}`;}
  if(kind==='enablePush')inner=`<h2>Turn on notifications</h2><p>Only enable if you want match requests and upcoming group updates delivered to this device. Tapping any match notification opens its exact match.</p>${button('Enable notifications','commitPush')}${close}`;
  return `<div class="modal-backdrop" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(kind)}"><div class="modal-handle"></div>${inner}</section></div>`;
}
function render(){
  if(!ready){root.innerHTML=`<div class="auth-wrap"><div class="auth-card"><div class="logo-mark">A</div><h1>Connect your Firebase app</h1><p>This PWA is intentionally not connected to anyone else's project.</p>${note('warn','Edit <strong>public/firebase-config.js</strong> and add your web app config and public VAPID key. Follow README.md to enable Firebase services and deploy.')}</div></div>`;return;}
  if(state.authLoading){root.innerHTML=`<div class="loading"><div class="logo-mark">A</div><h1>Agree</h1><p>Loading your account…</p></div>`;return;}
  if(!state.user){root.innerHTML=authScreen();return;}
  if(!state.profile?.displayName){root.innerHTML=profileSetup();return;}
  if(!backendEnabled){root.innerHTML=accountScreen();return;}
  if(!state.groupId||!myGroup()){root.innerHTML=groupsScreen();return;}
  if(!state.group){root.innerHTML=`<div class="loading"><div class="logo-mark">A</div><h1>Loading group…</h1><p>${esc(state.loadError||'Getting the latest matches')}</p></div>`;return;}
  const v=state.route.view;
  const match=state.tickets.find(t=>t.id===state.route.ticketId);
  let content='',active=v,title='Leaderboard',back=false;
  if(v==='leaderboard')content=rankContent();
  else if(v==='matches'){title='Matches';content=ticketsContent();}
  else if(v==='new'){title='Record match';content=newMatchContent();active='matches';back=true;}
  else if(v==='ticket'){title='Match details';content=ticketContent(match);active='matches';back=true;}
  else if(v==='inbox'){title='Inbox';content=inboxContent();}
  else if(v==='profile'){title='Profile';content=profileContent();}
  else {content=rankContent();active='leaderboard';}
  root.innerHTML=shell(title,content,active,back);
}
function authScreen(){const create=state.authMode==='signup',disabled=state.authBusy?'disabled':'';return `<div class="auth-wrap"><div class="auth-card"><div class="logo-mark">A</div><h1>${create?'Create account':'Welcome to Agree'}</h1><p>${backendEnabled?'Private leaderboards. Your score counts only when both players accept it.':'Sign in to manage your Agree profile. Group leaderboards and matches are currently unavailable.'}</p>${button(state.authBusy?'Connecting to Google…':'Continue with Google','googleSignIn','outline',disabled)}<p class="text-center small quiet">or ${create?'create an account':'sign in'} with email</p><form id="authForm">${create?`<div class="field"><label>Display name</label><input class="input" name="displayName" minlength="2" maxlength="32" required placeholder="Alex" autocomplete="nickname"/></div>`:''}<div class="field"><label>Email</label><input class="input" type="email" name="email" required autocomplete="email" placeholder="you@example.com"/></div><div class="field"><label>Password</label><input class="input" type="password" name="password" minlength="6" required autocomplete="${create?'new-password':'current-password'}" placeholder="At least 6 characters"/></div><button class="btn" type="submit" ${disabled}>${create?'Create account':'Sign in'}</button></form><div style="margin-top:17px;text-align:center"><button class="link-btn" data-action="switchAuth" ${disabled}>${create?'Already have an account? Sign in':'New here? Create account'}</button></div></div></div>`;}
async function signInWithGoogle(){
  if(state.authBusy)return;
  if(!state.online){toast('Connect to the internet to sign in with Google.');return;}
  showAuthError('');state.authBusy=true;render();
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
function profileSetup(){return `<div class="auth-wrap"><div class="auth-card"><div class="logo-mark">A</div><h1>Choose your name</h1><p>This is how friends will recognize you on their leaderboard.</p><form id="profileForm"><div class="field"><label>Display name</label><input class="input" name="displayName" minlength="2" maxlength="32" required placeholder="Your name" value="${esc(state.user?.displayName||'')}"/></div><button class="btn" type="submit">Continue</button></form>${button('Sign out','logout','ghost')}</div></div>`;}
function accountScreen(){return `<div class="auth-wrap"><div class="auth-card"><div class="logo-mark">A</div><h1>Welcome, ${esc(state.profile.displayName)}</h1><p>${esc(state.user.email)}</p>${note('','Your account is ready. Group leaderboards and matches are currently unavailable. Push notifications are turned off.')}<form id="profileForm"><div class="field"><label>Display name</label><input class="input" name="displayName" minlength="2" maxlength="32" required value="${esc(state.profile.displayName)}" autocomplete="nickname"/></div><button class="btn" type="submit">Save profile</button></form>${button('Sign out','logout','ghost')}</div></div>`;}
function groupsScreen(){return `<div class="auth-wrap"><div class="auth-card"><div class="brand"><div class="brand-icon">A</div> Agree</div><h1>Choose a leaderboard</h1><p>You need an invitation to compete with friends, or you can start a new group.</p>${state.memberships.map(g=>`<button class="group-item" data-action="switchGroup" data-id="${esc(g.groupId)}"><div><strong>${esc(g.name)}</strong><div class="small quiet">Your group</div></div><span>→</span></button>`).join('')}${button('+ Create a new group','openCreateGroup')}${button('Join with invitation code','openJoinGroup','secondary')}<div style="margin-top:16px">${button('Sign out','logout','ghost')}</div></div></div>${state.dialog?modal():''}`;}
async function call(name,data){if(!backendEnabled)throw new Error('Group leaderboards and matches are currently unavailable.');return firestoreApi(name,data);}
async function saveUserProfile(displayName,user=auth.currentUser){
  const ref=doc(store,'users',user.uid);
  const current=await getDoc(ref);
  await setDoc(ref,{displayName,updatedAt:serverTimestamp(),...(!current.exists()?{createdAt:serverTimestamp()}:{})},{merge:true});
}
async function saveOutbox(action){await enqueue(action);await refreshOutbox();toast(state.online?'Sending safely…':'Saved offline. Will send when you reopen online.');
  if(state.online)flushOutbox();else if(swReg?.sync)swReg.sync.register('agree-queued-actions').catch(()=>{});
}
async function refreshOutbox(){try{state.queue=state.user?await forUser(state.user.uid):[];render();}catch(e){toast('Offline storage unavailable: '+errText(e));}}
async function flushOutbox(){if(!backendEnabled||flushBusy||!state.user||!state.online)return;flushBusy=true;
  try{const replayUid=state.user.uid,jobs=await forUser(replayUid);
    for(const job of jobs){if(state.user?.uid!==replayUid||auth.currentUser?.uid!==replayUid)break;if(job.status==='blocked')continue;
      await patchAction(job.id,{status:'sending'});
      try{await call(job.kind,job.payload);await deleteAction(job.id);toast('Saved to leaderboard ✓');}
      catch(e){const code=String(e.code||'').replace(/^(functions|firestore)\//,'');
        if(['failed-precondition','permission-denied','invalid-argument','already-exists','not-found'].includes(code)){
          await patchAction(job.id,{status:'blocked',attempts:(job.attempts||0)+1,error:errText(e)});toast('A queued action needs your review.');continue;
        }
        await patchAction(job.id,{status:'queued',attempts:(job.attempts||0)+1,error:errText(e)});
        break; // transient network or auth failure; retry on next online/visibility/foreground interval
      }
    }
  }catch(e){console.warn('Outbox replay failed',e);}
  finally{flushBusy=false;await refreshOutbox();}
}
async function act(kind,t,extra={}){if(!t)return;
  if(state.queue.some(q=>q.payload?.ticketId===t.id&&q.status!=='blocked')){toast('An earlier action for this match is still queued.');return;}
  const payload={groupId:state.groupId,ticketId:t.id,actionId:uid(),kind,expectedVersion:t.version,expectedRevision:t.revision,...extra};
  await saveOutbox({id:payload.actionId,uid:state.user.uid,kind:'mutateTicket',payload});
  state.dialog=null;render();
}
function openDialog(kind,t){state.dialog={kind,ticketId:t?.id};state.draft={};render();}
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
  if(!backendEnabled||!state.user||!state.profile)return;
  const route=state.route;
  if(route.groupId&&state.memberships.some(g=>g.groupId===route.groupId)){
    if(state.groupId!==route.groupId){state.groupId=route.groupId;localStorage.setItem('agree-group',route.groupId);listenGroup();}
    if(route.view==='ticket')listenEvents(route.ticketId);
    return;
  }
  if(route.groupId&&!state.memberships.some(g=>g.groupId===route.groupId)){
    state.groupId=null;stopGroupListeners();return; // preserve deep link for sign in with correct account
  }
  const selected=state.memberships.some(g=>g.groupId===state.groupId)?state.groupId:(state.memberships.find(g=>g.groupId===localStorage.getItem('agree-group'))?.groupId||state.memberships[0]?.groupId);
  if(selected){state.groupId=selected;localStorage.setItem('agree-group',selected);listenGroup();}
}
function listenGroup(){if(!state.groupId||!store||!state.user)return;
  const id=state.groupId;
  stopGroupListeners();
  subscribed('group',onSnapshot(doc(store,'groups',id),snap=>{if(state.groupId!==id)return;state.group=snap.exists()?{id:snap.id,...snap.data()}:null;render();},e=>{state.loadError=errText(e);render();}));
  subscribed('members',onSnapshot(collection(store,'groups',id,'members'),snap=>{if(state.groupId!==id)return;state.members=snap.docs.map(d=>({id:d.id,...d.data()}));render();},e=>toast(errText(e))));
  subscribed('tickets',onSnapshot(collection(store,'groups',id,'tickets'),snap=>{if(state.groupId!==id)return;state.tickets=snap.docs.map(d=>({id:d.id,...d.data()}));render();},e=>toast(errText(e))));
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
    ensureRoute();render();
  },e=>toast(errText(e))));
  subscribed('notifications',onSnapshot(query(collection(store,'users',uidValue,'notifications'),orderBy('createdAt','desc'),limit(70)),snap=>{
    state.notifications=snap.docs.map(d=>({id:d.id,...d.data()}));render();
  },e=>toast(errText(e))));
}
async function authChanged(user){
  unsubscribeAll();stopGroupListeners();state.user=user;state.groupId=null;state.profile=null;state.memberships=[];state.notifications=[];state.queue=[];
  if(!user){state.authLoading=false;render();return;}
  try{const profile=await getDoc(doc(store,'users',user.uid));
    if(state.user?.uid!==user.uid)return;
    state.profile=profile.exists()?profile.data():state.profile;
    // Keep a chosen profile name; seed only a new Google user's profile.
    if(!state.profile?.displayName&&user.providerData?.some(p=>p.providerId==='google.com')){
      const displayName=(user.displayName||'').trim().slice(0,32);
      if(displayName.length>=2){await saveUserProfile(displayName,user);if(state.user?.uid!==user.uid)return;state.profile={displayName};}
    }
    if(backendEnabled)listenUser(user.uid);state.authLoading=false;render();if(backendEnabled)await refreshOutbox();if(state.online){flushOutbox();syncPushToken();}}
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
  if(backendEnabled)firestoreApi=createFirestoreApi(store,auth,{doc,runTransaction,serverTimestamp});
  if('serviceWorker' in navigator){navigator.serviceWorker.register('/firebase-messaging-sw.js',{scope:'/'}).then(r=>{swReg=r;}).catch(e=>console.warn('PWA worker registration failed',e));
    navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='FLUSH_QUEUE')flushOutbox();});}
  if(pushEnabled)isSupported().then(s=>{if(!s)return; messaging=getMessaging(firebaseApp);onMessage(messaging,payload=>{
    toast(payload.notification?.title||'A match was updated.',payload.data?.path);
  });}).catch(e=>console.warn('FCM not supported',e));
  onAuthStateChanged(auth,authChanged);
}
window.addEventListener('popstate',()=>{state.route=parsePath();state.dialog=null;ensureRoute();render();});
window.addEventListener('online',()=>{state.online=true;render();flushOutbox();syncPushToken();});
window.addEventListener('offline',()=>{state.online=false;render();});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){state.online=navigator.onLine;flushOutbox();syncPushToken();}});
setInterval(()=>{if(state.user&&navigator.onLine){state.online=true;flushOutbox();}},30000);
// Single delegated interaction layer keeps the markup simple.
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-action]');if(!b)return;
  const action=b.dataset.action,id=b.dataset.id,t=state.tickets.find(v=>v.id===state.route.ticketId);
  try{
    if(action==='googleSignIn')await signInWithGoogle();
    else if(action==='back'){if(state.dialog){state.dialog=null;render();}else go('matches');}
    else if(action==='nav')go(b.dataset.view);
    else if(action==='newMatch')go('new');
    else if(action==='matches')go('matches');
    else if(action==='openTicket')navigate(`/g/${state.groupId}/t/${id}`);
    else if(action==='openNotification'){
      const n=state.notifications.find(v=>v.id===id);if(n){if(!n.readAt)updateDoc(doc(store,'users',state.user.uid,'notifications',id),{readAt:serverTimestamp()}).catch(()=>{});navigate(n.path);}
    }
    else if(action==='groupSwitch')openDialog('groupSwitch');
    else if(action==='openCreateGroup')openDialog('createGroup');
    else if(action==='openJoinGroup')openDialog('joinGroup');
    else if(action==='switchGroup'){state.dialog=null;navigate(`/g/${id}/leaderboard`);}
    else if(action==='closeDialog'){state.dialog=null;render();}
    else if(action==='backdrop'&&e.target===b){state.dialog=null;render();}
    else if(action==='period'){state.period=b.dataset.value;render();}
    else if(action==='matchTab'){state.matchTab=b.dataset.value;render();}
    else if(action==='confirm')openDialog('confirmAction',t);
    else if(action==='commitConfirm'){await act('confirm',t);}
    else if(['suggest','dispute','editOriginal','amend','counterAmendment'].includes(action))openDialog(action,t);
    else if(action==='requestCancel'||action==='voidMatch')openDialog(action,t);
    else if(action==='withdrawOriginal'){if(confirm('Withdraw this unanswered match report? No XP will be counted.'))await act('withdrawOriginal',t);}
    else if(action==='acceptCancel')await act('respondCancel',t,{accept:true});
    else if(action==='declineCancel')await act('respondCancel',t,{accept:false});
    else if(action==='acceptAmendment')await act('respondAmendment',t,{expectedRevision:t.amendment.revision,accept:true});
    else if(action==='declineAmendment')await act('respondAmendment',t,{expectedRevision:t.amendment.revision,accept:false});
    else if(action==='copyInvite'){await navigator.clipboard.writeText(state.group.inviteCode);toast('Invite code copied.');}
    else if(action==='shareInvite'){
      const text=`Join ${state.group.name} on Agree. Invite code: ${state.group.inviteCode}\n${location.origin}`;
      if(navigator.share)await navigator.share({text});else{await navigator.clipboard.writeText(text);toast('Invitation copied.');}
    }
    else if(action==='outbox')openDialog('outbox');
    else if(action==='outboxMatch'){state.dialog=null;navigate(`/g/${state.groupId}/t/${id}`);}
    else if(action==='discardJob'){await deleteAction(id);await refreshOutbox();toast('Queued action discarded.');}
    else if(action==='flushNow')flushOutbox();
    else if(action==='enablePush')openDialog('enablePush');
    else if(action==='commitPush')await enablePush();
    else if(action==='switchAuth'){state.authMode=state.authMode==='login'?'signup':'login';showAuthError('');render();}
    else if(action==='logout'){
      if(pushEnabled&&!state.online){toast('Reconnect before signing out so notifications can be disabled safely.');return;}
      const did=localStorage.getItem('agree-device-id');
      if(pushEnabled&&did){try{await call('removeDevice',{deviceId:did});if(messaging)await deleteToken(messaging);}catch(error){toast('Could not disable device push; retry online before signing out.');return;}}
      await signOut(auth);state.dialog=null;history.replaceState({},'','/');state.route=parsePath();toast('Signed out.');
    }
  }catch(error){console.error(error);toast(errText(error));}
});
function preserveDraft(e){const form=e.target.closest?.('form');if(!form||!['newMatchForm','scoreForm','cancelForm'].includes(form.id)||!e.target.name)return;state.draft[e.target.name]=e.target.value;}
document.addEventListener('input',preserveDraft);document.addEventListener('change',preserveDraft);
document.addEventListener('submit',async e=>{
  const form=e.target;if(!['authForm','profileForm','createGroupForm','joinGroupForm','newMatchForm','scoreForm','cancelForm'].includes(form.id))return;
  e.preventDefault();
  if(form.id==='authForm'&&state.authBusy)return;
  const submit=form.querySelector('[type=submit]');if(submit?.disabled)return;if(submit)submit.disabled=true;
  const d=Object.fromEntries(new FormData(form));
  if(form.id==='authForm')showAuthError('');
  try{
    if(form.id==='authForm'){
      if(state.authMode==='signup'){
        const res=await createUserWithEmailAndPassword(auth,d.email.trim(),d.password);
        await updateProfile(res.user,{displayName:d.displayName.trim()});
        await saveUserProfile(d.displayName.trim());
        state.profile={displayName:d.displayName.trim()};render();
      }else await signInWithEmailAndPassword(auth,d.email.trim(),d.password);
    }else if(form.id==='profileForm'){
      await updateProfile(auth.currentUser,{displayName:d.displayName.trim()});await saveUserProfile(d.displayName.trim());
      state.profile={displayName:d.displayName.trim()};ensureRoute();render();toast('Profile saved.');
    }else if(form.id==='createGroupForm'){
      if(!state.online)throw new Error('Creating a group requires an internet connection.');
      const result=await call('createGroup',{actionId:uid(),name:d.name.trim()});state.dialog=null;
      navigate(`/g/${result.groupId}/leaderboard`);toast('Group created! Share its invite code.');
    }else if(form.id==='joinGroupForm'){
      if(!state.online)throw new Error('Joining requires an internet connection.');
      const result=await call('joinGroup',{code:d.code});state.dialog=null;
      navigate(`/g/${result.groupId}/leaderboard`);toast('Joined the group!');
    }else if(form.id==='newMatchForm'){
      const a=Number(d.scoreSelf),b=Number(d.scoreOpponent);if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||a>200||b<0||b>200)throw Error('Scores must be whole numbers from 0 to 200.');
      const possibleDuplicate=state.tickets.some(t=>{
        if(t.status==='cancelled')return false;
        if(![t.playerA,t.playerB].includes(d.opponentUid))return false;
        const recent=when(t.createdAt);if(!recent||Date.now()-recent.getTime()>45*60*1000)return false;
        const score=t.finalScore||t.proposal?.score;
        return t.playerA===state.user.uid?(score?.a===a&&score?.b===b):(score?.a===b&&score?.b===a);
      });
      if(possibleDuplicate&&!confirm('A match with the same opponent and score was recorded recently. Is this a NEW match?'))return;
      const actionId=uid();await saveOutbox({id:actionId,uid:state.user.uid,kind:'submitMatch',payload:{groupId:state.groupId,actionId,opponentUid:d.opponentUid,scoreSelf:a,scoreOpponent:b,note:d.note}});
      go('matches');
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
  finally{if(submit?.isConnected)submit.disabled=false;}
});
start();
