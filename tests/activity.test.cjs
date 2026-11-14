const test=require('node:test'),assert=require('node:assert/strict');
const members=[{id:'me',displayName:'Alex',avatarId:'estj-captain'},{id:'dev',displayName:'Dev',avatarId:'istj-anchor'}];
const base={id:'ticket-one',playerA:'dev',playerB:'me',status:'open',revision:1,turn:'me',proposal:{score:{a:9,b:11}},createdAt:new Date('2026-11-14T09:00:00Z')};
test('match rows show the viewer’s score first and retain exact-ticket actions and filter states',async()=>{
  const {renderMatchesContent}=await import('../public/activity.mjs');
  const html=renderMatchesContent({tickets:[base],members,user:{uid:'me'},tab:'requests'});
  assert.match(html,/You 11, Dev 9, Awaiting review, your turn/);assert.match(html,/data-action="openTicket" data-id="ticket-one"/);assert.match(html,/match-tab-requests" role="tab" aria-selected="true"/);
  assert.match(html,/data-action="newMatch"/);assert.match(html,/assets\/characters\/istj-anchor.webp/);
  const verified=renderMatchesContent({tickets:[base],members,user:{uid:'me'},tab:'verified'});assert.doesNotMatch(verified,/data-id="ticket-one"/);assert.match(verified,/No verified games yet/);
});
test('local reports remain queued and never appear as verified match results',async()=>{
  const {renderMatchesContent}=await import('../public/activity.mjs');
  const html=renderMatchesContent({members,user:{uid:'me'},tab:'sent',queue:[{id:'offline',kind:'submitMatch',status:'queued',payload:{opponentUid:'dev',scoreSelf:11,scoreOpponent:9}}]});
  assert.match(html,/Queued — waiting for connection/);assert.match(html,/data-action="outbox"/);assert.doesNotMatch(html,/data-action="openTicket"/);
});
test('inbox uses current match state rather than stale notification wording and preserves exact notification actions',async()=>{
  const {renderInboxContent}=await import('../public/activity.mjs');
  const html=renderInboxContent({members,user:{uid:'me'},group:{id:'group'},tickets:[{...base,status:'finalized',turn:null,finalScore:{a:9,b:11}}],notifications:[{id:'notice',ticketId:base.id,groupId:'group',title:'New match to confirm',createdAt:base.createdAt,readAt:null}]});
  assert.match(html,/Score verified/);assert.doesNotMatch(html,/New match to confirm|Score needs your review/);assert.match(html,/data-action="openNotification" data-id="notice"/);assert.match(html,/is-unread/);assert.match(html,/vs Dev · You 11–9/);
});
test('names are escaped and updates from other groups do not borrow the active group’s player identity',async()=>{
  const {renderInboxContent,renderMatchesContent}=await import('../public/activity.mjs');
  const html=renderMatchesContent({members:[{id:'dev',displayName:'<img onerror=x>'}],user:{uid:'me'},tickets:[base]});assert.doesNotMatch(html,/<img onerror=x>/);assert.match(html,/&lt;img onerror=x&gt;/);
  const inbox=renderInboxContent({members,user:{uid:'me'},group:{id:'active'},tickets:[base],notifications:[{id:'n',ticketId:base.id,groupId:'other'}]});assert.match(inbox,/Match update/);assert.doesNotMatch(inbox,/vs Dev/);
});

test('chat timestamps use time today, Yesterday, weekday within a week, then a date',async()=>{
  const {matchTimeLabel}=await import('../public/activity.mjs'),now=new Date(2026,10,14,15,0);
  assert.match(matchTimeLabel(new Date(2026,10,14,9,30),now),/9:30/);
  assert.equal(matchTimeLabel(new Date(2026,10,13,23,59),now),'Yesterday');
  assert.equal(matchTimeLabel(new Date(2026,10,12,9),now),'Thursday');
  assert.equal(matchTimeLabel(new Date(2026,10,8,9),now),'Sunday');
  assert.match(matchTimeLabel(new Date(2026,10,7,9),now),/7 Nov/);
  assert.match(matchTimeLabel(new Date(2025,10,7,9),now),/2025/);
  assert.equal(matchTimeLabel('invalid',now),'');
});
test('Requests is the default and only agreed results receive win/loss colors without visible status badges',async()=>{
  const {renderMatchesContent}=await import('../public/activity.mjs');
  const defaultHtml=renderMatchesContent({tickets:[base],members,user:{uid:'me'}});assert.match(defaultHtml,/match-tab-requests" role="tab" aria-selected="true"/);
  const win=renderMatchesContent({tickets:[{...base,status:'finalized',finalScore:{a:9,b:11}}],members,user:{uid:'me'},tab:'verified'});
  assert.match(win,/match-chat-preview is-win/);assert.match(win,/<small>Won<\/small>/);assert.match(win,/data-action="recordOpponent" data-id="dev"/);assert.doesNotMatch(win,/class="activity-status|activity-match-result/);
  const loss=renderMatchesContent({tickets:[{...base,status:'finalized',finalScore:{a:11,b:9}}],members,user:{uid:'me'},tab:'verified'});assert.match(loss,/match-chat-preview is-loss/);
  assert.match(defaultHtml,/match-chat-preview is-pending/);assert.doesNotMatch(defaultHtml,/match-chat-preview is-win|<small>Won/);
});
test('row swipes reveal the match action without opening a ticket; keyboard can reveal and dismiss it',async()=>{
  const {mountMatchSwipes}=await import('../public/activity.mjs'),classes=new Set(),handlers={},style=new Map();let focus='';
  const row={addEventListener:(type,fn)=>(handlers['row-'+type]??=[]).push(fn),setPointerCapture(){},hasPointerCapture:()=>false,focus:()=>focus='row'};
  const action={tabIndex:-1,focus:()=>focus='action'};
  const wrapper={querySelector:s=>s==='.chat-match'?row:action,classList:{contains:k=>classes.has(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},style:{setProperty:(k,v)=>style.set(k,v),removeProperty:k=>style.delete(k)},addEventListener:(type,fn)=>(handlers[type]??=[]).push(fn)};
  mountMatchSwipes({querySelectorAll:()=>[wrapper]});
  const event=extra=>({button:0,pointerId:1,clientX:100,clientY:80,preventDefault(){},stopImmediatePropagation(){this.stopped=true;},...extra}),emit=(name,e)=>handlers[name]?.forEach(fn=>fn(e));
  emit('row-pointerdown',event());emit('row-pointermove',event({clientX:25}));emit('row-pointerup',event({clientX:25}));
  assert.equal(classes.has('is-open'),true);assert.equal(action.tabIndex,0);const click=event();emit('row-click',click);assert.equal(click.stopped,true);
  emit('keydown',event({key:'Escape'}));assert.equal(classes.has('is-open'),false);assert.equal(action.tabIndex,-1);assert.equal(focus,'row');
  emit('keydown',event({key:'ArrowLeft'}));assert.equal(classes.has('is-open'),true);assert.equal(focus,'action');
});
test('Sent shows outgoing requests and Requests shows incoming actions without leaking other players’ reports',async()=>{
  const {renderMatchesContent}=await import('../public/activity.mjs');
  const incoming={...base,id:'incoming'},outgoing={...base,id:'outgoing',turn:'dev',proposal:{by:'me',score:{a:9,b:11}}},other={...base,id:'other',playerA:'someone',playerB:'dev',turn:'dev'};
  const sent=renderMatchesContent({tickets:[incoming,outgoing,other],members,user:{uid:'me'},tab:'sent'});assert.match(sent,/data-id="outgoing"/);assert.doesNotMatch(sent,/data-id="incoming"|data-id="other"/);
  const requests=renderMatchesContent({tickets:[incoming,outgoing,other],members,user:{uid:'me'},tab:'requests'});assert.match(requests,/data-id="incoming"/);assert.doesNotMatch(requests,/data-id="outgoing"|data-id="other"/);assert.match(requests,/data-action="acceptAll"/);
});
