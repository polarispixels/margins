// Miss patterns: which wrong picture did the child choose, and what does it say?
// Picking HAT for CAT is a first-sound slip; CUT for CAT is a vowel slip; CAP for
// CAT is a last-sound slip. Counts fade a little with each new miss, so recent
// habits matter most. The strongest pattern steers practice (see engine.js).

import { READ } from '../config.js';
import { differsAt } from './distractors.js';

export function emptyPatterns() {
  return { first: 0, middle: 0, last: 0, other: 0, vowels: {} };
}

// Record a miss: the child read `target` but picked `picked`.
export function recordMiss(patterns, target, picked) {
  const decay = READ.patterns.decay;
  for (const key of ['first', 'middle', 'last', 'other']) patterns[key] *= decay;
  for (const pair of Object.keys(patterns.vowels)) patterns.vowels[pair] *= decay;

  const place = differsAt(target, picked) ?? 'other';
  patterns[place] += 1;
  if (place === 'middle') {
    // Which vowels got mixed up, e.g. 'A-U' (alphabetical, so A-U and U-A are one).
    const pair = [target[1], picked[1]].sort().join('-');
    patterns.vowels[pair] = (patterns.vowels[pair] ?? 0) + 1;
  }
  return place;
}

// The place the child slips most ('first', 'middle', 'last'), once there's enough
// to go on; otherwise null.
export function weakPlace(patterns) {
  const places = ['first', 'middle', 'last'];
  const best = places.reduce((a, b) => (patterns[b] > patterns[a] ? b : a));
  return patterns[best] >= READ.patterns.minToSteer ? best : null;
}
