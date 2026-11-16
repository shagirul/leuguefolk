const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.LEAGUEFOLK_PLAYWRIGHT_MODULE||'playwright');
let version=1,brokenCore=false,brokenIcon=false;
const publicDir=path.resolve('public');
const html=()=>`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/pwa.css"><script src="/pwa-boot.js"></script><div id="app"><h1 id="version">Release ${version}</h1><button data-action="installPage" hidden>Install app</button><form><input id="edit" value=""></form></div><script type="module">import {createPwaController} from '/pwa.mjs';sessionStorage.boots=Number(sessionStorage.boots||0)+1;window.pwa=createPwaController({window,document,navigator,blocker:()=>document.querySelector('form[data-pwa-dirty="true"]')?'dirty':null});await pwa.start();window.ready=true;</script>`;
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),file=path.resolve(publicDir,'.'+url.pathname);res.setHeader('Cache-Control','no-store');
 if(url.pathname==='/'||url.pathname==='/index.html'){res.setHeader('Content-Type','text/html');return res.end(html());}
 if((brokenCore&&url.pathname==='/pwa.css')||(brokenIcon&&url.pathname==='/icons/icon-192x192.png')){res.writeHead(brokenCore?200:503,{'Content-Type':'text/html'});return res.end('Temporarily unavailable');}
 if(!file.startsWith(publicDir+path.sep)||!fs.existsSync(file)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',{'.js':'application/javascript','.mjs':'application/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'}[path.extname(file)]||'text/plain');
 let data=fs.readFileSync(file);
 if(url.pathname==='/firebase-messaging-sw.js')data=Buffer.from(data.toString().replace(/const BUILD='[^']*';/,`const BUILD='fixture-${version}';`).replace(/^const FIREBASE_SDK=.*$/m,'const FIREBASE_SDK=[];'));
 if(url.pathname==='/app.js')data=Buffer.from(data+'\n// release '+version);
 res.end(data);
});
async function attemptUpdate(page){return page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();let worker;r.addEventListener('updatefound',()=>worker=r.installing,{once:true});try{await r.update();}catch{return 'failed';}worker=worker||r.installing;if(!worker)return r.waiting?'installed':'none';if(!['installed','redundant','activated'].includes(worker.state))await new Promise(resolve=>worker.addEventListener('statechange',()=>{if(['installed','redundant','activated'].includes(worker.state))resolve();}));return worker.state;});}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.LEAGUEFOLK_CHROME_PATH?{executablePath:process.env.LEAGUEFOLK_CHROME_PATH}:{})});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
  await page.goto(origin);await page.waitForFunction(()=>window.ready&&!!navigator.serviceWorker.controller);assert.equal(await page.locator('#pwa-update').count(),0);
  await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(await page.locator('#version').innerText(),'Release 1');
  await page.evaluate(()=>new Promise((resolve,reject)=>{const request=indexedDB.open('pwa-test-queue',1);request.onupgradeneeded=()=>request.result.createObjectStore('actions');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('actions','readwrite');tx.objectStore('actions').put({score:'11-8'},'pending-match');tx.oncomplete=()=>{db.close();resolve();};};}));
  version=2;assert.equal(await attemptUpdate(page),'installed');await page.getByText('New version available',{exact:true}).waitFor();
  assert.equal(await page.locator('#version').innerText(),'Release 1');assert.match(await page.evaluate(()=>fetch('/app.js?bust=1').then(r=>r.text())),/release 1$/);
  await page.locator('#edit').fill('Unsent score');await page.getByRole('button',{name:'Update',exact:true}).click();await page.getByText('Update and discard edits?',{exact:true}).waitFor();
  const before=await page.evaluate(()=>Number(sessionStorage.boots));assert.equal(await page.locator('#edit').inputValue(),'Unsent score');
  version=3;await page.getByRole('button',{name:'Update anyway',exact:true}).click();
  try{await page.waitForFunction(()=>document.getElementById('version')?.textContent==='Release 3',{},{timeout:20000});}catch(error){console.log(await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {version:document.getElementById('version')?.textContent,state:pwa.getState(),popup:document.getElementById('pwa-update')?.textContent,controller:navigator.serviceWorker.controller?.state,waiting:r.waiting?.state,installing:r.installing?.state,active:r.active?.state,keys:await caches.keys()};}));throw error;}await page.waitForFunction(()=>window.ready);
  assert.equal(await page.evaluate(()=>Number(sessionStorage.boots)),before+1);assert.equal(await page.locator('#pwa-update').count(),0);
  const queue=await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.open('pwa-test-queue',1);r.onsuccess=()=>{const db=r.result,q=db.transaction('actions').objectStore('actions').get('pending-match');q.onsuccess=()=>{resolve(q.result);db.close();};};}));assert.deepEqual(queue,{score:'11-8'});
  console.log('First install has no false update; waiting updates pin old assets; latest release activates with one reload; queued match survives');
  const other=await context.newPage();await other.goto(origin);await other.waitForFunction(()=>window.ready);await other.locator('#edit').fill('Keep this tab’s draft');
  version=4;brokenCore=true;const failure=await attemptUpdate(page);assert.ok(['redundant','failed'].includes(failure),failure);assert.equal(await page.locator('#version').innerText(),'Release 3');
  await page.reload();await page.waitForFunction(()=>window.ready);assert.equal(await page.locator('#version').innerText(),'Release 3');console.log('Incomplete core download cannot replace the working app');
  version=5;brokenCore=false;brokenIcon=true;assert.equal(await attemptUpdate(page),'installed');await page.getByRole('button',{name:'Update',exact:true}).click();await page.waitForFunction(()=>document.getElementById('version')?.textContent==='Release 5');
  await other.getByText('New version available',{exact:true}).waitFor();assert.equal(await other.locator('#edit').inputValue(),'Keep this tab’s draft');assert.equal(await other.locator('#version').innerText(),'Release 3');console.log('Optional image failure permits updates; another tab is notified without discarding its edits');
  version=6;brokenIcon=false;assert.equal(await attemptUpdate(page),'installed');await context.setOffline(true);await page.getByRole('button',{name:'Update',exact:true}).click();await page.waitForFunction(()=>document.getElementById('version')?.textContent==='Release 6');await page.waitForFunction(()=>window.ready);console.log('A fully downloaded update activates and reloads successfully offline');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
