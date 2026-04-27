import { HealthProvider } from './baseHealthProvider.js';

const FITBIT_AUTHORIZE_URL = 'https://www.fitbit.com/oauth2/authorize';
const FITBIT_ACTIVITY_ENDPOINT = 'https://api.fitbit.com/1/user/-/activities/date/today.json';

export class FitbitProvider extends HealthProvider {
  async getStatus() {
    const { fitbitClientId, fitbitToken } = this.store.getState().settings;
    return {
      available: Boolean(fitbitClientId),
      connected: Boolean(fitbitToken),
      label: fitbitToken ? 'Fitbit verbunden' : 'Fitbit vorbereiten'
    };
  }

  async connect() {
    const { fitbitClientId } = this.store.getState().settings;
    if (!fitbitClientId) {
      return { ok: false, message: 'Bitte zuerst eine Fitbit Client ID eintragen.' };
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const params = new URLSearchParams({
      response_type: 'token',
      client_id: fitbitClientId,
      redirect_uri: redirectUri,
      scope: 'activity profile',
      expires_in: '604800',
      prompt: 'consent'
    });

    window.location.href = `${FITBIT_AUTHORIZE_URL}?${params.toString()}`;
    return { ok: true, message: 'Weiterleitung zu Fitbit…' };
  }

  consumeRedirectHash() {
    if (!window.location.hash.includes('access_token')) return false;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get('access_token');
    if (!token) return false;

    this.store.setState((state) => {
      state.settings.fitbitToken = token;
      return state;
    }, 'health:fitbit-token');

    history.replaceState(null, document.title, window.location.pathname + window.location.search);
    return true;
  }

  async syncToday() {
    const { fitbitToken } = this.store.getState().settings;
    if (!fitbitToken) {
      return { ok: false, steps: 0, activeMinutes: 0, message: 'Fitbit ist noch nicht verbunden.' };
    }

    const response = await fetch(FITBIT_ACTIVITY_ENDPOINT, {
      headers: { Authorization: `Bearer ${fitbitToken}` }
    });

    if (!response.ok) {
      return {
        ok: false,
        steps: 0,
        activeMinutes: 0,
        message: `Fitbit Sync fehlgeschlagen: ${response.status}`
      };
    }

    const payload = await response.json();
    const steps = Number(payload?.summary?.steps ?? 0);
    const activeMinutes = Number(payload?.summary?.fairlyActiveMinutes ?? 0) + Number(payload?.summary?.veryActiveMinutes ?? 0);
    const xpGain = Math.min(60, Math.floor(steps / 500) + Math.floor(activeMinutes / 5));

    this.store.setState((state) => {
      state.player.stepsToday = Math.max(state.player.stepsToday, steps);
      state.player.xp += xpGain;
      state.player.totalXpEarned += xpGain;
      state.player.lastHealthSyncDate = new Date().toISOString();
      return state;
    }, 'health:fitbit-sync');

    return { ok: true, steps, activeMinutes, message: `Fitbit Sync: ${steps} Schritte, +${xpGain} EXP.` };
  }
}
