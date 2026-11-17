import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,updatePower,TYPES,maxHp,upgradeCost,RESOURCE_KEYS} from '../public/shared/sim.js';
import {lampField,LAMP_RADIUS} from '../public/shared/lamps.js';
import {parseSave} from '../public/shared/saves.js';
function fixture(){const s=createGame(),p=addPlayer(s);s.buildings=s.buildings.filter(b=>b.type==='hq');s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e9;s.resources.power=0;for(const r of RESOURCE_KEYS)s.resources[r]=1e6;const core=s.buildings[0];core.lighthouseHeading=core.lighthouseAim=-Math.PI/2;return{s,p,core};}
function build(s,p,x,z=0){assert.equal(command(s,p.id,{type:'build',building:'lamp',x,z}),null);return s.buildings.find(b=>b.x===x&&b.z===z);}
test('harbor lamps charge their full cost, stay fragile and fixed-level, and round-trip through saves',()=>{
 const {s,p}=fixture(),before={...s.resources},lamp=build(s,p,12);
 for(const [r,n]of Object.entries(TYPES.lamp.cost))assert.equal(s.resources[r],before[r]-n);
 assert.equal(lamp.hp,75);assert.equal(maxHp(lamp),75);assert.equal(upgradeCost(lamp),null);assert.match(command(s,p.id,{type:'upgrade',x:12,z:0}),/fixed level/);
 const saved=parseSave(JSON.stringify({state:s,playerId:p.id})).state;assert.equal(saved.buildings.find(b=>b.type==='lamp').hp,75);
 s.resources.plate=0;const stock=JSON.stringify(s.resources);assert.ok(command(s,p.id,{type:'build',building:'lamp',x:14,z:0}));assert.equal(JSON.stringify(s.resources),stock);
});
test('local illumination has exact bounds and turns off for unpowered or destroyed lamps',()=>{
 const lamp={id:1,type:'lamp',x:-12,z:0,hp:75,active:true};
 assert.equal(lampField([lamp]).sourceAt({x:-12+LAMP_RADIUS,z:0}),lamp);
 assert.equal(lampField([lamp]).sourceAt({x:-12+LAMP_RADIUS+.001,z:0}),null);
 assert.equal(lampField([{...lamp,hp:0}]).sourceAt(lamp),null);assert.equal(lampField([{...lamp,active:false}]).sourceAt(lamp),null);
 const {s,p}=fixture();for(let i=0;i<6;i++)build(s,p,30+i*7);const last=build(s,p,100);updatePower(s);assert.equal(last.active,false);assert.equal(lampField(s.buildings).sourceAt(last),null);
 assert.equal(command(s,p.id,{type:'demolish',x:30,z:0}),null);assert.equal(last.active,true);assert.equal(lampField(s.buildings).sourceAt(last),last);
});
test('a lamp illuminates and exposes armor outside the beacon; losing power removes the effect',()=>{
 const {s,p}=fixture(),lamp=build(s,p,12);const e={id:9000,kind:'guard',x:13,z:0,hp:1e7,maxHp:1e7,speed:0,damage:0,cooldown:0};s.enemies=[e];
 for(let i=0;i<15;i++)step(s);assert.equal(e.illuminated,true);assert.ok(e.lightExposure>=.65);
 s.buildings=s.buildings.filter(b=>b!==lamp);step(s);assert.equal(e.illuminated,false);
});
test('every coastal species, including lighthouse hunters, can target and destroy a fragile lamp',()=>{
 for(const kind of ['runner','drowned','guard','spitter','walker']){
  const {s,p,core}=fixture(),lamp=build(s,p,12),coreHp=core.hp;
  const e={id:9000,kind,x:12.5,z:0,hp:1e7,maxHp:1e7,speed:1,damage:10,cooldown:0,coreHunter:kind==='walker'||kind==='drowned',brute:kind==='guard'};s.enemies=[e];step(s);
  assert.ok(!s.buildings.includes(lamp),kind+' failed to destroy the lamp');assert.equal(core.hp,coreHp);
  step(s);assert.equal(e.illuminated,false,kind+' remained lit by a destroyed lamp');
 }
});
