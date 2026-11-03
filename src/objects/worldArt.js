// Small pencil sketches, one per "world" on the home page (the locked panels show these).
//
// Each sketch is laid out in a unit square (0..1 across, 0..1 down) and then
// placed in a `size` box centered on (cx, cy), so one drawing fits any panel.
// Friendly on purpose: round shapes, smiles, nothing scary.

import { COLORS, BOIL } from '../config.js';
import { pencilLine, pencilCircle, pencilEllipse, pencilPolyline } from '../pencil.js';

// Each entry gets a "pen" (its drawing helpers, already scaled) and draws with it.
const SKETCHES = {
  // A ladder with a little guy climbing it.
  ladder(p) {
    p.line(0.28, 0.02, 0.28, 0.98);
    p.line(0.72, 0.02, 0.72, 0.98);
    for (const y of [0.2, 0.4, 0.6, 0.8]) p.line(0.28, y, 0.72, y);
    p.circle(0.5, 0.2, 0.07);
    p.line(0.5, 0.27, 0.5, 0.5); // body
    p.line(0.5, 0.33, 0.28, 0.2); // arms reach the rails
    p.line(0.5, 0.33, 0.72, 0.4);
    p.line(0.5, 0.5, 0.4, 0.6); // legs on the rungs
    p.line(0.5, 0.5, 0.6, 0.6);
  },

  // A rope swing hanging over a gap between two cliffs.
  rope(p) {
    p.line(0.15, 0.04, 0.85, 0.04); // a branch
    p.line(0.5, 0.04, 0.36, 0.62); // the rope
    p.ellipse(0.35, 0.66, 0.05, 0.04); // a knot
    p.poly([0, 0.7, 0.28, 0.7, 0.28, 1]); // left cliff
    p.poly([1, 0.7, 0.72, 0.7, 0.72, 1]); // right cliff
    p.line(0.04, 0.78, 0.18, 0.78);
    p.line(0.82, 0.78, 0.96, 0.78);
  },

  // A fly with two wings and a smile.
  fly(p) {
    p.ellipse(0.4, 0.3, 0.1, 0.18); // wings
    p.ellipse(0.58, 0.28, 0.1, 0.18);
    p.ellipse(0.45, 0.58, 0.2, 0.13); // body
    p.circle(0.72, 0.52, 0.09); // head
    p.circle(0.75, 0.49, 0.015);
    p.poly([0.68, 0.56, 0.72, 0.6, 0.77, 0.56]);
    p.line(0.38, 0.7, 0.34, 0.9); // legs
    p.line(0.48, 0.71, 0.48, 0.92);
    p.line(0.56, 0.69, 0.62, 0.88);
  },

  // A barn with a big door and a hayloft window.
  farm(p) {
    p.poly([0.12, 0.95, 0.12, 0.5, 0.5, 0.15, 0.88, 0.5, 0.88, 0.95, 0.12, 0.95]);
    p.poly([0.38, 0.95, 0.38, 0.62, 0.62, 0.62, 0.62, 0.95]);
    p.line(0.38, 0.62, 0.62, 0.95);
    p.line(0.62, 0.62, 0.38, 0.95);
    p.circle(0.5, 0.4, 0.07);
    p.line(0.02, 0.95, 0.98, 0.95);
  },

  // Waves, and a fish swimming under them.
  sea(p) {
    p.wave(0.34, 0.06);
    p.wave(0.92, 0.06);
    p.ellipse(0.42, 0.64, 0.22, 0.12); // fish
    p.poly([0.62, 0.64, 0.8, 0.52, 0.8, 0.76, 0.62, 0.64]); // tail
    p.circle(0.3, 0.6, 0.02);
    p.poly([0.22, 0.68, 0.26, 0.71, 0.3, 0.68]);
  },

  // A palm tree with a hanging vine.
  jungle(p) {
    p.poly([0.5, 1, 0.52, 0.72, 0.56, 0.5, 0.6, 0.3]); // trunk
    p.poly([0.6, 0.3, 0.38, 0.2, 0.18, 0.32]); // leaves
    p.poly([0.6, 0.3, 0.45, 0.08, 0.3, 0.06]);
    p.poly([0.6, 0.3, 0.8, 0.14, 0.95, 0.2]);
    p.poly([0.6, 0.3, 0.82, 0.3, 0.92, 0.46]);
    p.circle(0.58, 0.36, 0.035); // a coconut
    p.poly([0.1, 0, 0.14, 0.2, 0.09, 0.4, 0.13, 0.62]); // vine
    p.ellipse(0.19, 0.3, 0.05, 0.025);
    p.ellipse(0.05, 0.5, 0.05, 0.025);
  },

  // A ringed planet and a few twinkling stars.
  space(p) {
    p.circle(0.5, 0.5, 0.22);
    p.ellipse(0.5, 0.5, 0.42, 0.1); // the ring
    p.sparkle(0.12, 0.15, 0.06);
    p.sparkle(0.85, 0.14, 0.05);
    p.sparkle(0.82, 0.86, 0.06);
    p.sparkle(0.15, 0.82, 0.04);
  },

  // An igloo with a doorway and snow falling.
  ice(p) {
    const dome = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * (i / 12);
      dome.push(0.5 - Math.cos(a) * 0.4, 0.85 - Math.sin(a) * 0.5);
    }
    p.poly(dome);
    p.line(0.08, 0.85, 0.92, 0.85);
    p.line(0.15, 0.65, 0.85, 0.65); // blocks
    p.line(0.26, 0.47, 0.74, 0.47);
    p.poly([0.4, 0.85, 0.4, 0.74, 0.5, 0.67, 0.6, 0.74, 0.6, 0.85]);
    p.circle(0.15, 0.2, 0.015);
    p.circle(0.8, 0.12, 0.015);
    p.circle(0.5, 0.06, 0.015);
  },

  // A long-necked dinosaur with a smile.
  dino(p) {
    p.ellipse(0.45, 0.68, 0.25, 0.14); // body
    p.poly([0.6, 0.6, 0.72, 0.4, 0.76, 0.22]); // neck
    p.poly([0.66, 0.66, 0.78, 0.45, 0.82, 0.26]);
    p.ellipse(0.82, 0.18, 0.09, 0.06); // head
    p.circle(0.84, 0.16, 0.012);
    p.poly([0.78, 0.2, 0.82, 0.22, 0.88, 0.2]);
    p.poly([0.2, 0.68, 0.08, 0.74, 0.02, 0.7]); // tail
    p.line(0.35, 0.8, 0.35, 0.97); // legs
    p.line(0.58, 0.8, 0.58, 0.97);
    p.circle(0.4, 0.62, 0.03); // spots
    p.circle(0.5, 0.7, 0.03);
  },

  // Buildings with windows.
  city(p) {
    p.poly([0.04, 0.95, 0.04, 0.5, 0.28, 0.5, 0.28, 0.95]);
    p.poly([0.28, 0.95, 0.28, 0.15, 0.56, 0.15, 0.56, 0.95]);
    p.poly([0.56, 0.95, 0.56, 0.38, 0.8, 0.38, 0.8, 0.95]);
    p.poly([0.8, 0.95, 0.8, 0.6, 0.96, 0.6, 0.96, 0.95]);
    for (const y of [0.3, 0.5, 0.7]) {
      p.line(0.36, y, 0.4, y);
      p.line(0.46, y, 0.5, y);
    }
    p.line(0.64, 0.52, 0.68, 0.52);
    p.line(0.7, 0.68, 0.74, 0.68);
    p.line(0.1, 0.65, 0.14, 0.65);
    p.line(0.0, 0.95, 1, 0.95);
  },

  // A lollipop with a swirl.
  candy(p) {
    p.circle(0.5, 0.38, 0.3);
    const swirl = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 4;
      const r = 0.27 * (i / 24);
      swirl.push(0.5 + Math.cos(a) * r, 0.38 + Math.sin(a) * r);
    }
    p.poly(swirl);
    p.line(0.5, 0.68, 0.5, 0.98);
  },

  // A friendly ghost with a smile.
  ghost(p) {
    const top = [0.2, 0.9, 0.2, 0.4];
    for (let i = 1; i <= 10; i++) {
      const a = Math.PI + Math.PI * (i / 10);
      top.push(0.5 + Math.cos(a) * 0.3, 0.4 + Math.sin(a) * 0.35);
    }
    top.push(0.8, 0.9, 0.7, 0.8, 0.6, 0.9, 0.5, 0.8, 0.4, 0.9, 0.3, 0.8, 0.2, 0.9);
    p.poly(top);
    p.circle(0.4, 0.38, 0.035);
    p.circle(0.6, 0.38, 0.035);
    p.poly([0.4, 0.52, 0.45, 0.58, 0.55, 0.58, 0.6, 0.52]); // smile
  },

  // A digger scooping dirt.
  dig(p) {
    p.poly([0.08, 0.78, 0.68, 0.78, 0.68, 0.95, 0.08, 0.95, 0.08, 0.78]); // tracks
    p.poly([0.16, 0.78, 0.16, 0.48, 0.48, 0.48, 0.48, 0.78]); // cab
    p.poly([0.22, 0.54, 0.42, 0.54, 0.42, 0.68, 0.22, 0.68, 0.22, 0.54]); // window
    p.poly([0.48, 0.6, 0.74, 0.3, 0.9, 0.5]); // arm
    p.poly([0.9, 0.5, 0.98, 0.68, 0.8, 0.7, 0.9, 0.5]); // bucket
    p.circle(0.2, 0.865, 0.04);
    p.circle(0.38, 0.865, 0.04);
    p.circle(0.56, 0.865, 0.04);
  },

  // A ladybug with spots and feelers.
  bugs(p) {
    p.circle(0.5, 0.58, 0.3);
    p.line(0.5, 0.28, 0.5, 0.88);
    p.circle(0.5, 0.25, 0.09); // head
    p.line(0.46, 0.17, 0.38, 0.05); // feelers
    p.line(0.54, 0.17, 0.62, 0.05);
    p.circle(0.37, 0.5, 0.05);
    p.circle(0.63, 0.5, 0.05);
    p.circle(0.4, 0.7, 0.04);
    p.circle(0.6, 0.7, 0.04);
    p.line(0.22, 0.5, 0.1, 0.44); // legs
    p.line(0.2, 0.65, 0.08, 0.7);
    p.line(0.78, 0.5, 0.9, 0.44);
    p.line(0.8, 0.65, 0.92, 0.7);
  },
};

export const WORLD_NAMES = Object.keys(SKETCHES);

// Draw the sketch called `name`, centered at (cx, cy), fitting a `size` box.
// An unknown name draws nothing.
export function drawWorld(g, rng, name, cx, cy, size, alpha = 1) {
  const sketch = SKETCHES[name];
  if (!sketch) return;
  const x = (u) => cx + (u - 0.5) * size;
  const y = (v) => cy + (v - 0.5) * size;
  const style = {
    color: COLORS.pencil,
    width: Math.max(1.5, size / 36),
    alpha: 0.9 * alpha,
    wobble: Math.min(BOIL.wobble, size / 50), // small sketches shouldn't shake apart
  };
  const toPoints = (flat) => {
    const pts = [];
    for (let i = 0; i < flat.length; i += 2) pts.push({ x: x(flat[i]), y: y(flat[i + 1]) });
    return pts;
  };
  const pen = {
    line: (x1, y1, x2, y2) => pencilLine(g, rng, x(x1), y(y1), x(x2), y(y2), style),
    poly: (flat) => pencilPolyline(g, rng, toPoints(flat), style),
    circle: (u, v, r) => pencilCircle(g, rng, x(u), y(v), r * size, { ...style, points: 12 }),
    ellipse: (u, v, rx, ry) => pencilEllipse(g, rng, x(u), y(v), rx * size, ry * size, style),
    // A little plus-shaped twinkle.
    sparkle(u, v, r) {
      pen.line(u - r, v, u + r, v);
      pen.line(u, v - r, u, v + r);
    },
    // A wavy line across the whole box at height v.
    wave(v, height) {
      const pts = [];
      for (let i = 0; i <= 16; i++) pts.push(i / 16, v + Math.sin((i / 16) * Math.PI * 4) * height);
      pen.poly(pts);
    },
  };
  sketch(pen);
}
