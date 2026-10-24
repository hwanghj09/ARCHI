import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../assets/player/', import.meta.url));
const source = `${root}phone-movement-source/run-original-carry-generated.png`;
const metadata = await sharp(source).metadata();
const original = await sharp(`${root}jeong-suho-run-sixteen.png`).ensureAlpha().raw().toBuffer();
const keys = [0, 1, 2, 4, 6, 8, 10, 12, 14];
const timing = [0, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8];
const sheets = { on: Buffer.alloc(4096 * 256 * 4), off: Buffer.alloc(4096 * 256 * 4) };
const poses = [];

// Remove detached background specks; every pose remains one complete generated figure.
function keepFigure(cell) {
  const seen = new Uint8Array(256 * 256);
  let largest = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || cell[start * 4 + 3] < 128) continue;
    const queue = [start]; seen[start] = 1;
    for (let i = 0; i < queue.length; i++) {
      const x = queue[i] % 256, y = Math.floor(queue[i] / 256);
      for (let yy = Math.max(0, y - 1); yy <= Math.min(255, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(255, x + 1); xx++) {
        const p = yy * 256 + xx;
        if (seen[p] || cell[p * 4 + 3] < 128) continue;
        seen[p] = 1; queue.push(p);
      }
    }
    if (queue.length > largest.length) largest = queue;
  }
  assert(largest.length > 5000, 'Complete connected full-body pose');
  const result = Buffer.alloc(cell.length);
  for (const p of largest) { cell.copy(result, p * 4, p * 4, p * 4 + 4); result[p * 4 + 3] = 255; }
  return result;
}

function measure(data, width, height) {
  let top = height, bottom = -1, sum = 0, count = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] >= 128) {
    top = Math.min(top, y); bottom = Math.max(bottom, y);
  }
  for (let y = top; y < Math.min(height, top + 24); y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] >= 128) { sum += x; count++; }
  return { top, bottom, head: sum / count };
}

let scale;
for (let key = 0; key < 9; key++) {
  const col = key % 3, row = Math.floor(key / 3);
  const left = Math.round(col * metadata.width / 3), top = Math.round(row * metadata.height / 3);
  const width = Math.round((col + 1) * metadata.width / 3) - left;
  const height = Math.round((row + 1) * metadata.height / 3) - top;
  const input = keepFigure(await sharp(source).extract({ left, top, width, height })
    .resize(256, 256, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer());
  const reference = Buffer.alloc(256 * 256 * 4);
  for (let y = 0; y < 256; y++) original.copy(reference, y * 1024, (y * 4096 + keys[key] * 256) * 4, (y * 4096 + (keys[key] + 1) * 256) * 4);
  const target = measure(reference, 256, 256), initial = measure(input, 256, 256);
  scale ??= (target.bottom - target.top) / (initial.bottom - initial.top);
  assert(scale >= .9 && scale <= 1.1, 'The generated character keeps the original proportions');
  const size = Math.round(256 * scale);
  const pixels = await sharp(input, { raw: { width: 256, height: 256, channels: 4 } })
    .resize(size, size, { kernel: 'nearest' }).raw().toBuffer();
  const measured = measure(pixels, size, size);
  // Register each COMPLETE figure to its original head/sole anchors, without replacing any body parts.
  const dx = Math.round(target.head - measured.head), dy = target.bottom - measured.bottom;
  const packed = Buffer.alloc(256 * 256 * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const p = (y * size + x) * 4;
    if (!pixels[p + 3]) continue;
    const xx = x + dx, yy = y + dy;
    assert(xx > 0 && xx < 255 && yy > 0 && yy < 255, `Pose ${key}: complete original-scale figure`);
    pixels.copy(packed, (yy * 256 + xx) * 4, p, p + 4);
  }
  const edited = keepFigure(packed), led = [], forward = key === 6 || key === 8;
  for (let y = forward ? 65 : 104; y < (forward ? 115 : 145); y++) for (let x = forward ? 175 : 75; x < (forward ? 230 : 135); x++) {
    const p = (y * 256 + x) * 4;
    if (edited[p + 3] < 128 || Math.min(...edited.subarray(p, p + 3)) <= 210) continue;
    let score = 0;
    for (let yy = y - 4; yy <= y + 4; yy++) for (let xx = x - 4; xx <= x + 4; xx++) {
      const q = (yy * 256 + xx) * 4;
      if (edited[q + 3] < 128) continue;
      if (Math.max(...edited.subarray(q, q + 3)) < 95) score++;
      if (Math.min(...edited.subarray(q, q + 3)) > 210) score -= 2;
    }
    led.push({ x, y, score });
  }
  led.sort((a, b) => b.score - a.score);
  assert(led.length && led[0].score > 0, `Pose ${key}: white LED on a black phone`);
  const lamp = [led[0].x, led[0].y];
  // Keep the ORIGINAL complete run sprite; only the prop and gripping fingers are edited.
  const cell = Buffer.from(reference);
  for (let y = lamp[1] - 4; y < lamp[1] + 23; y++) for (let x = lamp[0] - 18; x < lamp[0] + 7; x++) {
    const p = (y * 256 + x) * 4;
    edited.copy(cell, p, p, p + 4);
  }
  const off = Buffer.from(cell);
  for (let y = lamp[1] - 3; y <= lamp[1] + 3; y++) for (let x = lamp[0] - 3; x <= lamp[0] + 3; x++) {
    const p = (y * 256 + x) * 4;
    if (cell[p + 3] && Math.min(...cell.subarray(p, p + 3)) > 100) off.set([38, 40, 43], p);
  }
  poses.push({ on: cell, off, lamp });
}
for (let frame = 0; frame < 16; frame++) {
  const pose = poses[timing[frame]];
  for (let y = 0; y < 256; y++) {
    const to = (y * 4096 + frame * 256) * 4;
    pose.on.copy(sheets.on, to, y * 1024, (y + 1) * 1024);
    pose.off.copy(sheets.off, to, y * 1024, (y + 1) * 1024);
  }
}
for (const light of ['on', 'off']) await sharp(sheets[light], { raw: { width: 4096, height: 256, channels: 4 } })
  .png().toFile(`${root}jeong-suho-phone-run-sixteen-${light}.png`);
console.log('runLitPhoneLamps =', JSON.stringify(timing.map(key => poses[key].lamp)));
