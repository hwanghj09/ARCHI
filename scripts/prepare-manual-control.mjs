import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = new URL('../assets/ui/manual-control/', import.meta.url);
// Source rectangles isolate the generated layers; output sizes are twice their CSS display size.
const parts = [
  ['lever', 'lever-plate', [0, 0, 639, 760], [256, 480]],
  ['lever', 'lever-handle', [639, 0, 639, 760], [192, 116]],
  ['lever', 'switch-plate', [0, 760, 639, 470], [200, 312]],
  ['lever', 'switch-handle', [639, 760, 639, 470], [48, 88]],
  ['rotary', 'dial', [0, 0, 512, 512], [360, 360]],
  ['rotary', 'key', [512, 0, 512, 512], [108, 180]],
  ['rotary', 'crank', [1024, 0, 512, 512], [64, 224]],
  ['rotary', 'clock', [0, 512, 512, 512], [360, 360]],
  ['rotary', 'clock-hand', [512, 512, 512, 512], [32, 144]],
  ['rotary', 'selector', [1024, 512, 512, 512], [128, 128]],
  ['button', 'button-plate', [0, 0, 887, 887], [348, 348]],
  ['button', 'button', [887, 0, 887, 887], [220, 220]],
  ['plug', 'socket', [0, 0, 480, 512], [168, 168]],
  ['plug', 'plug', [480, 0, 600, 512], [192, 108]],
  ['plug', 'disc', [1080, 0, 456, 512], [192, 192]],
  ['plug', 'disc-slot', [0, 512, 512, 512], [168, 60]],
  ['plug', 'insert-crank', [512, 512, 568, 512], [192, 108]],
  ['card', 'reader', [0, 0, 887, 887], [152, 208]],
  ['card', 'badge', [887, 0, 887, 887], [176, 112]],
];

await mkdir(root, { recursive: true });
for (const [source, name, [left, top, width, height], [w, h]] of parts) {
  const input = await sharp(fileURLToPath(new URL(`source/${source}.png`, root)))
    .extract({ left, top, width, height }).ensureAlpha().raw().toBuffer();
  let x0 = width, y0 = height, x1 = -1, y1 = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (input[(y * width + x) * 4 + 3] < 180) continue;
    x0 = Math.min(x0, x); y0 = Math.min(y0, y);
    x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  assert(x1 > x0 && y1 > y0, `${name}: missing opaque sprite`);
  const output = await sharp(input, { raw: { width, height, channels: 4 } })
    .extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 })
    .resize(w - 4, h - 4, { fit: 'fill' })
    .extend({ top: 2, bottom: 2, left: 2, right: 2, background: '#0000' }).png().toBuffer();
  const metadata = await sharp(output).metadata();
  assert(metadata.width === w && metadata.height === h && metadata.hasAlpha, `${name}: invalid output`);
  await sharp(output).toFile(fileURLToPath(new URL(`${name}.png`, root)));
}
console.log(`Prepared ${parts.length} transparent manual-control sprite layers.`);
