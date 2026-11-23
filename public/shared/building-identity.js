import {CONTENT} from './content.js';
// A building's trade keeps the same accent and symbol on the map and in the HUD.
export const BUILDING_IDENTITIES={
 drill:{label:'IRON DRILL',icon:'drill',accent:'#90cce5',paint:'#84b9cf',height:1.5},
 copperDrill:{label:'COPPER DRILL',icon:'drill',accent:'#edb184',paint:'#d8a078',height:1.5},
 coalMine:{label:'COAL MINE',icon:'drill',accent:'#bdc9e6',paint:'#8d9fbf',height:1.5},
 smelter:{label:'SMELTER',icon:'smelter',accent:'#f1ad83',paint:'#ce8765',height:1.62},
 assembler:{label:'GEARS',icon:'gear',accent:'#edd38b',paint:'#cdb36d',height:1.3},
 foundry:{label:'STEEL',icon:'steel',accent:'#e6aaa9',paint:'#ab939a',height:1.98},
 circuitLab:{label:'CIRCUITS',icon:'circuit',accent:'#96ddc8',paint:'#80bca8',height:1.4},
 componentFactory:{label:'COMPONENTS',icon:'module',accent:'#a6c5fa',paint:'#86a7cf',height:1.9},
 storage:{label:'WAREHOUSE',icon:'storage',accent:'#e0cfad',paint:'#c4c9b9',height:1.12},
 sawmill:{label:'TIMBER',icon:'wood',accent:'#bed69e',paint:'#a1b77c',height:1.15},
 generator:{label:'POWER',icon:'power',accent:'#f2d992',height:1.1},
 coalGenerator:{label:'COAL POWER',icon:'power',accent:'#f2d992',height:1.1}
};
Object.assign(BUILDING_IDENTITIES,CONTENT.identities,{
 basaltBreakwater:{label:'BREAKWATER',icon:'wall',accent:'#adc6d2',height:1.2},
 signalMast:{label:'SIGNAL MAST',icon:'lamp',accent:'#ebce94',height:2.45},
 coastWatch:{label:'COAST WATCH',icon:'turret',accent:'#9dbbc5',height:1.15}
});
