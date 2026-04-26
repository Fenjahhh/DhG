export function addXp(store, amount, reason = 'Ritual') {
  if (!Number.isFinite(amount) || amount <= 0) return;

  store.setState((state) => {
    state.player.xp += amount;
    state.player.totalXpEarned += amount;
    state.player.level = calculateLevel(state.player.totalXpEarned);
    return state;
  }, 'player:xp');

  return { amount, reason };
}

export function spendXp(store, amount) {
  const current = store.getState().player.xp;
  if (current < amount) return false;
  store.setState((state) => {
    state.player.xp -= amount;
    return state;
  }, 'player:xp:spent');
  return true;
}

export function calculateLevel(totalXpEarned) {
  return Math.max(1, Math.floor(Math.sqrt(totalXpEarned / 50)) + 1);
}
