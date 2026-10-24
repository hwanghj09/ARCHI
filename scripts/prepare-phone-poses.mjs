import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../assets/player/', import.meta.url));
const source = `${root}phone-movement-source/crouch-on-generated.png`;
const metadata = await sharp(source).metadata();
const regions = [[165, 140, 214, 212], [181, 138, 220, 210], [180, 138, 231, 214], [167, 139, 236, 208]];
const frames = [], lamps = [];

function bounds(data, width, height) {
  let top = height, bottom = -1, sum = 0, count = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] < 128) continue;
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  assert(bottom > top, 'Complete source silhouette');
  for (let y = top; y < top + (bottom - top) * .16; y++) for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] < 128) continue;
    sum += x; count++;
  }
  return { top, bottom, head: sum / count };
}

for (let i = 0; i < 4; i++) {
  const base = await sharp(`${root}jeong-suho-crouch.png`)
    .extract({ left: i * 256, top: 0, width: 256, height: 256 }).ensureAlpha().raw().toBuffer();
  const left = Math.round(i * metadata.width / 4), width = Math.round((i + 1) * metadata.width / 4) - left, height = metadata.height;
  const input = await sharp(source).extract({ left, top: 0, width, height }).ensureAlpha().raw().toBuffer();
  const a = bounds(base, 256, 256), b = bounds(input, width, height), scale = (a.bottom - a.top) / (b.bottom - b.top);
  const scaled = await sharp(input, { raw: { width, height, channels: 4 } })
    .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'nearest' }).raw().toBuffer({ resolveWithObject: true });
  const dx = Math.round(a.head - b.head * scale), dy = Math.round(a.top - b.top * scale);
  const [x1, y1, x2, y2] = regions[i], cell = Buffer.from(base), led = [];
  for (let y = y1; y < y2; y++) for (let x = x1; x < x2; x++) {
    const sx = x - dx, sy = y - dy, p = (sy * scaled.info.width + sx) * 4, to = (y * 256 + x) * 4;
    assert(sx >= 0 && sx < scaled.info.width && sy >= 0 && sy < scaled.info.height);
    cell.fill(0, to, to + 4);
    if (scaled.data[p + 3] < 128) continue;
    scaled.data.copy(cell, to, p, p + 4); cell[to + 3] = 255;
    if (x >= 193 && y < 154 && Math.min(...cell.subarray(to, to + 3)) > 210) led.push([x, y]);
  }
  assert(led.length, `Crouch ${i}: visible LED`);
  const lamp = [0, 1].map(axis => Math.round(led.reduce((sum, point) => sum + point[axis], 0) / led.length));
  lamps.push(lamp);
  const off = Buffer.from(cell);
  for (let y = lamp[1] - 3; y <= lamp[1] + 3; y++) for (let x = lamp[0] - 3; x <= lamp[0] + 3; x++) {
    const p = (y * 256 + x) * 4;
    if (cell[p + 3] && Math.min(...cell.subarray(p, p + 3)) > 100) off.set([38, 40, 43], p);
  }
  frames.push({ on: cell, off });
}
for (const light of ['off', 'on']) {
  const output = Buffer.alloc(1024 * 256 * 4);
  for (let i = 0; i < 4; i++) for (let y = 0; y < 256; y++) frames[i][light].copy(output, (y * 1024 + i * 256) * 4, y * 1024, (y + 1) * 1024);
  await sharp(output, { raw: { width: 1024, height: 256, channels: 4 } }).png().toFile(`${root}jeong-suho-phone-crouch-${light}.png`);
}
console.log('crouchPhoneLamps =', JSON.stringify(lamps));
await import('./prepare-phone-run.mjs');
