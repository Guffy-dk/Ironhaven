# Ironhaven visual target

`approved-industrial-direction.png` is the user's approved visual target: believable coastal industry, detailed brick and steel architecture, wet ground, conifers, sea mist and restrained warm workshop lighting. This is a generated concept image, not a game screenshot. Do not substitute pixel art or the old minimalist model style.

`coastal-creatures.png` is the generated species design sheet: Shore runner, Drowned, Shell guard, Fog spitter and Abyss walker. The runtime creatures are authored with Blender in `scripts/blender/build_coastal_assets.py`; the editable native file is `coastal-creatures.blend`. Packed meshes and distance LODs are shipped in `public/art/coastal-meshes.json`, with articulated and vertex-animated appendages, instanced animation, UV-preserved anatomical PBR surfaces plus a four-surface material atlas and high-quality dynamic shadows in `public/coastal-hostiles.js`. These are actual game assets; the illustration remains a visual reference, not a runtime screenshot.

Blender-authored brick workshops, warehouse, foundry, electrical workshop and component workshop are exported by `scripts/blender/build_industrial_assets.py`. The editable native file is `coastal-workshops.blend`. Runtime modernization adds structural equipment per upgrade instead of recoloring roofs. The concepts establish the direction; this release does not claim photorealistic parity with the illustration.

The user connected Blender MCP in their local Codex client, which was not exposed to this cloud conversation. Blender 4.3.2 was available in the cloud environment and was used directly for mesh authoring and export.

## Gameplay / Windows

The shared host simulation owns beam turning, exposure, bounded fear/lure responses, armor, mist, ranged damage and wave composition. Rendering and LAN guests must not decide combat. Save fields are additive to preserve existing worlds.

Windows x64 is the sole distribution target. The HTML bundle is an internal Electron resource, not a downloadable browser edition. Release the ZIP, patcher EXE and checksum manifest through the existing Windows release workflow.

New expeditions use a coastal headland rather than placing the lighthouse in the factory clearing. `public/shared/coast.js` supplies the shared coastline for placement and terrain; existing worlds preserve their geometry. `public/lighthouse-light.js` supplies actual spotlight illumination and atmospheric scattering; the renderer uses HDR bloom and tone mapping. Runtime screenshots must come from the built Windows package.

CC0 anatomical bases from Grab3D are adapted by `scripts/blender/source_anatomy.py`. Original URLs, checksums, license and AI-assisted origin are recorded in `third-party-assets.json` and `THIRD_PARTY_ASSETS.txt`. Original UVs and normal maps are retained through mesh decimation. These are adapted bases rather than a claim of an exact reconstruction of the concept sheet.
