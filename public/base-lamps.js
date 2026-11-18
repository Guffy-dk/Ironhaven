import * as T from './vendor/three.module.js';
import {box,cyl} from './render-primitives.js';
import {quarryTexture} from './quarry-textures.js';
import {LAMP_RADIUS} from './shared/lamps.js';
let prototype;
export function makeLampModel(style='quarry'){
 if(prototype){const clone=prototype.clone(true);clone.getObjectByName('bulb').material=prototype.getObjectByName('bulb').material.clone();if(style!=='quarry')clone.scale.y=.82;return clone;}
 const g=new T.Group();g.userData.type='lamp';
 const metal=new T.MeshStandardMaterial({color:0x69736f,map:quarryTexture('metal'),roughness:.68,metalness:.55});
 const stone=new T.MeshStandardMaterial({color:0x9b9485,map:quarryTexture('gravel'),roughness:.95});
 const foot=box(g,0x787d76,0,.065,0,.43,.13,.43);foot.material=stone;
 const mast=cyl(g,0x68716b,0,.58,0,.037,1.08,24);mast.material=metal;
 for(const y of [.18,.46,.88])cyl(g,0x363e3a,0,y,0,.048,.035,24);
 box(g,0x343f3b,.052,.3,0,.085,.18,.09);box(g,0xa98658,.096,.32,.02,.006,.035,.022);
 for(const x of [-.15,.15])for(const z of [-.15,.15])cyl(g,0xa9a89b,x,.14,z,.018,.026,12);
 const lens=new T.Mesh(new T.CylinderGeometry(.115,.095,.22,24),new T.MeshStandardMaterial({color:0xffdeb1,emissive:0xffbb65,emissiveIntensity:2.5,roughness:.22,metalness:.15}));
 lens.position.y=1.12;lens.name='bulb';g.add(lens);
 for(const y of [.995,1.245])cyl(g,0x353e3a,0,y,0,.15,.035,32);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(g,0x49544d,Math.cos(a)*.119,1.12,Math.sin(a)*.119,.008,.23,8);}
 const hood=new T.Mesh(new T.ConeGeometry(.19,.105,32),metal);hood.position.y=1.31;g.add(hood);
 cyl(g,0x69786c,0,1.375,0,.023,.05,16);
 const cable=new T.CatmullRomCurve3([new T.Vector3(.04,.22,0),new T.Vector3(.07,.6,.01),new T.Vector3(.04,.98,0)]);
 g.add(new T.Mesh(new T.TubeGeometry(cable,12,.009,6,false),new T.MeshStandardMaterial({color:0x202b27,roughness:.9})));
 g.traverse(o=>{if(o.isMesh){o.castShadow=o!==lens;o.receiveShadow=true;}});
 prototype=g.clone(true);if(style!=='quarry')g.scale.y=.82;
 return g;
}
export class BaseLampLights{
 constructor(scene){
  this.scene=scene;this.lights=Array.from({length:8},()=>{const light=new T.PointLight(0xffd29b,16,LAMP_RADIUS+1,1.5);light.intensity=0;scene.add(light);return light;});
  const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);data[i]=255;data[i+1]=211;data[i+2]=150;data[i+3]=Math.round(Math.max(0,1-r)**2*35);}
  const texture=new T.DataTexture(data,32,32);texture.needsUpdate=true;texture.magFilter=T.LinearFilter;
  this.geometry=new T.PlaneGeometry(LAMP_RADIUS*2,LAMP_RADIUS*2).rotateX(-Math.PI/2);this.material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,blending:T.AdditiveBlending});
  this.halos=new T.InstancedMesh(this.geometry,this.material,1);this.halos.count=0;this.halos.frustumCulled=false;scene.add(this.halos);this.pose=new T.Object3D();
 }
 sync(buildings,center,zoom,low){
  const active=buildings.filter(b=>b.type==='lamp'&&b.hp>0&&b.active),near=active.filter(b=>Math.abs(b.x-center.x)<zoom*1.8+LAMP_RADIUS&&Math.abs(b.z-center.z)<zoom*1.6+LAMP_RADIUS);
  if(near.length>this.halos.instanceMatrix.count){this.scene.remove(this.halos);this.halos.dispose();this.halos=new T.InstancedMesh(this.geometry,this.material,Math.max(near.length,this.halos.instanceMatrix.count*2));this.halos.frustumCulled=false;this.scene.add(this.halos);}
  this.halos.count=near.length;
  near.forEach((b,i)=>{this.pose.position.set(b.x,.025,b.z);this.pose.updateMatrix();this.halos.setMatrixAt(i,this.pose.matrix);});if(near.length)this.halos.instanceMatrix.needsUpdate=true;
  near.sort((a,b)=>(a.x-center.x)**2+(a.z-center.z)**2-(b.x-center.x)**2-(b.z-center.z)**2);
  this.lights.forEach((light,i)=>{const lamp=near[i];light.intensity=lamp&&i<(low?4:8)?16:0;if(lamp)light.position.set(lamp.x,1.13,lamp.z);});
 }
}
