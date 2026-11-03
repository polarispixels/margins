// The puzzle at Launch's rocket pad: press the red, blue, and green buttons in
// the order the clue shows, and the rocket is ready to go.
//
// The clue is a note on a signpost before the pad: three colored dots and an
// arrow (read left to right). The order is shuffled every time you play. A
// correct press dings and checks off its dot; a wrong one buzzes and every
// button pops back up. One button is up on the gantry, reached by two ledges.

import Phaser from 'phaser';
import { LAUNCH, COLORS } from '../config.js';
import { lineY } from './Paper.js';
import { drawSwitch, drawClue, drawFence, hatchCircle, SWITCH_WIDTH, SWITCH_HEIGHT } from './puzzleArt.js';

const GANTRY_LINE = 8; // the gantry's top ledge, where the blue button sits
const STEP_LINE = 10; // a small ledge to climb up to it
const RESET_MS = 450; // after a wrong press, the buttons pop back up after this long
export const FENCE_WIDTH = 24;

// The two ledges up to the gantry button (one-way: jump up through them).
export function puzzleLedges() {
  const x = LAUNCH.rocketX;
  return [
    { line: GANTRY_LINE, from: x + 66, to: x + 150, oneWay: true },
    { line: STEP_LINE, from: x + 170, to: x + 250, oneWay: true },
  ];
}

export class LaunchPuzzle {
  constructor(floorY, platforms) {
    this.floorY = floorY;
    this.order = Phaser.Utils.Array.Shuffle(['red', 'blue', 'green']);
    this.switches = Object.entries(LAUNCH.switches).map(([color, x]) => {
      const groundY = color === 'blue' ? lineY(GANTRY_LINE) : floorY;
      platforms.addSolid(x - SWITCH_WIDTH / 2, groundY - SWITCH_HEIGHT, SWITCH_WIDTH, SWITCH_HEIGHT);
      return { color, x, groundY, top: groundY - SWITCH_HEIGHT, pressed: false, standing: false };
    });
    this.done = 0; // how many are pressed in the right order so far
    this.solved = false;
    this.resetAt = null;
    this.shakeUntil = 0;
  }

  // Returns 'right', 'wrong', or 'solved' on the frame that happens, else null.
  update(time, player) {
    if (this.resetAt !== null && time > this.resetAt) {
      for (const s of this.switches) s.pressed = false;
      this.done = 0;
      this.resetAt = null;
    }
    if (this.solved) return null;

    const body = player.body;
    let event = null;
    for (const s of this.switches) {
      const standing = player.onFloor && Math.abs(body.bottom - s.top) < 4 && Math.abs(body.center.x - s.x) < SWITCH_WIDTH / 2 + 4;
      // A press is the moment you step or land on it.
      if (standing && !s.standing && !s.pressed && this.resetAt === null) {
        s.pressed = true;
        if (s.color === this.order[this.done]) {
          this.done++;
          this.solved = this.done === this.order.length;
          event = this.solved ? 'solved' : 'right';
        } else {
          event = 'wrong';
          this.resetAt = time + RESET_MS;
          this.shakeUntil = time + RESET_MS;
        }
      }
      s.standing = standing;
    }
    return event;
  }

  draw(g, rng, time) {
    drawClue(g, rng, LAUNCH.clueX, this.floorY, this.order, this.done);
    const shake = time < this.shakeUntil ? 1 : 0;
    for (const s of this.switches) drawSwitch(g, rng, s.x, s.groundY, COLORS[s.color], s.pressed, shake, time);
    drawFence(g, rng, LAUNCH.padWall, this.floorY, FENCE_WIDTH, 170);
  }

  // Once solved, a green light blinks on the rocket's nose: ready to go.
  drawReadyLight(g, rng, x, y, time) {
    if (this.solved && Math.floor(time / 300) % 2 === 0) hatchCircle(g, rng, x, y, 6, COLORS.green, 0.9);
  }
}
