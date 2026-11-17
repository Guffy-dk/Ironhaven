import {lighthouseHeading} from './lighthouse.js';
const drill={type:'drill',x:4,z:3,dir:3,label:'Iron drill ↑'};
const input={type:'belt',x:4,z:2,dir:3,label:'Conveyor ↑'};
const smelter={type:'smelter',x:4,z:1,dir:2,label:'Smelter ←'};
const hasBuilding=(state,tile)=>state.buildings.some(b=>b.x===tile.x&&b.z===tile.z&&b.type===tile.type&&(tile.dir===undefined||b.dir===tile.dir));

export const TUTORIAL_STEPS=[
 {title:'Move the camera',body:"Hold WASD or the arrow keys to move the camera. The lighthouse is your main store and power source. Camera speed can be changed in Escape → Settings → Controls.",done:state=>state.cameraTrained===true},
 {title:'Mine iron ore',body:"Press Z, then 1 to select an Iron drill. Use R to point its gold output upward, then place it on the marked iron deposit.",tiles:[drill]},
 {title:'Feed the smelter',body:"Press V, then 1 for a conveyor. Press Z, then 4 for a smelter. Build both on the marked tiles, with the arrows shown.",tiles:[input,smelter]},
 {title:'Deliver your first iron plate',body:"Press V, then 1. Hold Shift and drag from the smelter to the lighthouse. Release to build the conveyor route.",done:state=>state.produced.plate>0,markers:[{x:4,z:1,label:'Start at Smelter'},{x:0,z:0,atLighthouse:true,label:'End at lighthouse'}]},
 {title:'Build a gear line',body:"Build the drill, smelter and assembler on the marked tiles. The smelter supplies plates directly to the assembler, which turns them into gears.",tiles:[{type:'drill',x:2,z:4,dir:2,label:'Iron drill ←'},{type:'smelter',x:1,z:4,dir:3,label:'Smelter ↑'},{type:'assembler',x:1,z:3,dir:3,label:'Assembler ↑'}]},
 {title:'Deliver your first gear',body:"Shift-drag a conveyor route from the assembler to the lighthouse. Deliveries to a warehouse or the lighthouse are available immediately for construction and ammunition.",done:state=>state.produced.gear>0,markers:[{x:1,z:3,label:'Start at Assembler'},{x:0,z:0,atLighthouse:true,label:'End at lighthouse'}]},
 {title:'Power and defend the colony',body:"Build the marked sawmill, generator, lamp, sentry and barricades. The lamp lights six tiles and uses 3 power. Keep it behind your defenses: enemies can destroy it. The sawmill and sentry need no power.",tiles:[{type:'sawmill',x:7,z:6,label:'Sawmill'},{type:'generator',x:3,z:-2,label:'Generator'},{type:'lamp',x:6,z:-2,label:'Harbor lamp · C then 3'},{type:'turret',x:4,z:-3,label:'Turret'},{type:'wall',x:3,z:-4,label:'Barricade'},{type:'wall',x:4,z:-4,label:'Barricade'}]},
 {title:'Turn the lighthouse',body:"Press L, then click the marked tile. Watch the beam turn on the minimap. Manual aiming overrides automatic tracking; Resume auto light switches it back. Escape cancels aiming.",markers:[{x:14,z:0,label:'L → click here to set the bearing'}],done:state=>state.tutorialAimIssued&&Math.abs(Math.atan2(Math.sin(lighthouseHeading(state.buildings.find(b=>b.type==='hq'))-Math.atan2(14-state.buildings.find(b=>b.type==='hq').x,-state.buildings.find(b=>b.type==='hq').z)),Math.cos(lighthouseHeading(state.buildings.find(b=>b.type==='hq'))-Math.atan2(14-state.buildings.find(b=>b.type==='hq').x,-state.buildings.find(b=>b.type==='hq').z))))<.025},
 {title:'Expose the shell armor',body:"Keep the lighthouse beam on the marked Shell guard until its armor opens. In darkness it takes half damage. This practice target cannot attack.",markers:[{x:14,z:-6,label:'L → illuminate the Shell guard'}],enter:state=>practice(state,'exposure','guard',14,-6,10000),done:state=>state.enemies.some(e=>e.training==='exposure'&&e.lightExposure>=.7)},
 {title:'Give the sentry a clear shot',body:"Keep the marked runner lit so your sentry can reach it. Light extends targeting range by 20%. Rebuild the sentry at the marker if needed. This practice target cannot attack.",tiles:[{type:'turret',x:4,z:-3,label:'Rebuild sentry here if missing'}],markers:[{x:4,z:-11,label:'L → keep the target lit for your sentry'}],enter:state=>{if(!state.tutorialDefenseStarted){practice(state,'combat','runner',4,-11.3,42);state.tutorialDefenseStarted=true;}},done:state=>state.tutorialDefenseTrained===true&&hasBuilding(state,{type:'turret',x:4,z:-3})},
 {title:'Take command',body:"Survive 25 swarms while keeping the lighthouse standing. Fog spitters arrive from swarm four; an Abyss walker joins every fifth swarm. Light clears spitter mist and exposes armor. Begin expedition starts the countdown and restores automatic light tracking."}
];

export function tutorialTargets(state,lesson){return [...(lesson.tiles?.filter(tile=>!hasBuilding(state,tile))??[]),...(lesson.markers??[])].map(target=>target.atLighthouse?{...target,...(({x,z})=>({x,z}))(state.buildings.find(b=>b.type==='hq'))}:target);}
export function advanceTutorial(state){
 const lesson=TUTORIAL_STEPS[state.tutorialStep];
 lesson?.enter?.(state);
 if(lesson&&(lesson.done?.(state)||lesson.tiles&&!tutorialTargets(state,lesson).length)){
  state.enemies=state.enemies.filter(e=>!e.training);state.tutorialStep++;
 }
}

function practice(state,training,kind,x,z,hp){
 if(state.enemies.some(e=>e.training===training))return;
 state.enemies.push({id:state.nextId++,training,kind,x,z,hp,maxHp:hp,speed:0,damage:0,cooldown:0});
 // Clear this isolated training sightline; do not clear nearby production groves.
 state.terrain.trees=state.terrain.trees.filter(t=>Math.hypot(t.x-x,t.z-z)>1);
}
