# IRONHAVEN

**Build. Fortify. Survive.** Original, lightweight 3D factory survival for one host and three LAN guests.

**[Download the latest standalone game](https://github.com/Guffy-dk/Ironhaven/releases/latest)**

Download **Ironhaven.html** and open it directly in a recent Chrome, Edge or Firefox with WebGL enabled. No installation, Node.js, CDN or server app is needed to play. All code and original graphics are in the file.

## Version 0.2

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

Protect the core through eight swarms. The starter colony has two working lines:

- Drill → conveyor → smelter → core: iron plates for construction.
- Drill → conveyor → smelter → assembler → core: two plates become one gear, used for turret ammunition and upgrades.
- Sawmills near trees supply three wood every three seconds. Generators consume one wood every twelve seconds to provide eighteen power; the core supplies eighteen power itself.
- Cyan **IN** ports accept items. Gold **OUT** ports deliver them. Machine outputs and conveyor arrows reflect their actual directions.
- Select a turret to upgrade to Mk II or Mk III. Upgrades improve damage, range, fire rate and health. One gear reloads twelve shots.
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
| Shift-click endpoint | Route from your last conveyor/barricade placement |
| Shift-drag | Preview a new route; release to build |
| R | Rotate a conveyor under the pointer or a selected directional building; otherwise rotate the blueprint |
| U | Upgrade selected turret |
| Q / Esc / right click | Exit build mode / cancel route |
| P | Pause, host only |
| ? | Field guide |

Smart routes avoid trees, rocks and buildings, fill every tile and connect to machine inputs. A route is built atomically: insufficient resources reject the whole operation. Routes have a maximum of 128 tiles.

## Where worlds are saved

Worlds save automatically every thirty seconds and manually with **Save** into browser **localStorage**, key `ironhaven.save.v1`. This key remains the same while the save schema is migrated. Old 0.1 saves migrate when resumed in the same browser storage.

Only the host saves a multiplayer world. Browser profiles and incognito sessions have separate storage. Incognito saves usually disappear when all incognito windows close. GitHub stores source and releases, not your world. Different sites or local-file paths may use different storage; when updating the downloaded edition, retain its original folder and filename. Deleting browser data deletes the save. There is one local save slot.

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

## Graphics and scope

Three.js, original procedural rounded machine models, connected conveyor geometry, continuous ground, varied vegetation and animated engineers. No borrowed game assets. Terrain, trees and enemies use instancing. The simulation runs at twenty ticks/second; guests receive ten snapshots/second. **Graphics: light** disables shadows.

This is an alpha with one sector and eight waves. Three.js is MIT-licensed; its full license is embedded in the standalone HTML and included in hosted build output.
