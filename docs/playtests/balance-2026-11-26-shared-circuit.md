# Balancekørsel 26. november 2026 kl. 10.30

Kørsel `2026-11-26T10:30:39+01:00`, simulation `124ef12`, driver `128e5e2`. Spil `0.22.0`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-26-shared-circuit.json).

35/35 forløb på to arbejdere. Af 27 ordinære kampagner endte 23 med sejr ved swarm 25, 4 med nederlag og 0 ved tidsgrænsen. 6/8 udholdenhedsforløb vandt og valgte *Continue endlessly*. Det højeste nåede swarm 39. Den længste simulerede varighed var 12.000 sekunder. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 5519 og 10039. 24/24 matchede kontroller gentog udfald, swarm, tid, kills, reparationer og opgraderinger fra forrige kørsel. [Forrige kørsel](balance-2026-11-26-circuit-feed.md).

## Delt kredsløbsforsyning

I ni matchede par brugte begge varianter samme fysiske ruter og 10 kredsløb som lagerreserve. Kontrollen sendte kredsløb østpå til switchgear. Forsøget brugte spillerkommandoen til rotation af lageret. Ét vindue på to sekunder ud af fire gik til switchgear, og de tre øvrige gik til komponentfabrikken. Det er en fordeling af tilgængelig eksporttid. Det faktiske vareflow afhænger også af lager, kapacitet og tilbageslag i ruterne.

Planen blev aktiveret i 8/9 forsøgsforløb. 8/9 producerede switchgear. I 2/3 lange forsøg med sejr voksede switchgearproduktionen efter starten af swarm 26. Medianændringen i komponentproduktion var +17 pr. par. I de aktiverede par var den +19 samlet og +19 målt fra starten af swarm 12. Ingen havneprojekter blev tilgængelige. Målt på sejr og højeste swarm var 4 bedre, 1 dårligere og 4 lige.

| Seed | Sværhedsgrad | Swarm, øst → delt | Første switchgear observeret, swarm | Switchgear, øst → delt | Components, øst → delt |
|---|---|---:|---:|---:|---:|
| 417 | standard | 25 → 25 | 13 | 208 → 208 | 32 → 49 |
| 417 | relaxed / endless | 36 → 38 | 13 | 204 → 208 | 32 → 59 |
| 2026 | standard | 25 → 25 | 13 | 388 → 302 | 32 → 31 |
| 2026 | relaxed / endless | 2 → 2 | – | 0 → 0 | 0 → 0 |
| 7001 | standard | 25 → 25 | 13 | 208 → 208 | 32 → 53 |
| 7001 | relaxed / endless | 35 → 36 | 13 | 204 → 204 | 32 → 56 |
| 417 | veteran | 25 → 23 | 13 | 204 → 208 | 42 → 48 |
| 5519 | standard | 25 → 25 | 13 | 208 → 294 | 32 → 20 |
| 10039 | relaxed / endless | 37 → 39 | 13 | 222 → 270 | 32 → 81 |

Begge Relaxed-varianter på seed 2026 ramte tidsgrænsen ved swarm 2, før lageret kunne drejes. Sidste kørsels checkpoint-gentest viste, at kolonien kunne rydde de sidste fjender uden nye testspillerkommandoer. Det aktuelle udfald beholdes som tidsgrænse. Holdout 5519 producerede 12 færre components, selv om switchgearproduktionen steg. Det lange holdout 10039 producerede 49 flere components og nåede swarm 39 mod 37.

Spilværdierne beholdes. Næste prioritet er at afprøve samme deling med en fast dispatch, måle den faktiske varefordeling og koble switchgear videre til Harbor Equipment.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Variant | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|
| relaxed | harbor / endless | delt | 3/4 | 37 | 8756 | 476.5 | 787 |
| relaxed | harbor / endless | øst | 3/4 | 35.5 | 8301 | 382.5 | 771.5 |
| standard | early_defense | strategikontrol | 3/3 | 25 | 5258 | 222 | 502 |
| standard | harbor | delt | 4/4 | 25 | 5339.5 | 299 | 467.5 |
| standard | harbor | øst | 3/4 | 25 | 5336.5 | 309.5 | 462 |
| standard | industry | strategikontrol | 3/3 | 25 | 5275 | 218 | 525 |
| standard | logistics | strategikontrol | 3/3 | 25 | 5382 | 224 | 622 |
| standard | mortars | strategikontrol | 3/3 | 25 | 5265 | 220 | 503 |
| standard | pulse | strategikontrol | 3/3 | 25 | 5300 | 223 | 525 |
| standard | refining | strategikontrol | 1/1 | 25 | 5434 | 226 | 610 |
| standard | single | strategikontrol | 0/1 | 9 | 2034 | 77 | 18 |
| veteran | harbor | delt | 0/1 | 23 | 5037 | 298 | 424 |
| veteran | harbor | øst | 0/1 | 25 | 5308 | 354 | 427 |

Rådata indeholder strøm, ammunition, lagerfyldning, ressourceproduktion, nettoflow, components, skud, opgraderingstider og projekttilgængelighed ved milepæle. Simulationen bruger optjente materialer, og rotationen er en fast automatiseret testplayerhandling. Den siger intet om bekvemmeligheden ved gentagen manuel rotation.

Spillerfeedback læst 26. november. Desynced-anmeldelserne rummer både ros af at kunne automatisere gentagelser og kritik af, hvor meget opsætning simpel logistik kan kræve. En hypotese for Ironhaven er at bevare spillerens kontrol over prioriteringen og lade en dispatch udføre den gentagne fordeling. Anmeldelserne er eksempler. [Steam-anmeldelser](https://steamcommunity.com/app/1450900/reviews/?browsefilter=toprated).

CHECKS

```sh
CAMPAIGN_MATRIX=shared-circuit CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
