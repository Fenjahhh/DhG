export const BIOMES = {
  CITY: {
    id: 'city',
    label: 'Stadt',
    description: 'Asphalt, Laternenlicht und alte Türen mit zu vielen Schatten.',
    color: '#d8a7ff'
  },
  NATURE: {
    id: 'nature',
    label: 'Natur',
    description: 'Parks, Bäume, feuchte Erde und ein Rascheln knapp hinter dir.',
    color: '#98f1d8'
  },
  WATER: {
    id: 'water',
    label: 'Am Wasser',
    description: 'Ufer, Brücken, Kanäle und Dinge, die unter der Oberfläche warten.',
    color: '#9fd3ff'
  }
};

// A deliberately tiny Munich-ish heuristic for the prototype.
// Later: replace this with OSM Overpass queries, vector tiles, or server-side biome tagging.
export const MUNICH_BIOME_HINTS = {
  waterLines: [
    // Rough Isar path points in Munich.
    [48.1798, 11.6104],
    [48.1586, 11.5891],
    [48.1382, 11.5844],
    [48.1204, 11.5747],
    [48.1022, 11.5562]
  ],
  waterPoints: [
    { name: 'Olympiasee', lat: 48.1733, lng: 11.5506, radiusMeters: 520 },
    { name: 'Kleinhesseloher See', lat: 48.1614, lng: 11.5961, radiusMeters: 430 },
    { name: 'Nymphenburger Kanal', lat: 48.1588, lng: 11.5079, radiusMeters: 480 }
  ],
  naturePoints: [
    { name: 'Englischer Garten', lat: 48.1640, lng: 11.6055, radiusMeters: 1550 },
    { name: 'Olympiapark', lat: 48.1739, lng: 11.5519, radiusMeters: 980 },
    { name: 'Schlosspark Nymphenburg', lat: 48.1586, lng: 11.5034, radiusMeters: 1350 },
    { name: 'Westpark', lat: 48.1228, lng: 11.5287, radiusMeters: 950 },
    { name: 'Flaucher', lat: 48.1077, lng: 11.5550, radiusMeters: 900 }
  ]
};
