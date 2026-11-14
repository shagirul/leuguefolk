const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function fixture(){
  const source=fs.readFileSync(require.resolve('../public/app.js'),'utf8'),fn=source.slice(source.indexOf('function bindDrawerGestures('),source.indexOf('function render(){'));
  const handlers={},classes=new Set(),styles=new Map(),timers=[];let dismissals=0;
  const sheet={isConnected:true,classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)},style:{setProperty:(k,v)=>styles.set(k,v),removeProperty:k=>styles.delete(k)},getBoundingClientRect:()=>({height:400})};
  const handle={disabled:false,closest:()=>sheet,setPointerCapture(){}};
  const target={addEventListener:(type,fn)=>handlers[type]=fn};
  vm.runInNewContext(fn+';bindDrawerGestures(target,onDismiss)',{target,onDismiss:()=>dismissals++,setTimeout:fn=>timers.push(fn)});
  const emit=(type,y,time=0,extra={})=>{const e={target:{closest:()=>handle},pointerId:1,button:0,clientY:y,timeStamp:time,preventDefault(){},stopImmediatePropagation(){this.stopped=true;},...extra};handlers[type](e);return e;};
  return {sheet,handle,classes,styles,timers,emit,dismissals:()=>dismissals};
}
test('drawers follow the handle, snap back on short drags and suppress the resulting click',()=>{
  const f=fixture();f.emit('pointerdown',0);f.emit('pointermove',30,200);assert.equal(f.styles.get('--drawer-y'),'30px');f.emit('pointerup',30,400);
  assert.equal(f.classes.has('is-closing'),false);assert.equal(f.styles.size,0);assert.equal(f.emit('click',30).stopped,true);assert.equal(f.dismissals(),0);
});
test('a downward drag or quick flick dismisses once after the exit animation',()=>{
  for(const [distance,time] of [[110,300],[35,30]]){const f=fixture();f.emit('pointerdown',0);f.emit('pointermove',distance,time);f.emit('pointerup',distance,time+10);assert.equal(f.classes.has('is-closing'),true);assert.equal(f.dismissals(),0);f.timers.forEach(fn=>fn());assert.equal(f.dismissals(),1);}
});
test('cancelled, upward, disabled and stale drawer gestures never dismiss',()=>{
  const f=fixture();f.emit('pointerdown',50);f.emit('pointermove',0,50);f.emit('pointerup',0,60);assert.equal(f.timers.length,0);
  f.emit('pointerdown',0);f.emit('pointermove',150,100);f.emit('pointercancel',150);assert.equal(f.classes.has('is-dragging'),false);assert.equal(f.styles.size,0);
  f.handle.disabled=true;f.emit('pointerdown',0);f.emit('pointermove',200,100);f.emit('pointerup',200,110);assert.equal(f.timers.length,0);
  f.handle.disabled=false;f.emit('pointerdown',0);f.sheet.isConnected=false;f.emit('pointermove',200,100);f.emit('pointerup',200,110);assert.equal(f.timers.length,0);
});
