// Every tunable number and color in one place. Tweak these to change the feel.

// The level is designed for this area, which is always fully visible (16:9 landscape).
// Screens of other shapes see extra page beyond it; see GameScene.fitToScreen().
export const WIDTH = 960;
export const HEIGHT = 540;

// The paper (and the floor) is drawn this wide so even very wide screens are covered.
export const PAGE_MAX_WIDTH = 2400;

export const COLORS = {
  desk: 0x5b4a3a,
  paper: 0xf7f3e8,
  ruledLine: 0x9cc3e6,
  margin: 0xe08080,
  hole: 0x5b4a3a,
  holeShadow: 0xd8d2c2,
  pencil: 0x3a3a3a,
  coffee: 0x8a5a2b,
};

// Notebook paper layout.
export const PAPER = {
  firstLineY: 72, // y of the top ruled line (the header space sits above it)
  lineSpacing: 36, // distance between ruled lines
  marginX: 110, // x of the red margin line (also the left wall)
  holeX: 50,
  holeRadius: 14,
  holeYs: [110, 270, 430],
};

// The "boil": how often the wobble re-rolls, and how strong it is.
export const BOIL = {
  intervalMs: 110, // ~9 redraws per second, flipbook speed
  wobble: 1.4, // pixels of jitter for most lines
};

export const PLAYER = {
  startX: 180,
  startY: 400,
  bodyWidth: 20,
  bodyHeight: 60,
  runSpeed: 240, // px per second
  jumpSpeed: 620, // initial upward velocity
  gravity: 1400,
  lineWidth: 3,
};

export const TOUCH = {
  buttonRadius: 46,
  alpha: 0.55,
};
