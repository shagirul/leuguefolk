"""Optional browser UI smoke test with Firebase mocked (no credentials). Requires pip install playwright + chromium."""
import os
from pathlib import Path
from shutil import which
from playwright.sync_api import sync_playwright
GID='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
TID='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
UID='alice_test_user_123456789'
BOB='bob_test_user_123456789'
PROFILE="""export const initializeApp=(cfg)=>({name:'fixture'});"""
AUTH="""
export const getAuth=()=>({});
export const createUserWithEmailAndPassword=async()=>({user:{uid:'alice_test_user_123456789'}});
export const signInWithEmailAndPassword=async()=>({user:{uid:'alice_test_user_123456789'}});
export const signOut=async()=>{};
export const updateProfile=async()=>{};
export const onAuthStateChanged=(auth,cb)=>{setTimeout(()=>cb({uid:'alice_test_user_123456789',email:'alex@example.com',displayName:'Alex'}),30);return ()=>{}};
"""
FIRESTORE="""
const GID='{GID}';const TID='{TID}';const UID='{UID}';const BOB='{BOB}';
export const getFirestore=()=>({});export const initializeFirestore=()=>({});
export const persistentLocalCache=()=>({});export const persistentMultipleTabManager=()=>({});
export const doc=(_, ...parts)=>({type:'doc',parts});
export const collection=(_, ...parts)=>({type:'col',parts});
export const query=(ref)=>ref;export const orderBy=()=>null;export const limit=()=>null;
export const serverTimestamp=()=>new Date();export const updateDoc=async()=>{};
export const getDoc=async(ref)=>({exists:()=>true,data:()=>({{displayName:'Alex'}})});
const snap=(items)=>({{docs:items.map(x=>({{id:x.id,data:()=>x.data}}))}});
export const onSnapshot=(ref,callback,error)=>{{
 const p=ref.parts;let result;
 if(p[0]==='groups' && p.length===2)result={{exists:()=>true,id:GID,data:()=>({{name:'Friday Badminton',inviteCode:'ABCD23EF'}})}};
 else if(p[0]==='groups' && p[2]==='members')result=snap([
  {{id:UID,data:{{displayName:'Alex'}}}},{{id:BOB,data:{{displayName:'Priya'}}}},{{id:'rohan_test_user_12345678',data:{{displayName:'Rohan'}}}}]);
 else if(p[0]==='groups' && p[2]==='tickets' && p.length===3)result=snap([
  {{id:TID,data:{{playerA:UID,playerB:BOB,groupId:GID,status:'open',turn:BOB,revision:1,
    proposal:{{score:{{a:21,b:17}},by:UID}},finalScore:null,createdAt:new Date(),monthKey:'2026-11',weekKey:'2026-11-09'}}}}]);
 else if(p[0]==='groups' && p[2]==='tickets' && p[4]==='events')result=snap([
  {{id:TID,data:{{actor:UID,kind:'submitted',score:{{a:21,b:17}},at:new Date()}}}}]);
 else if(p[0]==='users' && p[2]==='memberships')result=snap([{{id:GID,data:{{groupId:GID,name:'Friday Badminton'}}}}]);
 else if(p[0]==='users' && p[2]==='notifications')result=snap([{{id:TID,data:{{kind:'submitted',title:'Match to review',body:'A score awaits review',path:'/g/'+GID+'/t/'+TID,createdAt:new Date(),readAt:null}}}}]);
 else result=snap([]);
 const timer=setTimeout(()=>callback(result),10);return ()=>clearTimeout(timer);
}};
"""
FIRESTORE=FIRESTORE.replace('{GID}',GID).replace('{TID}',TID).replace('{UID}',UID).replace('{BOB}',BOB).replace('{{','{').replace('}}','}')
FUNCTIONS="""export const createFirestoreApi=()=>async()=>({ok:true});export const runTransaction=async()=>{};"""
MESSAGING="""export const getMessaging=()=>({});export const getToken=async()=>null;export const deleteToken=async()=>{};export const onMessage=()=>{};export const isSupported=async()=>false;"""
modules={'firebase-app.js':PROFILE,'firebase-auth.js':AUTH,'firebase-firestore.js':FIRESTORE,'firebase-functions.js':FUNCTIONS,'firebase-messaging.js':MESSAGING}
SCREENSHOTS=Path(__file__).resolve().parent/'screenshots'
SCREENSHOTS.mkdir(exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=which('chromium') or which('google-chrome'),args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,service_workers='block')
 page=context.new_page()
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 css=open(os.path.join(os.path.dirname(__file__),'../public/styles.css')).read()
 page.set_content('<!doctype html><html><head><style>'+css+'</style></head><body><div id="app"></div><div id="toast"></div></body></html>')
 app=open(os.path.join(os.path.dirname(__file__),'../public/app.js')).read()
 app='\n'.join(line for line in app.splitlines() if not line.startswith('import '))
 app=app.replace('decodeURI(location.pathname)','decodeURI(window.__testPath||location.pathname)')
 mocks='\n'.join(modules.values()).replace('export const ','const ')
 head="Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});const forUser=async()=>[];const enqueue=async()=>{};const patchAction=async()=>{};const deleteAction=async()=>{};window.__testPath='/';window.history.pushState=(a,b,path)=>{window.__testPath=path;}; self.AGREE_FIREBASE={firebaseConfig:{apiKey:'test',appId:'test-app-id',projectId:'project'},vapidPublicKey:'test'};"
 # Safari-style mock for serviceWorker absence isn't needed (about:blank).
 page.evaluate('(js) => { (new Function(js))(); }', head+'\n'+mocks+'\n'+app)
 page.get_by_text('Leaderboard',exact=True).first.wait_for(timeout=8000)
 assert 'Friday Badminton' in page.locator('body').inner_text()
 page.screenshot(path=str(SCREENSHOTS/'leaderboard.png'),full_page=True)
 page.get_by_role('button',name='Record a match').click()
 page.get_by_text('Who did you play?').wait_for()
 page.screenshot(path=str(SCREENSHOTS/'record-match.png'),full_page=True)
 page.locator('[data-action=nav][data-view=matches]').click()
 page.get_by_text('Match history').wait_for()
 page.locator('[data-action=openTicket]').first.click()
 page.get_by_text('Match details').wait_for()
 page.screenshot(path=str(SCREENSHOTS/'match-detail.png'),full_page=True)
 print('UI smoke: leaderboard → record match → matches → match detail OK')
 print('Page errors:',errors)
 assert not errors,errors
 browser.close()
