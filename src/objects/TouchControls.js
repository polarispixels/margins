// On-screen buttons for phones. Layouts (switch with setLayout()):
//   'platformer' (default): left and right in the bottom-left corner, jump in
//                           the bottom-right.
//   'flight' (Launch's rocket): up above down, in the bottom-right.
//   'ladder' (the home page's ladders): left and right bottom-left, up above down bottom-right.
//   'none': no buttons (e.g. during a cutscene).
//
// Instead of listening for "button pressed" events, every frame we look at
// all fingers currently on the screen and check which buttons they're over.
// That handles multi-touch (run + jump) and sliding a finger between
// left and right without any extra bookkeeping.

import { COLORS, TOUCH } from '../config.js';
import { boilRng, pencilCircle, pencilLine } from '../pencil.js';

export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    this.mode = 'platformer';
    this.state = {};

    // Only show the buttons on touch devices.
    this.enabled = scene.sys.game.device.input.touch;
    // Buttons live in screen space: setScrollFactor(0) keeps them still when the camera scrolls.
    this.graphics = scene.add.graphics().setDepth(10).setAlpha(TOUCH.alpha).setScrollFactor(0);
    this.layout();
  }

  // Place the buttons relative to the screen's corners, since the screen
  // size depends on the device.
  setLayout(mode) {
    this.mode = mode;
    this.layout();
  }

  layout() {
    const { width, height } = this.scene.scale;
    const r = TOUCH.buttonRadius;
    const y = height - r - 16;
    if (this.mode === 'none') {
      this.buttons = {};
      return;
    }
    const upDown = {
      up: { x: width - r - 28, y: y - r * 2 - 20 },
      down: { x: width - r - 28, y },
    };
    if (this.mode === 'flight') {
      this.buttons = upDown;
      return;
    }
    // In landscape, the arrows start right of the margin; in portrait (Climb)
    // the screen is narrow, so they start near the left edge.
    const left = width > height ? 160 : 20;

    if (this.mode === 'ladder') {
      this.buttons = {
        left: { x: left + r, y },
        right: { x: left + r * 3 + 24, y },
        ...upDown,
      };
      return;
    }
    this.buttons = {
      left: { x: left + r, y },
      right: { x: left + r * 3 + 24, y },
      jump: { x: width - r - 28, y },
    };
  }

  // Work out which buttons are held right now.
  update() {
    this.state = { left: false, right: false, jump: false, up: false, down: false };
    if (!this.enabled) return;
    this.layout(); // cheap, and keeps up with screen size changes

    for (const pointer of this.scene.input.manager.pointers) {
      if (!pointer.isDown) continue;
      for (const [name, button] of Object.entries(this.buttons)) {
        // A slightly bigger hit area than the drawn circle is kinder to thumbs.
        if (Math.hypot(pointer.x - button.x, pointer.y - button.y) < TOUCH.buttonRadius * 1.25) {
          this.state[name] = true;
        }
      }
    }
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    if (!this.enabled) return;

    const r = TOUCH.buttonRadius;
    const style = { color: COLORS.pencil, width: 3 };
    const rng = boilRng(time, 200);

    for (const [name, b] of Object.entries(this.buttons)) {
      // Pressed buttons get a light pencil shading.
      if (this.state[name]) {
        g.fillStyle(COLORS.pencil, 0.15);
        g.fillCircle(b.x, b.y, r);
      }
      pencilCircle(g, rng, b.x, b.y, r, { ...style, points: 18 });

      // Arrow glyphs: a chevron pointing left, right, up, or down.
      const s = r * 0.35;
      const chevron = (dx, dy) => {
        // Two strokes meeting at the point the arrow aims toward (dx, dy).
        const tipX = b.x + dx * s * 0.5;
        const tipY = b.y + dy * s * 0.5;
        pencilLine(g, rng, tipX - dx * s - dy * s, tipY - dy * s - dx * s, tipX, tipY, style);
        pencilLine(g, rng, tipX, tipY, tipX - dx * s + dy * s, tipY - dy * s + dx * s, style);
      };
      if (name === 'left') chevron(-1, 0);
      else if (name === 'right') chevron(1, 0);
      else if (name === 'down') chevron(0, 1);
      else chevron(0, -1); // jump and up
    }
  }
}
