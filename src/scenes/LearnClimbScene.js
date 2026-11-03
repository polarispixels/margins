// The CLIMB tutorial: a cat leads you up a tall page.
//
//   1. A ladder (word CLIMB): the cat scrambles up, you climb after it.
//   2. A spring (word UP!): the cat bounces to a higher line, you get launched after it.
//   3. A paperclip: a bigger launch, higher still, onto a ledge.
//   4. A hop down: the cat drops to a lower line on the other side, you drop after it.
//   5. A last ladder to the top line, where the cat waits. Touch the cat to finish.
//
// Nothing here can hurt you: a fall just lands on the line below.
// The cat's steps (Guide) are scripted, so the points below are chosen to match
// where the player can really go. Heights are counted in ruled lines above the floor.

import Phaser from 'phaser';
import { HEIGHT, PAGE_MAX_WIDTH, PAPER, PLAYER, LEARN } from '../config.js';
import { drawPaper, lineY } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { Ladder } from '../objects/Ladder.js';
import { Guide } from '../objects/Guide.js';
import { drawCat } from '../objects/animalArt.js';
import { drawSpring, drawPaperclip, SPRING_HALF_WIDTH, PAPERCLIP_HALF_WIDTH } from '../objects/climbArt.js';
import { PencilWord } from '../objects/PencilWord.js';
import { boilRng } from '../pencil.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { markComplete } from '../progress.js';
import { sfx } from '../audio.js';

export const PANEL_ID = 'learn-climb';

const FLOOR_INDEX = 36; // ruled line number of the bottom line
const PAGE_LINES = FLOOR_INDEX + 3;
const PAGE_RIGHT = 960; // the right wall; the page may be wider on big screens
const WALL_WIDTH = 20;
const CELEBRATE_MS = 2200;
const CAMERA_EASE = 6;
const FOLLOW_FRACTION = 0.7; // the figure's feet sit this far down the screen
const CAT_MARGIN = 110; // keep the cat at least this far below the top of the screen
const FEET_MARGIN = 30; // and the figure's feet at least this far above the bottom
const LAUNCH_COOLDOWN_MS = 500;
const PLAYER_HALF = PLAYER.bodyHeight / 2;
const PLAYER_HALF_WIDTH = PLAYER.bodyWidth / 2;

// Heights, in ruled lines above the floor.
const H = { ladder1: 7, spring: 14, paperclip: 25, drop: 19, top: 27 };
const up = (lines) => lineY(FLOOR_INDEX - lines);

const START_X = 360;
const LADDER_X = 170;
const SPRING_X = 470;
const PAPERCLIP_X = 740;

// Every platform: { line (ruled line number), from, to }.
const SEGMENTS = [
  { line: FLOOR_INDEX, from: PAPER.marginX, to: PAGE_RIGHT }, // start line
  { line: FLOOR_INDEX - H.ladder1, from: PAPER.marginX, to: 620 }, // top of the first ladder, with the spring
  { line: FLOOR_INDEX - H.spring, from: 330, to: 830, oneWay: true }, // where the spring lands, with the paperclip
  { line: FLOOR_INDEX - H.paperclip, from: 560, to: 930, oneWay: true }, // the ledge
  { line: FLOOR_INDEX - H.drop, from: PAPER.marginX, to: 500, oneWay: true }, // the line you drop onto
  { line: FLOOR_INDEX - H.top, from: PAPER.marginX, to: 520 }, // the top line, where the cat waits
];

export class LearnClimbScene extends Phaser.Scene {
  constructor() {
    super('LearnClimb');
  }

  create() {
    this.finished = false;
    this.physics.resume();
    useLayout(this, LANDSCAPE);
    this.pageHeight = lineY(PAGE_LINES);
    drawPaper(this, { bottom: this.pageHeight });

    this.platforms = new Platforms(this, SEGMENTS, { wall: false }); // the built-in margin wall is too short for this tall page
    // Walls along the red margin and the right edge, the whole height of the page.
    this.platforms.addSolid(PAPER.marginX - WALL_WIDTH, -HEIGHT, WALL_WIDTH, this.pageHeight + HEIGHT);
    this.platforms.addSolid(PAGE_RIGHT, -HEIGHT, WALL_WIDTH, this.pageHeight + HEIGHT);

    this.ladders = [
      new Ladder(this, { x: LADDER_X, width: 32, top: up(H.ladder1), bottom: up(0) }),
      new Ladder(this, { x: LADDER_X, width: 32, top: up(H.top), bottom: up(H.drop) }),
    ];
    this.launchers = [
      { kind: 'spring', x: SPRING_X, y: up(H.ladder1), speed: LEARN.springSpeed, half: SPRING_HALF_WIDTH, firedAt: -1e9 },
      { kind: 'paperclip', x: PAPERCLIP_X, y: up(H.spring), speed: LEARN.paperclipSpeed, half: PAPERCLIP_HALF_WIDTH, firedAt: -1e9 },
    ];
    this.launcherGraphics = this.add.graphics();

    this.words = {
      climb: new PencilWord(this, 'CLIMB', LADDER_X + 50, up(0) - 150, 38, { written: false }),
      up: new PencilWord(this, 'UP!', SPRING_X + 50, up(H.ladder1) - 130, 38, { written: false }),
    };

    // The cat's path: each step starts when you come close. It waits at the end of each.
    this.guide = new Guide(this, {
      draw: drawCat,
      x: START_X + 90,
      y: up(0),
      sound: () => sfx.meow(this.meowCount++),
      steps: [
        { move: 'walk', to: { x: LADDER_X, y: up(0) } },
        { move: 'climb', to: { x: LADDER_X, y: up(H.ladder1) } },
        { move: 'walk', to: { x: SPRING_X, y: up(H.ladder1) } },
        { move: 'bounce', to: { x: 640, y: up(H.spring) }, ms: 900 },
        { move: 'walk', to: { x: PAPERCLIP_X, y: up(H.spring) } },
        { move: 'bounce', to: { x: 840, y: up(H.paperclip) }, ms: 1100 },
        { move: 'walk', to: { x: 590, y: up(H.paperclip) } },
        { move: 'drop', to: { x: 430, y: up(H.drop) }, ms: 700 },
        { move: 'walk', to: { x: LADDER_X, y: up(H.drop) } },
        { move: 'climb', to: { x: LADDER_X, y: up(H.top) } },
        { move: 'walk', to: { x: 330, y: up(H.top) } },
      ],
    });
    this.meowCount = 0;
    this.upWordShown = false;

    this.player = new StickFigure(this, START_X, up(0) - PLAYER_HALF);
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group, null, () => !this.player.climbing);

    watchScreen(this, (scene) => this.fit(scene));
    this.cameras.main.setScroll(0, this.scrollTarget());
    fadeInFromPaper(this);
    this.words.climb.write(900);
  }

  fit(scene) {
    const { width, height } = scene.scale;
    scene.physics.world.setBounds(0, 0, width, scene.pageHeight);
    scene.cameras.main.setBounds(0, 0, PAGE_MAX_WIDTH, Math.max(scene.pageHeight, height));
  }

  // Where the camera wants to be: the figure near the bottom, but never so low
  // that the waiting cat slips off the top of the screen.
  scrollTarget() {
    const height = this.scale.height;
    const feet = this.player.body.bottom;
    const forPlayer = feet - height * FOLLOW_FRACTION;
    const forCat = this.guide.y - CAT_MARGIN;
    const target = Math.max(Math.min(forPlayer, forCat), feet - (height - FEET_MARGIN));
    return Phaser.Math.Clamp(target, 0, Math.max(0, this.pageHeight - height));
  }

  update(time, delta) {
    const dt = delta / 1000;
    const idle = { left: false, right: false, jump: false, jumpHeld: false, up: false, down: false };
    const input = this.finished ? idle : this.controls.read();

    const atLadder = this.ladders.some((l) => l.touches(this.player)) || this.player.climbing;
    if (!this.finished) this.updateLadders(input); // before the player moves
    this.player.update(input, dt);
    this.controls.touch.setLayout(atLadder ? 'ladder' : 'platformer');
    if (!this.finished) this.checkLaunchers(time);

    this.guide.update(time, dt, this.player);
    this.followCamera(dt);
    this.updateWords();

    if (!this.finished && this.guide.done && this.guide.contains(this.player.center)) this.finish(time);

    this.platforms.draw(time);
    this.ladders.forEach((l) => l.draw(time));
    this.drawLaunchers(time);
    Object.values(this.words).forEach((w) => w.draw(time));
    this.guide.draw(time);
    this.player.draw(time);
    this.controls.draw(time);
  }

  // Only the ladder you are on (or about to grab) gets to move you: each one would
  // otherwise "keep your feet between its ends" and pull you onto itself.
  updateLadders(input) {
    if (!this.player.climbing) this.activeLadder = this.ladders.find((l) => l.touches(this.player));
    this.activeLadder?.update(this.player, input);
  }

  followCamera(dt) {
    const cam = this.cameras.main;
    const target = this.scrollTarget();
    cam.scrollY += (target - cam.scrollY) * (1 - Math.exp(-dt * CAMERA_EASE));
    // The easing can lag behind a launch: never let the figure leave the screen.
    const body = this.player.body;
    cam.scrollY = Phaser.Math.Clamp(cam.scrollY, Math.min(target, body.top - 60), body.bottom - (this.scale.height - FEET_MARGIN));
    cam.scrollX = 0;
  }

  // Standing on a spring or paperclip (landing or walking onto it) launches you.
  checkLaunchers(time) {
    const body = this.player.body;
    const onFloor = body.blocked.down || body.touching.down;
    if (!onFloor || this.player.climbing) return;
    for (const l of this.launchers) {
      if (time - l.firedAt < LAUNCH_COOLDOWN_MS) continue;
      if (Math.abs(body.bottom - l.y) > 3 || Math.abs(body.center.x - l.x) > l.half + PLAYER_HALF_WIDTH) continue;
      body.setVelocityY(-l.speed);
      this.player.setScale(0.7, 1.3);
      this.player.wasOnFloor = false;
      this.player.jumpCutAvailable = false;
      l.firedAt = time;
      sfx.launch();
    }
  }

  // One word at a time: CLIMB near the first ladder, UP! near the spring.
  updateWords() {
    const body = this.player.body;
    const { climb, up: upWord } = this.words;
    const climbed = body.bottom < up(0) - 90;
    if (climb.shown && climbed) climb.fadeOut();
    const nearSpring = !this.upWordShown && body.bottom > up(H.ladder1) - 4 && body.bottom < up(H.ladder1) + 4 && body.center.x > 250;
    if (nearSpring && !climb.shown) {
      this.upWordShown = true;
      upWord.write(700);
    }
    if (upWord.shown && (body.bottom < up(H.ladder1) - 100 || this.launchers[0].firedAt > 0)) upWord.fadeOut();
  }

  drawLaunchers(time) {
    const g = this.launcherGraphics;
    g.clear();
    const rng = boilRng(time, 120);
    for (const l of this.launchers) {
      // Squashed for a moment after launching you, or while the cat bounces off it.
      const cat = this.guide.current;
      const catBouncing = cat && cat.step.move === 'bounce' && cat.t < 0.2 && Math.abs(cat.from.x - l.x) < 5;
      const squashed = time - l.firedAt < 200 || catBouncing;
      (l.kind === 'spring' ? drawSpring : drawPaperclip)(g, rng, l.x, l.y, squashed);
    }
  }

  // Reached the cat at the top: it purrs, a heart rises, and we head back to the page.
  finish(time) {
    this.finished = true;
    this.guide.celebrate(time);
    sfx.purr();
    markComplete(PANEL_ID);
    this.time.delayedCall(CELEBRATE_MS, () => {
      fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: PANEL_ID }));
    });
  }
}
