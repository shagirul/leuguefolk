const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function installInstructions(nav={}){
  const ua=nav.userAgent||'',ios=/iPhone|iPad|iPod/.test(ua)||(nav.platform==='MacIntel'&&nav.maxTouchPoints>1);
  if(/FBAN|FBAV|Instagram|MicroMessenger|WhatsApp|; wv\)/i.test(ua))return ['Open this link in your main browser using this app’s menu.',ios?'In Safari, tap Share → Add to Home Screen.':'In Chrome or Edge, open the menu → Install app.'];
  if(ios)return ['Tap Share in your browser.','Choose Add to Home Screen, then Add. Enable Open as Web App if offered.','If that option is missing, open this page in Safari.'];
  if(/Android/i.test(ua))return ['Open your browser menu (⋮).','Choose Install app or Add to Home screen and confirm.','If installation is unavailable, open this page in Chrome or Edge.'];
  if(/Macintosh/.test(ua)&&/Safari/.test(ua)&&!/Chrome|Chromium|Edg/.test(ua))return ['In Safari, choose File → Add to Dock.','Confirm Add, then open Leaguefolk from your Dock.'];
  return ['Use the install icon in your browser’s address bar, or its menu → Install app.','If your browser doesn’t offer installation, open this page in Chrome, Edge or Safari.'];
}
export function renderInstallContent(state,nav){
  if(state.secure===false)return '<section class="pwa-install-card"><h1>Use the secure app link.</h1><p>Installing Leaguefolk requires HTTPS. Open the secure install page in your main browser.</p><a class="btn" href="https://leaguefolk-2b1c2.web.app/install">Open secure install page</a></section>';
  const status=state.installed?'Leaguefolk is installed. Open it from your home screen or app launcher.':state.installMessage||(state.workerReady?'Open your league like an app. Your saved matches stay available offline.':'Add Leaguefolk to your home screen for quick access.');
  return `<section class="pwa-install-card"><img src="/icons/icon-192x192.png" width="72" height="72" alt=""/><h1>Your league, one tap away.</h1><p role="status">${esc(status)}</p>${!state.installed&&(state.canPrompt||state.installBusy)?`<button type="button" class="btn" data-pwa-action="install" ${state.installBusy?'disabled':''}>${state.installBusy?'Opening installer…':'Install Leaguefolk'}</button>`:''}${!state.installed?`<ol class="pwa-install-steps">${installInstructions(nav).map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p class="pwa-install-note">Installation is controlled by your browser. No app-store download or payment is needed.</p>`:''}</section>`;
}

export function createPwaController({window:win,document:doc,navigator:nav,location=win.location,onChange=()=>{},onRegistration=()=>{},reload=()=>win.location.reload(),blocker=()=>null}){
  const boot=win.LEAGUEFOLK_PWA_BOOT||{};let sw;
  try{sw=nav.serviceWorker;}catch{/* Sandboxed/private browsers may deny even access to the container. */}
  const media=['standalone','minimal-ui','fullscreen'].map(mode=>win.matchMedia?.(`(display-mode: ${mode})`)).filter(Boolean);
  let sessionInstalled=!!boot.installed,relatedInstalled=false,detection=0,prompt=boot.prompt||null,registration=null,started=null,requestedStart=false,installDetectionPending=!!nav.getInstalledRelatedApps&&!boot.installed;
  let loadedController=sw?.controller,hadController=!!loadedController,changedController=false,waiting=null,dismissed=null,watching=new WeakSet(),timer=null,activationTimer=null,reloading=false,checking=false,lastCheck=0,approvedDiscard=false;
  const schedule=(fn,ms)=>(win.setTimeout||setTimeout)(fn,ms),cancel=id=>(win.clearTimeout||clearTimeout)(id);
  const state={installed:false,secure:win.isSecureContext!==false,canPrompt:false,installBusy:false,installMessage:'',workerReady:!!sw?.controller,updateAvailable:false,applying:false,confirmDiscard:false,error:''};
  const standalone=()=>nav.standalone===true||media.some(query=>query.matches);
  function emit(){state.installed=standalone()||sessionInstalled||relatedInstalled;state.canPrompt=!!prompt&&!state.installed&&state.secure;sync();onChange({...state});}
  async function detectInstalled(){
    const current=++detection;
    if(prompt||sessionInstalled||standalone()){installDetectionPending=false;emit();return;}
    if(nav.getInstalledRelatedApps){try{
      let deadline;
      const apps=await Promise.race([Promise.resolve().then(()=>nav.getInstalledRelatedApps()),new Promise(resolve=>{deadline=schedule(()=>resolve(null),2000);})]).finally(()=>cancel(deadline));
      if(current!==detection)return;
      const origin=location?.origin;
      if(apps)relatedInstalled=apps.some(app=>app.platform==='webapp'&&[app.id,app.url].some(value=>{try{const u=new URL(value,origin);return u.origin===origin&&(u.pathname==='/'||u.pathname==='/manifest.webmanifest');}catch{return false;}}));
      // appinstalled can precede this API's OS inventory update. Trust that
      // event for this page lifetime; a fresh install prompt clears it again.
    }catch{/* Unsupported/private mode: rely on live display-mode and install events. */}}
    installDetectionPending=false;emit();
  }
  win.addEventListener?.('beforeinstallprompt',event=>{
    event.preventDefault();detection++;installDetectionPending=false;prompt=event;sessionInstalled=false;relatedInstalled=false;state.installMessage='';emit();
  });
  win.addEventListener?.('appinstalled',()=>{sessionInstalled=true;installDetectionPending=false;prompt=null;boot.prompt=null;state.installBusy=false;state.installMessage='';emit();});
  media.forEach(query=>{const changed=()=>{if(standalone()){prompt=null;boot.prompt=null;}emit();};if(query.addEventListener)query.addEventListener('change',changed);else query.addListener?.(changed);});
  async function install(){
    if(state.installBusy||state.installed||!state.secure||!prompt)return;
    const event=prompt;prompt=null;boot.prompt=null;state.installBusy=true;state.installMessage='';emit();
    try{
      // Must be called synchronously from the user's click; an event is single-use.
      const result=await event.prompt();
      const choice=result?.outcome?result:await event.userChoice;
      state.installMessage=choice?.outcome==='accepted'?'Installation requested. Look for Leaguefolk on your home screen or app launcher.':'Installation dismissed. You can still install from your browser menu.';
    }catch{state.installMessage='The installer could not open. Use your browser’s install option below.';}
    finally{state.installBusy=false;emit();}
  }
  function inspectWaiting(){
    waiting=registration?.waiting||null;
    if(!hadController&&(!registration?.active||registration.active===waiting)&&!state.applying)waiting=null;
    state.updateAvailable=!!waiting||changedController;
    if(waiting!==dismissed)state.error='';
    emit();
  }
  function watch(worker){
    if(!worker||watching.has(worker))return;watching.add(worker);
    worker.addEventListener('statechange',()=>{
      if(worker.state==='installed')inspectWaiting();
      // A redundant worker may simply have been superseded by a newer release.
      // applyUpdate follows the current installer and handles failure itself.
    });
  }
  function changed(){
    const controller=sw?.controller;
    state.workerReady=!!controller;
    if(!hadController&&!state.applying){hadController=!!controller;loadedController=controller;waiting=null;state.updateAvailable=false;emit();return;}
    if(controller&&controller!==loadedController){changedController=true;state.updateAvailable=true;
      if(state.applying){cancel(activationTimer);finishReload();}else emit();
    }
  }
  function finishReload(){
    if(reloading)return;
    if(blocker()==='busy'){state.applying=false;state.error='Finish the current action, then update.';emit();return;}
    if(blocker()==='dirty'&&!approvedDiscard){state.applying=false;state.confirmDiscard=true;emit();return;}
    reloading=true;reload();
  }
  function settled(worker){
    if(!worker||['installed','redundant','activated'].includes(worker.state))return Promise.resolve();
    return new Promise((resolve,reject)=>{const done=()=>{if(['installed','redundant','activated'].includes(worker.state)){cancel(timeout);worker.removeEventListener?.('statechange',done);resolve();}};const timeout=schedule(()=>{worker.removeEventListener?.('statechange',done);reject(Error('Update download is taking too long. Please retry.'));},25000);worker.addEventListener('statechange',done);done();});
  }
  async function applyUpdate(discard=false){
    if(state.applying||reloading)return;
    const reason=blocker();
    if(reason==='busy'){state.error='Finish the current action, then update.';emit();return;}
    if(reason==='dirty'&&!discard){state.confirmDiscard=true;dismissed=null;emit();return;}
    approvedDiscard=discard;state.confirmDiscard=false;state.applying=true;state.error='';dismissed=null;emit();
    try{
      // Recheck online before activating: a waiting worker may have been superseded.
      if(registration&&nav.onLine!==false){try{await registration.update();}catch(error){if(!registration.waiting&&!changedController)throw error;}}
      await settled(registration?.installing);waiting=registration?.waiting||null;
      if(waiting){
        waiting.postMessage({type:'SKIP_WAITING'});
        activationTimer=schedule(()=>{if(!reloading){state.applying=false;state.error='The update is ready but could not activate. Please try again.';emit();}},15000);
      }else if(changedController||(loadedController&&sw?.controller!==loadedController))finishReload();
      else{state.applying=false;state.error='No downloaded update is ready yet. Connect to the internet and try again.';emit();}
    }catch{state.applying=false;state.error='Could not download the update. Your current version is safe. Connect and try again.';emit();}
  }
  async function checkForUpdate(force=false){
    if(!registration){if(requestedStart&&!started)start();return;}
    if(checking||nav.onLine===false||(!force&&Date.now()-lastCheck<60000))return;
    checking=true;lastCheck=Date.now();
    try{await registration.update();inspectWaiting();}catch{/* Offline/update failure must not disable the existing app. */}finally{checking=false;}
  }
  function sync(){
    state.installed=standalone()||sessionInstalled||relatedInstalled;state.canPrompt=!!prompt&&!state.installed&&state.secure;
    doc.querySelectorAll?.('[data-action="installPage"]').forEach(button=>{button.hidden=state.installed||installDetectionPending||/^\/install\/?$/.test(location?.pathname||'');});
    if(!doc.createElement||!doc.body)return;
    let portal=doc.getElementById('pwa-update');
    const hidden=!state.updateAvailable||(!state.applying&&!state.confirmDiscard&&dismissed===(waiting||'active'));
    if(hidden){portal?.remove();return;}
    if(!portal){portal=doc.createElement('section');portal.id='pwa-update';portal.className='pwa-update';portal.setAttribute('role','dialog');portal.setAttribute('aria-labelledby','pwa-update-title');portal.setAttribute('aria-live','polite');doc.body.append(portal);}
    const title=state.confirmDiscard?'Update and discard edits?':'New version available';
    const message=state.error||(state.confirmDiscard?'Unsaved edits will be lost. Saved and queued matches will stay safe.':state.applying?'Updating Leaguefolk…':'Get the latest Leaguefolk improvements.');
    const html=`<div><strong id="pwa-update-title">${title}</strong><p>${esc(message)}</p></div><div class="pwa-update-actions"><button type="button" data-pwa-action="${state.confirmDiscard?'keepEditing':'later'}" ${state.applying?'disabled':''}>${state.confirmDiscard?'Keep editing':'Later'}</button><button type="button" data-pwa-action="${state.confirmDiscard?'discardUpdate':'update'}" ${state.applying?'disabled':''}>${state.applying?'Updating…':state.confirmDiscard?'Update anyway':'Update'}</button></div>`;
    if(portal.innerHTML!==html)portal.innerHTML=html;
  }
  doc.addEventListener?.('click',event=>{
    const action=event.target.closest?.('[data-pwa-action]')?.dataset.pwaAction;if(!action)return;
    if(action==='install')install();
    else if(action==='update')applyUpdate();
    else if(action==='discardUpdate')applyUpdate(true);
    else if(action==='later'||action==='keepEditing'){state.confirmDiscard=false;dismissed=waiting||'active';emit();}
  });
  const dirty=event=>{const form=event.target.closest?.('form');if(form)form.dataset.pwaDirty='true';};
  doc.addEventListener?.('input',dirty);doc.addEventListener?.('change',dirty);
  doc.addEventListener?.('visibilitychange',()=>{if(doc.visibilityState==='visible'){detectInstalled();checkForUpdate();}});
  win.addEventListener?.('online',()=>checkForUpdate(true));
  win.addEventListener?.('pageshow',()=>{detectInstalled();checkForUpdate();});
  sw?.addEventListener?.('controllerchange',changed);
  async function start(){
    if(started)return started;
    requestedStart=true;
    started=(async()=>{
      detectInstalled();
      if(!sw?.register)return null;
      try{
        registration=await sw.register('/firebase-messaging-sw.js',{scope:'/',updateViaCache:'none'});onRegistration(registration);
        registration.addEventListener('updatefound',()=>watch(registration.installing));watch(registration.installing);inspectWaiting();
        const poll=()=>{checkForUpdate();timer=schedule(poll,5*60000);};timer=schedule(poll,5*60000);
        checkForUpdate(true);return registration;
      }catch{started=null;return null;}
    })();return started;
  }
  state.installed=standalone()||sessionInstalled;
  return {start,sync,install,applyUpdate,checkForUpdate,detectInstalled,getState:()=>({...state}),dispose(){cancel(timer);cancel(activationTimer);}};
}
