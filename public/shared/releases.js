// Release history is also the source for the in-game menu and GitHub release notes.
// Add a new entry and bump package.json together for EVERY release, including patches.
export const RELEASE_STAGE = 'alpha';
export const CURRENT_VERSION = '0.4.1';
export const displayVersion = v => v.endsWith('.0') ? v.slice(0,-2) : v;
export const RELEASES = [
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
