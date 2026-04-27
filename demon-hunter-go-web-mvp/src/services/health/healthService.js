import { MockHealthProvider } from './mockHealthProvider.js';
import { FitbitProvider } from './fitbitProvider.js';
import { AppleHealthProvider } from './appleHealthProvider.js';

export function createHealthService(store) {
  const providers = {
    mock: new MockHealthProvider(store),
    fitbit: new FitbitProvider(store),
    apple: new AppleHealthProvider(store)
  };

  const fitbit = providers.fitbit;
  fitbit.consumeRedirectHash?.();

  function getActiveProvider() {
    const providerId = store.getState().settings.healthProvider;
    return providers[providerId] ?? providers.mock;
  }

  function setProvider(providerId) {
    store.setState((state) => {
      state.settings.healthProvider = providerId;
      return state;
    }, 'health:provider');
  }

  return {
    providers,
    getActiveProvider,
    setProvider,
    async getStatus() {
      return getActiveProvider().getStatus();
    },
    async connect() {
      return getActiveProvider().connect();
    },
    async syncToday() {
      return getActiveProvider().syncToday();
    }
  };
}
