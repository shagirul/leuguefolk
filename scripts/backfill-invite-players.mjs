import {initializeApp,applicationDefault} from 'firebase-admin/app';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {pathToFileURL} from 'node:url';
import {buildGroupPreview} from '../public/invites.mjs';

export async function backfillGroup(store,groupRef,{write=false}={}){
  // A transaction keeps a backfill from overwriting concurrent verified-score/profile updates.
  return store.runTransaction(async tx=>{
    const group=await tx.get(groupRef);if(!group.exists)throw new Error('Group not found: '+groupRef.id);
    const code=group.data().inviteCode;
    const [members,tickets,existing]=await Promise.all([tx.get(groupRef.collection('members')),tx.get(groupRef.collection('tickets')),tx.get(store.collection('inviteCodes').doc(code).collection('players'))]);
    const players=buildGroupPreview(members.docs.map(d=>({id:d.id,...d.data()})),tickets.docs.map(d=>({id:d.id,...d.data()})));
    if(players.length>450)throw new Error('Group '+groupRef.id+' exceeds the migration transaction limit; migrate it separately.');
    if(write)for(const {id,...player} of players)tx.set(store.collection('inviteCodes').doc(code).collection('players').doc(id),{...player,lastTicketId:null,lastActionId:null,updatedAt:FieldValue.serverTimestamp()});
    return {groupId:groupRef.id,players:players.length,existing:existing.size,verifiedXp:players.reduce((sum,p)=>sum+p.xp,0),written:write};
  });
}

async function main(){
  const args=process.argv.slice(2),projectIndex=args.indexOf('--project'),groupIndex=args.indexOf('--group');
  const projectId=projectIndex>=0?args[projectIndex+1]:null,groupId=groupIndex>=0?args[groupIndex+1]:null;
  if(!projectId||projectId.startsWith('--'))throw new Error('Specify --project PROJECT_ID. Defaults to a read-only dry run; add --write to apply.');
  if(groupIndex>=0&&(!groupId||!/^[a-f\d-]{36}$/i.test(groupId)))throw new Error('Specify a valid --group UUID.');
  const emulator=!!process.env.FIRESTORE_EMULATOR_HOST;
  if(emulator&&!projectId.startsWith('demo-'))throw new Error('Use a demo project when FIRESTORE_EMULATOR_HOST is set.');
  initializeApp({projectId,...(!emulator?{credential:applicationDefault()}:{})});
  const store=getFirestore(),groups=groupId?[store.collection('groups').doc(groupId)]:(await store.collection('groups').get()).docs.map(d=>d.ref);
  for(const group of groups)console.log(JSON.stringify(await backfillGroup(store,group,{write:args.includes('--write')})));
  console.log(args.includes('--write')?'Invite previews updated.':'Dry run complete. No documents changed.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});
