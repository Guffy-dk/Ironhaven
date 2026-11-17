# Lighthouse in the fog

The `lighthouse-preview` draft has been integrated with the latest main branch for the Windows 0.14.0 release.

## Implemented

- Aim light button / L, click a map tile, Escape or right-click to cancel. A gradually turning authoritative bearing is interpolated by the renderer; pausing stops turning. Existing saves work without lighthouse fields.
- Shared beam coverage: 40 tiles, 40-degree cone, 20% extra defense acquisition range only for illuminated enemies. The minimap shows the same cone.
- Three animated fog layers using noise, with the reserved GLSL uniform name fixed and shader errors covered by Windows startup checks.
- Five coastal species with deterministic wave composition, species-specific runtime meshes and animated appendages: runner, drowned, guard, spitter and walker. Core hunters remain, spitters start in wave four and a walker appears every fifth wave.
- Bounded fear/lure responses, sustained-light armor exposure, spitter ranged strikes and mist interference. Combat and aiming run on the host; guests receive the same state.
- Windows-only distribution: embedded Electron resource, ZIP, patcher and checksum manifest. No Pages workflow or downloadable browser build.

## Art direction still in progress

Read [design/ART_DIRECTION.md](design/ART_DIRECTION.md). The approved workshop reference and new creature sheet are generated concepts, not runtime screenshots. The runtime now uses Blender-authored coastal creature meshes with LODs, six detailed brick workshop variants, mechanical conveyors with rollers and support frames, and structural modernization per upgrade. Editable Blender sources and repeatable export scripts are retained in the repository. Do not describe the full graphical overhaul as finished or revert to pixel art.

## Verification

Use Node.js 22 or later, `npm ci`, `npm test` and `npm run build`. On Windows run `./scripts/build-windows.ps1`; CI covers patcher validation and the actual Windows app startup and lighthouse controls. Actual multi-PC LAN and player hardware performance are separate checks.

## Fidelity and coast follow-up

The first released-candidate creature shapes were rejected by the user as too simple. The follow-up sculpts continuous anatomy in Blender, adds UV-preserved CC0 anatomical bases and PBR material surfaces, animated appendages and dynamic shadows, provides live creature inspection, moves new-expedition lighthouses to a headland and adds actual beacon lighting, fog scattering and HDR glow. The old candidate was never tagged or published; patcher latest remained 0.13.3 throughout the rework.
