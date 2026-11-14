// Pure, deterministic simulation. The exact same module runs in Node and solo browsers.
export const SIZE = 56, STEP = .05, MAX_PLAYERS = 4, FINAL_WAVE = 8;
export const DIRS = [[1,0],[0,1],[-1,0],[0,-1]];
export const TYPES = {
 hq:{name:'Kommandocentral',hp:2400,power:0,cost:{},desc:'Forsvar reaktoren. Tilsluttede transportbånd afleverer materialer til det fælles lager.'},
 belt:{name:'Transportbånd',hp:65,power:0,cost:{wood:1},desc:'Flytter én genstand i pilens retning. R drejer udgangen. Forbind miner, smeltere og fabrikker til centralen.'},
 drill:{name:'Jernmine',hp:200,power:3,cost:{wood:15,plate:12},desc:'Placeres på blå jernmalm. Bryder 1 malm hvert 2. sekund og sender den ud i pilens retning.'},
 smelter:{name:'Smelter',hp:250,power:3,cost:{wood:12,plate:15},desc:'Modtager jernmalm fra bånd. Smelter 1 malm til 1 jernplade hvert 2. sekund. Drej udgangen med R.'},
 assembler:{name:'Fabrik',hp:220,power:4,cost:{wood:15,plate:25},desc:'Modtager jernplader fra bånd. Laver 2 plader til 1 tandhjul. Tandhjul leveres til lager og bruges som ammunition.'},
 sawmill:{name:'Savværk',hp:180,power:2,cost:{wood:20,plate:8},desc:'Skal stå tæt på træer. Leverer træ direkte til lageret hvert 3. sekund og genplanter skoven.'},
 generator:{name:'Generator',hp:300,power:0,cost:{wood:25,plate:20},desc:'Bruger 1 træ hvert 12. sekund og tilføjer 18 energi til basens fælles net.'},
 turret:{name:'Vagttårn',hp:350,power:2,cost:{wood:15,plate:22,gear:3},desc:'Skyder automatisk inden for 10 felter. Ét tandhjul fra lageret giver 12 skud.'},
 wall:{name:'Barrikade',hp:700,power:0,cost:{wood:5,plate:2},desc:'Stopper sværmen. Fjender angriber barrikader for at bryde igennem til centralen.'},
 repair:{name:'Reparer',cost:{wood:4,plate:2},desc:'Reparer en bygning med op til 300 liv. Klik på den beskadigede bygning.'},
 demolish:{name:'Afmonter',cost:{},desc:'Fjern en bygning og få 60 % af byggematerialerne tilbage. Centralen kan ikke fjernes.'}
};
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
function building(s,type,x,z,dir=0){const b={id:s.nextId++,type,x,z,dir,hp:TYPES[type].hp,progress:0,input:[],item:null,ammo:0,cooldown:0,active:true};s.buildings.push(b);return b;}
export function createGame(seed=2026){
 const s={version:1,seed,time:0,tick:0,nextId:1,resources:{wood:165,plate:150,gear:20},buildings:[],players:[],enemies:[],shots:[],wave:0,nextWave:100,totalKills:0,produced:{plate:0,gear:0},power:{used:0,total:18},status:'playing',paused:false,speed:1,terrain:makeTerrain(seed),events:[]};
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
export function addPlayer(s,name='Ingeniør'){
 if(s.players.length>=MAX_PLAYERS)return null;
 const id=s.nextId++,p={id,name:String(name).trim().slice(0,20)||'Ingeniør',x:2+s.players.length,z:2,color:s.players.length,hp:100,input:{x:0,z:0},cooldown:0,respawn:0};s.players.push(p);return p;
}
export function removePlayer(s,id){s.players=s.players.filter(p=>p.id!==id);}
export function canBuild(s,type,x,z){
 const def=TYPES[type];if(!def||type==='hq'||['repair','demolish'].includes(type))return'Ugyldig bygning';
 if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>26||Math.abs(z)>26)return'Uden for kortet';
 if(s.buildings.some(b=>b.x===x&&b.z===z))return'Feltet er optaget';
 if(s.terrain.trees.some(b=>b.x===x&&b.z===z)||s.terrain.rocks.some(b=>b.x===x&&b.z===z))return'Ryd feltet med afmonteringsværktøjet';
 if(type==='drill'&&!s.terrain.ore.some(b=>b.x===x&&b.z===z))return'Minen skal stå på jernmalm';
 if(type==='sawmill'&&!s.terrain.trees.some(b=>Math.hypot(b.x-x,b.z-z)<5))return'Savværket kræver træer inden for 5 felter';
 if(s.buildings.length>=700)return'Byggegrænse nået (700)';
 for(const [r,n]of Object.entries(def.cost))if(s.resources[r]<n)return'Mangler materialer';return null;
}
export function command(s,playerId,cmd){
 const p=s.players.find(p=>p.id===playerId);if(!p||!cmd||typeof cmd!=='object')return'Ugyldig spiller';
 if(cmd.type==='move'){p.input={x:Number.isFinite(cmd.x)?Math.max(-1,Math.min(1,cmd.x)):0,z:Number.isFinite(cmd.z)?Math.max(-1,Math.min(1,cmd.z)):0};return null;}
 if(s.status!=='playing')return'Spillet er afsluttet';
 if(cmd.type==='pause'||cmd.type==='speed'||cmd.type==='wave'){
  if(p.id!==s.players[0]?.id)return'Kun værten kan styre tiden';
  if(cmd.type==='pause')s.paused=!s.paused;
  if(cmd.type==='speed')s.speed=s.speed===1?2:1;
  if(cmd.type==='wave'&&s.enemies.length===0&&s.nextWave>s.time+3)s.nextWave=s.time+3;return null;
 }
 const x=cmd.x,z=cmd.z;if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>26||Math.abs(z)>26)return'Ugyldigt felt';
 if(cmd.type==='build'){
  const error=canBuild(s,cmd.building,x,z);if(error)return error;
  for(const[r,n]of Object.entries(TYPES[cmd.building].cost))s.resources[r]-=n;
  building(s,cmd.building,x,z,Number.isInteger(cmd.dir)?((cmd.dir%4)+4)%4:0);updatePower(s);return null;
 }
 const b=s.buildings.find(b=>b.x===x&&b.z===z);
 if(cmd.type==='demolish'){
  if(b?.type==='hq')return'Centralen kan ikke afmonteres';
  if(b){for(const[r,n]of Object.entries(TYPES[b.type].cost))s.resources[r]+=Math.floor(n*.6);s.buildings=s.buildings.filter(v=>v.id!==b.id);}
  else{const i=s.terrain.trees.findIndex(t=>t.x===x&&t.z===z);if(i>=0){s.terrain.trees.splice(i,1);s.resources.wood+=8;}else{const ri=s.terrain.rocks.findIndex(t=>t.x===x&&t.z===z);if(ri>=0)s.terrain.rocks.splice(ri,1);else return'Intet at afmontere';}}
  updatePower(s);return null;
 }
 if(cmd.type==='repair'){
  if(!b)return'Vælg en bygning';if(b.hp>=TYPES[b.type].hp)return'Bygningen har fuldt liv';
  if(s.resources.wood<4||s.resources.plate<2)return'Mangler materialer';s.resources.wood-=4;s.resources.plate-=2;b.hp=Math.min(TYPES[b.type].hp,b.hp+300);return null;
 }
 return'Ukendt handling';
}
export function updatePower(s){
 const generators=s.buildings.filter(b=>b.type==='generator').length;
 s.power={used:s.buildings.reduce((n,b)=>n+TYPES[b.type].power,0),total:18+(s.resources.wood>0?generators*18:0)};
 let available=s.power.total;for(const b of s.buildings){const n=TYPES[b.type].power;b.active=available>=n;if(b.active)available-=n;}
}
function accept(s,b,item){
 if(!b)return false;
 if(b.type==='hq'){if(item==='plate'||item==='gear'||item==='wood'){s.resources[item]++;if(item!=='wood')s.produced[item]++;return true;}return false;}
 if(b.type==='belt'&&!b.item){b.item=item;return true;}
 if((b.type==='smelter'&&item==='ore'||b.type==='assembler'&&item==='plate')&&b.input.length<8){b.input.push(item);return true;}return false;
}
function spawnWave(s){
 s.wave++;const count=12+s.wave*s.wave*4;
 for(let i=0;i<count;i++){
  const side=(s.wave+i%2)%4,t=(i*7.31+s.wave*3)%46-23;
  const x=side===0?-26:side===2?26:t,z=side===1?-26:side===3?26:t;
  s.enemies.push({id:s.nextId++,x,z,hp:35+s.wave*8,maxHp:35+s.wave*8,speed:1.0+(i%4)*.12+s.wave*.025,cooldown:0,brute:i%11===0});
 }s.nextWave=s.time+95;event(s,`Bølge ${s.wave} · ${count} fjender nærmer sig`);
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
  for(const{b,item}of moving){const[dX,dZ]=DIRS[b.dir],target=grid.get(key(b.x+dX,b.z+dZ));if(target&&!busy.has(target.id)&&accept(s,target,item))b.item=null;}
 }
 for(const b of s.buildings){
  if(b.type==='generator'){b.progress+=dt;if(b.progress>=12){b.progress=0;if(s.resources.wood>0)s.resources.wood--;}}
  if(!b.active)continue;
  const [dx,dz]=DIRS[b.dir],out=grid.get(key(b.x+dx,b.z+dz));
  if(b.type==='drill'||b.type==='smelter'||b.type==='assembler'){
   if(b.item){if(accept(s,out,b.item))b.item=null;continue;}
   const need=b.type==='assembler'?2:b.type==='smelter'?1:0;
   if(b.input.length<need)continue;b.progress+=dt;
   if(b.progress>=(b.type==='assembler'?3:2)){b.progress=0;b.input.splice(0,need);b.item=b.type==='drill'?'ore':b.type==='smelter'?'plate':'gear';}
  }
  if(b.type==='sawmill'){if(s.terrain.trees.some(t=>dist(t,b)<5)){b.progress+=dt;if(b.progress>=3){b.progress=0;s.resources.wood+=3;}}}
  if(b.type==='turret'){
   b.cooldown-=dt;if(b.ammo<=0&&s.resources.gear>0){s.resources.gear--;b.ammo=12;}
   if(b.cooldown<=0&&b.ammo>0){let target=null,closest=10;for(const e of s.enemies){const d=dist(e,b);if(e.hp>0&&d<closest){closest=d;target=e;}}
    if(target){target.hp-=28;b.ammo--;b.cooldown=.38;b.aim=Math.atan2(target.x-b.x,target.z-b.z);s.shots.push({x:b.x,z:b.z,tx:target.x,tz:target.z,time:s.time});}}
  }
 }
 for(const p of s.players){
  if(p.hp<=0){p.respawn-=dt;if(p.respawn<=0){p.hp=100;p.x=2;p.z=2;}continue;}
  const len=Math.hypot(p.input.x,p.input.z)||1;
  const nx=Math.max(-26,Math.min(26,p.x+p.input.x/len*4*dt)),nz=Math.max(-26,Math.min(26,p.z+p.input.z/len*4*dt));
  const blocked=(x,z)=>{const b=grid.get(key(Math.round(x),Math.round(z)));return b&&b.type!=='belt';};
  if(!blocked(nx,p.z))p.x=nx;if(!blocked(p.x,nz))p.z=nz;
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
 if(hq.hp<=0){s.status='defeat';event(s,'Centralen er faldet');}
 else if(s.wave===FINAL_WAVE&&s.enemies.length===0){s.status='victory';event(s,'Kolonien overlevede. Ironhaven består.');}
 else if(s.time>=s.nextWave&&s.enemies.length===0&&s.wave<FINAL_WAVE)spawnWave(s);
}
export function snapshot(s){return JSON.parse(JSON.stringify(s));}
