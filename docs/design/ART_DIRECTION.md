# Ironhaven visual target

`approved-industrial-direction.png` is the user's approved visual target: believable coastal industry, detailed brick and steel architecture, wet ground, conifers, sea mist and restrained warm workshop lighting. This is a generated concept image, not a game screenshot. Do not substitute pixel art or the old minimalist model style.

`coastal-creatures.png` is the generated species design sheet: Shore runner, Drowned, Shell guard, Fog spitter and Abyss walker. The first runtime models are built in `public/coastal-hostiles.js`, with species-specific meshes, articulated appendages, shared geometry, surface grain and instanced animation. They are functional game assets, not a claim of concept-image fidelity. Detailed authored meshes and animation can replace these prototypes without changing authoritative species behavior.

The intended next architecture work is one detailed workshop and its conveyor connection compared directly against the approved reference. Upgrade levels should add visible structural and machinery changes, progressing toward modern equipment; roof recoloring alone does not meet the user's requirement. The complete architectural and landscape overhaul is not part of the completed creature-mechanics work.

Blender integration was suggested as a way to author detailed models, UVs, materials and skeletal animations; no Blender MCP was connected during this implementation.

## Gameplay / Windows

The shared host simulation owns beam turning, exposure, bounded fear/lure responses, armor, mist, ranged damage and wave composition. Rendering and LAN guests must not decide combat. Save fields are additive to preserve existing worlds.

Windows x64 is the sole distribution target. The HTML bundle is an internal Electron resource, not a downloadable browser edition. Release the ZIP, patcher EXE and checksum manifest through the existing Windows release workflow.
