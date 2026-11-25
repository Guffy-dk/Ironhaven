# Balancekørsel 25. november 2026 kl. 01.27

Kørsel `2026-11-25T01:27:27+01:00`. Baseline `c7efa80`, driver `7cee0bd`, spil `0.21.3`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-25-power-origin.json).

35 forsøg afsluttet med resultater på to arbejdere. De 29 ordinære forløb gav 24 nederlag, 2 ved tidsgrænsen, 3 sejre. 6/6 udholdenhedsforløb vandt og valgte *Continue endlessly*. Det længste udholdenhedsforløb nåede swarm 34 efter 7.097 simulerede sekunder. Veteran med seed 7001 ramte grænsen på 9.000 sekunder ved swarm 6 i begge forsøg. Efter sejr valgte driveren fortsættelse via spillets normale host-kommando. Holdout-seeds var 3583 og 8363. 17/17 kontroller med samme seed, strategi, sværhedsgrad og horisont som kl. 22.27 gentog udfald, swarm, tid, kills, reparationer og opgraderinger. [Forrige kørsel](balance-2026-11-24-power-recovery.md).

## Strømudfald og genopbygning

De 20 kontroller havde 30 registrerede strømafbrydelser i forsvaret. 17 sluttede før målingens slutpunkt, med median 280 sekunder. Klassifikationen sammenligner målingen ved start med sekundet før.

| Observation ved start | Udfald |
|---|---:|
| Underskud ved forrige måling | 29 |
| Øget belastning | 1 |

Forsvaret kan først blive registreret som strømløst efter et allerede eksisterende underskud, blandt andet når batterireserven udtømmes, eller når kamp starter. Målingen kan hverken afgøre, hvornår et forudgående underskud begyndte, eller tilskrive det en bestemt bygning. Installeret kapacitet omfatter HQ og generatorer. Spillets målte produktion omfatter også grid-projekter, bonusser og afrunding.

Genopbygningsprioriteten gav 0 bedre, 0 dårligere og 15 lige kampagner målt på sejr og højeste swarm. 15/15 gentog alle seks mål. Forsøget gennemførte 3 prioriterede genopbygninger i 1 af 15 par. 3/3 holdout-par gentog alle seks mål. Efter mindst 60 sekunder med strømudfald under kamp afprøvede testdriveren tidligere generatorfelter med tilgængeligt brændstof først. Den brugte optjente materialer og de normale placerings- og byggekommandoer. Kontrollerne brugte almindelig rækkefølge og kunne selv genopbygge. Prioriterede bygninger kan derfor også være blevet placeret på samme tidspunkt i kontrollen.

- Seed 3583, standard / pulse, 3 prioriterede genopbygninger, swarm 25 → 25, underskudssekunder 767 → 767.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---:|---:|---:|---:|---:|
| relaxed | industry / endless | 6/6 | 33 | 6809 | 360 | 696 |
| standard | early_defense | 0/2 | 25 | 4910 | 306 | 601 |
| standard | harbor | 0/1 | 24 | 4768 | 329 | 380 |
| standard | industry | 1/7 | 24 | 4701 | 319 | 538 |
| standard | logistics | 0/2 | 8 | 2110 | 212 | 300 |
| standard | mortars | 0/2 | 25 | 4910 | 306 | 601 |
| standard | no_artillery | 0/2 | 18 | 3954 | 305 | 697 |
| standard | pulse | 2/4 | 25 | 4961 | 367.5 | 810.5 |
| standard | single | 0/3 | 8 | 1684 | 73 | 18 |
| veteran | industry | 0/6 | 6 | 4936 | 288 | 708 |

Rådata indeholder milepæle for lager, produktion og nettoflow, components, opgraderinger, strøm, ammunition, skud, bygningstab og reparationer. Historiske kampagner og samtidige par er kontrolgrundlaget. På seed 417 gav de forskellige byggeprioriteter for early_defense og mortars identiske milepæle og slutmålinger. De to strategier skal derfor ikke tælles som uafhængig evidens for forskellige forsvarstyper på dette seed. Stikprøven og den faste byggeplan giver begrænset grundlag for ændringer i spilværdierne. Næste forsøg bør følge underskud fra første fald i reserve og måle, om varsling før tårnene stopper giver tid til at reducere belastning eller tilføje kapacitet.

Spillerfeedback læst 25. november. Desynced-anmeldelserne i det læste udsnit beskriver besvær med at forstå og programmere logistikadfærd. Ironhaven viser allerede `Grid shortfall: add generation` ved placering af en strømkrævende bygning. En hypotese er at supplere den besked med forventet tid til, at reserven tømmes under aktuel belastning. [Placeringsvarsel](../../public/app.js#L131). Den er endnu ikke afprøvet hos spillere. [Steam-anmeldelser](https://steamcommunity.com/app/1450900/reviews/?browsefilter=mostrecent&l=english).

Genoptagelse af matricen fra de gemte resultater gav en byte-identisk resultatfil. Spilkoden og patcheren er uændrede. Alle 215 lokale tests bestod, og det indlejrede Windows-ressourcebuild blev samlet. GitHub CI gennemførte Windows-jobbet på baseline. Denne kørsel havde ingen ny manuel Windows-spiltest eller renderkontrol. [Baseline CI](https://github.com/Guffy-dk/Ironhaven/actions/runs/45518222830) · [Seneste installationsverifikation](https://github.com/Guffy-dk/Ironhaven/actions/runs/45440539360).

```sh
CAMPAIGN_MATRIX=power-origin CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
