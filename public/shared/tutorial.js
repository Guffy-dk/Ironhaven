import {lighthouseHeading} from './lighthouse.js';
const drill={type:'drill',x:4,z:3,dir:3,label:'Iron drill ↑'};
const input={type:'belt',x:4,z:2,dir:3,label:'Conveyor ↑'};
const smelter={type:'smelter',x:4,z:1,dir:2,label:'Smelter ←'};
const hasBuilding=(state,tile)=>state.buildings.some(b=>b.x===tile.x&&b.z===tile.z&&b.type===tile.type&&(tile.dir===undefined||b.dir===tile.dir));

export const TUTORIAL_STEPS=[
 {title:'Move the camera',body:'Hold W, A, S or D to pan across the coast. Keep the lighthouse in view; it is your power source, shared store and survival objective.',done:state=>state.cameraTrained===true},
 {title:'Mine iron ore',body:'Press Z for Production, then 1 for the Iron drill. Point its gold output up with R and place it on the marked deposit.',tiles:[drill]},
 {title:'Feed the smelter',body:'Press V then 1 for the Conveyor. Press Z then 4 for the Smelter. Place them in the marked directions.',tiles:[input,smelter]},
 {title:'Deliver your first iron plate',body:'Press V then 1 for Conveyor. Shift-drag from the Smelter to the lighthouse and release.',done:state=>state.produced.plate>0,markers:[{x:4,z:1,label:'Start at Smelter'},{x:0,z:0,label:'End at lighthouse'}]},
 {title:'Build a gear line',body:'Place the drill, smelter and assembler on the marked tiles. Their ports line up directly so the assembler can turn plates into gears.',tiles:[{type:'drill',x:2,z:4,dir:2,label:'Iron drill ←'},{type:'smelter',x:1,z:4,dir:3,label:'Smelter ↑'},{type:'assembler',x:1,z:3,dir:3,label:'Assembler ↑'}]},
 {title:'Deliver your first gear',body:'Shift-drag a Conveyor from the Assembler to the lighthouse. The lighthouse store accepts iron plates and gears from different lines.',done:state=>state.produced.gear>0,markers:[{x:1,z:3,label:'Start at Assembler'},{x:0,z:0,label:'End at lighthouse'}]},
 {title:'Power and defend the colony',body:'Use Z for the Sawmill, C for the Generator and X for the Turret and Barricades. The sawmill runs without power. The sentry turret needs neither power nor gears.',tiles:[{type:'sawmill',x:7,z:6,label:'Sawmill'},{type:'generator',x:3,z:-2,label:'Generator'},{type:'turret',x:4,z:-3,label:'Turret'},{type:'wall',x:3,z:-4,label:'Barricade'},{type:'wall',x:4,z:-4,label:'Barricade'}]},
 {title:'Turn the lighthouse',body:'Press L or click Aim light, then click the marked tile to the east. Watch the lantern turn and the amber cone on the minimap. Escape or right-click cancels aiming; Space pauses turning.',markers:[{x:14,z:0,label:'L → click here to aim east'}],done:state=>state.tutorialAimIssued&&Math.abs(Math.atan2(Math.sin(lighthouseHeading(state.buildings.find(b=>b.type==='hq'))-Math.PI/2),Math.cos(lighthouseHeading(state.buildings.find(b=>b.type==='hq'))-Math.PI/2)))<.025},
 {title:'Expose the shell armor',body:'Aim the lighthouse at the marked Shell guard. Keep the beam on it until its armor opens. Guards take half damage in darkness. This marked practice target cannot hurt your colony.',markers:[{x:14,z:-6,label:'L → illuminate the Shell guard'}],enter:state=>practice(state,'exposure','guard',14,-6,10000),done:state=>state.enemies.some(e=>e.training==='exposure'&&e.lightExposure>=.7)},
 {title:'Give the sentry a clear shot',body:'Aim at the marked Shore runner and keep it lit. It is just beyond the sentry’s normal range: the beam gives defenses 20% extra range. Watch your sentry destroy this harmless practice target. In real swarms, runners briefly scatter from light and Drowned turn toward the lighthouse.',markers:[{x:4,z:-11,label:'L → keep the target lit for your sentry'}],enter:state=>{if(!state.tutorialDefenseStarted){practice(state,'combat','runner',4,-11.3,42);state.tutorialDefenseStarted=true;}},done:state=>state.tutorialDefenseTrained===true},
 {title:'Take command',body:'Keep the lighthouse alive through 25 swarms. Spitters arrive from swarm four: light clears their defensive mist. Every fifth swarm brings an Abyss walker; sustained light exposes it. Your industry stays in this world. Begin starts the first swarm countdown.'}
];

export function tutorialTargets(state,lesson){return lesson.tiles?.filter(tile=>!hasBuilding(state,tile))??lesson.markers??[];}
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
