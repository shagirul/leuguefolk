'use strict';
// Pure state-machine logic (also tested independently; no Firebase dependency).
const MAX_SCORE = 200;
const MAX_REVISIONS = 30;
function fail(message, code='failed-precondition') { const e=new Error(message); e.code=code; throw e; }
function numberScore(n) { if(!Number.isInteger(n)||n<0||n>MAX_SCORE) fail(`Scores must be whole numbers from 0 to ${MAX_SCORE}.`,'invalid-argument'); return n; }
function validScore(s) { if(!s || typeof s!=='object') fail('Score is required.','invalid-argument'); return { a:numberScore(s.a), b:numberScore(s.b) }; }
function other(t,uid) { if(uid===t.playerA) return t.playerB; if(uid===t.playerB) return t.playerA; fail('You are not a player in this match.','permission-denied'); }
function note(s, max=280) { if(typeof s!=='string' && s!=null) fail('Invalid note.','invalid-argument'); return String(s||'').trim().slice(0,max); }
function revision(t,n) { if(!Number.isInteger(n)||n!==t.revision) fail('This score changed while you were away. Review the latest proposal before continuing.'); }
function advance(t, kind, actor, input, now) {
  const o=other(t,actor);
  if(t.status==='cancelled') fail('This match has been cancelled.');
  const next={...t, updatedAt:now};
  const event={kind, actor, at:now, note:note(input.note)};
  let target=o, title='Match updated', body='Open your match to review.';
  const ensureOpen=()=> { if(t.status!=='open') fail('This match is already finalized.'); if(t.cancellation) fail('Respond to the cancellation request first.'); };
  switch(kind){
    case 'confirm':{
      ensureOpen(); revision(t,input.expectedRevision);
      if(t.turn!==actor) fail('Only the player receiving the score can confirm it.');
      Object.assign(next,{status:'finalized',finalScore:{...t.proposal.score},finalizedAt:now,turn:null,cancellation:null,amendment:null});
      event.score=next.finalScore; title='Match confirmed'; body='Your match is official. Rankings updated.';
      break;
    }
    case 'propose':{
      ensureOpen(); revision(t,input.expectedRevision);
      if(t.turn!==actor) fail('Wait for the other player before proposing another score.');
      if(t.revision>=MAX_REVISIONS) fail('This match reached the maximum negotiation length. Request mutual cancellation.');
      const score=validScore(input.score);
      Object.assign(next,{revision:t.revision+1,proposal:{score,by:actor,note:note(input.note),at:now},turn:o,disputed:!!input.disputed||t.disputed});
      event.score=score; title=input.disputed?'Score disputed':'Score correction proposed'; body='Review the updated score and respond.';
      break;
    }
    case 'editOriginal':{
      ensureOpen(); revision(t,input.expectedRevision);
      if(t.playerA!==actor || t.proposal.by!==actor || t.revision!==1) fail('You can edit only your original, unanswered submission.');
      const score=validScore(input.score);
      Object.assign(next,{revision:t.revision+1,proposal:{score,by:actor,note:note(input.note),at:now}});
      event.score=score; title='Match score edited'; body='Review the updated score.';
      break;
    }
    case 'withdrawOriginal':{
      ensureOpen(); revision(t,input.expectedRevision);
      if(t.playerA!==actor||t.revision!==1||t.proposal.by!==actor) fail('Only the reporter can withdraw an untouched original submission.');
      Object.assign(next,{status:'cancelled',turn:null,cancellation:null});
      title='Submission withdrawn';body='The original report was withdrawn before you responded. No league points awarded.';break;
    }
    case 'requestCancel':{
      ensureOpen(); revision(t,input.expectedRevision);
      next.cancellation={by:actor,turn:o,note:note(input.note),at:now};
      title='Cancel match request'; body='The other player wants to cancel this match.'; break;
    }
    case 'respondCancel':{
      if(t.status!=='open'||!t.cancellation) fail('There is no active cancellation request.');
      revision(t,input.expectedRevision);
      if(t.cancellation.turn!==actor) fail('Only the other player can respond to cancellation.');
      if(input.accept===true){ Object.assign(next,{status:'cancelled',turn:null,cancellation:null}); title='Match cancelled'; body='Both players agreed to cancel. No league points awarded.'; }
      else if(input.accept===false){ next.cancellation=null; title='Cancellation declined'; body='The match remains open. Discuss the score.'; }
      else fail('Choose accept or decline.','invalid-argument');
      break;
    }
    case 'startAmendment':{
      if(t.status!=='finalized') fail('Only verified matches can be amended.');
      if(t.amendment) fail('A change request is already awaiting agreement.');
      if(input.amendmentKind!=='score' && input.amendmentKind!=='void') fail('Invalid amendment type.','invalid-argument');
      const score=input.amendmentKind==='score'?validScore(input.score):null;
      next.amendment={kind:input.amendmentKind,score,by:actor,turn:o,revision:1,note:note(input.note),at:now};
      event.score=score; title=input.amendmentKind==='void'?'Void match requested':'Verified score change requested';
      body='Your existing result stays active until you both agree.';
      break;
    }
    case 'counterAmendment':{
      if(t.status!=='finalized'||!t.amendment||t.amendment.kind!=='score') fail('No active score amendment.');
      if(t.amendment.turn!==actor) fail('Wait for the other player to respond.');
      if(input.expectedRevision!==t.amendment.revision) fail('Amendment changed. Review the latest score.');
      if(t.amendment.revision>=MAX_REVISIONS) fail('Maximum amendment counter-proposals reached.');
      const score=validScore(input.score);
      next.amendment={...t.amendment,score,by:actor,turn:o,revision:t.amendment.revision+1,note:note(input.note),at:now};
      event.score=score; title='Counter-proposal received'; body='A different verified score has been suggested.';
      break;
    }
    case 'respondAmendment':{
      if(t.status!=='finalized'||!t.amendment) fail('There is no active change request.');
      if(t.amendment.turn!==actor) fail('Only the recipient can respond to this request.');
      if(input.expectedRevision!==t.amendment.revision) fail('Amendment changed. Review the latest request.');
      if(input.accept===true){
        if(t.amendment.kind==='void') Object.assign(next,{status:'cancelled',finalScore:null,amendment:null});
        else Object.assign(next,{finalScore:{...t.amendment.score},amendment:null});
        title=t.amendment.kind==='void'?'Verified match voided':'Verified score updated'; body='Both players approved the result change.';
      }else if(input.accept===false){ next.amendment=null; title='Change declined'; body='The original verified score remains official.'; }
      else fail('Choose accept or decline.','invalid-argument');
      break;
    }
    default: fail('Unknown action.','invalid-argument');
  }
  return {next,event,target,title,body};
}
function periodKeys(date,zone='Asia/Kolkata'){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));
  const t=new Date(Date.UTC(+parts.year,+parts.month-1,+parts.day));
  const monday=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-monday);
  return {monthKey:`${parts.year}-${parts.month}`,weekKey:t.toISOString().slice(0,10)};
}
function scorePoints(score){return score*2;}
// Competition points come from wins, never from the number of rallies scored.
function competitionPoints(t,uid){
  if(t?.status!=='finalized'||!t.finalScore)return 0;
  return (uid===t.playerA&&t.finalScore.a>t.finalScore.b)||(uid===t.playerB&&t.finalScore.b>t.finalScore.a)?3:0;
}
function competitionStandings(members,tickets,period='weekly',now=new Date()){
  const key=period==='monthly'?'monthKey':'weekKey',season=periodKeys(now)[key];
  const rows=new Map(members.map(m=>[m.id,{id:m.id,name:m.displayName||'Player',score:0,played:0,wins:0,losses:0,draws:0}]));
  for(const t of tickets){
    const at=t.createdAt?.toDate?.()||new Date(t.createdAt||0);
    if(t.status!=='finalized'||!t.finalScore||!Number.isFinite(+at)||periodKeys(at)[key]!==season)continue;
    for(const id of [t.playerA,t.playerB]){
      const row=rows.get(id);if(!row)continue;
      const points=competitionPoints(t,id),draw=t.finalScore.a===t.finalScore.b;
      row.score+=points;row.played++;row.wins+=points===3?1:0;row.draws+=draw?1:0;row.losses+=!points&&!draw?1:0;
    }
  }
  const sorted=[...rows.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
  sorted.forEach((row,i)=>{row.rank=i&&row.score===sorted[i-1].score?sorted[i-1].rank:i+1;});
  return sorted;
}
export {advance,periodKeys,scorePoints,competitionPoints,competitionStandings,validScore,note,other,fail};
