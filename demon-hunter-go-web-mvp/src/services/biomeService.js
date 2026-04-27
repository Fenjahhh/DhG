import { BIOMES, MUNICH_BIOME_HINTS } from '../data/biomes.js';
import { distanceMeters } from './geoMath.js';

export function detectBiome(location) {
  if (!location) return BIOMES.CITY;

  const nearWaterPoint = MUNICH_BIOME_HINTS.waterPoints.find((point) =>
    distanceMeters(location, point) <= point.radiusMeters
  );
  if (nearWaterPoint) return { ...BIOMES.WATER, hint: nearWaterPoint.name };

  const nearWaterLine = MUNICH_BIOME_HINTS.waterLines.some((point) =>
    distanceMeters(location, { lat: point[0], lng: point[1] }) <= 420
  );
  if (nearWaterLine) return { ...BIOMES.WATER, hint: 'Isar / Uferzone' };

  const nearNature = MUNICH_BIOME_HINTS.naturePoints.find((point) =>
    distanceMeters(location, point) <= point.radiusMeters
  );
  if (nearNature) return { ...BIOMES.NATURE, hint: nearNature.name };

  return { ...BIOMES.CITY, hint: 'Straßen und Plätze' };
}
