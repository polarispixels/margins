// The reading skill ladder (docs/reading-framework.md). Skills unlock in this
// order. Only levels that have words in words.js are played; the rest are here
// so new words can be added at any level later.

export const SKILLS = [
  { level: 1, skill: 'letter-sounds', name: 'Letter sounds' },
  { level: 2, skill: 'cvc-a-o', name: 'CVC words, short a and o' },
  { level: 3, skill: 'cvc-all', name: 'CVC words, all short vowels' },
  { level: 4, skill: 'sight-early', name: 'Early sight words' },
  { level: 5, skill: 'blends', name: 'Blends' },
  { level: 6, skill: 'digraphs', name: 'Digraphs' },
  { level: 7, skill: 'silent-e', name: 'Long vowels with silent e' },
  { level: 8, skill: 'two-syllable', name: 'Two-syllable words' },
  { level: 9, skill: 'sentences', name: 'Short sentences' },
];
