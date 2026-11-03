// The three-step distractor rule (docs/reading-framework.md). The wrong choices
// next to a word get harder in three steps:
//   1: different words: no letter in the same place (COW, FISH, TREE)
//   2: shared letters: at least one letter in the same place (COW, CAT, CAR)
//   3: one sound apart: the same length, exactly one letter different (CAT, HAT, BAT)
// Step 3 is the one that forces reading the whole word.

// Which step is `other` as a distractor for `word`?
export function stepBetween(word, other) {
  const same = sameLetters(word, other);
  if (word.length === other.length && same === word.length - 1) return 3;
  return same > 0 ? 2 : 1;
}

// How many letters are in the same place in both words.
function sameLetters(a, b) {
  let n = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) if (a[i] === b[i]) n++;
  return n;
}

// Where two words differ, for one-sound-apart pairs: 'first', 'middle', or 'last'
// (null if they differ in more than one place, or are different lengths).
export function differsAt(a, b) {
  if (a.length !== b.length) return null;
  const places = [];
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) places.push(i);
  if (places.length !== 1) return null;
  const i = places[0];
  return i === 0 ? 'first' : i === a.length - 1 ? 'last' : 'middle';
}

// Pick `count` distractors for `target` (a word entry) at `step` from `pool`
// (word entries). If there aren't enough at that step, fill in from the easier
// steps below it. `prefer` (optional) is a place ('first', 'middle', 'last') that
// step-3 distractors should differ at, from the child's miss patterns. `rng`
// returns [0, 1).
export function pickDistractors(target, pool, step, count, rng, prefer = null) {
  const chosen = [];
  const ok = (entry) =>
    entry.word !== target.word &&
    !confusable(entry, target) &&
    chosen.every((c) => c.word !== entry.word && !confusable(entry, c));

  for (let s = step; s >= 1 && chosen.length < count; s--) {
    let candidates = shuffle(pool.filter((e) => stepBetween(target.word, e.word) === s), rng);
    if (s === 3 && prefer) {
      // Neighbors that differ where the child tends to slip come first.
      candidates = [
        ...candidates.filter((e) => differsAt(target.word, e.word) === prefer),
        ...candidates.filter((e) => differsAt(target.word, e.word) !== prefer),
      ];
    }
    for (const entry of candidates) {
      if (chosen.length >= count) break;
      if (ok(entry)) chosen.push(entry);
    }
  }
  // Still short (a tiny library)? Take anything that's allowed.
  for (const entry of shuffle(pool, rng)) {
    if (chosen.length >= count) break;
    if (ok(entry)) chosen.push(entry);
  }
  return chosen;
}

// Could the two pictures be mixed up? (looksLike in words.js, either way round.)
function confusable(a, b) {
  return (a.looksLike ?? []).includes(b.word) || (b.looksLike ?? []).includes(a.word);
}

export function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
