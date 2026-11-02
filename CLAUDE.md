# Margins

A tiny browser platformer that lives on a sheet of lined notebook paper.

- **Play:** https://polarispixels.github.io/margins/
- **Docs:** https://polarispixels.github.io/margins/docs/ (source: `public/docs/index.html`)
- **Repo:** https://github.com/polarispixels/margins (deploys to GitHub Pages on push to `main`)

## Concept

- A stick figure walks and jumps around a page of notebook paper.
- Everything is drawn in "pencil" and **boils**: lines are redrawn with a small
  random wobble several times a second, like a hand-drawn flipbook.
- The blue ruled lines are platforms. The red margin line on the left is a wall.
- Reach the coffee ring stain to finish the page ("Page complete"), which then restarts.
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
├── public/docs/index.html  # The docs page; Vite copies public/ into dist/ as-is
├── .github/workflows/deploy.yml  # Build + deploy to GitHub Pages on push to main
└── src/
    ├── main.js             # Creates the Phaser.Game (size, scaling, physics)
    ├── config.js           # All tunable numbers and colors live here
    ├── level.js            # Platform layout and goal position for the page
    ├── pencil.js           # Seeded random + wobbly "pencil" drawing helpers (the boil)
    ├── scenes/
    │   └── GameScene.js    # Wires everything together; game loop
    └── objects/
        ├── Paper.js        # Static background: paper, ruled lines, margin, holes
        ├── Platforms.js    # Physics bodies + boiling drawing for platforms and the wall
        ├── StickFigure.js  # Player physics, movement, walk cycle, squash and stretch
        ├── CoffeeRing.js   # The goal
        └── TouchControls.js# On-screen left / right / jump buttons for phones
```

## How the boil works

`pencil.js` uses a tiny seeded random number generator. Each object redraws itself
every frame, but the seed only changes every `BOIL_INTERVAL_MS`, so the wobble
holds still between "boil ticks" and then jumps to a new shape, which is what
reads as a hand-drawn flipbook.

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
  `game.scene.getScene('GameScene').player`.
- Set `debug: true` under `physics.arcade` in `src/main.js` to see physics boxes.

## Conventions

- Design for **phone landscape first**. The level is laid out in a 960x540 area
  that is always visible; `Phaser.Scale.EXPAND` fills the rest of the screen with
  more page (extra width on the right, extra height above). Anything pinned to the
  screen (touch buttons, messages) uses `this.scale.width/height` and `setScrollFactor(0)`.
- Put magic numbers in `src/config.js`, not scattered through the code.
- Keep each file focused on one thing, and keep code readable for a learner:
  short functions, clear names, a comment wherever the "why" isn't obvious.
- When behavior, controls, structure, or tuning defaults change, update the docs
  page (`public/docs/index.html`) and this file in the same commit.
- MVP scope only. Don't add features (sound, scoring, multiple levels) unless asked.
