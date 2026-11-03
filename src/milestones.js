// Climb's difficulty by height. The numbers live in CLIMB.milestones and
// CLIMB.beyond (config.js); this file turns them into settings for any height.
// Height is measured in ruled lines climbed.

import { CLIMB } from './config.js';

const LAST = CLIMB.milestones[CLIMB.milestones.length - 1];

// The settings in effect at `lines` lines up.
export function difficultyAt(lines) {
  // Start from the first entry and apply each milestone we've passed, in order.
  const settings = {};
  for (const milestone of CLIMB.milestones) {
    if (lines < milestone.at) break;
    Object.assign(settings, milestone);
  }

  // Past the last milestone, keep stepping up, within the limits.
  const steps = Math.max(0, Math.floor((lines - LAST.at) / CLIMB.beyond.every));
  for (const [key, change] of Object.entries(CLIMB.beyond.step)) {
    const [min, max] = CLIMB.beyond.limits[key] ?? [-Infinity, Infinity];
    settings[key] = Math.min(max, Math.max(min, settings[key] + change * steps));
  }

  // Never let platforms get out of reach, whatever the table says.
  settings.maxGapLines = Math.min(settings.maxGapLines, CLIMB.reach.maxGapLines);
  settings.maxSideStep = Math.min(settings.maxSideStep, CLIMB.reach.maxSideStep);
  settings.platformMinWidth = Math.min(settings.platformMinWidth, settings.platformMaxWidth);
  return settings;
}

// The most recent milestone at or below `lines`: { at, word }. Milestones past the
// table repeat every CLIMB.beyond.every lines.
export function milestoneAt(lines) {
  if (lines >= LAST.at + CLIMB.beyond.every) {
    const steps = Math.floor((lines - LAST.at) / CLIMB.beyond.every);
    return { at: LAST.at + steps * CLIMB.beyond.every, word: CLIMB.beyond.word };
  }
  let found = CLIMB.milestones[0];
  for (const milestone of CLIMB.milestones) {
    if (lines >= milestone.at) found = milestone;
  }
  return { at: found.at, word: found.word };
}
