// Saving the reading engine's state in the browser (localStorage), best effort,
// like the rest of Margins: if storage is blocked, the game still plays, it
// just won't remember. Nothing here identifies the child: no names, no accounts.

const KEY = 'margins.reading';
const VERSION = 1;

export function loadState() {
  try {
    const state = JSON.parse(localStorage.getItem(KEY));
    return state?.version === VERSION ? state : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, version: VERSION }));
  } catch {
    // Not saved this time.
  }
}
