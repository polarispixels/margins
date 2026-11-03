# Margins

A stick figure lives on a sheet of lined notebook paper. Everything is drawn in
pencil and "boils" like a hand-drawn flipbook. The blue ruled lines are
platforms, the red margin line is a wall, and the coffee ring stain is the goal.

A small proof of concept built with Phaser 4, Vite, and plain JavaScript. No
image assets: everything is drawn procedurally.

- **Play:** https://polarispixels.github.io/margins/
- **Developer & agent docs:** https://polarispixels.github.io/margins/docs/
  (concept, controls, architecture, how the boil works, tuning, deployment)
- **Philosophy:** [docs/PHILOSOPHY.md](docs/PHILOSOPHY.md) — who it's for, on-screen words,
  look and feel. **Read this first.**
- **Agent instructions:** [CLAUDE.md](CLAUDE.md)

## Controls

| Action | Desktop | Phone (landscape) |
| --- | --- | --- |
| Walk | Arrow keys or A / D | On-screen ◀ ▶ buttons |
| Jump | Space (or Up / W) | On-screen ▲ button |

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173, plus a LAN address for your phone
npm run build    # production build into dist/
npm run preview  # serve the built dist/ folder
```

Pushing to `main` builds and deploys to GitHub Pages automatically
(`.github/workflows/deploy.yml`).
