// Launch: a side-scrolling story level.
//
// The stick figure runs right through a forest, is chased by an alien in a UFO,
// reaches a rocket and flies the final stretch, and arrives at a city just as a
// fireball streaks down. The fireball chases the rocket: it aims (a dashed line
// shows its lane) and lunges, and you steer out of the way. At the city it bursts
// into fireworks instead, and that's the celebration.
//
// Phases: 'run' → 'launching' (countdown and lift-off) → 'flying' → 'landing' → 'done'.
// Getting hit (UFO goo, the fireball) only stuns for a moment; there's no game over.
// Positions and timings are in LAUNCH (config.js); layout details are here.

import Phaser from 'phaser';
import { LAUNCH, PAPER, HEIGHT, COLORS } from '../config.js';
import { LongPaper } from '../objects/LongPaper.js';
import { lineY } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { PencilWord } from '../objects/PencilWord.js';
import { drawStar } from '../objects/climbArt.js';
import {
  drawTree, drawCloud, drawLog, drawUfo, drawGoo, drawGooSplat, drawRocket, drawSmoke,
  drawLaunchPad, drawFireball, drawAimLine, drawCity, drawFirework,
} from '../objects/launchArt.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { markComplete } from '../progress.js';
import { Music, sfx, isMuted, toggleMute } from '../audio.js';
import { boilRng, pencilLine, pencilPolyline, pencilCircle } from '../pencil.js';

export const PANEL_ID = 'launch';

const FLOOR_LINE = 12;
const START_X = 170;
const CAMERA_LEAD = 0.35; // keep the figure (or rocket) this far across the screen
const LOGS = [700, 1150, 1650, 2250, 2950]; // left edges of the logs to jump over
const LOG_WIDTH = 70;
const LOG_HEIGHT = 30;
// Stars: [x, y]. Some above logs, a trail along the forest, and arcs in the sky.
const STARS = [
  [450, 450], [735, 400], [1000, 450], [1185, 400], [1400, 450], [1685, 400], [2000, 450], [2285, 400],
  [3950, 260], [4050, 220], [4150, 200], [4250, 220], [4350, 260],
  [4600, 380], [4700, 400], [4800, 380], [4950, 160], [5050, 140],
];
const PAD_TOP_OFFSET = 8; // the launch pad's deck is this far above the ground
const ROCKET_TAIL = 61; // distance from the rocket's center to the bottom of its nozzle
const MUTE_RADIUS = 22;
const CELEBRATE_MS = 5500; // how long the ending plays before going back to the comic page

export class LaunchScene extends Phaser.Scene {
  constructor() {
    super('Launch');
  }

  create() {
    useLayout(this, LANDSCAPE);
    this.physics.resume(); // the comic page pauses physics while zooming in
    this.phase = 'run';
    this.stars = 0;
    this.stunUntil = 0;
    this.floorY = lineY(FLOOR_LINE);
    const floorY = this.floorY;

    // Back to front: the long sheet of paper, two rows of trees and clouds
    // scrolling slower than the camera (parallax), then the ground and objects.
    this.paper = new LongPaper(this);
    this.farLayer = this.add.graphics().setScrollFactor(LAUNCH.parallaxFar, 1).setDepth(-15);
    this.nearLayer = this.add.graphics().setScrollFactor(LAUNCH.parallaxNear, 1).setDepth(-14);
    this.platforms = new Platforms(this, [
      { line: FLOOR_LINE, from: PAPER.marginX, to: LAUNCH.rocketX + 200 }, // forest floor to the pad
      { line: FLOOR_LINE, from: LAUNCH.cityX - 100, to: LAUNCH.length }, // the city's street
    ]);
    for (const x of LOGS) this.platforms.addSolid(x, floorY - LOG_HEIGHT, LOG_WIDTH, LOG_HEIGHT);
    this.worldGraphics = this.add.graphics().setDepth(1);

    this.starItems = STARS.map(([x, y]) => ({ x, y, taken: false }));
    this.ufo = { active: false, gone: false, x: 0, y: 0, nextDrop: 0, warnStart: null };
    this.goos = []; // { x, y, vy, splatAt }
    this.rocket = { x: LAUNCH.rocketX, y: floorY - PAD_TOP_OFFSET - ROCKET_TAIL, angle: 0, vy: 0, flame: 0, face: false, shake: 0 };
    this.smoke = []; // { x, y, born }
    this.fireball = { state: 'waiting', lunges: 0, tail: { x: -1, y: 0 } };
    this.fireworks = []; // { x, y, born }

    this.player = new StickFigure(this, START_X, floorY - 30);
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group);

    // Words: WALK in the world at the start; messages and the countdown pinned to the screen.
    this.walkWord = new PencilWord(this, 'WALK', START_X - 40, floorY - 150, 40, { written: false });
    this.walkWord.write(900);
    this.message = new PencilWord(this, 'GO!', 0, 60, 46, { align: 'center', fixed: true, written: false, depth: 25, lineWidth: 4 });
    this.bigWord = new PencilWord(this, 'GO!', 0, 120, 90, { align: 'center', fixed: true, written: false, depth: 25, lineWidth: 6 });
    this.hud = this.add.graphics().setScrollFactor(0).setDepth(20);
    this.starWord = new PencilWord(this, '0', 48, 18, 26, { fixed: true, depth: 20 });

    // Mute: the pencil speaker in the top-right corner, or the M key. Remembered.
    const onTap = (pointer) => {
      if (Math.hypot(pointer.x - this.muteX(), pointer.y - 36) < MUTE_RADIUS * 1.5) toggleMute();
    };
    const onKey = (event) => {
      if (event.key === 'm' || event.key === 'M') toggleMute();
    };
    this.input.on('pointerdown', onTap);
    this.input.keyboard.on('keydown', onKey);

    this.music = new Music();
    this.music.start(); // waits for the first tap or keypress if sound isn't unlocked yet
    this.events.once('shutdown', () => {
      this.music.stop();
      this.input.off('pointerdown', onTap);
      this.input.keyboard.off('keydown', onKey);
    });

    watchScreen(this, () => this.fit());
    fadeInFromPaper(this);
  }

  // Taller screens show more sky above (the floor stays at the bottom); the
  // camera's x is handled in update().
  fit() {
    const top = HEIGHT - this.scale.height;
    this.cameras.main.scrollY = top;
    this.physics.world.setBounds(0, top, LAUNCH.length, this.scale.height);
  }

  muteX() {
    return this.scale.width - 40;
  }

  // Write a message near the top of the screen, then fade it (one word at a time).
  say(word, text, holdMs = 1500) {
    if (this.walkWord.shown) this.walkWord.fadeOut();
    for (const w of [this.message, this.bigWord]) if (w !== word && w.shown) w.fadeOut(150);
    word.setText(text);
    word.setPosition(this.scale.width / 2, word.y);
    word.write(text.length > 2 ? 500 : 250);
    this.sayTimer?.remove();
    if (holdMs) this.sayTimer = this.time.delayedCall(holdMs, () => word.fadeOut());
  }

  update(time, delta) {
    const dt = Math.min(delta / 1000, 0.05);
    const input = this.controls.read();

    if (this.phase === 'run') this.updateRun(time, dt, input);
    else if (this.phase === 'launching') this.updateLaunching(time, dt);
    else if (this.phase === 'flying') this.updateFlying(time, dt, input);
    else if (this.phase === 'landing') this.updateLanding(time);
    else this.updateDone(time, dt);

    this.updateUfo(time, dt);
    this.updateGoo(time, dt);
    this.collectStars();

    // The camera eases along to keep the figure (or the rocket) a third of the way across.
    const cam = this.cameras.main;
    const followX = this.phase === 'run' || this.phase === 'done' ? this.player.body.center.x : this.rocket.x;
    const want = Phaser.Math.Clamp(followX - this.scale.width * CAMERA_LEAD, 0, LAUNCH.length - this.scale.width);
    cam.scrollX += (want - cam.scrollX) * Math.min(1, dt * 6);

    this.draw(time);
  }

  // ---- Running through the forest ----

  updateRun(time, dt, input) {
    const body = this.player.body;
    const stunned = time < this.stunUntil;
    this.player.update(stunned ? { left: false, right: false, jump: false, jumpHeld: false } : input, dt);
    if (this.player.jumped) sfx.jump();
    this.player.graphics.setAlpha(stunned && Math.floor(time / 80) % 2 === 0 ? 0.3 : 1);

    if (this.walkWord.shown && body.center.x > START_X + 80) this.walkWord.fadeOut();

    // Reached the rocket: climb in and start the countdown.
    if (body.center.x >= this.rocket.x - 30 && this.player.onFloor) this.startLaunch(time);
  }

  // ---- The UFO ----

  updateUfo(time, dt) {
    const ufo = this.ufo;
    if (ufo.gone) return;
    const px = this.player.body.center.x;
    if (!ufo.active) {
      if (this.phase !== 'run' || px < LAUNCH.ufoStart) return;
      // It swoops in from behind.
      Object.assign(ufo, { active: true, x: px - 500, y: LAUNCH.ufoHeight - 200, nextDrop: time + 1500 });
      this.say(this.message, 'HURRY!');
      this.music.setIntensity(1);
    }

    if (this.phase !== 'run' || px > LAUNCH.ufoEnd) {
      // Zoom away up and to the right.
      ufo.x += 420 * dt;
      ufo.y -= 380 * dt;
      ufo.warnStart = null;
      if (ufo.y < HEIGHT - this.scale.height - 120) ufo.gone = true;
      return;
    }

    // Hover over the figure, a little ahead, bobbing.
    ufo.x += (px + 40 - ufo.x) * Math.min(1, dt * 1.5);
    ufo.y += (LAUNCH.ufoHeight + Math.sin(time / 400) * 10 - ufo.y) * Math.min(1, dt * 2);

    // Drop goo: first a warning (rays under the saucer), then the drop.
    if (time > ufo.nextDrop) {
      ufo.warnStart ??= time;
      if (time - ufo.warnStart > LAUNCH.ufoWarning * 1000) {
        this.goos.push({ x: ufo.x, y: ufo.y + 18, vy: 60, splatAt: null });
        ufo.warnStart = null;
        ufo.nextDrop = time + LAUNCH.ufoDropEvery * 1000;
      }
    }
  }

  updateGoo(time, dt) {
    const body = this.player.body;
    for (const goo of this.goos) {
      if (goo.splatAt !== null) continue;
      goo.vy += LAUNCH.gooGravity * dt;
      goo.y += goo.vy * dt;
      if (goo.y >= this.floorY - 8) {
        goo.y = this.floorY;
        goo.splatAt = time;
      } else if (this.phase === 'run' && time >= this.stunUntil &&
        goo.x > body.left - 8 && goo.x < body.right + 8 && goo.y > body.top - 8 && goo.y < body.bottom) {
        goo.splatAt = time;
        goo.y = this.floorY;
        this.stun(time);
        body.setVelocity(-220, -280); // knocked back
      }
    }
    this.goos = this.goos.filter((g) => g.splatAt === null || time - g.splatAt < 700);
  }

  stun(time) {
    this.stunUntil = time + LAUNCH.stunSeconds * 1000;
    sfx.hit();
  }

  // ---- The rocket ----

  startLaunch(time) {
    this.phase = 'launching';
    this.launchStart = time;
    this.player.graphics.setVisible(false); // he climbs in...
    this.player.body.enable = false;
    this.rocket.face = true; // ...and looks out of the porthole
    this.controls.touch.setLayout('none');
    const step = LAUNCH.countdownStep * 1000;
    ['3', '2', '1'].forEach((n, i) => this.time.delayedCall(i * step, () => this.say(this.bigWord, n, step * 0.8)));
    this.time.delayedCall(step * 1.5, () => sfx.launch());
    this.time.delayedCall(step * 3, () => this.say(this.bigWord, 'GO!', 900));
  }

  updateLaunching(time) {
    const r = this.rocket;
    const step = LAUNCH.countdownStep;
    const t = (time - this.launchStart) / 1000;
    const baseY = this.floorY - PAD_TOP_OFFSET - ROCKET_TAIL;

    if (t < step * 3) {
      // The countdown: rumbling harder, smoke billowing, the flame catching.
      r.shake = (t / (step * 3)) * 2.5;
      r.flame = t > step * 2 ? ((t - step * 2) / step) * 0.6 : 0;
      if (t > step && Math.random() < 0.5) this.puff(r.x + (Math.random() - 0.5) * 70, this.floorY - 10, time);
      return;
    }

    // Lift-off: rise, then tip over to fly right, picking up speed.
    const lift = t - step * 3;
    const ease = (v) => v * v * (3 - 2 * v); // smooth start and stop
    r.shake = Math.max(0, 1.5 - lift);
    r.flame = 1;
    r.y = baseY - 230 * ease(Math.min(1, lift / 1.8));
    r.angle = (Math.PI / 2) * ease(Phaser.Math.Clamp((lift - 0.6) / 1.2, 0, 1));
    const ramp = Math.max(0, lift - 0.6);
    r.x = LAUNCH.rocketX + LAUNCH.flightSpeed * (ramp < 1.2 ? (ramp * ramp) / 2.4 : ramp - 0.6);
    if (lift < 1) this.puff(r.x + (Math.random() - 0.5) * 40, this.floorY - 10, time);
    if (lift >= 1.8) {
      this.phase = 'flying';
      r.vy = 0;
      r.shake = 0;
      this.controls.touch.setLayout('flight');
    }
  }

  puff(x, y, time) {
    this.smoke.push({ x, y, born: time });
  }

  updateFlying(time, dt, input) {
    const r = this.rocket;
    const stunned = time < this.stunUntil;
    const steer = stunned ? 0 : (input.down ? 1 : 0) - (input.up ? 1 : 0);
    r.vy += (steer * LAUNCH.flightSteer - r.vy) * Math.min(1, dt * 8);
    r.y = Phaser.Math.Clamp(r.y + r.vy * dt, LAUNCH.flightTop, LAUNCH.flightBottom);
    r.x += LAUNCH.flightSpeed * dt;
    // Nose tips toward where it's steering; a hit makes it wobble and sputter.
    r.angle = Math.PI / 2 + (r.vy / LAUNCH.flightSteer) * 0.25 + (stunned ? Math.sin(time / 40) * 0.3 : 0);
    r.flame = stunned ? 0.35 + Math.random() * 0.3 : 1;

    this.updateFireball(time, dt);
    if (r.x >= LAUNCH.landX - 280) this.startLanding(time);
  }

  // ---- The fireball ----
  // waiting → entering (streaks down from the sky) → tracking (follows the rocket's
  // height from behind) → aiming (glows; dashed line shows its lane) → lunging
  // (dashes along the lane) → entering again... → done after LAUNCH.fireballLunges.

  updateFireball(time, dt) {
    const f = this.fireball;
    const r = this.rocket;
    const behindX = r.x - 260;
    const since = (time - f.t0) / 1000;

    if (f.state === 'waiting') {
      if (r.x < LAUNCH.finaleX) return;
      this.say(this.message, 'LOOK OUT!', 2000);
      this.music.setIntensity(2);
      this.enterFireball(time);
    } else if (f.state === 'entering') {
      const p = Math.min(1, since / 0.7);
      f.x = f.fromX + (behindX - f.fromX) * p;
      f.y = f.fromY + (r.y - f.fromY) * p;
      f.tail = { x: f.fromX - behindX, y: f.fromY - r.y };
      if (p >= 1) Object.assign(f, { state: 'tracking', t0: time });
    } else if (f.state === 'tracking') {
      f.x = behindX;
      f.y += (r.y - f.y) * Math.min(1, dt * 3);
      f.tail = { x: -1, y: 0 };
      if (since > LAUNCH.fireballTrack) Object.assign(f, { state: 'aiming', t0: time, aimY: f.y });
    } else if (f.state === 'aiming') {
      f.x = behindX;
      f.y = f.aimY;
      if (since > LAUNCH.fireballAim) {
        Object.assign(f, { state: 'lunging', t0: time, hit: false });
        sfx.fireball();
      }
    } else if (f.state === 'lunging') {
      f.x += (LAUNCH.flightSpeed + LAUNCH.fireballLungeSpeed) * dt;
      if (!f.hit && this.rocketTouches(f.x, f.y, LAUNCH.fireballRadius)) {
        f.hit = true;
        this.stun(time);
        r.vy = (r.y < f.y ? -1 : 1) * 320; // knocked out of the lane
      }
      if (f.x > this.cameras.main.scrollX + this.scale.width + 150) {
        f.lunges++;
        if (f.lunges < LAUNCH.fireballLunges) this.enterFireball(time);
        else f.state = 'done';
      }
    }
  }

  enterFireball(time) {
    const cam = this.cameras.main;
    const fromX = cam.scrollX + this.scale.width * 0.15;
    const fromY = cam.scrollY - 80;
    // It starts above the screen, so its tail points back up the way it came.
    Object.assign(this.fireball, { state: 'entering', t0: time, x: fromX, y: fromY, fromX, fromY, tail: { x: -0.3, y: -1 } });
    sfx.fireball();
  }

  // Does a circle at (x, y) touch the rocket? Checks its middle and its nose.
  rocketTouches(x, y, radius) {
    const r = this.rocket;
    const nose = { x: r.x + Math.sin(r.angle) * 50, y: r.y - Math.cos(r.angle) * 50 };
    return [r, nose].some((p) => Math.hypot(x - p.x, y - p.y) < radius + 18);
  }

  // ---- The city ----

  startLanding(time) {
    this.phase = 'landing';
    this.landStart = time;
    this.landFrom = { x: this.rocket.x, y: this.rocket.y, angle: this.rocket.angle };
    this.fireball.state = 'done';
    this.controls.touch.setLayout('none');
  }

  updateLanding(time) {
    const r = this.rocket;
    const p = Math.min(1, (time - this.landStart) / 2200);
    const ease = (v) => 1 - (1 - v) * (1 - v); // fast then gentle, like settling down
    const from = this.landFrom;
    r.x = from.x + (LAUNCH.landX - from.x) * ease(p);
    r.y = from.y + (this.floorY - ROCKET_TAIL - from.y) * ease(p);
    r.angle = from.angle * (1 - ease(Math.min(1, p / 0.6)));
    r.flame = 0.8 - p * 0.6;
    if (p >= 1) this.finish(time);
  }

  finish(time) {
    this.phase = 'done';
    this.doneAt = time;
    Object.assign(this.rocket, { flame: 0, face: false });
    // He hops out beside the rocket.
    this.player.body.enable = true;
    this.player.body.reset(LAUNCH.landX + 60, this.floorY - 30);
    this.player.graphics.setVisible(true).setAlpha(1);
    this.music.stop();
    sfx.fanfare();
    markComplete(PANEL_ID);

    // The fireball comes streaking down over the city... and bursts into fireworks.
    const cam = this.cameras.main;
    Object.assign(this.fireball, {
      state: 'finale', t0: time, fromX: cam.scrollX + this.scale.width + 60, fromY: cam.scrollY - 60,
      toX: LAUNCH.landX + 220, toY: 140,
    });
    sfx.fireball();
    this.time.delayedCall(800, () => this.say(this.bigWord, 'THE END', null));
    this.time.delayedCall(CELEBRATE_MS, () => {
      fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: PANEL_ID }));
    });
  }

  updateDone(time, dt) {
    // Happy hops.
    const hop = this.player.onFloor && time - (this.lastHop ?? 0) > 450;
    this.player.update({ left: false, right: false, jump: hop, jumpHeld: hop }, dt);
    if (hop) this.lastHop = time;

    const f = this.fireball;
    if (f.state === 'finale') {
      const p = Math.min(1, (time - f.t0) / 800);
      f.x = f.fromX + (f.toX - f.fromX) * p;
      f.y = f.fromY + (f.toY - f.fromY) * p;
      f.tail = { x: f.fromX - f.toX, y: f.fromY - f.toY };
      if (p >= 1) {
        f.state = 'burst';
        f.nextFirework = time;
      }
    } else if (f.state === 'burst' && time >= f.nextFirework && time - this.doneAt < CELEBRATE_MS - 800) {
      // Fireworks all over the sky above the city.
      const x = LAUNCH.landX - 150 + Math.random() * 500;
      this.fireworks.push({ x, y: 80 + Math.random() * 160, born: time });
      if (Math.random() < 0.5) sfx.pickup();
      f.nextFirework = time + 280;
    }
  }

  // ---- Stars ----

  collectStars() {
    const who = this.phase === 'run' ? this.player.center : this.phase === 'flying' ? this.rocket : null;
    if (!who) return;
    for (const star of this.starItems) {
      if (!star.taken && Math.hypot(who.x - star.x, who.y - star.y) < 34) {
        star.taken = true;
        this.stars++;
        this.starWord.setText(this.stars);
        sfx.pickup();
      }
    }
  }

  // ---- Drawing ----

  draw(time) {
    const cam = this.cameras.main;
    const left = cam.scrollX;
    const right = left + this.scale.width;
    const visible = (x, margin = 300) => x > left - margin && x < right + margin;
    const rng = boilRng(time, 900);
    const floorY = this.floorY;

    this.paper.draw(left - 10, right + 10, cam.scrollY);
    this.drawBackground(time);
    this.platforms.draw(time);

    const g = this.worldGraphics;
    g.clear();
    for (const x of LOGS) if (visible(x)) drawLog(g, rng, x, floorY, LOG_WIDTH, LOG_HEIGHT);
    if (visible(LAUNCH.rocketX)) drawLaunchPad(g, rng, LAUNCH.rocketX, floorY);
    if (visible(LAUNCH.cityX, 900)) drawCity(g, rng, LAUNCH.cityX, floorY);
    for (const star of this.starItems) {
      if (!star.taken && visible(star.x)) drawStar(g, rng, star.x, star.y + Math.sin(time / 300 + star.x) * 3, 11);
    }
    for (const goo of this.goos) {
      if (goo.splatAt === null) drawGoo(g, rng, goo.x, goo.y);
      else drawGooSplat(g, rng, goo.x, floorY, (time - goo.splatAt) / 700);
    }
    this.smoke = this.smoke.filter((s) => time - s.born < 1400);
    for (const s of this.smoke) drawSmoke(g, rng, s.x, s.y - (time - s.born) * 0.03, (time - s.born) / 1400);

    const r = this.rocket;
    const shakeX = r.shake ? (Math.random() - 0.5) * r.shake * 2 : 0;
    drawRocket(g, rng, r.x + shakeX, r.y, r.angle, { flame: r.flame, face: r.face, time });

    this.drawFireball(g, rng, time);
    this.fireworks = this.fireworks.filter((f) => time - f.born < 1200);
    for (const fw of this.fireworks) drawFirework(g, rng, fw.x, fw.y, (time - fw.born) / 1200);
    if (this.ufo.active && !this.ufo.gone) {
      const warn = this.ufo.warnStart === null ? 0 : (time - this.ufo.warnStart) / (LAUNCH.ufoWarning * 1000);
      drawUfo(g, rng, this.ufo.x, this.ufo.y, time, Math.min(1, warn));
    }

    this.walkWord.draw(time);
    this.player.draw(time);
    if (this.phase === 'run' || this.phase === 'flying') this.controls.draw(time);
    else this.controls.touch.graphics.clear();
    this.message.draw(time);
    this.bigWord.draw(time);
    this.drawHud(time);
  }

  drawFireball(g, rng, time) {
    const f = this.fireball;
    if (!['entering', 'tracking', 'aiming', 'lunging', 'finale'].includes(f.state)) return;
    if (f.state === 'aiming') {
      const p = (time - f.t0) / (LAUNCH.fireballAim * 1000);
      drawAimLine(g, rng, f.x + 40, f.aimY, this.cameras.main.scrollX + this.scale.width, 0.3 + p * 0.6);
      drawFireball(g, rng, f.x, f.y, LAUNCH.fireballRadius, -1, 0, time, p);
      return;
    }
    drawFireball(g, rng, f.x, f.y, LAUNCH.fireballRadius, f.tail.x, f.tail.y, time);
  }

  // Trees (two rows, for parallax) along the forest, then clouds over the rest.
  // These graphics scroll slower than the camera, so they're drawn in their own
  // coordinates: a layer with factor f sees camera.scrollX * f at its left edge.
  drawBackground(time) {
    const cam = this.cameras.main;
    const layers = [
      { g: this.farLayer, f: LAUNCH.parallaxFar, spacing: 95, alpha: 0.4, size: 0.75, seed: 7 },
      { g: this.nearLayer, f: LAUNCH.parallaxNear, spacing: 150, alpha: 0.7, size: 1, seed: 13 },
    ];
    for (const { g, f, spacing, alpha, size, seed } of layers) {
      g.clear();
      const rng = boilRng(time, 950 + seed);
      const left = cam.scrollX * f - 100;
      const right = left + this.scale.width + 200;
      const forestEnd = LAUNCH.forestEnd * f + this.scale.width * 0.5;
      for (let i = Math.max(0, Math.floor(left / spacing)); i * spacing < right; i++) {
        const x = i * spacing + (hash(i * seed) - 0.5) * spacing * 0.5;
        if (x < forestEnd) {
          drawTree(g, rng, x, this.floorY, (150 + hash(i * seed + 1) * 90) * size, alpha);
        } else if (f === LAUNCH.parallaxFar && i % 3 === 0) {
          drawCloud(g, rng, x, 70 + hash(i) * 140, 40 + hash(i + 5) * 30);
        }
      }
    }
  }

  // Stars collected (top left) and the mute button (top right).
  drawHud(time) {
    const g = this.hud;
    g.clear();
    const rng = boilRng(time, 960);
    drawStar(g, rng, 28, 31, 13, { width: 2.5 });
    this.starWord.draw(time);

    // A pencil speaker: a box and a cone, with sound waves, or an X when muted.
    const x = this.muteX();
    const y = 36;
    const style = { color: COLORS.pencil, width: 2.5 };
    pencilCircle(g, rng, x, y, MUTE_RADIUS, { ...style, points: 14 });
    pencilPolyline(g, rng, [
      { x: x - 11, y: y - 5 }, { x: x - 5, y: y - 5 }, { x: x + 3, y: y - 11 }, { x: x + 3, y: y + 11 },
      { x: x - 5, y: y + 5 }, { x: x - 11, y: y + 5 }, { x: x - 11, y: y - 5 },
    ], style);
    if (isMuted()) {
      pencilLine(g, rng, x + 7, y - 5, x + 15, y + 5, style);
      pencilLine(g, rng, x + 15, y - 5, x + 7, y + 5, style);
    } else {
      for (const w of [7, 12]) {
        const arc = [];
        for (let i = -2; i <= 2; i++) arc.push({ x: x + 3 + Math.cos(i * 0.35) * w, y: y + Math.sin(i * 0.35) * w });
        pencilPolyline(g, rng, arc, { ...style, width: 2 });
      }
    }
  }
}

// A repeatable "random" number in [0, 1) for index n, so trees and clouds stay
// in the same places every frame and every time you play.
function hash(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}
