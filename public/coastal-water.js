import {COAST_ISLAND_GLSL} from './shared/coast.js';
import * as T from './vendor/three.module.js';
export class CoastalWater{
 constructor(scene,size){
  this.material=new T.ShaderMaterial({uniforms:{island:{value:new T.Vector4()},islandSeed:{value:0},islandMode:{value:0},reach:{value:40},edge:{value:.94},time:{value:0},coast:{value:new T.Vector2()},beacon:{value:new T.Vector2()},beam:{value:new T.Vector2()}},
   vertexShader:`varying vec3 vWorld; void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}`,
   fragmentShader:`${COAST_ISLAND_GLSL}
    uniform vec4 island;uniform float islandSeed,islandMode,reach,edge;uniform float time;uniform vec2 coast,beacon,beam;varying vec3 vWorld;
    void main(){
     vec2 p=vWorld.xz;float t=time*.38;float detail=1.-smoothstep(.15,1.,length(fwidth(p)));
     vec3 n=normalize(vec3(detail*(-.12*cos(p.x*.8+t)-.06*cos((p.x+p.y)*1.7-t)),1.,detail*(-.1*cos(p.y*1.1-t)-.06*cos((p.x+p.y)*1.7-t))));
     vec3 view=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(0.,dot(n,view)),3.);
     vec3 color=mix(vec3(.012,.027,.031),vec3(.12,.15,.16),fresnel);
     float glint=pow(max(0.,dot(reflect(-normalize(vec3(-.45,.8,.3)),n),view)),95.);
     color+=vec3(.7,.68,.6)*glint*.45;
     color+=vec3(.005,.006,.006)*(sin(p.x*2.+p.y*.8+t)+.5*sin(p.y*4.-t));
     float dx=p.x-coast.x,shore=coast.y+sin(dx*.09)*.5+sin(dx*.21)*.18;
     float distance=max(p.y-shore,(1.-length(vec2(dx/5.,(p.y-(coast.y-4.))/7.)))*6.+sin(dx*1.37+p.y*.8)*.28+sin(dx*2.6-p.y*1.7)*.13);
     if(islandMode>.5)distance=islandDistance(p,island,islandSeed);
     float foam=(1.-smoothstep(.06,.5,abs(distance+.25)))*(.15+.6*smoothstep(-.2,.7,sin(p.x*8.+p.y*5.+time)*sin(p.x*3.-p.y*7.-time*.4)));
     color=mix(color,vec3(.41,.46,.43),foam*.65);
     vec2 ray=p-beacon;float r=length(ray);float cone=dot(normalize(ray+vec2(.0001)),beam);
     float lit=smoothstep(edge-.02,edge+.02,cone)*(1.-smoothstep(reach*.6,reach,r));
     color+=vec3(.23,.17,.08)*lit*(.2+glint*2.);
     gl_FragColor=vec4(color,1.);
    }`});
  this.mesh=new T.Mesh(new T.PlaneGeometry(size*5,size*5).rotateX(-Math.PI/2),this.material);this.mesh.position.y=-.3;this.mesh.visible=false;scene.add(this.mesh);
 }
 sync(terrain,time,beam){
  this.mesh.visible=!!terrain.coast;if(!this.mesh.visible)return;
  const c=terrain.coast;this.material.uniforms.islandMode.value=c.kind==='island'?1:0;this.material.uniforms.island.value.set(c.x,c.z??0,c.rx??1,c.rz??1);this.material.uniforms.islandSeed.value=c.seed??0;this.material.uniforms.reach.value=beam?.reach??40;this.material.uniforms.edge.value=Math.cos(beam?.cone??Math.PI/9);
  this.material.uniforms.time.value=time;this.material.uniforms.coast.value.set(terrain.coast.x,terrain.coast.shoreZ??0);
  this.material.uniforms.beacon.value.set(beam?.x??0,beam?.z??-8);this.material.uniforms.beam.value.set(beam?.dx??0,beam?.dz??1);
 }
}
