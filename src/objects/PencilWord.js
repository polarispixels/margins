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
  A: { w: 0.7, strokes: [[[0, 1], [0.35, 0], [0.7, 1]], [[0.15, 0.6], [0.55, 0.6]]] },
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
  // size is the letter height in pixels. Pass { written: false } to start blank
  // and call write() to write it on.
  constructor(scene, text, x, y, size, opts = {}) {
    this.scene = scene;
    this.size = size;
    this.id = nextId++;
    this.lineWidth = opts.lineWidth ?? Math.max(2, size / 14);
    this.graphics = scene.add.graphics().setDepth(opts.depth ?? 5);
    this.progress = opts.written === false ? 0 : 1; // how much is written, 0..1

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
    this.width = cursor - LETTER_GAP * size;
    this.x = opts.align === 'center' ? x - this.width / 2 : x;
    this.y = y;

    // Every stroke in pixels, in writing order, for drawing and write-on.
    this.strokes = this.letters.flatMap((letter) =>
      letter.strokes.map((stroke) =>
        stroke.map(([u, v]) => ({ x: this.x + letter.x + u * size, y: this.y + v * size })),
      ),
    );
  }

  // Bounding box of each letter, e.g. to make the letters solid. { x, y, width, height }
  letterBoxes() {
    return this.letters.map((l) => ({ x: this.x + l.x, y: this.y, width: l.width, height: this.size }));
  }

  // Write the word on, stroke by stroke, over `durationMs`.
  write(durationMs = 800) {
    this.scene.tweens.add({ targets: this, progress: 1, duration: durationMs });
  }

  // Fade the word away (for "one word at a time").
  fadeOut(durationMs = 400) {
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
