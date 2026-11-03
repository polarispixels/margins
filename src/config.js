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
  // Colored pencils: Launch's puzzle switches. Color means something you read.
  red: 0xd8473f,
  blue: 0x3a6fd8,
  green: 0x3c9a4c,
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
  airSteer: 60, // after a fling (letting go of a rope), arrows only nudge you this much
  lineWidth: 3,
  climbSpeed: 170, // px per second up or down a ladder
  landingSnap: 40, // within this many px of a landing, a sideways press steps off the ladder (strips are 252px apart)
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
  // `word` is written on screen when the milestone is crossed (keep it readable for an early reader).
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
// Smaller layout details (where each lily pad sits, etc.) live at the top of
// the file that uses them.
export const LAUNCH = {
  length: 13100, // the whole level; the city is at the end
  startX: 170,
  // Falling in or getting caught puts you back at the last flag you passed.
  checkpoints: [170, 1300, 2300, 3700, 7750],

  // ---- Forest ----
  logs: [650, 1100, 2150, 6600, 7350], // left edges of logs to jump over
  critterScare: 170, // squirrels and birds react when the figure gets this close

  // ---- Rope swings over a ravine ----
  ravine: { from: 1400, to: 1900 },
  ropes: [1520, 1745], // x of each rope's knot on the branch
  ropeTop: 204, // world y of the branch the ropes hang from
  ropeLength: 200,
  ropePump: 2.4, // rad/s² added while holding the way you're swinging
  ropeMaxAngle: 1.1, // radians from straight down
  ropeDamping: 0.12, // free ropes slowly settle
  ropeReleaseBoost: 160, // extra upward speed when you let go

  // ---- River ----
  river: { from: 2400, to: 3620 },
  padSinkDelay: 0.6, // seconds standing on a sinking pad before it wobbles...
  padWobble: 0.5, // ...seconds of wobbling before it sinks...
  padSinkSpeed: 60, // ...px per second down...
  padResurface: 2.5, // ...and seconds under water before it floats back up
  gatorSnap: 1.2, // seconds per jaw snap (open and shut)
  fishEvery: 3, // seconds between fish leaps
  fishAir: 1.1, // seconds a leap takes
  fishHeight: 170, // how high it leaps
  driftSeconds: 4.5, // the drifting log's trip there and back

  // ---- UFO chase ----
  ufoStart: 3800, // the UFO arrives when the figure gets here
  ufoHeight: 150, // world y the UFO hovers at
  fallingTrees: [4250, 5500, 7050], // trees the UFO knocks down (x of the trunk)
  treeTrigger: 520, // a tree is knocked down when the figure is this far from it
  searchlights: [4700, 5950], // where the UFO stops and sweeps its beam
  beamSweep: 0.5, // radians each way
  beamPeriod: 3.2, // seconds for a full sweep there and back
  beamWidth: 45, // half-width of the beam where it meets the ground
  beamRise: 80, // px per second you float up when caught
  beamMashDrop: 22, // px each jump press pulls you back down
  beamMashNeeded: 7, // presses to break free
  beamCooldown: 1.5, // seconds the beam stays off after you escape
  alienAt: 6350, // the alien hops out when the figure gets here
  alienSpeed: 205, // a little slower than you run
  alienMaxBehind: 420, // it never falls further behind than this
  zapEvery: 1.8, // seconds between zaps
  zapWarning: 0.45, // seconds of sparkling antennae before each zap
  zapSpeed: 520,
  zapKnockback: 140,
  stunSeconds: 1, // how long a zap, goo, or the fireball stuns you

  // ---- Launch pad puzzle ----
  padArea: 7750, // the alien leaves and the puzzle begins here
  rocketX: 8200, // the rocket on its launch pad
  switches: { red: 7960, blue: 8305, green: 8520 }, // x of each colored button
  clueX: 7860, // the signpost with the clue
  padWall: 8660, // a fence at the end of the pad
  ufoDropEvery: 2.8, // seconds between goo drops over the pad
  ufoWarning: 0.6, // seconds of warning rays before a drop
  gooGravity: 700,

  // ---- Flight, fireball, city ----
  countdownStep: 0.6, // seconds per "3", "2", "1", "GO!"
  flightSpeed: 300, // the rocket flies right on its own at this speed
  flightSteer: 280, // up/down speed while flying
  flightTop: 70, // world y limits for the rocket
  flightBottom: 470,
  finaleX: 8950, // the fireball arrives when the rocket gets here
  cityX: 12300, // the skyline starts here
  landX: 12600, // where the rocket lands
  fireballLunges: 3, // how many times the fireball lunges before the city
  fireballTrack: 1.0, // seconds following the rocket's height between lunges
  fireballAim: 0.8, // seconds showing the dashed line before a lunge
  fireballLungeSpeed: 950, // px per second faster than the rocket
  fireballRadius: 22,

  parallaxFar: 0.3, // background trees and clouds scroll at this fraction of the camera...
  parallaxNear: 0.6, // ...and the nearer row at this one
  musicTempo: 120, // beats per minute (the finale plays faster)
};

// Read: the reading game. Every engine threshold lives here (see
// docs/reading-framework.md and the Read spec). Scores are 0..100 per word.
export const READ = {
  roundLength: 10, // words per round
  speechRate: 0.8, // tap-to-hear speaks a little slowly
  danceMs: 1300, // the stick figure's celebration dance after a right answer...
  danceLongMs: 2400, // ...a longer one for a hard-won answer (and at the end of a round)
  afterDanceMs: 250, // then the next word comes after this pause

  // Scores: how a word's score changes after an answer.
  score: {
    correct: 12, // right on the first try...
    fastBonus: 8, // ...plus this when it was quick (fluency)...
    fastMs: 3000, // ...under this many ms
    slowMs: 8000, // slower than this: only half the points
    hinted: 4, // right after tapping the speaker: a partial correct
    miss: -15, // wrong on the first try
  },

  // Mastery: a word is mastered when all three are true.
  mastery: {
    score: 80,
    days: 3, // right on at least this many different days
    puzzleTypes: 2, // right in at least this many puzzle types (only as many as exist)
    skillShare: 0.8, // a skill is mastered when this share of its words are
  },

  // The next level opens when this share of the current level's words reach this score.
  unlock: { score: 70, share: 0.8 },

  // Placement warm-up, the first time on a device.
  placement: {
    startLevel: 2,
    upAfter: 2, // right answers in a row to step up a level
    downAfter: 2, // misses at a level to step down (a mis-tap shouldn't decide it)
    maxQuestions: 8,
    distractorStep: 2,
    dialStep: 1, // where the dial starts afterwards (an easy step)
    creditScore: 50, // words at levels he passed start with this score, so he isn't held back
  },

  // Each round: stretch words from the next level up, and spaced review.
  round: { stretch: 1, stretchHigh: 2, stretchHighFromStep: 3 },
  review: { intervalsDays: [1, 3, 7, 14], maxPerRound: 2 },

  // Tap-to-hear fades as a word's score rises: shown, then hidden (small and faint), then removed.
  hints: { showBelow: 40, removeAbove: 70 },

  // The difficulty dial: steps from easiest to hardest. `distractors` is the
  // three-step rule (1 different words, 2 shared letters, 3 one sound apart).
  dial: {
    steps: [
      { distractors: 1, choices: 3 },
      { distractors: 2, choices: 3 },
      { distractors: 3, choices: 3 },
      { distractors: 3, choices: 4 },
      { distractors: 3, choices: 5 },
    ],
    window: 15, // rolling success rate over (up to) this many answers...
    cooldown: 8, // ...given since the last move, once there are this many
    raiseAbove: 0.9, // harder above this (target is about 0.85)
    easeBelow: 0.75, // easier below this
    missesForEasyWin: 2, // this many misses in a row → an easy win right away
    activeStart: 6, // learning words in play at once...
    activeGrow: 2, // ...and how many more when the dial is at the top and it's still easy
  },

  // Miss patterns: older misses count for less (each new miss multiplies the old by this).
  patterns: { decay: 0.9, minToSteer: 2, boost: 2 },
};

// The newspaper home page: strips of panels on one tall sheet. Line numbers count
// ruled lines; the rest are pixels.
export const HOME = {
  firstTitleLine: 2,    // ruled line the first strip's title sits on
  stripLines: 7,        // ruled lines from one strip's title to the next
  floorOffsetLines: 6,  // floor line = title line + this
  contentLeft: 140,     // panels span contentLeft..contentRight
  contentRight: 940,
  gutter: 16,           // space between panels
  panelGapBelowTitle: 8,
  headroom: 18,         // space between his head and the panel's bottom edge
  ladderX: 84,
  ladderWidth: 32,
  mastheadTop: 10,
  bottomLines: 2,       // blank ruled lines under the last floor
};
