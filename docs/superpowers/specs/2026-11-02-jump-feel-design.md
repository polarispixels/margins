# Jump feel: coyote time, jump buffering, variable jump height

**Date:** 2026-11-02 · **Status:** approved by request, implemented

## Why

Jumping is the core verb in Margins, and it currently only fires on the exact
frame the figure is on the floor. Players (early readers especially) press jump a hair
late after walking off a line, or a hair early before landing, and the game
silently ignores them. That reads as "the game is broken", not "I missed".
Three standard platformer techniques make the jump forgiving and expressive.

## Behavior

1. **Coyote time.** For a short window after the figure leaves the floor
   *without jumping* (walking off a line's edge), a jump press still jumps.
2. **Jump buffering.** A jump pressed shortly *before* landing is remembered
   and fires on the frame the figure lands.
3. **Variable jump height.** Releasing jump while still rising cuts the upward
   speed, so a tap gives a small hop and holding gives the full jump. Full
   (held) jump height is unchanged, so the existing level stays beatable.

A single jump consumes both the buffer and the coyote window, so neither can
produce a double jump.

## Tunables (`src/config.js`, under `PLAYER`)

| Name | Default | Meaning |
| --- | --- | --- |
| `coyoteTimeMs` | 100 | Grace window to jump after leaving the floor |
| `jumpBufferMs` | 120 | How long an early jump press is remembered |
| `jumpCutMultiplier` | 0.5 | Upward speed is multiplied by this when jump is released while rising (1 = off) |

Timers count real milliseconds (`dt`), so they behave the same at any frame rate.

## Input

`GameScene.readInput()` gains `jumpHeld` alongside the existing one-frame
`jump` press. Both are built from keyboard (Space / Up / W) and the touch jump
button, so all three behaviors work identically on keyboard and touch.

## Implementation notes

- All logic lives in `StickFigure.update()`: two countdown timers
  (`coyoteTimer`, `jumpBufferTimer`) and a `jumpCutAvailable` flag set on
  take-off and cleared once the cut is applied or the figure starts falling.
- Landing squash is applied *before* the jump check, so a buffered jump that
  fires on the landing frame shows the take-off stretch, not the squash.

## Out of scope

Air control changes, double jump, wall jump, acceleration/friction on walking.

- Timers are checked *before* they drain each frame. Draining first silently
  shortened both windows by one frame (found in testing: a jump 70 ms after
  walking off a ledge was rejected with a 100 ms window).

## Verified (headless Chrome, scripted frame-by-frame input)

- Coyote: jump 40 ms and 70 ms after walking off a ledge fires in mid-air;
  150 ms does not.
- Buffer: press ~50 ms and ~100 ms before landing fires on landing; ~250 ms does not.
- No double jump: mashing jump in the air gives exactly one take-off.
- Variable height, real keyboard and real touch: 40 ms tap ≈ 60–66 px,
  500 ms hold = 132 px. Injected 1-frame tap = 39 px.

## Accessibility note (early reader test)

Short taps now give lower hops. Climbing three ruled lines (the level's tallest
step) needs the jump held, not tapped. The shortest possible tap still clears
one ruled line (36 px). If young players struggle, raise `jumpCutMultiplier`
toward 1.
