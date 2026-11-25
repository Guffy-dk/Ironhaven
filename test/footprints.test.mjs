import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,buildingGrid,canBuild,command,createExpedition,createGame,edgeTile,footprint,footprintCells,footprintOutput,key,occupies,outputPointsAt,productionSpeed,step,TYPES} from '../public/shared/sim.js';
import {footprintDemoWorld} from '../scripts/footprint-demo-world.mjs';

function world(){
 const s=createGame(),p=addPlayer(s);
 s.buildings=s.buildings.filter(b=>b.type==='hq');
 s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e6;
 Object.assign(s.resources,{wood:900,plate:900,steel:900,gear:900,circuit:900,module:900});
 const build=(type,x,z,dir=0)=>command(s,p.id,{type:'build',building:type,x,z,dir});
 return {s,p,build};
}

test('buildings have distinct square footprints: logistics one tile, machines three, halls five',()=>{
 for(const type of ['belt','splitter','wall','lamp','turret','gunTurret'])assert.equal(footprint(type),1,type);
 for(const type of ['drill','copperDrill','coalMine','smelter','assembler','foundry','circuitLab','sawmill','generator','coalGenerator','hq','firebrickKiln','marineGenerator'])assert.equal(footprint(type),3,type);
 for(const type of ['storage','componentFactory'])assert.equal(footprint(type),5,type);
 assert.equal(footprintCells('smelter',4,7).length,9);
 assert.equal(footprintCells('storage',0,0).length,25);
});

test('a footprint occupies every cell for lookups, picking and commands',()=>{
 const {s,build}=world();
 assert.equal(build('smelter',10,10,0),null);
 const smelter=s.buildings.find(b=>b.type==='smelter'),grid=buildingGrid(s.buildings);
 for(const c of footprintCells('smelter',10,10)){assert.equal(grid.get(key(c.x,c.z)),smelter);assert.ok(occupies(smelter,c.x,c.z));}
 assert.ok(!occupies(smelter,12,10));
 // Any cell of the hall addresses the building in commands.
 assert.equal(command(s,s.players[0].id,{type:'toggleProduction',x:11,z:9,id:smelter.id}),null);
 assert.equal(smelter.disabled,true);
});

test('placement checks the whole area: free, on land, clear and inside the build zone',()=>{
 const {s,p,build}=world();
 assert.equal(build('belt',21,20),null);
 assert.match(canBuild(s,'smelter',20,20,p.id),/Not enough free space/);
 assert.equal(canBuild(s,'smelter',23,20,p.id),null);
 s.terrain.trees.push({x:24,z:31,h:1});
 assert.match(canBuild(s,'smelter',24,30,p.id),/Clear trees and rocks/);
 assert.match(canBuild(s,'storage',0,0,p.id),/Not enough free space/,'the lighthouse is 3×3');
});

test('drills need at least one matching deposit cell under their footprint',()=>{
 const {s,p}=world();
 s.terrain.ore=[{x:31,z:31}];
 assert.equal(canBuild(s,'drill',30,30,p.id),null,'the deposit is under a corner cell');
 assert.match(canBuild(s,'drill',34,34,p.id),/iron deposits/);
});

test('machines hand over output just outside the middle of their output side',()=>{
 const {s,build}=world();
 assert.equal(build('smelter',10,10,0),null);
 const smelter=s.buildings.find(b=>b.type==='smelter');
 assert.deepEqual(edgeTile(smelter,0),{x:12,z:10});
 assert.ok(outputPointsAt(smelter,12,10));
 assert.ok(!outputPointsAt(smelter,11,10));
});

test('larger halls work, power and cost in proportion to their size',()=>{
 const smelter={type:'smelter',level:1};
 assert.equal(footprintOutput('belt'),1);assert.equal(footprintOutput('smelter'),4);assert.equal(footprintOutput('componentFactory'),9);
 assert.equal(productionSpeed(smelter,null,'standard'),4);
 assert.equal(productionSpeed({type:'componentFactory',level:1},null,'standard'),9);
 assert.deepEqual(TYPES.smelter.cost,{wood:36,plate:36});
 assert.deepEqual(TYPES.belt.cost,{wood:1});
});

test('a belt feeds a 3×3 smelter along its side and plates leave through the output edge',()=>{
 const {s,build}=world();
 s.terrain.ore.push(...footprintCells('drill',-10,20));
 assert.equal(build('drill',-10,20,0),null);
 for(let x=-8;x<=-7;x++)assert.equal(build('belt',x,20,0),null);
 assert.equal(build('smelter',-5,20,0),null);
 for(let x=-3;x<=0;x++)assert.equal(build('belt',x,20,0),null);
 assert.equal(build('storage',3,20,0),null);
 // Leave room in shared storage so deliveries are accepted.
 Object.assign(s.resources,{wood:20,plate:20,steel:0,gear:0,circuit:0,module:0});
 const before=s.produced.plate;
 for(let i=0;i<20*30;i++)step(s);
 assert.ok(s.produced.plate-before>=10,`delivered ${s.produced.plate-before} plates`);
});

test('the island is larger and its starter deposits fit rows of 3×3 drills',()=>{
 const {state}=createExpedition('Keeper',{skipTutorial:true}),t=state.terrain;
 const near=(list,x,z,r)=>list.filter(p=>Math.hypot(p.x-x,p.z-z)<=r).length;
 assert.equal(t.coast.rx,168);
 for(const [list,x,z] of [[t.ore,-24,-13],[t.copper,26,-18],[t.coal,-25,24]])assert.ok(near(list,x,z,13)>=150,'a starter field holds a dozen drills');
});

test('the review factory places without errors and delivers plates into its warehouses',()=>{
 const {world:{state},errors}=footprintDemoWorld();
 assert.deepEqual(errors,[]);
 const stocked=state.buildings.filter(b=>b.type==='storage').reduce((n,b)=>n+(b.stock?.plate??0),0);
 assert.ok(stocked>0,'plates reached the warehouses');
 assert.equal(state.buildings.filter(b=>b.type==='smelter').length,8);
});

test('starter chains of 3×3 machines deliver plates and gears to the lighthouse',()=>{
 const s=createGame();s.nextWave=1e6;
 const before={plate:s.resources.plate,gear:s.resources.gear};
 for(let i=0;i<20*60;i++)step(s);
 assert.ok(s.resources.plate>before.plate,'plates arrive');
 assert.ok(s.resources.gear>before.gear,'gears arrive');
});
