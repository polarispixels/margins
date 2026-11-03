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
  ink: 0x1f2a44, // ink blots: the first thing in Climb that isn't pencil, so it means danger
  fire: 0xf0a040, // a warm fill under pencil lines for fire (rocket flame, fireball, fireworks)
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

// Climb mode: an endless vertical platformer, played in portrait. Walking and
// jumping use the normal PLAYER settings (jump speed, jump feel, gravity).
export const CLIMB = {
  width: 540, // portrait design area, always fully visible
  height: 960,
  marginX: 50, // red margin line, also the left wall
  walkSpeed: 260, // left/right speed in px per second
  cameraLead: 0.4, // keep the figure this far down the screen (0 = top, 1 = bottom) while climbing

  springSpeed: 1350, // coil spring launch (~18 ruled lines high)
  paperclipSpeed: 1800, // paperclip launch (~32 ruled lines high)
  stompSpeed: 650, // bounce after splatting an ink blot
  airplaneSpeed: 480, // steady climbing speed while flying a paper airplane
  airplaneSeconds: 3, // how long a flight lasts

  // Hard limits so every platform stays reachable with a held jump (~3.8 lines
  // high, ~168 px sideways on a 3-line jump), however the table below is edited.
  reach: { maxGapLines: 3, maxSideStep: 170 },

  // Difficulty by height, in ruled lines climbed. Each entry lists only what
  // changes at that height; everything else carries forward from the entry before.
  // `word` is written on screen when the milestone is crossed (keep it Jack-readable).
  milestones: [
    {
      at: 0,
      platformMinWidth: 90, platformMaxWidth: 150, // px
      maxGapLines: 2, maxSideStep: 140, // ruled lines up / px sideways between platforms
      starChance: 0.35, starValue: 10, // chance a platform has a star; points per star
      springChance: 0, paperclipChance: 0, // chance of a coil spring / paperclip
      blotChance: 0, blotSpeed: 0, blotValue: 25, blotChases: false, // ink blots
      airplaneChance: 0, // chance of a paper airplane pickup
    },
    { at: 100, word: 'GO!', starChance: 0.45, springChance: 0.08, maxGapLines: 3, maxSideStep: 160 },
    { at: 200, word: 'LOOK OUT!', blotChance: 0.12, blotSpeed: 35, paperclipChance: 0.03, platformMaxWidth: 140 },
    {
      at: 500, word: 'UP!',
      airplaneChance: 0.03, blotChance: 0.18, blotSpeed: 50,
      starValue: 20, blotValue: 50, platformMinWidth: 80, platformMaxWidth: 130,
    },
    {
      at: 1000, word: 'DANGER',
      blotChance: 0.24, blotSpeed: 70, blotChases: true,
      starValue: 30, blotValue: 75, platformMinWidth: 65, platformMaxWidth: 115, maxSideStep: 170,
    },
  ],

  // Past the last milestone, every `every` lines: add `step` to these settings
  // (clamped to `limits`) and announce `word`. The climb never stops getting harder.
  beyond: {
    every: 500,
    word: 'HURRY!',
    step: { blotChance: 0.02, blotSpeed: 10, starValue: 5, blotValue: 10, platformMinWidth: -3, platformMaxWidth: -5 },
    limits: {
      blotChance: [0, 0.45], blotSpeed: [0, 170],
      platformMinWidth: [46, 999], platformMaxWidth: [64, 999],
      starValue: [0, 500], blotValue: [0, 1000],
    },
  },
};

// Launch: the side-scrolling rocket level. Positions are world x in pixels.
export const LAUNCH = {
  length: 8400, // the whole level; the city is at the end
  forestEnd: 2600,
  ufoStart: 1300, // the UFO arrives when the figure gets here...
  ufoEnd: 3300, // ...and zooms away here
  rocketX: 3600, // the rocket on its launch pad
  finaleX: 5200, // the fireball arrives when the rocket gets here
  cityX: 7600, // the skyline starts here
  landX: 7900, // where the rocket lands

  parallaxFar: 0.3, // background trees and clouds scroll at this fraction of the camera...
  parallaxNear: 0.6, // ...and the nearer row at this one

  ufoHeight: 150, // world y the UFO hovers at
  ufoDropEvery: 1.7, // seconds between goo drops
  ufoWarning: 0.5, // seconds of warning rays before a drop
  gooGravity: 700,
  stunSeconds: 1, // how long a hit stuns the figure or the rocket (no game over)

  countdownStep: 0.6, // seconds per "3", "2", "1", "GO!"
  flightSpeed: 300, // the rocket flies right on its own at this speed
  flightSteer: 280, // up/down speed while flying
  flightTop: 70, // world y limits for the rocket
  flightBottom: 470,

  fireballLunges: 3, // how many times the fireball lunges before the city
  fireballTrack: 1.4, // seconds following the rocket's height between lunges
  fireballAim: 0.8, // seconds showing the dashed line before a lunge
  fireballLungeSpeed: 950, // px per second faster than the rocket
  fireballRadius: 22,

  musicTempo: 120, // beats per minute (the finale plays faster)
};
