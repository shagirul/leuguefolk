/* ONE worker for app-shell caching AND FCM background notifications.
 * Register notificationclick BEFORE importing Firebase: its default handler can otherwise override yours.
 */
const CACHE='agree-shell-v3';
const SDK_CACHE='agree-firebase-sdk-v1';
const FIREBASE_SDK=['firebase-app.js','firebase-auth.js','firebase-firestore.js','firebase-messaging.js'].map(f=>`https://www.gstatic.com/firebasejs/12.19.0/${f}`);
const PRECACHE=['/','/index.html','/styles.css','/app.js','/firestore-api.mjs','/domain.mjs','/queue.js','/manifest.webmanifest','/firebase-config.js','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('notificationclick',event=>{
  const raw=event.notification?.data||{};
  const msg=raw.FCM_MSG||raw;
  const fcmLink=msg.fcmOptions?.link||msg.fcm_options?.link;
  const relative=msg.data?.path||raw.path;
  const destination=fcmLink||(relative?new URL(relative,self.location.origin).href:null);
  if(!destination)return; // SDK fallback handles unknown notification types.
  let u;try{u=new URL(destination);}catch{return;}
  if(u.origin!==self.location.origin)return; // Prevent arbitrary cross-origin redirects.
  event.stopImmediatePropagation();
  event.notification.close();
  event.waitUntil((async()=>{
    const all=await clients.matchAll({type:'window',includeUncontrolled:true});
    const existing=all.find(c=>{try{return new URL(c.url).origin===u.origin;}catch{return false;}});
    if(existing){await existing.navigate(u.href);await existing.focus();return;}
    await clients.openWindow(u.href);
  })());
});
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // allSettled: one unavailable optional asset shouldn't break worker installation.
    await Promise.allSettled(PRECACHE.map(u=>cache.add(new Request(u,{cache:'reload'}))));
    const sdk=await caches.open(SDK_CACHE);
    await Promise.allSettled(FIREBASE_SDK.map(async url=>{const response=await fetch(url,{mode:'cors'});if(response.ok)await sdk.put(url,response);}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const name of await caches.keys())if(name.startsWith('agree-')&&!([CACHE,SDK_CACHE].includes(name)))await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/12.19.0/')){
    event.respondWith((async()=>{
      const cache=await caches.open(SDK_CACHE);const hit=await cache.match(req);if(hit)return hit;
      const response=await fetch(req);if(response.ok)cache.put(req,response.clone());return response;
    })());return;
  }
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      try{const fresh=await fetch(req);if(fresh.ok){const cache=await caches.open(CACHE);cache.put('/index.html',fresh.clone());}return fresh;}
      catch{const hit=await caches.match('/index.html');return hit||Response.error();}
    })());return;
  }
  // Config prefers fresh online, cached copy as offline fallback.
  if(url.pathname==='/firebase-config.js'){
    event.respondWith(fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r;}).catch(()=>caches.match(req)));return;
  }
  if(PRECACHE.includes(url.pathname)){
    // Refresh app code when online, or installed PWAs can be stuck on outdated assets.
    if(['/app.js','/firestore-api.mjs','/domain.mjs','/queue.js','/styles.css','/manifest.webmanifest'].includes(url.pathname)){
      event.respondWith(fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r;})
        .catch(()=>caches.match(req).then(r=>r||Response.error())));return;
    }
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(req,r.clone()));return r;})));return;
  }
});
self.addEventListener('sync',event=>{
  // Web browsers don't guarantee Background Sync or authenticated work while closed.
  // Wake an open client to send its durable IndexedDB queue; reopening also always flushes.
  if(event.tag==='agree-queued-actions')event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(all=>Promise.all(all.map(c=>c.postMessage({type:'FLUSH_QUEUE'})))));
});
// The FCM SDK automatically displays notification payloads in the background.
// DO NOT call showNotification onBackgroundMessage as this would duplicate them.
try{
  importScripts('/firebase-config.js');
  const cfg=self.AGREE_FIREBASE?.firebaseConfig;
  if(self.AGREE_FIREBASE?.features?.push!==false&&self.AGREE_FIREBASE?.features?.leaderboards!==false&&cfg?.apiKey&&!cfg.apiKey.startsWith('PASTE')){
    importScripts('https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js','https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js');
    firebase.initializeApp(cfg);firebase.messaging();
  }
}catch(err){console.warn('[Agree SW] FCM unavailable; offline shell still works.',err);}
