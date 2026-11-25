# Balancekørsel 25. november 2026 kl. 10.27

Kørsel `2026-11-25T10:27:27+01:00`, baseline `4c2d22d`, driver `43c9da6`, spil `0.21.3`, deklareret build-id `0.21.2.3`. [Rådata](balance-2026-11-25-warning-response.json).

35/35 forløb på to arbejdere. 29 ordinære forløb gav 19 sejre ved swarm 25, 10 nederlag og 0 ved tidsgrænsen. 6/6 udholdenhedsforløb vandt og valgte selv *Continue endlessly*. Den længste varighed var 9.584 simulerede sekunder, og det højeste nåede swarm 38. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 4729 og 9533. 17/17 kontroller matchet med kl. 07.27 gentog udfald, swarm, tid, kills, reparationer og opgraderinger. [Forrige kørsel](balance-2026-11-25-combat-lead.md).

## Reaktion på kampvarsel

15 matchede par med samme seed, sværhedsgrad, strategi og horisont. Efter mindst fem simulerede sekunder fra det kampafgrænsede varsel kunne testspilleren pause komponentfabrikker, kredsløbslaboratorier, støberier og kobberbor via almindelige produktionskommandoer. Bygningerne blev genaktiveret, når kampen var ovre, eller næste swarm var mere end 30 sekunder væk. Testspilleren udførte 169 pauser fordelt på 15/15 scenarier.

| Måling i matchede par | Kontrol, sum | Med reaktion, sum | Medianændring pr. par |
|---|---:|---:|---:|
| udfald | 21 | 14 | 0 |
| sekunder | 9480 | 4712 | -399 |
| reparationer | 10350 | 10150 | -14 |
| afbrydelser af tårne | 58951 | 40265 | -528 |
| ammunitionsmangel | 3596 | 149 | 0 |
| netto components | 931 | 941 | 4 |
| slutlager components | 74 | 97 | 0 |

Efter sejr og højeste swarm rangerede 3 bedre, 3 dårligere og 9 lige. Der var 46959 målte kampsekunder i kontrollerne og 44684 med reaktion. Tilstedeværelsen af fjender og overlevelsestiden påvirker summen af underskudssekunder. Holdouts gav 4729 standard pulse: 25 → 25, 9533 veteran industry: 24 → 25, 9533 relaxed industry: 37 → 36. Tårnafbrydelser er optalte inaktive tårnsekunder under kamp, uanset årsag. Ammunitionsmangel er aktive tårnsekunder uden ladning og med mindre end ét gear på lager. Components-tallene er nettolagerflow og slutlager, som også afhænger af varighed og forbrug.

| Seed | Strategi | Swarm kontrol → reaktion | Udfald | Underskudssekunder | Produktionspauser |
|---|---|---:|---:|---:|---:|
| 417 | standard / industry | 25 → 25 | 1 → 0 | 399 → 0 | 5 |
| 417 | standard / early_defense | 25 → 25 | 1 → 0 | 399 → 0 | 5 |
| 417 | standard / mortars | 25 → 25 | 1 → 0 | 399 → 0 | 5 |
| 417 | relaxed / industry / endless | 38 → 37 | 2 → 2 | 1030 → 38 | 9 |
| 2026 | standard / pulse | 25 → 25 | 1 → 1 | 463 → 61 | 7 |
| 2026 | standard / logistics | 25 → 25 | 0 → 0 | 0 → 0 | 10 |
| 2026 | standard / logistics / endless | 28 → 29 | 1 → 1 | 40 → 20 | 12 |
| 2026 | veteran / industry | 25 → 25 | 0 → 2 | 0 → 206 | 24 |
| 7001 | standard / industry | 25 → 25 | 1 → 1 | 439 → 6 | 10 |
| 7001 | standard / no_artillery | 21 → 21 | 2 → 2 | 4055 → 3772 | 14 |
| 7001 | veteran / industry | 24 → 25 | 4 → 2 | 344 → 118 | 21 |
| 9181 | veteran / industry | 25 → 25 | 1 → 1 | 49 → 218 | 8 |
| 4729 | standard / pulse | 25 → 25 | 1 → 0 | 434 → 0 | 5 |
| 9533 | veteran / industry | 24 → 25 | 1 → 0 | 51 → 0 | 9 |
| 9533 | relaxed / industry / endless | 37 → 36 | 4 → 2 | 1378 → 273 | 25 |

Reaktionen halverede de samlede underskudssekunder, mens kampagnetabet gik begge veje. Spilværdierne beholdes. Næste forsøg bør sammenligne hurtig, midlertidig aflastning af færre maskiner med aflastning gennem hele kampen, og måle hvilke materialer der forsinkes før næste swarm.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---:|---:|---:|---:|---:|
| relaxed | industry | 1/1 | 25 | 5759 | 19 | 195 |
| relaxed | industry / endless | 4/4 | 37 | 8777.5 | 534.5 | 755.5 |
| standard | early_defense | 2/2 | 25 | 5251 | 218 | 483 |
| standard | harbor | 1/1 | 25 | 5434 | 300 | 644 |
| standard | industry | 4/4 | 25 | 5269 | 212.5 | 518 |
| standard | logistics | 2/2 | 25 | 5541.5 | 256 | 686 |
| standard | logistics / endless | 2/2 | 28.5 | 6282.5 | 452.5 | 912 |
| standard | mortars | 2/2 | 25 | 5254 | 219.5 | 483.5 |
| standard | no_artillery | 0/2 | 21 | 8334 | 1707.5 | 987 |
| standard | pulse | 4/4 | 25 | 5400.5 | 244 | 765.5 |
| standard | single | 0/3 | 9 | 2034 | 94 | 18 |
| veteran | industry | 3/8 | 25 | 5451 | 316 | 668 |

Rådata indeholder ressourcer, lagerfyldning, produktion, nettoflow, ammunition, strøm, opgraderinger, tab, skud og reparationer ved milepælene. Forsøget omfatter en fast reaktion, som betjener flere maskiner på én gang. Den er en simulation af en handlingsmulighed. Der blev ikke målt, hvor hurtigt en spiller opdager et synligt varsel eller betjener maskinerne.

Spillerfeedback læst 25. november. Desynced-anmeldelserne beskriver både friheden ved selv at automatisere gentagne opgaver og arbejdet med at programmere arbejdsgangene. Et Ironhaven-spørgsmål er, om en mindre manuel reaktion kan give spilleren kontrol over prioriteringer mellem forsvar og fabrik. [Steam-anmeldelser](https://steamcommunity.com/app/1450900/reviews/?browsefilter=toprated).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse gav en byte-identisk resultatfil. GitHub havde allerede bygget Windows-artefakten for baseline `4c2d22d`. Den genbruger build-id `0.21.2.3`, så commit identificerer den præcise udgave. Der blev ikke udført en ny manuel Windows-spiltest. Patcherens offentlige version er `0.21.3`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45567861790/artifacts/15001605775).

```sh
CAMPAIGN_MATRIX=warning-response CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
