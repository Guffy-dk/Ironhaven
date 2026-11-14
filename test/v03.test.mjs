import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,planMove,upgradeCost,MAX_UPGRADES,maxHp,RESOURCE_KEYS,RECIPES,storageCapacity,TYPES,inventoryCount} from '../public/shared/sim.js';
import {parseSave} from '../public/shared/saves.js';
const make=()=>{const s=createGame();s.nextWave=9999;return{s,p:addPlayer(s)};};
const rich=s=>{for(const r of RESOURCE_KEYS)s.resources[r]=10000000;};
const run=(s,n)=>{for(let i=0;i<n*20;i++)step(s);};
test('all building types accept exactly ten upgrades with increasing costs and health',()=>{
 for(const type of Object.keys(TYPES).filter(t=>TYPES[t].hp)){
  const{s,p}=make();s.buildings=[{id:900,type,x:5,z:4,dir:0,hp:TYPES[type].hp,level:1,input:[],progress:0,item:null,ammo:0,cooldown:0,active:true}];rich(s);const b=s.buildings[0];let lastCost=0,lastHp=b.hp;
  for(let i=0;i<MAX_UPGRADES;i++){const cost=upgradeCost(b),sum=Object.values(cost).reduce((n,v)=>n+v,0);assert.ok(sum>lastCost,type+' costs must rise');lastCost=sum;assert.equal(command(s,p.id,{type:'upgrade',x:5,z:4}),null);assert.ok(maxHp(b)>lastHp,type+' health must improve');lastHp=maxHp(b);}
  assert.equal(b.level,11);assert.equal(upgradeCost(b),null);assert.match(command(s,p.id,{type:'upgrade',x:5,z:4}),/fully upgraded/);
 }
});
test('moving a valid area preserves ids, damage, upgrades and resources',()=>{
 const{s,p}=make(),selected=s.buildings.filter(b=>b.type==='turret').slice(0,2);selected[0].hp=123;selected[0].level=2;const ids=selected.map(b=>b.id),resources={...s.resources},positions=selected.map(b=>({x:b.x,z:b.z}));
 assert.equal(planMove(s,ids,0,2).invalid.length,0);assert.equal(command(s,p.id,{type:'moveArea',ids,dx:0,dz:2}),null);
 for(let i=0;i<selected.length;i++){assert.equal(selected[i].x,positions[i].x);assert.equal(selected[i].z,positions[i].z+2);}assert.equal(selected[0].hp,123);assert.equal(selected[0].level,2);assert.deepEqual(s.resources,resources);
});
test('invalid iron relocation is atomic unless overridden, then invalid drill is packed',()=>{
 const{s,p}=make();s.buildings=s.buildings.filter(b=>b.type==='hq'||b.z===-3&&b.x>=-8&&b.x<=-6);const ids=s.buildings.filter(b=>b.type!=='hq').map(b=>b.id),drill=s.buildings.find(b=>b.type==='drill');drill.hp=81;
 const plan=planMove(s,ids,5,8);assert.ok(plan.invalid.some(b=>b.id===drill.id&&/iron deposits/.test(b.reason)));const before=JSON.stringify(s);
 assert.match(command(s,p.id,{type:'moveArea',ids,dx:5,dz:8}),/cannot be placed/);assert.equal(JSON.stringify(s),before);
 assert.equal(command(s,p.id,{type:'moveArea',ids,dx:5,dz:8,override:true}),null);assert.equal(inventoryCount(s,p.id,'drill'),1);assert.equal(p.inventory.drill[0].hp,81);assert.ok(!s.buildings.some(b=>b.id===drill.id));
 for(const b of plan.valid)assert.ok(s.buildings.some(v=>v.id===b.id&&v.x===b.x&&v.z===b.z));
});
test('occupied destinations and an invalid core cannot silently destroy the colony',()=>{
 const{s,p}=make(),core=s.buildings[0];const before=JSON.stringify(s);
 assert.match(command(s,p.id,{type:'moveArea',ids:[core.id],dx:60,dz:0,override:true}),/core cannot be removed/);assert.equal(JSON.stringify(s),before);
 const t=s.buildings.find(b=>b.type==='turret');assert.ok(planMove(s,[t.id],-t.x,-t.z).invalid.length);assert.match(command(s,p.id,{type:'moveArea',ids:[t.id],dx:-t.x,dz:-t.z}),/cannot be placed/);
});
test('every new factory consumes its exact ingredients and delivers a useful processed material',()=>{
 for(const type of ['copperSmelter','foundry','circuitLab','componentFactory']){
  const{s,p}=make();s.buildings=s.buildings.filter(b=>b.type==='hq');rich(s);assert.equal(command(s,p.id,{type:'build',building:type,x:-1,z:0,dir:0}),null);
  const b=s.buildings.find(b=>b.type===type),recipe=RECIPES[type];for(const[r,n]of Object.entries(recipe.input))for(let i=0;i<n*2;i++)b.input.push(r);
  for(const r of RESOURCE_KEYS)s.resources[r]=0;run(s,recipe.seconds*2+1);assert.equal(s.resources[recipe.output],2,type+' should deliver two outputs');assert.equal(b.input.length,0);
 }
});
test('copper drills require copper and storage expands capacity without deleting overflow',()=>{
 const{s,p}=make();rich(s);assert.match(command(s,p.id,{type:'build',building:'copperDrill',x:3,z:4}),/copper deposits/);
 assert.equal(command(s,p.id,{type:'build',building:'copperDrill',x:8,z:-4}),null);
 const oldCapacity=storageCapacity(s);assert.equal(command(s,p.id,{type:'build',building:'storage',x:4,z:4}),null);const warehouse=s.buildings.find(b=>b.type==='storage');assert.equal(storageCapacity(s),oldCapacity+300);
 assert.equal(command(s,p.id,{type:'upgrade',x:4,z:4}),null);assert.ok(storageCapacity(s)>oldCapacity+300);const plate=s.resources.plate;assert.equal(command(s,p.id,{type:'demolish',x:4,z:4}),null);assert.equal(s.resources.plate,plate);assert.equal(inventoryCount(s,p.id,'storage'),1);
});
test('Shift sprint is faster and remains normalized on diagonals',()=>{
 const a=make(),b=make();for(const q of[a,b]){q.p.x=15;q.p.z=15;}
 command(a.s,a.p.id,{type:'move',x:0,z:-1});command(b.s,b.p.id,{type:'move',x:-1,z:-1,sprint:true});run(a.s,1);run(b.s,1);
 const walk=Math.hypot(a.p.x-15,a.p.z-15),sprint=Math.hypot(b.p.x-15,b.p.z-15);assert.ok(Math.abs(sprint/walk-1.65)<.001);
});
test('evacuation requires advanced goods and a final defense before victory',()=>{
 const{s,p}=make();rich(s);assert.equal(command(s,p.id,{type:'build',building:'launchpad',x:5,z:4}),null);assert.match(command(s,p.id,{type:'launch',x:5,z:4}),/eight swarms/);s.wave=8;
 s.resources.module=0;assert.match(command(s,p.id,{type:'launch',x:5,z:4}),/components/);s.resources.module=30;s.resources.steel=60;s.resources.circuit=40;
 assert.equal(command(s,p.id,{type:'launch',x:5,z:4}),null);assert.equal(s.wave,9);assert.ok(s.enemies.length>0);assert.equal(s.resources.module,0);assert.equal(s.evacuation.status,'charging');assert.equal(s.status,'playing');
 s.enemies=[];run(s,91);assert.equal(s.status,'victory');assert.equal(s.evacuation.status,'complete');
});
test('world exports round-trip and old wins migrate to the new evacuation objective',()=>{
 const{s,p}=make(),text=JSON.stringify({state:s,playerId:p.id}),loaded=parseSave(text);assert.equal(loaded.state.version,4);assert.deepEqual(loaded.state.resources,s.resources);
 s.version=2;s.status='victory';s.wave=8;const old=parseSave(JSON.stringify({state:s,playerId:p.id}));assert.equal(old.state.status,'playing');assert.throws(()=>parseSave('not json'),/JSON/);assert.throws(()=>parseSave(JSON.stringify({state:{}})),/world save/);
});
test('a complete copper line mines, smelts and transports copper to the core',()=>{
 const{s,p}=make();assert.equal(command(s,p.id,{type:'build',building:'copperDrill',x:8,z:-4,dir:0}),null);assert.equal(command(s,p.id,{type:'build',building:'belt',x:9,z:-4,dir:0}),null);assert.equal(command(s,p.id,{type:'build',building:'copperSmelter',x:10,z:-4,dir:3}),null);assert.equal(command(s,p.id,{type:'buildRow',building:'belt',start:{x:10,z:-5},end:{x:0,z:0},dir:2}),null);run(s,60);assert.ok(s.resources.copper>=10);assert.ok(s.produced.plate>0);
});
test('full storage causes backpressure and a new warehouse resumes delivery',()=>{
 const{s,p}=make(),smelter=s.buildings.find(b=>b.type==='smelter');s.buildings=s.buildings.filter(b=>b.type==='hq'||b===smelter);smelter.x=-1;smelter.z=0;smelter.dir=0;smelter.item='plate';s.resources.plate=300;step(s);assert.equal(s.resources.plate,300);assert.equal(smelter.item,'plate');
 assert.equal(command(s,p.id,{type:'build',building:'storage',x:4,z:4}),null);s.resources.plate=300;step(s);assert.equal(s.resources.plate,301);assert.equal(smelter.item,null);
});
