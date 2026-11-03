// Platforms (segments of the ruled lines) and the margin wall.
// Each one gets an invisible static physics body plus a boiling pencil trace.
//
// A scene passes in its segments, each described by which ruled line it sits on:
//   { line: 12, from: 110, to: 960 }                 a solid floor
//   { line: 9, from: 190, to: 360, oneWay: true }    jump up through it from below
// A segment can also have `drawnTo` (an x position): the pencil trace is only drawn
// up to there. GettingStartedScene uses that to "draw" the floor as you walk.

import { HEIGHT, COLORS, PAPER } from '../config.js';
import { lineY } from './Paper.js';
import { boilRng, pencilLine } from '../pencil.js';

const PLATFORM_THICKNESS = 10; // physics body thickness below the line
const WALL_THICKNESS = 10;

export class Platforms {
  constructor(scene, segments, { wall = true } = {}) {
    this.scene = scene;
    this.graphics = scene.add.graphics();

    // A static group holds bodies that never move. The player collides with it.
    this.group = scene.physics.add.staticGroup();

    this.segments = segments;

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
    // so the stick figure's body stops right at the line. It runs from well above
    // the page top (for tall screens) down to the bottom.
    // Pass { wall: false } where the margin is walkable (the comic page).
    if (wall) {
      const wallZone = scene.add.zone(PAPER.marginX - WALL_THICKNESS / 2, 0, WALL_THICKNESS, HEIGHT * 2);
      this.group.add(wallZone);
    }
  }

  // Add an invisible solid box (solid on every side), e.g. a letter you can stand on.
  // (x, y) is the top-left corner.
  addSolid(x, y, width, height) {
    const zone = this.scene.add.zone(x + width / 2, y + height / 2, width, height);
    this.group.add(zone);
    return zone;
  }

  // Redraw the pencil traces. Called every frame; the wobble only changes on boil ticks.
  draw(time) {
    const g = this.graphics;
    g.clear();

    this.segments.forEach((seg, i) => {
      const rng = boilRng(time, 100 + i);
      const y = lineY(seg.line);
      const end = Math.min(seg.to, seg.drawnTo ?? seg.to);
      if (end <= seg.from) return; // nothing drawn yet
      pencilLine(g, rng, seg.from, y, end, y, { color: COLORS.pencil, width: 3 });
      // Little end ticks make the segments read as "drawn in" platforms.
      if (seg.oneWay) {
        pencilLine(g, rng, seg.from, y - 4, seg.from, y + 5, { color: COLORS.pencil, width: 2, wobble: 0.8 });
        pencilLine(g, rng, seg.to, y - 4, seg.to, y + 5, { color: COLORS.pencil, width: 2, wobble: 0.8 });
      }
    });
  }
}
