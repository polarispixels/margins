# The home page as a newspaper comics page

**Date:** 2026-11-03 · **Status:** approved, built 2026-11-03

## Intent

The comic page (`ComicPageScene`) is the game's home screen and level picker. Today it is
one row of four single-panel strips. It should become a **Sunday comics page**: a big
banner at the top, then strips stacked down a page taller than the screen, each strip a
title plus a row of 3 to 4 panels. **The page is the world map, strips are worlds, panels
are levels.** It should read as "a newspaper full of playable comic strips", while keeping
Margins' look: notebook paper, boiling pencil, the red margin line.

Why now: the backlog has many worlds, and the current one-row page has no room for them.
Laying the page out as a newspaper shows what exists and what's coming, and leaves room to
add levels without redesigning the screen.

The stick figure still gets around the page himself: he walks along a pencil line under
each strip and jumps up into a panel to play it. A **ladder down the margin** connects the
strips, so he climbs up and down between rows.

## Goals

- Newspaper structure: masthead banner, stacked strips, strip titles, 1 to 4 panels per
  strip, narrow gutters, a page that scrolls vertically.
- A ladder in the margin connecting every strip's walking line; climbing up and down.
- All existing levels and modes keep working from their panels, including the zoom in and
  out, finished art, and Climb's best score.
- Locked "coming soon" panels for the backlog worlds.
- Adding a strip or a panel later is data (a new entry), not new layout code.

## Non-goals (this round)

- Building the new Getting Started levels (panels 2 and 3). They appear, locked.
- New Climb or Read variations. Their extra slots are empty outlines.
- Any of the backlog worlds themselves.
- Progression or unlocking rules. Everything that's built is open from the start.
- Ropes on the home page. The ladder is the only way between rows.

## Anti-goals (failure even if it works)

- It stops feeling like Margins: no pencil boil, a flat clean menu, off-white newsprint
  replacing the notebook paper.
- More than one big word on screen at a time, or words an early reader can't read.
- An early reader gets stuck: can't find the ladder, can't get off it, or can't tell
  locked panels from open ones.

## The page, top to bottom

Notebook paper, ruled lines, red margin line, and holes as now, just taller (it scrolls).

1. **Masthead.** "MARGINS" in big pencil letters inside a page-wide box, with a double
   rule on each side of the word, like a newspaper nameplate. No date line, no other words.
2. **GETTING STARTED.** Three panels: **WALK** (today's tutorial, `GettingStartedScene`),
   **LADDER**, **ROPE**. LADDER and ROPE are locked for now (see below).
3. **LAUNCH.** One wide panel spanning the strip: Launch stays a single world.
4. **CLIMB.** The current Climb mode in the first panel, then two empty slots.
5. **READ.** The current Read mode in the first panel, then two empty slots.
6. **Coming soon**, four locked panels per strip, each showing one noun from the backlog:
   FLY, FARM, SEA, JUNGLE / SPACE, ICE, DINO, CITY / CANDY, GHOST, DIG, BUGS.
   ("Beach" and "Under the sea" are folded into SEA. "Arctic" is ICE, "Dinosaur valley"
   DINO, "Construction site" DIG, "Haunted house" GHOST, "Garden" BUGS, "Candy land"
   CANDY. Kitchen is not listed separately: it's the natural home for FLY.)

The mockup the user picked (option B, the margin ladder) is the reference for structure:
banner, then each strip as title, panels, and a walking line below with room for the
figure to stand and jump.

### Panel kinds

| Kind | Looks like | Does |
|------|-----------|------|
| Open | Solid pencil frame, its art, and its word | Jump into it or tap it: zoom in and play |
| Done | Open, showing its finished story art (as today, via `progress.js`) | Same as open |
| Locked | Faint frame, a faint sketch of the world (a fly, a ghost...), its noun, a small pencil lock | Jump into it or tap it: a little wiggle, nothing opens |
| Empty slot | A dashed, faint outline | Nothing. Not solid, not tappable |

**Every panel follows one pattern: its art, and one word** (WALK, LADDER, ROPE, LAUNCH,
CLIMB, READ, FLY, FARM...). Locked panels use the same pattern, drawn faint. A locked
panel's frame must look clearly different from an open one (faint and grey vs. solid
pencil), so an early reader can tell them apart without reading.

**Labels vs. instructions.** The masthead, strip titles, and panel words are *labels*: names
a parent can read aloud, like the name of a cartoon. They are always on the page and don't
count against "one big word at a time", which is about *instructions* (WALK, JUMP, CLIMB)
written in the moment. Labels are drawn smaller than instruction words. This settles the
open question about strip titles in `docs/PHILOSOPHY.md`, which is updated in the same
commit (and CLIMB is added to its proposed vocabulary).

## Moving around

- **Walking lines.** Each strip has its own ruled line below its panels. Panels sit just
  above the figure's head, as now, so even a small hop reaches them.
- **The margin ladder.** One ladder runs down the margin, between the hole punches and the
  red line, from the top strip's line to the bottom strip's. On the home page each walking
  line runs through the red line into the margin to reach it, and the left edge of the
  paper is the wall instead of the red line (the red line is still drawn).
- **Climbing.** Touching the ladder and pressing Up or Down climbs it. Up is also jump,
  so Up grabs the ladder only while he's touching it; anywhere else it jumps as always.
  While climbing he doesn't fall. At a walking line, Left or Right steps off onto it.
  Climbing past the top or bottom line stops there.
- **The word CLIMB** is written beside the ladder the first time he reaches it (one word
  at a time, as with WALK and JUMP today).
- **Touch buttons.** At the ladder, the buttons switch to ▲ ▼ for climbing (plus ◀ ▶ to
  step off). Away from it they're the usual ◀ ▶ and jump.
- **Scrolling.** About two strips fit on a phone screen. The camera follows him up and
  down smoothly; the banner scrolls away with the page. Wider screens show more page to the
  right, as now.
- **Tapping.** Tapping an open panel opens it, as in Read. Tapping a locked one wiggles it.
- **Where he starts.** First visit: on the Getting Started line, with WALK written by him,
  as today. Coming back from a level: under the panel he just left, the page already
  scrolled there, then the zoom out as today.

## Structure: data, not layout code

The strips are a list, each with a title and its panels. Each panel lists its kind, its
art, and the scene it starts (if open). The scene lays out whatever the list says: strip
heights, panel widths (equal shares of the strip, or one wide panel), the walking lines,
and the ladder's length. Adding a strip or turning a locked panel into an open one means
editing the list.

## Decided with Ryan

- The newspaper structure from his brief and mockups, keeping the notebook paper and pencil
  look rather than off-white newsprint.
- Getting Started is its own strip with three panels: walk/jump, ladder, rope. Later it
  becomes one little dog story across the three panels (panel 1 is today's level; the dog
  runs off and he chases it with ladders; then a rope swing to the happy ending). That's a
  separate project, brainstormed after this one.
- Launch stays its own single-panel world.
- Climb and Read each get their own strip, with room for more levels.
- A locked placeholder for every backlog idea, each named with one simple noun.
- One ladder down the margin, by every row (not ladders zig-zagging between strip ends).
- Everything that's built is open from the start.
- Every panel shows its art and a noun, as one consistent pattern, locked ones included.

## Claude's calls (please check these)

- Walking lines cross the red line into the margin to reach the ladder; the paper's left
  edge is the wall on the home page.
- "Art and a noun" applies to open panels too (each gets its one word), not only locked ones.
- The ladder tutorial panel is called LADDER, not CLIMB, so it doesn't clash with the
  Climb strip.
- Launch's panel is one wide panel rather than one normal-sized panel.
- Climb and Read show two dashed empty slots each, to say "more coming" without words.
- Coming-soon strips have no titles. A long strip title like COMING SOON would fail the
  early reader test, and the lock plus the faint drawing already say it. The title line is
  left as a bare rule.
- The masthead is the word MARGINS only.
- Locked panels wiggle when bumped or tapped, like a wrong answer in Read; no sound.
- Touch buttons switch to ▲ ▼ at the ladder.

## Left to the builder

- Exact sizes: strip height, gutters, panel proportions, ladder width and rung spacing,
  scroll speed and easing. Strip titles stay in pencil (`PencilWord`) and fit their strip.
- The art for the new LADDER and ROPE panels and the twelve locked worlds (simple, in the
  style of the existing panel art).
- How climbing is built (a climbing state on `StickFigure`, a ladder object, or similar)
  and its pose (a simple hand-over-hand climb is enough). Ladder tunables go in
  `src/config.js`.
- How the camera, `watchScreen`, and the zoom in and out work on a page taller than the
  screen.
- Keeping the docs page and `CLAUDE.md` up to date in the same commit, per the conventions.
