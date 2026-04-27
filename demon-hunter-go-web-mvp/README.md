# Demon Hunter Go — Web MVP

Ein kleiner, modularer Web-Prototyp für **Demon Hunter Go**: OpenStreetMap-Karte, biomabhängige Dämonen-Begegnungen, Habits, To-dos, tägliche To-dos, Dankbarkeitsnotizen, EXP und Bindungsrituale.

Der Prototyp ist bewusst **kein fertiges Mobile Game**, sondern eine robuste erste Basis für Cursor, Codex oder andere GPT-Agenten.

## Features im MVP

- OpenStreetMap/Leaflet-Karte mit Standortbutton
- Editor-/Desktop-Simulation für Bewegung in München
- Biom-Erkennung: Stadt, Natur, Wasser
- Dämonen spawnen abhängig vom aktuellen Biom
- Encounter-Dialog mit Ritualen und Bindungschance
- EXP-System: Aufgaben, Habits, Dankbarkeit und Schritte geben EXP
- EXP kann für stärkere Bindung eingesetzt werden
- Habits-Menü für positive und negative Gewohnheiten
- normale To-dos
- tägliche To-dos
- Dankbarkeits-/Notizbereich
- Sammlung gebundener Dämonen
- Health Provider Architektur:
  - Mock Health für Demo
  - Fitbit Web API Prototype
  - Apple HealthKit Placeholder für spätere native App

## Schnellstart

```bash
npm install
npm run dev
```

Dann im Browser öffnen:

```text
http://localhost:5173
```

## GitHub Pages Deployment

Dieses Repo ist für GitHub Pages über **Deploy from branch** vorbereitet.

Falls Pages im Repository noch nicht aktiviert ist:

1. In GitHub zu **Settings → Pages** gehen.
2. Unter **Build and deployment** als Source **Deploy from a branch** auswählen.
3. Branch **main** und Ordner **/** auswählen.

Die Root-`index.html` leitet dann automatisch in den App-Ordner weiter.

Die spätere URL hat ungefähr dieses Format:

```text
https://<github-name>.github.io/<repo-name>/
```

## Wichtige Architekturentscheidung

Dieses Repo ist eine **Vanilla JavaScript + HTML + CSS** App mit Vite. Keine React-Abhängigkeit, kein schweres Framework. Dadurch können Agenten die Struktur leicht lesen und umbauen.

```text
src/
  core/              State, Rewards, Defaults
  data/              Dämonen, Rituale, Biome
  services/          Location, Biome, Demon Logic, Storage
  services/health/   Mock/Fitbit/Apple Health Adapter
  ui/                Views und DOM-Bindings
```

## Health Integrationen

### Mock Health

Standardmäßig aktiv. Simuliert Schritte und gibt dafür EXP. Gut für Demo, Desktop und Screenshots.

### Fitbit

Der Prototyp enthält einen einfachen Fitbit-Provider:

1. In der App unter **Health** den Provider auf `Fitbit Web API Prototype` stellen.
2. Eine Fitbit Client ID eintragen.
3. `Verbinden` klicken.
4. Nach OAuth-Redirect kann `Heute synchronisieren` Schritte ziehen.

Für Produktivbetrieb bitte nicht so lassen. Besser:

- Authorization Code Flow mit PKCE
- Backend oder sichere Token-Bridge
- sauberes Token Refresh Handling
- Privacy Policy und explizite Consent Screens

### Apple Health / iOS Health App

Eine normale Browser-Web-App kann Apple HealthKit nicht direkt auslesen. Für echte iOS-Health-Daten brauchst du später:

- native iOS App, oder
- Capacitor/Ionic Wrapper mit HealthKit Plugin, oder
- React Native / Swift Bridge

Der Placeholder ist absichtlich drin, damit die App-Struktur jetzt schon die richtige Richtung hat.

## Biome

Im MVP erkennt `biomeService.js` Biome über eine kleine München-Heuristik:

- Wasser: Isar-Nähe, Olympiasee, Kleinhesseloher See, Nymphenburger Kanal
- Natur: Englischer Garten, Olympiapark, Nymphenburg, Westpark, Flaucher
- sonst Stadt

Später ersetzen durch:

- Overpass API
- eigene Backend-Analyse
- OSM-Vektor-Tiles
- gehashte/privatsphärefreundliche Standortcluster

## Dämonen hinzufügen

Neue Dämonen liegen in:

```text
src/data/demons.js
```

Beispiel:

```js
{
  id: 'neuer-daemon',
  name: 'Neuer Dämon',
  title: 'Dämon der Beispielhaftigkeit',
  biome: 'city',
  rarity: 'common',
  baseBindChance: 0.55,
  resistance: 25,
  preferredRitual: 'breath',
  art: '🕯️',
  flavor: 'Er wartet in einem Kommentar.',
  effect: '+5 EXP.'
}
```

## Rituale hinzufügen

Neue Rituale liegen in:

```text
src/data/rituals.js
```

## Nächste sinnvolle Schritte

1. Kartenalbum schöner machen, mit echten Dämonen-Artworks.
2. Encounter-Animation bauen: Siegel/Pentagramm füllt sich.
3. Biom-Erkennung über OSM-Daten verbessern.
4. PWA machen: installierbar auf dem Handy.
5. Capacitor einbauen, um später iOS HealthKit/Android Health Connect zu nutzen.
6. Kleine Intro-Sequenz schreiben.
7. Datenschutz-/Consent-Screens für Standort und Health-Daten bauen.

## Demo-Pitch

> Du jagst keine Dämonen. Du lernst, mit ihnen zu gehen.
