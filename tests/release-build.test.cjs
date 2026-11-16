const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
test('release identity is reproducible and changes for app edits or worker-only edits without manual version bumps',t=>{
 const base=fs.realpathSync(os.tmpdir()),dir=fs.mkdtempSync(path.join(base,'leaguefolk-release-')),publicDir=path.join(dir,'public');
 t.after(()=>{const resolved=fs.realpathSync(dir);if(!resolved.startsWith(base+path.sep)||!path.basename(resolved).startsWith('leaguefolk-release-'))throw Error('Unexpected release fixture path');fs.rmSync(resolved,{recursive:true});});
 fs.mkdirSync(publicDir);fs.writeFileSync(path.join(publicDir,'app.js'),'const app=1;\n');const worker=path.join(publicDir,'firebase-messaging-sw.js');fs.writeFileSync(worker,"const BUILD='development';\nconst CACHE='agree-shell-'+BUILD;\n");
 const build=()=>{execFileSync(process.execPath,[path.resolve(__dirname,'../scripts/build-release.mjs')],{cwd:dir});return fs.readFileSync(worker,'utf8').match(/const BUILD='([^']+)'/)[1];};
 const first=build();assert.equal(build(),first);fs.appendFileSync(path.join(publicDir,'app.js'),'// New screen\n');const second=build();assert.notEqual(second,first);
 fs.appendFileSync(worker,'// Worker-only fix\n');const third=build();assert.notEqual(third,second);
 for(const file of ['app.js','firebase-messaging-sw.js']){const target=path.join(publicDir,file);fs.writeFileSync(target,fs.readFileSync(target,'utf8').replaceAll('\n','\r\n'));}assert.equal(build(),third,'Git newline normalization must not change release identity');
});
