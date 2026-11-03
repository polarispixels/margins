# Launch, expanded: forest critters, rope swings, a river, a longer chase, and a launch puzzle

**Date:** 2026-11-02 · **Status:** requested, implemented
**Builds on:** `2026-11-02-launch-design.md`

## Requested

Make Launch noticeably longer, with new sections in order:

1. **Forest:** squirrels and birds that react when you run past (harmless), rope
   swings with real pendulum motion, and a river crossing (lily pads, some sinking;
   an alligator whose back is safe and whose head is not; one or two more water
   obstacles).
2. **UFO chase:** the UFO knocks trees down in front of you, a tractor beam sweeps
   the ground (caught → float up, mash jump to break free), and partway through an
   original pencil alien jumps out and chases you on foot, firing zaps.
3. **Rocket launch puzzle:** red, blue, and green switches around the pad, pressed in
   the order a hidden clue shows. Wrong order buzzes and resets; right order launches.
   This is where **color** arrives, drawn like colored pencil. Keep some pressure on.
4. **Checkpoints**, so failing at the river or the chase restarts that section.

## Layout (world x, all in `LAUNCH` in config.js)

| Section | x | What happens |
| --- | --- | --- |
| Forest | 170 – 1400 | WALK. Logs, stars, squirrels at tree bases, birds on the ground. |
| Rope swings | 1400 – 1900 | A ravine with two ropes hanging from a long branch. |
| Forest | 1900 – 2400 | A log, more birds. |
| River | 2400 – 3620 | Lily pads (two sink), the alligator, a leaping fish, a drifting log. |
| Chase | 3700 – 7750 | HURRY! A falling tree, a searchlight, another tree, another searchlight, then the alien on foot (LOOK OUT!) over two logs and a third falling tree. |
| Launch pad | 7750 – 8660 | The clue on a signpost, three switches (one up on the gantry), a fence at the end. The UFO hovers and drops goo. |
| Flight, fireball, city | 8200 – 13100 | As before, shifted right; the fireball starts at 8950 so all three lunges fit. |

Checkpoints (small pencil flags that rise as you pass): start, before the ropes,
before the river, before the chase, at the pad.

## Mechanics

- **Squirrels** sit beside a tree. When you get close they dash to the trunk and run
  up into the canopy. **Birds** hop on the ground; when you get close they flap away
  up and to the right. Neither can hurt you.
- **Rope swings.** Jump into a rope (anywhere on its lower part) to grab it. The rope
  is a real pendulum (gravity = the player's gravity, length 200 px). Holding the
  direction you're already swinging pumps it higher, like a playground swing. Press
  jump to let go: you fly off along the rope's swing direction (plus a small hop),
  so the moment you let go decides how far you go. Free ropes keep swinging and
  slowly settle. Falling into the ravine sends you back to the ropes' checkpoint.
- **River.** Falling in the water ends the attempt (a splash, then the checkpoint).
  - Lily pads float at the bank's height. **Sinking pads** start to wobble a moment
    after you land, then sink, and come back up a few seconds later.
  - The **alligator** lies in the water facing right. Its bumpy back is a platform.
    Its head snaps its jaws open and shut; touching the head ends the attempt, so jump
    over it.
  - **A leaping fish** (my choice): bubbles warn, then it leaps across the gap after
    the alligator in an arc. Touching it knocks you in.
  - **A drifting log** (my choice): a moving platform that floats back and forth.
    You ride it and jump off at the right moment.
- **Falling trees.** As the chase goes on, the UFO flies to a tree ahead of you and
  bumps it; the tree topples toward you and lies across the path as a low, wide
  obstacle you jump onto and over.
- **Searchlight tractor beam.** At two spots the UFO stops and sweeps a beam back and
  forth across the ground like a searchlight. Wait for it to swing away, then run
  through. If it catches you, you float up toward the saucer and JUMP appears: each
  press pulls you down a little, and enough presses breaks you free (you drop and
  the beam switches off for a moment). If the beam pulls you all the way up, the
  attempt ends.
- **The alien on foot.** The UFO swoops behind you and the alien hops out: a round
  little creature with one big blinking eye, three wobbly antennae, **spring legs**
  (it boings along), and a tiny ray gun. It chases you slightly slower than you run
  (it never falls too far behind) and hops over logs. Its antennae sparkle just
  before it fires a **zap**, a zigzag bolt that skims along the ground at knee
  height: jump over it. A zap stuns you for a moment; if the alien catches you, the
  attempt ends.
- **The launch puzzle.** At the pad the alien is beamed back up, and the UFO hovers
  overhead dropping goo now and then (it only stuns; it can't end the attempt).
  - **The clue:** a note pinned to a signpost before the pad, with three colored dots
    and an arrow pointing right: the order, read left to right. The order is shuffled
    every time you play.
  - **The switches:** a red, a blue, and a green button. One is on the ground before
    the rocket, one is on the gantry (reached by two small ledges), and one is past the
    rocket. Jump on (or walk onto) a button to press it.
  - A correct press dings (higher each time) and checks off that dot on the note. A
    wrong one buzzes, and all the buttons pop back up and the checkmarks clear.
  - All three in order: a chime, a light blinks on the rocket's nose, and you can climb
    in. Walk up to the rocket to start the countdown.
- **Checkpoints.** Respawning puts you at the last flag you passed, with a quick fade
  through paper and a moment of blinking safety. The river (pads) and the chase (UFO,
  trees, alien, zaps, goo) reset when you go back to their start. Stars you collected
  stay collected.

## Color

The switches, their dots on the clue, and the checkmarks are the only colored things in
the level besides fire. They're drawn like **colored pencil**: a colored outline plus
diagonal hatching inside. `COLORS.red`, `COLORS.blue`, `COLORS.green` in config.js.
This confirms the philosophy's "color is special" idea, and Launch's puzzle is the first
place colors are a thing you read and learn.

## Words

HURRY! (chase), JUMP (caught in the beam: the word teaches the escape), LOOK OUT! (the
alien, and the fireball). No new words. The puzzle has no words at all: colored dots,
an arrow, and checkmarks.

## Tuned in playtesting

- Ropes: you always hang from at least ¾ of the way down (a longer pendulum swings faster),
  the grab radius is generous, and pumping is strong enough that two or three swings get you
  across. Letting go keeps your sideways speed until you land (`StickFigure.fling()`); without
  that, the arrow keys would overwrite the swing and timing wouldn't matter.
- The drifting log carries its rider itself (Arcade's moving-platform carry didn't move the
  rider in Phaser 4.2 here).
- The alligator's back sits a little above the water, so it reads as an alligator, not a line.
- The UFO skips a tree you're already about to reach (it would fall on you) and keeps knocking
  trees down while the alien chases you.

## Decisions (Claude's calls; review these)

- "Ends the attempt" stays gentle: no game-over screen, just a short splash or chomp,
  a fade through paper, and you're back at the flag in about a second.
- Zaps and goo only stun; being caught by the alien or pulled into the UFO ends the attempt.
- The tractor beam is a searchlight sweeping one stretch of ground, so dodging it is about
  timing, not out-running it.
- The clue is on a signpost you pass before the pad, so an early reader sees it first.
- Philosophy: moves "puzzles" and "enemies" out of the Not yet list (they're built now)
  and marks colored pencil as confirmed.

## Structure

- `scenes/LaunchScene.js`: phases, checkpoints, failing and respawning, camera, stars,
  the rocket, flight, the city.
- `objects/Critters.js`: squirrels and birds.
- `objects/RopeSwings.js`: the pendulum ropes and hanging on.
- `objects/River.js`: water, lily pads, alligator, fish, drifting log (moving bodies).
- `objects/Chase.js`: the UFO's chase (falling trees, searchlights, beam capture,
  goo at the pad), using `objects/Alien.js` for the alien on foot and its zaps.
- `objects/LaunchPuzzle.js`: the switches, the clue, and checking the order.
- Art: `forestArt.js` (critters, ropes, ravine, water, pads, alligator, fish, flags),
  `chaseArt.js` (toppling trees, the beam, the alien, zaps), `puzzleArt.js` (colored
  pencil, switches, the clue note, the fence). `launchArt.js` keeps the rest.
- `audio.js` gains sfx: splash, chomp, zap, buzz, ding, unlock, crash, beam, free, grab,
  checkpoint, flutter.

## Out of scope

More puzzles or switch colors, lives or a score for the level, sound in other modes.
