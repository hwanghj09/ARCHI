import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../assets/ending/b2-capture/', import.meta.url);
const path = name => fileURLToPath(new URL(name, root));
const source = path('source/robot-strike.png');
const { width, height } = await sharp(source).metadata();
const cellWidth = Math.floor(width / 2);
const cellHeight = Math.floor(height / 2);
// 생성 원본은 보존하고 동일 셀을 가로로 정렬한다. 픽셀 경계는 nearest로 유지한다.
const frames = await Promise.all(Array.from({ length: 4 }, async (_, frame) => ({
  input: await sharp(source).extract({ left: frame % 2 * (width - cellWidth), top: Math.floor(frame / 2) * (height - cellHeight),
    width: cellWidth, height: cellHeight }).resize(1920, 1080, { fit: 'fill', kernel: 'nearest' }).removeAlpha().png().toBuffer(),
  left: frame * 1920, top: 0,
})));
await sharp({ create: { width: 7680, height: 1080, channels: 3, background: '#000' } })
  .composite(frames).png().toFile(path('robot-strike.png'));
for (const file of ['drag-pov.png', 'upload-pov.png']) {
  await sharp(path(`source/${file}`)).resize(1920, 1080, { fit: 'fill', kernel: 'nearest' })
    .removeAlpha().png().toFile(path(file));
}
for (const [file, expectedWidth] of [['robot-strike.png', 7680], ['drag-pov.png', 1920], ['upload-pov.png', 1920]]) {
  const meta = await sharp(path(file)).metadata();
  assert.equal(meta.width, expectedWidth);
  assert.equal(meta.height, 1080);
}
console.log('B2 capture: 1920×1080 opaque scenes; strike is a horizontal four-frame 7680×1080 sheet.');
