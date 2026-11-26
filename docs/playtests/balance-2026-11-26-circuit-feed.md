# Balancekørsel 26. november 2026 kl. 07.34

Kørsel `2026-11-26T07:34:32+01:00`, simulation `7dc39b6`, driver `48974d4`. Spil `0.22.0`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-26-circuit-feed.json).

35/35 forløb på to arbejdere. Af 27 ordinære kampagner endte 22 med sejr ved swarm 25, 5 med nederlag og 0 ved tidsgrænsen. 7/8 udholdenhedsforløb vandt og valgte *Continue endlessly*. Det længste varede 12.000 simulerede sekunder, og det højeste nåede swarm 38. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 5471 og 10007. 24/24 matchede kontroller fra kabeltesten gentog udfald, swarm, tid, kills, reparationer og opgraderinger. [Forrige kørsel](balance-2026-11-26-cable-feed.md).

## Produktion af switchgear

Ni par sammenlignede kabelruten med et layout, hvor sten, kabler og kredsløb har hver deres indgang. Testspilleren drejede det eksisterende kredsløbslager mod den nye rute og beholdt 10 kredsløb lokalt. Det gamle bånd til komponentfabrikken mistede dermed sin kredsløbstilførsel. Varianten flyttede også værkstedet og én mortar og fjernede ét savværk for at give plads. Forskelle i kampudfald afspejler hele layoutet.

8/9 forsøgsforløb producerede switchgear. Produktionen steg efter første måling forbi swarm 25 i nul af tre lange forsøgsforløb med sejr. Ved swarm 30 havde alle tre et aktivt værksted og et fyldt lokalt lager på 200 switchgear. 8/9 nåede mindst 200 switchgear på lager ved en måling. Første produktion blev tidligst observeret ved swarm 13. Ingen havneprojekter blev bestilt. Målt på sejr og højeste swarm var fem dårligere og fire lige. I parrene var medianændringen i den samlede komponentproduktion -28.

| Seed | Sværhedsgrad | Swarm, kontrol → kredsløbsrute | Første måling med switchgear, swarm | Produceret switchgear | Producerede components |
|---|---|---:|---:|---:|---:|
| 417 | standard | 25 → 25 | 13 | 208 | 66 → 32 |
| 417 | relaxed / endless | 37 → 36 | 13 | 204 | 39 → 32 |
| 2026 | standard | 25 → 25 | 13 | 388 | 60 → 32 |
| 2026 | relaxed / endless | 38 → 2 | – | 0 | 48 → 0 |
| 7001 | standard | 25 → 25 | 13 | 208 | 61 → 32 |
| 7001 | relaxed / endless | 36 → 35 | 13 | 204 | 48 → 32 |
| 417 | veteran | 25 → 25 | 13 | 204 | 66 → 42 |
| 5471 | standard | 25 → 25 | 13 | 308 | 36 → 32 |
| 10007 | relaxed / endless | 34 → 34 | 13 | 204 | 72 → 32 |

Testen bruger normal simulering, optjente materialer og almindelige kommandoer. Milepæle kan overse produktionstidspunktet mellem to målinger. Den historiske checkpoint-test gav otte switchgear efter manuel oprydning i det fælles bånd. Denne matrix måler produktionen over fulde kampagner. [Checkpoint-gentest](balance-2026-11-26-cable-feed.md).

Relaxed-seed 2026 ramte tidsgrænsen ved swarm 2 med 11 fjender og før kredsløbsruten var finansieret. I en separat gentest fra slutcheckpointet ryddede kolonien dem på 23,8 sekunder ved at ophøre med at sende spillerkommandoer. Med to nye sentries, bygget for optjente materialer, tog det 11,1 sekunder. Det peger på den løbende botadfærd som en mulig kilde til fastlåsningen. Gentesten ændrer ikke kampagnens registrerede udfald.

Spilværdierne beholdes. Næste forsøg bør bevare kredsløbsruten til komponentfabrikken og tilføje en kontrolleret afgrening eller separat kredsløbsproduktion til switchgear. Det skal også undersøge, om en kort pause i gentaget byggeri og reparation kan afhjælpe fastlåsningen.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Variant | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|---:|
| relaxed | harbor / endless | kontrol | 4/4 | 36.5 | 8305 | 416.5 | 709 |
| relaxed | harbor / endless | kredsløbsrute | 3/4 | 34.5 | 7956.5 | 339 | 620 |
| standard | early_defense | kontrol | 3/3 | 25 | 5258 | 222 | 502 |
| standard | harbor | kontrol | 4/4 | 25 | 5341 | 249.5 | 576.5 |
| standard | harbor | kredsløbsrute | 2/4 | 25 | 5178.5 | 316.5 | 416 |
| standard | industry | kontrol | 3/3 | 25 | 5275 | 218 | 525 |
| standard | logistics | kontrol | 3/3 | 25 | 5382 | 224 | 622 |
| standard | mortars | kontrol | 3/3 | 25 | 5265 | 220 | 503 |
| standard | pulse | kontrol | 3/3 | 25 | 5300 | 223 | 525 |
| standard | refining | kontrol | 1/1 | 25 | 5434 | 226 | 610 |
| standard | single | kontrol | 0/1 | 9 | 2034 | 77 | 18 |
| veteran | harbor | kontrol | 0/1 | 25 | 5419 | 334 | 625 |
| veteran | harbor | kredsløbsrute | 0/1 | 25 | 5308 | 354 | 427 |

Rådata indeholder strøm, ammunition, lagerfyldning og ressourceproduktion, nettoflow, components, skud, opgraderingstider og projekttilgængelighed ved milepæle.

Spillerfeedback læst 26. november. En Factorio-anmeldelse fremhæver variationen mellem produktionsflaskehalse, angreb og udforskning. En anden beskriver et uoverskueligt net af bånd mellem maskiner, der arbejder sammen. For Ironhaven motiverer det at teste, om lokale forsyninger kan holde både komponent- og switchgearproduktionen i gang med kortere ruter. Læste anmeldelser er eksempler og siger ikke, hvilken rute Ironhaven-spillere foretrækker. [Steam-anmeldelser](https://steamcommunity.com/app/427520/reviews?browsefilter=toprated).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse fra gemte kampagner gav en byte-identisk resultatfil. Der blev ikke udført manuel Windows-spiltest. Det eksisterende Windows-build `0.21.2.3` er fra `a8b056c`, og patcherens offentlige version er `0.22.0`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45678169537/artifacts/15052658793).

```sh
CAMPAIGN_MATRIX=circuit-feed CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
