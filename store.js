import { createDefaultState } from './defaultState.js';
import { loadState, saveState } from '../services/storageService.js';

export function createStore() {
  let state = loadState() ?? createDefaultState();
  const listeners = new Set();

  function getState() {
    return structuredClone(state);
  }

  function subscribe(listener) {
    listeners.add(listener);
    listener(getState());
    return () => listeners.delete(listener);
  }

  function setState(updater, action = 'state:update') {
    const draft = structuredClone(state);
    const next = updater(draft) ?? draft;
    state = next;
    saveState(state);
    listeners.forEach((listener) => listener(getState(), action));
  }

  function reset() {
    state = createDefaultState();
    saveState(state);
    listeners.forEach((listener) => listener(getState(), 'state:reset'));
  }

  return { getState, setState, subscribe, reset };
}
