// One panel of a comic strip: a hand-drawn box you jump into to play a level.
//
// Its art depends on which panel it is:
//   'getting-started': before the level is finished, a faint sketch (a little guy
//                      on a line); after, what happened: the guy, his dog, a heart.
//   'climb':           a little guy bouncing up short lines past a spring and a
//                      star, with the best score written in the corner.

import { COLORS } from '../config.js';
import { boilRng, pencilLine, pencilCircle, pencilPolyline } from '../pencil.js';
import { drawDog, drawHeart } from './Dog.js';
import { drawStar } from './ClimbCourse.js';
import { PencilWord } from './PencilWord.js';

export class ComicPanel {
  // rect: { x, y, width, height } (top-left corner and size). Options: art ('getting-started' or 'climb'),
  // completed (show the finished art), best (a best score to write, if any).
  constructor(scene, rect, { art = 'getting-started', completed = false, best = 0 } = {}) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
    this.art = art;
    this.completed = completed;
    this.frameGraphics = scene.add.graphics();
    this.artGraphics = scene.add.graphics();
    this.scene = scene;
    this.bestWord = best > 0 ? new PencilWord(scene, String(best), this.x + 14, this.y + 14, 22) : null;
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
    if (this.art === 'climb') {
      this.drawClimbArt(art, rng, time);
    } else if (this.completed) {
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

  // Short lines climbing up the panel, a spring, a star, and a little guy mid-bounce.
  drawClimbArt(g, rng, time) {
    const style = { color: COLORS.pencil, width: 2.5 };
    const { x, y } = this;
    const steps = [
      { x: 40, y: 200, w: 70 },
      { x: 130, y: 150, w: 70 },
      { x: 50, y: 100, w: 60 },
      { x: 140, y: 50, w: 60 },
    ];
    for (const st of steps) pencilLine(g, rng, x + st.x, y + st.y, x + st.x + st.w, y + st.y, style);
    // A spring on the lowest line.
    const sx = x + 90;
    const sy = y + 200;
    pencilPolyline(g, rng, [
      { x: sx - 8, y: sy }, { x: sx + 8, y: sy - 4 }, { x: sx - 8, y: sy - 8 }, { x: sx + 8, y: sy - 12 },
    ], { ...style, width: 2 });
    pencilLine(g, rng, sx - 11, sy - 13, sx + 11, sy - 13, style);
    drawStar(g, rng, x + 80, y + 70, 10);
    // The little guy, bobbing up and down as if bouncing.
    const bob = Math.abs(Math.sin(time / 260)) * 14;
    drawStandingFigure(g, rng, x + 170, y + 150 - 6 - bob, { color: COLORS.pencil, width: 2.5 });
    if (this.bestWord) this.bestWord.draw(time);
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
