// Drawings for Launch's rocket puzzle, the first colored things in Margins.
// Color is drawn like colored pencil: a colored outline and diagonal hatching
// inside, so it still looks hand-drawn and boils with everything else.

import { COLORS } from '../config.js';
import { pencilCircle, pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

const PENCIL = { color: COLORS.pencil, width: 2.5 };
const THIN = { color: COLORS.pencil, width: 1.5 };

// Colored-pencil shading inside a circle: diagonal strokes a few px apart.
export function hatchCircle(g, rng, cx, cy, r, color, alpha = 0.75) {
  const style = { color, width: 1.6, alpha, passes: 1, wobble: 0.6 };
  for (let k = -r + 2; k < r - 1; k += 3.5) {
    const half = Math.sqrt(r * r - k * k) * 0.9;
    // Offset along the (1, 1) normal, then run along the (1, -1) diagonal.
    const mx = cx + k * Math.SQRT1_2;
    const my = cy + k * Math.SQRT1_2;
    const dx = half * Math.SQRT1_2;
    pencilLine(g, rng, mx - dx, my + dx, mx + dx, my - dx, style);
  }
  pencilCircle(g, rng, cx, cy, r, { color, width: 2.2, points: 12 });
}

// A colored push button on a little box, sitting on the ground at (x, groundY).
// `pressed` flattens the dome; `shake` (0..1) jiggles it after a wrong press.
export const SWITCH_WIDTH = 44;
export const SWITCH_HEIGHT = 14; // the box you stand on
export function drawSwitch(g, rng, x, groundY, color, pressed, shake, time) {
  const cx = x + (shake ? Math.sin(time / 25) * 3 * shake : 0);
  const top = groundY - SWITCH_HEIGHT;
  const w = SWITCH_WIDTH / 2;
  // The dome: hatched with color, flat when pressed.
  const r = 14;
  const squash = pressed ? 0.25 : 1;
  const style = { color, width: 1.6, alpha: 0.75, passes: 1, wobble: 0.6 };
  for (let u = -r + 2; u < r - 1; u += 3.5) {
    const h = Math.sqrt(r * r - u * u) * squash;
    pencilLine(g, rng, cx + u - 1.5, top - h + 1, cx + u + 1.5, top, style);
  }
  const dome = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (i / 10) * Math.PI;
    dome.push({ x: cx + Math.cos(a) * r, y: top + Math.sin(a) * r * squash });
  }
  pencilPolyline(g, rng, dome, { color, width: 2.4 });
  // The box underneath, in pencil.
  pencilPolyline(g, rng, [
    { x: cx - w, y: groundY }, { x: cx - w, y: top }, { x: cx + w, y: top }, { x: cx + w, y: groundY },
  ], PENCIL);
  pencilLine(g, rng, cx - w + 6, top + 7, cx + w - 6, top + 7, { ...THIN, alpha: 0.5, passes: 1 });
}

// The clue: a note pinned to a signpost at x. Three colored dots in `order`
// (e.g. ['blue', 'red', 'green']) with an arrow under them pointing the way to
// read them. The first `done` dots get a check mark.
export function drawClue(g, rng, x, groundY, order, done) {
  const top = groundY - 150;
  pencilLine(g, rng, x, groundY, x, top + 40, PENCIL); // the post
  // The note, slightly crooked, with a strip of tape.
  const w = 110;
  const h = 64;
  const left = x - w / 2;
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(left, top, w, h);
  pencilPolyline(g, rng, [
    { x: left, y: top + 2 }, { x: left + w, y: top - 2 }, { x: left + w + 1, y: top + h - 1 }, { x: left - 1, y: top + h + 2 }, { x: left, y: top + 2 },
  ], { ...PENCIL, width: 2 });
  pencilPolyline(g, rng, [
    { x: x - 14, y: top - 7 }, { x: x + 14, y: top - 9 }, { x: x + 15, y: top + 5 }, { x: x - 13, y: top + 7 }, { x: x - 14, y: top - 7 },
  ], { ...THIN, alpha: 0.6 });
  order.forEach((name, i) => {
    const dx = left + 22 + i * 33;
    const dy = top + 25;
    hatchCircle(g, rng, dx, dy, 10, COLORS[name]);
    if (i < done) {
      pencilPolyline(g, rng, [{ x: dx - 7, y: dy - 2 }, { x: dx - 1, y: dy + 6 }, { x: dx + 10, y: dy - 12 }], { ...PENCIL, width: 3 });
    }
  });
  // The arrow: read left to right.
  const ay = top + 50;
  pencilLine(g, rng, left + 16, ay, left + w - 18, ay, { ...PENCIL, width: 2 });
  pencilPolyline(g, rng, [{ x: left + w - 28, y: ay - 7 }, { x: left + w - 17, y: ay }, { x: left + w - 28, y: ay + 7 }], { ...PENCIL, width: 2 });
}

// A tall fence at the end of the launch pad: posts, crossbars, and warning stripes.
export function drawFence(g, rng, x, groundY, width, height) {
  const top = groundY - height;
  pencilLine(g, rng, x, groundY, x, top, PENCIL);
  pencilLine(g, rng, x + width, groundY, x + width, top, PENCIL);
  for (let y = top + 20; y < groundY; y += 36) pencilLine(g, rng, x - 4, y, x + width + 4, y, THIN);
  for (let y = top; y < groundY - 16; y += 24) pencilLine(g, rng, x, y + 16, x + width, y, { ...THIN, alpha: 0.6 });
  pencilEllipse(g, rng, x + width / 2, top - 6, width / 2 + 4, 6, { ...THIN, points: 10 });
}
