// A little doodle dog: our own character. In Getting Started he's asleep in a
// coffee ring until the stick figure finds him.
//
// drawDog() and drawHeart() are plain functions so the comic page can draw the
// same dog (smaller) in a finished panel.

import { COLORS } from '../config.js';
import { boilRng, pencilCircle, pencilEllipse, pencilLine, pencilPolyline } from '../pencil.js';

const WAKE_HOP_MS = 900; // how long he hops for joy after waking
const SCALE = 1.4; // a bit bigger than in panel art, so he's easy to spot in the level

export class Dog {
  // (x, floorY): where he lies, centered on x, sitting on the line at floorY.
  constructor(scene, x, floorY) {
    this.scene = scene;
    this.x = x;
    this.floorY = floorY;
    this.awake = false;
    this.wokeAt = 0;
    this.graphics = scene.add.graphics();
  }

  // Touching the dog: a box around him, a bit generous so it's easy to find.
  contains(point) {
    return Math.abs(point.x - this.x) < 62 && point.y > this.floorY - 80 && point.y < this.floorY + 10;
  }

  wake(time) {
    if (this.awake) return;
    this.awake = true;
    this.wokeAt = time;
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 60);
    const sinceWake = time - this.wokeAt;
    // A few happy hops right after waking up.
    const hop = this.awake && sinceWake < WAKE_HOP_MS ? Math.abs(Math.sin(sinceWake / 90)) * 8 : 0;
    drawDog(g, rng, this.x, this.floorY - hop, { awake: this.awake, time, scale: SCALE });

    if (this.awake) {
      // A heart floats up between the dog and the stick figure.
      const rise = Math.min(1, sinceWake / 600);
      drawHeart(g, rng, this.x - 45, this.floorY - 95 - rise * 25, 26);
    } else {
      drawZzz(g, rng, this.x, this.floorY - 6, time);
    }
  }
}

// Draw the dog facing left. `scale` shrinks him for panel art.
export function drawDog(g, rng, x, floorY, { awake = false, time = 0, scale = 1 } = {}) {
  const s = scale;
  const style = { color: COLORS.pencil, width: Math.max(1.5, 2.5 * s), wobble: 1.1 * s };
  const p = (dx, dy) => ({ x: x + dx * s, y: floorY + dy * s }); // offsets from his spot

  if (!awake) {
    // Curled up asleep: an oval body lying on the line, head resting on the left.
    pencilEllipse(g, rng, x, floorY - 10 * s, 20 * s, 10 * s, style);
    pencilCircle(g, rng, x - 21 * s, floorY - 12 * s, 8 * s, { ...style, points: 10 });
    pencilPolyline(g, rng, [p(-24, -18), p(-31, -10), p(-26, -8)], style); // floppy ear
    pencilLine(g, rng, x - 26 * s, floorY - 13 * s, x - 21 * s, floorY - 13 * s, { ...style, wobble: 0.4 * s }); // closed eye
    pencilPolyline(g, rng, [p(19, -12), p(26, -17), p(23, -22)], style); // curled tail
    return;
  }

  // Awake and standing, tail wagging.
  pencilEllipse(g, rng, x, floorY - 20 * s, 18 * s, 9 * s, style); // body
  for (const legX of [-12, -6, 6, 12]) {
    pencilLine(g, rng, x + legX * s, floorY - 13 * s, x + legX * s, floorY, style);
  }
  pencilCircle(g, rng, x - 22 * s, floorY - 32 * s, 8 * s, { ...style, points: 10 }); // head
  pencilPolyline(g, rng, [p(-25, -38), p(-29, -47), p(-19, -40)], style); // perky ear
  pencilCircle(g, rng, x - 25 * s, floorY - 33 * s, 1.2 * s, { ...style, wobble: 0.2 * s, passes: 1 }); // eye
  pencilLine(g, rng, x - 30 * s, floorY - 30 * s, x - 28 * s, floorY - 30 * s, style); // nose
  const wag = -0.9 + Math.sin(time / 50) * 0.5; // tail angle swings back and forth
  pencilLine(g, rng, x + 17 * s, floorY - 22 * s,
    x + 17 * s + Math.cos(wag) * 14 * s, floorY - 22 * s + Math.sin(wag) * 14 * s, style);
}

// A pencil heart centered at (cx, cy), `size` pixels wide-ish.
export function drawHeart(g, rng, cx, cy, size, opts = {}) {
  const points = [];
  for (let i = 0; i <= 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    // The classic heart curve, scaled down to `size`.
    const hx = 16 * Math.sin(t) ** 3;
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    points.push({ x: cx + (hx / 32) * size, y: cy - (hy / 32) * size });
  }
  pencilPolyline(g, rng, points, { color: COLORS.pencil, width: 2, ...opts });
}

// Little Zs drifting up from a sleeping dog.
function drawZzz(g, rng, x, floorY, time) {
  for (let i = 0; i < 3; i++) {
    const t = ((time / 1600 + i / 3) % 1); // each Z loops from 0 to 1, offset from the others
    const size = 5 + t * 5;
    const zx = x - 10 + t * 14;
    const zy = floorY - 28 - t * 34;
    pencilPolyline(g, rng, [
      { x: zx, y: zy }, { x: zx + size, y: zy }, { x: zx, y: zy + size }, { x: zx + size, y: zy + size },
    ], { color: COLORS.pencil, width: 1.5, alpha: 0.9 * (1 - t), wobble: 0.5 });
  }
}
