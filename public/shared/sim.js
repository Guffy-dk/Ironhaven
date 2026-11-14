// Pure, deterministic simulation. The exact same module runs in Node and solo browsers.
export const SIZE = 56, STEP = .05, MAX_PLAYERS = 4, FINAL_WAVE = 8;
export const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
export const DIFFICULTIES={
 relaxed:{name:'Relaxed',count:.72,health:.85,damage:.75,prep:140,interval:115},
 standard:{name:'Standard',count:1,health:1,damage:1,prep:100,interval:95},
 veteran:{name:'Veteran',count:1.22,health:1.12,damage:1.15,prep:100,interval:95}
};
export function waveForecast(s,wave=s.wave+1){const d=DIFFICULTIES[s.difficulty]||DIFFICULTIES.standard,guests=Math.max(0,s.players.length-1),count=Math.min(480,Math.round(Math.min(336,12+wave*wave*4)*d.count*(1+guests*.1)));return{wave,count,sides:[wave%4,(wave+1)%4],health:d.health,damage:d.damage};}
export const TYPES = {
 hq:{name:'Command core',hp:2400,power:0,cost:{},desc:'Keep the reactor alive through eight swarms. Conveyors deliver plates and gears into the colony stockpile.'},
 belt:{name:'Conveyor',hp:65,power:0,cost:{wood:1},desc:'Carries items toward the gold arrow. Accepts side inputs and connects around bends. R rotates an existing belt under your pointer.'},
 drill:{name:'Iron drill',hp:200,power:3,cost:{wood:15,plate:12},desc:'Place on blue iron deposits. Mines one ore every two seconds. The gold OUT port is its delivery side.'},
 smelter:{name:'Smelter',hp:250,power:3,cost:{wood:12,plate:15},desc:'Feed ore into any cyan IN port. Produces one iron plate every two seconds and sends it through the gold OUT port.'},
 assembler:{name:'Assembler',hp:220,power:4,cost:{wood:15,plate:25},desc:'Feed plates into cyan IN ports. Converts two plates into one gear. The gold OUT port delivers the result.'},
 sawmill:{name:'Sawmill',hp:180,power:2,cost:{wood:20,plate:8},desc:'Requires trees within five tiles. Delivers three wood directly to the colony every three seconds.'},
 generator:{name:'Generator',hp:300,power:0,cost:{wood:25,plate:20},desc:'Consumes one wood every twelve seconds to add eighteen power to the colony network.'},
 turret:{name:'Turret',hp:350,power:2,cost:{wood:15,plate:22,gear:3},desc:'Automatically defends the colony. One gear loads twelve shots. Select a turret to upgrade its damage, range, fire rate and health.'},
 wall:{name:'Barricade',hp:700,power:0,cost:{wood:5,plate:2},desc:'Blocks the swarm and buys time for your turrets. Dismantle to move it, or repair damaged sections.'},
 repair:{name:'Repair',cost:{wood:4,plate:2},desc:'Restores up to 300 health. Damaged buildings show a health bar until fully repaired.'},
 demolish:{name:'Dismantle',cost:{},desc:'Packs a building into your personal inventory. Damage, upgrades and ammo are preserved. Clear a tree to collect eight wood.'}
};
Object.assign(TYPES,{
 inserter:{name:'Transfer relay',hp:140,power:1,cost:{wood:2,plate:5,gear:1},desc:'A programmable cargo capsule. Place between a conveyor behind it and a machine ahead. Default: one item into the machine, one left on the belt. The right-side port feeds a separate return line.'},
 splitter:{name:'Dispatch hub',hp:160,power:0,cost:{wood:2,plate:6,gear:2},desc:'Place on the main conveyor. Input at the rear, Forward ahead, Machine to the left and Return to the right. Program exact batches; default 1 Machine / 1 Forward / 0 Return.'},
 copperDrill:{name:'Copper drill',hp:220,power:3,cost:{wood:15,plate:18},desc:'Extracts copper ore from orange deposits. Route it through a copper smelter to supply electronics.'},
 copperSmelter:{name:'Copper smelter',hp:260,power:3,cost:{wood:12,plate:20},desc:'Smelts copper ore into copper. Copper is required by circuit assemblers.'},
 foundry:{name:'Steel foundry',hp:300,power:4,cost:{plate:30,gear:5},desc:'Converts three iron plates into one steel. Steel reinforces advanced upgrades and evacuation hardware.'},
 circuitLab:{name:'Circuit assembler',hp:240,power:4,cost:{plate:25,gear:5},desc:'Combines two copper and one plate into a circuit. Circuits unlock advanced upgrades and ship components.'},
 componentFactory:{name:'Component factory',hp:320,power:6,cost:{plate:35,steel:10,circuit:8},desc:'Combines two steel, two circuits and a gear into a ship component. Components power the evacuation objective.'},
 storage:{name:'Warehouse',hp:600,power:0,cost:{wood:25,plate:30},desc:'Adds 300 storage per material. Upgrades expand capacity further. Conveyors can deliver any processed material here.'},
 launchpad:{name:'Evacuation pad',hp:1200,power:6,cost:{plate:80,steel:20,circuit:15,gear:10},desc:'After eight swarms, spend 30 components, 60 steel and 40 circuits to begin the final evacuation defense. Keep the core and pad alive.'}
});
export const RESOURCE_KEYS=['wood','plate','gear','copper','steel','circuit','module'];
export const MAX_UPGRADES=10;
export const SAVE_SCHEMA=5;
export const LOGISTICS_TYPES=['inserter','splitter'];
export const PROGRAM_ROLES=['machine','forward','return'];
export const ITEM_KEYS=['ore','copperOre',...RESOURCE_KEYS];
export const DEFAULT_PROGRAM={machine:1,forward:1,return:0,bypass:true,filter:'auto',buffer:2};
export function programFor(b){return b.program||DEFAULT_PROGRAM;}
export function logisticsPorts(b){const m=b.type==='splitter'?(b.dir+3)%4:b.dir;return{input:(b.dir+2)%4,machine:m,forward:b.dir,return:(b.dir+1)%4};}
function programRole(b){const p=programFor(b);let phase=Number.isInteger(b.phase)?((b.phase%3)+3)%3:0;for(let i=0;i<3;i++){if(p[PROGRAM_ROLES[phase]]>0){b.phase=phase;if(!(b.remaining>0))b.remaining=p[PROGRAM_ROLES[phase]];return PROGRAM_ROLES[phase];}phase=(phase+1)%3;}return 'forward';}
function advanceProgram(b,role){
 b.shipments||={machine:0,forward:0,return:0,bypassed:0};b.shipments[role]=(b.shipments[role]||0)+1;
 if(--b.remaining<=0){b.phase=(b.phase+1)%3;b.remaining=0;programRole(b);}
}
function logTransfer(b,role,item,s,bypassed=false){b.lastTransfer={role,item,time:s.time};if(bypassed){b.shipments||={machine:0,forward:0,return:0,bypassed:0};b.shipments.bypassed++;}else advanceProgram(b,role);}
function programMatches(b,item,grid){const p=programFor(b);if(p.filter==='any')return true;if(p.filter!=='auto')return item===p.filter;const d=logisticsPorts(b).machine,[dx,dz]=DIRS[d],target=grid.get(key(b.x+dx,b.z+dz));return RECIPES[target?.type]?!!RECIPES[target.type].input[item]:true;}
function programTarget(b,role,grid){const d=logisticsPorts(b)[role],[dx,dz]=DIRS[d];return grid.get(key(b.x+dx,b.z+dz));}

export const RECIPES={
 smelter:{input:{ore:1},output:'plate',seconds:2},assembler:{input:{plate:2},output:'gear',seconds:3},
 copperSmelter:{input:{copperOre:1},output:'copper',seconds:2},foundry:{input:{plate:3},output:'steel',seconds:3.5},
 circuitLab:{input:{copper:2,plate:1},output:'circuit',seconds:4},componentFactory:{input:{steel:2,circuit:2,gear:1},output:'module',seconds:5}
};
export const DIRECTIONAL = ['inserter','splitter','belt','drill','copperDrill',...Object.keys(RECIPES)];
export const TURRET_LEVELS = [
 {name:'Mk I',hp:350,damage:28,range:10,interval:.38,cost:null},
 {name:'Mk II',hp:500,damage:40,range:12,interval:.30,cost:{plate:35,gear:8}},
 {name:'Mk III',hp:700,damage:56,range:14,interval:.23,cost:{plate:60,gear:16}}
];
const ROMAN=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
for(let i=3;i<=MAX_UPGRADES;i++)TURRET_LEVELS.push({name:'Mk '+ROMAN[i],hp:700+(i-2)*180,damage:56+(i-2)*8,range:14+(i-2)*.5,interval:.23/(1+(i-2)*.06),cost:{plate:Math.ceil(60*1.45**(i-2)),gear:Math.ceil(16*1.4**(i-2))}});
export const turretStats = b => TURRET_LEVELS[Math.max(0,Math.min(MAX_UPGRADES,(b.level||1)-1))];
export const maxHp = b => b.type==='turret' ? turretStats(b).hp : Math.round(TYPES[b.type].hp*(1+((b.level||1)-1)*.25));
export const productionSpeed = b => 1+((b.level||1)-1)*.18;
export const buildingPower = b => Math.ceil(TYPES[b.type].power*(1+((b.level||1)-1)*(b.type==='turret'?.2:.1)));
export const storageCapacity = s => 300+s.buildings.reduce((n,b)=>n+(b.type==='storage'?Math.round(300*(1+((b.level||1)-1)*.35)):b.type==='hq'?((b.level||1)-1)*50:0),0);
export const LAUNCH_COST={module:30,steel:60,circuit:40};
export function upgradeCost(b){
 const level=b.level||1;if(level>MAX_UPGRADES)return null;
 const cost=b.type==='turret'?{...TURRET_LEVELS[level].cost}:Object.fromEntries(Object.entries(Object.keys(TYPES[b.type].cost).length?TYPES[b.type].cost:{plate:35,gear:5}).map(([r,n])=>[r,Math.ceil(n*.65*1.45**level)]));
 if(b.type!=='turret'){cost.plate=(cost.plate||0)+Math.ceil(5*level**1.35);cost.gear=(cost.gear||0)+Math.ceil(level**1.25);}
 if(level>=3){cost.steel=(cost.steel||0)+(level-2)*3;cost.circuit=(cost.circuit||0)+(level-2)*2;}return cost;
}
export const inventoryCount = (s,id,type) => s.players.find(p=>p.id===id)?.inventory?.[type]?.length||0;
export function migrateGame(s){
 if(!s||![1,2,3,4,5].includes(s.version)||!Array.isArray(s.buildings)||!s.terrain||!Array.isArray(s.players))throw Error('Unsupported or damaged save file.');
 if(s.version<3&&s.status==='victory')s.status='playing';
 s.version=SAVE_SCHEMA;if(!Object.hasOwn(DIFFICULTIES,s.difficulty))s.difficulty='standard';s.stats||={totals:{},history:[{time:s.time,totals:{}}]};s.stats.totals||={};s.stats.history||=[{time:s.time,totals:{}}];s.evacuation||=null;s.terrain.copper||=makeTerrain(s.seed).copper;for(const r of RESOURCE_KEYS)s.resources[r]??=0;for(const p of s.players){p.inventory||={};p.input={x:0,z:0};p.sprinting=false;}
 for(const b of s.buildings){b.level||=1;if(LOGISTICS_TYPES.includes(b.type)){b.program||={...DEFAULT_PROGRAM};programRole(b);}}
 return s;
}
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function rng(seed){let n=seed|0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
export const key=(x,z)=>`${x},${z}`;
export function makeTerrain(seed=2026){
 const rand=rng(seed),trees=[],ore=[],rocks=[],copper=[];
 for(let x=-27;x<=27;x++)for(let z=-27;z<=27;z++){
  const d=Math.hypot(x,z),v=rand();
  if(d>11&&v<.19&&Math.sin(x*.24)+Math.cos(z*.22)>.1)trees.push({x,z,h:.8+rand()*.8});
  else if(d>13&&v>.966)rocks.push({x,z,h:.3+rand()*.6});
 }
 for(const [cx,cz] of [[-8,-3],[-10,9],[10,-9],[15,7],[-19,-13]])for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)if(x*x+z*z<7)ore.push({x:cx+x,z:cz+z});
 for(const[cx,cz]of [[8,-4],[17,12],[-18,3]])for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)if(x*x+z*z<6)copper.push({x:cx+x,z:cz+z});
 return{trees,ore,rocks,copper};
}
function building(s,type,x,z,dir=0){const b={id:s.nextId++,type,x,z,dir,hp:TYPES[type].hp,progress:0,input:[],item:null,ammo:0,cooldown:0,active:true,level:1};if(LOGISTICS_TYPES.includes(type)){b.program={...DEFAULT_PROGRAM};programRole(b);}s.buildings.push(b);return b;}
export function createGame(seed=2026,{difficulty='standard'}={}){
 if(!Object.hasOwn(DIFFICULTIES,difficulty))difficulty='standard';
 const s={version:SAVE_SCHEMA,difficulty,stats:{totals:{},history:[{time:0,totals:{}}]},seed,time:0,tick:0,nextId:1,resources:{wood:165,plate:150,gear:20,copper:0,steel:0,circuit:0,module:0},buildings:[],players:[],enemies:[],shots:[],wave:0,nextWave:DIFFICULTIES[difficulty].prep,totalKills:0,produced:{plate:0,gear:0},power:{used:0,total:18},status:'playing',paused:false,speed:1,terrain:makeTerrain(seed),events:[],evacuation:null};
 building(s,'hq',0,0);
 // Two working starter chains: ore → plate → shared storage / gears.
 for(const z of [-3,3]){
  if(z===3)for(let x=-10;x<=-6;x++)if(!s.terrain.ore.some(o=>o.x===x&&o.z===z))s.terrain.ore.push({x,z});
  building(s,'drill',-8,z);building(s,'belt',-7,z);building(s,'smelter',-6,z);
  for(let x=-5;x<=-2;x++)building(s,'belt',x,z);
  if(z===-3){building(s,'belt',-1,z,1);building(s,'belt',-1,-2,1);building(s,'belt',-1,-1,0);building(s,'belt',0,-1,1);}
  else{building(s,'assembler',-1,z,3);building(s,'belt',-1,2,3);building(s,'belt',-1,1,0);building(s,'belt',0,1,3);}
 }
 building(s,'generator',3,-2);building(s,'sawmill',7,6); 
 // A small grove makes the starter sawmill productive.
 for(const [x,z] of [[9,7],[8,9],[10,8],[9,5],[11,6]])s.terrain.trees.push({x,z,h:1.3});
 for(const [x,z] of [[-5,-8],[5,-8],[6,7],[-5,7]]){const b=building(s,'turret',x,z);b.ammo=24;}
 for(let x=-6;x<=6;x++){if(Math.abs(x)<2)continue;building(s,'wall',x,-10);building(s,'wall',x,10);}
 for(let z=-9;z<=9;z++){if(Math.abs(z)<3)continue;building(s,'wall',-11,z);building(s,'wall',11,z);}
 updatePower(s);return s;
}
export function addPlayer(s,name='Engineer'){
 if(s.players.length>=MAX_PLAYERS)return null;
 const id=s.nextId++,p={id,name:(typeof name==='string'?name.trim().slice(0,20):'')||'Engineer',x:2+s.players.length,z:2,color:s.players.length,hp:100,inventory:{},input:{x:0,z:0},cooldown:0,respawn:0};s.players.push(p);return p;
}
export function removePlayer(s,id){const leaving=s.players.find(p=>p.id===id),recipient=s.players.find(p=>p.id!==id);if(leaving?.inventory&&recipient){recipient.inventory||={};for(const[type,items]of Object.entries(leaving.inventory))(recipient.inventory[type]||=[]).push(...items);}s.players=s.players.filter(p=>p.id!==id);}
function placementError(s,type,x,z,ignoreBelts=false){
 const def=TYPES[type];if(!Object.hasOwn(TYPES,type)||!def||type==='hq'||['repair','demolish'].includes(type))return 'Invalid building';
 if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>26||Math.abs(z)>26)return 'Outside the construction zone';
 const occupied=s.buildings.find(b=>b.x===x&&b.z===z);
 if(occupied&&!(ignoreBelts&&occupied.type==='belt'))return 'Tile is occupied';
 if(s.terrain.trees.some(b=>b.x===x&&b.z===z)||s.terrain.rocks.some(b=>b.x===x&&b.z===z))return 'Clear the tile with Dismantle first';
 if(type==='drill'&&!s.terrain.ore.some(b=>b.x===x&&b.z===z))return 'Drills must be placed on iron deposits';
 if(type==='copperDrill'&&!s.terrain.copper?.some(b=>b.x===x&&b.z===z))return 'Copper drills must be placed on copper deposits';
 if(type==='sawmill'&&!s.terrain.trees.some(b=>Math.hypot(b.x-x,b.z-z)<5))return 'A sawmill needs trees within five tiles';
 return null;
}
export function canBuild(s,type,x,z,playerId){
 const error=placementError(s,type,x,z);if(error)return error;
 if(s.buildings.length>=700)return 'Building limit reached (700)';
 if(inventoryCount(s,playerId,type)>0)return null;
 for(const[r,n]of Object.entries(TYPES[type].cost))if(s.resources[r]<n)return 'Not enough materials';
 return null;
}
export function outputPointsAt(b,x,z){
 if(LOGISTICS_TYPES.includes(b.type)){const p=programFor(b),ports=logisticsPorts(b);return PROGRAM_ROLES.some(role=>p[role]>0&&(b.type==='splitter'||role!=='forward')&&b.x+DIRS[ports[role]][0]===x&&b.z+DIRS[ports[role]][1]===z);}
 const [dx,dz]=DIRS[b.dir||0];return DIRECTIONAL.includes(b.type)&&b.x+dx===x&&b.z+dz===z;
}
export function beltInputs(b,grid){
 const inputs=[];for(let d=0;d<4;d++){if(d===b.dir)continue;const[dx,dz]=DIRS[d],other=grid.get(key(b.x+dx,b.z+dz));if(other&&outputPointsAt(other,b.x,b.z))inputs.push(d);}
 return inputs.length?inputs:[(b.dir+2)%4];
}
function endpointDirection(s,cell,fallback,previous){
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
 const existing=grid.get(key(cell.x,cell.z));if(existing?.type==='belt'&&(!previous||!outputPointsAt(existing,previous.x,previous.z)))return existing.dir;
 const options=[fallback,(fallback+1)%4,(fallback+3)%4,(fallback+2)%4];
 for(const d of options){const[dx,dz]=DIRS[d],target=grid.get(key(cell.x+dx,cell.z+dz));if(!target||target===previous)continue;
  if(target.type==='splitter'&&target.dir===d||['hq','storage','launchpad'].includes(target.type)||Object.hasOwn(RECIPES,target.type)&&target.dir!==(d+2)%4||target.type==='belt'&&target.dir!==(d+2)%4)return d;
 }return fallback;
}
// An orthogonal A* route with turn penalties; avoids obstacles and fills every tile.
export function planRoute(s,type,start,end,dir=0){
 if(!['belt','wall'].includes(type))return{error:'Rows are available for conveyors and barricades',cells:[]};
 if(!start||!end||![start.x,start.z,end.x,end.z].every(Number.isInteger)||Math.abs(start.x)>26||Math.abs(start.z)>26||Math.abs(end.x)>26||Math.abs(end.z)>26)return{error:'Route is outside the construction zone',cells:[]};
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b])),blocked=new Set([...s.terrain.trees,...s.terrain.rocks].map(v=>key(v.x,v.z)));
 const first=grid.get(key(start.x,start.z)),last=grid.get(key(end.x,end.z));
 // A machine at an endpoint is connected rather than overwritten.
 const allowed=(x,z)=>{if(Math.abs(x)>26||Math.abs(z)>26||blocked.has(key(x,z)))return false;const b=grid.get(key(x,z));return !b||b.type===type||type==='belt'&&(b===first&&DIRECTIONAL.includes(b.type)||b===last&&(['hq','storage','launchpad','splitter'].includes(b.type)||Object.hasOwn(RECIPES,b.type)));};
 if(!allowed(start.x,start.z)||!allowed(end.x,end.z))return{error:'Route endpoint is blocked',cells:[]};
 const initial={x:start.x,z:start.z,d:dir,g:0,f:Math.abs(start.x-end.x)+Math.abs(start.z-end.z),prev:null},open=[initial],best=new Map([[`${start.x},${start.z},${dir}`,0]]);let goal=null,visits=0;
 while(open.length&&visits++<14000){
  let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
  const cur=open.splice(bi,1)[0];if(cur.x===end.x&&cur.z===end.z){goal=cur;break;}
  for(const d of [cur.d,(cur.d+1)%4,(cur.d+3)%4,(cur.d+2)%4]){
   if(cur===initial&&first&&first.type!=='belt'&&DIRECTIONAL.includes(first.type)&&d!==first.dir)continue;
   const[dx,dz]=DIRS[d],x=cur.x+dx,z=cur.z+dz;if(!allowed(x,z))continue;
   if(last&&last.type==='splitter'&&x===end.x&&z===end.z&&d!==last.dir)continue;
   if(last&&Object.hasOwn(RECIPES,last.type)&&x===end.x&&z===end.z&&last.dir===(d+2)%4)continue;
   if(grid.get(key(cur.x,cur.z))&&grid.get(key(cur.x,cur.z))!==first&&grid.get(key(cur.x,cur.z)).type!==type)continue;
   const g=cur.g+1+(d===cur.d?0:.15),k=`${x},${z},${d}`;if((best.get(k)??Infinity)<=g)continue;best.set(k,g);
   open.push({x,z,d,g,f:g+Math.abs(x-end.x)+Math.abs(z-end.z),prev:cur});
  }
 }
 if(!goal)return{error:'No clear route found',cells:[]};
 const path=[];for(let p=goal;p;p=p.prev)path.push({x:p.x,z:p.z});path.reverse();
 if(path.length>128)return{error:'Route is too long (128 tiles maximum)',cells:[]};
 const cells=[];for(let i=0;i<path.length;i++){
  const cell=path[i],occupant=grid.get(key(cell.x,cell.z));if(occupant&&occupant.type!==type)continue;
  const next=path[i+1];let out=next?DIRS.findIndex(([dx,dz])=>cell.x+dx===next.x&&cell.z+dz===next.z):endpointDirection(s,cell,i?DIRS.findIndex(([dx,dz])=>path[i-1].x+dx===cell.x&&path[i-1].z+dz===cell.z):dir,grid.get(key(path[i-1]?.x,path[i-1]?.z)));
  cells.push({...cell,dir:out});
 }return{cells,error:null};
}
function place(s,p,type,x,z,dir){
 const packed=p.inventory?.[type]?.shift();const b=building(s,type,x,z,dir);
 if(packed)Object.assign(b,packed,{id:b.id,x,z,dir});
 else for(const[r,n]of Object.entries(TYPES[type].cost))s.resources[r]-=n;
 return b;
}
export function command(s,playerId,cmd){
 const p=s.players.find(p=>p.id===playerId);if(!p||!cmd||typeof cmd!=='object')return 'Invalid player';p.inventory||={};
 if(cmd.type==='move'){p.sprinting=!!cmd.sprint;p.input={x:Number.isFinite(cmd.x)?Math.max(-1,Math.min(1,cmd.x)):0,z:Number.isFinite(cmd.z)?Math.max(-1,Math.min(1,cmd.z)):0};return null;}
 if(s.status!=='playing')return 'The expedition has ended';
 if(['pause','speed','wave'].includes(cmd.type)){
  if(p.id!==s.players[0]?.id)return 'Only the host can control time';
  if(cmd.type==='pause')s.paused=!s.paused;if(cmd.type==='speed')s.speed=s.speed===1?2:1;
  if(cmd.type==='wave'&&s.enemies.length===0&&s.nextWave>s.time+3)s.nextWave=s.time+3;return null;
 }
 if(cmd.type==='moveArea')return moveArea(s,p,cmd);
 if(cmd.type==='buildRow'){
  const plan=planRoute(s,cmd.building,cmd.start,cmd.end,Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:0);if(plan.error)return plan.error;
  const existing=new Map(s.buildings.map(b=>[key(b.x,b.z),b])),fresh=plan.cells.filter(c=>!existing.has(key(c.x,c.z))),count=Math.max(0,fresh.length-inventoryCount(s,p.id,cmd.building));
  if(s.buildings.length+fresh.length>700)return 'Building limit reached (700)';
  for(const[r,n]of Object.entries(TYPES[cmd.building].cost))if(s.resources[r]<n*count)return 'Not enough materials for the entire route';
  for(const c of plan.cells){const b=existing.get(key(c.x,c.z));if(b)b.dir=c.dir;else place(s,p,cmd.building,c.x,c.z,c.dir);}updatePower(s);return null;
 }
 const x=cmd.x,z=cmd.z;if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>26||Math.abs(z)>26)return 'Invalid tile';
 if(cmd.type==='build'){
  const error=canBuild(s,cmd.building,x,z,p.id);if(error)return error;
  const dir=Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:0;
  place(s,p,cmd.building,x,z,dir);
  const a=cmd.connectFrom;if(cmd.building==='belt'&&a&&Number.isInteger(a.x)&&Number.isInteger(a.z)&&Math.abs(a.x-x)+Math.abs(a.z-z)===1){const prev=s.buildings.find(b=>b.x===a.x&&b.z===a.z&&b.type==='belt');if(prev)prev.dir=DIRS.findIndex(([dx,dz])=>prev.x+dx===x&&prev.z+dz===z);}
  updatePower(s);return null;
 }
 const b=s.buildings.find(b=>b.x===x&&b.z===z);
 if(cmd.type==='configureLogistics'){
  if(!b||!LOGISTICS_TYPES.includes(b.type)||cmd.id!==undefined&&cmd.id!==b.id)return 'Select a transfer relay or dispatch hub to program';
  const v=cmd.program;if(!v||PROGRAM_ROLES.some(r=>!Number.isInteger(v[r])||v[r]<0||v[r]>100)||PROGRAM_ROLES.every(r=>v[r]===0))return 'Each quota must be 0–100, with at least one output enabled';
  if(!['auto','any',...ITEM_KEYS].includes(v.filter)||![1,2,4].includes(v.buffer)||typeof v.bypass!=='boolean')return 'Invalid filter, input buffer or blocked-output behavior';
  b.program={machine:v.machine,forward:v.forward,return:v.return,bypass:v.bypass,filter:v.filter,buffer:v.buffer};b.phase=0;b.remaining=0;programRole(b);return null;
 }
 if(cmd.type==='rotate'){
  if(!b||!DIRECTIONAL.includes(b.type))return 'Select a conveyor, drill, smelter or assembler to rotate';
  b.dir=Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:(b.dir+1)%4;return null;
 }
 if(cmd.type==='upgrade'){
  if(!b)return 'Select a building to upgrade';const cost=upgradeCost(b);if(!cost)return 'Building is fully upgraded (10/10)';
  for(const[r,n]of Object.entries(cost))if(s.resources[r]<n)return 'Not enough materials to upgrade';
  for(const[r,n]of Object.entries(cost))s.resources[r]-=n;
  const missing=maxHp(b)-b.hp;b.level=(b.level||1)+1;b.hp=maxHp(b)-missing;updatePower(s);return null;
 }
 if(cmd.type==='launch'){
  if(p.id!==s.players[0]?.id)return 'Only the host can begin evacuation';
  if(b?.type!=='launchpad')return 'Select an evacuation pad';
  if(s.wave<FINAL_WAVE||s.enemies.length)return 'Survive the first eight swarms before launching';
  if(s.evacuation?.status==='charging')return 'Evacuation is already charging';
  for(const[r,n]of Object.entries(LAUNCH_COST))if(s.resources[r]<n)return 'Evacuation needs 30 components, 60 steel and 40 circuits';
  for(const[r,n]of Object.entries(LAUNCH_COST))s.resources[r]-=n;
  s.evacuation={status:'charging',remaining:90,padId:b.id};spawnWave(s);return null;
 }
 if(cmd.type==='demolish'){
  if(b&&s.time-(b.lastHit??-100)<5)return 'Recently attacked buildings cannot be moved or dismantled for five seconds';
  if(b?.type==='hq')return 'The command core cannot be dismantled';
  if(b){const{id,x,z,dir,type,active,...packed}=b;(p.inventory[type]||=[]).push(packed);s.buildings=s.buildings.filter(v=>v.id!==id);}
  else{const i=s.terrain.trees.findIndex(t=>t.x===x&&t.z===z);if(i>=0){s.terrain.trees.splice(i,1);s.resources.wood+=8;}else{const ri=s.terrain.rocks.findIndex(t=>t.x===x&&t.z===z);if(ri>=0)s.terrain.rocks.splice(ri,1);else return 'Nothing to dismantle';}}
  updatePower(s);return null;
 }
 if(cmd.type==='repair'){
  if(!b)return 'Select a building';if(b.hp>=maxHp(b))return 'Building is at full health';
  if(s.resources.wood<4||s.resources.plate<2)return 'Not enough materials';s.resources.wood-=4;s.resources.plate-=2;b.hp=Math.min(maxHp(b),b.hp+300);return null;
 }return 'Unknown command';
}
export function updatePower(s){
 const core=s.buildings.find(b=>b.type==='hq'),base=18+(core?((core.level||1)-1)*3:0);
 const generatorPower=s.resources.wood>0?s.buildings.filter(b=>b.type==='generator').reduce((n,b)=>n+18*(1+((b.level||1)-1)*.3),0):0;
 s.power={used:s.buildings.reduce((n,b)=>n+buildingPower(b),0),total:Math.round(base+generatorPower)};
 let available=s.power.total;for(const b of s.buildings){const n=buildingPower(b);b.active=available>=n;if(b.active)available-=n;}
}
function store(s,item,amount=1){if(!RESOURCE_KEYS.includes(item)||s.resources[item]+amount>storageCapacity(s))return false;s.resources[item]+=amount;if(item==='plate'||item==='gear')s.produced[item]++;return true;}
export function canAcceptItem(s,b,item,from,cycles=4){
 if(!b)return false;
 if(from&&(b.type==='belt'||Object.hasOwn(RECIPES,b.type))){const[dx,dz]=DIRS[b.dir];if(from.x===b.x+dx&&from.z===b.z+dz)return false;}
 if(['hq','storage'].includes(b.type)||b.type==='launchpad'&&item==='module')return RESOURCE_KEYS.includes(item)&&(s.resources[item]||0)<storageCapacity(s);
 if(b.type==='splitter'){const[dx,dz]=DIRS[(b.dir+2)%4];return !b.item&&(!from||from.x===b.x+dx&&from.z===b.z+dz);}
 if(b.type==='belt')return !b.item;
 const recipe=RECIPES[b.type];return !!(recipe&&recipe.input[item]&&b.input.filter(v=>v===item).length<recipe.input[item]*cycles);
}
function accept(s,b,item,from,cycles=4){
 if(!canAcceptItem(s,b,item,from,cycles))return false;
 if(['hq','storage','launchpad'].includes(b.type))return store(s,item);
 if(['belt','splitter'].includes(b.type)){b.item=item;b.itemSide=from?DIRS.findIndex(([dx,dz])=>b.x+dx===from.x&&b.z+dz===from.z):(b.dir+2)%4;b.itemTick=s.tick;return true;}
 b.input.push(item);return true;
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
  if(accept(s,target,item,b,role==='machine'?p.buffer:4)){source.item=null;b.cooldown=.6/productionSpeed(b);logTransfer(b,role,item,s);}
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
 const forecast=waveForecast(s);s.wave++;const count=forecast.count;
 for(let i=0;i<count;i++){
  const side=(s.wave+i%2)%4,t=(i*7.31+s.wave*3)%46-23;
  const x=side===0?-26:side===2?26:t,z=side===1?-26:side===3?26:t;
  const brute=i%11===0,hp=Math.round((35+s.wave*8)*forecast.health*(brute?2:1));
  s.enemies.push({id:s.nextId++,x,z,hp,maxHp:hp,damage:forecast.damage,speed:1.0+(i%4)*.12+s.wave*.025,cooldown:0,brute:i%11===0});
 }s.nextWave=s.time+(DIFFICULTIES[s.difficulty]||DIFFICULTIES.standard).interval;event(s,`Swarm ${s.wave} · ${count} hostiles approaching`);
}
function event(s,text){s.events.push({id:s.nextId++,text,time:s.time});if(s.events.length>6)s.events.shift();}
export function step(s,dt=STEP){
 if(s.paused||s.status!=='playing')return;s.tick++;s.time+=dt;s.shots=s.shots.filter(v=>s.time-v.time<.25);
 if(s.tick%20===0)updatePower(s);
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
 // Snapshot transport first: a newly received item cannot travel multiple tiles in one tick.
 const moving=s.buildings.filter(b=>['belt','splitter'].includes(b.type)&&b.item&&s.tick%Math.max(2,8-Math.floor(((b.level||1)-1)*.5))===0).map(b=>({b,item:b.item}));
 const busy=new Set(s.buildings.filter(b=>['belt','splitter'].includes(b.type)&&b.item).map(b=>b.id)),controls=relayControls(s,grid,dt);
 for(const{b,item}of moving){
  if(b.item!==item||b.itemTick===s.tick)continue;
  if(b.type==='splitter'){dispatch(s,b,item,grid,busy);continue;}
  const relay=controls.get(b.id),matches=relay&&programMatches(relay,item,grid),role=relay&&programRole(relay);
  if(relay&&matches&&role!=='forward'&&(!programFor(relay).bypass||programFor(relay).forward===0))continue;
  const[dx,dz]=DIRS[b.dir],target=grid.get(key(b.x+dx,b.z+dz));
  if(target&&!busy.has(target.id)&&accept(s,target,item,b)){b.item=null;if(relay)logTransfer(relay,'forward',item,s,!matches||role!=='forward');}
 }
 for(const b of s.buildings){
  if(b.type==='generator'){b.progress+=dt*(1+((b.level||1)-1)*.12);if(b.progress>=12){b.progress=0;if(s.resources.wood>0)s.resources.wood--;}}
  if(!b.active)continue;
  const [dx,dz]=DIRS[b.dir],out=grid.get(key(b.x+dx,b.z+dz));
  const recipe=RECIPES[b.type],extract=b.type==='drill'?'ore':b.type==='copperDrill'?'copperOre':null;
  if(extract||recipe){
   if(b.item){if(accept(s,out,b.item,b))b.item=null;continue;}
   if(recipe&&Object.entries(recipe.input).some(([r,n])=>b.input.filter(v=>v===r).length<n))continue;
   b.progress+=dt*productionSpeed(b);
   if(b.progress>=(recipe?.seconds||2)){b.progress=0;if(recipe)for(const[r,n]of Object.entries(recipe.input))for(let i=0;i<n;i++)b.input.splice(b.input.indexOf(r),1);b.item=extract||recipe.output;s.stats.totals[b.item]=(s.stats.totals[b.item]||0)+1;}
  }
  if(b.type==='sawmill'&&s.terrain.trees.some(t=>dist(t,b)<5)){b.progress+=dt*productionSpeed(b);if(b.progress>=3){b.progress=0;const room=Math.max(0,storageCapacity(s)-s.resources.wood);const made=Math.min(3,room);s.resources.wood+=made;s.stats.totals.wood=(s.stats.totals.wood||0)+made;}}
  if(b.type==='turret'){
   const stats=turretStats(b);b.cooldown-=dt;if(b.ammo<=0&&s.resources.gear>0){s.resources.gear--;b.ammo=12;}
   if(b.cooldown<=0&&b.ammo>0){let target=null,closest=stats.range*stats.range;for(const e of s.enemies){const dx=e.x-b.x,dz=e.z-b.z,d=dx*dx+dz*dz;if(e.hp>0&&d<closest){closest=d;target=e;}}
    if(target){target.hp-=stats.damage;b.ammo--;b.cooldown=stats.interval;b.aim=Math.atan2(target.x-b.x,target.z-b.z);s.shots.push({x:b.x,z:b.z,tx:target.x,tz:target.z,time:s.time});}}
  }
 }
 for(const p of s.players){
  if(p.hp<=0){p.respawn-=dt;if(p.respawn<=0){p.hp=100;p.x=2;p.z=2;}continue;}
  const len=Math.max(1,Math.hypot(p.input.x,p.input.z)),speed=4.5*(p.sprinting?1.65:1);
  const nx=Math.max(-26,Math.min(26,p.x+p.input.x/len*speed*dt)),nz=Math.max(-26,Math.min(26,p.z+p.input.z/len*speed*dt));
  // Disc-versus-building collision gives engineers space to slide around corners.
  const blocked=(x,z)=>{for(let ix=Math.floor(x-.65);ix<=Math.ceil(x+.65);ix++)for(let iz=Math.floor(z-.65);iz<=Math.ceil(z+.65);iz++){const b=grid.get(key(ix,iz));if(!b||['belt','inserter','splitter'].includes(b.type))continue;const r=b.type==='hq'?.68:.38,dx=Math.max(Math.abs(x-b.x)-r,0),dz=Math.max(Math.abs(z-b.z)-r,0);if(dx*dx+dz*dz<.17*.17)return true;}return false;};
  if(!blocked(nx,nz)){p.x=nx;p.z=nz;}else{if(!blocked(nx,p.z))p.x=nx;if(!blocked(p.x,nz))p.z=nz;}
  p.cooldown-=dt;if(p.cooldown<=0){const e=s.enemies.find(e=>e.hp>0&&dist(e,p)<6);if(e){e.hp-=14;p.cooldown=.5;s.shots.push({x:p.x,z:p.z,tx:e.x,tz:e.z,time:s.time});}}
 }
 const hq=s.buildings.find(b=>b.type==='hq');if(!hq){s.status='defeat';return;}
 // Local obstacle steering: swarm converges on the reactor, chewing through defenses.
 for(const e of s.enemies){
  if(e.hp<=0)continue;e.cooldown-=dt;
  let target=hq;for(const p of s.players)if(p.hp>0&&dist(e,p)<4)target=p;
  const d=dist(e,target),dx=(target.x-e.x)/(d||1),dz=(target.z-e.z)/(d||1),speed=e.speed*(e.brute?.7:1);
  const nx=e.x+dx*speed*dt,nz=e.z+dz*speed*dt;
  let obstacle=grid.get(key(Math.round(nx),Math.round(nz)));if(['belt','inserter','splitter'].includes(obstacle?.type))obstacle=null;
  if(obstacle||d<.85){const victim=obstacle||target;if(e.cooldown<=0){victim.hp-=(e.brute?24:10)*(e.damage||1);victim.lastHit=s.time;e.cooldown=.8;if(victim.input&&victim.hp<=0)victim.respawn=8;}}
  else{e.x=nx;e.z=nz;}
 }
 const dead=s.enemies.filter(e=>e.hp<=0).length;s.totalKills+=dead;s.enemies=s.enemies.filter(e=>e.hp>0);
 if(s.tick%20===0){s.stats.history.push({time:s.time,totals:{...s.stats.totals}});if(s.stats.history.length>61)s.stats.history.shift();}
 const destroyed=s.buildings.filter(b=>b.hp<=0);if(destroyed.length){s.buildings=s.buildings.filter(b=>b.hp>0);updatePower(s);}
 if(hq.hp<=0){s.status='defeat';event(s,'The command core has fallen');}
 else if(s.evacuation?.status==='charging'){const pad=s.buildings.find(b=>b.id===s.evacuation.padId);if(!pad){s.evacuation.status='failed';event(s,'Evacuation pad lost. Rebuild and try again.');}else if(pad.active){s.evacuation.remaining=Math.max(0,s.evacuation.remaining-dt*(1+((pad.level||1)-1)*.1));if(s.evacuation.remaining===0&&s.enemies.length===0){s.status='victory';s.evacuation.status='complete';event(s,'Evacuation complete. The colony survives.');}}}
 else if(s.time>=s.nextWave&&s.enemies.length===0&&s.wave<FINAL_WAVE)spawnWave(s);
}
export function planMove(s,ids,dx,dz){
 if(!Array.isArray(ids)||ids.length>700||!ids.length||ids.some(id=>!Number.isInteger(id))||!Number.isInteger(dx)||!Number.isInteger(dz))return{error:'Invalid selection or move offset',valid:[],invalid:[]};
 const selected=s.buildings.filter(b=>ids.includes(b.id));if(s.enemies.length&&selected.some(b=>b.type==='hq'))return{error:'The command core cannot be relocated during an active swarm',valid:[],invalid:[]};if(selected.some(b=>s.time-(b.lastHit??-100)<5))return{error:'Recently attacked buildings cannot be relocated for five seconds',valid:[],invalid:[]};if(selected.length!==new Set(ids).size)return{error:'Selection changed. Select the buildings again.',valid:[],invalid:[]};
 const stationary={...s,buildings:s.buildings.filter(b=>!ids.includes(b.id))},valid=[],invalid=[];
 for(const b of selected){let reason;if(b.type==='hq'){reason=Math.abs(b.x+dx)>26||Math.abs(b.z+dz)>26?'Core is outside the construction zone':stationary.buildings.some(v=>v.x===b.x+dx&&v.z===b.z+dz)?'Core destination is occupied':s.terrain.trees.some(v=>v.x===b.x+dx&&v.z===b.z+dz)||s.terrain.rocks.some(v=>v.x===b.x+dx&&v.z===b.z+dz)?'Clear the core destination first':null;}else reason=placementError(stationary,b.type,b.x+dx,b.z+dz);
  (reason?invalid:valid).push({id:b.id,type:b.type,x:b.x+dx,z:b.z+dz,reason});
 }return{error:null,valid,invalid};
}
function moveArea(s,p,cmd){
 const plan=planMove(s,cmd.ids,cmd.dx,cmd.dz);if(plan.error)return plan.error;
 if(plan.invalid.some(v=>v.type==='hq'))return 'The command core cannot be removed. Choose a valid destination for it.';
 if(plan.invalid.length&&!cmd.override)return plan.invalid.length+' buildings cannot be placed here. Hold Shift to pack invalid buildings into inventory.';
 if(!plan.valid.length&&!cmd.override)return 'No valid buildings to move';
 for(const target of plan.valid){const b=s.buildings.find(b=>b.id===target.id);b.x=target.x;b.z=target.z;}
 if(cmd.override)for(const target of plan.invalid){const b=s.buildings.find(b=>b.id===target.id),{id,x,z,dir,type,active,...packed}=b;(p.inventory[type]||=[]).push(packed);s.buildings=s.buildings.filter(v=>v.id!==id);}
 updatePower(s);return null;
}
export function snapshot(s){return JSON.parse(JSON.stringify(s));}
