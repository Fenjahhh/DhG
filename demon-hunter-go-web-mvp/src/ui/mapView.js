import { BIOMES } from '../data/biomes.js';
import { detectBiome } from '../services/biomeService.js';

const PLAYER_MARKER_SVG = `
<svg class="pixel-mage" viewBox="0 0 36 44" role="img" aria-label="Dein Standort">
  <rect x="14" y="2" width="8" height="4" fill="#d8a7ff"/>
  <rect x="10" y="6" width="20" height="6" fill="#6d28d9"/>
  <rect x="14" y="12" width="12" height="8" fill="#f0c6a8"/>
  <rect x="18" y="16" width="4" height="4" fill="#2b1438"/>
  <rect x="10" y="20" width="20" height="12" fill="#3b1b52"/>
  <rect x="6" y="24" width="6" height="6" fill="#98f1d8"/>
  <rect x="24" y="24" width="6" height="6" fill="#98f1d8"/>
  <rect x="10" y="32" width="8" height="6" fill="#211126"/>
  <rect x="22" y="32" width="8" height="6" fill="#211126"/>
  <rect x="4" y="40" width="28" height="4" rx="2" fill="rgba(152,241,216,0.65)"/>
</svg>`;

export function createMapView(store, { onBiomeChanged } = {}) {
  const initial = store.getState().player.lastKnownLocation;
  const map = L.map('map', {
    fadeAnimation: false,
    markerZoomAnimation: false,
    zoomControl: false,
    preferCanvas: true,
    zoomAnimation: false
  }).setView([initial.lat, initial.lng], 14);
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    detectRetina: false,
    errorTileUrl:
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    keepBuffer: 4,
    maxNativeZoom: 19,
    maxZoom: 19,
    noWrap: true,
    tileSize: 256,
    updateWhenIdle: true
  }).addTo(map);

  tileLayer.on('tileerror', () => {
    map.getContainer().classList.add('map-has-tile-errors');
  });

  const playerIcon = L.divIcon({
    className: 'player-marker',
    html: PLAYER_MARKER_SVG,
    iconAnchor: [18, 38],
    iconSize: [36, 42],
    popupAnchor: [0, -38]
  });

  const playerMarker = L.marker([initial.lat, initial.lng], {
    icon: playerIcon,
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
