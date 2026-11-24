# Ironhaven balance agent log

The balance agent records each completed or blocked run here. New entries go above older ones. Detailed reports and machine-readable results live alongside this log.

## Run history

### 2026-11-24 kl. 19.27 dansk tid

- Kørsel `2026-11-24T19:27:27+01:00`, simulation `6380255`, testdriver `fb03be5`, eksisterende build `0.21.2.3`.
- 35/35 forløb, 15 matchede par og fem ekstra kontroller. Nye holdouts 7001 og 9871. Reserve gav 0 bedre, 1 dårligere og 14 lige.
- Spillets omkostninger beholdes. Næste forsøg måler tid til genetableret effekt og skelner mellem brændsel og reservedele.
- [Rapport](balance-2026-11-24-outage-reserve.md) · [Rådata](balance-2026-11-24-outage-reserve.json).

### 2026-11-24 kl. 16.27 dansk tid

- Kørsel `2026-11-24T16:27:27+01:00`, simulation `3a54467`, testdriver `0505827`, eksisterende build `0.21.2.1`.
- 35/35 forløb, 15 matchede par og fem ekstra kontroller. Nye holdouts 2477 og 5347. Reserve gav 3 bedre, 7 dårligere og 5 lige.
- Spillets omkostninger beholdes. Næste forsøg kan afgrænse reserven til vedvarende strømsvigt.
- [Rapport](balance-2026-11-24-repair-reserve.md) · [Rådata](balance-2026-11-24-repair-reserve.json).

### 2026-11-24 kl. 13.27 dansk tid

- Kørsel `2026-11-24T13:27:27+01:00`, simulation `7dfc892`, UI-kandidat `3354fd0`, internt build `0.21.2.1`.
- 35/35 automatiserede forløb. 20 af 20 matchede tidligere kontroller på seks mål. Holdout-seeds 6029 og 9017.
- Find turret føjer navigation til den eksisterende ammunitionsadvarsel. Næste fokus er brug under menneskeligt spil.
- [Rapport](balance-2026-11-24-ammo-shortcut.md) · [Rådata](balance-2026-11-24-ammo-shortcut.json).

### 2026-11-24 kl. 10.27 dansk tid

- Kørsel `2026-11-24T10:27:27+01:00`, simulation `96fe517`, driver `90f2033`, spil `0.21.2`, eksisterende metadata-id `0.21.1.1104`.
- 35/35 forløb og 15 matchede par. Sentry-fallback blev anvendt i 1 par. Resultat efter sidste swarm og sejr: 1 bedre, 0 dårligere og 14 lige. Nye holdouts 6619 og 2731.
- 4 matchede fulde målevinduer for brændsel og effekt. Næste fokus er at forbinde den eksisterende ammunitionsadvarsel med den berørte flanke.
- [Rapport](balance-2026-11-24-sentry-fallback.md) · [Rådata](balance-2026-11-24-sentry-fallback.json).

### 2026-11-24 kl. 07.27 dansk tid

- Kørsel `2026-11-24T07:27:27+01:00`, baseline `fbe2f6f`, måleværktøj `528632e`, pakke `0.21.2`, eksisterende metadata-id `0.21.1.1104`.
- 35/35 forløb, heraf 15 matchede par og fem ekstra kontroller. Nye holdout-seeds 1913 og 6197. Kul mod marine gav 5 bedre, 2 dårligere og 8 lige.
- Én forsøgsserie dækker to ens kørselsbeskeder. Ét udholdenhedsforløb ramte 72.000 simulerede sekunder med én fjende tilbage ved swarm 30. Næste forsøg måler brændsel og genopbygning i samme observationsvindue.
- [Rapport](balance-2026-11-24-coal-vs-marine.md) · [Rådata](balance-2026-11-24-coal-vs-marine.json).

### 2026-11-24 kl. 01.23 dansk tid

- Kørsel `2026-11-24T01:23:50+01:00`, baseline `021b2b6`, måleværktøj `3d7e854`, eksisterende internt build `0.20.2.3`.
- 35/35 spilforløb, 15 matchede marineforsøg og fem ekstra kontroller. Nye holdouts 1807 og 6113.
- Marinegeneratorer blev bragt i drift i 14 af 15 forsøg. Resultat mod kontrol: 4 bedre, 3 dårligere og 8 lige. Længste forløb 7234 simulerede sekunder ved swarm 34.
- [Rapport](balance-2026-11-24-marine.md) · [Rådata](balance-2026-11-24-marine.json).

### 2026-11-23 kl. 22.23 dansk tid

- Kørsel `2026-11-23T22:23:24+01:00`, baseline `6cbfb84`, måleværktøj `d4020cc`, eksisterende kandidat `0.20.2.3`.
- 35/35 endelige spilforløb, plus 12 tidligere raffineringspiloter og to afbrudte piloter, heraf i den endelige serie 10 grupper med industri, raffinering og højere kulreserve. Nye holdouts 8813 og 4297.
- Højere kulreserve gav 0 bedre, 0 dårligere og 10 lige udfald. Længste forløb 6921 simulerede sekunder, swarm 33. Næste test skal idriftsætte lejer og marinegeneratorer i en optjent koloni.
- [Rapport](balance-2026-11-23-industry-fuel.md) · [Rådata](balance-2026-11-23-industry-fuel.json).

### 2026-11-20 kl. 12.27 dansk tid

- Kørsel `2026-11-20T12:27:27+01:00`, baseline `0242bf6`, måleværktøj `d096d45`, spilversion `0.20.1`. Intet nyt internt build-id.
- 46/46 spilforløb, heraf 35 scenarier og 11 gentest af reservevarianten. 11 grupper med kontrol, afkobling og strømreserve. 17 reproduktioner fra forrige kørsel. Nye holdouts 1967 og 8161.
- Reserve mod kontrol gav 3 bedre, 1 dårligere, 7 lige resultater. Længste udholdenhed 7049 simulerede sekunder. Næste isolerede test undersøger brændselsreserve under genopbygning.
- [Statistik, beslutninger og metode](balance-2026-11-20-122727.md) · [Maskinlæsbare resultater](balance-2026-11-20-122727.json).

### 2026-11-20 kl. 09.27 dansk tid

- Kørsel `2026-11-20T09:27:27+01:00`, baseline `5b52363`, måleværktøj `c4176e2`, spilversion `0.20.1`. Intet nyt internt build-id.
- 35/35 gennemspilninger, heraf 16 matchede par og tre enkeltkontroller. 11 kontrolscenarier reproducerede tidligere statistik. Holdout-seeds 3511 og 9419.
- Strømstyring gav 5 bedre og 4 dårligere resultater målt ved kampagnesejr og sidste swarm. Det længste forløb nåede swarm 32 efter 6961 simulerede sekunder.
- [Statistik, metode og beslutninger](balance-2026-11-20-092727.md) · [maskinlæsbare resultater](balance-2026-11-20-092727.json).

### 2026-11-20 kl. 06.27 dansk tid

- Kørsel `2026-11-20T06:27:27+01:00`, baseline `f0063c6`, måleværktøj `676ef5e`, spilversion `0.20.1`. Intet nyt internt build-id.
- 35/35 scenarier afviklet, plus én reproduktionskørsel. De 32 almindelige kampagner gav 9 sejre, 23 nederlag og 0 ved tidsgrænsen.
- Udholdenhed med seed 417, 2026 og 6823: 417 til swarm 33 (defeat), 2026 til swarm 24 (defeat), 6823 til swarm 5 (defeat).
- Kampagnerne brugte seeds 417, 2026, 7 og holdout 2801. Næste forsøg sammenligner strømstyring med samme byggeplan, før tal ændres.
- [Statistik pr. strategi og sværhedsgrad, beslutninger og notater](balance-2026-11-20-062727.md) · [maskinlæsbare resultater](balance-2026-11-20-062727.json).

For each entry, record the date and run ID, source commit and internal build, completed and attempted playthroughs, scenarios and seeds, key statistics by strategy and difficulty, baseline and retest findings, decisions, limitations or blockers, and the next priority. Link detailed reports and raw results when available.
