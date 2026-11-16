// Reproducible simulation-only checks. They do not replace human gameplay or GPU profiling.
import {performance} from 'node:perf_hooks';
import {createGame,addPlayer,step,command,TYPES,MAX_UPGRADES,maxHp} from '../public/shared/sim.js';
const outcomes=[];
for(const difficulty of ['relaxed','standard','veteran'])for(const players of [1,4]){
 const s=createGame(undefined,{difficulty});for(let i=0;i<players;i++)addPlayer(s,'Engineer '+i);
 const began=performance.now();for(let i=0;i<20*1200&&s.status==='playing';i++)step(s);
 outcomes.push({difficulty,players,policy:'No construction, upgrades or repairs',wave:s.wave,survivalSeconds:Math.round(s.time),outcome:s.status,cpuMs:Math.round(performance.now()-began)});
}
for(const players of [1,4]){
 const s=createGame();for(let i=0;i<players;i++)addPlayer(s,'Engineer '+i);const started=performance.now();
 const host=s.players[0].id;
 for(let i=0;i<20*1200&&s.status==='playing';i++){
  if(i%20===0){
   for(const [x,z] of [[-5,-4],[5,-4],[-5,5],[5,5]])if(!s.buildings.some(b=>b.x===x&&b.z===z))command(s,host,{type:'build',building:'gunTurret',x,z});
   for(const b of s.buildings){
    if(b.type==='gunTurret'&&(b.level||1)<3)command(s,host,{type:'upgrade',x:b.x,z:b.z});
    if(['hq','turret','gunTurret'].includes(b.type)&&b.hp<maxHp(b)*.5)command(s,host,{type:'repair',x:b.x,z:b.z});
   }
  }
  step(s);
 }
 outcomes.push({difficulty:'standard',players,policy:'Build and upgrade four gun turrets; repair core and turrets below half health when affordable',wave:s.wave,survivalSeconds:Math.round(s.time),outcome:s.status,cpuMs:Math.round(performance.now()-started)});
}
const stress=createGame();for(let i=0;i<4;i++)addPlayer(stress);stress.buildings=[];stress.nextWave=99999;
for(let i=0;i<700;i++){const type=i===0?'hq':i%7===0?'generator':i%3===0?'turret':'wall';stress.buildings.push({id:i+100,type,dir:0,x:i%28-14,z:Math.floor(i/28)-12,level:type==='generator'?11:1,hp:TYPES[type].hp,progress:0,input:[],item:null,ammo:999999,cooldown:0,active:true});}
for(let i=0;i<480;i++)stress.enemies.push({id:10000+i,x:(i%24)-12,z:18+Math.floor(i/24)*.1,hp:1000000,maxHp:1000000,speed:.01,cooldown:0,brute:false});
stress.resources.wood=100000;const samples=[];for(let i=0;i<240;i++){const start=performance.now();step(stress);samples.push(performance.now()-start);}samples.sort((a,b)=>a-b);
console.log(JSON.stringify({scenarios:outcomes,stress:{buildings:700,enemies:480,ticks:samples.length,meanMs:+(samples.reduce((a,v)=>a+v,0)/samples.length).toFixed(3),p95Ms:+samples[Math.floor(samples.length*.95)].toFixed(3),tickBudgetMs:50},caveat:'CPU simulation on this machine only. No browser/GPU measurements and no claim of final human-playtested balance.'},null,2));
