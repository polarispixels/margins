// The endless notebook page for Climb: a sheet CLIMB.width wide that goes on
// forever upward. Only the part on screen is drawn, every frame (it's cheap).
// Ruled lines sit at every multiple of PAPER.lineSpacing, so platforms placed on
// those y positions line up with them.

import { CLIMB, COLORS, PAPER } from '../config.js';

const HOLE_SPACING = 320; // distance between hole punches down the left side
const HOLE_X = 25;
const HOLE_RADIUS = 10;

export class ScrollingPaper {
  constructor(scene) {
    this.graphics = scene.add.graphics().setDepth(-10);
  }

  // Draw the page between world y positions `top` and `bottom`.
  draw(top, bottom) {
    const g = this.graphics;
    g.clear();

    g.fillStyle(COLORS.paper, 1);
    g.fillRect(0, top, CLIMB.width, bottom - top);

    // Ruled lines: start at the first multiple of the spacing on screen.
    g.lineStyle(1.5, COLORS.ruledLine, 0.9);
    const spacing = PAPER.lineSpacing;
    for (let y = Math.ceil(top / spacing) * spacing; y <= bottom; y += spacing) {
      g.lineBetween(0, y, CLIMB.width, y);
    }

    // The red margin (the left wall).
    g.lineStyle(2, COLORS.margin, 0.9);
    g.lineBetween(CLIMB.marginX, top, CLIMB.marginX, bottom);
    g.lineStyle(1, COLORS.margin, 0.5);
    g.lineBetween(CLIMB.marginX + 4, top, CLIMB.marginX + 4, bottom);

    // Hole punches, repeating forever.
    for (let y = Math.floor(top / HOLE_SPACING) * HOLE_SPACING; y <= bottom + HOLE_SPACING; y += HOLE_SPACING) {
      g.fillStyle(COLORS.holeShadow, 1);
      g.fillCircle(HOLE_X + 1.5, y + 1.5, HOLE_RADIUS + 1.5);
      g.fillStyle(COLORS.hole, 1);
      g.fillCircle(HOLE_X, y, HOLE_RADIUS);
    }
  }
}
