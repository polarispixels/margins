// Climb: an endless vertical bouncer, played in portrait.
//
// The figure bounces automatically whenever it lands on a platform; the player
// only steers left and right. The camera follows upward and never comes back
// down, so falling off the bottom of the screen ends the run.
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
    this.player.runSpeed = CLIMB.steerSpeed;
    this.controls = new PlayerInput(this, { touchLayout: 'steer' });
    this.menuKeys = this.input.keyboard.addKeys('ENTER,ESC');

    // Landing on a platform bounces. The callback runs when the figure lands on one.
    this.physics.add.collider(this.player.zone, this.course.group, (_, zone) => this.bounce(zone.platform));

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

  bounce(platform) {
    const body = this.player.body;
    if (!body.touching.down && !body.blocked.down) return; // only when landing on top
    if (this.course.isOnSpring(platform, body.center.x)) {
      body.setVelocityY(-CLIMB.springSpeed);
      platform.spring.firedAt = this.time.now;
    } else {
      body.setVelocityY(-CLIMB.bounceSpeed);
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
      // Steering only: no jumping in Climb; landing does the bouncing.
      const input = this.controls.read();
      this.player.update({ left: input.left, right: input.right, jump: false, jumpHeld: false }, delta / 1000);

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
      total: new PencilWord(this, String(total), cx, top + 40, 90, { align: 'center', fixed: true, depth: 31, lineWidth: 6 }),
      lines: new PencilWord(this, String(lines), cx - 40, top + 175, 30, { fixed: true, depth: 31 }),
      stars: new PencilWord(this, String(stars), cx + 80, top + 175, 30, { fixed: true, depth: 31 }),
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
    const ux = rect.x + rect.width / 2 - 70;
    pencilLine(g, rng, ux, iconY + 14, ux, iconY - 14, style);
    pencilPolyline(g, rng, [{ x: ux - 9, y: iconY - 5 }, { x: ux, y: iconY - 14 }, { x: ux + 9, y: iconY - 5 }], style);
    drawStar(g, rng, rect.x + rect.width / 2 + 55, iconY, 14, { width: 2.5 });

    // Buttons: ↻ again, ◀ back.
    for (const b of [again, back]) pencilCircle(g, rng, b.x, b.y, BUTTON_RADIUS, { ...style, points: 18 });
    const arc = [];
    for (let i = 0; i <= 10; i++) {
      const a = -Math.PI * 0.35 + (i / 10) * Math.PI * 1.6; // most of a circle
      arc.push({ x: again.x + Math.cos(a) * 18, y: again.y + Math.sin(a) * 18 });
    }
    pencilPolyline(g, rng, arc, style);
    const end = arc[0];
    pencilPolyline(g, rng, [{ x: end.x - 2, y: end.y - 11 }, end, { x: end.x + 10, y: end.y - 3 }], style);
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
