const test=require('node:test');
const assert=require('node:assert/strict');

test('standings keep supplied ranking order, member avatars and a truthful own position',async()=>{
  const {renderLeaderboardPage}=await import('../public/leaderboard.mjs');
  const html=renderLeaderboardPage({user:{uid:'me'},profile:{displayName:'Rally_Ace',avatarId:'esfj-connector'},members:[{id:'friend',displayName:'Kai',avatarId:'estj-captain'},{id:'me',displayName:'Old name',avatarId:'enfp-spark'}],scores:[{id:'friend',score:6,played:2,wins:2},{id:'me',score:0,played:2,wins:0}],period:'monthly'});
  assert.match(html,/Rank 1, Kai, 6 points/);
  assert.match(html,/Rank 2, Rally_Ace, you, 0 points/);
  assert.match(html,/#2 <small>of 2/);
  assert.match(html,/assets\/characters\/esfj-connector.webp/);
  assert.match(html,/assets\/characters\/estj-captain.webp/);
  assert.doesNotMatch(html,/assets\/characters\/enfp-spark.webp/);
  assert.match(html,/id="leaderboard-tab-monthly" role="tab" aria-selected="true"/);
});

test('zero points never crowns a winner, and an absent current member never becomes rank zero',async()=>{
  const {renderLeaderboardPage}=await import('../public/leaderboard.mjs');
  const html=renderLeaderboardPage({user:{uid:'not-a-member'},members:[{id:'new',displayName:'New player'}],scores:[{id:'new',score:0,played:0,wins:0}]});
  assert.match(html,/Your next match starts here/);
  assert.match(html,/Invite a friend/);
  assert.doesNotMatch(html,/class="leaderboard-podium"|class="leaderboard-your-position"|#0/);
  assert.match(html,/Rank 1, New player, 0 points/);
});

test('player and group names are escaped in text and accessible labels',async()=>{
  const {renderLeaderboardPage}=await import('../public/leaderboard.mjs');
  const name='"<img src=x onerror=alert(1)>';
  const html=renderLeaderboardPage({group:{name},members:[{id:'other',displayName:name,avatarId:'infp-dreamer'}],scores:[{id:'other',score:42,played:1,wins:1}]});
  assert.doesNotMatch(html,/<img src=x/);
  assert.match(html,/&quot;&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html,/assets\/characters\/infp-dreamer.webp/);
});
