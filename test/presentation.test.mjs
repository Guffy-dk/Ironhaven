// Presentation-only behaviour: animation, atmosphere, grading and in-world signs.
// None of it may feed back into the simulation; these tests pin what the player sees.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
import {Window} from 'happy-dom';

const dom=new Window();dom.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:(t,k)=>k in t?t[k]:()=>{}});globalThis.document=dom.document;
const three={name:'installed-three',setup(b){b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));}};
const load=async file=>{const out=await build({entryPoints:[fileURLToPath(new URL(file,import.meta.url))],bundle:true,format:'esm',write:false,plugins:[three]});return import('data:text/javascript;base64,'+Buffer.from(out.outputFiles[0].text).toString('base64'));};
const {CoastalHostiles}=await load('../public/coastal-hostiles.js');
const {CoastalMist}=await load('../public/coastal-mist.js');
const {ColorGradeShader}=await load('../public/color-grade.js');
const {makeModel}=await load('../public/render.js');
const T=await import('three');

const bounds={x:0,z:0,rx:40,rz:40,zoom:44,low:false};
const sync=(swarm,enemies,time,positions=new Map())=>swarm.sync(enemies,time,.05,null,e=>positions.get(e.id)??e,null,bounds);
const bodyMatrix=(swarm,kind,index=0)=>{const m=new T.Matrix4();swarm.species.get(kind).meshes.body.getMatrixAt(index,m);return m;};

test('a removed hostile falls for about a second instead of vanishing, then disappears',()=>{
 const swarm=new CoastalHostiles(new T.Scene()),runner={id:1,kind:'runner',x:2,z:3,hp:10};
 sync(swarm,[runner],1);
 assert.equal(swarm.species.get('runner').count,1);
 sync(swarm,[],1.05);
 assert.equal(swarm.species.get('runner').count,1,'a falling body is still drawn');
 assert.equal(swarm.hasVisible,false,'shadow updates follow living hostiles only');
 for(let t=1.1;t<2.4;t+=.05)sync(swarm,[],t);
 assert.equal(swarm.species.get('runner').count,0,'the body is gone after the fall');
});

test('a mass removal such as loading a world does not spawn falling bodies',()=>{
 const swarm=new CoastalHostiles(new T.Scene());
 const crowd=Array.from({length:60},(_,i)=>({id:i+1,kind:'runner',x:i%10,z:Math.floor(i/10),hp:10}));
 sync(swarm,crowd,1);sync(swarm,[],1.05);
 assert.equal(swarm.species.get('runner').count,0);
});

test('a hit makes a hostile recoil and flash, then it settles back',()=>{
 const swarm=new CoastalHostiles(new T.Scene()),guard={id:7,kind:'guard',x:0,z:0,hp:100};
 sync(swarm,[guard],1);const rest=bodyMatrix(swarm,'guard');
 guard.hp=80;sync(swarm,[guard],1.05);const hit=bodyMatrix(swarm,'guard');
 assert.ok(!hit.equals(rest),'the body moves on impact');
 const tint=new T.Color();swarm.species.get('guard').meshes.body.getColorAt(0,tint);assert.ok(tint.r>1.1,'the hit flashes');
 for(let t=1.1;t<2;t+=.05)sync(swarm,[guard],t);
 const settled=bodyMatrix(swarm,'guard');
 assert.ok(settled.elements.every((v,i)=>Math.abs(v-rest.elements[i])<.02),'the recoil settles');
});

test('the walk cycle follows distance covered, so standing hostiles do not stride',()=>{
 const swarm=new CoastalHostiles(new T.Scene()),walker={id:3,kind:'walker',x:0,z:0,hp:100};
 sync(swarm,[walker],1);
 for(let t=1.05;t<3;t+=.05)sync(swarm,[walker],t);
 const standing=swarm.gaits.get(3);
 assert.ok(standing.move<.05,'no walking weight while standing still');
 const positions=new Map();
 for(let i=1;i<=40;i++){walker.z=i*.05;sync(swarm,[walker],3+i*.05,positions);}
 assert.ok(swarm.gaits.get(3).move>.5,'walking weight rises while moving');
});

test('coastal mist is a translucent low layer that can be switched off',()=>{
 const mist=new CoastalMist(400);
 assert.ok(mist.material.transparent);assert.equal(mist.material.depthWrite,false);
 assert.ok(mist.object.position.y>0&&mist.object.position.y<1);
 mist.sync(12.5,false);assert.equal(mist.object.visible,false);assert.equal(mist.material.uniforms.time.value,12.5);
 mist.sync(13,true);assert.equal(mist.object.visible,true);
});

test('the colour grade keeps its strength uniform and only grades in display space',()=>{
 assert.equal(ColorGradeShader.uniforms.strength.value,1);
 assert.match(ColorGradeShader.fragmentShader,/mix\(c,clamp\(graded,0\.,1\.\),strength\)/);
 assert.match(ColorGradeShader.fragmentShader,/tDiffuse/);
});

test('factories carry a painted trade sign on the roof; belts and walls do not',()=>{
 for(const type of ['smelter','assembler','drill','storage','generator']){
  const model=makeModel(type,0,[],1,'quarry');
  assert.ok(model.getObjectByName('trade-sign'),type);
 }
 for(const type of ['belt','wall','turret'])assert.equal(makeModel(type,0,[],1,'quarry').getObjectByName('trade-sign'),undefined,type);
});
