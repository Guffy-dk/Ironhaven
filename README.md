# IRONHAVEN

**Byg. Befæst. Overlev.** En spilbar, original low-poly 3D-prototype inspireret af automatiseringen i Factorio og baseforsvaret i They Are Billions.

**[Spil i browseren](https://guffy-dk.github.io/Ironhaven/) · [Hent den selvstændige udgave](https://github.com/Guffy-dk/Ironhaven/releases/latest)**

## Spil uden installation

Hent **Ironhaven.html** fra den seneste udgivelse, og dobbeltklik på filen. Den indeholder hele spillet, inklusive grafik og motor. Ingen serverapp, Node.js, CDN eller eksterne spilaktiver er nødvendige. Brug en nyere Chrome, Edge eller Firefox med WebGL aktiveret. Filen er omkring 590 KB; komprimeret er den mindre.

Du kan også spille via browserlinket ovenfor. Den downloadede udgave virker offline og kan deles med dine medspillere på en USB-nøgle eller via en lokal mappe.

## Åbn din verden til LAN — inde i spillet

1. Alle åbner spillet i deres browser på samme lokale netværk.
2. Værten starter eller fortsætter en ekspedition og vælger **Menu → Åbn verden til LAN**.
3. Værten klikker **Lav invitation** og sender koden til én ven.
4. Vennen vælger **LAN Co-op → Tilslut en verden**, indsætter invitationen og klikker **Lav svarkode**.
5. Vennen sender svarkoden tilbage. Værten indsætter den og vælger **Forbind med ven**.
6. Gentag med en ny invitation til hver ekstra spiller. Der er plads til **én vært og tre gæster**.

Verdenen fortsætter fra solospillet, og alle deler materialer, bygninger, fjender og tid. Værten beregner spillet; gæster sender kommandoer og modtager verdensstatus 10 gange i sekundet. Kun værten kan pause, ændre hastighed, genstarte og gemme verdenen. En almindelig gæst kan forlade og tilslutte igen via en ny invitation.

Direkte WebRTC-dataforbindelser bruger **ingen signaleringsserver, STUN eller TURN**. Koderne udveksler lokale forbindelsesoplysninger; spiltrafikken går direkte mellem browserne. Browserudgaven finder ikke automatisk andre spil på LAN. Værten skal holde spillet åbent, og alle bør holde fanen aktiv. Gæstenet, VPN, firewall eller netværk med klientisolering kan blokere forbindelsen. Koderne giver adgang til verdenen og skal kun deles med dine medspillere. Hvis en forbindelse fejler, fjern den ubrugte invitation og lav en ny. Værtens afgang afslutter LAN-sessionen; der er ingen automatisk værtsoverdragelse i WebRTC-udgaven.

## Spillet

Forsvar kommandocentralen gennem **8 stigende fjendebølger**. To fungerende produktionslinjer er bygget fra start:

- **Jernmine → bånd → smelter → bånd → central:** giver jernplader til fælles lager.
- **Jernmine → bånd → smelter → bånd → fabrik → bånd → central:** 2 plader bliver til 1 tandhjul.
- **Savværk:** producerer 3 træ hvert 3. sekund, hvis der står træer inden for 5 felter.
- **Generator:** bruger 1 træ hvert 12. sekund og tilfører 18 energi. Centralen giver selv 18 energi.
- **Vagttårn:** 1 tandhjul giver 12 skud. Rækkevidde: 10 felter.
- **Barrikader:** stopper fjender og køber tid. Reparer før næste angreb.

Maskiner afleverer i pilens retning. Brug bånd mellem maskiner og helt frem til centralens felt. Overbelastning af strømnettet stopper de senest byggede maskiner. Afmonter træer for 8 træ; savværker er en vedvarende trækilde. Afmontering af bygninger giver 60 % af byggematerialerne tilbage, afrundet ned. Ingeniørerne skyder automatisk og genopstår ved centralen efter 8 sekunder.

| Betjening | Handling |
|---|---|
| WASD | Flyt din ingeniør |
| Piletaster | Flyt kamera |
| Musehjul / + / − | Zoom |
| Mellemrum / ⌖ | Centrér basen |
| 1–8 | Vælg bånd, mine, smelter, fabrik, savværk, generator, tårn, barrikade |
| 9 / 0 | Reparer / afmonter og ryd træer eller sten |
| R | Drej byggeplanens udgang |
| Venstreklik | Byg eller inspicér |
| Shift + træk | Byg en række bånd eller barrikader |
| Højreklik / Esc | Annullér værktøj |
| P | Pause (kun vært) |
| ? | Felthåndbog |

Soloverdener og værtens verden gemmes lokalt i browseren hvert 30. sekund. Du kan også gemme manuelt. Der er én gemmeplads pr. browser/origin; en ny ekspedition erstatter den ved næste gemning. Gemt verden deles ikke automatisk mellem den downloadede fil og den hostede udgave. Lokal lagring skal være tilladt i browseren. Undgå at slette browserdata, hvis du vil bevare verdenen.

## Udvikling

Node.js 22+ er kun nødvendigt, hvis du vil ændre kildekoden.

```sh
npm ci
npm run build
npm start
```

Åbn `http://localhost:3000`. Bygning genererer `public/vendor/`, den selvstændige `release/Ironhaven.html` og browserudgaven i `dist/`. `release/` og `dist/` er genererede og ikke versionsstyrede.

Den valgfrie udviklingsserver indeholder også en autoritativ WebSocket-server på `/play`, som bruges af integrationstests. Den er **ikke nødvendig for spillets LAN-funktion**; spilklienten bruger direkte WebRTC.

## Verifikation

```sh
npm test
npm run build
```

Automatiske tests dækker deterministisk produktion, komplette transportkæder, strøm, materialer, terræn, reparation, kamp, død/genopståen, værtsrettigheder, grænsen på fire spillere, koder og en WebSocket-session med fire klienter.

En separat test af direkte WebRTC-forbindelser kan køres med en valgfri native testafhængighed:

```sh
npm install --no-save --package-lock=false @roamhq/wrtc@0.9.1
node scripts/check-rtc.mjs
```

Den tester én vært og tre gæster med den samme `Lan`-kode som spillet, invitation/svar, delte byggekommandoer og synkroniserede verdensbilleder. Det verificerer netværksprotokollen lokalt; forskellige browsere og faktiske LAN/firewall-konfigurationer skal stadig afprøves på de anvendte computere. Ingen visuel browsertest er udført i bygge-miljøet.

## Teknik og grafik

Three.js renderer ortografisk 3D. Grafik, ikoner, bygninger, terræn og figurer er originale og skabes af kode; ingen lånte spilaktiver. Træer, terræn og fjender bruger instancing. Simuleringen kører ved 20 ticks/sekund. Grafikindstillingen **let** slår skygger fra. Kortet er 56 × 56 felter med højst 700 bygninger og 280 fjender i sidste bølge. Dette er en alpha-prototype med én sektor, én produktionskæde og otte bølger; ikke et fuldt Factorio-/RTS-spil med forskning og kampagner.

Three.js distribueres under MIT; licensen følger med i den genererede klient og i `THREE-LICENSE.txt`.
