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
    const biome = detectBiome(location);
    store.setState((state) => {
      state.player.activeBiome = biome.id;
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

document.querySelector('#simulate-step-button').addEventListener('click', () => {
  locationService.simulateStep();
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
toast('Der Ritual-Prototyp ist erwacht.');
