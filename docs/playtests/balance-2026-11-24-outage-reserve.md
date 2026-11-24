# Balancekørsel 24. november 2026 kl. 19.27

Simulation `6380255`, testdriver `fb03be5`, version `0.21.3`, eksisterende internt build `0.21.2.3`. [Rådata](balance-2026-11-24-outage-reserve.json).

35 automatiserede forløb på to arbejdere. Blandt 25 almindelige kampagner var der 4 sejre, 20 nederlag og 1 ved tidsgrænsen. 10 af 10 udholdenhedsforløb vandt og fortsatte frivilligt. Det længste udholdenhedsforløb nåede swarm 34 og varede 7.097 simulerede sekunder.

## Reserve til genopbygning

Kontrollen og forsøget bruger samme grundplan. Efter 60 sekunders vedvarende observeret effektunderskud med mindst ét strømløst tårn under en aktiv swarm udsætter forsøgsdriveren kun reparationer uden for fyret, når reparationen ellers kunne betales, men ville bruge af de 12 træ og 16 plader, som en ny sentry koster. Fyret følger den samme reparationsregel i begge forløb. Andre bygge- og opgraderingskommandoer kan stadig bruge materialerne. Den separate sentry-fallback var slået fra for at isolere denne ændring.

Betingelsen blev opfyldt i 12 af 15 par. Reglen udsatte mindst én reparation i 6 af 15 par. Reserven gav 0 bedre, 1 dårligere og 14 lige udfald rangeret efter sejr og sidste swarm. Blandt de 14 par uden tidsgrænse gav den 0 bedre, 1 dårligere og 13 lige. På de fem holdout-par gav den 0 bedre, 0 dårligere og 5 lige efter samme rangering. 0 af 10 fælles kontroller matchede alle seks mål fra forrige kørsel på 0.21.2. Baseline ændrede sig med Dispatch-, elektronik- og tømmeropdateringerne, så effekten af reserven vurderes ud fra parrene på samme 0.21.3-kode.

Medianforskellen ved slutpunktet var 0 reparationer og 0 tabte bygninger. Den var 0 målte kampsekunder med mindst ét strømløst tårn. 2 af 15 kontroller og 0 af 15 reserveforløb havde en sentrys materialer tilbage. Forskellige slutpunkter måles på forskellige swarms og kan derfor ikke alene fastslå genopbygningskapacitet i en bestemt kamp.

| Seed | Strategi | Sværhedsgrad | Udsnit | Kontrol | Reserve | Udsatte reparationsforsøg | Plader ved slutpunkt, kontrol / reserve |
|---:|---|---|---|---|---|---:|---|
| 9419 | no_artillery | standard | prior-stall | 18 | 18 | 0 | 2 / 2 |
| 8813 | logistics | standard | prior-stall | 25 | 25 | 0 | 3 / 3 |
| 6197 | industry | relaxed | prior-stall / udholdenhed | 32 ★ | 32 ★ | 0 | 2 / 2 |
| 417 | industry | standard | comparison | 25 | 25 | 0 | 3 / 3 |
| 2026 | industry | standard | comparison | 24 | 24 | 10 | 11 / 3 |
| 417 | industry | relaxed | comparison / udholdenhed | 34 ★ | 33 ★ | 11 | 1 / 2 |
| 1967 | industry | standard | comparison | 25 ★ | 25 ★ | 29 | 16 / 7 |
| 4297 | mortars | veteran | comparison | 23 | 23 | 0 | 3 / 3 |
| 2026 | pulse | standard | comparison | 25 ★ | 25 ★ | 10 | 2 / 8 |
| 6619 | industry | relaxed | comparison / udholdenhed | 33 ★ | 33 ★ | 0 | 3 / 3 |
| 7001 | logistics | standard | holdout | 23 (tid) | 23 | 21 | 600 / 2 |
| 7001 | industry | relaxed | holdout / udholdenhed | 32 ★ | 32 ★ | 0 | 2 / 2 |
| 9871 | industry | veteran | holdout | 8 | 8 | 2 | 2 / 3 |
| 9871 | early_defense | standard | holdout | 25 | 25 | 0 | 10 / 10 |
| 9871 | industry | relaxed | holdout / udholdenhed | 32 ★ | 32 ★ | 0 | 1 / 1 |

★ markerer kampagnesejr ved swarm 25. Andre Standard-kontroller med seed 7001: single 7, early_defense 23, no_artillery 18, mortars 23, harbor 23.

Strømsvigt vurderes ved testspillerens beslutning hvert andet simulerede sekund og nulstilles, når en måling ikke længere opfylder betingelsen. Udsatte reparationsforsøg kan tælle den samme bygning flere gange. Målingen lægger ikke ressourcer i et separat lager, og det automatiserede layout siger ikke, hvordan en menneskelig spiller ville prioritere fabrikker eller forsvar. Rådata indeholder overlevelsestid, tab, reparationer, lager, produktion, netflow, strøm, ammo, genopbygning og opgraderingsmilepæle. Det er simulation med eksisterende spillerkommandoer og optjente materialer.


På 0.21.3 sluttede de tre tidligere fastlåste kontrolscenarier inden tidsgrænsen: 9419: 17 (tid) → 18, 8813: 5 (tid) → 25, 6197: 30 ★ (tid) → 32 ★. Det sammenligner samlede versionsændringer og isolerer ikke ét produktionsled.

Det nye logistik-holdout 7001 ramte tidsgrænsen ved swarm 23 med to fjender og nul gear. Afspilning af yderligere 120 simulerede sekunder fra slutgemningen uden spillerkommandoer lod forsvaret dræbe begge. Det peger på en vekselvirkning med testspillerens handlinger. Den ordinære kampagne forbliver registreret ved tidsgrænsen. Reservevarianten tabte ved samme swarm.

## Beslutning

Spillets omkostninger beholdes. Alle 215 lokale tests og det lokale build bestod. Windows-opstart og installation var allerede verificeret på den eksisterende spilversion, og denne kørsel ændrede kun testdriver og dokumentation. [Windows-verifikation](https://github.com/Guffy-dk/Ironhaven/actions/runs/45440539360). Reserveadfærden er fortsat valgfri i testdriveren. Næste forsøg bør måle tid fra tab af generation til genetableret effekt og skelne byggematerialer fra brændsel, før der overvejes en ændring af spillets reparationssystem.

Spillerfeedback læst 24. november. Desynced-spillere beskriver både friheden ved alternative produktionsveje og friktionen ved kompliceret drift. Conan Unconquered-spillere har fremhævet presset fra korte pauser og reparationsomkostninger. Det peger på at gøre årsagen til langsom genopbygning synlig i Ironhaven. Kilderne er eksempler. [Desynced](https://store.steampowered.com/app/1450900/Desynced/) · [Conan Unconquered](https://steamcommunity.com/app/989690/reviews/?browsefilter=toprated) · [Tidligere kilder om alle fem inspirationsspil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=outage-reserve CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
