import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,RESOURCE_KEYS,spendResource,storageCapacity,warehouseStock,migrateGame,SAVE_SCHEMA,outputCount} from '../public/shared/sim.js';
function fixture(){const s=createGame(),p=addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;for(const r of RESOURCE_KEYS)s.resources[r]=10000;const build=(type,x,z,dir=0)=>{assert.equal(command(s,p.id,{type:'build',building:type,x,z,dir}),null);return s.buildings.find(b=>b.x===x&&b.z===z);};return{s,p,build};}
function empty(s){for(const r of RESOURCE_KEYS)s.resources[r]=0;s.resources.power=0;}
test('goods delivered only to a remote warehouse immediately fund construction and remain accounted exactly once',()=>{
 const{s,p,build}=fixture(),wh=build('storage',20,20),smelter=build('smelter',19,20,0);empty(s);smelter.input=Array(4).fill('ore');
 for(let i=0;i<200;i++)step(s);assert.equal(s.resources.plate,4);assert.equal(warehouseStock(wh,'plate'),4);assert.equal(outputCount(smelter),0);
 assert.ok(command(s,p.id,{type:'build',building:'sawmill',x:8,z:3}));
 // Fund a nearby tree and a cheap barricade solely from stored goods.
 s.resources.wood=5;assert.equal(command(s,p.id,{type:'build',building:'wall',x:6,z:0}),null);
 assert.equal(s.resources.plate,2);assert.equal(warehouseStock(wh,'plate'),2);
});
test('global ammunition and fuel consumption also debit the warehouses holding those goods',()=>{
 const{s,build}=fixture(),wh=build('storage',20,20),gun=build('gunTurret',4,0),generator=build('generator',-4,0);empty(s);
 wh.stock={gear:2,wood:1};s.resources.gear=2;s.resources.wood=1;
 step(s);assert.ok(gun.ammo>0);assert.equal(s.resources.gear,1);assert.equal(warehouseStock(wh,'gear'),1);
 for(let i=0;i<245;i++)step(s);assert.equal(s.resources.wood,0);assert.equal(warehouseStock(wh,'wood'),0);
});
test('warehouse export uses its own remaining goods, while global spending never duplicates ownership',()=>{
 const{s,p,build}=fixture(),wh=build('storage',20,20),other=build('storage',22,20);empty(s);wh.stock={plate:3};other.stock={plate:4};s.resources.plate=9;
 assert.equal(spendResource(s,'plate',4),true);assert.equal(s.resources.plate,5);assert.equal(warehouseStock(wh,'plate'),1);assert.equal(warehouseStock(other,'plate'),4);
 s.resources.wood=1;const belt=build('belt',21,20,1);
 assert.equal(command(s,p.id,{type:'configureWarehouse',id:wh.id,x:20,z:20,item:'plate'}),null);
 for(let i=0;i<30;i++)step(s);assert.equal(s.resources.plate,4);assert.equal(warehouseStock(wh,'plate'),0);assert.equal(warehouseStock(other,'plate'),4);assert.equal(belt.item,'plate');
 for(let i=0;i<30;i++)step(s);assert.equal(s.resources.plate,4);
});
test('schema-nine warehouse contents merge into shared totals once, including packed contents, without moving terrain',()=>{
 const{s,p,build}=fixture(),wh=build('storage',20,20);empty(s);s.version=9;s.resources.plate=5;wh.stock={plate:12,gear:3};p.inventory.storage=[{level:1,hp:600,stock:{plate:2}}];
 const terrain=JSON.stringify(s.terrain),loaded=migrateGame(structuredClone(s));
 assert.equal(loaded.version,SAVE_SCHEMA);assert.equal(loaded.resources.plate,19);assert.equal(loaded.resources.gear,3);assert.equal(loaded.buildings.find(b=>b.id===wh.id).stock.plate,12);assert.equal(loaded.players[0].inventory.storage[0].stock,undefined);assert.equal(JSON.stringify(loaded.terrain),terrain);
 migrateGame(loaded);assert.equal(loaded.resources.plate,19);assert.equal(loaded.resources.gear,3);
});
test('removing a warehouse reduces capacity without discarding or crediting stored goods twice',()=>{
 const{s,p,build}=fixture(),wh=build('storage',20,20);empty(s);wh.stock={gear:5};s.resources.gear=5;const capacity=storageCapacity(s);
 assert.equal(command(s,p.id,{type:'demolish',x:20,z:20}),null);assert.equal(s.resources.gear,5);assert.equal(storageCapacity(s),capacity-200);
});
