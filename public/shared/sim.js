// Pure, deterministic simulation. The exact same module runs in Node and solo browsers.
export const SIZE = 56, STEP = .05, MAX_PLAYERS = 4, FINAL_WAVE = 8;
export const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
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
export const DIRECTIONAL = ['belt','drill','smelter','assembler'];
export const TURRET_LEVELS = [
 {name:'Mk I',hp:350,damage:28,range:10,interval:.38,cost:null},
 {name:'Mk II',hp:500,damage:40,range:12,interval:.30,cost:{plate:35,gear:8}},
 {name:'Mk III',hp:700,damage:56,range:14,interval:.23,cost:{plate:60,gear:16}}
];
export const turretStats = b => TURRET_LEVELS[Math.max(0,Math.min(2,(b.level||1)-1))];
export const maxHp = b => b.type==='turret' ? turretStats(b).hp : TYPES[b.type].hp;
export const inventoryCount = (s,id,type) => s.players.find(p=>p.id===id)?.inventory?.[type]?.length||0;
export function migrateGame(s){
 if(!s||![1,2].includes(s.version)||!Array.isArray(s.buildings)||!s.terrain||!Array.isArray(s.players))throw Error('Unsupported or damaged save file.');
 s.version=2;for(const p of s.players){p.inventory||={};p.input={x:0,z:0};}
 for(const b of s.buildings)if(b.type==='turret')b.level||=1;
 return s;
}
export const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function rng(seed){let n=seed|0;return()=>{n^=n<<13;n^=n>>>17;n^=n<<5;return(n>>>0)/4294967296;};}
export const key=(x,z)=>`${x},${z}`;
export function makeTerrain(seed=2026){
 const rand=rng(seed),trees=[],ore=[],rocks=[];
 for(let x=-27;x<=27;x++)for(let z=-27;z<=27;z++){
  const d=Math.hypot(x,z),v=rand();
  if(d>11&&v<.19&&Math.sin(x*.24)+Math.cos(z*.22)>.1)trees.push({x,z,h:.8+rand()*.8});
  else if(d>13&&v>.966)rocks.push({x,z,h:.3+rand()*.6});
 }
 for(const [cx,cz] of [[-8,-3],[-10,9],[10,-9],[15,7],[-19,-13]])for(let x=-2;x<=2;x++)for(let z=-2;z<=2;z++)if(x*x+z*z<7)ore.push({x:cx+x,z:cz+z});
 return{trees,ore,rocks};
}
function building(s,type,x,z,dir=0){const b={id:s.nextId++,type,x,z,dir,hp:TYPES[type].hp,progress:0,input:[],item:null,ammo:0,cooldown:0,active:true,level:1};s.buildings.push(b);return b;}
export function createGame(seed=2026){
 const s={version:2,seed,time:0,tick:0,nextId:1,resources:{wood:165,plate:150,gear:20},buildings:[],players:[],enemies:[],shots:[],wave:0,nextWave:100,totalKills:0,produced:{plate:0,gear:0},power:{used:0,total:18},status:'playing',paused:false,speed:1,terrain:makeTerrain(seed),events:[]};
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
export function outputPointsAt(b,x,z){const [dx,dz]=DIRS[b.dir||0];return DIRECTIONAL.includes(b.type)&&b.x+dx===x&&b.z+dz===z;}
export function beltInputs(b,grid){
 const inputs=[];for(let d=0;d<4;d++){if(d===b.dir)continue;const[dx,dz]=DIRS[d],other=grid.get(key(b.x+dx,b.z+dz));if(other&&outputPointsAt(other,b.x,b.z))inputs.push(d);}
 return inputs.length?inputs:[(b.dir+2)%4];
}
function endpointDirection(s,cell,fallback,previous){
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
 const existing=grid.get(key(cell.x,cell.z));if(existing?.type==='belt'&&(!previous||!outputPointsAt(existing,previous.x,previous.z)))return existing.dir;
 const options=[fallback,(fallback+1)%4,(fallback+3)%4,(fallback+2)%4];
 for(const d of options){const[dx,dz]=DIRS[d],target=grid.get(key(cell.x+dx,cell.z+dz));if(!target||target===previous)continue;
  if(target.type==='hq'||['smelter','assembler'].includes(target.type)&&target.dir!==(d+2)%4||target.type==='belt'&&target.dir!==(d+2)%4)return d;
 }return fallback;
}
// An orthogonal A* route with turn penalties; avoids obstacles and fills every tile.
export function planRoute(s,type,start,end,dir=0){
 if(!['belt','wall'].includes(type))return{error:'Rows are available for conveyors and barricades',cells:[]};
 if(!start||!end||![start.x,start.z,end.x,end.z].every(Number.isInteger)||Math.abs(start.x)>26||Math.abs(start.z)>26||Math.abs(end.x)>26||Math.abs(end.z)>26)return{error:'Route is outside the construction zone',cells:[]};
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b])),blocked=new Set([...s.terrain.trees,...s.terrain.rocks].map(v=>key(v.x,v.z)));
 const first=grid.get(key(start.x,start.z)),last=grid.get(key(end.x,end.z));
 // A machine at an endpoint is connected rather than overwritten.
 const allowed=(x,z)=>{if(Math.abs(x)>26||Math.abs(z)>26||blocked.has(key(x,z)))return false;const b=grid.get(key(x,z));return !b||b.type===type||type==='belt'&&(b===first&&DIRECTIONAL.includes(b.type)||b===last&&['hq','smelter','assembler'].includes(b.type));};
 if(!allowed(start.x,start.z)||!allowed(end.x,end.z))return{error:'Route endpoint is blocked',cells:[]};
 const initial={x:start.x,z:start.z,d:dir,g:0,f:Math.abs(start.x-end.x)+Math.abs(start.z-end.z),prev:null},open=[initial],best=new Map([[`${start.x},${start.z},${dir}`,0]]);let goal=null,visits=0;
 while(open.length&&visits++<14000){
  let bi=0;for(let i=1;i<open.length;i++)if(open[i].f<open[bi].f)bi=i;
  const cur=open.splice(bi,1)[0];if(cur.x===end.x&&cur.z===end.z){goal=cur;break;}
  for(const d of [cur.d,(cur.d+1)%4,(cur.d+3)%4,(cur.d+2)%4]){
   if(cur===initial&&first&&first.type!=='belt'&&DIRECTIONAL.includes(first.type)&&d!==first.dir)continue;
   const[dx,dz]=DIRS[d],x=cur.x+dx,z=cur.z+dz;if(!allowed(x,z))continue;
   if(last&&['smelter','assembler'].includes(last.type)&&x===end.x&&z===end.z&&last.dir===(d+2)%4)continue;
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
 if(cmd.type==='move'){p.input={x:Number.isFinite(cmd.x)?Math.max(-1,Math.min(1,cmd.x)):0,z:Number.isFinite(cmd.z)?Math.max(-1,Math.min(1,cmd.z)):0};return null;}
 if(s.status!=='playing')return 'The expedition has ended';
 if(['pause','speed','wave'].includes(cmd.type)){
  if(p.id!==s.players[0]?.id)return 'Only the host can control time';
  if(cmd.type==='pause')s.paused=!s.paused;if(cmd.type==='speed')s.speed=s.speed===1?2:1;
  if(cmd.type==='wave'&&s.enemies.length===0&&s.nextWave>s.time+3)s.nextWave=s.time+3;return null;
 }
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
 if(cmd.type==='rotate'){
  if(!b||!DIRECTIONAL.includes(b.type))return 'Select a conveyor, drill, smelter or assembler to rotate';
  b.dir=Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:(b.dir+1)%4;return null;
 }
 if(cmd.type==='upgrade'){
  if(b?.type!=='turret')return 'Select a turret to upgrade';const next=TURRET_LEVELS[b.level||1];if(!next)return 'Turret is fully upgraded';
  for(const[r,n]of Object.entries(next.cost))if(s.resources[r]<n)return 'Not enough materials to upgrade';
  for(const[r,n]of Object.entries(next.cost))s.resources[r]-=n;
  const missing=maxHp(b)-b.hp;b.level=(b.level||1)+1;b.hp=maxHp(b)-missing;return null;
 }
 if(cmd.type==='demolish'){
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
 const generators=s.buildings.filter(b=>b.type==='generator').length;
 s.power={used:s.buildings.reduce((n,b)=>n+TYPES[b.type].power,0),total:18+(s.resources.wood>0?generators*18:0)};
 let available=s.power.total;for(const b of s.buildings){const n=TYPES[b.type].power;b.active=available>=n;if(b.active)available-=n;}
}
function accept(s,b,item,from){
 if(!b)return false;
 if(from&&['belt','smelter','assembler'].includes(b.type)){const[dx,dz]=DIRS[b.dir];if(from.x===b.x+dx&&from.z===b.z+dz)return false;}
 if(b.type==='hq'){if(item==='plate'||item==='gear'||item==='wood'){s.resources[item]++;if(item!=='wood')s.produced[item]++;return true;}return false;}
 if(b.type==='belt'&&!b.item){b.item=item;b.itemSide=from?DIRS.findIndex(([dx,dz])=>b.x+dx===from.x&&b.z+dz===from.z):(b.dir+2)%4;b.itemTick=s.tick;return true;}
 if((b.type==='smelter'&&item==='ore'||b.type==='assembler'&&item==='plate')&&b.input.length<8){b.input.push(item);return true;}return false;
}
function spawnWave(s){
 s.wave++;const count=12+s.wave*s.wave*4;
 for(let i=0;i<count;i++){
  const side=(s.wave+i%2)%4,t=(i*7.31+s.wave*3)%46-23;
  const x=side===0?-26:side===2?26:t,z=side===1?-26:side===3?26:t;
  s.enemies.push({id:s.nextId++,x,z,hp:35+s.wave*8,maxHp:35+s.wave*8,speed:1.0+(i%4)*.12+s.wave*.025,cooldown:0,brute:i%11===0});
 }s.nextWave=s.time+95;event(s,`Swarm ${s.wave} · ${count} hostiles approaching`);
}
function event(s,text){s.events.push({id:s.nextId++,text,time:s.time});if(s.events.length>6)s.events.shift();}
export function step(s,dt=STEP){
 if(s.paused||s.status!=='playing')return;s.tick++;s.time+=dt;s.shots=s.shots.filter(v=>s.time-v.time<.25);
 if(s.tick%20===0)updatePower(s);
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b]));
 // Transport uses a snapshot to prevent an item travelling through a whole line in one pulse.
 if(s.tick%8===0){
  const moving=s.buildings.filter(b=>b.type==='belt'&&b.item).map(b=>({b,item:b.item}));
  const busy=new Set(moving.map(v=>v.b.id));
  for(const{b,item}of moving){const[dX,dZ]=DIRS[b.dir],target=grid.get(key(b.x+dX,b.z+dZ));if(target&&!busy.has(target.id)&&accept(s,target,item,b))b.item=null;}
 }
 for(const b of s.buildings){
  if(b.type==='generator'){b.progress+=dt;if(b.progress>=12){b.progress=0;if(s.resources.wood>0)s.resources.wood--;}}
  if(!b.active)continue;
  const [dx,dz]=DIRS[b.dir],out=grid.get(key(b.x+dx,b.z+dz));
  if(b.type==='drill'||b.type==='smelter'||b.type==='assembler'){
   if(b.item){if(accept(s,out,b.item,b))b.item=null;continue;}
   const need=b.type==='assembler'?2:b.type==='smelter'?1:0;
   if(b.input.length<need)continue;b.progress+=dt;
   if(b.progress>=(b.type==='assembler'?3:2)){b.progress=0;b.input.splice(0,need);b.item=b.type==='drill'?'ore':b.type==='smelter'?'plate':'gear';}
  }
  if(b.type==='sawmill'){if(s.terrain.trees.some(t=>dist(t,b)<5)){b.progress+=dt;if(b.progress>=3){b.progress=0;s.resources.wood+=3;}}}
  if(b.type==='turret'){
   const stats=turretStats(b);b.cooldown-=dt;if(b.ammo<=0&&s.resources.gear>0){s.resources.gear--;b.ammo=12;}
   if(b.cooldown<=0&&b.ammo>0){let target=null,closest=stats.range;for(const e of s.enemies){const d=dist(e,b);if(e.hp>0&&d<closest){closest=d;target=e;}}
    if(target){target.hp-=stats.damage;b.ammo--;b.cooldown=stats.interval;b.aim=Math.atan2(target.x-b.x,target.z-b.z);s.shots.push({x:b.x,z:b.z,tx:target.x,tz:target.z,time:s.time});}}
  }
 }
 for(const p of s.players){
  if(p.hp<=0){p.respawn-=dt;if(p.respawn<=0){p.hp=100;p.x=2;p.z=2;}continue;}
  const len=Math.max(1,Math.hypot(p.input.x,p.input.z)),speed=4.5;
  const nx=Math.max(-26,Math.min(26,p.x+p.input.x/len*speed*dt)),nz=Math.max(-26,Math.min(26,p.z+p.input.z/len*speed*dt));
  // Disc-versus-building collision gives engineers space to slide around corners.
  const blocked=(x,z)=>{for(let ix=Math.floor(x-.65);ix<=Math.ceil(x+.65);ix++)for(let iz=Math.floor(z-.65);iz<=Math.ceil(z+.65);iz++){const b=grid.get(key(ix,iz));if(!b||b.type==='belt')continue;const r=b.type==='hq'?.68:.38,dx=Math.max(Math.abs(x-b.x)-r,0),dz=Math.max(Math.abs(z-b.z)-r,0);if(dx*dx+dz*dz<.17*.17)return true;}return false;};
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
  let obstacle=grid.get(key(Math.round(nx),Math.round(nz)));if(obstacle?.type==='belt')obstacle=null;
  if(obstacle||d<.85){const victim=obstacle||target;if(e.cooldown<=0){victim.hp-=e.brute?24:10;e.cooldown=.8;if(victim.input&&victim.hp<=0)victim.respawn=8;}}
  else{e.x=nx;e.z=nz;}
 }
 const dead=s.enemies.filter(e=>e.hp<=0).length;s.totalKills+=dead;s.enemies=s.enemies.filter(e=>e.hp>0);
 const destroyed=s.buildings.filter(b=>b.hp<=0);if(destroyed.length){s.buildings=s.buildings.filter(b=>b.hp>0);updatePower(s);}
 if(hq.hp<=0){s.status='defeat';event(s,'The command core has fallen');}
 else if(s.wave===FINAL_WAVE&&s.enemies.length===0){s.status='victory';event(s,'The colony survived. Ironhaven endures.');}
 else if(s.time>=s.nextWave&&s.enemies.length===0&&s.wave<FINAL_WAVE)spawnWave(s);
}
export function snapshot(s){return JSON.parse(JSON.stringify(s));}
