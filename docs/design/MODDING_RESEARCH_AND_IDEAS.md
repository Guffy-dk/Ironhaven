# Ironhaven: saved content and modding research

Status: research and ideas only. No game code, mod loader, dependencies, version or release changed for this task. The user requested a pause of 2 days and 19 hours. The scheduled resumption is **23 November 2026 at 19:45 Europe/Copenhagen** (18:45 UTC). Do not begin implementation before that time unless the user explicitly changes the instruction. Documentation and preserving ideas are allowed during the pause.

## Direction and constraints

Ironhaven is factory building with enemies. Industrial growth, automation, logistics and expansion drive progression; enemies put pressure on that industry. Do not turn the roadmap into tower defense. The proposed XP, permanent benefits and progression between maps were rejected by the user.

Preserve Windows-only distribution, existing worlds, multiplayer consistency and the realistic detailed coastal industrial direction. The user wants buildings and terrain to be easier to distinguish. The latest release restriction prohibits patcher publication without an explicit release instruction. The separate six-hour balance automation was paused at last inspection; this resumption task does not reactivate it.

## Research already verified

The official [most-downloaded catalog](https://mods.factorio.com/browse/downloaded) and content/overhaul listings identify established examples including Space Exploration, Krastorio 2 and Bob/Angel suites. This is a research shortlist, not a claim of an exhaustive or current cross-version ranking. Different Factorio versions and catalog filters change the results. Verify current primary sources again when work resumes.

| Example | Observed focus | Potential Ironhaven interpretation |
| --- | --- | --- |
| [Krastorio 2](https://mods.factorio.com/mod/Krastorio2) | More end-game technology and moderate additional complexity | Advanced industrial processes and components that open new production choices |
| [Angel's Refining](https://mods.factorio.com/mod/angelsrefining) | Ore refining before smelting/casting | Optional ore preparation that trades machinery, power and space for useful output |
| [Space Exploration](https://mods.factorio.com/mod/space-exploration) | Remote production, transport and extended progression | Coastal outposts, harbors and long-distance industrial supply objectives fitting Ironhaven |

The interpretations above are our design proposals, not features implemented in Ironhaven or recommendations endorsed by the mod authors. Investigate Bob's suites and relevant logistics mods further before selecting additional content.

Do not transplant third-party mod code or art. Angel's Refining lists CC BY-NC-ND 4.0; Space Exploration lists a Limited Distribution Only Licence. Krastorio 2 lists LGPLv3, but that alone does not establish rights to every dependent asset. Design original content, names, implementation and assets; inspect applicable licenses if any reuse is proposed.

## Content ideas to evaluate, not commitments

- Ore preparation: a distinct mechanical processing step with a genuine economic choice, rather than adding a compulsory machine solely to lengthen a chain. Avoid inflating an economy already prone to stockpiles.
- Recycling: useful recovery from scrap, with explicit net loss and power/transport costs. Prevent positive feedback loops and demolition/refund exploits.
- Advanced components: more civilian and industrial uses, so components serve factory development as well as weapons.
- Technology: unlock alternative processing and logistics options through in-world industry. No permanent cross-map XP tree.
- Coastal logistics: harbors, remote deposits and supply routes that give expansion purpose. Do not add a space theme just because a popular reference uses one.
- Production tools: clearer bottleneck explanations, recipe/throughput information and understandable dispatch configuration. Keep physical warehouse withdrawals local.

First choose a coherent, playable production slice with uses for every intermediate. Do not add all systems at once. Test normal earned-resource play, multiple strategies, transport capacity, power demand and save compatibility.

## Factorio modding: observed structure

Primary references:

- [Mod structure](https://lua-api.factorio.com/latest/auxiliary/mod-structure.html)
- [Data lifecycle](https://lua-api.factorio.com/latest/auxiliary/data-lifecycle.html)
- [Runtime reference](https://lua-api.factorio.com/latest/index-runtime.html)

Factorio mods use `info.json` metadata, dependencies and Lua. Prototype stages execute `data.lua`, then `data-updates.lua`, then `data-final-fixes.lua`, ordered across active mods. Runtime behavior is separate in `control.lua`. Settings have their own stages. Actual APIs are provided by Factorio's engine.

The requested Ironhaven direction is a familiar authoring workflow: manifests, dependency resolution, Lua `data:extend`, mutable `data.raw`, clear prototype definitions and load stages. This is not an assertion that Factorio mods or Factorio's runtime API will work unchanged in Ironhaven. Document the supported subset and reject unsupported entry points explicitly.

Implementation questions to resolve after the pause:

1. Select and inspect a real Lua runtime suitable for the sandboxed Windows Electron distribution, with its license, deterministic execution and instruction/memory limits considered. Do not rename JSON files to `.lua` and call it Lua compatibility.
2. Define stable item, recipe and building prototypes and migrate existing base content to the same registry where appropriate. Custom machines must work in simulation, placement, UI, rendering, storage and transport.
3. Design deterministic dependencies, load stages and transactional validation with useful errors; failed mods must not leave half-modified base definitions.
4. Define user mod location, enable/disable behavior and restart semantics in Windows. Preserve Electron sandboxing and prevent arbitrary filesystem/network access by mod scripts.
5. Bind saves and co-op sessions to mod IDs, versions and content fingerprints. Detect missing/mismatched mods before loading a world. Do not silently drop modded buildings or items.
6. Provide a documented example mod that actually adds a useful item, recipe and machine without source-code edits. Test the installed game's loading path, not only a development compiler.
7. Treat runtime events, mod state, migrations, settings, locales, custom assets and ZIP loading as explicit capabilities; specify what is implemented and what remains future work.

## Handoff

At the pause, existing base content is largely hardcoded in `public/shared/sim.js`; the toolbar is in `public/app.js`. Saves are validated in `public/shared/saves.js`. The sandboxed Electron host is `desktop/game.cjs`, packaged by `scripts/build-windows.ps1`. Check the actual current checkout before implementation. Existing `.agents/` and root `AGENTS.md` were already untracked before this research; do not discard or mistake them for new gameplay changes.

An independent one-time automation contains this research summary and the deferred task, so the intent survives even if this local documentation is not present in a later checkout. No public release or code implementation has been performed.
