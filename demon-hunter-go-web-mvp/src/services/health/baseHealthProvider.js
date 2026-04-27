export class HealthProvider {
  constructor(store) {
    this.store = store;
  }

  async getStatus() {
    return { available: false, connected: false, label: 'Unbekannt' };
  }

  async connect() {
    return { ok: false, message: 'Nicht implementiert.' };
  }

  async syncToday() {
    return { ok: false, steps: 0, activeMinutes: 0, message: 'Nicht implementiert.' };
  }
}
