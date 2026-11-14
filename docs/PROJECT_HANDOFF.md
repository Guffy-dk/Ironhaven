# Ironhaven — project handoff

This note transfers the development context to another ChatGPT/Codex conversation or a local checkout. It is a summary, not an export or merger of chat history. The code repository is https://github.com/Guffy-dk/Ironhaven.

## Product direction agreed with the user

- Lightweight, original 3D expedition / factory-survival game inspired by the genres of Factorio and They Are Billions. Preserve Ironhaven’s own identity, presentation and mechanics; avoid becoming a direct clone.
- Product language is **English**; user-facing conversation has been in Danish.
- Multiplayer must open **inside the game** for one host and up to three guests. No separate server application or Node installation for players.
- The user tests a normal browser and an incognito window. Each has separate saves. Internet play is not guaranteed: the current direct WebRTC implementation has no STUN/TURN infrastructure.
- Maintain development versions 0.2 → 0.3 → 0.4 → 0.5, with patches such as 0.4.1. Do not move to 1.x until the first full stable release is ready.
- Every release and patch must update the **in-game patch-history menu**. `public/shared/releases.js` is the source of truth and build validation enforces it.

## Latest work: 0.5 — Dispatch the expedition

- **Transfer relay** (internal type `inserter`): a custom hovering cargo-capsule station, placed in the tile between a conveyor behind it and a machine ahead. Forward means leaving matching cargo to continue on that source conveyor; Return uses the relay’s right-side port and requires a separate line.
- **Dispatch hub** (internal type `splitter`): a one-tile programmable junction in the main conveyor. Rear input, Machine branch to its left, Forward ahead, Return to its right.
- Select a unit and press **E**, or click **Program flow**. Set Machine / Forward / Return batch quantities, 0–100 each, with at least one nonzero output. Default is **1 / 1 / 0**. A 2 / 3 / 1 program repeats those exact successful deliveries.
- Choose exact waiting or blocked-output bypass. Bypassed / filtered-out items do not advance the programmed batch and have a separate count. Auto filtering follows the target machine’s recipe; an explicit item filter is also available.
- Input reserve is one, two or four recipe cycles. It prevents a relay from hoarding an unlimited machine buffer. Transfer capacity improves with upgrades; one relay costs one base power, and a dispatch hub costs no power.
- For three equal consumers along a single bus: **first 1:2, middle 1:1, last 1:0**, Return 0. Supply throughput still matters; one base drill cannot fully utilize three smelters.
- A new-world tutorial explains the expedition, controls, logistics, quotas, shared-bus example, defense and evacuation. **Skip tutorial** is a remembered checkbox. Menu → Expedition tutorial reopens it. It pauses the host’s world while reading and resumes the previous pause state when closed. Resuming saves does not trigger a new-world tutorial.
- The hero and brand presentation now emphasize supplying and evacuating the expedition, and both logistics models are original procedural geometry.

## Earlier implemented features

0.2: English UI; connected curved conveyors; Shift-click/drag smart routes; in-place rotation with R; Q/Esc to exit building; north-up camera, normalized diagonal movement and player following; packed personal building inventory with hotbar counts; input/output markers; damage bars; ammo warnings; turret upgrades; compact swarm warning with a final-20-second flash; patch-history menu.

0.3: drag-select and M to relocate groups; validate the whole destination; Shift override packs invalid buildings after confirmation with “Don’t ask again”; preserve the core; ten upgrades for every building; warehouses and per-resource capacity; Shift sprint; copper, steel, circuits and ship components; evacuation objective; enemy health bars; draggable/minimizable/closable windows and a non-overlapping inspector/map dock; JSON save export/import.

0.4: measured production and theoretical demand (I), bottleneck overlay (B); three threat presets; forecast attack edges/counts; modest co-op scaling; brutes have extra HP; moderated late turret growth and higher power/fuel costs; rolling pre-swarm checkpoints and retry; five-second relocation lock after damage, and no core relocation during a swarm; bounded metrics and optimized turret targeting.

0.4.1: fixed a standalone packaging bug caused by dollar-sign expansion in JavaScript `String.replace` replacement strings. **Never reintroduce interpolated replacement strings for the generated bundle.** `scripts/package-html.mjs` uses callback replacements, compares the embedded script exactly and compiles it with `node:vm` before producing the artifact.

## Source and validation

- `public/shared/sim.js`: pure deterministic authoritative simulation, commands, production, programmable logistics and save migration. Same module in solo browsers, co-op host and optional Node test server.
- `public/app.js`: controls, DOM UI, co-op host state, tutorial, programs, local saves/checkpoints, box selection and dialogs.
- `public/render.js`: original Three.js models, connected conveyors, capsule animation, instancing, camera, selections and projections.
- `public/shared/tutorial.js`: onboarding content.
- `public/shared/releases.js`: version and full history.
- `public/shared/saves.js`: JSON validation and packing; raw world data is not stored on GitHub.
- `test/`: simulation, actual recipe delivery, transport conservation and ratios, input validation, UI logic with GPU stubbed, real Three.js geometry/projection, packaging and development-server tests.
- `scripts/check-rtc.mjs`: optional native WebRTC check, one host plus three guests, with construction, movement, upgrades, inventory and programming commands.
- `scripts/check-balance.mjs`, `docs/BALANCE.md`, `docs/balance-0.4.json`: reproducible synthetic CPU / balance evidence, not a human-playtest or GPU-FPS guarantee.
- `docs/COMMUNITY_RESEARCH.md`: primary community sources and adopted / deferred ideas.

Development:

```sh
npm ci
npm test
npm run build
npm start
```

Development uses Node.js 22+. Players download `Ironhaven.html` from Releases and open it directly. Generated output is `release/Ironhaven.html`, `release/RELEASE_NOTES.md`, `dist/index.html`, plus `public/vendor/`; these are ignored in Git.

Optional direct networking test:

```sh
npm install --no-save --package-lock=false @roamhq/wrtc@0.9.1
node scripts/check-rtc.mjs
```

## Releases

Update package and release metadata together. Build and test before committing. Push a matching `v0.x.y` tag; `.github/workflows/release.yml` builds/tests and uploads the single HTML file using GitHub Actions. Uploading release assets directly from the cloud assistant’s CLI previously failed on uploads.github.com; the Actions workflow works.

Do not reuse or rewrite existing release tags. Verify the published file matches the local artifact and still contains exactly one valid inline bundle. The 0.4.0 release is explicitly marked superseded because of its packaging issue; use 0.4.1 or newer.

## Save and account context

Worlds use browser localStorage key `ironhaven.save.v1`, even as the schema migrates. Checkpoints use `ironhaven.checkpoints.v1`; window layout uses `ironhaven.windows.v1`; tutorial preference uses `ironhaven.skipTutorial`. Normal and incognito are separate; incognito is usually temporary. Export/import JSON backups to move a world between profiles or computers.

## Known limits and pending verification

- No actual visual browser/GPU QA was available in this cloud environment. The user has played the game and supplied screenshots; keep doing real local browser tests rather than inferring appearance from DOM tests.
- Direct networking has been tested locally through native WebRTC; physical LAN/firewall combinations still need testing.
- Human gameplay tuning is still required. Synthetic balance scenarios are evidence, not a claim of perfect difficulty.
- Creating a ChatGPT project, moving this cloud chat, or merging two chat histories is not supported by the assistant tools in this session. A local Codex project is the cloned code folder; the user can give the next chat this note to continue.
