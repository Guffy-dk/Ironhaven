import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import {resolve} from 'node:path';
import { build } from 'esbuild';
import {packageHtml} from './package-html.mjs';
import {validateRelease,releaseMarkdown} from './release-metadata.mjs';
import {compileIndustry} from './compile-industry.mjs';
import {catalogSeed} from '../sdk/catalog-seed.mjs';
await compileIndustry();
const currentRelease=await validateRelease();
await mkdir('public/vendor',{recursive:true});
await cp('node_modules/three/build/three.module.js','public/vendor/three.module.js');
await cp('node_modules/three/build/three.core.js','public/vendor/three.core.js');
await cp('node_modules/three/LICENSE','public/vendor/THREE-LICENSE.txt');
// The bundle is an internal Windows Electron resource, not a browser distribution.
await rm('dist',{recursive:true,force:true});
const result=await build({entryPoints:['public/app.js'],bundle:true,minify:true,format:'iife',target:['es2022'],write:false,legalComments:'inline',plugins:[{name:'shared-three',setup(b){b.onResolve({filter:/^three$/},()=>({path:resolve('public/vendor/three.module.js')}));}}]});
const materials=await readFile('public/art/material-icons.webp');
const css=(await readFile('public/style.css','utf8')).replace('./art/material-icons.webp',`data:image/webp;base64,${materials.toString('base64')}`);
const threeLicense=await readFile('node_modules/three/LICENSE','utf8');
let source=await readFile('public/index.html','utf8');
for(const [asset,mime] of [['crab-color.png','image/png'],['crab-normal.png','image/png'],['horror-color.png','image/png'],['horror-normal.png','image/png'],['coastal-surfaces.png','image/png'],['quarry-materials.jpg','image/jpeg'],['quarry-spruce.png','image/png']]){
 const bytes=await readFile('public/art/'+asset);
 source=source.replace(`src="./art/${asset}"`,()=>`src="data:${mime};base64,${bytes.toString('base64')}"`);
}
const html=packageHtml(source,{
 script:result.outputFiles[0].text,css,license:threeLicense,
 icon:'<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23152629%22/%3E%3Ctext x=%2210%22 y=%2245%22 font-size=%2238%22 fill=%22%23eeb96e%22%3EIH%3C/text%3E%3C/svg%3E">'
});
await mkdir('release',{recursive:true});
await writeFile('release/Ironhaven.html',html);
await writeFile('release/RELEASE_NOTES.md',releaseMarkdown(currentRelease));
const game=await import('../public/shared/sim.js');
const {CONTENT}=await import('../public/shared/content.js');
const {BUILDING_IDENTITIES}=await import('../public/shared/building-identity.js');
await writeFile('release/mod-base.json',JSON.stringify(catalogSeed(game,CONTENT,BUILDING_IDENTITIES)));
await build({entryPoints:['sdk/mod-worker.mjs'],bundle:true,platform:'node',format:'cjs',outfile:'release/mod-worker.cjs',legalComments:'inline'});
const notices=[];
for(const [name,file]of [['fengari','LICENSE'],['readline-sync','LICENSE'],['sprintf-js','LICENSE'],['tmp','LICENSE']])notices.push(name+'\n'+await readFile('node_modules/'+name+'/'+file,'utf8'));
await writeFile('release/FENGARI-LICENSE.txt',notices.join('\n\n'));
await cp('node_modules/three/LICENSE','release/THREE-LICENSE.txt');
await cp('docs/design/THIRD_PARTY_ASSETS.txt','release/THIRD_PARTY_ASSETS.txt');
console.log(`Built embedded Windows resource release/Ironhaven.html (${Math.round(Buffer.byteLength(html)/1024)} KiB). No CDN, external assets or install required.`);
