// Read: the reading game (docs/reading-framework.md, phases 1 and 2).
//
// A word is written at the top of the page; below it, pencil pictures on cards.
// Tap the picture that matches the word. Right: the card is circled, the word is
// spoken, and the little figure hops. Wrong: the card wiggles and fades, and you
// try again (no buzzer, no lost life). A pencil speaker next to the word says it
// out loud; it fades away as the word gets familiar.
//
// All the deciding (which word, which pictures, how hard) is the ReadingEngine's
// job (src/reading/engine.js); this scene draws, listens, and reports answers.
//
// Controls: tap a card or the speaker. Keyboard: Left/Right choose a card,
// Space/Enter (or Up/W) picks it, 1-5 pick directly, H hears the word, Esc goes
// back, M mutes. A round is READ.roundLength words, then a big star and ↻ / ◀.

import Phaser from 'phaser';
import { COLORS, PAPER, PAGE_MAX_WIDTH } from '../config.js';
import { drawPaper, lineY } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { PencilWord } from '../objects/PencilWord.js';
import { PictureCard } from '../objects/PictureCard.js';
import { drawIcon } from '../objects/ClimbCards.js';
import { drawStar } from '../objects/climbArt.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { ReadingEngine } from '../reading/engine.js';
import { canSpeak, say } from '../reading/speech.js';
import { sfx, isMuted, toggleMute } from '../audio.js';
import { boilRng, pencilCircle, pencilPolyline } from '../pencil.js';

export const MODE_ID = 'read';

const FLOOR_LINE = 12;
const WORD_SIZE = 84;
const WORD_TOP = 34;
const CARDS_TOP = 160; // screen y where the cards start
const CONTENT_LEFT = PAPER.marginX + 30; // keep clear of the margin and the back button
const CARD_GAP = 22;
const CONTENT_RIGHT = 100; // room on the right for the little figure
const NEXT_MS = 1200; // after a right answer, the next word comes after this long
const BACK = { x: 52, y: 40, radius: 26 };
const NO_INPUT = { left: false, right: false, jump: false, jumpHeld: false };

export class ReadScene extends Phaser.Scene {
  constructor() {
    super('Read');
  }

  create() {
    useLayout(this, LANDSCAPE);
    this.physics.resume(); // the comic page pauses physics while zooming in
    drawPaper(this);
    const floorY = lineY(FLOOR_LINE);
    this.platforms = new Platforms(this, [{ line: FLOOR_LINE, from: PAPER.marginX, to: PAGE_MAX_WIDTH }]);
    this.player = new StickFigure(this, this.scale.width - CONTENT_RIGHT / 2, floorY - 30);
    this.physics.add.collider(this.player.zone, this.platforms.group);
    this.hopQueued = 0;

    this.controls = new PlayerInput(this);
    this.controls.touch.setLayout('none'); // no walking here: you tap the cards
    this.held = { left: false, right: false };

    this.ui = this.add.graphics().setScrollFactor(0).setDepth(12);
    this.word = new PencilWord(this, 'CAT', 0, WORD_TOP, WORD_SIZE, { align: 'center', fixed: true, written: false, depth: 12, lineWidth: 6 });
    this.cards = [];
    this.focus = -1; // which card the keyboard is on (-1: none yet)
    this.state = 'puzzle'; // 'puzzle', 'next' (waiting after a right answer), or 'done'
    this.dots = []; // one per answered word this round

    this.engine = new ReadingEngine();
    this.engine.startRound();

    const onKey = (event) => this.key(event);
    const onTap = (pointer) => this.tap(pointer.x, pointer.y);
    this.input.keyboard.on('keydown', onKey);
    this.input.on('pointerdown', onTap);
    // scene.restart() reuses this object, so listeners must go when it shuts down.
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', onKey);
      this.input.off('pointerdown', onTap);
      if (canSpeak()) window.speechSynthesis.cancel();
    });

    watchScreen(this);
    fadeInFromPaper(this);
    this.showPuzzle();
  }

  // ---- The flow of a round ----

  showPuzzle() {
    const puzzle = this.engine.nextPuzzle();
    for (const card of this.cards) card.destroy();
    this.cards = [];
    if (!puzzle) return this.roundOver();

    this.puzzle = puzzle;
    this.cards = puzzle.choices.map((entry, i) => new PictureCard(this, entry, i));
    this.firstPick = null;
    this.hintUsed = false;
    this.focus = -1;
    this.state = 'puzzle';
    this.word.setText(puzzle.word);
    this.word.write(450);
    this.shownAt = this.time.now + 450; // timing starts once the word is written
  }

  pick(index) {
    const card = this.cards[index];
    if (this.state !== 'puzzle' || !card?.pickable) return;
    const time = this.time.now;

    if (this.firstPick === null) {
      // Only the first pick counts toward scores; the second try is for learning.
      this.firstPick = index;
      this.engine.answer(this.puzzle, { firstPick: index, ms: Math.max(0, time - this.shownAt), hintUsed: this.hintUsed });
    }

    if (index !== this.puzzle.answer) {
      card.wrong(time); // a gentle wiggle, and try again
      return;
    }

    card.right();
    this.state = 'next';
    this.dots.push(true);
    if (!isMuted()) {
      sfx.ding(1);
      if (canSpeak()) this.time.delayedCall(250, () => say(this.puzzle.word));
    }
    this.hopQueued = this.firstPick === index ? 1 : 2; // getting it after a miss is worth an extra hop
    this.time.delayedCall(NEXT_MS, () => this.showPuzzle());
  }

  hear() {
    if (this.state !== 'puzzle' || this.puzzle.hint === 'none' || !canSpeak()) return;
    if (this.firstPick === null) this.hintUsed = true; // a partial correct, not a miss
    say(this.puzzle.word);
  }

  roundOver() {
    this.state = 'done';
    this.word.fadeOut();
    this.hopQueued = 3;
    if (!isMuted()) sfx.unlock();
    this.doneAt = this.time.now;
  }

  again() {
    this.engine.startRound();
    this.dots = [];
    this.showPuzzle();
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: MODE_ID }));
  }

  // ---- Input ----

  key(event) {
    const k = event.key;
    if (k === 'Escape') return this.leave();
    if (k === 'm' || k === 'M') return toggleMute();
    if (this.state === 'done') {
      if (k === 'Enter') this.again(); // (Space comes through PlayerInput's jump)
      return;
    }
    if (k === 'h' || k === 'H') return this.hear();
    if (k >= '1' && k <= '9') return this.pick(Number(k) - 1);
    if (k === 'Enter') this.pickFocused();
  }

  // Left/Right move between the cards still in play; jump (Space, Up, W) picks.
  updateKeys(input) {
    const pressed = (name) => input[name] && !this.held[name];
    if (this.state === 'puzzle') {
      if (pressed('left')) this.moveFocus(-1);
      if (pressed('right')) this.moveFocus(1);
      if (input.jump) this.pickFocused();
    } else if (this.state === 'done' && input.jump) {
      this.again();
    }
    this.held = { left: input.left, right: input.right };
  }

  moveFocus(dir) {
    const open = this.cards.filter((c) => c.pickable).map((c) => c.index);
    if (open.length === 0) return;
    const at = open.indexOf(this.focus);
    this.focus = at === -1 ? open[dir > 0 ? 0 : open.length - 1] : open[(at + dir + open.length) % open.length];
  }

  pickFocused() {
    if (this.focus === -1) this.moveFocus(1); // first press just shows where you are
    else this.pick(this.focus);
  }

  tap(x, y) {
    if (Math.hypot(x - BACK.x, y - BACK.y) < BACK.radius * 1.4) return this.leave();
    if (this.state === 'done') {
      const b = this.doneButtons();
      if (Math.hypot(x - b.again.x, y - b.again.y) < 50) this.again();
      else if (Math.hypot(x - b.back.x, y - b.back.y) < 50) this.leave();
      return;
    }
    const speaker = this.speaker();
    if (speaker && Math.hypot(x - speaker.x, y - speaker.y) < speaker.radius * 1.4) return this.hear();
    const card = this.cards.find((c) => c.contains(x, y));
    if (card) this.pick(card.index);
  }

  // ---- Layout (recomputed every frame, so it follows screen changes) ----

  layoutCards() {
    const { width, height } = this.scale;
    const n = this.cards.length;
    if (n === 0) return;
    const right = width - CONTENT_RIGHT;
    const available = right - CONTENT_LEFT;
    const bottom = height - 80; // above the floor and the dots
    const size = Math.min(220, bottom - CARDS_TOP, (available - CARD_GAP * (n - 1)) / n);
    const total = n * size + (n - 1) * CARD_GAP;
    const left = CONTENT_LEFT + (available - total) / 2;
    const top = CARDS_TOP + (bottom - CARDS_TOP - size) / 2;
    this.cards.forEach((card, i) => {
      card.place(left + i * (size + CARD_GAP), top, size, size);
      card.focused = i === this.focus;
    });
  }

  centerX() {
    return (CONTENT_LEFT + this.scale.width - CONTENT_RIGHT) / 2;
  }

  // The tap-to-hear speaker beside the word: big while a word is new, small and
  // faint as it gets familiar, gone once it's known (or if there's no speech).
  speaker() {
    if (this.state !== 'puzzle' || !this.puzzle || !canSpeak() || this.puzzle.hint === 'none') return null;
    const big = this.puzzle.hint === 'show';
    return {
      x: this.centerX() - this.word.width / 2 - (big ? 70 : 50),
      y: WORD_TOP + WORD_SIZE / 2,
      radius: big ? 30 : 18,
      alpha: big ? 1 : 0.4,
    };
  }

  doneButtons() {
    const cx = this.centerX();
    const y = this.scale.height / 2 + 100;
    return { again: { x: cx - 70, y }, back: { x: cx + 70, y } };
  }

  // ---- Every frame ----

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    this.updateKeys(this.controls.read());

    // The little figure hops when you get one right (more hops for a hard-won one).
    const hop = this.hopQueued > 0 && this.player.onFloor;
    if (hop) this.hopQueued--;
    this.player.update(hop ? { ...NO_INPUT, jump: true, jumpHeld: true } : NO_INPUT, dt);

    this.word.setPosition(this.centerX(), WORD_TOP);
    this.layoutCards();
    this.platforms.draw(time);
    for (const card of this.cards) card.draw(time);
    this.word.draw(time);
    this.player.draw(time);
    this.drawUi(time);
  }

  drawUi(time) {
    const g = this.ui;
    g.clear();
    const rng = boilRng(time, 820);
    const style = { color: COLORS.pencil, width: 3 };

    // Back: ◀ in a pencil circle.
    pencilCircle(g, rng, BACK.x, BACK.y, BACK.radius, { ...style, points: 14 });
    drawIcon(g, rng, 'back', BACK.x, BACK.y, BACK.radius / 40);

    const speaker = this.speaker();
    if (speaker) drawSpeaker(g, rng, speaker);

    // One dot per word answered this round, along the bottom.
    const dotsY = this.scale.height - 56;
    for (let i = 0; i < this.engine.roundLength; i++) {
      const x = CONTENT_LEFT + 10 + i * 24;
      pencilCircle(g, rng, x, dotsY, 7, { ...style, width: 2, alpha: 0.6, points: 8 });
      if (i < this.dots.length) {
        g.fillStyle(COLORS.pencil, 0.55);
        g.fillCircle(x, dotsY, 5);
      }
    }

    if (this.state === 'done') {
      // A big star for finishing the round (whatever the score), and ↻ / ◀.
      const grow = Math.min(1, (time - this.doneAt) / 400);
      drawStar(g, rng, this.centerX(), this.scale.height / 2 - 40, 90 * grow, { width: 4 });
      const b = this.doneButtons();
      for (const [icon, p] of [['again', b.again], ['back', b.back]]) {
        pencilCircle(g, rng, p.x, p.y, 40, { ...style, points: 16 });
        drawIcon(g, rng, icon, p.x, p.y, 1);
      }
    }
  }
}

// A pencil speaker with sound waves.
function drawSpeaker(g, rng, { x, y, radius, alpha }) {
  const s = radius / 30;
  const style = { color: COLORS.pencil, width: 3 * Math.max(0.7, s), alpha };
  pencilCircle(g, rng, x, y, radius, { ...style, points: 14 });
  const p = (dx, dy) => ({ x: x + dx * s, y: y + dy * s });
  pencilPolyline(g, rng, [p(-14, -6), p(-6, -6), p(3, -14), p(3, 14), p(-6, 6), p(-14, 6), p(-14, -6)], style);
  for (const w of [8, 14]) {
    const arc = [];
    for (let i = -2; i <= 2; i++) arc.push(p(4 + Math.cos(i * 0.4) * w, Math.sin(i * 0.4) * w));
    pencilPolyline(g, rng, arc, { ...style, width: style.width * 0.75 });
  }
}
