import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,command,step,waveForecast,DIFFICULTIES,upgradeCost,buildingPower,planMove,SAVE_SCHEMA} from '../public/shared/sim.js';
import {factoryStatus,productionReport} from '../public/shared/diagnostics.js';
import {packWorldSave,parseSave} from '../public/shared/saves.js';
const run=(s,n)=>{for(let i=0;i<n*20;i++)step(s);};
test('difficulty scales strength independently of Standard preparation time',()=>{
 const easy=createGame(undefined,{difficulty:'relaxed'}),normal=createGame(),hard=createGame(undefined,{difficulty:'veteran'});for(const s of[easy,normal,hard])addPlayer(s);
 assert.ok(waveForecast(easy).count<waveForecast(normal).count);assert.ok(waveForecast(hard).count>waveForecast(normal).count);assert.equal(hard.nextWave,normal.nextWave);assert.ok(easy.nextWave>normal.nextWave);
 assert.equal(DIFFICULTIES.veteran.interval,DIFFICULTIES.standard.interval);
});
test('four-player scaling is sublinear, accurately telegraphed and bounded at 480 enemies',()=>{
 const s=createGame();addPlayer(s);const solo=waveForecast(s,8);for(let i=0;i<3;i++)addPlayer(s);const group=waveForecast(s,8);assert.ok(group.count>solo.count);assert.ok(group.count<solo.count*1.5);assert.equal(group.health,solo.health);assert.ok(waveForecast(s,999).count<=480);
 const next=waveForecast(s);s.nextWave=0;step(s);assert.equal(s.enemies.length,next.count);assert.equal(s.waveSide,next.side);const brute=s.enemies.find(e=>e.brute),regular=s.enemies.find(e=>!e.brute);assert.ok(brute.maxHp>regular.maxHp*1.8);
});
test('diagnostics distinguish input shortage, full storage, free delivery and blocked output',()=>{
 const s=createGame(),b=s.buildings.find(b=>b.type==='smelter');s.buildings=s.buildings.filter(v=>v.type==='hq'||v===b);b.x=-1;b.z=0;b.dir=0;const grid=new Map(s.buildings.map(v=>[`${v.x},${v.z}`,v]));assert.equal(factoryStatus(s,b,grid),'input');
 b.item='plate';assert.equal(factoryStatus(s,b,grid),'running');s.resources.plate=300;assert.equal(factoryStatus(s,b,grid),'storage');b.dir=3;assert.equal(factoryStatus(s,b,grid),'output');b.active=false;assert.equal(factoryStatus(s,b,grid),'power');
});
test('measured production uses bounded history and reports theoretical demand',()=>{
 const s=createGame();addPlayer(s);s.nextWave=9999;run(s,100);assert.equal(s.stats.history.length,61);const report=productionReport(s);assert.ok(report.seconds>59&&report.seconds<61);const plate=report.materials.find(v=>v.resource==='plate');assert.ok(plate.perMinute>0);assert.ok(plate.demand>0);assert.ok(report.materials.find(v=>v.resource==='gear').demand>0);
});
test('recently attacked buildings cannot teleport or be dismantled to escape damage',()=>{
 const s=createGame(),p=addPlayer(s),b=s.buildings.find(b=>b.type==='turret');s.time=100;b.lastHit=99;const before=JSON.stringify(s);
 assert.match(command(s,p.id,{type:'demolish',x:b.x,z:b.z}),/five seconds/);assert.match(planMove(s,[b.id],1,0).error,/five seconds/);assert.equal(JSON.stringify(s),before);s.time=105;assert.equal(command(s,p.id,{type:'demolish',x:b.x,z:b.z}),null);
 const core=s.buildings.find(b=>b.type==='hq');s.enemies=[{id:999,x:20,z:20,hp:100}];assert.match(planMove(s,[core.id],1,1).error,/active swarm/);
});
test('world snapshots stop input and preserve guest inventories without changing the live game',()=>{
 const s=createGame(),host=addPlayer(s),guest=addPlayer(s,'Guest'),belt=s.buildings.find(b=>b.type==='belt');command(s,guest.id,{type:'demolish',x:belt.x,z:belt.z});command(s,host.id,{type:'move',x:1,z:-1,sprint:true});const before=JSON.stringify(s);
 const data=packWorldSave(s,host.id);assert.equal(JSON.stringify(s),before);assert.equal(data.state.players.length,1);assert.equal(data.state.players[0].inventory.belt.length,1);assert.equal(data.state.players[0].sprinting,false);assert.deepEqual(data.state.players[0].input,{x:0,z:0});assert.equal(parseSave(JSON.stringify(data)).state.version,SAVE_SCHEMA);
});
test('late turret gains cost more power while upgrade prices remain increasing',()=>{
 const s=createGame(),b=s.buildings.find(b=>b.type==='turret');const basePower=buildingPower(b),first=Object.values(upgradeCost(b)).reduce((a,v)=>a+v,0);b.level=10;assert.ok(buildingPower(b)>basePower*2);assert.ok(Object.values(upgradeCost(b)).reduce((a,v)=>a+v,0)>first*5);
});
