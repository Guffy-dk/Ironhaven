# Balancekørsel 25. november 2026 kl. 07.27

Kørsel `2026-11-25T07:27:27+01:00`. Simulation `51cd987`, driver `8652d18`, spil `0.21.3`, eksisterende internt build `0.21.2.3`. [Rådata](balance-2026-11-25-combat-lead.json).

35/35 simulerede forløb på to arbejdere. 32 ordinære kampagner gav 24 sejre ved swarm 25, 8 nederlag og 0 ved tidsgrænsen. 3/3 udholdenhedsforløb vandt og valgte fortsættelse via host-kommandoen. Længste forløb varede 9.158 simulerede sekunder, og det højeste nåede swarm 39. Horisonterne var 9.000 og 12.000 sekunder. Nye holdouts var 5737 og 9181. 29/29 scenarier matchet med forrige kørsel gentog udfald, swarm, tid, kills, reparationer og opgraderinger. De matchede reserveperioder gentog også alle de tidligere registrerede målinger. [Forrige kørsel](balance-2026-11-25-reserve-lead.md).

## Varsler om strømudfald

De samme 35 forløb målte tre regler parallelt uden at ændre testspillerens kommandoer. Alle regler kræver faldende reserve og højst 30 sekunder ifølge reserve divideret med nominelt effektunderskud. Kampreglen kræver levende fjender eller en planlagt mulig swarm inden 30 sekunder. Tårnreglen kræver også et tårn, som den aktuelle netproduktion alene ikke ville kunne forsyne i simulatorens fordelingsrækkefølge.

| Regel | Varslede perioder | Sluttede uden forsvarsudfald | Åbne uden udfald | Varslede udfald / 33 | Forspring ≥10 s | Medianforspring, s | Holdouts varslet / 6 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Reserve ≤ 30 s | 255 | 224 | 0 | 33 | 22 | 20 | 6 |
| Reserve + kamp inden 30 s | 165 | 134 | 0 | 33 | 22 | 20 | 6 |
| Reserve + kamp + truet tårn | 95 | 66 | 0 | 31 | 13 | 7 | 6 |

Et udfald kræver kamp, effektunderskud og et inaktivt strømafhængigt tårn. Udfald og varsler samples pr. simuleret sekund, og et varsel ved samme sekund tæller ikke som forspring. En periode kan rumme flere udfald. Perioden slutter, når produktionen igen dækker belastningen. Tårnreglen ser på nuværende bygninger og forudsiger ingen nye bygninger, tab eller levering af brændsel. Varsler uden forsvarsudfald kan stadig have værdi for fabrikkens produktion. Der blev ikke målt spillerreaktion eller forbedring af kampagneudfald for en synlig alarm.

Kampreglen skar 90 af 224 varslingsperioder uden forsvarsudfald væk (40 %). Den bevarede forspring ved samtlige 33 udfald og 20 sekunders medianforspring. Tårnreglen fjernede flere varsler, men missede to udfald og sænkede medianforspringet til syv sekunder. Afprøv derfor kampreglen som et diskret varsel og brug de truede tårne som supplerende information. Et flertal af varslerne under kampreglen sluttede stadig uden observeret forsvarsudfald. Tallene begrunder en spillerafprøvning før en egentlig alarm eller balanceændring.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---:|---:|---:|---:|---:|
| relaxed | industry | 3/3 | 25 | 5759 | 44 | 226 |
| relaxed | industry / endless | 2/2 | 38.5 | 9001.5 | 568 | 743 |
| standard | early_defense | 3/3 | 25 | 5258 | 222 | 502 |
| standard | harbor | 1/1 | 25 | 5434 | 300 | 644 |
| standard | industry | 3/3 | 25 | 5275 | 218 | 525 |
| standard | logistics | 4/4 | 25 | 5430.5 | 239 | 613.5 |
| standard | logistics / endless | 1/1 | 28 | 6195 | 434 | 839 |
| standard | mortars | 3/3 | 25 | 5265 | 220 | 503 |
| standard | no_artillery | 0/3 | 20 | 4519 | 232 | 812 |
| standard | pulse | 4/4 | 25 | 5362.5 | 226 | 612 |
| standard | single | 0/3 | 9 | 2034 | 94 | 18 |
| veteran | industry | 2/4 | 25 | 5613 | 320.5 | 645 |
| veteran | mortars | 1/1 | 25 | 5854 | 300 | 610 |

Rådata indeholder lagerfyldning, ressourcer, produktion, nettoflow, opgraderinger, ammunition, effekt, skud og tab ved milepælene. Testspilleren anvendte optjente ressourcer og normale kommandoer. Faste byggeplaner, sammenfaldende planprioriteter og forskellige seeds kan begrænse, hvad udfaldene fortæller om menneskelige strategier.

Spillerfeedback læst 25. november. En They Are Billions-anmeldelse beskriver, hvordan en overset fjende udløste en kædereaktion efter 45–60 minutters spil. Et muligt Ironhaven-greb er at vise, hvilket forsvar der risikerer at miste strøm, så spilleren kan reagere på den konkrete trussel. Én anmeldelse fastlægger ingen spillerpræference for en særlig varslingsregel. [Steam-anmeldelser](https://steamcommunity.com/app/644930/reviews/?filterLanguage=default).

Alle 215 tests bestod, og det indlejrede Windows-ressourcebuild blev samlet lokalt. Genoptagelse fra gemte resultater gav samme resultatfil. Spilkoden er den samme som i eksisterende Windows-testbuild fra `1120811`. Denne kørsel udførte ingen ny manuel Windows-spiltest. Patcherens offentlige version er fortsat `0.21.3`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45520665965/artifacts/14980525834).

```sh
CAMPAIGN_MATRIX=combat-lead CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
