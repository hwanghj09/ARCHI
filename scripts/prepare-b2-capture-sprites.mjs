import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
for (const kind of ['player', 'robot']) {
  const source = await sharp(fileURLToPath(new URL(`assets/ending/b2-capture/source/${kind}.png`, root)))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const cells = kind === 'player' ? [[0, 0, 850, 724], [850, 0, 700, 724], [1550, 0, 622, 724]] :
    Array.from({ length: 4 }, (_, i) => [i % 2 * 627, Math.floor(i / 2) * 627, 627, 627]);
  const cellWidth = kind === 'player' ? 256 : 384;
  const outputWidth = cellWidth * cells.length, output = Buffer.alloc(outputWidth * 256 * 4);
  let scale;
  for (const [index, [left, top, width, height]] of cells.entries()) {
    const cell = Buffer.alloc(width * height * 4);
    let minX = width, maxX = 0, minY = height, maxY = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const from = ((top + y) * source.info.width + left + x) * 4, to = (y * width + x) * 4;
      if (source.data[from + 3] < 128) continue;
      source.data.copy(cell, to, from, from + 3); cell[to + 3] = 255;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    // One physical scale per sheet, including the shorter bent/reclining poses.
    scale ??= kind === 'player' ? 220 / (maxX - minX) : 198 / (maxY - minY);
    let anchorX = (minX + maxX) / 2;
    if (kind === 'robot') {
      let footLeft = width, footRight = 0;
      for (let y = maxY - 10; y <= maxY; y++) for (let x = 0; x < width; x++) {
        if (!cell[(y * width + x) * 4 + 3]) continue;
        footLeft = Math.min(footLeft, x); footRight = Math.max(footRight, x);
      }
      anchorX = (footLeft + footRight) / 2;
    }
    const scaled = await sharp(cell, { raw: { width, height, channels: 4 } })
      .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'nearest' })
      .raw().toBuffer({ resolveWithObject: true });
    const dx = Math.round((kind === 'player' ? 128 : 256) - anchorX * scaled.info.width / width);
    const dy = 237 - Math.round(maxY * scaled.info.height / height);
    for (let y = 0; y < scaled.info.height; y++) for (let x = 0; x < scaled.info.width; x++) {
      const p = (y * scaled.info.width + x) * 4;
      if (!scaled.data[p + 3]) continue;
      assert(x + dx > 3 && x + dx < cellWidth - 3 && y + dy > 3 && y + dy < 252, `${kind}/${index}: clipped sprite`);
      scaled.data.copy(output, ((y + dy) * outputWidth + index * cellWidth + x + dx) * 4, p, p + 4);
    }
  }
  const destination = kind === 'player' ? 'assets/player/jeong-suho-unconscious.png' : 'assets/objects/guard-robot/guard-transport.png';
  await sharp(output, { raw: { width: outputWidth, height: 256, channels: 4 } }).png()
    .toFile(fileURLToPath(new URL(destination, root)));
  console.log(`Prepared ${destination}`);
}

// Register the shoes, leaving extra room behind the head for the trailing arms.
const drag = await sharp(fileURLToPath(new URL('assets/ending/b2-capture/source/player-drag.png', root)))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(drag.info.width, 1254); assert.equal(drag.info.height, 1254);
const dragOutput = Buffer.alloc(1280 * 256 * 4);
for (let frame = 0; frame < 4; frame++) {
  const cell = Buffer.alloc(627 * 627 * 4);
  let shoeRight = 0, shoeBottom = 0;
  for (let y = 0; y < 627; y++) for (let x = 0; x < 627; x++) {
    const from = ((y + Math.floor(frame / 2) * 627) * drag.info.width + x + frame % 2 * 627) * 4;
    if (drag.data[from + 3] < 128) continue;
    const to = (y * 627 + x) * 4;
    drag.data.copy(cell, to, from, from + 3); cell[to + 3] = 255;
    if (x > 515) { shoeRight = Math.max(shoeRight, x); shoeBottom = Math.max(shoeBottom, y); }
  }
  assert(shoeRight > 580 && shoeBottom > 380, 'Complete shoe registration');
  const resized = await sharp(cell, { raw: { width: 627, height: 627, channels: 4 } })
    .resize(276, 276, { kernel: 'nearest' }).raw().toBuffer();
  const dx = 302 - Math.round(shoeRight * 276 / 627), dy = 220 - Math.round(shoeBottom * 276 / 627);
  for (let y = 0; y < 276; y++) for (let x = 0; x < 276; x++) {
    const p = (y * 276 + x) * 4;
    if (!resized[p + 3]) continue;
    assert(x + dx > 3 && x + dx < 317 && y + dy > 3 && y + dy < 252, `drag/${frame}: clipped sprite`);
    resized.copy(dragOutput, ((y + dy) * 1280 + frame * 320 + x + dx) * 4, p, p + 4);
  }
}
await sharp(dragOutput, { raw: { width: 1280, height: 256, channels: 4 } }).png()
  .toFile(fileURLToPath(new URL('assets/player/jeong-suho-drag-four.png', root)));
console.log('Prepared assets/player/jeong-suho-drag-four.png');
