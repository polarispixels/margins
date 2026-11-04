# Margins

A tiny browser platformer that lives on a sheet of lined notebook paper.

- **Play:** https://polarispixels.github.io/margins/
- **Docs:** https://polarispixels.github.io/margins/docs/ (source: `public/docs/index.html`)
- **Repo:** https://github.com/polarispixels/margins (deploys to GitHub Pages on push to `main`)

**Read [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) before designing anything players will see.**
It is the foundation of the look and feel: who the game is for (all ages, with an early
reader as the benchmark), "one big word at a time, right when it's needed," how levels teach,
and what's deliberately out of scope for now.

## Concept

- A stick figure walks and jumps around a page of notebook paper.
- Everything is drawn in "pencil" and **boils**: lines are redrawn with a small
  random wobble several times a second, like a hand-drawn flipbook.
- The blue ruled lines are platforms. The red margin line on the left is a wall in the
  levels. On the home page the margin is walkable (the paper's left edge is the wall).
- The game opens on a **comic page** (`ComicPageScene`): a tall newspaper comics page
  with a masthead and strips stacked down the page, each a title and a row of panels.
  The page is the world map, strips are worlds, panels are levels. Walk along a strip's
  floor line and jump up into a panel to play its level. A **ladder in the margin**
  joins every floor: touch it and press Up or Down to climb, Left or Right to step off.
  The word CLIMB is written beside the ladder the first time he reaches it (no JUMP word
  on this page: it crowded the panel art, and Getting Started teaches jumping). Bumping a panel only counts
  on the strip he's standing on. Strips are data in `src/data/strips.js`; locked panels
  (a word and a faint picture) and empty slots mean "more coming". Panel words and strip
  titles are labels, not instructions.
- The first strip, "Getting Started", has three panels: WALK (`GettingStartedScene`: the line
  draws itself as you walk, the word JUMP is a solid obstacle, and a sleeping dog waits at the
  end), CLIMB (`LearnClimbScene`: a cat leads you up a ladder, a spring, a paperclip, a drop,
  and a last ladder) and SWING (`LearnSwingScene`: a monkey leads you across rope swings).
  Finished panels show their story art (saved in `progress.js`).
- The second strip, "Launch" (`LaunchScene`), is a long side-scrolling story level on one
  sheet: a forest with squirrels and birds, rope swings over a ravine, a river crossing
  (sinking lily pads, an alligator, a fish, a drifting log), a UFO chase (falling trees, a
  searchlight tractor beam, an alien on foot firing zaps), a red/blue/green switch puzzle
  at the rocket pad (the first colored pencil), then a rocket flight (Up/Down) past a
  fireball to a city. Checkpoint flags: falling in or getting caught sends you back to the
  last one. It has music and sound effects, made in code (`audio.js`), with a remembered mute button.
- The third strip, "UP" (the panel word is UP; the scene is still `ClimbScene`), is a separate **mode** (`ClimbScene`): an endless vertical
  platformer played in **portrait**, with the same walk and jump controls as the story
  levels. Springs and paperclips launch you, ink blots crawl on platforms (stomp them or
  lose), paper airplanes fly you up, and height milestones raise both rewards and danger.
  Initials and a top-five high score table are saved on the device.
- The fourth strip, "Read", is a **mode** (`ReadScene`): the reading game from
  `docs/reading-framework.md` (phases 1 and 2). Read a word, walk the stick figure under
  the matching pencil picture and jump up into it (or tap it); he does a random
  celebration dance when it's right. An adaptive engine (`src/reading/`) picks words and choices to keep the child
  near 85% success. The comic page is the mode picker.
- This is a learning / for-fun proof of concept. Keep it small.

## Tech stack

- [Phaser 4](https://phaser.io) (game framework, Arcade physics)
- [Vite](https://vite.dev) (dev server + bundler)
- Plain JavaScript (ES modules), no TypeScript, no framework
- No image assets: everything is drawn procedurally with `Phaser.GameObjects.Graphics`

## Folder structure

```
margins/
├── index.html              # Page shell, mobile viewport, "rotate your phone" hint
├── vite.config.js          # LAN dev server (host: true), relative base for GitHub Pages
├── package.json
├── tests/                  # Node tests for plain-JS logic (npm test)
├── README.md
├── docs/PHILOSOPHY.md      # Who it's for, on-screen words, look & feel, scope. Read first.
├── docs/superpowers/specs/ # Short design specs, one per feature
├── docs/reading-framework.md # The reading game's plan; Read mode builds phases 1 and 2
├── public/docs/index.html  # The docs page; Vite copies public/ into dist/ as-is
├── .github/workflows/deploy.yml  # Build + deploy to GitHub Pages on push to main
└── src/
    ├── main.js             # Creates the Phaser.Game (size, scaling, physics, scene list)
    ├── config.js           # All tunable numbers and colors live here
    ├── pencil.js           # Seeded random + wobbly "pencil" drawing helpers (the boil)
    ├── input.js            # PlayerInput: keyboard + touch -> { left, right, jump, jumpHeld, up, down }
    ├── screen.js           # useLayout (landscape/portrait), watchScreen, paper-colored fades
    ├── progress.js         # Finished panels, initials, top-five scores (localStorage, best effort)
    ├── audio.js            # Web Audio: unlock on first gesture, mute (saved), music, sound effects
    ├── milestones.js       # Climb difficulty by height: difficultyAt(), milestoneAt()
    ├── data/               # Plain data: strips.js (the home page), and Read's words.js, pictures.js, skills.js
    ├── home/
    │   └── pageLayout.js   # Home page math (no Phaser): strip rows, floors, panel boxes; unit-tested
    ├── reading/            # Read's engine, no Phaser: engine, distractors, mastery, patterns,
    │                       #   store (localStorage), speech (speechSynthesis), dates
    ├── scenes/
    │   ├── ComicPageScene.js       # The comic page (start scene): jump into a panel
    │   ├── GettingStartedScene.js  # The first tutorial panel (WALK)
    │   ├── LearnClimbScene.js      # Tutorial: a cat leads you up (ladder, spring, paperclip)
    │   ├── LearnSwingScene.js      # Tutorial: a monkey leads you across rope swings
    │   ├── LaunchScene.js          # Launch: wires the sections; checkpoints, rocket, flight, city
    │   ├── ClimbScene.js           # Climb mode (portrait): states, camera, blots, flight, milestones
    │   └── ReadScene.js            # Read mode: the word, picture cards, tap-to-hear, the round
    └── objects/
        ├── Paper.js        # Static background: paper, ruled lines, margin, holes; lineY()
        ├── Platforms.js    # Line segments (+ addSolid boxes): physics + boiling pencil trace
        ├── StickFigure.js  # Player physics, movement, walk cycle, squash and stretch
        ├── PencilWord.js   # Words in pencil via a tiny stroke font; write-on and fade
        ├── ComicPanel.js   # A comic panel: open, locked, or empty; frame, art, word, jump-in trigger
        ├── Ladder.js       # The margin ladder: touch + Up/Down starts a climb, Left/Right steps off
        ├── worldArt.js     # Small drawings for locked panels (one noun each)
        ├── Dog.js          # The doodle dog; drawDog/drawHeart for panel art
        ├── animalArt.js    # The cat and the monkey (drawCat, drawMonkey): guides and panel art
        ├── Guide.js        # A guide animal that waits for you, calls, then does its next step
        ├── DrawingPencil.js# The pencil that draws the line ahead of the figure
        ├── ClimbCourse.js  # Climb's random platforms and what's on them
        ├── climbArt.js     # Climb drawings: springs, paperclips, stars, blots, splats, planes
        ├── ClimbCards.js   # Climb's initials, start, and score cards (pencil buttons)
        ├── ScrollingPaper.js # Climb's endless notebook page
        ├── LongPaper.js    # Launch's long sheet of paper
        ├── launchArt.js    # Launch drawings: rocket, UFO, goo, trees, city, fireball, fireworks
        ├── Critters.js     # Launch: squirrels and birds
        ├── RopeSwings.js   # Launch: pendulum ropes over the ravine
        ├── River.js        # Launch: lily pads, alligator, fish, drifting log (moving bodies)
        ├── Chase.js        # Launch: the UFO's steps (trees, searchlights, alien), goo at the pad
        ├── Alien.js        # Launch: the alien on foot and its zaps
        ├── LaunchPuzzle.js # Launch: the colored switch puzzle and its clue
        ├── forestArt.js    # Drawings: squirrels, birds, ropes, ravine, water, alligator, fish, flags
        ├── chaseArt.js     # Drawings: toppling trees, tractor beam, the alien, zaps
        ├── puzzleArt.js    # Drawings: colored-pencil hatching, switches, clue note, fence
        ├── CoffeeRing.js   # A coffee ring stain
        ├── PictureCard.js  # Read: one picture card (wiggle, fade, circle, tap test)
        ├── dances.js       # The stick figure's celebration dances (pose functions)
        ├── PencilPicture.js# Draws a picture from data/pictures.js in boiling pencil
        └── TouchControls.js# On-screen left / right / jump buttons for phones
```

## How the boil works

`pencil.js` uses a tiny seeded random number generator. Each object redraws itself
every frame, but the seed only changes every `BOIL.intervalMs`, so the wobble
holds still between "boil ticks" and then jumps to a new shape, which is what
reads as a hand-drawn flipbook.

## Jump feel

`StickFigure.update()` adds coyote time, jump buffering, and variable jump height
(tap = small hop, hold = full jump). Tunables are `coyoteTimeMs`, `jumpBufferMs`,
and `jumpCutMultiplier` under `PLAYER` in `src/config.js`. Input arrives as
`{ left, right, jump, jumpHeld, up, down }` from `PlayerInput.read()` (`src/input.js`), built from both
keyboard and touch, so any new input source must fill in both `jump` (pressed this
frame) and `jumpHeld`. Design notes: `docs/superpowers/specs/2026-11-02-jump-feel-design.md`.

## Home page and the ladder

`ComicPageScene` builds its layout from `STRIPS` (`src/data/strips.js`) and the math in
`src/home/pageLayout.js`; numbers are under `HOME` in `src/config.js`. A panel is `open`
(playable), `locked` (a word and a faint picture from `worldArt.js`), or `empty`. The
camera follows him up and down the tall page. Climbing is a state on `StickFigure`
(`startClimb(x)`, `PLAYER.climbSpeed`): `Ladder.update()` runs before `player.update()`,
and the floor collider is off while climbing so he passes through the lines. The ladder's grab zone runs from the paper's left edge to its right rail. Within
`PLAYER.landingSnap` (40px) of a landing, a sideways press steps off onto the nearest one. On touch, `TouchControls`
shows its `ladder` layout (▲ ▼) at the ladder; there ▲ also counts as jump, so at the top
floor it jumps instead of climbing. Off-screen panels and words are hidden, not drawn. Design notes:
`docs/superpowers/specs/2026-11-03-newspaper-home-page-design.md`.

## Getting Started tutorials

Three panels teach one skill each: WALK (`getting-started`), CLIMB (`learn-climb`, scene
`LearnClimb`) and SWING (`learn-swing`, scene `LearnSwing`). Each level marks its panel
complete when you finish and returns to the comic page. CLIMB and SWING are led by a
`Guide` (`objects/Guide.js`): an animal that waits until you are within
`LEARN.guideWaitDistance`, calls out, then does its next step. Steps are `walk`, `climb`,
`bounce`, `swing` and `drop`; an `auto` step starts right after the one before it, and a
`swing` step with a `pivot` and `length` rides a real pendulum arc. Nothing in these levels
can hurt you. SWING reuses `RopeSwings`, which takes options (`ropes`, `top`, `length`) so
ropes can hang anywhere (Launch's are the defaults). Tunables are under `LEARN` in
`src/config.js`. Spec: `docs/superpowers/specs/2026-11-03-climb-and-swing-design.md`.

## Launch

`LaunchScene` runs phases `run` → `launching` → `flying` → `landing` → `done`, plus `oops`
(the pause after falling in or getting caught, before fading back to the last checkpoint
flag). Each section is its own object (`Critters`, `RopeSwings`, `River`, `Chase` with
`Alien`, `LaunchPuzzle`) that the scene updates and draws; `Chase.update()` returns events
(words, sounds, stuns, `pulled` / `caught`) for the scene to act on. Section positions and
timings are under `LAUNCH` in `src/config.js` (smaller layout details sit at the top of each
object's file). Respawning resets the river, and the chase when going back before it.
Ropes fling you with `StickFigure.fling()`, which keeps sideways speed until you land
(`PLAYER.airSteer`). The drifting log carries its rider in `River.update()` (Arcade's own
moving-platform carry didn't move the rider here). Colors: `COLORS.red/blue/green` are drawn
as colored pencil (outline + hatching) and only mean the puzzle. During flight `TouchControls`
switches to its `flight` layout (▲ ▼) and `PlayerInput` reports `up`/`down`. Audio:
`src/audio.js` creates one `AudioContext` on the first tap or keypress (Phaser's audio is
off via `audio.noAudio`); mute is saved in `localStorage`. Launch, CLIMB, and SWING play sound (the guides' meow, purr, and ooh are in `audio.js` too).
Design notes: `docs/superpowers/specs/2026-11-02-launch-design.md` and
`2026-11-02-launch-expansion-design.md`.

## Read mode

`ReadScene` draws and listens; `ReadingEngine` (`src/reading/engine.js`) decides. The scene
calls `engine.startRound()`, then `nextPuzzle()` (null when the round is over) and
`answer(puzzle, { firstPick, ms, hintUsed })` on the first pick only. You pick by walking
under a card and jumping up into it (cards sit just above his head, like the comic page's
panels; `bumpedCard()` converts the screen-space cards into world space), or by tapping it.
After a right answer `StickFigure.dance()` plays a random dance from `src/objects/dances.js`
(`READ.danceMs`), then the next word comes. The engine is plain
JS with no Phaser, so it can be run and simulated in Node. All thresholds are in `READ`
in `src/config.js`; content is data in `src/data/` (words tagged by level, skill, theme;
pictures as pencil shapes), so new words and biomes need no code. Wrong answers wiggle
and fade, never buzz. Words are spoken only when the speaker is tapped (or after a right
answer). Progress is one `localStorage` object (`margins.reading`), with no names. Keep the
repo free of real names: it's public. Design notes:
`docs/superpowers/specs/2026-11-02-read-mode-design.md`.

## Climb mode

`ClimbScene` switches the game to a 540x960 portrait design area with
`useLayout(this, PORTRAIT)`; the story scenes switch back with `LANDSCAPE`. It runs its
own camera (up only) and passes its own fit function to `watchScreen`. `ClimbCourse`
generates platforms on ruled lines a screen ahead and removes them far below; every
platform is within reach of the previous one (gap <= `maxGapLines`, sideways <=
`maxSideStep`). All tunables are under `CLIMB` in `src/config.js`. Walking and jumping use
the normal `PLAYER` settings, `PlayerInput`, and touch buttons.

**Difficulty lives in one table:** `CLIMB.milestones` (each entry lists only what changes
at that height, in ruled lines) plus `CLIMB.beyond` (steps every 500 lines forever, within
limits). `milestones.js` merges them (`difficultyAt`) and picks the word to announce
(`milestoneAt`). `CLIMB.reach` is a hard cap that keeps platforms reachable however the
table is edited; don't remove it. Milestone words must pass the early reader test.

The scene has four states: `initials` → `start` → `playing` → `over`. Cards
(`ClimbCards.js`) get keys and taps through listeners that are removed on shutdown,
because `scene.restart()` reuses the scene object and doubled listeners press buttons
twice. Design notes: `docs/superpowers/specs/2026-11-02-climb-mode-design.md` and
`2026-11-02-climb-extensions-design.md`.

## Running it

```bash
npm install
npm run dev      # dev server at http://localhost:5173 (also shown on your LAN)
npm run build    # production build into dist/
npm run preview  # serve the built dist/ folder
npm test         # node --test "tests/**/*.test.js" (plain logic, no browser)
```

### On a phone (same Wi-Fi)

`vite.config.js` sets `server.host: true`, so Vite prints a "Network" URL.
This machine runs the project inside **WSL2**, whose default NAT networking hides
that address from the LAN, so Windows has to forward the port:

1. In an **admin PowerShell** on Windows, forward the port into WSL:
   ```powershell
   $wsl = (wsl hostname -I).Trim().Split(" ")[0]
   netsh interface portproxy add v4tov4 listenport=5173 listenaddress=0.0.0.0 connectport=5173 connectaddress=$wsl
   New-NetFirewallRule -DisplayName "Vite 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```
2. Find the Windows LAN IP with `ipconfig` (e.g. `192.168.1.42`).
3. On the phone, open `http://192.168.1.42:5173` and hold it in landscape.

The WSL IP can change after a reboot; rerun the portproxy line if it stops working.
(Alternative: enable `networkingMode=mirrored` in `%UserProfile%\.wslconfig`.)

## Debugging tips

- In dev mode the game is exposed as `window.game`. In the browser console try
  `game.scene.getScene('GettingStarted').player`. To replay the tutorial as new,
  run `localStorage.clear()` and reload.
- Set `debug: true` under `physics.arcade` in `src/main.js` to see physics boxes.

## Conventions

- Design for **phone landscape first**. The level is laid out in a 960x540 area
  that is always visible; `Phaser.Scale.EXPAND` fills the rest of the screen with
  more page (extra width on the right, extra height above). Anything pinned to the
  screen (touch buttons, messages) uses `this.scale.width/height` and `setScrollFactor(0)`.
- Put magic numbers in `src/config.js`, not scattered through the code. (Layout numbers
  that only make sense for one scene, like where a panel sits, can live at the top of
  that scene's file.)
- Every scene starts with `useLayout(this, LANDSCAPE | PORTRAIT)` so the design size and
  the phone rotate hint match it.
- Every scene calls `watchScreen(this)` and uses `PlayerInput`, so screen fitting and
  controls behave the same everywhere. On-screen words use `PencilWord` and must pass
  the philosophy's "early reader test".
- Keep each file focused on one thing, and keep code readable for a learner:
  short functions, clear names, a comment wherever the "why" isn't obvious.
- When behavior, controls, structure, or tuning defaults change, update the docs
  page (`public/docs/index.html`) and this file in the same commit.
- Scope: build only what's been agreed. "Someday" ideas go in the "Not yet" list in
  docs/PHILOSOPHY.md instead of into code.
