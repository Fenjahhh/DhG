import { BIOMES } from '../data/biomes.js';
import { detectBiome } from '../services/biomeService.js';
import { EXPLORATION_RINGS } from '../services/explorationService.js';

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

const HOME_MARKER_SVG = `
<svg class="home-sigil" viewBox="0 0 36 36" role="img" aria-label="Home">
  <circle cx="18" cy="18" r="15" fill="#160d20" stroke="#98f1d8" stroke-width="3"/>
  <path d="M10 19 L18 10 L26 19 V28 H21 V22 H15 V28 H10 Z" fill="#d8a7ff"/>
  <circle cx="18" cy="18" r="3" fill="#98f1d8"/>
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
  const homeLayer = L.layerGroup().addTo(map);
  const photoLayer = L.layerGroup().addTo(map);
  const specialPlacesLayer = L.layerGroup().addTo(map);
  const routeLayer = L.polyline([], {
    color: '#98f1d8',
    opacity: 0.82,
    weight: 4
  }).addTo(map);
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

  function renderExploration(exploration) {
    homeLayer.clearLayers();
    if (!exploration?.homeLocation) return;

    const home = exploration.homeLocation;
    const homeLatLng = [home.lat, home.lng];
    const homeIcon = L.divIcon({
      className: 'home-marker',
      html: HOME_MARKER_SVG,
      iconAnchor: [18, 18],
      iconSize: [36, 36]
    });

    L.marker(homeLatLng, { icon: homeIcon, title: 'Home-Siegel' }).addTo(homeLayer);
    EXPLORATION_RINGS.filter((ring) => Number.isFinite(ring.maxMeters)).forEach((ring) => {
      L.circle(homeLatLng, {
        radius: ring.maxMeters,
        color: ring.color,
        fill: false,
        opacity: 0.42,
        weight: 1.5
      }).addTo(homeLayer);
    });

    routeLayer.setLatLngs((exploration.routePoints ?? exploration.route ?? []).map((point) => [point.lat, point.lng]));
  }

  function renderPhotoMarkers(notes, visible = true) {
    photoLayer.clearLayers();
    if (!visible) return;

    notes.forEach((note) => {
      const photos = getNotePhotos(note);
      photos.forEach((photo) => {
        if (!photo.dataUrl || !photo.location) return;
        const icon = L.divIcon({
          className: 'photo-marker',
          html: `<img src="${photo.dataUrl}" alt="" />`,
          iconAnchor: [18, 18],
          iconSize: [36, 36]
        });
        L.marker([photo.location.lat, photo.location.lng], { icon, title: 'Foto-Fund' })
          .bindPopup(`<strong>Foto-Fund</strong><br>${escapeHtml(note.text).slice(0, 120)}`)
          .addTo(photoLayer);
      });
    });
  }

  function renderSpecialPlaces(places, visible = true) {
    specialPlacesLayer.clearLayers();
    if (!visible) return;

    places.forEach((place) => {
      const icon = L.divIcon({
        className: `special-place-marker special-place-${place.type}`,
        html: place.icon,
        iconAnchor: [15, 15],
        iconSize: [30, 30]
      });
      L.marker([place.location.lat, place.location.lng], { icon, title: place.name })
        .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${escapeHtml(place.typeLabel)}<br><span>Spezialdämon-Ort</span>`)
        .addTo(specialPlacesLayer);
    });
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

  return { map, renderLocation, renderExploration, renderPhotoMarkers, renderSpecialPlaces, renderEncounter, clearEncounter };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getNotePhotos(note) {
  if (Array.isArray(note.photos)) return note.photos;
  if (note.photoDataUrl) {
    return [
      {
        dataUrl: note.photoDataUrl,
        location: note.location,
        createdAt: note.createdAt
      }
    ];
  }
  return [];
}
