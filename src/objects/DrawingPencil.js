// The pencil that draws the world: a little pencil whose point sits at (x, y),
// leaning back like it's held by an invisible hand.

import { COLORS } from '../config.js';
import { boilRng, pencilLine } from '../pencil.js';

const LENGTH = 70;
const HALF_WIDTH = 5;
const TIP_LENGTH = 12;
const ANGLE = -1.0; // radians; leans up and to the right

export class DrawingPencil {
  constructor(scene) {
    this.graphics = scene.add.graphics().setDepth(6);
    this.visible = true;
  }

  draw(time, x, y) {
    const g = this.graphics;
    g.clear();
    if (!this.visible) return;
    const rng = boilRng(time, 70);
    const style = { color: COLORS.pencil, width: 2, wobble: 0.8 };

    // Unit vectors along the pencil (from tip to eraser) and across it.
    const ax = Math.cos(ANGLE);
    const ay = Math.sin(ANGLE);
    const px = -ay;
    const py = ax;
    const at = (along, across) => ({ x: x + ax * along + px * across, y: y + ay * along + py * across });

    // The sharpened tip: a small filled graphite point, then the wood cone.
    const lead = at(4, 0);
    g.fillStyle(COLORS.pencil, 0.9);
    g.fillTriangle(x, y, lead.x + px * 1.5, lead.y + py * 1.5, lead.x - px * 1.5, lead.y - py * 1.5);
    const coneL = at(TIP_LENGTH, -HALF_WIDTH);
    const coneR = at(TIP_LENGTH, HALF_WIDTH);
    pencilLine(g, rng, x, y, coneL.x, coneL.y, style);
    pencilLine(g, rng, x, y, coneR.x, coneR.y, style);

    // The body, and a band near the end where the eraser sits.
    const endL = at(LENGTH, -HALF_WIDTH);
    const endR = at(LENGTH, HALF_WIDTH);
    pencilLine(g, rng, coneL.x, coneL.y, endL.x, endL.y, style);
    pencilLine(g, rng, coneR.x, coneR.y, endR.x, endR.y, style);
    pencilLine(g, rng, endL.x, endL.y, endR.x, endR.y, style);
    const bandL = at(LENGTH - 12, -HALF_WIDTH);
    const bandR = at(LENGTH - 12, HALF_WIDTH);
    pencilLine(g, rng, bandL.x, bandL.y, bandR.x, bandR.y, style);
  }
}
