data:extend({
 {type="item", name="bronze-fitting", localised_name="Bronze fitting", color="#c9a16d", icon="gear"},
 {type="recipe", name="bronze-fitting", ingredients={{"copper",2},{"plate",1}}, result="bronze-fitting", energy_required=4},
 {type="recipe", name="harbor-bearing", ingredients={{"bronze-fitting",1},{"steel",1}}, result="bearing", energy_required=5},
 {type="assembling-machine", name="fitting-shop", localised_name="Fitting shop", icon="gear",
  recipe="bronze-fitting", ingredients={{"plate",30},{"gear",8}}, energy_usage=4,
  graphics={template="assembler", variant="lathe", color="#c9a16d"},
  description="Forms two copper and one plate into a bronze fitting. Example mod: deliver fittings to a harbor bearing shop."},
 {type="assembling-machine", name="harbor-bearing-shop", localised_name="Harbor bearing shop", icon="gear",
  recipe="harbor-bearing", ingredients={{"steel",10},{"module",2}}, energy_usage=5,
  graphics={template="circuitLab", variant="lathe", color="#b2c9a1"},
  description="Makes a bearing from one bronze fitting and one steel. Uses less steel than the standard precision workshop, with a longer upstream copper chain."}
})
