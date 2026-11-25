# Balancekørsel 25. november 2026 kl. 04.27

Kørsel `2026-11-25T04:27:27+01:00`, simulation `da4f9e6`, testdriver `7fad7a7`. Spilversion `0.21.3` og eksisterende build-id `0.21.2.3`. Sværhedsjusteringen fra `8ccd033` er med i denne baseline. [Rådata](balance-2026-11-25-reserve-lead.json) · [Sværhedsjustering](balance-2026-11-25-difficulty.md).

35/35 forløb på to arbejdere. De 32 ordinære kampagner gav 24 sejre, 8 nederlag og 0 ved tidsgrænsen. 3/3 udholdenhedsforløb vandt og fortsatte via den normale host-kommando. Det længste varede 9.158 simulerede sekunder og nåede swarm 38. Højeste swarm var 39 på seed 9257 efter 8.847 sekunder. Tre udholdenhedsforløb havde en horisont på 12.000 sekunder, de ordinære 9.000. Nye holdout-seeds var 4741 og 9257.

## Strømreserve og varslingsvindue

- 280 registrerede fald i reserve under nominelt underskud. 35 registrerede strømudfald i forsvaret under kamp. I 35 tilfælde var reservefaldet allerede observeret.
- Et muligt varsel blev registreret, når reserven faldt, og reserve divideret med nominelt underskud var højst 30 sekunder. Det kom før 35 af 35 udfald, med median 20 sekunders forspring. Af disse havde 25 mindst 10 sekunders forspring. Median absolut afvigelse mellem estimat og faktisk tid til registreret udfald var 10.0 sekunder.
- 250 reserveperioder nåede varslingen før første udfald eller uden et udfald. 217 sluttede uden et registreret udfald, og 1 var stadig åbne ved forsøgets slutpunkt. Samme reserveperiode kan rumme flere registrerede udfald. Blandt holdouts havde 8 af 8 udfald et tidligere varsel.

Målingen læser simuleringen én gang i sekundet. Udfald kræver kamp, nominelt underskud og mindst ét inaktivt strømafhængigt tårn. Reserveperioden slutter ved nominelt overskud eller balance. Produktion, belastning, rækkefølgen af aktive bygninger og kampstart kan ændre sig, så estimatet er en enkel indikator. Et varsel uden registreret forsvarsudfald kan stadig være relevant for produktionen. Driveren reagerede ikke på varslet. Forsøget måler signalets timing og viser ingen forbedring af overlevelsen fra et UI-varsel.

## Sammenligning og strategi

13 ordinære scenarier kunne matches med kl. 01.27 på seed, strategi, sværhedsgrad og horisont. Sejre gik fra 1 til 8 efter den allerede mergede sværhedsjustering. 18/18 matchede scenarier fra sværhedsrapporten gentog udfald, swarm, tid og kills. [Kørslen kl. 01.27](balance-2026-11-25-power-origin.md).

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer | Udfald |
|---|---|---:|---:|---:|---:|---:|---:|
| relaxed | industry | 3/3 | 25 | 5759 | 44 | 226 | 2 |
| relaxed | industry / endless | 2/2 | 38.5 | 9002.5 | 558.5 | 914 | 4 |
| standard | early_defense | 3/3 | 25 | 5258 | 222 | 502 | 3 |
| standard | harbor | 1/1 | 25 | 5475 | 276 | 688 | 0 |
| standard | industry | 3/3 | 25 | 5275 | 218 | 525 | 3 |
| standard | logistics | 4/4 | 25 | 5351.5 | 241 | 632 | 2 |
| standard | logistics / endless | 1/1 | 28 | 6195 | 434 | 839 | 1 |
| standard | mortars | 3/3 | 25 | 5265 | 220 | 503 | 3 |
| standard | no_artillery | 0/3 | 20 | 4519 | 232 | 812 | 4 |
| standard | pulse | 4/4 | 25 | 5371 | 226 | 612 | 3 |
| standard | single | 0/3 | 9 | 2034 | 94 | 18 | 0 |
| veteran | industry | 3/4 | 25 | 5322.5 | 333 | 673 | 6 |
| veteran | mortars | 0/1 | 25 | 5243 | 378 | 611 | 4 |

Rådata indeholder milepæle for lager og ressourceoverskud, nettoforbrug og produktion, strøm, ammunition, components, opgraderinger, skud, tab og reparationer. Driveren brugte optjente materialer og normale spillerkommandoer. Den faste byggeplan kan give ens prioriteringer i praksis. Early defense og mortars havde på alle tre fælles seeds forskellige milepæle og slutmålinger. På seed 417 brugte de henholdsvis 502 og 486 reparationer og affyrede 9.622 og 9.723 skud.

Spillerfeedback læst 25. november. En Factorio-anmeldelse beskriver produktionsstop og glæden ved at løse problemer i egne produktionslinjer. Det motiverer en afprøvning af tydelig information om faldende reserve, der hjælper spilleren med selv at vælge at tilføje produktion eller fjerne belastning. Det er en designhypotese baseret på et lille udsnit. [Factorio-anmeldelser](https://steamcommunity.com/app/427520/reviews?browsefilter=toprated).

Spilværdierne beholdes. Næste forsøg bør sammenligne et diskret reservestatussignal med et egentligt kampvarsel, der også tager højde for tiden til næste angreb og for, hvilke tårne der først mister strøm. Målet er at beholde nyttigt forspring og reducere varsler om udfald, der aldrig sker.

Alle 215 lokale tests bestod, og det indlejrede Windows-ressourcebuild blev samlet. Genoptagelse gav en byte-identisk resultatfil. GitHub byggede allerede Windows-artefakten med den mergede sværhedsjustering. Dens build-id deles med et tidligere build, så kildecommit `1120811` identificerer præcis det testbuild. Denne kørsel ændrede testdriveren og gennemførte ingen ny manuel Windows-spiltest. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45520665965/artifacts/14980525834).

```sh
CAMPAIGN_MATRIX=reserve-lead CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
