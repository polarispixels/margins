// On-screen buttons for phones: left and right in the bottom-left corner,
// jump in the bottom-right.
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
    this.state = { left: false, right: false, jump: false };

    // Only show the buttons on touch devices.
    this.enabled = scene.sys.game.device.input.touch;
    // Buttons live in screen space: setScrollFactor(0) keeps them still when the camera scrolls.
    this.graphics = scene.add.graphics().setDepth(10).setAlpha(TOUCH.alpha).setScrollFactor(0);
    this.layout();
  }

  // Place the buttons relative to the screen's corners, since the screen
  // size depends on the device.
  layout() {
    const { width, height } = this.scene.scale;
    const r = TOUCH.buttonRadius;
    const y = height - r - 16;

    this.buttons = {
      left: { x: 160 + r, y },
      right: { x: 160 + r * 3 + 24, y },
      jump: { x: width - r - 28, y },
    };
  }

  // Work out which buttons are held right now.
  update() {
    this.state = { left: false, right: false, jump: false };
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

      // Arrow glyphs: a chevron pointing left, right, or up.
      const s = r * 0.35;
      if (name === 'left') {
        pencilLine(g, rng, b.x + s * 0.5, b.y - s, b.x - s * 0.5, b.y, style);
        pencilLine(g, rng, b.x - s * 0.5, b.y, b.x + s * 0.5, b.y + s, style);
      } else if (name === 'right') {
        pencilLine(g, rng, b.x - s * 0.5, b.y - s, b.x + s * 0.5, b.y, style);
        pencilLine(g, rng, b.x + s * 0.5, b.y, b.x - s * 0.5, b.y + s, style);
      } else {
        pencilLine(g, rng, b.x - s, b.y + s * 0.5, b.x, b.y - s * 0.5, style);
        pencilLine(g, rng, b.x, b.y - s * 0.5, b.x + s, b.y + s * 0.5, style);
      }
    }
  }
}
