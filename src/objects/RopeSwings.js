// Rope swings over Launch's ravine.
//
// Each rope is a real pendulum: an angle from straight down (theta) and how fast
// it's changing (omega). Gravity pulls it back toward the middle with
//   angular acceleration = -(g / length) * sin(theta)
// using the same gravity as the stick figure, so a swing feels like a fall.
//
// Jump into a rope to grab it. Hold the way you're already swinging to pump it
// higher (like a playground swing). Press jump to let go: you fly off in the
// direction the rope's end is moving, so when you let go decides how far you go.

import Phaser from 'phaser';
import { LAUNCH, PLAYER } from '../config.js';
import { drawRope, drawBranch } from './forestArt.js';
import { drawTree } from './launchArt.js';

const GRAB_RADIUS = 30; // how close your hands must come to the rope
const GRAB_FROM = 0.35; // you can grab the lower part of the rope (0 = knot, 1 = end)
const HOLD_FROM = 0.75; // ...and you slide down to at least here (a longer swing is a faster one)
const REGRAB_MS = 350; // after letting go, wait this long before grabbing again
const HANG = 34; // from the rope's end (your hands) down to the middle of your body

export class RopeSwings {
  // Options let other levels (SWING) hang ropes elsewhere; the defaults are Launch's.
  constructor({ ropes = LAUNCH.ropes, top = LAUNCH.ropeTop, length = LAUNCH.ropeLength } = {}) {
    this.length = length;
    this.ropes = ropes.map((x, i) => ({ x, y: top, theta: i ? -0.3 : 0.3, omega: 0 }));
    this.held = null; // the rope you're hanging on, if any
    this.holdLength = length; // how far down the rope your hands are
    this.letGoAt = -Infinity;
  }

  // A point `length` px down a rope (its end, by default).
  end(rope, length = this.length) {
    return { x: rope.x + Math.sin(rope.theta) * length, y: rope.y + Math.cos(rope.theta) * length };
  }

  // Move the ropes, and handle grabbing, hanging, and letting go.
  // Returns 'grab' or 'release' on the frame that happens (for sounds), else null.
  // While you're hanging on, `holding` is true and the ropes move the player.
  update(time, dt, player, input) {
    let event = null;

    for (const rope of this.ropes) {
      // A shorter pendulum swings faster: the one you hold swings from your hands.
      const length = rope === this.held ? this.holdLength : this.length;
      let accel = -(PLAYER.gravity / length) * Math.sin(rope.theta);
      if (rope === this.held) {
        // Pumping: push the way you're already swinging (or start a swing).
        const push = (input.right ? 1 : 0) - (input.left ? 1 : 0);
        if (push !== 0 && (Math.sign(rope.omega) === push || Math.abs(rope.omega) < 0.2)) {
          accel += push * LAUNCH.ropePump;
        }
      } else {
        accel -= rope.omega * LAUNCH.ropeDamping; // free ropes slowly settle
      }
      rope.omega += accel * dt;
      rope.theta += rope.omega * dt;
      // A rope can only swing so high; it stops there and falls back.
      if (Math.abs(rope.theta) > LAUNCH.ropeMaxAngle) {
        rope.theta = Math.sign(rope.theta) * LAUNCH.ropeMaxAngle;
        rope.omega = 0;
      }
    }

    const body = player.body;
    if (this.held) {
      const rope = this.held;
      const hands = this.end(rope, this.holdLength);
      body.reset(hands.x, hands.y + HANG); // hang by your hands
      if (Math.abs(rope.omega) > 0.1) player.facing = Math.sign(rope.omega);
      if (input.jump) {
        this.letGo(player, true);
        event = 'release';
      }
    } else if (time - this.letGoAt > REGRAB_MS && !player.onFloor) {
      const hands = { x: body.center.x, y: body.top + 6 };
      for (const rope of this.ropes) {
        const e = this.end(rope);
        const near = Phaser.Math.Clamp(closestAlong(rope, e, hands), GRAB_FROM, 1);
        const point = { x: rope.x + (e.x - rope.x) * near, y: rope.y + (e.y - rope.y) * near };
        if (Math.hypot(hands.x - point.x, hands.y - point.y) < GRAB_RADIUS) {
          this.grab(rope, player, Math.max(near, HOLD_FROM) * this.length);
          event = 'grab';
          break;
        }
      }
    }
    return event;
  }

  get holding() {
    return this.held !== null;
  }

  // Catch the rope, keeping your momentum: the part of your velocity along the
  // rope's swing direction becomes its swing speed.
  grab(rope, player, length) {
    const body = player.body;
    const along = body.velocity.x * Math.cos(rope.theta) - body.velocity.y * Math.sin(rope.theta);
    rope.omega = along / length;
    this.held = rope;
    this.holdLength = length;
    body.setAllowGravity(false);
    body.setVelocity(0, 0);
  }

  // Let go. With `fling`, you fly off along the swing (plus a little hop);
  // without it (e.g. when the attempt ends) you just drop.
  letGo(player, fling = false) {
    const rope = this.held;
    if (!rope) return;
    const body = player.body;
    body.setAllowGravity(true);
    if (fling) {
      const speed = rope.omega * this.holdLength;
      player.fling(speed * Math.cos(rope.theta), -speed * Math.sin(rope.theta) - LAUNCH.ropeReleaseBoost);
    }
    this.held = null;
    this.letGoAt = player.scene.time.now;
  }

  // The two big trees at the ravine's edges, the branch between them, and the ropes.
  draw(g, rng, floorY) {
    const { from, to } = LAUNCH.ravine;
    drawTree(g, rng, from - 40, floorY, 380);
    drawTree(g, rng, to + 40, floorY, 380);
    drawBranch(g, rng, from - 40, to + 40, LAUNCH.ropeTop);
    this.drawRopes(g, rng);
  }

  // Just the ropes, for levels that draw their own scenery.
  drawRopes(g, rng) {
    for (const rope of this.ropes) {
      const e = this.end(rope);
      drawRope(g, rng, rope.x, rope.y, e.x, e.y);
    }
  }
}

// How far along the rope (0 at the knot, 1 at the end) is the point closest to `p`?
function closestAlong(rope, e, p) {
  const dx = e.x - rope.x;
  const dy = e.y - rope.y;
  return ((p.x - rope.x) * dx + (p.y - rope.y) * dy) / (dx * dx + dy * dy);
}
