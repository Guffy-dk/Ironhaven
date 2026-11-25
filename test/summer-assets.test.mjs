// Nordic summer harbour: packaged CC0 art, daylight and the blended PBR ground.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {Window} from 'happy-dom';
import {assetFiles,CACHE} from '../scripts/fetch-assets.mjs';

const dom=new Window();dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});globalThis.document=dom.document;
const plugins=[{name:'installed-three',setup(b){
 b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));
 b.onResolve({filter:/^three\/addons\//},a=>({path:fileURLToPath(new URL('../node_modules/three/examples/jsm/'+a.path.slice('three/addons/'.length),import.meta.url))}));
 b.onResolve({filter:/^three$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));
}}];
const out=await build({entryPoints:[fileURLToPath(new URL('../public/summer-world.js',import.meta.url))],bundle:true,format:'esm',write:false,plugins});
const summer=await import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));
const T=await import('three');

test('every packaged art file is CC0, pinned by size and MD5 and attributed',async()=>{
 const manifest=JSON.parse(await readFile('assets/manifest.json','utf8'));
 assert.ok(manifest.assets.length>=15);
 for(const asset of manifest.assets){
  assert.equal(asset.license,'CC0-1.0',asset.id);
  assert.match(asset.source,/^https:\/\/polyhaven\.com\/a\//);
  for(const file of Object.values(asset.files)){assert.ok(file.size>0);assert.match(file.md5,/^[0-9a-f]{32}$/);assert.match(file.url,/^https:\/\//);}
 }
 const textures=manifest.assets.filter(a=>a.kind==='texture');
 assert.ok(textures.every(a=>['color.jpg','normal.jpg','arm.jpg'].every(name=>a.files[name])),'each surface has colour, normal and ARM maps');
 assert.ok(manifest.assets.some(a=>a.kind==='hdri'),'a summer sky ships with the game');
});

test('the build ships the verified art next to the game with a licence list',async()=>{
 const files=await assetFiles();
 for(const file of files)assert.equal((await stat(file.path)).size,file.size,file.path);
 assert.match(await readFile(`${CACHE}/ASSET-LICENSES.txt`,'utf8'),/terrain-grass: https:\/\/polyhaven\.com\/a\/aerial_grass_rock \(CC0-1\.0/);
 const packaging=await readFile('scripts/build-linux.sh','utf8')+await readFile('scripts/build-windows.ps1','utf8');
 assert.match(packaging,/release\/assets/);
});

test('the desktop shell serves packaged art only from inside its assets folder',async()=>{
 const shell=await readFile('desktop/game.cjs','utf8');
 assert.match(shell,/ironhaven:\/\/game\/assets\//);
 assert.match(shell,/if \(!file\.startsWith\(root \+ path\.sep\)\) return new Response\(null, \{ status: 403 \}\)/);
});

test('the summer ground blends five surfaces with no more than seven texture units',()=>{
 assert.deepEqual(summer.SUMMER_TERRAIN,['terrain-grass','terrain-meadow','terrain-sand','terrain-granite','terrain-gravel']);
 // Without a browser image loader the material falls back to the plain look (no shader patch).
 const fallback=summer.summerTerrainMaterial();
 assert.ok(fallback.userData.summer);assert.equal(fallback.onBeforeCompile.toString().includes('tColor'),false);
 // With textures available the ground shader is patched; simulate a loaded set.
 globalThis.window=globalThis;globalThis.Image=class{};
 const pbr={map:new T.Texture(),normalMap:new T.Texture(),arm:new T.Texture()};
 const material=summer.summerTerrainMaterial(()=>pbr);
 delete globalThis.Image;delete globalThis.window;
 assert.ok(material.userData.summer);
 const shader={uniforms:{},vertexShader:'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <map_fragment>\n#include <roughnessmap_fragment>\n#include <aomap_fragment>\n#include <normal_fragment_maps>'};
 material.onBeforeCompile(shader);
 {
  const samplers=Object.keys(shader.uniforms).filter(k=>/^t[A-Z]/.test(k));
  assert.ok(samplers.length<=7,`${samplers.length} samplers`);
  assert.doesNotMatch(shader.fragmentShader,/normalMatrix/,'normalMatrix does not exist in fragment shaders');
  assert.match(shader.vertexShader,/attribute vec4 terrainMix/);
 }
});

test('summer lighting is bright daylight rather than the old dusk',()=>{
 const view={scene:new T.Scene(),sky:new T.HemisphereLight(),sun:new T.DirectionalLight(),fill:new T.DirectionalLight(),renderer:{toneMappingExposure:2},colorGrade:{uniforms:{strength:{value:1}}},summerSky:true};
 summer.applySummerLight(view);
 const bg=view.scene.background;assert.ok(bg.r+bg.g+bg.b>1.6,'a light sky');
 assert.ok(view.sun.intensity>=3);assert.ok(view.scene.fog.density<.005);
 assert.ok(view.colorGrade.uniforms.strength.value<1,'the dusk grade is toned down');
});
