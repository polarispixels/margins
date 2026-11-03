// Launch's river crossing.
//
// Things you can stand on are moving physics bodies (immovable, no gravity):
// lily pads (some sink after you land on them, and you sink with them), the
// alligator's back, and a log that drifts back and forth. Whoever stands on the
// log is moved along with it each frame, so you ride it.
//
// Things that end the attempt: falling in the water (checked by the scene), the
// alligator's head, and the leaping fish. hazard() reports those.

import { LAUNCH } from '../config.js';
import { drawWater, drawLilyPad, drawGator, drawFish, drawBubbles } from './forestArt.js';
import { drawLog } from './launchArt.js';

// Layout, in px from the river's left bank.
const PADS = [
  { at: 100, w: 80 },
  { at: 230, w: 80, sinks: true, flower: true },
  { at: 680, w: 80 },
  { at: 1120, w: 80, sinks: true },
];
const GATOR = { at: 360, back: 150, head: 72, rise: 10 }; // its back sits `rise` px above the banks
const FISH = { from: 745, to: 935 }; // it leaps across the gap after the alligator
const DRIFT = { from: 860, to: 1040, w: 120 }; // the drifting log's center travels between these
const PAD_THICKNESS = 10;
const SURFACE = 10; // the water's surface is this far below the floor line
const HEAD_TOP = 36; // the head is dangerous up to this far above the surface

export class River {
  constructor(scene, floorY) {
    this.scene = scene;
    this.floorY = floorY;
    this.left = LAUNCH.river.from;
    this.right = LAUNCH.river.to;
    this.surfaceY = floorY + SURFACE;
    this.group = scene.physics.add.group({ allowGravity: false, immovable: true });

    // The top of everything you stand on is level with the banks.
    const top = floorY + 2;
    const part = (x, w, extra = {}, y = top) => {
      const zone = scene.add.zone(x, y + PAD_THICKNESS / 2, w, PAD_THICKNESS);
      this.group.add(zone);
      // One-way: you can jump up through from below and land on top.
      Object.assign(zone.body.checkCollision, { down: false, left: false, right: false });
      return { zone, homeX: x, homeY: zone.y, w, ...extra };
    };
    this.pads = PADS.map((p) => part(this.left + p.at, p.w, { sinks: !!p.sinks, flower: !!p.flower }));
    this.gator = part(this.left + GATOR.at + GATOR.back / 2, GATOR.back, {}, top - GATOR.rise);
    this.drift = part(this.left + (DRIFT.from + DRIFT.to) / 2, DRIFT.w);
    this.reset();
  }

  // Everything back the way it started (when you go back to a checkpoint).
  reset() {
    for (const p of [...this.pads, this.gator, this.drift]) {
      p.zone.body.enable = true;
      p.zone.body.reset(p.homeX, p.homeY);
      Object.assign(p, { state: 'float', since: 0, standing: false });
    }
  }

  // The scene calls this from the collider when the figure lands on a part.
  landed(zone, time) {
    const pad = this.pads.find((p) => p.zone === zone);
    if (pad && pad.sinks && pad.state === 'float') Object.assign(pad, { state: 'stood', since: time });
  }

  update(time, player) {
    // Sinking pads: stood on → wobble → sink → gone (under water) → float again.
    for (const pad of this.pads) {
      if (!pad.sinks) continue;
      const body = pad.zone.body;
      const t = (time - pad.since) / 1000;
      if (pad.state === 'stood' && t > LAUNCH.padSinkDelay) Object.assign(pad, { state: 'wobble', since: time });
      else if (pad.state === 'wobble' && t > LAUNCH.padWobble) Object.assign(pad, { state: 'sink', since: time });
      else if (pad.state === 'sink') {
        body.setVelocityY(LAUNCH.padSinkSpeed);
        if (body.top > this.floorY + 40) {
          body.setVelocityY(0);
          body.enable = false;
          Object.assign(pad, { state: 'gone', since: time });
        }
      } else if (pad.state === 'gone' && t > LAUNCH.padResurface) {
        body.enable = true;
        body.reset(pad.homeX, pad.homeY);
        Object.assign(pad, { state: 'float', since: time });
      }
    }

    // The drifting log floats back and forth along a sine wave. Its speed is the
    // wave's slope, plus a gentle pull back onto the wave.
    const mid = this.left + (DRIFT.from + DRIFT.to) / 2;
    const swing = (DRIFT.to - DRIFT.from) / 2;
    const w = (Math.PI * 2) / LAUNCH.driftSeconds;
    const t = time / 1000;
    const body = this.drift.zone.body;
    body.setVelocityX(swing * w * Math.cos(w * t) + (mid + Math.sin(w * t) * swing - body.center.x) * 2);

    // Ride along: if you're standing on the log, move with it.
    const moved = body.center.x - (this.lastDriftX ?? body.center.x);
    this.lastDriftX = body.center.x;
    const you = player.body;
    if (player.onFloor && Math.abs(you.bottom - body.top) < 3 && you.right > body.left && you.left < body.right) you.x += moved;
  }

  // Where the fish is right now, or null when it's under water.
  fish(time) {
    const cycle = (time / 1000) % LAUNCH.fishEvery;
    if (cycle > LAUNCH.fishAir) return null;
    const p = cycle / LAUNCH.fishAir;
    const x = this.left + FISH.from + (FISH.to - FISH.from) * p;
    const y = this.surfaceY - 4 * LAUNCH.fishHeight * p * (1 - p);
    const angle = Math.atan2(-4 * LAUNCH.fishHeight * (1 - 2 * p), FISH.to - FISH.from);
    return { x, y, angle };
  }

  // Does the figure touch the alligator's head or the fish? Returns 'chomp',
  // 'splash', or null.
  hazard(time, body) {
    const hx = this.left + GATOR.at + GATOR.back;
    if (body.right > hx + 4 && body.left < hx + GATOR.head && body.bottom > this.surfaceY - HEAD_TOP) return 'chomp';
    const fish = this.fish(time);
    if (fish && fish.x > body.left - 12 && fish.x < body.right + 12 && fish.y > body.top - 8 && fish.y < body.bottom + 8) {
      return 'splash';
    }
    return null;
  }

  // Is this x over the river?
  contains(x) {
    return x > this.left && x < this.right;
  }

  // Pads, the alligator, and the log go behind the figure; the water goes in front
  // (so you sink into it).
  drawBack(g, rng, time) {
    for (const pad of this.pads) {
      if (pad.state === 'gone') continue;
      const shake = pad.state === 'wobble' ? 1 : pad.state === 'stood' ? 0.3 : 0;
      drawLilyPad(g, rng, pad.zone.body.center.x, pad.zone.body.top, pad.w, time, shake, pad.flower);
    }
    const jaw = Math.abs(Math.sin((time / 1000 / LAUNCH.gatorSnap) * Math.PI));
    drawGator(g, rng, this.left + GATOR.at, this.gator.zone.body.top, this.surfaceY, GATOR.back, GATOR.head, jaw);
    const log = this.drift.zone.body;
    drawLog(g, rng, log.left, this.surfaceY + 2, DRIFT.w, this.surfaceY + 2 - log.top);
  }

  drawFront(g, rng, time) {
    drawWater(g, rng, this.left, this.right, this.surfaceY, this.floorY + 60, time);
    const fish = this.fish(time);
    if (fish) drawFish(g, rng, fish.x, fish.y, fish.angle);
    // Bubbles in the half second before each leap.
    const untilLeap = LAUNCH.fishEvery - ((time / 1000) % LAUNCH.fishEvery);
    if (untilLeap < 0.6) drawBubbles(g, rng, this.left + FISH.from, this.surfaceY + 4, 1 - untilLeap / 0.6, time);
  }
}
