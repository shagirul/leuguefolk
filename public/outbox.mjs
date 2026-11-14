// Replay durable actions serially. A local action never means server approval.
export async function replayOutbox({uid,currentUid,list,patch,send,remove,onSent=()=>{},onBlocked=()=>{}}){
  for(const job of await list(uid)){
    if(currentUid()!==uid)break;
    if(job.status==='blocked')continue;
    await patch(job.id,{status:'sending'});
    if(currentUid()!==uid){await patch(job.id,{status:'queued'});break;}
    try{
      await send(job.kind,job.payload);
      await remove(job.id);
      if(currentUid()===uid)onSent(job);
    }catch(error){
      const code=String(error.code||'').replace(/^(functions|firestore)\//,'');
      const blocked=['failed-precondition','permission-denied','invalid-argument','already-exists','not-found'].includes(code);
      await patch(job.id,{status:blocked?'blocked':'queued',attempts:(job.attempts||0)+1,error:String(error.message||error).slice(0,240)});
      if(blocked){if(currentUid()===uid)onBlocked(job);continue;}
      break;
    }
  }
}
