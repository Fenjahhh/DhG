import { HealthProvider } from './baseHealthProvider.js';

export class AppleHealthProvider extends HealthProvider {
  async getStatus() {
    return {
      available: false,
      connected: false,
      label: 'Apple HealthKit braucht eine native iOS-App'
    };
  }

  async connect() {
    return {
      ok: false,
      message:
        'Apple HealthKit ist aus einer normalen Browser-Web-App nicht direkt verfügbar. Nutze später Capacitor/Ionic oder eine native iOS-App als Bridge.'
    };
  }

  async syncToday() {
    return this.connect();
  }
}
