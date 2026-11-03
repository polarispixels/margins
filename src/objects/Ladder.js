// A ladder in the paper's margin. Stand at it and press up or down to grab it,
// climb, then press left or right near a landing to step off.
//
// Call update(player, input) BEFORE player.update(): it decides when the
// player grabs or leaves the ladder; the player's own update does the moving.

import { COLORS, PLAYER } from '../config.js';
import { boilRng, pencilLine } from '../pencil.js';

const RUNG_GAP = 18;
const RAIL_EXTRA = 20; // the rails stick up a little past the top landing
const GRAB_SLACK = 6; // how far from the ladder you can stand and still grab it
const END_SLACK = 4;

export class Ladder {
  // x is the ladder's center. top and bottom are the y of the landings at each end.
  constructor(scene, { x, width, top, bottom, landings }) {
    this.x = x;
    this.width = width;
    this.top = top;
    this.bottom = bottom;
    this.landings = landings ?? [top, bottom];
    this.graphics = scene.add.graphics();
  }

  // Is the player's body next to the ladder, with feet within its height?
  touches(player) {
    const body = player.body;
    return (
      Math.abs(body.center.x - this.x) < this.width / 2 + GRAB_SLACK &&
      body.bottom >= this.top - END_SLACK &&
      body.bottom <= this.bottom + END_SLACK
    );
  }

  update(player, input) {
    const body = player.body;
    if (!player.climbing) {
      if (!this.touches(player)) return;
      const atTop = Math.abs(body.bottom - this.top) <= PLAYER.landingSnap;
      const atBottom = Math.abs(body.bottom - this.bottom) <= PLAYER.landingSnap;
      if ((input.up && !atTop) || (input.down && !atBottom)) player.startClimb(this.x);
      return;
    }

    // Keep the feet between the two ends.
    if (body.bottom < this.top) {
      body.reset(this.x, this.top - PLAYER.bodyHeight / 2);
      body.setVelocityY(0);
    } else if (body.bottom > this.bottom) {
      body.reset(this.x, this.bottom - PLAYER.bodyHeight / 2);
      body.setVelocityY(0);
    }

    // Pressing sideways near a landing steps off onto it.
    if (input.left || input.right) {
      const landing = this.landings.find((y) => Math.abs(body.bottom - y) <= PLAYER.landingSnap);
      if (landing !== undefined) {
        body.reset(body.center.x, landing - PLAYER.bodyHeight / 2);
        player.stopClimb();
      }
    }
  }

  // Two pencil rails and a rung every few pixels, redrawn with the boil.
  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 77);
    const style = { color: COLORS.pencil, width: 3 };
    const left = this.x - this.width / 2;
    const right = this.x + this.width / 2;
    const railTop = this.top - RAIL_EXTRA;

    pencilLine(g, rng, left, railTop, left, this.bottom, style);
    pencilLine(g, rng, right, railTop, right, this.bottom, style);
    for (let y = this.bottom - RUNG_GAP; y > railTop; y -= RUNG_GAP) {
      pencilLine(g, rng, left, y, right, y, style);
    }
  }
}
