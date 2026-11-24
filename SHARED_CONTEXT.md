# Ironhaven — shared project brain

**Read this first. Keep it current.** This is the common durable memory for the owner, Codex, Claude Code and future contributors. It records decisions, verified implementation, unresolved problems and handoffs. It is not an automatically synchronized chat transcript.

Last reconciled: **24 November 2026**, Europe/Copenhagen. Harbor expansion and Lua modding are on `main` via [PR #28](https://github.com/Guffy-dk/Ironhaven/pull/28). Final gameplay tuning was checked at `ad4e6cb`. The owner chose **0.21.1** and authorized its patcher release, using the unchanged three-part patcher format. The public release [v0.21.1](https://github.com/Guffy-dk/Ironhaven/releases/tag/v0.21.1) is latest and its source is `26d3340`. See the November 24 entry for verification.

Repository: **[Guffy-dk/Ironhaven](https://github.com/Guffy-dk/Ironhaven)**. Owner: Guffy. Stealth is the owner's experienced factory-game playtester; his usability and balance reports are important player evidence. The owner generally communicates in Danish. The game's player-facing language is English.

## 1. Shared-memory contract

Both agents must follow this routine; neither agent needs access to the other's private chats.

1. Before work, read this file, `AGENTS.md` or `CLAUDE.md`, relevant code and the newest linked reports. Check the current date, branch, commit, `git status`, remote changes and ongoing work. Fetch/pull or otherwise reconcile safely; never overwrite someone else's local work.
2. Treat the owner's latest explicit instruction as authoritative. Record new decisions here with their origin and status. Distinguish **owner decision**, **implemented**, **verified**, **proposal**, **rejected**, **historical** and **blocked**. Do not silently promote a suggestion into an agreed feature.
3. Before overlapping changes, leave a dated work entry with branch, scope and status. An entry is coordination information, not a technical lock; verify the actual repository/PR state.
4. After meaningful work, update the relevant current-state sections and add a concise decision/work-log entry: author/tool, reason, files/branch, commit when known, tests actually run, results/limitations and next step. Link detailed reports instead of dumping raw logs here. Do not claim a test, screenshot, push or release that did not happen.
5. Include shared-memory updates in the same commit/PR as the associated change. Push to GitHub so other checkouts can see them. Local uncommitted edits are not automatically visible to another agent; a branch commit is not on `main` until merged. If blocked from pushing, state that explicitly.
6. When another agent resumes, reconcile the latest GitHub version, preserve other contributions and correct obsolete summaries. Do not replace this file with a shortened handoff that loses standing decisions. Keep superseded decisions identified rather than silently forgetting why they changed.
7. Never put credentials, tokens, private keys, personal account data, raw player saves or unrelated automation contents here. Reference secret variable names or authorized settings only. This document records project knowledge, not private reasoning traces.

### Precedence and contradictory historical notes

Newest owner instructions take precedence over this document; this document records the current reconciliation; code establishes what is implemented, not necessarily what the owner wants. Older handoffs are historical references. In particular, `docs/PROJECT_HANDOFF.md` describes browser releases, old version rules, evacuation and transfer relays that are no longer the current direction. Do not implement those merely because they appear there. Some older art/playtest notes describe Roman UI levels; current UI levels use ordinary numbers.

## 2. Current stop conditions and release authority

- **Implementation pause expired:** the requested deadline was **23 November 2026, 19:45 Europe/Copenhagen (18:45 UTC)**. The clock was checked at 18:46 UTC before work resumed. A later owner pause would still override this authorization.
- **No patcher release without an explicit release request.** Earlier broad release permission was superseded in the current balance-agent mandate. The owner authorized the 0.21.1 release specifically. Subsequent public tags, published releases, latest promotion and public patcher-manifest changes still require an explicit owner request. Updating documentation in GitHub is authorized and is not a game release.
- **Version policy.** The owner chose public 0.21.1, superseding the earlier 0.20 ceiling, and kept the existing patcher. Public versions and npm versions have three components. Internal iteration IDs may be recorded separately in reports and artifacts. Follow the latest owner instruction for subsequent version changes.
- Outside the pause, the owner has authorized autonomous routine improvements to storage, resource flow, light slow, movement, scaling, upgrades, progression and map size; previous numeric choices are not permanently locked. Validate changes and preserve compatibility. Do not repeatedly request permission for choices already authorized.
- Paid external generation is separate: do not spend on provider jobs without an authorized invocation and budget. Never ask for a secret in chat.

## 3. Product identity and accepted direction

**Ironhaven is factory building with enemies, not tower defence.** Build the factory, automate physical production/logistics, expand the colony and develop technology. Enemies put pressure on the industry and its expansion. Defense consumes and protects industrial capacity; it must not become the entire progression loop.

The five named inspirations are **Factorio, Desynced, They Are Billions, Conan Unconquered and Colony Survival**. Use them to understand the audience and research relevant player feedback. Borrow suitable ideas, not an unrelated collection of mechanics or third-party assets. Keep Ironhaven's coastal island, industrial colony and lighthouse identity.

Accepted priorities:

- Clear production chains, usable physical logistics and meaningful automation.
- Meaningful choices, new uses for advanced materials, expansion and later-game goals; avoid maxing everything early and simply waiting.
- Several viable industrial/defense strategies. One fully upgraded turret must not trivialize the game or one-shot every late enemy.
- A normal **25-swarm campaign** on all difficulties, with a victory screen and an **explicit optional Continue endlessly** choice. Only after that choice does the same colony continue without a fixed final swarm. Preserve victory/rewards and existing worlds. An earlier local candidate called `0.20.2.1` removed the victory stop; that behavior was rejected and is not the accepted baseline.
- Long-term content matters more than a fixed number of hours. The older wish for 20+ hour sessions is **not a mandatory survival/playtime target** under the latest recorded mandate. Long horizons can still be stress tests.
- **Windows x64 only for players.** No browser release or separate Node/server installation required for normal players. Linux/Chromium development tests are internal tooling.
- Future Steam release, Steam Cloud preferences/saves and Steam-friend co-op are desired, **not implemented integrations**.

Rejected or superseded:

- XP, permanent benefits, unlock points or metaprogression between maps: explicitly proposed and then rejected. Do not revive it as an accepted feature.
- Tower-defense-led progression or defense-only feature expansion.
- Old transfer relays and confusing Machine/Forward/Return programming terminology as the player-facing solution.
- Automatic endless continuation that skips the victory choice.
- Browser distribution, obsolete evacuation/launchpad direction, old 0.2–0.5 version policy.
- Pixel/minimalist art and presenting polished concept illustrations as actual game graphics.

## 4. Visual direction and unresolved quality gap

The owner repeatedly reports that the game does not match the quality of its concepts and that the current appearance is not attractive enough for a paid game. **This remains unresolved.** More detail, labels, colored roofs or passing tests do not establish that it is fixed.

Target: detailed believable coastal industry, brick/steel architecture, distinct functional machinery, wet ground, conifers, mist, restrained warm light and detailed anatomical coastal enemies. The lighthouse must belong to the island/coast setting. Current new worlds put it centrally on a large island, with enemies arriving from the water around the island.

References and sources:

- [Art direction](docs/design/ART_DIRECTION.md).
- [Approved industrial concept](docs/design/approved-industrial-direction.png): generated reference, **not a gameplay screenshot**.
- [Creature reference](docs/design/coastal-creatures.png): Shore Runner, Drowned, Shell Guard, Fog Spitter, Abyss Walker; also a concept sheet.
- [Ironhaven art-direction skill](.agents/skills/ironhaven-art-direction/SKILL.md): apply to visual work.
- Editable Blender sources: `docs/design/coastal-creatures.blend`, `coastal-workshops.blend`; authoring scripts in `scripts/blender/`.
- Runtime mesh bundles: `public/art/coastal-meshes.json` and `coastal-buildings.json`. Provenance/licenses in [third-party asset notes](docs/design/THIRD_PARTY_ASSETS.txt) and `third-party-assets.json`.

Important visual requirements:

- Building types must be identifiable by silhouette, equipment layout, material and restrained accents, at ordinary playing zoom. Drills, smelters and different factories must be distinguishable.
- Building levels use **ordinary Arabic UI numbers**. Roman numerals are acceptable only if physically integrated into a building texture/sign. Upgrades also benefit from structural changes, not just recolored roofs.
- Terrain and structures currently blend together because textures/material values are too similar. The owner anticipates a larger texture redesign later. Quieter ground, material scale and value separation should support it; outlines are an optional experiment, not an instruction to outline everything.
- Conveyor direction must be readable during placement and after construction. The owner requested the **v0.16-style arrows** after both overly large white arrows and tiny arrows proved unsatisfactory. Preserve visible tier differences and cargo readability.
- Ore visibility means the **usable mining footprint/grid**, not simply adding ore-name labels. Make valid miner placement boundaries clear.
- Modern rounded UI, grouped Escape-menu pages, clean layout and practical settings. Avoid a retro presentation.
- Compare a coherent actual ingame sample before extending an art pass to everything. Check normal/overview zoom, lighting and dense production/defense scenes. Do not claim 1:1 reference parity without evidence.

Blender MCP was connected in the owner's local client in an earlier discussion; that does not establish access from a cloud task. A local Blender executable has been available here. Discover actual capabilities in each environment. Game Asset Production/Vendoring/Visual Debugging skills may be available in some agent hosts; do not assume their CLI or providers are installed.

## 5. Implemented game and architecture snapshot

These facts describe the inspected baseline, not immutable balance requirements. Reinspect code after another agent changes it.

| Area | Current baseline |
| --- | --- |
| Runtime | JavaScript ES modules, Three.js `0.180.0`, Node.js >=22 for development; Electron `45.3.3` Windows packaging |
| Simulation | `public/shared/sim.js`: deterministic authoritative commands and 0.05-second steps; same rules for solo, host and automated tests |
| Players | Up to four: one host plus three guests; current networking is direct WebRTC/LAN, not Steam networking |
| World | 257×257 coastal island, lighthouse core, landings from eight directions; forests constrain enemy paths |
| Difficulties | Relaxed, Standard, Veteran |
| Campaign | 25 swarms, victory stop, normal host `continueAfterVictory` command for voluntary endless |
| Resources | Original eight stored resources plus iron concentrate and precision bearings in the internal candidate; ore/copper ore also exist in transport |
| Production | Existing industry plus optional ore pressing/coal fining, precision bearing machining and marine power in the internal candidate |
| Logistics | Physical belts, buffers, warehouse local outputs and programmable Dispatch hub |
| Defense | Sentry, gun, mortar, pulse, walls, repairs and harbor lamps |
| Levels | 30 turret levels; belts have 20 upgrades / 21 total levels; other ordinary buildings generally ten upgrades; lamps fixed level |
| Save schema | 11, with supported legacy migration; candidate adds a content signature to bind saves to built-in content/mod files |

Production baseline: one plate per ore; drill/smelter upgrades add 25% of base speed, other ordinary production adds 10%. Steel uses three plates; circuits two copper and one plate; components two steel, two circuits and one gear. Late turret upgrades use components and progression gates. Do not assume components should remain primarily a weapon resource; more industrial uses are a current content idea.

Storage is important and easy to break:

- Warehouse deliveries immediately become globally available for construction, repair, upgrades, ammunition and fuel; no delivery to the lighthouse is required.
- `state.resources` is the shared total. `warehouse.stock` is the physical subset belonging to that warehouse, **not additional goods**.
- Physical machine exports use only that warehouse's own stock. Global affordability must not teleport physical cargo between warehouses.
- Shared capacity spans all items: lighthouse 500 +30 per upgrade; warehouse receiving capacity 200 +30 per upgrade. Do not show each resource as if it owns the whole shared capacity.
- Construction/fuel/ammo spending routes through `spendResource`; migrations must neither duplicate nor delete stock. Existing over-cap saves keep goods and wait for space before new receipts.
- Detailed invariants/tests: [Shared storage](docs/SHARED_STORAGE.md).

Dispatch hub: player-facing ports are numbered **1 input, 2 ahead, 3 left, 4 right**, relative to rotation. Quotas, filtering and blocked-output behavior exist. Internal legacy role identifiers may remain in code; that is not a reason to reintroduce confusing player-facing directional words. The owner found the hub useful when clearly explained; do not remove it just because the earlier relay was rejected.

Harbor lamps currently cost 12 wood /35 plates /3 gears, use 3 power, have 75 HP and a six-tile radius, and can be attacked by enemies. Illuminated Shore Runners currently have a bounded 15% slowdown response; other species have their own exposure/targeting interactions; the owner wanted an effect without enemies scattering and forcing walls on every flank from wave one. These numbers can be reconsidered with evidence after the pause.

Additional player requests to preserve when auditing controls: Q should dismantle selected buildings or a box-selected group, rather than clear selection; trees must block enemies; production and transport warnings must explain bottlenecks. Verify current implementation before declaring these requests fully resolved.

### Code map

| Path | Responsibility |
| --- | --- |
| `public/shared/sim.js` | Rules, commands, resources, production, storage, enemies, upgrades, migration |
| `public/shared/coast.js`, `woodland.js` | Island geometry, land placement, trees and routing |
| `public/shared/hostiles.js`, `lighthouse.js`, `lamps.js` | Enemy kinds, beam/exposure and light fields |
| `public/shared/saves.js`, `tutorial.js`, `releases.js` | Save validation, tutorial and in-game release history |
| `public/app.js` | Solo/host orchestration, controls, toolbar, inspector, saves and UI |
| `public/network.js` | Current co-op session transport |
| `public/render.js`, `coastal-hostiles.js`, `coastal-buildings.js` | Three.js scene, authored creatures/workshops |
| `public/structure-instances.js`, `motion.js` | Rendering instances and presentation motion |
| `public/conveyor-surface.js`, `mineral-markers.js`, `building-levels.js` | Belt, mineral footprint and level presentation |
| `public/shared/building-identity.js`, `industrial-paint.js` | Building type identity and paint/material treatment |
| `public/preferences.js`, `colony-menu.js`, `windows.js`, `style.css` | Portable settings, grouped menu, layout and styling |
| `desktop/game.cjs` | Sandboxed Windows Electron host, custom scheme/CSP, smoke capture |
| `desktop/patcher/` | C# patcher, update integrity and installation tests |
| `server.mjs` | Optional development/test server; not the player's normal product |
| `scripts/build.mjs`, `package-html.mjs` | Embedded Electron resource; validate exact inline JavaScript |
| `scripts/build-windows.ps1` | Windows runtime, package, patcher, native smoke and screenshots |

Do not disable Electron sandbox/context isolation to make a feature convenient. The standalone HTML is an embedded Windows resource, not a promised browser product. Preserve callback-based replacements in HTML packaging; replacement-string `$` expansion previously corrupted generated bundles.

## 6. Settings, Steam and multiplayer future

Implemented settings: pan and zoom speed (25–250%), master volume/mute and test sound, Standard/Performance graphics, interface labels/levels/types, panel/layout options and remembered training/confirmation preferences. Only expose controls that work. Sounds are currently synthesized; separate music/ambience buses are not established content.

Portable preferences use a versioned schema and storage adapter. Keep device-specific graphics/display/window layout separate from account-portable controls/audio/interface preferences. Future Steam Cloud should sync dedicated account-scoped settings/save files with migration, backups and conflict handling; **not the entire Chromium profile**. Cloud preferences must not overwrite the host world.

Steam identity, lobbies, invitations, relay/NAT traversal and friend co-op are future platform work. Current LAN invitations are not Steam co-op. Preserve host authority, command ownership, version negotiation and local guest settings. Test distinct machines/networks; a local networking test is not proof of internet multiplayer.

Follow-up settings include rebinding, edge/middle-button camera movement, audio buses when available, display modes/render scale/FPS cap/VSync, individual graphical effects, UI scale/accessibility and autosave options. See [Settings and Steam](docs/SETTINGS_AND_STEAM.md).

## 7. Playtesting, performance and balance evidence

The owner requested about **35 genuinely different automated playthroughs per scheduled iteration**, running independent simulations in parallel rather than serially, with strategies/seeds/difficulties varied. Never inject resources, HP, levels or kills and call that normal play. Synthetic stress/render fixtures are useful but must be labeled separately.

**Main already has the expanded driver.** Do not rely on older chat statements saying it only has 15 cases. Existing policies: `industry`, `single`, `pulse`, `no_artillery`, `early_defense`, `mortars`, `logistics`; the candidate adds an explicit `refining` policy. Default matrix remains 35 scenarios, including three endurance scenarios. Special matrices compare combat load shedding and generation reserve. Default workers=2, supported range 1–8; adjust to actual resources. Policies still share much scripted layout, so results are not representative of every human strategy.

Tests record seed, strategy, horizon, difficulty, milestones, resources, losses, repairs, upgrades and power/ammunition-related telemetry. Resume reports only with matching scenario **and verified matching source**; metadata matching alone does not establish code identity. Save raw results and detailed reports in the established locations. Treat bot recovery logic as a possible confounder.

Most recent checked report: [20 Nov 12:27](docs/playtests/balance-2026-11-20-122727.md), source `0242bf6`, driver `d096d45`, committed summary `2b9d151`:

- 46 completed automated runs: 35 scenarios plus 11 reserve retests; two workers.
- 26 ordinary campaigns: 4 victories, 21 defeats, 1 horizon limit.
- Nine endurance runs allowed up to 72,000 simulated seconds; longest actual run **7,049 seconds**, reaching swarm 34. A 20-hour limit is not a completed 20-hour test.
- Reserve vs control: 3 better, 1 worse, 7 ties; holdout groups: 0 better, 0 worse, 3 ties. No basis for proclaiming universal improvement.
- Gameplay values were retained. Next isolated test: fuel reserve during recovery, holding layout/generator count fixed. Earlier reserve trials changed multiple factors.
- Read [balance agent log](docs/playtests/balance-agent-log.md), [06:27 report](docs/playtests/balance-2026-11-20-062727.md), [09:27 report](docs/playtests/balance-2026-11-20-092727.md) and raw linked JSON before balancing.

Earlier [0.19 results](docs/playtests/0.19.md) describe 15 runs, single-gun defeat at swarm 7, and strategy/difficulty differences. They are historical context, not current comprehensive results. [0.20 visual checks](docs/playtests/0.20.md) record 192 passing tests at that time; no full game suite was rerun for this documentation-only handoff.

Performance invariants and known traps:

- The owner reported large black rectangles when enemies spawn at wide zoom or very high counts, and multi-second freezes when placing lamps. Regressions must be checked in the renderer; a past fix does not establish that every hardware case is resolved.
- Floating-point framebuffer tests cover non-finite output under varied zoom/counts. Lamps use prewarmed shaders/light slots; workshop instancing also needs warmup.
- Local `gl.finish()` did not reliably drain deferred raster work. Completed-frame timing uses a one-pixel `readPixels` readback after drawing. CPU-submission time is **not GPU FPS**.
- [0.19 measurements](docs/playtests/0.19.md): geometry buffers 18.75→11.10 MB, large-fixture draw calls 12,219→1,124, median CPU tick 4.743→1.882 ms with equal full-state hash. Completed software-renderer frames were still seconds, not playable-hardware FPS promises.
- Preserve mesh positions/UV/topology and editable sources; normalized attribute packing, static workshop chunk instancing and distant shadow reuse improve cost. WeakMap simulation/spatial caches must remain transient, deterministic and invalidated by edits/loading.

### 2026-11-24 — Codex — earned marine-power baseline

- Source `021b2b6`, measuring driver `3d7e854`. 35 earned-resource simulations on two workers, including 15 paired tests of a physical bearing line and marine generator. 14 trials powered the generator. Campaign rank versus the controls: 4 bedre, 3 dårligere og 8 lige.
- Harbor PR #28 is separate. These measurements preserve the base gameplay and public patcher. Next compare marine investment with an equally costly coal-power expansion before tuning recipes. [Report](docs/playtests/balance-2026-11-24-marine.md).

## 8. Commands and validation

From repository root, with Node.js >=22:

```sh
npm ci
npm test
npm run build
node scripts/play-campaign.mjs 417 industry standard
CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
CAMPAIGN_MATRIX=power-reserve CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
# Explicit endurance selection through ordinary victory continuation:
node scripts/play-campaign.mjs 417 industry relaxed 72000 endless
```

For Linux graphical regression tooling:

```sh
npx playwright install --with-deps chromium
npm run build
npm run test:render
# If deliberately using a system Chromium instead:
CHROME_BIN=/usr/bin/chromium npm run test:render
```

Playwright/Chromium is internal graphics automation. Electron also embeds Chromium; using it does not change Windows-only distribution. Software rendering is not a native Windows or hardware performance test.

On Windows:

```powershell
npm ci
npm test
./scripts/build-windows.ps1
```

The Windows script exercises real packaged startup/controls and captures ingame, creatures, island, settings, menu and ports. Its QA colony is a reproducible fixture, not an earned campaign. Smoke timeout is 300 seconds for software-rendered CI. CI on `main`/PRs performs Linux tests/build plus Windows preview packaging. Do not confuse an internal preview artifact with publication to the patcher.

Other measurement scripts: `benchmark-simulation.mjs`, `benchmark-renderer.mjs`, `benchmark-assets.mjs`, `check-balance.mjs`, optional `check-rtc.mjs`. Reports explain baselines and limitations. Ignored `work/`, `release/` and `public/vendor/` are ephemeral; preserve essential evidence in versioned reports or downloadable artifacts. Do not assume another cloud task has them.

## 9. Releases and save safety

When, and only when, the owner explicitly requests publication:

1. Reconcile package/lock/release metadata and in-game history (`public/shared/releases.js`); validate and test the intended source.
2. Use the existing tag-driven [release workflow](.github/workflows/release.yml). Do not reuse or rewrite tags.
3. Windows build uploads ZIP, patcher EXE, SHA manifest and genuine native screenshots, initially with `--latest=false`.
4. Published exact-version installation must pass before promotion to latest; a build alone does not authorize promotion.

Latest public version checked: v0.21.1. The current patcher installs it through Install latest. Verify live GitHub state rather than assuming this statement remains current.

Save keys: `ironhaven.save.v1`, `ironhaven.checkpoints.v1`, `ironhaven.windows.v1`, `ironhaven.skipTutorial`; preferences `ironhaven.preferences.v1`. In the Windows app these are in the app's Chromium storage. JSON export/import supports backups. No Steam Cloud sync exists yet. Preserve old terrain/deposits and stock accounting during migration; reject damaged/unsupported saves clearly.

## 10. Modding request and saved content ideas

**Owner request, first implementation in internal candidate 0.20.2.3:** support community mods in a Factorio-familiar style and add suitable original industry content. The pause expired before implementation. See [the modding guide](docs/MODDING.md) for the exact API and Windows installation flow. This is a data-stage foundation, not full Factorio mod compatibility or a finished mod platform.

Implemented candidate content: ore press (2 ore →1 concentrate /4s, 5 power), coal finery (1 concentrate +1 coal →3 plates /5s, 7 power), precision workshop (2 steel +1 copper →1 bearing /6s, 6 power), marine generator (54 power, 1 coal /16s; construction consumes bearings and components). The regular smelter route remains available. These are original implementations inspired by processing/intermediate/logistics patterns; no third-party mod code or art is included. All inputs/outputs use existing physical transport, local warehouse stock and shared affordability. Batch output waits for enough space before consuming inputs.

Implementation paths: original Lua at `content/industry/data.lua`, generated checked-in `public/shared/industry-catalog.json`, shared content/validation in `public/shared/content.js` and `mod-catalog.js`, Lua compiler `sdk/lua-mods.mjs`, shipped-base snapshot adapter `sdk/catalog-seed.mjs`, bounded compiler worker `sdk/mod-worker.mjs`, Windows folder loader `desktop/mod-loader.cjs`. Fengari 0.1.5 (MIT, Lua 5.3 semantics) is bundled with dependency notices. Do not edit the generated catalog by hand; rebuild from Lua.

The Windows app loads only explicitly enabled ordinary folders from its user-data `mods` directory using `mod-list.json`. Three dependency-ordered Lua data stages, local cached `require`, `table.deepcopy`, `data:extend` and `data.raw` are available for validated items, fixed-recipe machines and fuel generators. The worker has instruction/time/heap budgets; no Node/Electron/system API is provided to Lua. Invalid content aborts startup rather than partially modifying the base game. The example `examples/mods/harbor-machining` adds bronze fittings and an alternative bearing chain. `node scripts/check-mods.mjs MODS_DIRECTORY` validates against the actual bundled worker after building.

Save signatures include a generated built-in catalog hash and enabled mod IDs, versions and source/manifest hashes; LAN codes reject different content. Legacy unmodded worlds can migrate with zero new resources. Loading with missing/changed mods is rejected before building migration. Custom machines appear under Industry (N), in resource/production reports and the inspector; field guide/tutorial explain the built-in routes. Models reuse authored workshop templates with distinct equipment silhouettes; this is **not** the deferred comprehensive texture overhaul.

Explicitly not implemented: runtime `control.lua` events/state, settings stages, locale files, migrations, arbitrary graphics/audio imports, fluids, multiple recipe results, selectable machine recipes, ZIP loading, in-game mod management, automatic downloads or Steam Workshop. Unsupported entry points/prototype fields are rejected. Documentation must not imply these capabilities exist.

Saved research: [Modding research and ideas](docs/design/MODDING_RESEARCH_AND_IDEAS.md).

Primary references: [Factorio mod structure](https://lua-api.factorio.com/latest/auxiliary/mod-structure.html), [data lifecycle](https://lua-api.factorio.com/latest/auxiliary/data-lifecycle.html), [most-downloaded catalog](https://mods.factorio.com/browse/downloaded), [Krastorio 2](https://mods.factorio.com/mod/Krastorio2), [Angel's Refining](https://mods.factorio.com/mod/angelsrefining), [Space Exploration](https://mods.factorio.com/mod/space-exploration). This is an established shortlist, not a complete current popularity ranking. Bob's and further logistics mods still need deeper investigation.

Factorio's familiar pattern is `info.json`, dependency-aware loading, Lua prototypes via `data:extend`/`data.raw`, `data.lua` → `data-updates.lua` → `data-final-fixes.lua`, separate `control.lua` runtime and settings stages. Ironhaven should aim for a recognizable workflow, with clear supported API documentation and a working example. **Do not promise binary/API compatibility or unmodified Factorio mods.** JSON renamed to Lua is not Lua support.

Remaining design work: runtime events/state and save migrations, localized content, custom assets, mod management/distribution and broader prototype coverage. Validate new capabilities explicitly and preserve deterministic host authority. Do not weaken Electron isolation or expose arbitrary system access.

Proposals requiring evaluation after the pause:

- Optional ore preparation/refining with power/space/throughput tradeoffs, not mandatory busywork or uncontrolled resource inflation.
- Recycling with net loss and meaningful costs; no infinite gain/refund loops.
- Advanced components with more industrial uses and alternative technology paths.
- Coastal outposts, harbor restoration and remote resource logistics as long-term industrial goals.
- Clear production bottlenecks, demand/throughput feedback and useful automation tools.

Ore preparation and an industrial component sink now have a bounded first implementation, not a finished end-game overhaul. Recycling, technologies, coastal outposts/harbors and broader progression remain proposals. Use original code/art. Angel's Refining lists CC BY-NC-ND 4.0; Space Exploration and AAI Containers list Limited Distribution Only Licence; Bob's Metals lists redistribution/no editing. Popularity and available source do not grant commercial reuse rights. Inspect provenance for any actual third-party reuse.

## 11. Roadmap discussion status

The owner asked to develop a roadmap together. The suggested sequence was visual identity → strong first hour → meaningful industrial choices → varied campaign/endless → Steam/co-op. A polished 45–60 minute representative experience was suggested as a possible future demo foundation. **This was an assistant proposal, not a locked owner-approved milestone plan.** Do not treat a demo duration or the suggested ordering as an overriding requirement.

Useful candidates: purposeful expansion, larger industrial construction projects, distinct defense roles, meaningful enemy composition/telegraphing, readable logistics and lighthouse functions integrated with the factory. Prioritize factory depth over adding near-identical turrets or endless percentage upgrades. Technical co-op compatibility should be considered throughout, even if Steam integration comes later.

## 12. Automation and environment state

State reconciled 23 November 2026; this is a snapshot, not a scheduler configuration file:

- **Ironhaven balanceagent:** the scheduler reported the recurring three-hour task active on 23 November 2026 at 22:23 Europe/Copenhagen. An earlier snapshot recorded a pause. The repository does not control the scheduler.
- **Ironhaven indhold og mods:** one-time task triggered on **23 November 2026 at 19:45:15 Europe/Copenhagen**; its implementation is recorded in the November 23 work log below. This was not a reactivation of the recurring balance agent. Service-side completion bookkeeping occurs after the automation turn; later owner steering still takes precedence.
- These schedules are service-side automations, not cron jobs in the repository. Reading or editing this file does not itself reschedule them.
- Cloud workspaces are separate checkouts/machines and may be ephemeral. Current conversation has used `/workspace/ironhaven`; another environment must discover its actual checkout. A local client MCP connection does not imply cloud access.
- The owner has instructions for a reusable Codex Cloud environment: Node 22, npm dependencies, Git/GitHub CLI, Playwright Chromium/system dependencies; Linux simulation/render checks and Windows CI. A published reusable environment and its selection must be verified, not assumed from a chat promise.

## 13. Durable decision register

| Decision | Origin/status | Consequence |
| --- | --- | --- |
| Factory building with enemies | Owner, current | Industrial progression drives the design |
| No cross-map XP/benefit system | Owner, explicitly rejected | Do not implement proposed metaprogression |
| Detailed realistic coastal art | Owner, repeated | No pixel/minimalist fallback; inspect actual runtime |
| Windows-only player product | Owner, current | Browser tooling stays internal |
| Normal UI level numbers | Owner, current; implemented 0.20.1 | Roman numerals only if integrated physically into textures |
| Global affordability, local warehouse exports | Owner direction; implemented schema 11 | Preserve physical ownership/conservation |
| 25-swarm victory, voluntary endless | Latest recorded agent mandate | Do not skip victory or force continued play |
| Autonomous internal tuning | Owner mandate | Numeric balance is adjustable with evidence |
| Public 0.21.1 with existing patcher | Owner, 24 November 2026 | Three-part public version. New releases still require explicit permission. |
| Factorio-style mod authoring | Owner request; internal data-stage implementation | Familiar Lua/data workflow, not full API compatibility |
| Wait before implementation | Owner; expired before clock-verified resumption | Later owner pauses still take precedence |
| Shared Markdown brain | Owner, current request | Both agents maintain this file through GitHub |

## 14. Shared work and decision log

### 2026-11-24 — Codex — Loeth Studios launch intro

- Owner requested a short startup film and reusable Loeth Studios branding with detailed reflections, shadow and animation. The internal Windows build `0.21.1.1104` starts with a three-second studio animation. It uses indigo glass, pearl lettering and a moving light strip. Escape skips the animation.
- The Windows shell shows the studio screen while it reads the packaged game and loads enabled mod prototypes. All video and poster data are embedded locally. The original branding and animation sources are in [studio/loeth-studios](studio/loeth-studios/README.md).

### 2026-11-24 — Codex — material icon and build price preview

- Owner approved the material-icon mockup and requested in-game evidence. Internal build `0.21.1.1103` adds the approved illustrated material shapes to the stock bar, build cards, blueprint prices, placement flow and production report. A build price shows each icon with its quantity and highlights the quantity of any missing material. The material name is available on hover.
- The original art and atlas mapping cover 23 existing raw and manufactured materials, with a fallback cargo crate and reuse of known item icons for Lua mods. The offline Windows bundle embeds one 84 KB atlas. [Art source and derivation](docs/design/MATERIAL_ICONS.md).
- The compact HUD and prices were merged after 209 automated tests and the exact Windows build passed. The native game capture shows Harbor Works with a missing iron-plate quantity in red. [PR #29](https://github.com/Guffy-dk/Ironhaven/pull/29) · [Windows captures](https://github.com/Guffy-dk/Ironhaven/actions/runs/45304344267/artifacts/14879788946).

### 2026-11-24 — Codex — compact colony UI preview

- Owner requested less text and fewer windows. Internal build `0.21.1.1102` keeps the inspector out of the way until a building or tool is selected, while retaining an explicit pin. The default view shows small swarm and map panels.
- Colony objectives, team and round bonuses open from Colony details. Building summaries retain price, recipe, status and immediate actions. Details & settings holds description, advanced stats, warehouse exports and other settings. Harbor projects have their own disclosure within the lighthouse inspector. The top bar shows current figures, with flow and reserve available on hover and detailed production in the existing report.
- On-map building markers retain type icons and numeric levels, with names available on hover and selection. The inspector fits its contents and scrolls when expanded. The Escape menu uses short category names.
- Maintains the existing placement, construction, pause, program, tutorial and settings actions. The public `v0.21.1` release is the previously authorized gameplay update. This UI preview uses the internal Windows CI build.

### 2026-11-24 — Codex — harbor industry 0.21.1

- Owner requested at least 14 buildings with new materials, endgame uses and balance tests. The update adds 11 recipe machines, 11 materials, reinforced breakwaters, signal masts and Coast Watch turrets. [PR #28](https://github.com/Guffy-dk/Ironhaven/pull/28).
- Materials run through Industry (N) and Fabrication (J) to Harbor Equipment. The host commissions two grid/depot tiers and repeat coal/copper shipments at the lighthouse. Export reserves protect local warehouse stock needed to fund projects. Existing 0.20.2 saves with the same mods migrate to the additive catalog.
- Owner asked whether calling a swarm early should award a bonus. The current proposed design keeps the shorter wait as the benefit, with preparation time as the tradeoff. The 0.21.1 rules add no early-call reward.
- The owner explicitly authorized patcher release of this build once verified. This authorization applies to 0.21.1. The owner briefly proposed 0.21.1.1101, then explicitly chose 0.21.1 so the existing patcher can install it. The earlier 0.20 version ceiling is superseded for this release. Use the existing tag, published-installation and latest-promotion workflow.
- [Release job](https://github.com/Guffy-dk/Ironhaven/actions/runs/45300955207) completed and promoted [v0.21.1](https://github.com/Guffy-dk/Ironhaven/releases/tag/v0.21.1) after installing the exact public ZIP on Windows. The patcher binary is byte-identical to v0.20.1. SHA-256 `698b7654bf7c82259f78293c476bee93d67b45a6e0e935fcad76c20c54fcf385`. Windows smoke and 209 automated tests passed. [Native harbor QA capture](https://github.com/Guffy-dk/Ironhaven/releases/download/v0.21.1/Ironhaven-harbor.png).
- The full factory connected every new recipe using belts and finite fixture raw materials. With reserves it delivered 170 kits and completed eight commissions within 950 simulated seconds. Low power blocked the chain. The repeatable late-wave pair prompted the Coast Watch power tune, reducing demand from 721 to 601 on a 642 supply. Both variants stayed operational through the horizon with 227 kills in swarm 26.
- The existing 35-case campaign matrix ran with three independent workers, plus two new earned-resource cases. The earned crusher/kiln branch delivered 204 and 207 firebricks without changing the matched campaign outcomes. The entire harbor chain was tested in the prepared factory, while earned progression coverage was limited to the crusher/kiln branch. [Balance report](docs/playtests/harbor-endgame-0.21.1.md).

### 2026-11-23 22:23 Europe/Copenhagen — Codex — industrial fuel comparison

- Current source baseline `6cbfb84`, measurement commit `d4020cc`. 35 ordinary-command campaigns on two workers. Higher coal reserve against the same refining layout yielded 0 bedre, 0 dårligere og 10 lige. Repaired a coal-belt overlap with a planned sawmill in the test layout and reran affected cases. No game code or public release changes.
- Next: commission the complete bearings-to-marine-generator chain using earned materials, record the ongoing trade-off between fuel, bearings and defense, and compare against the matched baselines before tuning recipes. [Balance report](docs/playtests/balance-2026-11-23-industry-fuel.md).

### 2026-11-23 20:25 Europe/Copenhagen — Codex — industrial/modding implementation merged

- [PR #27](https://github.com/Guffy-dk/Ironhaven/pull/27) merged to main at `6cc6863`. Implementation `4596cc3` / internal 0.20.2.2; compact-cost/native-capture polish `4c8fced` / final internal **0.20.2.3**; internal CI artifact retention `3b2fff5`. No simulation/catalog/compiler/campaign changes between the pinned gameplay tests and final UI build.
- [Final CI](https://github.com/Guffy-dk/Ironhaven/actions/runs/45248228613) passed Linux tests/build and native Windows packaging, ordinary smoke/captures and the enabled-example-mod placement/signed-save smoke. Full suite: **203 passed**. The renderer had no page errors/non-finite values at tested zoom/counts through 420 enemies; absolute SwiftShader timings are not hardware FPS.
- **Six final source-pinned earned-resource campaigns**, two parallel workers: 3 victories/3 defeats. Refining produced concentrate in both cases (9 on Relaxed seed 417, 57 on Standard seed 2026); matched outcomes remained victory at 25 and defeat at 24 respectively. Ten earlier exploratory runs included invalid pilot layouts and are not pooled into that final sample. No claim of broad or complete balance. Bearing/marine-power chains have physical accounting tests, not a separately tuned earned-resource campaign policy yet.
- [Detailed report](docs/playtests/industry-2026-11-23.md), [raw six-run results](docs/playtests/industry-2026-11-23-results.json), [Windows log excerpt](docs/playtests/industry-2026-11-23-windows.log), [native industry capture](docs/playtests/images/0.20.2.3-industry-windows.png), [native enabled-mod capture](docs/playtests/images/0.20.2.3-modding-windows.png).
- [Internal Windows ZIP/manifest](https://github.com/Guffy-dk/Ironhaven/actions/runs/45248228613/artifacts/14853689568) retained 14 days; it includes the Modding guide/example. Manual install only; the patcher still points to public **v0.20.1**, rechecked after merge. No release tag/promotion. The recurring balance agent remains paused; this work was the scheduled one-time resumption after the waiting period.
- Next priorities: more holdouts/fuel/power/commissioning evidence and an earned bearing/power policy; then deliberately scoped runtime/mod-management/custom-asset API extensions. Texture redesign, technologies, recycling and harbor expansion remain unfinished/proposed. No claim that the full visual quality gap or end-game depth is solved.

### 2026-11-23 19:46 Europe/Copenhagen — Codex — content/modding work resumed

- The waiting deadline has passed (clock checked: 18:46 UTC). Fetched `origin/main`; baseline remains `27a6062`, with no later Claude changes or local edits observed.
- Branch: `feature/lua-modding-industry`. Scope: a documented Lua data-stage mod API, deterministic content registry, original industrial processing content, installed-Windows loading, save/co-op compatibility checks and integration tests.
- Research refreshed against Factorio's primary documentation and Bob's Metals/Chemicals/Intermediates, Angel's Refining and AAI Containers pages. No third-party mod code/assets will be transplanted.
- Status: in progress, no implementation/results claimed yet. Public patcher unchanged; the six-hour agent remains paused.

#### Implementation checkpoint — internal build 0.20.2.2

- Implemented four original industrial machines/two stored intermediates, Lua data stages, example mod, installed folder/worker loading, signature checks for saves and LAN, documentation and integration tests. Details/limitations in section 10 and [validation report](docs/playtests/industry-2026-11-23.md).
- Local checks: full suite 203/203 passed; focused SDK/industry tests retested after validator hardening (10/10); build and packaged-worker example check passed. Render regression: no page errors/non-finite output across 80/160/420 enemies and zoom 14/44; lamp-placement bounds passed using completed frames. These are Linux/SwiftShader checks, not native Windows evidence.
- Exploratory pilots exposed premature replacement of a working chain and a test-layout collision with a sentry. Corrected the pilot to commission an extra line after earning all required materials and explicitly reject plan collisions. Do not interpret invalid pilots as balance evidence. Final source-pinned playthroughs and native Windows CI are pending at this checkpoint and will be recorded separately.
- No patcher release, public tag, latest promotion or restart of the paused recurring agent.

Add new entries above old ones. Suggested entry fields: date/time/timezone, contributor/tool, branch/commit, request/decision and reason, scope/files, validation actually run, remaining issues/blockers, next step. Link detailed data elsewhere. State whether pushed/merged and distinguish internal build from public version.

### 2026-11-21 — Codex — establish common memory

- Requested by owner: a GitHub Markdown file holding project context so Claude Code and Codex share decisions and work through one file. Owner clarified that private chat access is unnecessary if the file is the shared brain.
- Reconciled conversation decisions, code at `2b9d151`, current automation prompts/status and public release metadata. Preserved latest GitHub balance reports/AGENTS guidance rather than replacing them with the older local checkout.
- Scope: this shared document, agent entry points, saved art-direction skill, research notes and historical-handoff notices. Documentation only; gameplay, assets, dependencies, versions and release channel unchanged.
- Validation: documentation link targets and Git whitespace/diff checks; no new claim of running gameplay tests or Windows captures. The final handoff reports the actual GitHub publication result.
- Next: both agents read/update this file. Preserve the implementation pause; after it expires, reconcile actual branches and scope before starting the deferred content/modding work.
