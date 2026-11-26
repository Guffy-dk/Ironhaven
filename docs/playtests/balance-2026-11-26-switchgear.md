# Balancekørsel 26. november 2026 kl. 01.34

Kørsel `2026-11-26T01:34:05+01:00`, simulation `e082c02`, driver `e94fa0f`. Spil `0.22.0`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-26-switchgear.json).

35/35 kampagner på to arbejdere. Af 27 ordinære kampagner gav 25 sejr ved swarm 25, 2 nederlag og 0 nåede tidsgrænsen. 8/8 udholdenhedsforløb vandt og valgte *Continue endlessly*. Længste forløb varede 9.050 simulerede sekunder, og højeste swarm var 38. Horisonterne var 9.000 og 12.000 sekunder. Nye holdouts var 5317 og 9973. 24/24 kontroller fra sidste havnekørsel gentog udfald, swarm, tid, kills, reparationer og opgraderinger. [Forrige kørsel](balance-2026-11-25-harbor-audit.md).

## Levering fra teglstenslager til switchgear

Ni matchede havnepar. Forsøget bygger et switchgear-værksted og et udgangslager på optjente materialer efter swarm 12, når der er materialer og seks enheder ledig effekt. To transportbånd henter sten fra det eksisterende lager. Værkstedets input aflæses ved swarm-start og slut. Tallene viser højeste observerede inputbuffer, ikke samtlige leverancer.

Leveringsplanen blev frigivet i 9/9 scenarier. I 8/9 blev ildfaste sten observeret i værkstedets input. Blandt de 4 lange forsøgsforløb med sejr havde 4 sten i input ved mindst én milepæl efter swarm 25. Tidligste observerede leverance var ved swarm 13. Værkstedet kræver også fysisk levering af kabler og kredsløb. Den testede plan etablerede kun stenruten. Ingen forsøgsressourcer blev tilført. Rangering efter sejr og højeste swarm gav 2 bedre, 2 dårligere og 5 lige. På 27 fælles milepæle ved swarm 17, 21 og 25 var medianændringerne i lagrene plate -9, gear -4, steel -6, circuit -2, module -1. Det afspejler både forbrug, produktion og tab.

| Seed | Sværhedsgrad | Swarm, kontrol → levering | Højeste observerede input af sten | Sten på slutlager, kontrol → levering | Produceret switchgear |
|---|---|---:|---:|---:|---:|
| 417 | standard | 25 → 25 | 2 | 200 → 200 | 0 |
| 417 | relaxed / endless | 35 → 37 | 1 | 200 → 200 | 0 |
| 2026 | standard | 25 → 25 | 3 | 200 → 200 | 0 |
| 2026 | relaxed / endless | 38 → 38 | 4 | 362 → 263 | 0 |
| 7001 | standard | 25 → 25 | 4 | 200 → 200 | 0 |
| 7001 | relaxed / endless | 36 → 35 | 2 | 200 → 200 | 0 |
| 417 | veteran | 25 → 25 | 3 | 251 → 236 | 0 |
| 5317 | standard | 25 → 25 | 0 | 200 → 200 | 0 |
| 9973 | relaxed / endless | 34 → 35 | 1 | 571 → 574 | 0 |

Før målingen blev et bredere layout forkastet, fordi det brugte råstofpositioner fra standardterrænet. Ekspeditionens faktiske forekomster er anderledes. Den medregnede variant genbruger den eksisterende, fungerende teglovnslinje. Testen kan derfor vise fysisk levering af det første input under kampagnebudgettet. Produktionshastighed og projekttid for den fulde kæde er ubestemte. [Klargjort havnefixture](harbor-endgame-0.21.1.md).

Seed 5317 havde nul observerede sten i input. Checkpointet ved swarm 25 viste ildfaste sten på det første bånd og træ på det andet. En afgrænset gentest startede to kopier af det samme optjente checkpoint. Med normale kommandoer drejede jeg begge savværker og genlagde de to fyldte bånd. Efter 30 simulerede sekunder var der fire sten i input mod nul i kontrollen. Gentesten indgår særskilt i rådata. Kampagneudfaldet i matricen stammer fra den oprindelige rute.

Spilværdierne beholdes. Næste forsøg bør reservere båndet til ildfaste sten og måle, om dedikerede ruter for kabler og kredsløb kan levere det første switchgear uden at dræne den normale elektronikproduktion.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Variant | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|---:|
| relaxed | harbor / endless | kontrol | 4/4 | 35.5 | 8078 | 387 | 638 |
| relaxed | harbor / endless | levering | 4/4 | 36 | 8228 | 426 | 624.5 |
| standard | early_defense | kontrol | 3/3 | 25 | 5258 | 222 | 502 |
| standard | harbor | kontrol | 4/4 | 25 | 5354.5 | 218.5 | 551 |
| standard | harbor | levering | 4/4 | 25 | 5354.5 | 227 | 567.5 |
| standard | industry | kontrol | 3/3 | 25 | 5275 | 218 | 525 |
| standard | logistics | kontrol | 3/3 | 25 | 5382 | 224 | 622 |
| standard | mortars | kontrol | 3/3 | 25 | 5265 | 220 | 503 |
| standard | pulse | kontrol | 3/3 | 25 | 5300 | 223 | 525 |
| standard | refining | kontrol | 1/1 | 25 | 5434 | 226 | 610 |
| standard | single | kontrol | 0/1 | 9 | 2034 | 77 | 18 |
| veteran | harbor | kontrol | 1/1 | 25 | 5422 | 310 | 639 |
| veteran | harbor | levering | 0/1 | 25 | 5414 | 313 | 616 |

Rådata indeholder lagerfyldning, ressourcer, produktion og nettoflow, strøm, ammunition, components, opgraderinger og skud ved milepæle. Forløbene bruger autoritativ simulation, almindelige kommandoer og optjente materialer.

Spillerfeedback læst 26. november. En Factorio-anmeldelse fremhæver produktionsflaskehalse og nye malmforekomster som opgaver, der giver variation. Det motiverer at teste en række små fungerende led i havnekæden. Anmeldelsen siger intet om passende omkostninger eller tid i Ironhaven. [Steam-anmeldelser](https://steamcommunity.com/app/427520/reviews?browsefilter=toprated).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse fra gemte slutresultater gav en byte-identisk resultatfil. Det eksisterende interne Windows-build `0.21.2.3` er fra commit `a8b056c`. Kørslen ændrede testdriveren. Manuel Windows-spiltest blev ikke udført. Patcherens offentlige version er `0.22.0`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45678169537/artifacts/15052658793).

```sh
CAMPAIGN_MATRIX=switchgear CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
