import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,canBuild,command,createGame,key,planRoute,step,turretStats,MAX_UPGRADES} from '../public/shared/sim.js';

test('new colonies keep starter buildings off deposits and have room to expand iron production',()=>{
 for(const seed of [2026,1,42,123456]){
  const state=createGame(seed),player=addPlayer(state);
  const iron=new Set(state.terrain.ore.map(v=>key(v.x,v.z)));
  const copper=new Set(state.terrain.copper.map(v=>key(v.x,v.z)));
  const obstacles=new Set([...state.terrain.trees,...state.terrain.rocks].map(v=>key(v.x,v.z)));
  for(const b of state.buildings){
   assert.equal(iron.has(key(b.x,b.z)),b.type==='drill');
   assert.ok(!copper.has(key(b.x,b.z)));
   assert.ok(!obstacles.has(key(b.x,b.z)));
  }
  assert.equal(canBuild(state,'drill',4,5,player.id),null);
  const trees=new Set(state.terrain.trees.map(v=>key(v.x,v.z)));
  assert.ok(state.terrain.trees.filter(t=>trees.has(key(t.x+1,t.z))&&trees.has(key(t.x,t.z+1))).length>50);
  assert.equal(state.resources.plate,180);
  for(let i=0;i<1200;i++)step(state);
  assert.ok(state.produced.plate>=32);
  assert.ok(state.produced.gear>=14);
 }
});

test('tree tiles slow approaching enemies and clearing the tree restores speed',()=>{
 const state=createGame(),player=addPlayer(state);
 state.buildings=state.buildings.filter(b=>b.type==='hq');
 state.terrain.trees=[{x:10,z:0,h:1}];
 const enemy={x:10.52,z:0,hp:100,speed:2,cooldown:0};
 state.enemies=[enemy];
 step(state);
 assert.ok(Math.abs(enemy.x-10.475)<1e-8);
 assert.equal(command(state,player.id,{type:'demolish',x:10,z:0}),null);
 step(state);
 assert.ok(Math.abs(enemy.x-10.375)<1e-8);
});

test('turret upgrades improve damage efficiency while keeping high-level range bounded',()=>{
 const base=turretStats({level:1}),third=turretStats({level:3}),max=turretStats({level:MAX_UPGRADES+1});
 assert.equal(base.range,10);
 assert.equal(third.range,11);
 assert.equal(max.range,13);
 assert.equal(third.damage,72);
 assert.equal(max.damage,168);
 assert.ok(third.damage/third.interval>base.damage/base.interval);
 assert.ok(max.damage/max.interval>third.damage/third.interval);
});

test('manual placement and routes preserve existing belt exits and avoid head-on merges',()=>{
 const state=createGame(),player=addPlayer(state);
 state.buildings=state.buildings.filter(b=>b.type==='hq');
 state.terrain.trees=[];
 state.terrain.rocks=[];
 const build=(x,z,dir,connectFrom)=>{
  assert.equal(command(state,player.id,{type:'build',building:'belt',x,z,dir,connectFrom}),null);
  return state.buildings.find(b=>b.x===x&&b.z===z);
 };
 const crossing=build(5,5,0);
 const exit=build(6,5,0,{x:5,z:5});
 build(5,6,1,{x:5,z:5});
 assert.equal(crossing.dir,0);
 const route=(start,end)=>command(state,player.id,{type:'buildRow',building:'belt',start,end,dir:0});
 assert.equal(route({x:5,z:3},{x:5,z:8}),null);
 assert.equal(crossing.dir,0);
 assert.equal(exit.dir,0);
 assert.equal(route({x:5,z:2},{x:5,z:5}),null);
 assert.equal(crossing.dir,0);
 const plan=planRoute(state,'belt',{x:8,z:5},{x:6,z:5},2);
 assert.equal(plan.error,null);
 assert.ok(!plan.cells.some(c=>c.x===7&&c.z===5&&c.dir===2));
 assert.match(route({x:5,z:5},{x:4,z:5}),/No clear route/);
 assert.equal(crossing.dir,0);
});
