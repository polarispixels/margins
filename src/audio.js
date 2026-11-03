// Sound for Margins, made entirely in code with the Web Audio API: no audio files.
//
// Browsers (phones especially) only allow sound after the player taps or presses
// a key, so the AudioContext is created on the first tap or keypress anywhere on
// the page. Until then, music asked to start just waits.
//
// Everything goes through one `master` gain node, so muting is a single switch.
// The mute setting is remembered in localStorage.
//
//   sfx.jump(), sfx.pickup(), sfx.launch(), sfx.fireball(), sfx.hit(), sfx.fanfare()
//   const music = new Music(); music.start(); music.setIntensity(1); music.stop();

import { LAUNCH } from './config.js';

const MUTE_KEY = 'margins.muted';
const VOLUME = 0.5;

let ctx = null; // the AudioContext, once unlocked
let master = null;
let muted = loadMuted();
const waiting = new Set(); // music waiting for the first tap or keypress

function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true';
  } catch {
    return false;
  }
}

// Called on the first tap or keypress: create the audio context and start any
// music that was waiting.
function unlock() {
  if (!ctx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return; // no Web Audio: the game just stays silent
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : VOLUME;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  for (const music of waiting) music.begin();
  waiting.clear();
}
for (const type of ['pointerdown', 'keydown', 'touchend']) {
  window.addEventListener(type, unlock, { passive: true });
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  try {
    localStorage.setItem(MUTE_KEY, String(muted));
  } catch {
    // Not remembered next time; still muted for now.
  }
  if (master) master.gain.setTargetAtTime(muted ? 0 : VOLUME, ctx.currentTime, 0.02);
  return muted;
}

// ---- Building blocks ----

// MIDI note number to frequency (69 = A4 = 440 Hz).
function freq(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

// Play one note: an oscillator through a gain envelope (quick attack, fade out).
function tone({ type = 'triangle', note, from, to, start = 0, length = 0.15, volume = 0.3, at }) {
  if (!ctx) return;
  const t = (at ?? ctx.currentTime) + start;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from ?? freq(note), t);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + length); // a slide
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + length + 0.02);
}

// White noise through a filter: rumbles, whooshes, and hi-hats.
let noiseBuffer = null;
function noise({ start = 0, length = 0.3, volume = 0.3, filter = 'lowpass', from = 800, to, at }) {
  if (!ctx) return;
  if (!noiseBuffer) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const t = (at ?? ctx.currentTime) + start;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;
  src.loop = true;
  const biquad = ctx.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.setValueAtTime(from, t);
  if (to) biquad.frequency.exponentialRampToValueAtTime(to, t + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  src.connect(biquad).connect(gain).connect(master);
  src.start(t);
  src.stop(t + length + 0.05);
}

// ---- Sound effects ----

export const sfx = {
  jump: () => tone({ type: 'square', from: 300, to: 600, length: 0.12, volume: 0.08 }),
  pickup: () => {
    tone({ note: 84, length: 0.1, volume: 0.2 });
    tone({ note: 91, start: 0.07, length: 0.18, volume: 0.2 });
  },
  launch: () => {
    noise({ length: 2.2, volume: 0.45, from: 200, to: 1200 }); // the rumble building up
    tone({ type: 'sawtooth', from: 60, to: 240, length: 2, volume: 0.12 });
  },
  fireball: () => noise({ length: 0.8, volume: 0.35, filter: 'bandpass', from: 2400, to: 300 }),
  hit: () => tone({ type: 'square', from: 180, to: 60, length: 0.25, volume: 0.15 }),
  fanfare: () => {
    [60, 64, 67, 72, 76, 79, 84].forEach((note, i) => tone({ note, start: i * 0.09, length: 0.3, volume: 0.18 }));
    tone({ note: 84, start: 0.7, length: 0.9, volume: 0.2 });
  },
};

// ---- Music ----

// A cheerful 4-bar loop in C major, in eighth notes. 0 is a rest.
const MELODY = [
  64, 67, 72, 67, 64, 67, 72, 76,
  74, 72, 69, 67, 69, 72, 74, 0,
  64, 67, 72, 67, 64, 67, 69, 72,
  67, 64, 62, 64, 67, 0, 60, 0,
];
// One bass note per quarter (every 2 eighths).
const BASS = [48, 43, 45, 43, 48, 41, 43, 48, 48, 43, 45, 43, 48, 41, 43, 48];

const LOOKAHEAD = 0.15; // seconds of notes scheduled ahead of time

export class Music {
  constructor() {
    this.step = 0;
    this.intensity = 0; // 0: melody and bass; 1: plus hi-hats; 2: plus faster tempo
    this.timer = null;
  }

  start() {
    if (ctx) this.begin();
    else waiting.add(this);
  }

  // Schedule notes a little ahead, every 25 ms. (Scheduling ahead on the audio
  // clock keeps the rhythm steady even if the game stutters.)
  begin() {
    if (this.timer) return;
    this.nextTime = ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), 25);
  }

  setIntensity(level) {
    this.intensity = level;
  }

  stop() {
    waiting.delete(this);
    clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    const tempo = LAUNCH.musicTempo * (this.intensity >= 2 ? 1.2 : 1);
    const eighth = 60 / tempo / 2;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      const at = this.nextTime;
      const i = this.step % MELODY.length;
      if (MELODY[i]) tone({ note: MELODY[i], length: eighth * 0.9, volume: 0.12, at });
      if (i % 2 === 0) tone({ type: 'square', note: BASS[i / 2], length: eighth * 1.6, volume: 0.05, at });
      if (this.intensity >= 1 && i % 2 === 1) noise({ length: 0.04, volume: 0.06, filter: 'highpass', from: 7000, at });
      this.nextTime += eighth;
      this.step++;
    }
  }
}
