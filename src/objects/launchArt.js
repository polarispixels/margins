// Drawings for Launch: trees, clouds, a log, the UFO and its alien, goo, the
// rocket and its flame, smoke, the fireball, the city skyline, and fireworks.
// Plain functions that draw in boiling pencil: pass an rng from boilRng().
// Fire gets a warm fill under its pencil lines (COLORS.fire), because color is
// special in Margins and here it means fire.

import { COLORS } from '../config.js';
import { pencilCircle, pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

const PENCIL = { color: COLORS.pencil, width: 2.5 };

// ---- The forest ----

// A doodled tree: a trunk and a scribbly round canopy. `alpha` fades far trees.
export function drawTree(g, rng, x, groundY, height, alpha = 1) {
  const style = { ...PENCIL, alpha, width: 2 };
  const trunkTop = groundY - height * 0.45;
  pencilLine(g, rng, x - 4, groundY, x - 3, trunkTop, style);
  pencilLine(g, rng, x + 4, groundY, x + 3, trunkTop, style);
  // The canopy: a few overlapping loops.
  const r = height * 0.28;
  const cy = groundY - height * 0.68;
  pencilCircle(g, rng, x, cy, r, { ...style, points: 12, wobble: 3 });
  pencilCircle(g, rng, x - r * 0.6, cy + r * 0.35, r * 0.65, { ...style, points: 10, wobble: 2.5, passes: 1 });
  pencilCircle(g, rng, x + r * 0.6, cy + r * 0.3, r * 0.7, { ...style, points: 10, wobble: 2.5, passes: 1 });
}

// A puffy cloud made of a few bumps.
export function drawCloud(g, rng, x, y, size, alpha = 0.6) {
  const style = { ...PENCIL, width: 2, alpha };
  pencilEllipse(g, rng, x, y, size, size * 0.45, { ...style, points: 14, wobble: 2 });
  pencilCircle(g, rng, x - size * 0.35, y - size * 0.3, size * 0.35, { ...style, points: 10, passes: 1 });
  pencilCircle(g, rng, x + size * 0.2, y - size * 0.4, size * 0.42, { ...style, points: 10, passes: 1 });
}

// A log lying on the ground, seen from the side: a long body with a ringed end.
export function drawLog(g, rng, x, groundY, width, height) {
  const top = groundY - height;
  pencilLine(g, rng, x, top, x + width - height / 2, top, PENCIL);
  pencilLine(g, rng, x, groundY, x + width - height / 2, groundY, PENCIL);
  pencilEllipse(g, rng, x, groundY - height / 2, height * 0.3, height / 2, { ...PENCIL, points: 12 });
  const endX = x + width - height / 2;
  pencilCircle(g, rng, endX, groundY - height / 2, height / 2, { ...PENCIL, points: 14 });
  pencilCircle(g, rng, endX, groundY - height / 2, height / 4, { ...PENCIL, width: 1.5, points: 10, passes: 1 });
}

// ---- The UFO ----

// A flying saucer at (x, y) with an alien in its glass dome. `warning` (0..1)
// draws rays underneath before it drops goo.
export function drawUfo(g, rng, x, y, time, warning = 0) {
  // The alien first, so the dome's outline goes over it.
  drawAlien(g, rng, x, y - 14, time);
  pencilEllipse(g, rng, x, y - 10, 24, 20, { ...PENCIL, points: 16 }); // the dome
  g.fillStyle(COLORS.paper, 1);
  g.fillEllipse(x, y + 2, 112, 26); // the saucer hides the dome's lower half
  pencilEllipse(g, rng, x, y + 2, 56, 13, { ...PENCIL, width: 3, points: 18 });
  pencilLine(g, rng, x - 54, y + 2, x + 54, y + 2, { ...PENCIL, width: 1.5 });
  // Rim lights blinking in turn.
  for (let i = 0; i < 5; i++) {
    const on = Math.floor(time / 150 + i) % 2 === 0;
    pencilCircle(g, rng, x - 36 + i * 18, y + 7, on ? 3 : 2, { ...PENCIL, width: on ? 2.5 : 1.2, points: 6, passes: 1 });
  }
  if (warning > 0) {
    const style = { ...PENCIL, width: 1.5, alpha: 0.4 + warning * 0.5 };
    for (const dx of [-16, 0, 16]) pencilLine(g, rng, x + dx * 0.5, y + 16, x + dx * (1 + warning), y + 16 + 40 * warning, style);
  }
}

// The alien: a round head with big eyes and two antennae with bobbles.
function drawAlien(g, rng, x, y, time) {
  const style = { ...PENCIL, width: 2 };
  pencilCircle(g, rng, x, y, 9, { ...style, points: 10 });
  const wiggle = Math.sin(time / 200) * 2;
  pencilLine(g, rng, x - 4, y - 8, x - 8 + wiggle, y - 17, style);
  pencilLine(g, rng, x + 4, y - 8, x + 8 + wiggle, y - 17, style);
  pencilCircle(g, rng, x - 8 + wiggle, y - 18, 2, { ...style, points: 6, passes: 1 });
  pencilCircle(g, rng, x + 8 + wiggle, y - 18, 2, { ...style, points: 6, passes: 1 });
  for (const ex of [-3.5, 3.5]) {
    g.fillStyle(COLORS.pencil, 1);
    g.fillEllipse(x + ex, y - 1, 4, 6);
  }
}

// A glob of glowing goo falling from the UFO.
export function drawGoo(g, rng, x, y) {
  pencilCircle(g, rng, x, y, 8, { ...PENCIL, points: 10, wobble: 1.5 });
  pencilLine(g, rng, x, y - 8, x, y - 16, { ...PENCIL, width: 1.5 });
  pencilCircle(g, rng, x, y, 3, { ...PENCIL, width: 1.5, points: 6, passes: 1 });
}

// Goo splashed on the ground, fading as `t` goes 0 → 1.
export function drawGooSplat(g, rng, x, groundY, t) {
  const style = { ...PENCIL, width: 2, alpha: 1 - t };
  pencilEllipse(g, rng, x, groundY - 2, 16 + t * 6, 4, { ...style, points: 12 });
  for (const dx of [-14, 14]) pencilCircle(g, rng, x + dx * (1 + t), groundY - 10 - t * 6, 2.5, { ...style, points: 6, passes: 1 });
}

// ---- The rocket ----

// The rocket, centered at (x, y). `angle` is 0 pointing straight up and π/2
// pointing right. Options:
//   flame: 0..1 how big the flame is (0 = off)
//   face: true to show the stick figure looking out of the porthole
//   scale: size (1 = full size, about 150 px long with the flame off)
export function drawRocket(g, rng, x, y, angle, { flame = 0, face = false, scale = 1, time = 0 } = {}) {
  // Local coordinates: u across the rocket (right when upright), v along it
  // (toward the nose). Convert to the page with the rocket's angle.
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const px = Math.cos(angle);
  const py = Math.sin(angle);
  const p = (u, v) => ({ x: x + (u * px + v * dx) * scale, y: y + (u * py + v * dy) * scale });
  const line = (a, b, style = PENCIL) => pencilPolyline(g, rng, [p(...a), p(...b)], style);
  const path = (pts, style = PENCIL) => pencilPolyline(g, rng, pts.map((pt) => p(...pt)), style);

  if (flame > 0) drawFlame(g, rng, p, flame, time);

  // Body: straight sides up to a pointed nose cone.
  const body = [
    [-18, -52], [-18, 40], [-15, 55], [-9, 68], [0, 80], [9, 68], [15, 55], [18, 40], [18, -52],
  ];
  // Fill it with paper first so the flame and trees don't show through.
  g.fillStyle(COLORS.paper, 1);
  g.fillPoints(body.map((pt) => p(...pt)), true);
  path(body, { ...PENCIL, width: 3 });
  line([-18, -52], [18, -52]);

  // Nose band and body stripes.
  line([-16, 46], [16, 46], { ...PENCIL, width: 2 });
  line([-18, -28], [18, -28], { ...PENCIL, width: 2 });
  line([-18, -36], [18, -36], { ...PENCIL, width: 2 });

  // Rivets down both sides.
  for (const v of [30, 18, 6, -6, -18]) {
    for (const u of [-13, 13]) {
      const r = p(u, v);
      g.fillStyle(COLORS.pencil, 0.8);
      g.fillCircle(r.x, r.y, 1.3 * scale);
    }
  }

  // The porthole: two rings, and maybe our hero looking out.
  const port = p(0, 16);
  pencilCircle(g, rng, port.x, port.y, 10 * scale, { ...PENCIL, points: 12 });
  pencilCircle(g, rng, port.x, port.y, 7 * scale, { ...PENCIL, width: 1.5, points: 10, passes: 1 });
  if (face) {
    g.fillStyle(COLORS.pencil, 1);
    g.fillCircle(port.x - 2 * scale, port.y - 1 * scale, 1.2 * scale);
    g.fillCircle(port.x + 2 * scale, port.y - 1 * scale, 1.2 * scale);
    pencilPolyline(g, rng, [
      { x: port.x - 2.5 * scale, y: port.y + 2 * scale },
      { x: port.x, y: port.y + 3.5 * scale },
      { x: port.x + 2.5 * scale, y: port.y + 2 * scale },
    ], { ...PENCIL, width: 1.2, passes: 1 }); // a smile
  }

  // Fins: one each side, swept back, and the near fin as a line down the middle.
  path([[-18, -20], [-34, -48], [-34, -60], [-18, -50]]);
  path([[18, -20], [34, -48], [34, -60], [18, -50]]);
  line([0, -38], [0, -60], { ...PENCIL, width: 3 });

  // The nozzle.
  path([[-10, -52], [-13, -61], [13, -61], [10, -52]]);
}

// The rocket's flame: layered flickering tongues behind the nozzle, re-rolled
// on every boil tick (and every frame a little, so it dances).
function drawFlame(g, rng, p, size, time) {
  const flicker = 0.85 + Math.sin(time / 40) * 0.08 + rng() * 0.12;
  const length = 70 * size * flicker;
  const tongue = (width, len, jag) => {
    const pts = [p(-width, -61)];
    for (let i = 1; i <= 4; i++) {
      const t = i / 5;
      pts.push(p(-width * (1 - t) + (rng() - 0.5) * jag, -61 - len * t));
    }
    pts.push(p((rng() - 0.5) * jag, -61 - len)); // the tip
    for (let i = 4; i >= 1; i--) {
      const t = i / 5;
      pts.push(p(width * (1 - t) + (rng() - 0.5) * jag, -61 - len * t));
    }
    pts.push(p(width, -61));
    return pts;
  };
  const outer = tongue(13, length, 10);
  g.fillStyle(COLORS.fire, 0.45);
  g.fillPoints(outer, true);
  pencilPolyline(g, rng, outer, { ...PENCIL, width: 2 });
  const inner = tongue(6, length * 0.55, 6);
  g.fillStyle(COLORS.fire, 0.7);
  g.fillPoints(inner, true);
  pencilPolyline(g, rng, inner, { ...PENCIL, width: 1.5, passes: 1 });
}

// A puff of smoke: a lumpy circle that grows and fades as `t` goes 0 → 1.
export function drawSmoke(g, rng, x, y, t) {
  pencilCircle(g, rng, x, y, 8 + t * 22, { ...PENCIL, width: 2, alpha: 0.7 * (1 - t), points: 12, wobble: 3, passes: 1 });
}

// The launch pad under the rocket: a platform with a little tower.
export function drawLaunchPad(g, rng, x, groundY) {
  pencilLine(g, rng, x - 60, groundY - 8, x + 60, groundY - 8, { ...PENCIL, width: 3 });
  pencilLine(g, rng, x - 50, groundY - 8, x - 56, groundY, PENCIL);
  pencilLine(g, rng, x + 50, groundY - 8, x + 56, groundY, PENCIL);
  // A gantry tower beside it, with cross-bracing.
  const tx = x + 70;
  pencilLine(g, rng, tx, groundY, tx, groundY - 150, PENCIL);
  pencilLine(g, rng, tx + 16, groundY, tx + 16, groundY - 150, PENCIL);
  for (let y = groundY; y > groundY - 150; y -= 30) {
    pencilLine(g, rng, tx, y, tx + 16, y - 30, { ...PENCIL, width: 1.5 });
    pencilLine(g, rng, tx + 16, y, tx, y - 30, { ...PENCIL, width: 1.5 });
  }
}

// ---- The fireball ----

// A fireball at (x, y) with a streaming tail pointing back along (tailX, tailY)
// (a direction, e.g. opposite to how it's moving). `glow` (0..1) makes it swell
// while it's aiming.
export function drawFireball(g, rng, x, y, radius, tailX, tailY, time, glow = 0) {
  const len = Math.hypot(tailX, tailY) || 1;
  const tx = tailX / len;
  const ty = tailY / len;
  const r = radius * (1 + glow * 0.25 + Math.sin(time / 50) * 0.05);
  // The tail: flickering streaks fanning out behind.
  for (let i = -2; i <= 2; i++) {
    const spread = i * 0.22;
    const ax = tx * Math.cos(spread) - ty * Math.sin(spread);
    const ay = tx * Math.sin(spread) + ty * Math.cos(spread);
    const tail = r * (2.6 + rng() * 1.2) * (1 - Math.abs(i) * 0.15);
    pencilLine(g, rng, x + ax * r * 0.8, y + ay * r * 0.8, x + ax * tail, y + ay * tail, { ...PENCIL, width: 2, wobble: 2.5 });
  }
  // The ball: a warm fill and a jagged, flickering outline.
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const jag = i === 14 ? pts[0].jag : 1 + (rng() - 0.5) * 0.3;
    pts.push({ jag, x: x + Math.cos(a) * r * jag, y: y + Math.sin(a) * r * jag });
  }
  g.fillStyle(COLORS.fire, 0.6 + glow * 0.3);
  g.fillPoints(pts, true);
  pencilPolyline(g, rng, pts, { ...PENCIL, width: 2.5 });
  pencilCircle(g, rng, x, y, r * 0.45, { ...PENCIL, width: 1.5, points: 8, passes: 1 });
}

// The dashed line showing where the fireball is about to go.
export function drawAimLine(g, rng, x1, y, x2, alpha) {
  const style = { ...PENCIL, width: 2, alpha };
  for (let x = x1; x < x2; x += 34) pencilLine(g, rng, x, y, Math.min(x + 18, x2), y, style);
}

// ---- The city ----

// A skyline from `left` to `right`, standing on the ground line. Buildings are
// placed from a fixed list so the city looks the same every time.
const BUILDINGS = [
  [70, 150], [55, 230], [80, 180], [45, 300], [90, 140], [60, 260], [75, 200], [50, 330], [85, 170], [65, 240],
];
export function drawCity(g, rng, left, groundY) {
  let x = left;
  BUILDINGS.forEach(([w, h], i) => {
    const top = groundY - h;
    g.fillStyle(COLORS.paper, 1);
    g.fillRect(x, top, w, h);
    pencilPolyline(g, rng, [{ x, y: groundY }, { x, y: top }, { x: x + w, y: top }, { x: x + w, y: groundY }], PENCIL);
    // Windows in a grid.
    for (let wy = top + 14; wy < groundY - 20; wy += 24) {
      for (let wx = x + 10; wx < x + w - 14; wx += 18) {
        pencilPolyline(g, rng, [
          { x: wx, y: wy }, { x: wx + 8, y: wy }, { x: wx + 8, y: wy + 10 }, { x: wx, y: wy + 10 }, { x: wx, y: wy },
        ], { ...PENCIL, width: 1.2, passes: 1, wobble: 0.6 });
      }
    }
    // Every few buildings: an antenna or a water tower on the roof.
    if (i % 3 === 0) pencilLine(g, rng, x + w / 2, top, x + w / 2, top - 30, PENCIL);
    if (i % 4 === 1) {
      pencilEllipse(g, rng, x + w / 2, top - 22, 14, 10, { ...PENCIL, points: 10 });
      pencilLine(g, rng, x + w / 2 - 10, top, x + w / 2 - 8, top - 14, PENCIL);
      pencilLine(g, rng, x + w / 2 + 10, top, x + w / 2 + 8, top - 14, PENCIL);
    }
    x += w + 8;
  });
}

// A firework burst at (x, y): rays and sparks spreading out and fading as t: 0 → 1.
export function drawFirework(g, rng, x, y, t) {
  const rays = 12;
  const reach = 20 + t * 60;
  const style = { ...PENCIL, width: 2, alpha: 1 - t };
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const inner = reach * 0.45;
    pencilLine(g, rng, x + Math.cos(a) * inner, y + Math.sin(a) * inner, x + Math.cos(a) * reach, y + Math.sin(a) * reach, style);
    g.fillStyle(COLORS.fire, 0.8 * (1 - t));
    g.fillCircle(x + Math.cos(a) * (reach + 6), y + Math.sin(a) * (reach + 6), 3);
  }
}
