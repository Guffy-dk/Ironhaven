import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,DIRS,RESOURCE_KEYS,outputCount,storageCapacity,warehouseCapacity} from '../public/shared/sim.js';
function fixture(dir,warehouseDir,item='plate'){
 const s=createGame(),p=addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;
 for(const resource of RESOURCE_KEYS)s.resources[resource]=10000;
 const [dx,dz]=DIRS[dir];for(const [building,x,z,d]of [['smelter',20,20,dir],['storage',20+dx,20+dz,warehouseDir]])assert.equal(command(s,p.id,{type:'build',building,x,z,dir:d}),null);
 const source=s.buildings.find(b=>b.type==='smelter'),warehouse=s.buildings.find(b=>b.type==='storage');
 assert.equal(command(s,p.id,{type:'configureWarehouse',id:warehouse.id,x:warehouse.x,z:warehouse.z,item}),null);
 for(const resource of RESOURCE_KEYS)s.resources[resource]=0;
 return{s,p,source,warehouse};
}
test('smelters deliver iron and copper directly to every warehouse side while warehouse export is configured',()=>{
 for(let dir=0;dir<4;dir++)for(let whDir=0;whDir<4;whDir++)for(const [raw,finished]of [['ore','plate'],['copperOre','copper']]){
  const{s,source,warehouse}=fixture(dir,whDir,finished);const before=s.resources[finished];source.input=[raw,raw];
  for(let i=0;i<100;i++)step(s);
  assert.equal(s.resources[finished],before+2,`${finished}, smelter ${dir}, warehouse ${whDir}`);assert.equal(outputCount(source),0);
 }
});
test('a full warehouse backs up a directly attached smelter without losing stock or input',()=>{
 const{s,source,warehouse}=fixture(0,2);warehouse.stock={plate:warehouseCapacity(warehouse)-1};s.resources.plate=warehouse.stock.plate;source.input=Array(8).fill('ore');
 for(let i=0;i<500;i++)step(s);
 assert.equal(s.resources.plate,warehouseCapacity(warehouse));
 assert.equal(s.resources.plate+outputCount(source)+source.input.length,warehouseCapacity(warehouse)-1+8);
 assert.equal(outputCount(source),5);
 s.resources.plate-=3;warehouse.stock.plate-=3;for(let i=0;i<100;i++)step(s);
 assert.equal(s.resources.plate,warehouseCapacity(warehouse));
 assert.equal(s.resources.plate+outputCount(source)+source.input.length,warehouseCapacity(warehouse)-1+8-3);
});
