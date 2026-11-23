// Convert the shipped game into the data.raw view exposed to mods at startup.
export function catalogSeed({TYPES,RECIPES,GENERATORS,RESOURCE_KEYS,ITEM_KEYS},content,identities=content.identities){
 const raw={item:{},recipe:{},'assembling-machine':{},generator:{}};
 for(const name of ITEM_KEYS)raw.item[name]={type:'item',name,localised_name:content.items[name]?.name??name,color:content.items[name]?.color??'#bfcac6',stored:RESOURCE_KEYS.includes(name)};
 for(const [name,r]of Object.entries(RECIPES)){
  const b=TYPES[name],recipe=b.recipe??name;
  raw.recipe[recipe]={type:'recipe',name:recipe,ingredients:r.input,result:r.output,result_count:r.count??1,energy_required:r.seconds};
  raw['assembling-machine'][name]={type:'assembling-machine',name,localised_name:b.name,map_label:identities[name]?.label??b.name,icon:identities[name]?.icon??'module',description:b.desc,max_health:b.hp,energy_usage:b.power,ingredients:b.cost,recipe,graphics:{template:b.template??name,variant:b.variant??'workshop',color:identities[name]?.accent??'#93b8be'}};
 }
 for(const [name,g]of Object.entries(GENERATORS)){
  const b=TYPES[name];raw.generator[name]={type:'generator',name,localised_name:b.name,map_label:identities[name]?.label??b.name,icon:identities[name]?.icon??'power',description:b.desc,max_health:b.hp,ingredients:b.cost,fuel:g.fuel,power:g.power,burn_seconds:g.seconds,graphics:{template:b.template??name,variant:b.variant??'workshop',color:identities[name]?.accent??'#93b8be'}};
 }
 return raw;
}
