# Ironhaven — Lighthouse in the fog

Windows x64 factory survival for 1–4 players on a local network.

**[Download the Windows patcher](https://github.com/Guffy-dk/Ironhaven/releases/latest)**

Run **Ironhaven-Patcher.exe**, choose **Install latest**, then **Play Ironhaven**. For manual installation, extract the entire **Ironhaven-Windows-x64.zip** and launch **Ironhaven.exe**. No separate runtime is needed. Windows x64 is the sole supported distribution; the game is not published as a browser edition.

## The expedition

Keep the lighthouse standing through 25 swarms. Mine ore, route conveyors into smelters and assemblers, deliver supplies to the lighthouse and fortify your industry. Starter buildings are in your personal inventory. Field training walks through the first production line; it can be skipped. Continue in endless mode after victory.

- **WASD / arrows:** pan; hold Shift to move faster. Mouse wheel or +/− zooms; clicking the minimap moves the camera.
- **Z / X / C / V:** production, defense, power, logistics. Number keys select a blueprint.
- **Left click:** build or select. Drag conveyors and walls to lay a line. **R / Shift+R** rotates; Shift-click or drag routes around obstacles.
- **L / Aim light:** click a map tile to set the lighthouse bearing. **Esc / right-click** cancels aiming. Turning pauses with the simulation.
- **Space / P:** pause. The host controls pause, speed and saving.
- **F:** dismantle or harvest a tree; Shift-drag clears trees.
- **U:** upgrade the selection. **M:** relocate a selected group. Recently attacked buildings cannot be moved or dismantled for five seconds.
- **E:** program a selected transfer relay or dispatch hub. **B:** machine diagnostics. **I:** production statistics.
- **Q / Esc:** exit the current tool. **?** opens the field guide.

## Coastal hostiles and the lighthouse

The beam reaches 40 tiles in a 40-degree cone. Defenses can acquire illuminated targets at 120% of their ordinary range; it does not increase damage, projectile splash or range against unlit targets. The minimap shows the actual bearing while the lantern turns.

| Species | Threat | Light response |
| --- | --- | --- |
| Shore runner | Fast crab-like raider | Briefly scatters sideways out of the beam |
| Drowned | Slow industrial raider | Briefly abandons nearby industry and approaches the lighthouse |
| Shell guard | Heavy melee unit; receives half damage through closed armor | 0.65 seconds of exposure removes armor protection; darkness restores it |
| Fog spitter | Ranged attack from 5.5 tiles; mist reduces acquisition range around unlit targets to 82% | Lighting the spitter clears its mist; lighting an individual target bypasses it |
| Abyss walker | Large lighthouse hunter, every fifth swarm | One second of exposure removes its 25% damage reduction |

Runners, Drowned and guards appear from the first swarm; spitters arrive in swarm four. Fear and attraction have limited durations and a ten-second response cooldown so a single fixed beam cannot indefinitely pin a wave. Existing core hunters remain part of the wave composition. Old saved enemies gain compatible species rendering without replacing their health or position.

Blender-authored creature meshes have species-specific silhouettes, distance LODs, surface grain and instanced appendage animation. Six production/workshop types use new Blender-authored brick architecture; upgrades add visible structural equipment. The approved realistic industrial art direction and creature concept sheet are in [docs/design/ART_DIRECTION.md](docs/design/ART_DIRECTION.md). Concept illustrations establish the art direction and are not runtime screenshots. The release includes an in-game image captured from the actual Windows package.

## Factory and upgrades

Conveyors hold up to four spaced items and back up when an output is blocked. Smelters process iron and copper ore. Assemblers consume plates to make gears; foundries, circuit labs and component factories supply advanced defenses. Gold arrows identify outputs; cyan arrows identify inputs. Select logistics units for port labels.

Transfer relays load a conveyor behind them into a machine ahead, with Return on the right. Dispatch hubs accept input behind, with Machine left, Forward ahead and Return right. Use Program flow for quantities, filters, buffers and bypass behavior.

Warehouses keep their own stock. Select a material or Adjacent machine recipe for their output. Deliver materials to the lighthouse to make them available for construction. Generators consume wood or coal; sawmills work near standing trees and do not need grid power. Power shortage suspends the newest machines first.

Sentry turrets consume no ammunition. Other weapons use gears; low/empty magazines are marked in the world. Upgrade production, storage, health and advanced defenses from the inspector; ten upgrades are supported. The visual goal for the upcoming architecture work is structural modernization at each level rather than roof recoloring.

## Saves and LAN

Saves, settings and rolling pre-swarm checkpoints live in the Windows app profile under `%APPDATA%\Ironhaven` and survive patcher updates. Save manually from the menu or use autosave. Export a JSON backup before moving to a different PC; import replaces the current world. Use the menu to retry a checkpoint. GitHub does not store player worlds.

Open your current world to LAN from the menu. Exchange one invitation and answer per guest, up to three guests. Every player must run the same game version. The host owns the simulation and saving; guests share industry, defense and lighthouse aiming. Keep the host's app open. There is no automatic host migration.

Networking is direct WebRTC without an internet relay or public signaling service. Local firewall rules, VPNs, guest Wi-Fi and client isolation can prevent connections. Reliable internet play is not provided.

## Build and release

Use Node.js 22 or later:

```sh
npm ci
npm test
npm run build
```

`release/Ironhaven.html` is an internal bundled Electron resource, not a standalone supported edition. Tests run shared simulation, DOM interactions, model geometry and LAN protocol checks. On Windows:

```powershell
./scripts/build-windows.ps1
```

This builds and tests the patcher, performs an isolated Windows startup smoke test, packages the game and writes the checksum manifest. Release versions come from `public/shared/releases.js`, `package.json` and `package-lock.json`; keep them in sync. Push a matching `v0.x.y` tag to run `.github/workflows/release.yml`. The release publishes **Ironhaven-Windows-x64.zip**, **Ironhaven-Patcher.exe** and **Ironhaven-Windows-manifest.json**. The patcher verifies the manifest's size and SHA-256 digest before installation. The release workflow installs the real published archive with the patcher test executable before promoting it to the latest patcher update.

Automated tests do not establish reachability between two physical PCs. Player hardware performance needs separate validation.
