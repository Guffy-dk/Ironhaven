const drill={type:'drill',x:4,z:3,dir:3,label:'Iron drill ↑'};
const input={type:'belt',x:4,z:2,dir:3,label:'Conveyor ↑'};
const smelter={type:'smelter',x:4,z:1,dir:2,label:'Smelter ←'};
const hasBuilding=(state,tile)=>state.buildings.some(b=>b.x===tile.x&&b.z===tile.z&&b.type===tile.type&&(tile.dir===undefined||b.dir===tile.dir));

export const TUTORIAL_STEPS=[
 {title:'Move the camera',body:'Hold W, A, S or D to pan across the colony.',done:state=>state.cameraTrained===true},
 {title:'Mine iron ore',body:'Press Z for Production, then 1 for the Iron drill. Point its gold output up with R and place it on the marked deposit.',tiles:[drill]},
 {title:'Feed the smelter',body:'Press V then 1 for the Conveyor. Press Z then 4 for the Smelter. Place them in the marked directions.',tiles:[input,smelter]},
 {title:'Deliver your first iron plate',body:'Press V then 1 for Conveyor. Shift-drag from the Smelter to the core and release.',done:state=>state.produced.plate>0,markers:[{x:4,z:1,label:'Start at Smelter'},{x:0,z:0,label:'End at core'}]},
 {title:'Build a gear line',body:'Place the drill, smelter and assembler on the marked tiles. Their ports line up directly so the assembler can turn plates into gears.',tiles:[{type:'drill',x:2,z:4,dir:2,label:'Iron drill ←'},{type:'smelter',x:1,z:4,dir:3,label:'Smelter ↑'},{type:'assembler',x:1,z:3,dir:3,label:'Assembler ↑'}]},
 {title:'Deliver your first gear',body:'Shift-drag a Conveyor from the Assembler to the core. The shared storage accepts iron plates and gears from different lines.',done:state=>state.produced.gear>0,markers:[{x:1,z:3,label:'Start at Assembler'},{x:0,z:0,label:'End at core'}]},
 {title:'Power and defend the colony',body:'Use Z for the Sawmill, C for the Generator and X for the Turret and Barricades. The sawmill runs without power. The sentry turret needs neither power nor gears.',tiles:[{type:'sawmill',x:7,z:6,label:'Sawmill'},{type:'generator',x:3,z:-2,label:'Generator'},{type:'turret',x:4,z:-3,label:'Turret'},{type:'wall',x:3,z:-4,label:'Barricade'},{type:'wall',x:4,z:-4,label:'Barricade'}]},
 {title:'Take command',body:'Your factory and defenses stay in this world. The first swarm countdown starts when you begin. Expand production with the buildings left in your inventory.'}
];

export function tutorialTargets(state,lesson){return lesson.tiles?.filter(tile=>!hasBuilding(state,tile))??lesson.markers??[];}
export function advanceTutorial(state){
 const lesson=TUTORIAL_STEPS[state.tutorialStep];
 if(lesson&&(lesson.done?.(state)||lesson.tiles&&!tutorialTargets(state,lesson).length))state.tutorialStep++;
}
