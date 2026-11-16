# IRONHAVEN

**Build. Fortify. Survive.** Original, lightweight 3D factory survival for one host and three LAN guests.

**[Download the latest standalone game](https://github.com/Guffy-dk/Ironhaven/releases/latest)**

Download **Ironhaven.html** and open it directly in a recent Chrome, Edge or Firefox with WebGL enabled. No installation, Node.js, CDN or server app is needed to play. All code and original graphics are in the file.

## Version 0.8 — field training

New expeditions start with a core and a starter kit in the host's inventory. Follow the in-world markers to move, build iron and gear lines, deliver items to storage and build defenses. The swarm countdown starts when you finish or skip training. Skipping gives you the same kit, ready to place. Existing worlds keep their buildings, and training saves resume at the current task.

## Included from 0.7 — swarm round bonuses

Every swarm activates a shared colony bonus. It lasts through the attack and the preparation time until the next swarm begins. The HUD shows the active and upcoming bonuses. Starting preparation has no active bonus.

| Round | Bonus |
|---|---|
| 1 | +15% iron and copper mining speed |
| 2 | +25% smelting speed for both ores |
| 3 | Turrets reload 15 shots per gear instead of 12 |
| 4 | Barricades take 30% less damage |
| 5 | +45% sawmill speed |
| 6 | Repairs use 1 iron plate instead of 2, with the usual wood cost |
| 7 | +50% ship component production speed |
| 8 | +10% speed for all production buildings |
| Evacuation | +6 colony power |

Speed bonuses multiply machine upgrades. Recipes still use their usual inputs and need power and room for their outputs. The HUD follows the saved swarm when you resume or restore a checkpoint.

## Included from 0.6.1 — terrain, balance and conveyor fixes

New colonies start with 180 iron plates and an exposed iron deposit near the core. Iron drills and smelters cost fewer plates, and each iron production cycle takes 1.6 seconds. Starter barricades leave the deposits clear. New maps group trees into groves. Hostiles move at 45% speed through trees, including on saved maps.

Turret upgrades give more damage per shot with smaller range increases. Range grows from 10 tiles at Mk I to 13 at Mk XI. Manual conveyor placement keeps the blueprint direction. In build mode, **R** rotates the blueprint. Exit build mode to rotate a conveyor in place. Smart routes join existing belts at endpoints and avoid crossing or redirecting connected lines.

## Included from 0.6 — a clearer front

Each swarm spawns on one edge. The arrow above the playfield points toward that edge and turns red in the final twenty seconds and during the attack. The HUD, inspector, build bar and menus use larger, higher-contrast text.

One **Smelter** accepts both iron and copper ore through its cyan IN ports. It processes mixed ore in arrival order and sends both products out of the same gold OUT port. Existing placed and packed copper smelters become universal smelters when a world loads.

## Included from 0.5 — programmable expedition logistics

**New here?** Use the remembered **Skip tutorial** checkbox to start the countdown right away. The field guide remains available with **?**. For a new Codex/ChatGPT conversation or local checkout, read [the complete project handoff](docs/PROJECT_HANDOFF.md).

Ironhaven’s focus is supplying, defending and evacuating an expedition. The new logistics units are **Transfer relays** with hovering cargo capsules and **Dispatch hubs** with explicit dispatch plans, using original procedural models.

### One conveyor, three machines

A **Transfer relay** occupies the tile between the conveyor behind it and the machine ahead. Rotate with R to point toward the machine. Its Forward quota leaves items moving along the source conveyor; Return loads a separate conveyor to its right.

A **Dispatch hub** sits directly on the main conveyor. Its rear accepts input, **Machine** branches left, **Forward** continues ahead and **Return** branches right. You can connect the Machine branch straight into a neighboring machine’s IN side or run a branch conveyor farther.

Select either unit and press **E** / **Program flow**:

| Setting | Meaning |
|---|---|
| Machine / Forward / Return | Successful deliveries per repeated batch, 0–100 each |
| Default 1 / 1 / 0 | One to the machine, one onward |
| 2 / 3 / 1 | Two to the machine, three onward, one into the return line, then repeat |
| Wait when blocked | Exact sequencing; no quota advances until that delivery succeeds |
| Waiting off | Try safe enabled alternatives; bypassed items do not consume the pending quota |
| Auto filter | Count only ingredients used by the connected machine’s recipe |
| Explicit filter | Count only the chosen item; other items pass forward |
| Input reserve | One, two or four recipe cycles of buffering |

For equal distribution to three identical stations, use **1:2 → 1:1 → 1:0** along the bus with Return 0. The return port requires its own connected route; do not point a belt back against incoming traffic. A blocked machine never causes cargo to disappear. Programs, partial batches and delivery counters survive packing, moving and saves, and synchronize in co-op.

Throughput is still finite. Each base smelter consumes one ore every two seconds; three at full load need 1.5 ore/second. Add or upgrade mining and transport capacity instead of expecting a dispatch plan to create missing ore. Relays consume power; hubs do not.

## Included from 0.4 — community-informed clarity and balance

**I** opens a production report: measured output, theoretical recipe demand and stock. **B** toggles machine labels that distinguish missing ingredients, blocked output, full storage, no power, no ammo and no fuel. [Community sources and decisions](docs/COMMUNITY_RESEARCH.md) explain what was adopted and why.

Choose **Relaxed**, **Standard** or **Veteran** before starting. Veteran increases enemy pressure without shortening Standard preparation time. Co-op adds 10% enemies per connected guest, with no extra health multiplier. The projected number of attackers is shown in the colony panel.

Three rolling checkpoints are stored before swarms, separately from ordinary autosave. Choose a checkpoint in the menu, or retry the latest after defeat. Restoring returns the actual earlier world with at least twenty seconds to prepare. The host restores all connected guests as well. Local checkpoints, like ordinary saves, are separate in normal/incognito profiles and are not uploaded to GitHub.

Brutes now have extra HP. Late turret gains are moderated; upgraded defenses consume more power and upgraded generators burn more fuel. A recently hit building cannot move or be dismantled for five seconds, and the core cannot move during a swarm. These rules prevent free escape without adding repair resources.

See [balance parameters and limits](docs/BALANCE.md) and the [recorded simulation run](docs/balance-0.4.json). The synthetic CPU test uses 700 buildings and 480 enemies; GPU performance and human game balance still require player testing.

## Included from 0.3

Drag to select buildings, press **M** to move the area, and click a valid destination. Moves check deposits, terrain, collisions and boundaries before changing the world. **Shift-click** allows invalid buildings to be packed into inventory after a confirmation. The popup offers **Don’t ask again**; reset this preference in the menu. The command core is never removed by an override.

Every building supports **ten upgrades** (base level plus ten upgrades), with increasing costs and additional health. Production buildings gain speed, generators gain output, conveyor upgrades improve transfer speed, and warehouses/core upgrades expand storage. Higher upgrades consume steel and circuits.

Hold **Shift + WASD** to sprint. Drag panel headers to move the inspector, minimap, colony panel and dialogs. Minimize/close panels with their header buttons; restore them or reset layout in the menu. The default right-side dock keeps the inspector and minimap separate.

### New production and endgame

| Production | Purpose |
|---|---|
| Copper drill → smelter → copper | Feed circuit assemblers |
| 2 copper + 1 plate → circuit | Advanced upgrades and evacuation components |
| 3 plates → steel | Advanced upgrades and evacuation structures |
| 2 steel + 2 circuits + 1 gear → ship component | Complete the evacuation objective |
| Warehouse | Adds 300 capacity for **each** material; upgrades increase this |

Storage starts at 300 per material. Full storage stops deliveries; reducing capacity never deletes an existing surplus. Hover material counters to inspect capacity.

**Endgame:** survive the first eight swarms, build an evacuation pad, gather **30 components + 60 steel + 40 circuits**, select the pad and begin evacuation. Defend the core and pad through the final swarm and a 90-second charge. The charge requires power; upgrading the pad shortens it. Victory requires the charge to finish and remaining enemies to be defeated. If the pad is lost, rebuild and restart; losing the core ends the expedition.

Enemies show health bars. The menu now includes **Export world backup** and **Import world backup** for JSON files, so you can transfer a world between browser profiles or computers.

### Included from 0.2

Smart turning conveyors and Shift-click/drag routes, north-up player-follow camera, diagonal movement, personal building inventory, in-place rotation, clear factory ports, visible damage and ammunition warnings, turret upgrades and a complete English interface.

Open **Menu → Patch notes & version history** to see changes for every version. The same history drives GitHub release notes. Development versions progress through **0.2, 0.3, …**; patches use **0.2.1, …**. Version 1 is reserved for the first full stable release. Build validation requires a matching version and patch-note entry for every release.

## LAN inside the game

1. Everyone opens the same version on the same local network.
2. The host starts or resumes a world and chooses **Menu → Open world to LAN**.
3. Create one invitation per guest and send it to that friend.
4. The guest opens **LAN Co-op → Join a world**, pastes the invitation and creates an answer.
5. The guest sends the answer to the host, who pastes it and chooses **Connect friend**.
6. Repeat for up to three guests.

You share materials, buildings, enemies and time. Packed buildings are personal inventory; a departing guest returns them to the host. Only the host controls time, saves and restarts. The host must keep the game open; use **Close LAN** to continue solo.

Networking is direct WebRTC with **no STUN/TURN or signalling service**. Codes exchange connection information; they are not an internet relay. Internet play is not reliable in this edition. Guest Wi-Fi, VPNs, firewalls or client isolation may block direct connections. Normal and incognito browser windows can be used as separate players for a same-computer test, but do not test reachability between physical computers or different networks. There is no automatic host migration.

## Factory and defense

Protect the core through eight swarms. Field training shows how to make two working lines:

- Drill → conveyor → smelter → core: iron plates for construction.
- Drill → conveyor → smelter → assembler → core: two plates become one gear, used for turret ammunition and upgrades.
- Sawmills near trees supply three wood every three seconds. Generators consume one wood every twelve seconds to provide eighteen power; the core supplies eighteen power itself.
- Cyan **IN** ports accept items. Gold **OUT** ports deliver them. Purple **RET** on Transfer Relays and Dispatch Hubs sends items to a separate return conveyor when the Return quota is enabled. Select a machine to enlarge its port labels.
- Turrets support ten upgrades through Mk XI. Upgrades improve damage, range, fire rate and health. One gear reloads twelve shots.
- Dismantling packs a building into your inventory, preserving damage, upgrades, cargo and ammo. Placement consumes inventory before raw materials. Hotbar numbers show your count.

| Controls | Action |
|---|---|
| WASD, including W+A | Move in screen directions; diagonals have equal total speed |
| Arrow keys / minimap | Free camera |
| Space / ⌖ | Follow your engineer |
| Wheel / + / − | Zoom |
| 1–8 | Conveyor, drill, smelter, assembler, sawmill, generator, turret, barricade |
| 9 / 0 | Repair / dismantle; dismantle trees for wood |
| Left click | Build or inspect |
| Hold left-click and drag a conveyor | Preview a straight line along the blueprint arrow. Press R or Shift+R to set a corner, then continue. Release to build |
| Shift-click endpoint | Route from your last conveyor/barricade placement |
| Shift-drag | Preview a new route; release to build |
| R | Rotate the blueprint in build mode. Otherwise rotate a conveyor under the pointer or a selected directional building |
| U | Upgrade selected building |
| E | Program selected relay / hub |
| Left-drag without a build tool | Box-select buildings |
| M | Move the selected area |
| Shift while moving | Sprint |
| Q / Esc / right click | Exit build mode / cancel route |
| P | Pause, host only |
| ? | Field guide |
| I | Production report |
| B | Machine bottleneck overlay |

Smart routes avoid trees, rocks and buildings, fill every tile and connect to machine inputs. A route is built atomically: insufficient resources reject the whole operation. Routes have a maximum of 128 tiles.

## Where worlds are saved

Worlds save automatically every thirty seconds and manually with **Save** into browser **localStorage**, key `ironhaven.save.v1`. Rolling checkpoints use `ironhaven.checkpoints.v1`; window layout uses `ironhaven.windows.v1`. This key remains the same while the save schema is migrated. Old 0.1 and 0.2 saves migrate when resumed in the same browser storage.

Only the host saves a multiplayer world. Browser profiles and incognito sessions have separate storage. Incognito saves usually disappear when all incognito windows close. GitHub stores source and releases, not your world. Different sites or local-file paths may use different storage; when updating the downloaded edition, retain its original folder and filename. Deleting browser data deletes the save. There is one local save slot. Export JSON backups from the menu before clearing data or changing browser profiles. Importing a backup replaces that browser’s current save. Close LAN before importing.

## Development and checks

Node.js 22+ is for development only:

```sh
npm ci
npm test
npm run build
npm start
```

Open `http://localhost:3000`. Build creates `public/vendor/`, `dist/index.html`, `release/Ironhaven.html` and `release/RELEASE_NOTES.md`. Generated artifacts are ignored in Git.

Tests cover the simulation, live UI controls with the GPU stubbed, real Three.js geometry/projection, and a four-client development WebSocket session. Optional direct WebRTC integration:

```sh
npm install --no-save --package-lock=false @roamhq/wrtc@0.9.1
node scripts/check-rtc.mjs
```

The WebSocket development server is not needed for the game's in-browser LAN hosting. Tests establish protocol behavior and rendering math; **visual browser QA and two physical LAN computers remain unverified** in this environment.

Release metadata lives in `public/shared/releases.js`. Update it and `package.json` together for every version or patch. `npm run build` validates history, generates notes and verifies release tags. Push a matching `v0.x.y` tag to publish the tested, standalone file through GitHub Actions. Main-branch CI tests and builds without publishing a release.

Optional Pages hosting: the owner can enable **Settings → Pages → Source: GitHub Actions**, then run **Publish playable game**. The integration cannot enable Pages administration itself. The downloaded edition works independently.

Run `node scripts/check-balance.mjs` for deterministic balance scenarios and a bounded CPU stress check.

## Graphics and scope

Three.js, original procedural rounded machine models, connected conveyor geometry, continuous ground, varied vegetation and animated engineers. No borrowed game assets. Terrain, trees and enemies use instancing. The simulation runs at twenty ticks/second; guests receive ten snapshots/second. **Graphics: light** disables shadows.

This is an alpha with one sector and eight waves. Three.js is MIT-licensed; its full license is embedded in the standalone HTML and included in hosted build output.
