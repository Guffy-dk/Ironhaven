# Difficulty pass — 25 November 2026

Owner request (25 Nov 2026): "Kør balancering af spillet. Det skal ikke være så svært at det ikke er enjoyable at spille." The game remains Windows-only; the browser build is internal tooling.

Raw results: [balance-2026-11-25-difficulty.json](balance-2026-11-25-difficulty.json). The source is `0d91842` plus the changes in this commit. Driver: default 35-scenario `scripts/play-campaign-matrix.mjs` with `CAMPAIGN_WORKERS=4`.

## Problem in the baseline

On unchanged values (`617d312`), the default matrix produced **4 victories out of 27 ordinary Standard/Veteran campaigns**.

- 13 complete Standard strategies reached swarm 25 with a full lighthouse, then lost during the final swarm. The count (`wave^1.55`) and the late damage boost grew faster than the defences.
- `logistics` on seeds 7 and 2026 fell at swarms 7–8. Veteran on seeds 7 and 6823 fell at swarm 5, where the first Abyss walker appears with 8× HP.
- Every run was plate-starved in the early game, with plates mostly below 40. Bots act instantly, so a human has even less time between swarms.

## Changes (`public/shared/sim.js`)

| Value | Before | After |
|---|---|---|
| Standard first preparation / between swarms | 100 s / 95 s | 120 s / 110 s |
| Relaxed first preparation / between swarms | 140 s / 115 s | 160 s / 135 s |
| Veteran first preparation / between swarms | 100 s / 95 s | 120 s / 110 s (still equal to Standard) |
| Veteran count / HP / damage | 1.22 / 1.12 / 1.15 | 1.15 / 1.08 / 1.10 |
| Swarm count exponent | `wave^1.55` | `wave^1.45` (swarm 25 Standard: 227 → 187) |
| HP growth per swarm | 3.5% | 3.0% |
| Late damage multiplier from swarm 8 | `1.1 + 0.015·(w−8)` | `1.05 + 0.01·(w−8)` |
| First Abyss walker (swarms 5–9) | full HP | 60% HP |

Relaxed and Standard enemy multipliers and all costs/recipes are unchanged. Five tests that pinned the old preparation times or the swarm-7 HP (90 → 88) were updated.

## Results: ordinary campaigns that reached and cleared swarm 25

| Group | Baseline | After | New holdout seeds 3301, 5557 |
|---|---|---|---|
| Relaxed industry | 4/4 | 4/4 | 2/2 |
| Standard industry | 1/4 | 4/4 | 2/2 |
| Standard pulse | 2/4 | 4/4 | 2/2 |
| Standard mortars | 0/4 | 4/4 | 2/2 |
| Standard early_defense | 0/4 | 4/4 | 2/2 |
| Standard logistics (including endless run) | 1/5 | 5/5 | 2/2 |
| Standard no_artillery | 0/3 (swarm 7–19) | 0/3 (swarm 19–21) | 0/2 (swarm 19, 21) |
| Standard single gun | 0/3 (swarm 7–8) | 0/3 (swarm 8–9) | 0/2 (swarm 8, 9) |
| Veteran industry (including endless run) | 0/4 (two at swarm 5) | 3/4 (seed 7 lost at swarm 24) | 2/2 |

The endless runs continue beyond victory: Relaxed 417 reached swarm 38, Standard logistics 2026 reached swarm 28 and Veteran 6823 reached swarm 26.

Standard winners still lose on average 130–260 buildings and use 480–770 repairs, so the defence is still under pressure. Deliberately incomplete strategies (a single gun, no artillery) still lose, so expanding the industry still matters. In a separate probe on the final code, Veteran seed 9067 fell at swarm 7, so Veteran can still punish a weak start.

## Limitations

- These are scripted bots using ordinary commands, not human playtests. Humans can be slower (this is why the intervals were raised) or better at layouts.
- Standard is now very predictable for the bots' full strategies. If human playtests show it is too easy, the first adjustment should be the count exponent (1.45 → 1.5), not the intervals.
- Iterations: one global adjustment, then a Veteran-only and boss adjustment. Probe runs between iterations are not counted as evidence.
- No new Windows build or patcher release.

## Checks

`npm test` 215/215, `npm run build`, `npm run test:render` with no errors (Linux/SwiftShader).
