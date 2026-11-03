// The comic page: the game's "menu", drawn like a comic strip in a notebook.
//
// Each strip is a row of panels with a title above it, and each panel is a level.
// The stick figure walks along the bottom line and jumps up into a panel to play it.
// For now there's one strip, "Getting Started", with one panel.

import Phaser from 'phaser';
import { PAGE_MAX_WIDTH, PAPER, HEIGHT } from '../config.js';
import { drawPaper, lineY } from '../objects/Paper.js';
import { Platforms } from '../objects/Platforms.js';
import { StickFigure } from '../objects/StickFigure.js';
import { ComicPanel } from '../objects/ComicPanel.js';
import { PencilWord } from '../objects/PencilWord.js';
import { PlayerInput } from '../input.js';
import { watchScreen, fitToScreen } from '../screen.js';
import { isComplete } from '../progress.js';
import { PANEL_ID as GETTING_STARTED } from './GettingStartedScene.js';

const FLOOR_LINE = 12;
const START_X = 170;
const ZOOM_MS = 700;

// The strip's title and its one panel. The panel's bottom edge sits just above
// the figure's head, so even a quick tap-jump reaches it.
const STRIP_TITLE = 'GETTING STARTED';
const PANEL = { id: GETTING_STARTED, scene: 'GettingStarted', x: 330, y: 118, width: 300, height: 298 };

export class ComicPageScene extends Phaser.Scene {
  constructor() {
    super('ComicPage');
  }

  // data.returningFrom is set when we come back from a finished level.
  create(data = {}) {
    this.entering = false;
    this.physics.resume(); // in case it was paused while zooming into a panel
    const floorY = lineY(FLOOR_LINE);
    const returning = data.returningFrom === PANEL.id;

    drawPaper(this);
    this.platforms = new Platforms(this, [{ line: FLOOR_LINE, from: PAPER.marginX, to: PAGE_MAX_WIDTH }]);

    // The strip title goes in the header space above the first ruled line.
    this.panel = new ComicPanel(this, PANEL, { completed: isComplete(PANEL.id) && !returning });
    this.title = new PencilWord(this, STRIP_TITLE, this.panel.centerX, 22, 34, { align: 'center' });

    // One word at a time: WALK first, then JUMP once he's standing under the panel.
    this.walkWord = new PencilWord(this, 'WALK', START_X - 40, floorY - 150, 40, { written: false });
    this.jumpWord = new PencilWord(this, 'JUMP', this.panel.centerX, this.panel.bottom - 50, 36, {
      align: 'center',
      written: false,
    });
    this.walkFaded = false;

    // Coming back from a level, he stands right under the panel he just finished.
    const startX = returning ? this.panel.centerX : START_X;
    this.player = new StickFigure(this, startX, floorY - 30);
    this.controls = new PlayerInput(this);
    this.physics.add.collider(this.player.zone, this.platforms.group);

    watchScreen(this);
    if (returning) {
      this.zoomOutOfPanel();
    } else {
      this.walkWord.write(900);
    }
  }

  update(time, delta) {
    if (!this.entering) {
      this.player.update(this.controls.read(), delta / 1000);
      this.updateWords();
      if (this.panel.isEnteredBy(this.player)) this.enterPanel();
    }

    this.platforms.draw(time);
    this.panel.draw(time);
    this.title.draw(time);
    this.walkWord.draw(time);
    this.jumpWord.draw(time);
    this.player.draw(time);
    this.controls.draw(time);
  }

  updateWords() {
    const x = this.player.body.center.x;
    if (!this.walkFaded && (x > START_X + 80 || x < START_X - 80)) {
      this.walkWord.fadeOut();
      this.walkFaded = true;
    }
    const underPanel = x > this.panel.x && x < this.panel.x + this.panel.width;
    if (underPanel && this.jumpWord.progress === 0) {
      if (!this.walkFaded) {
        this.walkWord.fadeOut();
        this.walkFaded = true;
      }
      this.jumpWord.write(600);
    }
  }

  // How much to zoom so the panel fills the screen.
  panelZoom() {
    return Math.min(this.scale.width / this.panel.width, this.scale.height / this.panel.height);
  }

  // Jumped into the panel: zoom the camera into it, then start its level.
  enterPanel() {
    this.entering = true;
    this.physics.pause();
    const cam = this.cameras.main;
    cam.pan(this.panel.centerX, this.panel.centerY, ZOOM_MS, 'Sine.easeInOut');
    cam.zoomTo(this.panelZoom(), ZOOM_MS, 'Sine.easeInOut');
    this.time.delayedCall(ZOOM_MS + 50, () => this.scene.start(PANEL.scene));
  }

  // Back from a level: start zoomed into the panel, zoom out, then draw in the
  // finished art for the panel.
  zoomOutOfPanel() {
    this.entering = true;
    const cam = this.cameras.main;
    cam.setZoom(this.panelZoom());
    cam.centerOn(this.panel.centerX, this.panel.centerY);
    // Where the camera normally looks (see screen.js): the bottom of the page.
    cam.pan(this.scale.width / 2, HEIGHT - this.scale.height / 2, ZOOM_MS, 'Sine.easeInOut');
    cam.zoomTo(1, ZOOM_MS, 'Sine.easeInOut');
    this.time.delayedCall(ZOOM_MS + 50, () => {
      fitToScreen(this); // snap exactly back to the normal view
      this.entering = false;
      this.panel.showCompleted();
    });
  }
}
