import * as T from './vendor/three.module.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
// Nordic summer harbour (owner decision, 25 Nov 2026): daylight, CC0 PBR ground and a summer sky.
// Art ships as files under ./assets (see assets/manifest.json); everything degrades gracefully
// to the built-in look if a file is missing.

export const SUMMER_TERRAIN=['terrain-grass','terrain-meadow','terrain-sand','terrain-granite','terrain-gravel'];
const canLoad=()=>typeof window!=='undefined'&&typeof Image!=='undefined';
const textures=new Map();

export function pbrSet(id,{repeat=1}={}){
 if(textures.has(id))return textures.get(id);
 const set={id,map:null,normalMap:null,arm:null};
 if(canLoad()){
  const loader=new T.TextureLoader();
  const load=(file,srgb)=>{const t=loader.load(`./assets/textures/${id}/${file}`);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=8;if(srgb)t.colorSpace=T.SRGBColorSpace;return t;};
  set.map=load('color.jpg',true);set.normalMap=load('normal.jpg',false);set.arm=load('arm.jpg',false);
 }
 textures.set(id,set);return set;
}

// Ground: five CC0 surfaces blended per vertex in world space (tiles every TILE units), with a
// per-vertex tint that breaks up repetition. Weights: x meadow, y sand, z granite, w gravel; grass fills the rest.
const TILE=7.5;
export function summerTerrainMaterial(loadSet=pbrSet){
 const sets=SUMMER_TERRAIN.map(id=>loadSet(id));
 const material=new T.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0});
 material.userData.summer=true;
 if(!sets[0].map)return material;
 // Seven samplers only (five colours, one shared normal and ARM map): WebGL guarantees 16 units per
 // shader and shadow maps need several, so a per-surface normal/ARM set would fail to link on real GPUs.
 material.onBeforeCompile=shader=>{
  sets.forEach((set,i)=>{shader.uniforms['tColor'+i]={value:set.map};});
  shader.uniforms.tNormal={value:sets[0].normalMap};shader.uniforms.tArm={value:sets[0].arm};
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 terrainMix;varying vec4 vMix;varying vec2 vGround;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvMix=terrainMix;vGround=(modelMatrix*vec4(position,1.)).xz/'+TILE.toFixed(1)+';');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D tColor0;uniform sampler2D tColor1;uniform sampler2D tColor2;uniform sampler2D tColor3;uniform sampler2D tColor4;uniform sampler2D tNormal;uniform sampler2D tArm;
varying vec4 vMix;varying vec2 vGround;
vec3 groundAt(vec2 uv){vec4 m=clamp(vMix,0.,1.);float g=max(0.,1.-m.x-m.y-m.z-m.w);
 return texture2D(tColor0,uv).rgb*g+texture2D(tColor1,uv*.83).rgb*m.x+texture2D(tColor2,uv*.9).rgb*m.y+texture2D(tColor3,uv*.6).rgb*m.z+texture2D(tColor4,uv*1.2).rgb*m.w;}`)
   .replace('#include <map_fragment>',`vec3 groundColor=groundAt(vGround);
 // Large-scale variation hides texture tiling across the island.
 diffuseColor.rgb*=mix(groundColor,groundAt(vGround*.173+.31),.28);`)
   .replace('#include <roughnessmap_fragment>',`vec3 groundArm=texture2D(tArm,vGround).rgb;float roughnessFactor=roughness*mix(.8,1.,groundArm.g);`)
   .replace('#include <aomap_fragment>',`reflectedLight.indirectDiffuse*=groundArm.r;`)
   .replace('#include <normal_fragment_maps>',`vec3 tn=texture2D(tNormal,vGround).xyz*2.-1.;normal=normalize(normal+(viewMatrix*vec4(tn.x,0.,-tn.y,0.)).xyz*.5);`);
 };
 material.customProgramCacheKey=()=>'summer-terrain-v2';
 return material;
}

// Daylight: warm high sun, a bright sky fill and a summer HDRI for reflections and ambient light.
export function applySummerLight(view){
 view.scene.background=new T.Color(0xa9c6d6);
 view.scene.fog=new T.FogExp2(0xc7d6da,.0032);
 view.sky.color.setHex(0xdcecf6);view.sky.groundColor.setHex(0x6f7a52);view.sky.intensity=1.25;
 view.sun.color.setHex(0xfff0d6);view.sun.intensity=3.1;
 if(view.fill){view.fill.color.setHex(0xb9d2e6);view.fill.intensity=.55;}
 view.renderer.toneMappingExposure=1.0;
 if(view.colorGrade)view.colorGrade.uniforms.strength.value=.45;
 if(canLoad()&&!view.summerSky){
  view.summerSky=true;
  new RGBELoader().load('./assets/sky/sky-summer/sky.hdr',hdr=>{
   const pmrem=new T.PMREMGenerator(view.renderer);
   view.scene.environment=pmrem.fromEquirectangular(hdr).texture;view.scene.environmentIntensity=.55;
   hdr.dispose();pmrem.dispose();
  },undefined,()=>{});
 }
}
