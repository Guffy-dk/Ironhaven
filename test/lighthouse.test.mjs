import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,turretStats,migrateGame,waveForecast} from '../public/shared/sim.js';
import {LIGHTHOUSE_REACH,lighthouseBeam,isInLighthouseBeam,lighthouseHeading} from '../public/shared/lighthouse.js';
import {HOSTILES,hostileKind,waveKind,exposeHostile,hostileDamage} from '../public/shared/hostiles.js';
import {parseSave} from '../public/shared/saves.js';
function fixture(){
 const s=createGame(1234),p=addPlayer(s);s.terrain.trees=[];s.terrain.rocks=[];s.nextWave=1e6;
 const core=s.buildings.find(b=>b.type==='hq');core.x=core.z=0;
 s.buildings=[core];s.enemies=[];return {s,p,core};
}
const enemy=(kind,x,z,extra={})=>({id:9000,kind,x,z,hp:1000,maxHp:1000,speed:0,damage:1,cooldown:0,...extra});
test('aim validates player and map coordinates, wraps the shortest way, and pauses with simulation',()=>{
 const {s,p,core}=fixture();
 for(const value of [NaN,Infinity,1.5,1000])assert.ok(command(s,p.id,{type:'aimLighthouse',x:value,z:0}));
 assert.ok(command(s,p.id,{type:'aimLighthouse',x:0,z:0}));
 assert.ok(command(s,-1,{type:'aimLighthouse',x:2,z:2}));
 assert.equal(command(s,p.id,{type:'aimLighthouse',x:30,z:0}),null);
 const before=lighthouseHeading(core);step(s);assert.notEqual(lighthouseHeading(core),before);
 assert.ok(Math.abs(lighthouseHeading(core)-before)<.12);
 s.paused=true;const paused=lighthouseHeading(core);step(s,1);assert.equal(lighthouseHeading(core),paused);
 s.paused=false;for(let i=0;i<40;i++)step(s);assert.ok(Math.abs(lighthouseHeading(core)-Math.PI/2)<1e-8);
 core.lighthouseHeading=Math.PI*2-.02;core.lighthouseAim=.02;step(s);assert.ok(core.lighthouseHeading>Math.PI*2-.02);
});
test('beam bounds include range edge and reject outside, behind, dead and missing lighthouse',()=>{
 const beam=lighthouseBeam({x:0,z:0,hp:1,lighthouseHeading:Math.PI/2});
 assert.equal(isInLighthouseBeam(beam,{x:LIGHTHOUSE_REACH,z:0}),true);
 assert.equal(isInLighthouseBeam(beam,{x:LIGHTHOUSE_REACH+.001,z:0}),false);
 assert.equal(isInLighthouseBeam(beam,{x:-1,z:0}),false);
 assert.equal(isInLighthouseBeam(beam,{x:10,z:8}),false);
 assert.equal(isInLighthouseBeam(lighthouseBeam({hp:0}),{x:0,z:0}),false);
 assert.equal(lighthouseBeam(null),null);
});
function defense(lit,distance,mist=false){
 const {s,core}=fixture(),source=createGame().buildings.find(b=>b.type==='turret');
 Object.assign(source,{x:0,z:0,cooldown:0,ammo:100});s.buildings.push(source);
 core.lighthouseHeading=lit?Math.PI/2:Math.PI;
 const e=enemy('drowned',distance,0);s.enemies=[e];
 if(mist)s.enemies.push(enemy('spitter',distance,1,{id:9001,cooldown:99}));
 step(s);return e.hp;
}
test('only illuminated hostiles gain 20% defense acquisition range; unlit spitter mist contracts it',()=>{
 const stats=turretStats(createGame().buildings.find(b=>b.type==='turret'));
 assert.equal(defense(false,stats.range*1.1),1000);
 assert.ok(defense(true,stats.range*1.1)<1000);
 assert.equal(defense(true,stats.range*1.21),1000);
 assert.ok(defense(false,stats.range*.9)<1000);
 assert.equal(defense(false,stats.range*.9,true),1000);
 assert.ok(defense(true,stats.range*.9,true)<1000);
});
test('shell armor opens under sustained light and recovers after leaving; bosses also expose',()=>{
 for(const kind of ['guard','walker']){
  const e=enemy(kind,2,0);assert.ok(hostileDamage(e,100)<100);
  for(let i=0;i<25;i++)exposeHostile(e,true,.05);
  assert.equal(hostileDamage(e,100),100);
  for(let i=0;i<30;i++)exposeHostile(e,false,.05);
  assert.ok(hostileDamage(e,100)<100);
 }
});
test('lit runners briefly slow without flanking, Drowned approach the light; reactions remain bounded',()=>{
 const {s,core}=fixture();core.lighthouseHeading=Math.PI/2;
 const machine=createGame().buildings.find(b=>b.type==='smelter');Object.assign(machine,{x:10,z:3});s.buildings.push(machine);
 const runner=enemy('runner',8,0,{speed:1}),drowned=enemy('drowned',10,0,{id:9001,speed:1});s.enemies=[runner,drowned];
 const dark=structuredClone(s);dark.buildings[0].lighthouseHeading=Math.PI;
 step(s);step(dark);const unlit=dark.enemies.find(e=>e.id===runner.id);
 const litDx=runner.x-8,litDz=runner.z,darkDx=unlit.x-8,darkDz=unlit.z;
 assert.ok(Math.abs(litDx*darkDz-litDz*darkDx)<1e-10,'Light must preserve the approach direction');
 assert.ok(Math.abs(Math.hypot(litDx,litDz)/Math.hypot(darkDx,darkDz)-.85)<1e-10);
 assert.ok(drowned.x<10);assert.ok(Math.abs(drowned.z)<.001);
 const reaction=enemy('runner',4,0);for(let i=0;i<80;i++)exposeHostile(reaction,true,.05);
 assert.equal(reaction.lightResponse,0);assert.ok(reaction.lightRest>0);
});
test('spitters strike at range and emit an authoritative projectile without walking through buildings',()=>{
 const {s,core}=fixture();core.lighthouseHeading=Math.PI;
 const e=enemy('spitter',4,0,{speed:1});s.enemies=[e];const hp=core.hp;
 step(s);assert.ok(core.hp<hp);assert.equal(e.x,4);assert.ok(s.shots.some(v=>v.hostile));
 const remaining=core.hp;step(s);assert.equal(core.hp,remaining);
});
test('wave compositions are deterministic, preserve forecast count, introduce spitters and bounded bosses',()=>{
 assert.ok(Array.from({length:20},(_,i)=>waveKind(1,i,20)).every(kind=>['runner','drowned','guard'].includes(kind)));
 assert.ok(Array.from({length:20},(_,i)=>waveKind(4,i,20)).includes('spitter'));
 assert.equal(waveKind(5,19,20),'walker');assert.notEqual(waveKind(6,19,20),'walker');
 const a=fixture().s,b=fixture().s;a.wave=b.wave=4;a.nextWave=b.nextWave=0;
 const count=waveForecast(a).count;step(a);step(b);
 assert.deepEqual(a.enemies,b.enemies);assert.equal(a.enemies.length,count);assert.equal(a.enemies.filter(e=>e.kind==='walker').length,1);
 assert.ok(a.enemies.every(e=>Number.isFinite(e.hp)&&e.hp>0&&Object.hasOwn(HOSTILES,e.kind)));
});
test('old enemies still load, new species and lighthouse bearings survive saved-world round trips',()=>{
 const {s,p,core}=fixture();core.lighthouseHeading=.7;core.lighthouseAim=1.1;
 s.enemies=[enemy('guard',3,4,{lightExposure:.8}),{id:9001,x:5,z:6,hp:30,maxHp:30,brute:true}];
 const loaded=parseSave(JSON.stringify({state:s,playerId:p.id})).state;
 assert.equal(loaded.buildings[0].lighthouseAim,1.1);assert.equal(loaded.enemies[0].kind,'guard');
 assert.equal(hostileKind(loaded.enemies[1]),'guard');assert.equal(hostileKind({coreHunter:true}),'walker');
 const before=structuredClone(loaded);migrateGame(loaded);assert.deepEqual(loaded.enemies,before.enemies);
});

test('lighthouse training requires aiming, sustained illumination and a real extended-range sentry kill',()=>{
 const {s,p,core}=fixture();
 const sentry=createGame().buildings.find(b=>b.type==='turret');Object.assign(sentry,{x:4,z:-3,cooldown:0});s.buildings.push(sentry);
 s.tutorialStep=7;step(s);assert.equal(s.tutorialStep,7);
 assert.equal(command(s,p.id,{type:'finishTutorial'}),'Complete the current training task first');
 command(s,p.id,{type:'aimLighthouse',x:14,z:0});for(let i=0;i<80&&s.tutorialStep===7;i++)step(s);
 assert.equal(s.tutorialStep,8);step(s);const guard=s.enemies.find(e=>e.training==='exposure');assert.ok(guard);
 const hp=core.hp;for(let i=0;i<30;i++)step(s);assert.equal(s.tutorialStep,8);assert.equal(core.hp,hp);
 command(s,p.id,{type:'aimLighthouse',x:14,z:-6});for(let i=0;i<100&&s.tutorialStep===8;i++)step(s);
 assert.equal(s.tutorialStep,9);step(s);assert.ok(s.enemies.some(e=>e.training==='combat'));
 for(let i=0;i<40;i++)step(s);assert.equal(s.tutorialStep,9,'Unlit target remains outside normal sentry range');
 command(s,p.id,{type:'aimLighthouse',x:4,z:-11});for(let i=0;i<140&&s.tutorialStep===9;i++)step(s);
 assert.equal(s.tutorialStep,10);assert.equal(s.enemies.filter(e=>e.training).length,0);assert.equal(s.totalKills,0);
 assert.equal(core.hp,hp);assert.equal(s.wave,0);
 assert.equal(command(s,p.id,{type:'finishTutorial'}),null);assert.equal(s.nextWave-s.time,120);
});
test('skipping a light lesson removes every harmless practice creature',()=>{
 const {s,p}=fixture();s.tutorialStep=8;step(s);assert.ok(s.enemies.some(e=>e.training));
 command(s,p.id,{type:'finishTutorial',skip:true});assert.equal(s.enemies.length,0);
});
