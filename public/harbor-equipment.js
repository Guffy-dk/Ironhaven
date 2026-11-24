import * as T from './vendor/three.module.js';
import {box,cyl} from './render-primitives.js';
import {quarryTexture} from './quarry-textures.js';

const steel = 0x809297;
const dark = 0x34474a;
const brass = 0xbe9d68;
const fittingMaterials = new Map();

export function harborEquipment(group, variant, color) {
 const beam = (x,y,z,w,h,d) => box(group,color,x,y,z,w,h,d);
 const brace = (x,y,z,w,h,d) => box(group,steel,x,y,z,w,h,d);
 const tank = (x,y,z,r,h,finish=steel) => cyl(group,finish,x,y,z,r,h,16);
 const roller = (x,y,z,r,h,finish=steel) => {
  const mesh = tank(x,y,z,r,h,finish);
  mesh.rotation.z = Math.PI / 2;
  return mesh;
 };
 const rail = (y, width=.74) => {
  for (const z of [-.28,.28]) brace(0,y,z,width,.04,.04);
  for (const x of [-.34,.34]) for (const z of [-.28,.28]) brace(x,y-.1,z,.036,.24,.036);
 };
 const vent = (x,y,z) => {
  brace(x,y,z,.21,.21,.15);
  for (let i=0;i<5;i++) box(group,dark,x,y-.07+i*.035,z+.08,.18,.012,.016);
 };

 switch (variant) {
  case 'crusher':
   for (const x of [-.28,.28]) {
    brace(x,1.23,0,.09,.7,.52);
    const slope = beam(x,1.58,0,.09,.45,.63);
    slope.rotation.z = Math.sign(x)*-.36;
   }
   roller(0,1.28,0,.15,.53,dark);
   for (const z of [-.26,.26]) brace(0,1.53,z,.76,.07,.09);
   break;
  case 'kiln':
   for (const x of [-.32,.32]) brickStack(group,x,.78,.29);
   tank(.26,1.35,-.22,.12,1.04,dark);
   tank(.26,1.9,-.22,.16,.08);
   brace(-.1,.79,.43,.38,.25,.1);
   box(group,0xc58b56,-.1,.77,.493,.26,.07,.017);
   break;
  case 'coke':
   for (const x of [-.26,0,.26]) {
    tank(x,1.56,-.25,.074,.84,dark);
    tank(x,1.99,-.25,.1,.075);
   }
   beam(0,1.45,.16,.71,.14,.42);
   rail(1.68);
   break;
  case 'alloy':
   tank(.16,1.53,0,.24,.49,dark);
   tank(.16,1.79,0,.27,.065,brass);
   tank(.16,1.89,0,.15,.18);
   brace(-.31,1.58,-.08,.07,1.02,.11);
   beam(-.08,2.08,-.08,.55,.1,.15);
   break;
  case 'kettle':
   tank(0,1.26,.04,.275,.61,brass);
   tank(0,1.62,.04,.22,.12);
   for (const x of [-.23,.23]) tank(x,1.23,-.24,.07,.64,dark);
   vent(.29,.78,.35);
   break;
  case 'cable':
   for (const x of [-.27,.27]) roller(x,1.16,0,.255,.075,dark);
   roller(0,1.16,0,.19,.48,brass);
   for (let i=0;i<7;i++) roller(-.21+i*.07,1.16,0,.193,.025,0x98633c);
   brace(0,1.47,.28,.68,.07,.07);
   break;
  case 'hull':
   for (let i=0;i<5;i++) {
    const panel=beam(-.24+i*.115,1.12,0,.045,.68,.76);
    panel.rotation.z=-.18;
    brace(-.24+i*.115,1.45,0,.052,.04,.77);
   }
   rail(1.06);
   break;
  case 'hydraulic':
   for (const x of [-.25,.25]) {
    tank(x,1.58,.12,.104,.65,dark);
    tank(x,1.96,.12,.052,.22,brass);
    brace(x,1.64,-.2,.09,.76,.11);
   }
   beam(0,2.08,.12,.67,.09,.22);
   break;
  case 'switchgear':
   beam(0,1.17,-.02,.73,.56,.43);
   for (const x of [-.23,0,.23]) {
    tank(x,1.52,-.03,.058,.26,dark);
    for (let i=0;i<4;i++) tank(x,1.43+i*.047,-.03,.083,.018,brass);
   }
   vent(.2,1.16,.23);
   break;
  case 'freight':
   for (const x of [-.33,.33]) {
    brace(x,1.24,-.25,.07,.79,.07);
    brace(x,1.24,.25,.07,.79,.07);
    beam(x,1.65,0,.09,.1,.68);
   }
   for (const z of [-.28,.28]) beam(0,1.65,z,.78,.1,.085);
   brace(0,1.27,.29,.68,.08,.085);
   break;
  case 'harbor':
   brace(-.31,1.57,-.23,.115,1.08,.15);
   beam(.02,2.1,-.23,.77,.11,.14);
   brace(.31,1.87,-.23,.027,.42,.027);
   tank(.31,1.62,-.23,.078,.07,dark);
   beam(.23,1.29,.17,.35,.23,.34);
   rail(1.47,.65);
   break;
  default: return false;
 }
 group.traverse(part=>{
  if (!part.isMesh) return;
  const value=part.material.color.getHex();
  if(!fittingMaterials.has(value)){
   const texture=quarryTexture('metal');
   fittingMaterials.set(value,new T.MeshStandardMaterial({color:value,map:texture,bumpMap:texture,bumpScale:.015,roughness:.72,metalness:.25}));
  }
  part.material=fittingMaterials.get(value);
 });
 return true;
}

function brickStack(group,x,y,z) {
 for(let row=0;row<4;row++)box(group,row%2?0x9d624c:0xb47b60,x,y+row*.095,z,.22,.088,.22);
}
