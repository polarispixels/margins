// The two guides of the learn levels, drawn in pencil: a cat (CLIMB) and a monkey (SWING).
//
// Like drawDog(), these are plain functions so any scene can draw them. Both are drawn
// facing right when `facing` is 1; -1 mirrors them. Offsets below are in "local" pixels
// (x forward, y down) and get scaled and mirrored by the `at` helper.

import { COLORS } from '../config.js';
import { pencilCircle, pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

// Returns a function that turns local offsets into page points.
function placer(x, y, facing, scale) {
  return (dx, dy) => ({ x: x + dx * facing * scale, y: y + dy * scale });
}

// A cat about 50 px long. (x, floorY) is the middle of its paws, on the line.
export function drawCat(g, rng, x, floorY, { pose = 'stand', facing = 1, time = 0, scale = 1, alpha = 1 } = {}) {
  const at = placer(x, floorY, facing, scale);
  const style = { color: COLORS.pencil, width: Math.max(1.5, 2.3 * scale), wobble: 1 * scale, alpha: 0.9 * alpha };
  const thin = { ...style, width: style.width * 0.6, wobble: 0.4 * scale };
  const line = (a, b, s = style) => pencilLine(g, rng, a.x, a.y, b.x, b.y, s);
  const ellipse = (c, rx, ry, s = style) => pencilEllipse(g, rng, c.x, c.y, rx * scale, ry * scale, s);
  const poly = (pts, s = style) => pencilPolyline(g, rng, pts.map((p) => at(p[0], p[1])), s);

  // The head: round, two pointy ears, eyes, a nose, whiskers. (hx, hy) is its center.
  const head = (hx, hy, { eyesClosed = false } = {}) => {
    ellipse(at(hx, hy), 9, 8);
    poly([[hx - 8, hy - 3], [hx - 7, hy - 15], [hx - 1, hy - 8]]); // back ear
    poly([[hx + 1, hy - 8], [hx + 7, hy - 15], [hx + 8, hy - 3]]); // front ear
    for (const ex of [hx + 1, hx + 6]) {
      if (eyesClosed) line(at(ex - 1.5, hy - 1), at(ex + 1.5, hy - 1), thin);
      else pencilCircle(g, rng, at(ex, hy - 1).x, at(ex, hy - 1).y, 1.2 * scale, { ...thin, passes: 1 });
    }
    poly([[hx + 8, hy + 1], [hx + 10, hy + 2], [hx + 8, hy + 3]], thin); // nose
    line(at(hx + 7, hy + 3), at(hx + 17, hy + 1), thin); // whiskers
    line(at(hx + 7, hy + 4), at(hx + 17, hy + 6), thin);
  };

  if (pose === 'sit' || pose === 'lick') {
    // Sitting up: a tall pear-shaped body, front legs straight, tail curled round the paws.
    ellipse(at(0, -14), 10, 14); // body
    line(at(6, -12), at(6, 0)); // front leg
    line(at(-2, -12), at(-2, 0)); // other front leg
    ellipse(at(-10, -3), 7, 3.5); // back haunch paw
    poly([[-10, -4], [-20, -2], [-24, -8], [-20, -14]]); // tail curls up behind
    if (pose === 'lick') {
      const lick = Math.sin(time / 120) * 2; // paw moves back and forth at the mouth
      head(7, -34, { eyesClosed: true });
      line(at(5, -13), at(12 + lick, -29)); // raised paw
    } else {
      head(4, -34);
    }
    return;
  }

  if (pose === 'leap') {
    // Stretched out in the air: body slanted, legs reaching front and back.
    ellipse(at(0, -24), 18, 7);
    line(at(10, -20), at(22, -14));
    line(at(6, -19), at(16, -9));
    line(at(-10, -22), at(-22, -14));
    line(at(-14, -20), at(-24, -10));
    poly([[-17, -26], [-27, -32], [-35, -30]]); // tail streams behind
    head(24, -30);
    return;
  }

  // Standing or walking: long body, four legs, tail up.
  const swing = pose === 'walk' ? Math.sin(time / 90) * 5 : 0;
  ellipse(at(0, -17), 18, 7.5); // body
  line(at(11, -13), at(11 + swing, 0)); // front legs
  line(at(7, -12), at(7 - swing, 0));
  line(at(-11, -13), at(-11 - swing, 0)); // back legs
  line(at(-7, -12), at(-7 + swing, 0));
  const flick = Math.sin(time / 250) * 4; // the tail tip sways
  poly([[-17, -19], [-24, -26], [-24 + flick * 0.5, -35], [-20 + flick, -41]]);
  head(21, -27);
}

// A monkey about 55 px tall. (x, y) is its feet on the line; in 'hang' it's its hands.
export function drawMonkey(g, rng, x, y, { pose = 'stand', facing = 1, time = 0, scale = 1, alpha = 1 } = {}) {
  const at = placer(x, y, facing, scale);
  const style = { color: COLORS.pencil, width: Math.max(1.5, 2.3 * scale), wobble: 1 * scale, alpha: 0.9 * alpha };
  const thin = { ...style, width: style.width * 0.6, wobble: 0.4 * scale };
  const line = (a, b, s = style) => pencilLine(g, rng, a.x, a.y, b.x, b.y, s);
  const ellipse = (c, rx, ry, s = style) => pencilEllipse(g, rng, c.x, c.y, rx * scale, ry * scale, s);
  const poly = (pts, s = style) => pencilPolyline(g, rng, pts.map((p) => at(p[0], p[1])), s);

  // The head: round, big round ears, a lighter face oval, eyes, a smile.
  const head = (hx, hy) => {
    ellipse(at(hx, hy), 10, 9.5);
    ellipse(at(hx - 10, hy - 1), 4.5, 4.5); // ears
    ellipse(at(hx + 10, hy - 1), 4.5, 4.5);
    ellipse(at(hx + 1, hy + 2), 6.5, 5.5, thin); // face patch
    for (const ex of [hx - 2.5, hx + 4.5]) {
      pencilCircle(g, rng, at(ex, hy - 1.5).x, at(ex, hy - 1.5).y, 1.2 * scale, { ...thin, passes: 1 });
    }
    poly([[hx - 2, hy + 3.5], [hx + 1, hy + 5.5], [hx + 4, hy + 3.5]], thin); // smile
  };

  // Torso from the shoulders (0, sy) down to the hips (0, hy).
  const torso = (sy, hy) => ellipse(at(0, (sy + hy) / 2), 7, (hy - sy) / 2 + 2);

  // The curly tail, from the hips.
  const tail = (hx, hy, wave = 0) =>
    poly([[hx - 5, hy], [hx - 15, hy + 4], [hx - 25 + wave, hy - 1], [hx - 27 + wave, hy - 12], [hx - 21 + wave, hy - 18], [hx - 17 + wave, hy - 13]]);

  if (pose === 'hang') {
    // Both hands on the rope at (0, 0); long arms up, body and legs dangling.
    const sway = Math.sin(time / 300) * 2;
    line(at(-3, 0), at(-5, 14)); // arms
    line(at(3, 0), at(5, 14));
    head(0, 24);
    torso(34, 50);
    line(at(-3, 50), at(-6 + sway, 62)); // legs hang
    line(at(3, 50), at(6 + sway, 62));
    tail(0, 52, sway);
    return;
  }

  if (pose === 'cheer') {
    // Arms thrown up, a little bounce.
    const bounce = Math.abs(Math.sin(time / 130)) * 3;
    const b = (dy) => dy - bounce;
    line(at(-7, b(-33)), at(-22, b(-54))); // arms up
    line(at(7, b(-33)), at(22, b(-54)));
    head(0, b(-42));
    torso(b(-32), b(-16));
    line(at(-4, b(-14)), at(-9, 0)); // legs
    line(at(4, b(-14)), at(9, 0));
    tail(0, b(-17), Math.sin(time / 100) * 3);
    return;
  }

  // Standing or walking.
  const swing = pose === 'walk' ? Math.sin(time / 90) * 6 : 0;
  head(2, -44);
  torso(-34, -17);
  line(at(-1, -32), at(-8 - swing, -16)); // arms swing
  line(at(4, -32), at(9 + swing, -16));
  line(at(-3, -15), at(-6 + swing, 0)); // legs
  line(at(3, -15), at(6 - swing, 0));
  tail(0, -18, Math.sin(time / 200) * 3);
}
