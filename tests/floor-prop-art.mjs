import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const expected = {
  'js/floors/floor-11.js': ['sales-kpi-board', 'trophy-cabinet', 'sales-desk', 'floor-emergency-cabinet', 'strategy-board', 'boardroom-table', 'brochure-rack', 'materials-desk'],
  'js/floors/floor-13.js': ['dispatch-board', 'training-slide-board'],
  'js/floors/floor-14.js': ['patent-display-cabinet', 'records-cabinet', 'labeling-board', 'experiment-table'],
  'js/floors/floor-15.js': ['research-news-board'],
  'js/floors/floor-16.js': ['food-kitchen-board', 'food-shutter-panel', 'food-cafe-table', 'food-voice-board'],
};

for (const [file, assets] of Object.entries(expected)) {
  const source = await readFile(file, 'utf8');
  for (const asset of assets) {
    assert(source.includes(`file: '${asset}'`), `${file} should use ${asset}.png`);
    await readFile(`assets/objects/floor-kit/${asset}.png`);
  }
}

const floor11 = await readFile('js/floors/floor-11.js', 'utf8');
assert(floor11.includes("sprite: 'assets/objects/floor11/fire-shutter-states.png'"));
await readFile('assets/objects/floor11/fire-shutter-states.png');

// B1 CCTV 그림은 불투명 16:9 PNG이며 단서는 caption에 남긴다.
const floorB1 = await readFile('js/floors/floor-b1.js', 'utf8');
await readFile('assets/objects/b1/PROMPT.md');
const cctvArt = await readFile('assets/objects/b1/cctv-wall-screen.png');
assert.deepEqual([cctvArt.readUInt32BE(16), cctvArt.readUInt32BE(20), cctvArt[25]], [1536, 864, 2]);
assert(/^\s*image: 'assets\/objects\/b1\/cctv-wall-screen\.png'/m.test(floorB1));

console.log('floor-specific prop artwork tests passed');
