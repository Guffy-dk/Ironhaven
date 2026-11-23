-- Original Ironhaven content. No Factorio mod code or graphics are included.
data:extend({
 {type="item", name="concentrate", localised_name="Iron concentrate", icon="ore", color="#8faebc"},
 {type="item", name="bearing", localised_name="Precision bearings", icon="gear", color="#e2cd91"},
 {type="recipe", name="ore-pressing", ingredients={{"ore",2}}, result="concentrate", energy_required=4},
 {type="recipe", name="coal-fining", ingredients={{"concentrate",1},{"coal",1}}, result="plate", result_count=3, energy_required=5},
 {type="recipe", name="precision-bearings", ingredients={{"steel",2},{"copper",1}}, result="bearing", energy_required=6},
 {type="assembling-machine", name="orePress", localised_name="Ore press", map_label="ORE PRESS", icon="drill",
  max_health=300, energy_usage=5, ingredients={{"plate",40},{"gear",10},{"steel",5}}, recipe="ore-pressing",
  graphics={template="assembler", variant="press", color="#97b7ce"},
  description="Compacts two iron ore into one concentrate in four seconds. Send concentrate and coal to a finery for three plates. A larger powered chain recovers more iron from each ore."},
 {type="assembling-machine", name="finery", localised_name="Coal finery", map_label="FINERY", icon="smelter",
  max_health=340, energy_usage=7, ingredients={{"steel",15},{"gear",8},{"module",2}}, recipe="coal-fining",
  graphics={template="foundry", variant="finery", color="#ce966f"},
  description="Turns one concentrate and one coal into three plates in five seconds. This optional route yields 50% more plates per ore, but needs coal, more power, extra machines and more transport."},
 {type="assembling-machine", name="precisionWorkshop", localised_name="Precision workshop", map_label="BEARINGS", icon="gear",
  max_health=280, energy_usage=6, ingredients={{"plate",35},{"circuit",8},{"module",3}}, recipe="precision-bearings",
  graphics={template="circuitLab", variant="lathe", color="#96c7b3"},
  description="Machines two steel and one copper into a precision bearing in six seconds. Bearings and components build marine generators; this chain supports industrial power rather than ammunition."},
 {type="generator", name="marineGenerator", localised_name="Marine generator", map_label="MARINE POWER", icon="power",
  max_health=380, ingredients={{"steel",25},{"bearing",8},{"module",6}}, fuel="coal", power=54, burn_seconds=16,
  graphics={template="coalGenerator", variant="turbine", color="#9bbac9"},
  description="A bearing-mounted marine engine supplies 54 power and burns one coal every 16 seconds. It uses the same fuel as a coal generator, but requires precision bearings and components to build."}
})

-- Harbor supply starts with bulk materials and ends in deliveries to the colony.
local materials = {
  {"aggregate", "Mineral aggregate", "ore", "#aca89a"},
  {"firebrick", "Firebrick", "plate", "#c38970"},
  {"coke", "Foundry coke", "coal", "#8a8792"},
  {"alloy", "Marine alloy", "steel", "#a3bdc9"},
  {"resin", "Sealant resin", "wood", "#d9b07a"},
  {"cable", "Insulated cable", "circuit", "#d8a373"},
  {"hull", "Hull panels", "steel", "#829dbc"},
  {"hydraulics", "Hydraulic drives", "gear", "#adcac5"},
  {"switchgear", "Switchgear", "circuit", "#a5c08f"},
  {"freightFrame", "Freight frames", "storage", "#c6b58d"},
  {"harborKit", "Harbor equipment", "module", "#ddc287"}
}
for _, item in ipairs(materials) do
  data:extend({{type="item", name=item[1], localised_name=item[2], icon=item[3], color=item[4]}})
end

local function machine(name, label, map_label, icon, color, template, variant, cost, power, seconds, ingredients, result, count, description)
  local recipe = "harbor-" .. name
  data:extend({
    {type="recipe", name=recipe, ingredients=ingredients, result=result, result_count=count, energy_required=seconds},
    {type="assembling-machine", name=name, localised_name=label, map_label=map_label, icon=icon,
      max_health=300, energy_usage=power, ingredients=cost, recipe=recipe,
      graphics={template=template, variant=variant, color=color}, description=description}
  })
end

machine("aggregateCrusher", "Aggregate crusher", "CRUSHER", "ore", "#abb8b7", "assembler", "crusher",
  {plate=18,gear=4}, 3, 3, {ore=1}, "aggregate", 2,
  "Crushes raw iron ore into construction aggregate. Turn a separate drill toward the crusher to supply a brick kiln.")
machine("firebrickKiln", "Firebrick kiln", "BRICK KILN", "smelter", "#c3886e", "smelter", "kiln",
  {plate=20,gear=4}, 3, 4, {aggregate=2,coal=1}, "firebrick", 3,
  "Fires aggregate into heat-resistant bricks. Supply switchgear shops, harbor resupply shipments and breakwaters.")
machine("cokeOven", "Coke oven", "COKE OVEN", "coal", "#9f9ca7", "foundry", "coke",
  {plate=20,steel=4}, 3, 4, {coal=2}, "coke", 2,
  "Prepares foundry coke from coal. Leave enough coal on the fuel line for your generators.")
machine("alloyFurnace", "Alloy furnace", "ALLOY", "steel", "#a2b8cd", "foundry", "alloy",
  {plate=24,steel=7,gear=6}, 5, 6, {concentrate=1,coke=1,copper=1}, "alloy", 2,
  "Uses iron concentrate, coke and copper to make marine alloy. This gives the ore press a second outlet beyond iron plates.")
machine("resinKettle", "Resin kettle", "RESIN", "wood", "#c8a474", "smelter", "kettle",
  {plate=20,gear=4}, 3, 4, {wood=3,coal=1}, "resin", 3,
  "Cooks timber and coal into sealant. Deliver timber through a warehouse output and split the sealant between cable and hull production.")
machine("cableWorks", "Cable works", "CABLE", "gear", "#d19974", "assembler", "cable",
  {plate=24,gear=6}, 4, 5, {copper=2,resin=1}, "cable", 2,
  "Insulates copper cable for switchgear and coastal lamps.")
machine("hullYard", "Hull yard", "HULL PANELS", "steel", "#8da4c4", "assembler", "hull",
  {plate=24,steel=6,gear=6}, 4, 5, {alloy=2,resin=1}, "hull", 2,
  "Seals sheets of marine alloy into hull panels. Panels reinforce breakwaters, dock storage and freight frames.")
machine("hydraulicWorks", "Hydraulic works", "HYDRAULICS", "gear", "#a9c7bd", "componentFactory", "hydraulic",
  {plate=28,steel=8,circuit=4}, 5, 6, {bearing=1,hull=1,gear=1}, "hydraulics", 2,
  "Assembles bearing-mounted hydraulic drives for freight frames. Supply bearings from a precision workshop.")
machine("switchgearShop", "Switchgear shop", "SWITCHGEAR", "circuit", "#aac195", "circuitLab", "switchgear",
  {plate=28,steel=8,circuit=4}, 5, 6, {cable=2,firebrick=1,circuit=1}, "switchgear", 2,
  "Builds insulated switchgear for harbor equipment, grid projects and coastal lamps.")
machine("freightWorks", "Freight works", "FREIGHT FRAMES", "storage", "#c2af87", "assembler", "freight",
  {plate=30,steel=10,module=2}, 6, 8, {hydraulics=1,plate=3}, "freightFrame", 2,
  "Joins iron plates and hydraulic drives into freight frames for the Harbor Works.")
machine("harborWorks", "Harbor Works", "HARBOR WORKS", "module", "#dbbf8b", "componentFactory", "harbor",
  {plate=36,steel=12,module=3}, 7, 10, {freightFrame=1,switchgear=1,module=1}, "harborKit", 2,
  "Builds Harbor Equipment. Deliver it to shared storage, then select the lighthouse to expand power and storage or order repeat resupply shipments.")
