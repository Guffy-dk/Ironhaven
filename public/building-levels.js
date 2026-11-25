import {ROMAN_LEVELS} from './shared/levels.js';
import * as T from './vendor/three.module.js';
export {ROMAN_LEVELS};
export const ROOF_HEIGHTS={smelter:.76,foundry:1.18,assembler:.72,circuitLab:.82,componentFactory:1.25,storage:.7,drill:1.28,copperDrill:1.28,coalMine:1.28,generator:.7,coalGenerator:.7,sawmill:.86,splitter:.36};
const plaques=new Map(),planes=new Map();
export function levelPlaque(group,type,level=1,dir=0){
 if(['lamp'].includes(type))return;
 const belt=type==='belt',tier=level>=8?2:level>=4?1:0,key=`${level}:${belt}`;
 if(!plaques.has(key)){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');
  // Weathered enamel sign: lit by the scene like the building it is bolted to, not a glowing UI badge.
  ctx.fillStyle=['#24383a','#2c4c52','#5a4b30'][tier];ctx.fillRect(0,0,256,128);
  for(let i=0;i<900;i++){const g=Math.random();ctx.fillStyle=`rgba(${g<.5?'0,0,0':'214,196,160'},${.035+Math.random()*.06})`;ctx.fillRect(Math.random()*256,Math.random()*128,1+Math.random()*3,1+Math.random()*2);}
  ctx.strokeStyle=['#7f8a80','#86aaa9','#b9a274'][tier];ctx.lineWidth=7;ctx.strokeRect(6,6,244,116);
  ctx.fillStyle='#ddd2b8';ctx.font='bold 84px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ROMAN_LEVELS[level-1]||'I',128,68);
  ctx.fillStyle='rgba(60,40,25,.35)';for(const [x,y] of [[16,16],[240,16],[16,112],[240,112]]){ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  plaques.set(key,new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:.58,metalness:.25,polygonOffset:true,polygonOffsetFactor:-2}));
 }
 const defense=['turret','gunTurret','mortar','pulseTurret'].includes(type);
 const small=belt||defense;if(!planes.has(small))planes.set(small,new T.PlaneGeometry(small?.2:.4,small?.13:.21));
 const plaque=new T.Mesh(planes.get(small),plaques.get(key));
 plaque.name='roof-level';plaque.rotation.x=-Math.PI/2;
 plaque.position.set(belt?0:.05,belt?.235:(ROOF_HEIGHTS[type]??(type==='wall'?.59:['turret','gunTurret','mortar','pulseTurret'].includes(type)?.36:.88))+.045,belt?0:.22);
 if(defense&&type!=='mortar'){plaque.position.set(0,type==='turret'?.25:.42,-.08);(group.getObjectByName('head')??group).add(plaque);}else{if(type==='mortar')plaque.position.set(.29,.33,.28);if(type==='hq'){plaque.scale.set(.65,.7,1);plaque.position.set(.53,.49,0);}if(['generator','coalGenerator'].includes(type))plaque.position.set(-.13,.745,.1);if(belt){const d=[[1,0],[0,1],[-1,0],[0,-1]][dir],side=[-d[1],d[0]];plaque.position.set(d[0]*.33+side[0]*.31,.245,d[1]*.33+side[1]*.31);}group.add(plaque);}return plaque;
}

// Painted trade sign on the roof (playtest feedback: factories were hard to tell apart).
// It carries the building's own pictogram and accent, is lit like the roof and reads at play zoom.
const tradeSigns=new Map();let tradePlane=null;
export function tradeSign(group,type,identity,pathData){
 if(!identity||!pathData||typeof document==='undefined'||!ROOF_HEIGHTS[type])return;
 if(!tradeSigns.has(type)){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#1f2a2c';ctx.fillRect(0,0,192,192);
  for(let i=0;i<700;i++){ctx.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'214,196,160'},${.03+Math.random()*.05})`;ctx.fillRect(Math.random()*192,Math.random()*192,1+Math.random()*3,1+Math.random()*2);}
  ctx.strokeStyle=identity.accent;ctx.lineWidth=10;ctx.strokeRect(9,9,174,174);
  if(typeof Path2D!=='undefined'){ctx.save();ctx.translate(30,30);ctx.scale(5.5,5.5);ctx.lineCap=ctx.lineJoin='round';ctx.lineWidth=1.9;ctx.strokeStyle=identity.accent;ctx.stroke(new Path2D(pathData));ctx.restore();}
  ctx.fillStyle='rgba(60,40,25,.4)';for(const [x,y] of [[20,20],[172,20],[20,172],[172,172]]){ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();}
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
  tradeSigns.set(type,new T.MeshStandardMaterial({map:tex,roughness:.55,metalness:.2,emissive:new T.Color(identity.accent),emissiveMap:tex,emissiveIntensity:.18,polygonOffset:true,polygonOffsetFactor:-2}));
 }
 tradePlane??=new T.PlaneGeometry(.5,.5);
 const sign=new T.Mesh(tradePlane,tradeSigns.get(type));
 sign.name='trade-sign';sign.rotation.x=-Math.PI/2;sign.position.set(.02,ROOF_HEIGHTS[type]+.05,-.12);
 group.add(sign);
}
