// The notebook page background. Drawn once; it doesn't boil (real paper
// is printed, not hand-drawn). Platforms are traced over it in pencil.

import { WIDTH, HEIGHT, COLORS, PAPER } from '../config.js';

export function drawPaper(scene) {
  const g = scene.add.graphics();

  // The sheet itself.
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(0, 0, WIDTH, HEIGHT);

  // Light blue ruled lines across the whole page.
  g.lineStyle(1.5, COLORS.ruledLine, 0.9);
  for (let y = PAPER.firstLineY; y <= HEIGHT; y += PAPER.lineSpacing) {
    g.lineBetween(0, y, WIDTH, y);
  }

  // The red margin line. It's a thin double line on real notebook paper.
  g.lineStyle(2, COLORS.margin, 0.9);
  g.lineBetween(PAPER.marginX, 0, PAPER.marginX, HEIGHT);
  g.lineStyle(1, COLORS.margin, 0.5);
  g.lineBetween(PAPER.marginX + 4, 0, PAPER.marginX + 4, HEIGHT);

  // Hole punches: a slightly offset light circle gives a hint of a paper edge,
  // then the hole itself shows the desk through.
  for (const y of PAPER.holeYs) {
    g.fillStyle(COLORS.holeShadow, 1);
    g.fillCircle(PAPER.holeX + 1.5, y + 1.5, PAPER.holeRadius + 1.5);
    g.fillStyle(COLORS.hole, 1);
    g.fillCircle(PAPER.holeX, y, PAPER.holeRadius);
  }

  return g;
}
