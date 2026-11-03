// The player: an invisible physics box plus a stick figure drawn on top of it
// every frame with pencil lines.

import { PLAYER, COLORS } from '../config.js';
import { boilRng, pencilLine, pencilCircle } from '../pencil.js';

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

    // Jump feel timers, in milliseconds. While > 0 they count down.
    this.coyoteTimer = 0; // "still allowed to jump" after leaving the floor
    this.jumpBufferTimer = 0; // "jump was pressed recently" before landing
    this.jumpCutAvailable = false; // true while rising from a jump that can still be cut short
  }

  // input: { left, right, jump, jumpHeld }
  //   jump     is true only on the frame the button is first pressed
  //   jumpHeld is true for as long as it's held down
  update(input, dt) {
    const body = this.body;
    const onFloor = body.blocked.down || body.touching.down;
    const ms = dt * 1000;
    this.jumped = false; // true only on the frame he jumps (e.g. for a sound)

    // Walking.
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    body.setVelocityX(dir * this.runSpeed);
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
    let legA, legB, armA, armB;
    if (this.onFloor) {
      const swing = Math.sin(this.walkPhase);
      // A small base spread so the legs don't overlap when standing still.
      legA = 0.18 + swing * 0.5;
      legB = -0.18 - swing * 0.5;
      armA = -swing * 0.6; // arms swing opposite to legs
      armB = swing * 0.6;
    } else {
      // In the air: legs apart, arms up. Rising vs falling changes it a little.
      const rising = this.body.velocity.y < 0;
      legA = 0.5;
      legB = rising ? -0.2 : -0.45;
      armA = rising ? 2.6 : 2.0;
      armB = rising ? -2.6 : -2.0;
    }

    // Find the end of a limb that starts at (0, startV) and hangs at `angle`.
    const limb = (startV, length, angle) => toScreen(Math.sin(angle) * length, startV - Math.cos(angle) * length);

    const hip = toScreen(0, HIP);
    const shoulder = toScreen(0, SHOULDER);
    const neck = toScreen(0, NECK);
    const head = toScreen(0, NECK + HEAD_RADIUS);
    const style = { color: COLORS.pencil, width: PLAYER.lineWidth };

    // Torso.
    pencilLine(g, rng, hip.x, hip.y, neck.x, neck.y, style);

    // Legs and arms.
    for (const angle of [legA, legB]) {
      const foot = limb(HIP, LEG, angle);
      pencilLine(g, rng, hip.x, hip.y, foot.x, foot.y, style);
    }
    for (const angle of [armA, armB]) {
      const hand = limb(SHOULDER, ARM, angle);
      pencilLine(g, rng, shoulder.x, shoulder.y, hand.x, hand.y, style);
    }

    // Head. Average the two scales so the head stays roughly round.
    const headRadius = HEAD_RADIUS * (this.scaleX + this.scaleY) * 0.5;
    pencilCircle(g, rng, head.x, head.y, headRadius, { ...style, points: 10 });
  }
}
