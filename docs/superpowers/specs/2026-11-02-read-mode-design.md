# Read: the reading game, phases 1 and 2

**Date:** 2026-11-02 · **Status:** requested, implemented
**Builds on:** `docs/reading-framework.md` (phases 1 and 2), `docs/PHILOSOPHY.md`

## Requested

A new mode, **Read**, on the comic page. Phase 1 (core loop): the word-to-picture puzzle with
3 choices, a farm theme, about 30 CVC words with pencil pictures, tap-to-hear with the
browser's speech, and per-word scores saved in the browser. Phase 2 (adaptive engine):
placement warm-up, the difficulty dial (about 85% success), the three-step distractor rule,
spaced review, fading hints, and miss-pattern tracking. The word library is data, tagged by
level, skill, and theme. Engine thresholds live in `config.js`. Wrong answers get a wiggle
and another try, never a buzzer.

## What the child sees

- A word written in big pencil letters at the top (CAT), and below it a row of pencil
  pictures on cards (3 to start). Tap the picture that matches.
- **Right:** the card gets a pencil circle, a soft ding, the word is spoken, and the little
  stick figure at the bottom hops. On to the next word.
- **Wrong:** that card wiggles and fades back. Try again. No sound, no lost life.
- **Tap-to-hear:** a pencil speaker beside the word says it out loud. It's big for new words,
  small and faint once the word is getting familiar, and gone once it's known.
- A row of little dots along the bottom fills in as the round goes (10 words). The round
  always ends on a right answer, then a big pencil star and two buttons: ↻ again, ◀ back.
- No words besides the word being read. Back: ◀ in the corner, or Esc.
- Keyboard: Left/Right choose a card, Space/Enter picks it, 1–5 pick directly, H hears the word.
  Touch: tap a card, tap the speaker.

Letters are uppercase, matching Margins' pencil font and the framework's examples (COW).
(Lowercase would need a new set of letters in `PencilWord`; noted as an open question.)

## The word library (data, not code)

- `src/data/words.js`: one entry per word, `{ word, level, skill, theme, picture, looksLike? }`.
  35 farm words: level 2 (CVC, short a and o: CAT, HAT, RAT, CAN, PAN, VAN, RAM, BAG, MAP,
  CAP, DOG, LOG, FOX, BOX, POT, MOP, TOP) and level 3 (CVC, all short vowels: PIG, FIG, BIN,
  LID, HEN, PEN, NET, WEB, BED, SUN, BUG, RUG, MUD, CUP, PUP, TUB, NUT, HUT).
  `looksLike` lists words whose pictures could be confused (PUP and DOG), which never appear
  as choices together.
- `src/data/pictures.js`: each picture is a list of pencil shapes (lines, paths, circles,
  ovals, dots, shaded patches) in a 100 × 100 box. `PencilPicture` draws them with the boil.
  So a new word or a new biome is new data in these two files, no code.
- `src/data/skills.js`: the skill ladder (level → skill name), from the framework.

## The engine (`src/reading/`, plain rules, no Phaser)

All numbers are in `READ` in `config.js`.

- **Scores.** Each word has a score 0–100. A first-try correct adds points, more when fast
  (under `fastMs`), fewer when slow. Correct after using the hint is a partial correct (small
  gain). A wrong first pick is a miss (score drops); the second try doesn't change the score.
- **Mastery.** A word is mastered when its score is at least `mastery.score`, it was answered
  right on at least `mastery.days` different days, and right in at least `mastery.puzzleTypes`
  puzzle types. Only one puzzle type exists until phase 3, so the type rule asks for
  `min(puzzleTypes, types that exist)`. A skill is mastered when `mastery.skillShare` of its
  words are.
- **Levels.** The current level's words are the learning words. The next level unlocks when
  `unlock.share` of the current level's words reach `unlock.score` (secure, not necessarily
  mastered, so a strong reader isn't held back for days).
- **Placement.** On a fresh device the first round starts with a warm-up that looks like any
  round: start at level 2, step up after `upAfter` right answers in a row, step down after
  `downAfter` misses at a level (one mis-tap doesn't decide it; needing the hint is neither up
  nor down), stop when it finds the level the child passes but the next one up he doesn't (or
  after `maxQuestions`). He then starts one level below where he landed (never below the
  lowest), with the dial on an easy step, so day one feels like winning. Words at levels he
  passed start at `creditScore`, so starting low doesn't hold a strong reader back for days.
- **Each round** (`roundLength` words) mixes learning words at his level (most), up to
  `review.maxPerRound` review words that are due, and `round.stretch` words from the next level
  (`round.stretchHigh` once the dial is high). Learning words are weighted toward low scores.
  At most `dial.activeStart` words he's still working on are in play; a new word comes in each
  time one becomes secure, and the dial can add more.
- **Distractors, three steps.** Step 1: different words (no letters in the same place). Step 2:
  shared letters (at least one letter in the same place, but not one sound apart). Step 3: one
  sound apart (exactly one letter different, like CAT, HAT, RAT). If there aren't enough at
  the asked step, it fills in from the next easier step.
- **Difficulty dial.** A list of steps in `READ.dial.steps` (distractor step + number of
  choices), from step 1 / 3 choices up to step 3 / 5 choices. It watches the rolling success
  rate (right = 1, hinted = ½, miss = 0) over the answers since its last move, up to
  `dial.window` of them, once there are `cooldown` of them. Above `raiseAbove` (90%) it moves
  up a step, or, at the top step, adds `activeGrow` new words. Below `easeBelow` (75%) it moves
  down. (Judging only answers since the last move stops it overshooting on old answers.)
  `missesForEasyWin` misses in a row → the next word is an easy win (a word he knows, step-1
  choices, no change to the dial).
- **Spaced review.** A mastered word comes back after `review.intervalsDays` (1, 3, 7, 14
  days), the gap growing after each right review. A miss on a review word puts it back into
  learning.
- **Fading hints.** Score below `hints.showBelow`: big speaker. Below `hints.removeAbove`:
  small faint speaker (hidden). Above: no speaker.
- **Miss patterns.** Every wrong pick is compared with the target: a different first letter
  is a first-sound miss, a different middle letter is a vowel miss (also counting which vowels,
  e.g. A↔U), a different last letter is a last-sound miss. The strongest pattern steers
  practice: learning words that have one-sound-apart neighbors in that position are picked more,
  and step-3 distractors prefer that position.
- **Storage.** One JSON object in `localStorage` (`margins.reading`): placement state, level,
  dial, active set size, recent answers, patterns, and per-word records (score, times seen,
  right, misses, days right, right per puzzle type, mastered, review step, next review date).
  Best effort, like the rest of Margins. No names or accounts.

## Speech

`src/reading/speech.js` wraps `speechSynthesis` (an English voice, a little slow). If the
browser has none, the speaker doesn't appear. The word is never spoken before it's answered
unless the child taps the speaker, so the puzzle stays a reading puzzle. The ding and the
spoken word on a right answer respect Margins' mute setting (M toggles it here too).

## Mode picker

A fourth strip, **READ**, on the comic page. The four panels are a little narrower to fit the
960-wide page. The panel shows a pencil cat next to the word CAT.

## Structure

- `scenes/ReadScene.js`: the screen, input, and the round flow.
- `objects/PictureCard.js`: one card (frame, picture, wiggle, circle, dim, hit test).
- `objects/PencilPicture.js`: draws picture data in boiling pencil.
- `reading/engine.js` (`ReadingEngine`: rounds, placement, picking, recording, the dial),
  `reading/distractors.js` (the three-step rule), `reading/mastery.js` (scores, mastery,
  review, hints), `reading/patterns.js` (miss patterns), `reading/store.js` (save/load),
  `reading/speech.js`, `reading/dates.js` (day strings and day gaps).
- `data/words.js`, `data/pictures.js`, `data/skills.js`.

## Checked by simulation

A pretend reader (better with practice, weak on vowels) played many rounds over simulated days
in Node: placement placed strong, average, and struggling readers differently; the dial settled
with rounds mostly at 80–90% right; easy wins came after two misses; words were mastered after
three days and came back for review; the vowel weakness was detected and steered practice; and
level 3 opened once level 2 was secure (day 1 for a strong reader, about day 5 for an average one).

## Decisions (Claude's calls; review these)

- Uppercase words (the font). Mastery's two-puzzle-type rule waits for phase 3 (one type
  counts until then). Levels unlock on "secure" words, not full mastery.
- No sound at all on a wrong answer; a wiggle and a fade only.
- Round end: one big star and ↻ / ◀ (a tiny bit of phase 3's "stars for finishing").
- PEN is a writing pen (clearer than an animal pen, and it fits the notebook).

## Out of scope (later phases)

Other puzzle types, the sticker book and bigger rewards, the parent view and export, more
levels and biomes, letter collect, AI tooling, profiles for siblings.
