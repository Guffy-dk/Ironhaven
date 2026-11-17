import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createExpedition,addPlayer,canBuild,command,step} from '../public/shared/sim.js';
import {coastalLand,coastalHeight} from '../public/shared/coast.js';
import {parseSave} from '../public/shared/saves.js';
test('new expeditions have a dry central lighthouse island, a buildable inland tutorial and sea exclusion',()=>{
 const {state,playerId}=createExpedition('Keeper');const core=state.buildings.find(b=>b.type==='hq');
 assert.deepEqual([core.x,core.z],[0,0]);assert.ok(coastalLand(state.terrain,core.x,core.z));
 assert.equal(canBuild(state,'belt',125,-110,playerId),'Build on dry land above the shoreline');
 assert.equal(canBuild(state,'belt',0,-5,playerId),null);
 assert.ok(coastalHeight(state.terrain,125,-125)<-.8);assert.equal(coastalHeight(state.terrain,0,5),0);
 for(const list of ['trees','rocks','ore','coal','copper'])assert.ok(state.terrain[list].every(p=>coastalLand(state.terrain,p.x,p.z,.8)));
 const before=JSON.stringify(state);assert.match(command(state,playerId,{type:'moveArea',ids:[core.id],dx:3,dz:4}),/anchored/);assert.equal(JSON.stringify(state),before);
 const loaded=parseSave(JSON.stringify({state,playerId})).state;assert.deepEqual(loaded.terrain.coast,state.terrain.coast);assert.equal(loaded.buildings[0].z,0);
});
test('legacy inland worlds are not flooded or relocated during save migration',()=>{
 const state=createGame(),player=addPlayer(state),position={x:state.buildings[0].x,z:state.buildings[0].z};
 const loaded=parseSave(JSON.stringify({state,playerId:player.id})).state;
 assert.equal(loaded.terrain.coast,undefined);assert.equal(coastalHeight(loaded.terrain,-125,-125),0);
 assert.deepEqual({x:loaded.buildings[0].x,z:loaded.buildings[0].z},position);
});


test('island offers twice the old coastal land, open central floor and sparse buildable mineral seams',()=>{
 const {state,playerId}=createExpedition('Keeper',{skipTutorial:true});let land=0,oldLand=0;
 const old={coast:{x:0,shoreZ:-2}};
 for(let x=-128;x<=128;x++)for(let z=-128;z<=128;z++)if(coastalLand(state.terrain,x,z))land++;
 for(let x=-90;x<=90;x++)for(let z=-90;z<=90;z++)if(coastalLand(old,x,z))oldLand++;
 assert.ok(land>oldLand*2);assert.ok(land<oldLand*2.6);
 assert.ok(state.terrain.ore.length+state.terrain.copper.length+state.terrain.coal.length<land*.05);
 assert.equal(canBuild(state,'belt',2,4,playerId),null);
 assert.ok(!state.terrain.rocks.some(t=>Math.hypot(t.x,t.z)<21));
 assert.ok(!state.terrain.trees.some(t=>Math.hypot(t.x,t.z)<8));
 const again=createExpedition('Keeper',{skipTutorial:true}).state;assert.deepEqual(state.terrain,again.terrain);
});
