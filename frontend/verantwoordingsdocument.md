# Verantwoordingsdocument MijnAutoManager

Eindopdracht Frontend, NOVI Hogeschool.

## Inhoudsopgave

1. [Inleiding](#1-inleiding)
2. [Gemaakte keuzes](#2-gemaakte-keuzes)
3. [Beperkingen en doorontwikkeling](#3-beperkingen-en-doorontwikkeling)
4. [Gebruikte RDW-bronnen en correcties](#4-gebruikte-rdw-bronnen-en-correcties)
5. [CORS-status](#5-cors-status)
6. [Asynchrone verzoeken](#6-asynchrone-verzoeken)
7. [Installatie en gebruik](#7-installatie-en-gebruik)
8. [Reflectie](#8-reflectie)

## 1. Inleiding

MijnAutoManager is een React-applicatie waarin een autobezitter zijn eigen auto's en onderhoud bijhoudt. De applicatie gebruikt twee bronnen:

- de **NOVI Educational Backend** voor accounts (registreren en inloggen met een JWT), voertuigen en onderhoud;
- **RDW Open Data** voor voertuiggegevens, de APK-vervaldatum, geregistreerde gebreken en erkende bedrijven.

In dit document leg ik uit welke technische keuzes ik heb gemaakt, wat de beperkingen zijn en hoe de app met de API's praat.

## 2. Gemaakte keuzes

### 2.1 React met JavaScript, zonder extra frameworks

Ik heb React (met Vite) en gewoon JavaScript gebruikt, zoals in de lessen. TypeScript, Redux of een UI-bibliotheek zoals Bootstrap, MUI of Tailwind heb ik bewust niet gebruikt. De app is klein genoeg om met de basis van React overzichtelijk te blijven, en zo laat ik zien dat ik de basis zelf beheers.

### 2.2 React Router voor de pagina's

Elke pagina uit het ontwerp (S01–S08) heeft een eigen route, bijvoorbeeld `/voertuigen/:id` en `/voertuigen/:id/onderhoud/nieuw`. Privépagina's zitten achter een `ProtectedRoute`: zonder sessie stuurt die je naar Inloggen. Onbekende adressen tonen een 404-pagina.

### 2.3 React Context voor de sessie

De sessie (token en gebruiker) staat in een `AuthContext` en wordt bewaard in `sessionStorage`. Zo kunnen alle pagina's bij de sessie zonder props door te geven. Bij een 401-antwoord logt `handleError` de gebruiker uit. Ik heb voor `sessionStorage` gekozen in plaats van `localStorage`, zodat de sessie verdwijnt als het tabblad sluit.

### 2.4 Eigen CSS met Flexbox

Elk component heeft een eigen CSS-bestand. Algemene kleuren staan als CSS-variabelen in `styles.css`. De layout is gemaakt met Flexbox en `flex-wrap`, met mediaqueries op 850 px en 650 px. Onder 768 px klapt het menu in. Ik heb de pagina's gecontroleerd op 360, 768 en 1440 px: geen horizontale scroll.

### 2.5 Herbruikbare componenten

Er zijn ruim zes herbruikbare componenten: `Button`, `FormField`, `Notice`, `PageHeading`, `EmptyState`, `VehicleCard`, `ApkStatus`, `NicknameForm`, `ConfirmDialog`, `MaintenanceItem`, `CompanyCard` en `Layout`. Ze krijgen hun gegevens via props en geven acties terug via callbacks (zoals `onSave`, `onDelete` en `onConfirm`). Zo bepaalt de pagina wat er gebeurt en tekent het component alleen.

### 2.6 Eigen hooks voor het ophalen van gegevens

`useVehicles`, `useMaintenance` en `useRequest` bevatten de vaste logica voor laden, fout en opnieuw proberen. Elke hook gebruikt een `AbortController` en een `current`-vlag, zodat een oud antwoord nooit een nieuwer antwoord overschrijft als je snel van pagina wisselt.

### 2.7 Losse hulpfuncties voor validatie en opmaak

Validatie (`validateMaintenance`), datums, bedragen en de APK-status staan in `src/helpers`. Die functies zijn los te testen met Vitest en worden op meerdere plekken gebruikt.

### 2.8 Filteren op de eigen gebruiker in de frontend

NOVI geeft bij `GET /api/vehicles` alle voertuigen van het project terug. Daarom zoekt de app na het inloggen het eigen gebruikers-id op via `GET /api/users` (op e-mailadres). Daarna haalt hij alle pagina's op en filtert hij op `userId`. Lukt dat niet eenduidig, dan toont de app een foutmelding en nooit een ongefilterde lijst.

### 2.9 Demomodus en fictieve kentekens

Alleen de fictieve kentekens `TESTA1`, `TESTA2` en `TESTB1` kunnen worden opgeslagen, zodat er geen echte kentekens van anderen in de database komen. De lokale demo werkt helemaal zonder netwerk (`sessionStorage`). Zo kan de app ook getest worden als NOVI niet bereikbaar is.

## 3. Beperkingen en doorontwikkeling

| Beperking | Mogelijke doorontwikkeling |
|---|---|
| **Geen autorisatie op de server.** NOVI controleert niet of een voertuig van de ingelogde gebruiker is. De app filtert en controleert dat zelf, maar iemand met een token kan via de API toch andermans record wijzigen. | Een eigen backend die bij elk verzoek de eigenaar controleert. |
| **Verwijderen is niet atomair.** Bij een voertuig verwijdert de app eerst elk onderhoudsrecord en daarna het voertuig. Gaat het halverwege mis, dan meldt de app wat al wel verwijderd is, maar terugdraaien kan niet. | Een server-endpoint dat alles in één transactie verwijdert. |
| **Alleen fictieve voertuigen opslaan.** Echte kentekens kun je wel bekijken, maar niet toevoegen. | Een eigendomscontrole (bijvoorbeeld via de meldcode) voordat een echt kenteken mag worden opgeslagen. |
| **Gebreken zijn geen volledige historie.** De RDW-dataset bevat alleen gebreken die bij keuringen zijn gemeld, en de telling geldt alleen voor het gekozen kenteken. | Meer RDW-datasets combineren, zoals de keuringsresultaten. |
| **Geen afstand of afspraken bij garages.** Je zoekt op plaatsnaam, zonder GPS of afstand, en kunt geen afspraak maken. | Postcode plus straal, met een kaart. |
| **Geen wachtwoordherstel** en geen automatische verlenging van de JWT. | Een "wachtwoord vergeten"-flow en een refresh-token, als de backend dat ondersteunt. |
| **De Swagger klopt niet helemaal.** `maintenanceDate` staat als `number` beschreven, maar NOVI accepteert alleen een datum als tekst (`"2026-10-01"`). `PUT /api/maintenance/{id}` eist ook het `id` in de body. Dit heb ik met live-tests uitgezocht. | Met de docent of backendbeheerder overleggen om de Swagger bij te werken. |

## 4. Gebruikte RDW-bronnen en correcties

Alle datasets zijn live opgevraagd en gecontroleerd op de veldnamen.

| Dataset | Inhoud | Gebruikte velden | Gebruikt voor |
|---|---|---|---|
| `m9d7-ebf2` | Gekentekende voertuigen | `kenteken`, `merk`, `handelsbenaming`, `datum_eerste_toelating`, `vervaldatum_apk`, `vervaldatum_apk_dt` | Kenteken zoeken (S04), APK-datum (S06) |
| `8ys7-d773` | Brandstof per voertuig | `kenteken`, `brandstof_omschrijving` | Kenteken zoeken (S04) |
| `a34c-vvps` | Geconstateerde gebreken | `kenteken`, `gebrek_identificatie`, `meld_datum_door_keuringsinstantie`, `meld_tijd_door_keuringsinstantie`, `aantal_gebreken_geconstateerd` | Gebrekregistraties (S06) |
| `hx2c-gt7k` | Codetabel gebreken | `gebrek_identificatie`, `gebrek_omschrijving`, `ingangsdatum_gebrek`, `einddatum_gebrek` | Omschrijving bij een code (S06) |
| `5k74-3jha` | Erkende bedrijven | `volgnummer`, `naam_bedrijf`, `gevelnaam`, `straat`, `huisnummer`, `postcode_numeriek`, `postcode_alfanumeriek`, `plaats` | Garages zoeken (S07) |
| `nmwb-dqkz` | Erkenningen per bedrijf | `volgnummer`, `erkenning` | Erkenning controleren en uitklappen (S07) |

**Correcties ten opzichte van de ideefase:**

- `8ys7-d773` stond in de ideefase als codetabel van gebreken, maar het is de brandstoftabel. De echte codetabel is `hx2c-gt7k`.
- De ID's `6pei-bbkp`, `ge7e-zxk4` en `k4yd-f29r` uit de ideefase bestaan niet (meer); de RDW geeft `dataset.missing`.
- Een gebrekcode kan meerdere versies hebben. De app kiest de omschrijving die geldig was op de melddatum (`ingangsdatum_gebrek` en `einddatum_gebrek`).
- Plaatsnamen staan bij de RDW in hoofdletters (bijvoorbeeld `GROU`). De app vergelijkt daarom met `upper(plaats)`.

## 5. CORS-status

| API | Status |
|---|---|
| RDW Open Data | Stuurt `Access-Control-Allow-Origin: *` mee, dus werkt rechtstreeks vanuit de browser. |
| NOVI Backend | Staat alleen `http://localhost:5173` toe. Vanaf `http://127.0.0.1:5173` komt er geen `Access-Control-Allow-Origin`-header. Daarom start `npm run dev` op `localhost` met een vaste poort, en toont de inlogpagina een melding als je de app via `127.0.0.1` opent. |

## 6. Asynchrone verzoeken

Elk verzoek heeft een laadtekst en een foutmelding. Bij ophalen staat er "Opnieuw proberen"; tijdens een actie is de knop uitgeschakeld. Elk verzoek heeft een time-out van 15 seconden (`AbortSignal.timeout`).

| # | Verzoek | Waar | Uitleg |
|---|---|---|---|
| 1 | `POST /api/users` | Registreren (S02) | Maakt een account met rol `user`. |
| 2 | `POST /api/login` + `GET /api/users` | Inloggen (S01) | Haalt het JWT op en zoekt daarna het eigen gebruikers-id op e-mailadres. |
| 3 | `GET /api/vehicles` (alle pagina's) | Mijn auto's (S03), voertuigpagina (S05) | Pagina's van 100 tot alles binnen is, daarna filteren op `userId`. |
| 4 | `POST /api/vehicles` | Kenteken toevoegen (S04) | Controleert eerst op een dubbel kenteken. |
| 5 | `PATCH /api/vehicles/{id}` | Bijnaam wijzigen (S05) | Controleert eerst of het voertuig van jou is. |
| 6 | `DELETE /api/maintenance/{id}` (per record) + `DELETE /api/vehicles/{id}` | Voertuig verwijderen (S05) | Eerst al het onderhoud, dan het voertuig; meldt een gedeeltelijke mislukking. |
| 7 | `GET /api/vehicles/{id}/maintenance` | Onderhoudslijst (S05, S08) | Alle pagina's, daarna gefilterd en gesorteerd van nieuw naar oud. |
| 8 | `POST`, `PUT` en `DELETE /api/maintenance` | Onderhoud toevoegen, bewerken en verwijderen (S05, S08) | Bij een netwerkfout tijdens opslaan meldt de app dat de uitkomst onzeker is. |
| 9 | RDW `m9d7-ebf2` + `8ys7-d773` | Kenteken zoeken (S04) | Voertuiggegevens en brandstof. |
| 10 | RDW `m9d7-ebf2` | APK en gebreken (S06) | APK-vervaldatum met statuslabel. |
| 11 | RDW `a34c-vvps` + `hx2c-gt7k` | APK en gebreken (S06) | Alle gebrekregistraties (pagina's van 1000) plus omschrijvingen. |
| 12 | RDW `5k74-3jha` + `nmwb-dqkz` | Garages zoeken (S07) | Bedrijven in een plaats, gecontroleerd op de gekozen erkenning. |
| 13 | RDW `nmwb-dqkz` per bedrijf | Garages zoeken (S07) | Alle erkenningen van één bedrijf bij uitklappen. |

## 7. Installatie en gebruik

Zie de [README](README.md) voor de benodigdheden, de `.env`-variabelen, het stappenplan, de npm-commando's en de demogegevens.

## 8. Reflectie

> **TODO (student):** Schrijf hier je eigen reflectie. Bijvoorbeeld:
>
> - Wat ging goed en waar ben je trots op?
> - Wat was lastig (bijvoorbeeld de afwijkende NOVI-datumnotatie, de RDW-paginering of de filtering op gebruiker) en hoe heb je dat opgelost?
> - Wat zou je een volgende keer anders doen?
> - Wat heb je geleerd over React, asynchrone verzoeken en toegankelijkheid?

> **TODO (student):** Reflecteer per gemaakte keuze uit hoofdstuk 2 kort op het alternatief (bijvoorbeeld Context tegenover Redux, of eigen CSS tegenover een UI-bibliotheek).
