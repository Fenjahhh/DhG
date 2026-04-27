import { HealthProvider } from './baseHealthProvider.js';

export class MockHealthProvider extends HealthProvider {
  async getStatus() {
    return { available: true, connected: true, label: 'Mock Health / Demo' };
  }

  async connect() {
    return { ok: true, message: 'Mock Health ist bereit.' };
  }

  async syncToday() {
    const currentSteps = this.store.getState().player.stepsToday;
    const bonusSteps = 300 + Math.floor(Math.random() * 900);
    const steps = currentSteps + bonusSteps;

    this.store.setState((state) => {
      state.player.stepsToday = steps;
      state.player.lastHealthSyncDate = new Date().toISOString();
      const xpGain = Math.min(25, Math.floor(bonusSteps / 100));
      state.player.xp += xpGain;
      state.player.totalXpEarned += xpGain;
      return state;
    }, 'health:mock-sync');

    return {
      ok: true,
      steps,
      activeMinutes: Math.floor(bonusSteps / 110),
      message: `Mock Sync: +${bonusSteps} Schritte.`
    };
  }
}
