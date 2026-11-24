# Balancekørsel 24. november 2026 kl. 22.27

Simulation `8cf1b9f`, testdriver `af38083`, spil `0.21.3`, eksisterende build-id `0.21.2.3`. [Rådata](balance-2026-11-24-power-recovery.json).

35 forløb på to arbejdere. Blandt de 32 almindelige kampagner var der 5 sejre, 25 nederlag og 2 ved tidsgrænsen. Alle tre udholdenhedsforløb vandt og fortsatte frivilligt. Længste forløb nåede swarm 34 og varede 7.097 simulerede sekunder. 10 matchede kontroller fra kl. 19.27 gentog seks mål.

## Forløb med manglende effekt

Driveren måler én gang pr. simuleret sekund. Et udfald starter under kamp, når belastning overstiger produktion og mindst ét strømafhængigt tårn er inaktivt. Efter fem målinger uden den tilstand registreres tidspunktet for den første af de fem. Derfor kan registreret bedring også skyldes faldende belastning eller tab af et tårn. Et forløb, der slutter før bedringen, har ingen registreret varighed frem til genoprettelse.

Der var 59 udfald i 28 forløb. 35 fik en registreret afslutning med median 161 sekunder. 24 var åbne ved forsøgets slutpunkt. 32 episoder havde mindst 60 målte underskudssekunder.

| Samtidig observation i episoder med mindst 60 underskudssekunder | Sekunder |
|---|---:|
| Opført generator manglede brændsel | 0 |
| Tidligere generatorfelt manglede byggematerialer | 5552 |
| Begge forhold | 5 |
| Ingen af de to forhold | 15903 |

Materialemangel kræver et tomt, tidligere bygget generatorfelt, hvor normal placeringskontrol afviser genopbygning på grund af materialer. Begge indikatorer måler samtidige forhold. De kan ikke afgøre, om netop den generator havde dækket hele underskuddet, og de øvrige sekunder kan bl.a. skyldes for lav installeret kapacitet eller et blokeret felt.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer | Udfald |
|---|---|---:|---:|---:|---:|---:|---:|
| relaxed | industry | 3/3 | 25 | 5217 | 97 | 357 | 2 |
| relaxed | industry / udholdenhed | 3/3 | 33 | 6809 | 465 | 790 | 7 |
| standard | early_defense | 0/3 | 25 | 4892 | 306 | 594 | 8 |
| standard | harbor | 0/1 | 24 | 4768 | 329 | 380 | 2 |
| standard | industry | 1/4 | 24.5 | 4822.5 | 327.5 | 597.5 | 9 |
| standard | logistics | 0/4 | 15.5 | 3714 | 218.5 | 505.5 | 3 |
| standard | mortars | 0/4 | 25 | 4901 | 344.5 | 597.5 | 10 |
| standard | no_artillery | 0/3 | 18 | 3954 | 248 | 634 | 3 |
| standard | pulse | 1/4 | 25 | 4948 | 373.5 | 672 | 11 |
| standard | single | 0/3 | 8 | 1684 | 73 | 18 | 0 |
| veteran | industry | 0/3 | 22 | 4936 | 327 | 708 | 4 |

Holdout-seeds 2603 og 9067. Rådata indeholder episodeintervaller samt lager, ressourcer, produktion, netflow, opgraderinger, ammunition, strøm, tab, skud og reparationer ved milepæle. Forsøget bruger almindelige spillerkommandoer og optjente materialer. Testspilleren har en fast byggeplan. Målingen siger ikke, hvordan en spiller vil reagere på underskuddet.

Veteran-kontrol 7001 ramte tidsgrænsen ved swarm 6 med 11 fjender og 72 effekt til 109 belastning. Yderligere 120 sekunder uden spillerkommandoer fra slutgemningen ryddede de 11 fjender og startede swarm 7. Den adskilte analyse ændrer ikke kampagnens registrerede udfald og peger på, at testspillerens beslutninger kan forlænge kampen.

Spilværdierne beholdes. Genopbygning manglede materialer i cirka 26 % af de målte underskudssekunder i de lange episoder. Tomme generatorer blev kun set samtidig med materialemangel i fem sekunder. Næste forsøg skal skelne tabt generatorkapacitet fra voksende belastning og følge effekten af målrettet genopbygning. Alle 215 lokale tests og det lokale build bestod. Den eksisterende native Windows-verifikation dækker spilkoden, som denne kørsel ikke ændrer. [Windows-verifikation](https://github.com/Guffy-dk/Ironhaven/actions/runs/45440539360).

Spillerfeedback læst 24. november. They Are Billions-anmeldelser beskriver, hvordan sene fejl i forsvaret bliver tydelige for sent. Desynced-spillere beskriver fleksibel automation, men også friktion omkring logistik. Det peger på at vise årsagen til et udfald, så spilleren ved, om der skal leveres brændsel, reduceres belastning eller bygges på ny. [They Are Billions](https://store.steampowered.com/app/644930/They_Are_Billions/) · [Desynced](https://store.steampowered.com/app/1450900/Desynced/) · [Tidligere kilder om alle fem inspirationsspil](balance-2026-11-20-062727.md).

```sh
CAMPAIGN_MATRIX=power-recovery CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
