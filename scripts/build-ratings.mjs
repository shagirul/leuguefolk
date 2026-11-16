import {build} from 'esbuild';
import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('public/vendor',{recursive:true});
await build({stdin:{contents:"export {rating,rate,predictWin} from 'openskill';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',target:['es2020'],outfile:'public/vendor/openskill.mjs',banner:{js:'// OpenSkill 5.0.1 (MIT). Rebuild with npm run build:ratings. See openskill.LICENSE.txt.'}});
await copyFile('node_modules/openskill/LICENSE','public/vendor/openskill.LICENSE.txt');
