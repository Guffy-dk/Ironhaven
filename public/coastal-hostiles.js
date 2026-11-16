import * as T from './vendor/three.module.js';
import {hostileKind} from './shared/hostiles.js';
import {isInLighthouseBeam} from './shared/lighthouse.js';

const prototypes=new Map();
const shell=0x70644a,bone=0xaca58a,skin=0x9daba0,cloth=0x35474c,rust=0x70553e;
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
// Merge sculpted rigid parts once per species; every swarm shares these geometries.
function sculpt(parts){
 const positions=[],normals=[],colors=[],uv=[];
 const point=new T.Vector3(),normal=new T.Vector3(),m=new T.Matrix4(),n=new T.Matrix3();
 for(const {geometry,color,position=[0,0,0],scale=[1,1,1],rotation=[0,0,0]} of parts){
  m.compose(new T.Vector3(...position),new T.Quaternion().setFromEuler(new T.Euler(...rotation)),new T.Vector3(...scale));n.getNormalMatrix(m);
  const g=geometry.index?geometry.toNonIndexed():geometry,c=new T.Color(color),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
   point.fromBufferAttribute(p,i).applyMatrix4(m);normal.fromBufferAttribute(g.attributes.normal,i).applyNormalMatrix(n);
   const wear=.92+.08*Math.sin(point.y*39+point.z*28)*Math.cos(point.x*35);
   positions.push(point.x,point.y,point.z);normals.push(normal.x,normal.y,normal.z);
   colors.push(c.r*wear,c.g*wear,c.b*wear);uv.push(point.x*2+point.z,point.y*2+point.z);
  }
  if(g!==geometry)g.dispose();geometry.dispose();
 }
 const result=new T.BufferGeometry();
 for(const [name,array,size] of [['position',positions,3],['normal',normals,3],['color',colors,3],['uv',uv,2]])result.setAttribute(name,new T.Float32BufferAttribute(array,size));
 result.computeBoundingSphere();return result;
}
const ellipsoid=(color,x,y,z,rx,ry,rz)=>({geometry:new T.SphereGeometry(1,24,16),color,position:[x,y,z],scale:[rx,ry,rz]});
function rod(color,a,b,r1,r2=r1){
 const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);
 const q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());
 return {geometry:new T.CylinderGeometry(r2,r1,delta.length(),12),color,position:start.add(end).multiplyScalar(.5).toArray(),rotation:new T.Euler().setFromQuaternion(q).toArray().slice(0,3)};
}
function barnacles(parts,cx,cy,cz,spread,count){
 for(let i=0;i<count;i++){
  const a=i*2.39996,r=spread*Math.sqrt((i+.5)/count),x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;
  parts.push({geometry:new T.TorusGeometry(.012+(i%3)*.004,.006,5,9),color:i%2?bone:0x807e6b,position:[x,cy+.014*Math.sin(i*3),z],rotation:[Math.PI/2,0,0]});
 }
}
function build(kind){
 const body=[],limbs=[],arms=[];let sockets=[],armSockets=[],height=0,frequency=7;
 if(kind==='runner'||kind==='guard'){
  const guard=kind==='guard',r=guard?.43:.25,h=guard?.39:.2;
  body.push(ellipsoid(shell,0,h,0,r,guard?.18:.105,r*.88),ellipsoid(0x393d32,0,h-.06,.1,r*.76,.08,r*.7));
  for(let i=0;i<5;i++)body.push(ellipsoid(i%2?0x857553:0x5a513c,0,h+.06+i*.012,(i-2)*r*.29,r*(.85-Math.abs(i-2)*.09),.04,.04));
  for(const side of [-1,1]){
   body.push(rod(0x34362d,[side*r*.48,h,.17],[side*r*.6,h+.07,r*.8],.018),ellipsoid(0x151c18,side*r*.6,h+.075,r*.8,.023,.02,.022));
   const claw=side*r*.95;
   body.push(rod(rust,[side*r*.7,h-.05,.12],[claw,h-.02,r*.9],guard?.055:.026),ellipsoid(shell,claw,h-.02,r*1.1,r*.32,r*.18,r*.35));
   body.push(ellipsoid(bone,claw+side*.025,h-.01,r*1.37,r*.15,r*.08,r*.16));
  }
  barnacles(body,0,h+(guard?.17:.1),0,r*.72,guard?28:10);
  const legLength=guard?.47:.3;
  limbs.push(rod(rust,[0,0,0],[.15,.09,.02],.032,.023),rod(shell,[.15,.09,.02],[legLength,-h+.04,.07],.023,.009),ellipsoid(bone,.15,.09,.02,.03,.028,.028));
  const n=guard?4:3;
  for(const side of [-1,1])for(let i=0;i<n;i++)sockets.push({x:side*r*.7,y:h-.045,z:(i-(n-1)/2)*r*.52,side,angle:(i-(n-1)/2)*.35,phase:i*Math.PI*.65+(side<0?0:Math.PI)});
  frequency=guard?5:12;
 }else if(kind==='drowned'){
  height=.015;frequency=4.5;
  body.push(ellipsoid(cloth,0,.49,0,.14,.25,.1),ellipsoid(0x263c40,0,.34,-.015,.17,.13,.12),ellipsoid(skin,0,.79,.055,.085,.11,.078));
  body.push(ellipsoid(0x42473c,0,.875,.025,.105,.035,.09),ellipsoid(0x151d1b,0,.79,.125,.057,.025,.012));
  body.push(rod(bone,[-.04,.74,.12],[-.03,.7,.13],.008),rod(0x6f6d42,[-.12,.66,.03],[-.15,.27,.04],.011,.004));
  for(let i=0;i<4;i++)body.push(ellipsoid(0x82755a,0,.39+i*.06,.104,.008,.008,.005));
  limbs.push(rod(0x3d4540,[0,0,0],[.015,-.19,.015],.048,.04),rod(0x3c413b,[.015,-.19,.015],[0,-.32,.04],.038,.027),ellipsoid(0x26302d,0,-.33,.06,.045,.045,.085));
  arms.push(rod(cloth,[0,0,0],[.02,-.16,.045],.045,.035),rod(cloth,[.02,-.16,.045],[.03,-.3,.12],.034,.022),ellipsoid(skin,.03,-.31,.14,.028,.05,.024));
  sockets=[{x:-.075,y:.35,z:0,side:1,phase:0},{x:.075,y:.35,z:0,side:1,phase:Math.PI}];
  armSockets=[{x:-.145,y:.63,z:0,side:-1,phase:Math.PI},{x:.145,y:.63,z:0,side:1,phase:0}];
 }else if(kind==='spitter'){
  frequency=5;
  body.push(ellipsoid(skin,0,.21,-.04,.24,.19,.43),ellipsoid(0xc3c8b3,0,.43,.29,.13,.29,.15),ellipsoid(0x7e957d,0,.44,.42,.15,.19,.12),ellipsoid(skin,0,.7,.35,.12,.09,.13));
  body.push(ellipsoid(0x29372e,0,.71,.465,.06,.035,.008));
  for(const side of [-1,1])body.push(ellipsoid(0x27322c,side*.075,.74,.415,.015,.015,.016));
  limbs.push(ellipsoid(0x8a9a8f,.14,-.03,.08,.22,.04,.09));
  sockets=[{x:-.15,y:.08,z:.17,side:-1,phase:0},{x:.15,y:.08,z:.17,side:1,phase:Math.PI},{x:-.1,y:.05,z:-.38,side:-1,phase:Math.PI},{x:.1,y:.05,z:-.38,side:1,phase:0}];
 }else{
  frequency=2.7;
  body.push(ellipsoid(0x6c7464,0,1.44,0,.31,.37,.23),ellipsoid(0x777361,0,1.82,.1,.19,.2,.17));
  for(let i=0;i<5;i++)body.push(rod(bone,[-.28,1.33+i*.095,.04],[.28,1.35+i*.095,.05],.02));
  body.push(ellipsoid(0xd5ccb1,0,1.86,.263,.031,.025,.01));
  barnacles(body,0,1.76,0,.25,22);
  limbs.push(rod(rust,[0,0,0],[.28,-.54,.04],.05,.032),ellipsoid(bone,.28,-.54,.04,.055,.06,.05),rod(0x7b806c,[.28,-.54,.04],[.42,-1.25,.12],.03,.012));
  arms.push(rod(0x5d6b5d,[0,0,0],[.13,-.48,.1],.035,.025),rod(bone,[.13,-.48,.1],[.17,-.91,.2],.024,.012));
  for(let i=0;i<3;i++)arms.push(rod(rust,[.17,-.91,.2],[.15+i*.04,-1.04,.26],.009,.003));
  sockets=[{x:-.22,y:1.28,z:-.1,side:-1,phase:0},{x:.22,y:1.28,z:-.1,side:1,phase:Math.PI},{x:-.2,y:1.28,z:.14,side:-1,angle:.5,phase:Math.PI},{x:.2,y:1.28,z:.14,side:1,angle:.5,phase:0}];
  armSockets=[{x:-.3,y:1.64,z:.08,side:-1,phase:0},{x:.3,y:1.64,z:.08,side:1,phase:Math.PI}];
  for(let i=0;i<8;i++)body.push(rod(i%2?0x4c5540:rust,[(i-3.5)*.055,1.75,-.18],[(i-3.5)*.068,.87+(i%3)*.08,-.2],.007,.003));
 }
 const material=new T.MeshStandardMaterial({vertexColors:true,map:surface(),bumpMap:surface(),bumpScale:.009,roughness:kind==='drowned'?.84:.48,metalness:0});
 return {body:sculpt(body),limbs:sculpt(limbs),arms:arms.length?sculpt(arms):null,sockets,armSockets,height,frequency,material};
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
 sync(enemies,time,dt,beam,position,motion){
  for(const group of this.species.values())group.count=0;
  const next=new Map();
  for(const e of enemies.slice(0,this.capacity)){
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
