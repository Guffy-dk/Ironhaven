import * as T from './vendor/three.module.js';
import {LIGHTHOUSE_REACH,LIGHTHOUSE_CONE} from './shared/lighthouse.js';

// Actual illumination plus an elliptical scattering volume. Horizontal coverage
// follows the simulation cone; vertical spread stays narrow like a real lantern.
export class LighthouseLight{
 constructor(scene){
  this.object=new T.Group();scene.add(this.object);
  this.light=new T.SpotLight(0xffe8b4,500,LIGHTHOUSE_REACH+4,LIGHTHOUSE_CONE,.35,1.5);
  this.light.position.y=2.22;this.light.castShadow=true;
  this.light.shadow.mapSize.set(1024,1024);this.light.shadow.normalBias=.025;this.light.shadow.bias=-.00015;
  this.object.add(this.light);scene.add(this.light.target);
  const positions=[],uv=[],segments=48,near=.12,far=160;
  for(let i=0;i<segments;i++){
   const a=i*Math.PI*2/segments,b=(i+1)*Math.PI*2/segments;
   const point=(angle,d)=>[Math.cos(angle)*(.065+d*Math.tan(Math.PI/5*.35)),Math.sin(angle)*(.055+d*.004)-d*.008,d];
   for(const [angle,d,v] of [[a,near,0],[b,near,0],[b,far,1],[a,near,0],[b,far,1],[a,far,1]]){
    positions.push(...point(angle,d));uv.push(angle/(Math.PI*2),v);
   }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  const material=new T.ShaderMaterial({
   uniforms:{time:{value:0},strength:{value:1}},transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,
   vertexShader:`varying vec2 vUv; varying vec3 vWorld;
    void main(){vUv=uv;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}`,
   fragmentShader:`uniform float time,strength;varying vec2 vUv;varying vec3 vWorld;
    void main(){
     float falloff=pow(1.-vUv.y,.65)*smoothstep(0.,.018,vUv.y);
     float haze=.65+.18*sin(vWorld.x*.8+vWorld.z*.37+time*.28)+.12*sin(vWorld.y*8.-vWorld.z*.6-time*.4);
     float edge=pow(abs(sin(vUv.x*6.2831853)),.4);
     gl_FragColor=vec4(vec3(1.7,1.46,1.02),falloff*haze*(.009+.016*edge)*strength);
    }`
  });
  this.volume=new T.Mesh(geometry,material);this.volume.position.y=2.22;this.volume.frustumCulled=false;this.volume.renderOrder=5;this.object.add(this.volume);
  this.aperture=new T.Mesh(new T.SphereGeometry(.12,16,12),new T.MeshBasicMaterial({color:new T.Color(5,3.8,2),toneMapped:false}));
  this.aperture.position.set(0,2.22,.34);this.object.add(this.aperture);
 }
 sync(core,beam,time,low){
  this.object.visible=!!beam;if(!beam)return;
  this.object.position.set(core.x,0,core.z);this.object.rotation.y=Math.atan2(beam.dx,beam.dz);
  this.light.target.position.set(core.x+beam.dx*beam.reach,.12,core.z+beam.dz*beam.reach);this.light.target.updateMatrixWorld();
  this.light.distance=beam.reach+4;this.light.angle=beam.cone;this.light.intensity=500;this.volume.scale.set(beam.reach/160*Math.tan(beam.cone*.35)/Math.tan(Math.PI/5*.35),1,beam.reach/160);
  this.light.castShadow=!low;this.volume.visible=!low;this.volume.material.uniforms.time.value=time;
 }
}
