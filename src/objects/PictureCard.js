// One choice in Read: a pencil card with a picture on it.
//
// States: normal; focused (the keyboard is on it: light shading); wrong (it
// wiggles, then stays faded so the second try is among the others); right (a
// pencil circle goes round it). Cards live in screen space.

import { COLORS } from '../config.js';
import { boilRng, pencilLine, pencilEllipse } from '../pencil.js';
import { drawPicture } from './PencilPicture.js';
import { PICTURES } from '../data/pictures.js';

const WIGGLE_MS = 450;
const FRAME = { color: COLORS.pencil, width: 3 };

export class PictureCard {
  constructor(scene, entry, index) {
    this.scene = scene;
    this.entry = entry;
    this.index = index;
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(10);
    this.rect = { x: 0, y: 0, width: 0, height: 0 };
    this.state = 'normal'; // 'normal', 'wrong', or 'right'
    this.wiggleAt = -Infinity;
    this.focused = false;
  }

  place(x, y, width, height) {
    this.rect = { x, y, width, height };
  }

  contains(px, py) {
    const { x, y, width, height } = this.rect;
    return px > x && px < x + width && py > y && py < y + height;
  }

  get pickable() {
    return this.state === 'normal';
  }

  wrong(time) {
    this.state = 'wrong';
    this.wiggleAt = time;
  }

  right() {
    this.state = 'right';
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 700 + this.index);
    const { x, y, width: w, height: h } = this.rect;

    // A wrong pick wiggles side to side, settling down, then stays faded.
    const since = time - this.wiggleAt;
    const dx = since < WIGGLE_MS ? Math.sin(since / 30) * 10 * (1 - since / WIGGLE_MS) : 0;
    const faded = this.state === 'wrong' && since >= WIGGLE_MS;
    const alpha = faded ? 0.3 : 1;
    const left = x + dx;

    g.fillStyle(COLORS.paper, 1);
    g.fillRect(left, y, w, h);
    if (this.focused && this.pickable) {
      g.fillStyle(COLORS.pencil, 0.1);
      g.fillRect(left, y, w, h);
    }
    const frame = { ...FRAME, alpha: 0.9 * alpha, width: this.focused && this.pickable ? 4.5 : 3 };
    pencilLine(g, rng, left - 3, y, left + w + 3, y, frame);
    pencilLine(g, rng, left - 3, y + h, left + w + 3, y + h, frame);
    pencilLine(g, rng, left, y - 3, left, y + h + 3, frame);
    pencilLine(g, rng, left + w, y - 3, left + w, y + h + 3, frame);

    const size = Math.min(w, h) * 0.84;
    drawPicture(g, rng, PICTURES[this.entry.picture], left + (w - size) / 2, y + (h - size) / 2, size, alpha);

    if (this.state === 'right') {
      // A quick pencil circle around the card, like circling the answer on a worksheet.
      pencilEllipse(g, rng, left + w / 2, y + h / 2, w * 0.58, h * 0.58, { ...FRAME, width: 3.5, points: 18, wobble: 3 });
    }
  }

  destroy() {
    this.graphics.destroy();
  }
}
