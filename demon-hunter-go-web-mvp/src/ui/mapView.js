import { BIOMES } from '../data/biomes.js';
import { detectBiome } from '../services/biomeService.js';

export function createMapView(store, { onBiomeChanged } = {}) {
  const initial = store.getState().player.lastKnownLocation;
  const map = L.map('map', { zoomControl: false }).setView([initial.lat, initial.lng], 14);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const playerMarker = L.marker([initial.lat, initial.lng], {
    title: 'Du bist hier'
  }).addTo(map);

  const encounterLayer = L.layerGroup().addTo(map);
  let lastBiomeId = store.getState().player.activeBiome;

  function renderLocation(location) {
    playerMarker.setLatLng([location.lat, location.lng]);
    map.panTo([location.lat, location.lng], { animate: true, duration: 0.7 });

    const biome = detectBiome(location);
    if (biome.id !== lastBiomeId) {
      lastBiomeId = biome.id;
      store.setState((state) => {
        state.player.activeBiome = biome.id;
        return state;
      }, 'biome:changed');
      onBiomeChanged?.(biome);
    }
  }

  function renderEncounter(encounter, demon) {
    encounterLayer.clearLayers();
    if (!encounter || !demon) return;

    const biome = Object.values(BIOMES).find((item) => item.id === encounter.biome);
    const marker = L.circleMarker([encounter.location.lat, encounter.location.lng], {
      radius: 14,
      color: biome?.color ?? '#d8a7ff',
      fillColor: biome?.color ?? '#d8a7ff',
      fillOpacity: 0.42,
      weight: 2
    }).addTo(encounterLayer);

    marker.bindPopup(`<strong>${demon.name}</strong><br>${demon.title}`);
  }

  function clearEncounter() {
    encounterLayer.clearLayers();
  }

  return { map, renderLocation, renderEncounter, clearEncounter };
}
