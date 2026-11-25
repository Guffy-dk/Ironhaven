import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,beltTravelTicks,BUILD_EDGE,command,createGame,createExpedition,dismantleValue,FINAL_WAVE,makeTerrain,MAX_UPGRADES,POWER_CAPACITY,powerOutput,sawmillRate,step,turretStats,upgradeCost,waveForecast} from '../public/shared/sim.js';
import {stockFlow} from '../public/shared/diagnostics.js';
import {packWorldSave,parseSave} from '../public/shared/saves.js';
import {RenderMotion} from '../public/motion.js';
import {Lan} from '../public/network.js';
import {TUTORIAL_STEPS} from '../public/shared/tutorial.js';

test('colonies can build, move and reload more than 700 buildings',()=>{
 const {s,p,build}=world();
 s.resources.wood=10000;
 const layout=Array.from({length:702},(_,i)=>({type:'belt',x:i%27,z:Math.floor(i/27),dir:0}));
 assert.equal(command(s,p.id,{type:'pasteSetup',layout,anchor:{x:5,z:5}}),null);
 build('belt',4,5);
 assert.equal(command(s,p.id,{type:'buildRow',building:'belt',start:{x:3,z:9},end:{x:3,z:14},dir:1}),null);
 const ids=s.buildings.filter(b=>b.type==='belt').map(b=>b.id);
 assert.ok(ids.length>700);
 assert.equal(command(s,p.id,{type:'moveArea',ids,dx:0,dz:32}),null);
 const loaded=parseSave(JSON.stringify(packWorldSave(s,p.id)));
 assert.equal(loaded.state.buildings.length,s.buildings.length);
 assert.ok(loaded.state.buildings.some(b=>b.type==='belt'&&b.z===37));
});

test('outer deposit paths leave trees within reach of the tutorial sawmill',()=>{
 const site=TUTORIAL_STEPS.find(lesson=>lesson.tiles?.some(b=>b.type==='sawmill')).tiles.find(b=>b.type==='sawmill');
 for(const seed of [7,33,44,64]){
  const s=createGame(seed);
  assert.ok(sawmillRate(s,site)>0,`Seed ${seed} has no trees near the tutorial sawmill`);
 }
});

function world(){
 const s=createGame(),p=addPlayer(s);
 s.buildings=s.buildings.filter(b=>b.type==='hq');
 s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e6;
 Object.assign(s.resources,{wood:300,plate:300,steel:300,gear:300,circuit:300,module:300});
 return {s,p,build(type,x,z,dir=0){
  assert.equal(command(s,p.id,{type:'build',building:type,x,z,dir}),null);
  return s.buildings.at(-1);
 }};
}
test('swarm health scales smoothly and late runners survive a level-30 mortar hit',()=>{
 const normalEnemy=wave=>{
  const {s}=world();s.wave=wave-1;s.nextWave=0;
  step(s);
  return s.enemies.find(e=>e.kind==='runner'&&!e.coreHunter&&!e.mutation);
 };
 const seventh=normalEnemy(7),eighth=normalEnemy(8),last=normalEnemy(FINAL_WAVE);
 assert.equal(seventh.maxHp,88);
 assert.equal(seventh.damage,(1+.018*6)*.8);
 assert.ok(last.maxHp>turretStats({type:'mortar',level:30}).damage);assert.ok(eighth.maxHp<seventh.maxHp*1.2);
 assert.ok(eighth.damage>seventh.damage);
 assert.ok(last.maxHp>3*eighth.maxHp);
 assert.ok(last.damage>eighth.damage);
});

test('seeded large maps vary beyond the clear center and keep starter deposits available',()=>{
 const first=makeTerrain(123),second=makeTerrain(456);
 assert.equal(BUILD_EDGE*2+1,257);
 assert.deepEqual(first,makeTerrain(123));
 assert.notDeepEqual(first.trees,second.trees);
 assert.notDeepEqual(first.coal,second.coal);
 for(const terrain of [first,second]){
  assert.ok(terrain.ore.some(t=>t.x===4&&t.z===3));
  assert.ok(terrain.copper.some(t=>Math.hypot(t.x,t.z)<12));
  assert.ok(terrain.coal.some(t=>Math.hypot(t.x,t.z)<16));
  assert.ok(!terrain.trees.some(t=>Math.hypot(t.x,t.z)<9));
  assert.ok(terrain.trees.some(t=>Math.abs(t.x)>60||Math.abs(t.z)>60));
 }
});

test('deposits have open ground around them and existing outer buildings survive the cleanup',()=>{
 for(const seed of [12,456]){
  const terrain=makeTerrain(seed),blocked=new Set([...terrain.trees,...terrain.rocks].map(t=>t.x+','+t.z));
  for(const {x,z} of [...terrain.ore,...terrain.copper,...terrain.coal]){
   for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)assert.ok(!blocked.has((x+dx)+','+(z+dz)));
  }
 }
 const {s,p,build}=world(),belt=build('belt',83,83),[deposit]=s.terrain.coal;
 s.terrain.trees.push({...deposit,h:1});s.version=8;
 const loaded=parseSave(JSON.stringify(packWorldSave(s,p.id))).state;
 assert.ok(loaded.buildings.some(tile=>tile.id===belt.id&&tile.x===83));
 assert.ok(!loaded.terrain.trees.some(t=>t.x===deposit.x&&t.z===deposit.z));
});

test('sawmill output scales with trees and area clearing leaves buildings in place',()=>{
 const {s,p,build}=world(),belt=build('belt',7,6);
 s.terrain.trees=[{x:8,z:5,h:1}];
 const sawmill=build('sawmill',7,5),before=sawmillRate(s,sawmill);
 s.terrain.trees.push({x:9,z:5,h:1},{x:8,z:6,h:1});
 assert.ok(sawmillRate(s,sawmill)>before);
 for(const r of Object.keys(s.resources))s.resources[r]=0;
 assert.equal(command(s,p.id,{type:'clearTrees',start:{x:7,z:5},end:{x:10,z:6}}),null);
 assert.equal(s.resources.wood,24);assert.equal(sawmillRate(s,sawmill),0);
 assert.ok(s.buildings.includes(sawmill)&&s.buildings.includes(belt));
});

test('dismantling returns 80% of total costs, including fractional belt refunds',()=>{
 const {s,p,build}=world();
 const start=s.resources.wood;
 for(let i=0;i<5;i++)build('belt',5+i,5);
 for(let i=0;i<5;i++)assert.equal(command(s,p.id,{type:'demolish',x:5+i,z:5}),null);
 assert.equal(s.resources.wood,start-1);
 const tower=build('gunTurret',5,5);
 assert.equal(command(s,p.id,{type:'upgrade',x:5,z:5}),null);
 const costs=dismantleValue(tower),stock={...s.resources};
 assert.equal(command(s,p.id,{type:'demolish',x:5,z:5}),null);
 for(const [r,n] of Object.entries(costs))assert.equal(s.resources[r]-stock[r],Math.floor(n*.8));
 assert.deepEqual(p.inventory,{});
 const starter=createExpedition('Starter',{skipTutorial:true});
 assert.ok(starter.state.players[0].inventory.belt.length>0);
});

test('upgraded refining conserves ore across a save and copper has the same one-to-one yield',()=>{
 const {s,p,build}=world(),smelter=build('smelter',-1,0);
 assert.equal(command(s,p.id,{type:'upgrade',x:-1,z:0}),null);
 for(const r of Object.keys(s.resources))s.resources[r]=0;
 smelter.input=['ore'];for(let i=0;i<48;i++)step(s);assert.equal(s.produced.plate,1);
 const loaded=parseSave(JSON.stringify(packWorldSave(s,p.id))).state;
 const machine=loaded.buildings.find(b=>b.id===smelter.id);machine.input=['ore','copperOre','copperOre'];
 for(let i=0;i<160;i++)step(loaded);
 assert.equal(loaded.produced.plate,2);assert.equal(loaded.resources.copper,2);assert.equal(machine.input.length,0);
});
test('a full machine buffer retains ore until space is available',()=>{
 const {s,p,build}=world(),smelter=build('smelter',5,5);
 assert.equal(command(s,p.id,{type:'upgrade',x:5,z:5}),null);
 smelter.item='plate';smelter.outputBuffer=Array(4).fill('plate');smelter.input=['ore'];
 for(let i=0;i<100;i++)step(s);assert.deepEqual(smelter.input,['ore']);
 smelter.outputBuffer.pop();for(let i=0;i<48;i++)step(s);
 assert.equal(smelter.input.length,0);assert.equal(smelter.outputBuffer.length,4);
});

test('generator and command core upgrade prices and output keep their existing progression',()=>{
 assert.deepEqual(upgradeCost({type:'generator',level:1}),{wood:24,plate:24,gear:1});
 assert.equal(Math.round(powerOutput({type:'generator',level:2})),23);
 assert.equal(Math.round(powerOutput({type:'coalGenerator',level:2})),47);
 assert.equal(powerOutput({type:'hq',level:2}),21);
});

test('large LAN maps are delivered in small ordered chunks and reconstructed for the guest',()=>{
 const message={type:'welcome',state:createGame()};
 assert.ok(JSON.stringify(message).length>65536);
 const host=new Lan({}),received=[];
 const guest=new Lan({onMessage:(_,value)=>received.push(value)});
 host.role='host';guest.role='client';
 const outbound={readyState:'open',bufferedAmount:0,send(data){
  assert.ok(Buffer.byteLength(data,'utf8')<65536);
  inbound.onmessage({data});
 }};
 const inbound={};
 guest.wire({},inbound);
 assert.ok(host.send({channel:outbound},message));
 assert.deepEqual(received,[message]);
});

test('stored power covers a shortage until drained, and wood can recover with an unpowered sawmill',()=>{
 const {s,p,build}=world(),generator=build('generator',8,1);
 for(let i=0;i<8;i++)build('smelter',i-4,4);
 for(let i=0;i<400;i++)step(s);
 assert.equal(s.resources.power,POWER_CAPACITY);
 s.resources.wood=0;
 step(s);assert.ok(s.resources.power<POWER_CAPACITY);
 assert.ok(s.buildings.filter(b=>b.type==='smelter').every(b=>b.active));
 for(let i=0;i<900;i++)step(s);
 assert.ok(s.buildings.some(b=>b.type==='smelter'&&!b.active));
 s.terrain.trees.push({x:8,z:5,h:1});
 const mill=build('sawmill',7,5);for(const r of Object.keys(s.resources))s.resources[r]=0;
 assert.equal(mill.active,true);
 for(let i=0;i<160;i++)step(s);
 assert.ok(s.resources.wood>0);assert.ok(generator.active);assert.equal(s.power.total,36);
 assert.equal(command(s,p.id,{type:'demolish',x:8,z:5}),null);
});

test('sentries fire without consuming gears or power and retain those benefits when upgraded',()=>{
 const {s,p,build}=world(),sentry=build('turret',4,4);
 s.resources.gear=0;s.resources.wood=0;
 s.enemies=[{id:900,x:5,z:4,hp:100,speed:0,cooldown:1}];
 step(s);assert.equal(s.resources.gear,0);assert.ok(s.enemies[0].hp<100);
 s.resources.wood=100;s.resources.plate=100;assert.equal(command(s,p.id,{type:'upgrade',x:4,z:4}),null);assert.equal(sentry.level,2);
});

test('coal mines feed a coal generator through the core and fuel consumption appears in stock flow',()=>{
 const {s,build}=world();
 Object.assign(s.buildings.find(b=>b.type==='hq'),{x:11,z:10});
 build('coalMine',10,10);build('coalGenerator',13,10);for(const r of Object.keys(s.resources))s.resources[r]=0;
 assert.equal(s.power.total,18);
 for(let i=0;i<100;i++)step(s);
 assert.ok(s.resources.coal>0);assert.ok(stockFlow(s).coal>0);
 assert.equal(s.power.total,54);
 s.buildings=s.buildings.filter(b=>b.type!=='coalMine');
 const before=s.resources.coal;
 for(let i=0;i<360;i++)step(s);
 assert.ok(s.resources.coal<before);
 assert.equal(s.stats.stockFlow.coal,s.resources.coal);
});

test('mortar and pulse turrets damage a nearby group while leaving distant hostiles alone',()=>{
 for(const type of ['mortar','pulseTurret']){
  const {s,build}=world(),turret=build(type,4,4);
  s.enemies=[{id:500,x:7,z:4},{id:501,x:7,z:5},{id:502,x:22,z:4}].map(e=>({...e,hp:500,maxHp:500,speed:0,cooldown:0}));
  step(s);
  assert.ok(s.enemies[0].hp<500&&s.enemies[1].hp<500);
  assert.equal(s.enemies[2].hp,500);assert.ok(s.shots[0].radius>0);
  assert.equal(turret.ammo,type==='mortar'?3:7);
 }
});

test('raiders attack industry, while core hunters bypass it and attack the core',()=>{
 const {s,build}=world(),mill=build('smelter',4,0);
 const raider={id:500,x:4.6,z:0,hp:500,speed:2,cooldown:0};
 const hunter={...raider,id:501,x:1.2,z:0,coreHunter:true};
 s.enemies=[raider,hunter];
 const core=s.buildings[0],beforeCore=core.hp,beforeMill=mill.hp;
 for(let i=0;i<25;i++)step(s);
 assert.ok(mill.hp<beforeMill);assert.ok(core.hp<beforeCore);
 hunter.x=4.7;hunter.z=0;hunter.cooldown=0;raider.hp=0;
 const afterMill=mill.hp;
 for(let i=0;i<35;i++)step(s);
 assert.equal(mill.hp,afterMill);
 assert.ok(hunter.x<4.7||hunter.z!==0);
});

test('random directions are stable per seed, scaling is difficulty-aware, and core hunters start at 5% in swarm four',()=>{
 const {s}=world();
 const directions=(seed)=>Array.from({length:FINAL_WAVE},(_,i)=>waveForecast({...s,swarmSeed:seed},i+1).side);
 assert.deepEqual(directions(111),directions(111));
 assert.notDeepEqual(directions(111),directions(222));
 assert.equal(new Set(directions(111)).size,8);
 assert.ok(waveForecast({...s,difficulty:'relaxed'},25).count<waveForecast({...s,difficulty:'veteran'},25).count);
 s.wave=2;s.nextWave=0;step(s);assert.ok(s.enemies.every(e=>!e.coreHunter));
 s.enemies=[];s.nextWave=0;step(s);
 assert.equal(s.enemies.filter(e=>e.coreHunter).length,Math.round(s.enemies.length*.05));
 assert.ok(s.enemies.some(e=>e.mutation));
});

test('old worlds gain outer deposits while old construction and inventories remain usable',()=>{
 const {s,p,build}=world();
 const b=build('belt',4,4);
 s.version=6;s.terrain.coal=undefined;p.x=2;p.z=2;
 s.buildings.push({id:s.nextId++,type:'launchpad',x:5,z:5,hp:1200});
 const oldPlate=s.resources.plate;
 const restored=parseSave(JSON.stringify(packWorldSave(s,p.id))).state;
 assert.equal(restored.resources.plate,oldPlate+80);assert.equal(restored.players[0].x,undefined);
 assert.ok(restored.buildings.some(v=>v.id===b.id));
 assert.ok(restored.terrain.coal.some(t=>Math.abs(t.x)>27||Math.abs(t.z)>27));
 assert.equal(command(restored,p.id,{type:'build',building:'belt',x:BUILD_EDGE,z:BUILD_EDGE}),null);
});

test('belt timing is based on when cargo entered the tile and rendering retains the outgoing cargo until handoff',()=>{
 const {s,build}=world(),left=build('belt',4,4),right=build('belt',5,4);
 s.tick=3;left.item='gear';left.itemTick=s.tick;
 const motion=new RenderMotion();
 for(let i=0;i<beltTravelTicks(left)-1;i++)step(s);
 assert.equal(left.item,'gear');
 motion.update(s,100);
 step(s);assert.equal(right.item,'gear');assert.equal(left.item,null);
 const rendered=b=>{const result=[];motion.drawBeltItems(b,(cargo,t)=>result.push([cargo.item,t]));return result;};
 motion.update(s,150);assert.deepEqual(rendered(left),[['gear',.75]]);assert.deepEqual(rendered(right),[]);
 motion.update(s,175);assert.deepEqual(rendered(left),[['gear',.875]]);
 motion.update(s,200);assert.deepEqual(rendered(left),[]);assert.deepEqual(rendered(right),[['gear',0]]);
});
