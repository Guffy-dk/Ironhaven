const drill={type:'drill',x:4,z:3,dir:3,label:'Iron drill ↑'};
const input={type:'belt',x:4,z:2,dir:3,label:'Conveyor ↑'};
const smelter={type:'smelter',x:4,z:1,dir:2,label:'Smelter ←'};
const hasBuilding=(state,tile)=>state.buildings.some(b=>b.x===tile.x&&b.z===tile.z&&b.type===tile.type&&(tile.dir===undefined||b.dir===tile.dir));

export const TUTORIAL_STEPS=[
 {title:'Move your engineer',body:'Hold W, A, S or D to move a few steps. Space toggles camera follow.',done:state=>{const host=state.players[0];return !!host&&Math.hypot(host.x-2,host.z-2)>=1.25;}},
 {title:'Mine iron ore',body:'Press 2 to select the Iron drill. Press R to point its gold OUT port up and place it on the marked deposit. Placement uses your starter kit.',tiles:[drill]},
 {title:'Feed the smelter',body:'Place an up-facing Conveyor (1) and a left-facing Smelter (3) on the marked tiles. The belt carries ore from gold OUT to cyan IN.',tiles:[input,smelter]},
 {title:'Deliver your first iron plate',body:'Select Conveyor (1). Hold Shift and drag from the Smelter to the core, then release. Watch the first plate reach storage.',done:state=>state.produced.plate>0,markers:[{x:4,z:1,label:'Start at Smelter'},{x:0,z:0,label:'End at core'}]},
 {title:'Build a gear line',body:'Place the drill, smelter and assembler on the marked tiles. Their ports line up directly so the assembler can turn plates into gears.',tiles:[{type:'drill',x:2,z:4,dir:2,label:'Iron drill ←'},{type:'smelter',x:1,z:4,dir:3,label:'Smelter ↑'},{type:'assembler',x:1,z:3,dir:3,label:'Assembler ↑'}]},
 {title:'Deliver your first gear',body:'Shift-drag a Conveyor from the Assembler to the core. The shared storage accepts iron plates and gears from different lines.',done:state=>state.produced.gear>0,markers:[{x:1,z:3,label:'Start at Assembler'},{x:0,z:0,label:'End at core'}]},
 {title:'Power and defend the colony',body:'Place a Sawmill near the grove, a Generator to burn wood, and a Turret behind two Barricades. The turret draws gears from colony stock.',tiles:[{type:'sawmill',x:7,z:6,label:'Sawmill (5)'},{type:'generator',x:3,z:-2,label:'Generator (6)'},{type:'turret',x:4,z:-3,label:'Turret (7)'},{type:'wall',x:3,z:-4,label:'Barricade (8)'},{type:'wall',x:4,z:-4,label:'Barricade (8)'}]},
 {title:'Take command',body:'Your factory and defenses stay in this world. The first swarm countdown starts when you begin. Expand production with the buildings left in your inventory.'}
];

export function tutorialTargets(state,lesson){return lesson.tiles?.filter(tile=>!hasBuilding(state,tile))??lesson.markers??[];}
export function advanceTutorial(state){
 const lesson=TUTORIAL_STEPS[state.tutorialStep];
 if(lesson&&(lesson.done?.(state)||lesson.tiles&&!tutorialTargets(state,lesson).length))state.tutorialStep++;
}
