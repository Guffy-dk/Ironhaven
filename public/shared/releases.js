// Release history is also the source for the in-game menu and GitHub release notes.
// Add a new entry and bump package.json together for EVERY release, including patches.
export const RELEASE_STAGE = 'alpha';
export const CURRENT_VERSION = '0.8.1';
export const displayVersion = v => v.endsWith('.0') ? v.slice(0,-2) : v;
export const RELEASES = [
 {
  version:'0.8.1',date:'2026-11-16',title:'Windows playtest',
  changes:[
   'Added a standalone Windows x64 build that starts from Ironhaven.exe without a browser window or separate server.',
   'Added Ironhaven Patcher to download and verify the latest Windows build on GitHub and install it into a versioned folder.',
   'Desktop saves and checkpoints are shared across installed game versions. Export a JSON world backup from the browser edition to bring an existing world over.'
  ]
 },
 {
  version:'0.8.0',date:'2026-11-16',title:'Field training',
  changes:[
   'Replaced the reading-only tutorial with in-world training. Move the engineer, construct working iron and gear lines and set up defenses before the first swarm countdown.',
   'New expeditions start at the core with starter buildings packed into the host inventory. Skipping training starts the countdown directly. Saves resume an ongoing task or preserve a completed world.',
   'Rebuilt machine port labels with high-resolution textures, bold lettering and high-contrast colors. Selected machines and blueprints show larger labels. At wide zoom, port markers stay colored and text focuses on the selected machine.',
   'The logistics inspector identifies the purple RET port as the output for a separate return conveyor.'
  ]
 },
 {
  version:'0.7.0',date:'2026-11-15',title:'Swarm round bonuses',
  changes:[
   'Every swarm activates a colony bonus that lasts until the next swarm. The HUD shows the active and upcoming bonuses, and a notification appears when a new one starts.',
   'Bonuses rotate between faster production, 15 shots per gear, reduced barricade damage and cheaper repairs. The evacuation swarm adds six colony power.',
   'Round bonuses are shared in co-op and follow the current swarm when a save or checkpoint is loaded.'
  ]
 },
 {
  version:'0.6.2',date:'2026-11-14',title:'Conveyor drag building',
  changes:[
   'Hold left click and drag to preview a conveyor line along the current arrow. Press R to turn clockwise or Shift+R to turn counterclockwise, then keep dragging. Release to build the whole line.',
   'Each preview tile shows its output arrow. Dragging back shortens the current segment. Blocked lines do not partially build or change existing conveyor directions.',
   'Shift-click and Shift-drag still plan routes around obstacles.'
  ]
 },
 {
  version:'0.6.1',date:'2026-11-14',title:'Better ground to defend',
  changes:[
   'New colonies start with 180 iron plates and an exposed iron deposit near the core. Starter barricades leave iron and copper deposits clear.',
   'Iron drills and smelters cost fewer plates. Iron ore and plates take 1.6 seconds per production cycle.',
   'New maps group trees into dense groves. Hostiles move at 45% speed through tree tiles on both new and saved maps.',
   'Turret upgrades add more damage per shot. Range increases in smaller steps from 10 to 13 tiles.',
   'Manual conveyor placement keeps previously built arrows intact. R rotates the blueprint in build mode. Smart routes avoid redirecting connected belts and merge into existing belt endpoints without flipping them.'
  ]
 },
 {
  version:'0.6.0',date:'2026-11-14',title:'A clearer front',
  changes:[
   'Each swarm attacks from a single side. An arrow over the playfield announces the next direction and turns red in the last 20 seconds and during the attack.',
   'One Smelter handles iron and copper ore in arrival order. Existing copper smelters and packed inventory migrate automatically.',
   'Increased text size and contrast in the HUD, building inspector, hotbar and menus.'
  ]
 },
 {
  version:'0.5.1',date:'2026-11-14',title:'Local development handoff',
  changes:[
   'Converted test fixture URLs to native filesystem paths, supporting Windows drive letters and folders containing spaces when opening the repository in a local Codex project.',
   'The consolidated project handoff is included for continuing in another conversation. Gameplay and dispatch plans are unchanged from 0.5.'
  ]
 },
 {
  version:'0.5.0',date:'2026-11-14',title:'Dispatch the expedition',
  changes:[
   'Added Transfer relays: original cargo-capsule stations that load a machine from a shared conveyor across a one-tile gap.',
   'Added Dispatch hubs: compact programmable junctions with rear input, a Machine branch on the left, Forward ahead and a separate Return port on the right.',
   'Both units run configurable Machine / Forward / Return batches, from 0 to 100 per destination. Default is 1 / 1 / 0; select a unit and press E or choose Program flow.',
   'Choose exact waiting or blocked-output bypass, a recipe-aware or explicit item filter, and one, two or four recipe cycles of input reserve.',
   'Delivery counters, current batch and blocked-source diagnostics explain actual flow. Items advance quotas only on successful delivery; filtered-out and bypassed items are counted separately.',
   'For equal supply to three stations, use 1:2, then 1:1, then 1:0 along the shared conveyor. The tutorial and field guide explain this layout and throughput limits.',
   'New expeditions open an eight-step tutorial. Skip tutorial is a remembered checkbox, and the guide can be replayed from the menu. The host expedition pauses while reading.',
   'Refocused the presentation on Ironhaven’s expedition, programmable dispatch plans and crew evacuation, with original relay and hub models rather than borrowed artwork.',
   'Logistics programs and progress survive pickup, area movement, saves and co-op synchronization. Older world saves migrate automatically.'
  ]
 },
 {
  version:'0.4.1',date:'2026-11-14',title:'Standalone packaging fix',
  changes:[
   'Fixed standalone HTML packaging: dollar-sign sequences in generated JavaScript are now preserved literally instead of being expanded by string replacement.',
   'Release builds now verify the exact embedded JavaScript, reject external or duplicate loaders and compile the final inline script before writing the download.',
   'Added packaging regression tests. This patch supersedes the 0.4.0 download; gameplay features and balance are unchanged.'
  ]
 },
 {
  version:'0.4.0',date:'2026-11-14',title:'Readable pressure',
  changes:[
   'Community-inspired diagnostics: I opens measured production versus maximum recipe demand, and B toggles machine bottleneck labels.',
   'Added Relaxed, Standard and Veteran threat presets. Veteran increases enemy strength without shortening Standard preparation time.',
   'Swarms preview their attack directions and head count. The minimap marks threatened edges during the last twenty seconds.',
   'Co-op adds ten percent more enemies per connected guest at spawn, without additional health inflation. Enemy count is capped at 480 to stay within the lightweight rendering budget.',
   'Brutes now have real extra health. Higher turret upgrades have moderated damage and firing-rate gains; stronger turrets draw more power and upgraded generators consume more fuel.',
   'Three rolling local checkpoints are kept separately from autosave. Retry the latest checkpoint after a loss with at least twenty seconds of preparation; the host restores the co-op world for all connected guests.',
   'Recently attacked buildings cannot be relocated or dismantled for five seconds, preventing free escape from combat. The core cannot move during an active swarm.',
   'Production history is bounded to sixty seconds, checkpoint reads are cached, and turret targeting uses squared-distance comparisons.',
   'Added community-source notes and reproducible simulation balance/performance checks. Actual player testing is still needed to tune difficulty further.'
  ]
 },
 {
  version:'0.3.0',date:'2026-11-14',title:'Industry to evacuation',
  changes:[
   'Drag with the left mouse button to select a group of buildings. Press M or Move to relocate the entire area without dismantling valid buildings.',
   'Moves validate deposits, occupied tiles, terrain and boundaries. Shift-click can pack invalid buildings into inventory after a confirmation, with a browser-local Don’t ask again option.',
   'Every building supports ten upgrades. Costs rise at each level, with steel and circuits required for advanced levels.',
   'Added warehouses and per-material storage capacity. Warehouse and command-core upgrades increase storage; full buffers stop deliveries without deleting stored materials.',
   'Hold Shift while moving to sprint, including diagonals.',
   'Added copper deposits, copper drills and smelters, steel foundries, circuit assemblers and component factories. The new materials supply advanced upgrades and evacuation.',
   'New endgame: survive eight swarms, construct an evacuation pad, provide ship components, steel and circuits, then hold the final launch defense.',
   'Swarm enemies now show health bars.',
   'Inspector, minimap, status panels and dialogs can be dragged. Panels can be minimized or closed; a dock keeps the default inspector and map apart. Restore them or reset their layout from the menu.',
   'Added JSON world export/import. Save locations are explained in the menu; normal and incognito browser storage remain separate.',
   'Existing 0.1 and 0.2 saves migrate when resumed or imported. Everyone must use the same game version for multiplayer.'
  ]
 },
 {
  version:'0.2.0',date:'2026-11-14',title:'A smoother colony',
  changes:[
   'The entire game, controls, descriptions and connection screens are now in English.',
   'North-up camera with smooth player following. WASD supports normalized diagonal movement and smoother collision sliding.',
   'Smart conveyor routes: Shift-click from your last placement or Shift-drag a preview. Routes fill every tile, turn corners, avoid obstacles and connect to existing lines.',
   'Conveyors show connected bends and junctions. Press R over an existing conveyor to rotate it in place, or use Rotate in the inspector.',
   'Dismantled buildings go into your personal inventory. Counts appear on the hotbar, and inventory is used before raw resources. Damage, ammunition and turret upgrades survive pickup.',
   'Factories show cyan IN ports and gold OUT ports on their actual operating sides.',
   'Softer machine models, organic ground, varied vegetation, animated engineers and conveyor cargo.',
   'Compact side-mounted swarm timer with a flashing red warning during the final 20 seconds.',
   'Damaged buildings show health bars until fully repaired. Turrets warn when ammunition is low or empty.',
   'Turrets can be upgraded to Mk II and Mk III for more damage, range, fire rate and durability.',
   'Added this versioned patch-notes menu. Release builds require matching version metadata and notes for every release.',
   'Existing 0.1 saves are migrated when resumed in the same browser storage. Multiplayer now checks game-version compatibility.'
  ]
 },
 {
  version:'0.1.0',date:'2026-11-14',title:'First light',
  changes:[
   'First playable factory-survival alpha with original procedural 3D graphics.',
   'Mining, conveyors, smelting, gear production, sawmills and generator power.',
   'Walls, automated turrets, engineer combat and eight escalating enemy waves.',
   'In-game LAN hosting for one host and three guests using direct WebRTC invitation and answer codes.',
   'Local world saves, a minimap and a self-contained HTML edition with no installation.'
  ]
 }
];
