/* Durable local outbox. Server receives every mutation with its stable actionId.
 * The outbox never guesses that an action succeeded. Conflict/error remains visible.
 */
const DB_NAME='agree-outbox-v1',STORE='actions';
let opening=null;
function db(){
  if(!('indexedDB' in globalThis))return Promise.reject(new Error('This browser has no IndexedDB support. Offline actions cannot be saved.'));
  if(!opening)opening=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const database=req.result;if(!database.objectStoreNames.contains(STORE))database.createObjectStore(STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  }).catch(e=>{opening=null;throw e;});
  return opening;
}
function execute(mode,fn){return db().then(database=>new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,mode),store=tx.objectStore(STORE);let output;
  try {const req=fn(store); if(req){req.onsuccess=()=>{output=req.result;};req.onerror=()=>{reject(req.error);};}}
  catch(e){reject(e);return;}
  tx.oncomplete=()=>resolve(output);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Outbox transaction aborted'));
}));}
export const enqueue=action=>execute('readwrite',s=>s.put({...action,status:'queued',attempts:0,createdAt:Date.now()}));
export const allActions=()=>execute('readonly',s=>s.getAll()).then(a=>a.sort((x,y)=>x.createdAt-y.createdAt));
export const patchAction=(id,data)=>execute('readwrite',s=>{
  const req=s.get(id);
  req.onsuccess=()=>{if(req.result)s.put({...req.result,...data});};
  return null;
});
export const deleteAction=id=>execute('readwrite',s=>s.delete(id));
export const forUser=async uid=>(await allActions()).filter(x=>x.uid===uid);
