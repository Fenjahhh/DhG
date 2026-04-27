import { BIOMES } from '../data/biomes.js';

export function bindHud(store) {
  const level = document.querySelector('#player-level');
  const xp = document.querySelector('#player-exp');
  const steps = document.querySelector('#today-steps');
  const biome = document.querySelector('#current-biome');
  const walkStatus = document.querySelector('#walk-status');

  store.subscribe((state) => {
    level.textContent = state.player.level;
    xp.textContent = state.player.xp;
    steps.textContent = state.player.stepsToday.toLocaleString('de-DE');
    const biomeData = Object.values(BIOMES).find((item) => item.id === state.player.activeBiome);
    biome.textContent = biomeData?.label ?? state.player.activeBiome;
    walkStatus.textContent = `Du bist bei ${state.player.lastKnownLocation.lat.toFixed(4)}, ${state.player.lastKnownLocation.lng.toFixed(4)}. Aktuelles Biom: ${biomeData?.label ?? 'unbekannt'}.`;
  });
}
