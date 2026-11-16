import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createGame,addPlayer,removePlayer,command,step,canBuild,planRoute,beltInputs,key,inventoryCount,migrateGame,maxHp,turretStats,RESOURCE_KEYS,MAX_UPGRADES,SAVE_SCHEMA} from '../public/shared/sim.js';
import {encodeCode,decodeCode} from '../public/network.js';
import {validateRelease,releaseMarkdown} from '../scripts/release-metadata.mjs';
import {CURRENT_VERSION,RELEASES} from '../public/shared/releases.js';
const make=()=>{const s=createGame();s.nextWave=9999;const p=addPlayer(s);return{s,p};};
const run=(s,n)=>{for(let i=0;i<n*20;i++)step(s);};
test('smart routes have no gaps, turn correctly and avoid trees and buildings',()=>{
 const{s,p}=make();s.terrain.trees.push({x:4,z:4,h:1});
 const plan=planRoute(s,'belt',{x:2,z:4},{x:6,z:6},0);assert.equal(plan.error,null);assert.ok(plan.cells.length>=7);assert.ok(!plan.cells.some(c=>c.x===4&&c.z===4));
 for(let i=1;i<plan.cells.length;i++){const a=plan.cells[i-1],b=plan.cells[i];assert.equal(Math.abs(a.x-b.x)+Math.abs(a.z-b.z),1);assert.equal(a.dir,b.x>a.x?0:b.z>a.z?1:b.x<a.x?2:3);}
 const before=s.resources.wood;assert.equal(command(s,p.id,{type:'buildRow',building:'belt',start:{x:2,z:4},end:{x:6,z:6},dir:0}),null);assert.equal(s.resources.wood,before-plan.cells.length);
 assert.equal(command(s,p.id,{type:'buildRow',building:'wall',start:{x:2,z:8},end:{x:5,z:8},dir:0}),null);
 // Extend a barricade row from an existing section without paying for it twice.
 const wood=s.resources.wood;assert.equal(command(s,p.id,{type:'buildRow',building:'wall',start:{x:5,z:8},end:{x:7,z:8},dir:0}),null);assert.equal(s.resources.wood,wood-10);
});
test('routes connect to factory inputs and retain inventory/resources atomically on failure',()=>{
 const{s,p}=make();const smelter=s.buildings.find(b=>b.type==='smelter');
 const plan=planRoute(s,'belt',{x:-9,z:-5},{x:smelter.x,z:smelter.z},0);assert.equal(plan.error,null);assert.ok(!plan.cells.some(c=>c.x===smelter.x&&c.z===smelter.z));
 const last=plan.cells.at(-1),dirs=[[1,0],[0,1],[-1,0],[0,-1]];assert.deepEqual([last.x+dirs[last.dir][0],last.z+dirs[last.dir][1]],[smelter.x,smelter.z]);
 s.resources.wood=0;p.inventory.belt=[{hp:40,ammo:0,level:1,input:[],item:null,progress:0,cooldown:0}];const before=JSON.stringify(s);
 assert.match(command(s,p.id,{type:'buildRow',building:'belt',start:{x:2,z:4},end:{x:6,z:6},dir:0}),/entire route/);assert.equal(JSON.stringify(s),before);
});
test('corner topology and in-place rotation preserve cargo, health, identity and materials',()=>{
 const{s,p}=make(),b=s.buildings.find(b=>b.x===-1&&b.z===-1),grid=new Map(s.buildings.map(v=>[key(v.x,v.z),v]));assert.deepEqual(beltInputs(b,grid),[3]);
 b.item='plate';b.hp=43;const id=b.id,resources={...s.resources};assert.equal(command(s,p.id,{type:'rotate',x:b.x,z:b.z}),null);assert.equal(b.dir,1);assert.equal(b.item,'plate');assert.equal(b.hp,43);assert.equal(b.id,id);assert.deepEqual(s.resources,resources);
});
test('dismantled upgraded turrets retain state and are placed without raw materials',()=>{
 const{s,p}=make(),b=s.buildings.find(b=>b.type==='turret');b.type='gunTurret';const x=b.x,z=b.z;
 assert.equal(command(s,p.id,{type:'upgrade',x,z}),null);b.hp=417;b.ammo=3;
 const resources={...s.resources};assert.equal(command(s,p.id,{type:'demolish',x,z}),null);assert.equal(inventoryCount(s,p.id,'gunTurret'),1);assert.deepEqual(s.resources,resources);
 s.resources=Object.fromEntries(RESOURCE_KEYS.map(r=>[r,0]));assert.equal(canBuild(s,'gunTurret',x,z,p.id),null);assert.equal(command(s,p.id,{type:'build',building:'gunTurret',x,z,dir:0}),null);
 const placed=s.buildings.find(v=>v.x===x&&v.z===z);assert.equal(placed.hp,417);assert.equal(placed.ammo,3);assert.equal(placed.level,2);assert.equal(inventoryCount(s,p.id,'gunTurret'),0);assert.deepEqual(s.resources,Object.fromEntries(RESOURCE_KEYS.map(r=>[r,0])));
});
test('turret upgrades affect range, damage and health and extend past Mk III and stop after ten upgrades',()=>{
 const{s,p}=make(),b=s.buildings.find(b=>b.type==='turret'&&b.x===6);b.type='gunTurret';s.buildings=s.buildings.filter(v=>v===b||v.type==='hq');b.ammo=3;
 s.enemies=[{id:999,x:b.x+10.25,z:b.z,hp:200,maxHp:200,speed:0,cooldown:0,brute:false}];step(s);assert.equal(s.enemies[0].hp,200);
 b.hp-=50;assert.equal(command(s,p.id,{type:'upgrade',x:b.x,z:b.z}),null);assert.equal(maxHp(b),500);assert.equal(b.hp,450);step(s);assert.equal(s.enemies[0].hp,152);
 s.resources.plate=100;s.resources.gear=50;assert.equal(command(s,p.id,{type:'upgrade',x:b.x,z:b.z}),null);assert.equal(maxHp(b),700);assert.equal(turretStats(b).range,11);for(const r of RESOURCE_KEYS)s.resources[r]=1000000;for(let i=3;i<=MAX_UPGRADES;i++)assert.equal(command(s,p.id,{type:'upgrade',x:b.x,z:b.z}),null);assert.match(command(s,p.id,{type:'upgrade',x:b.x,z:b.z}),/fully upgraded/);
 assert.equal(command(s,p.id,{type:'repair',x:b.x,z:b.z}),null);assert.equal(b.hp,maxHp(b));
});
test('0.1 saves migrate without losing production, resources or built buildings',()=>{
 const{s,p}=make();s.version=1;delete p.inventory;for(const b of s.buildings)delete b.level;
 const before={...s.resources},ids=s.buildings.map(b=>b.id);const migrated=migrateGame(JSON.parse(JSON.stringify(s)));assert.equal(migrated.version,SAVE_SCHEMA);assert.deepEqual(migrated.players[0].inventory,{});assert.deepEqual(migrated.resources,before);assert.deepEqual(migrated.buildings.map(b=>b.id),ids);run(migrated,60);assert.ok(migrated.produced.gear>0);
});
test('a departing guest returns packed buildings to the remaining host',()=>{
 const{s,p}=make(),guest=addPlayer(s,'Guest'),belt=s.buildings.find(b=>b.type==='belt');command(s,guest.id,{type:'demolish',x:belt.x,z:belt.z});removePlayer(s,guest.id);assert.equal(inventoryCount(s,p.id,'belt'),1);
});
test('release metadata drives the game and release notes and rejects incompatible invitations',async()=>{
 assert.equal((await validateRelease()).version,CURRENT_VERSION);assert.match(CURRENT_VERSION,/^0\./);assert.ok(RELEASES.some(r=>r.version==='0.2.0'));assert.ok(RELEASES.some(r=>r.version==='0.1.0'));assert.match(releaseMarkdown(RELEASES.find(r=>r.version==='0.2.0')),/Smart conveyor routes/);
 const code=encodeCode({type:'offer',sdp:'v=0'});assert.equal(decodeCode(code,'offer').sdp,'v=0');const data=JSON.parse(atob(code.slice(4)));data.version='0.1.0';assert.throws(()=>decodeCode('IH2.'+btoa(JSON.stringify(data)),'offer'),/versions do not match/);
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');assert.match(html,/<html lang="en">/);assert.match(html,/id="patch-dialog"/);assert.match(html,/data-patch-notes/);
});
