// One panel of a comic strip: a hand-drawn box you jump into to play a level.
//
// Before the level is finished, the panel shows a faint sketch (a little guy on
// a line). After, it shows what happened: the guy, his new dog, and a heart.

import { COLORS } from '../config.js';
import { boilRng, pencilLine, pencilCircle } from '../pencil.js';
import { drawDog, drawHeart } from './Dog.js';

export class ComicPanel {
  // rect: { x, y, width, height } (top-left corner and size)
  constructor(scene, rect, { completed = false } = {}) {
    Object.assign(this, rect);
    this.completed = completed;
    this.frameGraphics = scene.add.graphics();
    this.artGraphics = scene.add.graphics();
    this.scene = scene;
  }

  get centerX() {
    return this.x + this.width / 2;
  }

  get centerY() {
    return this.y + this.height / 2;
  }

  get bottom() {
    return this.y + this.height;
  }

  // Has the stick figure jumped up into this panel? True when his head rises
  // past the panel's bottom edge while he's inside it from side to side.
  isEnteredBy(player) {
    const body = player.body;
    const inside = body.center.x > this.x + 10 && body.center.x < this.x + this.width - 10;
    return inside && body.top < this.bottom - 4;
  }

  // Switch to the finished art, fading it in.
  showCompleted(fadeMs = 800) {
    this.completed = true;
    this.artGraphics.setAlpha(0);
    this.scene.tweens.add({ targets: this.artGraphics, alpha: 1, duration: fadeMs });
  }

  draw(time) {
    const rng = boilRng(time, 400);
    const frame = this.frameGraphics;
    frame.clear();

    // The panel border: four slightly heavy pencil lines, overshooting at the corners
    // the way hand-drawn comic panels do.
    const style = { color: COLORS.pencil, width: 3.5 };
    const { x, y, width: w, height: h } = this;
    pencilLine(frame, rng, x - 4, y, x + w + 4, y, style);
    pencilLine(frame, rng, x - 4, y + h, x + w + 4, y + h, style);
    pencilLine(frame, rng, x, y - 4, x, y + h + 4, style);
    pencilLine(frame, rng, x + w, y - 4, x + w, y + h + 4, style);

    const art = this.artGraphics;
    art.clear();
    const groundY = y + h * 0.62;
    if (this.completed) {
      // The story so far: the little guy and his dog, and a heart between them.
      pencilLine(art, rng, x + 20, groundY, x + w - 20, groundY, { color: COLORS.pencil, width: 2.5 });
      drawStandingFigure(art, rng, this.centerX - 45, groundY);
      drawDog(art, rng, this.centerX + 35, groundY, { awake: true, time });
      drawHeart(art, rng, this.centerX - 5, groundY - 75, 16);
    } else {
      // A faint sketch: just a little guy standing on the start of a line.
      const faint = { color: COLORS.pencil, width: 2, alpha: 0.35 };
      pencilLine(art, rng, x + 20, groundY, this.centerX, groundY, faint);
      drawStandingFigure(art, rng, x + 60, groundY, faint);
    }
  }
}

// A simple standing stick figure for panel art, feet at (x, feetY).
function drawStandingFigure(g, rng, x, feetY, style = { color: COLORS.pencil, width: 2.5 }) {
  const hip = feetY - 26;
  const neck = feetY - 46;
  pencilLine(g, rng, x, hip, x, neck, style); // body
  pencilLine(g, rng, x, hip, x - 7, feetY, style); // legs
  pencilLine(g, rng, x, hip, x + 7, feetY, style);
  pencilLine(g, rng, x, feetY - 42, x - 14, feetY - 28, style); // arms
  pencilLine(g, rng, x, feetY - 42, x + 14, feetY - 28, style);
  pencilCircle(g, rng, x, neck - 8, 8, { ...style, points: 10 }); // head
}
