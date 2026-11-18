import * as T from './vendor/three.module.js';
const CHUNK=24,DYNAMIC_PARTS=new Set(['head','rotor','lantern','cargoCapsule','dispatchDial']);
// Keep original meshes as picking/inspection proxies; batch repeated static workshop parts.
export class StructureInstances{
 constructor(scene){this.scene=scene;this.batches=new Map();this.hidden=[];}
 sync(buildings){
  for(const {mesh,visible}of this.hidden){mesh.visible=visible;delete mesh.userData.staticInstanceProxy;}this.hidden=[];
  const groups=new Map();
  for(const root of buildings.values()){
   if(!root.userData.authored)continue;root.updateWorldMatrix(true,true);
   const chunk=Math.floor(root.position.x/CHUNK)+','+Math.floor(root.position.z/CHUNK);
   root.traverse(mesh=>{
    if(!mesh.isMesh||!mesh.visible||Array.isArray(mesh.material))return;
    if(mesh.material.transparent&&mesh.name!=='structure-outline')return;
    for(let parent=mesh;parent&&parent!==root;parent=parent.parent)if(DYNAMIC_PARTS.has(parent.name))return;
    const key=[chunk,mesh.geometry.uuid,mesh.material.uuid,+mesh.castShadow,+mesh.receiveShadow].join(':');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push(mesh);
   });
  }
  const used=new Set();
  for(const [key,parts]of groups){
   if(parts.length<2)continue;used.add(key);let batch=this.batches.get(key);
   if(!batch||batch.instanceMatrix.count<parts.length){
    if(batch){this.scene.remove(batch);batch.dispose();}
    const source=parts[0],capacity=2**Math.ceil(Math.log2(parts.length));batch=new T.InstancedMesh(source.geometry,source.material,capacity);batch.name='static-workshop-batch';batch.castShadow=source.castShadow;batch.receiveShadow=source.receiveShadow;batch.raycast=()=>{};batch.instanceMatrix.setUsage(T.DynamicDrawUsage);this.scene.add(batch);this.batches.set(key,batch);
   }
   batch.count=parts.length;
   parts.forEach((mesh,i)=>{batch.setMatrixAt(i,mesh.matrixWorld);this.hidden.push({mesh,visible:mesh.visible});mesh.visible=false;mesh.userData.staticInstanceProxy=true;});
   batch.instanceMatrix.needsUpdate=true;batch.computeBoundingSphere();
  }
  for(const [key,batch]of this.batches)if(!used.has(key)){this.scene.remove(batch);batch.dispose();this.batches.delete(key);}
 }
}
