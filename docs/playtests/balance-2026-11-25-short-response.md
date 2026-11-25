# Balancekørsel 25. november 2026 kl. 14.01

Kørsel `2026-11-25T14:01:18+01:00`. Baseline `139a43e`, driver `ef8755b`. [Rådata](balance-2026-11-25-short-response.json).

35/35 forløb på to arbejdere. De 29 ordinære kampagner gav 20 sejre, 9 nederlag og 0 ved tidsgrænsen. 6/6 udholdenhedsforløb vandt og valgte fortsættelse via den normale host-kommando. Længste forløb varede 8.397 simulerede sekunder. Højeste swarm var 37. Horisonterne var 9.000 og 12.000 sekunder. Holdout-seeds var 4817 og 9623. 17/17 matchede forløb gentog udfald, swarm, tid, kills, reparationer, upgrades og aflastningsvinduer fra kl. 10.27. [Forrige kørsel](balance-2026-11-25-warning-response.md).

## Kort aflastning mod aflastning gennem kampen

15 matchede par. Efter mindst fem simulerede sekunders reaktionstid bruger begge strategier de normale kommandoer til at pause produktion. Den korte strategi pauser højst to maskiner pr. swarm i op til 30 sekunder, med genstart ved næste handling. Begge bruger samme prioriterede liste over komponentfabrikker, kredsløbslaboratorier, støberier og kobberbor. Den tidligere strategi kan pause flere og holde pausen gennem kampen.

| Måling | Hel kamp, sum | Kort, sum | Median af kort minus hel kamp |
|---|---:|---:|---:|
| Forsvarsudfald | 15 | 21 | 0 |
| Sekunder med underskud | 4750 | 3656 | 117 |
| Produktionspauser | 167 | 72 | -5 |
| Målte kampsekunder | 44475 | 42196 | 8 |
| Inaktive tårnsekunder | 40890 | 11477 | 117 |
| Ammunitionsmangel, tårnsekunder | 192 | 247 | 0 |
| Reparationer | 10075 | 9982 | 0 |

Målt på sejr og højeste swarm klarede ét kort forløb sig bedre, 3 dårligere og 11 lige godt. Holdout-parrene gav 4817 standard pulse: 25 → 25, 9623 veteran industry: 25 → 25, 9623 relaxed industry: 36 → 35. Af 38 korte vinduer med faktisk aflastning begyndte 20 før swarm-start, så en del af de 30 sekunder kunne gå, før fjenderne nåede forsvaret. Forskellige kamp- og overlevelsestider påvirker summerne. I de 12 scenarier, der også havde en historisk kontrol uden aflastning, var antallet af forsvarsudfald 15 uden aflastning, 12 med hel kamp og 18 med kort aflastning.

| Lager ved start af swarm 9, 17 og 25 | Median af kort minus hel kamp |
|---|---:|
| plate | 10.5 |
| gear | 4.5 |
| steel | 9 |
| circuit | 0 |
| module | 0 |

Lagertallene er parvise forskelle over 44 fælles milepæle. Lagerniveau afspejler både produktion og forbrug. Par, der tabte tidligt, bidrager med færre milepæle.

De lavere summer for inaktive tårne skyldes især seed 7001 uden artilleri. Det korte forløb sluttede 2.842 sekunder tidligere ved samme swarm, og de inaktive tårnsekunder faldt fra 35.310 til 7.224 i dét par. Den typiske parvise ændring var en stigning på 117 inaktive tårnsekunder. Spilværdierne beholdes. Næste forsøg bør beholde maskinbegrænsningen og knytte genstart til kampens afslutning eller en genopbygget strømreserve. Det kan adskille effekten af tidsgrænsen fra effekten af at pause færre maskiner.

## Resultater pr. strategi og sværhedsgrad

| Sværhedsgrad | Strategi | Reaktion | Sejre / forsøg | Median swarm | Sim. sek. | Tab | Reparationer |
|---|---|---|---:|---:|---:|---:|---:|
| relaxed | industry | kontrol | 1/1 | 25 | 5759 | 19 | 195 |
| relaxed | industry / endless | hel kamp | 2/2 | 36.5 | 8301 | 343.5 | 718 |
| relaxed | industry / endless | kort | 2/2 | 36 | 8173.5 | 307 | 667.5 |
| standard | early_defense | hel kamp | 1/1 | 25 | 5244 | 227 | 464 |
| standard | early_defense | kort | 1/1 | 25 | 5276 | 226 | 519 |
| standard | harbor | kontrol | 1/1 | 25 | 5434 | 300 | 644 |
| standard | industry | hel kamp | 2/2 | 25 | 5329.5 | 216.5 | 540.5 |
| standard | industry | kort | 2/2 | 25 | 5337.5 | 225.5 | 524 |
| standard | logistics | hel kamp | 1/1 | 25 | 5544 | 254 | 730 |
| standard | logistics | kort | 1/1 | 25 | 5553 | 244 | 639 |
| standard | logistics / endless | hel kamp | 1/1 | 29 | 6370 | 471 | 985 |
| standard | logistics / endless | kort | 1/1 | 28 | 6189 | 388 | 818 |
| standard | mortars | hel kamp | 1/1 | 25 | 5243 | 219 | 481 |
| standard | mortars | kort | 1/1 | 25 | 5286 | 242 | 531 |
| standard | no_artillery | hel kamp | 0/1 | 21 | 8274 | 1685 | 977 |
| standard | no_artillery | kort | 0/1 | 21 | 5432 | 638 | 818 |
| standard | pulse | hel kamp | 2/2 | 25 | 5245.5 | 254.5 | 631 |
| standard | pulse | kort | 2/2 | 25 | 5354 | 266 | 696.5 |
| standard | single | kontrol | 0/3 | 9 | 2034 | 94 | 18 |
| veteran | industry | hel kamp | 2/4 | 25 | 5398 | 321 | 658 |
| veteran | industry | kort | 2/4 | 25 | 5627.5 | 327 | 708 |

Rådata omfatter lagerfyldning, ressourcer, produktion, nettoflow, strøm, ammunition, components, upgrades, skud, tab og reparationer. Der blev anvendt optjente ressourcer. Driveren bruger en fast prioriteringsliste og reagerer på målinger uden menneskelig forsinkelse ud over den indlagte ventetid. Ingen af strategierne er afprøvet i en manuel Windows-kampagne.

Spillerfeedback læst 25. november. En positiv Colony Survival-anmeldelse fremhæver rytmen mellem automatiserede jobs og natligt forsvar. Det støtter en afprøvning af, om Ironhaven-spillere kan træffe et hurtigt valg om strøm til forsvaret og genoptage deres fabriksrytme bagefter. Det er en designhypotese ud fra et lille udsnit. [Anmeldelser](https://steamcommunity.com/app/366090/positivereviews/?filterLanguage=default).

Alle 216 automatiske tests bestod, og det indlejrede desktop-ressourcebuild blev samlet. Genoptagelse gav en byte-identisk resultatfil. Kørslen ændrede kun testværktøjet. Det eksisterende Windows-build `0.21.2.3` er identificeret ved kildecommit `139a43e`. Patcherens offentlige version er fortsat `0.21.3`. [Windows-artefakt](https://github.com/Guffy-dk/Ironhaven/actions/runs/45593303214/artifacts/15011368997).

```sh
CAMPAIGN_MATRIX=short-response CAMPAIGN_WORKERS=2 node scripts/play-campaign-matrix.mjs
```
