# Harbor industry in 0.21.1

Eleven production machines supply eleven materials. Industry (N) prepares raw materials. Fabrication (J) combines them and outputs Harbor Equipment. Select a machine to see its physical inputs and outputs. Open the production report with I for stock, production and demand.

| Building | Base recipe | Where the output goes |
| --- | --- | --- |
| Aggregate crusher | 1 ore → 2 aggregate in 3 s | Firebrick kiln |
| Firebrick kiln | 2 aggregate + 1 coal → 3 firebricks in 4 s | Switchgear, breakwaters and resupply |
| Coke oven | 2 coal → 2 coke in 4 s | Alloy furnace |
| Alloy furnace | 1 concentrate + 1 coke + 1 copper → 2 marine alloy in 6 s | Hull yard and coastal defenses |
| Resin kettle | 3 wood + 1 coal → 3 resin in 4 s | Cable, hull panels and breakwaters |
| Cable works | 2 copper + 1 resin → 2 insulated cable in 5 s | Switchgear and signal mast |
| Hull yard | 2 alloy + 1 resin → 2 hull panels in 5 s | Hydraulic drives, depot and defenses |
| Hydraulic works | 1 bearing + 1 hull panel + 1 gear → 2 drives in 6 s | Freight frames |
| Switchgear shop | 2 cable + 1 firebrick + 1 circuit → 2 switchgear in 6 s | Harbor Equipment, grid and defenses |
| Freight works | 1 drive + 3 plates → 2 freight frames in 8 s | Harbor Works |
| Harbor Works | 1 freight frame + 1 switchgear + 1 component → 2 Harbor Equipment in 10 s | Lighthouse projects |

The grid and dock depot each have two tiers. Each grid tier adds 24 fuel-free power. Each depot tier adds 300 shared capacity. The second tier doubles the material cost. After the first grid or depot commission, the host can order 48 coal and 14 copper every 150 seconds for six Harbor Equipment and six firebricks. The orders remain available after continuing from the campaign victory. Outputs draw from physical warehouse stock. The warehouse export reserve sets a floor per material for transport and leaves those units available to pay for projects.

Reinforced breakwaters provide 1,150 base HP. Signal masts light ten tiles for seven power. Coast Watch turrets use gear ammunition for long range and full damage to armored targets, with five base power and 10% of base power per upgrade. The recipe costs and strategic roles compete for output with industrial projects.

## Measured balance

[Machine-readable results](harbor-endgame-0.21.1.json). The prepared factory uses ordinary build and routing commands, real ore drills, configured belts, dispatch hubs and local warehouses with finite initial supplementary stock. This fixture separates physical throughput from the challenge of funding a whole late-game factory during a campaign. All seven runs have a 950-second horizon. The endless pair begins from a prepared post-victory state and calls swarm 26 at 500 seconds.

| Fixture | Harbor Equipment made | Projects and shipments completed |
| --- | ---: | ---: |
| Reference with 126 starting power and reserves | 170 | 8 |
| 54 power against 65 demand | 0 | 0 |
| Scarce raw stock | 20 | 2 |
| Same supplies without warehouse reserves | 180 | 0 |
| Projects idle | 170 | 0 |
| Swarm 26 with conventional defenses | 170 | 10 |
| Swarm 26 with coastal defenses after tuning | 170 | 10 |

The reference first commissioned a depot after 138 seconds and made five shipments. Without warehouse reserves the fixture moved project-stock parts into belts and input buffers too quickly to commission. A stock reserve lets the host make deliberate allocations without manually stopping each route. The tuned coastal defense fixture used 601 of 642 power at 900 seconds, down from 721 before the tuning. The control used 513. Both defenses killed 227 of 239 enemies and kept the factory operating to the time limit. The swarm had not cleared at the limit.

The existing regression matrix ran 35 earned-resource campaigns on three workers. Of the 32 ordinary campaigns, nine won and 23 lost. The three longer runs reached swarms 33, 24 and 5. The first continued past victory through the normal command. Two additional earned factory cases built the crusher/kiln addition from campaign supplies with a coal reserve, after swarm 8 and sufficient spare power.

| Seed and difficulty | Ordinary industry | Crusher and kiln | Firebricks made with the addition |
| --- | --- | --- | ---: |
| 417 Relaxed | Victory at 25, 5,194 s | Victory at 25, 5,196 s | 204 |
| 2026 Standard | Defeat at 24, 4,987 s | Defeat at 24, 4,973 s | 207 |

The campaign pilot demonstrates funding and operating the initial branch amid ordinary gameplay. The full-chain validation uses a prepared fixture. The tests support the current recipe and power settings for a first release and leave the full earned path and human completion time for further playtesting.

Reproduce with `node scripts/check-harbor-balance.mjs`, `CAMPAIGN_WORKERS=3 node scripts/play-campaign-matrix.mjs` and `node scripts/play-campaign.mjs 417 harbor relaxed 9000 campaign`. The pre-tune preview and final gameplay tuning were tested separately. Render tests used Chromium SwiftShader, reading completed frames at zoom 14/44 through 420 enemies, with no non-finite pixels or page errors.
