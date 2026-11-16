import * as T from './vendor/three.module.js';

const MAX_PARTICLES=360;
export function createQuarryEffects(){
 const geometry=new T.BufferGeometry();
 const position=new T.Float32BufferAttribute(new Float32Array(MAX_PARTICLES*3),3);
 const detail=new T.Float32BufferAttribute(new Float32Array(MAX_PARTICLES*3),3);
 for(const attr of [position,detail])attr.setUsage(T.DynamicDrawUsage);
 geometry.setAttribute('position',position);geometry.setAttribute('particle',detail);geometry.setDrawRange(0,0);
 const material=new T.ShaderMaterial({
  uniforms:{pixels:{value:30}},
  vertexShader:`
   uniform float pixels;
   attribute vec3 particle;
   varying vec2 kindAndOpacity;
   void main(){
    kindAndOpacity = particle.yz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    gl_PointSize = max(1.0,particle.x*pixels);
   }
  `,
  fragmentShader:`
   varying vec2 kindAndOpacity;
   void main(){
    vec2 p=gl_PointCoord-.5;
    float shape=1.0-smoothstep(.16,.5,length(p)+sin(p.x*25.0+p.y*17.0)*.028);
    vec3 smoke=vec3(.56,.58,.58), grit=vec3(.53,.415,.312);
    gl_FragColor=vec4(mix(smoke,grit,kindAndOpacity.x),shape*kindAndOpacity.y);
    #include <colorspace_fragment>
   }
  `,
  transparent:true,depthWrite:false
 });
 const cloud=new T.Points(geometry,material);
 cloud.frustumCulled=false;cloud.visible=false;
 return cloud;
}

export function updateQuarryEffects(cloud,world,time,center,reach,pixels){
 const {position,particle}=cloud.geometry.attributes;
 let count=0;
 const add=(x,y,z,size,kind,opacity)=>{
  if(count>=MAX_PARTICLES||Math.abs(x-center.x)>reach||Math.abs(z-center.z)>reach)return;
  position.setXYZ(count,x,y,z);particle.setXYZ(count++,size,kind,opacity);
 };
 for(const b of world.buildings){
  const furnace=['smelter','foundry','coalGenerator','generator'].includes(b.type);
  if(!furnace||!b.active||b.progress===0&&!(b.input?.length))continue;
  const angle=b.type.endsWith('enerator')?0:-b.dir*Math.PI/2,x=b.x-.24*Math.cos(angle)-.17*Math.sin(angle),z=b.z+.24*Math.sin(angle)-.17*Math.cos(angle);
  for(let i=0;i<4;i++){
   const t=(time*.38+b.id*.151+i/4)%1;
   const y=(b.type.endsWith('enerator')?.99:1.36)+t*1.08;
   add(x+t*.83,y,z+t*.17+Math.sin(t*5+i)*.06,.19+t*.6,0,Math.sin(Math.PI*t)*.24);
  }
 }
 for(const shot of world.shots){
  const age=time-shot.time;
  if(!shot.radius||age<0||age>.25)continue;
  for(let i=0;i<7;i++){
   const angle=i*Math.PI*2/7+shot.tx;
   add(shot.tx+Math.cos(angle)*age*4,.18+age*1.4,shot.tz+Math.sin(angle)*age*4,.25+age*2,1,(1-age/.25)*.5);
  }
 }
 cloud.visible=count>0;cloud.geometry.setDrawRange(0,count);
 cloud.material.uniforms.pixels.value=pixels;
 if(count)position.needsUpdate=particle.needsUpdate=true;
}

const actors=new Map();
export function quarryActorGeometry(part){
 if(actors.has(part))return actors.get(part);
 const body=part==='body',geometry=new T.SphereGeometry(1,body?18:12,body?12:9);
 const points=geometry.attributes.position,colors=[];
 for(let i=0;i<points.count;i++){
  const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
  if(body){
   const ribs=1+Math.sin(z*22)*.043;
   const shoulder=Math.exp(-((z-.43)**2)*14)*.23,haunch=Math.exp(-((z+.54)**2)*21)*.17;
   const spine=Math.max(0,y)**3*(.08+.06*Math.cos(z*27));
   points.setXYZ(i,x*ribs*(.74+shoulder+haunch),y*(.86+shoulder)+spine,z);
  }else{
   const muzzle=1-Math.max(0,z)*.48;
   points.setXYZ(i,x*muzzle,y*(1-z*.27)-Math.max(0,z)*.19,z*(z>0?1.12:1));
  }
  const mottling=Math.sin(x*27+y*13)*Math.sin(z*18-y*16)*.11;
  const stripe=body?Math.max(0,y)*(.18+.08*Math.cos(z*17)):.2*Math.max(0,z);
  const shade=Math.min(1,.69+(y+1)*.1+mottling-stripe);
  colors.push(shade,shade*.89,shade*.78);
 }
 geometry.computeVertexNormals();geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 actors.set(part,geometry);
 return geometry;
}
