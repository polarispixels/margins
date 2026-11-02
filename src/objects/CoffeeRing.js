// The goal: a coffee ring stain left on the page by a mug.

import { COLORS } from '../config.js';
import { boilRng, pencilCircle } from '../pencil.js';

const RADIUS = 34;

export class CoffeeRing {
  constructor(scene, x, y) {
    this.x = x;
    this.y = y;
    this.radius = RADIUS;
    this.graphics = scene.add.graphics();
  }

  // Is a point inside the ring?
  contains(point) {
    return Math.hypot(point.x - this.x, point.y - this.y) < this.radius;
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 50);

    // A faint wash of coffee inside the ring.
    g.fillStyle(COLORS.coffee, 0.08);
    g.fillCircle(this.x, this.y, RADIUS);

    // A few overlapping rough rings: a dark rim plus lighter "drips" around it.
    pencilCircle(g, rng, this.x, this.y, RADIUS, { color: COLORS.coffee, width: 5, alpha: 0.45, wobble: 1.2, points: 18 });
    pencilCircle(g, rng, this.x + 2, this.y - 1, RADIUS - 4, { color: COLORS.coffee, width: 2, alpha: 0.3, wobble: 1.5, points: 18 });
    pencilCircle(g, rng, this.x - 1, this.y + 2, RADIUS + 3, { color: COLORS.coffee, width: 1.5, alpha: 0.25, wobble: 2, points: 18, passes: 1 });
  }
}
