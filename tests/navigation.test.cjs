const test=require('node:test'),assert=require('node:assert/strict');
test('Matchups deep links preserve opponents and existing ticket routes',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),source=fs.readFileSync(require.resolve('../public/app.js'),'utf8');
  const fn=source.slice(source.indexOf('function parsePath(){'),source.indexOf('function periodKeys('));
  const group='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',ticket='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const parse=path=>JSON.parse(JSON.stringify(vm.runInNewContext(fn+';parsePath()',{location:{pathname:path}})));
  assert.equal(parse(`/g/${group}/matchups`).view,'matchups');
  assert.equal(parse(`/g/${group}/matchups/player%20one`).opponentId,'player one');
  assert.equal(parse(`/g/${group}/t/${ticket}`).ticketId,ticket);
  assert.equal(parse(`/g/${group}/matches`).view,'matches');
  assert.equal(parse(`/g/${group}/players/player%20one`).view,'player');
  assert.equal(parse(`/g/${group}/players/player%20one`).playerId,'player one');
  assert.equal(parse(`/g/${group}/matchups/%ZZ`).opponentId,undefined);
});
test('Profile has a bottom sign-out action and a group card with up to three real member avatars',async()=>{
  const {renderAccountPage}=await import('../public/account.mjs');
  const html=renderAccountPage({user:{uid:'me'},profile:{displayName:'Alex',avatarId:'istj-anchor'},group:{name:'Office TT'},members:Array.from({length:5},(_,i)=>({id:String(i),avatarId:'estj-captain'}))});
  assert.doesNotMatch(html,/Account settings/);assert.match(html,/class="account-sign-out" data-action="logout"/);
  const card=html.match(/<button class="account-group-row"[\s\S]*?<\/button>/)[0];
  assert.equal((card.match(/role="img"/g)||[]).length,3);assert.match(card,/5 players · Invite friends/);assert.match(card,/data-action="accountInvite"/);
});
test('Inbox is beside the group avatar, carries unread/current state, and leaves four competition destinations',async()=>{
  const {renderLeagueHeader,renderLeagueNavigation,renderAccountPage}=await import('../public/account.mjs'),{renderLeaderboardPage}=await import('../public/leaderboard.mjs');
  const group={id:'group',name:'Office TT'},header=renderLeagueHeader({title:'Inbox',group,unread:true,inboxActive:true});
  assert.match(header,/league-header-notifications is-active/);assert.match(header,/data-action="nav" data-view="inbox"/);assert.match(header,/aria-current="page"/);assert.match(header,/Unread notifications/);assert.ok(header.indexOf('league-header-notifications')<header.indexOf('league-group-picker'));
  const nav=renderLeagueNavigation('matches');assert.equal((nav.match(/<button /g)||[]).length,4);assert.doesNotMatch(nav,/inbox|Inbox|bell/);assert.match(nav,/data-view="matches"[^>]*aria-current="page"/);
  for(const page of [renderLeaderboardPage({group,unread:true}),renderAccountPage({group,unread:true,user:{uid:'me'},profile:{displayName:'Alex',avatarId:'istj-anchor'}})])assert.match(page,/league-header-notifications/);
  assert.doesNotMatch(renderLeagueHeader({title:'Matches',group}),/headerUnread/);
});
