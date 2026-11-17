import * as T from './vendor/three.module.js';
let material;
export function conveyorSurface(){
 if(material)return material;
 material=new T.MeshStandardMaterial({color:0x242b29,roughness:.88,metalness:.1,side:T.DoubleSide});
 material.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec2 vBeltMark;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vBeltMark=uv;');
  shader.fragmentShader='varying vec2 vBeltMark;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   float lane=abs(vBeltMark.y-.5),cell=fract(vBeltMark.x*3.);
   float stroke=abs(cell-(.63-lane*.75));
   float aa=max(fwidth(cell),.012);
   float mark=(1.-smoothstep(.045,.045+aa,stroke))*(1.-smoothstep(.32,.43,lane));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.83,.86,.77),mark);
  `);
 };
 material.customProgramCacheKey=()=> 'rubber-belt-direction-v1';return material;
}
