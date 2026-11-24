// Versioned, deliberately smaller than Factorio's prototype API. No executable content here.
export const MOD_API='1.0';
export const STAGES=['data.lua','data-updates.lua','data-final-fixes.lua'];
export const TEMPLATES=['smelter','assembler','foundry','circuitLab','componentFactory','generator','coalGenerator'];
const safeName=s=>typeof s==='string'&&/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(s)&&!Object.hasOwn(Object.prototype,s)&&s!=='prototype';
const text=(s,label,max=500)=>{if(typeof s!=='string'||!s.trim()||s.length>max||/[<>\u0000-\u001f]/.test(s))throw Error('Invalid '+label);return s;};
const number=(n,label,min,max,integer=false)=>{if(!Number.isFinite(n)||n<min||n>max||integer&&!Number.isInteger(n))throw Error('Invalid '+label);return n;};
const entries=value=>Array.isArray(value)?value.map(v=>Array.isArray(v)?v:[v.name,v.amount]):Object.entries(value??{});
const equipmentHeights={workshop:1.7,press:2.1,finery:2.5,lathe:1.9,turbine:1.7,crusher:1.9,kiln:2,coke:2.1,alloy:2.2,kettle:1.85,cable:1.75,hull:1.8,hydraulic:2.15,switchgear:1.9,freight:1.95,harbor:2.25};
const fields={item:['type','name','localised_name','icon','color','stored'],recipe:['type','name','ingredients','result','result_count','energy_required'],'assembling-machine':['type','name','localised_name','map_label','icon','recipe','ingredients','max_health','energy_usage','graphics','description'],generator:['type','name','localised_name','map_label','icon','ingredients','max_health','graphics','description','fuel','power','burn_seconds']};
export function validateCatalog(raw){
 if(!raw||typeof raw!=='object'||Object.keys(raw).some(k=>!['item','recipe','assembling-machine','generator'].includes(k)))throw Error('Unsupported prototype type');
 const items={},buildings={},recipes={},generators={},identities={};
 let total=0;
 for(const [kind,prototypes]of Object.entries(raw))for(const [name,p]of Object.entries(prototypes)){
  if(++total>300||!safeName(name)||!p||p.name!==name||p.type!==kind)throw Error('Invalid prototype '+name);
  for(const field of Object.keys(p))if(!fields[kind].includes(field))throw Error('Unsupported '+kind+' field: '+field);
  if(p.icon!==undefined&&!safeName(p.icon))throw Error('Icons must be built-in symbolic names');
  if(p.graphics!==undefined&&(!p.graphics||typeof p.graphics!=='object'||Array.isArray(p.graphics)))throw Error('Invalid graphics definition');
  for(const field of Object.keys(p.graphics??{}))if(!['template','variant','color'].includes(field))throw Error('Unsupported graphics field: '+field);
 }
 for(const [name,p]of Object.entries(raw.item??{})){
  if(name==='power')throw Error('Power is not an item prototype');
  const label=text(p.localised_name??name,'item name',80);
  const color=p.color??'#ccd4ce';if(!/^#[\da-fA-F]{6}$/.test(color))throw Error('Invalid item color: '+name);
  items[name]={name:label,color,stored:p.stored!==false,icon:safeName(p.icon)?p.icon:'module'};
 }
 if(Object.keys(items).length>64)throw Error('At most 64 item prototypes are supported');
 function ingredients(value,label,stored=false){
  const out={};for(const [item,n]of entries(value)){
   if(!Object.hasOwn(items,item)||stored&&!items[item].stored||Object.hasOwn(out,item))throw Error('Unknown/duplicate '+label+' item: '+item);
   out[item]=number(n,label,1,1000,true);
  }return out;
 }
 for(const [name,p]of Object.entries(raw.recipe??{})){
  if(!Object.hasOwn(items,p.result))throw Error('Unknown recipe result: '+p.result);
  const input=ingredients(p.ingredients,'recipe input');if(!Object.keys(input).length)throw Error('Recipes require inputs');
  recipes[name]={input,output:p.result,count:number(p.result_count??1,'result count',1,5,true),seconds:number(p.energy_required??1,'recipe duration',.05,3600)};
 }
 for(const kind of ['assembling-machine','generator'])for(const [name,p]of Object.entries(raw[kind]??{})){
  if(Object.hasOwn(buildings,name))throw Error('Duplicate building name across prototype types: '+name);
  if(['hq','belt','drill','copperDrill','coalMine','sawmill','lamp','turret','gunTurret','mortar','pulseTurret','wall','repair','demolish','splitter','storage','basaltBreakwater','signalMast','coastWatch'].includes(name))throw Error('Unsupported building override: '+name);
  const cost=ingredients(p.ingredients,'building cost',true);if(!Object.keys(cost).length)throw Error('Buildings require a cost');
  const template=p.graphics?.template??(kind==='generator'?'coalGenerator':'assembler');if(!TEMPLATES.includes(template))throw Error('Unsupported graphics template: '+template);
  const color=p.graphics?.color??'#93b8be';if(!/^#[\da-fA-F]{6}$/.test(color))throw Error('Invalid building color');
  const variant=p.graphics?.variant??'workshop';if(!Object.hasOwn(equipmentHeights,variant))throw Error('Unsupported equipment variant');
  const label=text(p.localised_name??name,'building name',80),desc=text(p.description??'Industrial machine.','description');
  buildings[name]={name:label,hp:number(p.max_health??250,'health',1,100000,true),power:kind==='generator'?0:number(p.energy_usage??3,'power',0,1000),cost,desc,template,variant};
  if(kind==='assembling-machine'){
   if(!Object.hasOwn(recipes,p.recipe))throw Error('Unknown machine recipe: '+p.recipe);
   buildings[name].recipe=p.recipe;
  }else{
   if(!items[p.fuel]?.stored)throw Error('Unknown generator fuel');
   generators[name]={fuel:p.fuel,power:number(p.power,'generated power',1,1000),seconds:number(p.burn_seconds,'burn duration',.1,3600)};
  }
  identities[name]={label:text(p.map_label??label.toUpperCase(),'map label',32),icon:safeName(p.icon)?p.icon:'module',accent:color,paint:color,height:variant==='workshop'&&template==='foundry'?2:equipmentHeights[variant]};
 }
 for(const name of Object.keys(raw.recipe??{}))if(!Object.values(buildings).some(b=>b.recipe===name))throw Error('Recipe has no machine: '+name);
 return {items,buildings,recipes,generators,identities};
}

export function contentSignature(mods=[],baseHash='industry-1'){return baseHash+':'+mods.map(m=>`${m.name}@${m.version}:${m.hash}`).join('|');}
export function checkContent(state,mods=[],baseHash='industry-1'){
 const expected=contentSignature(mods,baseHash);
 if(state.contentSignature!==undefined&&state.contentSignature!==expected||state.contentSignature===undefined&&mods.length)throw Error('World content does not match. Restore the same enabled mods and versions before loading.');
 return expected;
}
