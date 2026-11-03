// One panel of a comic strip: a hand-drawn box you jump into to play a level.
//
// Its art depends on which panel it is:
//   'getting-started': before the level is finished, a faint sketch (a little guy
//                      on a line); after, what happened: the guy, his dog, a heart.
//   'launch':          a rocket on its pad by some trees; after, the rocket flying
//                      over the city with a firework.
//   'climb':           a little guy bouncing up short lines past a spring and a
//                      star, with the best score written in the corner.
//   'read':            the word CAT written over a pencil cat.

import { COLORS } from '../config.js';
import { boilRng, pencilLine, pencilCircle, pencilPolyline } from '../pencil.js';
import { drawDog, drawHeart } from './Dog.js';
import { drawStar } from './climbArt.js';
import { drawRocket, drawLaunchPad, drawTree, drawFirework } from './launchArt.js';
import { PencilWord } from './PencilWord.js';
import { drawPicture } from './PencilPicture.js';
import { PICTURES } from '../data/pictures.js';

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
    this.readWord = art === 'read' ? new PencilWord(scene, 'CAT', this.centerX, this.y + 46, 40, { align: 'center' }) : null;
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
    } else if (this.art === 'read') {
      drawPicture(art, rng, PICTURES.cat, this.centerX - 55, y + 110, 110);
      this.readWord.draw(time);
    } else if (this.art === 'launch') {
      this.drawLaunchArt(art, rng, time);
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

  // Before: the rocket waiting on its pad. After: flying over the city, with a firework.
  drawLaunchArt(g, rng, time) {
    const { x, y } = this;
    const groundY = y + this.height * 0.62;
    pencilLine(g, rng, x + 14, groundY, x + this.width - 14, groundY, { color: COLORS.pencil, width: 2.5 });
    if (!this.completed) {
      drawTree(g, rng, x + 30, groundY, 90, 0.8);
      drawLaunchPad(g, rng, this.centerX, groundY);
      drawRocket(g, rng, this.centerX, groundY - 8 - 61 * 0.7, 0, { scale: 0.7, time });
      return;
    }
    // A little skyline, the rocket zooming over it, and a firework going off.
    const heights = [40, 70, 50, 90, 60, 45];
    const step = (this.width - 30) / heights.length; // fit the skyline to the panel
    heights.forEach((h, i) => {
      const bx = x + 15 + i * step;
      pencilPolyline(g, rng, [
        { x: bx, y: groundY }, { x: bx, y: groundY - h }, { x: bx + step - 5, y: groundY - h }, { x: bx + step - 5, y: groundY },
      ], { color: COLORS.pencil, width: 2 });
    });
    drawRocket(g, rng, this.centerX - 10, y + 70, Math.PI / 2 - 0.15, { scale: 0.55, flame: 0.8, face: true, time });
    drawFirework(g, rng, x + this.width - 50, y + 50, 0.35 + Math.sin(time / 500) * 0.15);
  }

  // Short lines climbing up the panel, a spring, a star, and a little guy mid-bounce.
  drawClimbArt(g, rng, time) {
    const style = { color: COLORS.pencil, width: 2.5 };
    const { y } = this;
    // The drawing was made for a 220-wide panel; squeeze it to fit this one.
    const k = this.width / 220;
    const x = this.x;
    const sxOf = (u) => x + u * k;
    const steps = [
      { x: 40, y: 200, w: 70 },
      { x: 130, y: 150, w: 70 },
      { x: 50, y: 100, w: 60 },
      { x: 140, y: 50, w: 60 },
    ];
    for (const st of steps) pencilLine(g, rng, sxOf(st.x), y + st.y, sxOf(st.x + st.w), y + st.y, style);
    // A spring on the lowest line.
    const sx = sxOf(90);
    const sy = y + 200;
    pencilPolyline(g, rng, [
      { x: sx - 8, y: sy }, { x: sx + 8, y: sy - 4 }, { x: sx - 8, y: sy - 8 }, { x: sx + 8, y: sy - 12 },
    ], { ...style, width: 2 });
    pencilLine(g, rng, sx - 11, sy - 13, sx + 11, sy - 13, style);
    drawStar(g, rng, sxOf(80), y + 70, 10);
    // The little guy, bobbing up and down as if bouncing.
    const bob = Math.abs(Math.sin(time / 260)) * 14;
    drawStandingFigure(g, rng, sxOf(170), y + 150 - 6 - bob, { color: COLORS.pencil, width: 2.5 });
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
