// The one and only scene. It builds the page, reads input, and runs the loop.

import Phaser from 'phaser';
import { WIDTH, HEIGHT, PLAYER, COLORS } from '../config.js';
import { LEVEL, lineY } from '../level.js';
import { drawPaper } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { CoffeeRing } from '../objects/CoffeeRing.js';
import { TouchControls } from '../objects/TouchControls.js';

const RESTART_DELAY_MS = 2000;

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // create() runs once when the scene starts (and again on every restart).
  create() {
    this.pageComplete = false;
    this.physics.resume(); // in case the last page paused it

    // Order matters: things added later are drawn on top.
    drawPaper(this);
    this.platforms = new Platforms(this);
    this.goal = new CoffeeRing(this, LEVEL.goal.x, lineY(LEVEL.goal.line) - 30);
    this.player = new StickFigure(this, PLAYER.startX, PLAYER.startY);
    this.touch = new TouchControls(this);

    // Make the player stand on platforms and stop at the wall.
    this.physics.add.collider(this.player.zone, this.platforms.group);

    // Keyboard: arrow keys, or A/D, plus space (up arrow / W also jump).
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('A,D,W,SPACE');

    this.touchJumpWasDown = false;
  }

  // Combine keyboard and touch into one simple input object.
  readInput() {
    const k = this.keys;
    const c = this.cursors;
    const JustDown = Phaser.Input.Keyboard.JustDown;

    this.touch.update();
    const touch = this.touch.state;

    // Touch jump only counts on the frame the finger first lands, like a key press.
    const touchJump = touch.jump && !this.touchJumpWasDown;
    this.touchJumpWasDown = touch.jump;

    return {
      left: c.left.isDown || k.A.isDown || touch.left,
      right: c.right.isDown || k.D.isDown || touch.right,
      jump: JustDown(k.SPACE) || JustDown(c.up) || JustDown(k.W) || touchJump,
    };
  }

  // update() runs every frame. `delta` is milliseconds since the last frame.
  update(time, delta) {
    const dt = delta / 1000;

    if (!this.pageComplete) {
      this.player.update(this.readInput(), dt);

      if (this.goal.contains(this.player.center)) {
        this.completePage();
      }
    }

    // Redraw everything that boils. Each draw() is cheap; the wobble only
    // changes when the boil frame ticks over.
    this.platforms.draw(time);
    this.goal.draw(time);
    this.player.draw(time);
    this.touch.draw(time);
  }

  completePage() {
    this.pageComplete = true;
    this.physics.pause();

    this.add
      .text(WIDTH / 2, HEIGHT / 2 - 40, 'Page complete', {
        fontFamily: '"Comic Sans MS", "Chalkboard SE", "Marker Felt", cursive',
        fontSize: '64px',
        color: '#' + COLORS.pencil.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAngle(-3); // a little tilt, like it was scribbled

    // Turn the page: start over after a short pause.
    this.time.delayedCall(RESTART_DELAY_MS, () => this.scene.restart());
  }
}
