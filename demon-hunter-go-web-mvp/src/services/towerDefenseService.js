import { DEMONS, RARITY_LABELS } from '../data/demons.js';

const STARTER_TOWER = {
  id: 'home-sigil',
  name: 'Home-Siegel',
  title: 'Grundschutz des Kreises',
  rarity: 'common',
  biome: 'home',
  art: '◆',
  role: 'Kern',
  power: 24
};

const RARITY_POWER = {
  common: 18,
  uncommon: 28,
  rare: 42,
  epic: 58,
  legendary: 82
};

const BIOME_ROLE = {
  city: 'Verlangsamung',
  nature: 'Dornenwall',
  water: 'Flächenschaden',
  any: 'Bannkreis',
  home: 'Kern'
};

export function getAvailableTowers(state) {
  const boundDemons = state.collection
    .map((id) => DEMONS.find((demon) => demon.id === id))
    .filter(Boolean)
    .map(toTower);

  return [STARTER_TOWER, ...boundDemons];
}

export function runDailyDefense(state, selectedTowerIds) {
  state.defense ??= createDefaultDefenseState();

  const today = todayKey();
  const availableTowers = getAvailableTowers(state);
  const selected = normalizeSelectedTowers(selectedTowerIds, availableTowers);
  const towers = availableTowers.filter((tower) => selected.includes(tower.id));
  const wave = createWave(state);
  const defensePower = calculateDefensePower(towers);
  const success = defensePower >= wave.threat;
  const damage = success ? 0 : Math.min(3, Math.ceil((wave.threat - defensePower) / 22));
  const xpReward = success ? 12 + wave.wave * 4 : 4;

  state.player.xp += xpReward;
  state.player.totalXpEarned += xpReward;
  state.defense.selectedTowerIds = selected;
  state.defense.lastRunDate = today;
  state.defense.bestWave = Math.max(state.defense.bestWave ?? 0, success ? wave.wave : wave.wave - 1);
  state.defense.wins += success ? 1 : 0;
  state.defense.losses += success ? 0 : 1;
  state.defense.history.unshift({
    id: crypto.randomUUID(),
    playedAt: new Date().toISOString(),
    wave,
    defensePower,
    towerIds: selected,
    success,
    damage,
    xpReward
  });
  state.defense.history = state.defense.history.slice(0, 20);

  return {
    success,
    damage,
    xpReward,
    wave,
    defensePower,
    towers
  };
}

export function runDefense(store) {
  const state = store.getState();
  const today = todayKey();
  if (state.defense?.lastRunDate === today) {
    return { ok: false, victory: false, message: 'Die heutige Welle ist bereits entschieden.' };
  }

  let result;
  store.setState((draft) => {
    result = runDailyDefense(draft, draft.defense?.selectedTowerIds);
    return draft;
  }, 'defense:run');

  return {
    ok: true,
    victory: result.success,
    message: result.success
      ? `Welle ${result.wave.wave} abgewehrt. +${result.xpReward} EXP.`
      : `Das Siegel hat ${result.damage} Risse bekommen. +${result.xpReward} EXP fürs Standhalten.`,
    ...result
  };
}

export function createDefaultDefenseState() {
  return {
    selectedTowerIds: ['home-sigil'],
    lastRunDate: null,
    bestWave: 0,
    wins: 0,
    losses: 0,
    history: []
  };
}

export function getDefenseSummary(state) {
  const defense = state.defense ?? createDefaultDefenseState();
  const today = todayKey();
  const crackDamage = (defense.history ?? []).reduce((sum, entry) => sum + (entry.damage ?? 0), 0);
  return {
    sigilHealth: Math.max(1, 100 - crackDamage * 8),
    dailyRunDone: defense.lastRunDate === today,
    bestWave: defense.bestWave ?? 0,
    wins: defense.wins ?? 0,
    losses: defense.losses ?? 0
  };
}

export function getTowerStats(demon) {
  return toTower(demon);
}

export function toTower(demon) {
  return {
    id: demon.id,
    name: demon.name,
    title: demon.title,
    rarity: demon.rarity,
    rarityLabel: RARITY_LABELS[demon.rarity] ?? demon.rarity,
    biome: demon.biome,
    art: demon.art,
    artworkUrl: demon.artworkUrl,
    role: BIOME_ROLE[demon.biome] ?? 'Bannkreis',
    power: RARITY_POWER[demon.rarity] ?? 18
  };
}

function normalizeSelectedTowers(selectedTowerIds, availableTowers) {
  const availableIds = new Set(availableTowers.map((tower) => tower.id));
  const selected = Array.from(new Set(['home-sigil', ...(selectedTowerIds ?? [])]))
    .filter((id) => availableIds.has(id))
    .slice(0, 6);
  return selected.length ? selected : ['home-sigil'];
}

function calculateDefensePower(towers) {
  const rawPower = towers.reduce((sum, tower) => sum + tower.power, 0);
  const uniqueBiomes = new Set(towers.map((tower) => tower.biome)).size;
  const synergyBonus = Math.max(0, uniqueBiomes - 1) * 6;
  return rawPower + synergyBonus;
}

function createWave(state) {
  const runCount = (state.defense?.wins ?? 0) + (state.defense?.losses ?? 0);
  const wave = Math.max(1, Math.min(12, Math.floor(runCount / 2) + state.player.level));
  const distanceBonus = Math.min(28, Math.floor((state.exploration?.dailyDistanceMeters ?? 0) / 500));
  const collectionPressure = Math.min(24, state.collection.length * 2);
  const threat = 34 + wave * 12 + distanceBonus + collectionPressure;

  return {
    wave,
    name: wave >= 8 ? 'Nachtwelle' : wave >= 4 ? 'Dämmerwelle' : 'Flackerwelle',
    threat
  };
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
