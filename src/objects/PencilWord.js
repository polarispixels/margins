// Words written on the page in pencil, using a tiny hand-made "stroke font".
//
// Each letter is a list of strokes, and each stroke is a list of points in a box
// that is 1 unit tall (0 = top, 1 = bottom) and `w` units wide. Drawing them with
// the pencil helpers makes words wobble and boil like everything else, and lets a
// word be "written on" one stroke at a time (see write()).
//
// Only the letters we use so far are defined. To add one, sketch it on graph
// paper in a 1-tall box and copy the points.

import { COLORS } from '../config.js';
import { boilRng, pencilPolyline } from '../pencil.js';

const FONT = {
  0: { w: 0.6, strokes: [[[0.3, 0], [0.55, 0.1], [0.6, 0.5], [0.55, 0.9], [0.3, 1], [0.05, 0.9], [0, 0.5], [0.05, 0.1], [0.3, 0]]] },
  1: { w: 0.4, strokes: [[[0.05, 0.2], [0.3, 0], [0.3, 1]]] },
  2: { w: 0.6, strokes: [[[0, 0.2], [0.15, 0.03], [0.4, 0], [0.58, 0.15], [0.55, 0.4], [0, 1], [0.6, 1]]] },
  3: { w: 0.62, strokes: [[[0, 0.1], [0.2, 0], [0.45, 0], [0.6, 0.15], [0.55, 0.38], [0.3, 0.48], [0.58, 0.6], [0.62, 0.85], [0.45, 1], [0.15, 1], [0, 0.9]]] },
  4: { w: 0.65, strokes: [[[0.45, 1], [0.45, 0], [0, 0.7], [0.65, 0.7]]] },
  5: { w: 0.6, strokes: [[[0.6, 0], [0.08, 0], [0.03, 0.45], [0.35, 0.4], [0.58, 0.55], [0.6, 0.82], [0.42, 1], [0.12, 1], [0, 0.9]]] },
  6: { w: 0.6, strokes: [[[0.55, 0.05], [0.3, 0], [0.08, 0.2], [0, 0.6], [0.08, 0.92], [0.3, 1], [0.52, 0.92], [0.6, 0.7], [0.52, 0.5], [0.3, 0.45], [0.08, 0.55], [0.02, 0.65]]] },
  7: { w: 0.6, strokes: [[[0, 0], [0.6, 0], [0.2, 1]]] },
  8: { w: 0.6, strokes: [[[0.3, 0.48], [0.08, 0.38], [0.05, 0.15], [0.3, 0], [0.55, 0.15], [0.52, 0.38], [0.3, 0.48], [0.05, 0.62], [0.02, 0.85], [0.3, 1], [0.58, 0.85], [0.55, 0.62], [0.3, 0.48]]] },
  9: { w: 0.6, strokes: [[[0.58, 0.4], [0.5, 0.5], [0.28, 0.55], [0.06, 0.45], [0, 0.25], [0.1, 0.05], [0.32, 0], [0.55, 0.1], [0.6, 0.35], [0.55, 0.75], [0.35, 1], [0.08, 0.95]]] },
  A: { w: 0.7, strokes: [[[0, 1], [0.35, 0], [0.7, 1]], [[0.15, 0.6], [0.55, 0.6]]] },
  B: { w: 0.6, strokes: [[[0, 0], [0, 1], [0.4, 1], [0.6, 0.88], [0.6, 0.62], [0.42, 0.5], [0, 0.5]], [[0.42, 0.5], [0.55, 0.38], [0.55, 0.12], [0.38, 0], [0, 0]]] },
  C: { w: 0.65, strokes: [[[0.65, 0.15], [0.5, 0], [0.2, 0], [0, 0.25], [0, 0.75], [0.2, 1], [0.5, 1], [0.65, 0.85]]] },
  D: { w: 0.7, strokes: [[[0, 0], [0, 1], [0.35, 1], [0.6, 0.8], [0.7, 0.5], [0.6, 0.2], [0.35, 0], [0, 0]]] },
  E: { w: 0.6, strokes: [[[0.6, 0], [0, 0], [0, 1], [0.6, 1]], [[0, 0.5], [0.45, 0.5]]] },
  G: { w: 0.7, strokes: [[[0.65, 0.15], [0.5, 0], [0.2, 0], [0, 0.25], [0, 0.75], [0.2, 1], [0.5, 1], [0.7, 0.8], [0.7, 0.55], [0.4, 0.55]]] },
  I: { w: 0.2, strokes: [[[0.1, 0], [0.1, 1]]] },
  J: { w: 0.6, strokes: [[[0.6, 0], [0.6, 0.75], [0.45, 1], [0.2, 1], [0, 0.8]]] },
  K: { w: 0.65, strokes: [[[0, 0], [0, 1]], [[0.6, 0], [0, 0.55]], [[0.2, 0.4], [0.65, 1]]] },
  L: { w: 0.55, strokes: [[[0, 0], [0, 1], [0.55, 1]]] },
  M: { w: 0.8, strokes: [[[0, 1], [0, 0], [0.4, 0.6], [0.8, 0], [0.8, 1]]] },
  N: { w: 0.65, strokes: [[[0, 1], [0, 0], [0.65, 1], [0.65, 0]]] },
  P: { w: 0.6, strokes: [[[0, 1], [0, 0], [0.45, 0], [0.6, 0.12], [0.6, 0.38], [0.45, 0.5], [0, 0.5]]] },
  R: { w: 0.65, strokes: [[[0, 1], [0, 0], [0.45, 0], [0.6, 0.12], [0.6, 0.38], [0.45, 0.5], [0, 0.5]], [[0.3, 0.5], [0.65, 1]]] },
  S: { w: 0.65, strokes: [[[0.65, 0.12], [0.5, 0], [0.15, 0], [0, 0.15], [0, 0.35], [0.15, 0.5], [0.5, 0.5], [0.65, 0.65], [0.65, 0.85], [0.5, 1], [0.15, 1], [0, 0.88]]] },
  T: { w: 0.7, strokes: [[[0, 0], [0.7, 0]], [[0.35, 0], [0.35, 1]]] },
  U: { w: 0.65, strokes: [[[0, 0], [0, 0.75], [0.2, 1], [0.45, 1], [0.65, 0.75], [0.65, 0]]] },
  W: { w: 0.9, strokes: [[[0, 0], [0.2, 1], [0.45, 0.35], [0.7, 1], [0.9, 0]]] },
};

const LETTER_GAP = 0.22; // space between letters, as a fraction of the letter height
const SPACE_WIDTH = 0.45;

let nextId = 300; // each word gets its own boil seed

export class PencilWord {
  // (x, y) is the top-left corner, or the top-center with { align: 'center' }.
  // size is the letter height in pixels. Options:
  //   written: false   start blank; call write() to write it on
  //   fixed: true      pinned to the screen (ignores camera scrolling), for scores
  //   lineWidth, depth
  constructor(scene, text, x, y, size, opts = {}) {
    this.scene = scene;
    this.size = size;
    this.id = nextId++;
    this.anchorX = x;
    this.align = opts.align ?? 'left';
    this.y = y;
    this.lineWidth = opts.lineWidth ?? Math.max(2, size / 14);
    this.graphics = scene.add.graphics().setDepth(opts.depth ?? 5);
    if (opts.fixed) this.graphics.setScrollFactor(0);
    this.progress = opts.written === false ? 0 : 1; // how much is written, 0..1
    this.shown = this.progress > 0; // false once faded out
    this.setText(text);
  }

  // Change what the word says (e.g. a score going up).
  setText(text) {
    text = String(text);
    if (text === this.text) return;
    this.text = text;
    const size = this.size;

    // Lay the letters out left to right, converting font units to pixels.
    this.letters = [];
    let cursor = 0;
    for (const char of text.toUpperCase()) {
      if (char === ' ') {
        cursor += SPACE_WIDTH * size;
        continue;
      }
      const glyph = FONT[char];
      if (!glyph) throw new Error(`PencilWord has no letter "${char}" yet; add it to FONT.`);
      this.letters.push({ x: cursor, width: glyph.w * size, strokes: glyph.strokes });
      cursor += (glyph.w + LETTER_GAP) * size;
    }
    this.width = Math.max(0, cursor - LETTER_GAP * size);
    this.x = this.align === 'center' ? this.anchorX - this.width / 2 : this.anchorX;

    // Every stroke in pixels, in writing order, for drawing and write-on.
    this.strokes = this.letters.flatMap((letter) =>
      letter.strokes.map((stroke) =>
        stroke.map(([u, v]) => ({ x: this.x + letter.x + u * size, y: this.y + v * size })),
      ),
    );
  }

  // Move the word (keeps its alignment).
  setPosition(x, y) {
    this.anchorX = x;
    this.y = y;
    const text = this.text;
    this.text = null; // force a re-layout
    this.setText(text);
  }

  // Bounding box of each letter, e.g. to make the letters solid. { x, y, width, height }
  letterBoxes() {
    return this.letters.map((l) => ({ x: this.x + l.x, y: this.y, width: l.width, height: this.size }));
  }

  // Write the word on, stroke by stroke, over `durationMs` (from blank, even if
  // it was written before and faded out).
  write(durationMs = 800) {
    this.scene.tweens.killTweensOf([this, this.graphics]);
    this.graphics.setAlpha(1);
    this.progress = 0;
    this.shown = true;
    this.scene.tweens.add({ targets: this, progress: 1, duration: durationMs });
  }

  // Fade the word away (for "one word at a time").
  fadeOut(durationMs = 400) {
    this.scene.tweens.killTweensOf(this.graphics);
    this.shown = false;
    this.scene.tweens.add({ targets: this.graphics, alpha: 0, duration: durationMs });
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    if (this.progress <= 0) return;
    const rng = boilRng(time, this.id);
    const style = { color: COLORS.pencil, width: this.lineWidth };

    // Write-on: draw the first `progress` fraction of the strokes. The stroke
    // being written right now is drawn partway.
    const shown = this.progress * this.strokes.length;
    this.strokes.forEach((stroke, i) => {
      if (i >= shown) return;
      const fraction = Math.min(1, shown - i);
      pencilPolyline(g, rng, fraction < 1 ? partOfPath(stroke, fraction) : stroke, style);
    });
  }
}

// The first `fraction` (0..1) of a path, measured by length.
function partOfPath(points, fraction) {
  const lengths = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let remaining = fraction * lengths.reduce((a, b) => a + b, 0);
  const result = [points[0]];
  for (let i = 0; i < lengths.length; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (remaining >= lengths[i]) {
      result.push(b);
      remaining -= lengths[i];
    } else {
      const t = lengths[i] ? remaining / lengths[i] : 0;
      result.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      break;
    }
  }
  return result;
}
