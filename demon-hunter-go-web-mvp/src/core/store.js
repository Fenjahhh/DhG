import { createDefaultState, DEFAULT_LOCATION, LEGACY_DEFAULT_LOCATION } from './defaultState.js';
import { createDefaultExploration } from '../services/explorationService.js';
import { loadState, saveState } from '../services/storageService.js';

export function createStore() {
  let state = migrateState(loadState() ?? createDefaultState());
  const listeners = new Set();

  function getState() {
    return structuredClone(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }

  function setState(updater, action = 'state:update') {
    const draft = structuredClone(state);
    const next = updater(draft) ?? draft;
    state = next;
    saveState(state);
    listeners.forEach((listener) => listener(getState(), action));
  }

  function reset() {
    state = createDefaultState();
    saveState(state);
    listeners.forEach((listener) => listener(getState(), 'state:reset'));
  }

  return { getState, setState, subscribe, reset };
}

function migrateState(state) {
  const location = state?.player?.lastKnownLocation;
  if (isSameLocation(location, LEGACY_DEFAULT_LOCATION)) {
    state.player.lastKnownLocation = DEFAULT_LOCATION;
  }
  state.exploration ??= createDefaultExploration(state.player.lastKnownLocation ?? DEFAULT_LOCATION);
  state.exploration.homeLocation ??= state.player.lastKnownLocation ?? DEFAULT_LOCATION;
  state.exploration.totalDistanceMeters ??= 0;
  state.exploration.dailyDistanceMeters ??= state.exploration.todayDistanceMeters ?? 0;
  state.exploration.dailyDistanceDate ??= state.exploration.lastRouteDate ?? new Date().toISOString().slice(0, 10);
  state.exploration.routePoints ??= state.exploration.route ?? [];
  state.exploration.visitedCells ??= [];
  state.exploration.currentRingId ??= 'hearth';
  state.specialPlaces ??= {
    items: [],
    lastScanAt: null,
    lastScanLocation: null,
    status: 'idle'
  };
  state.specialPlaces.items ??= state.specialPlaces.places ?? [];
  state.specialPlaces.lastScanAt ??= null;
  state.specialPlaces.lastScanLocation ??= null;
  state.specialPlaces.status ??= 'idle';
  state.defense ??= {
    selectedTowerIds: ['home-sigil'],
    lastRunDate: null,
    bestWave: 0,
    wins: 0,
    losses: 0,
    history: []
  };
  state.defense.selectedTowerIds ??= ['home-sigil'];
  state.defense.history ??= [];
  state.defense.bestWave ??= 0;
  state.defense.wins ??= state.defense.victories ?? 0;
  state.defense.losses ??= 0;
  state.defense.lastRunDate ??= state.defense.lastDefenseDate ?? state.defense.lastBattleDate ?? null;
  delete state.defense.victories;
  delete state.defense.lastDefenseDate;
  delete state.defense.lastBattleDate;
  state.settings ??= {};
  state.settings.showPhotoMarkers ??= true;
  state.settings.showSpecialPlaces ??= true;
  delete state.exploration.todayDistanceMeters;
  delete state.exploration.lastRouteDate;
  delete state.exploration.route;
  delete state.specialPlaces.places;
  return state;
}

function isSameLocation(a, b) {
  return a && b && Math.abs(a.lat - b.lat) < 0.000001 && Math.abs(a.lng - b.lng) < 0.000001;
}
