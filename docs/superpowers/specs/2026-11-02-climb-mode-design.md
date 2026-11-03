# Climb mode: an endless vertical platformer, in portrait

**Date:** 2026-11-02 · **Status:** approved by request, implemented

## Requested

- A second mode, **Climb**: an endless vertical platformer played in **portrait**.
- The stick figure **bounces automatically** when it lands on a platform; the
  player **only steers left and right**.
- Platforms are **pencil-traced segments on ruled lines**, generated randomly as
  the camera scrolls up. The camera **never scrolls down**.
- Falling below the bottom of the screen **ends the run**: show the score and a
  way to restart.
- **Score = height climbed + collectible tokens.**
- One **springboard** type (launches much higher) and one **collectible** type.
  No enemies.
- Keep the existing game as its own mode, with a **simple way to pick** between them.
- New tunables in `config.js`; everything in boiling pencil; keyboard and touch.

## Decisions (Claude's calls; review these)

- **Picking a mode = the comic page.** The comic page gets a second strip,
  **"CLIMB"**, beside "GETTING STARTED", each with one panel. Walk under a panel and
  jump into it. This reuses the navigation from PHILOSOPHY.md instead of adding a
  menu screen, and works the same on keyboard and touch. "The existing level" is
  read as the main game (comic page + Getting Started).
- **Portrait.** Climb is designed in a **540 × 960** area. On entering Climb the game
  switches its design size to portrait (`useLayout()` in `screen.js`, which changes
  the size Phaser's EXPAND mode scales from); the comic page switches back to
  960 × 540. Wider screens (desktop) show the 540-wide page centered on the desk.
  The rotate hint in `index.html` now asks for whichever orientation the current
  scene wants, using a wordless animated phone icon.
- **The page.** A notebook sheet 540 wide that scrolls forever: ruled lines every
  36 px, red margin at x = 50 (the left wall), hole punches repeating down the left.
  The right page edge is the right wall. No screen wrap.
- **Bounce.** Landing on any platform sets upward speed to `bounceSpeed` (720,
  about 5 ruled lines high). Platforms are one-way: you rise up through them.
  The run starts on a solid floor line, which also bounces.
- **Generation.** Each new platform is 1–4 ruled lines above the last (`minGapLines`,
  `maxGapLines`), 70–130 px wide, and its center is at most `maxSideStep` (200 px)
  sideways from the previous one, so every platform is reachable. Platforms are
  generated a screen ahead and removed once they're well below the screen.
- **Springboard.** 10% of platforms carry a pencil-drawn spring. Landing on it
  launches at `springSpeed` (1350, about 18 lines) and the coil squashes.
- **Collectible: pencil stars.** 30% of platforms have a doodle star floating above
  them, worth `tokenValue` (10) points. Stars teach counting.
- **Score** = ruled lines climbed (highest point reached) + 10 × stars. Written in
  pencil digits at the top of the screen while playing.
- **Game over** shows the score big, with ↑ lines and ★ stars underneath, and two
  pencil buttons: **↻ again** and **◀ back** to the comic page. Keyboard: Space/Enter
  = again, Esc = back (Esc also leaves mid-run). The best score is remembered on this
  device and written in the Climb panel on the comic page.
- **Touch steering.** No jump button. Touch and hold the **left or right half** of the
  screen to steer (big targets for small hands); two faint arrow buttons at the
  bottom corners show how.
- **Words.** No new words. Numbers and icons only, per the Jack test.

## Tunables (`CLIMB` in `src/config.js`)

`width`, `height` (design area), `marginX`, `bounceSpeed`, `springSpeed`,
`steerSpeed`, `minGapLines`, `maxGapLines`, `platformMinWidth`, `platformMaxWidth`,
`maxSideStep`, `springChance`, `tokenChance`, `tokenValue`, `cameraLead`.

## Structure

- `scenes/ClimbScene.js`: the mode (camera, bounce, score, game over).
- `objects/ClimbCourse.js`: generates, draws, and removes platforms, springs, stars.
- `objects/ScrollingPaper.js`: the endless notebook page.
- Reused: `StickFigure` (gains an adjustable `runSpeed`), `PencilWord` (gains digits,
  C, B, `setText()`, and `fixed` for screen-pinned words), `PlayerInput`
  (gains a `steer` touch layout), `progress.js` (gains best scores).

## Out of scope

Enemies, more platform or token types, difficulty ramps beyond the gap range,
moving or breaking platforms, sound.

## Revision (2026-11-02): walk and jump instead of auto-bounce

Ryan didn't like the figure bouncing continually. Climb now uses the normal
controls: walk freely, press up (Up / Space / W, or ▲ on touch) to jump, hold for
a higher jump. Springboards still launch automatically when landed on.

- Removed `bounceSpeed` and the `'steer'` touch layout; Climb uses the standard
  ◀ ▶ ▲ buttons (placed near the left edge in portrait).
- `steerSpeed` → `walkSpeed` (260). Reachability now rests on the normal held jump
  (~137 px ≈ 3.8 lines): `maxGapLines` 4 → 3, `maxSideStep` 200 → 170
  (worst case 100 px edge to edge vs ~168 px of sideways travel on a 3-line jump).
- The score card's ↻ icon was redrawn with the arrowhead following the curve, the
  ↑/★ groups spaced for 4-digit numbers, and long totals shrink to fit the card.
