import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// The image generator draws the artwork; this step only packs its 4×4 atlas into game cells.
const root = fileURLToPath(new URL('../assets/player/', import.meta.url));
const source = await sharp(`${root}phone-movement-source/run-sixteen-on-generated.png`)
  .resize(1024, 1024, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
const cells = [];
const lamps = [];
for (let frame = 0; frame < 16; frame++) {
  const cell = Buffer.alloc(256 * 256 * 4);
  const led = [];
  let bottom = 0;
  for (let y = 0; y < 256; y++) {
    const from = ((Math.floor(frame / 4) * 256 + y) * 1024 + frame % 4 * 256) * 4;
    source.copy(cell, y * 256 * 4, from, from + 256 * 4);
    for (let x = 0; x < 256; x++) {
      const p = (y * 256 + x) * 4;
      if (cell[p + 3] >= 32) bottom = y;
      if (x >= 180 && x < 239 && y >= 45 && y < 112 && cell[p + 3] >= 128 &&
          Math.min(cell[p], cell[p + 1], cell[p + 2]) > 220) led.push([x, y]);
    }
  }
  // Keep the cleaned artwork inside the existing foot line without cropping the shoes.
  const lift = Math.max(0, bottom - 239);
  assert(lift <= 4, `Frame ${frame} needs foot-line recalibration`);
  if (lift) {
    cell.copyWithin(0, lift * 256 * 4);
    cell.fill(0, (256 - lift) * 256 * 4);
  }
  assert(led.length > 0, `Frame ${frame} must have a visible phone LED`);
  const right = Math.max(...led.map(([x]) => x));
  const points = led.filter(([x]) => x >= right - 2);
  lamps.push([Math.round(points.reduce((sum, [x]) => sum + x, 0) / points.length),
    Math.round(points.reduce((sum, [, y]) => sum + y, 0) / points.length) - lift]);
  cells.push({ input: await sharp(cell, { raw: { width: 256, height: 256, channels: 4 } }).png().toBuffer(), left: frame * 256, top: 0 });
}
await sharp({ create: { width: 4096, height: 256, channels: 4, background: '#00000000' } })
  .composite(cells).png().toFile(`${root}jeong-suho-phone-run-sixteen-on.png`);
console.log('runLitPhoneLamps =', JSON.stringify(lamps));
