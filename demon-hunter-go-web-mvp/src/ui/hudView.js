import { BIOMES } from '../data/biomes.js';
import { formatDistance, getExplorationSummary } from '../services/explorationService.js';

export function bindHud(store) {
  const level = document.querySelector('#player-level');
  const xp = document.querySelector('#player-exp');
  const steps = document.querySelector('#today-steps');
  const biome = document.querySelector('#current-biome');
  const homeDistance = document.querySelector('#home-distance');
  const homeRing = document.querySelector('#home-ring');
  const totalDistance = document.querySelector('#total-distance');
  const visitedCells = document.querySelector('#visited-cells');
  const walkStatus = document.querySelector('#walk-status');

  store.subscribe((state) => {
    level.textContent = state.player.level;
    xp.textContent = state.player.xp;
    steps.textContent = state.player.stepsToday.toLocaleString('de-DE');
    const biomeData = Object.values(BIOMES).find((item) => item.id === state.player.activeBiome);
    const exploration = getExplorationSummary(state);
    biome.textContent = biomeData?.label ?? state.player.activeBiome;
    homeDistance.textContent = formatDistance(exploration.distanceFromHomeMeters);
    homeRing.textContent = exploration.ring.label;
    totalDistance.textContent = formatDistance(exploration.totalDistanceMeters);
    visitedCells.textContent = exploration.visitedAreaCount.toLocaleString('de-DE');
    walkStatus.textContent = `Home-Distanz: ${formatDistance(exploration.distanceFromHomeMeters)} · ${exploration.ring.label}. Heute: ${formatDistance(exploration.dailyDistanceMeters)}.`;
  });
}
