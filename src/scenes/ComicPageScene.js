// The comic page: the game's "menu", drawn like comic strips in a notebook.
//
// Each strip is a row of panels with a title above it, and each panel is a level
// or a mode. The stick figure walks along the bottom line and jumps up into a
// panel to play it. For now there are two strips side by side, one panel each:
// "Getting Started" (the story tutorial) and "Climb" (the endless bouncer).

import Phaser from 'phaser';
import { PAGE_MAX_WIDTH, PAPER, HEIGHT } from '../config.js';
import { drawPaper, lineY } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { ComicPanel } from '../objects/ComicPanel.js';
import { PencilWord } from '../objects/PencilWord.js';
import { PlayerInput } from '../input.js';
import { useLayout, LANDSCAPE, watchScreen, fitToScreen } from '../screen.js';
import { isComplete, highScores } from '../progress.js';
import { PANEL_ID as GETTING_STARTED } from './GettingStartedScene.js';
import { MODE_ID as CLIMB } from './ClimbScene.js';

const FLOOR_LINE = 12;
const START_X = 160;
const ZOOM_MS = 700;
const TITLE_SIZE = 24;

// One entry per strip. The panels' bottom edges sit just above the figure's
// head, so even a quick tap-jump reaches them.
const PANELS = [
  { id: GETTING_STARTED, title: 'GETTING STARTED', scene: 'GettingStarted', x: 190, y: 118, width: 250, height: 298 },
  { id: CLIMB, title: 'CLIMB', scene: 'Climb', x: 560, y: 118, width: 250, height: 298 },
];

export class ComicPageScene extends Phaser.Scene {
  constructor() {
    super('ComicPage');
  }

  // data.returningFrom is a panel id when we come back from a level or mode.
  create(data = {}) {
    this.entering = false;
    this.physics.resume(); // in case it was paused while zooming into a panel
    useLayout(this, LANDSCAPE); // Climb switches to portrait; switch back
    const floorY = lineY(FLOOR_LINE);

    drawPaper(this);
    this.platforms = new Platforms(this, [{ line: FLOOR_LINE, from: PAPER.marginX, to: PAGE_MAX_WIDTH }]);

    // Each strip: a panel, its title in the header space above the first ruled
    // line, and a JUMP word written inside the panel when the figure is under it.
    this.strips = PANELS.map((def) => {
      const justFinished = data.returningFrom === def.id && def.id === GETTING_STARTED;
      const panel = new ComicPanel(this, def, {
        art: def.id,
        // A panel that was just finished starts blank and fades its art in after the zoom out.
        completed: isComplete(def.id) && !justFinished,
        best: highScores(def.id)[0]?.score ?? 0,
      });
      return {
        def,
        panel,
        justFinished,
        title: new PencilWord(this, def.title, panel.centerX, 28, TITLE_SIZE, { align: 'center' }),
        jumpWord: new PencilWord(this, 'JUMP', panel.centerX, panel.bottom - 50, 36, { align: 'center', written: false }),
      };
    });

    // One word at a time: WALK first, then JUMP under whichever panel he's at.
    this.walkWord = new PencilWord(this, 'WALK', START_X - 40, floorY - 150, 40, { written: false });

    // Coming back, he stands right under the panel he just left.
    const from = this.strips.find((s) => s.def.id === data.returningFrom);
    const startX = from ? from.panel.centerX : START_X;
    this.player = new StickFigure(this, startX, floorY - 30);
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group);

    watchScreen(this);
    if (from) {
      this.zoomOutOf(from);
    } else {
      this.walkWord.write(900);
    }
  }

  update(time, delta) {
    if (!this.entering) {
      this.player.update(this.controls.read(), delta / 1000);
      this.updateWords();
      const entered = this.strips.find((s) => s.panel.isEnteredBy(this.player));
      if (entered) this.enter(entered);
    }

    this.platforms.draw(time);
    this.walkWord.draw(time);
    for (const strip of this.strips) {
      strip.panel.draw(time);
      strip.title.draw(time);
      strip.jumpWord.draw(time);
    }
    this.player.draw(time);
    this.controls.draw(time);
  }

  updateWords() {
    const x = this.player.body.center.x;
    if (this.walkWord.shown && Math.abs(x - START_X) > 80) this.walkWord.fadeOut();

    for (const strip of this.strips) {
      const under = x > strip.panel.x && x < strip.panel.x + strip.panel.width;
      if (under && !strip.jumpWord.shown) {
        // Clear any other word first, so there's only ever one on the page.
        if (this.walkWord.shown) this.walkWord.fadeOut();
        for (const other of this.strips) if (other.jumpWord.shown) other.jumpWord.fadeOut();
        strip.jumpWord.write(600);
      }
    }
  }

  // How much to zoom so a panel fills the screen.
  zoomFor(panel) {
    return Math.min(this.scale.width / panel.width, this.scale.height / panel.height);
  }

  // Jumped into a panel: zoom the camera into it, then start its scene.
  enter(strip) {
    this.entering = true;
    this.physics.pause();
    const cam = this.cameras.main;
    cam.pan(strip.panel.centerX, strip.panel.centerY, ZOOM_MS, 'Sine.easeInOut');
    cam.zoomTo(this.zoomFor(strip.panel), ZOOM_MS, 'Sine.easeInOut');
    this.time.delayedCall(ZOOM_MS + 50, () => this.scene.start(strip.def.scene));
  }

  // Back from a panel: start zoomed into it and zoom out. If it was just
  // finished, its finished art then fades in.
  zoomOutOf(strip) {
    this.entering = true;
    const cam = this.cameras.main;
    cam.setZoom(this.zoomFor(strip.panel));
    cam.centerOn(strip.panel.centerX, strip.panel.centerY);
    // Where the camera normally looks (see screen.js): the bottom of the page.
    cam.pan(this.scale.width / 2, HEIGHT - this.scale.height / 2, ZOOM_MS, 'Sine.easeInOut');
    cam.zoomTo(1, ZOOM_MS, 'Sine.easeInOut');
    this.time.delayedCall(ZOOM_MS + 50, () => {
      fitToScreen(this); // snap exactly back to the normal view
      this.entering = false;
      if (strip.justFinished) strip.panel.showCompleted();
    });
  }
}
