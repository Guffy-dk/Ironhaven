# Balancekørsel 24. november 2026 kl. 13.27

Simulation `7dfc892`, UI-kandidat `3354fd0`, internt build `0.21.2.1`. [Rådata](balance-2026-11-24-ammo-shortcut.json).

35 automatiserede forløb på to arbejdere. De 32 almindelige kampagner endte med 7 sejre, 25 nederlag og 0 ved tidsgrænsen. 20 af 20 matchende kontrolcases fra 20. november gentog udfald, swarm, tid, kills, reparationer og opgraderinger. Holdout-seeds er 6029 og 9017.

## Ammunitionsadvarsel og spillerhandling

Den eksisterende advarsel i Swarms-panelet har fået en Find turret-knap. Den vælger først et tomt tårn og prioriterer nærhed til den aktuelle swarm. Uden en aktiv swarm vælger den tårnet nærmest kameraet. Kameraet centreres og den eksisterende bygningsinspektør åbnes. Handlingen bygger eller ændrer ingen enheder, lager, ammunitionsregler eller savedata.

Den nye kontrol af den almindelige UI-entrypoint dækker prioritering af det tomme tårn nærmest angriberne, centreret kamera, annullering af aktivt værktøj og uændret gemt koloni. Ét af de 35 forløb havde mindst én måling med et aktivt, tomt tårn og uden gear. Tidligere dokumenteret fastlåsning er et konkret eksempel på, hvorfor det kan betale sig at finde det berørte forsvar hurtigt. Simulationen måler ikke en menneskelig reaktionstid. [Tidligere checkpointforsøg](balance-2026-11-24-coal-vs-marine.md).

## Resultater pr. sværhedsgrad og strategi

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sekunder | Tab | Reparationer |
|---|---|---:|---:|---:|---:|---:|
| relaxed | industry | 3/3 | 25 | 5194 | 81 | 331 |
| standard | early_defense | 1/4 | 24.5 | 5066 | 310 | 664.5 |
| standard | industry | 1/4 | 25 | 5080 | 337.5 | 710 |
| standard | logistics | 0/4 | 24.5 | 4779.5 | 293 | 526 |
| standard | mortars | 1/4 | 25 | 5058.5 | 338.5 | 693 |
| standard | no_artillery | 0/3 | 20 | 4350 | 305 | 645 |
| standard | pulse | 1/4 | 25 | 5198.5 | 345.5 | 802 |
| standard | single | 0/3 | 7 | 1527 | 67 | 8 |
| veteran | industry | 0/3 | 21 | 4382 | 306 | 576 |

| Seed | Sværhedsgrad | Strategi | Sejr ved swarm 25 | Sidste swarm | Sim. sekunder | Udfald |
|---:|---|---|---|---:|---:|---|
| 417 | relaxed | industry | 5194 | 33 | 6909 | defeat |
| 2026 | standard | logistics | — | 24 | 4591 | defeat |
| 9017 | veteran | industry | — | 20 | 4188 | defeat |

Længste forløb varede 6909 simulerede sekunder og nåede swarm 33. Alle udholdenhedsforløb anvender den eksisterende værtskommando efter almindelig sejr. Rådata indeholder tider, tab, reparationer, lager, beholdning, netflow, produktion, effekt, ammo, opgraderinger og skud ved milepæle. Testspilleren bruger en fast grundplan og bygger kun med optjente materialer.

I Chromium bestod et almindeligt klik efter rettelsen af pointer-events. I det byggede Windows-spil bekræftede CI synlighed, markørens træfpunkt, centreret kamera og åbnet morterinspektør i en reproducerbar, pauset QA-koloni. Alle 210 lokale tests bestod. [Windows-verifikation](https://github.com/Guffy-dk/Ironhaven/actions/runs/45394771250) · [Windows-skærmbillede, Ironhaven-ammo-shortcut.png i forhåndsvisningsarkivet](https://github.com/Guffy-dk/Ironhaven/actions/runs/45394771250/artifacts/14921001324) · [Internt build 0.21.2.1](https://github.com/Guffy-dk/Ironhaven/actions/runs/45394771250/artifacts/14920383555). Det er en UI-test, mens tabellerne bygger på almindelige simulationer. Næste prioritet er at se, om spillere finder og bruger genvejen under en rigtig swarm. De større spørgsmål om materialelæsbarhed og sen industriel variation står stadig åbne.

Spillerfeedback gennemgået 24. november: anmeldelser af They Are Billions beskriver sene nederlag, når en sårbar flanke opdages for sent. Desynced-anmeldelser beskriver friktion ved at finde produktionsfejl. Det motiverer et kortere trin fra advarsel til berørt bygning. Begge er eksempler fra et lille udsnit. [They Are Billions](https://steamcommunity.com/app/644930/reviews/?browsefilter=trendmonth&l=english&p=1) · [Desynced](https://store.steampowered.com/app/1450900/Desynced/) · [Tidligere noter om alle fem spil](balance-2026-11-20-062727.md).

For at reproducere serien, brug standardmatrixen med seed 3163 i stedet for 7, holdout 6029 i stedet for 2801 og udholdenheds-holdout 9017 i stedet for 6823. Kør fra repoets rod med to arbejdere.
