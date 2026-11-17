import {test} from 'node:test';
import assert from 'node:assert/strict';
import {woodland,onTree,walkAroundTrees} from '../public/shared/woodland.js';
import {createExpedition,step} from '../public/shared/sim.js';

test('tree tiles block routes, diagonal corner cuts and enclosed targets; felling opens a real passage',()=>{
 const terrain={trees:[{x:1,z:0},{x:0,z:1}]};let forest=woodland(terrain);
 const at={x:0,z:0},out={};walkAroundTrees(forest,at,{x:1,z:1},.4,out);
 assert.ok(out.x<=0&&out.z<=0,'Cannot cut diagonally between two touching tree tiles');
 const cage={trees:[{x:1,z:0},{x:-1,z:0},{x:0,z:1},{x:0,z:-1}]};
 walkAroundTrees(woodland(cage),at,{x:4,z:0},.4,out);assert.deepEqual(out,{x:0,z:0});
 cage.trees.splice(0,1);const opened=woodland(cage);walkAroundTrees(opened,at,{x:4,z:0},.4,out);assert.ok(out.x>0&&out.z===0);
 const wall={trees:Array.from({length:11},(_,i)=>({x:5,z:i-5}))};forest=woodland(wall);let mover={x:10,z:0},detour=0;
 for(let i=0;i<700&&Math.hypot(mover.x,mover.z)>.15;i++){
  walkAroundTrees(forest,mover,at,.08,out);mover={...out};detour=Math.max(detour,Math.abs(mover.z));assert.equal(onTree(forest,mover.x,mover.z),false);
 }
 assert.ok(detour>5&&Math.hypot(mover.x,mover.z)<.15);
});

test('all five species respect island trees during ordinary movement and lighthouse responses',()=>{
 for(const kind of ['runner','drowned','guard','spitter','walker']){
  const {state:s}=createExpedition('Keeper',{skipTutorial:true});s.nextWave=1e9;
  s.terrain.trees=Array.from({length:9},(_,i)=>({x:6,z:i-4,h:1.2}));s.terrain.rocks=[];
  const core=s.buildings[0];core.lighthouseAuto=false;core.lighthouseAim=core.lighthouseHeading=Math.PI/2;
  const e={id:9000,kind,x:12,z:0,hp:1e8,maxHp:1e8,speed:2,damage:0,cooldown:0,coreHunter:kind==='walker'};s.enemies=[e];
  const forest=woodland(s.terrain);let detour=0;
  for(let i=0;i<800&&Math.hypot(e.x,e.z)>5.5;i++){
   const before={x:e.x,z:e.z};step(s);detour=Math.max(detour,Math.abs(e.z));
   assert.equal(onTree(forest,e.x,e.z),false,kind+' entered a tree');
   assert.ok(Math.hypot(e.x-before.x,e.z-before.z)<=e.speed*.05*1.85+1e-8,kind+' teleported');
  }
  assert.ok(detour>4,kind+' did not navigate around the grove');
  assert.ok(Math.hypot(e.x,e.z)<=5.5,kind+' became stranded');
 }
});
