import { cp, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { build } from 'esbuild';
import {validateRelease,releaseMarkdown} from './release-metadata.mjs';
const currentRelease=await validateRelease();
await mkdir('public/vendor',{recursive:true});
await cp('node_modules/three/build/three.module.js','public/vendor/three.module.js');
await cp('node_modules/three/build/three.core.js','public/vendor/three.core.js');
await cp('node_modules/three/LICENSE','public/vendor/THREE-LICENSE.txt');
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('node_modules/three/LICENSE','dist/THREE-LICENSE.txt');
const result=await build({entryPoints:['public/app.js'],bundle:true,minify:true,format:'iife',target:['es2022'],write:false,legalComments:'inline'});
const css=await readFile('public/style.css','utf8');
const threeLicense=await readFile('node_modules/three/LICENSE','utf8');
const html=(await readFile('public/index.html','utf8'))
 .replace('<link rel="icon" type="image/svg+xml" href="./favicon.svg">','<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22%3E%3Crect width=%2264%22 height=%2264%22 rx=%2212%22 fill=%22%23152629%22/%3E%3Ctext x=%2210%22 y=%2245%22 font-size=%2238%22 fill=%22%23eeb96e%22%3EIH%3C/text%3E%3C/svg%3E">')
 .replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><!-- Three.js license:\n${threeLicense}\n-->`)
 .replace('<link rel="stylesheet" href="./style.css">',`<style>${css}</style>`)
 .replace('<script type="module" src="./app.js"></script>',`<script>${result.outputFiles[0].text.replaceAll('</script','<\\/script')}</script>`);
await mkdir('release',{recursive:true});
await writeFile('release/Ironhaven.html',html);
await writeFile('release/RELEASE_NOTES.md',releaseMarkdown(currentRelease));
// The hosted game is the same self-contained artifact as the offline edition.
await writeFile('dist/index.html',html);
console.log(`Built dist/index.html and release/Ironhaven.html (${Math.round(Buffer.byteLength(html)/1024)} KiB). No CDN, external assets or install required.`);
