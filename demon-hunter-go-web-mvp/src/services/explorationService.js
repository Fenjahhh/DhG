import { distanceMeters } from './geoMath.js';

export const EXPLORATION_RINGS = [
  {
    id: 'hearth',
    label: 'Heimkreis',
    maxMeters: 1000,
    color: '#98f1d8',
    rarityWeights: { common: 82, uncommon: 16, rare: 2 }
  },
  {
    id: 'streets',
    label: 'Straßenring',
    maxMeters: 3000,
    color: '#d8a7ff',
    rarityWeights: { common: 64, uncommon: 30, rare: 6 }
  },
  {
    id: 'outer-city',
    label: 'Außenkreis',
    maxMeters: 8000,
    color: '#9fd3ff',
    rarityWeights: { common: 46, uncommon: 40, rare: 14 }
  },
  {
    id: 'journey',
    label: 'Fahrtenkreis',
    maxMeters: 20000,
    color: '#ffcf8f',
    rarityWeights: { common: 30, uncommon: 46, rare: 24 }
  },
  {
    id: 'wilds',
    label: 'Fernkreis',
    maxMeters: Infinity,
    color: '#ff8fbe',
    rarityWeights: { common: 18, uncommon: 42, rare: 40 }
  }
];

const MAX_ROUTE_POINTS = 600;
const MIN_ROUTE_POINT_DISTANCE_METERS = 65;
const MAX_TRACKED_JUMP_METERS = 3000;
const VISITED_CELL_PRECISION = 2000;

export function createDefaultExploration(homeLocation) {
  const today = todayKey();
  return {
    homeLocation,
    totalDistanceMeters: 0,
    dailyDistanceMeters: 0,
    dailyDistanceDate: today,
    routePoints: [
      {
        ...homeLocation,
        recordedAt: new Date().toISOString()
      }
    ],
    visitedCells: [cellKey(homeLocation)],
    currentRingId: getRingForLocation(homeLocation, homeLocation).id
  };
}

export function updateExplorationOnLocation(state, previousLocation, nextLocation) {
  if (!state.exploration) {
    state.exploration = createDefaultExploration(nextLocation);
  }

  const exploration = state.exploration;
  const today = todayKey();
  if (exploration.dailyDistanceDate !== today) {
    exploration.dailyDistanceDate = today;
    exploration.dailyDistanceMeters = 0;
  }

  if (!exploration.homeLocation) {
    exploration.homeLocation = nextLocation;
  }

  const walkedMeters = previousLocation ? distanceMeters(previousLocation, nextLocation) : 0;
  if (walkedMeters >= 4 && walkedMeters <= MAX_TRACKED_JUMP_METERS) {
    exploration.totalDistanceMeters += walkedMeters;
    exploration.dailyDistanceMeters += walkedMeters;
  }

  const lastRoutePoint = exploration.routePoints.at(-1);
  if (!lastRoutePoint || distanceMeters(lastRoutePoint, nextLocation) >= MIN_ROUTE_POINT_DISTANCE_METERS) {
    exploration.routePoints.push({
      lat: nextLocation.lat,
      lng: nextLocation.lng,
      recordedAt: new Date().toISOString()
    });
    exploration.routePoints = exploration.routePoints.slice(-MAX_ROUTE_POINTS);
  }

  const visited = new Set(exploration.visitedCells ?? []);
  visited.add(cellKey(nextLocation));
  exploration.visitedCells = Array.from(visited).slice(-1200);
  exploration.currentRingId = getRingForLocation(nextLocation, exploration.homeLocation).id;

  return exploration;
}

export function updateExploration(store, location) {
  store.setState((state) => {
    const previousRoutePoint = state.exploration?.routePoints?.at(-1) ?? state.exploration?.route?.at(-1) ?? state.player.lastKnownLocation;
    updateExplorationOnLocation(state, previousRoutePoint, location);
    return state;
  }, 'exploration:location');
}

export function setHomeLocation(state, location) {
  state.exploration = {
    ...(state.exploration ?? createDefaultExploration(location)),
    homeLocation: location,
    currentRingId: getRingForLocation(location, location).id
  };
  return state.exploration;
}

export function getRingForLocation(location, homeLocation) {
  const meters = homeLocation ? distanceMeters(homeLocation, location) : 0;
  return EXPLORATION_RINGS.find((ring) => meters <= ring.maxMeters) ?? EXPLORATION_RINGS.at(-1);
}

export function getExplorationRing(distanceFromHomeMeters = 0) {
  return EXPLORATION_RINGS.find((ring) => distanceFromHomeMeters <= ring.maxMeters) ?? EXPLORATION_RINGS.at(-1);
}

export function getExplorationSummary(state) {
  const homeLocation = state.exploration?.homeLocation ?? state.player.lastKnownLocation;
  const location = state.player.lastKnownLocation;
  const distanceFromHomeMeters = distanceMeters(homeLocation, location);
  const ring = getRingForLocation(location, homeLocation);
  return {
    homeLocation,
    ring,
    distanceFromHomeMeters,
    dailyDistanceMeters: state.exploration?.dailyDistanceMeters ?? 0,
    totalDistanceMeters: state.exploration?.totalDistanceMeters ?? 0,
    visitedAreaCount: state.exploration?.visitedCells?.length ?? 0,
    routePoints: state.exploration?.routePoints ?? []
  };
}

export function getCurrentRarityWeights(state) {
  return getExplorationSummary(state).ring.rarityWeights;
}

export function formatDistance(meters = 0) {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters < 10000 ? 1 : 0)} km`;
}

function cellKey(location) {
  return `${Math.round(location.lat * VISITED_CELL_PRECISION)}:${Math.round(location.lng * VISITED_CELL_PRECISION)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
