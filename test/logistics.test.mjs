import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,RESOURCE_KEYS,DEFAULT_PROGRAM,programFor,logisticsPorts,inventoryCount,SAVE_SCHEMA,migrateGame,key,logisticsStatus,conveyorCount,conveyorProgress,BELT_CAPACITY,copySetup} from '../public/shared/sim.js';
const rich=s=>{for(const r of RESOURCE_KEYS)s.resources[r]=100000;};
function fixture(){const s=createGame(),p=addPlayer(s);s.nextWave=99999;s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];rich(s);const build=(type,x,z,dir=0)=>{assert.equal(command(s,p.id,{type:'build',building:type,x,z,dir}),null);return s.buildings.find(b=>b.x===x&&b.z===z);};return{s,p,build};}
function setProgram(s,p,b,values={}){return command(s,p.id,{type:'configureLogistics',x:b.x,z:b.z,id:b.id,program:{...DEFAULT_PROGRAM,...values}});}
function setWarehouse(s,p,b,item){return command(s,p.id,{type:'configureWarehouse',x:b.x,z:b.z,id:b.id,item});}
test('warehouse deliveries enter shared stock immediately without needing a lighthouse route',()=>{
 const {s,p,build}=fixture(),warehouse=build('storage',-1,0),inbound=build('belt',-2,0);
 s.resources.plate=425;assert.equal(setWarehouse(s,p,warehouse,'plate'),null);
 const loaded=migrateGame(JSON.parse(JSON.stringify(s))),exporter=loaded.buildings.find(b=>b.id===warehouse.id),source=loaded.buildings.find(b=>b.id===inbound.id);
 source.item='plate';source.itemTick=loaded.tick;for(let i=0;i<40;i++)step(loaded);
 assert.equal(exporter.stock.plate,1);assert.equal(loaded.resources.plate,426);
 for(let i=0;i<40;i++)step(loaded);assert.equal(exporter.stock.plate,1);assert.equal(loaded.resources.plate,426);
});
test('blocked conveyors fill evenly and drain without losing their saved cargo',()=>{
 const {s,p,build}=fixture(),warehouse=build('storage',5,3),belts=[build('belt',6,3),build('belt',7,3,1),build('belt',7,4,1)];
 warehouse.stock={plate:30,gear:2};s.resources.plate=330;s.resources.gear=2;assert.equal(setWarehouse(s,p,warehouse,'plate'),null);
 for(let i=0;i<150;i++)step(s);
 assert.deepEqual(belts.map(conveyorCount),[4,4,4]);assert.deepEqual(warehouse.stock,{plate:18,gear:2});
 for(const belt of belts){
  const positions=[belt,...belt.beltQueue].map(cargo=>conveyorProgress(belt,cargo,s.tick));
  assert.deepEqual(positions,[1,.75,.5,.25]);
 }
 const loaded=migrateGame(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(loaded.buildings.filter(b=>b.type==='belt').map(conveyorCount),Array(3).fill(BELT_CAPACITY));
 assert.equal(setWarehouse(loaded,p,warehouse,null),null);const stockBeforeConstruction=loaded.resources.plate;
 assert.equal(command(loaded,p.id,{type:'build',building:'storage',x:7,z:5}),null);
 for(let i=0;i<100;i++)step(loaded);
 assert.deepEqual(loaded.buildings.find(b=>b.x===7&&b.z===5).stock,{plate:12});
 assert.equal(loaded.resources.plate,stockBeforeConstruction-30+12);
 assert.equal(loaded.buildings.filter(b=>b.type==='belt').reduce((n,b)=>n+conveyorCount(b),0),0);
});
test('a warehouse feeds the adjacent component recipe using only its own belt deliveries',()=>{
 const {s,p,build}=fixture(),warehouse=build('storage',5,3),factory=build('componentFactory',6,3);
 const source=build('belt',4,3),other=build('storage',5,5);
 for(const r of RESOURCE_KEYS)s.resources[r]=0;other.stock={steel:2,circuit:2,gear:1};Object.assign(s.resources,other.stock);
 assert.equal(setWarehouse(s,p,warehouse,'power'),'Invalid warehouse material');
 assert.equal(setWarehouse(s,p,warehouse,'recipe'),null);
 assert.equal(copySetup(s,[warehouse.id])[0].exportItem,'recipe');
 const coreStock=RESOURCE_KEYS.map(item=>s.resources[item]);
 for(let i=0;i<250;i++)step(s);
 assert.equal(factory.item,null);
 assert.deepEqual(factory.input,[]);
 for(const item of ['steel','circuit','steel','circuit','gear']){
  source.item=item;source.itemTick=s.tick;
  for(let i=0;i<8;i++)step(s);
 }
 for(let i=0;i<250;i++)step(s);
 assert.equal(factory.item,'module');
 assert.deepEqual(factory.input,[]);
 assert.deepEqual(RESOURCE_KEYS.map(item=>s.resources[item]),coreStock);
 assert.deepEqual(other.stock,{steel:2,circuit:2,gear:1});
 assert.deepEqual(warehouse.stock,{});
});
function splitterFixture(program){const f=fixture(),b=f.build('splitter',6,4,0),machine=f.build('storage',6,3),forward=f.build('belt',7,4),back=f.build('belt',6,5,1);for(const r of RESOURCE_KEYS)f.s.resources[r]=0;assert.equal(setProgram(f.s,f.p,b,program),null);return{...f,b,machine,forward,back};}
function deliverSplit(f,n,items='plate'){
 let supplied=0,forward=0,back=0;
 for(let t=0;t<10000;t++){
  if(!f.b.item&&supplied<n){f.b.item=items;f.b.itemTick=f.s.tick;supplied++;}
  step(f.s);
  if(f.forward.item){forward++;f.forward.item=null;}if(f.back.item){back++;f.back.item=null;}
  if(supplied===n&&!f.b.item)return{forward,back,machine:f.machine.stock?.[items]||0};
 }throw Error('Dispatch did not complete');
}
test('dispatch hub default is 1 Machine, 1 Forward, no Return',()=>{
 const f=splitterFixture({bypass:false});assert.deepEqual(programFor(f.b),{...DEFAULT_PROGRAM,bypass:false});assert.deepEqual(deliverSplit(f,20),{machine:10,forward:10,back:0});assert.equal(f.b.shipments.machine,10);assert.equal(f.b.shipments.forward,10);
});
test('custom 2 / 3 / 1 batches repeat exactly and preserve all 60 items',()=>{
 const f=splitterFixture({machine:2,forward:3,return:1,bypass:false});const got=deliverSplit(f,60);assert.deepEqual(got,{machine:20,forward:30,back:10});assert.equal(got.machine+got.forward+got.back,60);assert.deepEqual(f.b.shipments,{machine:20,forward:30,return:10,bypassed:0});
});
test('blocked exact output retains the item and quota; bypass resumes the quota later',()=>{
 const f=splitterFixture({bypass:false});f.machine.stock={plate:300};f.s.resources.plate=300;f.b.item='plate';f.b.itemTick=0;const remaining=f.b.remaining;for(let i=0;i<40;i++)step(f.s);assert.equal(f.b.item,'plate');assert.equal(f.b.remaining,remaining);assert.equal(f.forward.item,null);
 assert.equal(setProgram(f.s,f.p,f.b,{bypass:true}),null);for(let i=0;i<8;i++)step(f.s);assert.equal(f.forward.item,'plate');assert.equal(f.b.remaining,1);assert.equal(f.b.shipments.bypassed,1);
});
test('item filter passes unrelated cargo without spending the active batch',()=>{
 const f=splitterFixture({filter:'copper',bypass:false});assert.deepEqual(deliverSplit(f,10,'plate'),{machine:0,forward:10,back:0});assert.equal(f.b.phase,0);assert.equal(f.b.remaining,1);assert.equal(f.b.shipments.bypassed,10);
});
test('program validation is atomic, including empty, fractional and over-limit quotas',()=>{
 const f=splitterFixture({}),before=JSON.stringify(f.s);
 for(const patch of[{machine:0,forward:0,return:0},{machine:-1},{forward:101},{return:1.2},{filter:'invalid'},{buffer:99},{bypass:'false'}]){assert.ok(setProgram(f.s,f.p,f.b,patch));assert.equal(JSON.stringify(f.s),before);}
});
test('transfer relay alternates loading a machine and leaving an item on the same conveyor',()=>{
 const f=fixture(),relay=f.build('inserter',6,3,3),source=f.build('belt',6,4),out=f.build('belt',7,4),machine=f.build('storage',6,2);for(const r of RESOURCE_KEYS)f.s.resources[r]=0;setProgram(f.s,f.p,relay,{bypass:false});let sent=0,passed=0;
 for(let t=0;t<3000;t++){if(!source.item&&sent<20){source.item='plate';source.itemTick=f.s.tick;sent++;}step(f.s);if(out.item){passed++;out.item=null;}if(sent===20&&!source.item)break;}
 assert.equal(machine.stock?.plate,10);assert.equal(passed,10);assert.equal(relay.shipments.machine,10);assert.equal(relay.shipments.forward,10);assert.ok(machine);assert.deepEqual(logisticsPorts(relay),{input:1,machine:3,forward:3,return:0});
});
test('a return-only relay uses its separate right port and never duplicates cargo',()=>{
 const f=fixture(),relay=f.build('inserter',6,3,3),source=f.build('belt',6,4),back=f.build('belt',7,3,1);setProgram(f.s,f.p,relay,{machine:0,forward:0,return:1,bypass:false,filter:'any'});source.item='ore';source.itemTick=0;step(f.s);assert.equal(source.item,null);assert.equal(back.item,'ore');assert.equal(relay.shipments.return,1);for(let t=0;t<30;t++)step(f.s);assert.equal(relay.shipments.return,1);
});
test('no power leaves the main conveyor flowing without a false machine delivery',()=>{
 const f=fixture();for(let i=0;i<6;i++)f.build('smelter',i-6,8);
 const relay=f.build('inserter',6,3,3),source=f.build('belt',6,4),out=f.build('belt',7,4);f.build('storage',6,2);
 source.item='plate';source.itemTick=0;for(let t=0;t<8;t++)step(f.s);assert.equal(out.item,'plate');assert.equal(relay.active,false);assert.equal(relay.shipments,undefined);
});
test('three real smelters share one conveyor equally with 1:2 → 1:1 → 1:0',()=>{
 for(const mode of ['splitter','inserter']){
  const f=fixture(),routers=[];
  for(const x of[6,8,10]){routers.push(f.build(mode,x,mode==='splitter'?4:3,mode==='splitter'?0:3));f.build('smelter',x,mode==='splitter'?3:2,3);if(mode==='splitter')f.build('belt',x,2,3);f.build('storage',x,1);if(mode==='inserter')f.build('belt',x,4,0);}
  for(const x of[5,7,9])f.build('belt',x,4,0);const source=f.s.buildings.find(b=>b.x===5&&b.z===4);
  routers.forEach((b,i)=>assert.equal(setProgram(f.s,f.p,b,{machine:1,forward:[2,1,0][i],return:0,bypass:false}),null));
  for(const r of RESOURCE_KEYS)f.s.resources[r]=0;let supplied=0;
  const warehouses=f.s.buildings.filter(b=>b.type==='storage');
  for(let t=0;t<5000;t++){if(!source.item&&supplied<60){source.item='ore';source.itemTick=f.s.tick;supplied++;}step(f.s);if(warehouses.every(b=>b.stock?.plate===20))break;}
  assert.deepEqual(warehouses.map(b=>b.stock?.plate),[20,20,20],mode+' must produce all plates');assert.deepEqual(routers.map(b=>b.shipments.machine),[20,20,20]);assert.deepEqual(routers.map(b=>b.shipments.forward),[40,20,0]);
 }
});
test('program and partial batch persist through relocation and save migration',()=>{
 const f=splitterFixture({machine:2,forward:3,return:1,bypass:false});f.b.item='plate';for(let t=0;t<8;t++)step(f.s);assert.equal(f.b.remaining,1);assert.equal(command(f.s,f.p.id,{type:'moveArea',ids:[f.b.id],dx:2,dz:3}),null);const b=f.s.buildings.find(v=>v.x===8&&v.z===7);assert.equal(b.remaining,1);assert.equal(b.program.return,1);assert.equal(b.shipments.machine,1);const loaded=migrateGame(JSON.parse(JSON.stringify(f.s)));assert.equal(loaded.version,SAVE_SCHEMA);assert.equal(loaded.buildings.find(v=>v.id===b.id).remaining,1);
});

test('filtered cargo reports a blocked forward path rather than claiming it can bypass',()=>{
 const f=splitterFixture({filter:'copper'});f.b.item='plate';const grid=new Map(f.s.buildings.map(b=>[key(b.x,b.z),b]));assert.equal(logisticsStatus(f.s,f.b,grid),'bypass');f.forward.item='plate';assert.equal(logisticsStatus(f.s,f.b,grid),'output');
});
