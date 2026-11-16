// Geometry and projection checks use real Three.js, without a GPU or browser rendering.
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Window} from 'happy-dom';
import {createGame,DIRS,TYPES,logisticsPorts} from '../public/shared/sim.js';
const dom=new Window();dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});globalThis.document=dom.document;
const bundled=await build({entryPoints:[fileURLToPath(new URL('../public/render.js',import.meta.url))],bundle:true,format:'esm',write:false,plugins:[{name:'local-three',setup(b){b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));}}]});
const {makeModel,View}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
// Export matching math types from the installed package; methods operate structurally.
const T=await import('three');
test('all machine rotations and turret levels have finite geometry; ports identify real output direction',()=>{
 for(const type of Object.keys(TYPES).filter(t=>TYPES[t].hp))for(let d=0;d<4;d++){
  const g=makeModel(type,d,[],type==='turret'?3:1);g.updateMatrixWorld(true);
  g.traverse(o=>{if(o.geometry?.attributes?.position){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n),type+' has invalid coordinates');}});
  if(['drill','smelter','assembler'].includes(type)){
   assert.ok(!g.children.some(o=>o.isSprite));
   const arrows=g.children.filter(o=>o.name.startsWith('arrow-'));assert.equal(arrows.length,type==='drill'?1:4);
   for(const arrow of arrows){const at=arrow.getWorldPosition(new T.Vector3()),aim=new T.Vector3(1,0,0).transformDirection(arrow.matrixWorld);assert.ok((at.dot(aim)>0)===(arrow.name==='arrow-OUT'));}
   const out=arrows[0].getWorldPosition(new T.Vector3());assert.ok(Math.abs(out.x-DIRS[d][0]*.66)<.001);assert.ok(Math.abs(out.z-DIRS[d][1]*.66)<.001);
  }
 }
});
test('conveyors support every straight lane, bend and merging junction',()=>{
 for(let out=0;out<4;out++)for(let input=0;input<4;input++)if(input!==out){const g=makeModel('belt',out,[input]);assert.equal(g.children.length,5);g.traverse(o=>{if(o.geometry?.attributes?.position)for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));});}
 const junction=makeModel('belt',0,[1,2,3]);assert.equal(junction.children.length,13);
});
test('machine port decals use crisp shared textures and show the real Return side',()=>{
 const b={type:'splitter',dir:1},model=makeModel(b.type,b.dir);
 model.updateMatrixWorld(true);
 const decal=model.getObjectByName('port-RET');
 const [dx,dz]=DIRS[logisticsPorts(b).return];
 const at=decal.getWorldPosition(new T.Vector3());
 assert.ok(Math.abs(at.x-dx*.72)<.001&&Math.abs(at.z-dz*.72)<.001);
 assert.equal(decal.material.map.image.width,512);
 assert.equal(decal.material.map.image.height,256);
 assert.equal(decal.material.toneMapped,false);
 assert.equal(decal.material.depthWrite,false);
 assert.equal(makeModel('inserter').getObjectByName('port-RET').material,decal.material);
});
test('text badges stay hidden on unselected logistics units at every zoom',()=>{
 globalThis.innerWidth=1280;globalThis.innerHeight=720;
 const model=makeModel('splitter'),label=model.getObjectByName('port-FWD'),view=Object.create(View.prototype);
 let resizes=0;
 Object.assign(view,{buildings:new Map([[1,model]]),selection:{position:new T.Vector3()},range:{position:new T.Vector3()},renderer:{setSize(){resizes++;}},camera:new T.OrthographicCamera(),zoom:35});
 view.resize();
 assert.equal(label.visible,false);
 view.select({id:1,type:'splitter',x:0,z:0});
 assert.ok(Math.abs(label.scale.x/view.worldPerPixel-30)<1e-9);
 assert.equal(label.visible,true);
 view.select(null);
 assert.equal(label.visible,false);
 view.setZoom(-21);
 assert.equal(label.visible,false);
 assert.equal(resizes,1,'Zooming must not resize the framebuffer');
});
test('north-up projection maps W up, A left, and smooth following converges on the engineer',()=>{
 globalThis.innerWidth=1440;globalThis.innerHeight=900;
 const v=Object.create(View.prototype);v.center=new T.Vector3();v.camera=new T.OrthographicCamera(-22.4,22.4,14,-14,.1,180);v.scene=new T.Scene();v.renderer={render(){}};v.draw();
 const n=v.project(0,-1,0),south=v.project(0,1,0),west=v.project(-1,0,0),east=v.project(1,0,0);assert.ok(n.y<south.y);assert.ok(west.x<east.x);assert.ok(Math.abs(west.y-east.y)<.001);assert.ok(Math.abs(v.camera.position.x)<.001);
 v.follow({x:10,z:5},.1);assert.ok(v.center.x>0&&v.center.x<10);for(let i=0;i<100;i++)v.follow({x:10,z:5},.05);assert.ok(v.center.distanceTo(new T.Vector3(10,0,5))<.001);
});
