// Per-word records: scores, mastery, spaced review, and fading hints.
// Plain functions on plain objects, so they're easy to follow and to test.

import { READ } from '../config.js';
import { addDays, onOrBefore } from './dates.js';

// A fresh record for a word nobody has seen yet.
export function newRecord() {
  return {
    score: 0, // 0..100
    seen: 0,
    right: 0, // right on the first try (hinted ones count as partial, not here)
    misses: 0,
    days: [], // the days he got it right (most recent few)
    types: {}, // right answers per puzzle type, e.g. { wordToPicture: 4 }
    mastered: false,
    reviewStep: 0, // index into READ.review.intervalsDays
    nextReview: null, // a day string, when mastered
  };
}

// How an answer changes the score. `outcome` is 'right', 'hinted', or 'missed';
// `ms` is how long the first pick took.
export function scoreChange(outcome, ms) {
  const s = READ.score;
  if (outcome === 'missed') return s.miss;
  if (outcome === 'hinted') return s.hinted;
  if (ms < s.fastMs) return s.correct + s.fastBonus; // quick: fluent
  if (ms > s.slowMs) return Math.round(s.correct / 2); // slow: still learning it
  return s.correct;
}

// Update a word's record after an answer. `review` is true if the word came up as
// a spaced review. `typesAvailable` is how many puzzle types exist right now.
export function applyAnswer(record, { outcome, ms, type, today, review, typesAvailable }) {
  record.seen++;
  record.score = Math.max(0, Math.min(100, record.score + scoreChange(outcome, ms)));
  if (outcome === 'missed') record.misses++;
  if (outcome === 'right') {
    record.right++;
    if (!record.days.includes(today)) record.days = [...record.days, today].slice(-10);
    record.types[type] = (record.types[type] ?? 0) + 1;
  }

  if (record.mastered && review) {
    if (outcome === 'missed') {
      // A miss on a review word puts it back into active learning.
      record.mastered = false;
      record.reviewStep = 0;
      record.nextReview = null;
    } else {
      // Remembered: the next gap is longer.
      record.reviewStep = Math.min(record.reviewStep + 1, READ.review.intervalsDays.length - 1);
      record.nextReview = addDays(today, READ.review.intervalsDays[record.reviewStep]);
    }
  } else if (!record.mastered && isMastered(record, typesAvailable)) {
    record.mastered = true;
    record.reviewStep = 0;
    record.nextReview = addDays(today, READ.review.intervalsDays[0]);
  }
  return record;
}

// Mastered: a high score, right on several different days, and right in at least
// two puzzle types (or as many types as exist so far).
export function isMastered(record, typesAvailable) {
  const m = READ.mastery;
  const typesNeeded = Math.min(m.puzzleTypes, typesAvailable);
  const typesRight = Object.values(record.types).filter((n) => n > 0).length;
  return record.score >= m.score && record.days.length >= m.days && typesRight >= typesNeeded;
}

// Is a mastered word due for its spaced check?
export function isDue(record, today) {
  return record.mastered && record.nextReview !== null && onOrBefore(record.nextReview, today);
}

// Fading support: 'show' (a big speaker), 'hidden' (small and faint), or 'none'.
export function hintFor(record) {
  if (record.score < READ.hints.showBelow) return 'show';
  if (record.score < READ.hints.removeAbove) return 'hidden';
  return 'none';
}
