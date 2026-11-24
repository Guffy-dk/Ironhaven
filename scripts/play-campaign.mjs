// A deterministic test player. Uses normal build/configure/upgrade/repair commands,
// starter inventory and mined resources; no injected stock, health, kills or levels.
import {writeFile,mkdir,rename} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';import {resolve} from 'node:path';
const {createExpedition,canBuild,command,step,powerOutput,STEP,RESOURCE_KEYS,DIFFICULTIES,maxHp,upgradeCost,upgradeLocked,TURRETS,turretStats,storageUsed,storageCapacity,buildingPower,key,DIRS}=await import(process.env.SIM_MODULE?pathToFileURL(resolve(process.env.SIM_MODULE)).href:'../public/shared/sim.js');
await mkdir('work',{recursive:true});
const seed=Number(process.argv[2]||417),policy=process.argv[3]||'industry',difficulty=process.argv[4]||'standard';
const horizon=Number(process.argv[5]??15000), endless=process.argv[6]==='endless';
const shedLoad=process.env.CAMPAIGN_SHED_LOAD==='1';
const powerReserve=process.env.CAMPAIGN_POWER_RESERVE==='1';
const sentryFallback=process.env.CAMPAIGN_SENTRY_FALLBACK==='1';
const coalPowerTrial=process.env.CAMPAIGN_COAL_POWER==='1';
const marineTrial=process.env.CAMPAIGN_MARINE==='1';
const coalReserve=process.env.CAMPAIGN_COAL_RESERVE==='1';
const policies=['industry','single','pulse','no_artillery','early_defense','mortars','logistics','refining','harbor'];
if(!Object.hasOwn(DIFFICULTIES,difficulty)||!policies.includes(policy))throw Error('Unknown difficulty or campaign policy');
if(!Number.isSafeInteger(seed)||seed<1||!Number.isFinite(horizon)||horizon<=0)throw Error('Use a positive seed and horizon in seconds');
const suffix=difficulty==='standard'?'':'-'+difficulty;
const stem=`work/campaign-${policy}-${seed}${suffix}${process.argv[5]?`-${horizon}${endless?'-endless':''}`:''}`;
const outputStem=stem+(shedLoad?'-shed-load':'')+(powerReserve?'-reserve':'')+(coalReserve?'-fuel':'')+(marineTrial?'-marine':'')+(coalPowerTrial?'-coal-power':'')+(sentryFallback?'-fallback':'');
const saveCheckpoints=process.env.CAMPAIGN_CHECKPOINTS!=='0';
async function writeJson(file,value){
 await writeFile(file+'.tmp',JSON.stringify(value,null,2));
 await rename(file+'.tmp',file);
}
const {state:s,playerId:host}=createExpedition('Campaign pilot',{skipTutorial:true,swarmSeed:seed,difficulty});
const plans=[],reserved=new Set(),rows=[],refiningPlan=new Set();let built=0,repairs=0,upgrades=0,lastKills=0,lastKillTime=0,refineryCommissioned=false;
const add=(type,x,z,dir=0)=>{plans.push({type,x,z,dir});reserved.add(key(x,z));};
// One physical receiving warehouse and numbered hub supply the three recipes.
for(const t of [['drill',4,3,2],['smelter',3,3,2],['storage',2,3,2],['splitter',1,3,2],['assembler',0,3,2],['storage',-1,3,2],['sawmill',7,6,0],['sawmill',8,6,0],['sawmill',8,7,0],['generator',3,-2,0],['generator',3,-3,0],['generator',3,-4,0]])add(...t);
for(const [x,z]of [[-5,-3],[5,-3],[-5,5],[5,5]])add('turret',x,z);
for(const t of [['drill',4,5,2],['smelter',3,5,2],['storage',2,5,3],['belt',2,4,3],['drill',4,7,2],['smelter',3,7,2],['storage',2,7,3],['belt',2,6,3],['foundry',1,4,1],['storage',1,5,1],['circuitLab',1,2,3],['storage',1,1,2],['copperDrill',13,-10,2],['smelter',12,-10,1],['coalMine',-14,13,0],['storage',-13,13,0],['coalGenerator',-4,-5,0],['coalGenerator',-3,-5,0],['coalGenerator',-2,-5,0],['coalGenerator',-1,-5,0],['componentFactory',-3,0,2],['storage',-4,0,2],['belt',-2,3,2],['belt',-3,3,3],['belt',-3,2,3],['belt',-3,1,3],['belt',0,1,2],['belt',-1,1,2],['belt',-2,1,3],['belt',-2,0,2]])add(...t);
for(const z of [-7,-5])for(const t of [['drill',-13,z,0],['smelter',-12,z,0],['storage',-11,z,0],['assembler',-10,z,0],['storage',-9,z,0]])add(...t);
for(const t of [['drill',-13,-9,0],['smelter',-12,-9,0],['storage',-11,-9,0],['foundry',-10,-9,0],['storage',-9,-9,0]])add(...t);
for(const [x,z]of [[-12,-12],[0,-14],[12,-12],[-14,0],[14,0],[-12,12],[0,14],[12,12]])add('gunTurret',x,z);
for(const [x,z]of [[-6,0],[6,0],[0,-6],[0,6]])add(policy==='pulse'?'pulseTurret':'gunTurret',x,z);
for(const [x,z]of [[-6,-7],[6,-7],[-7,6],[6,7]])add('mortar',x,z);
// Route copper to an input of the circuit assembler, steel to the component factory.
function path(start,goal){const queue=[start],seen=new Map([[key(start.x,start.z),null]]);let end;
 for(let i=0;i<queue.length;i++){const p=queue[i];if(p.x===goal.x&&p.z===goal.z){end=p;break;}
  for(const [dx,dz]of DIRS){const n={x:p.x+dx,z:p.z+dz},k=key(n.x,n.z);if(Math.abs(n.x)>20||Math.abs(n.z)>20||seen.has(k)||reserved.has(k)&&!(n.x===goal.x&&n.z===goal.z))continue;seen.set(k,p);queue.push(n);}}
 if(!end)throw Error('No pilot factory route');const result=[];for(let p=end;p;p=seen.get(key(p.x,p.z)))result.push(p);return result.reverse();}
for(const [start,goal,final]of [[{x:12,z:-9},{x:2,z:2},2],[{x:1,z:6},{x:-3,z:-1},1],[{x:-8,z:-9},{x:-3,z:-1},1]]){
 const cells=path(start,goal);cells.forEach((p,i)=>{const next=cells[i+1],dir=next?DIRS.findIndex(([dx,dz])=>p.x+dx===next.x&&p.z+dz===next.z):final;add('belt',p.x,p.z,dir);});}
for(let x=-17;x<=17;x++)for(const z of [-17,17])if(!reserved.has(key(x,z)))add('wall',x,z);
for(let z=-16;z<=16;z++)for(const x of [-17,17])if(!reserved.has(key(x,z)))add('wall',x,z);
if(policy==='early_defense'||policy==='mortars'){
 const priority=policy==='early_defense'?['turret','gunTurret']:['mortar','turret'];
 const rank=({type})=>priority.includes(type)?priority.indexOf(type):priority.length;
 plans.sort((a,b)=>rank(a)-rank(b));
}
if(['refining','harbor'].includes(policy)){
 // Keep working smelters. Commission an additional complete line only after earning its materials.
 const start=plans.length;
 const [processor,preparation]=policy==='refining'?['finery','orePress']:['firebrickKiln','aggregateCrusher'];
 for(const [type,x,z]of [[processor,8,5],[preparation,7,5],['drill',6,5],['storage',9,5]]){
  if(reserved.has(key(x,z)))throw Error('Refining layout conflicts with existing plan');add(type,x,z);
 }
 const cells=path({x:-12,z:13},{x:8,z:4});
 cells.forEach((p,i)=>{
  if(reserved.has(key(p.x,p.z)))throw Error('Refining coal route conflicts with existing plan');
  const next=cells[i+1],dir=next?DIRS.findIndex(([dx,dz])=>p.x+dx===next.x&&p.z+dz===next.z):1;
  add('belt',p.x,p.z,dir);
 });
 for(const p of plans.slice(start))refiningPlan.add(key(p.x,p.z));
}
const marinePlan=new Set();
if(marineTrial){
 const addMarine=(type,x,z,dir)=>{
  const tile=key(x,z);
  if(reserved.has(tile))throw Error(`Marine plan collides at ${tile}`);
  add(type,x,z,dir);
  marinePlan.add(tile);
 };
 for(const tile of [['copperDrill',15,-12,2],['smelter',14,-12,2],['drill',-14,-8,0],['smelter',-13,-8,0],['foundry',-12,-8,0],['precisionWorkshop',-10,-10,0],['storage',-9,-10,0],['marineGenerator',4,-2,0]])addMarine(...tile);
 for(const [start,goal,final]of [[{x:13,z:-12},{x:-10,z:-11},1],[{x:-11,z:-8},{x:-11,z:-10},0]]){
  const cells=path(start,goal);
  cells.forEach(({x,z},i)=>{
   const next=cells[i+1];
   const dir=next?DIRS.findIndex(([dx,dz])=>x+dx===next.x&&z+dz===next.z):final;
   addMarine('belt',x,z,dir);
  });
 }
}
if(coalPowerTrial){
 if(marineTrial||reserved.has(key(4,-2)))throw Error('Coal comparison needs an unused generator site');
 add('coalGenerator',4,-2);
}
let coalPowerBuilds=0,coalPowerSeconds=0,coalPowerLevelThreeSeconds=0,firstCoalPowerSecond=null;
let marineCommissioned=false,marineBuilds=0,marinePoweredSeconds=0,firstMarineSecond=null;
if(policy==='single'){plans.unshift({type:'gunTurret',x:3,z:0,dir:0});reserved.add(key(3,0));}
const initialPlans=plans.length,upgradeMilestones={};
function send(cmd){return command(s,host,cmd);}
function at(x,z){return s.buildings.find(b=>b.x===x&&b.z===z);}
function exportAt(x,z,item){const b=at(x,z);if(b?.type==='storage'&&b.exportItem!==item)send({type:'configureWarehouse',id:b.id,x,z,item});}
function covered(x,z){return s.buildings.some(b=>TURRETS.includes(b.type)&&b.hp>0&&Math.hypot(b.x-x,b.z-z)<turretStats(b).range);}
const optionalProduction=['componentFactory','circuitLab','foundry','copperDrill'];
const suspended=new Set();
let productionPauses=0,reserveBuilds=0;
const reserveSites=[[4,-2],[4,-3]];
function addReservePower(){
 if(s.enemies.length||s.wave<7||s.resources.wood<85||s.resources.plate<70)return;
 const site=reserveSites.find(([x,z])=>!reserved.has(key(x,z))&&!at(x,z));
 if(!site)return;
 const [x,z]=site;
 if(s.terrain.trees.some(t=>t.x===x&&t.z===z)||s.terrain.rocks.some(t=>t.x===x&&t.z===z))send({type:'demolish',x,z});
 if(!send({type:'build',building:'generator',x,z})){
  built++;
  reserveBuilds++;
 }
}
function manageCombatPower(){
 if(!s.enemies.length){
  for(const b of s.buildings){
   if(suspended.has(b.id)&&b.disabled)send({type:'toggleProduction',id:b.id,x:b.x,z:b.z});
  }
  suspended.clear();
  return;
 }
 if(s.power.used<=s.power.total)return;
 for(const type of optionalProduction){
  for(const b of s.buildings){
   if(s.power.used<=s.power.total)return;
   if(b.type!==type||buildingPower(b)===0)continue;
   if(!send({type:'toggleProduction',id:b.id,x:b.x,z:b.z})){
    suspended.add(b.id);
    productionPauses++;
   }
  }
 }
}
const fallbackPlacements=[];
let lastFallbackWave=null;
function placeFallbackSentry(){
 if(policy==='single'||lastFallbackWave===s.wave||s.enemies.length>2||s.resources.gear>=1)return;
 const enemy=s.enemies[0];
 if(s.buildings.some(b=>b.type==='turret'&&b.active&&Math.hypot(b.x-enemy.x,b.z-enemy.z)<turretStats(b).range*.82))return;
 const x0=Math.round(enemy.x),z0=Math.round(enemy.z);
 const sites=[];
 for(let z=z0-4;z<=z0+4;z++){
  for(let x=x0-4;x<=x0+4;x++){
   const distance=Math.hypot(x-enemy.x,z-enemy.z);
   if(distance>=2&&distance<=5&&!reserved.has(key(x,z)))sites.push({x,z,distance});
  }
 }
 sites.sort((a,b)=>a.distance-b.distance);
 const site=sites.find(({x,z})=>!canBuild(s,'turret',x,z,host));
 if(!site)return;
 const {x,z}=site;
 if(!send({type:'build',building:'turret',x,z})){
  lastFallbackWave=s.wave;
  built++;
  fallbackPlacements.push({wave:s.wave,second:Math.round(s.time),x,z});
 }
}
function act(){
 if((marineTrial||coalPowerTrial)&&!s.enemies.length&&s.resources.module>=5&&s.resources.circuit>=12&&s.resources.plate>=130&&s.resources.wood>=90&&s.power.total>=s.power.used+20)marineCommissioned=true;
 const stalled=s.enemies.length&&s.time-lastKillTime>120;
 if(sentryFallback&&stalled)placeFallbackSentry();
 if(policy==='refining'&&s.resources.module>=2&&s.resources.steel>=20&&s.resources.gear>=30&&s.resources.plate>=115&&s.resources.wood>=60)refineryCommissioned=true;
 if(policy==='harbor'&&s.wave>=8&&s.resources.plate>=95&&s.resources.gear>=24&&s.resources.wood>=70&&s.power.total>=s.power.used+10)refineryCommissioned=true;
 for(const p of plans){if(at(p.x,p.z))continue;if(stalled&&!TURRETS.includes(p.type)&&!covered(p.x,p.z)&&s.enemies.some(e=>Math.hypot(e.x-p.x,e.z-p.z)<4))continue;if(policy==='single'&&s.enemies.length)continue;if(policy==='no_artillery'&&p.type==='mortar')continue;if(p.type==='wall'&&(s.resources.plate<100||s.wave<3))continue;
  const coalPowerSite=coalPowerTrial&&p.x===4&&p.z===-2;
  if(coalPowerSite&&!marineCommissioned)continue;
  if(marinePlan.has(key(p.x,p.z))&&!marineCommissioned)continue;
  if(refiningPlan.has(key(p.x,p.z))&&!refineryCommissioned)continue;
  if(policy!=='single'&&p.type==='gunTurret'&&(!at(0,3)||s.resources.plate<60))continue;
  if(policy==='single'&&TURRETS.includes(p.type)&&!(p.x===3&&p.z===0))continue;
  const blocked=s.terrain.trees.some(t=>t.x===p.x&&t.z===p.z)||s.terrain.rocks.some(t=>t.x===p.x&&t.z===p.z);if(blocked)send({type:'demolish',x:p.x,z:p.z});
  const error=send({type:'build',building:p.type,x:p.x,z:p.z,dir:p.dir});if(!error){
   built++;
   if(coalPowerSite){coalPowerBuilds++;firstCoalPowerSecond??=Math.round(s.time);}
   if(p.type==='marineGenerator'){marineBuilds++;firstMarineSecond??=Math.round(s.time);}
  }
 }
 if(coalPowerTrial){
  const engine=at(4,-2);
  if(engine?.type==='coalGenerator'&&engine.level<3&&!s.enemies.length){
   const cost=upgradeCost(engine);
   if(cost&&!upgradeLocked(s,engine)&&Object.entries(cost).every(([item,amount])=>s.resources[item]-amount>=({plate:35,steel:10,gear:20}[item]??0))){
    if(!send({type:'upgrade',x:engine.x,z:engine.z}))upgrades++;
   }
  }
 }
 if(powerReserve)addReservePower();
 if(shedLoad)manageCombatPower();
 const hub=at(1,3);if(hub){
  const ammoReserve=Math.max(30,s.buildings.filter(b=>TURRETS.includes(b.type)&&b.type!=='turret').length*5);
  const program={machine:s.resources.steel<(policy==='logistics'?160:100)?3:0,forward:s.resources.gear<ammoReserve+(policy==='logistics'?90:50)?4:0,return:s.resources.circuit<100?2:0,bypass:true,filter:'any',buffer:2};
  if(program.machine+program.forward+program.return===0)program.forward=1;
  if(JSON.stringify(hub.program)!==JSON.stringify(program))send({type:'configureLogistics',id:hub.id,x:1,z:3,program});
 }
 for(const mill of s.buildings.filter(b=>b.type==='sawmill'))if(s.resources.wood>400&&!mill.disabled||s.resources.wood<160&&mill.disabled)send({type:'toggleProduction',id:mill.id,x:mill.x,z:mill.z});
 exportAt(2,3,s.resources.plate>Math.min(400,100+s.wave*12)||s.resources.gear<20||s.resources.steel<12?'plate':null);exportAt(2,5,'plate');exportAt(2,7,'plate');exportAt(-11,-7,'plate');exportAt(-11,-5,'plate');exportAt(-11,-9,'plate');exportAt(-9,-9,s.resources.steel>60&&s.resources.module<40&&at(-3,0)?'steel':null);
 if(refineryCommissioned&&['refining','harbor'].includes(policy))exportAt(-13,13,s.resources.coal>(policy==='harbor'?30:coalReserve?40:10)?'coal':null);
 // Retain ammunition before feeding components. All withdrawals are local.
 exportAt(-1,3,s.resources.gear>Math.max(24,s.buildings.filter(b=>TURRETS.includes(b.type)&&b.type!=='turret').length*4)&&s.resources.module<40&&at(-3,0)?'gear':null);
 exportAt(1,1,s.resources.circuit>10&&s.resources.module<40&&at(-3,0)?'circuit':null);
 exportAt(1,5,s.resources.steel>60&&s.resources.module<40&&at(-3,0)?'steel':null);
 // Restore lost infrastructure with normal construction; save some stock for ammunition.
 for(const b of s.buildings){
  // Do not repair-feed an isolated raider forever; abandon uncovered industry.
  if(stalled&&b.type!=='hq'&&!TURRETS.includes(b.type)&&!covered(b.x,b.z))continue;
  if((policy!=='single'||b.type==='hq'||TURRETS.includes(b.type))&&b.hp<maxHp(b)*.65&&s.resources.plate>=4){if(!send({type:'repair',x:b.x,z:b.z}))repairs++;}
 }
 const preparingReserve=powerReserve&&!s.enemies.length&&s.wave>=7;
 const generator=b=>b.type==='generator'||b.type==='coalGenerator';
 const targets=s.buildings.filter(b=>['hq','drill','smelter','assembler','copperDrill','coalMine','foundry','circuitLab','componentFactory','generator','coalGenerator','storage','sawmill',...TURRETS].includes(b.type)).sort((a,b)=>(preparingReserve?Number(generator(b))-Number(generator(a)):0)||(a.level||1)-(b.level||1)||a.id-b.id);
 for(const b of targets){if(coalPowerTrial&&b.x===4&&b.z===-2)continue;if(generator(b)&&s.power.total>s.power.used*1.2+(preparingReserve?18:0))continue;if(b.type==='storage'&&storageUsed(s)<storageCapacity(s)*.75)continue;if(b.type==='coalMine'&&s.resources.coal>100)continue;if(['copperDrill','circuitLab'].includes(b.type)&&s.resources.circuit>80)continue;if(b.type==='sawmill'&&s.resources.wood>150)continue;const cost=upgradeCost(b);if(!cost||upgradeLocked(s,b))continue;
  const buffer={wood:20,plate:35,gear:b.type==='turret'?8:Math.max(20,s.buildings.filter(b=>TURRETS.includes(b.type)&&b.type!=='turret').length*3),steel:10,circuit:10,module:0};
  if(Object.entries(cost).some(([r,n])=>s.resources[r]-n<(buffer[r]??0)))continue;
  if(!send({type:'upgrade',x:b.x,z:b.z})){upgrades++;upgradeMilestones[b.type]??=Math.round(s.time);}
 }
}
const began=performance.now();
let previousWave=0,maxStock=storageUsed(s),victorySeconds=null,losses=0,shots=0,ammoStarvedSamples=0,unpoweredTurretSamples=0,combatSamples=0,unpoweredCombatSamples=0;
const outages={};
const fuelWindow={startTick:null,ticks:0,fueledTicks:0,availablePowerTicks:0,coalBurned:0};
const trialEngineType=marineTrial?'marineGenerator':coalPowerTrial?'coalGenerator':null;
const windowTicks=Math.round(600/STEP);
function sample(){
 return {wave:s.wave,time:Math.round(s.time),kills:s.totalKills,losses,repairs,upgrades,shots,ammoStarvedSamples,unpoweredTurretSamples,combatSamples,unpoweredCombatSamples,productionPauses,reserveBuilds,marineBuilds,marinePoweredSeconds,firstMarineSecond,coalPowerBuilds,coalPowerSeconds,coalPowerLevelThreeSeconds,firstCoalPowerSecond,outages:structuredClone(outages),
  refineryCommissioned,resources:Object.fromEntries(RESOURCE_KEYS.map(r=>[r,Math.floor(s.resources[r])])),
  produced:{...s.stats.totals},stockFlow:{...s.stats.stockFlow},power:{...s.power,reserve:s.resources.power},
  storage:{used:storageUsed(s),capacity:storageCapacity(s)},buildings:s.buildings.length,
  turrets:s.buildings.filter(b=>TURRETS.includes(b.type)).map(b=>({type:b.type,level:b.level})),
  coreHp:Math.round(s.buildings.find(b=>b.type==='hq')?.hp??0)};
}
for(let ticks=0;ticks<Math.ceil(horizon/STEP)&&s.status==='playing';ticks++){
 if(ticks%40===0)act();
 const structures=s.buildings.length;
 const measureFuel=trialEngineType&&fuelWindow.ticks<windowTicks;
 const engine=measureFuel?at(4,-2):null;
 const participating=engine?.type===trialEngineType;
 const fueled=participating&&s.resources.coal>0;
 const progress=participating?engine.progress:0;
 if(fueled&&fuelWindow.startTick===null)fuelWindow.startTick=ticks;
 if(measureFuel&&fuelWindow.startTick!==null){
  fuelWindow.ticks++;
  if(fueled){
   fuelWindow.fueledTicks++;
   fuelWindow.availablePowerTicks+=powerOutput(engine);
  }
 }
 step(s);
 if(fueled&&engine.progress<progress)fuelWindow.coalBurned++;
 losses+=structures-s.buildings.length;
 if(coalPowerTrial&&ticks%20===0&&s.resources.coal>0){
  const engine=at(4,-2);
  if(engine?.type==='coalGenerator'){
   coalPowerSeconds++;
   if(engine.level===3)coalPowerLevelThreeSeconds++;
  }
 }
 if(marineTrial&&ticks%20===0&&s.resources.coal>0&&at(4,-2)?.type==='marineGenerator')marinePoweredSeconds++;
 if(s.enemies.length&&ticks%20===0){
  combatSamples++;
  for(const b of s.buildings){
   if(b.active||buildingPower(b)===0)continue;
   const outage=outages[b.type]??={firstWave:s.wave,firstSecond:Math.round(s.time),buildingSeconds:0};
   outage.buildingSeconds++;
  }
  const unpowered=s.buildings.filter(b=>TURRETS.includes(b.type)&&!b.active).length;
  unpoweredTurretSamples+=unpowered;
  if(unpowered)unpoweredCombatSamples++;
  ammoStarvedSamples+=s.buildings.filter(b=>TURRETS.includes(b.type)&&b.type!=='turret'&&b.active&&b.ammo<=0&&s.resources.gear<1).length;
 }
 for(const shot of s.shots)if(shot.time===s.time&&!shot.hostile)shots++;
 if(!s.enemies.length||s.totalKills!==lastKills){lastKills=s.totalKills;lastKillTime=s.time;}
 maxStock=Math.max(maxStock,storageUsed(s));
 if(s.wave!==previousWave){
  rows.push(sample());
  if(saveCheckpoints&&([5,9,13,17,21,25].includes(s.wave)||s.wave>25&&s.wave%10===0)){
   await writeJson(`${outputStem}-wave-${s.wave}.json`,{state:s,playerId:host});
  }
  previousWave=s.wave;
 }
 if(s.status==='victory'){
  victorySeconds=Math.round(s.time);
  if(endless){
   if(saveCheckpoints)await writeJson(`${outputStem}-victory.json`,{state:s,playerId:host});
   const error=send({type:'continueAfterVictory'});
   if(error)throw Error(error);
  }
 }
}
const final=sample();
const generatorWindow={startSecond:fuelWindow.startTick===null?null:fuelWindow.startTick*STEP,
 seconds:fuelWindow.ticks*STEP,fueledSeconds:fuelWindow.fueledTicks*STEP,
 availablePowerSeconds:Number((fuelWindow.availablePowerTicks*STEP).toFixed(2)),coalBurned:fuelWindow.coalBurned};
const report={seed,mapSeed:s.seed,swarmSeed:s.swarmSeed,policy,difficulty,horizon,endless,shedLoad,powerReserve,coalReserve,marineTrial,coalPowerTrial,sentryFallback,victorySeconds,
 outcome:s.status==='playing'?'horizon':s.status,wave:s.wave,seconds:final.time,kills:s.totalKills,built,repairs,upgrades,
 upgradeMilestones,planned:initialPlans,maxStock,capacity:storageCapacity(s),cpuSeconds:+((performance.now()-began)/1000).toFixed(2),
 generatorWindow,fallbackPlacements,final,waves:rows,caveat:'Scripted play using ordinary commands. Ammo starvation is sampled once per simulated second during combat.'};
if(saveCheckpoints)await writeJson(`${outputStem}-save.json`,{state:s,playerId:host});
await writeJson(`${outputStem}.json`,report);
console.log(JSON.stringify({...report,waves:undefined,final:undefined},null,2));
