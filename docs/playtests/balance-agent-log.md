# Ironhaven balance agent log

The balance agent records each completed or blocked run here. New entries go above older ones. Detailed reports and machine-readable results live alongside this log.

## Run history

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
