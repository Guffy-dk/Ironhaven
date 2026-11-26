# Balancekørsel 26. november 2026 kl. 04.26

Kørsel `2026-11-26T04:26:47+01:00`, simulation `f00bf59`, driver `3b5151b`. Spil `0.22.0`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-26-cable-feed.json).

35/35 forløb på to arbejdere. Af 27 ordinære kampagner gav 23 sejr ved swarm 25, 4 nederlag og 0 nåede tidsgrænsen. 8/8 udholdenhedsforløb vandt og valgte *Continue endlessly*. Det længste varede 8.988 simulerede sekunder, og det højeste nåede swarm 39. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 5431 og 9991. 24/24 matchede kontroller fra sidste kørsel gentog udfald, swarm, tid, kills, reparationer og opgraderinger. [Forrige kørsel](balance-2026-11-26-switchgear.md).

## Kabelrute til switchgear

Ni par sammenlignede sidste kørsels stenrute med en variant, der drejer de to savværker væk fra stenbåndene og tilføjer en fysisk kabelkæde. En dispatch deler den eksisterende kulrute med resin-kedlen, som får træ fra et nyt savværk. Et separat kobberbor og smelteri leverer kobber. Et udgangslager sender kablet videre til værkstedet. Driveren bruger kun almindelige kommandoer og optjente materialer. Der er endnu ingen dedikeret kredsløbsrute.

9/9 forsøgsforløb producerede resin, 9/9 producerede kabel, og 9/9 havde kabel i værkstedets input ved en milepæl. Sten blev observeret i 9/9, og 0/9 producerede switchgear. Sammenlignet med stenruten var to bedre, ét dårligere og 6 lige målt på sejr og højeste swarm.

| Seed | Sværhedsgrad | Swarm, kontrol → kabelrute | Resin | Kabel | Sten i input, første swarm-måling | Kabel i input, første swarm-måling | Switchgear |
|---|---|---:|---:|---:|---:|---:|---:|
| 417 | standard | 25 → 25 | 240 | 464 | 13 | 13 | 0 |
| 417 | relaxed / endless | 37 → 37 | 267 | 504 | 13 | 13 | 0 |
| 2026 | standard | 25 → 25 | 414 | 746 | 13 | 13 | 0 |
| 2026 | relaxed / endless | 38 → 38 | 549 | 948 | 13 | 13 | 0 |
| 7001 | standard | 25 → 25 | 264 | 470 | 13 | 13 | 0 |
| 7001 | relaxed / endless | 35 → 36 | 240 | 464 | 13 | 13 | 0 |
| 417 | veteran | 25 → 25 | 240 | 464 | 13 | 13 | 0 |
| 5431 | standard | 25 → 25 | 255 | 476 | 13 | 13 | 0 |
| 9991 | relaxed / endless | 39 → 38 | 336 | 536 | 13 | 13 | 0 |

En separat 90-sekunders gentest brugte et optjent checkpoint ved starten af swarm 25 på seed 417. En rute med 49 nye båndfelter førte kredsløb fra det eksisterende lager til kabelruten. Den første gentest sænkede kredsløbslageret til den valgte reserve på 10, mens switchgear stadig stod på nul. Kabler fyldte det fælles bånd frem mod værkstedet. Med samme checkpoint blev kabeltilførslen derefter afbrudt, og det fyldte bånd efter sammenløbet blev genlagt med normale kommandoer. Det gav otte producerede og lagrede switchgear mod nul i den uændrede checkpoint-kontrol. Gentestene tæller særskilt fra de 35 kampagner. De viser første produktion, men bruger de allerede indlæste kabler og afprøver derfor ingen stabil løbende leverance.

Spilværdierne beholdes. Næste forsøg bør sammenligne en dedikeret kredsløbsindgang med en styret sammenfletning, hvor en fuld kabelbuffer ikke kan standse kredsløbsleverancen.

Målingerne kan skelne et fysisk input fra et produceret eller lagret mellemprodukt. De viser de registrerede milepæle, mens kortvarige leverancer mellem milepælene kan mangle. Kampagneudfald påvirkes også af ekstra byggeri, strømbehov og forskellig skadesrækkefølge. [Klargjort havnefixture](harbor-endgame-0.21.1.md).

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Variant | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|---:|
| relaxed | harbor / endless | kabelrute | 4/4 | 37.5 | 8654.5 | 454 | 857.5 |
| relaxed | harbor / endless | kontrol | 4/4 | 37.5 | 8698.5 | 385 | 646.5 |
| standard | early_defense | kontrol | 3/3 | 25 | 5258 | 222 | 502 |
| standard | harbor | kabelrute | 4/4 | 25 | 5278 | 249.5 | 576.5 |
| standard | harbor | kontrol | 3/4 | 25 | 5271 | 230.5 | 543.5 |
| standard | industry | kontrol | 3/3 | 25 | 5275 | 218 | 525 |
| standard | logistics | kontrol | 3/3 | 25 | 5382 | 224 | 622 |
| standard | mortars | kontrol | 3/3 | 25 | 5265 | 220 | 503 |
| standard | pulse | kontrol | 3/3 | 25 | 5300 | 223 | 525 |
| standard | refining | kontrol | 1/1 | 25 | 5434 | 226 | 610 |
| standard | single | kontrol | 0/1 | 9 | 2034 | 77 | 18 |
| veteran | harbor | kabelrute | 0/1 | 25 | 5419 | 334 | 625 |
| veteran | harbor | kontrol | 0/1 | 25 | 5414 | 313 | 616 |

Rådata indeholder strøm, ammunition, lagerfyldning og ressourceproduktion, nettoflow, components, skud, upgrade-timing og projekttilgængelighed ved milepæle.

Spillerfeedback læst 26. november. En Desynced-spiller beskriver, at selv et mindre behov for mere strøm kan kræve en kæde af nye komponenter og leverancer. For Ironhaven peger det på værdien af at kunne se den konkrete manglende leverance før en fabriksudvidelse. Udsagnet er et enkelt feedbackeksempel. [Steam Community](https://steamcommunity.com/app/1450900/discussions/0/569297668062324391/).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse fra gemte kampagner gav en byte-identisk resultatfil. Der blev ikke udført manuel Windows-spiltest. Det eksisterende Windows-build `0.21.2.3` er fra `a8b056c`, og patcherens offentlige version er `0.22.0`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45678169537/artifacts/15052658793).

```sh
CAMPAIGN_MATRIX=cable-feed CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
