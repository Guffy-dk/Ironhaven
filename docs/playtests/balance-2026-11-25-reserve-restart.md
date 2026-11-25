# Balancekørsel 25. november 2026 kl. 19.29

Kørsel `2026-11-25T19:29:22+01:00`. Baseline `f8f78a3`, driver `71d1067`. [Rådata](balance-2026-11-25-reserve-restart.json).

35/35 forløb på to arbejdere. De 29 ordinære kampagner gav 20 sejre, 9 nederlag og 0 ved tidsgrænsen. 6/6 udholdenhedsforløb vandt og valgte fortsættelse via den normale host-kommando. Længste forløb varede 8.967 simulerede sekunder. Højeste swarm var 39. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 4967 og 9803. 17/17 matchede forløb gentog udfald, swarm, tid, kills, reparationer, upgrades og aflastningsvinduer fra kl. 16.28. [Forrige kørsel](balance-2026-11-25-capped-response.md).

## Genstart ved tilstrækkelig reserve

15 matchede par med højst to pauserede maskiner pr. swarm. Begge strategier bruger normale produktionskommandoer. Kontrollen venter, til der hverken er fjender eller højst 30 sekunder til næste mulige swarm. Forsøget kan desuden genstarte tidligere, hvis reserven er mindst 60 effektenheder og mindst 15 gange det forventede effektunderskud med alle de pauserede maskiner i drift. Reglen vurderer produktion og belastning i det øjeblik. Den garanterer ikke 15 sekunders drift ved senere ændringer.

| Måling | Til kampens slutning, sum | Styret af reserve, sum | Median af parvis ændring |
|---|---:|---:|---:|
| Forsvarsudfald | 20 | 18 | 0 |
| Sekunder med underskud | 2436 | 3122 | 24 |
| Produktionspauser | 70 | 66 | 0 |
| Målte kampsekunder | 42429 | 42122 | -17 |
| Inaktive tårnsekunder | 3777 | 5271 | 85 |
| Ammunitionsmangel, tårnsekunder | 8 | 293 | 0 |
| Reparationer | 10315 | 10228 | 0 |

Målt på sejr og højeste swarm klarede ingen forløb med reservebaseret genstart sig bedre, ét dårligere og 14 lige godt. Holdout-parrene gav 4967 standard pulse: 25 → 25, 9803 veteran industry: 25 → 25, 9803 relaxed industry: 38 → 38. 25 vinduer udløste tidlig genstart, fordelt på 15 af 15 scenarier. Forskellige kamp- og overlevelsestider påvirker summerne. I de 12 scenarier, der også havde den historiske 30-sekundersvariant, var antallet af forsvarsudfald 18 med fast timeout, 14 ved kampens slutning og 12 med reservebaseret genstart.

| Lager ved start af swarm 9, 17 og 25 | Median af parvis ændring |
|---|---:|
| plate | 1 |
| gear | 10.5 |
| steel | 0 |
| circuit | 0 |
| module | 0 |

Lagertallene er parvise forskelle over 44 fælles milepæle. Lagerniveau afspejler både produktion og forbrug. Par, der tabte tidligt, bidrager med færre milepæle.

Reservebaseret genstart gav to færre afgrænsede udfald, men de sammenlagte underskudssekunder steg med 28 %, og tårnene var inaktive i 40 % flere tårnsekunder. Gears steg ved de fælles milepæle, mens stål og components havde en medianforskel på nul. Fortsæt med genstart efter kampen som kontrol i testdriveren. Spilværdierne beholdes. Næste prioritet er at måle, hvad der stopper progressionen efter swarm 25, herunder om havneprojekter og materialeflow giver gennemførlige mål i udholdenhedsforløb.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Reaktion | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|---:|
| relaxed | industry | kontrol | 1/1 | 25 | 5759 | 19 | 195 |
| relaxed | industry / endless | strømreserve | 2/2 | 38 | 8825.5 | 426 | 899.5 |
| relaxed | industry / endless | til kampens slutning | 2/2 | 38.5 | 8920 | 428.5 | 910.5 |
| standard | early_defense | strømreserve | 1/1 | 25 | 5278 | 229 | 533 |
| standard | early_defense | til kampens slutning | 1/1 | 25 | 5391 | 229 | 522 |
| standard | harbor | kontrol | 1/1 | 25 | 5434 | 300 | 644 |
| standard | industry | strømreserve | 2/2 | 25 | 5213.5 | 209 | 498.5 |
| standard | industry | til kampens slutning | 2/2 | 25 | 5401.5 | 207.5 | 556.5 |
| standard | logistics | strømreserve | 1/1 | 25 | 5637 | 280 | 637 |
| standard | logistics | til kampens slutning | 1/1 | 25 | 5654 | 257 | 637 |
| standard | logistics / endless | strømreserve | 1/1 | 28 | 6260 | 428 | 738 |
| standard | logistics / endless | til kampens slutning | 1/1 | 28 | 6294 | 428 | 810 |
| standard | mortars | strømreserve | 1/1 | 25 | 5271 | 224 | 549 |
| standard | mortars | til kampens slutning | 1/1 | 25 | 5391 | 229 | 522 |
| standard | no_artillery | strømreserve | 0/1 | 21 | 4798 | 312 | 807 |
| standard | no_artillery | til kampens slutning | 0/1 | 21 | 4847 | 318 | 876 |
| standard | pulse | strømreserve | 2/2 | 25 | 5305 | 219.5 | 632.5 |
| standard | pulse | til kampens slutning | 2/2 | 25 | 5235.5 | 243 | 610 |
| standard | single | kontrol | 0/3 | 9 | 2034 | 94 | 18 |
| veteran | industry | strømreserve | 2/4 | 25 | 5646 | 329 | 711 |
| veteran | industry | til kampens slutning | 2/4 | 25 | 5548.5 | 345.5 | 713 |

Rådata omfatter lagerfyldning, ressourcer, produktion, nettoflow, strøm, ammunition, components, upgrades, skud, tab og reparationer. Der blev anvendt optjente ressourcer. Driveren bruger en fast prioriteringsliste og reagerer på målinger uden menneskelig forsinkelse ud over den indlagte ventetid. Ingen af strategierne er afprøvet i en manuel Windows-kampagne.

Spillerfeedback læst 25. november. Conan Unconquered-anmeldelserne omfatter kritik af korte forberedelsesvinduer og besværlig ressourcehåndtering, men også ros af tilfredsstillelsen ved at overleve et angreb med basen intakt. En hypotese for Ironhaven er at bevare ansvaret for strømfordelingen og gøre tidspunktet for sikker genstart tydeligt. Det lille udsnit og testdriverens resultater måler ikke spillerpræferencer. [Steam-anmeldelser](https://steamcommunity.com/app/989690/reviews/?browsefilter=toprated).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse fra gemte resultater gav en byte-identisk fil. Denne kørsel ændrede kun testværktøjet. Eksisterende Windows-build `0.21.2.3` er identificeret ved commit `f8f78a3` og spilversion `0.22.0`. Der blev ikke kørt en ny manuel Windows-spiltest. Patcherens offentlige version var `0.22.0` ved start. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45673068809/artifacts/15050463636).

```sh
CAMPAIGN_MATRIX=reserve-restart CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
