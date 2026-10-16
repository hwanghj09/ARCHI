import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = 'assets/objects/floor07/';
const info = await sharp(`${root}source/interface-chair.png`).trim().resize({ width: 256 })
  .png().toFile(`${root}interface-chair.png`);
assert.deepEqual([info.width, info.height, info.channels], [256, 451, 4], 'Chair size and alpha match the room placement');
const { channels } = await sharp(`${root}interface-chair.png`).stats();
assert.equal(channels[3].min, 0, 'The surrounding background stays transparent');
assert.equal(channels[3].max, 255, 'The chair remains opaque');
console.log('Prepared transparent 7F interface chair (256x451).');
