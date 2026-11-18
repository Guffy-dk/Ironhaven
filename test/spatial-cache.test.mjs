import {test} from 'node:test';import assert from 'node:assert/strict';import {createGame,addPlayer,command,step,RESOURCE_KEYS,sawmillTrees,migrateGame} from '../public/shared/sim.js';
function world(){const s=createGame(417),p=addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;for(const r of RESOURCE_KEYS)s.resources[r]=10000;const build=(x,z)=>{assert.equal(command(s,p.id,{type:'build',building:'smelter',x,z}),null);return s.buildings.at(-1);};return{s,p,build};}
test('industry buckets preserve original target tie order and follow moves and same-count replacements',()=>{
 const{s,p,build}=world(),right=build(28,20),left=build(12,20);for(let i=0;i<64;i++)build(-100+(i%8)*2,-100+Math.floor(i/8)*2);
 const e={id:9999,kind:'runner',x:20,z:20,hp:100,maxHp:100,speed:1,cooldown:100};s.enemies=[e];step(s);assert.ok(e.x>20,'earlier right-hand building wins equal-distance tie across buckets');
 assert.equal(command(s,p.id,{type:'moveArea',ids:[right.id],dx:0,dz:10}),null);e.x=e.z=20;step(s);assert.ok(e.x<20,'move invalidates the targeting index');
 assert.equal(command(s,p.id,{type:'demolish',x:left.x,z:left.z}),null);const replacement=build(20,25);e.x=e.z=20;step(s);assert.ok(e.z>20&&Math.abs(e.x-20)<1e-8,'same-count replacement cannot leave a stale target');
 replacement.x=25;replacement.z=20;migrateGame(s);e.x=e.z=20;step(s);assert.ok(e.x>20,'loading a world clears transient indexes');
});
test('cached sawmill counts invalidate for felling, replacement terrain arrays and moved mills',()=>{
 const terrain={trees:[{x:1,z:0}]};assert.equal(sawmillTrees(terrain,{x:0,z:0}),1);assert.equal(sawmillTrees(terrain,{x:0,z:0}),1);assert.equal(sawmillTrees(terrain,{x:20,z:20}),0);terrain.trees=[{x:21,z:20}];assert.equal(sawmillTrees(terrain,{x:0,z:0}),0);assert.equal(sawmillTrees(terrain,{x:20,z:20}),1);terrain.trees.pop();assert.equal(sawmillTrees(terrain,{x:20,z:20}),0);
});
