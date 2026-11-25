import * as T from './vendor/three.module.js';
// Drifting sea mist: thickest offshore and along the coast, thin wisps over the island.
// Presentation only; it never hides interaction targets because it stays low and translucent.
export class CoastalMist{
 constructor(size){
  this.material=new T.ShaderMaterial({
   transparent:true,depthWrite:false,fog:false,
   uniforms:{time:{value:0},island:{value:165},color:{value:new T.Color(0xb9c4c4)},strength:{value:1}},
   vertexShader:`varying vec2 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}`,
   fragmentShader:`uniform float time;uniform float island;uniform vec3 color;uniform float strength;varying vec2 vWorld;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return v;}
void main(){
 vec2 drift=vec2(time*.35,time*.12);
 float n=fbm(vWorld*.045+drift*.05)*.65+fbm(vWorld*.11-drift*.08)*.35;
 float shore=smoothstep(island*.55,island*1.05,length(vWorld));
 float density=mix(.11,.42,shore)*smoothstep(.36,.8,n);
 gl_FragColor=vec4(color,density*strength);
}`
  });
  this.object=new T.Mesh(new T.PlaneGeometry(size,size,1,1).rotateX(-Math.PI/2),this.material);
  this.object.position.y=.45;this.object.renderOrder=3;this.object.frustumCulled=false;this.object.name='coastal-mist';
 }
 sync(time,visible=true){this.material.uniforms.time.value=time;this.object.visible=visible;}
}
