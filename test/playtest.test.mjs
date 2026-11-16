import assert from 'node:assert/strict';
import {test} from 'node:test';
import {addPlayer,command,copySetup,createGame,outputCount,planGroupUpgrade,planPaste,step} from '../public/shared/sim.js';
import {packWorldSave,parseSave} from '../public/shared/saves.js';
import {RenderMotion} from '../public/motion.js';
import {factoryStatus} from '../public/shared/diagnostics.js';

function world(){
 const state=createGame(),player=addPlayer(state);
 state.buildings=state.buildings.filter(b=>b.type==='hq');
 state.terrain.trees=[];state.terrain.rocks=[];state.resources.wood=state.resources.plate=state.resources.gear=250;
 const run=cmd=>command(state,player.id,cmd);
 const build=(building,x,z,dir=0)=>{
  assert.equal(run({type:'build',building,x,z,dir}),null);
  return state.buildings.find(b=>b.x===x&&b.z===z);
 };
 return {state,player,run,build};
}

test('render motion interpolates positions between ticks and begins fresh after a respawn or reset',()=>{
 const p={id:1,x:0,z:0,hp:100},s={tick:1,time:.05,players:[p],enemies:[]},motion=new RenderMotion();
 motion.update(s,100);p.x=1;s.tick++;s.time+=.05;motion.update(s,150);
 assert.equal(motion.position(p,{}).x,0);
 motion.update(s,175);assert.equal(motion.position(p,{}).x,.5);assert.equal(motion.renderTick,1.5);
 motion.update(s,200);assert.equal(motion.position(p,{}).x,1);
 p.hp=0;s.tick++;motion.update(s,200);p.hp=100;p.x=10;s.tick++;motion.update(s,250);
 assert.equal(motion.position(p,{}).x,10);
 motion.reset();p.x=3;motion.update(s,300);assert.equal(motion.position(p,{}).x,3);
});

test('copying a setup preserves layout and configuration, and paste charges only missing inventory',()=>{
 const {state,player,run,build}=world(),a=build('belt',6,3,1),b=build('splitter',6,4,2),c=build('smelter',5,4,3);
 const program={machine:2,forward:3,return:4,filter:'copperOre',buffer:4,bypass:false};
 assert.equal(run({type:'configureLogistics',id:b.id,x:b.x,z:b.z,program}),null);
 assert.equal(run({type:'configureOutput',id:c.id,x:c.x,z:c.z,send:true,receive:false}),null);
 const spare=build('belt',5,5);assert.equal(run({type:'demolish',x:spare.x,z:spare.z}),null);
 const layout=copySetup(state,[a.id,b.id,c.id,state.buildings[0].id]);
 assert.equal(layout.length,3);b.program.machine=1;
 const anchor={x:9,z:9},plan=planPaste(state,layout,anchor,player.id);
 assert.equal(plan.error,null);assert.equal(plan.cost.wood,14);
 const wood=state.resources.wood;
 assert.equal(run({type:'pasteSetup',layout,anchor}),null);
 assert.equal(state.resources.wood,wood-14);assert.equal(player.inventory.belt.length,0);
 assert.equal(state.buildings.find(tile=>tile.x===10&&tile.z===9).dir,1);
 assert.deepEqual(state.buildings.find(tile=>tile.x===10&&tile.z===10).program,program);
 assert.equal(state.buildings.find(tile=>tile.x===9&&tile.z===10).sendOutput,true);
 const before=JSON.stringify(state);
 assert.match(run({type:'pasteSetup',layout,anchor}),/occupied/);
 assert.match(run({type:'pasteSetup',layout:[layout[0],layout[0]],anchor:{x:18,z:18}}),/overlapping/);
 assert.equal(JSON.stringify(state),before);
});

test('group upgrades are atomic, charge every eligible upgrade, and preserve damage',()=>{
 const {state,run,build}=world(),a=build('belt',4,4),b=build('belt',5,4),wall=build('wall',6,4);
 a.hp-=10;const ids=[a.id,b.id],cost=planGroupUpgrade(state,ids).cost;
 const wood=state.resources.wood;state.resources.wood=cost.wood-1;
 assert.match(run({type:'upgradeSelection',ids}),/Not enough materials/);assert.equal(a.level,1);assert.equal(b.level,1);
 assert.match(run({type:'upgradeSelection',ids:[a.id,wall.id]}),/one type/);
 state.resources.wood=wood;
 assert.equal(run({type:'upgradeSelection',ids}),null);
 assert.equal(a.level,2);assert.equal(a.hp,Math.round(65*1.25)-10);assert.equal(b.level,2);assert.equal(state.resources.wood,wood-cost.wood);
});

test('unconnected factories buffer up to five items, including across a save and reload',()=>{
 const {state,player,build}=world(),machine=build('assembler',5,5);
 machine.input=Array(24).fill('plate');
 for(let i=0;i<700;i++)step(state);
 assert.equal(outputCount(machine),5);assert.equal(machine.input.length,14);
 const saved=parseSave(JSON.stringify(packWorldSave(state,player.id))).state;
 assert.equal(outputCount(saved.buildings.find(b=>b.id===machine.id)),5);
 build('belt',6,5);step(state);
 assert.equal(outputCount(machine),4);assert.equal(state.buildings.find(b=>b.x===6&&b.z===5).item,'gear');
});

test('matched neighbors move buffered output in order using both switches, one hop per tick',()=>{
 const {state,run,build}=world(),source=build('smelter',5,5),middle=build('smelter',6,5),end=build('smelter',7,5);
 source.item='copper';source.outputBuffer=['plate'];
 const sharing=(b,send,receive)=>run({type:'configureOutput',id:b.id,x:b.x,z:b.z,send,receive});
 assert.equal(sharing(source,true,false),null);step(state);assert.equal(middle.item,null);
 assert.equal(sharing(middle,true,true),null);assert.equal(sharing(end,false,true),null);
 step(state);assert.equal(middle.item,'copper');assert.equal(end.item,null);
 step(state);assert.equal(middle.item,'plate');assert.equal(end.item,'copper');
 step(state);assert.deepEqual(end.outputBuffer,['plate']);
 end.outputBuffer.push('plate','plate','plate');middle.item='copper';
 step(state);assert.equal(outputCount(end),5);assert.equal(middle.item,'copper');
 end.outputBuffer.pop();end.dir=1;
 step(state);assert.equal(outputCount(end),4);assert.equal(middle.item,'copper');
 end.dir=0;step(state);assert.equal(outputCount(end),5);assert.equal(middle.item,null);
 assert.equal(state.stats.totals.copper??0,0,'Forwarding must not count as production');
});

test('Circuit assembler accepts copper and plates from separate belts and delivers a circuit',()=>{
 const {state,build}=world(),machine=build('circuitLab',5,5,0);
 const copperBelt=build('belt',4,5,0),plateBelt=build('belt',5,4,1),output=build('belt',6,5,0);
 const grid=new Map(state.buildings.map(b=>[`${b.x},${b.z}`,b]));
 state.resources.copper=99;state.resources.plate=99;
 assert.equal(factoryStatus(state,machine,grid),'input','Stockpile is separate from the input buffer');
 copperBelt.item='copper';plateBelt.item='plate';
 for(let i=0;i<8;i++)step(state);
 assert.equal(factoryStatus(state,machine,grid),'input','One copper is insufficient');
 copperBelt.item='copper';
 for(let i=0;i<100;i++)step(state);
 assert.equal(output.item,'circuit');assert.equal(state.stats.totals.circuit,1);assert.deepEqual(machine.input,[]);
});

test('placing a packed conveyor clears cargo even for inventory from an older save',()=>{
 const {player,run,build}=world(),belt=build('belt',5,5);
 belt.item='gear';belt.itemTick=20;belt.itemSide=1;belt.level=2;belt.hp=71;
 assert.equal(run({type:'demolish',x:5,z:5}),null);
 const packed=player.inventory.belt[0];assert.equal(packed.item,null);
 Object.assign(packed,{item:'ore',itemTick:21,itemSide:3});
 const placed=build('belt',6,5);
 assert.equal(placed.item,null);assert.equal(placed.itemTick,undefined);assert.equal(placed.itemSide,undefined);
 assert.equal(placed.level,2);assert.equal(placed.hp,71);
});

test('a base assembler makes its first gear after 2.4 seconds',()=>{
 const {state,build}=world(),assembler=build('assembler',5,5);assembler.input=['plate','plate'];
 for(let i=0;i<47;i++)step(state);
 assert.equal(assembler.item,null);step(state);assert.equal(assembler.item,'gear');
});

test('the host can continue a completed evacuation, build and face another swarm after reloading',()=>{
 const {state,player,run,build}=world(),guest=addPlayer(state,'Guest');
 state.status='victory';state.wave=9;state.evacuation={status:'complete',remaining:0};
 assert.match(command(state,guest.id,{type:'continueAfterVictory'}),/Only the host/);
 assert.equal(run({type:'continueAfterVictory'}),null);assert.ok(state.nextWave>state.time);
 build('belt',5,5);
 const data=parseSave(JSON.stringify(packWorldSave(state,player.id)));data.state.nextWave=0;
 step(data.state);assert.equal(data.state.wave,10);assert.ok(data.state.enemies.length>0);assert.equal(data.state.status,'playing');
});
