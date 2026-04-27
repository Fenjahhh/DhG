const STORAGE_KEY = 'demon-hunter-go-web-mvp-state-v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Could not load state. Starting fresh.', error);
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Could not save state.', error);
  }
}

export function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}
