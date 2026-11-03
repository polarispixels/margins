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
    ├── input.js            # PlayerInput: keyboard + touch -> { left, right, jump, jumpHeld }
    ├── screen.js           # Fit any screen shape (watchScreen); paper-colored scene fades
    ├── progress.js         # Finished panels, in localStorage (best effort)
    ├── scenes/
    │   ├── ComicPageScene.js       # The comic page (start scene): jump into a panel
    │   └── GettingStartedScene.js  # The first tutorial panel
    └── objects/
        ├── Paper.js        # Static background: paper, ruled lines, margin, holes; lineY()
        ├── Platforms.js    # Line segments (+ addSolid boxes): physics + boiling pencil trace
        ├── StickFigure.js  # Player physics, movement, walk cycle, squash and stretch
        ├── PencilWord.js   # Words in pencil via a tiny stroke font; write-on and fade
        ├── ComicPanel.js   # A comic panel: frame, art, and the jump-in trigger
        ├── Dog.js          # The doodle dog; drawDog/drawHeart for panel art
        ├── DrawingPencil.js# The pencil that draws the line ahead of the figure
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
`{ left, right, jump, jumpHeld }` from `PlayerInput.read()` (`src/input.js`), built from both
keyboard and touch, so any new input source must fill in both `jump` (pressed this
frame) and `jumpHeld`. Design notes: `docs/superpowers/specs/2026-11-02-jump-feel-design.md`.

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
- Every scene calls `watchScreen(this)` and uses `PlayerInput`, so screen fitting and
  controls behave the same everywhere. On-screen words use `PencilWord` and must pass
  the philosophy's "Jack test".
- Keep each file focused on one thing, and keep code readable for a learner:
  short functions, clear names, a comment wherever the "why" isn't obvious.
- When behavior, controls, structure, or tuning defaults change, update the docs
  page (`public/docs/index.html`) and this file in the same commit.
- Scope: build only what's been agreed. "Someday" ideas go in the "Not yet" list in
  docs/PHILOSOPHY.md instead of into code.
