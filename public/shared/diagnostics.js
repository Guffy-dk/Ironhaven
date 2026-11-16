import {RECIPES,DIRS,key,RESOURCE_KEYS,productionRecipe,productionSpeed,roundBonus,turretReload,storageCapacity,turretStats,sawmillTrees,TURRETS,usesAmmo,GENERATORS,LOGISTICS_TYPES,logisticsStatus,canAcceptItem,canShareOutput,hasOutputBuffer,outputCount,OUTPUT_CAPACITY} from './sim.js';
export const STATUS_LABELS={running:'Running',trees:'No trees in range',input:'Waiting for inputs',output:'Output blocked',buffering:'Buffering output',storage:'Storage full',power:'No power',ammo:'No ammunition',fuel:'No fuel',idle:'Operational',source:'No input conveyor',claimed:'Input conveyor already assigned',bypass:'Bypassing / filter'};
export function factoryStatus(s,b,grid){
 if(LOGISTICS_TYPES.includes(b.type))return logisticsStatus(s,b,grid);
 if(GENERATORS[b.type])return s.resources[GENERATORS[b.type].fuel]>0?'running':'fuel';
 if(!b.active)return 'power';
 if(TURRETS.includes(b.type))return !usesAmmo(b.type)||b.ammo||s.resources.gear?'running':'ammo';
 if(b.type==='sawmill')return !sawmillTrees(s.terrain,b)?'trees':s.resources.wood>=storageCapacity(s)?'storage':'running';
 if(b.item){const[dx,dz]=DIRS[b.dir],out=grid.get(key(b.x+dx,b.z+dz));if(canAcceptItem(s,out,b.item,b)||hasOutputBuffer(b.type)&&canShareOutput(b,out))return 'running';if(hasOutputBuffer(b.type)&&outputCount(b)<OUTPUT_CAPACITY)return 'buffering';if(['hq','storage','launchpad'].includes(out?.type)&&RESOURCE_KEYS.includes(b.item)&&s.resources[b.item]>=storageCapacity(s))return 'storage';return 'output';}
 if(RECIPES[b.type])return productionRecipe(b)?'running':'input';
 return hasOutputBuffer(b.type)?'running':'idle';
}
export function stockFlow(s){
 const first=s.stats.history[0],elapsed=s.time-(first?.time??s.time);
 return Object.fromEntries(RESOURCE_KEYS.map(r=>[r,elapsed>=1?((s.stats.stockFlow?.[r]??0)-(first?.stockFlow?.[r]??0))*60/elapsed:0]));
}
export function productionReport(s){
 const grid=new Map(s.buildings.map(b=>[key(b.x,b.z),b])),counts={},demand=Object.fromEntries(RESOURCE_KEYS.map(r=>[r,0])),bonus=roundBonus(s.wave);
 for(const b of s.buildings){if(usesAmmo(b.type))demand.gear+=60/turretStats(b).interval/turretReload(b,bonus);const generator=GENERATORS[b.type];if(generator)demand[generator.fuel]+=60/generator.seconds*(1+((b.level||1)-1)*.12);const status=factoryStatus(s,b,grid);counts[status]=(counts[status]||0)+1;const recipe=RECIPES[b.type];if(recipe)for(const[r,n]of Object.entries(recipe.input))if(r in demand)demand[r]+=n*60/recipe.seconds*productionSpeed(b,bonus,s.difficulty);}
 const history=s.stats?.history||[],first=history[0],last=history.at(-1),seconds=first&&last?last.time-first.time:0;
 const materials=RESOURCE_KEYS.map(r=>({resource:r,stock:s.resources[r],capacity:storageCapacity(s),perMinute:seconds>0?((last.totals[r]||0)-(first.totals[r]||0))/seconds*60:0,demand:demand[r]}));
 return{materials,counts,seconds};
}
