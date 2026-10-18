import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../assets/player/', import.meta.url));
const specs = [
  { source: 'run', base: 'run-eight', output: 'run-sixteen', columns: 4, scale: .575,
    soles: [239, 239, 226, 236, 239, 239, 222, 236] },
  { source: 'phone-run-off', base: 'phone-run-off', output: 'phone-run-sixteen-off', columns: 4, scale: .55,
    soles: [237, 237, 225, 230, 237, 237, 225, 230] },
];

function bounds(data, width, height) {
  let top = height, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] >= 128) {
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
  }
  assert(bottom > top, 'Every source cell must contain a full character');
  let sum = 0, count = 0;
  for (let y = top; y < Math.min(height, top + height * .12); y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] >= 128) { sum += x; count++; }
  }
  return { top, bottom, headX: sum / count };
}

// Redraw the whole walk cycle together instead of alternating incompatible artwork.
const walkPoses = [
  ['walk-keys', 3, 2, 0], ['walk-keys', 3, 2, 1], ['walk-keys', 3, 2, 2], ['walk-up', 2, 1, 1],
  ['walk-keys', 3, 2, 3], ['walk-keys', 3, 2, 4], ['walk-keys', 3, 2, 5], ['walk-up', 2, 1, 0],
];
for (const variant of ['', '-off', '-on']) {
  const output = Buffer.alloc(2048 * 256 * 4);
  for (let i = 0; i < 8; i++) {
    const [name, columns, rows, index] = variant ? [`phone-walk${variant}`, 4, 2, i] : walkPoses[i];
    const input = `${root}movement-inbetweens-source/${name}.png`;
    const anchor = variant ? `${root}movement-inbetweens-source/phone-walk-off.png` : input;
    const metadata = await sharp(input).metadata(), alignmentMetadata = await sharp(anchor).metadata();
    assert(metadata.hasAlpha && metadata.width === alignmentMetadata.width && metadata.height === alignmentMetadata.height);
    const left = Math.floor(index % columns * metadata.width / columns);
    const top = Math.floor(Math.floor(index / columns) * metadata.height / rows);
    const width = Math.floor((index % columns + 1) * metadata.width / columns) - left;
    const height = Math.floor((Math.floor(index / columns) + 1) * metadata.height / rows) - top;
    const rect = { left, top, width, height };
    const data = await sharp(input).extract(rect).ensureAlpha().raw().toBuffer();
    const alignment = await sharp(anchor).extract(rect).ensureAlpha().raw().toBuffer();
    const measured = bounds(alignment, width, height);
    // Contact, compression, passing, toe-off; repeat with the opposite support leg.
    const scale = [220, 219, 220, 222][i % 4] / (measured.bottom - measured.top);
    for (let p = 0; p < data.length; p += 4) {
      if (data[p + 3] < 128) data.fill(0, p, p + 4);
      else data[p + 3] = 255;
    }
    const scaled = await sharp(data, { raw: { width, height, channels: 4 } })
      .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'nearest' })
      .raw().toBuffer({ resolveWithObject: true });
    const xOffset = Math.round(135 - measured.headX * scaled.info.width / width);
    const yOffset = (variant ? 237 : 239) - Math.round(measured.bottom * scaled.info.height / height);
    for (let y = 0; y < scaled.info.height; y++) for (let x = 0; x < scaled.info.width; x++) {
      const from = (y * scaled.info.width + x) * 4;
      if (!scaled.data[from + 3]) continue;
      const dx = x + xOffset, dy = y + yOffset;
      assert(dx >= 6 && dx < 250 && dy >= 6 && dy < 250, `${name}/${i}: clipped character`);
      scaled.data.copy(output, (dy * 2048 + i * 256 + dx) * 4, from, from + 4);
    }
  }
  const name = variant ? `phone-walk-eight${variant}` : 'walk-eight';
  await sharp(output, { raw: { width: 2048, height: 256, channels: 4 } }).png()
    .toFile(`${root}jeong-suho-${name}.png`);
  console.log(`${name}: eight consistent walking phases.`);
}

// Flashlight ON has no running cycle; retain only its original jump/fall artwork.
const litOriginal = await sharp(`${root}jeong-suho-phone-run-on.png`).ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
const airborne = Buffer.alloc(512 * 256 * 4);
for (const [index, source] of [2, 6].entries()) for (let y = 0; y < 256; y++) {
  const from = (y * litOriginal.info.width + source * 256) * 4;
  litOriginal.data.copy(airborne, (y * 512 + index * 256) * 4, from, from + 256 * 4);
}
await sharp(airborne, { raw: { width: 512, height: 256, channels: 4 } })
  .png().toFile(`${root}jeong-suho-phone-jump-on.png`);

for (const spec of specs) {
  const count = spec.columns * 2;
  const input = `${root}movement-inbetweens-source/${spec.source}.png`;
  const anchor = `${root}movement-inbetweens-source/${spec.anchor || spec.source}.png`;
  const original = `${root}jeong-suho-${spec.base}.png`;
  const metadata = await sharp(input).metadata();
  const anchorMetadata = await sharp(anchor).metadata();
  assert(metadata.hasAlpha && metadata.width === anchorMetadata.width && metadata.height === anchorMetadata.height);
  const base = await sharp(original).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert(base.info.width === count * 256 && base.info.height === 256);
  const outputWidth = count * 2 * 256;
  const output = Buffer.alloc(outputWidth * 256 * 4);

  for (let i = 0; i < count; i++) {
    const left = Math.floor(i % spec.columns * metadata.width / spec.columns);
    const top = Math.floor(Math.floor(i / spec.columns) * metadata.height / 2);
    const width = Math.floor((i % spec.columns + 1) * metadata.width / spec.columns) - left;
    const height = Math.floor((Math.floor(i / spec.columns) + 1) * metadata.height / 2) - top;
    const rect = { left, top, width, height };
    const source = await sharp(input).extract(rect).ensureAlpha().raw().toBuffer();
    const alignment = await sharp(anchor).extract(rect).ensureAlpha().raw().toBuffer();
    const sourceBounds = bounds(alignment, width, height);
    const heads = [];
    for (const index of [i, (i + 1) % count]) {
      const cell = await sharp(original).extract({ left: index * 256, top: 0, width: 256, height: 256 })
        .ensureAlpha().raw().toBuffer();
      heads.push(bounds(cell, 256, 256).headX);
    }
    // Mechanical alpha cleanup and nearest-neighbor export; all poses are drawn by image_gen.
    for (let p = 0; p < source.length; p += 4) {
      if (source[p + 3] < 128) source.fill(0, p, p + 4);
      else source[p + 3] = 255;
    }
    const scaled = await sharp(source, { raw: { width, height, channels: 4 } })
      .resize(Math.round(width * spec.scale), Math.round(height * spec.scale), { kernel: 'nearest' })
      .raw().toBuffer({ resolveWithObject: true });
    const xOffset = Math.round((heads[0] + heads[1]) / 2 - sourceBounds.headX * scaled.info.width / width);
    const yOffset = spec.soles[i] - Math.round(sourceBounds.bottom * scaled.info.height / height);
    for (let y = 0; y < 256; y++) {
      const from = (y * base.info.width + i * 256) * 4;
      base.data.copy(output, (y * outputWidth + i * 512) * 4, from, from + 256 * 4);
    }
    for (let y = 0; y < scaled.info.height; y++) for (let x = 0; x < scaled.info.width; x++) {
      const from = (y * scaled.info.width + x) * 4;
      if (!scaled.data[from + 3]) continue;
      const dx = x + xOffset, dy = y + yOffset;
      assert(dx >= 6 && dx < 250 && dy >= 6 && dy < 250, `${spec.source}/${i}: clipped character`);
      scaled.data.copy(output, (dy * outputWidth + (i * 2 + 1) * 256 + dx) * 4, from, from + 4);
    }
  }
  await sharp(output, { raw: { width: outputWidth, height: 256, channels: 4 } })
    .png().toFile(`${root}jeong-suho-${spec.output}.png`);
  console.log(`${spec.output}: ${count * 2} frames, ${outputWidth}×256; original cells preserved.`);
}
