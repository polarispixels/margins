# Newspaper Home Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `ComicPageScene` into a tall, scrolling newspaper comics page (masthead, stacked strips, open/locked/empty panels with art and a word) that the stick figure gets around by walking each strip's line and climbing a ladder in the margin.

**Architecture:** The page is data (`src/data/strips.js`) laid out by a pure function (`src/home/pageLayout.js`, tested in Node). The scene draws that layout, follows the figure with its own camera, and delegates ladder climbing to a `Ladder` object plus a climbing state on `StickFigure`. Panel drawing (kinds, word, art scaling, wiggle) lives in `ComicPanel`; new drawings in `src/objects/worldArt.js`.

**Tech Stack:** Phaser 4 (Arcade physics), Vite, plain JS ES modules, `node --test` for pure logic, Playwright (headless) for in-browser checks.

**Spec:** `docs/superpowers/specs/2026-11-03-newspaper-home-page-design.md`

## Global Constraints

- Look: notebook paper, boiling pencil (`pencil.js`), red margin line drawn. No off-white newsprint, no flat UI.
- All on-screen words via `PencilWord`, uppercase. Instruction words (WALK, JUMP, CLIMB): one at a time. Labels (MARGINS, strip titles, panel words) always shown, drawn smaller than instruction words.
- Strips, in order: GETTING STARTED [WALK open, LADDER locked, ROPE locked]; LAUNCH [one wide open panel]; CLIMB [CLIMB open, empty, empty]; READ [READ open, empty, empty]; then three untitled strips of locked panels: FLY FARM SEA JUNGLE / SPACE ICE DINO CITY / CANDY GHOST DIG BUGS.
- Everything built is open from the start (no unlock rules).
- Tunables in `src/config.js`; layout numbers only meaningful to one file may sit at its top.
- Phone landscape first; `useLayout(this, LANDSCAPE)`, `watchScreen(this, fit)`, `PlayerInput` everywhere.
- Keep files focused, functions short, comments for the "why" (readable for a learner).
- No real names anywhere in the repo.
- Existing scenes (GettingStarted, Launch, Climb, Read) must behave exactly as before; they return with `scene.start('ComicPage', { returningFrom: <id> })`.

## Review Focus

1. Climbing down from a line: standing on a walking line at the ladder and pressing Down must climb down through the line (no getting stuck on the floor collider). Owned by Task 4's browser check.
2. Pressing Up at the ladder must climb, not jump; pressing Up away from it must still jump. Task 2 (jump buffer cleared on `startClimb`) + Task 4 check.
3. Stepping off: Left/Right while climbing near a line lands him on it; Left/Right between lines does nothing (he stays on the ladder). Task 4 check.
4. Returning from a level on a lower strip (e.g. Read): he stands under that panel, the camera is scrolled there, the zoom-out ends there and doesn't snap back to the top. Task 4 check.
5. Taps on the touch buttons must not also count as taps on a panel behind/near them. Task 4.

---

### Task 1: Page data and layout (pure, tested in Node)

**Files:**
- Create: `src/data/strips.js`, `src/home/pageLayout.js`, `tests/pageLayout.test.js`
- Modify: `src/config.js` (add `HOME`), `package.json` (add `"test": "node --test tests/"`)

**Interfaces:**
- Produces:
  - `STRIPS` (array) from `src/data/strips.js`. Each strip: `{ title: string ('' for none), panels: Panel[] }`. Panel is one of:
    - open: `{ kind: 'open', id: string, word: string, art: string, scene: string, wide?: true }`
    - locked: `{ kind: 'locked', word: string, art: string }` (art = the lowercased word, e.g. `'fly'`, `'ladder'`)
    - empty: `{ kind: 'empty' }`
    Open ids/scenes (strings, do NOT import scene files — this module must load in Node): `getting-started`/`GettingStarted` (word WALK, art `getting-started`), `launch`/`Launch` (word LAUNCH, art `launch`, `wide: true`), `climb`/`Climb` (word CLIMB, art `climb`), `read`/`Read` (word READ, art `read`).
  - `layoutPage(strips) -> { masthead: {x,y,width,height}, strips: StripLayout[], ladder: {x, width, top, bottom, landings: number[]}, pageHeight: number }` from `src/home/pageLayout.js`, where `StripLayout = { title, titleY, floorLine, floorY, panels: Array<Panel & {x,y,width,height}> }`. `titleY` is the y of the ruled line the title sits on; `floorLine` is a ruled-line index (for `Platforms`), `floorY = lineY(floorLine)`. `ladder.landings` = every strip's `floorY`; `top`/`bottom` = first/last landing.
  - `HOME` in config: `{ firstTitleLine: 2, stripLines: 7, floorOffsetLines: 6, contentLeft: 140, contentRight: 940, gutter: 16, panelGapBelowTitle: 8, headroom: 18, ladderX: 84, ladderWidth: 32, mastheadTop: 10, bottomLines: 2 }`.
- Consumes: `lineY` from `src/objects/Paper.js`, `PLAYER.bodyHeight` (60) and `PAPER` from config.

Layout rules (values in `HOME`): strip i's title line index = `firstTitleLine + i*stripLines`; floor line = title line + `floorOffsetLines`. Panels: top = `titleY + panelGapBelowTitle`, bottom = `floorY - PLAYER.bodyHeight - headroom`. Panels span `contentLeft..contentRight`; n panels get equal widths with `gutter` between; a `wide` panel takes the whole span. Masthead: x = `contentLeft`, y = `mastheadTop`, width = span, bottom = `lineY(firstTitleLine) - 40` (leaves room for the first title). `pageHeight = lastFloorY + bottomLines * PAPER.lineSpacing`.

- [ ] **Step 1: Write the failing tests** in `tests/pageLayout.test.js` (`node:test` + `node:assert/strict`):
  - `strips data`: 7 strips; titles `['GETTING STARTED','LAUNCH','CLIMB','READ','','','']`; panel words of strip 0 are `['WALK','LADDER','ROPE']` with kinds `['open','locked','locked']`; locked words across strips 4–6 equal `['FLY','FARM','SEA','JUNGLE','SPACE','ICE','DINO','CITY','CANDY','GHOST','DIG','BUGS']`; strips 2 and 3 are `[open, empty, empty]`.
  - `floors sit on ruled lines`: strip 0 `floorLine === 8`, strip 1 `floorLine === 15`; `floorY === lineY(floorLine)`.
  - `panels sit just above his head`: for every panel, `y + height === floorY - 60 - 18`, and `y === titleY + 8`.
  - `widths`: strip 0's three panels have equal width `(800 - 2*16)/3` and start at x 140; the Launch panel has x 140, width 800.
  - `ladder`: `x === 84`, `landings` has 7 entries equal to the strips' floorYs, `top === landings[0]`, `bottom === landings[6]`.
  - `pageHeight === layout.strips[6].floorY + 72`.
  - `masthead` is above the first strip title: `masthead.y + masthead.height < strips[0].titleY - 30`.
- [ ] **Step 2: Run** `npm test` — expected: FAIL (modules missing).
- [ ] **Step 3: Implement** `strips.js`, `HOME`, `layoutPage`, and the `test` script.
- [ ] **Step 4: Run** `npm test` — expected: all pass. Also `npm run build` succeeds.
- [ ] **Step 5: Commit** only these files: `git add src/data/strips.js src/home/pageLayout.js tests/pageLayout.test.js src/config.js package.json && git commit -m "Home page: strip data and page layout"`

---

### Task 2: Ladder climbing (StickFigure climbing state, Ladder object, touch layout)

**Files:**
- Create: `src/objects/Ladder.js`
- Modify: `src/objects/StickFigure.js`, `src/objects/TouchControls.js`, `src/config.js` (add `PLAYER.climbSpeed: 170`, `PLAYER.landingSnap: 10`)

**Interfaces:**
- Produces on `StickFigure`:
  - `climbing` (boolean, false initially)
  - `startClimb(x: number)`: sets `climbing = true`, centers the body on x, zeroes velocity, `body.setAllowGravity(false)`, clears `jumpBufferTimer`, `coyoteTimer`, `jumpCutAvailable`, `carryX`.
  - `stopClimb()`: `climbing = false`, `body.setAllowGravity(true)`, zero velocity.
  - In `update(input, dt)` while climbing: vx = 0, vy = `(input.down - input.up) * PLAYER.climbSpeed`, no jumping/walking; a `climbPhase` advances while moving and drives the pose. Set `this.onFloor = false` while climbing.
  - Climbing pose in `pose(time)` (checked before the dance/floor/air branches): facing the page — arms up alternately reaching (e.g. `armA = 2.5 ± 0.4*sin(climbPhase)`, `armB = -2.5 ± ...` out of phase), legs bending alternately (`legA/legB` around ±0.3 with the same phase). Exact numbers are the builder's.
- Produces `Ladder` in `src/objects/Ladder.js`:
  - `constructor(scene, { x, width, top, bottom, landings })` — x is the ladder's center. Its own Graphics.
  - `touches(player) -> boolean`: `|player.body.center.x - x| < width/2 + 6` and the player's feet (`body.bottom`) within `[top - 4, bottom + 4]`.
  - `update(player, input)` — call BEFORE `player.update`. Rules:
    1. Not climbing, touching, and `input.up` → `startClimb(x)` unless feet are at the top landing (within `landingSnap`); `input.down` → `startClimb(x)` unless feet at the bottom landing.
    2. Climbing: clamp feet between `top` and `bottom` (via `body.reset` / position + zero vy when hitting an end).
    3. Climbing and (`input.left || input.right`) and feet within `landingSnap` of a landing → put feet exactly on that landing (`body.reset(x, landing - PLAYER.bodyHeight/2)`), `stopClimb()`.
  - `draw(time)`: two pencil rails from `top - 20` to `bottom`, rungs every 18px, boiling (`boilRng(time, seed)` + `pencilLine`), `COLORS.pencil`.
- Produces in `TouchControls`: a `'ladder'` layout = platformer's `left`/`right` buttons plus `up` and `down` where flight puts them. `draw` must draw ▲ ▼ arrows for up/down the way flight does.
- Consumes: nothing from Tasks 1/3.

- [ ] **Step 1:** Implement the StickFigure climbing state and pose; existing behavior with `climbing === false` must be unchanged.
- [ ] **Step 2:** Implement `Ladder.js` and the `'ladder'` touch layout.
- [ ] **Step 3:** Verify: `npm run build` succeeds; then the smoke script in Task 4's "Browser checks" section can't run yet, so instead load the dev server and confirm GettingStarted, Launch, Climb, Read still start with no console errors (use the Playwright snippet in Task 4, scene list only).
- [ ] **Step 4: Commit** only these files: `git commit -m "Ladder climbing: climbing state, Ladder, ladder touch layout"`

---

### Task 3: Panels: kinds, a word, scaled art, wiggle; world drawings

**Files:**
- Create: `src/objects/worldArt.js`
- Modify: `src/objects/ComicPanel.js`

**Interfaces:**
- Produces `drawWorld(g, rng, name, cx, cy, size, alpha = 1)` in `worldArt.js`: a simple boiling-pencil sketch centered at (cx, cy) fitting a `size` box, for names `ladder, rope, fly, farm, sea, jungle, space, ice, dino, city, candy, ghost, dig, bugs` (e.g. fly: a fly with wings; farm: a barn; sea: waves and a fish; jungle: a palm and vine; space: a planet with a ring and stars; ice: a penguin or igloo; dino: a long-neck dinosaur; city: buildings; candy: a lollipop; ghost: a friendly ghost; dig: a digger; bugs: a ladybug; ladder: a ladder with a little guy; rope: a rope swing over a gap). Unknown name draws nothing. Reuse helpers in `pencil.js` (and existing art modules where handy). Friendly, never scary.
- Changes `ComicPanel`:
  - Constructor becomes `constructor(scene, rect, { kind = 'open', word = '', art, completed = false, best = 0 } = {})`.
  - Every non-empty panel shows `word` as a `PencilWord` label centered near the bottom inside the frame (size ≈ 20, `align: 'center'`), and its art scaled into the area above the word. Existing art (getting-started, launch, climb, read) was drawn for a 185×298 panel: draw it relative to a reference box and fit it with `artGraphics.setPosition/setScale` (or equivalent), keeping aspect, so it fits panels of ~188×130 and the wide 800×130 one (centered). Drop the old `readWord` ('CAT'); keep the Climb best score in the top-left corner.
  - `kind: 'locked'`: frame drawn faint (`alpha ≈ 0.35`), art via `drawWorld(..., alpha ≈ 0.35)`, word faint, plus a small pencil padlock in the top-right corner.
  - `kind: 'empty'`: a faint dashed pencil outline only (short `pencilLine` dashes); no word, no art.
  - `wiggle(time)`: like `PictureCard.wrong` — the whole panel (frame, art, word) shakes sideways ~10px, settling over ~450ms. Works for any kind.
  - `contains(x, y) -> boolean` (world coords) for taps.
  - `isEnteredBy(player)` unchanged in meaning; returns false for `empty`.
  - `showCompleted()` unchanged.
- Consumes: nothing from Tasks 1/2 (rects are passed in).

- [ ] **Step 1:** Implement `worldArt.js`.
- [ ] **Step 2:** Update `ComicPanel.js` as above.
- [ ] **Step 3: Verify** `npm run build` succeeds. (Visual check happens in Task 4.)
- [ ] **Step 4: Commit** only these files: `git commit -m "Comic panels: open, locked, empty; a word; scaled art; world sketches"`

---

### Task 4: The newspaper page scene

**Files:**
- Modify: `src/scenes/ComicPageScene.js` (rewrite), `src/objects/Paper.js`

**Interfaces:**
- Consumes: `STRIPS`, `layoutPage`, `HOME` (Task 1); `Ladder`, `StickFigure.climbing/startClimb/stopClimb`, `'ladder'` touch layout (Task 2); `ComicPanel` new constructor, `wiggle`, `contains`, `isEnteredBy` (Task 3).
- Produces in `Paper.js`: `drawPaper(scene, { bottom = HEIGHT } = {})` — sheet, ruled lines and margin lines extend down to `bottom`; hole punches repeat the `PAPER.holeYs` pattern every `HEIGHT` px down to `bottom`. Default call unchanged for other scenes.

Scene behavior (from the spec):
- `create(data)`: `useLayout(this, LANDSCAPE)`; `layout = layoutPage(STRIPS)`; `drawPaper(this, { bottom: layout.pageHeight + HEIGHT })`; one `Platforms` segment per strip `{ line: floorLine, from: 0, to: PAGE_MAX_WIDTH }` (lines run through the red line into the margin); collider with process callback `() => !this.player.climbing`; `Ladder` from `layout.ladder`; masthead: pencil box + `PencilWord('MARGINS', ...)` (size ≈ 56) centered + a double rule each side; strip titles: `PencilWord` size 22 left-aligned at `contentLeft`, baseline on `titleY`, followed by a pencil rule to `contentRight` (untitled strips: just the rule); panels from layout via `ComicPanel`, `completed: isComplete(id)`, `best: highScores('climb')[0]?.score` for Climb, same "just finished" handling as today.
- Camera: no `fitToScreen`. Pass a fit function to `watchScreen` that sets `physics.world.setBounds(0, 0, scale.width, layout.pageHeight)` (left edge = wall) and camera bounds `(0, 0, PAGE_MAX_WIDTH, max(pageHeight, scale.height))`. Each frame (not while entering): `targetY = clamp(player feet y - scale.height * 0.7, 0, pageHeight - scale.height)`; ease `scrollY` toward it (`1 - exp(-dt*6)`); `scrollX = 0`.
- Each frame: `input = controls.read()`; `ladder.update(player, input)`; `player.update(input, dt)`; touch layout `'ladder'` when `ladder.touches(player) || player.climbing`, else `'platformer'`; panel bump → open: `enter(panel)`; locked: `panel.wiggle(time)` + `player.bonk()` (once per bump: only when rising). Draw everything; `controls.draw(time)`.
- Words: WALK at the start on a first visit (as today, near `START_X` on strip 0); JUMP written inside an open panel's upper area when he's under it (as today, only one instruction word at a time); CLIMB written beside the ladder (x ≈ ladder.x + 30, ~110px above the landing) the first time this visit he touches the ladder, fading when he leaves it. Showing any instruction word fades the others.
- Taps: `pointerdown` → ignore while entering, or if the pointer is within `TOUCH.buttonRadius * 1.25` of any current touch button; otherwise find a panel with `contains(pointer.worldX, pointer.worldY)`: open → `enter`, locked → `wiggle`.
- Enter/zoom: as today (pan + zoom to the panel, then `scene.start(def.scene)`). Zoom out on return: start the player on the returning panel's strip floor under it; compute the normal scroll for that position; start zoomed on the panel; pan/zoom back to `(scale.width/2, normalScrollY + scale.height/2)` at zoom 1; then set `scrollY = normalScrollY` and resume.
- Remove the old single-row `PANELS` table and `fittedTitle`.

- [ ] **Step 1:** Implement `drawPaper`'s `bottom` option.
- [ ] **Step 2:** Rewrite `ComicPageScene.js`.
- [ ] **Step 3: Browser checks.** Start `npx vite --port 5199 --strictPort` in the background. Write a Playwright script in the scratchpad dir `/tmp/claude-1000/-home-rgris-code-margins/1b3ac3ff-de24-41c4-9285-395149f78d4b/scratchpad/` importing `/home/rgris/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs`; run node with `LD_LIBRARY_PATH=/tmp/claude-1000/-home-rgris-code-margins/1b3ac3ff-de24-41c4-9285-395149f78d4b/scratchpad/libs/root/usr/lib/x86_64-linux-gnu`. Hold keys with `keyboard.down` → wait ≥60ms → `keyboard.up` (zero-length presses don't register). `window.game` is exposed in dev. Assert, with no page errors:
  1. First load (960×540): screenshot shows masthead + Getting Started strip; player on strip 0 floor.
  2. Walk left to the ladder, hold Down ~2s: `player.climbing` true, then feet pass strip 1's floor (Review Focus 1); camera `scrollY` > 0.
  3. Press Right near strip 1's landing: `climbing` false, feet on strip 1's floor (Review Focus 3). Away from the ladder, Up jumps (vy < 0), climbing stays false (Review Focus 2).
  4. Jump into a locked panel → it wiggles, no scene change. Jump into the Launch panel → `Launch` becomes active.
  5. `game.scene.getScene('Launch').scene.start('ComicPage', { returningFrom: 'read' })` → after ~1.5s, player is under the Read panel on strip 3's floor and scrollY shows it (Review Focus 4).
  6. Phone size 844×390 with `hasTouch`: screenshot; touch layout is `'ladder'` when at the ladder; tapping the Climb panel (convert world → page coords via canvas rect and camera scroll) starts `Climb`.
  7. GettingStarted, Launch, Climb, Read each start with no errors.
  Save screenshots in the scratchpad; report their paths.
- [ ] **Step 4: Commit** only these files: `git commit -m "Home page: a newspaper of comic strips with a ladder in the margin"`

---

### Task 5: Docs

**Files:**
- Modify: `CLAUDE.md`, `public/docs/index.html`, `docs/PHILOSOPHY.md`, spec status line

- [ ] **Step 1:** `CLAUDE.md`: Concept bullets describe the newspaper page, the margin ladder, the strips; folder structure lists `src/data/strips.js`, `src/home/pageLayout.js`, `src/objects/Ladder.js`, `src/objects/worldArt.js`, `tests/`; add `npm test` to "Running it"; mention climbing (`StickFigure.startClimb`, `Ladder.update` before `player.update`, collider off while climbing).
- [ ] **Step 2:** `public/docs/index.html`: update the comic page description, controls table (ladder: Up/Down at the ladder, Left/Right to step off; phone ▲ ▼ at the ladder), file tree, and the config table (`HOME`, `PLAYER.climbSpeed`, `PLAYER.landingSnap`).
- [ ] **Step 3:** `docs/PHILOSOPHY.md`: replace the strip-title open question with the labels vs. instructions rule from the spec; add `CLIMB` to "Proposed, not yet confirmed"; note panel words are labels.
- [ ] **Step 4:** Spec status → "approved, built". `npm test` and `npm run build` pass.
- [ ] **Step 5: Commit** `git commit -m "Docs: the newspaper home page and the ladder"`
