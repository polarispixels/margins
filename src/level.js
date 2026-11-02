// The layout of the page. Platforms are described by which ruled line they
// sit on (0 = top line) and where they start and end horizontally.

import { PAPER, WIDTH } from './config.js';

// The y position of ruled line number `index`.
export function lineY(index) {
  return PAPER.firstLineY + index * PAPER.lineSpacing;
}

export const LEVEL = {
  // The floor runs the full width of the page, from the margin to the edge.
  // It's solid; the other platforms are one-way (you can jump up through them).
  floor: { line: 12, from: PAPER.marginX, to: WIDTH },

  platforms: [
    { line: 9, from: 190, to: 360 },
    { line: 6, from: 400, to: 560 },
    { line: 9, from: 640, to: 820 },
    { line: 3, from: 590, to: 740 },
    { line: 4, from: 180, to: 320 },
    { line: 2, from: 780, to: 940 }, // the goal platform
  ],

  // The coffee ring sits on the goal platform.
  goal: { x: 860, line: 2 },
};
