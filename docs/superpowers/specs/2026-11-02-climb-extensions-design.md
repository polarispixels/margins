# Climb extensions: initials, high scores, ink blots, airplane, paperclip, milestones

**Date:** 2026-11-02 · **Status:** approved by request, implemented

## Requested

1. **Initials and high scores.** Ask for three initials on first launch and remember
   them; offer to change them on the start screen. Keep the top five scores with
   initials and show them on the game over screen, highlighting a new high score.
2. **Ink blot enemies** that crawl back and forth on platforms and boil. Landing on
   top splats one for bonus points and a bounce; touching one from the side or
   below ends the run.
3. **Paper airplane:** a rare pickup that carries the figure upward for a few
   seconds of free flight (still steering), then drops back to normal play.
4. **Paperclip springboard:** launches much higher than a normal bounce.
5. **Height milestones** (100, 200, 500, 1000, and beyond), each making the climb
   more rewarding and more dangerous, with a short pencil-written message.
   Features arrive gradually. The milestone table lives in one place in
   `config.js`, and difficulty keeps scaling past the last milestone.

## Decisions (Claude's calls; review these)

- **Height is measured in ruled lines climbed** (the same number that scores 1 point
  each). Milestone 100 is 100 lines up.
- **Two springboards.** The existing coil spring stays (about 18 lines high) and
  the **paperclip** is the bigger one (about 32 lines). Springs arrive at 100 and
  paperclips at 200, matching "early milestones add the first springboards".
- **Milestone table** (`CLIMB.milestones`): each entry lists only what changes at that
  height; settings carry forward. Past the last entry, `CLIMB.beyond` applies a step
  of changes every 500 lines, clamped by `CLIMB.beyond.limits`, so it never plateaus.

  | Lines | Word | What changes |
  | --- | --- | --- |
  | 0 | — | Wide platforms, small gaps, lots of stars |
  | 100 | GO! | More stars, coil springs, gaps up to 3 lines |
  | 200 | LOOK OUT! | Ink blots (slow), paperclips |
  | 500 | UP! | Paper airplanes, more and faster blots, stars worth more |
  | 1000 | DANGER | Blots chase you when you're on their line, faster still; smaller platforms; bigger rewards |
  | every 500 after | HURRY! | More and faster blots, narrower platforms, bigger rewards (up to the limits) |

- **Reachability is a hard limit**, separate from the table: gaps never exceed
  3 ruled lines and sideways steps never exceed 170 px (what a held jump can do),
  however the table is edited.
- **Milestone messages** are the number and one word, written on in pencil near the
  top of the screen, then faded. The words are from the philosophy's vocabulary
  (LOOK OUT!, DANGER, HURRY are approved; GO and UP were proposed and are used here).
  This adds `!` and the letters F, H, O, Q, V, X, Y, Z to the stroke font.
- **Initials are picked arcade-style**, not typed: three letter slots, each with ▲ ▼
  buttons (or Up/Down keys; Left/Right move between slots; typing a letter also
  works), and a ✓ button (Enter). Kids can do it without a keyboard.
- **Start screen** (each time Climb opens from the comic page): a card with the
  player's initials, a pencil button to change them, and a big ▶ to play.
  ↻ "again" after a run skips the start screen. Keyboard: Left/Right to choose a
  button, Enter/Space to press it.
- **High scores** are kept per device in `localStorage` (best effort), top five,
  each with initials. The game over card shows the run's total, ↑ lines and ★ stars,
  then the five rows; a new entry is boxed in pencil with a star beside it.
  The comic page's Climb panel shows the top score.
- **Score** = lines climbed + bonus points (stars and splatted blots). The bonus is
  added when earned, using the value for that height, so later stars are worth more.
- **Ink blots** are dark ink-colored blobs with eyes and wiggling legs, crawling
  between their platform's ends. Stomping requires falling onto the blot's top;
  anything else ends the run. During airplane flight the figure can't be hurt.
- **Airplane flight:** gravity off, a steady climb at `airplaneSpeed` for
  `airplaneSeconds`, steering still works, then gravity returns with a small upward
  pop. The plane is drawn under the figure's feet.
- **Ink color.** Blots use a dark navy ink (`COLORS.ink`): enemies are the first thing
  in Climb that isn't pencil gray, so the color means "danger", per the philosophy.

## Tunables (`CLIMB` in `src/config.js`)

Physics and timing: `springSpeed`, `paperclipSpeed`, `stompSpeed`, `airplaneSpeed`,
`airplaneSeconds`, `walkSpeed`, `cameraLead`, `reach` (hard reachability limits).
Difficulty: `milestones` (table) and `beyond` (`every`, `step`, `limits`). Per-height
settings: `starChance`, `starValue`, `springChance`, `paperclipChance`, `blotChance`,
`blotSpeed`, `blotValue`, `blotChases`, `airplaneChance`, `platformMinWidth`,
`platformMaxWidth`, `maxGapLines`, `maxSideStep`.

## Structure

- `src/milestones.js`: `difficultyAt(lines)` (merges the table, applies `beyond`) and
  `milestoneAt(lines)` (the word and number to announce).
- `objects/ClimbCourse.js`: generation from `difficultyAt`, blot movement, pickups,
  blot hits.
- `objects/climbArt.js`: drawing for springs, paperclips, stars, blots, splats, planes.
- `objects/ClimbCards.js`: the initials, start, and score cards, and pencil buttons.
- `progress.js`: initials and top-five high scores (replaces the single best score).

## Out of scope

Online or shared high scores, sound, more enemy types, blots that jump or shoot.
