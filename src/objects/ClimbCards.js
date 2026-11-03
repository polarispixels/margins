// The cards Climb shows over the page: picking initials, the start screen, and
// the score card. Each card is a piece of paper pinned to the middle of the
// screen with pencil buttons on it. No words: letters, numbers, and icons only.
//
// Every card works with touch (tap a button) and keyboard (Left/Right to choose
// a button, Enter/Space to press it; the initials card has its own keys).

import { COLORS } from '../config.js';
import { boilRng, pencilCircle, pencilLine, pencilPolyline } from '../pencil.js';
import { PencilWord } from './PencilWord.js';
import { drawStar } from './climbArt.js';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const STYLE = { color: COLORS.pencil, width: 3 };

// The shared parts of a card: the paper, its words, and its buttons.
class Card {
  constructor(scene, width, height) {
    this.scene = scene;
    const { width: sw, height: sh } = scene.scale;
    this.rect = { x: (sw - width) / 2, y: (sh - height) / 2, width, height };
    this.cx = sw / 2;
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(30);
    this.words = [];
    this.buttons = []; // { icon, x, y, radius, action }
    this.focus = 0; // which button the keyboard is on
  }

  word(text, x, y, size, opts = {}) {
    const word = new PencilWord(this.scene, text, x, y, size, { fixed: true, depth: 31, ...opts });
    this.words.push(word);
    return word;
  }

  button(icon, x, y, action, radius = 40) {
    this.buttons.push({ icon, x, y, radius, action });
  }

  // Tap: press whichever button is under the finger (a generous hit area).
  pointerDown(px, py) {
    const hit = this.buttons.find((b) => Math.hypot(px - b.x, py - b.y) < b.radius * 1.3);
    if (hit) hit.action();
  }

  key(event) {
    const n = this.buttons.length;
    if (event.key === 'ArrowLeft') this.focus = (this.focus + n - 1) % n;
    else if (event.key === 'ArrowRight') this.focus = (this.focus + 1) % n;
    else if (event.key === 'Enter' || event.key === ' ') this.buttons[this.focus]?.action();
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 500);
    const { x, y, width: w, height: h } = this.rect;

    // The card: paper with a pencil outline.
    g.fillStyle(COLORS.paper, 0.97);
    g.fillRect(x, y, w, h);
    pencilLine(g, rng, x, y, x + w, y, STYLE);
    pencilLine(g, rng, x, y + h, x + w, y + h, STYLE);
    pencilLine(g, rng, x, y, x, y + h, STYLE);
    pencilLine(g, rng, x + w, y, x + w, y + h, STYLE);

    this.drawExtras(g, rng, time);

    this.buttons.forEach((b, i) => {
      // The keyboard's button gets pencil shading, like a pressed touch button.
      if (i === this.focus && this.showFocus) {
        g.fillStyle(COLORS.pencil, 0.12);
        g.fillCircle(b.x, b.y, b.radius);
      }
      pencilCircle(g, rng, b.x, b.y, b.radius, { ...STYLE, points: 18 });
      drawIcon(g, rng, b.icon, b.x, b.y, b.radius / 40);
    });
    for (const word of this.words) word.draw(time);
  }

  drawExtras() {}

  destroy() {
    this.graphics.destroy();
    for (const word of this.words) word.graphics.destroy();
  }
}

// Pick three initials, arcade style: ▲ ▼ change a letter, tap a letter to select
// its slot, ✓ to finish. Keyboard: Up/Down change, Left/Right move, type letters
// directly, Enter to finish.
export class InitialsCard extends Card {
  constructor(scene, current, onDone) {
    super(scene, 360, 380);
    this.letters = (current ?? 'AAA').split('');
    this.slot = 0;
    this.onDone = onDone;
    const top = this.rect.y;

    this.slots = [-1, 0, 1].map((offset, i) => {
      const x = this.cx + offset * 90;
      // Each slot has a ▲ above and a ▼ below its letter.
      this.button('up', x, top + 70, () => this.change(i, 1), 26);
      this.button('down', x, top + 230, () => this.change(i, -1), 26);
      return { x, word: this.word(this.letters[i], x, top + 115, 70, { align: 'center', lineWidth: 5 }) };
    });
    this.button('ok', this.cx, top + 315, () => this.onDone(this.letters.join('')), 40);
  }

  change(slot, step) {
    this.slot = slot;
    const i = (LETTERS.indexOf(this.letters[slot]) + step + LETTERS.length) % LETTERS.length;
    this.letters[slot] = LETTERS[i];
    this.slots[slot].word.setText(this.letters[slot]);
  }

  pointerDown(px, py) {
    // Tapping a letter selects its slot.
    const tapped = this.slots.findIndex((s) => Math.abs(px - s.x) < 40 && Math.abs(py - (this.rect.y + 150)) < 50);
    if (tapped !== -1) this.slot = tapped;
    else super.pointerDown(px, py);
  }

  key(event) {
    const k = event.key;
    if (k === 'ArrowUp') this.change(this.slot, 1);
    else if (k === 'ArrowDown') this.change(this.slot, -1);
    else if (k === 'ArrowLeft') this.slot = Math.max(0, this.slot - 1);
    else if (k === 'ArrowRight') this.slot = Math.min(2, this.slot + 1);
    else if (k === 'Backspace') this.slot = Math.max(0, this.slot - 1);
    else if (k === 'Enter') this.onDone(this.letters.join(''));
    else if (/^[a-z]$/i.test(k)) {
      // Typing a letter fills the slot and moves on.
      this.letters[this.slot] = k.toUpperCase();
      this.slots[this.slot].word.setText(this.letters[this.slot]);
      this.slot = Math.min(2, this.slot + 1);
    }
  }

  drawExtras(g, rng) {
    // Underline the slot being changed.
    const s = this.slots[this.slot];
    pencilLine(g, rng, s.x - 28, this.rect.y + 198, s.x + 28, this.rect.y + 198, { ...STYLE, width: 4 });
  }
}

// The start screen: your initials with a pencil button to change them, and a
// big ▶ to play.
export class StartCard extends Card {
  constructor(scene, initials, onPlay, onEdit) {
    super(scene, 340, 300);
    this.showFocus = true;
    const top = this.rect.y;
    this.word(initials, this.cx - 30, top + 50, 60, { align: 'center', lineWidth: 5 });
    this.button('edit', this.cx + 95, top + 80, onEdit, 30);
    this.button('play', this.cx, top + 210, onPlay, 52);
    this.focus = 1; // Enter plays
  }
}

// The score card: this run's total, ↑ lines and ★ stars, then the top five with
// initials. A new high score is boxed with a star beside it.
export class ScoreCard extends Card {
  constructor(scene, { total, lines, stars, table, place }, onAgain, onBack) {
    super(scene, 380, 640);
    this.showFocus = true;
    this.place = place;
    const top = this.rect.y;
    const left = this.rect.x;

    // Big, but shrinking for long numbers so it always fits.
    this.word(String(total), this.cx, top + 30, Math.min(90, 230 / String(total).length), { align: 'center', lineWidth: 6 });
    this.word(String(lines), this.cx - 92, top + 150, 28);
    this.word(String(stars), this.cx + 58, top + 150, 28);

    // The top five: place, initials, score.
    this.rowTop = top + 215;
    this.rowHeight = 58;
    table.forEach((entry, i) => {
      const y = this.rowTop + i * this.rowHeight;
      this.word(String(i + 1), left + 72, y, 30);
      this.word(entry.initials, left + 120, y, 30);
      this.word(String(entry.score), left + this.rect.width - 40, y, 30, { align: 'right' });
    });

    this.button('again', this.cx - 75, top + 570, onAgain, 40);
    this.button('back', this.cx + 75, top + 570, onBack, 40);
  }

  drawExtras(g, rng) {
    const top = this.rect.y;
    // ↑ lines climbed and ★ stars collected.
    const iconY = top + 164;
    const ux = this.cx - 110;
    pencilLine(g, rng, ux, iconY + 14, ux, iconY - 14, STYLE);
    pencilPolyline(g, rng, [{ x: ux - 9, y: iconY - 5 }, { x: ux, y: iconY - 14 }, { x: ux + 9, y: iconY - 5 }], STYLE);
    drawStar(g, rng, this.cx + 38, iconY, 14, { width: 2.5 });

    // Box the new high score, with a star beside it.
    if (this.place >= 0) {
      const y = this.rowTop + this.place * this.rowHeight - 12;
      const x = this.rect.x + 30;
      const w = this.rect.width - 50;
      const h = 54;
      const box = { ...STYLE, width: 2.5 };
      pencilLine(g, rng, x, y, x + w, y, box);
      pencilLine(g, rng, x, y + h, x + w, y + h, box);
      pencilLine(g, rng, x, y, x, y + h, box);
      pencilLine(g, rng, x + w, y, x + w, y + h, box);
      drawStar(g, rng, x + 20, y + h / 2, 12, { width: 2.5 });
    }
  }
}

// Button icons, drawn in pencil at (x, y). `s` scales them with the button.
function drawIcon(g, rng, icon, x, y, s) {
  const p = (dx, dy) => ({ x: x + dx * s, y: y + dy * s });
  switch (icon) {
    case 'play': // ▶
      pencilPolyline(g, rng, [p(-10, -16), p(16, 0), p(-10, 16), p(-10, -16)], STYLE);
      break;
    case 'back': // ◀ chevron
      pencilPolyline(g, rng, [p(8, -15), p(-8, 0), p(8, 15)], STYLE);
      break;
    case 'up':
      pencilPolyline(g, rng, [p(-14, 7), p(0, -8), p(14, 7)], STYLE);
      break;
    case 'down':
      pencilPolyline(g, rng, [p(-14, -7), p(0, 8), p(14, -7)], STYLE);
      break;
    case 'ok': // ✓
      pencilPolyline(g, rng, [p(-15, 0), p(-4, 12), p(16, -12)], { ...STYLE, width: 4 });
      break;
    case 'edit': // a little pencil, writing down and to the left
      pencilPolyline(g, rng, [p(-12, 12), p(-9, 4), p(9, -14), p(14, -9), p(-4, 9), p(-12, 12)], { ...STYLE, width: 2.5 });
      pencilLine(g, rng, x - 9 * s, y + 4 * s, x - 4 * s, y + 9 * s, { ...STYLE, width: 2 });
      break;
    case 'again':
      drawReplayIcon(g, rng, x, y, s);
      break;
  }
}

// ↻: a circle with a gap at the top, going clockwise, with an arrowhead at the
// end of the curve pointing the way it's going.
function drawReplayIcon(g, rng, cx, cy, s) {
  const radius = 18 * s;
  const gap = 0.6; // radians left open at the top
  const start = -Math.PI / 2 + gap / 2; // just right of the top...
  const end = start + Math.PI * 2 - gap; // ...all the way round to just left of it
  const arc = [];
  for (let i = 0; i <= 12; i++) {
    const a = start + (i / 12) * (end - start);
    arc.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
  }
  pencilPolyline(g, rng, arc, STYLE);

  // The arrowhead: two short strokes swept back from the tip, either side of the
  // direction the curve is heading at its end (the tangent).
  const tip = arc[arc.length - 1];
  const dir = Math.atan2(Math.cos(end), -Math.sin(end));
  const wing = (offset) => ({ x: tip.x - Math.cos(dir + offset) * 9 * s, y: tip.y - Math.sin(dir + offset) * 9 * s });
  pencilPolyline(g, rng, [wing(0.6), tip, wing(-0.6)], STYLE);
}
