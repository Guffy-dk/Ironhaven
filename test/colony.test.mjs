import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,beltTravelTicks,BUILD_EDGE,command,createGame,FINAL_WAVE,makeTerrain,POWER_CAPACITY,step,waveForecast} from '../public/shared/sim.js';
import {stockFlow} from '../public/shared/diagnostics.js';
import {packWorldSave,parseSave} from '../public/shared/saves.js';
import {RenderMotion} from '../public/motion.js';
import {Lan} from '../public/network.js';

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

test('seeded large maps vary beyond the clear center and keep starter deposits available',()=>{
 const first=makeTerrain(123),second=makeTerrain(456);
 assert.equal(BUILD_EDGE*2+1,181);
 assert.deepEqual(first,makeTerrain(123));
 assert.notDeepEqual(first.trees,second.trees);
 assert.notDeepEqual(first.coal,second.coal);
 for(const terrain of [first,second]){
  assert.ok(terrain.ore.some(t=>t.x===4&&t.z===3));
  assert.ok(terrain.copper.some(t=>Math.hypot(t.x,t.z)<12));
  assert.ok(terrain.coal.some(t=>Math.hypot(t.x,t.z)<16));
  assert.ok(!terrain.trees.some(t=>Math.hypot(t.x,t.z)<11));
  assert.ok(terrain.trees.some(t=>Math.abs(t.x)>60||Math.abs(t.z)>60));
 }
});

test('large LAN maps are delivered in small ordered chunks and reconstructed for the guest',()=>{
 const message={type:'welcome',state:createGame()};
 assert.ok(JSON.stringify(message).length>262144);
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
 const mill=build('sawmill',7,5);
 assert.equal(mill.active,true);
 for(let i=0;i<74;i++)step(s);
 assert.ok(s.resources.wood>0);assert.ok(generator.active);assert.equal(s.power.total,36);
 assert.equal(command(s,p.id,{type:'demolish',x:8,z:5}),null);
});

test('sentries fire without consuming gears or power and cannot be upgraded',()=>{
 const {s,p,build}=world(),sentry=build('turret',4,4);
 s.resources.gear=0;s.resources.wood=0;
 s.enemies=[{id:900,x:5,z:4,hp:100,speed:0,cooldown:1}];
 step(s);assert.equal(s.resources.gear,0);assert.ok(s.enemies[0].hp<100);
 assert.match(command(s,p.id,{type:'upgrade',x:4,z:4}),/cannot be upgraded/);assert.equal(sentry.level,1);
});

test('coal mines feed a coal generator through storage and fuel consumption appears in stock flow',()=>{
 const {s,build}=world();
 build('coalMine',10,10);build('storage',11,10);build('coalGenerator',13,10);
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
 assert.equal(new Set(directions(111)).size,4);
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
 motion.update(s,150);assert.equal(motion.beltCargo(left)?.item,'gear');assert.equal(motion.beltCargo(right),undefined);
 motion.update(s,200);assert.equal(motion.beltCargo(right).item,'gear');
});
