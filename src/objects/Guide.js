// A guide animal (the cat in CLIMB, the monkey in SWING) that leads the player.
//
// It waits until the player comes close, calls out, then does its next step: walking,
// climbing, bouncing, swinging, or dropping to a new spot. After the last step it stays
// put. Pass drawCat or drawMonkey as `draw`, and that animal's call as `sound`.

import { LEARN } from '../config.js';
import { boilRng } from '../pencil.js';
import { drawHeart } from './Dog.js';
import { drawMonkey } from './animalArt.js';

const ARC_MS = 700; // default time for bounce / swing / drop steps
const LICK_MS = 1200; // how long the cat licks its paw after calling
const HEART_MS = 600; // how long the celebration heart takes to rise

export class Guide {
  // steps: [{ to: {x, y}, move: 'walk' | 'climb' | 'bounce' | 'swing' | 'drop', ms? }]
  constructor(scene, { draw, x, y, steps = [], sound }) {
    this.scene = scene;
    this.drawFn = draw;
    this.sound = sound;
    this.steps = [...steps];
    this.px = x;
    this.py = y;
    this.facing = 1;
    this.current = null; // the step in progress: { step, from, t, duration }
    this.lastClose = null; // when the player was last near (for the "come on!" call)
    this.lickUntil = 0;
    this.celebratedAt = null;
    this.graphics = scene.add.graphics();
  }

  get x() { return this.px; }
  get y() { return this.py; }
  get done() { return this.steps.length === 0 && this.current === null; }

  // A generous box around the animal, like Dog.contains.
  contains(point) {
    return Math.abs(point.x - this.px) < 50 && point.y > this.py - 80 && point.y < this.py + 10;
  }

  update(time, dt, player) {
    if (this.current) {
      this.advance(dt);
      return;
    }
    const target = player.body.center;
    this.facing = target.x >= this.px ? 1 : -1; // wait facing the player
    if (this.lastClose === null) this.lastClose = time;
    if (this.steps.length === 0) return;

    if (Math.hypot(target.x - this.px, target.y - this.py) < LEARN.guideWaitDistance) {
      this.sound();
      this.begin(this.steps.shift());
    } else if (time - this.lastClose > LEARN.guideCallMs) {
      this.sound();
      this.lickUntil = time + LICK_MS;
      this.lastClose = time;
    }
  }

  begin(step) {
    const from = { x: this.px, y: this.py };
    const distance = Math.hypot(step.to.x - from.x, step.to.y - from.y);
    let duration = step.ms ?? ARC_MS;
    if (step.move === 'walk') duration = (distance / LEARN.guideSpeed) * 1000;
    if (step.move === 'climb') duration = (distance / (LEARN.guideSpeed / 2)) * 1000;
    if (step.to.x !== from.x) this.facing = Math.sign(step.to.x - from.x);
    this.current = { step, from, t: 0, duration: Math.max(1, duration) };
  }

  // Move along the current step; when it ends, go back to waiting.
  advance(dt) {
    const c = this.current;
    c.t = Math.min(1, c.t + (dt * 1000) / c.duration);
    const { from, step } = c;
    this.px = from.x + (step.to.x - from.x) * c.t;
    this.py = from.y + (step.to.y - from.y) * c.t;
    // Arcs: bounce hops up, swing dips down then up, drop falls (speeding up).
    const bump = Math.sin(c.t * Math.PI);
    if (step.move === 'bounce') this.py -= bump * 50;
    if (step.move === 'swing') this.py -= bump * 25;
    if (step.move === 'drop') this.py = from.y + (step.to.y - from.y) * c.t * c.t;
    if (c.t >= 1) {
      this.current = null;
      this.lastClose = null; // start the "waiting" clock fresh at the new spot
    }
  }

  // Cheer: a heart rises and the animal calls.
  celebrate(time) {
    if (this.celebratedAt !== null) return;
    this.celebratedAt = time;
    this.sound();
  }

  poseFor(time) {
    const monkey = this.drawFn === drawMonkey;
    if (this.celebratedAt !== null) return monkey ? 'cheer' : 'sit';
    const c = this.current;
    if (c) {
      if (c.step.move === 'walk') return 'walk';
      if (c.step.move === 'climb') return monkey ? 'walk' : 'leap';
      if (c.step.move === 'swing') return monkey ? 'hang' : 'leap';
      return monkey ? 'walk' : 'leap'; // bounce, drop
    }
    if (time < this.lickUntil && !monkey) return 'lick';
    return monkey ? 'stand' : 'sit';
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const rng = boilRng(time, 70);
    const pose = this.poseFor(time);
    // A swinging monkey hangs by its hands, held a little above where it will land.
    const y = pose === 'hang' ? this.py - 50 : this.py;
    this.drawFn(g, rng, this.px, y, { pose, facing: this.facing, time });
    if (this.celebratedAt !== null) {
      const since = time - this.celebratedAt;
      const rise = Math.min(1, since / HEART_MS);
      drawHeart(g, rng, this.px - 40 * this.facing, this.py - 80 - rise * 25, 26);
    }
  }
}
