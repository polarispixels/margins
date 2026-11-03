// Launch's UFO chase, from the UFO arriving to the launch pad.
//
// The UFO works through a list of steps in order of where they are along the level:
//   tree:  fly to a tree ahead of you and bump it; it topples toward you and lies
//          across the path as an obstacle (a solid box once it lands).
//   light: stop over a stretch of ground and sweep the tractor beam back and forth
//          like a searchlight. Caught: you float up; mash jump to break free.
//   alien: swoop behind you and drop off the alien, who chases you on foot (Alien.js).
// At the launch pad, the alien is beamed back up and the UFO hovers over the pad,
// dropping goo now and then (it only stuns).
//
// update() returns a list of events for the scene to react to (words, sounds,
// stuns, and 'pulled' / 'caught', which end the attempt).

import Phaser from 'phaser';
import { LAUNCH } from '../config.js';
import { Alien } from './Alien.js';
import { drawUfo, drawGoo, drawGooSplat } from './launchArt.js';
import { drawFallingTree, drawBeam } from './chaseArt.js';

const TREE_HEIGHT = 220;
const TREE_REACH = 212; // how far left of its trunk a fallen tree reaches
const TREE_SOLID = 40; // how tall a fallen tree is to jump onto
const TREE_TOO_CLOSE = 120; // don't knock a tree down if you're this close to where it would land
const LIGHT_LEAD = 700; // the UFO heads to a searchlight spot when you're this far away
const LIGHT_PASSED = 300; // ...and moves on once you're this far past it
const BEAM_TOP = 16; // the beam starts this far below the saucer's middle
const BEAM_TOP_WIDTH = 10;

export class Chase {
  constructor(scene, floorY, platforms) {
    this.scene = scene;
    this.floorY = floorY;
    this.alien = new Alien(floorY);
    // Each fallen tree's solid box exists from the start but is switched off until it lands.
    this.trees = LAUNCH.fallingTrees.map((x) => {
      const solid = platforms.addSolid(x - TREE_REACH, floorY - TREE_SOLID, TREE_REACH + 6, TREE_SOLID);
      return { x, solid };
    });
    this.reset();
  }

  // Back to before the UFO arrived (when you go back to the chase's checkpoint).
  reset() {
    this.ufo = { mode: 'waiting', x: 0, y: -200, warnStart: null, nextDrop: 0 };
    for (const tree of this.trees) {
      Object.assign(tree, { tilt: 0, spin: 0, state: 'standing' });
      tree.solid.body.enable = false;
    }
    this.steps = [
      ...this.trees.map((tree) => ({ kind: 'tree', x: tree.x, tree })),
      ...LAUNCH.searchlights.map((x) => ({ kind: 'light', x })),
      { kind: 'alien', x: LAUNCH.alienAt },
    ].sort((a, b) => a.x - b.x);
    this.step = 0;
    this.beam = null; // { angle, phase } while the searchlight is on
    this.beamOffUntil = 0;
    this.capture = null; // { presses } while you're caught in the beam
    this.goos = [];
    this.alien.reset();
  }

  get capturing() {
    return this.capture !== null;
  }

  // Obstacles the alien hops over: logs and fallen trees.
  obstacles(logs) {
    const list = logs.map((o) => ({ ...o }));
    for (const tree of this.trees) {
      if (tree.state === 'down') list.push({ from: tree.x - TREE_REACH, to: tree.x + 6, top: this.floorY - TREE_SOLID });
    }
    return list;
  }

  // The rocket is launching: the UFO gives up and zooms away.
  leave() {
    this.ufo.mode = 'leave';
    this.beam = null;
    this.alien.beamUp();
  }

  // If you're caught in the beam when the attempt ends, let go.
  release(player) {
    if (!this.capture) return;
    this.capture = null;
    player.body.setAllowGravity(true);
  }

  update(time, dt, player, input, canBeHit, logs) {
    const events = [];
    const ufo = this.ufo;
    const px = player.body.center.x;
    const step = this.steps[this.step];
    const bob = Math.sin(time / 400) * 10;
    const fly = (x, y, rate) => {
      ufo.x += (x - ufo.x) * Math.min(1, dt * rate);
      ufo.y += (y - ufo.y) * Math.min(1, dt * rate);
    };

    if (ufo.mode === 'waiting') {
      if (px > LAUNCH.ufoStart) {
        Object.assign(ufo, { mode: 'follow', x: px - 500, y: LAUNCH.ufoHeight - 220 });
        events.push('arrive');
      }
    } else if (ufo.mode === 'follow') {
      fly(px + 140, LAUNCH.ufoHeight + bob, 1.5);
      if (this.checkTree(step, px)) {
        // ...off to knock a tree down.
      } else if (step?.kind === 'light' && step.x - px < LIGHT_LEAD) ufo.mode = 'search';
      else if (step?.kind === 'alien' && px > step.x) ufo.mode = 'drop';
      else if (px > LAUNCH.padArea) this.startPad();
    } else if (ufo.mode === 'knock') {
      // Fly to the tree's canopy and bump it over.
      const tx = step.x + 60;
      const ty = this.floorY - TREE_HEIGHT * 0.7;
      fly(tx, ty, 5);
      if (Math.hypot(ufo.x - tx, ufo.y - ty) < 30) {
        step.tree.state = 'falling';
        events.push('bump');
        this.nextStep();
      }
    } else if (ufo.mode === 'search') {
      fly(step.x, LAUNCH.ufoHeight + bob * 0.3, 3);
      const there = Math.abs(ufo.x - step.x) < 40;
      if (there && !this.beam && time > this.beamOffUntil) {
        this.beam = { phase: 0 };
        events.push('beam');
      }
      if (px > step.x + LIGHT_PASSED && !this.capture) {
        this.beam = null;
        this.nextStep();
      }
    } else if (ufo.mode === 'drop') {
      // Swoop down behind you and let the alien out.
      const tx = px - 260;
      const ty = LAUNCH.ufoHeight + 70;
      fly(tx, ty, 4);
      if (Math.hypot(ufo.x - tx, ufo.y - ty) < 40) {
        this.alien.jumpOut(ufo.x, ufo.y + 10, time);
        this.nextStep();
        events.push('alien');
      }
    } else if (ufo.mode === 'escort') {
      fly(px + 220, 90 + bob, 1.2); // up high, out of the way, but still knocking trees down
      if (!this.checkTree(step, px) && px > LAUNCH.padArea) this.startPad();
    } else if (ufo.mode === 'pad') {
      this.updatePad(time, dt, px, events, fly, bob);
    } else if (ufo.mode === 'leave') {
      ufo.x += 420 * dt;
      ufo.y -= 380 * dt;
    }

    // Everything else moves whatever the UFO is doing.
    this.updateTrees(dt, player, events);
    this.updateBeam(time, dt, player, input, canBeHit, events);
    for (const e of this.alien.update(time, dt, player, this.obstacles(logs), this.ufo, canBeHit)) events.push(e);
    this.updateGoo(time, dt, player, canBeHit, events);
    return events;
  }

  // If the next step is a tree: knock it down when you get near, or skip it if
  // you're already so close it would fall on you. Returns true if it started a knock.
  checkTree(step, px) {
    if (step?.kind !== 'tree') return false;
    if (step.x - TREE_REACH - px < TREE_TOO_CLOSE) {
      this.nextStep();
      return false;
    }
    if (step.x - px < LAUNCH.treeTrigger) {
      this.ufo.mode = 'knock';
      return true;
    }
    return false;
  }

  // On to the next step; the UFO goes back to following you (or, once the alien
  // is out, back up high).
  nextStep() {
    this.step++;
    this.ufo.mode = this.alien.out ? 'escort' : 'follow';
  }

  startPad() {
    this.ufo.mode = 'pad';
    this.ufo.nextDrop = this.scene.time.now + 2000;
    this.beam = null;
    this.alien.beamUp();
  }

  // ---- Falling trees ----

  updateTrees(dt, player, events) {
    for (const tree of this.trees) {
      if (tree.state !== 'falling') continue;
      tree.spin += 5 * dt; // speeding up as it goes over, like a real fall
      tree.tilt = Math.min(1, tree.tilt + tree.spin * dt);
      if (tree.tilt >= 1) {
        tree.state = 'down';
        tree.solid.body.enable = true;
        events.push('crash');
        // If it lands on you, you end up standing on top of it.
        const body = player.body;
        if (body.right > tree.x - TREE_REACH && body.left < tree.x + 6 && body.bottom > this.floorY - TREE_SOLID) {
          body.reset(body.center.x, this.floorY - TREE_SOLID - body.height / 2 - 1);
        }
      }
    }
  }

  // ---- The tractor beam ----

  // The beam's cone: from under the saucer down to the ground.
  beamShape() {
    const ufo = this.ufo;
    const top = ufo.y + BEAM_TOP;
    const angle = Math.sin(this.beam.phase) * LAUNCH.beamSweep;
    return { x: ufo.x, y: top, groundX: ufo.x + Math.tan(angle) * (this.floorY - top) };
  }

  // Is the point inside the beam?
  inBeam(x, y) {
    const b = this.beamShape();
    const t = (y - b.y) / (this.floorY - b.y);
    if (t < 0 || t > 1) return false;
    const cx = b.x + (b.groundX - b.x) * t;
    const half = BEAM_TOP_WIDTH + (LAUNCH.beamWidth - BEAM_TOP_WIDTH) * t;
    return Math.abs(x - cx) < half;
  }

  updateBeam(time, dt, player, input, canBeHit, events) {
    if (!this.beam) return;
    const body = player.body;
    if (!this.capture) {
      this.beam.phase += ((Math.PI * 2) / LAUNCH.beamPeriod) * dt; // sweeping...
      if (canBeHit && this.inBeam(body.center.x, body.center.y)) {
        this.capture = { presses: 0 };
        body.setAllowGravity(false);
        events.push('captured');
      }
      return;
    }

    // Caught: float up toward the saucer, pulled to the middle of the beam.
    const b = this.beamShape();
    const t = (body.center.y - b.y) / (this.floorY - b.y);
    const cx = b.x + (b.groundX - b.x) * t;
    body.setVelocity((cx - body.center.x) * 3, -LAUNCH.beamRise);
    player.walkPhase += dt * 30; // kicking legs
    if (input.jump) {
      // Each press tugs you back down a little.
      body.reset(body.center.x, Math.min(this.floorY - body.height / 2, body.center.y + LAUNCH.beamMashDrop));
      player.setScale(1.2, 0.8);
      this.capture.presses++;
      events.push('tug');
      if (this.capture.presses >= LAUNCH.beamMashNeeded) {
        this.release(player);
        body.setVelocity(0, 0);
        this.beam = null;
        this.beamOffUntil = time + LAUNCH.beamCooldown * 1000;
        events.push('free');
        return;
      }
    }
    if (body.top < this.ufo.y + 20) events.push('pulled');
  }

  // ---- Goo over the launch pad ----

  updatePad(time, dt, px, events, fly, bob) {
    const ufo = this.ufo;
    const x = Phaser.Math.Clamp(px + 30, LAUNCH.padArea + 100, LAUNCH.padWall - 60);
    fly(x, LAUNCH.ufoHeight - 20 + bob, 1.5);
    if (this.alien.state !== 'gone' && this.alien.state !== 'inUfo') return; // wait for the alien to get back in
    // A warning (rays under the saucer), then a drop.
    if (time > ufo.nextDrop) {
      ufo.warnStart ??= time;
      if (time - ufo.warnStart > LAUNCH.ufoWarning * 1000) {
        this.goos.push({ x: ufo.x, y: ufo.y + 18, vy: 60, splatAt: null });
        ufo.warnStart = null;
        ufo.nextDrop = time + LAUNCH.ufoDropEvery * 1000;
        events.push('drop');
      }
    }
  }

  updateGoo(time, dt, player, canBeHit, events) {
    const body = player.body;
    for (const goo of this.goos) {
      if (goo.splatAt !== null) continue;
      goo.vy += LAUNCH.gooGravity * dt;
      goo.y += goo.vy * dt;
      if (goo.y >= this.floorY - 8) {
        goo.y = this.floorY;
        goo.splatAt = time;
      } else if (canBeHit && goo.x > body.left - 8 && goo.x < body.right + 8 && goo.y > body.top - 8 && goo.y < body.bottom) {
        goo.splatAt = time;
        goo.y = this.floorY;
        events.push('goo');
      }
    }
    this.goos = this.goos.filter((g) => g.splatAt === null || time - g.splatAt < 700);
  }

  // ---- Drawing ----

  // Trees go behind the figure.
  drawBack(g, rng, visible) {
    for (const tree of this.trees) {
      if (visible(tree.x, 400)) drawFallingTree(g, rng, tree.x, this.floorY, TREE_HEIGHT, tree.tilt);
    }
  }

  // The beam, goo, the alien, and the saucer go in front.
  drawFront(g, rng, time, playerX, topY) {
    const ufo = this.ufo;
    if (this.beam) {
      const b = this.beamShape();
      drawBeam(g, rng, b.x, b.y, b.groundX, this.floorY, LAUNCH.beamWidth, 1, time);
    }
    if (this.alien.state === 'leaving') {
      drawBeam(g, rng, ufo.x, ufo.y + BEAM_TOP, this.alien.x, this.alien.y, 22, 0.7, time);
    }
    for (const goo of this.goos) {
      if (goo.splatAt === null) drawGoo(g, rng, goo.x, goo.y);
      else drawGooSplat(g, rng, goo.x, this.floorY, (time - goo.splatAt) / 700);
    }
    this.alien.draw(g, rng, time, playerX);
    if (ufo.mode !== 'waiting' && ufo.y > topY - 150) {
      const warn = ufo.warnStart === null ? 0 : (time - ufo.warnStart) / (LAUNCH.ufoWarning * 1000);
      drawUfo(g, rng, ufo.x, ufo.y, time, Math.min(1, warn), !this.alien.out);
    }
  }
}
