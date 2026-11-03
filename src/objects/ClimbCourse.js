// The platforms for Climb: generated randomly above the screen as the camera
// rises, drawn in boiling pencil on the ruled lines, and removed once they're
// far below. What appears on them (springs, paperclips, ink blots, airplanes,
// stars) depends on how high they are: see difficultyAt() in milestones.js.
//
// Each platform is a plain object:
//   { x, width, y, zone, solid, launcher, blot, airplane, star }
//   launcher: { kind: 'spring' | 'paperclip', x, firedAt } | null
//   blot:     { x, facing, speed, chases, value, splatAt } | null
//   airplane: { x, y, takenAt } | null
//   star:     { x, y, value, collectedAt } | null
// `zone` is its invisible physics body, and zone.platform points back to it.

import { CLIMB, COLORS, PAPER } from '../config.js';
import { boilRng, pencilLine } from '../pencil.js';
import { difficultyAt } from '../milestones.js';
import {
  drawSpring, drawPaperclip, drawStar, drawBlot, drawSplat, drawAirplane,
  SPRING_HALF_WIDTH, PAPERCLIP_HALF_WIDTH, BLOT_HALF_WIDTH, BLOT_HEIGHT,
} from './climbArt.js';

const THICKNESS = 10; // physics body thickness below the line
const SQUASH_MS = 180; // how long a launcher stays squashed after launching
const STAR_RADIUS = 11;
const HOVER = 40; // how far above its platform a pickup floats
const POP_MS = 400; // collected pickups float up and fade for this long
const SPLAT_MS = 600;
const MIN_BLOT_PLATFORM = 46; // narrower platforms are too small to crawl on (keep <= the narrowest platform limit)
const CHASE_BOOST = 1.5; // blots that chase move this much faster

export class ClimbCourse {
  // floorY: world y of the solid starting floor (a ruled line).
  constructor(scene, floorY) {
    this.scene = scene;
    this.floorY = floorY;
    this.group = scene.physics.add.staticGroup();
    this.graphics = scene.add.graphics();
    this.platforms = [];

    // The starting floor runs across the whole page and is solid.
    this.addPlatform(CLIMB.marginX, CLIMB.width - CLIMB.marginX, floorY, { solid: true });
    this.topY = floorY; // y of the highest platform so far
    this.lastCenter = CLIMB.width / 2;
  }

  // How many ruled lines above the floor a world y is.
  linesAt(y) {
    return (this.floorY - y) / PAPER.lineSpacing;
  }

  // Make sure platforms exist all the way up to world y `y`.
  generateUpTo(y) {
    while (this.topY > y) this.addRandomPlatform();
  }

  addRandomPlatform() {
    const d = difficultyAt(this.linesAt(this.topY));

    // A few ruled lines above the last one, so it's always on a ruled line.
    const y = this.topY - randomInt(1, d.maxGapLines) * PAPER.lineSpacing;
    const width = randomBetween(d.platformMinWidth, d.platformMaxWidth);

    // Not too far sideways from the last one (so it's reachable), and on the page.
    const minCenter = CLIMB.marginX + width / 2 + 6;
    const maxCenter = CLIMB.width - width / 2 - 6;
    const center = clamp(this.lastCenter + randomBetween(-d.maxSideStep, d.maxSideStep), minCenter, maxCenter);
    const platform = this.addPlatform(center - width / 2, width, y);

    // At most one thing per platform, rarest first.
    const spot = (halfWidth) => center + randomBetween(-1, 1) * Math.max(0, width / 2 - halfWidth - 4);
    if (Math.random() < d.paperclipChance) {
      platform.launcher = { kind: 'paperclip', x: spot(PAPERCLIP_HALF_WIDTH), firedAt: -Infinity };
    } else if (Math.random() < d.springChance) {
      platform.launcher = { kind: 'spring', x: spot(SPRING_HALF_WIDTH), firedAt: -Infinity };
    } else if (Math.random() < d.airplaneChance) {
      platform.airplane = { x: center, y: y - HOVER, takenAt: null };
    } else if (width >= MIN_BLOT_PLATFORM && Math.random() < d.blotChance) {
      platform.blot = {
        x: spot(BLOT_HALF_WIDTH),
        facing: Math.random() < 0.5 ? -1 : 1,
        speed: d.blotSpeed,
        chases: d.blotChases,
        value: d.blotValue,
        splatAt: null,
      };
    } else if (Math.random() < d.starChance) {
      platform.star = { x: center, y: y - HOVER, value: d.starValue, collectedAt: null };
    }

    this.topY = y;
    this.lastCenter = center;
  }

  addPlatform(x, width, y, { solid = false } = {}) {
    const zone = this.scene.add.zone(x + width / 2, y + THICKNESS / 2, width, THICKNESS);
    this.group.add(zone);
    if (!solid) {
      // One-way: only the top is solid, so the figure can jump up through from below.
      zone.body.checkCollision.down = false;
      zone.body.checkCollision.left = false;
      zone.body.checkCollision.right = false;
    }
    const platform = { x, width, y, zone, solid, launcher: null, blot: null, airplane: null, star: null };
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

  // The springboard or paperclip under x on this platform, if any.
  launcherAt(platform, x) {
    const l = platform.launcher;
    if (!l) return null;
    const half = l.kind === 'paperclip' ? PAPERCLIP_HALF_WIDTH : SPRING_HALF_WIDTH;
    return Math.abs(x - l.x) < half + 8 ? l : null;
  }

  // Move the ink blots back and forth along their platforms. Blots that chase
  // turn toward the figure, faster, when he's standing on their line.
  update(dt, body) {
    for (const p of this.platforms) {
      const blot = p.blot;
      if (!blot || blot.splatAt !== null) continue;
      let speed = blot.speed;
      const onMyLine = Math.abs(body.bottom - p.y) < 4 && body.right > p.x && body.left < p.x + p.width;
      if (blot.chases && onMyLine) {
        blot.facing = body.center.x < blot.x ? -1 : 1;
        speed *= CHASE_BOOST;
      }
      blot.x += blot.facing * speed * dt;
      const min = p.x + BLOT_HALF_WIDTH;
      const max = p.x + p.width - BLOT_HALF_WIDTH;
      if (blot.x < min || blot.x > max) {
        blot.x = clamp(blot.x, min, max);
        blot.facing *= -1; // turn around at the end of the line
      }
    }
  }

  // Is the figure touching an ink blot? Returns null, { kind: 'stomp', value }
  // (he fell onto its top: it splats), or { kind: 'hit' } (side or below: run over).
  checkBlots(body, time) {
    for (const p of this.platforms) {
      const blot = p.blot;
      if (!blot || blot.splatAt !== null) continue;
      const top = p.y - BLOT_HEIGHT;
      const touching = body.right > blot.x - BLOT_HALF_WIDTH && body.left < blot.x + BLOT_HALF_WIDTH &&
        body.bottom > top && body.top < p.y;
      if (!touching) continue;
      // Falling, with his feet near the blot's top: a stomp.
      if (body.velocity.y > 0 && body.bottom - top < 14) {
        blot.splatAt = time;
        return { kind: 'stomp', value: blot.value };
      }
      return { kind: 'hit' };
    }
    return null;
  }

  // Pick up stars and airplanes the figure is touching.
  // Returns { stars, points, airplane } for what was picked up just now.
  collectPickups(point, time) {
    const got = { stars: 0, points: 0, airplane: false };
    const near = (item) => Math.hypot(point.x - item.x, point.y - item.y) < STAR_RADIUS + 20;
    for (const p of this.platforms) {
      if (p.star && p.star.collectedAt === null && near(p.star)) {
        p.star.collectedAt = time;
        got.stars++;
        got.points += p.star.value;
      }
      if (p.airplane && p.airplane.takenAt === null && near(p.airplane)) {
        p.airplane.takenAt = time;
        got.airplane = true;
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

      const l = p.launcher;
      if (l) {
        const squashed = time - l.firedAt < SQUASH_MS;
        if (l.kind === 'spring') drawSpring(g, rng, l.x, p.y, squashed);
        else drawPaperclip(g, rng, l.x, p.y, squashed);
      }

      const blot = p.blot;
      if (blot) {
        if (blot.splatAt === null) drawBlot(g, rng, blot.x, p.y, blot.facing, time);
        else if (time - blot.splatAt < SPLAT_MS) drawSplat(g, rng, blot.x, p.y, (time - blot.splatAt) / SPLAT_MS);
      }

      // Pickups float with a gentle bob, then pop up and fade when collected.
      const bob = (item) => Math.sin(time / 300 + item.x) * 3;
      const pop = (at) => (time - at) / POP_MS;
      if (p.star) {
        const s = p.star;
        if (s.collectedAt === null) drawStar(g, rng, s.x, s.y + bob(s), STAR_RADIUS);
        else if (pop(s.collectedAt) < 1) {
          const t = pop(s.collectedAt);
          drawStar(g, rng, s.x, s.y - t * 30, STAR_RADIUS * (1 + t * 0.6), { alpha: 0.9 * (1 - t) });
        }
      }
      if (p.airplane && p.airplane.takenAt === null) {
        drawAirplane(g, rng, p.airplane.x, p.airplane.y + bob(p.airplane), 0.9);
      }
    }
  }
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
