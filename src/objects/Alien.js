// The alien on foot, in Launch's chase. It hops out of the UFO behind you and
// boings along on its spring legs, a little slower than you run, hopping over
// logs and fallen trees. It never falls too far behind. Every so often its
// antennae sparkle and it fires a zap that skims along the ground: jump over it.
//
// States: 'inUfo' → 'jumping' (out of the saucer) → 'chasing' → 'leaving'
// (beamed back up at the launch pad) → 'gone'.

import { LAUNCH, PLAYER } from '../config.js';
import { drawAlien, drawZap } from './chaseArt.js';

const BOING = 220; // the little hop it makes with every step
const BOING_EVERY = 0.32; // seconds between those hops
const BIG_HOP = 560; // the hop over an obstacle
const ZAP_HEIGHT = 20; // zaps fly this far above the ground: knee height
const CATCH_DISTANCE = 26;

export class Alien {
  constructor(floorY) {
    this.floorY = floorY;
    this.reset();
  }

  reset() {
    Object.assign(this, { state: 'inUfo', x: 0, y: 0, vy: 0, vx: 0, nextBoing: 0, nextZap: 0, warnStart: null });
    this.zaps = [];
  }

  get out() {
    return this.state === 'jumping' || this.state === 'chasing' || this.state === 'leaving';
  }

  // Hop out of the saucer at (x, y).
  jumpOut(x, y, time) {
    Object.assign(this, { state: 'jumping', x, y, vx: 60, vy: -150, nextZap: time + 1600 });
  }

  // Float back up into the saucer (the UFO draws the beam).
  beamUp() {
    if (this.out) this.state = 'leaving';
    this.zaps = [];
    this.warnStart = null;
  }

  // Ground height under x: the top of an obstacle there, or the floor.
  groundAt(x, obstacles) {
    let y = this.floorY;
    for (const o of obstacles) if (x > o.from && x < o.to) y = Math.min(y, o.top);
    return y;
  }

  // Returns a list of events: 'zap' (fired one), 'hit' (a zap hit you), 'caught'.
  // `canBeHit` is false while you're stunned or safe after a checkpoint.
  update(time, dt, player, obstacles, ufo, canBeHit) {
    const events = [];
    const body = player.body;
    const px = body.center.x;

    if (this.state === 'leaving') {
      this.x += (ufo.x - this.x) * Math.min(1, dt * 3);
      this.y += (ufo.y + 10 - this.y) * Math.min(1, dt * 2);
      if (Math.abs(this.y - ufo.y - 10) < 12) this.state = 'gone';
      return events;
    }
    if (!this.out) return events;

    // Falling (out of the saucer, or after a hop) and landing.
    this.vy += PLAYER.gravity * dt;
    this.y += this.vy * dt;
    const ground = this.groundAt(this.x, obstacles);
    const onGround = this.y >= ground;
    if (onGround) {
      this.y = ground;
      this.vy = 0;
      if (this.state === 'jumping') this.state = 'chasing';
    }

    if (this.state === 'chasing') {
      // Boing along toward you, never too far behind.
      const dir = Math.sign(px - this.x) || 1;
      this.facing = dir;
      this.x += dir * LAUNCH.alienSpeed * dt;
      if (px - this.x > LAUNCH.alienMaxBehind) this.x = px - LAUNCH.alienMaxBehind;
      if (onGround) {
        const blocked = obstacles.some((o) => o.from - this.x > 0 && o.from - this.x < 60 && dir > 0 && o.top < this.y - 4);
        if (blocked) this.vy = -BIG_HOP;
        else if (time > this.nextBoing) {
          this.vy = -BOING;
          this.nextBoing = time + BOING_EVERY * 1000;
        }
      }

      // Zaps: sparkle, then fire, only while you're ahead of it.
      if (time > this.nextZap && dir > 0) {
        this.warnStart ??= time;
        if (time - this.warnStart > LAUNCH.zapWarning * 1000) {
          this.zaps.push({ x: this.x + 30, y: this.floorY - ZAP_HEIGHT });
          this.warnStart = null;
          this.nextZap = time + LAUNCH.zapEvery * 1000;
          events.push('zap');
        }
      }

      // Caught? (Jumping over it is fine.)
      if (canBeHit && Math.abs(this.x - px) < CATCH_DISTANCE && body.bottom > this.y - 40) events.push('caught');
    } else {
      this.x += this.vx * dt;
    }

    for (const zap of this.zaps) {
      zap.x += LAUNCH.zapSpeed * dt;
      if (canBeHit && !zap.spent && zap.x > body.left - 6 && zap.x < body.right + 6 && zap.y > body.top && zap.y < body.bottom) {
        zap.spent = true;
        events.push('hit');
      }
    }
    this.zaps = this.zaps.filter((z) => !z.spent && z.x < px + 900);
    return events;
  }

  draw(g, rng, time, playerX) {
    for (const zap of this.zaps) drawZap(g, rng, zap.x, zap.y, 1, time);
    if (!this.out) return;
    const aim = this.warnStart === null ? 0 : Math.min(1, (time - this.warnStart) / (LAUNCH.zapWarning * 1000));
    // Squashed on landing, stretched in the air.
    const spring = this.state === 'leaving' ? 1 : Math.max(0.1, Math.min(1, 0.4 - this.vy / 600));
    const blink = Math.floor(time / 100) % 30 === 0;
    drawAlien(g, rng, this.x, this.y, time, { facing: this.facing ?? 1, spring, aim, blink, look: playerX });
  }
}
