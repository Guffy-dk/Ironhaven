import * as T from './vendor/three.module.js';
import {coastalMaterial} from './coastal-material.js';
import {authoredHostile} from './authored-meshes.js';
import {actorElevation,coastalLand} from './shared/coast.js';
import {hostileKind} from './shared/hostiles.js';
import {isInLighthouseBeam} from './shared/lighthouse.js';

const prototypes=new Map();
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
 const material=coastalMaterial();
 const rigid={body:authoredHostile(kind,'body'),limbs:authoredHostile(kind,'limbs'),arms:authoredHostile(kind,'arms'),lowerLimbs:authoredHostile(kind,'lowerLimbs'),forearms:authoredHostile(kind,'forearms'),clawLeft:authoredHostile(kind,'clawLeft'),clawRight:authoredHostile(kind,'clawRight')};
 return {...rigid,low:Object.fromEntries(Object.keys(rigid).map(part=>[part,authoredHostile(kind,part,true)])),sockets,armSockets,height,frequency,material,knee:kind==='drowned'?[.015,-.19,.015]:kind==='walker'?[.26,-.52,.035]:[.19,.09,.025],elbow:kind==='drowned'?[.027,-.19,.08]:[.13,-.48,.1]};
}
export function hostilePrototype(kind){
 if(!['runner','drowned','guard','spitter','walker'].includes(kind))throw Error('Unknown hostile species');
 if(!prototypes.has(kind))prototypes.set(kind,build(kind));return prototypes.get(kind);
}
export class CoastalHostiles{
 constructor(scene,capacity=500){
  this.object=new T.Group();this.object.name='coastal-hostiles';scene.add(this.object);this.capacity=capacity;
  this.pose=new T.Object3D();this.segment=new T.Object3D();this.root=new T.Matrix4();this.tint=new T.Color();this.headings=new Map();
  const data=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.max(0,1-r)**2*125);}
  const shadowMap=new T.DataTexture(data,64,64);shadowMap.needsUpdate=true;shadowMap.magFilter=T.LinearFilter;
  this.contact=new T.InstancedMesh(new T.PlaneGeometry(1,1).rotateX(-Math.PI/2),new T.MeshBasicMaterial({map:shadowMap,color:0x101912,transparent:true,depthWrite:false}),capacity);this.contact.frustumCulled=false;this.contact.renderOrder=1;this.contact.count=0;this.object.add(this.contact);
  this.species=new Map();
  for(const kind of ['runner','drowned','guard','spitter','walker']){
   const p=hostilePrototype(kind),meshes={};
   for(const [part,multiplier] of [['body',1],['limbs',p.sockets.length],['lowerLimbs',p.sockets.length],['arms',p.armSockets.length],['forearms',p.armSockets.length],['clawLeft',1],['clawRight',1]]){
    if(!p[part]||!multiplier)continue;
    const mesh=new T.InstancedMesh(p[part],p.material,capacity*multiplier);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=true;
    // Nearby high-quality creatures contribute actual articulated shadows.
    this.object.add(mesh);meshes[part]=mesh;
   }
   this.species.set(kind,{prototype:p,meshes,count:0,ids:[]});
  }
 }
 pick(ray){const targets=[...this.species.values()].map(group=>group.meshes.body).filter(mesh=>mesh.visible);const hit=ray.intersectObjects(targets,false)[0];if(!hit)return null;for(const group of this.species.values())if(group.meshes.body===hit.object)return group.ids[hit.instanceId];return null;}
 sync(enemies,time,dt,beam,position,motion,bounds){
  const low=!!bounds?.low||(!bounds?.inspect&&(enemies.length>100||bounds?.zoom>18)),castShadows=!low;
  for(const group of this.species.values()){if(group.prototype.material.userData.shader)group.prototype.material.userData.shader.uniforms.coastalTime.value=time;group.count=0;group.ids=[];for(const [part,mesh] of Object.entries(group.meshes)){mesh.geometry=low?group.prototype.low[part]:group.prototype[part];mesh.castShadow=castShadows;}}
  const next=new Map(),seen=new Map(),alive=new Set();let contactCount=0;
  // Presentation only: flinches, lunges and falls never feed back into the simulation.
  this.lastHp??=new Map();this.flinch??=new Map();this.corpses??=[];this.lastSeen??=new Map();
  const step=Math.max(0,Math.min(.1,dt||0));
  for(const e of enemies)alive.add(e.id);
  const vanished=[...this.lastSeen.keys()].filter(id=>!alive.has(id));
  if(vanished.length&&vanished.length<=40)for(const id of vanished){const last=this.lastSeen.get(id);this.corpses.push({...last,age:0});}
  if(this.corpses.length>60)this.corpses.splice(0,this.corpses.length-60);
  const place=(group,p,kind,at,angle,o)=>{
   const index=group.count++;group.ids[index]=o.id??null;
   const forwardX=Math.sin(angle),forwardZ=Math.cos(angle);
   this.pose.rotation.order='YXZ';
   this.pose.position.set(at.x+forwardX*o.push,p.height+o.lift+actorElevation(bounds?.terrain,at.x,at.z),at.z+forwardZ*o.push);
   this.pose.rotation.set(o.pitch,angle,o.roll);this.pose.scale.set(o.wide,o.tall,o.wide);this.pose.updateMatrix();this.root.copy(this.pose.matrix);this.pose.rotation.order='XYZ';
   this.tint.setScalar(o.tint);
   group.meshes.body.setMatrixAt(index,this.root);group.meshes.body.setColorAt(index,this.tint);
   for(const [part,side] of [['clawLeft',-1],['clawRight',1]]){const mesh=group.meshes[part];if(!mesh)continue;const r=kind==='guard'?.44:.25,h=kind==='guard'?.32:.18,attack=o.attack;this.segment.position.set(side*r*.7,h-.05,.15);this.segment.rotation.set(-attack*.3-o.curl*.5,side*(Math.sin(o.phase*.35)*.035+attack*.28),side*attack*.15);this.segment.scale.setScalar(1);this.segment.updateMatrix();this.segment.matrix.premultiply(this.root);mesh.setMatrixAt(index,this.segment.matrix);mesh.setColorAt(index,this.tint);}
   for(const [part,sockets] of [['limbs',p.sockets],['arms',p.armSockets]]){
    const mesh=group.meshes[part];if(!mesh)continue;
    sockets.forEach((socket,i)=>{
     const stride=Math.sin(o.phase+socket.phase)*(o.moving?.28:.035)+(part==='arms'?-o.attack*.9:0);
     this.pose.position.set(socket.x,socket.y,socket.z);
     this.pose.rotation.set(stride+o.curl,socket.angle||0,kind==='drowned'?socket.side*.07:stride*.15);
     if(socket.side<0)this.pose.rotation.y+=Math.PI;
     this.pose.scale.setScalar(1);this.pose.updateMatrix();this.pose.matrix.premultiply(this.root);
     mesh.setMatrixAt(index*sockets.length+i,this.pose.matrix);mesh.setColorAt(index*sockets.length+i,this.tint);
     const lower=group.meshes[part==='limbs'?'lowerLimbs':'forearms'];
     if(lower){
      this.segment.position.set(...(part==='limbs'?p.knee:p.elbow));
      const lift=Math.max(0,Math.sin(o.phase+socket.phase))*(o.moving?1:0);
      this.segment.rotation.set((part==='arms'?-.15+stride*.4:kind==='drowned'?lift*.8:0)+o.curl*.8,0,part==='limbs'&&kind!=='drowned'?lift*.42:0);
      this.segment.scale.setScalar(1);this.segment.updateMatrix();this.segment.matrix.premultiply(this.pose.matrix);
      lower.setMatrixAt(index*sockets.length+i,this.segment.matrix);lower.setColorAt(index*sockets.length+i,this.tint);
     }
    });
   }
  };
  for(const e of enemies.slice(0,this.capacity)){
   if(bounds&&(Math.abs(e.x-bounds.x)>bounds.rx||Math.abs(e.z-bounds.z)>bounds.rz))continue;
   const kind=hostileKind(e),group=this.species.get(kind),p=group.prototype,at=position(e),old=this.headings.get(e.id),previous=motion?.previous.get(e.id);
   if(coastalLand(bounds?.terrain,at.x,at.z,0)){const radius=kind==='walker'?.85:kind==='guard'?.7:kind==='runner'?.45:.4;this.segment.position.set(at.x,actorElevation(bounds?.terrain,at.x,at.z)+.003,at.z);this.segment.rotation.set(0,Math.atan2(-e.x,-e.z),0);this.segment.scale.set(radius*2,1,radius*1.6);this.segment.updateMatrix();this.contact.setMatrixAt(contactCount++,this.segment.matrix);}
   const moving=previous&&Math.hypot(e.x-previous.x,e.z-previous.z)>.0001;
   const target=moving?Math.atan2(e.x-previous.x,e.z-previous.z):old??Math.atan2(-e.x,-e.z);
   const angle=old===undefined?target:old+Math.atan2(Math.sin(target-old),Math.cos(target-old))*(1-Math.exp(-dt*12));next.set(e.id,angle);
   const phase=time*p.frequency+e.id*.73;
   const lastHp=this.lastHp.get(e.id);if(lastHp!==undefined&&e.hp<lastHp-1e-6)this.flinch.set(e.id,.22);
   const flinch=Math.max(0,(this.flinch.get(e.id)??0)-step);if(flinch>0)this.flinch.set(e.id,flinch);else this.flinch.delete(e.id);
   const hit=flinch/.22,attack=Math.max(0,Math.min(1,((e.cooldown||0)-.35)/.65)),lunge=Math.sin(attack*Math.PI);
   const visible=e.illuminated||isInLighthouseBeam(beam,at);
   const gait=moving?Math.abs(Math.sin(phase)):0,breath=Math.sin(time*2.1+e.id)*.5+.5;
   place(group,p,kind,at,angle,{id:e.id,phase,moving,attack,curl:0,
    push:lunge*(kind==='walker'?.22:.12)-hit*.07,
    lift:moving?gait*.03:.004+breath*.006,
    pitch:(moving?.07:0)+lunge*.22-hit*.12,
    roll:moving?Math.sin(phase)*.045:0,
    wide:1+hit*.06,tall:(1-hit*.12)*(moving?1:1+breath*.012),
    tint:(visible?1.03:.9)+hit*.55});
   this.lastHp.set(e.id,e.hp);seen.set(e.id,{kind,at:{x:at.x,z:at.z},angle,phase,tint:visible?1.03:.9});
  }
  // Shadow updates follow living hostiles; a falling body fades without forcing shadow re-renders.
  const liveVisible=[...this.species.values()].some(group=>group.count>0);
  // Fallen hostiles topple, curl and sink for about a second before they are gone.
  this.corpses=this.corpses.filter(c=>(c.age+=step)<1.1);
  for(const c of this.corpses){
   const group=this.species.get(c.kind);if(!group||group.count>=this.capacity)continue;
   const t=Math.min(1,c.age/1.1),fall=1-(1-Math.min(1,t*2.2))**3;
   place(group,group.prototype,c.kind,c.at,c.angle,{id:null,phase:c.phase,moving:false,attack:0,curl:fall*.9,
    push:0,lift:-fall*.12-t*t*.25,pitch:-fall*.25,roll:fall*1.25,wide:1-t*t*.35,tall:1-t*t*.45,tint:c.tint*(1-t*.45)});
  }
  for(const id of this.lastHp.keys())if(!alive.has(id)){this.lastHp.delete(id);this.flinch.delete(id);}
  this.lastSeen=seen;
  this.contact.count=contactCount;this.contact.visible=contactCount>0;if(contactCount)this.contact.instanceMatrix.needsUpdate=true;
  this.hasVisible=liveVisible;
  const dynamic=castShadows&&this.hasVisible;this.shadowCastersChanged=this.castShadows!==castShadows||this.hasDynamicShadows!==dynamic;this.castShadows=castShadows;this.hasDynamicShadows=dynamic;
  this.headings=next;
  for(const {prototype:p,meshes,count} of this.species.values())for(const [part,mesh] of Object.entries(meshes)){
   mesh.count=count*(part==='body'||part==='clawLeft'||part==='clawRight'?1:part==='limbs'||part==='lowerLimbs'?p.sockets.length:p.armSockets.length);mesh.visible=mesh.count>0;
   if(mesh.count){mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor.needsUpdate=true;}
  }
 }
}
