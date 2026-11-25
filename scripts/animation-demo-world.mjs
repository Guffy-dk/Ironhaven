import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {step,command,RESOURCE_KEYS} from '../public/shared/sim.js';
import {smokeWorld} from './windows-smoke-world.mjs';
// A running colony for reviewing presentation-only animation: loaded belts and an approaching swarm.
// Enemy stats and turret behaviour are the simulation's own; nothing here is used by gameplay.
export function animationDemoWorld(){
 const world=smokeWorld(),{state}=world;
 const template=state.enemies,p=state.players[0];
 // Two long demonstration lines south of the colony: ore → smelter → warehouse.
 for(const r of RESOURCE_KEYS)state.resources[r]=100000;
 const clear=(x,z)=>{for(const field of ['trees','rocks'])state.terrain[field]=state.terrain[field].filter(t=>t.x!==x||t.z!==z);};
 const build=(type,x,z,dir=0)=>{clear(x,z);const error=command(state,p.id,{type:'build',building:type,x,z,dir});if(error)throw Error(`${type} ${x},${z}: ${error}`);return state.buildings.find(b=>b.x===x&&b.z===z);};
 for(const [z,ore,drill] of [[6,'ore','drill'],[8,'copper','copperDrill']]){
  clear(-9,z);for(const field of ['ore','copper','coal'])state.terrain[field]=state.terrain[field].filter(t=>t.x!==-9||t.z!==z);state.terrain[ore].push({x:-9,z});const d=build(drill,-9,z,0);for(let i=0;i<7;i++)command(state,p.id,{type:'upgrade',x:d.x,z:d.z});
  for(let x=-8;x<=-4;x++)build('belt',x,z,0);
  const smelter=build('smelter',-3,z,0);for(let i=0;i<9;i++)command(state,p.id,{type:'upgrade',x:smelter.x,z:smelter.z});for(let x=-2;x<=1;x++)build('belt',x,z,0);build('storage',2,z,0);
 }
 for(const r of RESOURCE_KEYS)state.resources[r]=35;
 state.enemies=[];state.paused=false;state.nextWave=state.time+99999;
 // Let the production line run so belts carry cargo into and out of machines.
 for(let i=0;i<900;i++)step(state);
 for(let i=0;i<12;i++){const base=template[i%template.length];state.enemies.push({...base,id:state.nextId++,x:-5+i*.9,z:17+(i%3)*1.4,speed:base.kind==='walker'?.62:1});}
 // Review fixture only: sturdier hostiles keep the fight on screen long enough to see hits, lunges and falls.
 state.enemies.forEach((e,i)=>{e.maxHp=e.hp=Math.round(e.hp*(4+(i%4)*3));});
 for(const b of state.buildings)if(['turret','gunTurret','mortar','pulseTurret'].includes(b.type))b.cooldown=0;
 // The swarm starts further out because the game keeps simulating while a review capture loads.
 return world;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]){
 const world=animationDemoWorld();
 await writeFile(process.argv[2],JSON.stringify(world));
 const belts=world.state.buildings.filter(b=>b.type==='belt'&&b.item).length;
 console.log(JSON.stringify({enemies:world.state.enemies.length,loadedBelts:belts,paused:world.state.paused}));
}
