import * as T from './vendor/three.module.js';
import { TYPES, rng } from './shared/sim.js';
const C={ground:0x263e3e,edge:0x112a2e,steel:0x617c79,dark:0x283f42,light:0xb7c6b3,gold:0xeab568,orange:0xed8e50,mint:0x9dd2b9,tree:0x315b50,treeTop:0x427465,wood:0x6b6552};
const mats=new Map(),geos=new Map();
function mat(color,basic=false){const key=color+':'+basic;if(!mats.has(key))mats.set(key,basic?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,roughness:.88,metalness:.1}));return mats.get(key);}
function geometry(kind,w,h,d){const key=[kind,w,h,d].join(':');if(!geos.has(key)){let g;if(kind==='box')g=new T.BoxGeometry(w,h,d);else if(kind==='cyl')g=new T.CylinderGeometry(w,w,h,d||8);else if(kind==='cone')g=new T.ConeGeometry(w,h,d||6);else g=new T.IcosahedronGeometry(w,0);geos.set(key,g);}return geos.get(key);}
function part(parent,kind,color,x,y,z,w,h,d,basic=false){const o=new T.Mesh(geometry(kind,w,h,d),mat(color,basic));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,c,x,y,z,w,h,d,b=false)=>part(p,'box',c,x,y,z,w,h,d,b);
const cyl=(p,c,x,y,z,r,h,n=8,b=false)=>part(p,'cyl',c,x,y,z,r,h,n,b);
function plate(p){box(p,C.dark,0,.08,0,.93,.16,.93);box(p,C.steel,0,.18,0,.83,.09,.83);}
export function makeModel(type,dir=0){
 const g=new T.Group();g.userData.type=type;
 if(type==='belt'){
  box(g,0x1a2b2e,0,.06,0,.94,.12,.72);box(g,0x636f5b,0,.135,0,.9,.04,.48);
  for(let x=-.35;x<.5;x+=.22)box(g,C.dark,x,.17,0,.045,.025,.49);
  box(g,C.gold,0,.14,-.34,.95,.07,.045);box(g,C.gold,0,.14,.34,.95,.07,.045);
  const arrow=new T.Shape();arrow.moveTo(-.16,-.14);arrow.lineTo(.13,-.14);arrow.lineTo(.13,-.26);arrow.lineTo(.37,0);arrow.lineTo(.13,.26);arrow.lineTo(.13,.14);arrow.lineTo(-.16,.14);arrow.closePath();const mesh=new T.Mesh(new T.ShapeGeometry(arrow),mat(C.gold,true));mesh.rotation.x=-Math.PI/2;mesh.position.y=.18;g.add(mesh);
  g.rotation.y=-dir*Math.PI/2;return g;
 }
 if(type==='wall'){
  box(g,C.dark,0,.1,0,.99,.2,.76);box(g,0x70827b,0,.5,0,.91,.75,.55);box(g,C.light,0,.9,0,.98,.12,.68);
  for(const x of [-.31,.31])box(g,C.dark,x,.48,-.3,.07,.68,.06);
  box(g,C.gold,0,.73,-.315,.28,.08,.03);return g;
 }
 plate(g);
 if(type==='hq'){
  box(g,C.dark,0,.16,0,1.7,.32,1.7);box(g,C.light,0,.4,0,1.42,.4,1.42);box(g,C.steel,0,.8,0,1.12,.5,1.12);
  cyl(g,C.dark,0,1.2,0,.58,.7,6);cyl(g,C.gold,0,1.2,0,.6,.18,6);cyl(g,C.light,0,1.6,0,.42,.16,6);
  box(g,C.dark,.38,1.95,0,.08,.7,.08);box(g,C.gold,.38,2.32,0,.12,.12,.12,true);box(g,C.mint,-.1,.62,-.726,.52,.19,.02,true);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(g,C.gold,Math.cos(a)*.58,.68,Math.sin(a)*.58,.13,.6,.13);}
  const ring=new T.Mesh(new T.TorusGeometry(.52,.025,4,32),mat(C.gold,true));ring.rotation.x=Math.PI/2;ring.position.y=1.73;ring.name='beacon';g.add(ring);
 }else if(type==='drill'){
  for(const z of [-.33,.33])box(g,C.gold,0,.5,z,.78,.63,.1);
  box(g,C.dark,0,.84,0,.78,.15,.78);const rotor=new T.Group();rotor.name='rotor';rotor.position.y=.5;g.add(rotor);cyl(rotor,C.steel,0,0,0,.17,.67,6);for(let i=0;i<3;i++){const a=box(rotor,C.light,0,-.15+i*.16,0,.57,.07,.16);a.rotation.y=i*.8;}
  box(g,C.light,-.25,.94,0,.21,.1,.4);box(g,C.gold,.44,.27,0,.17,.13,.36);
 }else if(type==='smelter'){
  box(g,C.light,0,.5,0,.69,.57,.68);box(g,C.dark,.357,.46,0,.03,.35,.39);box(g,C.orange,.379,.46,0,.02,.23,.26,true);
  cyl(g,C.dark,-.15,1,0,.21,.5,8);cyl(g,C.steel,-.15,1.3,0,.25,.1,8);box(g,C.gold,0,.75,0,.77,.12,.76);
  for(const z of [-.3,.3])box(g,C.dark,.1,.45,z,.35,.12,.1);
 }else if(type==='assembler'){
  box(g,C.steel,0,.45,0,.77,.48,.77);box(g,C.light,0,.74,0,.8,.12,.8);
  for(const x of [-.3,.3])box(g,C.gold,x,1,0,.09,.5,.1);
  box(g,C.gold,0,1.26,0,.76,.12,.13);const rotor=new T.Group();rotor.name='rotor';rotor.position.y=.9;g.add(rotor);cyl(rotor,C.dark,0,0,0,.25,.1,8);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(rotor,C.light,Math.cos(a)*.24,0,Math.sin(a)*.24,.13,.14,.13);}
  box(g,C.mint,.4,.51,0,.02,.14,.23,true);
 }else if(type==='generator'){
  box(g,C.light,0,.4,0,.8,.4,.65);box(g,C.gold,-.2,.66,0,.3,.2,.67);box(g,C.dark,.2,.68,0,.35,.16,.52);
  const rotor=new T.Group();rotor.name='rotor';rotor.position.set(.19,.8,0);g.add(rotor);cyl(rotor,C.steel,0,0,0,.19,.07,8);for(let i=0;i<3;i++){const a=box(rotor,C.dark,0,.05,0,.4,.03,.07);a.rotation.y=i*Math.PI/3;}
  cyl(g,C.dark,-.25,.94,-.27,.065,.5,6);box(g,C.mint,.12,.43,-.338,.24,.12,.025,true);
 }else if(type==='turret'){
  cyl(g,C.steel,0,.45,0,.32,.5,6);cyl(g,C.gold,0,.76,0,.38,.12,8);
  const head=new T.Group();head.name='head';head.position.y=.95;g.add(head);box(head,C.dark,0,0,0,.53,.3,.45);box(head,C.light,0,.18,0,.6,.09,.53);box(head,C.dark,0,-.02,.44,.12,.12,.65);box(head,C.gold,0,-.02,.78,.16,.16,.1);box(head,C.mint,0,.04,-.235,.15,.08,.02,true);
 }else if(type==='sawmill'){
  box(g,C.steel,0,.42,0,.8,.4,.8);for(const x of [-.3,.3])box(g,C.wood,x,.64,0,.15,.14,.8);
  const rotor=new T.Group();rotor.name='rotor';rotor.position.set(0,.72,0);rotor.rotation.z=Math.PI/2;g.add(rotor);const saw=cyl(rotor,C.light,0,0,0,.3,.05,12);for(let i=0;i<8;i++){const a=i*Math.PI/4;box(rotor,C.steel,Math.cos(a)*.28,0,Math.sin(a)*.28,.12,.07,.12);}
  box(g,C.gold,-.35,.6,0,.1,.25,.66);
 }
 if(type!=='hq'&&type!=='turret'&&type!=='generator'&&type!=='sawmill')g.rotation.y=-dir*Math.PI/2;
 return g;
}
export class View{
 constructor(canvas){
  this.canvas=canvas;this.scene=new T.Scene();this.scene.background=new T.Color(0x172d31);this.scene.fog=new T.FogExp2(0x172d31,.011);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
  this.camera=new T.OrthographicCamera(-20,20,20,-20,.1,180);this.center=new T.Vector3(0,0,0);this.zoom=20;this.camera.position.set(28,34,34);this.camera.lookAt(0,0,0);
  this.scene.add(new T.HemisphereLight(0xd5e3c4,0x294548,2.2));const sun=new T.DirectionalLight(0xffd89c,3);sun.position.set(-14,27,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,far:100});sun.shadow.bias=-.0005;sun.shadow.normalBias=.07;this.scene.add(sun);this.sun=sun;
  const fill=new T.DirectionalLight(0x83b8b2,1.3);fill.position.set(15,12,-20);this.scene.add(fill);
  box(this.scene,C.edge,0,-.62,0,57,1.1,57);this.ground=new T.Group();this.scene.add(this.ground);this.terrain=new T.Group();this.scene.add(this.terrain);
  this.buildings=new Map();this.items=new Map();this.players=new Map();this.enemyCount=0;this.terrainKey='';this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.mouse=new T.Vector2();this.hit=new T.Vector3();this.selected=null;
  const grid=new T.GridHelper(56,56,0x8ba797,0x577d73);grid.position.y=.012;grid.material.transparent=true;grid.material.opacity=.18;this.grid=grid;this.scene.add(grid);grid.visible=false;
  this.cursor=new T.Mesh(new T.PlaneGeometry(.98,.98),new T.MeshBasicMaterial({color:C.mint,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));this.cursor.rotation.x=-Math.PI/2;this.cursor.position.y=.03;this.cursor.visible=false;this.scene.add(this.cursor);
  const ring=new T.RingGeometry(.68,.72,48);this.selection=new T.Mesh(ring,new T.MeshBasicMaterial({color:C.gold,side:T.DoubleSide,transparent:true,opacity:.9}));this.selection.rotation.x=-Math.PI/2;this.selection.position.y=.04;this.selection.visible=false;this.scene.add(this.selection);
  this.range=new T.Mesh(new T.RingGeometry(9.95,10,96),new T.MeshBasicMaterial({color:C.gold,side:T.DoubleSide,transparent:true,opacity:.35}));this.range.rotation.x=-Math.PI/2;this.range.position.y=.035;this.range.visible=false;this.scene.add(this.range);
  const points=new Float32Array(1200*6);this.shotsGeometry=new T.BufferGeometry();this.shotsGeometry.setAttribute('position',new T.BufferAttribute(points,3));this.shotLines=new T.LineSegments(this.shotsGeometry,new T.LineBasicMaterial({color:0xffd890,transparent:true,opacity:.85}));this.scene.add(this.shotLines);
  this.enemyBody=new T.InstancedMesh(geometry('box',.3,.48,.24),mat(0x985c51),500);this.enemyHead=new T.InstancedMesh(geometry('box',.24,.24,.24),mat(0xc7b696),500);this.enemyLegs=new T.InstancedMesh(geometry('box',.11,.25,.13),mat(0x3e4b47),1000);for(const m of [this.enemyBody,this.enemyHead,this.enemyLegs]){m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.count=0;m.castShadow=true;this.scene.add(m);}this.dummy=new T.Object3D();
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);const aspect=w/h;this.camera.left=-this.zoom*aspect;this.camera.right=this.zoom*aspect;this.camera.top=this.zoom;this.camera.bottom=-this.zoom;this.camera.updateProjectionMatrix();}
 setQuality(low){this.renderer.shadowMap.enabled=!low;this.renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.5));this.resize();}
 point(clientX,clientY){this.mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);this.ray.setFromCamera(this.mouse,this.camera);if(!this.ray.ray.intersectPlane(this.plane,this.hit))return null;return{x:Math.round(this.hit.x),z:Math.round(this.hit.z)};}
 pan(x,z){this.center.x=Math.max(-23,Math.min(23,this.center.x+x));this.center.z=Math.max(-23,Math.min(23,this.center.z+z));}
 setZoom(d){this.zoom=Math.max(8,Math.min(35,this.zoom+d));this.resize();}
 centerBase(){this.center.set(0,0,0);}
 setTool(type,dir=0){this.grid.visible=!!type;if(this.ghost){this.scene.remove(this.ghost);this.ghost.traverse(o=>{if(o.isMesh)o.material.dispose();});this.ghost=null;}
  if(type&&!['demolish','repair'].includes(type)){this.ghost=makeModel(type,dir);this.ghost.traverse(o=>{if(o.isMesh){o.material=new T.MeshBasicMaterial({color:C.mint,transparent:true,opacity:.45,depthWrite:false});o.castShadow=false;}});this.scene.add(this.ghost);}
 }
 hover(cell,valid,tool){this.cursor.visible=!!cell&&!!tool;if(!cell)return;this.cursor.position.set(cell.x,.03,cell.z);this.cursor.material.color.set(valid?C.mint:0xf5816d);if(this.ghost){this.ghost.visible=true;this.ghost.position.set(cell.x,0,cell.z);this.ghost.traverse(o=>{if(o.isMesh)o.material.color.set(valid?C.mint:0xf5816d);});}}
 select(b){this.selected=b?.id;this.selection.visible=!!b;this.range.visible=b?.type==='turret';if(b){this.selection.position.set(b.x,.04,b.z);this.range.position.set(b.x,.035,b.z);}}
 staticTerrain(s){
  this.terrainKey=`${s.seed}:${s.terrain.trees.length}:${s.terrain.rocks.length}`;
  for(const group of [this.terrain,this.ground]){while(group.children.length){const o=group.children.pop();o.parent=null;if(o.isInstancedMesh){o.dispose();}}}
  const rand=rng(s.seed),tile=new T.InstancedMesh(geometry('box',.997,.04,.997),mat(C.ground),56*56);const color=new T.Color();let i=0;
  for(let x=-28;x<28;x++)for(let z=-28;z<28;z++){this.dummy.position.set(x,.0,z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();tile.setMatrixAt(i,this.dummy.matrix);const v=rand();color.setHex(v>.95?0x36504a:v>.65?0x2b4441:v>.3?0x2b4140:0x283d3b);tile.setColorAt(i++,color);}tile.receiveShadow=true;this.ground.add(tile);
  const trunks=new T.InstancedMesh(geometry('cyl',.1,.6,5),mat(C.wood),s.terrain.trees.length),leaves=new T.InstancedMesh(geometry('cone',.65,1.6,5),mat(C.tree),s.terrain.trees.length),tops=new T.InstancedMesh(geometry('cone',.47,1.2,5),mat(C.treeTop),s.terrain.trees.length);
  s.terrain.trees.forEach((v,i)=>{this.dummy.position.set(v.x,.3,v.z);this.dummy.rotation.set(0,rand()*6,0);this.dummy.scale.set(1,v.h,1);this.dummy.updateMatrix();trunks.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=.9*v.h;this.dummy.updateMatrix();leaves.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=1.6*v.h;this.dummy.updateMatrix();tops.setMatrixAt(i,this.dummy.matrix);});for(const o of[trunks,leaves,tops]){o.castShadow=true;o.receiveShadow=true;this.terrain.add(o);}
  const ores=new T.InstancedMesh(geometry('ico',.32),mat(0x75a7aa),s.terrain.ore.length*3);i=0;for(const v of s.terrain.ore)for(let k=0;k<3;k++){this.dummy.position.set(v.x+(rand()-.5)*.6,.15,v.z+(rand()-.5)*.6);this.dummy.rotation.set(rand(),rand(),rand());this.dummy.scale.set(1,.6+rand()*.4,1);this.dummy.updateMatrix();ores.setMatrixAt(i++,this.dummy.matrix);}ores.castShadow=true;this.terrain.add(ores);
  const rocks=new T.InstancedMesh(geometry('ico',.5),mat(0x657873),s.terrain.rocks.length);s.terrain.rocks.forEach((v,i)=>{this.dummy.position.set(v.x,v.h*.25,v.z);this.dummy.scale.set(1,v.h,1);this.dummy.rotation.set(0,rand()*6,0);this.dummy.updateMatrix();rocks.setMatrixAt(i,this.dummy.matrix);});rocks.castShadow=true;this.terrain.add(rocks);
 }
 sync(s){
  if(this.terrainKey!==`${s.seed}:${s.terrain.trees.length}:${s.terrain.rocks.length}`)this.staticTerrain(s);
  const ids=new Set(s.buildings.map(b=>b.id));for(const[id,g]of this.buildings)if(!ids.has(id)){this.scene.remove(g);this.buildings.delete(id);if(this.items.has(id)){this.scene.remove(this.items.get(id));this.items.delete(id);}}
  for(const b of s.buildings){let g=this.buildings.get(b.id);if(g&&g.userData.type!==b.type){this.scene.remove(g);this.buildings.delete(b.id);g=null;}if(!g){g=makeModel(b.type,b.dir);g.position.set(b.x,0,b.z);this.scene.add(g);this.buildings.set(b.id,g);}
   const rotor=g.getObjectByName('rotor');if(rotor&&b.active)rotor.rotation.y=s.time*(b.type==='generator'?5:2);
   const head=g.getObjectByName('head');if(head)head.rotation.y=b.aim||0;
   const beacon=g.getObjectByName('beacon');if(beacon){beacon.position.y=1.73+Math.sin(s.time*2)*.06;beacon.rotation.z=s.time*.2;}
   if(b.item){let item=this.items.get(b.id);if(!item){item=new T.Mesh(geometry('box',.21,.16,.21),mat(b.item==='ore'?0x98bbc2:b.item==='plate'?C.light:C.gold));this.items.set(b.id,item);this.scene.add(item);}item.position.set(b.x,.3,b.z);item.visible=true;}
   else if(this.items.has(b.id))this.items.get(b.id).visible=false;
  }
  const pids=new Set(s.players.map(p=>p.id));for(const[id,g]of this.players)if(!pids.has(id)){this.scene.remove(g);this.players.delete(id);}
  const playerColors=[C.gold,0x87b9c9,0xb0bf82,0xc59ab0];
  for(const p of s.players){let g=this.players.get(p.id);if(!g){g=new T.Group();box(g,playerColors[p.color%4],0,.5,0,.3,.4,.25);cyl(g,C.light,0,.83,0,.18,.15,6);box(g,C.dark,0,.79,.15,.21,.08,.03);box(g,C.dark,0,.49,-.2,.25,.3,.12);for(const x of [-.1,.1])box(g,C.dark,x,.2,0,.12,.3,.14);this.scene.add(g);this.players.set(p.id,g);}g.visible=p.hp>0;g.position.set(p.x,0,p.z);if(p.input.x||p.input.z)g.rotation.y=Math.atan2(p.input.x,p.input.z);}
  const n=Math.min(s.enemies.length,500);for(let i=0;i<n;i++){const e=s.enemies[i],scale=e.brute?1.45:1,angle=Math.atan2(-e.x,-e.z),sway=Math.sin(s.time*8+i)*.04;this.dummy.rotation.set(0,angle,0);this.dummy.scale.setScalar(scale);this.dummy.position.set(e.x,.5*scale+sway,e.z);this.dummy.updateMatrix();this.enemyBody.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=.88*scale+sway;this.dummy.updateMatrix();this.enemyHead.setMatrixAt(i,this.dummy.matrix);for(let leg=0;leg<2;leg++){const offset=leg?-.1:.1;this.dummy.position.set(e.x+Math.cos(angle)*offset,.18*scale,e.z-Math.sin(angle)*offset);this.dummy.rotation.x=Math.sin(s.time*9+i+leg*Math.PI)*.4;this.dummy.updateMatrix();this.enemyLegs.setMatrixAt(i*2+leg,this.dummy.matrix);}}
  for(const[o,count]of[[this.enemyBody,n],[this.enemyHead,n],[this.enemyLegs,n*2]]){o.count=count;o.instanceMatrix.needsUpdate=true;o.computeBoundingSphere();}
  const shots=s.shots.slice(-1200),pos=this.shotsGeometry.attributes.position;shots.forEach((v,i)=>{pos.setXYZ(i*2,v.x,.85,v.z);pos.setXYZ(i*2+1,v.tx,.5,v.tz);});pos.needsUpdate=true;this.shotsGeometry.setDrawRange(0,shots.length*2);this.shotsGeometry.computeBoundingSphere();
 }
 draw(){this.camera.position.copy(this.center).add(new T.Vector3(28,34,34));this.camera.lookAt(this.center);this.camera.updateMatrixWorld();this.renderer.render(this.scene,this.camera);}
 project(x,z,y=1.3){const v=new T.Vector3(x,y,z).project(this.camera);return{x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight,visible:v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1};}
}
