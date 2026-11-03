// The "Getting Started" panel: a tiny tutorial that teaches WALK and JUMP.
//
//   1. The page draws itself: a pencil traces the line just ahead of the figure.
//      The word WALK is written next to him at the start.
//   2. The word is the obstacle: JUMP, in big solid letters standing on the line.
//   3. A friend at the end: a sleeping dog in a coffee ring. Touch him to wake him up.
//
// There's no way to fail: the whole floor is solid, and the pencil always stays
// ahead of the figure.

import Phaser from 'phaser';
import { PAGE_MAX_WIDTH, PAPER } from '../config.js';
import { drawPaper, lineY } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { CoffeeRing } from '../objects/CoffeeRing.js';
import { Dog } from '../objects/Dog.js';
import { DrawingPencil } from '../objects/DrawingPencil.js';
import { PencilWord } from '../objects/PencilWord.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { markComplete } from '../progress.js';

export const PANEL_ID = 'getting-started';

const FLOOR_LINE = 12;
const START_X = 170;
const FIRST_LINE_END = START_X + 110; // how much line is already drawn at the start
const DRAW_LEAD = 170; // the pencil stays this far ahead of the figure
const DRAW_SPEED = 520; // px per second; faster than the figure walks, so he never catches it
const JUMP_X = 450; // left edge of the JUMP letters
const LETTER_SIZE = 46; // letter height; low enough that a quick tap-jump clears it
const DOG_X = 830;
const CELEBRATE_MS = 2200; // how long to enjoy the waking dog before going back to the comic page

export class GettingStartedScene extends Phaser.Scene {
  constructor() {
    super('GettingStarted');
  }

  create() {
    this.finished = false;
    this.physics.resume(); // the comic page pauses physics while zooming in
    const floorY = lineY(FLOOR_LINE);

    useLayout(this, LANDSCAPE); // Climb switches to portrait; switch back
    drawPaper(this);

    // The floor is solid all the way across, but its pencil trace is only drawn
    // up to `drawnTo`, which the pencil pushes forward as the figure walks.
    this.floor = { line: FLOOR_LINE, from: PAPER.marginX, to: PAGE_MAX_WIDTH, drawnTo: FIRST_LINE_END };
    this.platforms = new Platforms(this, [this.floor]);

    // The goal, hidden until the pencil gets there.
    this.ring = new CoffeeRing(this, DOG_X, floorY - 36, 46);
    this.dog = new Dog(this, DOG_X, floorY);
    this.ring.graphics.setVisible(false);
    this.dog.graphics.setVisible(false);

    // JUMP: each letter is a solid block standing on the line.
    this.jumpWord = new PencilWord(this, 'JUMP', JUMP_X, floorY - LETTER_SIZE, LETTER_SIZE, {
      written: false,
      lineWidth: 5,
    });
    for (const box of this.jumpWord.letterBoxes()) {
      this.platforms.addSolid(box.x, box.y, box.width, box.height);
    }

    // WALK is written next to the figure as the level starts.
    this.walkWord = new PencilWord(this, 'WALK', START_X - 40, floorY - 150, 40, { written: false });
    this.walkWord.write(900);
    this.walkFaded = false;

    this.pencil = new DrawingPencil(this);
    this.player = new StickFigure(this, START_X, floorY - 30);
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group);

    watchScreen(this);
    fadeInFromPaper(this);
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Once the dog is awake, the figure stops listening to input and just stands there.
    const input = this.finished ? { left: false, right: false, jump: false, jumpHeld: false } : this.controls.read();
    this.player.update(input, dt);

    this.updateDrawing(dt);
    this.updateWords();

    if (!this.finished && this.dog.contains(this.player.center)) {
      this.finish(time);
    }

    this.platforms.draw(time);
    this.ring.draw(time);
    this.dog.draw(time);
    this.jumpWord.draw(time);
    this.walkWord.draw(time);
    this.pencil.draw(time, this.floor.drawnTo, lineY(FLOOR_LINE));
    this.player.draw(time);
    this.controls.draw(time);
  }

  // Push the pencil forward so the line stays ahead of the figure, and reveal
  // things as the pencil reaches them.
  updateDrawing(dt) {
    const screenRight = this.scale.width;
    // When the level is finished, the pencil draws the rest of the line and lifts away.
    const target = this.finished ? screenRight : Math.min(this.player.body.center.x + DRAW_LEAD, screenRight);
    if (this.floor.drawnTo < target) {
      this.floor.drawnTo = Math.min(target, this.floor.drawnTo + DRAW_SPEED * dt);
    }
    this.pencil.visible = this.floor.drawnTo < screenRight - 1;

    const drawn = this.floor.drawnTo;
    if (drawn > JUMP_X - 10 && this.jumpWord.progress === 0) {
      this.jumpWord.write(700);
    }
    if (drawn > DOG_X - 60 && !this.dog.graphics.visible) {
      this.ring.graphics.setVisible(true);
      this.dog.graphics.setVisible(true);
    }
  }

  // One word at a time: WALK fades once the figure has walked a little.
  updateWords() {
    if (!this.walkFaded && this.player.body.center.x > START_X + 80) {
      this.walkWord.fadeOut();
      this.walkFaded = true;
    }
  }

  finish(time) {
    this.finished = true;
    this.dog.wake(time);
    markComplete(PANEL_ID);

    // Enjoy the moment, then fade back to the comic page.
    this.time.delayedCall(CELEBRATE_MS, () => {
      fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: PANEL_ID }));
    });
  }
}
