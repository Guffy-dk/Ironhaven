# Balancekørsel 24. november 2026 kl. 10.27

Simulation `96fe517`, driver `90f2033`, spil `0.21.2` med eksisterende metadata-id `0.21.1.1104`. [Rådata](balance-2026-11-24-sentry-fallback.json).

35 automatiserede forløb på to arbejdere. Blandt 23 almindelige kampagner var der 8 sejre, 11 nederlag og 4 ved tidsgrænsen. 12 af 12 udholdenhedsforløb vandt ved 25 og fortsatte frivilligt. Højeste udholdenhedsswarm var 34. Den længste kørsel stod stadig ved swarm 30 ved tidsgrænsen på 12.000 simulerede sekunder.

## Sentry ved fastlåst kamp

Testspilleren kan bygge én almindelig sentry pr. swarm, efter mindst 120 sekunder uden kills med højst to fjender tilbage og nul gear. Den afstår, hvis en fungerende sentry allerede dækker fjenden med konservativ rækkevidde eller hvis der ikke er et frit, gyldigt nærliggende felt. Bygget bruger eksisterende spillerkommando og optjente ressourcer. Den almindelige svage kontrol beholder kun sin ene forsvarsposition.

Fallback byggede i 1 af 15 par. Målt på sejr og sidste swarm var udfaldet 1 bedre, 0 dårligere og 14 lige. Blandt de 12 par, hvor ingen ramte tidsgrænsen, var det 0 bedre, 0 dårligere og 12 lige. Nye holdouts gav 0 bedre, 0 dårligere og 5 lige efter samme rangering. På seed 6197 med marinekraft var kontroldata 30 ★ (tid) og fallback 31 ★. 2 kontrolscenarier reproducerede den forrige måling under identiske vilkår.

| Seed | Strategi | Sværhedsgrad | Kraft | Udsnit | Kontrol | Fallback | Sentryer |
|---:|---|---|---|---|---|---|---:|
| 6197 | industry | relaxed | marine | prior-stall / udholdenhed | 30 ★ (tid) | 31 ★ | 1 |
| 6197 | industry | relaxed | kul | prior-stall / udholdenhed | 33 ★ | 33 ★ | 0 |
| 417 | industry | relaxed | marine | comparison / udholdenhed | 34 ★ | 34 ★ | 0 |
| 417 | industry | relaxed | kul | comparison / udholdenhed | 34 ★ | 34 ★ | 0 |
| 1913 | industry | standard | marine | comparison | 25 ★ | 25 ★ | 0 |
| 1913 | industry | standard | kul | comparison | 25 ★ | 25 ★ | 0 |
| 9419 | no_artillery | standard | basis | prior-stall | 17 (tid) | 17 (tid) | 0 |
| 8813 | logistics | standard | basis | prior-stall | 5 (tid) | 5 (tid) | 0 |
| 1967 | industry | standard | basis | comparison | 25 ★ | 25 ★ | 0 |
| 4297 | mortars | veteran | basis | comparison | 23 | 23 | 0 |
| 6619 | industry | relaxed | marine | holdout / udholdenhed | 32 ★ | 32 ★ | 0 |
| 6619 | industry | relaxed | kul | holdout / udholdenhed | 32 ★ | 32 ★ | 0 |
| 6619 | pulse | standard | basis | holdout | 25 | 25 | 0 |
| 2731 | logistics | standard | basis | holdout | 24 | 24 | 0 |
| 2731 | industry | veteran | marine | holdout | 21 | 21 | 0 |

★ markerer sejr ved swarm 25. Ekstra Standard-kontroller med seed 2731: single 8, early_defense 25 ★, no_artillery 19, mortars 25 ★, harbor 25.

Slutgemningerne for 9419 uden artilleri og 8813 med logistik viste henholdsvis 190 og 410 gear, men utilstrækkelig effekt. Normal placeringskontrol på ledige felter afviste et nyt sentry-byggeri på grund af manglende materialer. Fallbackafgrænsningen beholdes, så andre fastlåsninger undersøges særskilt.

## Første 600 sekunder med generator

4 matchede par uden fallback havde et komplet vindue for begge generatorer. Vinduet starter på første simulationstrin med den nye generator og tilgængeligt kul. Tællingen følger nulstilling af generatorens brændselsfremskridt. Tilgængelige effektenheder er integreret over simulationstrin for generatoren på forsøgspunktet og måler dens bidrag til nettets kapacitet.

| Variant | Median kul brændt | Median tilgængelige effektsekunder |
|---|---:|---:|
| Marine | 37,0 | 32.400 |
| Kul | 46,0 | 34.419,6 |

Rådata indeholder kamp-, lager-, opgraderings-, produktions-, strøm- og ammomålinger samt kumulative genopbygningstal. Genopbygningstællerne gælder hele forløbet. Brændselsvinduets begyndelse kan ligge ved forskellige swarms, og generatorernes investeringsmaterialer og den samlede fabriksplan adskiller sig.

Spilkoden og dens værdier beholdes. Testspilleren anvender fallback som en valgfri strategi, så nye målinger kan sammenlignes med den eksisterende baseline. HUD og bygningsdiagnostik viser allerede ammunitionsmangel. Næste fokus er at afprøve en genvej fra den eksisterende advarsel til den berørte flanke eller den sidste synlige fjende, så spilleren kan finde stedet for en lokal løsning.

I offentlige spillerkilder gennemgået 24. november beskrives beredskab mod enkelte tilbageværende fjender og værdien af alternative forsvarsplaceringer i They Are Billions. Conan Unconquered-anmeldelser nævner kombinationen af basebygning og bølgeforsvar. Forslaget om tidligere feedback i Ironhaven er en slutning fra et lille udsnit. [They Are Billions](https://steamcommunity.com/app/644930/discussions/0/3377008022028226794/?l=english) · [Conan Unconquered](https://store.steampowered.com/app/989690/Conan_Unconquered/?l=english) · [Tidligere kilder til alle fem spil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=sentry-fallback CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
