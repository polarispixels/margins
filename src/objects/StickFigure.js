// The player: an invisible physics box plus a stick figure drawn on top of it
// every frame with pencil lines.

import { PLAYER, COLORS } from '../config.js';
import { boilRng, pencilLine, pencilCircle } from '../pencil.js';
import { DANCES } from './dances.js';

// Body proportions, measured in pixels up from the feet.
const HIP = 26;
const SHOULDER = 42;
const NECK = 46;
const HEAD_RADIUS = 8;
const LEG = 27;
const ARM = 20;

export class StickFigure {
  constructor(scene, x, y) {
    this.scene = scene;
    this.graphics = scene.add.graphics();

    // The physics box. A Zone has no visuals, so all drawing is up to us.
    this.zone = scene.add.zone(x, y, PLAYER.bodyWidth, PLAYER.bodyHeight);
    scene.physics.add.existing(this.zone);
    this.body = this.zone.body;
    this.body.setCollideWorldBounds(true);

    this.runSpeed = PLAYER.runSpeed; // a scene can change this (Climb walks a bit faster)
    this.facing = 1; // 1 = right, -1 = left
    this.walkPhase = 0; // advances while walking; drives the leg/arm swing
    this.scaleX = 1; // squash and stretch
    this.scaleY = 1;
    this.wasOnFloor = false;
    // Sideways speed from being flung (e.g. letting go of a rope). It carries you
    // until you land, with only a little steering, so how you were flung matters.
    this.carryX = 0;

    // Jump feel timers, in milliseconds. While > 0 they count down.
    this.coyoteTimer = 0; // "still allowed to jump" after leaving the floor
    this.jumpBufferTimer = 0; // "jump was pressed recently" before landing
    this.jumpCutAvailable = false; // true while rising from a jump that can still be cut short

    this.dancing = null; // { name, start, ms } while a celebration dance plays (see dances.js)
  }

  // Dance on the spot for `ms` milliseconds. He ignores walking and jumping until it's over.
  dance(name, ms) {
    this.dancing = { name, start: this.scene.time.now, ms };
  }

  get isDancing() {
    return this.dancing !== null && this.scene.time.now < this.dancing.start + this.dancing.ms;
  }

  // His head hit something from below: stop rising and drop back down.
  bonk() {
    if (this.body.velocity.y < 0) this.body.setVelocityY(120);
    this.jumpCutAvailable = false;
  }

  // input: { left, right, jump, jumpHeld }
  //   jump     is true only on the frame the button is first pressed
  //   jumpHeld is true for as long as it's held down
  update(input, dt) {
    if (this.dancing && !this.isDancing) this.dancing = null;
    if (this.dancing) input = { left: false, right: false, jump: false, jumpHeld: false };
    const body = this.body;
    const onFloor = body.blocked.down || body.touching.down;
    const ms = dt * 1000;
    this.jumped = false; // true only on the frame he jumps (e.g. for a sound)

    // Walking (or flying through the air after a fling, steering a little).
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (onFloor) this.carryX = 0;
    body.setVelocityX(this.carryX ? this.carryX + dir * PLAYER.airSteer : dir * this.runSpeed);
    if (dir !== 0) this.facing = dir;

    // Landing: squash short and wide. Done before the jump check so a
    // buffered jump on the landing frame shows the take-off stretch instead.
    if (onFloor && !this.wasOnFloor) {
      this.setScale(1.3, 0.7);
    }
    this.wasOnFloor = onFloor;

    // Coyote time: standing on the floor keeps the window full. Once we walk
    // off a ledge it drains, and until it's empty we can still jump.
    if (onFloor) this.coyoteTimer = PLAYER.coyoteTimeMs;

    // Jump buffering: remember a press for a little while, so pressing jump
    // just before landing still counts.
    if (input.jump) this.jumpBufferTimer = PLAYER.jumpBufferMs;

    // Jump when there's a recent press and we're on (or just left) the floor.
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      body.setVelocityY(-PLAYER.jumpSpeed);
      this.setScale(0.8, 1.25); // stretch tall and thin on take-off
      // Use up both, so one press can't jump twice.
      this.jumpBufferTimer = 0;
      this.coyoteTimer = 0;
      this.jumpCutAvailable = true;
      this.jumped = true;
    }

    // Drain the timers *after* the check, so each window lasts its full length
    // (draining first would quietly shave a frame off both).
    if (!onFloor) this.coyoteTimer = Math.max(0, this.coyoteTimer - ms);
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - ms);

    // Variable jump height: letting go while still rising cuts the jump short.
    // A tap makes a small hop; holding gives the full jump.
    if (this.jumpCutAvailable) {
      if (body.velocity.y >= 0) {
        this.jumpCutAvailable = false; // already falling; nothing to cut
      } else if (!input.jumpHeld) {
        body.setVelocityY(body.velocity.y * PLAYER.jumpCutMultiplier);
        this.jumpCutAvailable = false;
      }
    }

    // Ease the squash/stretch back to normal. Using dt keeps it frame-rate independent.
    const ease = 1 - Math.exp(-dt * 12);
    this.scaleX += (1 - this.scaleX) * ease;
    this.scaleY += (1 - this.scaleY) * ease;

    // Advance the walk cycle while moving on the ground; settle to standing otherwise.
    if (onFloor && dir !== 0) {
      this.walkPhase += dt * 14;
    } else if (onFloor) {
      this.walkPhase = 0;
    }

    this.onFloor = onFloor;
  }

  // Fly off sideways at vx (and vy), keeping that speed until landing.
  fling(vx, vy) {
    this.carryX = vx;
    this.body.setVelocity(vx, vy);
    this.jumpCutAvailable = false;
  }

  setScale(x, y) {
    this.scaleX = x;
    this.scaleY = y;
  }

  // Center of the figure, used for the goal check.
  get center() {
    return { x: this.body.center.x, y: this.body.center.y };
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 1);

    // Feet position: bottom center of the physics body.
    const feetX = this.body.center.x;
    const feetY = this.body.bottom;

    // Convert a point in "figure space" (u right, v up from the feet) to
    // screen space, applying facing direction and squash/stretch.
    const toScreen = (u, v) => ({
      x: feetX + u * this.scaleX * this.facing,
      y: feetY - v * this.scaleY,
    });

    // Pose. Angles are in radians, measured from straight down.
    const pose = this.pose(time);
    const { legA, legB, armA, armB } = pose;

    // A dance can slide the hips, lean the head, move the whole figure, or turn
    // him side-on (a spin squeezes him sideways through zero and out the other way).
    const turn = pose.turn ?? 1;
    const at = (u, v) => toScreen(((pose.slide ?? 0) + u) * turn, v + (pose.bob ?? 0));
    const hipU = pose.hip ?? 0;
    const neckU = hipU + (pose.lean ?? 0);
    const shoulderU = hipU + (neckU - hipU) * ((SHOULDER - HIP) / (NECK - HIP));

    // Find the end of a limb that starts at (u, v) and hangs at `angle`.
    const limb = (u, v, length, angle) => at(u + Math.sin(angle) * length, v - Math.cos(angle) * length);

    const hip = at(hipU, HIP);
    const shoulder = at(shoulderU, SHOULDER);
    const neck = at(neckU, NECK);
    const head = at(neckU + (pose.lean ?? 0) * 0.3, NECK + HEAD_RADIUS);
    const style = { color: COLORS.pencil, width: PLAYER.lineWidth };

    // Torso.
    pencilLine(g, rng, hip.x, hip.y, neck.x, neck.y, style);

    // Legs and arms.
    for (const angle of [legA, legB]) {
      const foot = limb(hipU, HIP, LEG, angle);
      pencilLine(g, rng, hip.x, hip.y, foot.x, foot.y, style);
    }
    for (const angle of [armA, armB]) {
      const hand = limb(shoulderU, SHOULDER, ARM, angle);
      pencilLine(g, rng, shoulder.x, shoulder.y, hand.x, hand.y, style);
    }

    // Head. Average the two scales so the head stays roughly round.
    const headRadius = HEAD_RADIUS * (this.scaleX + this.scaleY) * 0.5;
    pencilCircle(g, rng, head.x, head.y, headRadius, { ...style, points: 10 });
  }

  // How his arms and legs are bent right now: a dance move, walking, or in the air.
  pose(time) {
    if (this.dancing && this.onFloor) {
      const t = (time - this.dancing.start) / 1000;
      const p = Math.min(1, (time - this.dancing.start) / this.dancing.ms);
      return { legA: 0.18, legB: -0.18, armA: 0, armB: 0, ...DANCES[this.dancing.name](t, p) };
    }
    if (this.onFloor) {
      const swing = Math.sin(this.walkPhase);
      // A small base spread so the legs don't overlap when standing still.
      // Arms swing opposite to legs.
      return { legA: 0.18 + swing * 0.5, legB: -0.18 - swing * 0.5, armA: -swing * 0.6, armB: swing * 0.6 };
    }
    // In the air: legs apart, arms up. Rising vs falling changes it a little.
    const rising = this.body.velocity.y < 0;
    return { legA: 0.5, legB: rising ? -0.2 : -0.45, armA: rising ? 2.6 : 2.0, armB: rising ? -2.6 : -2.0 };
  }
}
