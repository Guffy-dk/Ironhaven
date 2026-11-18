import {ROMAN_LEVELS} from './shared/levels.js';
import * as T from './vendor/three.module.js';
export {ROMAN_LEVELS};
export const ROOF_HEIGHTS={smelter:.76,foundry:1.18,assembler:.72,circuitLab:.82,componentFactory:1.25,storage:.7,drill:1.28,copperDrill:1.28,coalMine:1.28,generator:.7,coalGenerator:.7,sawmill:.86,splitter:.36};
const plaques=new Map();
export function levelPlaque(group,type,level=1,dir=0){
 if(['lamp'].includes(type))return;
 const belt=type==='belt',tier=level>=8?2:level>=4?1:0,key=`${level}:${belt}`;
 if(!plaques.has(key)){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;const ctx=canvas.getContext('2d');
  ctx.fillStyle=['#263c40','#315d66','#675837'][tier];ctx.fillRect(0,0,256,128);
  ctx.strokeStyle=['#9dada2','#a7d9dc','#ead399'][tier];ctx.lineWidth=8;ctx.strokeRect(5,5,246,118);
  ctx.fillStyle='#f4ead1';ctx.font='bold 88px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(ROMAN_LEVELS[level-1]||'I',128,68);
  const tex=new T.CanvasTexture(canvas);tex.colorSpace=T.SRGBColorSpace;
  plaques.set(key,new T.MeshBasicMaterial({map:tex,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));
 }
 const defense=['turret','gunTurret','mortar','pulseTurret'].includes(type);
 const plaque=new T.Mesh(new T.PlaneGeometry(belt||defense?.23:.48,belt||defense?.15:.25),plaques.get(key));
 plaque.name='roof-level';plaque.rotation.x=-Math.PI/2;
 plaque.position.set(belt?0:.05,belt?.235:(ROOF_HEIGHTS[type]??(type==='wall'?.59:['turret','gunTurret','mortar','pulseTurret'].includes(type)?.36:.88))+.045,belt?0:.22);
 if(defense&&type!=='mortar'){plaque.position.set(0,type==='turret'?.25:.42,-.08);(group.getObjectByName('head')??group).add(plaque);}else{if(type==='mortar')plaque.position.set(.29,.33,.28);if(type==='hq'){plaque.scale.set(.65,.7,1);plaque.position.set(.53,.49,0);}if(['generator','coalGenerator'].includes(type))plaque.position.set(-.13,.745,.1);if(belt){const d=[[1,0],[0,1],[-1,0],[0,-1]][dir],side=[-d[1],d[0]];plaque.position.set(d[0]*.33+side[0]*.31,.245,d[1]*.33+side[1]*.31);}group.add(plaque);}return plaque;
}
