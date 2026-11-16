// The base building is level 1. Levels 2–11 are the ten purchased upgrades.
const COLORS=[
 '#a8b8a7','#ecaf43','#567df1','#da545f','#46c9ab','#ac71ef',
 '#a1d44c','#ea75b3','#55bded','#b8492d','#513585'
];

export function upgradeColor(level){
 return COLORS[level-1]??COLORS[0];
}
