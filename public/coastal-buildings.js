import * as T from './vendor/three.module.js';
import buildings from './art/coastal-buildings.json' with {type:'json'};
import {decodeMesh} from './authored-meshes.js';
import {quarryTexture} from './quarry-textures.js';
import {box,cyl} from './render-primitives.js';
const cache=new Map(),bases=new Map(),materials=new Map();
function material(name){
 if(!materials.has(name)){
  const texture=({brick:'brick',roof:'roof',concrete:'gravel',timber:'timber',steel:'metal'})[name];
  const map=texture?quarryTexture(texture):null;
  materials.set(name,new T.MeshStandardMaterial({vertexColors:true,map,bumpMap:map,bumpScale:map?.012:0,
   roughness:name==='glass'?.2:name==='steel'||name==='roof'?.57:.92,metalness:name==='steel'?.5:0,
   emissive:name==='warm'?0x895020:0x000000,emissiveIntensity:name==='warm'?.5:0}));
 }
 return materials.get(name);
}
export function modernizeModel(group,type,level){
 const n=Math.max(0,(level||1)-1);if(!n)return;
 const work=['smelter','assembler','foundry','circuitLab','componentFactory','storage'].includes(type);
 const y=work?(type==='foundry'?1.08:1.01):type==='hq'?.22:type==='wall'?.35:type==='belt'?.12:.27;
 for(let i=0;i<n;i++){
  const side=i%2?1:-1,z=(Math.floor(i/2)-2)*.115,x=side*(work?.33:.4);
  if(type==='wall'){
   box(group,0x777469,x,.18+i*.018,z,.09,.36+i*.035,.09);continue;
  }
  box(group,i<3?0x77786e:i<6?0x535f5e:0x84928b,x,y,z,.12,.11+i*.008,.14);
  for(let j=0;j<3;j++)box(group,0x303b3b,x,y+.035+j*.005,z-.025+j*.02,.061,.006,.008);
  if(i>=3)cyl(group,0x526767,x,y+.09,z,.013,.09,12);
 }
 if(work&&n>=3){
  box(group,0x657779,.12,y+.13,-.1,.37,.26,.32);
  for(const side of [-1,1])cyl(group,0x8b9692,side*.34,y+.16,.23,.045,.31,16);
  box(group,0x283d42,.18,y+.09,-.047,.17,.05,.008);
 }
 if(work&&n>=9){
  box(group,0x9daba9,-.1,y+.27,.22,.48,.1,.18);
  for(let i=0;i<4;i++)box(group,0x394f55,-.26+i*.1,y+.335,.22,.067,.025,.14);
 }
 if(work&&n>=6){
  const panel=box(group,0x354d55,-.15,y+.18,-.08,.38,.025,.42);panel.rotation.x=.19;
  for(let i=0;i<3;i++)box(group,0xa9b5ae,-.23+i*.08,y+.195,-.08,.009,.012,.39);
 }
}
export function makeCoastalBuilding(type,level,batch){
 const source=buildings.buildings[type];if(!source)return null;
 const key=type+':'+level;
 if(!cache.has(key)){
  if(!bases.has(type)){
   const base=new T.Group();
   for(const [name,payload] of Object.entries(source)){const mesh=new T.Mesh(decodeMesh(payload,buildings.generator),material(name));mesh.castShadow=true;mesh.receiveShadow=true;base.add(mesh);}
   bases.set(type,base);
  }
  const group=bases.get(type).clone(true);group.userData={type,authored:true,detailLevel:level};
  const retrofit=new T.Group();modernizeModel(retrofit,type,level);batch(retrofit,'retrofit:'+key);group.add(retrofit);cache.set(key,group);
 }
 return cache.get(key).clone(true);
}
