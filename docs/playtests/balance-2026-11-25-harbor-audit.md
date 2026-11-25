# Balancekørsel 25. november 2026 kl. 22.27

Kørsel `2026-11-25T22:27:16+01:00`, simulation `a8b056c`, driver `98464d9`. Spil `0.22.0`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-25-harbor-audit.json).

35/35 forløb på to arbejdere. De 27 ordinære forløb gav 22 sejre, 5 nederlag og 0 ved tidsgrænsen. 8/8 udholdenhedsforløb vandt og valgte *Continue endlessly* via den normale host-kommando. Det længste varede 9.158 simulerede sekunder. Højeste swarm var 38. Horisonterne var 9.000 og 12.000 sekunder. Nye holdout-seeds var 5171 og 9931. 19/19 identiske scenarier fra den tidligere kampvarselstest gentog udfald, swarm, tid, kills, reparationer og opgraderinger. [Kampvarsel](balance-2026-11-25-combat-lead.md) · [Seneste kørsel](balance-2026-11-25-reserve-restart.md).

## Havneprojekter

Driveren registrerer de officielle projektbetingelser og manglende materialer ved hvert swarm og ved afslutningen. Når der er fred, bestiller den projekter, som den officielle projektkontrol gør tilgængelige. Ingen projekter blev tilgængelige, så driveren udstedte ingen projektkommandoer. `harbor`-strategien tilføjer en fysisk knuser- og teglovnslinje. Den etablerer endnu ikke kæden for Harbor Equipment, switchgear og hull panels. Derfor er målingen en undersøgelse af, hvor den eksisterende testspiller stopper, og kan ikke afgøre, hvor hurtigt en komplet kampagnefabrik kommer i mål. 11 harbor-forløb nåede swarm 25. 11/11 harbor-forløb producerede firebricks. Ved starten af swarm 25 var medianlageret 200 firebricks og 0 Harbor Equipment.

| Harbor-seed i endless | Højeste swarm | Sekunder efter sejr | Firebricks produceret, start af 25 → slut | Firebricks på lager, start af 25 → slut | Harbor Equipment ved slut |
|---|---:|---:|---:|---:|---:|
| 5171 | 38 | 2899 | 204 → 204 | 200 → 200 | 0 |
| 9931 | 37 | 2626 | 204 → 489 | 200 → 481 | 0 |
| 417 | 35 | 2307 | 204 → 204 | 200 → 200 | 0 |
| 2026 | 38 | 3022 | 204 → 372 | 200 → 362 | 0 |
| 7001 | 36 | 2437 | 204 → 204 | 200 → 200 | 0 |

Kørslerne bruger optjente materialer og almindelige spillerkommandoer. Den tidligere klargjorte fabriksfixture kunne producere Harbor Equipment og gennemføre projekter med tilførte materialer og klargjort strøm. Den er adskilt fra denne analyse af kampagner. [Havnefixture](harbor-endgame-0.21.1.md).

I 6 matchede par mellem industry og harbor var 6 ens på udfald og 5 nåede samme swarm. De øvrige forskelle afspejler også ekstra byggeri, brændselsforbrug og ændret strømbehov.

I tre af fem lange havneforløb steg hverken lageret eller produktionen af firebricks efter starten af swarm 25. Checkpointet på seed 417 viser en aktiv ovn og et fyldt lokalt lager på 200 firebricks. De næste forsøg bør føre stenene videre til switchgear og måle, hvilke leverancer der begrænser Harbor Equipment. Spilværdierne beholdes.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer | Firebricks produceret |
|---|---|---:|---:|---:|---:|---:|---:|
| relaxed | harbor / endless | 5/5 | 37 | 8252 | 386 | 625 | 204 |
| relaxed | industry / endless | 3/3 | 38 | 9061 | 452 | 811 | 0 |
| standard | early_defense | 3/3 | 25 | 5258 | 222 | 502 | 0 |
| standard | harbor | 4/5 | 25 | 5287 | 220 | 507 | 204 |
| standard | industry | 3/3 | 25 | 5275 | 218 | 525 | 0 |
| standard | logistics | 3/3 | 25 | 5382 | 224 | 622 | 0 |
| standard | mortars | 3/3 | 25 | 5265 | 220 | 503 | 0 |
| standard | pulse | 3/3 | 25 | 5300 | 223 | 525 | 0 |
| standard | refining | 1/1 | 25 | 5434 | 226 | 610 | 0 |
| standard | single | 0/3 | 9 | 2034 | 94 | 18 | 0 |
| veteran | harbor | 1/1 | 25 | 5422 | 310 | 639 | 255 |
| veteran | industry | 1/2 | 25 | 5400.5 | 302 | 652 | 0 |

Rådata indeholder lagerfyldning, ressourcebeholdning, produktion og nettoflow, strøm, ammunition, components, tidspunkt for opgraderinger, skud og tab ved milepælene.

Spillerfeedback læst 25. november. En Colony Survival-anmeldelse efterlyser mere indhold. For Ironhaven er hypotesen, at mellemprodukter med selvstændig anvendelse kan give meningsfulde delmål, mens spilleren bygger sig frem mod havneprojekterne. En enkelt anmeldelse fastlægger ikke spillerpræferencer. [Steam-anmeldelser](https://steamcommunity.com/app/366090/reviews/).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse gav en byte-identisk resultatfil. Kørslen ændrede kun testværktøjet. Eksisterende Windows-build `0.21.2.3` findes fra commit `a8b056c`. Der blev ikke kørt en ny manuel Windows-spiltest. Patcherens offentlige version er `0.22.0`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45678169537/artifacts/15052658793).

```sh
CAMPAIGN_MATRIX=harbor-audit CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
