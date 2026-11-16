/* ONE worker for app-shell caching AND FCM background notifications.
 * Register notificationclick BEFORE importing Firebase: its default handler can otherwise override yours.
 */
const BUILD='52e810a7fc6e2ae6';
const CACHE='agree-shell-'+BUILD;
const SDK_CACHE='agree-firebase-sdk-v1';
const FIREBASE_SDK=['firebase-app.js','firebase-auth.js','firebase-firestore.js','firebase-messaging.js'].map(f=>`https://www.gstatic.com/firebasejs/12.19.0/${f}`);
const AVATAR_ASSETS=['istj-anchor','estj-captain','isfj-guardian','esfj-connector','esfp-showstopper','isfp-freebird','estp-daredevil','istp-virtuoso','infj-oracle','enfj-catalyst','infp-dreamer','enfp-spark','intp-analyst','entp-maverick','intj-strategist','entj-conqueror'].map(id=>`/assets/characters/${id}.webp`);
const ACHIEVEMENT_ASSETS=['01_whitewash','02_the_untouchable','03_rival_dominator','04_three_peat','05_table_conqueror','06_perfect_reign','locked_placeholder'].map(id=>`/assets/achievements/${id}.png`);
const APP_ICONS=["/icons/icon-192x192.png","/icons/icon-512x512.png","/icons/icon-maskable-192x192.png","/icons/icon-maskable-512x512.png","/icons/icon-monochrome-192x192.png","/icons/icon-monochrome-512x512.png","/apple-touch-icon.png","/favicon.svg","/favicon.ico","/favicon-16x16.png","/favicon-32x32.png","/safari-pinned-tab.svg"];
const RATING_ASSETS=['/ratings.mjs','/periods.mjs','/vendor/openskill.mjs','/vendor/openskill.LICENSE.txt'];
const PRECACHE=['/pwa.mjs','/pwa.css','/pwa-boot.js',...RATING_ASSETS,...APP_ICONS,'/','/index.html','/styles.css','/avatars.css','/account.css','/leaderboard.css','/invites.css','/app.js','/firestore-api.mjs','/domain.mjs','/avatars.mjs','/characters.mjs','/account.mjs','/achievements.mjs','/leaderboard.mjs','/invites.mjs',...AVATAR_ASSETS,...ACHIEVEMENT_ASSETS,'/assets/stats/matches-played.png','/assets/stats/win-ratio.png','/assets/stats/pd-ratio.png','/queue.js','/outbox.mjs','/record-match.mjs','/record-match.css','/activity.mjs','/bulk-accept.mjs','/matchups.mjs','/matchups.css','/activity.css','/manifest.webmanifest','/firebase-config.js','/icons/icon-192.png','/icons/icon-512.png'];
const CORE=PRECACHE.filter(path=>/\.(?:m?js|css|webmanifest)$/.test(path)||path==='/index.html');
const META='/__leaguefolk_release__';
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
    const installedAt=Date.now();
    try{
      await cache.put(META,new Response(JSON.stringify({build:BUILD,installedAt,complete:false})));
      // A partial update must never replace a working offline app.
      await Promise.all(CORE.map(async url=>{
        const response=await fetch(new Request(url,{cache:'reload'})),type=response.headers.get('Content-Type')||'';
        const valid=/\.m?js$/.test(url)?/(?:java|ecma)script/i.test(type):/\.css$/.test(url)?/text\/css/i.test(type):url==='/index.html'?/text\/html/i.test(type):/json/i.test(type);
        if(!response.ok||!valid)throw Error('Incomplete app update: '+url);
        await cache.put(url,response);
      }));
      const sdk=await caches.open(SDK_CACHE);
      await Promise.all(FIREBASE_SDK.map(async url=>{
        const cached=await sdk.match(url);
        if(cached&&/(?:java|ecma)script/i.test(cached.headers.get('Content-Type')||''))return;
        const response=await fetch(url,{mode:'cors',cache:'reload'});
        if(!response.ok||!/(?:java|ecma)script/i.test(response.headers.get('Content-Type')||''))throw Error('Firebase SDK unavailable: '+url);
        await sdk.put(url,response);
      }));
      await Promise.allSettled(PRECACHE.filter(url=>!CORE.includes(url)).map(url=>cache.add(new Request(url,{cache:'reload'}))));
      await cache.put(META,new Response(JSON.stringify({build:BUILD,installedAt,complete:true})));
      // Updates wait for explicit approval. First installs activate automatically.
    }catch(error){await caches.delete(CACHE);throw error;}
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    await self.clients.claim();
    const own=await (await (await caches.open(CACHE)).match(META))?.json();
    const older=[];
    for(const name of await caches.keys()){
      if(!name.startsWith('agree-shell-')||name===CACHE)continue;
      const info=await (await (await caches.open(name)).match(META))?.json();
      const legacy=Number(name.match(/-v(\d+)$/)?.[1]||0);
      if(!info&&!legacy)continue; // A newly opened cache may not have its metadata yet.
      // Never erase a newer, still-installing worker's cache. Keep one previous
      // generation for tabs that haven't finished switching controllers.
      if(!info||info.installedAt<=own?.installedAt)older.push({name,at:info?.installedAt||0,legacy});
    }
    older.sort((a,b)=>b.at-a.at||b.legacy-a.legacy);
    await Promise.all(older.slice(1).map(({name})=>caches.delete(name)));
  })());
});
self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
  if(event.data?.type==='GET_VERSION')event.ports?.[0]?.postMessage({version:BUILD});
});
// Clone while the body is still unused; keep cache I/O alive without delaying the response.
function cacheResponse(event,name,request,response){
  if(!response.ok)return;
  const copy=response.clone();
  event.waitUntil(caches.open(name).then(cache=>cache.put(request,copy)).catch(error=>console.warn('[Agree SW] Cache update failed.',error)));
}
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname==='www.gstatic.com'&&url.pathname.startsWith('/firebasejs/12.19.0/')){
    event.respondWith((async()=>{
      const cache=await caches.open(SDK_CACHE);const hit=await cache.match(req);if(hit)return hit;
      const response=await fetch(req);cacheResponse(event,SDK_CACHE,req,response);return response;
    })());return;
  }
  if(url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE),hit=await cache.match('/index.html');
      if(hit)return hit;
      try{const fresh=await fetch(req);cacheResponse(event,CACHE,'/index.html',fresh);return fresh;}
      catch{return Response.error();}
    })());return;
  }
  // Config prefers fresh online, cached copy as offline fallback.
  if(url.pathname==='/firebase-config.js'){
    event.respondWith(fetch(req).then(r=>{cacheResponse(event,CACHE,req,r);return r;}).catch(()=>caches.open(CACHE).then(cache=>cache.match(req)).then(r=>r||Response.error())));return;
  }
  if(PRECACHE.includes(url.pathname)){
    // Pin every module/style to this installed release, including query strings.
    // A waiting worker owns a separate cache; global caches.match could mix builds.
    event.respondWith(caches.open(CACHE).then(async cache=>{
      const hit=await cache.match(url.pathname);if(hit)return hit;
      try{const response=await fetch(req);cacheResponse(event,CACHE,url.pathname,response);return response;}
      catch{return Response.error();}
    }));return;
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
