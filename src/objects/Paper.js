// The notebook page background. Drawn once; it doesn't boil (real paper
// is printed, not hand-drawn). Platforms are traced over it in pencil.
//
// The sheet is drawn much bigger than the level so it covers any screen shape:
// extra width shows up on the right, extra height above the top line
// (screen.js scrolls the camera so the floor stays at the bottom).

import { HEIGHT, PAGE_MAX_WIDTH, COLORS, PAPER } from '../config.js';

const PAGE_TOP = -HEIGHT; // room for screens up to twice as tall as the level

// The y position of ruled line number `index` (0 = the top ruled line).
export function lineY(index) {
  return PAPER.firstLineY + index * PAPER.lineSpacing;
}

// `bottom` is how far down the sheet reaches (the home page is much taller than one screen).
export function drawPaper(scene, { bottom = HEIGHT } = {}) {
  const g = scene.add.graphics();

  // The sheet itself.
  g.fillStyle(COLORS.paper, 1);
  g.fillRect(0, PAGE_TOP, PAGE_MAX_WIDTH, bottom - PAGE_TOP);

  // Light blue ruled lines across the whole page.
  g.lineStyle(1.5, COLORS.ruledLine, 0.9);
  for (let y = PAPER.firstLineY; y <= bottom; y += PAPER.lineSpacing) {
    g.lineBetween(0, y, PAGE_MAX_WIDTH, y);
  }

  // The red margin line. It's a thin double line on real notebook paper.
  g.lineStyle(2, COLORS.margin, 0.9);
  g.lineBetween(PAPER.marginX, PAGE_TOP, PAPER.marginX, bottom);
  g.lineStyle(1, COLORS.margin, 0.5);
  g.lineBetween(PAPER.marginX + 4, PAGE_TOP, PAPER.marginX + 4, bottom);

  // Hole punches: a slightly offset light circle gives a hint of a paper edge,
  // then the hole itself shows the desk through.
  // On a tall sheet the same three holes repeat every screen-height.
  for (let offset = 0; offset < bottom; offset += HEIGHT) {
    for (const holeY of PAPER.holeYs) {
      const y = holeY + offset;
      g.fillStyle(COLORS.holeShadow, 1);
      g.fillCircle(PAPER.holeX + 1.5, y + 1.5, PAPER.holeRadius + 1.5);
      g.fillStyle(COLORS.hole, 1);
      g.fillCircle(PAPER.holeX, y, PAPER.holeRadius);
    }
  }

  return g;
}
