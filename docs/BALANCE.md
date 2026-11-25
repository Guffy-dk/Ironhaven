# Balance and performance — 0.4

Run `node scripts/check-balance.mjs` to reproduce the simulation scenarios. The committed JSON records one run on the build machine. All times in the scenarios are **game seconds**; CPU timings are specific to this machine. Graphics, real browsers and physical network behavior are outside this benchmark.

## Transparent difficulty

| Preset | Enemy count | Enemy HP | Attack damage | Initial preparation | Between waves |
|---|---:|---:|---:|---:|---:|
| Relaxed | 0.72× | 0.85× | 0.75× | 160 s | 135 s |
| Standard | 1.00× | 1.00× | 1.00× | 120 s | 110 s |
| Veteran | 1.15× | 1.08× | 1.10× | 120 s | 110 s |

Values as of 25 November 2026. Swarm count grows with `10 + 2.8·wave + wave^1.45`, HP by 3% per wave and late damage (from swarm 8) by `1.05 + 0.01·(wave−8)`. The first Abyss walker (swarm 5) has 60% HP. See the [difficulty report](playtests/balance-2026-11-25-difficulty.md).

Each connected guest adds 10% to the wave count at spawn. Co-op does not add extra HP. The forecast shows the actual upcoming count and edges. Brutes have twice ordinary HP and slower movement. Counts are capped at 480, within the existing 500-enemy render pool.

## Resource tradeoffs

- All buildings retain ten upgrades and strictly increasing costs. Steel and circuits enter the advanced levels, so early iron/gear production alone cannot fund the whole progression.
- Production speed reaches 2.8× at ten upgrades. Higher power use keeps generators relevant. Generator output upgrades also increase fuel consumption.
- A maximum turret deals more damage and fires faster, but uses three times its original power. Late gains were reduced relative to 0.3 so a single high-level turret is not a universal answer.
- Storage backpressure stops deliveries instead of deleting items. Pickup preserves HP and ammo, so moving a damaged building cannot repair it for free.
- Evacuation consumes 30 components, 60 steel and 40 circuits and requires a powered final defense. The existing two starter lines do not produce those new materials.

## What the scenarios test

The passive policy does not construct, upgrade, repair or move the engineers. It should not complete the objective. The maintenance policy only upgrades existing turrets to Mk III and repairs turrets/core below half HP when affordable; it does not expand production or build evacuation infrastructure. Neither is a skilled human strategy. These scenarios expose runaway starter defenses, resource starvation and accidental solo/co-op extremes, while the unit tests cover recipes, costs, input validation and progression.

The stress case runs 700 synthetic buildings and 480 enemies through 240 authoritative ticks. Compare mean and p95 simulation cost to the 50 ms tick budget. Production history retains at most 61 samples; checkpoint history retains three saves and is cached during UI updates. Turret targeting uses squared distances. Terrain and enemies remain instanced.

Human playtesting is still required to tune recipes, fortification layouts and the final assault, and to measure FPS on actual hardware. Do not interpret a CPU simulation benchmark as a GPU/frame-rate guarantee.
