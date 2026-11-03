# Getting Started: CLIMB (the cat) and SWING (the monkey)

**Date:** 2026-11-03 · **Status:** approved to build

## Intent

Finish the first strip on the home page so every new player sees a complete row:
**WALK, CLIMB, SWING**, three short tutorial levels named with verbs, each teaching moves by
following a friendly animal. Panel 1 (WALK, the sleeping dog) exists. This adds panel 2
(**CLIMB**: a cat leads you up the page) and panel 3 (**SWING**: a monkey leads you across
ropes). In each one, the animal *is* the tutorial: it shows a move, waits, and you copy it.
Nothing to read beyond one word at the moment it's needed.

The existing Climb game is renamed **UP**, so the page never shows two panels called CLIMB.

## Goals

- Two new levels, opened from the GETTING STARTED strip's 2nd and 3rd panels.
- CLIMB teaches every vertical move the game has: ladder, spring, paperclip, jumping down.
- SWING teaches rope swinging: grab, pump, let go, rope to rope.
- Each ends when you reach the animal: it's happy (a heart, a sound), the panel is marked
  finished, and its finished art on the home page shows the figure with that animal.
- Sounds: the cat meows (a few slightly different meows), the monkey says "ooh-ooh".
- The Climb game's strip title and panel word become UP.

## Non-goals

- New climbing or swinging mechanisms beyond what exists (ladder, spring, paperclip, rope).
  More variety later.
- Renaming anything else about the Climb game (its scene, saved scores, id stay `climb`).
- Story links between the three animals beyond sharing a strip.

## Anti-goals

- Anything that can hurt you or end the level. These are tutorials: falling just puts you
  back a little, never a fail screen.
- The animal running off where you can't see it, or a move you're asked to make before the
  animal has shown it.
- More than one instruction word on screen at a time; words an early reader can't read.

## CLIMB: the cat

- A tall level, held **landscape** like the other story levels, that scrolls **upward** as
  you climb. Start at the bottom, on a line, with the cat nearby.
- The cat looks back, meows, and trots off. Each time you get close, it escapes by a new
  way up, then **waits at the top** of it (sits, looks back, meows) until you follow. If you
  dawdle it sits, licks a paw, and meows to call you. It never leaves the screen.
- The beats, in order:
  1. **Ladder:** the cat scrambles up a ladder; you climb after it. Word: CLIMB.
  2. **Spring:** the cat bounces on a spring to a higher line; you land on the spring and
     get launched after it. Word: UP!
  3. **Paperclip:** a bigger launch, higher still.
  4. **Jump down:** the cat hops down from a ledge to a lower line on the other side;
     you drop after it (falling down is fine).
  5. **A final climb** (ladder) to the top line, where the cat waits.
- Touch the cat at the top: it purrs and meows, a heart appears (like the dog), the level
  is finished. Falling off a line just lands you on the line below; nothing else can happen.
- Uses the existing ladder (`Ladder`, `StickFigure` climbing) and the existing spring and
  paperclip drawings. Launch speeds for this level are tuned to land on the intended line
  (they're tunables, not Climb's).

## SWING: the monkey

- A side-scrolling level held landscape, like Launch. The line has gaps; over each gap
  hangs a pencil rope (or vine).
- The monkey leads like the cat: swings across first, waits on the far side ("ooh-ooh"),
  and moves on when you get close.
- Beats, in order:
  1. One rope over a small gap: grab it and let go. Word: SWING (at the first rope).
  2. A wider gap: you have to pump (hold ◀ or ▶) to swing high enough.
  3. Two ropes in a row: let go of one and grab the next.
  4. A last swing to the monkey.
- Uses Launch's rope swinging (jump to grab, hold a direction to pump, jump to let go).
- Falling into a gap puts you back on the near edge of that gap after a short moment.
- Reach the monkey: heart, "ooh-ooh", level finished.

## Home page changes

- GETTING STARTED panels: WALK (open), **CLIMB** (open, cat), **SWING** (open, monkey).
- Unfinished art: a faint sketch hinting at the level (a ladder with a cat; a rope with a
  monkey). Finished art: the figure with the cat; the figure with the monkey.
- The Climb game's strip title and panel word become **UP**.

## Decided with Ryan

- Verbs for the tutorial panels: WALK, CLIMB, SWING.
- Rename the Climb game to UP.
- CLIMB demonstrates all the vertical things, including the spring and paperclip from the
  Climb game. A cat leads you up incrementally, escaping by a new mechanism each time you
  nearly catch it; it also jumps down, and you follow. It meows.
- The level ends when you reach the animal, as with the dog.
- SWING has a monkey.

## Claude's calls

- Both levels are held landscape; CLIMB scrolls upward.
- The beat order above, and that the cat waits at the top of each move.
- The words: CLIMB (ladder), UP! (first spring), SWING (first rope). One at a time.
- The monkey's sound is a cheerful "ooh-ooh", made in code like Launch's sounds; the cat
  has two or three slightly different meows and a purr.
- No dangers in either level; falls just put you back nearby.
- The animals reuse the dog's pattern: a small drawn class with a happy state and a heart.

## Left to the builder

- Exact level layouts (line positions, gap widths, rope positions), launch speeds, and the
  cat and monkey drawings and poses, as long as every move is shown by the animal first and
  is reachable.
- How the animal's "lead, wait, move on" is triggered (distance to the player is fine).
- Sound design details within the audio module's style.
- Updating the docs page and CLAUDE.md in the same commit, per the conventions.
