// Which panels have been completed, and best scores, remembered on this device.
//
// Browser storage can be missing or blocked (private windows, some previews),
// so every access is wrapped in try/catch and the game works fine without it.

const STORAGE_KEY = 'margins.completedPanels';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function isComplete(panelId) {
  return load().includes(panelId);
}

export function markComplete(panelId) {
  const done = load();
  if (done.includes(panelId)) return;
  done.push(panelId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  } catch {
    // Not saved this time; the panel just won't stay filled in after a reload.
  }
}

// Best scores, e.g. bestScore('climb').
const BEST_KEY = 'margins.bestScores';

function loadBest() {
  try {
    return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
  } catch {
    return {};
  }
}

export function bestScore(mode) {
  return loadBest()[mode] || 0;
}

// Save `score` if it beats the best. Returns true if it's a new best.
export function saveScore(mode, score) {
  const best = loadBest();
  if (score <= (best[mode] || 0)) return false;
  best[mode] = score;
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    // Not saved this time.
  }
  return true;
}
