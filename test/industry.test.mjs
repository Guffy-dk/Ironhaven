import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,RESOURCE_KEYS,warehouseStock,OUTPUT_CAPACITY,outputCount,GENERATORS,spendResource,migrateGame} from '../public/shared/sim.js';
function fixture(){
 const s=createGame(417),p=addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;
 for(const r of RESOURCE_KEYS)s.resources[r]=10000;
 const build=(type,x,z,dir=0)=>{assert.equal(command(s,p.id,{type:'build',building:type,x,z,dir}),null);return s.buildings.find(b=>b.x===x&&b.z===z);};
 return{s,p,build,empty(){for(const r of RESOURCE_KEYS)s.resources[r]=0;s.resources.power=180;}};
}
test('ore pressing and fining move physical intermediates and produce exactly three globally available plates from two ore and one coal',()=>{
 const {s,build,empty}=fixture();const press=build('orePress',3,0),finery=build('finery',4,0),wh=build('storage',5,0);empty();
 press.input=['ore','ore'];finery.input=['coal'];
 for(let i=0;i<240;i++)step(s);
 assert.equal(s.resources.plate,3);assert.equal(warehouseStock(wh,'plate'),3);assert.deepEqual(press.input,[]);assert.deepEqual(finery.input,[]);assert.equal(outputCount(press)+outputCount(finery),0);
});
test('finery backpressure retains its ingredients until all three output slots are free across save/load',()=>{
 const {s,build,empty}=fixture(),b=build('finery',3,0);empty();b.input=['concentrate','coal'];b.item='plate';b.outputBuffer=Array(OUTPUT_CAPACITY-2).fill('plate');
 for(let i=0;i<150;i++)step(s);assert.deepEqual(b.input,['concentrate','coal']);assert.equal(outputCount(b),4);
 const loaded=migrateGame(JSON.parse(JSON.stringify(s))),machine=loaded.buildings.find(b=>b.type==='finery');machine.item=null;machine.outputBuffer=[];loaded.resources.power=180;
 for(let i=0;i<105;i++)step(loaded);assert.equal(outputCount(machine),3);assert.deepEqual(machine.input,[]);
});
test('bearings support a non-defense component sink and marine power debits physical warehouse coal once',()=>{
 const {s,p,build,empty}=fixture(),workshop=build('precisionWorkshop',3,0),wh=build('storage',4,0);empty();workshop.input=['steel','steel','copper'];
 for(let i=0;i<125;i++)step(s);assert.equal(s.resources.bearing,1);assert.equal(warehouseStock(wh,'bearing'),1);
 s.resources.bearing=8;wh.stock.bearing=8;s.resources.steel=25;s.resources.module=6;
 assert.equal(command(s,p.id,{type:'build',building:'marineGenerator',x:-3,z:0}),null);assert.equal(s.resources.bearing,0);assert.equal(warehouseStock(wh,'bearing'),0);assert.equal(s.resources.module,0);
 const engine=s.buildings.find(b=>b.type==='marineGenerator');s.resources.coal=1;wh.stock.coal=1;engine.progress=15.99;step(s);assert.equal(s.resources.coal,0);assert.equal(warehouseStock(wh,'coal'),0);assert.equal(GENERATORS.marineGenerator.power,54);
});
