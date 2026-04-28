import { createStore } from './core/store.js';
import { createToast } from './ui/toast.js';
import { bindTabs } from './ui/tabsView.js';
import { bindHud } from './ui/hudView.js';
import { createMapView } from './ui/mapView.js';
import { createEncounterView } from './ui/encounterView.js';
import {
  bindCollectionPanel,
  bindDailyPanel,
  bindGratitudePanel,
  bindHabitsPanel,
  bindHealthPanel,
  bindTodosPanel,
  renderRitualsPanel
} from './ui/panels.js';
import { createLocationService } from './services/locationService.js';
import { createEncounter, getActiveEncounterDetails } from './services/demonService.js';
import { createHealthService } from './services/health/healthService.js';
import { detectBiome } from './services/biomeService.js';
import { setHomeLocation, updateExplorationOnLocation } from './services/explorationService.js';

const store = createStore();
const toast = createToast();
const healthService = createHealthService(store);

bindTabs();
bindHud(store);

const mapView = createMapView(store, {
  onBiomeChanged: (biome) => toast(`Biomwechsel: ${biome.label}${biome.hint ? ` · ${biome.hint}` : ''}`)
});

const encounterView = createEncounterView(store, {
  toast,
  onClose: () => mapView.clearEncounter()
});

const locationService = createLocationService(store, {
  onLocation(location) {
    mapView.renderLocation(location);
    store.setState((state) => {
      const previousLocation = state.player.lastKnownLocation;
      const biome = detectBiome(location);
      state.player.activeBiome = biome.id;
      updateExplorationOnLocation(state, previousLocation, location);
      return state;
    }, 'biome:location');
  },
  onError(message) {
    toast(message, 'error');
  }
});

renderRitualsPanel(document.querySelector('#tab-rituals'));
bindHabitsPanel(store, document.querySelector('#tab-habits'), toast);
bindTodosPanel(store, document.querySelector('#tab-todos'), toast);
bindDailyPanel(store, document.querySelector('#tab-daily'), toast);
bindGratitudePanel(store, document.querySelector('#tab-gratitude'), toast);
bindCollectionPanel(store, document.querySelector('#tab-collection'));
bindHealthPanel(store, document.querySelector('#tab-health'), healthService, toast);

const locateButton = document.querySelector('#locate-me-button');
locateButton.addEventListener('click', () => {
  if (locationService.isWatching()) {
    locationService.stopWatch();
    locateButton.textContent = 'Standort nutzen';
    locateButton.classList.remove('is-active');
    locateButton.setAttribute('aria-pressed', 'false');
    toast('Standort-Updates pausiert.');
    return;
  }

  locationService.locateOnce();
  if (locationService.startWatch()) {
    locateButton.textContent = 'Standort stoppen';
    locateButton.classList.add('is-active');
    locateButton.setAttribute('aria-pressed', 'true');
  }
});

const photoMarkersButton = document.querySelector('#toggle-photo-markers-button');
photoMarkersButton.addEventListener('click', () => {
  store.setState((state) => {
    state.settings.showPhotoMarkers = !state.settings.showPhotoMarkers;
    return state;
  }, 'settings:photo-markers');
});

document.querySelector('#simulate-step-button').addEventListener('click', () => {
  locationService.simulateStep();
});

document.querySelector('#set-home-button').addEventListener('click', () => {
  const location = store.getState().player.lastKnownLocation;
  store.setState((state) => {
    setHomeLocation(state, location);
    return state;
  }, 'exploration:home:set');
  toast('Home-Sigil gesetzt. Die Ringe richten sich neu aus.');
});

document.querySelector('#scan-button').addEventListener('click', () => {
  const state = store.getState();
  if (state.encounters.active) {
    encounterView.open();
    return;
  }

  const { encounter, demon } = createEncounter(store, state.player.activeBiome);
  mapView.renderEncounter(encounter, demon);
  encounterView.open();
});

store.subscribe((state, action) => {
  const details = getActiveEncounterDetails(state);
  if (details) mapView.renderEncounter(details.encounter, details.demon);

  if (!action || action.startsWith('exploration:') || action?.startsWith('biome:location')) {
    mapView.renderExploration(state.exploration);
  }

  if (!action || action.startsWith('gratitude:') || action === 'settings:photo-markers') {
    mapView.renderPhotoMarkers(state.gratitudeNotes, state.settings.showPhotoMarkers);
    photoMarkersButton.textContent = state.settings.showPhotoMarkers ? 'Fotos ausblenden' : 'Fotos zeigen';
    photoMarkersButton.classList.toggle('is-active', state.settings.showPhotoMarkers);
    photoMarkersButton.setAttribute('aria-pressed', String(state.settings.showPhotoMarkers));
  }

  if (action?.startsWith('location:')) {
    const steps = state.player.stepsToday;
    if (steps > 0 && steps % 750 < 25 && !state.encounters.active) {
      const { encounter, demon } = createEncounter(store, state.player.activeBiome);
      mapView.renderEncounter(encounter, demon);
      toast(`Ein Dämon nähert sich: ${demon.name}`);
    }
  }
});

// Initial map sync.
const initialLocation = store.getState().player.lastKnownLocation;
mapView.renderLocation(initialLocation);
mapView.renderExploration(store.getState().exploration);
mapView.renderPhotoMarkers(store.getState().gratitudeNotes, store.getState().settings.showPhotoMarkers);
toast('Der Ritual-Prototyp ist erwacht.');
