import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createExpedition,step,command,waveForecast} from '../public/shared/sim.js';
import {coastDistance,coastalLand} from '../public/shared/coast.js';
import {lighthouseBeam,lighthouseHeading,isInLighthouseBeam,attackBearing} from '../public/shared/lighthouse.js';
import {parseSave} from '../public/shared/saves.js';
const angleError=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
test('all 25 island waves spawn offshore in their advertised sector and within beacon coverage',()=>{
 const {state:s}=createExpedition('Keeper',{skipTutorial:true});const core=s.buildings[0];
 const sides=new Set();
 for(let wave=1;wave<=25;wave++){
  s.wave=wave-1;s.enemies=[];s.nextWave=0;const forecast=waveForecast(s);step(s);sides.add(s.waveSide);
  assert.equal(s.waveSide,forecast.side);assert.equal(s.enemies.length,forecast.count);
  const beam=lighthouseBeam(core,attackBearing(forecast.side));
  for(const e of s.enemies){assert.ok(coastDistance(s.terrain,e.x,e.z)<0);assert.ok(!coastalLand(s.terrain,e.x,e.z));assert.ok(isInLighthouseBeam(beam,e));}
 }
 assert.equal(sides.size,8);
});
test('automatic light previews the coast, tracks active waves, supports manual override and survives saving',()=>{
 const {state:s,playerId}=createExpedition('Keeper',{skipTutorial:true});const core=s.buildings[0];
 for(let i=0;i<60;i++)step(s);
 assert.ok(angleError(lighthouseHeading(core),attackBearing(waveForecast(s).side))<1e-8);
 s.nextWave=0;step(s);const bearing=attackBearing(s.waveSide);for(let i=0;i<40;i++)step(s);
 assert.ok(angleError(lighthouseHeading(core),bearing)<1e-8);
 assert.equal(command(s,playerId,{type:'aimLighthouse',x:15,z:5}),null);assert.equal(core.lighthouseAuto,false);
 for(let i=0;i<60;i++)step(s);assert.ok(angleError(lighthouseHeading(core),Math.atan2(15,5))<1e-8);
 assert.ok(command(s,-1,{type:'autoLighthouse'}));assert.equal(command(s,playerId,{type:'autoLighthouse'}),null);
 s.paused=true;const old=lighthouseHeading(core);step(s,1);assert.equal(lighthouseHeading(core),old);
 const saved=parseSave(JSON.stringify({state:s,playerId})).state;assert.equal(saved.buildings[0].lighthouseAuto,true);assert.deepEqual(saved.terrain.coast,s.terrain.coast);
 const base=lighthouseBeam(core);core.level=11;const advanced=lighthouseBeam(core);assert.ok(advanced.reach>base.reach&&advanced.cone>base.cone);
});
test('an island hostile crosses the shoreline and reaches the central colony without being stranded',()=>{
 const {state:s}=createExpedition('Keeper',{skipTutorial:true});s.nextWave=0;step(s);
 const e=s.enemies[0];s.enemies=[e];e.hp=e.maxHp=1e8;e.damage=0;e.speed=3;s.nextWave=1e9;
 for(let i=0;i<1600&&Math.hypot(e.x,e.z)>2;i++)step(s);
 assert.ok(Math.hypot(e.x,e.z)<=2,JSON.stringify({x:e.x,z:e.z}));
});
