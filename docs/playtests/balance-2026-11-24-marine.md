# Balancekørsel 24. november 2026

Baseline `021b2b6`, måleværktøj `3d7e854`, eksisterende internt build `0.20.2.3`. [Rådata](balance-2026-11-24-marine.json).

35 automatiserede forløb på to arbejdere. Blandt 25 almindelige kampagner var der 9 sejre, 16 nederlag og 0 ved tidsgrænsen. 9 af 10 udholdenhedsforsøg vandt og fortsatte frivilligt. Det længste nåede swarm 34 efter 7234 simulerede sekunder. Planlagt maksimal horisont var 72.000 simulerede sekunder.

## Idriftsættelse og matchede udfald

Kontrollen bruger den eksisterende industriplan. Forsøget tilføjer en fysisk kobber- og stålforsyning til præcisionsværkstedet og en lokal lagerbygning til lejerne. Når kolonien har optjent en lager- og strømreserve, kan testspilleren bygge linjen og bruge de producerede lejer, komponenter og stål til én marinegeneratorplacering, som kan genopbygges. Hele forsøget bruger normale byggekommandoer og motordrift. Efterspørgsel efter stål og komponenter samt de ekstra maskiners forbrug er en del af varianten.

Lejer blev produceret i 14 af 15 par. En marinegenerator blev bragt i drift i 14 af 15 forsøg. Forsøget gav 4 bedre, 3 dårligere og 8 lige udfald rangeret efter kampagnesejr og derefter sidste swarm. På de seks holdout-par gav strategien 1 bedre, 1 dårligere og 4 lige. 9 kontrolscenarier gentog tidligere udfald, tid, kills, reparationer og opgraderinger.

Medianandel kampsekunder med mindst ét strømløst tårn var 6,1 % i kontrol og 5,0 % i forsøget. Målt på 1 Hz tæller generatoren som strømførende, når den står og har tilgængeligt kul, svarende til motorens effektberegning. Målet summerer simulerede sekunder over eventuelle genopbygninger.

| Seed | Sværhedsgrad | Udsnit | Kontrol | Marineforsøg | Lejer produceret | Generatorer inkl. genopbygning | Første bygget, sim. sek. | Strømførende sek. |
|---:|---|---|---|---|---:|---:|---:|---:|
| 417 | standard | comparison | 25 | 25 | 213 | 6 | 2406 | 2304 |
| 2026 | standard | comparison | 24 | 24 | 200 | 6 | 2866 | 1906 |
| 1967 | standard | comparison | 25 ★ | 25 | 213 | 1 | 2786 | 2519 |
| 8813 | standard | comparison | 25 | 25 | 213 | 1 | 2354 | 2624 |
| 417 | relaxed | comparison | 25 ★ | 25 ★ | 213 | 1 | 1882 | 3321 |
| 4297 | veteran | comparison | 23 | 24 | 226 | 3 | 2430 | 2672 |
| 417 | relaxed | comparison / udholdenhed | 33 ★ | 34 ★ | 213 | 1 | 1882 | 5111 |
| 4297 | relaxed | comparison / udholdenhed | 31 ★ | 32 ★ | 213 | 1 | 1854 | 4861 |
| 2801 | standard | comparison / udholdenhed | 26 ★ | 24 | 218 | 5 | 2606 | 2341 |
| 1807 | standard | holdout | 25 ★ | 25 ★ | 218 | 1 | 2424 | 2684 |
| 1807 | veteran | holdout | 23 | 22 | 213 | 4 | 2522 | 2116 |
| 1807 | relaxed | holdout / udholdenhed | 32 ★ | 33 ★ | 213 | 1 | 1864 | 4942 |
| 6113 | standard | holdout | 25 | 25 | 213 | 2 | 2490 | 2752 |
| 6113 | veteran | holdout | 6 | 6 | 0 | 0 | — | 0 |
| 6113 | relaxed | holdout / udholdenhed | 32 ★ | 32 ★ | 232 | 1 | 2064 | 4807 |

★ markerer sejr ved swarm 25. Ekstra Standard-kontroller med seed 1807: pulse 25 ★, mortars 25 ★, logistics 25 ★, early_defense 25 ★, single 9.

Rådata indeholder tid, tab, reparationer, lagerfyldning, ressourcer, produktion og registreret nettolagerflow, strøm, ammunition, opgraderingsmilepæle, skud og kills. Den eksisterende måling af nettolagerflow omfatter de bevægelser motoren registrerer og er ikke et fuldt materialeregnskab. Denne test dækker én ekstra fysisk linje. Den isolerer ikke marinegeneratorens tal fra resten af investeringens konsekvenser.

## Beslutning

Spilværdierne beholdes. PR #28 udvikler videre på de sene produktionskæder. Denne måling er baseline på den allerede sammenflettede version. Næste sammenligning bør bruge en lige dyr alternativ udvidelse med almindelig kulkraft, måle strømførende sekunder pr. brugt komponent og afprøve, om senere havneprojekter giver de optjente lejer en hensigtsmæssig alternativ anvendelse.

Den 24. november blev spillerfeedback om produktionskompleksitet i Desynced og industri under pres i They Are Billions gennemgået. Den peger på at forklare, hvornår en investering leverer strøm, og hvilke forsyninger der er ved at slippe op. Det er et forslag baseret på et lille udsnit. [Desynced](https://store.steampowered.com/app/1450900/Desynced/) · [They Are Billions](https://steamcommunity.com/app/644930/reviews/?browsefilter=trendmonth&l=english&p=1) · [Tidligere noter om alle fem spil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=marine-power CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
