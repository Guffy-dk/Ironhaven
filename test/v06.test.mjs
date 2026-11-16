import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,command,createGame,step,waveForecast,inventoryCount,SAVE_SCHEMA,key} from '../public/shared/sim.js';
import {factoryStatus} from '../public/shared/diagnostics.js';
import {parseSave} from '../public/shared/saves.js';

test('all 25 swarms begin at the expanded map edge',()=>{
 const onEdge=[e=>e.x===-90,e=>e.z===-90,e=>e.x===90,e=>e.z===90];
 for(let wave=1;wave<=25;wave++){
  const state=createGame(),player=addPlayer(state);
  state.wave=wave-1;
  const forecast=waveForecast(state);
  state.nextWave=0;step(state);
  assert.equal(state.waveSide,forecast.side);
  assert.equal(state.enemies.length,forecast.count);
  assert.ok(state.enemies.every(onEdge[forecast.side]));
  const before=state.enemies.map(({x,z})=>({x,z}));
  step(state);
  assert.equal(state.enemies.length,forecast.count);
  for(const [i,enemy] of state.enemies.entries()){
   const delta=Math.hypot(enemy.x-before[i].x,enemy.z-before[i].z);
   assert.ok(delta>0&&delta<=enemy.speed*.05*1.85+1e-8,'Hostiles must walk from the outer edge at normal speed');
  }
 }
});

test('a single smelter processes mixed ore delivered by an automatic dispatch filter',()=>{
 const state=createGame(),player=addPlayer(state);
 state.buildings=state.buildings.filter(b=>b.type==='hq');
 const build=(type,x,z,dir)=>{
  assert.equal(command(state,player.id,{type:'build',building:type,x,z,dir}),null);
  return state.buildings.find(b=>b.x===x&&b.z===z);
 };
 const source=build('belt',5,4,0);
 const hub=build('splitter',6,4,0);
 const smelter=build('smelter',6,3,3);
 const output=build('belt',6,2,3);
 const grid=new Map(state.buildings.map(b=>[key(b.x,b.z),b]));
 assert.equal(command(state,player.id,{type:'configureLogistics',x:6,z:4,program:{...hub.program,forward:0}}),null);

 const ore=['copperOre','ore','copperOre','ore'];
 const produced=[];
 let supplied=0;
 for(let i=0;i<500&&produced.length<ore.length;i++){
  if(!source.item&&supplied<ore.length)source.item=ore[supplied++];
  step(state);
  if(smelter.input[0]==='copperOre')assert.notEqual(factoryStatus(state,smelter,grid),'input');
  if(output.item){produced.push(output.item);output.item=null;}
 }
 assert.deepEqual(produced,['copper','plate','copper','plate']);
 assert.equal(hub.shipments.machine,4);
 assert.equal(hub.shipments.bypassed,0);
});

test('older placed and packed copper smelters migrate with cargo, progress and upgrades',()=>{
 const state=createGame(),player=addPlayer(state);
 state.version=5;
 const smelter=state.buildings.find(b=>b.type==='smelter');
 Object.assign(smelter,{type:'copperSmelter',hp:300,level:2,item:'copper',progress:0.8,input:['copperOre']});
 player.inventory={copperSmelter:[{hp:260,level:1,item:'copper',input:['copperOre']}]};
 const loaded=parseSave(JSON.stringify({state,playerId:player.id})).state;
 const building=loaded.buildings.find(b=>b.id===smelter.id);
 assert.equal(loaded.version,SAVE_SCHEMA);
 assert.equal(building.type,'smelter');
 assert.equal(building.level,2);
 assert.equal(building.hp,288);
 assert.equal(building.item,'copper');
 assert.equal(building.progress,0.8);
 assert.deepEqual(building.input,['copperOre']);
 assert.equal(inventoryCount(loaded,player.id,'smelter'),1);
 assert.equal(inventoryCount(loaded,player.id,'copperSmelter'),0);
 assert.equal(loaded.players[0].inventory.smelter[0].hp,250);
});
