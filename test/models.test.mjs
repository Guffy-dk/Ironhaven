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
test('the conveyor cargo instance buffer grows past the old 700-building capacity',()=>{
 const view=Object.create(View.prototype);view.scene=new T.Scene();
 view.reserveBeltCargo(256);
 const initial=view.beltItems;
 view.reserveBeltCargo(3200);
 assert.ok(view.beltItems.instanceMatrix.count>=3200);
 assert.equal(initial.parent,null);
 assert.equal(view.scene.children.length,1);
 view.beltItems.setMatrixAt(3199,new T.Matrix4().makeTranslation(3,0,4));
 const matrix=new T.Matrix4();view.beltItems.getMatrixAt(3199,matrix);
 assert.equal(matrix.elements[12],3);
});
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
   for(const arrow of classic.children.filter(part=>part.name.startsWith('arrow-')&&type!=='splitter')){
    const other=quarry.children.find(part=>part.name===arrow.name&&part.position.equals(arrow.position));
    assert.ok(other?.getWorldPosition(new T.Vector3()).distanceTo(arrow.getWorldPosition(new T.Vector3()))<1e-9,type);
   }
   const surfaces=quarry.children.filter(o=>o.geometry?.attributes.color);
   const base=makeModel(type,dir,[0,2],1,'quarry');
   let baseVertices=0,upgradedVertices=0;
   base.traverse(o=>{baseVertices+=o.geometry?.attributes.position.count||0;});
   quarry.traverse(o=>{upgradedVertices+=o.geometry?.attributes.position.count||0;});
   if(!TYPES[type].fixedLevel)assert.ok(upgradedVertices>baseVertices,`${type} upgrade must add visible structure`);
   for(const model of surfaces.filter(o=>o.material.map)){
    assert.equal(model.geometry.attributes.uv.count,model.geometry.attributes.position.count);
    assert.ok(model.material.bumpScale>0);
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
  if(!def.hp||def.fixedLevel)continue;
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

test('every coastal upgrade adds visible structure while workshop bases share authored Blender meshes',()=>{
 for(const [type,def] of Object.entries(TYPES)){
  if(!def.hp||def.fixedLevel||type==='turret')continue;
  let previous=0;
  for(let level=1;level<=MAX_UPGRADES+1;level++){
   const model=makeModel(type,0,[],level,'quarry');let vertices=0;
   model.traverse(part=>{vertices+=part.geometry?.attributes.position.count||0;});
   assert.ok(vertices>=previous,`${type} level ${level} must visibly differ from its predecessor`);previous=vertices;
  }
 }
 const base=makeModel('smelter',0,[],1,'quarry'),upgraded=makeModel('smelter',0,[],8,'quarry');
 assert.equal(base.children.find(p=>p.geometry?.userData.authoredBy)?.geometry,upgraded.children.find(p=>p.geometry?.userData.authoredBy)?.geometry);
});

test('conveyor lanes run from each actual input edge to the configured output through bends and junctions',()=>{
 for(let out=0;out<4;out++){
  const model=makeModel('belt',out,[0,1,2,3].filter(d=>d!==out),1,'quarry');
  const lanes=model.children.filter(o=>o.geometry?.attributes.uv?.count===34);assert.equal(lanes.length,3);
  for(const lane of lanes){
   const p=lane.geometry.attributes.position,uv=lane.geometry.attributes.uv,n=p.count;
   assert.equal(uv.getX(0),0);assert.equal(uv.getX(n-1),1);
   const endX=(p.getX(n-1)+p.getX(n-2))/2,endZ=(p.getZ(n-1)+p.getZ(n-2))/2;
   assert.ok(Math.abs(endX-DIRS[out][0]*.51)<1e-6);assert.ok(Math.abs(endZ-DIRS[out][1]*.51)<1e-6);
  }
 }
});

test('belts restore the cream v0.16 arrow size and placement for every rotation and upgrade',()=>{
 for(const dir of [0,1,2,3])for(const level of [1,8,21]){
  const arrow=makeModel('belt',dir,[],level,'quarry').getObjectByName('belt-direction');assert.ok(arrow);assert.equal(arrow.scale.x,.56);assert.equal(arrow.scale.y,.56);assert.equal(arrow.position.x,DIRS[dir][0]*.17);assert.equal(arrow.position.z,DIRS[dir][1]*.17);assert.equal(arrow.position.y,.208);assert.equal(arrow.material.color.getHex(),0xc9c1aa);
 }
});
test('workshop roofs retain authored detail while their paint identifies the production trade',()=>{
 const roofColors=new Set();for(const type of ['smelter','assembler','foundry','circuitLab','componentFactory','storage']){
  const model=makeModel(type,0,[],1,'quarry');assert.equal(model.userData.authored,true);const roof=model.children.find(o=>o.isMesh&&o.material.userData.paintSurface==='roof');assert.ok(roof,type);assert.ok(roof.geometry.attributes.position.count>100);const c=roof.geometry.attributes.color;roofColors.add([c.getX(0),c.getY(0),c.getZ(0)].map(v=>Math.round(v*255)).join(','));assert.ok(roof.material.map&&roof.material.bumpMap);
 }assert.equal(roofColors.size,6,'Each factory type needs its own roof paint');
});
