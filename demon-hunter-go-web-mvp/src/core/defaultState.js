export const DEFAULT_LOCATION = { lat: 48.16199, lng: 11.5479 };
export const LEGACY_DEFAULT_LOCATION = { lat: 48.137154, lng: 11.576124 };

export function createDefaultState() {
  const today = new Date().toISOString().slice(0, 10);

  return {
    player: {
      level: 1,
      xp: 40,
      totalXpEarned: 40,
      stepsToday: 0,
      activeBiome: 'city',
      lastKnownLocation: DEFAULT_LOCATION,
      lastHealthSyncDate: null
    },
    collection: [],
    encounters: {
      active: null,
      history: []
    },
    defense: {
      selectedTowerIds: ['home-sigil'],
      lastRunDate: null,
      bestWave: 0,
      wins: 0,
      losses: 0,
      history: []
    },
    exploration: {
      homeLocation: DEFAULT_LOCATION,
      totalDistanceMeters: 0,
      dailyDistanceMeters: 0,
      dailyDistanceDate: today,
      visitedCells: [],
      routePoints: [{ ...DEFAULT_LOCATION, recordedAt: new Date().toISOString() }],
      currentRingId: 'hearth'
    },
    habits: [
      {
        id: crypto.randomUUID(),
        name: '10 Minuten rausgehen',
        type: 'positive',
        streak: 0,
        completedDate: null,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        name: 'Doomscrolling unterbrechen',
        type: 'negative',
        streak: 0,
        completedDate: null,
        createdAt: new Date().toISOString()
      }
    ],
    todos: [
      {
        id: crypto.randomUUID(),
        text: 'Eine winzige Aufgabe erledigen',
        done: false,
        createdAt: new Date().toISOString(),
        completedAt: null
      }
    ],
    dailyTodos: [
      {
        id: crypto.randomUUID(),
        text: 'Wasser trinken',
        completedDate: null,
        createdAt: new Date().toISOString()
      },
      {
        id: crypto.randomUUID(),
        text: 'Einmal bewusst atmen',
        completedDate: today,
        createdAt: new Date().toISOString()
      }
    ],
    gratitudeNotes: [
      {
        id: crypto.randomUUID(),
        text: 'Heute zählt auch ein kleiner Anfang.',
        createdAt: new Date().toISOString()
      }
    ],
    settings: {
      healthProvider: 'mock',
      fitbitClientId: '',
      fitbitToken: '',
      showPhotoMarkers: true,
      showSpecialPlaces: true,
      reducedMotion: false
    },
    specialPlaces: {
      items: [],
      lastScanLocation: null,
      lastScanAt: null,
      status: 'idle'
    }
  };
}
