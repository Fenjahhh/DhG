# Architecture

## Overview

The MVP is a local-first browser app.

```text
index.html
  ↓
src/main.js
  ↓
store + services + views
```

## Store

`createStore()` is a tiny observable state container. All state changes go through `store.setState()` and are persisted to localStorage.

## Data

Static game data is in `src/data/`:

- demons
- rituals
- biomes

This keeps the prototype content-driven.

## Location

`locationService.js` supports:

- `navigator.geolocation.getCurrentPosition`
- `navigator.geolocation.watchPosition`
- simulated movement for desktop testing

## Map

`mapView.js` owns the Leaflet map instance and renders:

- player marker
- encounter marker
- OpenStreetMap tile layer

## Biomes

`biomeService.js` is currently heuristic and Munich-focused. It checks rough distance to a few water/nature points and falls back to city.

Future implementations can replace this service without touching UI code.

## Health

Health access uses a provider pattern:

```text
HealthProvider
  ├─ MockHealthProvider
  ├─ FitbitProvider
  └─ AppleHealthProvider placeholder
```

The rest of the app only calls:

```js
healthService.connect()
healthService.syncToday()
healthService.getStatus()
```

## Encounters

`demonService.js` owns:

- selecting biome-appropriate demons
- creating encounters
- applying rituals
- calculating binding chance
- writing collection results

## UI

UI files are DOM-rendering modules. They subscribe to the store and re-render their section.
