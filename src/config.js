// Every tunable number and color in one place. Tweak these to change the feel.

// The level is designed for this area, which is always fully visible (16:9 landscape).
// Screens of other shapes see extra page beyond it; see screen.js.
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
  bodyWidth: 20,
  bodyHeight: 60,
  runSpeed: 240, // px per second
  jumpSpeed: 620, // initial upward velocity
  // Jump feel. Timers are in milliseconds.
  coyoteTimeMs: 100, // grace window to still jump just after walking off a ledge
  jumpBufferMs: 120, // a jump pressed this long before landing fires on landing
  jumpCutMultiplier: 0.5, // releasing jump while rising multiplies upward speed by this (1 = off)
  gravity: 1400,
  lineWidth: 3,
};

export const TOUCH = {
  buttonRadius: 46,
  alpha: 0.55,
};

// Climb mode: an endless vertical bouncer, played in portrait.
export const CLIMB = {
  width: 540, // portrait design area, always fully visible
  height: 960,
  marginX: 50, // red margin line, also the left wall
  bounceSpeed: 720, // upward speed after landing on a platform (~5 ruled lines high)
  springSpeed: 1350, // upward speed from a springboard (~18 ruled lines high)
  steerSpeed: 280, // left/right speed in px per second
  minGapLines: 1, // each new platform is this many ruled lines above the last, at least...
  maxGapLines: 4, // ...and at most (keep below the bounce height so it's reachable)
  platformMinWidth: 70,
  platformMaxWidth: 130,
  maxSideStep: 200, // max sideways distance between one platform's center and the next
  springChance: 0.1, // chance a platform has a springboard
  tokenChance: 0.3, // chance a platform has a star above it
  tokenValue: 10, // points per star (each ruled line climbed is 1 point)
  cameraLead: 0.4, // keep the figure this far down the screen (0 = top, 1 = bottom) while climbing
};
