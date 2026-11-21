---
name: ironhaven-art-direction
description: Improve Ironhaven's visual quality, building recognition, material hierarchy and presentation using actual ingame evidence. Apply to graphics, models, textures, lighting, UI and visual release review.
---

# Ironhaven art direction

Treat the player's difficulty distinguishing buildings from terrain as an unresolved product problem. Passing code tests or producing attractive concept art does not establish visual quality. Do not claim commercial readiness or player willingness to pay without player evidence.

## Read and inspect first

Read `docs/design/ART_DIRECTION.md`, the latest user requirements and any newer project instructions. Use `docs/design/approved-industrial-direction.png` and `coastal-creatures.png` as art references, explicitly distinguished from game screenshots. Inspect the current game before prescribing a fix; do not infer its current appearance from an old screenshot or source code alone.

Ironhaven combines coastal industrial automation, colony expansion and swarm defense. Factorio, Desynced, They Are Billions, Conan Unconquered and Colony Survival inform audience expectations; borrowed mechanics and visual ideas must fit Ironhaven's own lighthouse/island setting.

## Diagnose what players see

Capture a reproducible scene with seed/save, commit, camera, resolution, lighting and settings recorded. Include normal playing zoom, a distant overview, day/night, crowded production and an active defense line. Separate concept images, Linux render fixtures and actual Windows gameplay screenshots in filenames and reports.

Prioritize recognition at playing zoom:

- Identify miners, smelters, assembly buildings, storage and each defense type by silhouette and equipment layout. Labels support recognition; they do not replace it.
- Separate terrain, foundations, structures and moving units through value, material scale and restrained color accents. Use quieter ground below busy structures; avoid equally noisy brown/green textures everywhere.
- Keep detailed realistic brick, steel, stone, wood and coastal weathering, with consistent scale and lighting. Added texture noise is not added realism.
- Make belts' direction visible during placement and operation. Distinguish belt tiers without obscuring cargo. Check junctions and dispatch ports.
- Make upgrade levels readable with ordinary UI numbers and visible structural progression. Roman numerals belong only on physical textured signs if appropriate.
- Make walls, turret weapons, mortar profiles, ammunition state and enemy silhouettes readable during combat. Try restrained outlines/contact contrast only where evidence shows they help.
- Preserve the modern rounded UI, clear hierarchy, legible type and consistent spacing. Avoid adding permanent badges to compensate for every asset weakness.

## Improve a complete ingame sample

Choose the highest-impact issue and a bounded scene: terrain, one mining building, one processing building, one logistics element and one defense where relevant. Specify a shared palette, distinct silhouettes, material treatment, scale and lighting before creating assets. Implement a coherent representative sample in the actual renderer and compare matched before/after views. Extend to the full set only after checking the sample against the reference and gameplay needs. Existing broad implementation authorization applies; obtain visual approval only where the user's current instruction requires it.

Inspect available tools before promising a pipeline. Blender is useful for meshes, UVs and authored geometry; a local Blender installation is not proof that Blender MCP is connected. Use Game Asset Production for asset authoring when available, Game Asset Vendoring for package admission, and Game Visual Debugging for reproducible rendering defects. Discover actual commands and capabilities rather than assuming `game-dev` is installed. Missing optional tooling does not prevent ordinary local art-direction or renderer work. Report missing capabilities honestly.

Do not initiate paid generation without an authorized provider invocation and budget. Track source, license, provenance, texture dimensions and geometry budgets. Preserve editable sources and validate the actual runtime asset; a successful export or provider receipt is not a visual review.

## Verification and delivery

Use matched before/after screenshots to explain which visual defects changed and what remains. Inspect grayscale/value separation and smaller overview images as supplementary checks. Record actual observations, not fabricated recognition rates or claimed player preferences.

Run `npm test` and `npm run build` for code/asset integration as appropriate, and `npm run test:render` for renderer changes. Review screenshots as well as automated assertions. Measure completed frames for performance; CPU submission time is not GPU FPS. Use the existing Windows workflow for native screenshots and installation tests when available. A Linux Chromium fixture must never be presented as a Windows game capture.

Preserve save compatibility, Windows-only distribution and current release restrictions. New visual work is not permission to publish: respect the user's latest release instructions. Finish with the exact files changed, screenshot evidence, checks actually run, remaining issues and a concrete next priority. Do not label an asset pass as a completed game overhaul.
