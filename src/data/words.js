// The word library for Read. Plain data: add a word (and its picture in
// pictures.js) and the game picks it up, no code changes.
//
//   word:      the word, in capitals (Margins' pencil font)
//   level:     its rung on the skill ladder (skills.js)
//   skill:     the skill it practices
//   theme:     which biome it belongs to (farm for now; beach, jungle later)
//   picture:   the name of its drawing in pictures.js
//   looksLike: (optional) words whose pictures could be mixed up with this one;
//              they're never shown as choices together

export const WORDS = [
  // Level 2: CVC words, short a and o.
  { word: 'CAT', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'cat' },
  { word: 'HAT', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'hat', looksLike: ['CAP'] },
  { word: 'RAT', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'rat' },
  { word: 'CAN', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'can', looksLike: ['BIN', 'CUP'] },
  { word: 'PAN', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'pan' },
  { word: 'VAN', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'van' },
  { word: 'RAM', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'ram' },
  { word: 'BAG', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'bag' },
  { word: 'MAP', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'map', looksLike: ['RUG'] },
  { word: 'CAP', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'cap', looksLike: ['HAT'] },
  { word: 'DOG', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'dog', looksLike: ['PUP', 'FOX'] },
  { word: 'LOG', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'log' },
  { word: 'FOX', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'fox', looksLike: ['DOG'] },
  { word: 'BOX', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'box' },
  { word: 'POT', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'pot', looksLike: ['LID', 'TUB'] },
  { word: 'MOP', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'mop' },
  { word: 'TOP', level: 2, skill: 'cvc-a-o', theme: 'farm', picture: 'top' },

  // Level 3: CVC words, all short vowels.
  { word: 'PIG', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'pig' },
  { word: 'FIG', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'fig', looksLike: ['NUT'] },
  { word: 'BIN', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'bin', looksLike: ['CAN'] },
  { word: 'LID', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'lid', looksLike: ['POT'] },
  { word: 'HEN', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'hen' },
  { word: 'PEN', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'pen' },
  { word: 'NET', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'net' },
  { word: 'WEB', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'web' },
  { word: 'BED', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'bed' },
  { word: 'SUN', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'sun' },
  { word: 'BUG', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'bug' },
  { word: 'RUG', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'rug', looksLike: ['MAP'] },
  { word: 'MUD', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'mud' },
  { word: 'CUP', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'cup', looksLike: ['CAN'] },
  { word: 'PUP', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'pup', looksLike: ['DOG'] },
  { word: 'TUB', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'tub', looksLike: ['POT'] },
  { word: 'NUT', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'nut', looksLike: ['FIG'] },
  { word: 'HUT', level: 3, skill: 'cvc-all', theme: 'farm', picture: 'hut' },
];
