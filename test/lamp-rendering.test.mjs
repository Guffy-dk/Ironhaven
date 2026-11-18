import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {fileURLToPath} from 'node:url';import * as T from 'three';
const bundle=await build({entryPoints:['public/base-lamps.js'],bundle:true,format:'esm',write:false,plugins:[{name:'installed-three',setup(b){b.onResolve({filter:/vendor\/three\.module\.js$/},()=>({path:fileURLToPath(new URL('../node_modules/three/build/three.module.js',import.meta.url))}));}}]});const{BaseLampLights,makeLampModel}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
test('lamp lighting retains fixed light slots and all ground halos across camera and quality changes',()=>{
 const field=new BaseLampLights(new T.Scene()),slots=[...field.lights],buildings=Array.from({length:12},(_,i)=>({type:'lamp',hp:75,active:true,x:i-6,z:0}));
 field.sync(buildings,{x:0,z:0},44,false);assert.equal(field.lights.filter(l=>l.intensity>0).length,8);assert.equal(field.halos.count,12);
 field.sync(buildings,{x:0,z:0},14,false);assert.equal(field.lights.filter(l=>l.intensity>0).length,8);assert.deepEqual(field.lights,slots);assert.equal(field.halos.count,12);
 field.sync(buildings,{x:0,z:0},14,true);assert.equal(field.lights.filter(l=>l.intensity>0).length,4);
 buildings.forEach(b=>{b.active=false;});field.sync(buildings,{x:0,z:0},14,false);assert.equal(field.halos.count,0);assert.ok(field.lights.every(l=>l.intensity===0&&l.visible));
});
test('lamp fittings retain detailed finite geometry and individually switchable bulbs after batching',()=>{
 globalThis.document={createElement(){return{width:0,height:0,getContext(){return{fillRect(){}};}};},getElementById(){return null;}};
 try{const a=makeLampModel(),b=makeLampModel(),parts=[];a.traverse(o=>{if(o.isMesh)parts.push(o);});assert.ok(parts.length<20,'Repeated fittings should share draw calls');assert.equal(parts.reduce((n,o)=>n+(o.geometry.index?.count??o.geometry.attributes.position.count)/3,0),1524,'Retain every triangle of the original lamp');for(const part of parts){assert.ok(part.geometry.attributes.position.array.every(Number.isFinite));assert.ok(part.geometry.attributes.normal.array.every(Number.isFinite));assert.ok(part.geometry.attributes.uv);}
  const bulbA=a.getObjectByName('bulb'),bulbB=b.getObjectByName('bulb');assert.ok(bulbA&&bulbB);assert.notEqual(bulbA.material,bulbB.material);bulbA.material.emissiveIntensity=0;assert.equal(bulbB.material.emissiveIntensity,2.5);assert.equal(bulbA.castShadow,false);
 }finally{delete globalThis.document;}
});
