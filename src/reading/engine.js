// The reading engine: plain rules and scores (docs/reading-framework.md), no
// Phaser, so it's predictable, explainable, and works offline.
//
// A round is READ.roundLength puzzles. Ask for puzzles with nextPuzzle() (null
// when the round is over) and report each answer with answer(). The engine:
//   - runs the placement warm-up the first time (inside the first round),
//   - mixes learning words, due review words, and stretch words each round,
//   - picks wrong choices with the three-step distractor rule,
//   - turns the difficulty dial to keep success near 85%,
//   - serves an easy win after a couple of misses in a row,
//   - fades the tap-to-hear hint, tracks mastery, spaced review, and miss patterns,
//   - and saves everything after every answer.
// Every threshold is in READ (config.js).

import { READ } from '../config.js';
import { WORDS } from '../data/words.js';
import { SKILLS } from '../data/skills.js';
import { dayString } from './dates.js';
import { pickDistractors, shuffle, differsAt } from './distractors.js';
import { newRecord, applyAnswer, isDue, hintFor } from './mastery.js';
import { emptyPatterns, recordMiss, weakPlace } from './patterns.js';
import { loadState, saveState } from './store.js';

// The puzzle types that exist so far (phase 3 adds more). Mastery asks for right
// answers in two types, or as many as there are.
export const PUZZLE_TYPES = ['wordToPicture'];

const BLANK = Object.freeze(newRecord());

export class ReadingEngine {
  // Everything can be swapped for testing: the word list, saved state, the day,
  // the random numbers, and where state is saved.
  constructor({ words = WORDS, state = loadState(), today = dayString(), rng = Math.random, save = saveState } = {}) {
    this.words = words;
    this.levels = [...new Set(words.map((w) => w.level))].sort((a, b) => a - b);
    this.today = today;
    this.rng = rng;
    this.save = save;
    this.state = state ?? this.freshState();
    this.round = null;
  }

  freshState() {
    const lowest = this.levels[0];
    const start = this.levels.includes(READ.placement.startLevel) ? READ.placement.startLevel : lowest;
    return {
      placement: { done: false, level: start, streak: 0, misses: 0, asked: 0, passed: [], used: [] },
      level: lowest, // the level of the words he's learning
      dial: READ.placement.dialStep, // index into READ.dial.steps
      active: READ.dial.activeStart, // how many learning words are in play
      recent: [], // recent answers for the dial: 1 right, 0.5 hinted, 0 missed
      sinceDialMove: 0,
      missStreak: 0,
      patterns: emptyPatterns(),
      records: {}, // word → its record (see mastery.js)
    };
  }

  // A word's record, for reading. Words he hasn't met share one blank record, so
  // looking doesn't fill storage with empty entries.
  record(word) {
    return this.state.records[word] ?? BLANK;
  }

  // A word's record, for changing (created the first time).
  recordFor(word) {
    this.state.records[word] ??= newRecord();
    return this.state.records[word];
  }

  wordsAt(level) {
    return this.words.filter((w) => w.level === level);
  }

  nextLevel(level) {
    return this.levels.find((l) => l > level) ?? null;
  }

  previousLevel(level) {
    return [...this.levels].reverse().find((l) => l < level) ?? null;
  }

  // ---- Rounds ----

  startRound() {
    this.round = { asked: 0, plan: null, lastOutcome: null, recentWords: [], extra: 0 };
  }

  get roundLength() {
    return READ.roundLength;
  }

  // The next puzzle, or null when the round is over. A round always ends on a
  // right answer: if the last one wasn't, an easy win or two is added.
  nextPuzzle() {
    const r = this.round;
    const s = this.state;
    if (!s.placement.done) return this.placementPuzzle();
    if (r.asked >= READ.roundLength) {
      if (r.lastOutcome === 'right' || r.extra >= 2) return null;
      r.extra++;
      return this.easyWin();
    }
    if (s.missStreak >= READ.dial.missesForEasyWin) return this.easyWin();

    r.plan ??= this.planRound(READ.roundLength - r.asked);
    let kind = r.plan.shift() ?? 'learning';
    let entry = this.pick(kind);
    if (!entry) {
      // Nothing due for review, or no level above: a learning word instead.
      kind = 'learning';
      entry = this.pick('learning');
    }
    const step = READ.dial.steps[s.dial];
    return this.makePuzzle(entry, kind, step.distractors, step.choices);
  }

  // The kinds of word in the rest of a round: mostly learning, some review that's
  // due, one or two stretch words from the next level. Starts with a learning word.
  planRound(n) {
    const s = this.state;
    const review = Math.min(this.dueWords().length, READ.review.maxPerRound, Math.max(0, n - 1));
    const r = READ.round;
    let stretch = this.nextLevel(s.level) === null ? 0 : s.dial >= r.stretchHighFromStep ? r.stretchHigh : r.stretch;
    stretch = Math.min(stretch, Math.max(0, n - review - 1));
    const learning = n - review - stretch;
    const rest = shuffle([
      ...Array(Math.max(0, learning - 1)).fill('learning'),
      ...Array(review).fill('review'),
      ...Array(stretch).fill('stretch'),
    ], this.rng);
    return learning > 0 ? ['learning', ...rest] : rest;
  }

  makePuzzle(entry, kind, step, choices) {
    const distractors = pickDistractors(entry, this.words, step, choices - 1, this.rng, weakPlace(this.state.patterns));
    const options = shuffle([entry, ...distractors], this.rng);
    return {
      word: entry.word,
      entry,
      kind, // 'learning', 'review', 'stretch', 'easy', or 'placement'
      type: PUZZLE_TYPES[0],
      step,
      choices: options,
      answer: options.indexOf(entry),
      hint: hintFor(this.record(entry.word)),
    };
  }

  // An easy win: a word he knows well, with very different pictures.
  easyWin() {
    this.state.missStreak = 0;
    return this.makePuzzle(this.pick('easy'), 'easy', 1, 3);
  }

  // ---- Choosing words ----

  pick(kind) {
    const s = this.state;
    const avoid = new Set(this.round.recentWords.slice(-2));
    const fresh = (list) => list.filter((e) => !avoid.has(e.word));
    const weight = (e) => 100 - this.record(e.word).score + 10; // lower scores come up more

    if (kind === 'review') {
      const due = fresh(this.dueWords()).sort((a, b) => (this.record(a.word).nextReview < this.record(b.word).nextReview ? -1 : 1));
      return due[0] ?? null;
    }
    if (kind === 'stretch') {
      const next = this.nextLevel(s.level);
      return next === null ? null : this.weighted(fresh(this.wordsAt(next)), weight);
    }
    if (kind === 'easy') {
      const known = fresh(this.words.filter((e) => e.level <= s.level && this.record(e.word).seen > 0))
        .sort((a, b) => this.record(b.word).score - this.record(a.word).score);
      return known[0] ?? this.weighted(fresh(this.wordsAt(s.level)), () => 1);
    }

    // Learning words, steered toward the place he tends to slip (miss patterns):
    // words with one-sound-apart neighbors in that place give that practice.
    const weak = weakPlace(s.patterns);
    const practices = (e) => this.words.some((o) => differsAt(e.word, o.word) === weak);
    const steered = (e) => weight(e) * (weak && practices(e) ? READ.patterns.boost : 1);
    let pool = fresh(this.activeLearning());
    if (pool.length === 0) pool = fresh(this.words.filter((e) => e.level <= s.level && !this.record(e.word).mastered));
    if (pool.length === 0) pool = fresh(this.words);
    return this.weighted(pool, steered);
  }

  // The words in play at his level (not yet mastered): the ones he's working on,
  // the ones that are secure but still need practice on other days, and new ones
  // in library order. Only words he's still working on count toward `active`, so a
  // new word comes in each time one becomes secure.
  activeLearning() {
    const level = this.wordsAt(this.state.level).filter((e) => !this.record(e.word).mastered);
    const met = level.filter((e) => this.record(e.word).seen > 0);
    const working = met.filter((e) => this.record(e.word).score < READ.unlock.score);
    const secure = met.filter((e) => this.record(e.word).score >= READ.unlock.score);
    const unmet = level.filter((e) => this.record(e.word).seen === 0);
    return [...working, ...secure, ...unmet.slice(0, Math.max(0, this.state.active - working.length))];
  }

  dueWords() {
    return this.words.filter((e) => isDue(this.record(e.word), this.today));
  }

  weighted(list, weightOf) {
    if (list.length === 0) return null;
    const weights = list.map(weightOf);
    let roll = this.rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) {
      roll -= weights[i];
      if (roll < 0) return list[i];
    }
    return list[list.length - 1];
  }

  // ---- Answers ----

  // `firstPick` is the index of the first card he chose; `ms` how long it took;
  // `hintUsed` whether he tapped the speaker first. Later picks (the second try)
  // don't change any scores. Returns { outcome, pattern }.
  answer(puzzle, { firstPick, ms, hintUsed }) {
    const s = this.state;
    const right = firstPick === puzzle.answer;
    const outcome = !right ? 'missed' : hintUsed ? 'hinted' : 'right';
    const record = this.recordFor(puzzle.word);
    applyAnswer(record, {
      outcome, ms, type: puzzle.type, today: this.today, review: record.mastered, typesAvailable: PUZZLE_TYPES.length,
    });

    let pattern = null;
    if (outcome === 'missed') {
      pattern = recordMiss(s.patterns, puzzle.word, puzzle.choices[firstPick].word);
      s.missStreak++;
    } else {
      s.missStreak = 0;
    }

    if (puzzle.kind === 'placement') {
      this.placementAnswer(outcome);
    } else if (puzzle.kind !== 'easy') {
      // Easy wins don't count toward the dial (they're a breather, not a measure).
      s.recent = [...s.recent, outcome === 'right' ? 1 : outcome === 'hinted' ? 0.5 : 0].slice(-READ.dial.window * 2);
      this.turnDial();
      this.checkLevel();
    }

    const r = this.round;
    r.asked++;
    r.lastOutcome = outcome;
    r.recentWords.push(puzzle.word);
    this.save(s);
    return { outcome, pattern };
  }

  // The difficulty dial: harder above ~90% success, easier below ~75%. It only
  // judges answers given since its last move (up to `window` of them), once there
  // are `cooldown` of them, so it doesn't overshoot on old answers.
  // At the top step, "harder" means more new words in play.
  turnDial() {
    const s = this.state;
    const d = READ.dial;
    s.sinceDialMove++;
    if (s.sinceDialMove < d.cooldown) return;
    const last = s.recent.slice(-Math.min(d.window, s.sinceDialMove));
    const rate = last.reduce((a, b) => a + b, 0) / last.length;
    if (rate > d.raiseAbove) {
      if (s.dial < d.steps.length - 1) s.dial++;
      else s.active += d.activeGrow;
      s.sinceDialMove = 0;
    } else if (rate < d.easeBelow && s.dial > 0) {
      s.dial--;
      s.sinceDialMove = 0;
    }
  }

  // The next level opens once most of this level's words are secure. New words
  // are harder, so the dial eases back a step.
  checkLevel() {
    const s = this.state;
    const next = this.nextLevel(s.level);
    if (next === null) return;
    const words = this.wordsAt(s.level);
    const secure = words.filter((e) => this.record(e.word).score >= READ.unlock.score).length;
    if (secure / words.length >= READ.unlock.share) {
      s.level = next;
      s.active = READ.dial.activeStart;
      s.dial = Math.max(0, s.dial - 1);
    }
  }

  // ---- Placement ----
  // Start at level 2, step up after a couple right in a row, step down after a miss,
  // until it finds where he lands. Then start him one level below that.

  placementPuzzle() {
    const p = this.state.placement;
    const unused = this.wordsAt(p.level).filter((e) => !p.used.includes(e.word));
    const entry = this.weighted(unused.length ? unused : this.wordsAt(p.level), () => 1);
    p.used.push(entry.word);
    return this.makePuzzle(entry, 'placement', READ.placement.distractorStep, 3);
  }

  placementAnswer(outcome) {
    const p = this.state.placement;
    p.asked++;
    if (outcome === 'right') {
      p.streak++;
      if (p.streak >= READ.placement.upAfter) {
        if (!p.passed.includes(p.level)) p.passed.push(p.level);
        const up = this.nextLevel(p.level);
        if (up === null) return this.finishPlacement(p.level);
        Object.assign(p, { level: up, streak: 0, misses: 0 });
      }
    } else if (outcome === 'missed') {
      // Needing the hint is neither up nor down; misses step down.
      p.streak = 0;
      p.misses++;
      if (p.misses >= READ.placement.downAfter) {
        const down = this.previousLevel(p.level);
        // Found it: he passed the level below this one (or there's nothing lower).
        if (down === null || p.passed.includes(down)) return this.finishPlacement(down ?? p.level);
        Object.assign(p, { level: down, misses: 0 });
      }
    }
    if (p.asked >= READ.placement.maxQuestions) this.finishPlacement(Math.max(this.levels[0], ...p.passed));
  }

  finishPlacement(landed) {
    const s = this.state;
    const p = s.placement;
    p.done = true;
    p.landed = landed;
    s.level = this.previousLevel(landed) ?? landed; // just below, so day one feels like winning
    s.dial = READ.placement.dialStep;
    // Levels he showed he can read start partway along, so he isn't held there for days.
    for (const level of p.passed) {
      for (const e of this.wordsAt(level)) {
        const record = this.recordFor(e.word);
        record.score = Math.max(record.score, READ.placement.creditScore);
      }
    }
    this.checkLevel();
  }

  // ---- For a future parent view, and for debugging ----

  // Each skill's share of mastered words, and whether it's mastered.
  skillProgress() {
    return SKILLS.filter((sk) => this.levels.includes(sk.level)).map((sk) => {
      const words = this.words.filter((w) => w.skill === sk.skill);
      const mastered = words.filter((w) => this.record(w.word).mastered).length;
      const share = words.length ? mastered / words.length : 0;
      return { ...sk, share, mastered: share >= READ.mastery.skillShare };
    });
  }

  summary() {
    const s = this.state;
    const last = s.recent.slice(-READ.dial.window);
    return {
      level: s.level,
      dial: s.dial,
      active: s.active,
      rate: last.length ? last.reduce((a, b) => a + b, 0) / last.length : null,
      placement: s.placement,
      weak: weakPlace(s.patterns),
      patterns: s.patterns,
      due: this.dueWords().map((e) => e.word),
      skills: this.skillProgress(),
    };
  }
}
