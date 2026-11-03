// The platforms for Climb: generated randomly above the screen as the camera
// rises, drawn in boiling pencil on the ruled lines, and removed once they're
// far below. Some platforms carry a springboard or have a star floating above.
//
// Each platform is a plain object:
//   { x, width, y, zone, spring: { x, firedAt } | null, star: { x, y, collectedAt } | null }
// `zone` is its invisible physics body, and zone.platform points back to it.

import { CLIMB, COLORS, PAPER } from '../config.js';
import { boilRng, pencilLine, pencilPolyline } from '../pencil.js';

const THICKNESS = 10; // physics body thickness below the line
const SPRING_HALF_WIDTH = 13;
const SPRING_HEIGHT = 16;
const SPRING_SQUASH_MS = 180; // how long the coil stays squashed after launching
const STAR_RADIUS = 11;
const STAR_HOVER = 40; // how far above its platform a star floats
const STAR_POP_MS = 400; // collected stars float up and fade for this long

export class ClimbCourse {
  // floorY: world y of the solid starting floor (a ruled line).
  constructor(scene, floorY) {
    this.scene = scene;
    this.group = scene.physics.add.staticGroup();
    this.graphics = scene.add.graphics();
    this.platforms = [];

    // The starting floor runs across the whole page and is solid.
    this.addPlatform(CLIMB.marginX, CLIMB.width - CLIMB.marginX, floorY, { solid: true });
    this.topY = floorY; // y of the highest platform so far
    this.lastCenter = CLIMB.width / 2;
  }

  // Make sure platforms exist all the way up to world y `y`.
  generateUpTo(y) {
    while (this.topY > y) this.addRandomPlatform();
  }

  addRandomPlatform() {
    // A few ruled lines above the last one, so it's always on a ruled line.
    const gapLines = randomInt(CLIMB.minGapLines, CLIMB.maxGapLines);
    const y = this.topY - gapLines * PAPER.lineSpacing;
    const width = randomBetween(CLIMB.platformMinWidth, CLIMB.platformMaxWidth);

    // Not too far sideways from the last one (so it's reachable), and on the page.
    const minCenter = CLIMB.marginX + width / 2 + 6;
    const maxCenter = CLIMB.width - width / 2 - 6;
    const center = clamp(this.lastCenter + randomBetween(-CLIMB.maxSideStep, CLIMB.maxSideStep), minCenter, maxCenter);
    const platform = this.addPlatform(center - width / 2, width, y);

    // Maybe a springboard, otherwise maybe a star.
    if (Math.random() < CLIMB.springChance) {
      const room = width / 2 - SPRING_HALF_WIDTH - 4;
      platform.spring = { x: center + randomBetween(-room, room), firedAt: -Infinity };
    } else if (Math.random() < CLIMB.tokenChance) {
      platform.star = { x: center, y: y - STAR_HOVER, collectedAt: null };
    }

    this.topY = y;
    this.lastCenter = center;
  }

  addPlatform(x, width, y, { solid = false } = {}) {
    const zone = this.scene.add.zone(x + width / 2, y + THICKNESS / 2, width, THICKNESS);
    this.group.add(zone);
    if (!solid) {
      // One-way: only the top is solid, so the figure bounces up through from below.
      zone.body.checkCollision.down = false;
      zone.body.checkCollision.left = false;
      zone.body.checkCollision.right = false;
    }
    const platform = { x, width, y, zone, solid, spring: null, star: null };
    zone.platform = platform;
    this.platforms.push(platform);
    return platform;
  }

  // Remove platforms below world y `y` (well off the bottom of the screen).
  removeBelow(y) {
    this.platforms = this.platforms.filter((p) => {
      if (p.y <= y) return true;
      this.group.remove(p.zone, true, true); // remove from the group and destroy
      return false;
    });
  }

  // Is the figure landing on this platform's springboard?
  isOnSpring(platform, x) {
    return platform.spring !== null && Math.abs(x - platform.spring.x) < SPRING_HALF_WIDTH + 8;
  }

  // Collect any stars the figure is touching. Returns how many it just got.
  collectStars(point, time) {
    let got = 0;
    for (const p of this.platforms) {
      const star = p.star;
      if (star && star.collectedAt === null && Math.hypot(point.x - star.x, point.y - star.y) < STAR_RADIUS + 18) {
        star.collectedAt = time;
        got++;
      }
    }
    return got;
  }

  draw(time) {
    const g = this.graphics;
    g.clear();
    const style = { color: COLORS.pencil, width: 3 };

    for (const p of this.platforms) {
      // Seed each platform's boil by its height, so it keeps its own wobble.
      const rng = boilRng(time, 1000 + Math.round(-p.y));
      const end = p.x + p.width;
      pencilLine(g, rng, p.x, p.y, end, p.y, style);
      if (!p.solid) {
        pencilLine(g, rng, p.x, p.y - 4, p.x, p.y + 5, { ...style, width: 2, wobble: 0.8 });
        pencilLine(g, rng, end, p.y - 4, end, p.y + 5, { ...style, width: 2, wobble: 0.8 });
      }
      if (p.spring) drawSpring(g, rng, p.spring.x, p.y, time - p.spring.firedAt < SPRING_SQUASH_MS);
      if (p.star) {
        const star = p.star;
        if (star.collectedAt === null) {
          const bob = Math.sin(time / 300 + star.x) * 3; // gentle floating
          drawStar(g, rng, star.x, star.y + bob, STAR_RADIUS);
        } else if (time - star.collectedAt < STAR_POP_MS) {
          const t = (time - star.collectedAt) / STAR_POP_MS;
          drawStar(g, rng, star.x, star.y - t * 30, STAR_RADIUS * (1 + t * 0.6), { alpha: 0.9 * (1 - t) });
        }
      }
    }
  }
}

// A springboard: a zigzag coil standing on the line with a plate on top.
function drawSpring(g, rng, x, lineY, squashed) {
  const height = squashed ? SPRING_HEIGHT * 0.45 : SPRING_HEIGHT;
  const top = lineY - height;
  const style = { color: COLORS.pencil, width: 2.5, wobble: 0.7 };
  const coil = [];
  const turns = 4;
  for (let i = 0; i <= turns * 2; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    coil.push({ x: x + side * (SPRING_HALF_WIDTH - 4), y: lineY - (i / (turns * 2)) * height });
  }
  pencilPolyline(g, rng, coil, style);
  pencilLine(g, rng, x - SPRING_HALF_WIDTH, top, x + SPRING_HALF_WIDTH, top, { ...style, width: 3.5 });
}

// A five-pointed doodle star. Exported for the score card.
export function drawStar(g, rng, cx, cy, radius, opts = {}) {
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const angle = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.45; // alternate outer and inner points
    points.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  pencilPolyline(g, rng, points, { color: COLORS.pencil, width: 2, wobble: 0.6, ...opts });
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
