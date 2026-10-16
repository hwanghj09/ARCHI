// Run from the repository root after replacing the generated west-wall source.
import assert from 'node:assert/strict';
import sharp from 'sharp';

const root = 'assets/background/floor1/';
const west = await sharp(`${root}source/corridor-west-unified.png`).resize(1818, 760).png().toBuffer();
// Keep the painted interactable artwork at the coordinates used by floor-01.js.
const preserved = [
  [191, 251, 261, 307], [263, 212, 110, 32],
  [617, 260, 180, 298], [1021, 295, 125, 263],
  [1318, 224, 336, 290],
];
for (const suffix of ['', '-finished']) {
  const original = `${root}corridor${suffix}.png`;
  const overlays = [{
    input: await sharp(west).extract({ left: 0, top: 100, width: 1818, height: 470 }).toBuffer(),
    left: 0, top: 100,
  }];
  // Match the existing soffit and cornice exactly at the join.
  const soffit = await sharp(original).extract({ left: 1818, top: 100, width: 1268, height: 93 }).png().toBuffer();
  overlays.push(
    { input: await sharp(soffit).extract({ left: 718, top: 0, width: 550, height: 93 }).toBuffer(), left: 0, top: 100 },
    { input: await sharp(soffit).flop().toBuffer(), left: 550, top: 100 },
  );
  for (const [left, top, width, height] of preserved) {
    overlays.push({ input: await sharp(original).extract({ left, top, width, height }).toBuffer(), left, top });
  }
  const output = `${root}corridor-unified${suffix}.png`;
  await sharp(original).composite(overlays).png().toFile(output);
  const pixels = (file, left, top, width, height) => sharp(file)
    .extract({ left, top, width, height }).removeAlpha().raw().toBuffer();
  const { width, height } = await sharp(output).metadata();
  assert.equal(width, 5000);
  assert.equal(height, suffix ? 760 : 720);
  for (const [left, top, w, h] of [...preserved, [0, 0, 5000, 100], [0, 570, 5000, height - 570], [1818, 100, 3182, 470]]) {
    assert.deepEqual(await pixels(output, left, top, w, h), await pixels(original, left, top, w, h));
  }
  console.log(`${output}: doors, directory, floor and remaining corridor preserved`);
}
