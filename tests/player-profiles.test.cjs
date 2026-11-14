const test=require('node:test'),assert=require('node:assert/strict');
test('another player profile uses their stats and achievements without account controls',async()=>{
  const {renderAccountPage}=await import('../public/account.mjs');
  const tickets=[{id:'match',groupId:'club',playerA:'other',playerB:'me',status:'finalized',createdAt:new Date('2026-01-01'),finalScore:{a:11,b:0}}];
  const html=renderAccountPage({user:{uid:'other'},viewerUid:'me',profile:{displayName:'Dev',avatarId:'estj-captain'},group:{id:'club',name:'Office'},members:[{id:'me'},{id:'other'}],tickets});
  assert.match(html,/Player profile/);assert.match(html,/>Dev<\/h2>/);assert.match(html,/<strong>100%<\/strong>/);assert.match(html,/Whitewash, earned 1 time/);
  assert.doesNotMatch(html,/data-action="editProfile"|data-action="logout"|data-action="accountInvite"/);
  assert.match(html,/data-action="recordOpponent" data-id="other"/);assert.match(html,/data-action="openMatchup" data-id="other"/);
  const own=renderAccountPage({user:{uid:'me'},profile:{displayName:'Alex'},tickets});assert.match(own,/data-action="logout"/);
});
test('player avatar links are distinct from the existing match actions',async()=>{
  const {profileAvatar}=await import('../public/avatars.mjs'),{renderMatchesContent,renderInboxContent}=await import('../public/activity.mjs'),{renderMatchups}=await import('../public/matchups.mjs');
  assert.match(profileAvatar('p','istj-anchor','<Dev>'),/aria-label="View &lt;Dev&gt;’s profile"/);
  const tickets=[{id:'match',groupId:'club',playerA:'other',playerB:'me',status:'finalized',createdAt:new Date(),finalScore:{a:11,b:0}}],members=[{id:'me',displayName:'Alex'},{id:'other',displayName:'Dev'}],ctx={tickets,members,user:{uid:'me'},profile:{displayName:'Alex'},group:{id:'club'}};
  const matches=renderMatchesContent({...ctx,tab:'verified'});assert.match(matches,/data-action="openPlayer" data-id="other"/);assert.match(matches,/data-action="openTicket" data-id="match"/);
  let depth=0;for(const tag of matches.match(/<\/?button\b[^>]*>/g)){depth+=tag.startsWith('</')?-1:1;assert.ok(depth<=1&&depth>=0);}assert.equal(depth,0);
  const inbox=renderInboxContent({...ctx,notifications:[{id:'notice',ticketId:'match',groupId:'club'}]});assert.match(inbox,/data-action="openPlayer" data-id="other"/);assert.match(inbox,/data-action="openNotification"/);
  assert.match(renderMatchups({...ctx,tab:'club'}),/data-action="openPlayer" data-id="other"/);
});
