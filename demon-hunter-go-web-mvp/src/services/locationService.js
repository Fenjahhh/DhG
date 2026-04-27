import { distanceMeters } from './geoMath.js';

export const ROSA_LUXEMBURG_PLATZ = { lat: 48.16199, lng: 11.5479 };

export function createLocationService(store, { onLocation, onError } = {}) {
  let watchId = null;
  let simulatedLocation = store.getState().player.lastKnownLocation ?? ROSA_LUXEMBURG_PLATZ;

  function setLocation(location, source = 'manual') {
    const previous = store.getState().player.lastKnownLocation;
    const walkedMeters = previous ? distanceMeters(previous, location) : 0;

    store.setState((state) => {
      state.player.lastKnownLocation = location;
      // tiny approximation: 0.75m per step. Good enough for prototype vibes.
      if (walkedMeters > 4 && walkedMeters < 3000) {
        state.player.stepsToday += Math.round(walkedMeters / 0.75);
      }
      return state;
    }, `location:${source}`);

    onLocation?.(location, { source, walkedMeters });
  }

  function locateOnce() {
    if (!navigator.geolocation) {
      onError?.('Geolocation wird von diesem Browser nicht unterstützt.');
      setLocation(simulatedLocation, 'fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          'geolocation'
        );
      },
      (error) => {
        onError?.(`Standort nicht verfügbar: ${error.message}`);
        setLocation(simulatedLocation, 'fallback');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }

  function startWatch() {
    if (!navigator.geolocation || watchId !== null) return;
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation(
          {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          'watch'
        );
      },
      (error) => onError?.(`GPS-Watch fehlgeschlagen: ${error.message}`),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 8000 }
    );
  }

  function stopWatch() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  function simulateStep() {
    const deltaLat = (Math.random() - 0.5) * 0.005;
    const deltaLng = (Math.random() - 0.5) * 0.005;
    simulatedLocation = {
      lat: simulatedLocation.lat + deltaLat,
      lng: simulatedLocation.lng + deltaLng
    };
    setLocation(simulatedLocation, 'simulated');
  }

  return { locateOnce, startWatch, stopWatch, simulateStep, setLocation };
}
