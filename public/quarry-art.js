import * as T from './vendor/three.module.js';
import {box,cyl} from './render-primitives.js';
import {quarryTexture} from './quarry-textures.js';

const iron=0x454848, steel=0x6c7476, stone=0x868179, mortar=0xa09b8b;
const timber=0x755c42, wood=0xaf8860, roof=0xc8cac5, slate=0x65747c;
const sand=0xa0906d, cream=0xc5b69a, copper=0xa8734c;
const structures=new Map();
const structureMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.86});
const surfaceMaterials=new Map();

function surface(g,name,color,x,y,z,w,h,d){
 const part=box(g,color,x,y,z,w,h,d);
 part.userData.surface=name;
 return part;
}
function materialFor(name){
 if(name==='plain')return structureMaterial;
 if(!surfaceMaterials.has(name)){
  const map=quarryTexture(name),metal=name==='roof';
  surfaceMaterials.set(name,new T.MeshStandardMaterial({
   vertexColors:true,map,bumpMap:map,bumpScale:metal?.018:.041,roughness:metal?.62:.94,metalness:metal?.34:.02
  }));
 }
 return surfaceMaterials.get(name);
}

// Consolidate the fixed parts of each building while keeping its moving parts and ports separate.
export function batchQuarryModel(g,key){
 const parts=g.children.filter(o=>o.isMesh&&!o.name&&o.material.isMeshStandardMaterial);
 if(parts.length<2)return;
 let groups=structures.get(key);
 if(!groups){
  groups=new Map();
  const vertices=new Map(),point=new T.Vector3(),normal=new T.Vector3(),normalMatrix=new T.Matrix3();
  for(const part of parts){
   const name=part.userData.surface??'plain';
   if(!vertices.has(name))vertices.set(name,{positions:[],normals:[],colors:[],uv:[]});
   const {positions,normals,colors,uv}=vertices.get(name);
   part.updateMatrix();normalMatrix.getNormalMatrix(part.matrix);
   const {position,normal:direction}=part.geometry.attributes,{index}=part.geometry;
   const {r,g,b}=part.material.color;
   for(let i=0;i<(index?.count??position.count);i++){
    const vertex=index?index.getX(i):i;
    point.fromBufferAttribute(position,vertex).applyMatrix4(part.matrix);
    normal.fromBufferAttribute(direction,vertex).applyNormalMatrix(normalMatrix);
    positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);colors.push(r,g,b);
    if(name==='roof'||Math.abs(normal.y)>.63)uv.push(point.x*.93,point.z*.93);
    else if(Math.abs(normal.z)>Math.abs(normal.x))uv.push(point.x,point.y);
    else uv.push(point.z,point.y);
   }
  }
  for(const [name,{positions,normals,colors,uv}] of vertices){
  const body=new T.BufferGeometry();
  body.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  body.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  body.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  body.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  groups.set(name,body);
  }
  structures.set(key,groups);
 }
 g.remove(...parts);
 for(const [name,body] of groups){
  const mesh=new T.Mesh(body,materialFor(name));mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
 }
}

function shed(g,color,cover,width=.82,depth=.76,height=.63,masonry=false){
 box(g,stone,0,.095,0,width+.07,.19,depth+.06);
 if(masonry)surface(g,'brick',color,0,height/2+.14,0,width,height,depth);
 else box(g,color,0,height/2+.14,0,width,height,depth);
 const pitch=.29;
 for(const side of [-1,1]){
  const panel=surface(g,'roof',cover,0,height+.22,side*depth*.255,width+.12,.064,depth*.6);
  panel.rotation.x=side*pitch;
  for(let x=-width*.4;x<=width*.41;x+=Math.max(.17,width*.17)){
   const seam=box(g,steel,x,height+.255,side*depth*.262,.022,.018,depth*.58);
   seam.rotation.x=side*pitch;
  }
 }
}
function door(g,x,y,z,width,height,color=slate){
 box(g,iron,x,y,z,width+.07,height+.06,.05);
 box(g,color,x,y,z+.032,width,height,.036);
 box(g,iron,x,y,z+.057,.018,height,.015);
}
function window(g,x,y,z,width){
 box(g,iron,x,y,z,width,.16,.035);
 box(g,0xd1ab6d,x,y,z+.019,width*.83,.115,.015);
 box(g,slate,x,y,z+.027,.018,.13,.014);
}
function axle(g,height){
 const rotor=new T.Group();
 rotor.name='rotor';rotor.position.y=height;g.add(rotor);
 return rotor;
}
function chimney(g,x,z,height,diameter=.13){
 surface(g,'brick',0xded3c4,x,height/2,z,diameter,height,diameter);
 box(g,iron,x,height,z,diameter+.04,.075,diameter+.04);
}

export function makeQuarryModel(type,paint){
 const g=new T.Group();
 g.userData.type=type;
 if(type==='hq'){
  cyl(g,0x4a5555,0,.15,0,.69,.3,12);
  cyl(g,paint(0x9ba4a0),0,1.01,0,.46,1.65,18);
  for(const y of [.46,1.13,1.78])cyl(g,0x576464,0,y,0,.468,.049,18);
  box(g,0x888e89,.49,.12,0,.5,.22,.54);
  box(g,0x515b5b,.53,.33,0,.36,.25,.46);
  cyl(g,0x384244,0,1.91,0,.59,.15,18);
  const lantern=new T.Group();lantern.name='lantern';lantern.position.y=2.19;g.add(lantern);
  cyl(lantern,0x835d38,0,-.045,0,.25,.27,12);
  const lens=cyl(lantern,0xffd38d,0,.025,.29,.17,.085,14,true);lens.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4;
   cyl(g,0x3b4d50,Math.sin(a)*.42,2.15,Math.cos(a)*.42,.035,.46,7);
  }
  cyl(g,0x466365,0,2.42,0,.52,.16,16);
  cyl(g,0x30424c,0,2.54,0,.26,.13,12);
  cyl(g,0x764c36,0,2.68,0,.042,.25,8);
 }else if(type==='storage'){
  shed(g,paint(0xd2c8b6),0xd7dbd6,.82,.78,.53);
  for(const x of [-.34,-.29,-.24,.24,.29,.34])box(g,0x8e8170,x,.4,.385,.014,.44,.02);
  door(g,.01,.35,.398,.43,.35,0x506473);
  box(g,wood,-.31,.13,.44,.17,.17,.15);
  box(g,timber,.32,.1,.44,.14,.12,.15);
 }else if(['drill','copperDrill','coalMine'].includes(type)){
  const accent=type==='copperDrill'?copper:type==='coalMine'?0x4d5159:wood;
  box(g,paint(stone),0,.09,0,.86,.18,.85);
  for(const x of [-.27,.27])for(const z of [-.26,.26]){
   const strut=box(g,accent,x*.8,.66,z,.084,1.09,.083);
   strut.rotation.z=Math.sign(x)*.16;
  }
  surface(g,'roof',roof,-.11,1.23,0,.61,.06,.65).rotation.z=.17;
  for(const z of [-.27,.27]){
   box(g,timber,0,.56,z,.53,.065,.072);
   for(const sign of [-1,1])box(g,accent,0,.61,z,.052,.7,.038).rotation.z=sign*.66;
  }
  box(g,stone,-.34,.21,.18,.145,.26,.32);
  cyl(g,iron,-.37,.86,.246,.138,.07,12).rotation.x=Math.PI/2;
  cyl(g,steel,-.37,.86,.29,.071,.03,10).rotation.x=Math.PI/2;
  const rotor=axle(g,.6);
  cyl(rotor,steel,0,0,0,.075,.75,8);
  for(const y of [-.24,-.09])box(rotor,iron,0,y,0,.26,.06,.13);
  box(g,timber,.34,.23,0,.31,.13,.28);
 }else if(type==='smelter'||type==='foundry'){
  const foundry=type==='foundry';
  shed(g,paint(foundry?0xd5c0ab:0xf5e3d3),0xc8cccd,.79,.72,foundry?.65:.57,true);
  door(g,.07,.34,.367,.35,.39,iron);
  box(g,0xc77c3e,.07,.35,.41,.25,.19,.017,true);
  box(g,iron,.07,.32,.429,.29,.035,.025);
  chimney(g,-.24,-.17,1.31,.15);
  if(foundry)chimney(g,.24,-.2,1.19,.12);
  cyl(g,iron,.37,.33,-.19,.093,.48,12);
  cyl(g,steel,.37,.57,-.19,.1,.038,12);
  for(const x of [-.32,.31])window(g,x,.48,.367,.11);
  box(g,mortar,-.28,.19,.43,.16,.07,.17);
 }else if(['assembler','circuitLab','componentFactory'].includes(type)){
  const panels={assembler:wood,circuitLab:0x798c7e,componentFactory:0x6f8090};
  shed(g,paint(panels[type]),type==='componentFactory'?slate:roof,.83,.77,.61);
  door(g,.15,.35,.391,.29,.33,iron);
  window(g,-.23,.53,.403,.2);
  surface(g,'roof',0xaab4b6,0,.57,.46,.84,.05,.23);
  for(const x of [-.39,.39])box(g,timber,x,.38,.47,.052,.45,.053);
  box(g,wood,-.25,.19,.44,.18,.22,.15);
  if(type==='componentFactory')box(g,iron,.25,.91,-.17,.32,.09,.23);
 }else if(type==='sawmill'){
  box(g,paint(stone),0,.08,0,.86,.16,.85);
  for(const x of [-.37,.37])for(const z of [-.31,.31])box(g,timber,x,.42,z,.083,.67,.088);
  for(const z of [-.22,.22]){
   const cover=surface(g,'roof',roof,0,.82,z,.88,.063,.47);
   cover.rotation.x=Math.sign(z)*.23;
  }
  for(const z of [-.18,.18,.36]){
   const log=cyl(g,wood,-.19,.21,z,.073,.58,8);
   log.rotation.z=Math.PI/2;
  }
  box(g,timber,.15,.31,0,.26,.15,.58);
  const rotor=axle(g,.4);rotor.position.x=.14;rotor.rotation.z=Math.PI/2;
  cyl(rotor,steel,0,0,0,.2,.044,16);
  for(const sign of [-1,1])box(rotor,iron,0,0,sign*.12,.085,.052,.16);
 }else if(type==='generator'||type==='coalGenerator'){
  box(g,stone,0,.08,0,.84,.16,.79);
  box(g,paint(type==='coalGenerator'?iron:0x687064),-.13,.41,0,.49,.55,.65);
  box(g,steel,.22,.26,0,.35,.29,.6);
  chimney(g,-.24,-.19,.93,.11);
  const rotor=axle(g,.44);rotor.position.x=.25;
  cyl(rotor,iron,0,0,0,.22,.05,12);
  for(let i=0;i<3;i++)box(rotor,steel,0,.043,0,.36,.027,.048).rotation.y=i*Math.PI/3;
 }else if(['turret','gunTurret','mortar','pulseTurret'].includes(type)){
  box(g,stone,0,.087,0,.84,.174,.84);
  box(g,paint(sand),0,.21,0,.76,.11,.76);
  cyl(g,iron,0,.295,0,.3,.1,10);
  for(const x of [-.34,.34])for(const z of [-.29,0,.29])box(g,0x9d9279,x,.255,z,.146,.143,.25);
  const head=new T.Group();head.name='head';head.position.y=.42;g.add(head);
  if(type==='mortar'){
   box(head,iron,0,-.03,0,.43,.12,.42);
   const tube=cyl(head,steel,0,.14,.135,.087,.54,10);tube.rotation.x=.66;
   const mouth=cyl(head,iron,0,.349,.298,.09,.046,10);mouth.rotation.x=.66;
   box(head,paint(steel),0,-.01,-.1,.34,.17,.24);
  }else{
   const sentry=type==='turret',pulse=type==='pulseTurret';
   const shield=paint(sentry?slate:pulse?0x777362:steel),width=sentry?.37:.53;
   box(head,shield,0,.005,0,width,sentry?.17:.22,.36);
   cyl(head,shield,0,.092,0,sentry?.145:.183,width,16).rotation.z=Math.PI/2;
   box(head,iron,0,.028,.185,sentry?.22:.38,.13,.03);
   for(const x of pulse?[-.115,.115]:[0]){
    const barrel=cyl(head,iron,x,.045,.33,sentry?.035:.052,.45,12);barrel.rotation.x=Math.PI/2;
    cyl(head,steel,x,.045,.531,sentry?.044:.067,.052,12).rotation.x=Math.PI/2;
   }
   for(const x of [-.18,.18])box(head,mortar,x,.11,.173,.03,.03,.022);
  }
 }else if(type==='inserter'){
  box(g,paint(stone),0,.088,0,.77,.175,.72);
  for(const x of [-.32,.32])for(const z of [-.26,.26])box(g,iron,x,.31,z,.076,.43,.07);
  box(g,steel,0,.51,0,.79,.082,.13);
  const capsule=new T.Group();capsule.name='cargoCapsule';capsule.position.y=.57;g.add(capsule);
  box(capsule,wood,0,0,0,.28,.16,.19);
  for(const x of [-.081,.081])box(capsule,iron,x,.01,0,.032,.18,.2);
 }else if(type==='splitter'){
  box(g,paint(stone),0,.09,0,.82,.18,.83);
  box(g,iron,0,.21,0,.76,.074,.75);
  const dial=cyl(g,cream,0,.28,0,.22,.04,3);dial.name='dispatchDial';
 }
 return g;
}
