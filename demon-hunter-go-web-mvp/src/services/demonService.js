import { DEMONS } from '../data/demons.js';
import { RITUALS } from '../data/rituals.js';
import { randomNearbyPoint } from './geoMath.js';
import { spendXp, addXp } from '../core/rewards.js';
import { getExplorationSummary } from './explorationService.js';
import { distanceMeters } from './geoMath.js';

const RARITY_WEIGHT = {
  common: 60,
  uncommon: 28,
  rare: 12,
  epic: 4,
  legendary: 1
};

const SPECIAL_PLACE_RADIUS_METERS = 220;

export function createEncounter(store, biomeId) {
  const state = store.getState();
  const location = state.player.lastKnownLocation;
  const ring = getExplorationSummary(state).ring;
  const nearbyPlace = getNearbySpecialPlace(state.specialPlaces?.items ?? [], location);
  const candidates = getEncounterCandidates(biomeId, ring.id, nearbyPlace);
  const demon = weightedPick(candidates.length ? candidates : DEMONS, ring.rarityWeights);
  const encounter = {
    id: crypto.randomUUID(),
    demonId: demon.id,
    biome: biomeId,
    ringId: ring.id,
    specialPlaceId: nearbyPlace?.id ?? null,
    specialPlace: nearbyPlace
      ? {
          id: nearbyPlace.id,
          type: nearbyPlace.type,
          typeLabel: nearbyPlace.typeLabel,
          name: nearbyPlace.name
        }
      : null,
    location: randomNearbyPoint(location),
    createdAt: new Date().toISOString(),
    ritualsUsed: [],
    bonusChance: 0
  };

  store.setState((draft) => {
    draft.encounters.active = encounter;
    draft.encounters.history.unshift({ ...encounter, result: 'appeared' });
    draft.encounters.history = draft.encounters.history.slice(0, 50);
    return draft;
  }, 'encounter:create');

  return { encounter, demon };
}

export function useRitual(store, ritualId) {
  const ritual = RITUALS.find((item) => item.id === ritualId);
  if (!ritual) return { ok: false, reason: 'Unbekanntes Ritual.' };

  if (ritual.xpCost > 0 && !spendXp(store, ritual.xpCost)) {
    return { ok: false, reason: `Du brauchst ${ritual.xpCost} EXP.` };
  }

  if (ritual.rewardXp > 0) addXp(store, ritual.rewardXp, ritual.name);

  store.setState((draft) => {
    const active = draft.encounters.active;
    if (!active) return draft;
    active.ritualsUsed.push({ ritualId, usedAt: new Date().toISOString() });
    active.bonusChance += ritual.chanceBonus;
    return draft;
  }, 'encounter:ritual');

  return { ok: true, ritual };
}

export function attemptBind(store) {
  const state = store.getState();
  const encounter = state.encounters.active;
  if (!encounter) return { ok: false, reason: 'Kein aktiver Dämon.' };

  const demon = DEMONS.find((item) => item.id === encounter.demonId);
  if (!demon) return { ok: false, reason: 'Dämonendaten fehlen.' };

  const preferredBonus = encounter.ritualsUsed.some((ritual) => ritual.ritualId === demon.preferredRitual)
    ? 0.12
    : 0;
  const collectionBonus = state.collection.includes(demon.id) ? -0.08 : 0;
  const chance = clamp(demon.baseBindChance + encounter.bonusChance + preferredBonus + collectionBonus, 0.05, 0.96);
  const roll = Math.random();
  const success = roll <= chance;

  store.setState((draft) => {
    draft.encounters.history.unshift({
      ...encounter,
      result: success ? 'bound' : 'escaped',
      chance,
      roll,
      resolvedAt: new Date().toISOString()
    });

    if (success && !draft.collection.includes(demon.id)) {
      draft.collection.push(demon.id);
      draft.player.xp += rewardForRarity(demon.rarity);
      draft.player.totalXpEarned += rewardForRarity(demon.rarity);
    }

    draft.encounters.active = null;
    return draft;
  }, 'encounter:bind');

  return { ok: true, success, demon, chance, roll };
}

export function dismissEncounter(store) {
  store.setState((draft) => {
    draft.encounters.active = null;
    return draft;
  }, 'encounter:dismiss');
}

export function getActiveEncounterDetails(state) {
  const active = state.encounters.active;
  if (!active) return null;
  const demon = DEMONS.find((item) => item.id === active.demonId);
  return { encounter: active, demon };
}

function weightedPick(candidates, rarityWeights = RARITY_WEIGHT) {
  const total = candidates.reduce((sum, demon) => sum + demonWeight(demon, rarityWeights), 0);
  let threshold = Math.random() * total;
  for (const demon of candidates) {
    threshold -= demonWeight(demon, rarityWeights);
    if (threshold <= 0) return demon;
  }
  return candidates[0];
}

function demonWeight(demon, rarityWeights) {
  return Math.max(1, rarityWeights[demon.rarity] ?? RARITY_WEIGHT[demon.rarity] ?? 1);
}

function rewardForRarity(rarity) {
  if (rarity === 'legendary') return 120;
  if (rarity === 'epic') return 65;
  if (rarity === 'rare') return 35;
  if (rarity === 'uncommon') return 22;
  return 12;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getEncounterCandidates(biomeId, ringId, nearbyPlace) {
  const candidates = DEMONS.filter((demon) => {
    const biomeMatches = !demon.biome || demon.biome === biomeId || demon.biome === 'any';
    const ringMatches = !demon.rings || demon.rings.includes(ringId);
    const placeMatches = !demon.specialPlaceTypes || (nearbyPlace && demon.specialPlaceTypes.includes(nearbyPlace.type));
    return biomeMatches && ringMatches && placeMatches;
  });

  const biomeFallback = DEMONS.filter((demon) => {
    const biomeMatches = demon.biome === biomeId || demon.biome === 'any';
    const ringMatches = !demon.rings || demon.rings.includes(ringId);
    return biomeMatches && ringMatches && !demon.specialPlaceTypes;
  });

  return candidates.length ? candidates : biomeFallback;
}

function getNearbySpecialPlace(places, location) {
  return places
    .filter((place) => place?.location)
    .map((place) => ({
      place,
      distance: distanceMeters(location, place.location)
    }))
    .filter(({ distance }) => distance <= SPECIAL_PLACE_RADIUS_METERS)
    .sort((a, b) => a.distance - b.distance)[0]?.place ?? null;
}
