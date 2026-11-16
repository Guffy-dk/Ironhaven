// Geometry and projection checks use real Three.js, without a GPU or browser rendering.
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Window} from 'happy-dom';
import {createGame,DIRS,TYPES,MAX_UPGRADES,logisticsPorts} from '../public/shared/sim.js';
import {upgradeColor} from '../public/upgrade-colors.js';
const dom=new Window();dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});globalThis.document=dom.document;
const bundled=await build({entryPoints:[fileURLToPath(new URL('../public/render.js',import.meta.url))],bundle:true,format:'esm',write:false,plugins:[{name:'local-three',setup(b){b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));}}]});
const {makeModel,View}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
// Export matching math types from the installed package; methods operate structurally.
const T=await import('three');
test('Quarry models have finite geometry, distinct silhouettes and the same port coordinates',()=>{
 for(const [type,{hp}] of Object.entries(TYPES)){
  if(!hp)continue;
  for(let dir=0;dir<4;dir++){
   const classic=makeModel(type,dir,[0,2],3,'classic'),quarry=makeModel(type,dir,[0,2],3,'quarry');
   classic.updateMatrixWorld(true);quarry.updateMatrixWorld(true);
   quarry.traverse(part=>{
    if(part.geometry)assert.ok(part.geometry.attributes.position.array.every(Number.isFinite),type);
   });
   const legacyBounds=new T.Box3().setFromObject(classic),updatedBounds=new T.Box3().setFromObject(quarry);
   assert.ok(!updatedBounds.isEmpty(),type);
   assert.ok(!legacyBounds.equals(updatedBounds),type);
   for(const arrow of classic.children.filter(part=>part.name.startsWith('arrow-'))){
    const other=quarry.children.find(part=>part.name===arrow.name&&part.position.equals(arrow.position));
    assert.ok(other?.getWorldPosition(new T.Vector3()).distanceTo(arrow.getWorldPosition(new T.Vector3()))<1e-9,type);
   }
   const upgrade=new T.Color(upgradeColor(3));
   const colors=quarry.children.find(o=>o.geometry?.attributes.color)?.geometry.attributes.color;
   if(colors){
    assert.ok(Array.from({length:colors.count},(_,i)=>i).some(i=>Math.abs(colors.getX(i)-upgrade.r)<1e-5&&
     Math.abs(colors.getY(i)-upgrade.g)<1e-5&&Math.abs(colors.getZ(i)-upgrade.b)<1e-5),type);
   }
  }
 }
});
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
test('all building types show a distinct body color for each purchased upgrade',()=>{
 const swatches=Array.from({length:MAX_UPGRADES+1},(_,i)=>upgradeColor(i+1));
 assert.equal(new Set(swatches).size,MAX_UPGRADES+1);
 for(const [type,def] of Object.entries(TYPES)){
  if(!def.hp)continue;
  for(let level=2;level<=MAX_UPGRADES+1;level++){
   const expected=swatches[level-1].slice(1);
   const model=makeModel(type,1,[0,2],level);
   let found=false;
   model.traverse(o=>{if(o.isMesh&&o.material.color?.getHexString()===expected)found=true;});
   assert.ok(found,`${type} at level ${level} should display #${expected}`);
  }
 }
 const base=makeModel('smelter'),upgraded=makeModel('smelter',0,[],4);
 for(const arrow of base.children.filter(o=>o.name.startsWith('arrow-'))){
  assert.equal(upgraded.getObjectByName(arrow.name).material,arrow.material);
 }
});
test('barricades reach their shared tile edges on vertical lines, corners and junctions',()=>{
 for(let mask=0;mask<16;mask++){
  const links=DIRS.flatMap((_,d)=>mask&(1<<d)?[d]:[]);
  const bounds=new T.Box3().setFromObject(makeModel('wall',0,links));
  for(const [d,reach] of [bounds.max.x,bounds.max.z,-bounds.min.x,-bounds.min.z].entries())
   assert.equal(reach>=.5,links.includes(d),`shape ${mask}, side ${d}`);
 }
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
test('north-up projection maps W up and A left',()=>{
 globalThis.innerWidth=1440;globalThis.innerHeight=900;
 const v=Object.create(View.prototype);v.center=new T.Vector3();v.camera=new T.OrthographicCamera(-22.4,22.4,14,-14,.1,180);v.scene=new T.Scene();v.renderer={render(){}};v.draw();
 const n=v.project(0,-1,0),south=v.project(0,1,0),west=v.project(-1,0,0),east=v.project(1,0,0);assert.ok(n.y<south.y);assert.ok(west.x<east.x);assert.ok(Math.abs(west.y-east.y)<.001);assert.ok(Math.abs(v.camera.position.x)<.001);
});
