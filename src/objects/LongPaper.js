// One very long sheet of notebook paper for side-scrolling levels (Launch).
// Ruled lines run the whole length; the red margin and hole punches appear only
// at the very start of the sheet. Only the part on screen is drawn, every frame.

import { HEIGHT, COLORS, PAPER } from '../config.js';

export class LongPaper {
  constructor(scene) {
    this.graphics = scene.add.graphics().setDepth(-20);
  }

  // Draw the sheet between world x `left` and `right` (and from `top` down to the
  // bottom of the page, for screens taller than the level).
  draw(left, right, top) {
    const g = this.graphics;
    g.clear();
    g.fillStyle(COLORS.paper, 1);
    g.fillRect(left, top, right - left, HEIGHT - top);

    g.lineStyle(1.5, COLORS.ruledLine, 0.9);
    for (let y = PAPER.firstLineY; y <= HEIGHT; y += PAPER.lineSpacing) {
      g.lineBetween(left, y, right, y);
    }

    if (left < PAPER.marginX + 10) {
      g.lineStyle(2, COLORS.margin, 0.9);
      g.lineBetween(PAPER.marginX, top, PAPER.marginX, HEIGHT);
      g.lineStyle(1, COLORS.margin, 0.5);
      g.lineBetween(PAPER.marginX + 4, top, PAPER.marginX + 4, HEIGHT);
      for (const y of PAPER.holeYs) {
        g.fillStyle(COLORS.holeShadow, 1);
        g.fillCircle(PAPER.holeX + 1.5, y + 1.5, PAPER.holeRadius + 1.5);
        g.fillStyle(COLORS.hole, 1);
        g.fillCircle(PAPER.holeX, y, PAPER.holeRadius);
      }
    }
  }
}
