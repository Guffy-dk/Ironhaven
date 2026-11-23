# Balancekørsel 23. november 2026

Spilversion `0.20.2`, eksisterende internt build `0.20.2.3`. Simulationsbaseline `6cbfb84`, måleværktøj `d4020cc`. [Rådata](balance-2026-11-23-industry-fuel.json).

35 endelige gennemspilninger og 12 afsluttede raffineringspiloter med to arbejdere og almindelige spillerkommandoer. De 26 almindelige kampagner gav 6 sejre, 19 nederlag og 1 ved tidsgrænsen. De 9 udholdenhedsforløb havde op til 72.000 simulerede sekunder. 7 vandt ved swarm 25 og fortsatte som vært. Længste forløb nåede swarm 33 efter 6921 simulerede sekunder.

## Raffinering og kulreserve

Den første kulrute sluttede på et eksisterende savværksfelt. Testspilleren kunne derfor springe savværket over, allerede før raffinaderiet blev finansieret. Den korrigerede rute føder ovnen fra modsatte side. Testdriveren afviser nu overlap på hele kulruten. De afsluttede forløb med den fejlbehæftede rute er arkiveret separat. To yderligere pilotforsøg blev afbrudt. Uændrede industrikontroller er genbrugt.

På seed 1967 gik den almindelige raffineringsvariant fra swarm 4 (tid) til 25 ★ efter rettelsen. På Relaxed med seed 417 steg koncentratet fra 9 i den tidligere pilot til 309 i den korrigerede test. Det er en effekt af testplanen.

Ti grupper bruger samme kort- og swarm-seed, sværhedsgrad og horisont. Industri er kontrol. Raffinering tilføjer den eksisterende komplette linje, når komponenter, stål, gear, plader og træ er optjent. Den tredje variant ændrer kun kulgrænsen for den eksisterende lagerudlevering fra 10 til 40 enheder. Det er en tærskel for at eksportere nyt kul, og allerede afsendt kul kan stadig bevæge sig videre. Spilmotoren og byggeomkostningerne er identiske.

Raffinering producerede koncentrat i 9 af 10 almindelige raffineringsvarianter. Eksportgrænsen ændrede de registrerede forløbsdata i 1 af 10 par. Identiske loggede resultater afviser ikke en effekt af tærsklen under andre brændselsvilkår.

Raffinering sammenlignet med industri gav 0 bedre, 3 dårligere og 7 lige udfald, målt på kampagnesejr og derefter sidste swarm. Højere kulreserve mod almindelig raffinering gav 0 bedre, 0 dårligere og 10 lige. Blandt de tre holdout-grupper gav højere reserve 0 bedre, 0 dårligere og 3 lige. 3 forløb reproducerede resultaterne fra det tidligere industriforsøg på udfald, swarm, tid, kills, reparationer og opgraderinger.

| Seed | Sværhedsgrad | Gruppe | Industri | Raffinering | Raffinering med højere kulreserve | Koncentrat, normal / højere |
|---:|---|---|---|---|---|---|
| 417 | relaxed | comparison | 25 ★ | 25 ★ | 25 ★ | 309 / 309 |
| 2026 | standard | comparison | 24 | 24 | 24 | 283 / 283 |
| 417 | standard | comparison | 25 | 23 | 23 | 283 / 283 |
| 7 | veteran | comparison | 5 | 5 | 5 | 0 / 0 |
| 1967 | standard | comparison | 25 ★ | 25 ★ | 25 ★ | 296 / 296 |
| 417 | relaxed | comparison / udholdenhed | 33 ★ | 33 ★ | 33 ★ | 573 / 573 |
| 2801 | standard | comparison / udholdenhed | 26 ★ | 24 | 24 | 325 / 325 |
| 8813 | standard | holdout | 25 | 25 | 25 | 410 / 410 |
| 4297 | veteran | holdout | 23 | 22 | 22 | 364 / 364 |
| 4297 | relaxed | holdout / udholdenhed | 31 ★ | 31 ★ | 31 ★ | 386 / 386 |

★ markerer sejr ved swarm 25, også ved efterfølgende videre spil.

De fem ekstra Standard-kontroller på holdout 8813: pulse 25, mortars 25, logistics 5 (tid), early_defense 25, single 7.

Medianandel kampsekunder med mindst ét strømløst tårn var 6.6 % for industri, 6.8 % for raffinering og 6.8 % med højere kulreserve.

Rådata indeholder produktion, registreret nettolagerflow, lagerkapacitet, beholdninger, strøm, udfald pr. bygningstype, ammo-mangel, opgraderingsmilepæle, tab, reparationer, skud og kills. Målingerne beskriver en fast grundplan og en automatiseret spiller. Produktionsbyrdens placering, reparationer og genopbygning kan påvirke udfaldet. Produktion er et bedre mål for gennemført raffinering end at tælle bygninger.

## Beslutning

Behold den eksisterende spilkandidat. Teststrategiens eksportgrænse er valgfri og ændrer ikke spillet. Det næste industriforsøg bør udføre hele kæden fra komponenter til lejer og marinegeneratorer i en koloni med optjente materialer. Sammenlign funktionelt idriftsatte linjer, vedvarende effekt og komponentforbrug på matchede seeds, før produktionsopskrifter ændres.

Den 23. november blev Steam-anmeldelser af Desynced og They Are Billions gennemgået igen. Eksempler beskriver interesse for at optimere produktion og generobring af kortet, men også friktion i logistik og store tilbageslag, når fejl opdages sent. En mulig spillerfordel er, at lageret viser den forventede konsekvens af at eksportere det sidste brændsel. Forslaget er udledt af et lille udvalg. [Desynced](https://store.steampowered.com/app/1450900/Desynced/) · [They Are Billions](https://store.steampowered.com/app/644930/They_Are_Billions/) · [Tidligere noter om alle fem spil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=industry-fuel CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
