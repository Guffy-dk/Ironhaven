import {test} from 'node:test';import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,RESOURCE_KEYS,storageCapacity,storageUsed,warehouseCapacity,warehouseUsed,migrateGame,productionSpeed,plateYield,upgradeCost,upgradeLocked,maxUpgrades,turretStats,TURRETS,maxHp,outputCount,beltTravelTicks} from '../public/shared/sim.js';
function fixture(){const s=createGame(417),p=addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;for(const r of RESOURCE_KEYS)s.resources[r]=10000;const build=(type,x,z,dir=0)=>{assert.equal(command(s,p.id,{type:'build',building:type,x,z,dir}),null);return s.buildings.at(-1);};return{s,p,build};}
function empty(s){for(const r of RESOURCE_KEYS)s.resources[r]=0;}
test('a warehouse capacity is shared by mixed items and global stock uses one combined limit',()=>{
 const{s,build}=fixture(),wh=build('storage',5,5),smelter=build('smelter',4,5);empty(s);wh.stock={plate:100,copper:100};Object.assign(s.resources,wh.stock);smelter.item='plate';step(s);assert.equal(smelter.item,'plate');assert.equal(warehouseUsed(wh),warehouseCapacity(wh));
 wh.stock.copper--;s.resources.copper--;step(s);assert.equal(smelter.item,null);assert.equal(warehouseUsed(wh),200);
 empty(s);delete wh.stock;s.resources.wood=storageCapacity(s);smelter.item='plate';step(s);assert.equal(smelter.item,'plate');assert.equal(storageUsed(s),storageCapacity(s));
});
test('v10 surplus survives migration; spending frees capacity and cannot duplicate warehouse ownership',()=>{
 const{s,p,build}=fixture(),wh=build('storage',5,5);empty(s);s.terrain.trees=[{x:8,z:7,h:1}];s.version=10;s.resources.plate=1400;wh.stock={plate:1400};const old=JSON.stringify(s.resources);migrateGame(s);assert.equal(JSON.stringify(s.resources),old);assert.equal(wh.stock.plate,1400);
 assert.equal(command(s,p.id,{type:'build',building:'sawmill',x:7,z:7}),null);assert.equal(s.resources.plate,1388);assert.equal(wh.stock.plate,1388);
});
test('group dismantle is atomic, excludes the lighthouse, and preserves globally counted warehouse goods',()=>{
 const{s,p,build}=fixture(),wh=build('storage',5,5),belt=build('belt',6,5),hq=s.buildings[0];empty(s);wh.stock={gear:20};s.resources.gear=20;
 belt.lastHit=s.time;const before=JSON.stringify(s);assert.match(command(s,p.id,{type:'demolishSelection',ids:[wh.id,belt.id,hq.id]}),/five seconds/);assert.equal(JSON.stringify(s),before);
 s.time+=5;assert.equal(command(s,p.id,{type:'demolishSelection',ids:[wh.id,belt.id,hq.id]}),null);assert.deepEqual(s.buildings.map(b=>b.id),[hq.id]);assert.equal(s.resources.gear,20);
});
test('refining is one-to-one at every level and drill/smelter speed adds exactly 25 percent per upgrade',()=>{
 for(const type of ['drill','copperDrill','coalMine','smelter'])for(let level=1;level<=11;level++){assert.equal(productionSpeed({type,level}),1+(level-1)*.25);assert.equal(plateYield({type:'smelter',level}),1);}
});
test('all four turret types stop at level 30, late upgrades spend components and swarm locks block early maxing',()=>{
 for(const type of TURRETS){const{s,p,build}=fixture(),b=build(type,5,5);s.wave=0;assert.equal(maxUpgrades(type),29);b.level=15;assert.match(upgradeLocked(s,b),/^Level 16 unlocks at swarm \d+$/);assert.equal(turretStats({type,level:30}).name,'Mk 30');assert.ok(upgradeCost(b).module>0);const before=JSON.stringify(s.resources);assert.match(command(s,p.id,{type:'upgrade',x:5,z:5}),/unlocks/);assert.equal(JSON.stringify(s.resources),before);s.wave=25;b.level=29;assert.equal(command(s,p.id,{type:'upgrade',x:5,z:5}),null);assert.equal(b.level,30);assert.equal(upgradeCost(b),null);assert.match(command(s,p.id,{type:'upgrade',x:5,z:5}),/fully upgraded/);assert.ok(turretStats(b).damage<200);}
});
test('all twenty belt upgrades reduce travel time, including the old final tiers',()=>{
 assert.equal(maxUpgrades('belt'),20);let previous=Infinity;for(let level=1;level<=21;level++){const travel=beltTravelTicks({level});assert.ok(travel<previous);previous=travel;}assert.equal(previous,1);assert.ok(beltTravelTicks({level:21})<beltTravelTicks({level:11}));
});
test('legacy transfer relays migrate to numbered hubs in the world and packed inventory',()=>{
 const{s,p,build}=fixture(),hub=build('splitter',5,5);hub.type='inserter';p.inventory.inserter=[{level:2,hp:140}];s.version=10;migrateGame(s);assert.equal(hub.type,'splitter');assert.equal(p.inventory.inserter,undefined);assert.equal(p.inventory.splitter[0].level,2);assert.equal(command(s,p.id,{type:'build',building:'inserter',x:8,z:8}),'Invalid building');
});

test('paused production stops mining and power use, persists in saves, and resumes without losing buffered ore',()=>{
 const{s,p,build}=fixture();s.terrain.ore.push({x:5,z:5});const drill=build('drill',5,5);assert.equal(command(s,p.id,{type:'toggleProduction',id:drill.id,x:5,z:5}),null);const progress=drill.progress;for(let i=0;i<100;i++)step(s);assert.equal(drill.active,false);assert.equal(drill.progress,progress);assert.equal(outputCount(drill),0);assert.equal(s.power.used,0);const loaded=migrateGame(structuredClone(s)),copy=loaded.buildings.find(b=>b.id===drill.id);assert.equal(copy.disabled,true);assert.equal(command(loaded,p.id,{type:'toggleProduction',id:copy.id,x:5,z:5}),null);for(let i=0;i<40;i++)step(loaded);assert.ok(outputCount(copy)>0);
});

test('fractional conveyor upgrades carry unspent time across tile boundaries instead of rounding every tile up',()=>{
 const transit=level=>{const{s,build}=fixture();for(let x=3;x<23;x++){const b=build('belt',x,5);b.level=level;}const end=build('storage',23,5);empty(s);const first=s.buildings.find(b=>b.type==='belt');first.item='plate';first.itemTick=0;first.itemProgress=0;for(let tick=1;tick<100;tick++){step(s);if(s.resources.plate)return tick;}throw Error('Cargo never arrived');};
 const slow=transit(11),next=transit(12),faster=transit(13),max=transit(21);assert.ok(next<slow);assert.ok(faster<next);assert.equal(max,20);assert.equal(slow,40);
});

test('old placed and packed turret health keeps its damage ratio when level stats change, without repeat conversion',()=>{
 const{s,p,build}=fixture(),gun=build('gunTurret',5,5);gun.level=11;gun.hp=1070;s.version=10;p.inventory.mortar=[{level:3,hp:332.5}];migrateGame(s);assert.equal(gun.hp,Math.round(maxHp(gun)*.5));assert.equal(p.inventory.mortar[0].hp,Math.round(maxHp({type:'mortar',level:3})*.5));const health=gun.hp;migrateGame(s);assert.equal(gun.hp,health);
});

test('pulse emplacements trade artillery range and power for substantially higher close-range area damage',()=>{
 for(const level of [1,10,20,30]){const pulse=turretStats({type:'pulseTurret',level}),mortar=turretStats({type:'mortar',level});assert.ok(pulse.damage/pulse.interval>1.8*mortar.damage/mortar.interval);assert.ok(pulse.range<mortar.range);assert.ok(pulse.radius<mortar.radius);assert.ok(pulse.damage<398,'final-wave runners survive a direct pulse hit');assert.equal(pulse.ammoDivisor,2);}
});

test('circuit and component upgrades add 20 percent of base production per level',()=>{
 for(const type of ['circuitLab','componentFactory']){
  assert.equal(productionSpeed({type,level:1}),1);
  assert.equal(productionSpeed({type,level:6}),2);
  assert.equal(productionSpeed({type,level:11}),3);
 }
 assert.equal(productionSpeed({type:'foundry',level:11}),2);
});
