# Balancekørsel 24. november 2026 kl. 07.27

Simulation `fbe2f6f`, måleværktøj `528632e`, pakke og offentlig reference `0.21.2`. Kilden deklarerer det eksisterende interne id `0.21.1.1104`. [Rådata](balance-2026-11-24-coal-vs-marine.json).

35 automatiserede spilforløb på to arbejdere. De 25 almindelige kampagner gav 8 sejre, 17 nederlag og 0 ved tidsgrænsen. 8 af 10 udholdenhedsforløb vandt og fortsatte frivilligt. Det længste nåede swarm 30 efter 6.372 simulerede sekunder og stod stadig ved swarm 30 ved tidsgrænsen på 72.000 sekunder.

## Sammenligning

Begge strategier havde samme koloni, seed, sværhedsgrad, horisont, startkriterier og generatorplacering. Marinevarianten bygger den tidligere lejelinje og en generator på 54 effekt. Kulvarianten bygger en almindelig kulgenerator og forsøger at opgradere den til niveau 3 i pauserne mellem swarms med optjent lager og eksisterende opgraderingslås. Niveau 3 leverer nominelt 57,6 effekt. Udgifterne består af forskellige materialer, og kulgeneratoren kan levere strøm allerede før opgraderingerne. Forsøget matcher derfor omtrentligt effektmål og beslutningstidspunkt.

Kul mod marine gav 5 bedre, 2 dårligere og 8 lige målt på kampagnesejr og sidste swarm. De seks nye holdout-par gav 3 bedre, 0 dårligere og 3 lige efter samme rangering. Når forløbet ved tidsgrænsen holdes ude, bliver det 4 bedre, 2 dårligere og 8 lige samlet samt 2 bedre og 3 lige på holdouts. 9 af 9 gentagne marineforløb matchede tidligere målinger af udfald, swarm, tid, kills, reparationer og opgraderinger på tværs af de to kodebaselines.

Marinegeneratoren leverede strøm i 14 af 15 varianter. Kulgeneratoren leverede strøm i 14 af 15, heraf 14 på niveau 3. Medianandelen af kampsekunder med mindst ét strømløst tårn var 2,4 % for marine og 2,1 % for kul.
I 14 par blev begge generatorer bygget. Medianen for førstegangskonstruktion var 2.450 simulerede sekunder for marine og 2.377 for kul. Det er måletidspunktet for byggeri; selve driften kræver derefter kul.

| Seed | Sværhedsgrad | Udsnit | Marine | Kul | Marine med strøm, sek. | Kul med strøm, sek. | Kul på niveau 3 med strøm, sek. |
|---:|---|---|---|---|---:|---:|---:|
| 417 | standard | comparison | 25 | 24 | 2304 | 2154 | 2152 |
| 2026 | standard | comparison | 24 | 25 | 1906 | 2100 | 1989 |
| 1967 | standard | comparison | 25 | 25 ★ | 2519 | 2677 | 2675 |
| 8813 | standard | comparison | 25 | 25 | 2624 | 2890 | 2886 |
| 4297 | veteran | comparison | 24 | 23 | 2672 | 2458 | 2340 |
| 417 | relaxed | comparison / udholdenhed | 34 ★ | 34 ★ | 5111 | 5265 | 5253 |
| 4297 | relaxed | comparison / udholdenhed | 32 ★ | 32 ★ | 4861 | 4914 | 4818 |
| 2801 | standard | comparison / udholdenhed | 24 | 24 | 2341 | 2409 | 2407 |
| 1807 | veteran | comparison | 22 | 22 | 2116 | 2109 | 1793 |
| 1913 | standard | holdout | 25 ★ | 25 ★ | 2310 | 2783 | 2761 |
| 1913 | veteran | holdout | 5 | 5 | 0 | 0 | 0 |
| 1913 | relaxed | holdout / udholdenhed | 32 ★ | 34 ★ | 4795 | 5424 | 5316 |
| 6197 | standard | holdout | 24 | 25 ★ | 2301 | 2552 | 2550 |
| 6197 | veteran | holdout | 23 | 23 | 2513 | 2582 | 2556 |
| 6197 | relaxed | holdout / udholdenhed | 30 ★ (tid) | 33 ★ | 4547 | 5194 | 5170 |

★ markerer sejr ved swarm 25. De fem ekstra Standard-kontroller: pulse 25 ★, mortars 25 ★, logistics 25 ★, early_defense 25 ★, single 8.

Forsøget bruger normale spillerkommandoer og optjente ressourcer. Rådata medtager strøm, nedetid og lagerbeholdning, nettolagerflow, opgraderinger, ammunition, tab, reparationer og skud. Brændt kul er en del af nettolagerflow og kan ikke isoleres fra al anden kuldrift i denne telemetri. Generatorens oppetid måles én gang pr. simuleret sekund med brændsel til rådighed. Det er en test ved ét layout og én beslutningsregel.

På Relaxed med seed 6197 havde marinekolonien én Fog spitter tilbage, 5.143 reparationer og kun 99 af 207 efterspurgte effektenheder ved tidsgrænsen. Fra slutgemningen ændrede yderligere 120 sekunder uden spillerkommandoer hverken swarm eller antal kills. Ved kontrol af slutgemningen havde kolonien nul gear, og de strømførende kanontårne og morteren inden for nominelt skudfelt havde ingen ammunition. En almindelig sentry blev bygget på (−16, −6) med optjente ressourcer og dræbte den sidste fjende efter 22,8 simulerede sekunder. Det var en særskilt checkpointtest. Det oprindelige forløb er stadig registreret som uafsluttet ved tidsgrænsen.

## Beslutning

Spiltal og versionsmetadata beholdes. Ved næste sammenligning bør begge investeringer måles frem til samme swarm fra første strømproduktion, så tidligere start, erstatningsomkostninger, kulforbrug og nettonytte kan vurderes hver for sig. Testspilleren bør desuden kunne håndtere en isoleret fjende ved at anlægge et nært forsvar, når de eksisterende tårne mangler ammunition. Marine er en mulig anvendelse af senere materialer, mens almindelig kulkraft kan være en tidligere og enklere vej til effekt.

Offentlige spilleranmeldelser læst 24. november. Spillerne beskriver frihed ved alternative produktionsveje i Desynced og afvejningen mellem ekspansion og forsvar i They Are Billions. For Ironhaven peger det på at vise tid til idriftsættelse samt materialer og brændsel for hver kraftvej. Det er en designslutning fra et lille udsnit. [Desynced](https://store.steampowered.com/app/1450900/Desynced/) · [They Are Billions](https://store.steampowered.com/app/644930/They_Are_Billions/) · [Tidligere kilder til alle fem inspirationsspil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=coal-versus-marine CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
