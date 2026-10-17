import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = `${root}assets/player/jeong-suho-crouch-source.png`;
// Fixed scale preserves head size; each pelvis and sole is registered independently.
const poses = [
  { left: 170, top: 190, width: 360, height: 460, hip: 270 },
  { left: 720, top: 190, width: 440, height: 460, hip: 830 },
  { left: 140, top: 710, width: 420, height: 490, hip: 260 },
  { left: 690, top: 710, width: 470, height: 490, hip: 820 },
];
const frames = [];
for (const [i, { hip, ...crop }] of poses.entries()) {
  const { data, info } = await sharp(source).extract(crop).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let sole = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 128) sole = y;
  }
  const input = await sharp(source).extract(crop)
    .resize(Math.round(crop.width * .31), Math.round(crop.height * .31), { kernel: 'nearest' }).png().toBuffer();
  frames.push({ input, left: i * 256 + 128 - Math.round((hip - crop.left) * .31), top: 237 - Math.round(sole * .31) });
}
await sharp({ create: { width: 1024, height: 256, channels: 4, background: '#00000000' } })
  .composite(frames).png().toFile(`${root}assets/player/jeong-suho-crouch.png`);
