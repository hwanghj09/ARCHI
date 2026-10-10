import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

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

// B1 CCTV 모니터 벽 조사 그림: 그림 파일이 있을 때만 image 줄이 켜져 있어야 한다(없으면 LCD 글자 화면, 깨진 그림 없음).
const floorB1 = await readFile('js/floors/floor-b1.js', 'utf8');
await readFile('assets/objects/b1/cctv-wall-screen.md');
const cctvArt = await stat('assets/objects/b1/cctv-wall-screen.png').then(() => true, () => false);
assert(floorB1.includes("// image: 'assets/objects/b1/cctv-wall-screen.png'") || cctvArt, 'The CCTV wall keeps its pending image line');
assert.equal(/^\s*image: 'assets\/objects\/b1\/cctv-wall-screen\.png'/m.test(floorB1), cctvArt,
  cctvArt ? 'cctv-wall-screen.png exists, so uncomment its image line in floor-b1.js' : 'Do not enable the CCTV wall image before the PNG exists');

console.log('floor-specific prop artwork tests passed');
