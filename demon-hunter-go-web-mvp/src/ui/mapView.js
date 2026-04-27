import { BIOMES } from '../data/biomes.js';
import { detectBiome } from '../services/biomeService.js';

export function createMapView(store, { onBiomeChanged } = {}) {
  const initial = store.getState().player.lastKnownLocation;
  const map = L.map('map', {
    zoomControl: false,
    preferCanvas: true
  }).setView([initial.lat, initial.lng], 14);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    crossOrigin: true,
    errorTileUrl:
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    maxZoom: 20,
    subdomains: 'abcd',
    updateWhenIdle: true,
    keepBuffer: 4
  }).addTo(map);

  tileLayer.on('tileerror', () => {
    map.getContainer().classList.add('map-has-tile-errors');
  });

  const playerMarker = L.marker([initial.lat, initial.lng], {
    title: 'Du bist hier'
  }).addTo(map);

  const encounterLayer = L.layerGroup().addTo(map);
  let lastBiomeId = store.getState().player.activeBiome;

  requestAnimationFrame(() => map.invalidateSize());

  const mapElement = document.querySelector('#map');
  const resizeObserver = new ResizeObserver(() => map.invalidateSize());
  resizeObserver.observe(mapElement);

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
