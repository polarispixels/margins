// Platforms (segments of the ruled lines) and the margin wall.
// Each one gets an invisible static physics body plus a boiling pencil trace.

import { HEIGHT, COLORS, PAPER } from '../config.js';
import { LEVEL, lineY } from '../level.js';
import { boilRng, pencilLine } from '../pencil.js';

const PLATFORM_THICKNESS = 10; // physics body thickness below the line
const WALL_THICKNESS = 10;

export class Platforms {
  constructor(scene) {
    this.scene = scene;
    this.graphics = scene.add.graphics();

    // A static group holds bodies that never move. The player collides with it.
    this.group = scene.physics.add.staticGroup();

    this.segments = [
      { ...LEVEL.floor, oneWay: false },
      ...LEVEL.platforms.map((p) => ({ ...p, oneWay: true })),
    ];

    for (const seg of this.segments) {
      const y = lineY(seg.line);
      const width = seg.to - seg.from;
      // A Zone is an invisible rectangle; perfect for a physics-only object.
      const zone = scene.add.zone(seg.from + width / 2, y + PLATFORM_THICKNESS / 2, width, PLATFORM_THICKNESS);
      this.group.add(zone);

      if (seg.oneWay) {
        // Only the top surface is solid, so you can jump up through from below.
        zone.body.checkCollision.down = false;
        zone.body.checkCollision.left = false;
        zone.body.checkCollision.right = false;
      }
    }

    // The red margin line is a wall. Its body sits just left of the line,
    // so the stick figure's body stops right at the line.
    const wall = scene.add.zone(PAPER.marginX - WALL_THICKNESS / 2, HEIGHT / 2, WALL_THICKNESS, HEIGHT);
    this.group.add(wall);
  }

  // Redraw the pencil traces. Called every frame; the wobble only changes on boil ticks.
  draw(time) {
    const g = this.graphics;
    g.clear();

    this.segments.forEach((seg, i) => {
      const rng = boilRng(time, 100 + i);
      const y = lineY(seg.line);
      pencilLine(g, rng, seg.from, y, seg.to, y, { color: COLORS.pencil, width: 3 });
      // Little end ticks make the segments read as "drawn in" platforms.
      if (seg.oneWay) {
        pencilLine(g, rng, seg.from, y - 4, seg.from, y + 5, { color: COLORS.pencil, width: 2, wobble: 0.8 });
        pencilLine(g, rng, seg.to, y - 4, seg.to, y + 5, { color: COLORS.pencil, width: 2, wobble: 0.8 });
      }
    });
  }
}
