import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import {createExpedition,command,step,RESOURCE_KEYS} from '../public/shared/sim.js';
// Review world for multi-tile buildings: a drill field on a collector belt feeding a column of dispatch
// hubs that splits ore to 3×3 smelters on both sides, whose plates run into 5×5 warehouses.
export function footprintDemoWorld(){
 const {state,playerId}=createExpedition('Keeper',{skipTutorial:true});
 for(const r of RESOURCE_KEYS)state.resources[r]=1e6;
 const errors=[];
 const clear=(x0,z0,x1,z1)=>{for(const f of ['trees','rocks'])state.terrain[f]=state.terrain[f].filter(t=>t.x<x0||t.x>x1||t.z<z0||t.z>z1);};
 const build=(type,x,z,dir=0)=>{const e=command(state,playerId,{type:'build',building:type,x,z,dir});if(e)errors.push(`${type} ${x},${z}: ${e}`);};
 clear(-30,-18,-8,16);
 // Iron field around (-20,-11): drills either side of a northbound collector at x=-20.
 for(let x=-24;x<=-16;x++)for(let z=-15;z<=-7;z++)if(!state.terrain.ore.some(o=>o.x===x&&o.z===z))state.terrain.ore.push({x,z});
 for(const z of [-14,-11,-8]){build('drill',-22,z,0);build('drill',-18,z,2);}
 for(let z=-15;z<=-5;z++)build('belt',-20,z,1);
 // Dispatch column: a hub every three tiles sends ore left and right into smelters.
 for(const z of [-4,-1,2,5]){
  build('splitter',-20,z,1);
  if(z<5){build('belt',-20,z+1,1);build('belt',-20,z+2,1);}
  build('belt',-21,z,2);build('smelter',-23,z,2);
  build('belt',-19,z,0);build('smelter',-17,z,0);
 }
 // Plate collectors run north into warehouses.
 for(let z=-4;z<=8;z++){build('belt',-25,z,1);build('belt',-15,z,1);}
 build('storage',-25,11,1);build('storage',-15,11,1);
 // A little defence and power so the scene reads as a working colony.
 build('generator',-8,-3);build('generator',-8,1);build('turret',-28,-17);build('turret',-12,-17);
 for(let x=-27;x<=-13;x++)build('wall',x,-18);
 // Normal stock levels so shared storage has room for the factory's output.
 for(const r of Object.keys(state.resources))state.resources[r]=0;Object.assign(state.resources,{wood:150,plate:80,gear:40});
 state.paused=false;
 for(let i=0;i<420;i++)step(state);
 return {world:{state,playerId},errors};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href&&process.argv[2]){
 const {world,errors}=footprintDemoWorld();
 await writeFile(process.argv[2],JSON.stringify(world));
 const s=world.state;
 console.log(JSON.stringify({errors,buildings:s.buildings.length,loadedBelts:s.buildings.filter(b=>b.type==='belt'&&b.item).length,plates:s.resources.plate,power:s.power}));
}
