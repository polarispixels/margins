// The comic page: the game's "menu", drawn like a newspaper's comics page.
//
// The page is tall and scrolls. It has a masthead, then strips of panels, each
// strip with a title and its own floor line. The stick figure walks along a
// floor and jumps up into a panel to play it. A ladder in the margin climbs
// between the strips. Locked panels wiggle and say "not yet". Where everything
// goes is worked out by layoutPage() (src/home/pageLayout.js).

import Phaser from 'phaser';
import { PAGE_MAX_WIDTH, HEIGHT, HOME, COLORS, TOUCH } from '../config.js';
import { STRIPS } from '../data/strips.js';
import { layoutPage } from '../home/pageLayout.js';
import { drawPaper } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { Ladder } from '../objects/Ladder.js';
import { ComicPanel } from '../objects/ComicPanel.js';
import { PencilWord } from '../objects/PencilWord.js';
import { boilRng, pencilLine, pencilPolyline } from '../pencil.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen } from '../screen.js';
import { isComplete, highScores } from '../progress.js';
import { MODE_ID as CLIMB } from './ClimbScene.js';
import { MODE_ID as READ_MODE } from './ReadScene.js';

const START_X = 160;
const ZOOM_MS = 700;
const TITLE_SIZE = 22;
const MASTHEAD_SIZE = 56;
const CAMERA_EASE = 6; // how quickly the camera catches up (bigger = faster)
const FOLLOW_FRACTION = 0.7; // his feet sit this far down the screen
// Modes (not story panels) never show "finished" art.
const MODES = [CLIMB, READ_MODE];

export class ComicPageScene extends Phaser.Scene {
  constructor() {
    super('ComicPage');
  }

  // data.returningFrom is a panel id when we come back from a level or mode.
  create(data = {}) {
    this.entering = false;
    this.physics.resume(); // in case it was paused while zooming into a panel
    useLayout(this, LANDSCAPE); // Climb switches to portrait; switch back

    this.layout = layoutPage(STRIPS);
    const layout = this.layout;
    drawPaper(this, { bottom: layout.pageHeight + HEIGHT });
    this.decor = this.add.graphics(); // masthead box and rules, boiled each frame

    // One floor per strip. The lines run through the red margin line, so he can
    // walk out to the ladder; the left edge of the world is the wall.
    this.platforms = new Platforms(
      this,
      layout.strips.map((s) => ({ line: s.floorLine, from: 0, to: PAGE_MAX_WIDTH })),
    );
    // Platforms adds a wall along the margin line, but here the margin is walkable.
    this.platforms.group.remove(this.platforms.group.getChildren().at(-1), true, true);
    this.ladder = new Ladder(this, layout.ladder);

    this.buildWritings();
    this.buildPanels(data);

    // One word at a time: WALK first, then JUMP under a panel, CLIMB at the ladder.
    const firstFloor = layout.strips[0].floorY;
    this.walkWord = new PencilWord(this, 'WALK', START_X + 40, firstFloor - 52, 34, { written: false });
    this.climbWord = new PencilWord(this, 'CLIMB', this.ladder.x + 30, firstFloor - 58, 34, { written: false });
    this.climbWordUsed = false;

    // Coming back, he stands right under the panel he just left.
    const from = data.returningFrom ? this.panels.find((p) => p.def.id === data.returningFrom) : null;
    const startX = from ? from.panel.centerX : START_X;
    const startFloor = from ? from.strip.floorY : firstFloor;
    this.spawnX = startX;
    this.player = new StickFigure(this, startX, startFloor - 30);
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group, null, () => !this.player.climbing);

    watchScreen(this, (scene) => this.fit(scene));
    this.snapCamera();
    this.onTap = (pointer) => this.handleTap(pointer);
    this.input.on('pointerdown', this.onTap);
    this.events.once('shutdown', () => this.input.off('pointerdown', this.onTap));

    if (from) {
      this.zoomOutOf(from);
    } else {
      this.walkWord.write(900);
    }
  }

  // Masthead title and each strip's title (untitled strips get just the rule).
  buildWritings() {
    const m = this.layout.masthead;
    this.masthead = new PencilWord(this, 'MARGINS', m.x + m.width / 2, m.y + (m.height - MASTHEAD_SIZE) / 2, MASTHEAD_SIZE, {
      align: 'center',
    });
    this.titles = this.layout.strips.map((strip) => {
      const word = strip.title
        ? new PencilWord(this, strip.title, HOME.contentLeft, strip.titleY - TITLE_SIZE, TITLE_SIZE)
        : null;
      return { strip, word };
    });
  }

  buildPanels(data) {
    this.panels = [];
    for (const strip of this.layout.strips) {
      for (const def of strip.panels) {
        // Story panels (not modes) show finished art once they're done.
        const justFinished = !!def.id && data.returningFrom === def.id && !MODES.includes(def.id) && isComplete(def.id);
        const open = def.kind === 'open';
        const panel = new ComicPanel(this, def, {
          kind: def.kind,
          word: def.word,
          art: def.art,
          // A panel that was just finished starts blank and fades its art in after the zoom out.
          completed: open && isComplete(def.id) && !justFinished,
          best: def.id === CLIMB ? highScores(CLIMB)[0]?.score ?? 0 : 0,
        });
        const jumpWord = open
          ? new PencilWord(this, 'JUMP', panel.centerX, panel.y + 16, 32, { align: 'center', written: false })
          : null;
        this.panels.push({ def, strip, panel, justFinished, jumpWord });
      }
    }
  }

  // The world and camera limits. Called now and whenever the screen changes size.
  fit(scene) {
    const { width, height } = scene.scale;
    scene.physics.world.setBounds(0, 0, width, scene.layout.pageHeight);
    scene.cameras.main.setBounds(0, 0, PAGE_MAX_WIDTH, Math.max(scene.layout.pageHeight, height));
  }

  // Where the camera wants to be for a given spot of feet.
  scrollTargetFor(feetY) {
    const height = this.scale.height;
    return Phaser.Math.Clamp(feetY - height * FOLLOW_FRACTION, 0, Math.max(0, this.layout.pageHeight - height));
  }

  snapCamera() {
    this.cameras.main.setScroll(0, this.scrollTargetFor(this.player.body.bottom));
  }

  update(time, delta) {
    const dt = delta / 1000;
    if (!this.entering) {
      const input = this.controls.read();
      this.ladder.update(this.player, input); // before the player moves
      this.player.update(input, dt);
      const atLadder = this.ladder.touches(this.player) || this.player.climbing;
      this.controls.touch.setLayout(atLadder ? 'ladder' : 'platformer');
      this.followCamera(dt);
      this.updateWords(atLadder);
      this.checkBumps(time);
    }

    this.drawMasthead(time);
    this.platforms.draw(time);
    this.ladder.draw(time);
    this.walkWord.draw(time);
    this.climbWord.draw(time);
    this.masthead.draw(time);
    for (const t of this.titles) t.word?.draw(time);
    for (const p of this.panels) {
      p.panel.draw(time);
      p.jumpWord?.draw(time);
    }
    this.player.draw(time);
    this.controls.draw(time);
  }

  followCamera(dt) {
    const cam = this.cameras.main;
    const target = this.scrollTargetFor(this.player.body.bottom);
    cam.scrollY += (target - cam.scrollY) * (1 - Math.exp(-dt * CAMERA_EASE));
    cam.scrollX = 0;
  }

  // Jumping up into a panel: an open one starts its level, a locked one says "not yet".
  checkBumps(time) {
    const feet = this.player.body.bottom;
    for (const p of this.panels) {
      // Only panels in the band he's standing in (isEnteredBy alone would fire
      // for a panel far below him, since his head is "above its bottom edge").
      if (feet < p.panel.y || feet > p.strip.floorY + 4) continue;
      if (!p.panel.isEnteredBy(this.player)) continue;
      if (p.def.kind === 'open') {
        this.enter(p);
        return;
      }
      // Once per bump: only while he's still rising into it.
      if (this.player.body.velocity.y < 0 && !this.player.climbing) {
        p.panel.wiggle(time);
        this.player.bonk();
      }
    }
  }

  updateWords(atLadder) {
    const body = this.player.body;
    const x = body.center.x;
    if (this.walkWord.shown && Math.abs(x - START_X) > 80) this.walkWord.fadeOut();

    // CLIMB shows the first time this visit he touches the ladder, then fades when he leaves.
    if (atLadder && !this.climbWordUsed) {
      this.climbWordUsed = true;
      const landings = this.ladder.landings;
      const landing = landings.reduce((a, b) => (Math.abs(b - body.bottom) < Math.abs(a - body.bottom) ? b : a));
      // Written in the gap between the panels and the floor, beside the ladder's landing.
      this.climbWord.setPosition(this.ladder.x + 30, landing - 58);
      this.showOnly(this.climbWord);
      this.climbWord.write(600);
    } else if (!atLadder && this.climbWord.shown) {
      this.climbWord.fadeOut();
    }

    // JUMP shows inside an open panel when he's standing under it.
    for (const p of this.panels) {
      // Not right at the start (WALK comes first; coming back, he's already under a panel).
      if (!p.jumpWord || p.jumpWord.shown || this.walkWord.shown || Math.abs(x - this.spawnX) < 60) continue;
      const under = x > p.panel.x && x < p.panel.x + p.panel.width;
      const onItsFloor = body.bottom > p.panel.bottom && body.bottom <= p.strip.floorY + 4;
      if (under && onItsFloor && !this.player.climbing) {
        this.showOnly(p.jumpWord);
        p.jumpWord.write(600);
      }
    }
  }

  // Fade every instruction word except `keep`, so there's only ever one on the page.
  showOnly(keep) {
    const words = [this.walkWord, this.climbWord, ...this.panels.map((p) => p.jumpWord)];
    for (const w of words) if (w && w !== keep && w.shown) w.fadeOut();
  }

  // The newspaper masthead: a pencil box, with a double rule on each side of the name.
  drawMasthead(time) {
    const g = this.decor;
    g.clear();
    const rng = boilRng(time, 90);
    const m = this.layout.masthead;
    const style = { color: COLORS.pencil, width: 3 };
    pencilPolyline(
      g,
      rng,
      [
        { x: m.x, y: m.y }, { x: m.x + m.width, y: m.y }, { x: m.x + m.width, y: m.y + m.height },
        { x: m.x, y: m.y + m.height }, { x: m.x, y: m.y },
      ],
      style,
    );
    const midY = m.y + m.height / 2;
    const gap = 20;
    const left = this.masthead.x - gap;
    const right = this.masthead.x + this.masthead.width + gap;
    for (const dy of [-4, 4]) {
      pencilLine(g, rng, m.x + 16, midY + dy, left, midY + dy, { color: COLORS.pencil, width: 2 });
      pencilLine(g, rng, right, midY + dy, m.x + m.width - 16, midY + dy, { color: COLORS.pencil, width: 2 });
    }
    // Each strip's title rule, running on to the right edge of the panels.
    for (const { strip, word } of this.titles) {
      const startX = word ? HOME.contentLeft + word.width + 14 : HOME.contentLeft;
      pencilLine(g, rng, startX, strip.titleY - 8, HOME.contentRight, strip.titleY - 8, { color: COLORS.pencil, width: 2 });
    }
  }

  // A tap on a panel: an open one starts, a locked one wiggles. Taps on the touch buttons don't count.
  handleTap(pointer) {
    if (this.entering) return;
    const near = Object.values(this.controls.touch.buttons ?? {}).some(
      (b) => Math.hypot(pointer.x - b.x, pointer.y - b.y) < TOUCH.buttonRadius * 1.25,
    );
    if (near) return;
    const hit = this.panels.find((p) => p.panel.contains(pointer.worldX, pointer.worldY));
    if (!hit) return;
    if (hit.def.kind === 'open') this.enter(hit);
    else if (hit.def.kind === 'locked') hit.panel.wiggle(this.time.now);
  }

  // How much to zoom so a panel fills the screen.
  zoomFor(panel) {
    return Math.min(this.scale.width / panel.width, this.scale.height / panel.height);
  }

  // Jumped into a panel: zoom the camera into it, then start its scene.
  enter(p) {
    this.entering = true;
    this.physics.pause();
    const cam = this.cameras.main;
    cam.pan(p.panel.centerX, p.panel.centerY, ZOOM_MS, 'Sine.easeInOut');
    cam.zoomTo(this.zoomFor(p.panel), ZOOM_MS, 'Sine.easeInOut');
    this.time.delayedCall(ZOOM_MS + 50, () => this.scene.start(p.def.scene));
  }

  // Back from a panel: start zoomed into it and zoom out to where the camera
  // normally looks for his spot. If it was just finished, its art then fades in.
  zoomOutOf(p) {
    this.entering = true;
    const cam = this.cameras.main;
    const normalScrollY = this.scrollTargetFor(this.player.body.bottom);
    cam.setZoom(this.zoomFor(p.panel));
    cam.centerOn(p.panel.centerX, p.panel.centerY);
    cam.pan(this.scale.width / 2, normalScrollY + this.scale.height / 2, ZOOM_MS, 'Sine.easeInOut');
    cam.zoomTo(1, ZOOM_MS, 'Sine.easeInOut');
    this.time.delayedCall(ZOOM_MS + 50, () => {
      cam.setZoom(1);
      cam.setScroll(0, normalScrollY); // snap exactly back to the normal view
      this.entering = false;
      if (p.justFinished) p.panel.showCompleted();
    });
  }
}
