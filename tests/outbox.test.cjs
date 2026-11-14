const test=require('node:test'),assert=require('node:assert/strict');
test('switching accounts while a sending marker is saved never sends the prior account action',async()=>{
  const {replayOutbox}=await import('../public/outbox.mjs');let user='alex',sent=0;const changes=[];
  await replayOutbox({uid:'alex',currentUid:()=>user,list:async()=>[{id:'one',kind:'submitMatch'}],patch:async(id,data)=>{changes.push(data.status);user='dev';},send:async()=>sent++,remove:async()=>{}});
  assert.equal(sent,0);assert.deepEqual(changes,['sending','queued']);
});
test('a stale confirmation is blocked but does not prevent another independent queued action from sending',async()=>{
  const {replayOutbox}=await import('../public/outbox.mjs'),states=new Map(),removed=[];
  await replayOutbox({uid:'alex',currentUid:()=> 'alex',list:async()=>[{id:'stale',payload:'stale'},{id:'next',payload:'next'}],patch:async(id,data)=>states.set(id,data.status),send:async(_,p)=>{if(p==='stale')throw Object.assign(new Error('Review latest'),{code:'failed-precondition'});},remove:async id=>removed.push(id)});
  assert.equal(states.get('stale'),'blocked');assert.deepEqual(removed,['next']);
});
