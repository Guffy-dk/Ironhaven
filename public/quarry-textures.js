import * as T from './vendor/three.module.js';

const materials={
 gravel:[0,0,'#6b6256'], moss:[1,0,'#505743'],
 brick:[0,1,'#876350'], roof:[1,1,'#8b8e8d'],
 metal:[1,1,'#8b8e8d'], timber:[0,0,'#aa9478']
};
let cells,spruce,terrainGravel;

export function quarryTexture(name){
 if(!cells){
  cells=new Map();
  for(const [key,[x,y,fallback]] of Object.entries(materials)){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
   const ctx=canvas.getContext('2d');
   ctx.fillStyle=fallback;ctx.fillRect(0,0,512,512);
   const texture=new T.CanvasTexture(canvas);
   texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
   cells.set(key,texture);
  }
  const atlas=document.getElementById('quarry-materials');
  const paint=()=>{
   if(!atlas?.naturalWidth)return;
   for(const [key,[x,y]] of Object.entries(materials)){
    const texture=cells.get(key),region=atlas.naturalWidth/2;
    texture.image.getContext('2d').drawImage(atlas,x*region+3,y*region+3,region-6,region-6,0,0,512,512);
    if(key==='metal'||key==='timber')paintWeathering(texture.image,key);
    texture.needsUpdate=true;
   }
   if(terrainGravel)terrainGravel.needsUpdate=true;
  };
  atlas?.addEventListener('load',paint,{once:true});
  paint();
 }
 return cells.get(name);
}

export function quarryTerrainMaterial(){
 const moss=quarryTexture('moss');
 terrainGravel??=quarryTexture('gravel').clone();
 const gravel=terrainGravel;
 gravel.repeat.setScalar(46);
 gravel.anisotropy=1;
 moss.anisotropy=1;
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,map:gravel});
 material.onBeforeCompile=shader=>{
  shader.uniforms.quarryMoss={value:moss};
  shader.vertexShader='attribute float quarryGrowth;\nvarying float vQuarryGrowth;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n vQuarryGrowth = quarryGrowth;');
  shader.fragmentShader='uniform sampler2D quarryMoss;\nvarying float vQuarryGrowth;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec4 quarryAlbedo = mix(texture2D(map,vMapUv),texture2D(quarryMoss,vMapUv),vQuarryGrowth);
   diffuseColor *= quarryAlbedo;
  `);
 };
 return material;
}

export function quarrySpruce(){
 if(spruce)return spruce;
 const image=document.getElementById('quarry-spruce');
 if(!image?.naturalWidth)return null;
 const map=new T.Texture(image);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;map.needsUpdate=true;
 const material=new T.MeshStandardMaterial({map,alphaTest:.48,side:T.DoubleSide,roughness:1});
 const geometry=new T.PlaneGeometry(1.43,2.33).translate(0,1.165,0).rotateX(-1.026);
 spruce={material,geometry};
 return spruce;
}

// Subtle grain and oxidation break up broad, otherwise uniform machine surfaces.
function paintWeathering(canvas,kind){
 const ctx=canvas.getContext('2d');
 let seed=7291;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 ctx.fillStyle=kind==='timber'?'rgba(170,148,120,.82)':'rgba(145,148,146,.76)';
 ctx.fillRect(0,0,512,512);
 for(let i=0;i<1700;i++){
  const x=random()*512,y=random()*512;
  ctx.strokeStyle=kind==='timber'?`rgba(65,48,32,${.025+random()*.09})`:`rgba(65,53,43,${.015+random()*.065})`;
  ctx.lineWidth=.4+random()*.8;
  ctx.beginPath();ctx.moveTo(x,y);
  ctx.lineTo(x+(kind==='timber'?random()*3:random()*12),y+random()*(kind==='timber'?85:8));ctx.stroke();
 }
}
