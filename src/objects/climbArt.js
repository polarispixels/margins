// Drawings for the things in Climb: springs, paperclips, stars, ink blots,
// splats, and paper airplanes. Plain functions, so the course, the score card,
// and the comic page can all share them. Everything boils: pass an rng from boilRng().

import { COLORS } from '../config.js';
import { pencilLine, pencilPolyline } from '../pencil.js';

export const SPRING_HALF_WIDTH = 13;
const SPRING_HEIGHT = 16;

// A coil springboard standing on the line at (x, lineY), with a plate on top.
export function drawSpring(g, rng, x, lineY, squashed) {
  const height = squashed ? SPRING_HEIGHT * 0.45 : SPRING_HEIGHT;
  const top = lineY - height;
  const style = { color: COLORS.pencil, width: 2.5, wobble: 0.7 };
  const coil = [];
  const turns = 4;
  for (let i = 0; i <= turns * 2; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    coil.push({ x: x + side * (SPRING_HALF_WIDTH - 4), y: lineY - (i / (turns * 2)) * height });
  }
  pencilPolyline(g, rng, coil, style);
  pencilLine(g, rng, x - SPRING_HALF_WIDTH, top, x + SPRING_HALF_WIDTH, top, { ...style, width: 3.5 });
}

export const PAPERCLIP_HALF_WIDTH = 20;

// The classic paperclip outline in a 1 x 1 box (x: 0 left to 1 right, y: 0 top
// to 1 bottom): an outer loop, a middle loop, and the inner end, as one wire.
const PAPERCLIP_WIRE = [
  [0.2, 0.8], [0.92, 0.8], [1, 0.65], [1, 0.35], [0.92, 0.2], // bottom, round the right end
  [0.08, 0.2], [0, 0.35], [0, 0.55], [0.08, 0.65], // along the top, round the left end
  [0.8, 0.65], [0.86, 0.55], [0.86, 0.45], [0.8, 0.35], [0.2, 0.35], // the inner loop
];

// A paperclip springboard: resting on the line at (x, lineY), tilted up like a
// ramp. `squashed` flattens it for a moment after it launches someone.
export function drawPaperclip(g, rng, x, lineY, squashed) {
  const length = PAPERCLIP_HALF_WIDTH * 2;
  const thickness = 16;
  const tilt = squashed ? -0.06 : -0.38; // radians; negative lifts the right end
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  // Pivot at the left end, on the line.
  const px = x - PAPERCLIP_HALF_WIDTH;
  const py = lineY - 1;
  const points = PAPERCLIP_WIRE.map(([u, v]) => {
    const lx = u * length;
    const ly = (v - 0.8) * thickness; // the bottom wire sits on the line
    return { x: px + lx * cos - ly * sin, y: py + lx * sin + ly * cos };
  });
  pencilPolyline(g, rng, points, { color: COLORS.pencil, width: 2, wobble: 0.4 });
}

// A five-pointed doodle star.
export function drawStar(g, rng, cx, cy, radius, opts = {}) {
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.45; // alternate outer and inner points
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  pencilPolyline(g, rng, points, { color: COLORS.pencil, width: 2, wobble: 0.6, ...opts });
}

export const BLOT_HALF_WIDTH = 15;
export const BLOT_HEIGHT = 18;

// An ink blot crawling along the line: a lumpy ink-filled blob with eyes and
// little legs. `facing` is 1 (right) or -1 (left); `time` wiggles the legs.
export function drawBlot(g, rng, x, lineY, facing, time) {
  const cy = lineY - BLOT_HEIGHT / 2 - 2;
  // A lumpy outline: a circle with random bumps, re-rolled on every boil tick.
  const points = [];
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const bump = i === 12 ? points[0].bump : 1 + (rng() - 0.5) * 0.35;
    points.push({ bump, x: x + Math.cos(a) * BLOT_HALF_WIDTH * bump, y: cy + Math.sin(a) * (BLOT_HEIGHT / 2) * bump });
  }
  g.fillStyle(COLORS.ink, 0.9);
  g.fillPoints(points, true);
  pencilPolyline(g, rng, points, { color: COLORS.ink, width: 2, wobble: 0.8, passes: 1 });

  // Legs scuttling: alternate pairs swing back and forth.
  for (let i = -1; i <= 1; i++) {
    const swing = Math.sin(time / 70 + i * 2) * 3;
    const lx = x + i * 8;
    pencilLine(g, rng, lx, cy + 6, lx + swing, lineY, { color: COLORS.ink, width: 2, wobble: 0.4, passes: 1 });
  }

  // Eyes looking the way it's crawling.
  for (const ex of [-4, 4]) {
    const eyeX = x + ex + facing * 3;
    g.fillStyle(COLORS.paper, 1);
    g.fillCircle(eyeX, cy - 3, 3.2);
    g.fillStyle(COLORS.ink, 1);
    g.fillCircle(eyeX + facing * 1.2, cy - 3, 1.4);
  }
}

// A splatted ink blot: a flat puddle with droplets, fading out as `t` goes 0 → 1.
export function drawSplat(g, rng, x, lineY, t) {
  const alpha = 0.85 * (1 - t);
  g.fillStyle(COLORS.ink, alpha);
  g.fillEllipse(x, lineY - 2, BLOT_HALF_WIDTH * 2.6, 6);
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i / 4) * Math.PI; // droplets fly up and out
    const d = 10 + t * 22;
    g.fillCircle(x + Math.cos(a) * d * 1.4, lineY - 4 + Math.sin(a) * d, 2.5 * (1 - t) + 0.5);
  }
}

// A folded paper airplane, nose pointing up-right, centered at (x, y).
export function drawAirplane(g, rng, x, y, scale = 1, opts = {}) {
  const s = scale;
  const style = { color: COLORS.pencil, width: 2, wobble: 0.6, ...opts };
  const p = (dx, dy) => ({ x: x + dx * s, y: y + dy * s });
  pencilPolyline(g, rng, [p(-20, 6), p(22, -6), p(-12, 12), p(-20, 6)], style); // top wing
  pencilPolyline(g, rng, [p(22, -6), p(-6, 14), p(-12, 12)], style); // the keel fold
  pencilLine(g, rng, x - 20 * s, y + 6 * s, x - 4 * s, y + 4 * s, { ...style, width: 1.5 }); // crease
}
