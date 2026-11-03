import test from 'node:test';
import assert from 'node:assert/strict';
import { STRIPS } from '../src/data/strips.js';
import { layoutPage } from '../src/home/pageLayout.js';
import { lineY } from '../src/objects/Paper.js';

const layout = layoutPage(STRIPS);

test('strips data', () => {
  assert.equal(STRIPS.length, 7);
  assert.deepEqual(STRIPS.map((s) => s.title), ['GETTING STARTED', 'LAUNCH', 'CLIMB', 'READ', '', '', '']);
  assert.deepEqual(STRIPS[0].panels.map((p) => p.word), ['WALK', 'LADDER', 'ROPE']);
  assert.deepEqual(STRIPS[0].panels.map((p) => p.kind), ['open', 'locked', 'locked']);
  const lockedWords = STRIPS.slice(4).flatMap((s) => s.panels.map((p) => p.word));
  assert.deepEqual(lockedWords, ['FLY', 'FARM', 'SEA', 'JUNGLE', 'SPACE', 'ICE', 'DINO', 'CITY', 'CANDY']);
  for (const i of [2, 3]) {
    assert.deepEqual(STRIPS[i].panels.map((p) => p.kind), ['open', 'empty', 'empty']);
  }
});

test('floors sit on ruled lines', () => {
  assert.equal(layout.strips[0].floorLine, 8);
  assert.equal(layout.strips[1].floorLine, 15);
  for (const s of layout.strips) assert.equal(s.floorY, lineY(s.floorLine));
});

test('panels sit just above his head', () => {
  for (const s of layout.strips) {
    for (const p of s.panels) {
      assert.equal(p.y + p.height, s.floorY - 60 - 18);
      assert.equal(p.y, s.titleY + 8);
    }
  }
});

test('widths', () => {
  const w = (800 - 2 * 16) / 3;
  const row = layout.strips[0].panels;
  for (const p of row) assert.equal(p.width, w);
  assert.equal(row[0].x, 140);
  const launch = layout.strips[1].panels[0];
  assert.equal(launch.x, 140);
  assert.equal(launch.width, 800);
});

test('ladder', () => {
  const { ladder } = layout;
  assert.equal(ladder.x, 84);
  assert.equal(ladder.landings.length, 7);
  assert.deepEqual(ladder.landings, layout.strips.map((s) => s.floorY));
  assert.equal(ladder.top, ladder.landings[0]);
  assert.equal(ladder.bottom, ladder.landings[6]);
});

test('pageHeight', () => {
  assert.equal(layout.pageHeight, layout.strips[6].floorY + 72);
});

test('masthead is above the first strip title', () => {
  const m = layout.masthead;
  assert.ok(m.y + m.height < layout.strips[0].titleY - 30);
});
