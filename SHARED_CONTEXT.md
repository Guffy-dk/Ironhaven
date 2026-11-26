# Ironhaven — shared project brain

**Read this first. Keep it current.** This is the common durable memory for the owner, Codex, Claude Code and future contributors. It records decisions, verified implementation, unresolved problems and handoffs. It is not an automatically synchronized chat transcript.

Last reconciled: **24 November 2026**, Europe/Copenhagen. Harbor expansion and Lua modding are on `main` via [PR #28](https://github.com/Guffy-dk/Ironhaven/pull/28). Final gameplay tuning was checked at `ad4e6cb`. The owner chose **0.21.1** and authorized its patcher release, using the unchanged three-part patcher format. The latest public release is [v0.21.3](https://github.com/Guffy-dk/Ironhaven/releases/tag/v0.21.3) from `4542f55`. See the November 24 entry for verification.

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

### Claude → Codex handoffs

The owner approved an event trigger for [`claude-input`](claude-input) on `main`. Claude appends instructions with unique IDs beginning with `IH-`. Include the desired outcome, relevant context and acceptance checks. Codex uses this file and the repository's existing history to reconcile earlier decisions. The workflow checks [`codex-output`](codex-output) before calling Codex and records claims and results there. Proposed code is published to a review branch. A finished or interrupted claim consumes its ID, so submit a new ID if an instruction needs to be retried. The owner requested keyless authentication. This workflow uses a short-lived GitHub OIDC token and a ChatGPT workspace federation rule. See [handoff setup](docs/CODEX_HANDOFF.md) for the account-side requirement and exact claims. The existing release authority still applies.

Codex independently reviewed Claude’s difficulty candidate `8ccd033` as `IH-20261125-difficulty-review`. The branch passed 215/215 tests. The compatibility review and follow-up tests are recorded in [`codex-output`](codex-output).

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
- **Windows x64 and Linux x64 for players (owner, 25 Nov 2026).** No macOS and no browser release. No separate Node/server installation required for normal players. Steam is future distribution. Playwright/Chromium tests remain internal tooling.
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

The owner plans to distribute Ironhaven on Steam and asked whether it needs an engine rewrite. The current Electron and Three.js Windows package can use a Windows Steam launch option targeting `Ironhaven.exe`. SteamPipe can install and update the game files in a Windows depot. A Steam depot, app configuration and distribution test are still pending. [Valve's SteamPipe and launch option guide](https://partner.steamgames.com/doc/sdk/uploading).

Implemented settings: pan and zoom speed (25–250%), master volume/mute and test sound, Standard/Performance graphics, interface labels/levels/types, panel/layout options and remembered training/confirmation preferences. Only expose controls that work. Sounds are currently synthesized; separate music/ambience buses are not established content.

Portable preferences use a versioned schema and storage adapter. Keep device-specific graphics/display/window layout separate from account-portable controls/audio/interface preferences. Future Steam Cloud should sync dedicated account-scoped settings/save files with migration, backups and conflict handling; **not the entire Chromium profile**. Cloud preferences must not overwrite the host world.

Steam identity, lobbies and Steam relay are future platform work. Since 25 Nov 2026 co-op uses WebRTC with public STUN (Google, Cloudflare) and the existing copy-and-paste invitation codes. Friends connect over the internet without port forwarding; game traffic is direct between players. No TURN relay is shipped, so very strict NATs (some mobile, company or CGNAT networks) can still fail until Steam networking or a hosted relay exists. Preserve host authority, command ownership, version negotiation and local guest settings. Validate internet co-op across separate accounts and networks. [Valve's Cloud guide](https://partner.steamgames.com/doc/features/cloud) · [Valve's multiplayer guide](https://partner.steamgames.com/doc/features/multiplayer).

Follow-up settings include rebinding, edge/middle-button camera movement, audio buses when available, display modes/render scale/FPS cap/VSync, individual graphical effects, UI scale/accessibility and autosave options. See [Settings and Steam](docs/SETTINGS_AND_STEAM.md).

## 7. Playtesting, performance and balance evidence

The owner requested about **35 genuinely different automated playthroughs per scheduled iteration**, running independent simulations in parallel rather than serially, with strategies/seeds/difficulties varied. Never inject resources, HP, levels or kills and call that normal play. Synthetic stress/render fixtures are useful but must be labeled separately.

**Main already has the expanded driver.** Do not rely on older chat statements saying it only has 15 cases. Existing policies: `industry`, `single`, `pulse`, `no_artillery`, `early_defense`, `mortars`, `logistics`; the candidate adds an explicit `refining` policy. Default matrix remains 35 scenarios, including three endurance scenarios. Special matrices compare combat load shedding and generation reserve. Default workers=2, supported range 1–8; adjust to actual resources. Policies still share much scripted layout, so results are not representative of every human strategy.

Tests record seed, strategy, horizon, difficulty, milestones, resources, losses, repairs, upgrades and power/ammunition-related telemetry. Resume reports only with matching scenario **and verified matching source**; metadata matching alone does not establish code identity. Save raw results and detailed reports in the established locations. Treat bot recovery logic as a possible confounder.

Latest difficulty change: [25 Nov difficulty pass](docs/playtests/balance-2026-11-25-difficulty.md) (supersedes the unchanged values below). Most recent checked report before that: [20 Nov 12:27](docs/playtests/balance-2026-11-20-122727.md), source `0242bf6`, driver `d096d45`, committed summary `2b9d151`:

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

Playwright/Chromium is internal graphics automation. Electron also embeds Chromium; using it does not make Ironhaven a browser product. Software rendering is not a native Windows or hardware performance test.

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
| Windows x64 + Linux x64 desktop product, no macOS | Owner, 25 Nov 2026 (supersedes Windows-only) | Browser tooling stays internal; Steam later |
| Internet co-op without port forwarding | Owner, 25 Nov 2026 | STUN now; TURN/Steam relay for strict NATs later |
| Patcher for Windows and Linux | Owner, 25 Nov 2026 | Steam replaces it later |
| Normal UI level numbers | Owner, current; implemented 0.20.1 | Roman numerals only if integrated physically into textures |
| Global affordability, local warehouse exports | Owner direction; implemented schema 11 | Preserve physical ownership/conservation |
| 25-swarm victory, voluntary endless | Latest recorded agent mandate | Do not skip victory or force continued play |
| Autonomous internal tuning | Owner mandate | Numeric balance is adjustable with evidence |
| Public 0.21.1 with existing patcher | Owner, 24 November 2026 | Three-part public version. New releases still require explicit permission. |
| Factorio-style mod authoring | Owner request; internal data-stage implementation | Familiar Lua/data workflow, not full API compatibility |
| Wait before implementation | Owner; expired before clock-verified resumption | Later owner pauses still take precedence |
| Shared Markdown brain | Owner, current request | Both agents maintain this file through GitHub |

## 14. Shared work and decision log

### 2026-11-26 01:34 Europe/Copenhagen — Codex — earned firebrick delivery

- 35 campaigns on `e082c02`, driver `e94fa0f`. Eight of nine harbor variants delivered firebricks to the switchgear shop using an earned warehouse and two belts. Holdout 5317 was jammed by wood. Rotating both sawmills and clearing the belts delivered four firebricks in a separate 30-second earned-checkpoint retest.
- Gameplay and release unchanged. Next keep timber off the firebrick line and deliver cable and circuits. [Report](docs/playtests/balance-2026-11-26-switchgear.md).

### 2026-11-25 22:27 Europe/Copenhagen — Codex — earned harbor progression audit

- 35 campaigns on `a8b056c`, driver `98464d9`. All 11 harbor campaigns made firebricks and reached swarm 25, with median stock of 200 firebricks and no Harbor Equipment. The partial driver layout cannot commission a project; the prepared full-chain fixture is separate evidence.
- Gameplay and release unchanged. Next route existing firebricks to switchgear and follow earned Harbor Equipment inputs. [Report](docs/playtests/balance-2026-11-25-harbor-audit.md).

### 2026-11-25 19:29 Europe/Copenhagen — Codex — reserve-based production restart

- 35 campaigns on `f8f78a3`, driver `71d1067`. Reserve-based restart reduced measured defense outage episodes from 20 to 18 but increased deficit time from 2,436 to 3,122 seconds. Fourteen pairs tied on victory and highest swarm and one worsened.
- No gameplay or release changes. End-of-combat restoration remains the experimental control. Next measure harbor progression after swarm 25. [Report](docs/playtests/balance-2026-11-25-reserve-restart.md).

### 2026-11-25 16:28 Europe/Copenhagen — Codex — capped power response duration

- 35 campaigns on `30d76c9`, driver `85cfe01`. Holding the same two-machine limit until the end of combat reduced outages from 25 to 20 against a 30-second timeout. Outcomes ranked two better, one worse and 12 tied. The endurance holdout lost a swarm with the later restart.
- Gameplay and release unchanged. Next evaluate restoration when the reserve can sustain resumed loads. [Report](docs/playtests/balance-2026-11-25-capped-response.md).

### 2026-11-25 14:01 Europe/Copenhagen — Codex — short production shedding

- 35 campaigns on `139a43e`, driver `ef8755b`. Limiting the response to two machines per swarm for 30 seconds cut production pauses from 167 to 72 and increased recorded defense outages from 15 to 21. One pair ranked better, three worse and 11 tied.
- Gameplay and release unchanged. Next isolate the machine cap from the timeout and measure restoration when combat ends or reserve recovers. [Report](docs/playtests/balance-2026-11-25-short-response.md).

### 2026-11-25 10:27 Europe/Copenhagen — Codex — response to combat power warning

- 35 earned-resource runs on `4c2d22d`, driver `43c9da6`. Reacting after five seconds by pausing optional production reduced measured outage time from 9,480 to 4,712 simulated seconds across 15 matched pairs. Outcomes ranked three better, three worse and nine tied.
- No gameplay or release changes. Next measure shorter selective shedding against whole-combat shedding and compare resource costs. [Report](docs/playtests/balance-2026-11-25-warning-response.md).

### 2026-11-25 07:27 Europe/Copenhagen — Codex — combat-aware power warnings

- 35 campaigns on `51cd987`, driver `8652d18`. The combat filter reduced warning windows without a measured defense outage from 224 to 134 and retained advance warning for all 33 outages with a 20-second median lead. Requiring threatened turrets reduced lead to seven seconds and missed two outages.
- Next validate a quiet combat-filtered warning in human play. Gameplay and release metadata are unchanged in this run. [Report](docs/playtests/balance-2026-11-25-combat-lead.md).

### 2026-11-25 04:27 Europe/Copenhagen — Codex — power reserve lead time

- 35 earned-resource campaigns on `da4f9e6`, driver `7fad7a7`. The merged difficulty pass improved matched ordinary victories from 1/13 to 8/13. Reserve telemetry preceded all 35 measured combat defense outages with a median lead of 20 simulated seconds. In 217 warning periods a defense outage did not occur before the shortage cleared.
- Gameplay and release metadata unchanged in this run. Test whether a combat-aware display retains useful lead time with fewer interruptions. [Report](docs/playtests/balance-2026-11-25-reserve-lead.md).

### 2026-11-25 01:27 Europe/Copenhagen — Codex — outage onset and rebuild priority

- 35 earned-resource simulations on `c7efa80` with driver `7cee0bd`. At 29 of 30 recorded defense outages in controls, load already exceeded production at the preceding sample. Rebuild priority changed none of six outcome metrics in 15 pairs. It executed three builds in one pair, with identical observed shortage time.
- No gameplay or release changes. Next measure when the power reserve starts falling, before defenses stop. [Report](docs/playtests/balance-2026-11-25-power-origin.md).

### 2026-11-24 22:27 Europe/Copenhagen — Codex — power recovery telemetry

- 35 earned-resource simulations on `8cf1b9f`, driver `af38083`. The optional meter recorded 59 defense outages and 35 recoveries, with distinct observations for empty fuel and unaffordable reinstatement on former generator sites.
- Game and release code unchanged. Next distinguish lost generation capacity from rising demand and measure targeted rebuilding. [Report](docs/playtests/balance-2026-11-24-power-recovery.md).

### 2026-11-24 19:27 Europe/Copenhagen — Codex — outage-scoped repair reserve

- Simulation `6380255`, measuring driver `fb03be5`. 35 earned-resource scenarios. The optional reserve deferred non-lighthouse repairs after 60 seconds of observed combat power shortage to leave the cost of one sentry, while other construction remained possible. Paired outcome: 0 bedre, 1 dårligere og 14 lige.
- No balance numbers or release metadata changed. Next measure time to power recovery and separate fuel shortages from missing rebuild materials. [Report](docs/playtests/balance-2026-11-24-outage-reserve.md).

### 2026-11-25 — Claude Code — readability over realism (playtest feedback)

- Owner reminder: playtesters found the factories hard to tell apart by appearance during play, and ore deposits hard to locate and outline. **Readability takes precedence over realism** in the visual overhaul.
- Deposits now sit on mineral-stained ground: rounded, mottled, merging patches (`depositStain` in `public/render.js`) in rust (iron), verdigris (copper) and coal black under the outcrops. This gives a clear location and outline at play zoom while staying natural; the outcrops regained some colour.
- Factories carry a painted trade sign on the roof (`tradeSign` in `public/building-levels.js`) with the building's own pictogram and accent from `BUILDING_IDENTITIES` (shared via `iconPath` in `public/icons.js`). It is lit like the roof and readable at default zoom. Harbour and Lua-mod buildings without `ROOF_HEIGHTS` entries have no sign yet.
- An earlier step in this overhaul hid the HTML type tags at default zoom. The roof signs now carry that recognition in the world itself.

### 2026-11-25 — Claude Code — owner-authorised visual overhaul (in progress)

- **Owner decision (25 Nov 2026):** Claude has full authority to change the look of the whole game and must fix what makes it tiresome to look at: the uniform ground, toy-like boxes without scale, saturated mineral blobs, badge and arrow noise, flat lighting and no wetness, mist or warm window light. The recommended direction is North Atlantic harbour industry, 1890–1940: timber and tar, then brick and riveted iron, then concrete and steel, used as visual progression. Releases still need an explicit owner request.
- First pass:
  - Deposits are weathered, half-buried outcrops with restrained mineral casts: rust for iron, verdigris for copper, black seams for coal.
  - The ground has wet mud and peat variation under a less beige wash.
  - Port arrows are smaller painted-metal plates.
  - Building type tags show only when zoomed in closer than the default (zoom < 12) or for the hovered or selected building. Two interface tests now zoom in first.
  - A display-space colour grade (`public/color-grade.js`, after `OutputPass`) adds slight desaturation, cool shadows and warm highlights, a soft curve, a vignette and fine grain.
- Next: building scale and era materials, sea mist, wet sheen and warm window light. Each step gets before/after captures.

### 2026-11-25 — Claude Code — 0.22.0 release request

- **Owner decision (25 Nov 2026):** merge the HUD layout, animation and transition work to `main` and **publish to the patcher**. This is an explicit release request. Claude chose public version `0.22.0`, a three-part version for the patcher, because the release adds Linux, internet co-op, the new UI, animation and the difficulty pass.
- It is the first release with Linux assets (`Ironhaven-Linux-x64.tar.gz`, its manifest and `Ironhaven-Patcher-Linux`). The Windows patcher is rebuilt from the platform-neutral sources and keeps the same manifest format, so existing Windows patchers keep updating. The release workflow verifies the published installation on both platforms before promoting it to latest. **Published:** [v0.22.0](https://github.com/Guffy-dk/Ironhaven/releases/tag/v0.22.0) from `cfbe3ef` (game code identical to the CI-verified `b67548d`, plus the release workflow and context). [Release run 45666047691](https://github.com/Guffy-dk/Ironhaven/actions/runs/45666047691): tag, Linux build, Windows build and publish, published-install verification on Windows and Linux, and promotion to latest all succeeded.
- The cloud session's git proxy refuses tag pushes (HTTP 403). With owner approval ("Nr 3"), the release workflow gained `workflow_dispatch` inputs `tag` and `commit`. A first job checks that the commit is on `main`, that `package.json` matches the tag and that the tag does not exist yet. It then creates the tag through the refs API (a git push and the API are both refused for a commit whose workflow files differ from `main`; release the current `main` head), and the unchanged build, verification and promotion jobs run on that exact commit. Tag pushes still work as before.

### 2026-11-25 — Claude Code — presentation-only animation (approved for 0.22.0)

- Owner request: more life in monsters and in belt cargo entering and leaving machines, with no gameplay change. The owner approved it together with the HUD layout for 0.22.0.
- `public/coastal-hostiles.js`: body bob, lean and sway synced to the stride; an attack lunge from the existing cooldown; a 0.22 s hit flinch with a flash when HP drops; and a 1.1 s topple, curl and sink for hostiles that disappear. Batches of more than 40 removed at once are skipped, which covers loads and resets. The shadow-update trigger still follows living hostiles only.
- `public/render.js`: cargo grows out of a machine outlet onto the belt, shrinks as it nears a machine it feeds, and a short ghost slides into the machine after the simulation hands it over. Nothing reads back into the simulation, and the simulation files are unchanged.
- Review material: `scripts/animation-demo-world.mjs` builds a running review fixture (two long ore lines and sturdier hostiles; fixture only). The 20 fps clips in `docs/design/animation/` are Linux SwiftShader renders, not Windows captures. Capture lesson: Playwright's `clock.install()` keeps running in real time, so call `clock.pauseAt()` or the game simulates roughly 20 times too fast between screenshots.
- Checks: 216/216 tests, build, and render regression with no errors.
- Follow-up after owner feedback ("more realistic, smoother"): the hostile gait follows the distance actually covered, eases between standing and walking, recoils with a damped spring and falls on an eased curve. Cargo faces its direction, rides the rollers and eases into and out of machines. The UI gained CSS transitions: panels, dialogs and alerts fade or glide in, controls respond on hover and press, and `prefers-reduced-motion` disables all of it. Entrance animations deliberately have no backwards fill, so the HUD stays visible if animations are throttled. The dock now fits at 1280 px width. `docs/design/animation/ui-transitions.mp4` was filmed by stepping the Web Animations API.

### 2026-11-25 — Claude Code — UI redesign theme in the real game (approved and merged)

- After the rejected drawn mockup, the owner approved prototyping in the actual game, with approval based on real screenshots.
- `public/ui-theme.css` layers over `style.css` (body class `ih-theme`). It uses weathered steel plates with rivets, brass nameplate headers, recessed wells, an amber primary action, and embedded OFL fonts (Big Shoulders Display, IBM Plex Sans Condensed, IBM Plex Mono; licenses in `release/FONT-LICENSES.txt`; CSP gains `font-src data:`). The top bar now shows a net rate per minute next to every resource. Material icons stay on every cost. No element ids changed; 216/216 tests pass.
- **Owner feedback (25 Nov 2026): "Det er meget bedre"** (much better). The visual direction is accepted, and the owner approved merging the theme to `main` on 25 Nov 2026. Next: layout restructure and the remaining screens, shown with before/after evidence.
- Evidence: Linux Chromium renders of the built game (not Windows captures), before and after, in `docs/design/ui-redesign/compare-*.jpg`. The layout is mostly unchanged so far. Moving and restructuring panels is the next step if the owner approves this visual direction.

### 2026-11-25 — Claude Code — UI redesign mockup rejected

- The owner asked for a complete UI redesign, with a mockup to approve first, because the current UI looks quickly AI-made. Claude's first mockup, "Harbour Instruments" (slate panels, amber actions, a swarm clock, an inspector panel and a pause menu with saves and co-op; a private claude.ai design canvas), was **rejected by the owner as poor**. Do not implement it. A new attempt needs a clearly different and more detailed direction, approved before any implementation.

### 2026-11-25 — Claude Code — Windows and Linux desktop, internet co-op, two-platform patcher

- **Owner decisions:** build for Windows and Linux, not macOS. Co-op must work without NAT/port configuration. Make a patcher for Windows and Linux now; Steam comes later. Remove browser-era leftovers.
- **Implemented and merged to `main` with owner approval (25 Nov 2026):**
  - Linux package: `scripts/build-linux.sh` produces `Ironhaven-Linux-x64.tar.gz` and its manifest. The launcher `desktop/linux/ironhaven.sh` disables Chromium's OS sandbox only when the system blocks both unprivileged user namespaces and a root-owned setuid helper, or when running as root. The page keeps context isolation, CSP and no Node access.
  - Co-op: `public/network.js` uses public STUN servers. The invitation and answer codes are unchanged. `scripts/check-coop-stun.mjs` checks for a public address in CI (`continue-on-error`).
  - Patcher: the shared logic in `desktop/patcher/Updates.cs` is platform-neutral. `PlatformWindows.cs` keeps the published ZIP/.NET Framework behaviour. `PlatformLinux.cs` (.NET 8) installs tar.gz, keeps execute bits and strips setuid, and rejects links and paths outside the game folder. The Linux UI is Avalonia (`desktop/patcher/linux`), built by `scripts/build-linux-patcher.sh` as `Ironhaven-Patcher-Linux`.
  - CI has a Linux job. The release workflow builds Linux, publishes both platforms in one release, verifies the published install on both, and only then promotes to latest. The release gate is unchanged: tags require an explicit owner request.
  - Removed the browser HTTP/WebSocket server (`server.mjs`), its test, `npm start`/`dev` and the `ws` dependency. Updated texts in README, UI, mod guide and package metadata.
- **Verified locally (Linux container, software rendering):** 216/216 tests, both packaged Linux smoke tests (`--smoke-test`, `--mod-smoke-test`) with captures, Linux patcher tests, installation of the real Linux package through the patcher code and a started smoke test of that installation, and an Avalonia patcher window capture. The Windows patcher sources compile against .NET Framework 4.8 reference assemblies with C# 7.3. They were not run on Windows here, and Windows CI must confirm. STUN could not be verified here because the container blocks UDP; see the CI step.
- **Codex review IH-20261125-difficulty-review:** no conflicts. Its suggested regression for the next swarm timer and the walker HP at swarms 5 and 10 was added. Still open from it: a fully upgraded single-turret probe, a human Standard session, a matrix rerun on main, and a test that loads a pre-change save mid-attack.
- **Still browser-era / next steps:** saves still live in Chromium `localStorage` inside Electron (move to files under the user-data folder, with migration; needed for Steam Cloud). Save export uses a download link (use a native save dialog). The game is still served as one inlined HTML bundle. The Linux patcher needs a desktop menu entry. No TURN relay.

### 2026-11-25 — Claude Code — difficulty pass for enjoyment

- **Owner request:** balance the game so it is not too hard to be enjoyable; Windows-only, no browser product. This supersedes the earlier balance runs' practice of always keeping game values unchanged.
- **Implemented and merged to `main` with explicit owner approval on 25 Nov 2026:** Standard preparation 120 s and 110 s between swarms. Relaxed 160/135 s. Veteran keeps Standard timing and changes to 1.15×/1.08×/1.10×. The count exponent is now 1.45 (was 1.55), HP grows 3%/swarm (was 3.5%) and the late damage multiplier is `1.05+0.01·(w−8)`. The first Abyss walker (swarms 5–9) has 60% HP.
- **Verified (scripted bots, not humans):** default matrix with 4 victories in 27 ordinary Standard/Veteran campaigns before the change. After it, all full Standard strategies win 21/21 and Veteran wins 3/4. Holdouts 3301/5557 won 14/14 full strategies. Single gun and no_artillery still lose. 215/215 tests, build and render checks passed. [Report](docs/playtests/balance-2026-11-25-difficulty.md).
- **Unresolved:** human playtest of Standard. If it is too easy, adjust the count exponent first. No Windows build or patcher release was requested. Codex review was requested as `IH-20261125-difficulty-review`, but the GitHub workflow stopped because the `OPENAI_API_KEY` secret is missing. The owner approved the merge without waiting for it. The balance agent's 25 Nov 01:27 run measured the old values; later runs measure the new ones and are not comparable to earlier controls.

### 2026-11-24 — Codex — 0.21.3 patcher release

- The owner authorized a patcher release of the verified logistics and electronics changes. Public version `0.21.3` includes faster Dispatch hubs, Component factory warehouse feed, electronics upgrade gains, physical timber output and Find turret in ammunition warnings. The release uses the existing `0.21.2` patcher binary and verifies the exact published Windows installation before latest promotion.
- [Release run 45440539360](https://github.com/Guffy-dk/Ironhaven/actions/runs/45440539360) passed automated tests, Windows startup and installation of the published ZIP, then promoted [v0.21.3](https://github.com/Guffy-dk/Ironhaven/releases/tag/v0.21.3) to latest. Source `4542f55`. The Windows ZIP is 198,738,876 bytes with SHA-256 `8828edbf039afa4d03ab6f84ff6ae4cf080229893d49c921daad097c2e452d64`. The downloaded patcher matched `v0.21.2` byte for byte.

### 2026-11-24 — Codex — electronics upgrades and timber transport

- Stealth requested stronger upgrade gains for circuits and components and reported that wood never reached the Resin kettle on belts. Internal candidate `0.21.2.3` adds 20% of base speed per upgrade to Circuit assembler and Component factory. This gives 2× base speed at level 6 and 3× at level 11. Mines and smelters gain 25% per upgrade and ordinary workshops gain 10%.
- The Sawmill now has a rotatable gold outlet. A compatible attachment receives buffered timber. Without a connected receiver or room in the output buffer for a batch, new wood enters shared stock. Existing unconnected sawmills can still fuel generators. A regression test rotates a Sawmill and proves timber travels over a real belt into a Resin kettle with physical coal input and shared resin output.
- With full ingredient supply for 60 simulated seconds, level-11 Circuit assembler deliveries increased from 29 to 44 and Component factory deliveries from 23 to 35. All 215 automated tests, renderer checks and the Windows startup checks passed. The change is on main via [PR #33](https://github.com/Guffy-dk/Ironhaven/pull/33). [Internal Windows build 0.21.2.3](https://github.com/Guffy-dk/Ironhaven/actions/runs/45439218381/artifacts/14942483667) · [Windows captures](https://github.com/Guffy-dk/Ironhaven/actions/runs/45439218381/artifacts/14943625204).

### 2026-11-24 — Codex — Dispatch throughput and component warehouse feed

- Stealth reported slow Dispatch hubs and difficult three-material routing into Component factories. An otherwise open level-one or level-21 belt delivered 20 items per simulated second. One hub or a chain of eight reduced that to 4. Internal candidate `0.21.2.2` uses a two-item FIFO and forwards one existing item per tick. A chain of eight reaches 20 items per second in either building iteration order. Quotas and blocked-output behavior are exercised by the logistics tests, including reopening a save with a blocked hub.
- Matched one-minute steel fixture (seed 417, 16 level-three drills and smelters, eight hubs, 16 foundries and warehouses, 306 supply for 208 load) delivered 68 steel in `0.21.2` and 261 with the candidate. Eight warehouses received steel before and all sixteen after. The fixture uses prepared power and an exact repeated factory layout.
- At a Component factory, point an adjacent Warehouse outlet at the machine and use **Enable warehouse recipe feed**. Feed the Warehouse steel, circuits and gears on up to three separate belts. It supplies the `2 steel + 2 circuits + 1 gear` recipe from its physical stock above the configured reserve. A test verifies physical delivery on three belts and exact local stock accounting.
- The owner considered multiple belt lanes and showed two Component factories flanking one Warehouse. With one fixed outlet, the matched level-one fixture produced 0 and 8 components over 60 seconds. Alternating the existing Warehouse direction at each export opportunity as a test proxy produced 6 at each factory. An optional mode feeding multiple adjacent recipes from one Warehouse is a design proposal.
- At level 11 with level-21 belts, a prepared factory using one collector and eight hubs delivered 334 steel in 60 seconds. Dividing the same 16 production lines across two separate collectors and eight total hubs delivered 518. Both tests had 486 power available and 320 load. Collector arrangements differ in path length and routing as well as capacity.
- [PR #32](https://github.com/Guffy-dk/Ironhaven/pull/32) merged after all 213 automated tests and the Windows checks passed. [Internal Windows build 0.21.2.2](https://github.com/Guffy-dk/Ironhaven/actions/runs/45434071285/artifacts/14941510525) · [Windows captures](https://github.com/Guffy-dk/Ironhaven/actions/runs/45434071285/artifacts/14940930814).

### 2026-11-24 — Codex — Stealth's steel warehouse report

- The owner clarified that Stealth's report concerns shared steel availability. The screenshot shows a multi-foundry steel line feeding warehouses. The top stock counter is outside the crop.
- Reproduced direct Steel foundry delivery using the `0.21.2` simulation. Six foundries sent 18 steel to three warehouses. Each held six, and the shared counter showed 18. A distant Mortar turret consumed those 18 through an ordinary build command. An empty fourth warehouse could not send any of that shared steel to its adjacent conveyor. All 17 targeted storage and logistics tests passed.
- For physical export in `0.21.2`, open **Details & settings** → **Warehouse output**. Select a material such as **Steel** for a belt. **Adjacent machine recipe** serves a directly connected recipe machine. The outlet uses the warehouse's local stock above its configured reserve.

### 2026-11-24 16:27 Europe/Copenhagen — Codex — repair reserve experiment

- Simulation `3a54467`, measuring driver `0505827`. 35 earned-resource scenarios. The optional reserve deferred non-lighthouse repairs during combat to leave the cost of one sentry, while other construction remained possible. Paired outcome: 3 bedre, 7 dårligere og 5 lige.
- No balance numbers or release metadata changed. Next isolate persistent power failure and recovery. [Report](docs/playtests/balance-2026-11-24-repair-reserve.md).

### 2026-11-24 13:27 Europe/Copenhagen — Codex — ammo warning navigation

- UI commit `3354fd0`, merged in [PR #31](https://github.com/Guffy-dk/Ironhaven/pull/31) at `2818265`. Internal build `0.21.2.1`. Find turret in the existing ammunition alert focuses and selects the affected turret through the building inspector. The simulation stays at `7dfc892`. 35 earned-resource scenarios on two workers. [Report](docs/playtests/balance-2026-11-24-ammo-shortcut.md).
- The public patcher remains on 0.21.2. Local suite passed 210 tests and [Windows CI](https://github.com/Guffy-dk/Ironhaven/actions/runs/45394771250) captured the selected mortar. Next gather human playtest evidence for the alert in live combat.

### 2026-11-24 10:27 Europe/Copenhagen — Codex — sentry fallback and fuel window

- Baseline `96fe517`, driver `90f2033`. 35 ordinary-command runs on two workers. The optional sentry fallback was exercised in 1 of 15 pairs. Generator comparison reports the first 600 seconds of operation where both measurements covered the window.
- No gameplay or release metadata changes. Next assess whether the existing player-facing ammo warning can point to the affected flank and keep the fallback as a separate test strategy. [Report](docs/playtests/balance-2026-11-24-sentry-fallback.md).

### 2026-11-24 07:27 Europe/Copenhagen — Codex — coal versus marine

- On released source `fbe2f6f` (0.21.2), 35 earned-resource campaigns compared the physical bearing line to ordinary coal power. Coal versus marine campaign rank: 5 bedre, 2 dårligere og 8 lige. The two options differ in build and upgrade availability. Game balance and release metadata kept as checked out.
- Seed 6197 stalled with one spitter and no turret ammo. A normally built sentry cleared the enemy in 22.8 simulated seconds from the saved endpoint. Next test local fallback defense and compare matched fuel, replacement spending and delivered power over a fixed window. [Report](docs/playtests/balance-2026-11-24-coal-vs-marine.md).

### 2026-11-24 — Codex — Loeth Studios launch intro

- Owner requested a short startup film and reusable Loeth Studios branding with detailed reflections, shadow and animation. The internal Windows build `0.21.1.1104` starts with a three-second studio animation. It uses indigo glass, pearl lettering and a moving light strip. Escape skips the animation.
- The Windows shell shows the studio screen while it reads the packaged game and loads enabled mod prototypes. All video and poster data are embedded locally. The original branding and animation sources are in [studio/loeth-studios](studio/loeth-studios/README.md).
- The studio mark is designed for reuse across games. The PSD has four named raster layers, and the SVG contains editable outlines. The Blender project packs its lettering and includes a separate edit timeline. The standalone MP4 is 960 × 540 at 24 fps. Local checks verified the media duration, complete playback, Escape skip and the editable files. [PR #30](https://github.com/Guffy-dk/Ironhaven/pull/30).
- The owner authorized a patcher release with the intro. Public version `0.21.2` combines the intro, compact HUD and material art. The release reuses the `0.21.1` patcher executable and verifies installation of the exact published package before making it the latest version.
- [Release run 45307446818](https://github.com/Guffy-dk/Ironhaven/actions/runs/45307446818) passed automated tests, both Windows startup checks, and installation of the published ZIP, then promoted [v0.21.2](https://github.com/Guffy-dk/Ironhaven/releases/tag/v0.21.2) to latest. The game was built from `fbe2f6f`. The Windows ZIP is 198,737,493 bytes with SHA-256 `2a7be6b17f9c4b8f37f0643fc2ce303fcfe1bdcbeee9a85d63cf8bf19969c25e`. The patcher matches `v0.21.1` byte for byte. [Studio intro captured at Windows launch](https://github.com/Guffy-dk/Ironhaven/releases/download/v0.21.2/Ironhaven-studio.png) · [Harbor Works prices captured in game](https://github.com/Guffy-dk/Ironhaven/releases/download/v0.21.2/Ironhaven-build-costs.png).

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
