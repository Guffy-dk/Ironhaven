import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,addPlayer,command,step,updatePower,RESOURCE_KEYS,storageCapacity,warehouseStock,buildingRadius,turretStats,maxHp} from '../public/shared/sim.js';
import {parseSave,packWorldSave} from '../public/shared/saves.js';
import {HARBOR_PROJECTS} from '../public/shared/harbor-projects.js';

function colony() {
 const {state,playerId}=createExpedition('Harbor test',{skipTutorial:true,swarmSeed:417});
 state.terrain.trees=[];
 state.terrain.rocks=[];
 state.nextWave=1e6;
 return {state,playerId,send:cmd=>command(state,playerId,cmd)};
}

test('harbor projects and repeat shipments account for physical stock and persist through endless saves',()=>{
 const {state,playerId,send}=colony();
 const request=project=>send({type:'harborProject',project});
 assert.match(request('shipment'),/project first/);
 assert.equal(send({type:'build',building:'storage',x:4,z:0}),null);
 const warehouse=state.buildings.at(-1);
 warehouse.stock={harborKit:40,switchgear:30,hull:20,firebrick:18};
 Object.assign(state.resources,warehouse.stock);
 updatePower(state);
 const guest=addPlayer(state,'Guest');
 assert.match(command(state,guest.id,{type:'harborProject',project:'grid'}),/host/);
 assert.equal(request('grid'),null);
 assert.equal(state.power.total,42);
 assert.equal(warehouseStock(warehouse,'harborKit'),30);
 assert.equal(warehouseStock(warehouse,'switchgear'),22);
 const capacity=storageCapacity(state);
 assert.equal(request('depot'),null);
 assert.equal(storageCapacity(state),capacity+300);
 assert.equal(request('shipment'),null);
 assert.equal(state.resources.coal,48);
 assert.equal(state.resources.copper,14);
 assert.match(request('shipment'),/150 s/);
 assert.equal(warehouseStock(warehouse,'harborKit'),16);
 state.wave=25;
 state.survived=true;
 state.status='victory';
 assert.match(request('shipment'),/expedition has ended/);
 assert.equal(send({type:'continueAfterVictory'}),null);
 const loaded=parseSave(JSON.stringify(packWorldSave(state,playerId))).state;
 assert.deepEqual(loaded.harbor,state.harbor);
 assert.equal(storageCapacity(loaded),capacity+300);
 assert.equal(loaded.power.total,42);
 loaded.time+=HARBOR_PROJECTS.shipment.interval;
 assert.equal(command(loaded,playerId,{type:'harborProject',project:'shipment'}),null);
 assert.equal(loaded.resources.coal,96);
 assert.equal(loaded.harbor.shipments,2);
});

test('shipment makes no changes when its imports would exceed the shared capacity',()=>{
 const {state,send}=colony();
 Object.assign(state.resources,{wood:0,plate:0,gear:0,switchgear:8,harborKit:16,firebrick:6});
 assert.equal(send({type:'harborProject',project:'grid'}),null);
 state.resources.plate=storageCapacity(state)-12;
 const before=structuredClone(state.resources);
 assert.match(send({type:'harborProject',project:'shipment'}),/Free space/);
 assert.deepEqual(state.resources,before);
 assert.equal(state.harbor.shipments,0);
});

test('warehouse export holds back locally owned project stock and resumes when replenished',()=>{
 const {state,send}=colony();
 state.resources.plate=1000;
 state.resources.wood=1000;
 state.resources.gear=100;
 for(const [type,x] of [['storage',3],['belt',4]])assert.equal(send({type:'build',building:type,x,z:0}),null);
 const warehouse=state.buildings.find(b=>b.type==='storage');
 for(const item of RESOURCE_KEYS)state.resources[item]=0;
 warehouse.stock={switchgear:5};
 state.resources.switchgear=5;
 updatePower(state);
 assert.equal(send({type:'configureWarehouse',id:warehouse.id,x:3,z:0,item:'switchgear',reserve:4}),null);
 for(let tick=0;tick<80;tick++)step(state);
 assert.equal(warehouseStock(warehouse,'switchgear'),4);
 assert.equal(state.resources.switchgear,4);
 assert.equal(state.buildings.find(b=>b.type==='belt').item,'switchgear');
});

test('0.20.2 saves acquire new material slots while retaining resources and rejecting unknown content',()=>{
 const {state,playerId}=colony();
 state.contentSignature='c286c95165328ebb33f5700d94a37b771fa2f586e7da914a3e140ec088a2e324:';
 delete state.resources.harborKit;
 const loaded=parseSave(JSON.stringify({state,playerId})).state;
 assert.equal(loaded.resources.harborKit,0);
 assert.equal(loaded.resources.plate,state.resources.plate);
 state.contentSignature+='different-mod@1.0.0:other';
 assert.throws(()=>parseSave(JSON.stringify({state,playerId})),/content does not match/);
});

test('the coastal defenses use building commands, illuminate outposts and specialize against armor',()=>{
 const {state,send}=colony();
 for(const item of RESOURCE_KEYS)state.resources[item]=40;
 assert.equal(send({type:'buildRow',building:'basaltBreakwater',start:{x:7,z:4},end:{x:9,z:4}}),null);
 assert.equal(state.buildings.filter(b=>b.type==='basaltBreakwater').length,3);
 assert.ok(maxHp({type:'basaltBreakwater'})>maxHp({type:'wall'}));
 assert.equal(send({type:'build',building:'signalMast',x:6,z:10}),null);
 assert.equal(send({type:'build',building:'coastWatch',x:13,z:0}),null);
 const mast=state.buildings.find(b=>b.type==='signalMast');
 assert.equal(buildingRadius(mast),10);
 const addEnemy=(x,z)=>({id:state.nextId++,kind:'guard',hp:550,maxHp:550,x,z,speed:0,damage:1,cooldown:1});
 const lit=addEnemy(6,19),dark=addEnemy(23,0);
 state.enemies.push(lit,dark);
 step(state);
 assert.equal(lit.illuminated,true);
 assert.equal(dark.illuminated,false);
 assert.equal(dark.hp,550-turretStats({type:'coastWatch'}).damage);
 assert.ok(turretStats({type:'coastWatch',level:30}).damage<dark.maxHp);
});
