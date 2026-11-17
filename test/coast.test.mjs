import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createExpedition,addPlayer,canBuild,command,step} from '../public/shared/sim.js';
import {coastalLand,coastalHeight} from '../public/shared/coast.js';
import {parseSave} from '../public/shared/saves.js';
test('new expeditions have a dry lighthouse headland, a buildable inland tutorial and sea exclusion',()=>{
 const {state,playerId}=createExpedition('Keeper');const core=state.buildings.find(b=>b.type==='hq');
 assert.deepEqual([core.x,core.z],[0,-8]);assert.ok(coastalLand(state.terrain,core.x,core.z));
 assert.equal(canBuild(state,'belt',20,-8,playerId),'Build on dry land above the shoreline');
 assert.equal(canBuild(state,'belt',0,-5,playerId),null);
 assert.ok(coastalHeight(state.terrain,20,-20)<-.8);assert.equal(coastalHeight(state.terrain,0,5),0);
 for(const list of ['trees','rocks','ore','coal','copper'])assert.ok(state.terrain[list].every(p=>coastalLand(state.terrain,p.x,p.z,.8)));
 const before=JSON.stringify(state);assert.match(command(state,playerId,{type:'moveArea',ids:[core.id],dx:3,dz:4}),/anchored/);assert.equal(JSON.stringify(state),before);
 const loaded=parseSave(JSON.stringify({state,playerId})).state;assert.deepEqual(loaded.terrain.coast,state.terrain.coast);assert.equal(loaded.buildings[0].z,-8);
});
test('legacy inland worlds are not flooded or relocated during save migration',()=>{
 const state=createGame(),player=addPlayer(state),position={x:state.buildings[0].x,z:state.buildings[0].z};
 const loaded=parseSave(JSON.stringify({state,playerId:player.id})).state;
 assert.equal(loaded.terrain.coast,undefined);assert.equal(coastalHeight(loaded.terrain,-20,-20),0);
 assert.deepEqual({x:loaded.buildings[0].x,z:loaded.buildings[0].z},position);
});
