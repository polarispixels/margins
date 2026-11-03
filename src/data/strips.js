// The home page's content: strips of panels. Plain data, no Phaser, so it loads in Node.
// open = playable; locked = a word and a picture that aren't playable yet; empty = blank space.
const open = (id, word, scene, extra = {}) => ({ kind: 'open', id, word, art: id, scene, ...extra });
const locked = (word) => ({ kind: 'locked', word, art: word.toLowerCase() });
const empty = () => ({ kind: 'empty' });

export const STRIPS = [
  {
    title: 'GETTING STARTED',
    panels: [open('getting-started', 'WALK', 'GettingStarted'), locked('LADDER'), locked('ROPE')],
  },
  { title: 'LAUNCH', panels: [open('launch', 'LAUNCH', 'Launch', { wide: true })] },
  { title: 'CLIMB', panels: [open('climb', 'CLIMB', 'Climb'), empty(), empty()] },
  { title: 'READ', panels: [open('read', 'READ', 'Read'), empty(), empty()] },
  { title: '', panels: [locked('FLY'), locked('FARM'), locked('SEA')] },
  { title: '', panels: [locked('JUNGLE'), locked('SPACE'), locked('ICE')] },
  { title: '', panels: [locked('DINO'), locked('CITY'), locked('CANDY')] },
];
