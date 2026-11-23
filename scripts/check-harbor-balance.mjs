// Repeatable factory and siege fixtures. Construction uses player commands.
// Starting stock, generation and defenses are controlled inputs, not earned campaigns.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createExpedition,command,step,updatePower,DIRS,STEP,TYPES,key,RESOURCE_KEYS,RECIPES,storageCapacity,storageUsed} from '../public/shared/sim.js';

const HARBOR_FACTORIES = [
 'aggregateCrusher','firebrickKiln','cokeOven','alloyFurnace','resinKettle',
 'cableWorks','hullYard','hydraulicWorks','switchgearShop','freightWorks','harborWorks'
];
const intermediates = Object.fromEntries([...HARBOR_FACTORIES,'orePress','precisionWorkshop'].map(type=>[RECIPES[type].output,type]));
const processors = [...HARBOR_FACTORIES,'orePress','precisionWorkshop'];

function planFactory() {
 const anchors = {
  aggregateCrusher:[-27,-25],firebrickKiln:[-17,-25],switchgearShop:[13,-19],
  cokeOven:[-27,15],orePress:[-27,25],alloyFurnace:[-17,15],resinKettle:[-17,-5],
  cableWorks:[-7,-13],hullYard:[-7,5],precisionWorkshop:[-7,19],hydraulicWorks:[3,11],
  freightWorks:[13,9],harborWorks:[23,0]
 };
 const demand = Object.fromEntries(processors.map(type=>[type,[]]));
 for(const type of processors)for(const item of Object.keys(RECIPES[type].input)){
  if(intermediates[item])demand[intermediates[item]].push(type);
 }
 let randomState=17;
 const random=()=>{
  randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;
  return randomState/2**32;
 };
 const neighbor=(p,dir)=>({x:p.x+DIRS[dir][0],z:p.z+DIRS[dir][1]});
 const tile=p=>key(p.x,p.z);
 const direction=(a,b)=>DIRS.findIndex(([x,z])=>a.x+x===b.x&&a.z+z===b.z);
 const failures={};
 for(let attempt=0;attempt<600;attempt++){
  const jitter=()=>attempt?Math.floor(random()*5)-2:0;
  const byType=Object.fromEntries(processors.map(type=>{
   const [x,z]=anchors[type];
   return [type,{x:x+jitter(),z:z+jitter()}];
  }));
  const layout=new Map([[key(0,0),{type:'hq',x:0,z:0}]]);
  const add=(type,p,dir=0,meta={})=>{
   if(layout.has(tile(p)))throw Error('Occupied factory site');
   const b={type,...p,dir,...meta};layout.set(tile(b),b);return b;
  };
  try{
   const inputs=new Map();
   for(const type of processors){
    const pos=byType[type];
    add(type,pos);
    const stock=add('storage',neighbor(pos,0),0,{exportItem:demand[type].length?RECIPES[type].output:undefined});
    if(demand[type].length>1)add('splitter',neighbor(stock,0),0,{outputs:demand[type].length});
    const inbound=Object.keys(RECIPES[type].input);
    const feeds=inbound.filter(item=>!intermediates[item]);
    const links=inbound.filter(item=>intermediates[item]).sort((a,b)=>byType[intermediates[a]].z-byType[intermediates[b]].z);
    const ports=links.length===1?[2,3,1]:[3,1,2];
    if(attempt%3===2)ports.reverse();
    links.forEach((item,i)=>inputs.set(intermediates[item]+':'+type,neighbor(pos,ports[i])));
    feeds.forEach((item,i)=>{
     const dir=ports[links.length+i];
     if(item==='ore')add('drill',neighbor(pos,dir),(dir+2)%4);
     else add('storage',neighbor(pos,dir),(dir+2)%4,{feed:item,exportItem:item});
    });
   }
   const edges=processors.flatMap(type=>demand[type].slice().sort((a,b)=>byType[a].z-byType[b].z).map((target,i)=>{
    const origin=byType[type],tail=demand[type].length>1?{x:origin.x+2,z:origin.z}:{x:origin.x+1,z:origin.z};
    const output=demand[type].length>1?[3,0,1][i]:0;
    return {head:neighbor(tail,output),target:byType[target],entry:inputs.get(type+':'+target),label:type+' -> '+target};
   }));
   edges.sort((a,b)=>Math.abs(a.head.x-a.target.x)+Math.abs(a.head.z-a.target.z)-Math.abs(b.head.x-b.target.x)-Math.abs(b.head.z-b.target.z));
   if(attempt%2===1)for(let j=edges.length-1;j>0;j--){const i=Math.floor(random()*(j+1));[edges[i],edges[j]]=[edges[j],edges[i]];}
   if(new Set(edges.map(e=>tile(e.head))).size!==edges.length)continue;
   const starts=new Set(edges.flatMap(e=>[tile(e.head),tile(e.entry)]));
   for(const {head,target,entry,label} of edges){
    starts.delete(tile(head));starts.delete(tile(entry));
    if(layout.has(tile(head))||layout.has(tile(entry)))throw Error('Occupied route start');
    const queue=[head],parents=new Map([[tile(head),null]]);
    let found;
    for(let i=0;i<queue.length;i++){
     const pos=queue[i];
     if(tile(pos)===tile(entry)){found=pos;break;}
     for(let dir=0;dir<4;dir++){
      const next=neighbor(pos,dir),id=tile(next);
      if(Math.abs(next.x)>39||Math.abs(next.z)>39||parents.has(id)||layout.has(id)||starts.has(id))continue;
      parents.set(id,pos);queue.push(next);
     }
    }
    if(!found)throw Error('No physical belt route '+label);
    const route=[target];
    for(let pos=found;pos;pos=parents.get(tile(pos)))route.push(pos);
    route.reverse();
    for(let i=0;i<route.length-1;i++)add('belt',route[i],direction(route[i],route[i+1]));
   }
   return [...layout.values()].filter(b=>b.type!=='hq');
  }catch(error){
   failures[error.message]=(failures[error.message]??0)+1;
   // Fixed seed search for a layout with distinct routes and no crossings.
  }
 }
 throw Error('Could not route harbor factory: '+JSON.stringify(failures));
}

function runHarborFactory({name,power,stock,swarm=false,projects=true,reserve=true,coastal=false},layout=planFactory()){
 const {state,playerId}=createExpedition('Harbor balance',{skipTutorial:true,swarmSeed:417});
 state.terrain.trees=[];
 state.terrain.rocks=[];
 state.wave=swarm?25:0;
 state.nextWave=swarm?500:1e8;
 state.survived=swarm;
 const send=cmd=>command(state,playerId,cmd);
 const build=(type,x,z,dir=0)=>{
  const error=send({type:'build',building:type,x,z,dir});
  assert.equal(error,null,type+' '+x+','+z);
  return state.buildings.at(-1);
 };
 for(const item of RESOURCE_KEYS)state.resources[item]=100000;
 const occupied=new Set(layout.map(b=>key(b.x,b.z)));
 const available=[];
 for(let z=-8;z<=8;z++)for(let x=-8;x<=8;x++){
  if((x||z)&&!occupied.has(key(x,z)))available.push({x,z});
 }
 available.sort((a,b)=>Math.hypot(a.x,a.z)-Math.hypot(b.x,b.z));
 for(let i=0;i<power;i++)build('coalGenerator',available[i].x,available[i].z);
 for(const b of layout){
  if(b.type==='drill')state.terrain.ore.push({x:b.x,z:b.z});
  const placed=build(b.type,b.x,b.z,b.dir);
  if(b.type==='storage'&&b.exportItem)assert.equal(send({type:'configureWarehouse',id:placed.id,x:b.x,z:b.z,item:b.exportItem,reserve:reserve?({switchgear:18,hull:16,firebrick:10})[b.exportItem]??0:0}),null);
  if(b.type==='splitter')assert.equal(send({type:'configureLogistics',id:placed.id,x:b.x,z:b.z,program:{machine:1,forward:1,return:b.outputs===3?1:0,bypass:true,filter:'any',buffer:4}}),null);
 }
 if(swarm){
  for(let i=0;i<16;i++){
   const angle=i*Math.PI/8;
   for(const radius of [11,25,33]){
    const x=Math.round(Math.cos(angle)*radius),z=Math.round(Math.sin(angle)*radius);
    if(state.buildings.some(b=>b.x===x&&b.z===z))continue;
    const turret=build(i%3===0?'mortar':coastal&&i%2===0?'coastWatch':'gunTurret',x,z);
    for(let level=1;level<10;level++)assert.equal(send({type:'upgrade',x,z}),null);
    assert.equal(turret.level,10);
   }
  }
  for(let i=0;i<16;i++){
   const angle=i*Math.PI/8;
   for(const [radius,type] of [[15,coastal?'signalMast':'lamp'],[28,coastal?'basaltBreakwater':'wall']]){
    const x=Math.round(Math.sin(angle)*radius),z=Math.round(Math.cos(angle)*radius);
    if(!state.buildings.some(b=>b.x===x&&b.z===z))build(type,x,z);
   }
  }
 }
 for(const item of RESOURCE_KEYS)state.resources[item]=0;
 state.resources.power=0;
 // Initial raw feed deliberately belongs to the individual receiving warehouses.
 for(const b of layout){
  if(!b.feed)continue;
  const warehouse=state.buildings.find(v=>v.x===b.x&&v.z===b.z);
  warehouse.stock={[b.feed]:Math.min(200,stock)};
  state.resources[b.feed]+=warehouse.stock[b.feed];
 }
 state.resources.coal+=stock*3;
 if(swarm){state.resources.gear+=500;state.resources.coal+=750;}
 assert.ok(storageUsed(state)<=storageCapacity(state));
 updatePower(state);
 const delivered=[];
 const projectErrors=new Set();
 const outgoing=['grid','depot','shipment'];
 const samples=[];
 for(let tick=0;tick<=Math.round(950/STEP)&&state.status==='playing';tick++){
  if(tick%20===0&&projects)for(const project of outgoing){
   const error=send({type:'harborProject',project});
   if(!error)delivered.push({project,second:Math.round(state.time),wave:state.wave});
   else projectErrors.add(error.startsWith('Next shipment')?'Shipment cooling down':error);
  }
  if(tick%2000===0)samples.push({time:Math.round(state.time),generated:state.power.total,demand:state.power.used,kits:state.resources.harborKit,coal:state.resources.coal,warehouses:state.buildings.filter(b=>b.type==='storage').length});
  step(state);
 }
 const produced=Object.fromEntries(processors.map(type=>[RECIPES[type].output,state.stats.totals[RECIPES[type].output]??0]));
 return {name,time:Math.round(state.time),wave:state.wave,status:state.status,produced,stock:state.resources,delivered,samples,kills:state.totalKills,buildings:state.buildings.length,beltTiles:layout.filter(b=>b.type==='belt').length,projectErrors:[...projectErrors]};
}

const cases=[
 {name:'reference',power:3,stock:135},
 {name:'short power',power:1,stock:135},
 {name:'scarce feed',power:3,stock:28},
 {name:'no warehouse reserve',power:3,stock:135,reserve:false},
 {name:'projects off',power:3,stock:135,projects:false},
 {name:'endless swarm control',power:16,stock:165,swarm:true},
 {name:'endless swarm coastal defenses',power:16,stock:165,swarm:true,coastal:true}
];
const layout=planFactory();
const results=[];
for(const trial of cases){
 const result=runHarborFactory(trial,layout);
 results.push(result);
 console.log(JSON.stringify({name:result.name,time:result.time,wave:result.wave,kits:result.produced.harborKit,deliveries:result.delivered.length,buildings:result.buildings,status:result.status}));
}
await mkdir('work',{recursive:true});
await writeFile('work/harbor-balance.json',JSON.stringify({method:'Prepared physical factory fixture with finite raw feed, actual belts, commands and simulation',layout,results},null,2)+'\n');
