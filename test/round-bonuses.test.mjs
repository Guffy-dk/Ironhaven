import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,command,createGame,roundBonus,step,waveForecast} from '../public/shared/sim.js';
import {productionReport} from '../public/shared/diagnostics.js';
import {parseSave,packWorldSave} from '../public/shared/saves.js';

test('the forecast becomes active at spawn, persists after a clear and survives a save',()=>{
 const state=createGame(),player=addPlayer(state);
 assert.equal(roundBonus(state.wave),null);
 const first=waveForecast(state).bonus;
 state.nextWave=state.time;
 step(state);
 assert.equal(roundBonus(state.wave),first);
 assert.ok(state.events.at(-1).text.includes(first.label));
 state.enemies=[];
 step(state);
 const saved=parseSave(JSON.stringify(packWorldSave(state,player.id))).state;
 assert.equal(roundBonus(saved.wave),first);
 const next=waveForecast(saved).bonus;
 saved.nextWave=saved.time;
 step(saved);
 assert.equal(roundBonus(saved.wave),next);
 assert.notEqual(next,first);
});

test('the smelting round speeds up both ore recipes, leaving drills at their normal speed',()=>{
 const state=createGame();
 state.wave=2;
 state.nextWave=9999;
 const [iron,copper]=state.buildings.filter(b=>b.type==='smelter');
 iron.input=['ore'];copper.input=['copperOre'];
 for(let tick=0;tick<26;tick++)step(state);
 assert.equal(state.stats.totals.plate,1);
 assert.equal(state.stats.totals.copper,undefined);
 assert.equal(state.stats.totals.ore,undefined);
 for(let tick=0;tick<6;tick++)step(state);
 assert.equal(state.stats.totals.copper,1);
 assert.equal(state.stats.totals.ore,2);
});

test('the ammunition round gives each gear 20 shots and reduces expected gear demand',()=>{
 const state=createGame(),turret=state.buildings.find(b=>b.type==='turret');
 state.buildings=state.buildings.filter(b=>b===turret||b.type==='hq');
 const demand=()=>productionReport(state).materials.find(r=>r.resource==='gear').demand;
 const original=demand();
 state.wave=3;turret.ammo=0;
 const gears=state.resources.gear;
 step(state);
 assert.equal(turret.ammo,20);
 assert.equal(state.resources.gear,gears-1);
 assert.ok(Math.abs(demand()-original*.8)<1e-9);
 state.wave=4;turret.ammo=0;
 step(state);
 assert.equal(turret.ammo,16);
});

test('the defense and repair rounds have distinct effects',()=>{
 const state=createGame(),player=addPlayer(state);
 player.x=-5;
 assert.equal(command(state,player.id,{type:'build',building:'wall',x:5,z:0}),null);
 const wall=state.buildings.find(b=>b.x===5&&b.z===0);
 const enemy={x:5.55,z:0,hp:200,speed:2,cooldown:0};
 state.enemies=[enemy];
 state.wave=4;
 step(state);
 assert.equal(wall.hp,693);
 state.wave=5;enemy.cooldown=0;
 step(state);
 assert.equal(wall.hp,683);
 state.resources.plate=1;
 assert.equal(command(state,player.id,{type:'repair',x:5,z:0}),'Not enough materials');
 state.wave=6;
 const wood=state.resources.wood;
 assert.equal(command(state,player.id,{type:'repair',x:5,z:0}),null);
 assert.equal(state.resources.plate,0);
 assert.equal(state.resources.wood,wood-4);
 assert.equal(wall.hp,700);
});
