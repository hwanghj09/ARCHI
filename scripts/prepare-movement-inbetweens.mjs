import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../assets/player/', import.meta.url));
const specs = [
  { base: 'run-eight', output: 'run-sixteen', feet: [[0, 0], [3, 1], [7, 2]] },
  { base: 'phone-run-off', output: 'phone-run-sixteen-off', feet: [[0, 0]] },
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

async function legCells(name, columns, rows) {
  const atlas = await sharp(`${root}movement-inbetweens-source/${name}.png`)
    .resize(columns * 256, rows * 256, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
  const cells = [];
  for (let frame = 0; frame < columns * rows; frame++) {
    const cell = Buffer.alloc(256 * 256 * 4);
    for (let y = 0; y < 256; y++) {
      const from = ((Math.floor(frame / columns) * 256 + y) * columns * 256 + frame % columns * 256) * 4;
      atlas.copy(cell, y * 256 * 4, from, from + 256 * 4);
    }
    for (let p = 0; p < cell.length; p += 4) {
      if (cell[p + 3] < 128) cell.fill(0, p, p + 4);
      else cell[p + 3] = 255;
    }
    cells.push(cell);
  }
  return cells;
}
const cleanLegs = await legCells('movement-legs-clean', 4, 2);
const passingLegs = await legCells('run-legs-fix', 3, 1);

function legAnchor(data, width, frame, row = 132) {
  let bottom = 0, sum = 0, count = 0;
  for (let y = 130; y < 250; y++) for (let x = 5; x < 250; x++) {
    const p = (y * width + frame * 256 + x) * 4;
    if (data[p + 3] < 128) continue;
    bottom = Math.max(bottom, y);
    if (x >= 105 && y >= row && y < row + 6 && Math.max(...data.subarray(p, p + 3)) < 110) { sum += x; count++; }
  }
  assert(count > 10 && bottom > 210, 'Complete hips and foot registration');
  return { x: sum / count, bottom };
}
function replaceLegs(data, width, frame, patch) {
  const target = legAnchor(data, width, frame), source = legAnchor(patch, 256, 0);
  const dy = target.bottom - source.bottom;
  const dx = Math.round(target.x - legAnchor(patch, 256, 0, 132 - dy).x);
  const upperBodyMask = (pixels, stride, index) => {
    const mask = new Uint8Array(256 * 256);
    for (let y = 124; y < 165; y++) for (let x = 30; x < 225; x++) {
      const p = (y * stride + index * 256 + x) * 4;
      if (pixels[p + 3] < 128) continue;
      const skin = pixels[p] > 110 && pixels[p] > pixels[p + 1] + 20 && pixels[p + 1] > pixels[p + 2] + 10;
      const rgb = pixels.subarray(p, p + 3);
      const shirt = y < 140 && Math.min(...rgb) >= 110 && Math.max(...rgb) - Math.min(...rgb) < 50;
      if (!skin && !shirt) continue;
      for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = x - 2; xx <= x + 2; xx++) mask[yy * 256 + xx] = 1;
    }
    return mask;
  };
  const originalUpperBody = upperBodyMask(data, width, frame), patchUpperBody = upperBodyMask(patch, 256, 0);
  for (let y = 128; y < 256; y++) for (let x = 0; x < 256; x++) {
    if (originalUpperBody[y * 256 + x]) continue;
    const to = (y * width + frame * 256 + x) * 4, sx = x - dx, sy = y - dy;
    if (y < 140 && sx >= 0 && sx < 256 && sy >= 0 && sy < 256 && patchUpperBody[sy * 256 + sx]) continue;
    data.fill(0, to, to + 4);
    if (sx < 0 || sx >= 256 || sy < 0 || sy >= 256) continue;
    if (patchUpperBody[sy * 256 + sx]) continue; // Preserve the original hands and shirt hem.
    patch.copy(data, to, (sy * 256 + sx) * 4, (sy * 256 + sx + 1) * 4);
  }
}

// Redraw the whole walk cycle together instead of alternating incompatible artwork.
const walkPoses = [
  ['walk-keys', 3, 2, 0], ['walk-keys', 3, 2, 1], ['walk-keys', 3, 2, 2], ['walk-up', 2, 1, 1],
  ['walk-keys', 3, 2, 3], ['walk-keys', 3, 2, 4], ['walk-keys', 3, 2, 5], ['walk-up', 2, 1, 0],
];
const walkHead = await sharp(`${root}movement-inbetweens-source/walk-head.png`).ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
assert(walkHead.info.width === 56 && walkHead.info.height === 56, 'The shared walking head has one fixed pixel size');
// Clip the old head through the shoulder/collar boundary, including the gray nape matte.
const collar = [[70, 96], [90, 80], [114, 61], [130, 69], [134, 73], [140, 73], [159, 82], [186, 90]];
const headCut = new Map();
for (let p = 1; p < collar.length; p++) {
  const [x1, y1] = collar[p - 1], [x2, y2] = collar[p];
  for (let x = x1; x < x2; x++) headCut.set(x, Math.round(y1 + (y2 - y1) * (x - x1) / (x2 - x1)));
}
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
    const bob = [0, 1, 0, -2][i % 4] - (variant ? 2 : 0);
    for (const [x, edge] of headCut) for (let y = 0; y < edge + bob; y++) {
      // The forward phone begins beside the jaw and must retain its LED.
      if (variant && x >= 158 && y >= 58 + bob) continue;
      const p = (y * 2048 + i * 256 + x) * 4;
      output.fill(0, p, p + 4);
    }
    // Paste after body scaling: every walk uses identical head pixels, with translation only.
    for (let y = 0; y < 56; y++) for (let x = 0; x < 56; x++) {
      const from = (y * 56 + x) * 4;
      if (!walkHead.data[from + 3]) continue;
      walkHead.data.copy(output, ((17 + bob + y) * 2048 + i * 256 + 106 + x) * 4, from, from + 4);
    }
  }
  const name = variant ? `phone-walk-eight${variant}` : 'walk-eight';
  replaceLegs(output, 2048, 3, cleanLegs[variant ? 2 : 0]);
  replaceLegs(output, 2048, 7, cleanLegs[variant ? 3 : 1]);
  if (!variant) replaceLegs(output, 2048, 4, cleanLegs[4]);
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

// One new whole-body midpoint, scaled uniformly to the neighboring poses' head and floor anchors.
const midSource = await sharp(`${root}movement-inbetweens-source/run-mid-01.png`).ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
const midBounds = bounds(midSource.data, midSource.info.width, midSource.info.height);
const midScale = 218 / (midBounds.bottom - midBounds.top);
for (let p = 0; p < midSource.data.length; p += 4) {
  if (midSource.data[p + 3] < 128) midSource.data.fill(0, p, p + 4);
  else midSource.data[p + 3] = 255;
}
const midScaled = await sharp(midSource.data, { raw: midSource.info })
  .resize(Math.round(midSource.info.width * midScale), Math.round(midSource.info.height * midScale), { kernel: 'nearest' })
  .raw().toBuffer({ resolveWithObject: true });
const midCell = Buffer.alloc(256 * 256 * 4);
const midDx = Math.round(179 - midBounds.headX * midScaled.info.width / midSource.info.width);
const midDy = 239 - Math.round(midBounds.bottom * midScaled.info.height / midSource.info.height);
for (let y = 0; y < midScaled.info.height; y++) for (let x = 0; x < midScaled.info.width; x++) {
  const from = (y * midScaled.info.width + x) * 4;
  if (!midScaled.data[from + 3]) continue;
  assert(x + midDx > 5 && x + midDx < 250 && y + midDy > 5 && y + midDy < 250, 'Complete midpoint with transparent margins');
  midScaled.data.copy(midCell, ((y + midDy) * 256 + x + midDx) * 4, from, from + 4);
}
await sharp(midCell, { raw: { width: 256, height: 256, channels: 4 } }).png().toFile(`${root}jeong-suho-run-mid-01.png`);

const fixedFeet = await sharp(`${root}movement-inbetweens-source/run-feet-fix.png`)
  .resize(768, 256, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let p = 0; p < fixedFeet.data.length; p += 4) {
  if (fixedFeet.data[p + 3] < 128) fixedFeet.data.fill(0, p, p + 4);
  else fixedFeet.data[p + 3] = 255;
}
function frontFootAnchor(image, frame, row = 196) {
  let bottom = 0, xSum = 0, count = 0;
  for (let y = 185; y < 250; y++) for (let x = 150; x < 250; x++) {
    const p = (y * image.info.width + frame * 256 + x) * 4;
    if (image.data[p + 3] < 128) continue;
    bottom = Math.max(bottom, y);
    if (y >= row && y < row + 5 && Math.max(...image.data.subarray(p, p + 3)) < 110) { xSum += x; count++; }
  }
  assert(count > 5 && bottom > 210, 'Complete shin and shoe registration');
  return { x: xSum / count, bottom };
}

// Preserve the body; repair only the front ankle/shoe region before copying timing cells.
for (const spec of specs) {
  const base = await sharp(`${root}jeong-suho-${spec.base}.png`).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(base.info.width, 8 * 256); assert.equal(base.info.height, 256);
  for (const [frame, patch] of spec.feet) {
    const target = frontFootAnchor(base, frame), source = frontFootAnchor(fixedFeet, patch);
    const dy = target.bottom - source.bottom;
    const dx = Math.round(target.x - frontFootAnchor(fixedFeet, patch, 196 - dy).x);
    for (let y = 196; y < 256; y++) for (let x = 150; x < 250; x++) {
      const to = (y * base.info.width + frame * 256 + x) * 4;
      const sx = x - dx, sy = y - dy;
      base.data.fill(0, to, to + 4);
      if (sx < 0 || sx >= 256 || sy < 0 || sy >= 256) continue;
      const from = (sy * fixedFeet.info.width + patch * 256 + sx) * 4;
      fixedFeet.data.copy(base.data, to, from, from + 4);
    }
  }
  if (spec.base === 'run-eight') {
    replaceLegs(base.data, base.info.width, 1, passingLegs[0]);
    replaceLegs(base.data, base.info.width, 3, cleanLegs[5]);
    replaceLegs(base.data, base.info.width, 6, cleanLegs[6]);
  } else {
    replaceLegs(base.data, base.info.width, 1, passingLegs[1]);
    replaceLegs(base.data, base.info.width, 5, passingLegs[2]);
    replaceLegs(base.data, base.info.width, 2, cleanLegs[7]);
  }
  const outputWidth = 16 * 256, output = Buffer.alloc(outputWidth * 256 * 4);
  for (let frame = 0; frame < 16; frame++) for (let y = 0; y < 256; y++) {
    const from = (y * base.info.width + Math.floor(frame / 2) * 256) * 4;
    base.data.copy(output, (y * outputWidth + frame * 256) * 4, from, from + 256 * 4);
    if (spec.base === 'run-eight' && frame === 1) midCell.copy(output,
      (y * outputWidth + frame * 256) * 4, y * 256 * 4, (y + 1) * 256 * 4);
  }
  await sharp(output, { raw: { width: outputWidth, height: 256, channels: 4 } })
    .png().toFile(`${root}jeong-suho-${spec.output}.png`);
  console.log(`${spec.output}: ${spec.base === 'run-eight' ? 'nine' : 'eight'} whole-body poses, sixteen timing cells.`);
}
