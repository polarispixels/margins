// Drawings for Launch's forest and river: squirrels, birds, ropes and their
// branch, the ravine, water, lily pads, the alligator, a fish, splashes, and
// checkpoint flags. Plain functions in boiling pencil: pass an rng from boilRng().

import { COLORS } from '../config.js';
import { pencilCircle, pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

const PENCIL = { color: COLORS.pencil, width: 2.5 };
const THIN = { color: COLORS.pencil, width: 1.5 };

// Points around an oval, in whatever coordinates the caller maps them to.
function oval(cx, cy, rx, ry, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

// ---- Critters ----

// A squirrel with its feet at (x, y). `facing` is 1 (right) or -1 (left).
// `pose` is 'sit', 'run', or 'climb' (going up the side of a trunk that's in
// front of it). `phase` drives the legs.
export function drawSquirrel(g, rng, x, y, facing, pose, phase) {
  // Local coordinates: u forward, v up from the feet.
  const map = pose === 'climb'
    ? (u, v) => ({ x: x - v * facing, y: y - u }) // forward is up the trunk
    : (u, v) => ({ x: x + u * facing, y: y - v });
  const path = (pts, style = THIN) => pencilPolyline(g, rng, pts.map(([u, v]) => map(u, v)), style);

  path(oval(0, 9, 10, 6), { ...PENCIL, width: 2 }); // body
  path(oval(11, 15, 5, 5, 8), { ...PENCIL, width: 2 }); // head
  path([[10, 19], [11, 24], [14, 19]]); // ear
  const eye = map(13, 16);
  g.fillStyle(COLORS.pencil, 1);
  g.fillCircle(eye.x, eye.y, 1.3);
  // The big curly tail, flicking a little.
  const flick = pose === 'sit' ? Math.sin(phase * 0.5) * 2 : 0;
  path([[-9, 9], [-17, 14], [-21 + flick, 25], [-16 + flick, 33], [-8, 31], [-7, 25]], { ...PENCIL, width: 2.5 });
  path([[-12, 14], [-16, 24 + flick], [-11, 29]]);
  // Legs.
  const swing = pose === 'sit' ? 0 : Math.sin(phase) * 4;
  path([[6, 4], [7 + swing, 0]]);
  path([[-5, 4], [-5 - swing, 0]]);
}

// A little bird. On the ground it hops and pecks; flying, its wings flap.
export function drawBird(g, rng, x, y, facing, flying, phase) {
  const map = (u, v) => ({ x: x + u * facing, y: y - v });
  const path = (pts, style = THIN) => pencilPolyline(g, rng, pts.map(([u, v]) => map(u, v)), style);
  const peck = flying ? 0 : Math.max(0, Math.sin(phase * 0.7)) * 3;
  path(oval(0, 7, 6, 5, 8), { ...PENCIL, width: 2 }); // body
  path(oval(6, 13 - peck, 3.5, 3.5, 6), { ...PENCIL, width: 2 }); // head
  path([[9, 14 - peck], [13, 13 - peck], [9, 12 - peck]]); // beak
  path([[-6, 8], [-11, 11], [-10, 6], [-6, 6]]); // tail
  if (flying) {
    const flap = Math.sin(phase * 2.5) * 9;
    path([[0, 9], [-4, 14 + flap], [-9, 12 + flap * 1.3]], { ...PENCIL, width: 2 });
    path([[2, 9], [0, 15 + flap * 0.8], [-3, 14 + flap]], THIN);
  } else {
    path([[-1, 2], [-1, 0]]);
    path([[2, 2], [2, 0]]);
    path([[-3, 8], [2, 6]]); // folded wing
  }
}

// ---- Rope swings ----

// A long branch across the top of the ravine, with a few twigs and leaves.
export function drawBranch(g, rng, x1, x2, y) {
  pencilLine(g, rng, x1, y - 6, x2, y - 2, { ...PENCIL, width: 3 });
  pencilLine(g, rng, x1, y + 4, x2, y + 3, PENCIL);
  for (let x = x1 + 60; x < x2 - 30; x += 110) {
    pencilLine(g, rng, x, y - 4, x + 18, y - 22, THIN);
    pencilEllipse(g, rng, x + 22, y - 25, 7, 4, { ...THIN, points: 8 });
  }
}

// A rope from its knot (px, py) to its end (ex, ey), with a knot at the bottom.
export function drawRope(g, rng, px, py, ex, ey) {
  pencilCircle(g, rng, px, py, 4, { ...THIN, points: 6 });
  pencilLine(g, rng, px - 1.5, py, ex - 1.5, ey, { ...PENCIL, width: 2 });
  pencilLine(g, rng, px + 1.5, py, ex + 1.5, ey, THIN);
  pencilCircle(g, rng, ex, ey + 4, 4, { ...PENCIL, width: 2, points: 6 });
}

// A deep crack in the ground between `from` and `to`, with jagged walls and
// thorny scribbles at the bottom.
export function drawRavine(g, rng, from, to, groundY, bottomY) {
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(from, groundY - 1, to - from, bottomY - groundY + 1); // hide the ruled lines a little
  const wall = (x, dir) => {
    const pts = [];
    for (let y = groundY, i = 0; y <= bottomY; y += 18, i++) pts.push({ x: x + dir * (i % 2 ? 10 : 2), y });
    pencilPolyline(g, rng, pts, PENCIL);
  };
  wall(from, 1);
  wall(to, -1);
  // Thorns: little zigzags along the bottom.
  const thorns = [];
  for (let x = from + 14, i = 0; x < to - 10; x += 14, i++) thorns.push({ x, y: bottomY - (i % 2 ? 4 : 16) });
  pencilPolyline(g, rng, thorns, { ...THIN, alpha: 0.7 });
  // Shading strokes down the walls so it reads as deep.
  for (let y = groundY + 14; y < bottomY - 10; y += 16) {
    pencilLine(g, rng, from + 16, y, from + 30, y + 8, { ...THIN, alpha: 0.4, passes: 1 });
    pencilLine(g, rng, to - 16, y, to - 30, y + 8, { ...THIN, alpha: 0.4, passes: 1 });
  }
}

// ---- The river ----

// Water from `from` to `to`, its surface at `y`: a wavy line that ripples, and
// a couple of gentler waves below.
export function drawWater(g, rng, from, to, y, bottomY, time) {
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(from, y + 4, to - from, bottomY - y);
  const wave = (yy, amp, speed, style) => {
    const pts = [];
    for (let x = from; x <= to; x += 16) pts.push({ x, y: yy + Math.sin(x / 30 + time / speed) * amp });
    pencilPolyline(g, rng, pts, style);
  };
  wave(y, 2.5, 300, PENCIL);
  wave(y + 14, 2, 420, { ...THIN, alpha: 0.6 });
  wave(y + 28, 1.5, 520, { ...THIN, alpha: 0.35 });
  // The banks: short stubby edges where the ground stops.
  pencilLine(g, rng, from, y - 6, from + 6, y + 10, PENCIL);
  pencilLine(g, rng, to, y - 6, to - 6, y + 10, PENCIL);
}

// A lily pad centered at x with its top at y, `w` wide. `shake` (0..1) wobbles it.
export function drawLilyPad(g, rng, x, y, w, time, shake = 0, flower = false) {
  const jiggle = shake ? Math.sin(time / 30) * 3 * shake : 0;
  const cx = x + jiggle;
  pencilEllipse(g, rng, cx, y + 3, w / 2, 6, { ...PENCIL, points: 14 });
  pencilLine(g, rng, cx, y + 3, cx + w * 0.22, y - 1, THIN); // the notch
  pencilLine(g, rng, cx - w * 0.2, y + 4, cx + w * 0.1, y + 5, { ...THIN, alpha: 0.5, passes: 1 });
  if (flower) {
    for (const dx of [-5, 0, 5]) pencilEllipse(g, rng, cx - w * 0.2 + dx, y - 5, 3, 6, { ...THIN, points: 6 });
  }
}

// The alligator, lying in the water facing right. Its back runs from `x` for
// `back` px with its top at `top` (where you stand); the head is `head` px long.
// The water's surface is at `surface`. `jaw` (0..1) is how far open the mouth is.
export function drawGator(g, rng, x, top, surface, back, head, jaw) {
  // The back: up out of the water, a long bumpy ridge, then the neck.
  const ridge = [{ x, y: surface }];
  for (let i = 1; i < 16; i++) ridge.push({ x: x + (i / 16) * back, y: top - (i % 2 ? 5 : 0) });
  ridge.push({ x: x + back, y: top });
  pencilPolyline(g, rng, ridge, PENCIL);
  // Its side, down to the water, with a few scales.
  pencilLine(g, rng, x + back, top, x + back + 4, surface, PENCIL);
  for (let sx = x + 18; sx < x + back - 10; sx += 22) {
    pencilEllipse(g, rng, sx, (top + surface) / 2 + 2, 7, 4, { ...THIN, alpha: 0.6, points: 8, passes: 1 });
  }
  // The tail tip, swishing behind it in the water.
  pencilPolyline(g, rng, [{ x, y: surface }, { x: x - 22, y: surface - 4 }, { x: x - 44, y: surface - 1 }], PENCIL);

  // The head: an eye bump, then a long snout. The upper jaw tips up to open.
  const hx = x + back;
  pencilEllipse(g, rng, hx + 12, top - 6, 11, 9, { ...PENCIL, points: 10 }); // eye bump
  g.fillStyle(COLORS.pencil, 1);
  g.fillEllipse(hx + 14, top - 7, 3.5, 8); // a slit pupil
  const hinge = { x: hx + 20, y: top + 4 };
  const open = jaw * 0.6; // radians
  const tip = { x: hinge.x + (head - 20) * Math.cos(open), y: hinge.y - (head - 20) * Math.sin(open) };
  pencilLine(g, rng, hx + 2, top, hinge.x, top - 1, PENCIL);
  pencilLine(g, rng, hinge.x, top - 1, tip.x, tip.y - 4, PENCIL); // upper jaw, top edge
  pencilLine(g, rng, hinge.x, hinge.y, tip.x, tip.y, PENCIL); // upper jaw, lower edge
  pencilLine(g, rng, tip.x, tip.y - 4, tip.x, tip.y, THIN);
  pencilLine(g, rng, hinge.x, hinge.y + 2, hx + head, hinge.y + 2, PENCIL); // lower jaw
  pencilLine(g, rng, hinge.x, surface, hx + head, hinge.y + 2, THIN);
  // Teeth along both jaws.
  const teeth = (ax, ay, bx, by, dir) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t + (i % 2 ? dir * 5 : 0) });
    }
    pencilPolyline(g, rng, pts, THIN);
  };
  teeth(hinge.x + 4, hinge.y - (hinge.y - tip.y) * 0.1, tip.x - 2, tip.y, 1);
  teeth(hinge.x + 4, hinge.y + 2, hx + head - 2, hinge.y + 2, -1);
  pencilCircle(g, rng, tip.x - 4, tip.y - 6, 1.5, { ...THIN, points: 5, passes: 1 }); // nostril
}

// A fish at (x, y) heading along `angle` (0 = right).
export function drawFish(g, rng, x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const p = (u, v) => ({ x: x + u * c - v * s, y: y + u * s + v * c });
  const path = (pts, style) => pencilPolyline(g, rng, pts.map(([u, v]) => p(u, v)), style);
  path(oval(0, 0, 14, 7, 10), PENCIL);
  path([[-13, 0], [-24, -8], [-22, 0], [-24, 8], [-13, 0]], PENCIL); // tail
  path([[2, -6], [-4, -12], [-8, -6]], THIN); // fin
  const eye = p(8, -2);
  g.fillStyle(COLORS.pencil, 1);
  g.fillCircle(eye.x, eye.y, 1.6);
}

// Bubbles rising where the fish is about to leap. `t` 0 → 1 as the leap nears.
export function drawBubbles(g, rng, x, y, t, time) {
  for (let i = 0; i < 3; i++) {
    const rise = ((time / 400 + i / 3) % 1) * 18 * (0.5 + t);
    pencilCircle(g, rng, x + (i - 1) * 8, y - rise, 2 + t * 1.5, { ...THIN, points: 6, passes: 1 });
  }
}

// A splash: drops flying up and out, fading as `t` goes 0 → 1.
export function drawSplash(g, rng, x, y, t) {
  const style = { ...PENCIL, width: 2, alpha: 1 - t };
  for (let i = -3; i <= 3; i++) {
    const a = -Math.PI / 2 + i * 0.35;
    const r1 = 8 + t * 20;
    const r2 = r1 + 14;
    pencilLine(g, rng, x + Math.cos(a) * r1, y + Math.sin(a) * r1, x + Math.cos(a) * r2, y + Math.sin(a) * r2, style);
  }
  pencilEllipse(g, rng, x, y + 2, 16 + t * 24, 4, { ...style, points: 12 });
}

// ---- Checkpoints ----

// A little flag on a pole. `raised` (0..1) runs it up the pole when you pass.
export function drawFlag(g, rng, x, groundY, raised) {
  const top = groundY - 70;
  pencilLine(g, rng, x, groundY, x, top, PENCIL);
  const fy = groundY - 22 - raised * 40;
  pencilPolyline(g, rng, [{ x, y: fy - 14 }, { x: x + 26, y: fy - 7 }, { x, y: fy }], { ...PENCIL, width: 2 });
  if (raised >= 1) pencilLine(g, rng, x + 4, fy - 11, x + 18, fy - 7, { ...THIN, alpha: 0.6, passes: 1 });
}
