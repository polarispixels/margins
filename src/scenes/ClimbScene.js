// Climb: an endless vertical platformer, played in portrait.
//
// The figure walks and jumps just like in the story levels (press up to jump).
// Springboards launch him high when he lands on one. The camera follows upward
// and never comes back down, so falling off the bottom of the screen ends the run.
// Score = ruled lines climbed + CLIMB.tokenValue for each star.

import Phaser from 'phaser';
import { CLIMB, COLORS, PAPER } from '../config.js';
import { ScrollingPaper } from '../objects/ScrollingPaper.js';
import { ClimbCourse, drawStar } from '../objects/ClimbCourse.js';
import { StickFigure } from '../objects/StickFigure.js';
import { PencilWord } from '../objects/PencilWord.js';
import { PlayerInput } from '../input.js';
import { useLayout, PORTRAIT, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { saveScore } from '../progress.js';
import { boilRng, pencilCircle, pencilLine, pencilPolyline } from '../pencil.js';

export const MODE_ID = 'climb';

const FLOOR_Y = 0; // world y of the starting floor; everything above is negative y
const BUTTON_RADIUS = 44;

export class ClimbScene extends Phaser.Scene {
  constructor() {
    super('Climb');
  }

  create() {
    useLayout(this, PORTRAIT);
    this.physics.resume(); // the comic page pauses physics while zooming in
    this.over = false;
    this.leaving = false; // fading out to restart or leave
    this.stars = 0;
    this.highestFeet = FLOOR_Y; // the highest the figure's feet have been (smallest y)

    this.cameras.main.setBackgroundColor(COLORS.desk); // shows beside the page on wide screens
    this.paper = new ScrollingPaper(this);
    this.course = new ClimbCourse(this, FLOOR_Y);

    this.player = new StickFigure(this, CLIMB.width / 2, FLOOR_Y - 30);
    this.player.runSpeed = CLIMB.walkSpeed;
    this.controls = new PlayerInput(this);
    this.menuKeys = this.input.keyboard.addKeys('ENTER,ESC');

    // Stand on platforms. The callback runs when the figure lands on one, for springboards.
    this.physics.add.collider(this.player.zone, this.course.group, (_, zone) => this.landOn(zone.platform));

    // Walls at the margin and the page's right edge; nothing above or below,
    // so the figure can rise forever and fall off the bottom.
    this.physics.world.setBounds(CLIMB.marginX, -1e7, CLIMB.width - CLIMB.marginX, 2e7);
    this.physics.world.setBoundsCollision(true, true, false, false);

    // Start with the floor near the bottom of the screen.
    this.cameras.main.scrollY = FLOOR_Y + 90 - this.scale.height;
    watchScreen(this, () => this.fitCamera());

    this.scoreWord = new PencilWord(this, '0', this.scale.width / 2, 14, 34, { align: 'center', fixed: true, depth: 20 });
    this.card = null; // the score card, made at game over
    fadeInFromPaper(this);
  }

  // Center the page on wide screens. (Vertical scrolling is handled in update.)
  fitCamera() {
    this.cameras.main.scrollX = (CLIMB.width - this.scale.width) / 2;
    this.scoreWord?.setPosition(this.scale.width / 2, 14);
  }

  // Landing on a springboard launches him high. Ordinary platforms just hold him up.
  landOn(platform) {
    const body = this.player.body;
    if (!body.touching.down && !body.blocked.down) return; // only when landing on top
    if (this.course.isOnSpring(platform, body.center.x)) {
      body.setVelocityY(-CLIMB.springSpeed);
      platform.spring.firedAt = this.time.now;
    }
  }

  get score() {
    const lines = Math.max(0, Math.floor((FLOOR_Y - this.highestFeet) / PAPER.lineSpacing));
    return { lines, stars: this.stars, total: lines + this.stars * CLIMB.tokenValue };
  }

  update(time, delta) {
    const cam = this.cameras.main;
    const JustDown = Phaser.Input.Keyboard.JustDown;
    if (JustDown(this.menuKeys.ESC)) return this.leave();

    if (this.over) {
      if (JustDown(this.menuKeys.ENTER) || JustDown(this.controls.keys.SPACE)) return this.restart();
    } else {
      this.player.update(this.controls.read(), delta / 1000);

      // The camera follows the figure up, but never back down.
      const target = this.player.body.center.y - this.scale.height * CLIMB.cameraLead;
      if (target < cam.scrollY) cam.scrollY = target;

      // Keep a screen's worth of platforms ready above, and tidy up far below.
      this.course.generateUpTo(cam.scrollY - this.scale.height);
      this.course.removeBelow(cam.scrollY + this.scale.height * 2);

      this.stars += this.course.collectStars(this.player.center, time);
      this.highestFeet = Math.min(this.highestFeet, this.player.body.bottom);
      this.scoreWord.setText(this.score.total);

      if (this.player.body.top > cam.scrollY + this.scale.height) this.gameOver();
    }

    this.paper.draw(cam.scrollY - 50, cam.scrollY + this.scale.height + 50);
    this.course.draw(time);
    this.player.draw(time);
    this.controls.draw(time);
    this.scoreWord.draw(time);
    if (this.card) this.drawCard(time);
  }

  gameOver() {
    this.over = true;
    this.physics.pause();
    const { lines, stars, total } = this.score;
    saveScore(MODE_ID, total);
    this.scoreWord.graphics.setVisible(false); // the card shows it big instead

    // The score card: a piece of paper in the middle of the screen with the
    // score, the lines and stars that made it, and two buttons.
    const w = this.scale.width;
    const h = this.scale.height;
    const cx = w / 2;
    const top = h / 2 - 200;
    this.card = {
      graphics: this.add.graphics().setScrollFactor(0).setDepth(30),
      rect: { x: cx - 170, y: top, width: 340, height: 400 },
      // Big, but shrinks for long numbers so it always fits on the card.
      total: new PencilWord(this, String(total), cx, top + 40, Math.min(90, 230 / String(total).length), {
        align: 'center', fixed: true, depth: 31, lineWidth: 6,
      }),
      // Room for four digits after each icon, so big scores don't collide.
      lines: new PencilWord(this, String(lines), cx - 92, top + 175, 30, { fixed: true, depth: 31 }),
      stars: new PencilWord(this, String(stars), cx + 58, top + 175, 30, { fixed: true, depth: 31 }),
      again: { x: cx - 70, y: top + 310 },
      back: { x: cx + 70, y: top + 310 },
    };

    this.input.on('pointerdown', (pointer) => {
      const near = (b) => Math.hypot(pointer.x - b.x, pointer.y - b.y) < BUTTON_RADIUS * 1.3;
      if (near(this.card.again)) this.restart();
      else if (near(this.card.back)) this.leave();
    });
  }

  drawCard(time) {
    const { graphics: g, rect, again, back } = this.card;
    g.clear();
    const rng = boilRng(time, 500);
    const style = { color: COLORS.pencil, width: 3 };

    // The card itself: paper with a pencil outline.
    g.fillStyle(COLORS.paper, 0.97);
    g.fillRect(rect.x, rect.y, rect.width, rect.height);
    const { x, y, width: rw, height: rh } = rect;
    pencilLine(g, rng, x, y, x + rw, y, style);
    pencilLine(g, rng, x, y + rh, x + rw, y + rh, style);
    pencilLine(g, rng, x, y, x, y + rh, style);
    pencilLine(g, rng, x + rw, y, x + rw, y + rh, style);

    // ↑ lines climbed and ★ stars collected, as little icons.
    const iconY = rect.y + 190;
    const ux = rect.x + rect.width / 2 - 110;
    pencilLine(g, rng, ux, iconY + 14, ux, iconY - 14, style);
    pencilPolyline(g, rng, [{ x: ux - 9, y: iconY - 5 }, { x: ux, y: iconY - 14 }, { x: ux + 9, y: iconY - 5 }], style);
    drawStar(g, rng, rect.x + rect.width / 2 + 38, iconY, 14, { width: 2.5 });

    // Buttons: ↻ again, ◀ back.
    for (const b of [again, back]) pencilCircle(g, rng, b.x, b.y, BUTTON_RADIUS, { ...style, points: 18 });
    drawReplayIcon(g, rng, again.x, again.y, style);
    pencilPolyline(g, rng, [{ x: back.x + 8, y: back.y - 15 }, { x: back.x - 8, y: back.y }, { x: back.x + 8, y: back.y + 15 }], style);

    for (const word of [this.card.total, this.card.lines, this.card.stars]) word.draw(time);
  }

  restart() {
    if (this.leaving) return;
    this.leaving = true;
    fadeOutToPaper(this, () => this.scene.restart());
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: MODE_ID }));
  }
}

// ↻: a circle with a gap at the top, going clockwise, with an arrowhead at the
// end of the curve pointing the way it's going.
function drawReplayIcon(g, rng, cx, cy, style) {
  const radius = 18;
  const gap = 0.6; // radians left open at the top
  const start = -Math.PI / 2 + gap / 2; // just right of the top...
  const end = start + Math.PI * 2 - gap; // ...all the way round to just left of it
  const arc = [];
  for (let i = 0; i <= 12; i++) {
    const a = start + (i / 12) * (end - start);
    arc.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
  }
  pencilPolyline(g, rng, arc, style);

  // The arrowhead: two short strokes swept back from the tip, either side of the
  // direction the curve is heading at its end (the tangent).
  const tip = arc[arc.length - 1];
  const dir = Math.atan2(Math.cos(end), -Math.sin(end));
  const wing = (offset) => ({ x: tip.x - Math.cos(dir + offset) * 9, y: tip.y - Math.sin(dir + offset) * 9 });
  pencilPolyline(g, rng, [wing(0.6), tip, wing(-0.6)], style);
}
