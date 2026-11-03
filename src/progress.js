// Which panels have been completed, plus Climb initials and high scores,
// remembered on this device.
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

// ---- Climb: initials and the top five high scores ----

const INITIALS_KEY = 'margins.initials';
const SCORES_KEY = 'margins.highScores';
const TABLE_SIZE = 5;

// The player's three initials, or null if they haven't picked any yet.
export function getInitials() {
  try {
    return localStorage.getItem(INITIALS_KEY);
  } catch {
    return null;
  }
}

export function setInitials(initials) {
  try {
    localStorage.setItem(INITIALS_KEY, initials);
  } catch {
    // Not saved; they'll be asked again next time.
  }
}

// The top scores for a mode, best first: [{ initials, score }, ...]
export function highScores(mode) {
  try {
    return JSON.parse(localStorage.getItem(SCORES_KEY))?.[mode] ?? [];
  } catch {
    return [];
  }
}

// Add a score. Returns { place, table }: its place in the table (0 = top, or -1
// if it didn't make it) and the updated table (even if it couldn't be saved).
export function addHighScore(mode, initials, score) {
  const table = highScores(mode);
  // Ties go below older scores, so the earlier player keeps their spot.
  let place = table.findIndex((entry) => score > entry.score);
  if (place === -1) place = table.length;
  if (place >= TABLE_SIZE || score <= 0) return { place: -1, table };
  table.splice(place, 0, { initials, score });
  table.length = Math.min(table.length, TABLE_SIZE);
  try {
    const all = JSON.parse(localStorage.getItem(SCORES_KEY)) ?? {};
    all[mode] = table;
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {
    // Not saved this time; the card still shows where it would have placed.
  }
  return { place, table };
}
