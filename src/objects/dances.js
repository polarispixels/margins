// Celebration dances for the stick figure (Read plays one after a right answer).
//
// A dance is a pose function: pose(t, p) -> how to bend the figure at a moment.
//   t: seconds since the dance started (for beats)
//   p: 0..1, how far through the dance (for a finishing move)
// A pose can set any of these (anything left out stays at its resting value):
//   legA, legB, armA, armB  limb angles in radians from straight down;
//                           positive swings toward the way he's facing
//   hip     slides the hips sideways (px)
//   lean    tips the neck and head sideways from the hips (px)
//   slide   moves the whole figure sideways (px)
//   bob     moves the whole figure up (px); a crouch is negative, with
//           bentLegs() so the feet stay on the floor
//   turn    1 = facing normally, -1 = turned around, 0 = side-on (a spin)
//
// Adding a dance is just adding an entry here.

const TAU = Math.PI * 2;
const wave = (t, perSecond) => Math.sin(t * TAU * perSecond);

// Legs that reach the floor when the hips are lowered by `down` px: the lower
// the hips, the wider the legs (hip height 26, leg length 27, see StickFigure).
const bentLegs = (down) => Math.acos(Math.min(1, (26 - down) / 27));

export const DANCES = {
  // Both arms in the air, hips swaying side to side.
  wiggle: (t) => {
    const s = wave(t, 2);
    return { armA: 2.35 + s * 0.2, armB: -2.35 + s * 0.2, hip: s * 5, lean: -s * 3, legA: 0.28, legB: -0.28 };
  },

  // Arms out, turning left, right, then faster and faster.
  spin: (t) => ({ turn: Math.cos(TAU * (t * 0.8 + t * t * 0.9)), armA: 1.55, armB: -1.55, legA: 0.12, legB: -0.12 }),

  // Hands on hips, kicking one leg out and then the other.
  kickLine: (t) => {
    const right = Math.floor(t / 0.3) % 2 === 0;
    return { armA: 0.5, armB: -0.5, legA: right ? 1.3 : 0.1, legB: right ? -0.1 : -1.3, bob: 2 };
  },

  // One arm points up to the sky, then down at the floor; the other on the hip.
  discoPoint: (t) => {
    const up = Math.floor(t / 0.35) % 2 === 0;
    return { armA: up ? 2.35 : 0.75, armB: -0.5, hip: up ? 4 : -4, legA: 0.35, legB: -0.12 };
  },

  // Quick little steps in place, sliding left and then right.
  shuffle: (t) => {
    const step = wave(t, 3.5);
    return { legA: 0.18 + step * 0.4, legB: -0.18 - step * 0.4, armA: -step * 0.7, armB: step * 0.7, slide: wave(t, 0.8) * 12 };
  },

  // The floss: both arms swing to the same side while the hips go the other way.
  floss: (t) => {
    const s = wave(t, 2.5);
    return { armA: s * 0.75 + 0.2, armB: s * 0.75 - 0.2, hip: -s * 6, lean: s * 2, legA: 0.22, legB: -0.22 };
  },

  // The Carlton: arms swing across the body with a step each way, then one arm up to finish.
  carlton: (t, p) => {
    if (p > 0.8) return { armA: 2.4, armB: -0.3, hip: 4, legA: 0.3, legB: -0.1 };
    const s = wave(t, 1.5);
    return { armA: 0.3 + s, armB: -0.3 + s, slide: s * 6, legA: 0.2 + Math.abs(s) * 0.2, legB: -0.2 - Math.abs(s) * 0.2 };
  },

  // The funky chicken: elbows flapping like wings, knees bobbing, head poking forward.
  funkyChicken: (t) => {
    const flap = wave(t, 4) * 0.45;
    const down = (1 + wave(t, 2)) * 3;
    const legs = bentLegs(down);
    return { armA: 1.2 + flap, armB: -1.2 - flap, bob: -down, legA: legs, legB: -legs, lean: 3 + wave(t, 2) * 4 };
  },
};

const NAMES = Object.keys(DANCES);

// A random dance, never the same as the last one.
export function pickDance(last) {
  const choices = NAMES.filter((name) => name !== last);
  return choices[Math.floor(Math.random() * choices.length)];
}
