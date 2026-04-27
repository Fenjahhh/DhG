# Agent Instructions for Demon Hunter Go Web MVP

## Project Goal

Build a small, emotionally strong prototype of Demon Hunter Go. Keep it scoped. The core loop is:

```text
walk or simulate movement → detect biome → spawn demon → do mindfulness ritual → spend/earn EXP → bind demon → collect card
```

Do not turn this into a giant Pokemon Go clone yet.

## Constraints

- Use vanilla JavaScript modules unless explicitly asked to migrate to React/Vue/Svelte.
- Keep state local-first with localStorage until a backend is explicitly requested.
- Keep all game data editable in `src/data/`.
- Do not store real health tokens in production-style code without a secure plan.
- Do not add complex multiplayer, trading, AR, accounts, or payments unless requested.
- Prefer small, testable changes.

## Code Style

- Keep modules focused.
- Prefer plain functions and small service objects.
- No hidden global mutation except DOM bindings and Leaflet map instances.
- Keep user-facing strings in German for now.
- Use graceful fallbacks for geolocation and health data.

## Current Important Files

```text
src/main.js                         App composition
src/core/store.js                   Tiny observable store
src/core/rewards.js                 EXP logic
src/data/demons.js                  Demon definitions
src/data/rituals.js                 Ritual definitions
src/data/biomes.js                  Biome constants and Munich hints
src/services/demonService.js        Encounter and binding logic
src/services/biomeService.js        Biome detection
src/services/locationService.js     Browser geolocation + simulation
src/services/health/*               Health provider adapters
src/ui/*                            DOM views
```

## Good Next Tasks

1. Add `artworkUrl` support for demons and render actual card images.
2. Add PWA support with manifest and service worker.
3. Add Overpass API biome lookup behind a feature flag.
4. Add proper Fitbit PKCE backend sketch.
5. Add Capacitor setup notes for native HealthKit.
6. Add import/export save file.
7. Add unit tests for `biomeService`, `demonService`, and `rewards`.

## Non-Goals for Now

- PvP
- trading card game combat
- real-time multiplayer
- AR camera mode
- full city reskin renderer
- monetization
- social feed

## Safety / UX Notes

This app touches mindfulness, habits, location, and health data. Keep the tone gentle. Avoid guilt mechanics. Avoid punishment for missed days. Prefer wording like:

> Der Kreis ruht. Du kannst jederzeit zurückkehren.

Never imply medical diagnosis or treatment.
