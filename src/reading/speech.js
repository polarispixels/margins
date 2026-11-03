// Tap-to-hear, with the browser's built-in speech (speechSynthesis). If the
// browser has no speech, canSpeak() is false and the speaker button isn't shown.

import { READ } from '../config.js';

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Say a word out loud. Words are stored in capitals, which some voices spell out
// letter by letter, so it's spoken in lowercase.
export function say(word) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel(); // a new tap interrupts the last one
  const utterance = new SpeechSynthesisUtterance(word.toLowerCase());
  utterance.rate = READ.speechRate;
  const voice = synth.getVoices().find((v) => v.lang?.startsWith('en'));
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang ?? 'en-US';
  synth.speak(utterance);
}
