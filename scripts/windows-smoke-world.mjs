import {establishIsland} from '../public/shared/coast.js';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {createGame,addPlayer,command,step,RESOURCE_KEYS} from '../public/shared/sim.js';
// A reproducible in-engine playtest colony for Windows renderer/startup validation.
export function smokeWorld({harbor=false}={}){
 const state=createGame(417),p=addPlayer(state,'Keeper');
 state.buildings=state.buildings.filter(b=>b.type==='hq');
 establishIsland(state);
 state.terrain.trees=state.terrain.trees.filter(t=>Math.hypot(t.x,t.z)>9);
 state.terrain.rocks=state.terrain.rocks.filter(t=>Math.hypot(t.x,t.z)>8);
 state.terrain.ore.push({x:4,z:3});state.terrain.copper.push({x:5,z:-3});state.terrain.coal.push({x:-5,z:-3});
 state.terrain.trees.push(...[[-7,-2],[-7,0],[7,-1],[7,-2],[7,0]].map(([x,z])=>({x,z,h:1.4})));
 for(const r of RESOURCE_KEYS)state.resources[r]=100000;
 const build=(type,x,z,dir=0)=>{const error=command(state,p.id,{type:'build',building:type,x,z,dir});if(error)throw Error(type+': '+error);return state.buildings.find(b=>b.x===x&&b.z===z);};
 build('copperDrill',5,-3,2);build('coalMine',-5,-3);
 build('drill',4,3,2);build('belt',3,3,2);build('smelter',2,3,3);
 build('belt',2,2,3);build('belt',2,1,2);build('belt',1,1,2);build('belt',0,1,3);
 build('assembler',-2,2,3);build('belt',-2,1,0);build('belt',-1,1,0);
 build('splitter',-1,-3);build('storage',-2,-3);build('belt',0,-3);build('belt',-1,-4,3);build('belt',-1,-2,1);
 build('storage',-3,-1);build('foundry',-2,-2);build('circuitLab',2,-2);build('componentFactory',3,-2);
 build('storage',3,-3,1);
 build('generator',-4,2);build('coalGenerator',-4,1);build('sawmill',5,-1);
 build('orePress',-4,-5);build('finery',-2,-5);build('precisionWorkshop',2,-5);build('marineGenerator',4,-5);
 build('lamp',-5,1);build('lamp',5,3);
 build('gunTurret',-1,3);build('turret',4,1);build('mortar',-3,3);
 for(const tile of [[-2,4],[-1,4],[0,4],[1,4]])build('wall',...tile);
 if(harbor){
  const types=['aggregateCrusher','firebrickKiln','cokeOven','alloyFurnace','resinKettle','cableWorks','hullYard','hydraulicWorks','switchgearShop','freightWorks','harborWorks','basaltBreakwater','signalMast','coastWatch'];
  const tiles=types.map((type,i)=>({type,x:(i%5-2)*3,z:-8-Math.floor(i/5)*3}));
  for(const field of ['trees','rocks'])state.terrain[field]=state.terrain[field].filter(tile=>!tiles.some(b=>tile.x===b.x&&tile.z===b.z));
  for(const {type,x,z} of tiles)build(type,x,z);
 }
 state.wave=25;
 for(const [x,z,levels] of [[2,3,4],[-2,-2,7],[3,-2,9],[-4,1,4],[-1,3,29],[-3,3,14]])for(let i=0;i<levels;i++){const error=command(state,p.id,{type:'upgrade',x,z});if(error)throw Error(error);}

 for(const r of RESOURCE_KEYS)state.resources[r]=35;
 state.wave=4;state.nextWave=0;step(state);
 const kinds=['runner','drowned','guard','spitter','walker'];
 state.enemies=kinds.map((kind,i)=>{const e=state.enemies.find(e=>e.kind===kind);if(!e)throw Error('Missing smoke species '+kind);return {...e,x:-4+i*2,z:6,speed:0};});
 const core=state.buildings.find(b=>b.type==='hq');core.lighthouseHeading=core.lighthouseAim=0;core.lighthouseAuto=false;
 for(const b of state.buildings)if(['turret','gunTurret','mortar','pulseTurret'].includes(b.type))b.cooldown=1000;
 step(state);state.paused=true;return {state,playerId:p.id};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2])await writeFile(process.argv[2],JSON.stringify(smokeWorld({harbor:true})));
