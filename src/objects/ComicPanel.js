// One panel of a comic strip: a hand-drawn box you jump into to play a level.
//
// Kinds: 'open' (a level to jump into), 'locked' (faint, a padlock, a world sketch),
// 'empty' (a dashed outline). Open and locked panels show one word at the bottom.
//
// An open panel's art depends on which panel it is:
//   'getting-started': before the level is finished, a faint sketch (a little guy
//                      on a line); after, what happened: the guy, his dog, a heart.
//   'launch':          a rocket on its pad by some trees; after, the rocket flying
//                      over the city with a firework.
//   'climb':           a little guy bouncing up short lines past a spring and a
//                      star, with the best score written in the corner.
//   'read':            a pencil cat.
//   any world name:    that sketch from worldArt.js.

import { COLORS } from '../config.js';
import { boilRng, pencilLine, pencilCircle, pencilPolyline } from '../pencil.js';
import { drawDog, drawHeart } from './Dog.js';
import { drawStar } from './climbArt.js';
import { drawRocket, drawLaunchPad, drawTree, drawFirework } from './launchArt.js';
import { drawWorld } from './worldArt.js';
import { PencilWord } from './PencilWord.js';
import { drawPicture } from './PencilPicture.js';
import { PICTURES } from '../data/pictures.js';

// The existing story art was drawn for a panel 185 wide, so it's drawn in this
// reference box (top-left at 0,0) and then scaled to fit whatever panel it's in.
const REF = { width: 185, height: 210, groundY: 185 };
const WORD_SIZE = 20;
const WIGGLE_MS = 450;
const FAINT = 0.35; // how light a locked or empty panel is drawn

export class ComicPanel {
  // rect: { x, y, width, height } (top-left corner and size). Options:
  //   kind: 'open' (a level you can jump into), 'locked' (faint, with a padlock),
  //         or 'empty' (just a dashed outline)
  //   word: the one word written at the bottom of the frame
  //   art: 'getting-started', 'launch', 'climb', 'read', or a world name (see worldArt.js)
  //   completed: show the finished art; best: a best score to write in the corner
  constructor(scene, rect, { kind = 'open', word = '', art = '', completed = false, best = 0 } = {}) {
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
    this.kind = kind;
    this.art = art;
    this.completed = completed;
    this.scene = scene;
    this.wiggleAt = -Infinity;
    this.frameGraphics = scene.add.graphics();
    this.artGraphics = scene.add.graphics();
    const solid = kind !== 'empty';
    this.word = solid && word ? this.makeWord(word) : null;
    this.bestWord = solid && best > 0 ? new PencilWord(scene, String(best), this.x + 14, this.y + 14, 22) : null;
    if (kind === 'locked') this.word?.graphics.setAlpha(FAINT);
    this.shownDx = null;
  }

  // The label, shrunk a little if the word wouldn't fit inside the frame.
  makeWord(text) {
    let size = WORD_SIZE;
    let word = new PencilWord(this.scene, text, this.centerX, this.bottom - size - 12, size, { align: 'center' });
    const room = this.width - 16;
    if (word.width > room) {
      word.graphics.destroy();
      size = Math.floor((size * room) / word.width);
      word = new PencilWord(this.scene, text, this.centerX, this.bottom - size - 12, size, { align: 'center' });
    }
    return word;
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

  // Is the world point (px, py) inside the panel? For taps.
  contains(px, py) {
    return px > this.x && px < this.x + this.width && py > this.y && py < this.y + this.height;
  }

  // Has the stick figure jumped up into this panel? True when his head rises
  // past the panel's bottom edge while he's inside it from side to side.
  isEnteredBy(player) {
    if (this.kind === 'empty') return false;
    const body = player.body;
    const inside = body.center.x > this.x + 10 && body.center.x < this.x + this.width - 10;
    return inside && body.top < this.bottom - 4;
  }

  // Shake the whole panel sideways, settling down (a "not yet" for a locked one).
  wiggle(time) {
    this.wiggleAt = time;
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
    const art = this.artGraphics;
    frame.clear();
    art.clear();

    const since = time - this.wiggleAt;
    const dx = since < WIGGLE_MS ? Math.sin(since / 30) * 10 * (1 - since / WIGGLE_MS) : 0;
    const x = this.x + dx;
    const { y, width: w, height: h } = this;

    if (this.kind === 'empty') {
      this.drawDashedOutline(frame, rng, x);
      return;
    }
    const faint = this.kind === 'locked';
    const alpha = faint ? FAINT : 1;

    // The panel border: four slightly heavy pencil lines, overshooting at the corners
    // the way hand-drawn comic panels do.
    const style = { color: COLORS.pencil, width: 3.5, alpha: 0.9 * alpha };
    pencilLine(frame, rng, x - 4, y, x + w + 4, y, style);
    pencilLine(frame, rng, x - 4, y + h, x + w + 4, y + h, style);
    pencilLine(frame, rng, x, y - 4, x, y + h + 4, style);
    pencilLine(frame, rng, x + w, y - 4, x + w, y + h + 4, style);

    // The art goes in the space above the word.
    const pad = 8;
    const area = { x: x + pad, y: y + pad, width: w - 2 * pad, height: h - 2 * pad - (this.word ? 28 : 0) };
    if (faint) {
      const size = Math.min(area.width, area.height);
      drawWorld(art, rng, this.art, area.x + area.width / 2, area.y + area.height / 2, size, FAINT);
      this.drawPadlock(frame, rng, x + w - 22, y + 22);
    } else {
      this.placeArt(art, area);
      this.drawOpenArt(art, rng, time);
    }

    // Words follow the shake. (Re-laying out a word is only needed when it moved.)
    if (this.shownDx !== dx) {
      this.shownDx = dx;
      this.word?.setPosition(this.centerX + dx, this.word.y);
      this.bestWord?.setPosition(this.x + 14 + dx, this.y + 14);
    }
    this.word?.draw(time);
    this.bestWord?.draw(time);
  }

  // The part of the reference box the art really uses, so a short panel isn't
  // mostly empty space. { x, y, width, height } in reference coordinates.
  artBox() {
    if (this.art === 'getting-started') return { x: 10, y: 95, width: 165, height: 100 };
    if (this.art === 'launch') return this.completed ? { x: 0, y: 15, width: 185, height: 180 } : { x: 0, y: 40, width: 185, height: 160 };
    if (this.art === 'read') return { x: 30, y: 40, width: 125, height: 130 };
    return { x: 0, y: 0, width: REF.width, height: REF.height };
  }

  // Scale and center that part of the reference box inside `area`, keeping its shape.
  placeArt(art, area) {
    const box = this.artBox();
    const s = Math.min(area.width / box.width, area.height / box.height);
    art.setScale(s);
    art.setPosition(
      area.x + (area.width - box.width * s) / 2 - box.x * s,
      area.y + (area.height - box.height * s) / 2 - box.y * s,
    );
  }

  // A world name draws that sketch; the story panels draw their own art.
  drawOpenArt(art, rng, time) {
    if (this.art === 'climb') {
      this.drawClimbArt(art, rng, time);
    } else if (this.art === 'read') {
      drawPicture(art, rng, PICTURES.cat, REF.width / 2 - 55, 50, 110);
    } else if (this.art === 'launch') {
      this.drawLaunchArt(art, rng, time);
    } else if (this.art === 'getting-started') {
      this.drawGettingStartedArt(art, rng, time);
    } else {
      drawWorld(art, rng, this.art, REF.width / 2, REF.height / 2, REF.height);
    }
  }

  // The first panel. Before: a faint little guy on the start of a line.
  // After: the story so far, the guy and his dog with a heart between them.
  drawGettingStartedArt(g, rng, time) {
    const cx = REF.width / 2;
    const groundY = REF.groundY;
    if (this.completed) {
      pencilLine(g, rng, 20, groundY, REF.width - 20, groundY, { color: COLORS.pencil, width: 2.5 });
      drawStandingFigure(g, rng, cx - 45, groundY);
      drawDog(g, rng, cx + 35, groundY, { awake: true, time });
      drawHeart(g, rng, cx - 5, groundY - 75, 16);
    } else {
      const faint = { color: COLORS.pencil, width: 2, alpha: 0.35 };
      pencilLine(g, rng, 20, groundY, cx, groundY, faint);
      drawStandingFigure(g, rng, 60, groundY, faint);
    }
  }

  // Before: the rocket waiting on its pad. After: flying over the city, with a firework.
  drawLaunchArt(g, rng, time) {
    const w = REF.width;
    const cx = w / 2;
    const groundY = REF.groundY;
    pencilLine(g, rng, 14, groundY, w - 14, groundY, { color: COLORS.pencil, width: 2.5 });
    if (!this.completed) {
      drawTree(g, rng, 30, groundY, 90, 0.8);
      drawLaunchPad(g, rng, cx, groundY);
      drawRocket(g, rng, cx, groundY - 8 - 61 * 0.7, 0, { scale: 0.7, time });
      return;
    }
    // A little skyline, the rocket zooming over it, and a firework going off.
    const heights = [40, 70, 50, 90, 60, 45];
    const step = (w - 30) / heights.length;
    heights.forEach((h, i) => {
      const bx = 15 + i * step;
      pencilPolyline(g, rng, [
        { x: bx, y: groundY }, { x: bx, y: groundY - h }, { x: bx + step - 5, y: groundY - h }, { x: bx + step - 5, y: groundY },
      ], { color: COLORS.pencil, width: 2 });
    });
    drawRocket(g, rng, cx - 10, 50, Math.PI / 2 - 0.15, { scale: 0.55, flame: 0.8, face: true, time });
    drawFirework(g, rng, w - 50, 30, 0.35 + Math.sin(time / 500) * 0.15);
  }

  // Short lines climbing up the panel, a spring, a star, and a little guy mid-bounce.
  drawClimbArt(g, rng, time) {
    const style = { color: COLORS.pencil, width: 2.5 };
    const k = REF.width / 220; // the drawing was made for a 220-wide panel
    const sxOf = (u) => u * k;
    const steps = [
      { x: 40, y: 200, w: 70 },
      { x: 130, y: 150, w: 70 },
      { x: 50, y: 100, w: 60 },
      { x: 140, y: 50, w: 60 },
    ];
    for (const st of steps) pencilLine(g, rng, sxOf(st.x), st.y, sxOf(st.x + st.w), st.y, style);
    // A spring on the lowest line.
    const sx = sxOf(90);
    const sy = 200;
    pencilPolyline(g, rng, [
      { x: sx - 8, y: sy }, { x: sx + 8, y: sy - 4 }, { x: sx - 8, y: sy - 8 }, { x: sx + 8, y: sy - 12 },
    ], { ...style, width: 2 });
    pencilLine(g, rng, sx - 11, sy - 13, sx + 11, sy - 13, style);
    drawStar(g, rng, sxOf(80), 70, 10);
    // The little guy, bobbing up and down as if bouncing.
    const bob = Math.abs(Math.sin(time / 260)) * 14;
    drawStandingFigure(g, rng, sxOf(170), 150 - 6 - bob, { color: COLORS.pencil, width: 2.5 });
  }

  drawDashedOutline(g, rng, x) {
    const style = { color: COLORS.pencil, width: 2, alpha: FAINT };
    const { y, width: w, height: h } = this;
    const dash = (x1, y1, x2, y2) => {
      const length = Math.hypot(x2 - x1, y2 - y1);
      const count = Math.floor(length / 16);
      for (let i = 0; i < count; i++) {
        const a = (i * 16) / length;
        const b = (i * 16 + 9) / length;
        pencilLine(g, rng, x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, { ...style, passes: 1 });
      }
    };
    dash(x, y, x + w, y);
    dash(x + w, y, x + w, y + h);
    dash(x + w, y + h, x, y + h);
    dash(x, y + h, x, y);
  }

  // A small padlock: a box with a loop on top, centered at (cx, cy).
  drawPadlock(g, rng, cx, cy) {
    const style = { color: COLORS.pencil, width: 2.5, alpha: 0.6 };
    pencilPolyline(g, rng, [
      { x: cx - 9, y: cy - 4 }, { x: cx + 9, y: cy - 4 }, { x: cx + 9, y: cy + 10 }, { x: cx - 9, y: cy + 10 }, { x: cx - 9, y: cy - 4 },
    ], style);
    pencilPolyline(g, rng, [
      { x: cx - 5, y: cy - 4 }, { x: cx - 5, y: cy - 10 }, { x: cx - 2, y: cy - 14 }, { x: cx + 2, y: cy - 14 }, { x: cx + 5, y: cy - 10 }, { x: cx + 5, y: cy - 4 },
    ], style);
    pencilCircle(g, rng, cx, cy + 3, 1.5, { ...style, passes: 1, points: 6 });
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
