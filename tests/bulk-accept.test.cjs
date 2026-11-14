const test=require('node:test'),assert=require('node:assert/strict');
const ticket=(id,extra={})=>({id,groupId:'group',playerA:'dev',playerB:'me',status:'open',turn:'me',version:1,revision:1,proposal:{by:'dev',score:{a:9,b:11}},...extra});
test('bulk acceptance includes incoming score proposals and skips self approval, disputes, cancellations and queued actions',async()=>{
  const {eligibleScoreRequests,buildAcceptancePlan}=await import('../public/bulk-accept.mjs');
  const tickets=[ticket('one'),ticket('correction',{version:2,revision:2}),ticket('self',{turn:'dev',proposal:{by:'me',score:{a:9,b:11}}}),ticket('dispute',{disputed:true}),ticket('cancel',{cancellation:{by:'dev',turn:'me'}}),ticket('verified',{status:'finalized',amendment:{by:'dev',turn:'me'}})];
  assert.deepEqual(eligibleScoreRequests(tickets,'me').map(t=>t.id),['one','correction']);
  assert.deepEqual(eligibleScoreRequests(tickets,'me',[{status:'queued',payload:{ticketId:'one'}}]).map(t=>t.id),['correction']);
  assert.equal(buildAcceptancePlan([ticket('other',{groupId:'other'})],'me','group').items.length,0);
});
test('the review freezes exact scores; changed requests are skipped and newly arrived requests are never silently added',async()=>{
  const {buildAcceptancePlan,queueAcceptancePlan}=await import('../public/bulk-accept.mjs');let i=0;
  const original=[ticket('one'),ticket('two')],plan=buildAcceptancePlan(original,'me','group',[],()=> 'stable-'+(++i));
  original[0].proposal.score.a=5;assert.equal(plan.items[0].score.a,9);
  const current=[ticket('one',{version:2}),ticket('two'),ticket('new-arrival')],jobs=[];
  const result=await queueAcceptancePlan(plan,{currentUid:()=> 'me',currentGroupId:()=> 'group',getTickets:()=>current,getQueue:()=>[],enqueue:async job=>jobs.push(job)});
  assert.equal(result.queued,1);assert.equal(result.skipped,1);assert.equal(jobs[0].payload.ticketId,'two');assert.equal(jobs[0].payload.expectedVersion,1);assert.equal(jobs[0].payload.expectedRevision,1);assert.equal(jobs[0].id,'stable-2');assert.equal(jobs[0].payload.kind,'confirm');
});
test('bulk queuing stops on account switches and reports partial local storage failures',async()=>{
  const {buildAcceptancePlan,queueAcceptancePlan}=await import('../public/bulk-accept.mjs');let uid='me',i=0;const current=[ticket('one'),ticket('two')],plan=buildAcceptancePlan(current,'me','group',[],()=>String(++i)),jobs=[];
  const deps={currentUid:()=>uid,currentGroupId:()=> 'group',getTickets:()=>current,getQueue:()=>[],enqueue:async job=>{jobs.push(job);uid='another-player';}};
  const switched=await queueAcceptancePlan(plan,deps);assert.equal(switched.queued,1);assert.equal(switched.skipped,1);assert.equal(jobs.length,1);assert.equal(jobs[0].uid,'me');
  uid='me';const failed=await queueAcceptancePlan(plan,{...deps,enqueue:async()=>{throw new Error('Storage unavailable');}});assert.equal(failed.queued,0);assert.equal(failed.failed,2);assert.match(failed.error,/Storage/);
});
