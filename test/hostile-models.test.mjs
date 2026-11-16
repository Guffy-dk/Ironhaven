import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import * as T from 'three';
const bundled=await build({entryPoints:[fileURLToPath(new URL('../public/coastal-hostiles.js',import.meta.url))],bundle:true,format:'esm',write:false,plugins:[{name:'installed-three',setup(b){b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));}}]});
const {hostilePrototype,CoastalHostiles}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
test('species have separate finite body silhouettes and sculpted appendages',()=>{
 const bounds=[];
 for(const kind of ['runner','drowned','guard','spitter','walker']){
  const p=hostilePrototype(kind);assert.equal(hostilePrototype(kind),p);
  for(const part of [p.body,p.limbs,p.arms].filter(Boolean)){
   assert.ok(part.attributes.position.array.every(Number.isFinite));
   assert.equal(part.attributes.normal.count,part.attributes.position.count);
   assert.equal(part.attributes.uv.count,part.attributes.position.count);
  }
  p.body.computeBoundingBox();bounds.push(p.body.boundingBox.getSize(new T.Vector3()).toArray().join(','));
 }
 assert.equal(new Set(bounds).size,5);
 assert.ok(hostilePrototype('walker').body.boundingBox.max.y>hostilePrototype('runner').body.boundingBox.max.y*4);
});
test('mixed swarms retain positions, positive limb transforms, capacity and cleanup across frames',()=>{
 const scene=new T.Scene(),swarm=new CoastalHostiles(scene,500),enemies=Array.from({length:420},(_,i)=>({id:i,kind:['runner','drowned','guard','spitter','walker'][i%5],x:i,z:3,hp:10}));
 swarm.sync(enemies,1,.05,null,e=>e,null);
 const matrix=new T.Matrix4();let total=0;
 for(const {meshes,count} of swarm.species.values()){
  total+=count;assert.equal(meshes.body.count,count);
  for(const mesh of Object.values(meshes))for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);assert.ok(matrix.elements.every(Number.isFinite));assert.ok(matrix.determinant()>0);}
 }
 assert.equal(total,420);
 const runner=swarm.species.get('runner').meshes.body;runner.getMatrixAt(1,matrix);assert.equal(matrix.elements[12],5);
 swarm.sync([],2,.05,null,e=>e,null);assert.equal(swarm.headings.size,0);
 for(const {meshes} of swarm.species.values())for(const mesh of Object.values(meshes)){assert.equal(mesh.count,0);assert.equal(mesh.visible,false);}
});
