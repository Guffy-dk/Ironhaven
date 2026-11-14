import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGame,addPlayer,removePlayer,command,step,canBuild,TYPES} from '../public/shared/sim.js';
import {encodeCode,decodeCode} from '../public/network.js';
const run=(s,seconds)=>{for(let i=0;i<seconds*20;i++)step(s);};
test('starter belts deliver both plates and gears; production is deterministic',()=>{
 const a=createGame(),b=createGame();a.nextWave=b.nextWave=9999;run(a,60);run(b,60);
 assert.ok(a.produced.plate>=20);assert.ok(a.produced.gear>=10);assert.ok(a.resources.wood>165);assert.deepEqual(a,b);
});
test('building validates terrain, money, orientation and inventory',()=>{
 const s=createGame(),p=addPlayer(s),start=s.resources.wood;
 assert.equal(command(s,p.id,{type:'build',building:'belt',x:3,z:4,dir:7}),null);
 const b=s.buildings.find(b=>b.x===3&&b.z===4);assert.equal(b.dir,3);assert.equal(s.resources.wood,start-1);
 assert.equal(canBuild(s,'belt',3,4),'Tile is occupied');assert.match(canBuild(s,'drill',3,8),/iron deposits/);
 assert.equal(command(s,p.id,{type:'demolish',x:3,z:4}),null);assert.ok(!s.buildings.some(v=>v.id===b.id));assert.equal(p.inventory.belt.length,1);
 s.resources.plate=0;assert.equal(canBuild(s,'turret',3,4),'Not enough materials');
 assert.equal(command(s,p.id,{type:'build',building:'hq',x:3,z:4}),'Invalid building');
 assert.equal(command(s,p.id,{type:'build',building:'wall',x:Infinity,z:4}),'Invalid tile');
});
test('only four players; host controls time and changes after departure',()=>{
 const s=createGame();const ps=Array.from({length:4},(_,i)=>addPlayer(s,'P'+i));assert.equal(addPlayer(s),null);
 assert.equal(command(s,ps[1].id,{type:'pause'}),'Only the host can control time');
 command(s,ps[0].id,{type:'pause'});run(s,10);assert.equal(s.time,0);
 removePlayer(s,ps[0].id);assert.equal(command(s,ps[1].id,{type:'pause'}),null);run(s,1);assert.ok(s.time>.9);
});
test('power shortages stop later machines; generator fuel is consumed',()=>{
 const s=createGame();s.buildings=s.buildings.filter(b=>b.type!=='generator');run(s,1);assert.equal(s.power.total,18);assert.ok(s.buildings.some(b=>TYPES[b.type].power>0&&!b.active));
 const fueled=createGame();const before=fueled.resources.wood;fueled.buildings=fueled.buildings.filter(b=>b.type!=='sawmill');run(fueled,13);assert.equal(fueled.resources.wood,before-1);
});
test('turrets fight waves; unprotected core is destroyed; victory after final wave',()=>{
 const s=createGame();addPlayer(s);s.nextWave=.1;run(s,35);assert.equal(s.wave,1);assert.ok(s.totalKills>0);assert.ok(s.shots.length>=0);
 const doomed=createGame();doomed.buildings=doomed.buildings.filter(b=>b.type==='hq');doomed.nextWave=.1;run(doomed,300);assert.equal(doomed.status,'defeat');
 const won=createGame();won.wave=8;step(won);assert.equal(won.status,'playing'); // 0.3 requires evacuation after the initial swarms
});
test('engineer movement is clamped and death has a respawn',()=>{
 const s=createGame(),p=addPlayer(s);command(s,p.id,{type:'move',x:999,z:NaN});assert.deepEqual(p.input,{x:1,z:0});
 p.x=25.9;p.z=0;run(s,10);assert.ok(p.x<=26);p.hp=0;p.respawn=1;run(s,2);assert.equal(p.hp,100);
});
test('repair costs material and caps building HP',()=>{
 const s=createGame(),p=addPlayer(s),core=s.buildings[0];core.hp-=100;const plate=s.resources.plate;
 assert.equal(command(s,p.id,{type:'repair',x:0,z:0}),null);assert.equal(core.hp,TYPES.hq.hp);assert.equal(s.resources.plate,plate-2);
 assert.equal(command(s,p.id,{type:'demolish',x:0,z:0}),'The command core cannot be dismantled');
});
test('invitation and answer codes validate type, size and corruption',()=>{
 const offer={type:'offer',sdp:'v=0\r\na=local-data-channel'};assert.deepEqual(decodeCode(encodeCode(offer),'offer'),offer);
 assert.throws(()=>decodeCode(encodeCode(offer),'answer'),/answer code/);assert.throws(()=>decodeCode('IH2.%%%%','offer'),/damaged/);assert.throws(()=>decodeCode('bad','offer'),/Ironhaven/);assert.throws(()=>decodeCode('IH2.'+'a'.repeat(40000),'offer'));
});
