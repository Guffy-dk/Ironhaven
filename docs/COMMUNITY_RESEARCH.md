# Community review → Ironhaven 0.4

Research date: 2026-11-14. These are selected primary-source discussions and reviews, not a representative survey. The decisions below are our assessment for a small factory-survival game; they are not claims that either community agrees unanimously.

| Source | Relevant observation | Decision |
|---|---|---|
| [Factorio community: Production & Demand Statistics](https://www.reddit.com/r/factorio/comments/mawags/production_demand_statistics_instead_of/) | Players describe following supply shortages through several upstream factories and ask for demand information. | **Implemented:** measured production, theoretical recipe demand, and distinct machine states for missing input, blocked output, storage, power, ammo and fuel. |
| [Factorio Steam reviews](https://steamcommunity.com/app/427520/reviews/?browsefilter=toprated&l=english&p=1) | Reviews describe tangled logistics and recommend buffers, room to expand and monitoring material/power shortages. | **Implemented:** readable diagnostics build on 0.2/0.3’s warehouse buffers, area relocation and explicit recipe ports. |
| [They Are Billions Steam reviews](https://steamcommunity.com/app/644930/reviews/?browsefilter=trendmonth&l=english&p=1) | Some reviewers value tactical pause; others dislike losing lengthy progress after mistakes. | **Implemented:** independent rolling pre-swarm checkpoints and retry. Pause remains available, including construction while paused. |
| [They Are Billions community: Boring situation](https://www.reddit.com/r/TheyAreBillions/comments/1dz207w/boring_situation/) | Players discuss long waits after becoming established, uneven pressure and increasing difficulty without tighter time limits. | **Implemented:** Veteran strengthens enemies without shortening Standard’s timer. **Retained:** optional early swarm calling and the active evacuation objective. |

## Additional design decisions

- Forecast directions and enemy counts before each swarm, then mark threatened minimap edges in the final twenty seconds. Difficulty should be understandable before the attack.
- Co-op adds **10% enemies per additional connected engineer**, with no extra co-op health multiplier. Scaling is fixed and visible, not based on a hidden assessment of player success.
- Keep raw-material routes and ammo meaningful. Advanced turret power and generator fuel costs rise with levels; late turret damage/fire-rate growth is moderated. Upgrade prices still increase at every level.
- Keep a small recovery cost: checkpoint retries restore the checkpoint’s actual resources, buildings and progress, rather than resurrecting a defeated colony with free materials. A minimum twenty-second warning provides room to assess the retry.
- Stop combat escape exploits: a building recently hit cannot move or be dismantled for five seconds; the core cannot relocate during a swarm. Override placement cannot bypass these rules.
- Do **not** add cascading infection, invisible production-driven attacks, an extensive research tree or massive armies for now. They add complexity and performance costs before basic logistics and combat have been player-tested.

## Performance and balance evidence

See [BALANCE.md](BALANCE.md) and [balance-0.4.json](balance-0.4.json). The checks compare passive and simple maintenance policies, verify all upgrade limits/prices, exercise actual recipe delivery and cap the workload. They are useful regression checks, not proof that the game is perfectly balanced for humans.
