import {StructureInstances} from './structure-instances.js';
import {CONTENT} from './shared/content.js';
import {harborEquipment} from './harbor-equipment.js';
import * as T from './vendor/three.module.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {outlineBuilding,outlineMaterial} from './building-outlines.js';
import {levelPlaque} from './building-levels.js';
import {conveyorSurface} from './conveyor-surface.js';
import {coastalHeight,coastalLand} from './shared/coast.js';
import {BaseLampLights,makeLampModel} from './base-lamps.js';
import {CoastalWater} from './coastal-water.js';
import {LighthouseLight} from './lighthouse-light.js';
import {isBarrier} from './shared/sim.js';
import { TYPES, rng, DIRS, DIRECTIONAL, key, beltInputs, productionSpeed, GENERATORS, SIZE, BUILD_EDGE, BELT_CAPACITY, conveyorProgress, buildingRadius } from './shared/sim.js';
import { upgradeColor } from './upgrade-colors.js';
const C={ground:0x263e3e,edge:0x112a2e,steel:0x617c79,dark:0x283f42,light:0xb7c6b3,gold:0xeab568,orange:0xed8e50,mint:0x9dd2b9,tree:0x315b50,treeTop:0x427465,wood:0x6b6552};
const CAMERA_OFFSET=new T.Vector3(0,32,27);
const QUARRY_CAMERA=new T.Vector3(0,27,27);
const geos=new Map();
const beltArrow=(()=>{
 const arrow=new T.Shape();
 arrow.moveTo(-.08,-.09);arrow.lineTo(.08,-.09);arrow.lineTo(.08,-.16);arrow.lineTo(.27,0);
 arrow.lineTo(.08,.16);arrow.lineTo(.08,.09);arrow.lineTo(-.08,.09);arrow.closePath();
 return new T.ShapeGeometry(arrow);
})();
const cyan=0x79d8d0;
const itemColors={ore:0x98bbc2,copperOre:0xc88c58,plate:C.light,gear:C.gold,copper:0xe3aa72,steel:0x8ca6b8,circuit:0x67d6bd,module:0xb6a4dc,coal:0x464456};
for(const [item,definition]of Object.entries(CONTENT.items))if(!Object.hasOwn(itemColors,item))itemColors[item]=Number.parseInt(definition.color.slice(1),16);
import {mat,geometry,box,cyl} from './render-primitives.js';
import {modernizeModel} from './coastal-buildings.js';
import {batchQuarryModel,makeQuarryModel} from './quarry-art.js';
import {quarryTerrainMaterial,quarrySpruce,quarryTexture} from './quarry-textures.js';
import {createQuarryEffects,quarryActorGeometry,updateQuarryEffects} from './quarry-effects.js';
import {CoastalHostiles} from './coastal-hostiles.js';
import {LighthouseFog} from './lighthouse-fog.js';
import {isInLighthouseBeam,lighthouseBeam,lighthouseHeading} from './shared/lighthouse.js';
const actorSkin=new T.MeshStandardMaterial({vertexColors:true,color:0xb5a38d,roughness:.91});
const actorHead=new T.MeshStandardMaterial({vertexColors:true,color:0xa29382,roughness:.88});
const easeAngle=(current,target,weight)=>current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*weight;
let quarryStone;
function quarryStoneSurface(){
 if(quarryStone)return quarryStone;
 const shape=new T.IcosahedronGeometry(1,3),positions=shape.attributes.position;
 for(let i=0;i<positions.count;i++){
  const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i),worn=1+.09*Math.sin(x*13+z*7)*Math.cos(y*8-z*5);
  positions.setXYZ(i,x*worn,y*worn*.83,z*worn);
 }
 shape.computeVertexNormals();
 const map=quarryTexture('gravel');
 const material=new T.MeshStandardMaterial({map,color:0xeee8dc,roughness:.95});
 // Keep iron, copper and coal identifiable from the normal camera height.
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
   'diffuseColor.rgb *= mix(vec3(.88),texture2D(map,vMapUv).rgb,.31);');
 };
 quarryStone={shape,material};
 return quarryStone;
}
function plate(p){cyl(p,C.dark,0,.08,0,.53,.16,12);box(p,C.steel,0,.18,0,.8,.09,.8);}
export function makeModel(type,dir=0,inputs=[],level=1,style='classic',templateOnly=false){
 const prototype=CONTENT.buildings[type];
 if(prototype&&!templateOnly){
  const model=makeModel(prototype.template,dir,inputs,level,style,true),equipment=new T.Group();
  const color=CONTENT.identities[type].accent,steel=0x7e9197,dark=0x25383d;
  equipment.name='industrial-equipment';
  if(prototype.variant==='press'){
   for(const x of[-.32,.32]){box(equipment,steel,x,1.28,0,.09,1,.12);cyl(equipment,color,x,1.62,0,.095,.36,16);}
   box(equipment,color,0,1.87,0,.79,.13,.3);box(equipment,steel,0,1.38,0,.5,.1,.42);
  }else if(prototype.variant==='finery'){
   for(const x of[-.3,.3]){cyl(equipment,dark,x,1.68,-.24,.105,1,16);cyl(equipment,steel,x,2.2,-.24,.14,.08,16);}
   box(equipment,color,0,.56,.44,.68,.34,.23);
  }else if(prototype.variant==='lathe'){
   box(equipment,color,0,1.32,0,.75,.18,.55);
   const drum=cyl(equipment,steel,0,1.55,0,.18,.57,20);drum.rotation.z=Math.PI/2;
   for(const x of[-.33,.33])box(equipment,dark,x,1.5,0,.12,.36,.4);
  }else if(prototype.variant==='turbine'){
   for(const x of[-.28,.28]){cyl(equipment,steel,x,1.02,.18,.12,.76,20);cyl(equipment,color,x,1.42,.18,.15,.07,20);}
   box(equipment,color,0,.78,-.26,.72,.18,.18);
  }
  if(harborEquipment(equipment,prototype.variant,color))outlineBuilding(equipment);
  if(prototype.recipe)model.rotation.y=-dir*Math.PI/2;
  model.add(equipment);model.userData.contentType=type;
  return model;
 }
 if(type==='lamp'||type==='signalMast')return makeLampModel(style,type);
 if(type==='coastWatch'){
  const model=makeModel('gunTurret',dir,inputs,level,style,true);
  const head=model.getObjectByName('head');
  if(head){
   box(head,0x708e96,0,.14,.64,.24,.17,.62);
   cyl(head,0xa0babd,0,.14,.93,.081,.13,20).rotation.x=Math.PI/2;
   box(head,0x859988,.25,.24,.09,.16,.21,.22);
  }
  return model;
 }
 const quarry=style==='quarry';
 const originalType=type;type=({copperDrill:'drill',coalMine:'drill',coalGenerator:'generator',gunTurret:'turret',mortar:'turret',pulseTurret:'turret',foundry:'smelter',circuitLab:'assembler',componentFactory:'assembler'})[type]||type;
 const painted=base=>!quarry&&level>1?upgradeColor(level):base;
 const g=new T.Group();g.userData.type=originalType;
 if(type==='belt'){
  // Each incoming lane curves into the output; geometry ends exactly at tile edges.
  const unique=[...new Set(inputs.filter(v=>v!==dir))];if(!unique.length)unique.push((dir+2)%4);
  for(const input of unique){
   const[ax,az]=DIRS[input],[bx,bz]=DIRS[dir],height=quarry?.18:.13,width=quarry?.22:.285;
   const curve=new T.QuadraticBezierCurve3(new T.Vector3(ax*.51,height,az*.51),new T.Vector3(0,height,0),new T.Vector3(bx*.51,height,bz*.51));
   const cacheKey=`road:${style}:${input}:${dir}`;let road=geos.get(cacheKey);
   if(!road){const vertices=[],indices=[],uvs=[],points=curve.getPoints(16);for(let i=0;i<points.length;i++){const tangent=curve.getTangent(i/16),normal=new T.Vector3(-tangent.z,0,tangent.x).normalize();for(const sign of[-1,1]){const v=points[i].clone().addScaledVector(normal,width*sign);vertices.push(v.x,v.y,v.z);uvs.push(i/16,(sign+1)/2);}if(i<16){const j=i*2;indices.push(j,j+2,j+1,j+1,j+2,j+3);}}road=new T.BufferGeometry();road.setAttribute('position',new T.Float32BufferAttribute(vertices,3));road.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));road.setIndex(indices);road.computeVertexNormals();geos.set(cacheKey,road);}
   const lane=new T.Mesh(road,quarry?conveyorSurface():mat(painted(0x647565),false,T.DoubleSide));lane.receiveShadow=true;g.add(lane);
   for(const sign of[-1,1]){const railKey=`rail:${style}:${input}:${dir}:${sign}`;let geo=geos.get(railKey);if(!geo){const pts=[];for(let i=0;i<=16;i++){const v=curve.getPoint(i/16),t=curve.getTangent(i/16);v.addScaledVector(new T.Vector3(-t.z,0,t.x).normalize(),sign*(width+.025));v.y=height+.02;pts.push(v);}geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),20,quarry?.016:.025,4,false);geos.set(railKey,geo);}g.add(new T.Mesh(geo,mat(quarry?(level>=8?0xc4ae76:level>=4?0x719eaa:0x858c83):C.gold)));}
   if(quarry){
    for(const t of [.12,.37,.62,.87]){
     const p=curve.getPoint(t),tangent=curve.getTangent(t),normal=new T.Vector3(-tangent.z,0,tangent.x).normalize();
     const roller=cyl(g,0x707c79,p.x,p.y-.035,p.z,.032,width*2+.05,12);
     roller.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),normal);
     for(const side of [-1,1]){
      const px=p.x+normal.x*(width+.025)*side,pz=p.z+normal.z*(width+.025)*side;
      box(g,0x465251,px,.08,pz,.035,.16,.035);
      box(g,0x79796a,px,.012,pz,.08,.025,.08);
     }
    }
    const t=curve.getTangent(.95),p=curve.getPoint(.85),normal=new T.Vector3(-t.z,0,t.x).normalize();
    const motor=box(g,level>=15?0xb6bdba:level>=8?0x739caa:0x697771,p.x+normal.x*.31,.15,p.z+normal.z*.31,.13,.15,.19);motor.rotation.y=Math.atan2(t.x,t.z);
   }
   else box(g,C.mint,ax*.44,.16,az*.44,Math.abs(az)*.34+.045,.03,Math.abs(ax)*.34+.045,true);
  }
  const a=new T.Mesh(beltArrow,mat(quarry?0xc9c1aa:C.gold,true));a.rotation.set(-Math.PI/2,0,-dir*Math.PI/2);
  a.name='belt-direction';if(quarry)a.scale.setScalar(.56);
  const offset=quarry?.17:.14;
  a.position.set(DIRS[dir][0]*offset,quarry?.208:.19,DIRS[dir][1]*offset);g.add(a);if(quarry){modernizeModel(g,'belt',level);if(level>1)levelPlaque(g,'belt',level,dir);}return g;
 }
 if(quarry&&!isBarrier(type)){
  const model=makeQuarryModel(originalType,painted,level);
  if(!model.userData.authored)modernizeModel(model,originalType,level);
  if(type==='storage')warehousePorts(model,inputs);
  if(type==='inserter'){port(model,2,'IN',cyan);port(model,0,'M',0x99ddb8);port(model,1,'RET',0xb9a2e5);}
  if(type==='splitter'){port(model,2,'1',cyan);port(model,0,'2',C.gold);port(model,3,'3',C.gold);port(model,1,'4',C.gold);}
  if(['drill','smelter','assembler','sawmill'].includes(type)){
   port(model,0,'OUT',C.gold);
   if(type!=='drill'&&type!=='sawmill')for(const side of [1,2,3])port(model,side,'IN',cyan);
  }
  if(DIRECTIONAL.includes(originalType))model.rotation.y=-dir*Math.PI/2;
  batchQuarryModel(model,`${originalType}:${level}`);levelPlaque(model,originalType,level);outlineBuilding(model);
  return model;
 }
 if(type==='inserter'){
  cyl(g,painted(C.dark),0,.13,0,.42,.22,8);cyl(g,painted(0x76aeb4),0,.27,0,.31,.08,8);
  for(const z of[-.25,.25]){box(g,painted(C.steel),0,.46,z,.12,.43,.1);box(g,0x8ce8d6,0,.68,z,.13,.06,.14,true);}
  const capsule=new T.Group();capsule.name='cargoCapsule';capsule.position.y=.58;g.add(capsule);const shell=cyl(capsule,C.light,0,0,0,.13,.28,8);shell.rotation.z=Math.PI/2;box(capsule,0x76e6d2,0,.01,.12,.17,.08,.035,true);
  port(g,2,'IN',cyan);port(g,0,'M',0x99ddb8);port(g,1,'RET',0xb9a2e5);g.rotation.y=-dir*Math.PI/2;return g;
 }
 if(type==='splitter'){
  cyl(g,painted(C.dark),0,.15,0,.53,.22,6);cyl(g,painted(C.steel),0,.32,0,.44,.14,6);
  const dial=cyl(g,0x91d8d0,0,.43,0,.23,.055,3,true);dial.name='dispatchDial';
  port(g,2,'IN',cyan);port(g,0,'FWD',C.gold);port(g,3,'M',0x99ddb8);port(g,1,'RET',0xb9a2e5);g.rotation.y=-dir*Math.PI/2;return g;
 }
 if(isBarrier(type)){
  const reinforced=type==='basaltBreakwater';
  const connected=side=>inputs.includes(side)? .505:.34;
  const horizontal=inputs.includes(0)||inputs.includes(2)||!inputs.length&&dir%2===0;
  const vertical=inputs.includes(1)||inputs.includes(3)||!inputs.length&&dir%2===1;
  const section=(left,right,top,bottom)=>{
   const x=(left+right)/2,z=(top+bottom)/2,w=right-left,d=bottom-top;
   if(quarry){
    box(g,0x606b6c,x,.096,z,w,.192,d).userData.surface='gravel';
    box(g,0xb9b8a5,x,.24,z,w,.112,d);
    const alongX=w>=d,length=alongX?w:d,blocks=Math.max(1,Math.round(length/.24));
    for(let row=0;row<(reinforced?4:2);row++)for(let i=0;i<blocks;i++){
     const span=length/blocks,offset=(i+.5)*span-length/2;
     const shade=(reinforced?[0x85939d,0x9aa4a9,0xabb9b9]:[0xc6c7b4,0xaab6af,0xd5d1ba])[(i+row)%3],width=span*.96;
     box(g,shade,x+(alongX?offset:0),.37+row*.13,z+(alongX?0:offset),
      alongX?width:w*.87,.128,alongX?d*.83:width);
    }
    if(reinforced)box(g,0x90aab5,x,.87,z,w,.075,d);
    return;
   }
   box(g,C.dark,x,.11,z,w,.22,d);
   box(g,painted(0x70827b),x,.51,z,w,.78,d);
   box(g,painted(C.light),x,.94,z,w,.12,d);
  };
  if(horizontal)section(-connected(2),connected(0),-.33,.33);
  if(vertical){
   if(!horizontal)section(-.33,.33,-connected(3),connected(1));
   else{
    if(inputs.includes(3))section(-.33,.33,-connected(3),-.327);
    if(inputs.includes(1))section(-.33,.33,.327,connected(1));
   }
  }
  if(quarry){modernizeModel(g,'wall',level);batchQuarryModel(g,`${type}:${dir}:${inputs.join(':')}:${level}`);levelPlaque(g,'wall',level);outlineBuilding(g);}
  return g;
 }
 plate(g);
 if(type==='storage'){
  box(g,C.dark,0,.25,0,.85,.3,.85);for(const x of[-.22,.22])for(const z of[-.22,.22]){cyl(g,C.steel,x,.65,z,.18,.65,12);cyl(g,C.gold,x,.6,z,.19,.06,12);}box(g,painted(C.light),0,1.03,0,.9,.08,.9);
  warehousePorts(g,inputs);
 }else if(type==='hq'){
  box(g,C.dark,0,.16,0,1.7,.32,1.7);box(g,painted(C.light),0,.4,0,1.42,.4,1.42);box(g,C.steel,0,.8,0,1.12,.5,1.12);
  cyl(g,C.dark,0,1.2,0,.58,.7,6);cyl(g,C.gold,0,1.2,0,.6,.18,6);cyl(g,painted(C.light),0,1.6,0,.42,.16,6);
  box(g,C.dark,.38,1.95,0,.08,.7,.08);box(g,C.gold,.38,2.32,0,.12,.12,.12,true);box(g,C.mint,-.1,.62,-.726,.52,.19,.02,true);
  for(let i=0;i<4;i++){const a=i*Math.PI/2;box(g,C.gold,Math.cos(a)*.58,.68,Math.sin(a)*.58,.13,.6,.13);}
  const ring=new T.Mesh(new T.TorusGeometry(.52,.025,4,32),mat(C.gold,true));ring.rotation.x=Math.PI/2;ring.position.y=1.73;ring.name='beacon';g.add(ring);
 }else if(type==='drill'){
  for(const z of [-.33,.33])box(g,C.gold,0,.5,z,.78,.63,.1);
  box(g,painted(C.dark),0,.84,0,.78,.15,.78);const rotor=new T.Group();rotor.name='rotor';rotor.position.y=.5;g.add(rotor);cyl(rotor,C.steel,0,0,0,.17,.67,6);for(let i=0;i<3;i++){const a=box(rotor,C.light,0,-.15+i*.16,0,.57,.07,.16);a.rotation.y=i*.8;}
  box(g,C.light,-.25,.94,0,.21,.1,.4);box(g,C.gold,.44,.27,0,.17,.13,.36);
 }else if(type==='smelter'){
  box(g,painted(C.light),0,.5,0,.69,.57,.68);box(g,C.dark,.357,.46,0,.03,.35,.39);box(g,C.orange,.379,.46,0,.02,.23,.26,true);
  cyl(g,C.dark,-.15,1,0,.21,.5,8);cyl(g,C.steel,-.15,1.3,0,.25,.1,8);box(g,painted(C.gold),0,.75,0,.77,.12,.76);
  for(const z of [-.3,.3])box(g,C.dark,.1,.45,z,.35,.12,.1);
 }else if(type==='assembler'){
  box(g,painted(C.steel),0,.45,0,.77,.48,.77);box(g,painted(C.light),0,.74,0,.8,.12,.8);
  for(const x of [-.3,.3])box(g,C.gold,x,1,0,.09,.5,.1);
  box(g,C.gold,0,1.26,0,.76,.12,.13);const rotor=new T.Group();rotor.name='rotor';rotor.position.y=.9;g.add(rotor);cyl(rotor,C.dark,0,0,0,.25,.1,8);for(let i=0;i<6;i++){const a=i*Math.PI/3;box(rotor,C.light,Math.cos(a)*.24,0,Math.sin(a)*.24,.13,.14,.13);}
  box(g,C.mint,.4,.51,0,.02,.14,.23,true);
 }else if(type==='generator'){
  box(g,painted(originalType==='coalGenerator'?0x67688b:C.light),0,.4,0,.8,.4,.65);box(g,painted(C.gold),-.2,.66,0,.3,.2,.67);box(g,C.dark,.2,.68,0,.35,.16,.52);
  const rotor=new T.Group();rotor.name='rotor';rotor.position.set(.19,.8,0);g.add(rotor);cyl(rotor,C.steel,0,0,0,.19,.07,8);for(let i=0;i<3;i++){const a=box(rotor,C.dark,0,.05,0,.4,.03,.07);a.rotation.y=i*Math.PI/3;}
  cyl(g,C.dark,-.25,.94,-.27,.065,.5,6);box(g,C.mint,.12,.43,-.338,.24,.12,.025,true);
 }else if(type==='turret'){
  cyl(g,C.steel,0,.45,0,.32,.5,6);cyl(g,C.gold,0,.76,0,.38,.12,8);
  cyl(g,painted(C.steel),0,.6,0,.35,.12,12);const head=new T.Group();head.name='head';head.position.y=.95;g.add(head);box(head,painted(C.dark),0,0,0,.53,.3,.45);box(head,painted(originalType==='gunTurret'?0xc59a64:originalType==='mortar'?0xc67b59:originalType==='pulseTurret'?0x7da3c9:C.light),0,.18,0,.6,.09,.53);box(head,C.dark,0,-.02,.44,.12,.12,.65);box(head,C.gold,0,-.02,.78,.16,.16,.1);box(head,C.mint,0,.04,-.235,.15,.08,.02,true);if(level>=2)box(head,C.dark,.18,-.02,.44,.1,.1,.65);if(level>=3){box(head,C.dark,-.18,-.02,.44,.1,.1,.65);cyl(g,C.gold,0,.28,0,.39,.12,12);}
 }else if(type==='sawmill'){
  box(g,painted(C.steel),0,.42,0,.8,.4,.8);for(const x of [-.3,.3])box(g,C.wood,x,.64,0,.15,.14,.8);
  const rotor=new T.Group();rotor.name='rotor';rotor.position.set(0,.72,0);rotor.rotation.z=Math.PI/2;g.add(rotor);const saw=cyl(rotor,C.light,0,0,0,.3,.05,12);for(let i=0;i<8;i++){const a=i*Math.PI/4;box(rotor,C.steel,Math.cos(a)*.28,0,Math.sin(a)*.28,.12,.07,.12);}
  box(g,C.gold,-.35,.6,0,.1,.25,.66);
 }
 if(['drill','smelter','assembler','sawmill'].includes(type)){
  port(g,0,'OUT',C.gold);if(type!=='drill'&&type!=='sawmill')for(const side of [1,2,3])port(g,side,'IN',cyan);
  if(type==='smelter'){cyl(g,C.steel,.2,.53,.18,.2,.5,12);cyl(g,C.gold,.2,.8,.18,.21,.05,12);}
 }
 if(originalType==='coalMine')cyl(g,0x484655,0,.87,.26,.16,.15,12);
 if(originalType==='copperDrill')cyl(g,0xd49260,0,.87,.26,.16,.15,12);
 if(originalType==='foundry')for(const x of[-.23,.23])cyl(g,0x91aeb7,x,.8,0,.15,.5,12);
 if(originalType==='circuitLab')box(g,0x69d5c6,0,.77,-.25,.55,.06,.22,true);
 if(originalType==='componentFactory')for(const x of[-.24,.24])cyl(g,0xb2a1cc,x,.9,.2,.12,.35,8);
 if(type!=='hq'&&type!=='turret'&&type!=='generator')g.rotation.y=-dir*Math.PI/2;
 return g;
}

function warehousePorts(group,outputs){
 for(let d=0;d<4;d++){
  port(group,d,'IN',cyan);
  if(d===0&&outputs.includes(0)){
   group.children.at(-1).position.z+=.12;
   port(group,0,'OUT',C.gold);group.children.at(-1).position.z-=.12;
  }
 }
}
const portMaterials=new Map();
function barricadeNeighbors(cell,grid){return DIRS.flatMap(([x,z],d)=>isBarrier(grid.get(key(cell.x+x,cell.z+z))?.type)?[d]:[]);}
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
 arrow.rotation.y=-(side+(text==='IN'||text==='1'?2:0))*Math.PI/2;
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
  this.camera=new T.OrthographicCamera(-20,20,20,-20,.1,1040);this.center=new T.Vector3(0,0,0);this.zoom=14;this.camera.position.set(0,32,27);this.camera.lookAt(0,0,0);
  this.sky=new T.HemisphereLight(0xd5e3c4,0x294548,2.2);this.scene.add(this.sky);const sun=new T.DirectionalLight(0xffd89c,3);sun.position.set(-14,27,13);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-95,right:95,top:95,bottom:-95,far:245});sun.shadow.bias=-.0005;sun.shadow.normalBias=.07;this.scene.add(sun);this.sun=sun;
  const fill=new T.DirectionalLight(0x83b8b2,1.3);fill.position.set(15,12,-20);this.scene.add(fill);this.fill=fill;
  this.ground=new T.Group();this.scene.add(this.ground);this.terrain=new T.Group();this.scene.add(this.terrain);
  this.buildings=new Map();this.structureInstances=new StructureInstances(this.scene);this.items=new Map();this.cellGrid=new Map();this.terrainKey='';this.ray=new T.Raycaster();this.plane=new T.Plane(new T.Vector3(0,1,0),0);this.mouse=new T.Vector2();this.hit=new T.Vector3();this.selected=null;
  const grid=new T.GridHelper(SIZE,SIZE,0x8ba797,0x577d73);grid.position.y=.012;grid.material.transparent=true;grid.material.opacity=.18;this.grid=grid;this.scene.add(grid);grid.visible=false;
  this.cursor=new T.Mesh(new T.PlaneGeometry(.98,.98),new T.MeshBasicMaterial({color:C.mint,transparent:true,opacity:.22,depthWrite:false,side:T.DoubleSide}));this.cursor.rotation.x=-Math.PI/2;this.cursor.position.y=.03;this.cursor.visible=false;this.scene.add(this.cursor);
  const ring=new T.RingGeometry(.68,.72,48);this.selection=new T.Mesh(ring,new T.MeshBasicMaterial({color:C.gold,side:T.DoubleSide,transparent:true,opacity:.9}));this.selection.rotation.x=-Math.PI/2;this.selection.position.y=.04;this.selection.visible=false;this.scene.add(this.selection);
  this.range=new T.Mesh(new T.RingGeometry(9.95,10,96),new T.MeshBasicMaterial({color:C.gold,side:T.DoubleSide,transparent:true,opacity:.35}));this.range.rotation.x=-Math.PI/2;this.range.position.y=.035;this.range.visible=false;this.scene.add(this.range);
  this.previewRange=this.range.clone();this.previewRange.material=this.range.material.clone();
  this.previewRange.material.opacity=.7;this.scene.add(this.previewRange);
  const points=new Float32Array(1200*6);this.shotsGeometry=new T.BufferGeometry();this.shotsGeometry.setAttribute('position',new T.BufferAttribute(points,3));this.shotLines=new T.LineSegments(this.shotsGeometry,new T.LineBasicMaterial({color:0xffd890,transparent:true,opacity:.85}));this.shotLines.frustumCulled=false;this.scene.add(this.shotLines);
  this.hostileShotsGeometry=new T.BufferGeometry();this.hostileShotsGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(500*6),3));
  this.hostileShotLines=new T.LineSegments(this.hostileShotsGeometry,new T.LineBasicMaterial({color:0x9cae7d,transparent:true,opacity:.8}));this.hostileShotLines.frustumCulled=false;this.scene.add(this.hostileShotLines);
  this.blasts=new T.InstancedMesh(new T.RingGeometry(.78,1,24).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xffc378,transparent:true,opacity:.62,depthWrite:false}),128);
  this.blasts.frustumCulled=false;this.blasts.count=0;this.scene.add(this.blasts);
  this.dust=createQuarryEffects();this.scene.add(this.dust);
  this.coastalWater=new CoastalWater(this.scene,SIZE);
  this.lighthouseLight=new LighthouseLight(this.scene);this.baseLampLights=new BaseLampLights(this.scene);
  this.composer=new EffectComposer(this.renderer);this.composer.addPass(new RenderPass(this.scene,this.camera));
  this.composer.addPass(new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.35,.42,2.2));this.composer.addPass(new OutputPass());
  this.lighthouseFog=new LighthouseFog(SIZE+24);this.scene.add(this.lighthouseFog.object);
  this.actorHeading=new Map();
  this.coastalHostiles=new CoastalHostiles(this.scene);this.depositHighlights=new Map();
  this.reserveBeltCargo(256);
  this.enemyBody=new T.InstancedMesh(geometry('box',.3,.48,.24),mat(0xc18a74),500);this.enemyHead=new T.InstancedMesh(geometry('box',.24,.24,.24),mat(0xc7b696),500);this.enemyLegs=new T.InstancedMesh(geometry('box',.11,.25,.13),mat(0x3e4b47),2000);for(const m of [this.enemyBody,this.enemyHead,this.enemyLegs]){m.instanceMatrix.setUsage(T.DynamicDrawUsage);m.count=0;m.frustumCulled=false;this.scene.add(m);}this.dummy=new T.Object3D();this.projected=new T.Vector3();this.enemyColor=new T.Color();this.renderPosition={x:0,z:0};this.routeMesh=null;this.routeKey='';this.areaMesh=null;this.areaKey='';
  this.resize();window.addEventListener('resize',()=>this.resize());
  this.style='quarry';
  this.configureQuarryLighting();
  document.getElementById('quarry-spruce')?.addEventListener('load',()=>{if(this.style==='quarry')this.terrainKey='';});
 }
 inspectHostile(id,kind){
  if(!this.inspectedId)this.inspectionReturn={center:this.center.clone(),zoom:this.zoom};
  this.inspectedId=id;this.inspectionOrbitStamp='';this.zoom=kind==='walker'?2.6:1.5;this.updateProjection();
 }
 exitInspection(){
  if(!this.inspectedId)return;this.inspectedId=null;
  if(this.inspectionReturn){this.center.copy(this.inspectionReturn.center);this.zoom=this.inspectionReturn.zoom;this.inspectionReturn=null;this.updateProjection();}
 }
 pickHostile(x,y){this.mouse.set(x/innerWidth*2-1,-y/innerHeight*2+1);this.ray.setFromCamera(this.mouse,this.camera);return this.coastalHostiles.pick(this.ray);}
 warmLamps(){
  if(this.lampsWarmed)return;
  const lamps=[makeLampModel('quarry')],halos=this.baseLampLights.halos,oldCount=halos.count,oldMatrices=Array.from({length:8},(_,i)=>{const matrix=new T.Matrix4();halos.getMatrixAt(i,matrix);return matrix;});
  const intensities=this.baseLampLights.lights.map(l=>l.intensity),positions=this.baseLampLights.lights.map(l=>l.position.clone());
  lamps.forEach((lamp,i)=>{lamp.position.set(this.center.x+(i%4-1.5)*1.5,0,this.center.z+(Math.floor(i/4)-.5)*1.5);this.scene.add(lamp);});
  halos.count=Math.max(8,oldCount);
  this.baseLampLights.lights.forEach((l,i)=>{const x=this.center.x+(i%4-1.5)*1.5,z=this.center.z+(Math.floor(i/4)-.5)*1.5;l.intensity=16;l.position.set(x,1.13,z);halos.setMatrixAt(i,new T.Matrix4().makeTranslation(x,.025,z));});halos.instanceMatrix.needsUpdate=true;
  // Driver pipelines, shadow variants and halo upload need an actual first draw,
  // not just WebGL program linking. Finish this work while the loading screen is up.
  const warm=makeModel('storage',0,[0],3,'quarry'),warm2=warm.clone(true);warm.position.set(this.center.x,0,this.center.z);warm2.position.copy(warm.position);this.structureInstances.sync(new Map([...this.buildings,['_warm1',warm],['_warm2',warm2]]));
  this.renderer.shadowMap.needsUpdate=true;this.draw();// Readback drains Chromium's GPU queue before the loading screen closes.
  const gl=this.renderer.getContext();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));this.structureInstances.sync(this.buildings);
  lamps.forEach(lamp=>this.scene.remove(lamp));halos.count=oldCount;oldMatrices.forEach((matrix,i)=>halos.setMatrixAt(i,matrix));halos.instanceMatrix.needsUpdate=true;
  this.baseLampLights.lights.forEach((l,i)=>{l.intensity=intensities[i];l.position.copy(positions[i]);});this.renderer.shadowMap.needsUpdate=true;this.lampsWarmed=true;
 }
 resize(){this.renderer.setSize(innerWidth,innerHeight,false);this.composer?.setPixelRatio(this.renderer.getPixelRatio());this.composer?.setSize(innerWidth,innerHeight);this.updateProjection();}
 updateProjection(){const w=innerWidth,h=innerHeight,aspect=w/h;this.camera.left=-this.zoom*aspect;this.camera.right=this.zoom*aspect;this.camera.top=this.zoom;this.camera.bottom=-this.zoom;this.camera.updateProjectionMatrix();
  this.worldPerPixel=2*this.zoom/h;
  for(const [id,model] of this.buildings)sizePortBadges(model,this.worldPerPixel,id===this.selected);
  if(this.ghost)sizePortBadges(this.ghost,this.worldPerPixel,true);
 }
 setQuality(low){this.renderer.shadowMap.enabled=!low;this.renderer.shadowMap.needsUpdate=!low;this.renderer.setPixelRatio(low?Math.min(devicePixelRatio,.8):Math.min(devicePixelRatio,1.5));this.resize();}
 configureQuarryLighting(){
  this.scene.background.setHex(0x454c48);this.scene.fog.color.setHex(0x454c48);this.scene.fog.density=.0065;
  this.sky.color.setHex(0xdce3eb);this.sky.groundColor.setHex(0x857768);this.sky.intensity=1.1;
  this.sun.color.setHex(0xffe8ce);this.sun.intensity=1.7;this.sun.shadow.normalBias=.018;
  this.fill.color.setHex(0xc2ccda);this.fill.intensity=.51;
  this.renderer.toneMappingExposure=1.12;this.renderer.shadowMap.needsUpdate=true;
  this.shadowKey='';
  this.enemyBody.geometry=quarryActorGeometry('body');this.enemyBody.material=actorSkin;
  this.enemyHead.geometry=quarryActorGeometry('head');this.enemyHead.material=actorHead;
  this.enemyLegs.geometry=geometry('cyl',.044,.22,6);this.enemyLegs.material=mat(0x64564b);
  this.shotLines.material.color.setHex(0xffb763);this.shotLines.material.opacity=.61;
 }
 setShadowArea(x,z,radius){
  this.sun.position.set(x-14,27,z+13);this.sun.target.position.set(x,0,z);
  this.sun.target.updateMatrixWorld();
  const camera=this.sun.shadow.camera;
  Object.assign(camera,{left:-radius,right:radius,top:radius,bottom:-radius});
  camera.updateProjectionMatrix();
  this.renderer.shadowMap.needsUpdate=true;
 }
 point(clientX,clientY){this.mouse.set(clientX/innerWidth*2-1,-clientY/innerHeight*2+1);this.ray.setFromCamera(this.mouse,this.camera);if(!this.ray.ray.intersectPlane(this.plane,this.hit))return null;return{x:Math.round(this.hit.x),z:Math.round(this.hit.z)};}
 pan(x,z){this.center.x=Math.max(-BUILD_EDGE,Math.min(BUILD_EDGE,this.center.x+x));this.center.z=Math.max(-BUILD_EDGE,Math.min(BUILD_EDGE,this.center.z+z));}
 setZoom(d){this.zoom=Math.max(this.inspectedId?.6:2.5,Math.min(SIZE*.58,this.zoom+d));this.updateProjection();}
 centerBase(){this.center.set(0,0,0);}
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
 setTool(type,dir=0,neighbors=[]){this.miningTool=type;for(const [kind,mesh] of this.depositHighlights??[])mesh.visible=kind===type;this.previewRange.visible=false;this.grid.visible=!!type;this.ghostDir=dir;this.wallPreview=neighbors.join(':');if(this.ghost){this.scene.remove(this.ghost);this.ghostMaterial.dispose();this.ghost=null;}
  if(type&&!['demolish','repair'].includes(type)){this.ghost=type==='belt'?new T.Group():makeModel(type,dir,neighbors,1,this.style);
   if(type==='belt'){
    const deck=new T.Mesh(new T.PlaneGeometry(.96,.57).rotateX(-Math.PI/2),new T.MeshBasicMaterial());deck.rotation.y=-dir*Math.PI/2;deck.position.y=.2;this.ghost.add(deck);
    const arrow=new T.Mesh(beltArrow,new T.MeshBasicMaterial({color:0xf4e8bd,depthTest:false}));arrow.name='arrow-preview';arrow.rotation.set(-Math.PI/2,0,-dir*Math.PI/2);arrow.position.set(DIRS[dir][0]*.16,.23,DIRS[dir][1]*.16);this.ghost.add(arrow);
   }this.ghostMaterial=new T.MeshBasicMaterial({color:C.mint,transparent:true,opacity:.45,depthWrite:false});this.ghost.traverse(o=>{if(o.name==='structure-outline')o.visible=false;if(o.isMesh){if(!o.name.startsWith('arrow-'))o.material=this.ghostMaterial;o.castShadow=false;}});sizePortBadges(this.ghost,this.worldPerPixel,true);this.scene.add(this.ghost);}
 }
 hover(cell,valid,tool,radius=0){this.cursor.visible=!!cell&&!!tool;this.previewRange.visible=!!cell&&radius>0;
  if(!cell){if(this.ghost)this.ghost.visible=false;return;}
  const color=valid?C.mint:0xf5816d;
  this.cursor.position.set(cell.x,.03,cell.z);this.cursor.material.color.set(color);
  if(radius){this.previewRange.scale.setScalar(radius/10);this.previewRange.position.set(cell.x,.04,cell.z);this.previewRange.material.color.set(color);}
  if(isBarrier(tool)){const neighbors=barricadeNeighbors(cell,this.cellGrid);if(neighbors.join(':')!==this.wallPreview)this.setTool(tool,this.ghostDir,neighbors);}
  if(this.ghost){this.ghost.visible=true;this.ghost.position.set(cell.x,0,cell.z);this.ghostMaterial.color.set(valid?C.mint:0xf5816d);}}
 select(b){
  if(this.selected!==b?.id){
   const previous=this.buildings.get(this.selected),next=this.buildings.get(b?.id);
   if(previous)sizePortBadges(previous,this.worldPerPixel,false);
   if(next)sizePortBadges(next,this.worldPerPixel,true);
  }
  const radius=buildingRadius(b);
  this.selected=b?.id;this.selection.visible=!!b;this.range.visible=radius>0;if(radius)this.range.scale.setScalar(radius/10);if(b){this.selection.position.set(b.x,.04,b.z);this.range.position.set(b.x,.035,b.z);}
 }
 staticTerrain(s){
  this.renderer.shadowMap.needsUpdate=true;
  const quarry=this.style==='quarry';
  this.terrainKey=`${this.style}:${s.seed}:${s.terrain.trees.length}:${s.terrain.rocks.length}:${s.terrain.coast?.kind??s.terrain.coast?.shoreZ??'inland'}`;
  for(const group of [this.terrain,this.ground]){while(group.children.length){const o=group.children.pop();o.parent=null;if(o.isInstancedMesh){o.dispose();}else if(o.isMesh){o.geometry.dispose();o.material.dispose();}}}
  this.depositHighlights.clear();
  const rand=rng(s.seed),color=new T.Color(),groundGeometry=new T.PlaneGeometry(SIZE+24,SIZE+24,s.terrain.coast?240:104,s.terrain.coast?240:104);groundGeometry.rotateX(-Math.PI/2);const colors=[],growth=[],vertices=groundGeometry.attributes.position;
  const shade=new T.Color(quarry?0x3e4937:0x223c39),gravel=new T.Color(0x91816c),albedoTint=new T.Color(0xe8e1d5);
  for(let i=0;i<vertices.count;i++){const x=vertices.getX(i),z=vertices.getZ(i),n=(Math.sin(x*.27+Math.cos(z*.19))+Math.cos(z*.33-x*.11)+2)/4,d=Math.hypot(x*.9,z);color.setHex(quarry?(d<13?0x7d7762:0x6b7052):(d<12?0x42504a:0x325148)).lerp(shade,n*.7);if(quarry){
    const exposed=Math.sin(x*.53+z*.28)+Math.cos(z*.51-x*.32)+.43*Math.sin(x*.96-z*.76);
    color.lerp(gravel,Math.min(.78,Math.max(0,.43*exposed-.12)));
    color.lerp(albedoTint,.76);
    const meadow=Math.sin(x*.47-z*.21)+Math.cos(z*.49+x*.23)+Math.sin(x*1.28-z*.66)*.2;
    const baseGrowth=T.MathUtils.smoothstep(meadow,-.74,.84)*T.MathUtils.smoothstep(Math.hypot(x,z),2.5,16);
    const coastalGrowth=(.6+T.MathUtils.smoothstep(meadow,-.74,.84)*.4)*T.MathUtils.smoothstep(Math.abs(x),.45,1.3)*T.MathUtils.smoothstep(Math.hypot(x,z+8),1,2)*T.MathUtils.smoothstep(coastalHeight(s.terrain,x,z),-.6,-.05);
    growth.push(s.terrain.coast&&z<-1?coastalGrowth:baseGrowth);
   }colors.push(color.r,color.g,color.b);vertices.setY(i,-.026+coastalHeight(s.terrain,x,z)+(d>12?Math.sin(x*.7)*Math.cos(z*.6)*.017:0));}
  groundGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));groundGeometry.computeVertexNormals();
  if(quarry)groundGeometry.setAttribute('quarryGrowth',new T.Float32BufferAttribute(growth,1));
  const ground=new T.Mesh(groundGeometry,quarry?quarryTerrainMaterial():new T.MeshStandardMaterial({vertexColors:true,roughness:1}));
  ground.receiveShadow=true;this.ground.add(ground);let i=0;
  if(s.terrain.coast){
   const coastRocks=[];for(let x=s.terrain.coast.kind==='island'?-120:-23;x<=(s.terrain.coast.kind==='island'?120:23);x+=1.4)for(let z=s.terrain.coast.kind==='island'?-115:-16;z<(s.terrain.coast.kind==='island'?115:2);z+=1.4){const y=coastalHeight(s.terrain,x,z);if(y<-.08&&y>-.93)coastRocks.push({x:x+(rand()-.5)*.4,z:z+(rand()-.5)*.4,y});}
   const stone=quarryStoneSurface(),cliff=new T.InstancedMesh(stone.shape,stone.material,coastRocks.length),tint=new T.Color();
   coastRocks.forEach((p,i)=>{this.dummy.position.set(p.x,p.y-.12,p.z);this.dummy.rotation.set(rand()*.4,rand()*6,rand()*.35);this.dummy.scale.set(.38+rand()*.4,.3+rand()*.3,.36+rand()*.4);this.dummy.updateMatrix();cliff.setMatrixAt(i,this.dummy.matrix);cliff.setColorAt(i,tint.setHex(0x757970).multiplyScalar(.75+rand()*.35));});
   cliff.castShadow=true;cliff.receiveShadow=true;this.terrain.add(cliff);
  }

  for(const [type,resource,tint] of [['drill','ore',0x92c2c7],['copperDrill','copper',0xe4b27b],['coalMine','coal',0xa3a6bc]]){
   const tiles=s.terrain[resource]??[],overlay=new T.InstancedMesh(new T.RingGeometry(.46,.5,4,1,Math.PI/4).scale(Math.SQRT2,Math.SQRT2,1).rotateX(-Math.PI/2),new T.MeshBasicMaterial({color:0xc8eee0,transparent:true,opacity:.9,depthWrite:false,depthTest:false}),tiles.length);
   tiles.forEach((p,i)=>{this.dummy.position.set(p.x,.025,p.z);this.dummy.rotation.set(0,0,0);this.dummy.scale.set(1,1,1);this.dummy.updateMatrix();overlay.setMatrixAt(i,this.dummy.matrix);});
   overlay.visible=this.miningTool===type;this.depositHighlights.set(type,overlay);this.terrain.add(overlay);
  }
  const grass=new T.InstancedMesh(geometry('cone',quarry?.075:.12,.25,3),mat(quarry?0x8a8051:0x638067),650);let gi=0;while(gi<650){const x=(rand()-.5)*65,z=(rand()-.5)*65;if(Math.hypot(x,z)<12||!coastalLand(s.terrain,x,z))continue;this.dummy.position.set(x,.07,z);this.dummy.rotation.set(0,rand()*6,.1);this.dummy.scale.set(.6+rand(),.6+rand(),.6+rand());this.dummy.updateMatrix();grass.setMatrixAt(gi++,this.dummy.matrix);}this.terrain.add(grass);
  const groves=new Map();
  for(const tree of s.terrain.trees){const chunk=key(Math.floor(tree.x/24),Math.floor(tree.z/24));if(!groves.has(chunk))groves.set(chunk,[]);groves.get(chunk).push(tree);}
  const spruce=quarry?quarrySpruce():null;
  for(const trees of groves.values()){
  if(spruce){
   const stand=new T.InstancedMesh(spruce.geometry,spruce.material,trees.length);
   const tint=new T.Color();
   trees.forEach((tree,i)=>{
    const scale=tree.h*(.81+rand()*.25),brightness=.72+rand()*.28;
    this.dummy.position.set(tree.x+(rand()-.5)*.23,0,tree.z+(rand()-.5)*.23);
    this.dummy.rotation.set(0,0,(rand()-.5)*.09);
    this.dummy.scale.set(scale*(.88+rand()*.22),scale,scale);this.dummy.updateMatrix();
    stand.setMatrixAt(i,this.dummy.matrix);stand.setColorAt(i,tint.setScalar(brightness));
   });
   stand.castShadow=true;stand.receiveShadow=true;this.terrain.add(stand);
   continue;
  }
  const trunks=new T.InstancedMesh(geometry('cyl',quarry?.084:.1,.6,5),mat(quarry?0x665441:C.wood),trees.length),leaves=new T.InstancedMesh(quarry?geometry('cone',.54,1.22,7):geometry('ico',.72),mat(quarry?0x3e4e36:C.tree),trees.length),tops=new T.InstancedMesh(quarry?geometry('cone',.39,1.26,7):geometry('ico',.56),mat(quarry?0x596247:C.treeTop),trees.length);
  trees.forEach((v,i)=>{this.dummy.position.set(v.x,.3,v.z);this.dummy.rotation.set(0,rand()*6,0);this.dummy.scale.set(.8+rand()*.4,v.h*1.15,.8+rand()*.4);this.dummy.updateMatrix();trunks.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=.9*v.h;this.dummy.updateMatrix();leaves.setMatrixAt(i,this.dummy.matrix);this.dummy.position.y=1.6*v.h;this.dummy.updateMatrix();tops.setMatrixAt(i,this.dummy.matrix);});for(const o of[trunks,leaves,tops]){o.castShadow=true;o.receiveShadow=true;this.terrain.add(o);}
  }
  if(quarry){
   this.quarryDeposit(s.terrain.ore,0x96d2df,0x61797a,rand);
   this.quarryDeposit(s.terrain.copper??[],0xf1b17c,0x8c624a,rand);
   this.quarryDeposit(s.terrain.coal??[],0x344653,0x19272e,rand);
  }else{
   const ores=new T.InstancedMesh(geometry('ico',.32),mat(0x75a7aa),s.terrain.ore.length*3);i=0;for(const v of s.terrain.ore)for(let k=0;k<3;k++){this.dummy.position.set(v.x+(rand()-.5)*.6,.15,v.z+(rand()-.5)*.6);this.dummy.rotation.set(rand(),rand(),rand());this.dummy.scale.set(1,.6+rand()*.4,1);this.dummy.updateMatrix();ores.setMatrixAt(i++,this.dummy.matrix);}ores.castShadow=true;this.terrain.add(ores);
   if(s.terrain.copper?.length){const copper=new T.InstancedMesh(geometry('ico',.36),mat(0xcc9267),s.terrain.copper.length);s.terrain.copper.forEach((v,i)=>{this.dummy.position.set(v.x,.13,v.z);this.dummy.scale.set(.9,.6,.9);this.dummy.rotation.set(.2,rand()*6,.1);this.dummy.updateMatrix();copper.setMatrixAt(i,this.dummy.matrix);});copper.castShadow=true;this.terrain.add(copper);}
   if(s.terrain.coal?.length){const coal=new T.InstancedMesh(geometry('ico',.42),mat(0x4b505c),s.terrain.coal.length);s.terrain.coal.forEach((v,i)=>{this.dummy.position.set(v.x,.16,v.z);this.dummy.rotation.set(0,rand()*6,0);this.dummy.scale.set(.92,.68,.92);this.dummy.updateMatrix();coal.setMatrixAt(i,this.dummy.matrix);});coal.castShadow=true;this.terrain.add(coal);}
  }
  const stone=quarry?quarryStoneSurface():null;
  const rocks=new T.InstancedMesh(stone?.shape??geometry('ico',.5),stone?.material??mat(0x657873),s.terrain.rocks.length);
  s.terrain.rocks.forEach((v,i)=>{
   this.dummy.position.set(v.x,v.h*.25,v.z);
   this.dummy.scale.set((.8+rand()*.4)*(quarry?.48:1),v.h*(quarry?.76:1.15),(.8+rand()*.4)*(quarry?.48:1));
   this.dummy.rotation.set(0,rand()*6,0);this.dummy.updateMatrix();rocks.setMatrixAt(i,this.dummy.matrix);
  });
  rocks.castShadow=true;this.terrain.add(rocks);
 }
 quarryDeposit(tiles,vein,bedrock,random){
  const chunks=new Map();
  for(const tile of tiles){
   const chunk=key(Math.floor(tile.x/16),Math.floor(tile.z/16));
   if(!chunks.has(chunk))chunks.set(chunk,[]);
   chunks.get(chunk).push(tile);
  }
  const {shape,material}=quarryStoneSurface();
  const highlight=new T.Color(vein),bed=new T.Color(bedrock),color=new T.Color(),pose=this.dummy;
  for(const patch of chunks.values()){
   const scatter=new T.InstancedMesh(shape,material,patch.length*3);
   let index=0;
   for(const {x,z} of patch)for(let fragment=0;fragment<3;fragment++){
   const base=fragment===0,size=base?.23+random()*.07:.06+random()*.07;
   pose.position.set(x+(random()-.5)*(base?.47:.83),base?.062:.051+size*.17,z+(random()-.5)*(base?.47:.83));
   pose.rotation.set(random()*.4,random()*6,random()*.31);
   pose.scale.set(size*1.16,size*(base?.39:.56),size*.88);pose.updateMatrix();
   scatter.setMatrixAt(index,pose.matrix);
   scatter.setColorAt(index++,color.copy(bed).lerp(highlight,base?.68:random()*.23+.75));
   }
   scatter.castShadow=true;scatter.receiveShadow=true;this.terrain.add(scatter);
  }
 }
 reserveBeltCargo(capacity){
  const previous=this.beltItems,allocated=previous?.instanceMatrix.count??0;
  if(allocated>=capacity)return;
  this.beltItems=new T.InstancedMesh(geometry('box',.15,.13,.15),mat(0xffffff),Math.max(capacity,allocated*2));
  this.beltItems.instanceMatrix.setUsage(T.DynamicDrawUsage);
  this.beltItems.frustumCulled=false;this.beltItems.count=0;
  this.scene.add(this.beltItems);
  if(previous){this.scene.remove(previous);previous.dispose();}
 }
 sync(s,motion,nowTime=s.time){
  const time=motion?.renderTime??nowTime;
  if(this.inspectedId){const actor=s.enemies.find(e=>e.id===this.inspectedId);if(!actor)this.exitInspection();else{this.center.set(actor.x,actor.kind==='walker'?.9:.36,actor.z);this.inspectionHeading=this.coastalHostiles.headings.get(actor.id)??Math.atan2(-actor.x,-actor.z);
   const stamp=actor.id+':'+Math.round(actor.x)+':'+Math.round(actor.z)+':'+s.buildings.length;if(this.inspectionOrbitStamp!==stamp){
    this.inspectionOrbitStamp=stamp;const solids=[];for(const root of this.buildings.values())root.traverse(part=>{if(part.isMesh&&(part.visible||part.userData.staticInstanceProxy)&&part.material?.opacity!==0)solids.push(part);});
    const probe=new T.Raycaster(),destination=new T.Vector3(actor.x,.12,actor.z),origin=new T.Vector3();this.inspectionOrbit=0;
    for(const offset of [0,Math.PI/3,-Math.PI/3,Math.PI/2,-Math.PI/2,Math.PI]){const angle=this.inspectionHeading+offset;origin.set(actor.x+Math.sin(angle)*9,4.5,actor.z+Math.cos(angle)*9);const ray=destination.clone().sub(origin);probe.set(origin,ray.clone().normalize());probe.far=ray.length()-.1;if(!probe.intersectObjects(solids,false).length){this.inspectionOrbit=offset;break;}}
   }}}
  const dt=Math.max(0,Math.min(.12,time-(this.lastRenderTime??time)));this.lastRenderTime=time;
  const position=actor=>motion?.position(actor,this.renderPosition)??actor;
  const quarry=this.style==='quarry';
  const shotsByOrigin=quarry?new Map(s.shots.map(shot=>[key(shot.x,shot.z),shot])):null;
  const core=s.buildings.find(b=>b.type==='hq'),heading=motion?.lighthouseAngle??lighthouseHeading(core);
  const beam=lighthouseBeam(core,heading);
  this.lighthouseFog.sync(beam,time,s.enemies.length?1:0,!this.renderer.shadowMap.enabled);
  this.lighthouseLight.sync(core,beam,time,!this.renderer.shadowMap.enabled);
  this.coastalWater.sync(s.terrain,time,beam);this.baseLampLights.sync(s.buildings,this.center,this.zoom,!this.renderer.shadowMap.enabled);
  if(this.terrainKey!==`${this.style}:${s.seed}:${s.terrain.trees.length}:${s.terrain.rocks.length}:${s.terrain.coast?.kind??s.terrain.coast?.shoreZ??'inland'}`)this.staticTerrain(s);
  const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));this.cellGrid=grid;
  let structuresChanged=false;const ids=new Set(s.buildings.map(b=>b.id));for(const[id,g]of this.buildings)if(!ids.has(id)){structuresChanged=true;this.scene.remove(g);this.buildings.delete(id);this.renderer.shadowMap.needsUpdate=true;if(this.items.has(id)){this.scene.remove(this.items.get(id));this.items.delete(id);}}
  if(s.buildings.length*BELT_CAPACITY>this.beltItems.instanceMatrix.count){
   const belts=s.buildings.reduce((count,b)=>count+Number(b.type==='belt'),0);
   this.reserveBeltCargo(belts*BELT_CAPACITY);
  }
  let cargoCount=0;
  this.dummy.rotation.set(0,0,0);this.dummy.scale.setScalar(1);
  for(const b of s.buildings){const inputs=b.type==='belt'?beltInputs(b,grid):isBarrier(b.type)?barricadeNeighbors(b,grid):b.type==='storage'&&b.exportItem?[0]:[],signature=[this.style,b.type,b.dir,b.level||1,...inputs].join(':');let g=this.buildings.get(b.id);if(g&&g.userData.signature!==signature){this.scene.remove(g);this.buildings.delete(b.id);g=null;}
   if(!g){
    g=makeModel(b.type,b.dir,inputs,b.level||1,this.style);g.userData.signature=signature;
    for(const name of ['rotor','cargoCapsule','dispatchDial','head','beacon','lantern','bulb']){
     const part=g.getObjectByName(name);
     if(part){g.userData[name]=part;part.traverse(o=>{o.castShadow=false;});}
    }
    if(b.type==='splitter')g.traverse(o=>{if(o.isSprite)o.material=o.material.clone();});
    g.position.set(b.x,0,b.z);sizePortBadges(g,this.worldPerPixel,b.id===this.selected);
    structuresChanged=true;this.scene.add(g);this.buildings.set(b.id,g);this.renderer.shadowMap.needsUpdate=true;
   }else if(g.position.x!==b.x||g.position.z!==b.z){structuresChanged=true;g.position.set(b.x,0,b.z);this.renderer.shadowMap.needsUpdate=true;}
   const {rotor,cargoCapsule:capsule,dispatchDial:dial,head,beacon,lantern,bulb}=g.userData;
   if(bulb){bulb.material.emissiveIntensity=b.active?2.5:0;bulb.material.color.setHex(b.active?0xffdeb1:0x4b5148);}
   if(lantern)lantern.rotation.y=heading;
   if(rotor&&b.active)rotor.rotation.y=time*(GENERATORS[b.type]?5:2)*productionSpeed(b);
   if(capsule){const age=time-(b.lastTransfer?.time??-100);if(age>=0&&age<.45&&b.lastTransfer.role!=='forward'){const t=age/.45;capsule.position.set(-1*(1-t)+(b.lastTransfer.role==='machine'?t:0),.4+Math.sin(t*Math.PI)*.45,b.lastTransfer.role==='return'?t:0);}else capsule.position.set(0,.57+(b.active?Math.sin(time*3)*.03:0),0);}
   if(dial)dial.rotation.y=(b.phase||0)*Math.PI*2/3;
   if(b.type==='splitter'){const active=[3,2,4][b.phase||0];for(const n of [2,3,4]){const port=g.getObjectByName('port-'+n);if(port)port.material.opacity=n===active?1:.55;}}
   if(head){
    const aim=b.aim||0;
    head.rotation.y=quarry&&g.userData.aimSeen?easeAngle(head.rotation.y,aim,1-Math.exp(-dt*18)):aim;
    g.userData.aimSeen=true;
    if(quarry){
     const age=time-(shotsByOrigin.get(key(b.x,b.z))?.time??-10);
     const recoil=age>=0&&age<.22?.105*Math.sin(Math.PI*Math.min(1,age/.22))*(1-age/.28):0;
     head.position.set(-Math.sin(aim)*recoil,head.position.y,-Math.cos(aim)*recoil);
    }
   }
   if(beacon){beacon.position.y=1.73+Math.sin(time*2)*.06;beacon.rotation.z=time*.2;}
   if(b.type==='belt'){
    const draw=(cargo,t)=>{
     const rear=(b.dir+2)%4,side=DIRS[cargo.itemSide]&&cargo.itemSide!==b.dir?cargo.itemSide:rear;
     const [ix,iz]=DIRS[side],[ox,oz]=DIRS[b.dir],bend=side!==rear;
     const enter=(bend?(1-t)**2:1-t)*.5,leave=(bend?t*t:t)*.5;
     this.dummy.position.set(b.x+enter*ix+leave*ox,quarry?.255:.3,b.z+enter*iz+leave*oz);this.dummy.updateMatrix();
     this.beltItems.setMatrixAt(cargoCount,this.dummy.matrix);
     this.beltItems.setColorAt(cargoCount++,this.enemyColor.setHex(itemColors[cargo.item]??C.light));
    };
    if(motion)motion.drawBeltItems(b,draw);
    else if(b.item)for(const cargo of [b,...(b.beltQueue??[])])draw(cargo,conveyorProgress(b,cargo,s.tick));
   }else if(b.item){let item=this.items.get(b.id);if(!item){item=new T.Mesh(geometry('box',.21,.16,.21),mat(C.light));this.items.set(b.id,item);this.scene.add(item);}if(item.userData.type!==b.item){item.userData.type=b.item;item.material=mat(itemColors[b.item]||C.light);}item.position.set(b.x,.3,b.z);item.visible=true;}
   else if(this.items.has(b.id))this.items.get(b.id).visible=false;
  }
  this.beltItems.count=cargoCount;
  if(cargoCount){this.beltItems.instanceMatrix.needsUpdate=true;this.beltItems.instanceColor.needsUpdate=true;}
  if(this.selected){const b=s.buildings.find(b=>b.id===this.selected);this.select(b);}
  const n=Math.min(s.enemies.length,500),headings=quarry?new Map():null;
  if(structuresChanged)this.structureInstances.sync(this.buildings);
  if(quarry)this.coastalHostiles.sync(s.enemies,time,dt,beam,position,motion,{x:this.center.x,z:this.center.z,rx:this.camera.right+3,rz:this.camera.top*1.6+3,zoom:this.zoom,inspect:this.inspectedId,terrain:s.terrain,low:!this.renderer.shadowMap.enabled});
  if(quarry&&(this.coastalHostiles.shadowCastersChanged||!s.paused&&this.coastalHostiles.hasDynamicShadows))this.renderer.shadowMap.needsUpdate=true;
  for(let i=0;i<(quarry?0:n);i++){
   const e=s.enemies[i],{x,z}=position(e),scale=e.coreHunter?1.65:e.brute?1.45:1,angle=Math.atan2(-x,-z),sway=Math.sin(time*8+i)*.04;
   this.enemyBody.setColorAt(i,this.enemyColor.setHex(e.coreHunter?0xffc45a:e.mutation==='armored'?0x91acff:e.mutation==='frenzied'?0xff6654:e.mutation==='swift'?0x84f2a8:0xffffff));
   if(quarry)this.enemyBody.setColorAt(i,this.enemyColor.multiplyScalar(isInLighthouseBeam(beam,{x,z})?1.21:.77));
   if(quarry){
    const previous=motion?.previous.get(e.id),old=this.actorHeading.get(e.id);
    const moving=previous&&Math.abs(e.x-previous.x)+Math.abs(e.z-previous.z)>.001;
    const aim=moving?Math.atan2(e.x-previous.x,e.z-previous.z):old??angle;
    const heading=old===undefined?aim:easeAngle(old,aim,1-Math.exp(-dt*12));
    headings.set(e.id,heading);
    this.placeQuarryHostile(i,x,z,scale,heading,sway,time);
    continue;
   }
   this.dummy.rotation.set(0,angle,0);this.dummy.scale.setScalar(scale);this.dummy.position.set(x,.5*scale+sway,z);
   this.dummy.updateMatrix();this.enemyBody.setMatrixAt(i,this.dummy.matrix);
   this.dummy.position.y=.88*scale+sway;this.dummy.updateMatrix();this.enemyHead.setMatrixAt(i,this.dummy.matrix);
   for(let leg=0;leg<2;leg++){
    const offset=leg?-.1:.1;this.dummy.position.set(x+Math.cos(angle)*offset,.18*scale,z-Math.sin(angle)*offset);
    this.dummy.rotation.x=Math.sin(time*9+i+leg*Math.PI)*.4;this.dummy.updateMatrix();this.enemyLegs.setMatrixAt(i*2+leg,this.dummy.matrix);
   }
  }
  for(const[o,count]of[[this.enemyBody,quarry?0:n],[this.enemyHead,quarry?0:n],[this.enemyLegs,quarry?0:n*2]]){o.count=count;o.visible=count>0;if(count)o.instanceMatrix.needsUpdate=true;}
  if(this.enemyBody.instanceColor)this.enemyBody.instanceColor.needsUpdate=true;
  if(quarry){
   this.actorHeading=headings;
   updateQuarryEffects(this.dust,s,time,this.center,this.camera.right+6,
    this.renderer.domElement.height/Math.max(1,this.zoom*2));
  }
  const hostileShots=s.shots.filter(shot=>shot.hostile).slice(-500),hostilePos=this.hostileShotsGeometry.attributes.position;
  hostileShots.forEach((shot,i)=>{hostilePos.setXYZ(i*2,shot.x,.55,shot.z);hostilePos.setXYZ(i*2+1,shot.tx,.4,shot.tz);});
  this.hostileShotsGeometry.setDrawRange(0,hostileShots.length*2);this.hostileShotLines.visible=hostileShots.length>0;if(hostileShots.length)hostilePos.needsUpdate=true;
  const shots=s.shots.filter(shot=>!shot.hostile).slice(-1200),pos=this.shotsGeometry.attributes.position;
  let blasts=0;
  shots.forEach((v,i)=>{
   pos.setXYZ(i*2,v.x,.85,v.z);pos.setXYZ(i*2+1,v.tx,.5,v.tz);
   if(v.radius&&blasts<128){
    const radius=v.radius*(.4+.6*Math.max(0,Math.min(1,(time-v.time)/.25)));
    this.dummy.position.set(v.tx,.11,v.tz);this.dummy.rotation.set(0,0,0);
    this.dummy.scale.setScalar(radius);this.dummy.updateMatrix();this.blasts.setMatrixAt(blasts++,this.dummy.matrix);
   }
  });
  this.blasts.count=blasts;this.blasts.visible=blasts>0;if(blasts)this.blasts.instanceMatrix.needsUpdate=true;
  if(shots.length)pos.needsUpdate=true;this.shotLines.visible=shots.length>0;this.shotsGeometry.setDrawRange(0,shots.length*2);
 }
 placeQuarryHostile(i,x,z,scale,angle,sway,time){
  const sin=Math.sin(angle),cos=Math.cos(angle),pose=this.dummy;
  pose.rotation.set(-.04+sway*.8,angle,0,'YXZ');pose.position.set(x,.28*scale+sway,z);pose.scale.set(.23*scale,.162*scale,.41*scale);
  pose.updateMatrix();this.enemyBody.setMatrixAt(i,pose.matrix);
  pose.position.set(x+sin*.37*scale,.21*scale+sway,z+cos*.37*scale);pose.scale.set(.135*scale,.116*scale,.17*scale);
  pose.updateMatrix();this.enemyHead.setMatrixAt(i,pose.matrix);
  pose.scale.setScalar(scale);
  for(let leg=0;leg<4;leg++){
   const side=(leg%2===0?-.21:.21)*scale,front=(leg<2?-.21:.21)*scale;
   const stride=Math.sin(time*11+i+(leg===0||leg===3?Math.PI:0));
   const lift=Math.max(0,stride)*.032,reach=front+stride*scale*.045;
   pose.position.set(x+cos*side+sin*reach,.13*scale+lift+sway*.4,z-sin*side+cos*reach);
   pose.rotation.set(stride*.63,angle,side*.78,'YXZ');
   pose.updateMatrix();this.enemyLegs.setMatrixAt(i*4+leg,pose.matrix);
  }
 }
 draw(){
  const quarry=this.style==='quarry';
  if(this.inspectedId)this.camera.position.copy(this.center).add(new T.Vector3(Math.sin(this.inspectionHeading+(this.inspectionOrbit||0))*9,4.1,Math.cos(this.inspectionHeading+(this.inspectionOrbit||0))*9));else this.camera.position.copy(this.center).addScaledVector(quarry?QUARRY_CAMERA:CAMERA_OFFSET,Math.max(1,(this.zoom??14)/20));
  if(this.scene.fog)this.scene.fog.density=(quarry?.0065:.011)/Math.max(1,(this.zoom??14)/20);
  this.camera.lookAt(this.center);this.camera.updateMatrixWorld();
  if(quarry&&this.renderer.shadowMap.enabled){
   const x=Math.round(this.center.x/6)*6,z=Math.round(this.center.z/6)*6;
   const radius=Math.ceil(Math.max(this.camera.right,this.zoom)*1.1+9),key=`${x}:${z}:${radius}`;
   if(this.shadowKey!==key){this.shadowKey=key;this.setShadowArea(x,z,radius);}
  }
  outlineMaterial.uniforms.width.value=Math.min(.028,Math.max(.008,(this.worldPerPixel??.02)*.65));
  if(this.composer&&this.renderer.shadowMap?.enabled)this.composer.render();else this.renderer.render(this.scene,this.camera);
 }
 project(x,z,y=1.3){const v=(this.projected??=new T.Vector3()).set(x,y,z).project(this.camera);return{x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight,visible:v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1};}
}
