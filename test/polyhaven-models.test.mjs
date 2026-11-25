// Scanned CC0 models replace hand-made primitives (owner, 25 Nov 2026: "no toy art").
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {manifestEntry,addEntries} from '../scripts/add-polyhaven-models.mjs';

const api={gltf:{'2k':{gltf:{url:'https://dl.polyhaven.org/x_2k.gltf',size:10,md5:'a'.repeat(32),include:{'x.bin':{url:'https://dl.polyhaven.org/x.bin',size:20,md5:'b'.repeat(32)}}}}}};

test('a Poly Haven model becomes a pinned CC0 manifest entry with every included file',()=>{
 const entry=manifestEntry('x','2k',api);
 assert.equal(entry.license,'CC0-1.0');assert.equal(entry.kind,'model');assert.equal(entry.source,'https://polyhaven.com/a/x');
 assert.deepEqual(Object.keys(entry.files),['x.gltf','x.bin']);assert.equal(entry.files['x.bin'].size,20);
 assert.throws(()=>manifestEntry('x','8k',api),/no 8k glTF/);
});

test('adding models never duplicates an id',()=>{
 const manifest={assets:[{id:'x'}]};
 assert.equal(addEntries(manifest,[{id:'x'},{id:'y'}]).assets.length,2);
});

test('the harbour uses scanned trees, coast rock, pier and boats, each decimated to a budget',async()=>{
 const manifest=JSON.parse(await readFile('assets/manifest.json','utf8'));
 const ids=new Set(manifest.assets.map(a=>a.id));
 const blender=await readFile('scripts/blender/build_summer_harbour.py','utf8');
 for(const id of ['coast_rocks_01','coast_line_01','modular_wooden_pier','ship_pinnace','dutch_ship_medium','grass_medium_01']){
  assert.ok(ids.has(id),id);assert.match(blender,new RegExp(`'${id}': \\d+`),`${id} has a polygon budget`);
 }
 assert.ok(ids.has('fir_tree_01'));assert.match(blender,/def fir\(\): conifer\('fir_tree_01'\)/,'spruce needles are baked to cards, not decimated');
 assert.ok(!ids.has('pine_tree_01'),'the 950 MB pine scan does not fit a build machine');
 const slice=await readFile('godot/scripts/HarbourSlice.cs','utf8');
 assert.match(slice,/nature-fir_tree_01/);assert.match(slice,/BuildHarbour\(\)/);
 assert.doesNotMatch(slice,/DofBlurFarEnabled = true/,'no tilt-shift miniature blur');
 assert.doesNotMatch(slice,/new SphereMesh \{ Radius = 0\.5f/,'ore is scanned rock, not spheres');
});

test('buildings are built with trim, bevels and cladding, not bare boxes',async()=>{
 const blender=await readFile('scripts/blender/build_summer_harbour.py','utf8');
 for(const kit of ['def bevel','def clad','def window','def roof','def plinth','def chimney'])assert.ok(blender.includes(kit),kit);
 for(const building of ['smelter','drill','warehouse','lighthouse']){
  const body=blender.slice(blender.indexOf(`def ${building}():`));const end=body.indexOf('\ndef ',5);
  const calls=(body.slice(0,end).match(/\b(bbox|box|cylinder|window|clad|roof|plinth|chimney)\(/g)??[]).length;
  assert.ok(calls>=12,`${building} has ${calls} detailed parts`);
 }
});

test('the Electron package leaves raw model scans to the Godot build',async()=>{
 assert.match(await readFile('scripts/build.mjs','utf8'),/filter:src=>!src\.startsWith\(`\$\{CACHE\}\/models`\)/);
});
