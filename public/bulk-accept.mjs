// Bulk confirmation reuses individual versioned confirmations and the durable outbox.
// Cancellations, disputes and changes to verified scores always get individual review.
export function eligibleScoreRequests(tickets,uid,queue=[]){
  if(!uid)return [];
  return tickets.filter(t=>t.status==='open'&&t.turn===uid&&[t.playerA,t.playerB].includes(uid)
    &&!t.cancellation&&!t.disputed&&t.proposal?.by!==uid
    &&[t.proposal?.score?.a,t.proposal?.score?.b].every(n=>Number.isInteger(n)&&n>=0&&n<=200)
    &&!queue.some(q=>q.payload?.ticketId===t.id&&q.status!=='blocked'));
}
export function buildAcceptancePlan(tickets,uid,groupId,queue=[],newId=()=>crypto.randomUUID()){
  return {uid,groupId,items:eligibleScoreRequests(tickets,uid,queue).filter(t=>t.groupId===groupId).map(t=>({
    ticketId:t.id,playerA:t.playerA,playerB:t.playerB,version:t.version,revision:t.revision,
    score:{...t.proposal.score},actionId:newId()
  }))};
}
export async function queueAcceptancePlan(plan,{currentUid,currentGroupId,getTickets,getQueue,enqueue}){
  const result={queued:0,skipped:0,failed:0,error:''};
  for(const item of plan.items){
    if(currentUid()!==plan.uid||currentGroupId()!==plan.groupId){result.skipped=plan.items.length-result.queued;break;}
    const current=eligibleScoreRequests(getTickets(),plan.uid,getQueue()).find(t=>t.id===item.ticketId&&t.groupId===plan.groupId);
    if(!current||current.version!==item.version||current.revision!==item.revision||current.playerA!==item.playerA||current.playerB!==item.playerB||current.proposal.score.a!==item.score.a||current.proposal.score.b!==item.score.b){result.skipped++;continue;}
    try{
      await enqueue({id:item.actionId,uid:plan.uid,kind:'mutateTicket',payload:{groupId:plan.groupId,ticketId:item.ticketId,actionId:item.actionId,kind:'confirm',expectedVersion:item.version,expectedRevision:item.revision}});
      result.queued++;
    }catch(error){result.failed=plan.items.length-result.queued-result.skipped;result.error=String(error.message||error);break;}
  }
  return result;
}
