// Climb: an endless vertical platformer, played in portrait.
//
// The figure walks and jumps just like in the story levels (press up to jump).
// The camera follows upward and never comes back down, so falling off the
// bottom of the screen ends the run, and so does touching an ink blot (unless
// you land on top of it, which splats it). Springs and paperclips launch you,
// paper airplanes fly you up for a few seconds, and every height milestone
// makes the climb more rewarding and more dangerous (see milestones.js).
//
// The scene moves through four states:
//   'initials' → pick three initials (first time only, or from the start card)
//   'start'    → the start card: your initials, change them, or ▶ play
//   'playing'  → the climb
//   'over'     → the score card with the top five
// Score = ruled lines climbed + bonus points (stars and splatted blots).

import Phaser from 'phaser';
import { CLIMB, COLORS, PAPER } from '../config.js';
import { ScrollingPaper } from '../objects/ScrollingPaper.js';
import { ClimbCourse } from '../objects/ClimbCourse.js';
import { InitialsCard, StartCard, ScoreCard } from '../objects/ClimbCards.js';
import { drawAirplane } from '../objects/climbArt.js';
import { StickFigure } from '../objects/StickFigure.js';
import { PencilWord } from '../objects/PencilWord.js';
import { PlayerInput } from '../input.js';
import { useLayout, PORTRAIT, watchScreen, fadeInFromPaper, fadeOutToPaper } from '../screen.js';
import { getInitials, setInitials, addHighScore } from '../progress.js';
import { milestoneAt } from '../milestones.js';
import { boilRng } from '../pencil.js';

export const MODE_ID = 'climb';

const FLOOR_Y = 0; // world y of the starting floor; everything above is negative y
const MILESTONE_SHOW_MS = 2200; // how long a milestone message stays up
const FLIGHT_WARNING_MS = 700; // the airplane flickers this long before it drops you
const FLIGHT_END_POP = 250; // small upward speed when a flight ends

export class ClimbScene extends Phaser.Scene {
  constructor() {
    super('Climb');
  }

  // data.quickStart skips the start card (used by ↻ "again").
  create(data = {}) {
    useLayout(this, PORTRAIT);
    this.physics.resume(); // the comic page pauses physics while zooming in
    this.state = 'start';
    this.leaving = false; // fading out to restart or leave
    this.initials = getInitials();
    this.stars = 0;
    this.bonus = 0; // points from stars and splatted blots
    this.highestFeet = FLOOR_Y; // the highest the figure's feet have been (smallest y)
    this.lastMilestone = 0;
    this.flightUntil = 0; // time a paper airplane flight ends
    this.wasFlying = false;
    this.card = null;

    this.cameras.main.setBackgroundColor(COLORS.desk); // shows beside the page on wide screens
    this.paper = new ScrollingPaper(this);
    this.course = new ClimbCourse(this, FLOOR_Y);
    this.planeGraphics = this.add.graphics().setDepth(1);

    this.player = new StickFigure(this, CLIMB.width / 2, FLOOR_Y - 30);
    this.player.runSpeed = CLIMB.walkSpeed;
    this.controls = new PlayerInput(this);
    this.menuKeys = this.input.keyboard.addKeys('ESC');

    // Stand on platforms. The callback runs when the figure lands on one, for launchers.
    this.physics.add.collider(this.player.zone, this.course.group, (_, zone) => this.landOn(zone.platform));

    // Walls at the margin and the page's right edge; nothing above or below,
    // so the figure can rise forever and fall off the bottom.
    this.physics.world.setBounds(CLIMB.marginX, -1e7, CLIMB.width - CLIMB.marginX, 2e7);
    this.physics.world.setBoundsCollision(true, true, false, false);

    // Start with the floor near the bottom of the screen.
    this.cameras.main.scrollY = FLOOR_Y + 90 - this.scale.height;
    watchScreen(this, () => this.fitCamera());

    const cx = this.scale.width / 2;
    this.scoreWord = new PencilWord(this, '0', cx, 14, 34, { align: 'center', fixed: true, depth: 20 });
    this.milestoneNumber = new PencilWord(this, '0', cx, 150, 64, { align: 'center', fixed: true, depth: 25, written: false, lineWidth: 5 });
    this.milestoneWord = new PencilWord(this, 'GO!', cx, 235, 44, { align: 'center', fixed: true, depth: 25, written: false, lineWidth: 4 });

    // Cards get keys and taps while they're showing.
    // (Removed on shutdown: a restart reuses this scene, and doubled listeners
    // would press every button twice.)
    const onKey = (event) => this.card?.key(event);
    const onTap = (pointer) => this.card?.pointerDown(pointer.x, pointer.y);
    this.input.keyboard.on('keydown', onKey);
    this.input.on('pointerdown', onTap);
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', onKey);
      this.input.off('pointerdown', onTap);
    });

    if (data.quickStart && this.initials) this.startPlaying();
    else if (!this.initials) this.showInitials();
    else this.showStart();
    fadeInFromPaper(this);
  }

  // Center the page on wide screens. (Vertical scrolling is handled in update.)
  fitCamera() {
    this.cameras.main.scrollX = (CLIMB.width - this.scale.width) / 2;
    this.scoreWord?.setPosition(this.scale.width / 2, 14);
  }

  // ---- Cards ----

  showCard(card) {
    this.card?.destroy();
    this.card = card;
  }

  showInitials() {
    this.state = 'initials';
    this.showCard(new InitialsCard(this, this.initials, (initials) => {
      this.initials = initials;
      setInitials(initials);
      this.showStart();
    }));
  }

  showStart() {
    this.state = 'start';
    this.showCard(new StartCard(this, this.initials, () => this.startPlaying(), () => this.showInitials()));
  }

  startPlaying() {
    this.showCard(null);
    this.state = 'playing';
    this.controls.read(); // forget the key press that started the game, so it doesn't jump
  }

  // ---- Playing ----

  // Landing on a spring or paperclip launches him. Ordinary platforms just hold him up.
  landOn(platform) {
    const body = this.player.body;
    if (!body.touching.down && !body.blocked.down) return; // only when landing on top
    const launcher = this.course.launcherAt(platform, body.center.x);
    if (launcher) {
      body.setVelocityY(-(launcher.kind === 'paperclip' ? CLIMB.paperclipSpeed : CLIMB.springSpeed));
      launcher.firedAt = this.time.now;
    }
  }

  get score() {
    const lines = Math.max(0, Math.floor((FLOOR_Y - this.highestFeet) / PAPER.lineSpacing));
    return { lines, stars: this.stars, total: lines + this.bonus };
  }

  update(time, delta) {
    const cam = this.cameras.main;
    if (Phaser.Input.Keyboard.JustDown(this.menuKeys.ESC)) return this.leave();
    if (this.state === 'playing') this.updatePlaying(time, delta / 1000);

    this.paper.draw(cam.scrollY - 50, cam.scrollY + this.scale.height + 50);
    this.course.draw(time);
    this.drawPlane(time);
    this.player.draw(time);
    if (this.state === 'playing') this.controls.draw(time);
    else this.controls.touch.graphics.clear();
    this.scoreWord.graphics.setVisible(this.state === 'playing');
    this.scoreWord.draw(time);
    this.milestoneNumber.draw(time);
    this.milestoneWord.draw(time);
    this.card?.draw(time);
  }

  updatePlaying(time, dt) {
    const body = this.player.body;
    const cam = this.cameras.main;
    const flying = time < this.flightUntil;

    const input = this.controls.read();
    if (flying) input.jump = false; // steering only while flying
    this.player.update(input, dt);

    // A paper airplane flight: a steady climb, then gravity comes back.
    if (flying) body.setVelocityY(-CLIMB.airplaneSpeed);
    else if (this.wasFlying) {
      body.setAllowGravity(true);
      body.setVelocityY(-FLIGHT_END_POP);
    }
    this.wasFlying = flying;

    // The camera follows the figure up, but never back down.
    const target = body.center.y - this.scale.height * CLIMB.cameraLead;
    if (target < cam.scrollY) cam.scrollY = target;

    // Keep a screen's worth of platforms ready above, and tidy up far below.
    this.course.generateUpTo(cam.scrollY - this.scale.height);
    this.course.removeBelow(cam.scrollY + this.scale.height * 2);
    this.course.update(dt, body);

    const got = this.course.collectPickups(this.player.center, time);
    this.stars += got.stars;
    this.bonus += got.points;
    if (got.airplane) this.startFlight(time);

    // Ink blots: land on top to splat one (and bounce); touch one any other way
    // and the run is over. Flying, you're safe.
    const blot = flying ? null : this.course.checkBlots(body, time);
    if (blot?.kind === 'stomp') {
      this.bonus += blot.value;
      body.setVelocityY(-CLIMB.stompSpeed);
      this.player.setScale(1.3, 0.7);
    } else if (blot?.kind === 'hit') {
      return this.gameOver();
    }

    this.highestFeet = Math.min(this.highestFeet, body.bottom);
    const { lines, total } = this.score;
    this.scoreWord.setText(total);
    const milestone = milestoneAt(lines);
    if (milestone.at > this.lastMilestone) {
      this.lastMilestone = milestone.at;
      this.announce(milestone);
    }

    if (body.top > cam.scrollY + this.scale.height) this.gameOver();
  }

  startFlight(time) {
    this.flightUntil = time + CLIMB.airplaneSeconds * 1000;
    this.player.body.setAllowGravity(false);
  }

  // The airplane under his feet while flying, flickering just before it drops him.
  drawPlane(time) {
    const g = this.planeGraphics;
    g.clear();
    const left = this.flightUntil - time;
    if (left <= 0 || this.state !== 'playing') return;
    if (left < FLIGHT_WARNING_MS && Math.floor(time / 90) % 2 === 0) return;
    const body = this.player.body;
    drawAirplane(g, boilRng(time, 80), body.center.x, body.bottom + 8, 1.5);
  }

  // A milestone: write its number and word near the top, then fade them.
  announce({ at, word }) {
    const cx = this.scale.width / 2;
    this.milestoneNumber.setText(at);
    this.milestoneNumber.setPosition(cx, 150);
    this.milestoneNumber.write(500);
    if (word) {
      this.milestoneWord.setText(word);
      this.milestoneWord.setPosition(cx, 235);
      this.milestoneWord.write(600);
    }
    this.milestoneTimer?.remove();
    this.milestoneTimer = this.time.delayedCall(MILESTONE_SHOW_MS, () => {
      this.milestoneNumber.fadeOut();
      if (this.milestoneWord.shown) this.milestoneWord.fadeOut();
    });
  }

  gameOver() {
    this.state = 'over';
    this.physics.pause();
    this.flightUntil = 0;
    // Clear any milestone message so it doesn't sit on top of the score card.
    this.milestoneTimer?.remove();
    for (const word of [this.milestoneNumber, this.milestoneWord]) if (word.shown) word.fadeOut(150);
    const { lines, stars, total } = this.score;
    const { place, table } = addHighScore(MODE_ID, this.initials ?? 'AAA', total);
    this.showCard(new ScoreCard(this, { total, lines, stars, table, place }, () => this.restart(), () => this.leave()));
  }

  restart() {
    if (this.leaving) return;
    this.leaving = true;
    fadeOutToPaper(this, () => this.scene.restart({ quickStart: true }));
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    fadeOutToPaper(this, () => this.scene.start('ComicPage', { returningFrom: MODE_ID }));
  }
}
