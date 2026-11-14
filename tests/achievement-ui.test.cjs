const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const context={uid:'me',groupId:'club',members:[{id:'me',displayName:'Alex'},{id:'friend',displayName:'Dev'},{id:'other',displayName:'Maya'}],tickets:[{id:'match',groupId:'club',playerA:'me',playerB:'friend',status:'finalized',createdAt:new Date('2026-01-01'),finalScore:{a:11,b:0}}]};
test('the collection shows six supplied stones, stylized names and actual repeat counts',async()=>{
  const {renderAccountPage,accountAchievements}=await import('../public/account.mjs');
  const html=renderAccountPage({user:{uid:'me'},profile:{displayName:'Alex'},group:{id:'club',name:'Office'},members:context.members,tickets:context.tickets});
  assert.equal((html.match(/class="account-achievement stone-tile/g)||[]).length,6);
  assert.equal((html.match(/class="stone-count"/g)||[]).length,6);assert.match(html,/Whitewash[\s\S]*?aria-label="1 earned"/);
  assert.doesNotMatch(html,/Level milestones|First match, unlocked|Rising star/);
  assert.equal((html.match(/src="\/assets\/achievements\/locked_placeholder.png"/g)||[]).length,5);
  assert.match(html,/src="\/assets\/achievements\/01_whitewash.png"/);
  for(const a of accountAchievements(context))assert.ok(fs.existsSync(require('node:path').join(__dirname,'../public/assets/achievements',a.asset)));
});

test('locked state uses one shared placeholder while all six earned identities keep their own stone',async()=>{
  const {ACHIEVEMENT_CATALOG,LOCKED_ACHIEVEMENT_ASSET,achievementStoneAsset}=await import('../public/achievements.mjs');
  const {renderAchievementDetail}=await import('../public/account.mjs');
  assert.equal(ACHIEVEMENT_CATALOG.length,6);assert.equal(LOCKED_ACHIEVEMENT_ASSET,'locked_placeholder.png');
  assert.ok(!ACHIEVEMENT_CATALOG.some(a=>a.asset===LOCKED_ACHIEVEMENT_ASSET));
  for(const a of ACHIEVEMENT_CATALOG){assert.equal(achievementStoneAsset({...a,unlocked:false}),LOCKED_ACHIEVEMENT_ASSET);assert.equal(achievementStoneAsset({...a,unlocked:true}),a.asset);}
  const reign=ACHIEVEMENT_CATALOG.find(a=>a.id==='perfect-reign');assert.equal(reign.asset,'06_perfect_reign.png');
  const locked=renderAchievementDetail({...reign,unlocked:false,count:0,progress:0,progressText:'Not yet earned',occurrences:[]});
  const earned=renderAchievementDetail({...reign,unlocked:true,count:1,progress:0,progressText:'Next week',occurrences:[]});
  assert.match(locked,/src="\/assets\/achievements\/06_perfect_reign.png"/);assert.match(locked,/WAITING TO BE EARNED/);assert.match(earned,/src="\/assets\/achievements\/06_perfect_reign.png"/);
});
test('achievement drawers explain rules/reset, progress, repeated awards and original match links',async()=>{
  const {renderAchievementDetail,accountAchievements}=await import('../public/account.mjs');
  const rows=accountAchievements(context),white=renderAchievementDetail(rows[0],{members:context.members,group:{name:'Office'}});
  assert.match(white,/How to earn/);assert.match(white,/11–0/);assert.match(white,/Earned moments/);assert.match(white,/Against Dev/);assert.match(white,/data-action="openTicket" data-id="match"/);assert.doesNotMatch(white,/role="progressbar"/);
  const streak=renderAchievementDetail(rows[1]);assert.match(streak,/role="progressbar"/);assert.match(streak,/resets/);
  const weekly=renderAchievementDetail(rows.find(a=>a.id==='perfect-reign'));assert.match(weekly,/Awarded after the week closes/);assert.match(weekly,/00:00 IST/);
  const conquest=renderAchievementDetail(rows.find(a=>a.id==='table-conqueror'));assert.match(conquest,/Still to beat/);assert.match(conquest,/Maya/);
  const escaped=renderAchievementDetail({...rows[0],name:'<img onerror=bad>',description:'<script>bad</script>'});assert.doesNotMatch(escaped,/<script>|<img onerror/);
});
