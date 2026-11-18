import * as T from './vendor/three.module.js';
// A narrow silhouette rim, shared by structures; terrain keeps its natural edges.
export const outlineMaterial=new T.ShaderMaterial({
 uniforms:{width:{value:.012}},side:T.BackSide,transparent:true,depthWrite:false,
 vertexShader:'uniform float width; void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position+normal*width,1.);}',
 fragmentShader:'void main(){gl_FragColor=vec4(.035,.055,.06,.88);}'
});
export function outlineBuilding(group){
 const parts=[];group.traverse(o=>{if(o.isMesh&&!o.name.startsWith('arrow-')&&o.name!=='roof-level'&&!o.material?.transparent&&o.geometry.attributes.normal)parts.push(o);});
 for(const source of parts){const edge=new T.Mesh(source.geometry,outlineMaterial);edge.name='structure-outline';edge.raycast=()=>{};source.add(edge);}
 return group;
}
