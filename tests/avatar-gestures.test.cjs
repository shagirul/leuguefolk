const test=require('node:test'),assert=require('node:assert/strict');
async function fixture(){
  const {AVATARS,bindAvatarGestures}=await import('../public/avatars.mjs'),events={},classes=new Set(),selected=[];
  const options=AVATARS.map(a=>({style:{cssText:''},dataset:{},querySelector:()=>({value:a.id,checked:false})})),labels=new Map();let captured=false;
  const picker={dataset:{selected:AVATARS[0].id},disabled:false,classList:{add:n=>classes.add(n),remove:n=>classes.delete(n)},closest:()=>null,getBoundingClientRect:()=>({width:390}),querySelectorAll:()=>options,querySelector:s=>{if(!labels.has(s))labels.set(s,{textContent:''});return labels.get(s);}};
  const stage={closest:()=>picker,getBoundingClientRect:()=>({width:390}),setPointerCapture(){captured=true;},hasPointerCapture:()=>captured,releasePointerCapture(){captured=false;}};
  const card={closest:s=>s==='.character-arc'?stage:picker};
  bindAvatarGestures({addEventListener:(type,cb)=>{events[type]=cb;}},id=>selected.push(id));
  const send=(type,extra={})=>events[type]({target:card,pointerId:7,button:0,isPrimary:true,clientX:200,clientY:100,preventDefault(){},...extra});
  return {send,stage,card,picker,classes,selected,first:AVATARS[0].id,next:AVATARS[1].id};
}
test('touch capture transferred from an avatar card to its stage does not cancel the swipe',async()=>{
  const f=await fixture();f.send('pointerdown');f.send('pointermove',{clientX:180});
  f.send('lostpointercapture');assert.ok(f.classes.has('is-dragging'));
  f.send('pointermove',{clientX:120});f.send('pointerup',{clientX:120});
  assert.deepEqual(f.selected,[f.next]);assert.equal(f.picker.dataset.selected,f.next);assert.ok(!f.classes.has('is-dragging'));
});
test('losing stage capture or cancelling a touch restores the selection without committing',async()=>{
  for(const kind of ['lostpointercapture','pointercancel']){
    const f=await fixture();f.send('pointerdown');f.send('pointermove',{clientX:170});f.send(kind,{target:f.stage});f.send('pointerup',{clientX:110});
    assert.deepEqual(f.selected,[]);assert.equal(f.picker.dataset.selected,f.first);assert.ok(!f.classes.has('is-dragging'));
  }
});
test('vertical touch intent remains available for page scrolling',async()=>{
  const f=await fixture();f.send('pointerdown');f.send('pointermove',{clientY:130});f.send('pointerup',{clientY:150});assert.deepEqual(f.selected,[]);assert.ok(!f.classes.has('is-dragging'));
});
