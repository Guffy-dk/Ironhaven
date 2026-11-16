# Lighthouse in the fog

- The latest verified Windows release is v0.13.2. Continue the lighthouse draft on the `lighthouse-preview` branch.
- The player chose the fogbound lighthouse theme. The first version treats 4D as a real-time 3D scene with drifting fog and a steerable light. Keep the current camera, world, building footprints and controls. Visual rollback belongs in Git history.
- The draft replaces the Quarry command-core model and description with a lighthouse. It adds three animated fog layers, a rotating lantern, and a shared beam calculation. The simulation gradually turns toward the requested tile. Defenses can target a hostile up to 20% farther away when that hostile is inside the beam, with existing weapon distances outside the beam.
- Next, wire the existing `aimLighthouse` command into `public/app.js` and `public/index.html`. Press L, or use an Aim light button, then click a map tile to set the bearing. Escape should cancel the targeting interaction. Explain the range bonus in the UI and use the beam state to distinguish lit hostiles. The draft does not yet implement luring.
- The affected files are `public/shared/lighthouse.js`, `public/shared/sim.js`, `public/motion.js`, `public/lighthouse-fog.js`, `public/quarry-art.js`, and `public/render.js`. Smoke-test the fog shader in the isolated Windows scene. Add automated checks for validated aiming, turning and pausing, beam coverage, range bonus, existing saves and the UI.
- To conserve usage, keep the first playtest small. Use one representative scene and one GitHub branch with automated tests. This draft has not been built, tested or shipped.

## Continue in Codex Cloud

Connect `Guffy-dk/Ironhaven` to a cloud environment. Use Node.js 22 or later and `npm ci` in the setup. Start from `lighthouse-preview`. Run `npm test` for the automated suite and `npm run build` for the standalone browser bundle. The repository's Windows GitHub Actions job builds and tests the Windows package.
