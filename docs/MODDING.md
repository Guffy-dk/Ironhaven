# Ironhaven modding API 1.0

Internal preview 0.20.3.1. Windows x64 remains the player platform. Mods use real Lua through the MIT-licensed Fengari 0.1.5 VM (Lua 5.3 semantics). Factorio uses its own modified Lua/API: this is a **familiar data-stage workflow, not compatibility with Factorio mods**. No Factorio code or assets ship with the SDK.

## Install and enable a folder mod

Close the game. Copy the provided `Modding/mods/harbor-machining` example folder into `%APPDATA%/Ironhaven/mods/harbor-machining`. On Windows this is the game's Electron user-data directory, not the installation's `resources` folder. Startup creates `mods` if absent. Create `mods/mod-list.json`:

```json
{"mods":[{"name":"harbor-machining","enabled":true}]}
```

Restart the game. Help → field guide shows enabled mod names/versions; Mods (K) contains the fitting shop and harbor bearing shop. An invalid enabled mod stops startup with an error; the game does not silently load a partly modified world. Fix the mod or set its entry to `false`, then restart. Keep backups: a world saved with mods needs precisely those enabled versions/files on reload. Disabling a mod does not safely remove its buildings/items from an existing world.

No download service, Steam Workshop, automatic dependency installation or in-game mod manager is included yet. Folder names must equal manifest names (unversioned); ZIP archives and symlinks are unsupported. Files outside enabled mod folders are not loaded. Unlisted folders are disabled.

## Layout and stages

```text
harbor-machining/
  info.json
  data.lua
  data-updates.lua
  data-final-fixes.lua
  prototypes/machining.lua
```

Manifest fields:

```json
{
  "name":"harbor-machining",
  "version":"1.0.0",
  "title":"Harbor Machining",
  "author":"Your name",
  "ironhaven_version":"0.20",
  "mod_api":"1.0",
  "dependencies":["base >= 0.20.2"]
}
```

Names are case-sensitive ASCII letters/digits/`-`/`_`; use a unique prefix for your prototypes. Versions have three numeric components. `base` represents the shipped game. Dependencies support required names, `? optional-name`, `! conflicting-name` and `=`, `<`, `<=`, `>`, `>=` version comparisons. Missing required dependencies, duplicates, conflicts, cycles and unsupported API/game series are errors. Dependencies load first; unrelated names sort lexically. This differs from some Factorio ordering details.

All enabled mods run `data.lua` in dependency order, then all run `data-updates.lua`, then all run `data-final-fixes.lua`, in one data-stage state. `data.raw[type][name]` exposes the shipped items, recipe machines and generators plus new registrations. `data:extend({...})` adds prototypes; duplicate registration fails. Change a supported existing recipe/machine prototype through `data.raw`, or use `table.deepcopy` to make a new one. Existing core item display labels/icons/colors retain their engine presentation; new item prototypes use the supplied presentation fields. The smelter's automatic copper route remains engine-defined; `data.raw.recipe.smelter` describes its iron route. Removing shipped prototypes is unsupported.

`require("prototypes.machining")` loads `prototypes/machining.lua` inside the current mod, caches its return value and returns `true` if it returns nothing. Parent traversal, cross-mod requires, native libraries and package search paths are unsupported. Prefer declarative module tables and explicit dependencies.

## Supported prototypes

All prototype keys below are **Ironhaven's API**, even when the convention resembles Factorio. Unknown engine features cannot be enabled by adding Factorio fields.

```lua
data:extend({
 {type="item", name="my-fitting", localised_name="My fitting",
  icon="gear", color="#c9a16d"},
 {type="recipe", name="my-fitting", ingredients={{"copper",2},{"plate",1}},
  result="my-fitting", result_count=1, energy_required=4},
 {type="assembling-machine", name="my-fitting-shop",
  localised_name="My fitting shop", map_label="FITTINGS", icon="gear",
  recipe="my-fitting", ingredients={{"plate",30},{"gear",8}},
  max_health=250, energy_usage=4,
  graphics={template="assembler", variant="lathe", color="#c9a16d"},
  description="Makes fittings from copper and plates. Connect physical inputs and output."}
})
```

- `item`: `name`, string `localised_name`, hex `color`, built-in icon name. Stored items participate in shared capacity, physical warehouse stock, exports, construction, resource display and reports. `stored=false` is for transport-only items; building costs and generator fuel must use stored items.
- `recipe`: `ingredients` as item/count pairs or an item/count object, one `result`, integer `result_count` 1–5 and `energy_required` seconds. At least one input and a using machine are required. Inputs and result must exist. Results wait for enough output-buffer room; no partial output or duplicated inputs.
- `assembling-machine`: one fixed `recipe`, construction `ingredients`, `max_health`, numeric `energy_usage`, description and presentation fields. It uses normal ports, power allocation, upgrade speed, movement, inventory, damage, saves and transport. Crafting-category recipe selection, fluids, multi-result/byproduct recipes and arbitrary behaviors are not implemented.
- `generator`: construction/presentation fields, `fuel`, `power`, `burn_seconds`. Uses ordinary global fuel accounting and generator upgrades. Recipes are not applicable.

Available graphics templates: `smelter`, `assembler`, `foundry`, `circuitLab`, `componentFactory`, `generator`, `coalGenerator`. Equipment variants: `workshop`, `press`, `finery`, `lathe`, `turbine`. They reuse authored Ironhaven geometry plus equipment; `color` drives the map/HUD identity. External models, textures and sounds are not imported by this API version. A color declaration is not a new model.

Limits include 32 active mods, 64 total items, 300 total prototypes, 128 KiB per source file, 2 MiB total enabled source, bounded table depth/size and recipe/cost numeric ranges. The compiler has an instruction budget, five-second worker deadline and worker heap limits. These bound practical failures; they are not an unlimited arbitrary-code platform.

## Isolation, saves and co-op

Lua runs only at startup in a separate bounded compiler worker. Mods receive no Node/Electron object, filesystem, shell, network, `os`, `io`, `debug`, package loader or random source. Some standard Lua functions are intentionally disabled, including dynamic code loading, protected calls, string repetition/formatting and bytecode dumping. Bytecode chunks are rejected. Definition changes are validated before the renderer receives data; failure leaves the base game definitions intact.

Runtime `control.lua`, `script.on_event`, persistent runtime `storage`, settings stages, locale files and migrations are **not implemented**. Enabled `control.lua` or `settings*.lua` is an explicit startup error. Do not ship these files expecting them to work. Runtime scripting needs a later API version with deterministic host events, saved state and migration rules.

World saves carry a content signature. Legacy unmodded saves migrate into the new built-in content with zero new materials and preserve existing goods. Worlds created with mods require the same mod IDs, versions and source/manifest hashes. LAN invitation/answer codes check the content signature before connection. Everyone must install the same files; there is no automatic mod transfer. Changing mod content can require restoring that exact mod version or starting a new world. No destructive force-load mode is provided.

## Develop and test

The repository includes editable original built-in Lua at `content/industry/data.lua`, the example under `examples/mods/harbor-machining`, compiler `sdk/lua-mods.mjs`, shared validation `public/shared/mod-catalog.js`, and Windows folder/worker loading in `desktop/mod-loader.cjs`. `npm run build` recompiles the built-in catalog and creates `release/mod-base.json` plus `release/mod-worker.cjs` for packaging. `public/shared/industry-catalog.json` is the checked-in generated runtime snapshot; edit Lua and rebuild, not that snapshot by hand.

```sh
npm ci
npm test
npm run build
# Windows packaging and native startup validation:
# ./scripts/build-windows.ps1
```

The SDK tests exercise actual Lua stages/modules, dependency failure, instruction limits, the folder loader, worker compilation and a modded production/save/LAN flow. Unit fixtures may inject materials to isolate accounting; they are not earned-resource playthroughs. Native Windows verification is a separate check. Keep license/provenance for any content you distribute.
