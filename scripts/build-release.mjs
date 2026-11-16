import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const worker='public/firebase-messaging-sw.js';
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]))).flat();}
const hash=createHash('sha256');
for(const file of (await walk('public')).sort()){
  let data=await readFile(file);
  if(/\.(?:m?js|css|html|json|webmanifest|txt|svg)$/.test(file)){
    let text=data.toString('utf8').replace(/\r\n/g,'\n');
    if(file===worker)text=text.replace(/const BUILD='[^']*';/,"const BUILD='__BUILD__';");
    data=Buffer.from(text);
  }
  hash.update(file+'\0');hash.update(data);hash.update('\0');
}
const version=hash.digest('hex').slice(0,16),source=await readFile(worker,'utf8');
if(!/const BUILD='[^']*';/.test(source))throw Error('Worker build marker missing');
await writeFile(worker,source.replace(/const BUILD='[^']*';/,`const BUILD='${version}';`));
console.log('Leaguefolk release '+version);
