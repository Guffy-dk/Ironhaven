# Balancekørsel 24. november 2026 kl. 16.27

Simulation `3a54467`, testdriver `0505827`, version `0.21.2`, eksisterende internt build `0.21.2.1`. [Rådata](balance-2026-11-24-repair-reserve.json).

35 automatiserede forløb på to arbejdere. Blandt 25 almindelige kampagner var der 10 sejre, 13 nederlag og 2 ved tidsgrænsen. 10 af 10 udholdenhedsforløb vandt og fortsatte frivilligt. Højeste swarm var 34, nået inden et nederlag efter 6.989 simulerede sekunder. Ét uafsluttet udholdenhedsforløb ramte tidsgrænsen på 12.000 sekunder.

## Reserve til genopbygning

Kontrollen og forsøget bruger samme grundplan. Under en aktiv swarm udsætter forsøgsdriveren kun reparationer uden for fyret, når reparationen ellers kunne betales, men ville bruge af de 12 træ og 16 plader, som en ny sentry koster. Fyret følger den samme reparationsregel i begge forløb. Andre bygge- og opgraderingskommandoer kan stadig bruge materialerne. Den separate sentry-fallback var slået fra for at isolere denne ændring.

Reglen udsatte mindst én reparation i 15 af 15 par. Reserven gav 3 bedre, 7 dårligere og 5 lige udfald rangeret efter sejr og sidste swarm. Blandt de 12 par uden tidsgrænse gav den 1 bedre, 6 dårligere og 5 lige. På de fem holdout-par gav den 1 bedre, 2 dårligere og 2 lige efter samme rangering. 8 kontrolscenarier gentog tidligere målinger på udfald, swarm, tid, kills, reparationer og opgraderinger.

Ved slutpunktet havde reservevarianten en medianforskel på 286 færre reparationer og én færre tabt bygning. 1 af 15 kontroller og 0 af 15 reserveforløb havde en sentrys materialer tilbage. Forskellige slutpunkter måles på forskellige swarms og kan derfor ikke alene fastslå genopbygningskapacitet i en bestemt kamp.

| Seed | Strategi | Sværhedsgrad | Udsnit | Kontrol | Reserve | Udsatte reparationsforsøg | Plader ved slutpunkt, kontrol / reserve |
|---:|---|---|---|---|---|---:|---|
| 9419 | no_artillery | standard | prior-stall | 17 (tid) | 5 | 70 | 13 / 2 |
| 8813 | logistics | standard | prior-stall | 5 (tid) | 23 | 274 | 4 / 2 |
| 6197 | industry | relaxed | prior-stall / udholdenhed | 30 ★ (tid) | 32 ★ | 337 | 600 / 3 |
| 417 | industry | standard | comparison | 25 | 8 | 229 | 2 / 2 |
| 2026 | industry | standard | comparison | 24 | 23 | 389 | 13 / 3 |
| 417 | industry | relaxed | comparison / udholdenhed | 33 ★ | 33 ★ | 159 | 3 / 3 |
| 1967 | industry | standard | comparison | 25 ★ | 25 ★ | 254 | 7 / 6 |
| 4297 | mortars | veteran | comparison | 23 | 5 | 53 | 3 / 0 |
| 2026 | pulse | standard | comparison | 25 ★ | 25 ★ | 357 | 8 / 1 |
| 6619 | industry | relaxed | comparison / udholdenhed | 33 ★ | 32 ★ | 175 | 3 / 10 |
| 2477 | logistics | standard | holdout | 25 ★ | 25 ★ | 212 | 7 / 5 |
| 2477 | industry | relaxed | holdout / udholdenhed | 34 ★ | 32 ★ | 196 | 0 / 3 |
| 5347 | industry | veteran | holdout | 5 | 6 | 246 | 1 / 9 |
| 5347 | early_defense | standard | holdout | 25 ★ | 25 | 219 | 2 / 3 |
| 5347 | industry | relaxed | holdout / udholdenhed | 32 ★ | 32 ★ | 230 | 2 / 2 |

★ markerer kampagnesejr ved swarm 25. Andre Standard-kontroller med seed 2477: single 9, early_defense 25 ★, no_artillery 18, mortars 25 ★, harbor 25 ★.

Udsatte reparationsforsøg kan tælle den samme bygning flere gange. Målingen lægger ikke ressourcer i et separat lager, og det automatiserede layout siger ikke, hvordan en menneskelig spiller ville prioritere fabrikker eller forsvar. Rådata indeholder overlevelsestid, tab, reparationer, lager, produktion, netflow, strøm, ammo, genopbygning og opgraderingsmilepæle. Det er simulation med eksisterende spillerkommandoer og optjente materialer.

I tre af de følsomme tilfælde begyndte udsættelserne allerede ved swarm 2–3. På Standard 417 endte reservevarianten ved swarm 8 mod 25 i kontrollen, og på Veteran 4297 endte morterstrategien ved swarm 5 mod 23. Begge reserver endte under 16 plader. Det er foreneligt med svækkede reparationer uden et beskyttet materialelager. I logistikforløbet 8813 gik reparationerne fra 3.212 ved tidsgrænsen til 391 inden nederlag ved swarm 23. Forskellige slutpunkter begrænser den direkte sammenligning af antal.

## Beslutning

Spillets omkostninger beholdes. Alle 210 lokale tests og det lokale build bestod. Windows-verifikationen genbruges fra det eksisterende build 0.21.2.1, fordi denne kørsel kun ændrer testdriver og dokumentation. [Native Windows-verifikation](https://github.com/Guffy-dk/Ironhaven/actions/runs/45394771250). Reserveadfærden er fortsat valgfri i testdriveren. Næste test kan sammenligne en reserve kun under vedvarende strømsvigt med fri reparation og registrere, hvilke fabriksled der genstarter. Det holder spørgsmålet om genopbygning adskilt fra tidligere automatiseret ammunitionsfallback.

Spillerkilder læst 24. november. Anmeldelser af Conan Unconquered nævner reparation og korte pauser som belastninger, mens spillere i Colony Survival beskriver koblingen mellem vækst og forsvar som en del af spillets styrke. For Ironhaven peger eksemplerne på, at vedligeholdelse bør gøre en genopbygningsbeslutning mulig. De få kilder siger ikke, hvor mange spillere der ønsker en bestemt regel. [Conan Unconquered](https://steamcommunity.com/app/989690/reviews/?browsefilter=toprated) · [Colony Survival](https://steamcommunity.com/app/366090?l=english) · [Tidligere kilder om alle fem inspirationsspil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=repair-reserve CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
