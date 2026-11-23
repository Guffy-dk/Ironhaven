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
