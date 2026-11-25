import * as T from './vendor/three.module.js';
// Display-space grade for the coastal look: slightly desaturated, cool shadows and warm
// highlights, a gentle contrast curve, a soft vignette and fine film grain.
export const ColorGradeShader={
 uniforms:{tDiffuse:{value:null},time:{value:0},resolution:{value:new T.Vector2(1,1)},strength:{value:1}},
 vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
 fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform vec2 resolution;uniform float strength;varying vec2 vUv;
float hash(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}
void main(){
 vec4 src=texture2D(tDiffuse,vUv);vec3 c=src.rgb;
 float l=dot(c,vec3(.2126,.7152,.0722));
 vec3 graded=mix(vec3(l),c,.86);
 graded*=mix(vec3(.94,.985,1.05),vec3(1.05,1.,.92),smoothstep(.12,.78,l));
 graded=mix(graded,graded*graded*(3.-2.*graded),.28);
 float v=smoothstep(.98,.32,length((vUv-.5)*vec2(1.12,1.)));
 graded*=mix(.8,1.,v);
 graded+=(hash(vUv*resolution+fract(time*.731)*97.)-.5)*.022;
 gl_FragColor=vec4(mix(c,clamp(graded,0.,1.),strength),src.a);
}`
};
