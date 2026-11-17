import * as T from './vendor/three.module.js';
import {authoredHostile} from './authored-meshes.js';
import {hostileKind} from './shared/hostiles.js';
import {isInLighthouseBeam} from './shared/lighthouse.js';

const prototypes=new Map();
let grain;
function surface(){
 if(grain)return grain;
 const size=128,data=new Uint8Array(size*size*4);
 let seed=91471;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const v=Math.round(205+(seed/4294967296)*38+Math.sin(x*.8+Math.sin(y*.13)*5)*8),i=(y*size+x)*4;
  data[i]=data[i+1]=data[i+2]=v;data[i+3]=255;
 }
 grain=new T.DataTexture(data,size,size);grain.wrapS=grain.wrapT=T.RepeatWrapping;
 grain.magFilter=T.LinearFilter;grain.minFilter=T.LinearMipmapLinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
 return grain;
}
// Rigid body and appendage meshes are authored and exported by Blender.
// Socket metadata stays in simulation coordinates for deterministic gait interpolation.
function build(kind){
 let sockets=[],armSockets=[],height=0,frequency=7;
 if(kind==='runner'||kind==='guard'){
  const guard=kind==='guard',r=guard?.43:.25,h=guard?.39:.2,n=guard?4:3;
  for(const side of [-1,1])for(let i=0;i<n;i++)sockets.push({x:side*r*.7,y:h-.045,z:(i-(n-1)/2)*r*.52,side,angle:(i-(n-1)/2)*.35,phase:i*Math.PI*.65+(side<0?0:Math.PI)});
  frequency=guard?5:12;
 }else if(kind==='drowned'){
  height=.015;frequency=4.5;
  sockets=[{x:-.075,y:.35,z:0,side:1,phase:0},{x:.075,y:.35,z:0,side:1,phase:Math.PI}];
  armSockets=[{x:-.145,y:.63,z:0,side:-1,phase:Math.PI},{x:.145,y:.63,z:0,side:1,phase:0}];
 }else if(kind==='spitter'){
  frequency=5;
  sockets=[{x:-.15,y:.08,z:.17,side:-1,phase:0},{x:.15,y:.08,z:.17,side:1,phase:Math.PI},{x:-.1,y:.05,z:-.38,side:-1,phase:Math.PI},{x:.1,y:.05,z:-.38,side:1,phase:0}];
 }else{
  frequency=2.7;
  sockets=[{x:-.22,y:1.28,z:-.1,side:-1,phase:0},{x:.22,y:1.28,z:-.1,side:1,phase:Math.PI},{x:-.2,y:1.28,z:.14,side:-1,angle:.5,phase:Math.PI},{x:.2,y:1.28,z:.14,side:1,angle:.5,phase:0}];
  armSockets=[{x:-.3,y:1.64,z:.08,side:-1,phase:0},{x:.3,y:1.64,z:.08,side:1,phase:Math.PI}];
 }
 const material=new T.MeshStandardMaterial({vertexColors:true,map:surface(),bumpMap:surface(),bumpScale:.009,roughness:kind==='drowned'?.84:.48,metalness:0});
 const rigid={body:authoredHostile(kind,'body'),limbs:authoredHostile(kind,'limbs'),arms:authoredHostile(kind,'arms')};
 return {...rigid,low:Object.fromEntries(Object.keys(rigid).map(part=>[part,authoredHostile(kind,part,true)])),sockets,armSockets,height,frequency,material};
}
export function hostilePrototype(kind){
 if(!['runner','drowned','guard','spitter','walker'].includes(kind))throw Error('Unknown hostile species');
 if(!prototypes.has(kind))prototypes.set(kind,build(kind));return prototypes.get(kind);
}
export class CoastalHostiles{
 constructor(scene,capacity=500){
  this.object=new T.Group();this.object.name='coastal-hostiles';scene.add(this.object);this.capacity=capacity;
  this.pose=new T.Object3D();this.root=new T.Matrix4();this.tint=new T.Color();this.headings=new Map();
  this.species=new Map();
  for(const kind of ['runner','drowned','guard','spitter','walker']){
   const p=hostilePrototype(kind),meshes={};
   for(const [part,multiplier] of [['body',1],['limbs',p.sockets.length],['arms',p.armSockets.length]]){
    if(!p[part]||!multiplier)continue;
    const mesh=new T.InstancedMesh(p[part],p.material,capacity*multiplier);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;
    // Moving swarms don't invalidate the cached static-building shadow atlas.
    this.object.add(mesh);meshes[part]=mesh;
   }
   this.species.set(kind,{prototype:p,meshes,count:0});
  }
 }
 sync(enemies,time,dt,beam,position,motion,bounds){
  const low=!!bounds?.low||enemies.length>100||bounds?.zoom>18;
  for(const group of this.species.values()){group.count=0;for(const [part,mesh] of Object.entries(group.meshes))mesh.geometry=low?group.prototype.low[part]:group.prototype[part];}
  const next=new Map();
  for(const e of enemies.slice(0,this.capacity)){
   if(bounds&&(Math.abs(e.x-bounds.x)>bounds.rx||Math.abs(e.z-bounds.z)>bounds.rz))continue;
   const kind=hostileKind(e),group=this.species.get(kind),p=group.prototype,index=group.count++,at=position(e),old=this.headings.get(e.id),previous=motion?.previous.get(e.id);
   const moving=previous&&Math.hypot(e.x-previous.x,e.z-previous.z)>.0001;
   const target=moving?Math.atan2(e.x-previous.x,e.z-previous.z):old??Math.atan2(-e.x,-e.z);
   const angle=old===undefined?target:old+Math.atan2(Math.sin(target-old),Math.cos(target-old))*(1-Math.exp(-dt*12));next.set(e.id,angle);
   const phase=time*p.frequency+e.id*.73,bob=Math.sin(phase)*.008;
   this.pose.position.set(at.x,p.height+bob,at.z);this.pose.rotation.set(0,angle,0);this.pose.scale.setScalar(1);this.pose.updateMatrix();this.root.copy(this.pose.matrix);
   const visible=isInLighthouseBeam(beam,at);this.tint.setScalar(visible?1.28:.88);
   group.meshes.body.setMatrixAt(index,this.root);group.meshes.body.setColorAt(index,this.tint);
   for(const [part,sockets] of [['limbs',p.sockets],['arms',p.armSockets]]){
    const mesh=group.meshes[part];if(!mesh)continue;
    sockets.forEach((socket,i)=>{
     const stride=Math.sin(phase+socket.phase)*(moving?.28:.035);
     this.pose.position.set(socket.x,socket.y,socket.z);
     this.pose.rotation.set(stride,socket.angle||0,kind==='drowned'?socket.side*.07:stride*.15);
     if(socket.side<0)this.pose.rotation.y+=Math.PI;
     this.pose.scale.setScalar(1);this.pose.updateMatrix();this.pose.matrix.premultiply(this.root);
     mesh.setMatrixAt(index*sockets.length+i,this.pose.matrix);mesh.setColorAt(index*sockets.length+i,this.tint);
    });
   }
  }
  this.headings=next;
  for(const {prototype:p,meshes,count} of this.species.values())for(const [part,mesh] of Object.entries(meshes)){
   mesh.count=count*(part==='body'?1:part==='limbs'?p.sockets.length:p.armSockets.length);mesh.visible=mesh.count>0;
   if(mesh.count){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
  }
 }
}
