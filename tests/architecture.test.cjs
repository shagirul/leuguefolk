const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const file=p=>fs.readFileSync(path.resolve(__dirname,'../',p),'utf8');

test('Spark deployment uses Firestore directly and keeps push disabled',()=>{
 const app=file('public/app.js'),config=file('public/firebase-config.js'),hosting=JSON.parse(file('firebase.json'));
 assert.doesNotMatch(app,/httpsCallable|getFunctions/);assert.match(app,/createFirestoreApi/);
 assert.match(config,/leaderboards: true, push: false/);assert.equal(hosting.functions,undefined);
 const worker=file('public/firebase-messaging-sw.js');assert.ok(worker.includes('/firestore-api.mjs'));assert.ok(worker.includes('/domain.mjs'));
});
test('offline queue keeps action IDs, full match versions and conflict handling',()=>{
 const app=file('public/app.js'),queue=file('public/queue.js');
 assert.match(queue,/indexedDB/);assert.ok(queue.includes("status:'queued'"));
 assert.ok(app.includes('actionId:uid()'));assert.ok(app.includes('expectedVersion:t.version'));assert.ok(app.includes('replayOutbox'));assert.ok(file('public/outbox.mjs').includes("blocked?'blocked':'queued'"));
});
test('PWA manifest icons and route rewrite present',()=>{
 const f=JSON.parse(file('firebase.json')),m=JSON.parse(file('public/manifest.webmanifest'));
 assert.equal(f.hosting.rewrites[0].destination,'/index.html');assert.equal(m.display,'standalone');assert.equal(m.name,'Leaguefolk');assert.equal(m.short_name,'Leaguefolk');
 assert.ok(m.icons.some(i=>i.purpose==='any'));assert.ok(m.icons.some(i=>i.purpose==='maskable'));assert.ok(m.icons.some(i=>i.purpose==='monochrome'));
 for(const i of m.icons)assert.ok(fs.existsSync(path.resolve(__dirname,'../public',i.src.slice(1))));
});
test('install icons match their declared dimensions and Apple branding matches the PWA',()=>{
 const manifest=JSON.parse(file('public/manifest.webmanifest')),html=file('public/index.html');
 assert.equal(manifest.background_color,'#fcfaff');assert.equal(manifest.theme_color,'#fcfaff');
 assert.match(html,/apple-mobile-web-app-title" content="Leaguefolk/);assert.match(html,/apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png/);
 for(const icon of manifest.icons){const bytes=fs.readFileSync(path.resolve(__dirname,'../public',icon.src.slice(1)));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(`${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`,icon.sizes);}
});
