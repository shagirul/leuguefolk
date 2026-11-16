const test=require('node:test'),assert=require('node:assert/strict');
class Events{
 constructor(){this.listeners={};}addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(f=>f!==fn);}emit(type,data={}){const event={target:this,preventDefault(){this.defaultPrevented=true;},...data};for(const fn of [...this.listeners[type]||[]])fn(event);return event;}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function worker(id){const w=new Events();return Object.assign(w,{id,state:'installed',messages:[],postMessage(message){this.messages.push(message);}});}
async function fixture({standalone=false,ios=false,initialController=true,waiting=false,related,boot,registerFailure=false}={}){
 const {createPwaController}=await import('../public/pwa.mjs'),win=new Events(),doc=new Events(),sw=new Events(),registration=new Events(),timers=new Map(),button={hidden:true};let timerId=0,reloads=0,reason=null,registered=0;
 const media=new Events();media.matches=standalone;win.matchMedia=()=>media;win.LEAGUEFOLK_PWA_BOOT=boot;
 win.setTimeout=(fn,ms)=>{const id=++timerId;timers.set(id,{fn,ms});return id;};win.clearTimeout=id=>timers.delete(id);
 doc.querySelectorAll=()=>[button];doc.visibilityState='visible';
 const nav={onLine:true,standalone:ios,serviceWorker:sw,...(related?{getInstalledRelatedApps:related}:{})};
 const location={origin:'https://app.test',pathname:'/'};
 sw.controller=initialController?worker('active'):null;
 registration.active=sw.controller;registration.waiting=waiting?worker('waiting'):null;registration.installing=null;registration.update=async()=>{};
 sw.register=async(url,options)=>{registered++;if(registerFailure&&registered===1)throw Error('Transient registration failure');assert.equal(url,'/firebase-messaging-sw.js');assert.equal(options.updateViaCache,'none');return registration;};
 const controller=createPwaController({window:win,document:doc,navigator:nav,location,blocker:()=>reason,reload:()=>reloads++});
 await controller.start();await tick();
 return {win,doc,sw,registration,media,nav,location,button,controller,timers,get reloads(){return reloads;},get registered(){return registered;},block(value){reason=value;},activate(){sw.controller=registration.waiting;registration.waiting=null;sw.emit('controllerchange');}};
}
test('install navigation is hidden in standalone/iOS app mode and detected installations in ordinary tabs',async()=>{
 for(const options of [{standalone:true},{ios:true},{related:async()=>[{platform:'webapp',id:'https://app.test/'}]}]){const f=await fixture(options);assert.equal(f.button.hidden,true);assert.equal(f.controller.getState().installed,true);}
 const f=await fixture({related:async()=>[{platform:'webapp',id:'https://other.test/'}]});assert.equal(f.button.hidden,false);
 f.location.pathname='/install';f.controller.sync();assert.equal(f.button.hidden,true,'Do not offer an install page link from itself');
});
test('the native prompt is single-use, double clicks are blocked, dismissal permits a fresh later prompt',async()=>{
 const f=await fixture();let resolve,opened=0;const first=f.win.emit('beforeinstallprompt',{prompt:()=>{opened++;return new Promise(r=>resolve=r);}});
 assert.equal(first.defaultPrevented,true);assert.equal(f.controller.getState().canPrompt,true);
 const pending=f.controller.install();f.controller.install();assert.equal(opened,1);assert.equal(f.controller.getState().installBusy,true);
 resolve({outcome:'dismissed'});await pending;await f.controller.install();assert.equal(opened,1);assert.equal(f.controller.getState().canPrompt,false);
 f.win.emit('beforeinstallprompt',{prompt:async()=>{opened++;return {outcome:'accepted'};}});await f.controller.install();assert.equal(opened,2);assert.equal(f.controller.getState().installed,false,'Accepted is not yet an appinstalled event');
 f.win.emit('appinstalled');assert.equal(f.controller.getState().installed,true);assert.equal(f.button.hidden,true);
});
test('early install events, unsupported/private APIs, rejection and a later reinstall do not strand the UI',async()=>{
 const f=await fixture({related:async()=>{throw Error('Not available');},boot:{prompt:{prompt:async()=>{throw Error('Expired');}}}});
 assert.equal(f.controller.getState().canPrompt,true);await f.controller.install();assert.match(f.controller.getState().installMessage,/browser/);
 f.win.emit('appinstalled');f.nav.getInstalledRelatedApps=async()=>[];await f.controller.detectInstalled();assert.equal(f.button.hidden,true,'OS inventory can lag appinstalled');
 f.win.emit('beforeinstallprompt',{prompt:async()=>({outcome:'dismissed'})});assert.equal(f.button.hidden,false);assert.equal(f.controller.getState().canPrompt,true);
});
test('a slow OS inventory cannot flash the install icon or override a newer browser install event',async()=>{
 let resolve;const f=await fixture({related:()=>new Promise(r=>resolve=r)});assert.equal(f.button.hidden,true);
 f.win.emit('beforeinstallprompt',{prompt:async()=>({outcome:'dismissed'})});assert.equal(f.button.hidden,false);
 resolve([{platform:'webapp',id:'https://app.test/'}]);await tick();assert.equal(f.button.hidden,false);
});
test('manual install instructions cover iPhone, iPad desktop mode, Android, desktop Safari and in-app browsers',async()=>{
 const {installInstructions,renderInstallContent}=await import('../public/pwa.mjs');
 assert.match(installInstructions({userAgent:'iPhone Safari'}).join(' '),/Share.*Add to Home Screen/);
 assert.match(installInstructions({platform:'MacIntel',maxTouchPoints:5}).join(' '),/Share/);
 assert.match(installInstructions({userAgent:'Android'}).join(' '),/Install app/);
 assert.match(installInstructions({userAgent:'Macintosh Safari'}).join(' '),/Add to Dock/);
 assert.match(installInstructions({userAgent:'Instagram iPhone'}).join(' '),/main browser/);
 assert.doesNotMatch(renderInstallContent({installed:false,canPrompt:false},{}),/data-pwa-action="install"/);
 assert.match(renderInstallContent({secure:false},{}),/Open secure install page/);
});
test('a browser denying access to its service worker container still has a usable manual install page',async()=>{
 const {createPwaController}=await import('../public/pwa.mjs'),win=new Events(),doc=new Events(),nav={onLine:true};Object.defineProperty(nav,'serviceWorker',{get(){throw Error('SecurityError');}});
 const pwa=createPwaController({window:win,document:doc,navigator:nav,location:{origin:'https://app.test',pathname:'/'}});assert.equal(await pwa.start(),null);assert.equal(pwa.getState().workerReady,false);
});
test('first installation and first claim never show an update or trigger a reload',async()=>{
 const f=await fixture({initialController:false,waiting:true});assert.equal(f.controller.getState().updateAvailable,false);f.sw.controller=worker('first');f.sw.emit('controllerchange');assert.equal(f.reloads,0);assert.equal(f.controller.getState().updateAvailable,false);
 await f.controller.start();assert.equal(f.registered,1);
});
test('a waiting update protects edits and reloads exactly once only after activation',async()=>{
 const f=await fixture({waiting:true});assert.equal(f.controller.getState().updateAvailable,true);
 f.block('dirty');await f.controller.applyUpdate();assert.equal(f.controller.getState().confirmDiscard,true);assert.equal(f.registration.waiting.messages.length,0);
 const w=f.registration.waiting;await Promise.all([f.controller.applyUpdate(true),f.controller.applyUpdate(true)]);assert.deepEqual(w.messages,[{type:'SKIP_WAITING'}]);assert.equal(f.reloads,0);
 f.activate();f.sw.emit('controllerchange');assert.equal(f.reloads,1);
});
test('an update activated in another tab does not discard this tab’s edits',async()=>{
 const f=await fixture({waiting:true});f.block('dirty');f.activate();assert.equal(f.reloads,0);assert.equal(f.controller.getState().updateAvailable,true);
 await f.controller.applyUpdate();assert.equal(f.controller.getState().confirmDiscard,true);await f.controller.applyUpdate(true);assert.equal(f.reloads,1);
});
test('new edits or an in-flight action during download are protected at activation too',async()=>{
 for(const reason of ['dirty','busy']){const f=await fixture({waiting:true});await f.controller.applyUpdate();f.block(reason);f.activate();assert.equal(f.reloads,0);assert.equal(f.controller.getState().applying,false);}
});
test('the latest waiting worker is selected after rechecking, and offline downloaded updates still activate',async()=>{
 const f=await fixture({waiting:true}),old=f.registration.waiting,newest=worker('latest');f.registration.installing=old;f.registration.emit('updatefound');f.registration.installing=null;f.registration.update=async()=>{old.state='redundant';old.emit('statechange');f.registration.waiting=newest;};
 await f.controller.applyUpdate();assert.equal(old.messages.length,0);assert.equal(newest.messages.length,1);assert.equal(f.controller.getState().applying,true);f.activate();assert.equal(f.reloads,1);
 const offline=await fixture({waiting:true});offline.nav.onLine=false;offline.registration.update=async()=>{throw Error('Must not request network offline');};await offline.controller.applyUpdate();assert.equal(offline.registration.waiting.messages.length,1);
});
test('failed or stalled updates are retryable and never reload into an incomplete build',async()=>{
 const f=await fixture();f.registration.update=async()=>{throw Error('Offline');};await f.controller.applyUpdate();assert.equal(f.reloads,0);assert.equal(f.controller.getState().applying,false);assert.match(f.controller.getState().error,/current version is safe/);
 const stalled=await fixture({waiting:true});await stalled.controller.applyUpdate();const timeout=[...stalled.timers.values()].find(t=>t.ms===15000);timeout.fn();assert.equal(stalled.controller.getState().applying,false);assert.equal(stalled.reloads,0);assert.match(stalled.controller.getState().error,/try again/);
});
test('a transient initial registration failure is retried when connectivity returns',async()=>{
 const f=await fixture({registerFailure:true});assert.equal(f.registered,1);f.win.emit('online');await tick();assert.equal(f.registered,2);assert.equal(f.reloads,0);
});
