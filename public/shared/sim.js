// Deterministic simulation shared by Windows hosts, LAN guests and automated tests.
import {TUTORIAL_STEPS,advanceTutorial} from './tutorial.js';
import {BUILD_EDGE,MAP_SIZE,SWARM_SPAWN_EDGE,woodland,walkAroundTrees} from './woodland.js';
import {turnLighthouse,lighthouseBeam,isInLighthouseBeam,LIT_RANGE_MULTIPLIER} from './lighthouse.js';

import {HOSTILES,hostileKind,waveKind,exposeHostile,hostileDamage,hostileDestination} from './hostiles.js';

export const SIZE = MAP_SIZE, STEP = .05, MAX_PLAYERS = 4, FINAL_WAVE = 25;
export {BUILD_EDGE};
export const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
export const SWARM_DIRECTIONS=['West','North','East','South','Northeast','Southeast','Southwest','Northwest'];
export const DIFFICULTIES={
 relaxed:{name:'Relaxed',count:.72,health:.85,damage:.75,production:1.15,prep:140,interval:115},
 standard:{name:'Standard',count:1,health:1,damage:1,production:1,prep:100,interval:95},
 veteran:{name:'Veteran',count:1.22,health:1.12,damage:1.15,production:1,prep:100,interval:95}
};
export const isPostVictory=s=>s.survived===true;
export const canSpawnSwarm=s=>s.wave<FINAL_WAVE||isPostVictory(s);
export function waveForecast(s,wave=s.wave+1){
 const d=DIFFICULTIES[s.difficulty]||DIFFICULTIES.standard,guests=Math.max(0,s.players.length-1);
 const random=rng(Math.imul(s.swarmSeed??s.seed,0x85ebca6b)^Math.imul(wave,0x9e3779b9));
 const count=Math.min(420,Math.round((10+wave*2.8+wave**1.55)*d.count*(1+guests*.08)));
 const lateWave=Math.min(wave,FINAL_WAVE)-8;
 const health=d.health*(lateWave<0?1:3.5+.09*lateWave);
 const damage=d.damage*(1+.018*(wave-1))*(lateWave<0?1:1.1+.015*lateWave);
 return {wave,count,side:Math.floor(random()*SWARM_DIRECTIONS.length),health,damage,bonus:roundBonus(wave)};
}
export const TYPES = {
 hq:{name:'Lighthouse',hp:2400,power:0,cost:{},desc:'The coastal lighthouse is your survival objective, power source and shared store. Deliver supplies here. Press L and aim its lantern: illuminated hostiles grant defenses 20% extra range and expose armored marine creatures.'},
 belt:{name:'Conveyor',hp:65,power:0,cost:{wood:1},desc:'A motor-driven rubber conveyor carries four spaced cargo loads toward its gold output arrow. Supports bends and side feeds. Press R over an existing belt to turn its output.'},
 drill:{name:'Iron drill',hp:200,power:3,cost:{wood:15,plate:10},desc:'A steel-framed coastal drilling rig. Place it on blue-grey iron seams; its rotating drill produces ore every 1.6 seconds. Route the gold output to a smelter.'},
 smelter:{name:'Smelter',hp:250,power:3,cost:{wood:12,plate:12},desc:'A brick furnace workshop with a chimney and glowing firebox. Feed iron or copper ore into a cyan input. Iron takes 1.6 seconds and copper 2 seconds; plates or copper leave the gold output.'},
 assembler:{name:'Assembler',hp:220,power:4,cost:{wood:15,plate:25},desc:'A sheltered mechanical workshop. Supply two iron plates through a cyan input to machine one gear, then carry it from the gold output to lighthouse storage or another production line.'},
 sawmill:{name:'Sawmill',hp:180,power:0,cost:{plate:12},desc:'An open-sided timber mill with a spinning saw and log racks. Standing trees within five tiles increase its wood output. It supplies fuel without consuming grid power.'},
 generator:{name:'Generator',hp:300,power:0,cost:{wood:25,plate:20},desc:'A wood-fired coastal generator with an exposed cooling fan and exhaust. Burns one wood from lighthouse storage every twelve seconds and supplies eighteen power.'},
 turret:{name:'Sentry turret',hp:350,power:0,cost:{wood:12,plate:16},desc:'A compact mechanical sentry on a fortified base. Defends nearby industry without ammunition or grid power. Its level is fixed; the lighthouse beam extends acquisition range by 20%.'},
 gunTurret:{name:'Gun turret',hp:350,power:2,cost:{wood:15,plate:22,gear:3},desc:'An armored gun emplacement with greater damage and range than the sentry. One gear loads sixteen base shots. Supports ten upgrades; aim the lighthouse at armored targets and approaching swarms.'},
 wall:{name:'Barricade',hp:700,power:0,cost:{wood:5,plate:2},desc:'A low masonry sea-wall barricade. Connect adjacent sections by dragging a defensive line. It delays coastal creatures while your sentries fire.'},
 repair:{name:'Repair',cost:{wood:4,plate:2},desc:'Restores up to 300 health. Damaged buildings show a health bar until fully repaired.'},
 demolish:{name:'Dismantle',cost:{},desc:'Refunds 80% of construction and upgrade materials. Click a tree to collect eight wood, or Shift-drag to clear trees in an area.'}
};
Object.assign(TYPES,{
 inserter:{name:'Transfer relay',hp:140,power:1,cost:{wood:2,plate:5,gear:1},desc:'A gantry transfer mechanism with a moving cargo cradle. Place it between a conveyor behind and a machine ahead. Default: load one item, leave one on the belt. The right-side port feeds a separate return line.'},
 splitter:{name:'Dispatch hub',hp:160,power:0,cost:{wood:2,plate:6,gear:2},desc:'Place on the main conveyor. Input at the rear, Forward ahead, Machine to the left and Return to the right. Program exact batches; default 1 Machine / 1 Forward / 0 Return.'},
 copperDrill:{name:'Copper drill',hp:220,power:3,cost:{wood:15,plate:18},desc:'A copper drilling rig on orange coastal ore seams. Send copper ore through the same brick smelter used for iron, then supply circuit workshops.'},
 foundry:{name:'Steel foundry',hp:300,power:4,cost:{plate:30,gear:5},desc:'A reinforced brick foundry with twin furnace stacks. Converts three iron plates into one steel for advanced machinery, upgrades and coal-fired power.'},
 circuitLab:{name:'Circuit assembler',hp:240,power:4,cost:{plate:25,gear:5},desc:'An electrical assembly workshop. Combines two copper and one iron plate into a circuit for upgraded coastal defenses and advanced components.'},
 componentFactory:{name:'Component factory',hp:320,power:6,cost:{plate:35,steel:10,circuit:8},desc:'A heavy component workshop. Combines two steel, two circuits and a gear into an advanced component for pulse defenses and high-level equipment.'},
 storage:{name:'Warehouse',hp:600,power:0,cost:{wood:25,plate:30},desc:'A coastal warehouse with a loading door and cargo stacks. Stores deliveries locally, separate from lighthouse supplies. Select an output material or feed a neighboring recipe; R turns the loading direction.'},
 coalMine:{name:'Coal mine',hp:240,power:4,cost:{plate:36,steel:6,gear:6},desc:'A braced coal extraction rig on dark seams. Carry coal back to lighthouse storage to fuel the colony’s coal generators.'},
 coalGenerator:{name:'Coal generator',hp:340,power:0,cost:{plate:55,steel:12,gear:8},desc:'A coal-fired generator with a boiler casing and chimney. Burns one coal from lighthouse storage every sixteen seconds and supplies thirty-six power.'},
 mortar:{name:'Mortar turret',hp:315,power:6,cost:{plate:40,steel:18,circuit:6,gear:8},desc:'A fortified mortar with an elevated launch tube. Long-range shells strike groups of coastal creatures. Four base shells per gear; illuminated targets can be acquired 20% farther away.'},
 pulseTurret:{name:'Pulse turret',hp:360,power:9,cost:{plate:45,steel:20,circuit:15,module:4},desc:'A twin-barrel pulse emplacement for dense groups near the perimeter. Uses eight base bursts per gear. Shine the lighthouse on Shell guards and Abyss walkers to expose their armor.'}
});
export const RESOURCE_KEYS=['wood','plate','gear','copper','steel','circuit','module','coal'];
export const POWER_CAPACITY=180;
export const MAX_UPGRADES=10;
export const SAVE_SCHEMA=9;
export const LOGISTICS_TYPES=['inserter','splitter'];
export const PROGRAM_ROLES=['machine','forward','return'];
export const ITEM_KEYS=['ore','copperOre',...RESOURCE_KEYS];
export const DEFAULT_PROGRAM={machine:1,forward:1,return:0,bypass:true,filter:'auto',buffer:2};
export function programFor(b){return b.program||DEFAULT_PROGRAM;}
function programError(v){
 if(!v||PROGRAM_ROLES.some(r=>!Number.isInteger(v[r])||v[r]<0||v[r]>100)||PROGRAM_ROLES.every(r=>v[r]===0))return 'Each quota must be 0–100, with at least one output enabled';
 if(!['auto','any',...ITEM_KEYS].includes(v.filter)||![1,2,4].includes(v.buffer)||typeof v.bypass!=='boolean')return 'Invalid filter, input buffer or blocked-output behavior';
 return null;
}
function setProgram(b,v){
 b.program={machine:v.machine,forward:v.forward,return:v.return,bypass:v.bypass,filter:v.filter,buffer:v.buffer};
 b.phase=0;b.remaining=0;programRole(b);
}
export function logisticsPorts(b){const m=b.type==='splitter'?(b.dir+3)%4:b.dir;return{input:(b.dir+2)%4,machine:m,forward:b.dir,return:(b.dir+1)%4};}
function programRole(b){const p=programFor(b);let phase=Number.isInteger(b.phase)?((b.phase%3)+3)%3:0;for(let i=0;i<3;i++){if(p[PROGRAM_ROLES[phase]]>0){b.phase=phase;if(!(b.remaining>0))b.remaining=p[PROGRAM_ROLES[phase]];return PROGRAM_ROLES[phase];}phase=(phase+1)%3;}return 'forward';}
function advanceProgram(b,role){
 b.shipments||={machine:0,forward:0,return:0,bypassed:0};b.shipments[role]=(b.shipments[role]||0)+1;
 if(--b.remaining<=0){b.phase=(b.phase+1)%3;b.remaining=0;programRole(b);}
}
function logTransfer(b,role,item,s,bypassed=false){b.lastTransfer={role,item,time:s.time};if(bypassed){b.shipments||={machine:0,forward:0,return:0,bypassed:0};b.shipments.bypassed++;}else advanceProgram(b,role);}
function programMatches(b,item,grid){const p=programFor(b);if(p.filter==='any')return true;if(p.filter!=='auto')return item===p.filter;const target=programTarget(b,'machine',grid);return RECIPES[target?.type]?recipeInput(target,item)>0:true;}
function programTarget(b,role,grid){const d=logisticsPorts(b)[role],[dx,dz]=DIRS[d];return grid.get(key(b.x+dx,b.z+dz));}

export const RECIPES={
 smelter:{input:{ore:1},output:'plate',seconds:1.6},assembler:{input:{plate:2},output:'gear',seconds:2.4},
 foundry:{input:{plate:3},output:'steel',seconds:3.5},
 circuitLab:{input:{copper:2,plate:1},output:'circuit',seconds:4},componentFactory:{input:{steel:2,circuit:2,gear:1},output:'module',seconds:5}
};
const COPPER_RECIPE={input:{copperOre:1},output:'copper',seconds:2};
export function recipeInput(b,item){return b.type==='smelter'&&item==='copperOre'?1:RECIPES[b.type]?.input[item]||0;}
export function productionRecipe(b){
 const recipe=b.type==='smelter'&&b.input[0]==='copperOre'?COPPER_RECIPE:RECIPES[b.type];
 return recipe&&Object.entries(recipe.input).every(([item,n])=>b.input.filter(v=>v===item).length>=n)?recipe:null;
}
export const DIRECTIONAL = ['inserter','splitter','belt','storage','drill','copperDrill','coalMine',...Object.keys(RECIPES)];
export const TURRET_LEVELS = [
 {name:'Mk I',hp:350,damage:28,range:10,interval:.38,cost:null},
 {name:'Mk II',hp:500,damage:48,range:10.5,interval:.32,cost:{plate:15,gear:3}},
 {name:'Mk III',hp:700,damage:72,range:11,interval:.28,cost:{plate:21,gear:4}}
];
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
for(let i=3;i<=MAX_UPGRADES;i++)TURRET_LEVELS.push({name:'Mk '+ROMAN[i],hp:700+(i-2)*180,damage:72+(i-2)*12,range:11+(i-2)*.25,interval:.28/(1+(i-2)*.04),cost:{plate:21+(i-2)*7,gear:4+(i-2)*2}});
export const TURRETS=['turret','gunTurret','mortar','pulseTurret'];
export const SAWMILL_RADIUS=5;
export const buildingRadius=b=>b?.type==='sawmill'?SAWMILL_RADIUS:TURRETS.includes(b?.type)?turretStats(b).range:0;
export const usesAmmo=type=>TURRETS.includes(type)&&type!=='turret';
export const GENERATORS={generator:{fuel:'wood',power:18,seconds:12},coalGenerator:{fuel:'coal',power:36,seconds:16}};
export function turretStats(b){
 const normal=TURRET_LEVELS[Math.max(0,Math.min(MAX_UPGRADES,(b.level||1)-1))];
 if(b.type==='turret')return {hp:TYPES.turret.hp,damage:14,range:7.5,interval:.64};
 if(b.type==='mortar')return {...normal,hp:TYPES.mortar.hp+normal.hp-350,damage:normal.damage*1.6,range:normal.range+2,interval:normal.interval*3,radius:2.25,ammoDivisor:4};
 if(b.type==='pulseTurret')return {...normal,hp:TYPES.pulseTurret.hp+normal.hp-350,damage:normal.damage*.8,range:normal.range-3,interval:normal.interval*1.5,radius:1.35,ammoDivisor:2};
 return normal;
}
export const maxHp = b => TURRETS.includes(b.type) ? turretStats(b).hp : Math.round(TYPES[b.type].hp*(1+((b.level||1)-1)*.25));
const EXTRACTORS=['drill','copperDrill','coalMine'];
const PRODUCERS=[...EXTRACTORS,'sawmill',...Object.keys(RECIPES)];
export const OUTPUT_CAPACITY=5;
export const hasOutputBuffer=type=>EXTRACTORS.includes(type)||Object.hasOwn(RECIPES,type);
export const outputCount=b=>(b.item?1:0)+(b.outputBuffer?.length??0);
export function canShareOutput(source,target){
 return target?.type===source.type&&target.dir===source.dir&&source.sendOutput===true&&target.receiveOutput===true&&outputCount(target)<OUTPUT_CAPACITY;
}
function enqueueOutput(b,item){if(b.item)(b.outputBuffer??=[]).push(item);else b.item=item;}
const ROUND_BONUSES=[
 {label:'+15% mining speed',speed:1.15,types:EXTRACTORS},
 {label:'+25% smelting speed',speed:1.25,types:['smelter']},
 {label:'20 shots per gear',shotsPerGear:20},
 {label:'Barricades take 30% less damage',wallDamage:.7},
 {label:'+45% sawmill speed',speed:1.45,types:['sawmill']},
 {label:'Repairs cost 1 iron plate instead of 2',repairPlates:1},
 {label:'+50% advanced component speed',speed:1.5,types:['componentFactory']},
 {label:'+10% production speed',speed:1.1,types:PRODUCERS}
];
export function roundBonus(wave){
 return wave>0?ROUND_BONUSES[(wave-1)%ROUND_BONUSES.length]:null;
}
export function shotsPerGear(bonus){return bonus?.shotsPerGear??16;}
export const turretReload=(b,bonus)=>Math.floor(shotsPerGear(bonus)/(turretStats(b).ammoDivisor||1));
export const beltTravelTicks=b=>Math.max(2,9-(b.level||1));
export const BELT_CAPACITY=4;
const BELT_SPACING=1/BELT_CAPACITY;
export const conveyorProgress=(belt,cargo,tick)=>cargo.itemProgress??Math.max(0,Math.min(1,(tick-(cargo.itemTick??0))/beltTravelTicks(belt)));
export const conveyorCount=b=>(b.item?1:0)+(b.beltQueue?.length??0);
export function repairCost(bonus){return {...TYPES.repair.cost,plate:bonus?.repairPlates??TYPES.repair.cost.plate};}
export function productionSpeed(b,bonus,difficulty){
 const upgrade=(1+((b.level||1)-1)*.5)*(DIFFICULTIES[difficulty]?.production??1);
 return bonus?.types?.includes(b.type)?upgrade*bonus.speed:upgrade;
}
export const buildingPower = b => Math.ceil(TYPES[b.type].power*(1+((b.level||1)-1)*(TURRETS.includes(b.type)?.2:.1)));
export const storageCapacity=s=>300+((s.buildings.find(b=>b.type==='hq')?.level??1)-1)*80;
export const warehouseCapacity=b=>300+((b.level||1)-1)*180;
export const warehouseStock=(b,item)=>b.stock?.[item]??0;
const warehouseExportValid=item=>item===null||item==='recipe'||RESOURCE_KEYS.includes(item);
export const powerOutput=b=>b.type==='hq'?18+((b.level||1)-1)*3:GENERATORS[b.type].power*(1+((b.level||1)-1)*.3);
const plateYieldUnits=b=>(b.level||1)>1?6+(b.level-2):4;
export const plateYield=b=>plateYieldUnits(b)/4;
export function upgradeCost(b){
 if(b.type==='turret')return null;
 const level=b.level||1;if(level>MAX_UPGRADES)return null;
 if(b.type==='belt')return level===1?{wood:1}:{wood:level,plate:Math.floor(level/2)};
 const base=TYPES[b.type].cost;
 if(GENERATORS[b.type]||b.type==='hq'){
  const cost=Object.fromEntries(Object.entries(Object.keys(base).length?base:{plate:35,gear:5}).map(([r,n])=>[r,Math.ceil(n*.65*1.45**level)]));
  cost.plate=(cost.plate||0)+Math.ceil(5*level**1.35);cost.gear=(cost.gear||0)+Math.ceil(level**1.25);
  if(level>=3){cost.steel=(cost.steel||0)+(level-2)*3;cost.circuit=(cost.circuit||0)+(level-2)*2;}
  return cost;
 }
 const cost=b.type==='gunTurret'?{...TURRET_LEVELS[level].cost}:
  Object.fromEntries(Object.entries(Object.keys(base).length?base:{plate:35,gear:5}).map(([r,n])=>[r,Math.max(1,Math.round(n*(.42+.08*level)))]));
 if(b.type!=='gunTurret'&&level>1)cost.plate=(cost.plate||0)+level-1;
 if(level>=4){cost.steel=(cost.steel||0)+level-3;cost.circuit=(cost.circuit||0)+Math.floor((level-3)/2);}
 for(const resource of Object.keys(cost))if(!cost[resource])delete cost[resource];
 return cost;
}
export function planGroupUpgrade(s,ids){
 if(!Array.isArray(ids)||!ids.length||ids.length>s.buildings.length)return {error:'Select buildings of one type'};
 const wanted=new Set(ids),buildings=s.buildings.filter(b=>wanted.has(b.id));
 if(buildings.length!==wanted.size||wanted.size!==ids.length)return {error:'Selection changed. Select the buildings again.'};
 if(!buildings.every(b=>b.type===buildings[0].type))return {error:'Select buildings of one type'};
 const targets=[],cost={};
 for(const b of buildings){
  const price=upgradeCost(b);if(!price)continue;
  targets.push(b);
  for(const [r,n] of Object.entries(price))cost[r]=(cost[r]||0)+n;
 }
 const error=!targets.length?buildings[0].type==='turret'?'Sentry turrets cannot be upgraded':'Selected buildings are fully upgraded':
  Object.entries(cost).some(([r,n])=>s.resources[r]<n)?'Not enough materials to upgrade the selection':null;
 return {targets,cost,error};
}
function applyUpgrade(b){const missing=maxHp(b)-b.hp;b.level=(b.level||1)+1;b.hp=maxHp(b)-missing;}
export const inventoryCount = (s,id,type) => s.players.find(p=>p.id===id)?.inventory?.[type]?.length||0;
function migrateCopperSmelterHealth(b){
 const scale=1+((b.level||1)-1)*.25;
 b.hp=Math.max(1,b.hp-(Math.round(260*scale)-Math.round(TYPES.smelter.hp*scale)));
}
function normalizeOutput(b){
 if(b.plateCredit!==undefined&&(!Number.isInteger(b.plateCredit)||b.plateCredit<0||b.plateCredit>3))delete b.plateCredit;
 if(b.outputBuffer!==undefined)b.outputBuffer=Array.isArray(b.outputBuffer)&&b.item?
  b.outputBuffer.filter(item=>ITEM_KEYS.includes(item)).slice(0,OUTPUT_CAPACITY-1):[];
}
function normalizeWarehouse(b){
 if(!warehouseExportValid(b.exportItem))delete b.exportItem;
 if(b.stock!==undefined)b.stock=Object.fromEntries(RESOURCE_KEYS.flatMap(item=>{
  const n=b.stock?.[item];
  return Number.isSafeInteger(n)&&n>0?[[item,n]]:[];
 }));
}
function normalizeConveyor(b){
 if(!ITEM_KEYS.includes(b.item)){emptyConveyor(b);return;}
 if(b.itemProgress!==undefined&&!validBeltProgress(b.itemProgress))delete b.itemProgress;
 if(!Array.isArray(b.beltQueue)){delete b.beltQueue;return;}
 b.beltQueue=b.beltQueue.slice(0,BELT_CAPACITY-1).filter(cargo=>cargo&&ITEM_KEYS.includes(cargo.item)&&
  Number.isInteger(cargo.itemTick)&&validBeltProgress(cargo.itemProgress));
}
function validBeltProgress(progress){return Number.isFinite(progress)&&progress>=0&&progress<=1;}
export function migrateGame(s){
 if(!s||![1,2,3,4,5,6,7,8,SAVE_SCHEMA].includes(s.version)||!Array.isArray(s.buildings)||!s.terrain||!Array.isArray(s.players))throw Error('Unsupported or damaged save file.');
 const previous=s.version,old=previous<SAVE_SCHEMA;
 s.version=SAVE_SCHEMA;if(!Object.hasOwn(DIFFICULTIES,s.difficulty))s.difficulty='standard';s.stats||={totals:{},history:[{time:s.time,totals:{}}]};s.stats.totals||={};s.stats.history||=[{time:s.time,totals:{}}];
 s.terrain.copper||=makeTerrain(s.seed).copper;s.terrain.coal||=makeTerrain(s.seed).coal;
 for(const r of RESOURCE_KEYS)s.resources[r]??=0;
 s.resources.power??=0;
 for(const p of s.players){p.inventory||={};for(const field of ['x','z','hp','input','sprinting','cooldown','respawn'])delete p[field];}
 if(previous<8){
  const outer=makeTerrain(s.seed),edge=previous<7?27:39;
  for(const kind of ['trees','rocks','ore','copper','coal']){
   s.terrain[kind]=s.terrain[kind].filter(v=>Math.abs(v.x)<=edge&&Math.abs(v.z)<=edge)
    .concat(outer[kind].filter(v=>Math.abs(v.x)>edge||Math.abs(v.z)>edge));
  }
  for(const b of s.buildings)if(b.type==='turret'&&b.level>1)b.type='gunTurret';
  for(const p of s.players){
   const upgraded=(p.inventory.turret||[]).filter(b=>b.level>1);
   if(upgraded.length){(p.inventory.gunTurret??=[]).push(...upgraded);p.inventory.turret=p.inventory.turret.filter(b=>!(b.level>1));}
  }
  let pads=s.buildings.filter(b=>b.type==='launchpad').length;
  s.buildings=s.buildings.filter(b=>b.type!=='launchpad');
  for(const p of s.players){pads+=p.inventory.launchpad?.length||0;delete p.inventory.launchpad;}
  for(const [r,n] of Object.entries({plate:80,steel:20,circuit:15,gear:10}))s.resources[r]+=pads*n;
  if(previous<7&&s.status==='victory'){s.survived=s.wave>=FINAL_WAVE;s.status=s.survived?'victory':'playing';s.nextWave=Math.max(s.nextWave,s.time+30);}
  if(previous<7&&s.tutorialStep===0)s.cameraTrained=false;
 }
 if(old)openDeposits(s.terrain);
 delete s.evacuation;
 for(const b of s.buildings){b.level||=1;if(b.type==='copperSmelter'){migrateCopperSmelterHealth(b);b.type='smelter';}if(LOGISTICS_TYPES.includes(b.type)){b.program||={...DEFAULT_PROGRAM};programRole(b);}if(hasOutputBuffer(b.type))normalizeOutput(b);if(b.type==='storage')normalizeWarehouse(b);if(b.type==='belt')normalizeConveyor(b);}
 for(const p of s.players){
  for(const [type,items] of Object.entries(p.inventory))if(Array.isArray(items))for(const b of items)if(b){
   if(hasOutputBuffer(type))normalizeOutput(b);
   if(type==='storage')normalizeWarehouse(b);
  }
  const packed=p.inventory.copperSmelter;
  if(!Array.isArray(packed))continue;
  for(const b of packed)migrateCopperSmelterHealth(b);
  (p.inventory.smelter||=[]).push(...packed);
  delete p.inventory.copperSmelter;
 }
 if(old)updatePower(s);
 if(!TUTORIAL_STEPS[s.tutorialStep]||!Number.isInteger(s.tutorialStep))delete s.tutorialStep;
 return s;
}
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function rng(seed){let n=seed|0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
export const key=(x,z)=>`${x},${z}`;
function openDeposits(terrain){
 const clear=new Set();
 for(const {x,z} of [...terrain.ore,...terrain.copper,...terrain.coal]){
  const [dx,dz]=Math.abs(x)>=Math.abs(z)?[-Math.sign(x),0]:[0,-Math.sign(z)];
  for(let ox=-2;ox<=2;ox++)for(let oz=-2;oz<=2;oz++)clear.add(key(x+ox,z+oz));
  if(Math.hypot(x,z)>18)for(let i=1;i<=11;i++){
   const nx=x+i*dx,nz=z+i*dz;
   if(Math.hypot(nx,nz)<15)break;
   clear.add(key(nx,nz));
  }
 }
 for(const kind of ['trees','rocks'])terrain[kind]=terrain[kind].filter(t=>Math.max(Math.abs(t.x),Math.abs(t.z))<BUILD_EDGE-1&&!clear.has(key(t.x,t.z)));
 return terrain;
}
const woodlandTiles=new WeakMap();
const sawmillOffsets=Array.from({length:2*SAWMILL_RADIUS-1},(_,i)=>i-SAWMILL_RADIUS+1);
const sawmillRadius=sawmillOffsets.flatMap(x=>sawmillOffsets.map(z=>[x,z])).filter(([x,z])=>x*x+z*z<SAWMILL_RADIUS**2);
export function sawmillTrees(terrain,b){
 let index=woodlandTiles.get(terrain);
 if(index?.trees!==terrain.trees||index.count!==terrain.trees.length){
  index={trees:terrain.trees,count:terrain.trees.length,tiles:new Set(terrain.trees.map(t=>key(t.x,t.z)))};
  woodlandTiles.set(terrain,index);
 }
 return sawmillRadius.reduce((n,[x,z])=>n+Number(index.tiles.has(key(b.x+x,b.z+z))),0);
}
export const sawmillRate=(s,b)=>Math.sqrt(sawmillTrees(s.terrain,b)/6)*productionSpeed(b,roundBonus(s.wave),s.difficulty);
export function makeTerrain(seed=2026){
 const rand=rng(Math.imul(seed||2026,0x85ebca6b)),trees=new Map(),ore=[],rocks=[],copper=[],coal=[],occupied=new Set();
 function deposit(list,cx,cz,radius){
  for(let x=cx-radius;x<=cx+radius;x++)for(let z=cz-radius;z<=cz+radius;z++){
   const tile=key(x,z);if(occupied.has(tile)||(x-cx)**2+(z-cz)**2>radius**2+1)continue;
   occupied.add(tile);list.push({x,z});
  }
 }
 for(const [x,z] of [[-10,-3],[-10,3],[-10,9],[4,5],[9,-9],[15,7],[-19,-13]])deposit(ore,x,z,2);
 for(const [x,z] of [[8,-4],[17,12],[-18,3]])deposit(copper,x,z,2);
 for(const [x,z] of [[10,10],[-14,14],[17,-8]])deposit(coal,x,z,2);
 for(let gx=-75;gx<=75;gx+=25)for(let gz=-75;gz<=75;gz+=25){
  if(Math.hypot(gx,gz)<23)continue;
  const x=gx+Math.floor(rand()*15)-7,z=gz+Math.floor(rand()*15)-7;
  const deposits=[ore,copper,coal];deposit(deposits[Math.floor(rand()*3)],x,z,2+Math.floor(rand()*3));
 }
 function grove(cx,cz,r){
  const limit=Math.ceil(r);
  for(let x=cx-limit;x<=cx+limit;x++)for(let z=cz-limit;z<=cz+limit;z++){
   const tile=key(x,z),d=((x-cx)**2+(z-cz)**2)/(r*r);
   if(x<-BUILD_EDGE||x>BUILD_EDGE||z<-BUILD_EDGE||z>BUILD_EDGE||Math.hypot(x,z)<15||occupied.has(tile)||d>.8+rand()*.22)continue;
   trees.set(tile,{x,z,h:.8+rand()*.8});
  }
 }
 for(let gx=-78;gx<=78;gx+=19)for(let gz=-78;gz<=78;gz+=19){
  if(Math.hypot(gx,gz)<24||rand()<.33)continue;
  grove(gx+Math.floor(rand()*13)-6,gz+Math.floor(rand()*13)-6,3.8+rand()*5.4);
 }
 for(const [x,z] of [[9,2],[9,3],[10,3],[9,4],[10,4],[9,5],[10,5]])if(!occupied.has(key(x,z)))trees.set(key(x,z),{x,z,h:1+rand()*.45});
 for(let x=-BUILD_EDGE;x<=BUILD_EDGE;x++)for(let z=-BUILD_EDGE;z<=BUILD_EDGE;z++)if(Math.hypot(x,z)>16&&!occupied.has(key(x,z))&&!trees.has(key(x,z))&&rand()<.007)rocks.push({x,z,h:.3+rand()*.6});
 return openDeposits({trees:[...trees.values()],ore,rocks,copper,coal});
}
function building(s,type,x,z,dir=0){const b={id:s.nextId++,type,x,z,dir,hp:TYPES[type].hp,progress:0,input:[],item:null,ammo:0,cooldown:0,active:true,level:1};if(LOGISTICS_TYPES.includes(type)){b.program={...DEFAULT_PROGRAM};programRole(b);}s.buildings.push(b);return b;}
export function createGame(seed=2026,{difficulty='standard'}={}){
 if(!Object.hasOwn(DIFFICULTIES,difficulty))difficulty='standard';
 const s={version:SAVE_SCHEMA,difficulty,stats:{totals:{},history:[{time:0,totals:{}}]},seed,time:0,tick:0,nextId:1,resources:{wood:165,plate:180,gear:20,copper:0,steel:0,circuit:0,module:0,coal:0,power:0},buildings:[],players:[],enemies:[],shots:[],wave:0,nextWave:DIFFICULTIES[difficulty].prep,totalKills:0,produced:{plate:0,gear:0},power:{used:0,total:18},status:'playing',paused:false,speed:1,terrain:makeTerrain(seed),events:[]};
 building(s,'hq',0,0);
 if(difficulty==='relaxed')Object.assign(s.resources,{wood:195,plate:210,gear:28});
 // Two working starter chains: ore → plate → shared storage / gears.
 for(const z of [-3,3]){
  building(s,'drill',-8,z);building(s,'belt',-7,z);building(s,'smelter',-6,z);
  for(let x=-5;x<=-2;x++)building(s,'belt',x,z);
  if(z===-3){building(s,'belt',-1,z,1);building(s,'belt',-1,-2,1);building(s,'belt',-1,-1,0);building(s,'belt',0,-1,1);}
  else{building(s,'assembler',-1,z,3);building(s,'belt',-1,2,3);building(s,'belt',-1,1,0);building(s,'belt',0,1,3);}
 }
 building(s,'generator',3,-2);building(s,'sawmill',7,6); 

 for(const [x,z] of [[-5,-8],[5,-8],[6,7],[-5,7]]){const b=building(s,'turret',x,z);b.ammo=24;}
 for(let x=-6;x<=6;x++){if(Math.abs(x)<2)continue;building(s,'wall',x,-10);building(s,'wall',x,10);}
 for(let z=-9;z<=9;z++){if(Math.abs(z)<3)continue;building(s,'wall',-13,z);building(s,'wall',12,z);}
 const occupied=new Set(s.buildings.map(b=>key(b.x,b.z)));
 for(const type of ['trees','rocks'])s.terrain[type]=s.terrain[type].filter(v=>!occupied.has(key(v.x,v.z)));
 updatePower(s);return s;
}
export function addPlayer(s,name='Engineer'){
 if(s.players.length>=MAX_PLAYERS)return null;
 const id=s.nextId++,p={id,name:(typeof name==='string'?name.trim().slice(0,20):'')||'Engineer',color:s.players.length,inventory:{}};s.players.push(p);return p;
}
function packBuilding(player,building){
 const {id,x,z,dir,type,active,...packed}=building;
 if(type==='belt')emptyConveyor(packed);
 (player.inventory[type]||=[]).push(packed);
}
function emptyConveyor(b){b.item=null;delete b.itemTick;delete b.itemSide;delete b.itemProgress;delete b.beltQueue;}
export function dismantleValue(b){
 const costs={...TYPES[b.type].cost};
 for(let level=1;level<Math.min(b.level||1,MAX_UPGRADES+1);level++){
  for(const [resource,n] of Object.entries(upgradeCost({...b,level})||{}))costs[resource]=(costs[resource]||0)+n;
 }
 return costs;
}
function refundDismantle(s,b){
 const remainders=s.refundRemainder??={};
 for(const [r,n] of Object.entries(dismantleValue(b))){
  const fifths=n*4+(remainders[r]??0);
  s.resources[r]+=Math.floor(fifths/5);
  remainders[r]=fifths%5;
 }
}
function harvestWood(s,trees){
 const room=Math.max(0,storageCapacity(s)-s.resources.wood);
 s.resources.wood+=Math.min(room,trees*8);
}
export function createExpedition(name,{difficulty,skipTutorial=false,swarmSeed=0}={}){
 const state=createGame(swarmSeed||2026,{difficulty}),player=addPlayer(state,name);
 if(swarmSeed)state.swarmSeed=swarmSeed;
 for(const b of state.buildings)if(b.type!=='hq')packBuilding(player,b);
 state.buildings=state.buildings.filter(b=>b.type==='hq');
 if(!skipTutorial)state.tutorialStep=0;
 updatePower(state);
 return {state,playerId:player.id};
}
export function removePlayer(s,id){const leaving=s.players.find(p=>p.id===id),recipient=s.players.find(p=>p.id!==id);if(leaving?.inventory&&recipient){recipient.inventory||={};for(const[type,items]of Object.entries(leaving.inventory))(recipient.inventory[type]||=[]).push(...items);}s.players=s.players.filter(p=>p.id!==id);}
function placementError(s,type,x,z,ignoreBelts=false){
 const def=TYPES[type];if(!Object.hasOwn(TYPES,type)||!def||type==='hq'||['repair','demolish'].includes(type))return 'Invalid building';
 if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>BUILD_EDGE||Math.abs(z)>BUILD_EDGE)return 'Outside the construction zone';
 const occupied=s.buildings.find(b=>b.x===x&&b.z===z);
 if(occupied&&!(ignoreBelts&&occupied.type==='belt'))return 'Tile is occupied';
 if(s.terrain.trees.some(b=>b.x===x&&b.z===z)||s.terrain.rocks.some(b=>b.x===x&&b.z===z))return 'Clear the tile with Dismantle first';
 if(type==='drill'&&!s.terrain.ore.some(b=>b.x===x&&b.z===z))return 'Drills must be placed on iron deposits';
 if(type==='copperDrill'&&!s.terrain.copper?.some(b=>b.x===x&&b.z===z))return 'Copper drills must be placed on copper deposits';
 if(type==='coalMine'&&!s.terrain.coal?.some(b=>b.x===x&&b.z===z))return 'Coal mines must be placed on coal deposits';
 if(type==='sawmill'&&!sawmillTrees(s.terrain,{x,z}))return 'A sawmill needs trees within five tiles';
 return null;
}
export function canBuild(s,type,x,z,playerId){
 const error=placementError(s,type,x,z);if(error)return error;
 if(inventoryCount(s,playerId,type)>0)return null;
 for(const[r,n]of Object.entries(TYPES[type].cost))if(s.resources[r]<n)return 'Not enough materials';
 return null;
}
export function outputPointsAt(b,x,z){
 if(LOGISTICS_TYPES.includes(b.type)){const p=programFor(b),ports=logisticsPorts(b);return PROGRAM_ROLES.some(role=>p[role]>0&&(b.type==='splitter'||role!=='forward')&&b.x+DIRS[ports[role]][0]===x&&b.z+DIRS[ports[role]][1]===z);}
 if(b.type==='storage'&&!b.exportItem)return false;
 const [dx,dz]=DIRS[b.dir||0];return DIRECTIONAL.includes(b.type)&&b.x+dx===x&&b.z+dz===z;
}
export function beltInputs(b,grid){
 const inputs=[];for(let d=0;d<4;d++){if(d===b.dir)continue;const[dx,dz]=DIRS[d],other=grid.get(key(b.x+dx,b.z+dz));if(other&&outputPointsAt(other,b.x,b.z))inputs.push(d);}
 return inputs.length?inputs:[(b.dir+2)%4];
}
function beltExit(grid,cell,d){
 const[dx,dz]=DIRS[d],target=grid.get(key(cell.x+dx,cell.z+dz));
 if(!target)return false;
 if(target.type==='splitter')return target.dir===d;
 if(hasOutputSide(target))return target.dir!==(d+2)%4;
 return ['hq','storage','launchpad'].includes(target.type);
}
const routeTile=cell=>cell&&Number.isInteger(cell.x)&&Number.isInteger(cell.z)&&Math.abs(cell.x)<=BUILD_EDGE&&Math.abs(cell.z)<=BUILD_EDGE;
export function planBeltDrag(s,points,dir){
 const invalid=error=>({error,cells:[]});
 if(!Array.isArray(points)||points.length<2||points.length>128||!points.every(routeTile)||!DIRS[dir])return invalid('Invalid conveyor drag');
 const start=points[0],path=[{x:start.x,z:start.z,dir}],used=new Set([key(start.x,start.z)]);
 for(let i=1;i<points.length;i++){
  const from=points[i-1],to=points[i],dx=to.x-from.x,dz=to.z-from.z;
  if(dx&&dz)return invalid('Conveyor drag segments must be straight');
  if(!dx&&!dz)continue;
  const out=DIRS.findIndex(([x,z])=>x===Math.sign(dx)&&z===Math.sign(dz));
  path.at(-1).dir=out;
  for(let j=1;j<=Math.abs(dx)+Math.abs(dz);j++){
   const x=from.x+Math.sign(dx)*j,z=from.z+Math.sign(dz)*j,k=key(x,z);
   if(used.has(k)||path.length===128)return invalid('Drag cannot cross itself or exceed 128 tiles');
   used.add(k);path.push({x,z,dir:out});
  }
 }
 if(path.length<2)return invalid('Drag to another tile to lay a conveyor line');
 const last=path.at(-1),incoming=last.dir;
 if(dir!==(incoming+2)%4)last.dir=dir;
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
 const blocked=new Set([...s.terrain.trees,...s.terrain.rocks].map(b=>key(b.x,b.z)));
 const cells=[];
 for(const [i,cell] of path.entries()){
  const k=key(cell.x,cell.z),b=grid.get(k);
  if(blocked.has(k))return {error:'Conveyor drag is blocked by terrain',cells:path};
  if(!b){cells.push(cell);continue;}
  if(cell===last&&beltExit(grid,path.at(-2),incoming))continue;
  if(i===0){
   if(b.type==='belt'){
    const next=path[1],neighbor=grid.get(key(next.x,next.z));
    if(b.dir===cell.dir||(!beltExit(grid,b,b.dir)&&!(neighbor&&outputPointsAt(neighbor,b.x,b.z)))){cells.push(cell);continue;}
   }else if(outputPointsAt(b,path[1].x,path[1].z))continue;
  }
  return {error:'Conveyor drag is blocked by a building or an opposing port',cells:path};
 }
 return {error:null,cells};
}
// An orthogonal A* route with turn penalties; avoids obstacles and fills every tile.
export function planRoute(s,type,start,end,dir=0){
 if(!['belt','wall'].includes(type))return{error:'Rows are available for conveyors and barricades',cells:[]};
 if(!start||!end||![start.x,start.z,end.x,end.z].every(Number.isInteger)||Math.abs(start.x)>BUILD_EDGE||Math.abs(start.z)>BUILD_EDGE||Math.abs(end.x)>BUILD_EDGE||Math.abs(end.z)>BUILD_EDGE)return{error:'Route is outside the construction zone',cells:[]};
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b])),blocked=new Set([...s.terrain.trees,...s.terrain.rocks].map(v=>key(v.x,v.z)));
 const first=grid.get(key(start.x,start.z)),last=grid.get(key(end.x,end.z));
 // Existing conveyors can be endpoints. A route cannot replace a crossing conveyor.
 const allowed=(x,z)=>{
  if(Math.abs(x)>BUILD_EDGE||Math.abs(z)>BUILD_EDGE||blocked.has(key(x,z)))return false;
  const b=grid.get(key(x,z));
  if(!b)return true;
  if(type==='wall')return b.type==='wall';
  return b===first&&DIRECTIONAL.includes(b.type)||b===last&&(['belt','hq','storage','launchpad','splitter'].includes(b.type)||Object.hasOwn(RECIPES,b.type));
 };
 if(!allowed(start.x,start.z)||!allowed(end.x,end.z))return{error:'Route endpoint is blocked',cells:[]};
 const initial={x:start.x,z:start.z,d:dir,g:0,f:Math.abs(start.x-end.x)+Math.abs(start.z-end.z),prev:null},open=[initial],best=new Map([[`${start.x},${start.z},${dir}`,0]]);let goal=null,visits=0;
 while(open.length&&visits++<14000){
  let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
  const cur=open.splice(bi,1)[0];if(cur.x===end.x&&cur.z===end.z){goal=cur;break;}
  for(const d of [cur.d,(cur.d+1)%4,(cur.d+3)%4,(cur.d+2)%4]){
   if(cur===initial&&type==='belt'&&first){
    if(first.type!=='belt'||beltExit(grid,first,first.dir)){if(d!==first.dir)continue;}
    else{const[ox,oz]=DIRS[d],source=grid.get(key(first.x+ox,first.z+oz));if(source&&outputPointsAt(source,first.x,first.z))continue;}
   }
   const[dx,dz]=DIRS[d],x=cur.x+dx,z=cur.z+dz;if(!allowed(x,z))continue;
   if(cur.prev?.x===x&&cur.prev.z===z)continue;
   if(type==='belt'&&x===start.x&&z===start.z)continue;
   if(last&&hasOutputSide(last)&&x===end.x&&z===end.z&&last.dir===(d+2)%4)continue;
   if(last&&last.type==='splitter'&&x===end.x&&z===end.z&&d!==last.dir)continue;
   const g=cur.g+1+(d===cur.d?0:.15),k=`${x},${z},${d}`;if((best.get(k)??Infinity)<=g)continue;best.set(k,g);
   open.push({x,z,d,g,f:g+Math.abs(x-end.x)+Math.abs(z-end.z),prev:cur});
  }
 }
 if(!goal)return{error:'No clear route found',cells:[]};
 const path=[];for(let p=goal;p;p=p.prev)path.push({x:p.x,z:p.z});path.reverse();
 if(path.length>128)return{error:'Route is too long (128 tiles maximum)',cells:[]};
 const cells=[];for(let i=0;i<path.length;i++){
  const cell=path[i],occupant=grid.get(key(cell.x,cell.z)),next=path[i+1];
  if(occupant&&(occupant.type!==type||!next))continue;
  const out=next?DIRS.findIndex(([dx,dz])=>cell.x+dx===next.x&&cell.z+dz===next.z):goal.d;
  cells.push({...cell,dir:out});
 }return{cells,error:null};
}
function place(s,p,type,x,z,dir){
 const packed=p.inventory?.[type]?.shift();const b=building(s,type,x,z,dir);
 if(packed){Object.assign(b,packed,{id:b.id,x,z,dir});if(type==='belt')emptyConveyor(b);}
 else for(const[r,n]of Object.entries(TYPES[type].cost))s.resources[r]-=n;
 return b;
}
export function copySetup(s,ids){
 const selected=s.buildings.filter(b=>b.type!=='hq'&&ids.includes(b.id));
 if(!selected.length)return [];
 const left=Math.min(...selected.map(b=>b.x)),top=Math.min(...selected.map(b=>b.z));
 return selected.map(b=>({type:b.type,x:b.x-left,z:b.z-top,dir:b.dir,
  ...(LOGISTICS_TYPES.includes(b.type)?{program:{...programFor(b)}}:{}),
  ...(b.type==='storage'?{exportItem:b.exportItem??null}:{}),
  ...(hasOutputBuffer(b.type)?{sendOutput:b.sendOutput===true,receiveOutput:b.receiveOutput===true}:{})}));
}
export function planPaste(s,layout,anchor,playerId){
 if(!Array.isArray(layout)||!layout.length||!Number.isInteger(anchor?.x)||!Number.isInteger(anchor?.z))
  return {cells:[],error:'Invalid setup or destination'};
 const occupied=new Set(),needed=new Map(),cost={},cells=[];
 for(const tile of layout){
  if(!tile||!Number.isInteger(tile.x)||!Number.isInteger(tile.z)||tile.x<0||tile.z<0||tile.x>BUILD_EDGE*2||tile.z>BUILD_EDGE*2||
     !Number.isInteger(tile.dir)||tile.dir<0||tile.dir>3||LOGISTICS_TYPES.includes(tile.type)&&programError(tile.program)||
     tile.type==='storage'&&!warehouseExportValid(tile.exportItem??null))
   return {cells:[],error:'Invalid building in copied setup'};
  const x=anchor.x+tile.x,z=anchor.z+tile.z,k=key(x,z);
  if(occupied.has(k))return {cells:[],error:'Copied setup contains overlapping buildings'};
  occupied.add(k);
  const reason=placementError(s,tile.type,x,z);
  cells.push({type:tile.type,x,z,dir:tile.dir,program:tile.program,reason,sendOutput:tile.sendOutput===true,receiveOutput:tile.receiveOutput===true,exportItem:tile.exportItem});
  if(!reason)needed.set(tile.type,(needed.get(tile.type)||0)+1);
 }
 if(cells.some(tile=>tile.reason))return {cells,error:cells.find(tile=>tile.reason).reason};
 for(const [type,count] of needed){
  const fresh=Math.max(0,count-inventoryCount(s,playerId,type));
  for(const [resource,price] of Object.entries(TYPES[type].cost))cost[resource]=(cost[resource]||0)+fresh*price;
 }
 const error=Object.entries(cost).some(([r,n])=>s.resources[r]<n)?'Not enough materials for the entire setup':null;
 return {cells,cost,error};
}
export function command(s,playerId,cmd){
 const p=s.players.find(p=>p.id===playerId);if(!p||!cmd||typeof cmd!=='object')return 'Invalid player';p.inventory||={};
 if(cmd.type==='cameraTraining'){
  if(p!==s.players[0]||s.tutorialStep!==0)return 'Camera training is inactive';
  s.cameraTrained=true;return null;
 }
 if(cmd.type==='continueAfterVictory'){
  if(p!==s.players[0]||s.status!=='victory'||!isPostVictory(s))return 'Only the host can continue a victorious colony';
  s.status='playing';s.paused=false;s.nextWave=s.time+DIFFICULTIES[s.difficulty].prep;return null;
 }
 if(s.status!=='playing')return 'The expedition has ended';
 if(cmd.type==='aimLighthouse'){
  const core=s.buildings.find(b=>b.type==='hq');
  if(!core)return 'The lighthouse has fallen';
  if(!routeTile(cmd)||cmd.x===core.x&&cmd.z===core.z)return 'Choose a direction away from the lighthouse';
  core.lighthouseAim=Math.atan2(cmd.x-core.x,cmd.z-core.z);
  if(s.tutorialStep===7)s.tutorialAimIssued=true;
  return null;
 }
 if(cmd.type==='finishTutorial'){
  if(p!==s.players[0]||s.tutorialStep===undefined)return 'Only the host can finish active training';
  if(cmd.skip!==true&&s.tutorialStep!==TUTORIAL_STEPS.length-1)return 'Complete the current training task first';
  delete s.tutorialStep;
  s.enemies=s.enemies.filter(e=>!e.training);
  s.nextWave=s.time+DIFFICULTIES[s.difficulty].prep;
  return null;
 }
 if(['pause','speed','wave'].includes(cmd.type)){
  if(p.id!==s.players[0]?.id)return 'Only the host can control time';
  if(cmd.type==='pause')s.paused=!s.paused;if(cmd.type==='speed')s.speed=s.speed===1?2:1;
  if(cmd.type==='wave'&&s.tutorialStep!==undefined)return 'Finish or skip training before calling a swarm';
  if(cmd.type==='wave'&&canSpawnSwarm(s)&&s.enemies.length===0&&s.nextWave>s.time+3)s.nextWave=s.time+3;return null;
 }
 if(cmd.type==='moveArea')return moveArea(s,p,cmd);
 if(cmd.type==='clearTrees'){
  const {start,end}=cmd;
  if(!routeTile(start)||!routeTile(end))return 'Select an area inside the construction zone';
  const left=Math.min(start.x,end.x),right=Math.max(start.x,end.x);
  const top=Math.min(start.z,end.z),bottom=Math.max(start.z,end.z);
  const remaining=s.terrain.trees.filter(t=>t.x<left||t.x>right||t.z<top||t.z>bottom);
  const cleared=s.terrain.trees.length-remaining.length;
  if(!cleared)return 'No trees in that area';
  s.terrain.trees=remaining;harvestWood(s,cleared);return null;
 }
 if(cmd.type==='upgradeSelection'){
  const plan=planGroupUpgrade(s,cmd.ids);if(plan.error)return plan.error;
  for(const [r,n] of Object.entries(plan.cost))s.resources[r]-=n;
  for(const target of plan.targets)applyUpgrade(target);
  updatePower(s);return null;
 }
 if(cmd.type==='pasteSetup'){
  const plan=planPaste(s,cmd.layout,cmd.anchor,p.id);if(plan.error)return plan.error;
  for(const tile of plan.cells){
   const b=place(s,p,tile.type,tile.x,tile.z,tile.dir);
   if(LOGISTICS_TYPES.includes(tile.type))setProgram(b,tile.program);
   if(hasOutputBuffer(tile.type)){b.sendOutput=tile.sendOutput;b.receiveOutput=tile.receiveOutput;}
   if(tile.type==='storage')b.exportItem=tile.exportItem??null;
  }
  updatePower(s);return null;
 }
 if(cmd.type==='buildRow'){
  const dir=Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:0;
  const plan=cmd.building==='belt'&&cmd.points!==undefined?planBeltDrag(s,cmd.points,dir):planRoute(s,cmd.building,cmd.start,cmd.end,dir);if(plan.error)return plan.error;
  const existing=new Map(s.buildings.map(b=>[key(b.x,b.z),b])),fresh=plan.cells.filter(c=>!existing.has(key(c.x,c.z))),count=Math.max(0,fresh.length-inventoryCount(s,p.id,cmd.building));
  for(const[r,n]of Object.entries(TYPES[cmd.building].cost))if(s.resources[r]<n*count)return 'Not enough materials for the entire route';
  for(const c of plan.cells){const b=existing.get(key(c.x,c.z));if(b)b.dir=c.dir;else place(s,p,cmd.building,c.x,c.z,c.dir);}updatePower(s);return null;
 }
 const x=cmd.x,z=cmd.z;if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>BUILD_EDGE||Math.abs(z)>BUILD_EDGE)return 'Invalid tile';
 if(cmd.type==='build'){
  const error=canBuild(s,cmd.building,x,z,p.id);if(error)return error;
  const dir=Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:0;
  place(s,p,cmd.building,x,z,dir);
  updatePower(s);return null;
 }
 const b=s.buildings.find(b=>b.x===x&&b.z===z);
 if(cmd.type==='configureWarehouse'){
  if(b?.type!=='storage'||cmd.id!==b.id)return 'Select a warehouse';
  if(!warehouseExportValid(cmd.item))return 'Invalid warehouse material';
  b.exportItem=cmd.item;return null;
 }
 if(cmd.type==='configureOutput'){
  if(!b||cmd.id!==b.id||!hasOutputBuffer(b.type))return 'Select an item-producing machine';
  if(typeof cmd.send!=='boolean'||typeof cmd.receive!=='boolean')return 'Invalid output sharing settings';
  b.sendOutput=cmd.send;b.receiveOutput=cmd.receive;return null;
 }
 if(cmd.type==='configureLogistics'){
  if(!b||!LOGISTICS_TYPES.includes(b.type)||cmd.id!==undefined&&cmd.id!==b.id)return 'Select a transfer relay or dispatch hub to program';
  const error=programError(cmd.program);if(error)return error;
  setProgram(b,cmd.program);return null;
 }
 if(cmd.type==='rotate'){
  if(!b||!DIRECTIONAL.includes(b.type))return 'Select a conveyor, drill, smelter or assembler to rotate';
  b.dir=Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:(b.dir+1)%4;return null;
 }
 if(cmd.type==='upgrade'){
  if(!b)return 'Select a building to upgrade';const cost=upgradeCost(b);if(!cost)return b.type==='turret'?'Sentry turrets cannot be upgraded':'Building is fully upgraded (10/10)';
  for(const[r,n]of Object.entries(cost))if(s.resources[r]<n)return 'Not enough materials to upgrade';
  for(const[r,n]of Object.entries(cost))s.resources[r]-=n;
  applyUpgrade(b);updatePower(s);return null;
 }
 if(cmd.type==='demolish'){
  if(b&&s.time-(b.lastHit??-100)<5)return 'Recently attacked buildings cannot be moved or dismantled for five seconds';
  if(b?.type==='hq')return 'The lighthouse cannot be dismantled';
  if(b){
   refundDismantle(s,b);
   if(b.type==='storage')for(const item of RESOURCE_KEYS)s.resources[item]+=warehouseStock(b,item);
   s.buildings=s.buildings.filter(v=>v.id!==b.id);
  }
  else{const i=s.terrain.trees.findIndex(t=>t.x===x&&t.z===z);if(i>=0){s.terrain.trees.splice(i,1);harvestWood(s,1);}else{const ri=s.terrain.rocks.findIndex(t=>t.x===x&&t.z===z);if(ri>=0)s.terrain.rocks.splice(ri,1);else return 'Nothing to dismantle';}}
  updatePower(s);return null;
 }
 if(cmd.type==='repair'){
  if(!b)return 'Select a building';if(b.hp>=maxHp(b))return 'Building is at full health';
  const cost=Object.entries(repairCost(roundBonus(s.wave)));
  if(cost.some(([r,n])=>s.resources[r]<n))return 'Not enough materials';
  for(const[r,n]of cost)s.resources[r]-=n;
  b.hp=Math.min(maxHp(b),b.hp+300);return null;
 }return 'Unknown command';
}
export function updatePower(s,dt=0){
 const core=s.buildings.find(b=>b.type==='hq'),base=core?powerOutput(core):18;
 const generatorPower=s.buildings.reduce((power,b)=>{
  const generator=GENERATORS[b.type];return power+(generator&&s.resources[generator.fuel]>0?powerOutput(b):0);
 },0);
 const used=s.buildings.reduce((n,b)=>n+buildingPower(b),0),total=Math.round(base+generatorPower)+(roundBonus(s.wave)?.power??0);
 const reserved=s.resources.power??0;
 let available=total+(dt?reserved/dt:reserved>0?used:0),delivered=0;
 for(const b of s.buildings){
  const n=buildingPower(b);b.active=available+1e-8>=n;
  if(b.active){available-=n;delivered+=n;}
 }
 s.power={used,total};
 if(dt)s.resources.power=Math.max(0,Math.min(POWER_CAPACITY,reserved+(total-delivered)*dt));
}
function recordStockFlow(s,item,amount){
 const flow=s.stats.stockFlow??={};flow[item]=(flow[item]??0)+amount;
}
export function storageFull(s,b,item){
 if(!RESOURCE_KEYS.includes(item))return false;
 if(b?.type==='storage')return warehouseStock(b,item)>=warehouseCapacity(b);
 return b?.type==='hq'&&s.resources[item]>=storageCapacity(s);
}
function hasOutputSide(b){return b.type==='belt'||b.type==='storage'&&!!b.exportItem||Object.hasOwn(RECIPES,b.type);}
export function canAcceptItem(s,b,item,from,cycles=4){
 if(!b)return false;
 if(from&&hasOutputSide(b)){const[dx,dz]=DIRS[b.dir];if(from.x===b.x+dx&&from.z===b.z+dz)return false;}
 if(b.type==='hq'||b.type==='storage')return RESOURCE_KEYS.includes(item)&&!storageFull(s,b,item);
 if(b.type==='splitter'){const[dx,dz]=DIRS[(b.dir+2)%4];return !b.item&&(!from||from.x===b.x+dx&&from.z===b.z+dz);}
 if(b.type==='belt'){
  const last=b.beltQueue?.at(-1)??b;
  return !b.item||conveyorCount(b)<BELT_CAPACITY&&conveyorProgress(b,last,s.tick)>=BELT_SPACING;
 }
 const required=recipeInput(b,item);return required>0&&b.input.filter(v=>v===item).length<required*cycles;
}
function accept(s,b,item,from,cycles=4){
 if(!canAcceptItem(s,b,item,from,cycles))return false;
 if(b.type==='hq'){
  s.resources[item]++;recordStockFlow(s,item,1);
  if(item==='plate'||item==='gear')s.produced[item]++;
  return true;
 }
 if(b.type==='storage'){
  const stock=b.stock??={};
  stock[item]=warehouseStock(b,item)+1;
  return true;
 }
 if(b.type==='belt'||b.type==='splitter'){
  const itemSide=from?DIRS.findIndex(([dx,dz])=>b.x+dx===from.x&&b.z+dz===from.z):(b.dir+2)%4;
  const cargo={item,itemSide,itemTick:s.tick};
  if(b.type==='belt'){
   cargo.itemProgress=0;
   if(b.item)(b.beltQueue??=[]).push(cargo);
   else Object.assign(b,cargo);
  }else Object.assign(b,cargo);
  return true;
 }
 b.input.push(item);return true;
}
function advanceConveyor(b,tick){
 const distance=1/beltTravelTicks(b);
 if(b.itemProgress!==undefined)b.itemProgress=Math.min(1,b.itemProgress+distance);
 let leading=conveyorProgress(b,b,tick);
 for(const cargo of b.beltQueue??[]){
  cargo.itemProgress=Math.max(0,Math.min(leading-BELT_SPACING,cargo.itemProgress+distance));
  leading=cargo.itemProgress;
 }
}
function shiftConveyor(b){
 const next=b.beltQueue?.shift();
 if(next)Object.assign(b,next);
 else emptyConveyor(b);
}
function relayControls(s,grid,dt){
 const controls=new Map();
 for(const b of s.buildings.filter(v=>v.type==='inserter').sort((a,b)=>a.id-b.id)){
  b.cooldown=Math.max(0,b.cooldown-dt);if(!b.active)continue;
  const ports=logisticsPorts(b),[dx,dz]=DIRS[ports.input],source=grid.get(key(b.x+dx,b.z+dz));
  if(source?.type!=='belt'||controls.has(source.id))continue;controls.set(source.id,b);
  if(!source.item||b.cooldown>0)continue;
  const role=programRole(b),p=programFor(b);if(role==='forward'||!programMatches(b,source.item,grid))continue;
  const target=programTarget(b,role,grid),item=source.item;
  if(accept(s,target,item,b,role==='machine'?p.buffer:4)){shiftConveyor(source);b.cooldown=.6/productionSpeed(b);logTransfer(b,role,item,s);}
 }
 return controls;
}
function dispatch(s,b,item,grid,busy){
 const role=programRole(b),p=programFor(b),matches=programMatches(b,item,grid),planned=matches?role:'forward';
 const options=[planned];if(matches&&p.bypass)for(const fallback of ['forward','machine','return'])if(!options.includes(fallback)&&p[fallback]>0)options.push(fallback);
 for(const output of options){const target=programTarget(b,output,grid);if(!target||busy.has(target.id))continue;
  if(accept(s,target,item,b,output==='machine'?p.buffer:4)){b.item=null;logTransfer(b,output,item,s,!matches||output!==role);return true;}
 }return false;
}
export function logisticsStatus(s,b,grid){
 if(!b.active)return 'power';const p=programFor(b),ports=logisticsPorts(b);let source=b;
 if(b.type==='inserter'){const[dx,dz]=DIRS[ports.input];source=grid.get(key(b.x+dx,b.z+dz));if(source?.type!=='belt')return 'source';for(const[ox,oz]of DIRS){const other=grid.get(key(source.x+ox,source.z+oz));if(other?.type==='inserter'&&other.active&&other.id<b.id){const[ax,az]=DIRS[logisticsPorts(other).input];if(other.x+ax===source.x&&other.z+az===source.z)return 'claimed';}}}
 if(!source.item)return 'input';if(!programMatches(b,source.item,grid)){if(b.type==='inserter'){const[dx,dz]=DIRS[source.dir];return canAcceptItem(s,grid.get(key(source.x+dx,source.z+dz)),source.item,source)?'bypass':'output';}return canAcceptItem(s,programTarget(b,'forward',grid),source.item,b)?'bypass':'output';}
 let phase=Number.isInteger(b.phase)?((b.phase%3)+3)%3:0;for(let i=0;i<3&&p[PROGRAM_ROLES[phase]]===0;i++)phase=(phase+1)%3;const role=PROGRAM_ROLES[phase];
 if(b.type==='inserter'&&role==='forward'){const[dx,dz]=DIRS[source.dir];return canAcceptItem(s,grid.get(key(source.x+dx,source.z+dz)),source.item,source)?'running':'output';}
 if(canAcceptItem(s,programTarget(b,role,grid),source.item,b,role==='machine'?p.buffer:4))return 'running';
 if(p.bypass){if(b.type==='inserter'&&p.forward>0){const[dx,dz]=DIRS[source.dir];if(canAcceptItem(s,grid.get(key(source.x+dx,source.z+dz)),source.item,source))return 'bypass';}else if(b.type==='splitter'&&PROGRAM_ROLES.some(r=>p[r]>0&&canAcceptItem(s,programTarget(b,r,grid),source.item,b,r==='machine'?p.buffer:4)))return 'bypass';}
 return 'output';
}
function spawnWave(s){
 const forecast=waveForecast(s);s.wave++;s.waveSide=forecast.side;const count=forecast.count;
 const random=rng((s.swarmSeed??s.seed)^Math.imul(s.wave,0x5bd1e995));
 const coreHunters=s.wave>=4?Math.round(count*.05):0;
 const mutationNames=['armored','frenzied','swift'];
 const waveMutation=s.wave>=4?mutationNames[Math.floor(random()*mutationNames.length)]:null;
 for(let i=0;i<count;i++){
  const side=forecast.side,spread=Math.min(70,23+s.wave*1.8),t=(random()*2-1)*spread;
  let x=side===0?-SWARM_SPAWN_EDGE:side===2?SWARM_SPAWN_EDGE:t;
  let z=side===1?-SWARM_SPAWN_EDGE:side===3?SWARM_SPAWN_EDGE:t;
  if(side>=4){
   const [sx,sz]=[[1,-1],[1,1],[-1,1],[-1,-1]][side-4],inset=2+random()*25;
   x=sx*(SWARM_SPAWN_EDGE-(i%2?inset:0));
   z=sz*(SWARM_SPAWN_EDGE-(i%2?0:inset));
  }
  const coreHunter=i<coreHunters;
  const mutation=!coreHunter&&waveMutation&&random()<.22?waveMutation:null;
  const kind=coreHunter?'drowned':waveKind(s.wave,i,count),species=HOSTILES[kind];
  const hp=Math.round(species.health*(35+s.wave*5+.09*s.wave**2)*forecast.health*(mutation==='armored'?1.5:1));
  const damage=forecast.damage*(mutation==='frenzied'?1.35:1),speed=(1.0+(i%4)*.12+s.wave*.015)*(mutation==='swift'?1.4:1);
  s.enemies.push({id:s.nextId++,kind,x,z,hp,maxHp:hp,damage:damage*species.damage,speed:speed*species.speed,cooldown:0,brute:kind==='guard',coreHunter:coreHunter||kind==='walker',mutation});
 }s.nextWave=s.time+(DIFFICULTIES[s.difficulty]||DIFFICULTIES.standard).interval;updatePower(s);
 event(s,`Swarm ${s.wave} · ${count} hostiles${coreHunters?' · '+coreHunters+' beacon hunters':''}${waveMutation?' · '+waveMutation+' mutation':''} · ${forecast.bonus.label}`);
}
function event(s,text){s.events.push({id:s.nextId++,text,time:s.time});if(s.events.length>6)s.events.shift();}
const hunterTerrain=new WeakMap();
function hunterForest(s){
 const blockers=s.buildings.filter(b=>!['hq','belt','inserter','splitter','wall'].includes(b.type));
 const key=blockers.map(b=>b.x+','+b.z).join(';')+':'+s.terrain.trees.length;
 const cached=hunterTerrain.get(s.terrain);
 if(cached?.key===key)return cached.forest;
 const forest=woodland({trees:[...s.terrain.trees,...blockers]});
 hunterTerrain.set(s.terrain,{key,forest});return forest;
}
export function step(s,dt=STEP){
 if(s.paused||s.status!=='playing')return;s.tick++;s.time+=dt;s.shots=s.shots.filter(v=>s.time-v.time<.25);
 const hq=s.buildings.find(b=>b.type==='hq');
 turnLighthouse(hq,dt);
 const beam=lighthouseBeam(hq),lit=new Set(s.enemies.filter(e=>isInLighthouseBeam(beam,e)));
 for(const e of s.enemies)exposeHostile(e,lit.has(e),dt);
 const mistSources=s.enemies.filter(e=>e.hp>0&&hostileKind(e)==='spitter'&&!lit.has(e));
 const obscured=new Set(s.enemies.filter(e=>!lit.has(e)&&mistSources.some(other=>(other.x-e.x)**2+(other.z-e.z)**2<9)));
 const bonus=roundBonus(s.wave),wasAttacking=s.enemies.length>0;
 updatePower(s,dt);
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
 // Snapshot transport first: a newly received item cannot travel multiple tiles in one tick.
 const moving=[],busy=new Set();
 for(const b of s.buildings){
  if(!b.item)continue;
  if(b.type==='belt'){advanceConveyor(b,s.tick);if(conveyorProgress(b,b,s.tick)>=1-1e-9)moving.push({b,item:b.item,itemTick:b.itemTick});}
  else if(b.type==='splitter'){busy.add(b.id);if(conveyorProgress(b,b,s.tick)>=1)moving.push({b,item:b.item,itemTick:b.itemTick});}
 }
 const controls=relayControls(s,grid,dt);
 for(const{b,item,itemTick}of moving){
  if(b.item!==item||b.itemTick!==itemTick)continue;
  if(b.type==='splitter'){dispatch(s,b,item,grid,busy);continue;}
  const relay=controls.get(b.id),matches=relay&&programMatches(relay,item,grid),role=relay&&programRole(relay);
  if(relay&&matches&&role!=='forward'&&(!programFor(relay).bypass||programFor(relay).forward===0))continue;
  const[dx,dz]=DIRS[b.dir],target=grid.get(key(b.x+dx,b.z+dz));
  if(target&&!busy.has(target.id)&&accept(s,target,item,b)){shiftConveyor(b);if(relay)logTransfer(relay,'forward',item,s,!matches||role!=='forward');}
 }
 // Advance only output that was already queued before this pass, one machine per tick.
 for(const b of s.buildings.filter(b=>b.active&&b.item&&hasOutputBuffer(b.type))){
  const [dx,dz]=DIRS[b.dir],out=grid.get(key(b.x+dx,b.z+dz));
  if(canShareOutput(b,out))enqueueOutput(out,b.item);
  else if(!accept(s,out,b.item,b))continue;
  b.item=b.outputBuffer?.shift()??null;
 }
 for(const b of s.buildings){
  if(b.type==='storage'&&b.exportItem&&s.tick%8===b.id%8){
   const [dx,dz]=DIRS[b.dir],out=grid.get(key(b.x+dx,b.z+dz));
   const item=b.exportItem==='recipe'?
    Object.keys(RECIPES[out?.type]?.input??{}).find(item=>warehouseStock(b,item)>0&&canAcceptItem(s,out,item,b,1)):b.exportItem;
   if(item&&warehouseStock(b,item)>0&&accept(s,out,item,b,b.exportItem==='recipe'?1:4)){
    if(--b.stock[item]===0)delete b.stock[item];
   }
  }
  const generator=GENERATORS[b.type];
  if(generator&&s.resources[generator.fuel]>0){b.progress+=dt*(1+((b.level||1)-1)*.12);if(b.progress+1e-9>=generator.seconds){b.progress=Math.max(0,b.progress-generator.seconds);recordStockFlow(s,generator.fuel,-1);if(--s.resources[generator.fuel]===0)updatePower(s);}}
  if(!b.active)continue;
  const extract=({drill:'ore',copperDrill:'copperOre',coalMine:'coal'})[b.type];
  if(extract||RECIPES[b.type]){
   if(outputCount(b)>=OUTPUT_CAPACITY)continue;
   const recipe=productionRecipe(b);
   if(!extract&&!recipe)continue;
   const seconds=recipe?.seconds??(b.type==='drill'?1.6:b.type==='coalMine'?2.8:2);
   const item=extract||recipe.output;
   const yieldUnits=item==='plate'?plateYieldUnits(b)+(b.plateCredit??0):4;
   const batch=Math.floor(yieldUnits/4);
   if(outputCount(b)+batch>OUTPUT_CAPACITY)continue;
   b.progress+=dt*productionSpeed(b,bonus,s.difficulty);
   if(b.progress+1e-9>=seconds){
    b.progress=Math.max(0,b.progress-seconds);
    if(recipe)for(const[r,n]of Object.entries(recipe.input))for(let i=0;i<n;i++)b.input.splice(b.input.indexOf(r),1);
    for(let i=0;i<batch;i++)enqueueOutput(b,item);
    if(item==='plate')b.plateCredit=yieldUnits%4;
    s.stats.totals[item]=(s.stats.totals[item]||0)+batch;
   }
  }
  if(b.type==='sawmill'){
   b.progress+=dt*sawmillRate(s,b);
   if(b.progress+1e-9>=3){b.progress=Math.max(0,b.progress-3);const room=Math.max(0,storageCapacity(s)-s.resources.wood);const made=Math.min(3,room);s.resources.wood+=made;recordStockFlow(s,'wood',made);s.stats.totals.wood=(s.stats.totals.wood||0)+made;}
  }
  if(TURRETS.includes(b.type)){
   const stats=turretStats(b);b.cooldown-=dt;const consumesAmmo=usesAmmo(b.type);if(consumesAmmo&&b.ammo<=0&&s.resources.gear>0){s.resources.gear--;recordStockFlow(s,'gear',-1);b.ammo=turretReload(b,bonus);}
   if(b.cooldown<=0&&(!consumesAmmo||b.ammo>0)){
    let target=null,closest=(stats.range*LIT_RANGE_MULTIPLIER)**2;
    for(const e of s.enemies){
     const dx=e.x-b.x,dz=e.z-b.z,d=dx*dx+dz*dz;
     const mist=obscured.has(e);
     const reach=stats.range*(lit.has(e)?LIT_RANGE_MULTIPLIER:mist?.82:1);
     if(e.hp>0&&e.training!=='exposure'&&d<closest&&d<reach**2){closest=d;target=e;}
    }
    if(target){
     target.hp-=hostileDamage(target,stats.damage);target.lastHit=s.time;
     if(stats.radius)for(const e of s.enemies)if(e!==target&&e.hp>0&&dist(e,target)<=stats.radius)e.hp-=hostileDamage(e,stats.damage*.65);
     if(consumesAmmo)b.ammo--;b.cooldown=stats.interval;b.aim=Math.atan2(target.x-b.x,target.z-b.z);
     s.shots.push({x:b.x,z:b.z,tx:target.x,tz:target.z,radius:stats.radius,time:s.time});
    }}
  }
 }
 if(!hq){s.status='defeat';return;}
 const forest=s.enemies.length?woodland(s.terrain):null,enemyDestination={x:0,z:0};
 const coreRoutes=s.enemies.some(e=>e.coreHunter)?hunterForest(s):null;
 const industry=s.enemies.length?s.buildings.filter(b=>hasOutputBuffer(b.type)||b.type==='sawmill'||Object.hasOwn(GENERATORS,b.type)):[];
 for(const e of s.enemies){
  if(e.hp<=0||e.training)continue;e.cooldown-=dt;
  let target=hq,closest=14*14;
  if(!e.coreHunter)for(const b of industry){
   if(b.hp<=0)continue;
   const distance=(e.x-b.x)**2+(e.z-b.z)**2;
   if(distance<closest){target=b;closest=distance;}
  }
  target=hostileDestination(e,hq,beam,target,enemyDestination);
  const kind=hostileKind(e),attackRange=HOSTILES[kind].range;
  const d=dist(e,target),move=e.speed*(e.brute&&!e.kind?.7:1)*(d>42&&!e.lastHit?1.85:1)*dt;
  if(kind==='spitter'&&d<=attackRange&&e.cooldown<=0&&target.hp>0){
   target.hp-=10*(e.damage||1);target.lastHit=s.time;e.cooldown=2.4;
   s.shots.push({x:e.x,z:e.z,tx:target.x,tz:target.z,time:s.time,hostile:true});
  }
  if(kind==='spitter'&&d<=attackRange)continue;
  const {x:nx,z:nz}=walkAroundTrees(e.coreHunter?coreRoutes:forest,e,target,move,enemyDestination);
  let obstacle=grid.get(key(Math.round(nx),Math.round(nz)));if(['belt','inserter','splitter'].includes(obstacle?.type))obstacle=null;
  if(obstacle||d<attackRange){
   const victim=obstacle||target;
   if(e.cooldown<=0&&(!e.coreHunter||victim.type==='hq'||victim.type==='wall')){
    const armor=victim.type==='wall'?(bonus?.wallDamage??1):1;
    victim.hp-=(e.coreHunter?28:e.brute?24:10)*(e.damage||1)*armor;victim.lastHit=s.time;e.cooldown=.8;
   }
  }
  else{e.x=nx;e.z=nz;}
 }
 if(s.enemies.some(e=>e.hp<=0&&e.training==='combat'))s.tutorialDefenseTrained=true;
 const dead=s.enemies.filter(e=>e.hp<=0&&!e.training).length;s.totalKills+=dead;s.enemies=s.enemies.filter(e=>e.hp>0);
 if(s.tick%20===0){s.stats.history.push({time:s.time,totals:{...s.stats.totals},stockFlow:{...s.stats.stockFlow}});if(s.stats.history.length>61)s.stats.history.shift();}
 const destroyed=s.buildings.filter(b=>b.hp<=0);if(destroyed.length){s.buildings=s.buildings.filter(b=>b.hp>0);updatePower(s);}
 if(hq.hp<=0){s.status='defeat';event(s,'The lighthouse has fallen');}
 else if(s.wave>=FINAL_WAVE&&!s.enemies.length&&!s.survived){
  s.survived=true;s.status='victory';event(s,'The colony survived 25 swarms.');
 }
 else if(wasAttacking&&!s.enemies.length){
  s.nextWave=s.time+(DIFFICULTIES[s.difficulty]||DIFFICULTIES.standard).interval;
 }
 else if(s.tutorialStep!==undefined)advanceTutorial(s);
 else if(s.time>=s.nextWave&&s.enemies.length===0&&canSpawnSwarm(s))spawnWave(s);
}
export function planMove(s,ids,dx,dz){
 if(!Array.isArray(ids)||ids.length>s.buildings.length||!ids.length||ids.some(id=>!Number.isInteger(id))||!Number.isInteger(dx)||!Number.isInteger(dz))return{error:'Invalid selection or move offset',valid:[],invalid:[]};
 const selected=s.buildings.filter(b=>ids.includes(b.id));if(s.enemies.length&&selected.some(b=>b.type==='hq'))return{error:'The lighthouse cannot be relocated during an active swarm',valid:[],invalid:[]};if(selected.some(b=>s.time-(b.lastHit??-100)<5))return{error:'Recently attacked buildings cannot be relocated for five seconds',valid:[],invalid:[]};if(selected.length!==new Set(ids).size)return{error:'Selection changed. Select the buildings again.',valid:[],invalid:[]};
 const stationary={...s,buildings:s.buildings.filter(b=>!ids.includes(b.id))},valid=[],invalid=[];
 for(const b of selected){let reason;if(b.type==='hq'){reason=Math.abs(b.x+dx)>BUILD_EDGE||Math.abs(b.z+dz)>BUILD_EDGE?'Core is outside the construction zone':stationary.buildings.some(v=>v.x===b.x+dx&&v.z===b.z+dz)?'Core destination is occupied':s.terrain.trees.some(v=>v.x===b.x+dx&&v.z===b.z+dz)||s.terrain.rocks.some(v=>v.x===b.x+dx&&v.z===b.z+dz)?'Clear the core destination first':null;}else reason=placementError(stationary,b.type,b.x+dx,b.z+dz);
  (reason?invalid:valid).push({id:b.id,type:b.type,x:b.x+dx,z:b.z+dz,reason});
 }return{error:null,valid,invalid};
}
function moveArea(s,p,cmd){
 const plan=planMove(s,cmd.ids,cmd.dx,cmd.dz);if(plan.error)return plan.error;
 if(plan.invalid.some(v=>v.type==='hq'))return 'The lighthouse cannot be removed. Choose a valid destination for it.';
 if(plan.invalid.length&&!cmd.override)return plan.invalid.length+' buildings cannot be placed here. Hold Shift to pack invalid buildings into inventory.';
 if(!plan.valid.length&&!cmd.override)return 'No valid buildings to move';
 for(const target of plan.valid){const b=s.buildings.find(b=>b.id===target.id);b.x=target.x;b.z=target.z;}
 if(cmd.override)for(const target of plan.invalid){const b=s.buildings.find(b=>b.id===target.id);packBuilding(p,b);s.buildings=s.buildings.filter(v=>v.id!==b.id);}
 updatePower(s);return null;
}
export function snapshot(s){return JSON.parse(JSON.stringify(s));}
