// Release history is also the source for the in-game menu and GitHub release notes.
// Add a new entry and bump package.json together for EVERY release, including patches.
export const RELEASE_STAGE = 'alpha';
export const CURRENT_VERSION = '0.2.0';
export const displayVersion = v => v.endsWith('.0') ? v.slice(0,-2) : v;
export const RELEASES = [
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
