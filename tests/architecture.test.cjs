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
 assert.ok(app.includes('actionId:uid()'));assert.ok(app.includes('expectedVersion:t.version'));assert.ok(app.includes("status:'blocked'"));
});
test('PWA manifest icons and route rewrite present',()=>{
 const f=JSON.parse(file('firebase.json')),m=JSON.parse(file('public/manifest.webmanifest'));
 assert.equal(f.hosting.rewrites[0].destination,'/index.html');assert.equal(m.display,'standalone');assert.equal(m.icons.length,2);
 for(const i of m.icons)assert.ok(fs.existsSync(path.resolve(__dirname,'../public',i.src.slice(1))));
});
