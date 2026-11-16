import * as T from './vendor/three.module.js';
import { TYPES, rng, DIRS, DIRECTIONAL, key, beltInputs, turretStats, productionSpeed } from './shared/sim.js';
const C={ground:0x263e3e,edge:0x112a2e,steel:0x617c79,dark:0x283f42,light:0xb7c6b3,gold:0xeab568,orange:0xed8e50,mint:0x9dd2b9,tree:0x315b50,treeTop:0x427465,wood:0x6b6552};
const CAMERA_OFFSET=new T.Vector3(0,32,27);
const cyan=0x79d8d0;
const itemColors={ore:0x98bbc2,copperOre:0xc88c58,plate:C.light,gear:C.gold,copper:0xe3aa72,steel:0x8ca6b8,circuit:0x67d6bd,module:0xb6a4dc};
const mats=new Map(),geos=new Map();
function mat(color,basic=false){const key=color+':'+basic;if(!mats.has(key))mats.set(key,basic?new T.MeshBasicMaterial({color}):new T.MeshStandardMaterial({color,roughness:.72,metalness:.18}));return mats.get(key);}
function geometry(kind,w,h,d){const key=[kind,w,h,d].join(':');if(!geos.has(key)){let g;if(kind==='box')g=new T.BoxGeometry(w,h,d);else if(kind==='round'){const r=Math.min(.06,Math.min(w,h,d)*.18),shape=new T.Shape();shape.moveTo(-w/2+r,-h/2+r);shape.lineTo(w/2-r,-h/2+r);shape.lineTo(w/2-r,h/2-r);shape.lineTo(-w/2+r,h/2-r);shape.closePath();g=new T.ExtrudeGeometry(shape,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r,bevelSegments:2,steps:1});g.translate(0,0,-d/2+r);}else if(kind==='cyl')g=new T.CylinderGeometry(w,w,h,d||8);else if(kind==='cone')g=new T.ConeGeometry(w,h,d||6);else g=new T.IcosahedronGeometry(w,0);geos.set(key,g);}return geos.get(key);}
function part(parent,kind,color,x,y,z,w,h,d,basic=false){const o=new T.Mesh(geometry(kind,w,h,d),mat(color,basic));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
const box=(p,c,x,y,z,w,h,d,b=false)=>part(p,'round',c,x,y,z,w,h,d,b);
const cyl=(p,c,x,y,z,r,h,n=8,b=false)=>part(p,'cyl',c,x,y,z,r,h,n,b);
function plate(p){cyl(p,C.dark,0,.08,0,.53,.16,12);box(p,C.steel,0,.18,0,.8,.09,.8);}
export function makeModel(type,dir=0,inputs=[(dir+2)%4],level=1){
 const originalType=type;type=({copperDrill:'drill',foundry:'smelter',circuitLab:'assembler',componentFactory:'assembler'})[type]||type;
 const g=new T.Group();g.userData.type=originalType;
 if(type==='belt'){
  // Each incoming lane curves into the output; geometry ends exactly at tile edges.
  const unique=[...new Set(inputs.filter(v=>v!==dir))];if(!unique.length)unique.push((dir+2)%4);
  for(const input of unique){
   const[ax,az]=DIRS[input],[bx,bz]=DIRS[dir],curve=new T.QuadraticBezierCurve3(new T.Vector3(ax*.51,.13,az*.51),new T.Vector3(0,.13,0),new T.Vector3(bx*.51,.13,bz*.51));
   const cacheKey=`road:${input}:${dir}`;let road=geos.get(cacheKey);
   if(!road){const vertices=[],indices=[],points=curve.getPoints(16);for(let i=0;i<points.length;i++){const tangent=curve.getTangent(i/16),normal=new T.Vector3(-tangent.z,0,tangent.x).normalize();for(const sign of[-1,1]){const v=points[i].clone().addScaledVector(normal,.285*sign);vertices.push(v.x,v.y,v.z);}if(i<16){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}}road=new T.BufferGeometry();road.setAttribute('position',new T.Float32BufferAttribute(vertices,3));road.setIndex(indices);road.computeVertexNormals();geos.set(cacheKey,road);}
   const lane=new T.Mesh(road,mat(0x647565));lane.material.side=T.DoubleSide;lane.receiveShadow=true;g.add(lane);
   for(const sign of[-1,1]){const railKey=`rail:${input}:${dir}:${sign}`;let geo=geos.get(railKey);if(!geo){const pts=[];for(let i=0;i<=16;i++){const v=curve.getPoint(i/16),t=curve.getTangent(i/16);v.addScaledVector(new T.Vector3(-t.z,0,t.x).normalize(),sign*.31);v.y=.15;pts.push(v);}geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,.025,4,false);geos.set(railKey,geo);}g.add(new T.Mesh(geo,mat(C.gold)));}
   box(g,C.mint,ax*.44,.16,az*.44,Math.abs(az)*.34+.045,.03,Math.abs(ax)*.34+.045,true);
  }
  const arrow=new T.Shape();arrow.moveTo(-.08,-.09);arrow.lineTo(.08,-.09);arrow.lineTo(.08,-.16);arrow.lineTo(.27,0);arrow.lineTo(.08,.16);arrow.lineTo(.08,.09);arrow.lineTo(-.08,.09);arrow.closePath();const a=new T.Mesh(new T.ShapeGeometry(arrow),mat(C.gold,true));a.rotation.set(-Math.PI/2,0,-dir*Math.PI/2);a.position.set(DIRS[dir][0]*.14,.19,DIRS[dir][1]*.14);g.add(a);return g;
 }
 if(type==='inserter'){
  cyl(g,C.dark,0,.13,0,.42,.22,8);cyl(g,0x76aeb4,0,.27,0,.31,.08,8);
  for(const z of[-.25,.25]){box(g,C.steel,0,.46,z,.12,.43,.1);box(g,0x8ce8d6,0,.68,z,.13,.06,.14,true);}
  const capsule=new T.Group();capsule.name='cargoCapsule';capsule.position.y=.58;g.add(capsule);const shell=cyl(capsule,C.light,0,0,0,.13,.28,8);shell.rotation.z=Math.PI/2;box(capsule,0x76e6d2,0,.01,.12,.17,.08,.035,true);
  port(g,2,'IN',cyan);port(g,0,'M',0x99ddb8);port(g,1,'RET',0xb9a2e5);g.rotation.y=-dir*Math.PI/2;return g;
 }
 if(type==='splitter'){
  cyl(g,C.dark,0,.15,0,.53,.22,6);cyl(g,C.steel,0,.32,0,.44,.14,6);
  const dial=cyl(g,0x91d8d0,0,.43,0,.23,.055,3,true);dial.name='dispatchDial';
  port(g,2,'IN',cyan);port(g,0,'FWD',C.gold);port(g,3,'M',0x99ddb8);port(g,1,'RET',0xb9a2e5);g.rotation.y=-dir*Math.PI/2;return g;
 }
 if(type==='wall'){
  box(g,C.dark,0,.1,0,.99,.2,.76);box(g,0x70827b,0,.5,0,.91,.75,.55);box(g,C.light,0,.9,0,.98,.12,.68);
  for(const x of [-.31,.31])box(g,C.dark,x,.48,-.3,.07,.68,.06);
  box(g,C.gold,0,.73,-.315,.28,.08,.03);return g;
 }
 plate(g);
 if(type==='storage'){
  box(g,C.dark,0,.25,0,.85,.3,.85);for(const x of[-.22,.22])for(const z of[-.22,.22]){cyl(g,C.steel,x,.65,z,.18,.65,12);cyl(g,C.gold,x,.6,z,.19,.06,12);}box(g,C.light,0,1.03,0,.9,.08,.9);for(let d=0;d<4;d++)port(g,d,'IN',0x79d8d0);
 }else if(type==='launchpad'){
  cyl(g,C.dark,0,.24,0,.75,.18,16);cyl(g,C.gold,0,.36,0,.64,.08,16);cyl(g,C.light,0,1.1,0,.24,1.4,12);part(g,'cone',C.gold,0,1.95,0,.25,.45,12);for(const x of[-.28,.28]){box(g,C.steel,x,.68,0,.12,.65,.35);cyl(g,C.orange,x,.3,0,.12,.16,8,true);}for(let d=0;d<4;d++)port(g,d,'IN',0x79d8d0);
 }else if(type==='hq'){
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
  cyl(g,level>1?C.mint:C.steel,0,.6,0,.35,.12,12);const head=new T.Group();head.name='head';head.position.y=.95;g.add(head);box(head,C.dark,0,0,0,.53,.3,.45);box(head,C.light,0,.18,0,.6,.09,.53);box(head,C.dark,0,-.02,.44,.12,.12,.65);box(head,C.gold,0,-.02,.78,.16,.16,.1);box(head,C.mint,0,.04,-.235,.15,.08,.02,true);if(level>=2)box(head,C.dark,.18,-.02,.44,.1,.1,.65);if(level>=3){box(head,C.dark,-.18,-.02,.44,.1,.1,.65);cyl(g,C.gold,0,.28,0,.39,.12,12);}
 }else if(type==='sawmill'){
  box(g,C.steel,0,.42,0,.8,.4,.8);for(const x of [-.3,.3])box(g,C.wood,x,.64,0,.15,.14,.8);
  const rotor=new T.Group();rotor.name='rotor';rotor.position.set(0,.72,0);rotor.rotation.z=Math.PI/2;g.add(rotor);const saw=cyl(rotor,C.light,0,0,0,.3,.05,12);for(let i=0;i<8;i++){const a=i*Math.PI/4;box(rotor,C.steel,Math.cos(a)*.28,0,Math.sin(a)*.28,.12,.07,.12);}
  box(g,C.gold,-.35,.6,0,.1,.25,.66);
 }
 if(['drill','smelter','assembler'].includes(type)){
  port(g,0,'OUT',C.gold);if(type!=='drill')for(const side of [1,2,3])port(g,side,'IN',cyan);
  if(type==='smelter'){cyl(g,C.steel,.2,.53,.18,.2,.5,12);cyl(g,C.gold,.2,.8,.18,.21,.05,12);}
 }
 if(originalType==='copperDrill')cyl(g,0xd49260,0,.87,.26,.16,.15,12);
 if(originalType==='foundry')for(const x of[-.23,.23])cyl(g,0x91aeb7,x,.8,0,.15,.5,12);
 if(originalType==='circuitLab')box(g,0x69d5c6,0,.77,-.25,.55,.06,.22,true);
 if(originalType==='componentFactory')for(const x of[-.24,.24])cyl(g,0xb2a1cc,x,.9,.2,.12,.35,8);
 if(level>1)cyl(g,C.mint,0,.24,0,.44,.035,12,true);
 if(type!=='hq'&&type!=='turret'&&type!=='generator'&&type!=='sawmill')g.rotation.y=-dir*Math.PI/2;
 return g;
}
const portMaterials=new Map();
const portBadges=new WeakMap();
function portBadgeMaterial(text,color){
 const key=`${text}:${color}`;
 if(!portMaterials.has(key)){
  const canvas=document.createElement('canvas');
  canvas.width=512;canvas.height=256;
  const ctx=canvas.getContext('2d');
  const accent='#'+color.toString(16).padStart(6,'0');
  ctx.fillStyle='#071417';ctx.fillRect(0,0,512,256);
  ctx.fillStyle=accent;ctx.fillRect(16,16,480,224);
  ctx.fillStyle='#071417';ctx.font='900 166px system-ui, sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,130,448);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  portMaterials.set(key,new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false,toneMapped:false,fog:false}));
 }
 return portMaterials.get(key);
}
function sizePortBadges(model,worldPerPixel,selected){
 const badges=portBadges.get(model);
 if(!badges)return;
 const width=Math.max(.58,30*worldPerPixel);
 const radius=Math.max(.72,20*worldPerPixel);
 for(const badge of badges){
  const {dx,dz,widthFactor}=badge.userData;
  badge.position.x=dx*radius;badge.position.z=dz*radius;
  badge.scale.set(width*widthFactor,width*.5,1);
  badge.visible=selected;
 }
}
const portArrow=(()=>{
 const arrow=new T.Shape();
 arrow.moveTo(-.17,-.05);arrow.lineTo(.01,-.05);arrow.lineTo(.01,-.12);
 arrow.lineTo(.18,0);arrow.lineTo(.01,.12);arrow.lineTo(.01,.05);arrow.lineTo(-.17,.05);arrow.closePath();
 return new T.ShapeGeometry(arrow).rotateX(-Math.PI/2);
})();
function port(g,side,text,color){
 const[dx,dz]=DIRS[side];
 const arrow=new T.Mesh(portArrow,mat(color,true));
 arrow.name=`arrow-${text}`;
 arrow.position.set(dx*.66,.21,dz*.66);
 arrow.rotation.y=-(side+(text==='IN'?2:0))*Math.PI/2;
 g.add(arrow);
 if(!['inserter','splitter'].includes(g.userData.type))return;
 const label=new T.Sprite(portBadgeMaterial(text,color));
 label.name=`port-${text}`;
 label.userData={dx,dz,widthFactor:text==='IN'?.82:text==='M'?.54:1};
 // Stagger the main inputs and outputs so both labels fit across a short belt.
 const height=text==='FWD'?.92:.48;
 label.position.set(dx*.72,height,dz*.72);
 label.scale.set(.58*label.userData.widthFactor,.29,1);label.renderOrder=2;label.visible=false;
 if(!portBadges.has(g))portBadges.set(g,[]);
 portBadges.get(g).push(label);g.add(label);
}
export class View{
 constructor(canvas){
  this.canvas=canvas;this.scene=new T.Scene();this.scene.background=new T.Color(0x172d31);this.scene.fog=new T.FogExp2(0x172d31,.011);
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.autoUpdate=false;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.18;
  this.camera=new T.OrthographicCamera(-20,20,20,-20,.1,180);this.center=new T.Vector3(0,0,0);this.zoom=14;this.camera.position.set(0,32,27);this.camera.lookAt(0,0,0);
  this.scene.add(new T.HemisphereLight(0xd5e3c4,0x294548,2.2));const sun=new T.DirectionalLight(0xffd89c,3);sun.position.set(-14,27,13);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,far:100});sun.shadow.bias=-.0005;sun.shadow.normalBias=.07;this.scene.add(sun);this.sun=sun;
  const fill=new T.DirectionalLight(0x83b8b2,1.3);fill.position.set(15,12,-20);this.scene.add(fill);
  this.ground=new T.Group();this.scene.add(this.ground);this.terrain=new T.Group();this.scene.add(this.terrain);
  this.buildings=new Map();this.items=new Map();this.players=new Map();this.enemyCount=0;this.terrainKey='';this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.mouse=new T.Vector2();this.hit=new T.Vector3();this.selected=null;
  const grid=new T.GridHelper(56,56,0x8ba797,0x577d73);grid.position.y=.012;grid.material.transparent=true;grid.material.opacity=.18;this.grid=grid;this.scene.add(grid);grid.visible=false;
  this.cursor=new T.Mesh(new T.PlaneGeometry(.98,.98),new T.MeshBasicMaterial({color:C.mint,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));this.cursor.rotation.x=-Math.PI/2;this.cursor.position.y=.03;this.cursor.visible=false;this.scene.add(this.cursor);
  const ring=new T.RingGeometry(.68,.72,48);this.selection=new T.Mesh(ring,new T.MeshBasicMaterial({color:C.gold,side:T.DoubleSide,transparent:true,opacity:.9}));this.selection.rotation.x=-Math.PI/2;this.selection.position.y=.04;this.selection.visible=false;this.scene.add(this.selection);
  this.range=new T.Mesh(new T.RingGeometry(9.95,10,96),new T.MeshBasicMaterial({color:C.gold,side:T.DoubleSide,transparent:true,opacity:.35}));this.range.rotation.x=-Math.PI/2;this.range.position.y=.035;this.range.visible=false;this.scene.add(this.range);
  const points=new Float32Array(1200*6);this.shotsGeometry=new T.BufferGeometry();this.shotsGeometry.setAttribute('position',new T.BufferAttribute(points,3));this.shotLines=new T.LineSegments(this.shotsGeometry,new T.LineBasicMaterial({color:0xffd890,transparent:true,opacity:.85}));this.shotLines.frustumCulled=false;this.scene.add(this.shotLines);
  this.enemyBody=new T.InstancedMesh(geometry('box',.3,.48,.24),mat(0x985c51),500);this.enemyHead=new T.InstancedMesh(geometry('box',.24,.24,.24),mat(0xc7b696),500);this.enemyLegs=new T.InstancedMesh(geometry('box',.11,.25,.13),mat(0x3e4b47),1000);for(const m of [this.enemyBody,this.enemyHead,this.enemyLegs]){m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.count=0;m.frustumCulled=false;this.scene.add(m);}this.dummy=new T.Object3D();this.projected=new T.Vector3();this.renderPosition={x:0,z:0};this.routeMesh=null;this.routeKey='';this.areaMesh=null;this.areaKey='';
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){this.renderer.setSize(innerWidth,innerHeight,false);this.updateProjection();}
 updateProjection(){const w=innerWidth,h=innerHeight,aspect=w/h;this.camera.left=-this.zoom*aspect;this.camera.right=this.zoom*aspect;this.camera.top=this.zoom;this.camera.bottom=-this.zoom;this.camera.updateProjectionMatrix();
  this.worldPerPixel=2*this.zoom/h;
  for(const [id,model] of this.buildings)sizePortBadges(model,this.worldPerPixel,id===this.selected);
  if(this.ghost)sizePortBadges(this.ghost,this.worldPerPixel,true);
 }
 setQuality(low){this.renderer.shadowMap.enabled=!low;this.renderer.shadowMap.needsUpdate=!low;this.renderer.setPixelRatio(low?Math.min(devicePixelRatio,.8):Math.min(devicePixelRatio,1.5));this.resize();}
 point(clientX,clientY){this.mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);this.ray.setFromCamera(this.mouse,this.camera);if(!this.ray.ray.intersectPlane(this.plane,this.hit))return null;return{x:Math.round(this.hit.x),z:Math.round(this.hit.z)};}
 pan(x,z){this.center.x=Math.max(-23,Math.min(23,this.center.x+x));this.center.z=Math.max(-23,Math.min(23,this.center.z+z));}
 setZoom(d){this.zoom=Math.max(8,Math.min(35,this.zoom+d));this.updateProjection();}
 centerBase(){this.center.set(0,0,0);}
 follow(player,dt){const weight=1-Math.exp(-dt*9);this.center.x+=(player.x-this.center.x)*weight;this.center.z+=(player.z-this.center.z)*weight;}
 previewRoute(cells,valid=true,arrows=false){
  const signature=cells.map(c=>`${c.type??''}:${c.x},${c.z},${c.dir}`).join(';')+valid+arrows;if(signature===this.routeKey)return;this.routeKey=signature;
  if(this.routeMesh){this.scene.remove(this.routeMesh);this.routeMesh.traverse(mesh=>{mesh.geometry.dispose();mesh.material.dispose();mesh.dispose();});this.routeMesh=null;}
  if(!cells.length)return;const mesh=new T.InstancedMesh(new T.PlaneGeometry(.9,.9),new T.MeshBasicMaterial({color:valid?C.mint:0xf5816d,side:T.DoubleSide,transparent:true,opacity:.4,depthWrite:false}),cells.length);
  cells.forEach((c,i)=>{this.dummy.position.set(c.x,.25,c.z);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);});mesh.frustumCulled=false;this.routeMesh=mesh;this.scene.add(mesh);
  const directed=arrows?cells.filter(cell=>!cell.type||DIRECTIONAL.includes(cell.type)):[];
  if(directed.length){
   const shape=new T.Shape();
   shape.moveTo(-.26,-.07);shape.lineTo(.03,-.07);shape.lineTo(.03,-.16);shape.lineTo(.28,0);shape.lineTo(.03,.16);shape.lineTo(.03,.07);shape.lineTo(-.26,.07);shape.closePath();
   const arrow=new T.InstancedMesh(new T.ShapeGeometry(shape),new T.MeshBasicMaterial({color:valid?C.light:0xf5816d,side:T.DoubleSide}),directed.length);
   directed.forEach((c,i)=>{this.dummy.position.set(c.x,.34,c.z);this.dummy.rotation.set(-Math.PI/2,0,-c.dir*Math.PI/2,'XYZ');this.dummy.updateMatrix();arrow.setMatrixAt(i,this.dummy.matrix);});
   arrow.frustumCulled=false;mesh.add(arrow);
  }
 }
 markArea(ids,s){
  const bs=s.buildings.filter(b=>ids.includes(b.id)),signature=bs.map(b=>`${b.id}:${b.x},${b.z}`).join(';');if(signature===this.areaKey)return;this.areaKey=signature;
  if(this.areaMesh){this.scene.remove(this.areaMesh);this.areaMesh.geometry.dispose();this.areaMesh.material.dispose();this.areaMesh.dispose();this.areaMesh=null;}
  if(!bs.length)return;const mesh=new T.InstancedMesh(new T.RingGeometry(.48,.55,4,1,Math.PI/4),new T.MeshBasicMaterial({color:0x89d8df,side:T.DoubleSide,transparent:true,opacity:.85,depthTest:false}),bs.length);
  bs.forEach((b,i)=>{this.dummy.position.set(b.x,.3,b.z);this.dummy.rotation.set(-Math.PI/2,0,0);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();mesh.setMatrixAt(i,this.dummy.matrix);});mesh.frustumCulled=false;this.areaMesh=mesh;this.scene.add(mesh);
 }
 setTool(type,dir=0){this.grid.visible=!!type;if(this.ghost){this.scene.remove(this.ghost);this.ghostMaterial.dispose();this.ghost=null;}
  if(type&&!['demolish','repair'].includes(type)){this.ghost=makeModel(type,dir);this.ghostMaterial=new T.MeshBasicMaterial({color:C.mint,transparent:true,opacity:.45,depthWrite:false});this.ghost.traverse(o=>{if(o.isMesh){if(!o.name.startsWith('arrow-'))o.material=this.ghostMaterial;o.castShadow=false;}});sizePortBadges(this.ghost,this.worldPerPixel,true);this.scene.add(this.ghost);}
 }
 hover(cell,valid,tool){this.cursor.visible=!!cell&&!!tool;if(!cell)return;this.cursor.position.set(cell.x,.03,cell.z);this.cursor.material.color.set(valid?C.mint:0xf5816d);if(this.ghost){this.ghost.visible=true;this.ghost.position.set(cell.x,0,cell.z);this.ghostMaterial.color.set(valid?C.mint:0xf5816d);}}
 select(b){
  if(this.selected!==b?.id){
   const previous=this.buildings.get(this.selected),next=this.buildings.get(b?.id);
   if(previous)sizePortBadges(previous,this.worldPerPixel,false);
   if(next)sizePortBadges(next,this.worldPerPixel,true);
  }
  this.selected=b?.id;this.selection.visible=!!b;this.range.visible=b?.type==='turret';if(b?.type==='turret')this.range.scale.setScalar(turretStats(b).range/10);if(b){this.selection.position.set(b.x,.04,b.z);this.range.position.set(b.x,.035,b.z);}
 }
 staticTerrain(s){
  this.renderer.shadowMap.needsUpdate=true;
  this.terrainKey=`${s.seed}:${s.terrain.trees.length}:${s.terrain.rocks.length}`;
  for(const group of [this.terrain,this.ground]){while(group.children.length){const o=group.children.pop();o.parent=null;if(o.isInstancedMesh){o.dispose();}else if(o.isMesh){o.geometry.dispose();o.material.dispose();}}}
  const rand=rng(s.seed),color=new T.Color(),groundGeometry=new T.PlaneGeometry(82,82,82,82);groundGeometry.rotateX(-Math.PI/2);const colors=[],vertices=groundGeometry.attributes.position;
  for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i),n=(Math.sin(x*.27+Math.cos(z*.19))+Math.cos(z*.33-x*.11)+2)/4,d=Math.hypot(x*.9,z);color.setHex(d<12?0x42504a:0x325148).lerp(new T.Color(0x223c39),n*.7);colors.push(color.r,color.g,color.b);vertices.setY(i,-.026+(d>12?Math.sin(x*.7)*Math.cos(z*.6)*.017:0));}
  groundGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));groundGeometry.computeVertexNormals();const ground=new T.Mesh(groundGeometry,new T.MeshStandardMaterial({vertexColors:true,roughness:1}));ground.receiveShadow=true;this.ground.add(ground);let i=0;
  const grass=new T.InstancedMesh(geometry('cone',.12,.25,3),mat(0x638067),650);let gi=0;while(gi<650){const x=(rand()-.5)*65,z=(rand()-.5)*65;if(Math.hypot(x,z)<12)continue;this.dummy.position.set(x,.07,z);this.dummy.rotation.set(0,rand()*6,.1);this.dummy.scale.set(.6+rand(),.6+rand(),.6+rand());this.dummy.updateMatrix();grass.setMatrixAt(gi++,this.dummy.matrix);}this.terrain.add(grass);
  const trunks=new T.InstancedMesh(geometry('cyl',.1,.6,5),mat(C.wood),s.terrain.trees.length),leaves=new T.InstancedMesh(geometry('ico',.72),mat(C.tree),s.terrain.trees.length),tops=new T.InstancedMesh(geometry('ico',.56),mat(C.treeTop),s.terrain.trees.length);
  s.terrain.trees.forEach((v,i)=>{this.dummy.position.set(v.x,.3,v.z);this.dummy.rotation.set(0,rand()*6,0);this.dummy.scale.set(.8+rand()*.4,v.h*1.15,.8+rand()*.4);this.dummy.updateMatrix();trunks.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=.9*v.h;this.dummy.updateMatrix();leaves.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=1.6*v.h;this.dummy.updateMatrix();tops.setMatrixAt(i,this.dummy.matrix);});for(const o of[trunks,leaves,tops]){o.castShadow=true;o.receiveShadow=true;this.terrain.add(o);}
  const ores=new T.InstancedMesh(geometry('ico',.32),mat(0x75a7aa),s.terrain.ore.length*3);i=0;for(const v of s.terrain.ore)for(let k=0;k<3;k++){this.dummy.position.set(v.x+(rand()-.5)*.6,.15,v.z+(rand()-.5)*.6);this.dummy.rotation.set(rand(),rand(),rand());this.dummy.scale.set(1,.6+rand()*.4,1);this.dummy.updateMatrix();ores.setMatrixAt(i++,this.dummy.matrix);}ores.castShadow=true;this.terrain.add(ores);
  if(s.terrain.copper?.length){const copper=new T.InstancedMesh(geometry('ico',.36),mat(0xcc9267),s.terrain.copper.length);s.terrain.copper.forEach((v,i)=>{this.dummy.position.set(v.x,.13,v.z);this.dummy.scale.set(.9,.6,.9);this.dummy.rotation.set(.2,rand()*6,.1);this.dummy.updateMatrix();copper.setMatrixAt(i,this.dummy.matrix);});copper.castShadow=true;this.terrain.add(copper);}
  const rocks=new T.InstancedMesh(geometry('ico',.5),mat(0x657873),s.terrain.rocks.length);s.terrain.rocks.forEach((v,i)=>{this.dummy.position.set(v.x,v.h*.25,v.z);this.dummy.scale.set(.8+rand()*.4,v.h*1.15,.8+rand()*.4);this.dummy.rotation.set(0,rand()*6,0);this.dummy.updateMatrix();rocks.setMatrixAt(i,this.dummy.matrix);});rocks.castShadow=true;this.terrain.add(rocks);
 }
 sync(s,motion,nowTime=s.time){
  const time=motion?.renderTime??nowTime,tick=motion?.renderTick??s.tick;
  const position=actor=>motion?.position(actor,this.renderPosition)??actor;
  if(this.terrainKey!==`${s.seed}:${s.terrain.trees.length}:${s.terrain.rocks.length}`)this.staticTerrain(s);
  const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
  const ids=new Set(s.buildings.map(b=>b.id));for(const[id,g]of this.buildings)if(!ids.has(id)){this.scene.remove(g);this.buildings.delete(id);this.renderer.shadowMap.needsUpdate=true;if(this.items.has(id)){this.scene.remove(this.items.get(id));this.items.delete(id);}}
  for(const b of s.buildings){const inputs=b.type==='belt'?beltInputs(b,grid):[],signature=[b.type,b.dir,b.level||1,...inputs].join(':');let g=this.buildings.get(b.id);if(g&&g.userData.signature!==signature){this.scene.remove(g);this.buildings.delete(b.id);g=null;}
   if(!g){
    g=makeModel(b.type,b.dir,inputs,b.level||1);g.userData.signature=signature;
    for(const name of ['rotor','cargoCapsule','dispatchDial','head','beacon']){
     const part=g.getObjectByName(name);
     if(part){g.userData[name]=part;part.traverse(o=>{o.castShadow=false;});}
    }
    g.position.set(b.x,0,b.z);sizePortBadges(g,this.worldPerPixel,b.id===this.selected);
    this.scene.add(g);this.buildings.set(b.id,g);this.renderer.shadowMap.needsUpdate=true;
   }else if(g.position.x!==b.x||g.position.z!==b.z){g.position.set(b.x,0,b.z);this.renderer.shadowMap.needsUpdate=true;}
   const {rotor,cargoCapsule:capsule,dispatchDial:dial,head,beacon}=g.userData;
   if(rotor&&b.active)rotor.rotation.y=time*(b.type==='generator'?5:2)*productionSpeed(b);
   if(capsule){const age=time-(b.lastTransfer?.time??-100);if(age>=0&&age<.45&&b.lastTransfer.role!=='forward'){const t=age/.45;capsule.position.set(-1*(1-t)+(b.lastTransfer.role==='machine'?t:0),.4+Math.sin(t*Math.PI)*.45,b.lastTransfer.role==='return'?t:0);}else capsule.position.set(0,.57+(b.active?Math.sin(time*3)*.03:0),0);}
   if(dial)dial.rotation.y=(b.phase||0)*Math.PI*2/3;
   if(head)head.rotation.y=b.aim||0;
   if(beacon){beacon.position.y=1.73+Math.sin(time*2)*.06;beacon.rotation.z=time*.2;}
   if(b.item){let item=this.items.get(b.id);if(!item){item=new T.Mesh(geometry('box',.21,.16,.21),mat(C.light));this.items.set(b.id,item);this.scene.add(item);}if(item.userData.type!==b.item){item.userData.type=b.item;item.material=mat(itemColors[b.item]||C.light);}let ox=0,oz=0;if(b.type==='belt'){const t=Math.min(1,Math.max(0,(tick-(b.itemTick??tick))/Math.max(2,8-Math.floor(((b.level||1)-1)*.5)))),side=Number.isInteger(b.itemSide)&&b.itemSide!==b.dir?b.itemSide:(b.dir+2)%4;ox=(1-t)**2*DIRS[side][0]*.5+t*t*DIRS[b.dir][0]*.5;oz=(1-t)**2*DIRS[side][1]*.5+t*t*DIRS[b.dir][1]*.5;}item.position.set(b.x+ox,.3,b.z+oz);item.visible=true;}
   else if(this.items.has(b.id))this.items.get(b.id).visible=false;
  }
  if(this.selected){const b=s.buildings.find(b=>b.id===this.selected);this.select(b);}
  const pids=new Set(s.players.map(p=>p.id));for(const[id,g]of this.players)if(!pids.has(id)){this.scene.remove(g);this.players.delete(id);}
  const playerColors=[C.gold,0x87b9c9,0xb0bf82,0xc59ab0];
  for(const p of s.players){let g=this.players.get(p.id);if(!g){g=new T.Group();box(g,playerColors[p.color%4],0,.5,0,.3,.4,.25);cyl(g,C.light,0,.83,0,.18,.15,6);box(g,C.dark,0,.79,.15,.21,.08,.03);box(g,C.dark,0,.49,-.2,.25,.3,.12);for(const x of [-.1,.1]){const leg=box(g,C.dark,x,.2,0,.12,.3,.14);leg.name=x<0?'leftLeg':'rightLeg';}for(const x of [-.23,.23]){const arm=box(g,playerColors[p.color%4],x,.48,0,.11,.32,.12);arm.name=x<0?'leftArm':'rightArm';}g.traverse(o=>{o.castShadow=false;});this.scene.add(g);this.players.set(p.id,g);}g.visible=p.hp>0;const {x,z}=position(p);g.position.set(x,0,z);const moving=p.input.x||p.input.z;if(moving)g.rotation.y=Math.atan2(p.input.x,p.input.z);const stride=moving?Math.sin(time*14)*.55:0;g.getObjectByName('leftLeg').rotation.x=stride;g.getObjectByName('rightLeg').rotation.x=-stride;g.getObjectByName('leftArm').rotation.x=-stride*.6;g.getObjectByName('rightArm').rotation.x=stride*.6;}
  const n=Math.min(s.enemies.length,500);for(let i=0;i<n;i++){const e=s.enemies[i],{x,z}=position(e),scale=e.brute?1.45:1,angle=Math.atan2(-x,-z),sway=Math.sin(time*8+i)*.04;this.dummy.rotation.set(0,angle,0);this.dummy.scale.setScalar(scale);this.dummy.position.set(x,.5*scale+sway,z);this.dummy.updateMatrix();this.enemyBody.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=.88*scale+sway;this.dummy.updateMatrix();this.enemyHead.setMatrixAt(i,this.dummy.matrix);for(let leg=0;leg<2;leg++){const offset=leg?-.1:.1;this.dummy.position.set(x+Math.cos(angle)*offset,.18*scale,z-Math.sin(angle)*offset);this.dummy.rotation.x=Math.sin(time*9+i+leg*Math.PI)*.4;this.dummy.updateMatrix();this.enemyLegs.setMatrixAt(i*2+leg,this.dummy.matrix);}}
  for(const[o,count]of[[this.enemyBody,n],[this.enemyHead,n],[this.enemyLegs,n*2]]){o.count=count;o.visible=count>0;if(count)o.instanceMatrix.needsUpdate=true;}
  const shots=s.shots.slice(-1200),pos=this.shotsGeometry.attributes.position;shots.forEach((v,i)=>{pos.setXYZ(i*2,v.x,.85,v.z);pos.setXYZ(i*2+1,v.tx,.5,v.tz);});if(shots.length)pos.needsUpdate=true;this.shotLines.visible=shots.length>0;this.shotsGeometry.setDrawRange(0,shots.length*2);
 }
 draw(){this.camera.position.copy(this.center).add(CAMERA_OFFSET);this.camera.lookAt(this.center);this.camera.updateMatrixWorld();this.renderer.render(this.scene,this.camera);}
 project(x,z,y=1.3){const v=(this.projected??=new T.Vector3()).set(x,y,z).project(this.camera);return{x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight,visible:v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1};}
}
