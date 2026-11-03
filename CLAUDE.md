# Margins

A tiny browser platformer that lives on a sheet of lined notebook paper.

- **Play:** https://polarispixels.github.io/margins/
- **Docs:** https://polarispixels.github.io/margins/docs/ (source: `public/docs/index.html`)
- **Repo:** https://github.com/polarispixels/margins (deploys to GitHub Pages on push to `main`)

**Read [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) before designing anything players will see.**
It is the foundation of the look and feel: who the game is for (all ages, with Jack, an early
reader, as the benchmark), "one big word at a time, right when it's needed," how levels teach,
and what's deliberately out of scope for now.

## Concept

- A stick figure walks and jumps around a page of notebook paper.
- Everything is drawn in "pencil" and **boils**: lines are redrawn with a small
  random wobble several times a second, like a hand-drawn flipbook.
- The blue ruled lines are platforms. The red margin line on the left is a wall.
- The game opens on a **comic page** (`ComicPageScene`): strips of panels drawn in the
  notebook. Walk along the bottom line and jump up into a panel to play its level.
- The first strip, "Getting Started", has one panel (`GettingStartedScene`): the line
  draws itself as you walk (WALK), the word JUMP is a solid obstacle, and a sleeping dog
  waits at the end. Finished panels show their story art (saved in `progress.js`).
- The second strip, "Launch" (`LaunchScene`), is a side-scrolling story level on one long
  sheet: run through a forest, dodge goo from a UFO, fly a rocket (Up/Down to steer), and
  dodge a fireball that bursts into fireworks over a city. Hits only stun; no game over.
  It has music and sound effects, made in code (`audio.js`), with a remembered mute button.
- The third strip, "Climb", is a separate **mode** (`ClimbScene`): an endless vertical
  platformer played in **portrait**, with the same walk and jump controls as the story
  levels. Springs and paperclips launch you, ink blots crawl on platforms (stomp them or
  lose), paper airplanes fly you up, and height milestones raise both rewards and danger.
  Initials and a top-five high score table are saved on the device. The comic page is
  the mode picker.
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
├── README.md
├── docs/PHILOSOPHY.md      # Who it's for, on-screen words, look & feel, scope. Read first.
├── docs/superpowers/specs/ # Short design specs, one per feature
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
    ├── scenes/
    │   ├── ComicPageScene.js       # The comic page (start scene): jump into a panel
    │   ├── GettingStartedScene.js  # The first tutorial panel
    │   ├── LaunchScene.js          # Launch: forest, UFO, rocket, fireball, city (phases)
    │   └── ClimbScene.js           # Climb mode (portrait): states, camera, blots, flight, milestones
    └── objects/
        ├── Paper.js        # Static background: paper, ruled lines, margin, holes; lineY()
        ├── Platforms.js    # Line segments (+ addSolid boxes): physics + boiling pencil trace
        ├── StickFigure.js  # Player physics, movement, walk cycle, squash and stretch
        ├── PencilWord.js   # Words in pencil via a tiny stroke font; write-on and fade
        ├── ComicPanel.js   # A comic panel: frame, art, and the jump-in trigger
        ├── Dog.js          # The doodle dog; drawDog/drawHeart for panel art
        ├── DrawingPencil.js# The pencil that draws the line ahead of the figure
        ├── ClimbCourse.js  # Climb's random platforms and what's on them
        ├── climbArt.js     # Climb drawings: springs, paperclips, stars, blots, splats, planes
        ├── ClimbCards.js   # Climb's initials, start, and score cards (pencil buttons)
        ├── ScrollingPaper.js # Climb's endless notebook page
        ├── LongPaper.js    # Launch's long sheet of paper
        ├── launchArt.js    # Launch drawings: rocket, UFO, goo, trees, city, fireball, fireworks
        ├── CoffeeRing.js   # A coffee ring stain
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

## Launch

`LaunchScene` runs phases `run` → `launching` → `flying` → `landing` → `done`. Section
positions and timings are under `LAUNCH` in `src/config.js`. During flight `TouchControls`
switches to its `flight` layout (▲ ▼) and `PlayerInput` reports `up`/`down`. Audio:
`src/audio.js` creates one `AudioContext` on the first tap or keypress (Phaser's audio is
off via `audio.noAudio`); mute is saved in `localStorage`. Only Launch plays sound so far.
Design notes: `docs/superpowers/specs/2026-11-02-launch-design.md`.

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
table is edited; don't remove it. Milestone words must pass the Jack test.

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
  the philosophy's "Jack test".
- Keep each file focused on one thing, and keep code readable for a learner:
  short functions, clear names, a comment wherever the "why" isn't obvious.
- When behavior, controls, structure, or tuning defaults change, update the docs
  page (`public/docs/index.html`) and this file in the same commit.
- Scope: build only what's been agreed. "Someday" ideas go in the "Not yet" list in
  docs/PHILOSOPHY.md instead of into code.
