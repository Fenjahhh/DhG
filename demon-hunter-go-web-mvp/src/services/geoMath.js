export function distanceMeters(a, b) {
  const radius = 6371000;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const deltaLat = toRad(b.lat - a.lat);
  const deltaLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * radius * Math.asin(Math.sqrt(h));
}

export function randomNearbyPoint(origin, minMeters = 80, maxMeters = 280) {
  const distance = minMeters + Math.random() * (maxMeters - minMeters);
  const bearing = Math.random() * Math.PI * 2;
  const earthRadius = 6371000;

  const lat1 = toRad(origin.lat);
  const lng1 = toRad(origin.lng);
  const angular = distance / earthRadius;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { lat: toDeg(lat2), lng: toDeg(lng2) };
}

function toRad(value) {
  return (value * Math.PI) / 180;
}

function toDeg(value) {
  return (value * 180) / Math.PI;
}
