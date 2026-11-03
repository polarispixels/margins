// Squirrels and birds in Launch's forest. They're just for fun: harmless, and
// they react when the stick figure runs past. Squirrels dash to their tree and
// run up into the leaves; birds flap away up and to the right.

import { LAUNCH } from '../config.js';
import { drawTree } from './launchArt.js';
import { drawSquirrel, drawBird } from './forestArt.js';

// Trees a squirrel lives in (x of the trunk) and how tall each tree is.
const SQUIRREL_TREES = [[520, 250], [1210, 270], [2280, 240], [3800, 260]];
// Flocks: [x, how many birds].
const FLOCKS = [[880, 3], [1290, 2], [2060, 4], [3720, 3]];

export class Critters {
  constructor(floorY) {
    this.floorY = floorY;
    this.squirrels = SQUIRREL_TREES.map(([tree, height], i) => ({
      tree, height, x: tree + 46, y: floorY, state: 'sit', phase: i * 1.7,
    }));
    this.birds = FLOCKS.flatMap(([x, count]) => Array.from({ length: count }, (_, i) => ({
      x: x + i * 24, y: floorY, state: 'ground', vx: 0, vy: 0, phase: i * 2.3, facing: i % 2 ? 1 : -1,
    })));
  }

  // `px` is the stick figure's x. Returns true on the frame a flock takes off (for a sound).
  update(dt, px) {
    let flutter = false;
    for (const s of this.squirrels) {
      s.phase += dt * 14;
      if (s.state === 'sit' && Math.abs(px - s.x) < LAUNCH.critterScare) s.state = 'run';
      if (s.state === 'run') {
        s.x -= 240 * dt; // to the trunk...
        if (s.x <= s.tree + 6) Object.assign(s, { x: s.tree + 6, state: 'climb' });
      } else if (s.state === 'climb') {
        s.y -= 180 * dt; // ...and up into the leaves
        if (s.y < this.floorY - s.height * 0.6) s.state = 'hidden';
      }
    }
    for (const b of this.birds) {
      b.phase += dt * 10;
      if (b.state === 'ground' && Math.abs(px - b.x) < LAUNCH.critterScare + 30) {
        Object.assign(b, { state: 'flying', vx: 120 + Math.random() * 120, vy: -200 - Math.random() * 100, facing: 1 });
        flutter = true;
      }
      if (b.state === 'flying') {
        b.vy -= 60 * dt; // climbing faster as they go
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.y < -600) b.state = 'gone';
      }
    }
    return flutter;
  }

  // Trees first (behind), then squirrels and birds.
  draw(g, rng, visible) {
    for (const s of this.squirrels) {
      if (!visible(s.tree)) continue;
      drawTree(g, rng, s.tree, this.floorY, s.height);
      if (s.state === 'hidden') continue;
      // Sitting and running face left (toward the trunk); climbing, the trunk is on its left.
      drawSquirrel(g, rng, s.x, s.y, -1, s.state === 'climb' ? 'climb' : s.state, s.phase);
    }
    for (const b of this.birds) {
      if (b.state !== 'gone' && visible(b.x)) drawBird(g, rng, b.x, b.y, b.facing, b.state === 'flying', b.phase);
    }
  }
}
