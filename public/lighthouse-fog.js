import * as T from './vendor/three.module.js';
import {LIGHTHOUSE_CONE,LIGHTHOUSE_REACH} from './shared/lighthouse.js';

export class LighthouseFog{
 constructor(size){
  this.object=new T.Group();
  const shape=new T.PlaneGeometry(size,size).rotateX(-Math.PI/2);
  this.layers=[.07,.58,1.2].map((height,index)=>{
   const material=new T.ShaderMaterial({
    transparent:true,depthWrite:false,
    uniforms:{
     time:{value:0},core:{value:new T.Vector2()},direction:{value:new T.Vector2()},active:{value:0},
     storm:{value:0},layer:{value:index},reach:{value:LIGHTHOUSE_REACH},edge:{value:Math.cos(LIGHTHOUSE_CONE)}
    },
    vertexShader:`
     varying vec2 groundPosition;
     void main(){
      vec4 world=modelMatrix*vec4(position,1.0);
      groundPosition=world.xz;
      gl_Position=projectionMatrix*viewMatrix*world;
     }
    `,
    fragmentShader:`
     uniform float time,active,storm,layer,reach,edge;
     uniform vec2 core,direction;
     varying vec2 groundPosition;
     float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      vec2 k=vec2(127.1,311.7);
      float a=fract(sin(dot(i,k))*43758.5453);
      float b=fract(sin(dot(i+vec2(1,0),k))*43758.5453);
      float c=fract(sin(dot(i+vec2(0,1),k))*43758.5453);
      float d=fract(sin(dot(i+vec2(1,1),k))*43758.5453);
      return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);
     }
     void main(){
      vec2 drift=groundPosition*vec2(.38,.72)+time*vec2(.45,-.16)+vec2(layer*8.1,-layer*5.2);
      float cloud=noise(drift*.42)*.57+noise(drift*.91+time*.025)*.28+noise(drift*1.83)*.15;
      float fog=smoothstep(.25,.8,cloud);
      vec2 ray=groundPosition-core;
      float distance=length(ray);
      float cone=dot(ray,direction)/max(distance,.01);
      float beam=smoothstep(edge-.026,edge+.028,cone)*(1.0-smoothstep(reach-5.0,reach,distance))*smoothstep(.85,4.0,distance)*active;
      vec3 color=mix(vec3(.23,.33,.38),vec3(1.0,.75,.42),beam);
      float opacity=(.035+storm*.035+fog*.09)*(1.0-beam*.5) + beam*(.18+fog*.13);
      gl_FragColor=vec4(color,opacity*(layer==0.0?1.0:.53));
      #include <colorspace_fragment>
     }
    `
   });
   const mesh=new T.Mesh(shape,material);
   mesh.position.y=height;mesh.renderOrder=2+index;
   this.object.add(mesh);
   return mesh;
  });
 }
 sync(beam,time,storm,lowQuality){
  for(const [i,layer] of this.layers.entries()){
   layer.visible=!lowQuality||i===0;
   const uniforms=layer.material.uniforms;
   uniforms.time.value=time;
   uniforms.active.value=beam?1:0;
   uniforms.storm.value=storm;
   if(beam){uniforms.core.value.set(beam.x,beam.z);uniforms.direction.value.set(beam.dx,beam.dz);}
  }
 }
}
