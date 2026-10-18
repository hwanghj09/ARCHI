import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../assets/player/', import.meta.url);
const output = Buffer.alloc(2560 * 256 * 4);
let frame = 0;
for (const [name, columns, rows] of [['reactions', 3, 2], ['dialogue', 2, 2]]) {
  const { data, info } = await sharp(fileURLToPath(new URL(`cutscene-source/${name}.png`, root)))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let scale;
  for (let index = 0; index < columns * rows; index++, frame++) {
    const left = Math.floor(index % columns * info.width / columns);
    const top = Math.floor(Math.floor(index / columns) * info.height / rows);
    const width = Math.floor((index % columns + 1) * info.width / columns) - left;
    const height = Math.floor((Math.floor(index / columns) + 1) * info.height / rows) - top;
    const cell = Buffer.alloc(width * height * 4);
    let first = height, bottom = -1;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const from = ((top + y) * info.width + left + x) * 4, to = (y * width + x) * 4;
      if (data[from + 3] < 128) continue;
      data.copy(cell, to, from, from + 3); cell[to + 3] = 255;
      first = Math.min(first, y); bottom = Math.max(bottom, y);
    }
    assert(bottom > first, `${name}/${index}: full character required`);
    // One scale per source sheet: bending forward must not enlarge the head/body.
    scale ??= 220 / (bottom - first);
    let footLeft = width, footRight = 0;
    for (let y = bottom - 8; y <= bottom; y++) for (let x = 0; x < width; x++) {
      if (!cell[(y * width + x) * 4 + 3]) continue;
      footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x);
    }
    const scaled = await sharp(cell, { raw: { width, height, channels: 4 } })
      .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'nearest' })
      .raw().toBuffer({ resolveWithObject: true });
    const offsetX = Math.round(128 - (footLeft + footRight) / 2 * scaled.info.width / width);
    const offsetY = 237 - Math.round(bottom * scaled.info.height / height);
    for (let y = 0; y < scaled.info.height; y++) for (let x = 0; x < scaled.info.width; x++) {
      const from = (y * scaled.info.width + x) * 4;
      if (!scaled.data[from + 3]) continue;
      const dx = x + offsetX, dy = y + offsetY;
      assert(dx > 5 && dx < 250 && dy > 5 && dy < 250, `${name}/${index}: clipped character`);
      scaled.data.copy(output, (dy * 2560 + frame * 256 + dx) * 4, from, from + 4);
    }
  }
}
await sharp(output, { raw: { width: 2560, height: 256, channels: 4 } })
  .png().toFile(fileURLToPath(new URL('jeong-suho-cutscene.png', root)));
console.log('Prepared 10 cutscene poses with shared body scale, crisp alpha and planted feet.');
