# MijnAutoManager

Dit is mijn React-app voor de eindopdracht Frontend van NOVI. Met MijnAutoManager houd je je auto's op één plek bij. In deze eerste versie kun je een account maken, inloggen en uitloggen. Je ziet een overzicht van je auto's met een detailpagina, en je kunt op kenteken zoeken en een auto toevoegen. Onderhoud, APK-gebreken en garages zoeken bouw ik in de volgende stappen.

## Gebruikte technieken

- React met Vite
- React Router voor de pagina's
- React Context voor de inlogsessie
- Eigen CSS met Flexbox
- Vitest en Testing Library voor de tests

## Installeren en starten

Je hebt Node.js 22 of nieuwer en npm nodig.

```sh
cd frontend
npm ci
npm run dev
```

Open daarna http://localhost:5173. Gebruik `localhost` en niet `127.0.0.1`, want de NOVI-backend accepteert alleen verzoeken vanaf localhost.

## Instellingen

In `.env.example` staan de URL van de NOVI-backend en het project-ID. Deze waarden zijn openbaar en staan ook als standaardwaarde in de code. Wil je andere waarden gebruiken, maak dan een `.env.local` aan. Zet hier nooit wachtwoorden of tokens in, want VITE-variabelen zijn zichtbaar in de browser.

## Inloggen en de demo

Je logt in met een account van de NOVI-backend. Na het inloggen haalt de app de gebruikerslijst op en zoekt het account met hetzelfde e-mailadres. Zo weet de app welk gebruikersnummer bij jou hoort. Alleen als er precies één match is, opent het overzicht. De sessie staat in `sessionStorage` en wordt bij uitloggen gewist.

Zonder account kun je op de inlogpagina **Bekijk de lokale demo** kiezen. De app werkt dan met fictieve voorbeeldauto's die alleen in je browsertabblad staan. Er gaat dan niets naar NOVI.

## Voertuigen

- Het overzicht toont alleen de auto's die bij jouw gebruikersnummer horen.
- Bij **Kenteken** kun je de fictieve demovoertuigen TESTA1, TESTA2 en TESTB1 opzoeken en toevoegen, met een bijnaam als je wilt.
- Je kunt ook een echt kenteken opzoeken bij de RDW. Die gegevens kun je alleen bekijken en niet opslaan.

Let op: NOVI schermt voertuigen niet per account af. De app filtert alleen wat je ziet. Gebruik daarom alleen fictieve gegevens.

## Testen en bouwen

```sh
npm test
npm run build
```

Er zijn 23 tests. Ze controleren onder andere inloggen, registreren, het filteren van voertuigen, het toevoegen van een auto en het zoeken bij de RDW. De tests gebruiken nep-antwoorden en sturen geen echte verzoeken naar NOVI of de RDW.

## Bronnen

- [React](https://react.dev/)
- [React Router](https://reactrouter.com/)
- [NOVI-backend documentatie](https://novi-backend-api-wgsgz.ondigitalocean.app/swagger/project?projectId=d153089f-ba2d-4564-912c-4204900eec14)
- [RDW Open Data: gekentekende voertuigen](https://opendata.rdw.nl/resource/m9d7-ebf2.json)
- [RDW Open Data: brandstof](https://opendata.rdw.nl/resource/8ys7-d773.json)
