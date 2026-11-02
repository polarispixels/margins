// Pencil drawing helpers. This is where the "boil" comes from.
//
// The trick: every line is drawn with small random offsets. If we used
// Math.random() each frame the lines would buzz like static. Instead we use a
// *seeded* random generator, and only change the seed every BOIL.intervalMs.
// Same seed -> same wobble, so the drawing holds still, then jumps to a new
// wobble on the next tick, just like a hand-drawn flipbook.

import { BOIL } from './config.js';

// A tiny seeded pseudo-random generator (mulberry32).
// Returns a function that gives a new number in [0, 1) each call.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Which boil "frame" are we on? Changes every BOIL.intervalMs.
export function boilFrame(timeMs) {
  return Math.floor(timeMs / BOIL.intervalMs);
}

// An rng for one object on the current boil frame. `id` keeps different
// objects from wobbling identically.
export function boilRng(timeMs, id) {
  return makeRng(boilFrame(timeMs) * 7919 + id * 104729);
}

// Random number in [-amount, amount].
function jitter(rng, amount) {
  return (rng() * 2 - 1) * amount;
}

// Draw a wobbly line from (x1, y1) to (x2, y2).
// It's drawn in `passes` slightly different strokes, which gives the
// doubled-up look of a real pencil line.
export function pencilLine(g, rng, x1, y1, x2, y2, opts = {}) {
  const {
    color = 0x333333,
    width = 2,
    alpha = 0.9,
    wobble = BOIL.wobble,
    passes = 2,
  } = opts;

  const length = Math.hypot(x2 - x1, y2 - y1);
  const segments = Math.max(2, Math.round(length / 28));
  // Unit vector perpendicular to the line, so we wobble sideways.
  const nx = length ? -(y2 - y1) / length : 0;
  const ny = length ? (x2 - x1) / length : 0;

  for (let p = 0; p < passes; p++) {
    // Later passes are thinner and lighter.
    g.lineStyle(p === 0 ? width : width * 0.6, color, p === 0 ? alpha : alpha * 0.5);
    g.beginPath();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const offset = jitter(rng, wobble);
      const x = x1 + (x2 - x1) * t + nx * offset + jitter(rng, wobble * 0.3);
      const y = y1 + (y2 - y1) * t + ny * offset + jitter(rng, wobble * 0.3);
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }
}

// Draw a wobbly circle as a closed loop of jittered points.
export function pencilCircle(g, rng, cx, cy, radius, opts = {}) {
  const {
    color = 0x333333,
    width = 2,
    alpha = 0.9,
    wobble = BOIL.wobble,
    passes = 2,
    points = 14,
  } = opts;

  for (let p = 0; p < passes; p++) {
    g.lineStyle(p === 0 ? width : width * 0.6, color, p === 0 ? alpha : alpha * 0.5);
    g.beginPath();
    // Start at a random angle so the "seam" isn't always in the same spot.
    const start = rng() * Math.PI * 2;
    const firstRadius = radius + jitter(rng, wobble);
    for (let i = 0; i <= points; i++) {
      const angle = start + (i / points) * Math.PI * 2;
      // Reuse the first point's radius on the last point so the loop closes.
      const r = i === 0 || i === points ? firstRadius : radius + jitter(rng, wobble);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.strokePath();
  }
}
