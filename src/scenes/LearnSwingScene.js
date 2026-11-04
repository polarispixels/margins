// The SWING tutorial: a monkey leads you across ropes over gaps in the line.
//
//   1. A small gap, one rope (word SWING): grab it and let go.
//   2. A wide gap, one rope: hold a direction to pump the swing higher first.
//   3. A very wide gap, two ropes in a row: let go of one and grab the next.
//   4. A last swing, and the monkey waits on the far side. Touch it to finish.
//
// The monkey crosses each gap on the same rope first, then waits where you can see it.
// Nothing here can hurt you: falling into a gap puts you back at its near edge.

import Phaser from 'phaser';
import { HEIGHT, PAPER, LEARN, COLORS } from '../config.js';
import { lineY } from '../objects/Paper.js';
import { LongPaper } from '../objects/LongPaper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { RopeSwings } from '../objects/RopeSwings.js';
import { Guide, HANDS_ABOVE } from '../objects/Guide.js';
import { drawMonkey } from '../objects/animalArt.js';
import { drawBranch } from '../objects/forestArt.js';
import { PencilWord } from '../objects/PencilWord.js';
import { boilRng, pencilLine, pencilCircle } from '../pencil.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { markComplete } from '../progress.js';
import { sfx } from '../audio.js';

export const PANEL_ID = 'learn-swing';

const FLOOR_LINE = 12;
const WORLD_END = 3950;
const WALL_WIDTH = 20;
const CELEBRATE_MS = 2200;
const CAMERA_LEAD = 0.35; // the figure stays this far across the screen
const CAMERA_EASE = 6;
const FALL_DEPTH = 90; // this far below the line counts as fallen in
const PLAYER_HALF = 30;
const START_X = 230;
const MONKEY_START = 400;

// The gaps in the line, and the ropes over them (world x). Each gap is a new beat.
const GAPS = [
  { from: 600, to: 800, ropes: [700] }, // 1. small: one rope
  { from: 1250, to: 1580, ropes: [1350] }, // 2. wide: pump
  { from: 2150, to: 2650, ropes: [2260, 2500] }, // 3. two ropes in a row
  { from: 3100, to: 3400, ropes: [3210] }, // 4. the last swing
];
const MONKEY_END = 3750;

export class LearnSwingScene extends Phaser.Scene {
  constructor() {
    super('LearnSwing');
  }

  create() {
    this.finished = false;
    this.fallenAt = null;
    this.standingOn = null;
    this.physics.resume();
    useLayout(this, LANDSCAPE);
    this.floorY = lineY(FLOOR_LINE);

    this.paper = new LongPaper(this);
    this.sceneryGraphics = this.add.graphics().setDepth(-1);
    this.ropeGraphics = this.add.graphics().setDepth(1);

    // The line, in pieces between the gaps.
    this.pieces = [];
    let from = PAPER.marginX;
    for (const gap of GAPS) {
      this.pieces.push({ line: FLOOR_LINE, from, to: gap.from });
      from = gap.to;
    }
    this.pieces.push({ line: FLOOR_LINE, from, to: WORLD_END });
    this.platforms = new Platforms(this, this.pieces);
    this.platforms.addSolid(WORLD_END, -HEIGHT, WALL_WIDTH, HEIGHT * 3);

    this.ropes = new RopeSwings({
      ropes: GAPS.flatMap((g) => g.ropes),
      top: LEARN.swingRopeTop,
      length: LEARN.swingRopeLength,
    });
    for (const r of this.ropes.ropes) r.theta = 0; // hang straight until something swings them
    // Which rope belongs to which gap's trees, and which rope the monkey uses for each step.
    this.ropeIndex = [];
    let n = 0;
    for (const gap of GAPS) this.ropeIndex.push(gap.ropes.map(() => n++));

    this.word = new PencilWord(this, 'SWING', GAPS[0].from - 330, this.floorY - 330, 40, { written: false });

    this.guide = new Guide(this, {
      draw: drawMonkey,
      x: MONKEY_START,
      y: this.floorY,
      sound: () => sfx.ooh(),
      steps: this.monkeySteps(),
    });

    this.player = new StickFigure(this, START_X, this.floorY - PLAYER_HALF);
    this.standingOn = this.pieces[0];
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group);

    watchScreen(this, () => this.fit());
    this.cameras.main.scrollX = this.cameraTarget();
    fadeInFromPaper(this);
  }

  // The monkey walks to each gap's edge, swings over, and waits on the far side.
  monkeySteps() {
    const floor = this.floorY;
    const top = LEARN.swingRopeTop;
    const length = LEARN.swingRopeLength;
    const steps = [];
    GAPS.forEach((gap, g) => {
      steps.push({ move: 'walk', to: { x: gap.from - 15, y: floor } });
      const ropeNumbers = this.ropeIndex[g];
      const lastRope = gap.ropes.length - 1;
      gap.ropes.forEach((ropeX, i) => {
        // Between two ropes the monkey hangs where both ropes tilt toward it.
        const halfway = (ropeX + (gap.ropes[i + 1] ?? ropeX)) / 2;
        let to = { x: gap.to + 15, y: floor };
        if (i !== lastRope) {
          const handsY = top + Math.sqrt(length ** 2 - ((gap.ropes[1] - gap.ropes[0]) / 2) ** 2);
          to = { x: halfway, y: handsY + HANDS_ABOVE };
        }
        steps.push({
          move: 'swing',
          rope: ropeNumbers[i],
          pivot: { x: ropeX, y: top },
          length,
          to,
          ms: 1200 + (gap.to - gap.from) * 1.2,
          auto: i > 0,
        });
      });
    });
    steps.push({ move: 'walk', to: { x: MONKEY_END, y: floor } });
    return steps;
  }

  fit() {
    const top = HEIGHT - this.scale.height;
    this.cameras.main.scrollY = top;
    this.physics.world.setBounds(0, top, WORLD_END, this.scale.height + 600);
    this.physics.world.setBoundsCollision(true, true, true, false); // gaps are bottomless: no floor at the bottom
  }

  cameraTarget() {
    const width = this.scale.width;
    const follow = this.player.body.center.x - width * CAMERA_LEAD;
    // Never let the waiting monkey slip off the right edge (but keep the figure in view).
    const forMonkey = Math.min(this.guide.x + 80 - width, this.player.body.center.x - 80);
    return Phaser.Math.Clamp(Math.max(follow, forMonkey), 0, WORLD_END - width);
  }

  update(time, delta) {
    const dt = delta / 1000;
    const idle = { left: false, right: false, jump: false, jumpHeld: false, up: false, down: false };
    const input = this.finished ? idle : this.controls.read();

    const rope = this.ropes.update(time, dt, this.player, input);
    if (rope === 'grab') sfx.grab();
    if (rope === 'release') sfx.jump();
    if (!this.ropes.holding) {
      this.player.update(input, dt);
      if (this.player.jumped) sfx.jump();
    }

    this.guide.update(time, dt, this.player);
    this.tiltMonkeysRope(dt);
    this.calmFreeRopes(dt);
    if (!this.finished) this.checkFall(time);
    this.updateWord();

    const cam = this.cameras.main;
    cam.scrollX += (this.cameraTarget() - cam.scrollX) * Math.min(1, dt * CAMERA_EASE);

    if (!this.finished && this.guide.done && this.guide.contains(this.player.center)) this.finish(time);
    this.draw(time);
  }

  // While the monkey swings on a rope, that rope hangs from its hands.
  tiltMonkeysRope(dt) {
    const c = this.guide.current;
    if (!c || c.step.move !== 'swing' || c.theta === undefined) return;
    const rope = this.ropes.ropes[c.step.rope];
    if (rope === this.ropes.held) return;
    rope.omega = (c.theta - rope.theta) / Math.max(dt, 0.001);
    rope.theta = c.theta;
  }

  // Ropes nobody holds settle quickly, so the next one you jump at is hanging still.
  calmFreeRopes(dt) {
    const onRope = this.guide.current?.step.move === 'swing' ? this.ropes.ropes[this.guide.current.step.rope] : null;
    for (const rope of this.ropes.ropes) {
      if (rope !== this.ropes.held && rope !== onRope) rope.omega *= Math.max(0, 1 - LEARN.swingRopeCalm * dt);
    }
  }

  // Falling into a gap: after a moment you are standing at that gap's near edge again.
  checkFall(time) {
    const body = this.player.body;
    if (this.player.onFloor && body.bottom < this.floorY + 10) {
      this.fallenAt = null;
      this.standingOn = this.pieces.find((p) => body.center.x >= p.from && body.center.x <= p.to) ?? this.standingOn;
      return;
    }
    if (this.ropes.holding || body.bottom < this.floorY + FALL_DEPTH || this.fallenAt !== null) {
      if (this.fallenAt !== null && time - this.fallenAt > LEARN.swingFallResetMs) this.putBack();
      return;
    }
    this.fallenAt = time;
    this.fallX = body.center.x;
  }

  putBack() {
    // Back on the piece of line you last stood on, at the end nearest the gap you fell into.
    const piece = this.standingOn;
    const x = this.fallX > piece.to ? piece.to - 40 : piece.from + 40;
    this.player.body.reset(x, this.floorY - PLAYER_HALF);
    this.player.carryX = 0;
    this.fallenAt = null;
  }

  // SWING at the first rope; gone once you have grabbed a rope.
  updateWord() {
    const x = this.player.body.center.x;
    if (!this.word.used && x > GAPS[0].from - 330) {
      this.word.used = true;
      this.word.write(700);
    }
    if (this.word.shown && (this.ropes.holding || x > GAPS[0].to)) this.word.fadeOut();
  }

  finish(time) {
    this.finished = true;
    this.guide.celebrate(time);
    markComplete(PANEL_ID);
    this.time.delayedCall(CELEBRATE_MS, () => {
      fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: PANEL_ID }));
    });
  }

  // A plain trunk that holds up the branch, with a few leaves at the top.
  drawTrunk(g, rng, x) {
    const style = { color: COLORS.pencil, width: 2.5, wobble: 1.2, alpha: 0.9 };
    const top = LEARN.swingRopeTop - 6;
    pencilLine(g, rng, x - 7, this.floorY, x - 5, top, style);
    pencilLine(g, rng, x + 7, this.floorY, x + 5, top, style);
    pencilCircle(g, rng, x - 12, top - 14, 15, { ...style, width: 1.8, points: 9 });
    pencilCircle(g, rng, x + 10, top - 20, 17, { ...style, width: 1.8, points: 9 });
  }

  draw(time) {
    const cam = this.cameras.main;
    this.paper.draw(cam.scrollX - 10, cam.scrollX + this.scale.width + 10, cam.scrollY);
    this.platforms.draw(time);
    const rng = boilRng(time, 120);
    const g = this.sceneryGraphics;
    g.clear();
    // Trees at the edge of each gap and a branch between them to hang the ropes from.
    for (const gap of GAPS) {
      this.drawTrunk(g, rng, gap.from - 40);
      this.drawTrunk(g, rng, gap.to + 40);
      drawBranch(g, rng, gap.from - 40, gap.to + 40, LEARN.swingRopeTop);
    }
    this.ropeGraphics.clear();
    this.ropes.drawRopes(this.ropeGraphics, rng);
    this.word.draw(time);
    this.guide.draw(time);
    this.player.draw(time);
    this.controls.draw(time);
  }
}
