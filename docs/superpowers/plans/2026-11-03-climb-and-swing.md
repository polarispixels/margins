# CLIMB and SWING Tutorials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two Getting Started tutorial levels (CLIMB with a cat, SWING with a monkey), open them from the home page, and rename the Climb game's label to UP.

**Architecture:** A reusable `Guide` (an animal that follows a scripted list of steps, waiting for the player between them) drives both levels. Art for the cat and monkey lives in `animalArt.js`; their sounds in `audio.js`. `RopeSwings` gains constructor options so SWING can place its own ropes without touching Launch. Each level is its own scene; the home page's strip data opens them.

**Tech Stack:** Phaser 4 (Arcade physics), Vite, plain JS, `node --test`, Playwright for browser checks.

**Spec:** `docs/superpowers/specs/2026-11-03-climb-and-swing-design.md`

## Global Constraints

- Landscape for both levels (`useLayout(this, LANDSCAPE)`), `watchScreen`, `PlayerInput`, `fadeInFromPaper`, return with `scene.start('ComicPage', { returningFrom: <id> })` after `markComplete(<id>)` (progress.js).
- Panel ids / scene keys: CLIMB = id `learn-climb`, scene `LearnClimb`; SWING = id `learn-swing`, scene `LearnSwing`.
- No dangers, no fail state. Falls only put you back nearby.
- One instruction word at a time, via `PencilWord`: CLIMB (first ladder), UP! (first spring), SWING (first rope).
- The animal always shows a move before the player needs it, waits where the player can see it, and never leaves the screen.
- Everything drawn in boiling pencil (`pencil.js`); friendly, never scary.
- Tunables in `src/config.js` (new `LEARN` block); layout numbers only for one scene may sit at the top of its file.
- Launch, Climb (UP), Read, GettingStarted and the home page must behave as before apart from the planned changes.
- Docs (`public/docs/index.html`, `CLAUDE.md`) updated with behavior changes.

## Review Focus

1. Every beat is reachable by a player who copies the animal (springs/paperclips land on the intended line; rope gaps are crossable with a pump). Task 3/4 browser checks walk each beat.
2. The animal waiting off-screen: with the camera scrolled (CLIMB scrolls up), the waiting animal must be on screen. Task 3 check.
3. Falling: off a CLIMB line lands on a lower line; into a SWING gap puts him back at the gap's near edge within ~1s, never stuck. Task 3/4 checks.
4. Touching the animal at the end finishes exactly once (no double `markComplete`/scene start). Task 3/4.
5. Launch's ropes still work exactly as before after the RopeSwings change. Task 2 check.

---

### Task 1: Animals, their sounds, and the Guide

**Files:** Create `src/objects/animalArt.js`, `src/objects/Guide.js`; Modify `src/audio.js`, `src/config.js` (add `LEARN` with `guideSpeed: 200`, `guideWaitDistance: 140`, `guideCallMs: 4000`).

**Interfaces (Produces):**
- `drawCat(g, rng, x, floorY, { pose = 'stand' | 'walk' | 'sit' | 'lick' | 'leap', facing = 1, time = 0, scale = 1, alpha = 1 })` and `drawMonkey(g, rng, x, y, { pose = 'stand' | 'walk' | 'hang' | 'cheer', facing = 1, time = 0, scale = 1, alpha = 1 })` in animalArt.js. For the cat, (x, floorY) is the paws' center on the line. For the monkey in `'hang'`, (x, y) is its hands; otherwise its feet on the line. Cat ≈ 50 px long at scale 1; monkey ≈ 55 px tall.
- `sfx.meow(variant = 0)` (0..2, slightly different pitch curves), `sfx.purr()`, `sfx.ooh()` (a cheerful two-note "ooh-ooh") in audio.js, same style as the existing `sfx` entries.
- `class Guide` in Guide.js: `constructor(scene, { draw, x, y, steps, sound })` where `draw(g, rng, x, y, opts)` is `drawCat` or `drawMonkey`, `sound()` plays its call, and `steps` is an array of `{ to: {x, y}, move: 'walk' | 'climb' | 'bounce' | 'swing' | 'drop', ms?: number }`. Behavior: it waits at its current spot (pose sit/stand, facing the player) until the player's center is within `LEARN.guideWaitDistance` of it, then calls `sound()` and performs the next step: `walk` moves along at `guideSpeed`; `climb` moves straight up/down at half speed; `bounce`, `drop`, `swing` follow an arc from the current spot to `to` over `ms` (default 700). After the last step it stays put. While waiting, if the player hasn't come close for `guideCallMs`, it plays `sound()` (and the cat uses `'lick'` briefly). Methods: `update(time, dt, player)`, `draw(time)`, `get done()` (no steps left and standing still), `get x`, `get y`, `contains(point)` (a generous box around it, like `Dog.contains`), `celebrate(time)` (draws a rising heart like Dog, pose `cheer`/`sit`, plays sound).
- No Phaser imports needed beyond what drawing requires (`scene.add.graphics()`).

- [ ] Step 1: Implement animalArt.js, the three sfx, and Guide.js.
- [ ] Step 2: Verify `npm run build`, `npm test` pass. Browser: on the ComicPage scene, create a Guide via `window.game` is not possible (ES modules), so verify visually in Task 3/4; here just check the other scenes start without errors.
- [ ] Step 3: Commit only these files: `Learn levels: cat and monkey art, their sounds, and the Guide`.

### Task 2: RopeSwings options

**Files:** Modify `src/objects/RopeSwings.js`, `src/scenes/LaunchScene.js` only if its call must change (it must not need to).

**Interfaces (Produces):** `new RopeSwings({ ropes = LAUNCH.ropes, top = LAUNCH.ropeTop, length = LAUNCH.ropeLength } = {})` — every use of `LAUNCH.ropes/ropeTop/ropeLength` inside the class goes through these. Rope tuning (`ropePump`, `ropeDamping`, `ropeMaxAngle`, `ropeReleaseBoost`) stays from LAUNCH. Split `draw(g, rng, floorY)` so the Launch scenery (trees + branch) stays in `draw`, and add `drawRopes(g, rng)` that draws only the ropes (used by SWING, which draws its own scenery). `draw` calls `drawRopes`.

- [ ] Step 1: Implement. Launch's `new RopeSwings()` and `draw` call stay unchanged.
- [ ] Step 2: Verify build/test; browser: start `Launch`, set `player.body.reset(1450, ...)` near the ravine or walk there, confirm `scene.ropes.ropes.length === 2` and a grab still happens (`ropes.holding` true after jumping at a rope). No page errors.
- [ ] Step 3: Commit: `RopeSwings: options for rope positions, top and length`.

### Task 3: CLIMB level (the cat)

**Files:** Create `src/scenes/LearnClimbScene.js`; Modify `src/main.js` (add to scene list), `src/config.js` (`LEARN.springSpeed`, `LEARN.paperclipSpeed`, tuned so each lands on its intended line).

**Interfaces:** Consumes Task 1 (`Guide`, `drawCat`, `sfx.meow/purr`), `Ladder` + `StickFigure` climbing (as used in ComicPageScene: `ladder.update(player, input)` before `player.update`, platform collider process callback `() => !player.climbing`), `drawSpring`/`drawPaperclip`/`SPRING_HALF_WIDTH`/`PAPERCLIP_HALF_WIDTH` from climbArt.js, `Platforms` (`new Platforms(scene, segments, { wall })`, segments `{ line, from, to }`), `drawPaper(scene, { bottom })`, `lineY`. Produces: `export const PANEL_ID = 'learn-climb'`, scene key `LearnClimb`.

Level (from the spec): a tall page, landscape, scrolling up. World y grows upward by using negative line indices or a tall page with the start near the bottom — builder's choice; camera follows the player vertically like ComicPageScene (`scrollY` eased toward the player, clamped to the page). Beats bottom to top: start line with cat → ladder (word CLIMB) → spring on a line, cat bounces to a higher line (word UP!) → paperclip, bigger launch → a ledge where the cat hops down to a lower line on the other side (no word) → a final ladder to the top line where the cat waits. Landing on a spring/paperclip (feet on its line, falling, within its half-width) launches the player at `LEARN.springSpeed` / `LEARN.paperclipSpeed` with a squash, like ClimbScene. Falling off a line just lands on a line below (lines are wide enough; the page's left edge and right edge are walls). Reaching the cat after its last step: `guide.celebrate`, `sfx.purr` + meow, `markComplete(PANEL_ID)`, after ~2.2 s fade back to `ComicPage` with `returningFrom: PANEL_ID`. Exactly once. Inputs during celebration are ignored.

- [ ] Step 1: Implement the scene and add it to `main.js`.
- [ ] Step 2: Browser check (Playwright; dev server on port 5199; scripts and `LD_LIBRARY_PATH` as in earlier tasks): start `LearnClimb`, then play it with real key holds, following the cat beat by beat, logging player position each beat: reaches the ladder, climbs, reaches the spring, is launched onto the next line, paperclip, drops down, final ladder, touches the cat → `ComicPage` active and `localStorage` progress has `learn-climb`. Screenshot each beat; look at them: the cat is on screen while waiting (Review Focus 2), words appear one at a time. Also: walk off a line edge → lands on a lower line, not stuck.
- [ ] Step 3: Commit: `CLIMB: a cat leads you up the page`.

### Task 4: SWING level (the monkey)

**Files:** Create `src/scenes/LearnSwingScene.js`; Modify `src/main.js`, `src/config.js` if needed (`LEARN.swing...` tunables).

**Interfaces:** Consumes `Guide` + `drawMonkey` + `sfx.ooh`, `RopeSwings({ ropes, top, length })` + `drawRopes` (Task 2), `update(time, dt, player, input)` returning `'grab'|'release'|null` (call before `player.update`, skip `player.update` while `ropes.holding` the way LaunchScene does — read LaunchScene ~lines 205–235 for the exact pattern), `sfx.grab`, `sfx.jump`. Produces `PANEL_ID = 'learn-swing'`, scene `LearnSwing`.

Level: side-scrolling landscape (camera follows x like Launch; world wider than the screen), one floor line with gaps. Beats: small gap with one rope (word SWING at the first rope) → wider gap that needs pumping → two ropes in a row over one long gap → last gap → the monkey at the end. Ropes hang from a drawn pencil branch or vine over each gap (SWING draws its own scenery). The monkey crosses each gap by swinging (Guide `swing` move) and waits on the far side. Falling into a gap: after ~0.8 s, fade-free reset to the near edge of that gap (standing). Reaching the monkey: `celebrate`, `sfx.ooh`, `markComplete`, back to ComicPage after ~2.2 s, exactly once.

- [ ] Step 1: Implement and register.
- [ ] Step 2: Browser check: play through with real inputs (grab by jumping at the rope, hold toward the far side to pump, jump to let go near the top of the forward swing), crossing every gap; deliberately fall once → reset to the near edge; touch the monkey → ComicPage active, progress has `learn-swing`. Screenshots per beat; look at them.
- [ ] Step 3: Commit: `SWING: a monkey leads you across the ropes`.

### Task 5: Home page and docs

**Files:** Modify `src/data/strips.js`, `tests/pageLayout.test.js`, `src/objects/ComicPanel.js`, `src/objects/worldArt.js` (if the faint sketches move there), `CLAUDE.md`, `public/docs/index.html`, `docs/PHILOSOPHY.md` (add `SWING` to in-use words), spec status.

- GETTING STARTED panels become `[WALK open getting-started, CLIMB open learn-climb (scene LearnClimb, art 'learn-climb'), SWING open learn-swing (scene LearnSwing, art 'learn-swing')]`. The Climb game strip title and panel word become `UP` (id `climb`, scene `Climb`, art `climb` unchanged). Update the tests to match (strip 0 words `['WALK','CLIMB','SWING']`, all open; strip 2 title `'UP'`).
- ComicPanel art: `learn-climb` unfinished = a faint ladder with a sitting cat at the top; finished = the figure standing with the cat and a heart. `learn-swing` unfinished = a faint rope with a hanging monkey; finished = the figure with the monkey and a heart. Use `drawCat` / `drawMonkey` and the existing `drawHeart`.
- Docs: describe both levels, the UP rename, new files, `LEARN` config rows.

- [ ] Step 1: Implement; `npm test` and build pass.
- [ ] Step 2: Browser: home page screenshot shows WALK/CLIMB/SWING open and UP; jump into CLIMB → `LearnClimb` starts; jump into SWING → `LearnSwing`; return with `returningFrom` places him under the right panel; after `markComplete`, finished art shows.
- [ ] Step 3: Commit: `Home page: open CLIMB and SWING, rename the Climb game to UP; docs`.
