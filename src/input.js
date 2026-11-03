// Player input, shared by every scene: keyboard and on-screen touch buttons
// merged into one simple object each frame.

import Phaser from 'phaser';
import { TouchControls } from './objects/TouchControls.js';

export class PlayerInput {
  constructor(scene) {
    // Keyboard: arrow keys, or A/D, plus space (up arrow / W also jump).
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.keys = scene.input.keyboard.addKeys('A,D,W,S,SPACE');
    this.touch = new TouchControls(scene);
    this.touchJumpWasDown = false;
  }

  // Returns { left, right, jump, jumpHeld, up, down }.
  //   jump     is true only on the frame the button is first pressed
  //   jumpHeld is true for as long as it's held (for variable jump height)
  //   up/down  are held states for steering (Launch's rocket): Up/W, Down/S, or ▲ ▼
  read() {
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
      jumpHeld: k.SPACE.isDown || c.up.isDown || k.W.isDown || touch.jump,
      up: c.up.isDown || k.W.isDown || touch.up,
      down: c.down.isDown || k.S.isDown || touch.down,
    };
  }

  // The touch buttons boil like everything else, so they redraw every frame.
  draw(time) {
    this.touch.draw(time);
  }
}
