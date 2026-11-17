import * as T from './vendor/three.module.js';
let atlas;
function texture(){
 if(atlas)return atlas;
 const image=typeof document==='undefined'?null:document.getElementById('coastal-surfaces');
 if(image){atlas=new T.Texture(image);atlas.colorSpace=T.SRGBColorSpace;atlas.anisotropy=8;
  const loaded=()=>{atlas.needsUpdate=true;};if(image.complete&&image.naturalWidth)loaded();else image.addEventListener('load',loaded,{once:true});
 }else{atlas=new T.DataTexture(new Uint8Array([220,220,220,255]),1,1);atlas.needsUpdate=true;}
 return atlas;
}
function sourceTexture(id,color=false){
 const image=typeof document==='undefined'?null:document.getElementById(id);
 const texture=image?new T.Texture(image):new T.DataTexture(new Uint8Array([128,128,255,255]),1,1);
 if(color)texture.colorSpace=T.SRGBColorSpace;
 texture.anisotropy=8;texture.flipY=true;
 if(image){const loaded=()=>texture.needsUpdate=true;if(image.complete&&image.naturalWidth)loaded();else image.addEventListener('load',loaded,{once:true});}else texture.needsUpdate=true;
 return texture;
}
const sources=new Map();
function sourceMaps(){if(!sources.size)for(const kind of ['crab','horror'])for(const map of ['color','normal'])sources.set(kind+'-'+map,sourceTexture(kind+'-'+map,map==='color'));return sources;}
export function coastalMaterial(){
 const maps=sourceMaps(),map=texture(),material=new T.MeshStandardMaterial({vertexColors:true,map,bumpMap:map,bumpScale:.007,roughness:.6,normalMap:maps.get('crab-normal')});
 material.onBeforeCompile=shader=>{
  shader.uniforms.coastalTime={value:0};material.userData.shader=shader;
  for(const [name,tex] of maps)shader.uniforms[name.replace('-','') ]={value:tex};
  shader.vertexShader='uniform float coastalTime; attribute float coastalSurface; varying float vCoastalSurface;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vCoastalSurface=coastalSurface;\n if(coastalSurface>4.5&&coastalSurface<5.5){float leg=clamp((abs(position.x)-.16)*6.,0.,1.);float wave=sin(coastalTime*7.+position.z*18.+sign(position.x)*1.57); transformed.z+=wave*.025*leg;transformed.y+=max(0.,wave)*.022*leg;}');
  const helper=`uniform sampler2D crabcolor; uniform sampler2D crabnormal; uniform sampler2D horrorcolor; uniform sampler2D horrornormal; varying float vCoastalSurface;
   vec2 coastalUv(vec2 uv){float id=clamp(floor(vCoastalSurface+.1),0.,3.);vec2 cell=vec2(mod(id,2.),1.-floor(id/2.));
    float repeatScale=id==1.?1.15:id==2.?1.7:2.1;
    return (cell+vec2(.012)+fract(uv*repeatScale)*.976)*.5;
   }\n`;
  shader.fragmentShader=helper+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
   `if(vCoastalSurface>4.5){
    vec3 sourceColor=(vCoastalSurface<5.5?texture2D(crabcolor,vMapUv):texture2D(horrorcolor,vMapUv)).rgb;
    float luma=dot(sourceColor,vec3(.2126,.7152,.0722));
    sourceColor=vCoastalSurface<5.5?mix(sourceColor*.26,vec3(.34,.29,.18)*luma*2.,.86):sourceColor*vec3(.47,.56,.48);
    diffuseColor*=vec4(sourceColor,1.);
   }else diffuseColor *= vCoastalSurface>3.5?vec4(1.):texture2D(map,coastalUv(vMapUv));`);
  const bump=T.ShaderChunk.bumpmap_pars_fragment
   .replaceAll('texture2D( bumpMap, vBumpMapUv + dSTdx )','texture2D( bumpMap, coastalUv(vBumpMapUv + dSTdx) )')
   .replaceAll('texture2D( bumpMap, vBumpMapUv + dSTdy )','texture2D( bumpMap, coastalUv(vBumpMapUv + dSTdy) )')
   .replaceAll('texture2D( bumpMap, vBumpMapUv )','texture2D( bumpMap, coastalUv(vBumpMapUv) )');
  shader.fragmentShader=shader.fragmentShader.replace('#include <bumpmap_pars_fragment>',bump);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',
   `if(vCoastalSurface>4.5){vec3 mapN=(vCoastalSurface<5.5?texture2D(crabnormal,vNormalMapUv):texture2D(horrornormal,vNormalMapUv)).xyz*2.-1.;normal=normalize(tbn*mapN);}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',
   'float roughnessFactor=vCoastalSurface>4.5?.68:vCoastalSurface>3.5?.15:vCoastalSurface>1.5&&vCoastalSurface<2.5?.87:vCoastalSurface<.5?.53:.43;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',
   '#include <emissivemap_fragment>\n if(vCoastalSurface>3.5&&vCoastalSurface<4.5)totalEmissiveRadiance+=vec3(.2,.16,.09);');
 };
 material.customProgramCacheKey=()=> 'coastal-pbr-uv-anatomy-v3';return material;
}
