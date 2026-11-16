const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

function worker({rejectWrites=false,offline=false,futureResponse}={}){
  const listeners={},stored=new Map(),warnings=[];
  const key=req=>typeof req==='string'?new URL(req,'https://app.test').href:req.url;
  const context={Response,Request,URL,console:{warn:(...args)=>warnings.push(args)},importScripts(){},
    self:{location:{origin:'https://app.test'},AGREE_FIREBASE:{features:{push:false}},addEventListener:(name,cb)=>{listeners[name]=cb;}},
    caches:{open:async()=>{await new Promise(resolve=>setImmediate(resolve));return {match:async req=>stored.has(key(req))?new Response(stored.get(key(req))):undefined,put:async(req,response)=>{if(rejectWrites)throw Error('Quota exceeded');stored.set(key(req),await response.text());}};},match:async req=>futureResponse?new Response(futureResponse):stored.has(key(req))?new Response(stored.get(key(req))):undefined},
    fetch:async()=>{if(offline)throw Error('Offline');return new Response('fresh response');}
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/firebase-messaging-sw.js'),'utf8'),context);
  return {stored,warnings,async request(url,mode='cors'){
    const pending=[];let result;
    listeners.fetch({request:{url,method:'GET',mode},respondWith:p=>{result=p;},waitUntil:p=>pending.push(p)});
    const response=await result;
    // Consume the returned body before the deliberately slow cache.open() resolves.
    const text=await response.text();await Promise.all(pending);
    return {text,status:response.status,pending:pending.length};
  }};
}
test('worker clones fresh responses before browser consumption and tracks cache writes',async()=>{
  for(const [url,mode,cacheKey] of [
    ['https://app.test/firebase-config.js','cors','https://app.test/firebase-config.js'],
    ['https://app.test/app.js','cors','https://app.test/app.js'],
    ['https://app.test/styles.css','cors','https://app.test/styles.css'],
    ['https://app.test/icons/icon-192.png','cors','https://app.test/icons/icon-192.png'],
    ['https://app.test/g/example','navigate','https://app.test/index.html'],
    ['https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js','cors','https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js']
  ]){
    const w=worker(),result=await w.request(url,mode);
    assert.equal(result.text,'fresh response');assert.equal(result.pending,1);assert.equal(w.stored.get(cacheKey),'fresh response');
  }
});
test('cache write failure does not reject the network response or worker lifetime',async()=>{
  const w=worker({rejectWrites:true});assert.equal((await w.request('https://app.test/app.js')).text,'fresh response');assert.equal(w.warnings.length,1);
});
test('offline config and code use cached responses or a defined error response',async()=>{
  const w=worker({offline:true});w.stored.set('https://app.test/firebase-config.js','cached config');
  assert.equal((await w.request('https://app.test/firebase-config.js')).text,'cached config');
  assert.equal((await w.request('https://app.test/app.js')).status,0);
});

test('the local rating engine and replay modules refresh online and remain usable offline',async()=>{
  for(const asset of ['/ratings.mjs','/periods.mjs','/vendor/openskill.mjs']){
    const url='https://app.test'+asset,online=worker();assert.equal((await online.request(url)).text,'fresh response');assert.equal(online.stored.get(url),'fresh response');
    const offline=worker({offline:true});offline.stored.set(url,'cached rating module');assert.equal((await offline.request(url)).text,'cached rating module');
  }
});
test('a waiting release cannot leak assets into the active release, even with cache-busting URLs',async()=>{
 const w=worker({futureResponse:'future build'});w.stored.set('https://app.test/app.js','active build');w.stored.set('https://app.test/index.html','active page');
 assert.equal((await w.request('https://app.test/app.js?version=new')).text,'active build');assert.equal((await w.request('https://app.test/install','navigate')).text,'active page');
});
test('activation retains the previous generation and never deletes a newer or partially opened release cache',async()=>{
 const source=fs.readFileSync(require.resolve('../public/firebase-messaging-sw.js'),'utf8'),build=source.match(/const BUILD='([^']+)'/)[1],current='agree-shell-'+build;
 const entries=new Map([[current,{installedAt:10}],['agree-shell-previous',{installedAt:9}],['agree-shell-old',{installedAt:8}],['agree-shell-next',{installedAt:11}],['agree-shell-opening',null],['agree-shell-v46',null]]),listeners={};
 const context={Response,Request,URL,console,importScripts(){},self:{AGREE_FIREBASE:{features:{push:false}},clients:{claim:async()=>{}},addEventListener:(name,fn)=>listeners[name]=fn},caches:{keys:async()=>[...entries.keys()],open:async name=>({match:async()=>entries.get(name)?new Response(JSON.stringify(entries.get(name))):undefined}),delete:async name=>entries.delete(name)}};
 vm.runInNewContext(source,context);let work;listeners.activate({waitUntil:p=>work=p});await work;
 assert.ok(entries.has(current));assert.ok(entries.has('agree-shell-previous'));assert.ok(entries.has('agree-shell-next'));assert.ok(entries.has('agree-shell-opening'));assert.ok(!entries.has('agree-shell-old'));assert.ok(!entries.has('agree-shell-v46'));
});
