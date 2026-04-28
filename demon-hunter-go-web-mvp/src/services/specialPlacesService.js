const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const SEARCH_RADIUS_METERS = 1800;

const PLACE_TYPES = [
  { id: 'museum', label: 'Museum', icon: '🏛️', tag: ['tourism', 'museum'] },
  { id: 'castle', label: 'Schloss', icon: '🏰', tag: ['historic', 'castle'] },
  { id: 'monument', label: 'Monument', icon: '🗿', tag: ['historic', 'monument'] },
  { id: 'attraction', label: 'Sehenswürdigkeit', icon: '✦', tag: ['tourism', 'attraction'] },
  { id: 'forest', label: 'Wald', icon: '🌲', tag: ['landuse', 'forest'] },
  { id: 'wood', label: 'Gehölz', icon: '🌳', tag: ['natural', 'wood'] }
];

export async function scanSpecialPlaces(location) {
  const query = buildQuery(location);
  const response = await fetch(OVERPASS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ data: query })
  });

  if (!response.ok) {
    throw new Error(`Overpass antwortet mit ${response.status}.`);
  }

  const payload = await response.json();
  return normalizeOverpassElements(payload.elements ?? []);
}

export function shouldUseSpecialPlacesCache(cache, location) {
  if (!cache?.lastScanAt || !cache?.lastScanLocation) return false;
  const age = Date.now() - Date.parse(cache.lastScanAt);
  if (!Number.isFinite(age) || age > CACHE_TTL_MS) return false;
  return distanceApproxMeters(cache.lastScanLocation, location) < SEARCH_RADIUS_METERS / 2;
}

function buildQuery({ lat, lng }) {
  const selectors = PLACE_TYPES.map(({ tag: [key, value] }) => `
    node["${key}"="${value}"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
    way["${key}"="${value}"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
    relation["${key}"="${value}"](around:${SEARCH_RADIUS_METERS},${lat},${lng});
  `).join('\n');

  return `
    [out:json][timeout:20];
    (
      ${selectors}
    );
    out center tags 40;
  `;
}

function normalizeOverpassElements(elements) {
  const places = elements
    .map((element) => {
      const location = element.lat && element.lon
        ? { lat: element.lat, lng: element.lon }
        : element.center
          ? { lat: element.center.lat, lng: element.center.lon }
          : null;
      if (!location) return null;

      const type = detectPlaceType(element.tags ?? {});
      if (!type) return null;

      return {
        id: `${element.type}-${element.id}`,
        name: element.tags?.name ?? type.label,
        type: type.id,
        typeLabel: type.label,
        icon: type.icon,
        location,
        tags: pickTags(element.tags ?? {})
      };
    })
    .filter(Boolean);

  return Array.from(new Map(places.map((place) => [place.id, place])).values()).slice(0, 40);
}

function detectPlaceType(tags) {
  return PLACE_TYPES.find(({ tag: [key, value] }) => tags[key] === value) ?? null;
}

function pickTags(tags) {
  return {
    tourism: tags.tourism,
    historic: tags.historic,
    landuse: tags.landuse,
    natural: tags.natural
  };
}

function distanceApproxMeters(a, b) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = Math.cos((a.lat * Math.PI) / 180) * metersPerDegreeLat;
  const dx = (a.lng - b.lng) * metersPerDegreeLng;
  const dy = (a.lat - b.lat) * metersPerDegreeLat;
  return Math.sqrt(dx * dx + dy * dy);
}
