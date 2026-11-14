const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');

test('all 16 supplied heroes have valid assets, unique IDs/types and matching server authorization',async()=>{
  const {AVATARS,validAvatar}=await import('../public/avatars.mjs');
  assert.equal(AVATARS.length,16);assert.equal(new Set(AVATARS.map(a=>a.id)).size,16);assert.equal(new Set(AVATARS.map(a=>a.mbti)).size,16);
  for(const character of AVATARS){assert.ok(character.id.startsWith(character.mbti.toLowerCase()+'-'));assert.ok(character.description.length>10);assert.ok(fs.existsSync(path.join(__dirname,'../public',character.src)));assert.equal(character.artBounds.length,4);}
  const rules=fs.readFileSync(path.join(__dirname,'../firestore.rules'),'utf8'),list=rules.match(/function validAvatar\(value\) \{ return value in (\[[^;]+\]);/)[1];
  assert.deepEqual(JSON.parse(list.replaceAll("'",'"')).sort(),AVATARS.map(a=>a.id).sort());assert.equal(validAvatar('frog'),false);
});

test('pickers and profile badges use the exact supplied name and quoted description',async()=>{
  const {avatarPicker,avatarFor}=await import('../public/avatars.mjs'),{renderAccountPage}=await import('../public/account.mjs');
  assert.equal(avatarFor('istj-anchor').description,'I trust practice, patience, and getting the basics right.');
  assert.equal(avatarFor('estj-captain').description,'I take charge when everyone needs direction.');
  assert.equal(avatarFor('isfj-guardian').description,'I look out for my teammates, even under pressure.');
  for(const id of ['istj-anchor','estj-captain','isfj-guardian']){
    const character=avatarFor(id),picker=avatarPicker(id),page=renderAccountPage({profile:{displayName:'Rally_Ace',username:'rally_ace',avatarId:id},user:{uid:'me'}});
    assert.ok(picker.includes(`<strong data-character-name>${character.name}</strong>`));assert.ok(picker.includes('“'+character.description+'”'));
    assert.ok(page.includes(`About ${character.name}`));assert.ok(page.includes('“'+character.description+'”'));assert.ok(page.includes('Rally_Ace'));
    assert.doesNotMatch(page,/Copy username|@rally_ace/);
  }
});

function tooltipFixture(){
  let time=0,nextId=0;const tasks=new Map(),attributes=new Map(),classes=new Set();
  let button={dataset:{characterId:'istj-anchor'},setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)},tooltip={hidden:true,classList:{remove:k=>classes.delete(k),toggle:(k,on)=>on?classes.add(k):classes.delete(k)}};
  return {document:{querySelector:()=>button,getElementById:()=>tooltip},attributes,classes,get button(){return button;},get tooltip(){return tooltip;},
    options:{now:()=>time,setTimer:(fn,delay)=>{const id=++nextId;tasks.set(id,{fn,at:time+delay});return id;},clearTimer:id=>tasks.delete(id)},
    tick(ms){const end=time+ms;for(;;){const next=[...tasks].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;time=next[1].at;tasks.delete(next[0]);next[1].fn();}time=end;},
    replace(){button={...button};tooltip={hidden:true,classList:tooltip.classList};}
  };
}

test('character information fades after 4.5 seconds and survives a same-character profile rerender',async()=>{
  const {createCharacterTooltipController}=await import('../public/account.mjs'),f=tooltipFixture(),controller=createCharacterTooltipController(f.document,f.options);
  controller.toggle(f.button);assert.equal(f.tooltip.hidden,false);assert.equal(f.attributes.get('aria-expanded'),'true');
  f.tick(2000);f.replace();controller.sync();assert.equal(f.tooltip.hidden,false);
  f.tick(2499);assert.equal(f.classes.has('is-leaving'),false);f.tick(1);assert.equal(f.classes.has('is-leaving'),true);
  f.tick(180);assert.equal(f.tooltip.hidden,true);assert.equal(f.attributes.get('aria-expanded'),'false');assert.equal(controller.isOpen(),false);
});

test('reopening character information cancels old timers, and immediate dismissal clears the tooltip',async()=>{
  const {createCharacterTooltipController}=await import('../public/account.mjs'),f=tooltipFixture(),controller=createCharacterTooltipController(f.document,f.options);
  controller.toggle(f.button);f.tick(4500);f.tick(90);controller.toggle(f.button);f.tick(100);
  assert.equal(f.tooltip.hidden,false);assert.equal(f.classes.has('is-leaving'),false);
  controller.hide({immediate:true});assert.equal(f.tooltip.hidden,true);assert.equal(f.attributes.has('aria-describedby'),false);f.tick(5000);assert.equal(controller.isOpen(),false);
});
