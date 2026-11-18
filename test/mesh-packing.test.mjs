import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {fileURLToPath} from 'node:url';import {packMesh} from '../scripts/pack-meshes.mjs';
const bundled=await build({stdin:{contents:"export {decodeMesh} from './public/authored-meshes.js';",resolveDir:process.cwd()},bundle:true,format:'esm',write:false,plugins:[{name:'installed-three',setup(b){b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));}}]});const{decodeMesh}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
function fixture(n=7){const floats=new Float32Array(n*12);for(let i=0;i<n;i++)floats.set([i*.125,-i*.25,i*.03125,Math.sin(i),Math.cos(i),-.25,.12345,.76543,.25,-2.375+i*.01,3.725+i*.02,i%7],i*12);return{stride:12,vertices:n,data:Buffer.from(floats.buffer).toString('base64'),indices:Buffer.from(new Uint32Array([0,n-2,n-1]).buffer).toString('base64')};}
test('packed geometry preserves exact float positions, UVs, topology and surface IDs with bounded normal/color error',()=>{
 const source=fixture(),packed=packMesh(source),a=decodeMesh(source,'Blender reference'),b=decodeMesh(packed,'Blender packed');assert.equal(b.attributes.position.count,a.attributes.position.count);assert.deepEqual([...b.index.array],[...a.index.array]);
 for(let i=0;i<source.vertices;i++)for(const name of ['position','uv','normal','color','coastalSurface'])for(let component=0;component<a.attributes[name].itemSize;component++){
  const actual=b.attributes[name].getComponent(i,component),expected=a.attributes[name].getComponent(i,component);
  if(name==='normal')assert.ok(Math.abs(actual-expected)<=1/32767);else if(name==='color')assert.ok(Math.abs(actual-expected)<=.5/255+1e-7);else assert.equal(actual,expected);
 }
 assert.ok(Buffer.from(packed.data,'base64').length<Buffer.from(source.data,'base64').length*.65);assert.equal(packed.indexType,'u16');assert.equal(packMesh(packed),packed);
});
test('sixteen-bit indices include vertex 65535 while larger meshes retain full index precision',()=>{
 for(const [n,type]of [[65536,'u16'],[65537,'u32']]){const packed=packMesh(fixture(n)),g=decodeMesh(packed,'Blender');assert.equal(packed.indexType,type);assert.equal(g.index.getX(2),n-1);assert.equal(g.attributes.position.getX(n-1),(n-1)*.125);}
});
test('packing rejects broken vertex/index buffers and the loader rejects truncated packed data',()=>{
 const source=fixture();assert.throws(()=>packMesh({...source,data:'AA=='}),/vertex/);assert.throws(()=>packMesh({...source,indices:Buffer.from(new Uint32Array([100]).buffer).toString('base64')}),/Index/);assert.throws(()=>decodeMesh({...packMesh(source),data:'AA=='},'Blender'),/size/);
});
