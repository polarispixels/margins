# Getting Started: the comic page and the first tutorial panel

**Date:** 2026-11-02 · **Status:** approved to build ("build the next part")

## Intent

Replace the single test level with the navigation idea from
[PHILOSOPHY.md](../../PHILOSOPHY.md): a hand-drawn **comic page** where each strip
is a row of panels and each panel is a level. This first version has **one strip,
"Getting Started", with one panel**: a short tutorial that teaches WALK and JUMP
and tells a tiny story (a little guy is drawn, finds a sleeping dog, wakes it up).
Jack (early reader) must be able to play all of it with no help.

## Decided with Ryan

- Strip title: **"Getting Started"** (basic tutorials).
- **One panel** for now; more panels and strips come later.
- The figure walks along a line at the bottom of the comic page and **jumps up
  into a panel** to enter that level.
- The tutorial panel uses three ideas:
  1. **The page draws itself as you walk.** A pencil traces the line just ahead
     of the figure. The word **WALK** is written next to him at the start.
  2. **The word is the obstacle.** The line runs into the word **JUMP**, written
     in big solid letters standing on the line. He hops up and walks across them.
  3. **A friend at the end.** A sleeping doodle dog lies in a coffee ring. Touch
     it and it wakes up and wags. Back on the comic page, the panel now shows the
     figure with his dog.
- One big word at a time, right when it's needed; easy-reader words only.

## Builder's calls (Claude's decisions; review these)

- **The comic page is drawn on the same notebook paper**, as if a kid drew a
  comic strip in their notebook, keeping "it all lives on notebook paper."
  The title is written in the header space above the first ruled line.
- **Words on the comic page:** WALK at the start; it fades once the figure has
  walked a little, and JUMP is written inside the bottom of the panel when the
  figure stands under it. Only one word is on screen at a time.
- **Entering a panel:** the trigger is the figure's head rising past the panel's
  bottom edge while he's horizontally inside it. The panel's bottom edge sits low
  enough that even a quick tap-jump reaches it. The camera then zooms into the
  panel and the level starts.
- **Panel art:** before completion, a faint sketch of a little figure on a line.
  After completion, the figure, the dog, and a heart, fading in after the camera
  zooms back out. Completion is remembered on this device (`localStorage`,
  best effort; the game works without it).
- **Returning from a level:** the comic page opens zoomed into the panel and
  zooms out, with the figure standing under the panel.
- **No way to fail** in the tutorial: no gaps, no hazards. The whole floor is
  solid; the pencil always draws the line ahead of the figure faster than he walks.
- **JUMP letters** are about 46 px tall, so a quick tap clears them. Each letter
  is a solid box for physics; the gaps between letters are narrower than the
  figure, so he walks across the tops.
- **No "Page complete" text.** The dog waking up (wag, hop, heart) is the reward.
- **The old staircase level is retired** (it remains in git history and could
  return as a later panel; added to the "Not yet" list).
- **A small stroke font** (`PencilWord`) writes words in boiling pencil, letter by
  letter, so on-screen words match the art style and can be "written on."

## Structure

- `ComicPageScene` (start scene) and `GettingStartedScene` replace `GameScene`.
- Shared pieces extracted so every scene behaves the same: `input.js`
  (keyboard + touch → `{ left, right, jump, jumpHeld }`), `screen.js` (fit to any
  screen), `progress.js` (completed panels).
- New objects: `PencilWord` (stroke-font words), `Dog`, `DrawingPencil` (the
  pencil that traces the line). `Platforms` takes a list of segments instead of
  reading a fixed level.
- New pencil helpers: `pencilEllipse`, `pencilPolyline`.

## Out of scope

More panels or strips, the dog following the figure, counting stars, sound,
choose-your-own-adventure, failure states.
