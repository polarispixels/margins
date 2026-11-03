// A coffee ring stain left on the page by a mug.

import { COLORS } from '../config.js';
import { boilRng, pencilCircle } from '../pencil.js';

export class CoffeeRing {
  constructor(scene, x, y, radius = 34) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.graphics = scene.add.graphics();
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 50);

    // A faint wash of coffee inside the ring.
    g.fillStyle(COLORS.coffee, 0.08);
    g.fillCircle(this.x, this.y, this.radius);

    // A few overlapping rough rings: a dark rim plus lighter "drips" around it.
    pencilCircle(g, rng, this.x, this.y, this.radius, { color: COLORS.coffee, width: 5, alpha: 0.45, wobble: 1.2, points: 18 });
    pencilCircle(g, rng, this.x + 2, this.y - 1, this.radius - 4, { color: COLORS.coffee, width: 2, alpha: 0.3, wobble: 1.5, points: 18 });
    pencilCircle(g, rng, this.x - 1, this.y + 2, this.radius + 3, { color: COLORS.coffee, width: 1.5, alpha: 0.25, wobble: 2, points: 18, passes: 1 });
  }
}
