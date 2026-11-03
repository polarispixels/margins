// Drawings for Launch's UFO chase: a tree toppling over, the tractor beam,
// the alien on foot, and its zaps. Plain functions in boiling pencil.

import { COLORS } from '../config.js';
import { pencilCircle, pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

const PENCIL = { color: COLORS.pencil, width: 2.5 };
const THIN = { color: COLORS.pencil, width: 1.5 };

// A tree that can fall over. `tilt` is 0 standing up and 1 lying flat toward the
// left (pivoting at its base). As it lands, the canopy squashes flat.
export function drawFallingTree(g, rng, x, groundY, height, tilt) {
  const angle = -tilt * (Math.PI / 2); // 0 up, -π/2 lying to the left
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  // Local coordinates: u across the trunk, v up the trunk. `lift` raises a part
  // as it lies down, so it rests on the ground instead of sinking into it.
  const p = (u, v, lift) => ({ x: x + u * c + v * s, y: groundY - v * c + u * s - tilt * lift });
  const trunkTop = height * 0.45;
  pencilPolyline(g, rng, [p(-6, 0, 6), p(-4, trunkTop, 6)], PENCIL);
  pencilPolyline(g, rng, [p(6, 0, 6), p(4, trunkTop, 6)], PENCIL);
  // The canopy: three loops that squash flatter as the tree lands.
  const r = height * 0.28;
  const blob = (du, dv, rr) => {
    const ry = rr * (1 - tilt * 0.65);
    const q = p(du * (1 - tilt), height * 0.68 + dv, ry);
    pencilEllipse(g, rng, q.x, q.y, rr, ry, { ...PENCIL, width: 2, points: 12, wobble: 3 });
  };
  blob(0, 0, r);
  blob(-r * 0.6, -r * 0.35, r * 0.65);
  blob(r * 0.6, -r * 0.3, r * 0.7);
  if (tilt >= 1) {
    // A few broken twigs where it landed.
    const mid = p(0, height * 0.68, 0);
    pencilLine(g, rng, mid.x + 20, groundY - 4, mid.x + 34, groundY - 22, THIN);
    pencilLine(g, rng, mid.x - 40, groundY - 2, mid.x - 52, groundY - 16, THIN);
  }
}

// The tractor beam: a cone from the saucer's belly (x, y) down to the ground,
// centered at groundX with half-width `halfWidth` there. Scanlines drift upward.
export function drawBeam(g, rng, x, y, groundX, groundY, halfWidth, alpha, time) {
  const top = 10;
  g.fillStyle(COLORS.pencil, 0.06 * alpha);
  g.fillPoints([
    { x: x - top, y }, { x: x + top, y }, { x: groundX + halfWidth, y: groundY }, { x: groundX - halfWidth, y: groundY },
  ], true);
  const edge = { ...PENCIL, width: 2, alpha: 0.8 * alpha };
  pencilLine(g, rng, x - top, y, groundX - halfWidth, groundY, edge);
  pencilLine(g, rng, x + top, y, groundX + halfWidth, groundY, edge);
  // Wavy rings moving up the beam.
  for (let i = 0; i < 5; i++) {
    const t = 1 - ((time / 900 + i / 5) % 1); // 1 at the ground, 0 at the saucer
    const cx = x + (groundX - x) * t;
    const cy = y + (groundY - y) * t;
    const hw = top + (halfWidth - top) * t;
    pencilEllipse(g, rng, cx, cy, hw, 4, { ...THIN, alpha: 0.5 * alpha, points: 10, passes: 1 });
  }
  pencilEllipse(g, rng, groundX, groundY, halfWidth, 6, { ...THIN, alpha: 0.7 * alpha, points: 12 });
}

// The alien on foot: a round little body with one big eye, three wobbly
// antennae, springy coil legs, and a tiny ray gun. (x, feetY) is between its
// feet. Options:
//   facing: 1 right, -1 left
//   spring: 0 squashed .. 1 stretched (it bounces as it runs)
//   aim: 0..1 antennae sparkling before a zap
//   blink: true to close the eye
//   look: x the eye looks toward
export function drawAlien(g, rng, x, feetY, time, { facing = 1, spring = 0.5, aim = 0, blink = false, look = x + 100 } = {}) {
  const legLen = 14 + spring * 12;
  const bodyY = feetY - legLen - 16;

  // Spring legs: zigzag coils from the body down to two little feet.
  for (const side of [-1, 1]) {
    const top = { x: x + side * 7, y: bodyY + 13 };
    const foot = { x: x + side * 9, y: feetY };
    const coil = [top];
    for (let i = 1; i < 6; i++) {
      const t = i / 6;
      coil.push({ x: top.x + (foot.x - top.x) * t + (i % 2 ? 5 : -5), y: top.y + (foot.y - top.y) * t });
    }
    coil.push(foot);
    pencilPolyline(g, rng, coil, THIN);
    pencilEllipse(g, rng, foot.x + side * 2, feetY - 2, 6, 3, { ...THIN, points: 8 });
  }

  // The body: round, filled with paper so the coils don't show through.
  g.fillStyle(COLORS.paper, 1);
  g.fillCircle(x, bodyY, 16);
  pencilCircle(g, rng, x, bodyY, 16, { ...PENCIL, points: 14 });

  // One big eye that looks at you, with a lid that blinks.
  const ex = x + 2 * facing;
  const ey = bodyY - 3;
  if (blink) {
    pencilLine(g, rng, ex - 7, ey, ex + 7, ey, PENCIL);
  } else {
    pencilCircle(g, rng, ex, ey, 7, { ...PENCIL, width: 2, points: 10 });
    const dx = Math.max(-3, Math.min(3, (look - x) / 40));
    g.fillStyle(COLORS.pencil, 1);
    g.fillCircle(ex + dx, ey + 1, 3);
  }
  // A big toothy grin with one tooth.
  pencilPolyline(g, rng, [
    { x: x - 8, y: bodyY + 7 }, { x: x, y: bodyY + 11 }, { x: x + 8, y: bodyY + 7 },
  ], { ...THIN, width: 2 });
  pencilPolyline(g, rng, [{ x: x + 1, y: bodyY + 10 }, { x: x + 3, y: bodyY + 14 }, { x: x + 5, y: bodyY + 9 }], THIN);

  // Three antennae that wobble, with bobbles that sparkle before a zap.
  [-0.5, 0, 0.5].forEach((lean, i) => {
    const wob = Math.sin(time / 150 + i * 2) * 3;
    const base = { x: x + lean * 18, y: bodyY - 15 + Math.abs(lean) * 4 };
    const tip = { x: base.x + lean * 14 + wob, y: base.y - 16 };
    pencilPolyline(g, rng, [base, { x: (base.x + tip.x) / 2 - wob, y: (base.y + tip.y) / 2 }, tip], THIN);
    pencilCircle(g, rng, tip.x, tip.y, 2.5 + aim * 1.5, { ...THIN, points: 6 });
    if (aim > 0) {
      const r = 4 + aim * 5;
      for (let k = 0; k < 4; k++) {
        const a = k * (Math.PI / 2) + time / 100;
        pencilLine(g, rng, tip.x + Math.cos(a) * 3, tip.y + Math.sin(a) * 3, tip.x + Math.cos(a) * r, tip.y + Math.sin(a) * r, { ...THIN, width: 1.2, passes: 1 });
      }
    }
  });

  // A stubby arm holding a tiny ray gun out in front.
  const hand = { x: x + 20 * facing, y: bodyY + 4 };
  pencilLine(g, rng, x + 13 * facing, bodyY + 2, hand.x, hand.y, THIN);
  pencilPolyline(g, rng, [
    { x: hand.x, y: hand.y - 3 }, { x: hand.x + 12 * facing, y: hand.y - 3 },
    { x: hand.x + 12 * facing, y: hand.y + 2 }, { x: hand.x, y: hand.y + 2 },
  ], THIN);
  pencilCircle(g, rng, hand.x + 14 * facing, hand.y - 0.5, 2.5, { ...THIN, points: 6 });
  pencilLine(g, rng, hand.x + 3 * facing, hand.y + 2, hand.x + 1 * facing, hand.y + 7, THIN);
}

// A zap: a zigzag bolt with sparks, flying along `dir` (1 right).
export function drawZap(g, rng, x, y, dir, time) {
  const pts = [];
  for (let i = 0; i <= 6; i++) pts.push({ x: x - dir * i * 7, y: y + (i % 2 ? -6 : 6) * (1 - i / 9) });
  pencilPolyline(g, rng, pts, { ...PENCIL, width: 2.5, wobble: 2 });
  for (let k = 0; k < 3; k++) {
    const a = time / 60 + k * 2.1;
    pencilLine(g, rng, x, y, x + Math.cos(a) * 9, y + Math.sin(a) * 9, { ...THIN, width: 1.2, passes: 1 });
  }
}
