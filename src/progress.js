// Which panels have been completed, remembered on this device.
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
