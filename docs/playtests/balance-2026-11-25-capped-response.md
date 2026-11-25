# Balancekørsel 25. november 2026 kl. 16.28

Kørsel `2026-11-25T16:28:18+01:00`. Baseline `30d76c9`, driver `85cfe01`. [Rådata](balance-2026-11-25-capped-response.json).

35/35 forløb på to arbejdere. De 29 ordinære kampagner gav 21 sejre, 8 nederlag og 0 ved tidsgrænsen. 6/6 udholdenhedsforløb vandt og valgte fortsættelse via den normale host-kommando. Længste forløb varede 8.967 simulerede sekunder. Højeste swarm var 39. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 4933 og 9743. 17/17 matchede forløb gentog udfald, swarm, tid, kills, reparationer, upgrades og aflastningsvinduer fra kl. 14.01. [Forrige kørsel](balance-2026-11-25-short-response.md).

## Genstart efter 30 sekunder eller efter kampen

15 matchede par. Begge strategier reagerer mindst fem sekunder efter varslet og pauser højst to maskiner i hvert swarm. De bruger samme normale produktionskommandoer og prioriteringsliste. Kontrollen genstarter efter 30 sekunder, hvis kampen stadig er aktuel. Forsøget bevarer pausen, til fjenderne er væk og næste angreb er mere end 30 sekunder væk.

| Måling | 30 sek., sum | Til kampens slutning, sum | Median af parvis ændring |
|---|---:|---:|---:|
| Forsvarsudfald | 25 | 20 | 0 |
| Sekunder med underskud | 3678 | 2648 | -1 |
| Produktionspauser | 82 | 75 | -1 |
| Målte kampsekunder | 42247 | 42002 | -17 |
| Inaktive tårnsekunder | 11207 | 4730 | -31 |
| Ammunitionsmangel, tårnsekunder | 446 | 8 | 0 |
| Reparationer | 9964 | 10018 | -8 |

Målt på sejr og højeste swarm klarede 2 forløb med senere genstart sig bedre, ét dårligere og 12 lige godt. Holdout-parrene gav 4933 standard pulse: 25 → 25, 9743 veteran industry: 25 → 25, 9743 relaxed industry: 37 → 36. Af 39 vinduer med faktisk aflastning i varianten med senere genstart begyndte 19 før swarm-start, så tidspunktet for genstart kunne påvirke forsvaret allerede fra starten af kampen. Forskellige kamp- og overlevelsestider påvirker summerne. I de 12 scenarier, der også havde en historisk sammenligning med aflastning uden maskinbegrænsning, var antallet af forsvarsudfald 12 uden maskinbegrænsning, 18 ved 30 sekunder og 14 ved senere genstart.

| Lager ved start af swarm 9, 17 og 25 | Median af parvis ændring |
|---|---:|
| plate | 6 |
| gear | -8 |
| steel | -6 |
| circuit | -1 |
| module | 0 |

Lagertallene er parvise forskelle over 44 fælles milepæle. Lagerniveau afspejler både produktion og forbrug. Par, der tabte tidligt, bidrager med færre milepæle.

Senere genstart gav 20 % færre målte forsvarsudfald og 28 % færre underskudssekunder i alt. Den typiske parvise forskel var ét sekund, og det lange holdout sluttede én swarm tidligere. Aflastning gennem kampen er derfor en bedre kandidat end 30-sekundersgrænsen til videre afprøvning. Spilværdierne beholdes. Næste forsøg bør genstarte, når reserven kan bære den genaktiverede belastning, og måle, om det bevarer forsvaret og giver flere gears og mere stål før næste swarm.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Reaktion | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|---:|
| relaxed | industry | kontrol | 1/1 | 25 | 5759 | 19 | 195 |
| relaxed | industry / endless | 30 sek. | 2/2 | 37 | 8330 | 353 | 699.5 |
| relaxed | industry / endless | til kampens slutning | 2/2 | 37.5 | 8498.5 | 368.5 | 729.5 |
| standard | early_defense | 30 sek. | 1/1 | 25 | 5276 | 226 | 519 |
| standard | early_defense | til kampens slutning | 1/1 | 25 | 5391 | 229 | 522 |
| standard | harbor | kontrol | 1/1 | 25 | 5434 | 300 | 644 |
| standard | industry | 30 sek. | 2/2 | 25 | 5337.5 | 225.5 | 524 |
| standard | industry | til kampens slutning | 2/2 | 25 | 5401.5 | 207.5 | 556.5 |
| standard | logistics | 30 sek. | 1/1 | 25 | 5553 | 244 | 639 |
| standard | logistics | til kampens slutning | 1/1 | 25 | 5654 | 257 | 637 |
| standard | logistics / endless | 30 sek. | 1/1 | 28 | 6189 | 388 | 818 |
| standard | logistics / endless | til kampens slutning | 1/1 | 28 | 6294 | 428 | 810 |
| standard | mortars | 30 sek. | 1/1 | 25 | 5286 | 242 | 531 |
| standard | mortars | til kampens slutning | 1/1 | 25 | 5391 | 229 | 522 |
| standard | no_artillery | 30 sek. | 0/1 | 21 | 5432 | 638 | 818 |
| standard | no_artillery | til kampens slutning | 0/1 | 21 | 4847 | 318 | 876 |
| standard | pulse | 30 sek. | 2/2 | 25 | 5407 | 266.5 | 687.5 |
| standard | pulse | til kampens slutning | 2/2 | 25 | 5368.5 | 261.5 | 655.5 |
| standard | single | kontrol | 0/3 | 9 | 2034 | 94 | 18 |
| veteran | industry | 30 sek. | 2/4 | 25 | 5580 | 327 | 676 |
| veteran | industry | til kampens slutning | 3/4 | 25 | 5488.5 | 329.5 | 710 |

Rådata omfatter lagerfyldning, ressourcer, produktion, nettoflow, strøm, ammunition, components, upgrades, skud, tab og reparationer. Der blev anvendt optjente ressourcer. Driveren bruger en fast prioriteringsliste og reagerer på målinger uden menneskelig forsinkelse ud over den indlagte ventetid. Ingen af strategierne er afprøvet i en manuel Windows-kampagne.

Spillerfeedback fra sidste kørsel fremhævede rytmen mellem automatiserede jobs og natligt forsvar i Colony Survival. Conan Unconquered beskriver voksende bølger og en delt økonomi i co-op. For Ironhaven er hypotesen, at genstart efter kampen giver spilleren et tydeligt tidspunkt at vende tilbage til produktionen. Tidspunktet er endnu ikke afprøvet med spillere. [Colony Survival-anmeldelser](https://steamcommunity.com/app/366090/positivereviews/?filterLanguage=default) · [Conan Unconquered](https://store.steampowered.com/app/989690/Conan_Unconquered/?l=english).

Alle 216 automatiske tests bestod, desktop-ressourcebuildet blev samlet, og genoptagelse ved hjælp af gemte forløbsresultater gav en byte-identisk resultatfil. Denne kørsel ændrede testdriveren. Eksisterende Windows-build `0.21.2.3` er fra `139a43e`. Der blev ikke kørt en ny manuel Windows-spiltest. Patcherens offentlige version er `0.21.3`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45593303214/artifacts/15011368997).

```sh
CAMPAIGN_MATRIX=capped-response CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
