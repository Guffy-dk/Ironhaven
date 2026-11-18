// Neutral weathering preserves texture relief without tinting every trade brown.
export function weatheredPaint(material,strength=.48){
 material.onBeforeCompile=shader=>{
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
   vec4 paintTexel=texture2D(map,vMapUv);
   float patina=dot(paintTexel.rgb,vec3(.2126,.7152,.0722));
   diffuseColor.rgb*=mix(1.,patina,${strength});
   diffuseColor.a*=paintTexel.a;
  #endif`);
 };
 material.customProgramCacheKey=()=> 'industrial-paint-v1:'+strength;
 return material;
}
