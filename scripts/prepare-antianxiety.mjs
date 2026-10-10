import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

// Asset export only: keep the generated alpha and use nearest-neighbor sampling.
const root = fileURLToPath(new URL('../', import.meta.url));
const source = `${root}assets/player/jeong-suho-antianxiety-source.png`;
const anchors = [[337, 507], [258, 507], [183, 507], [343, 501], [261, 501], [183, 501]];
const ratio = 216 / 491;
const side = Math.round(512 * ratio);
const frames = [];
for (let i = 0; i < 6; i++) {
  const tile = await sharp(source).extract({ left: i % 3 * 512, top: Math.floor(i / 3) * 512, width: 512, height: 512 })
    .resize(side, side, { kernel: 'nearest' }).png().toBuffer();
  // Trim only canvas padding that falls outside the fixed 256px viewport.
  const left = Math.round(128 - anchors[i][0] * side / 512);
  const top = Math.round(237 - anchors[i][1] * side / 512);
  const clipLeft = Math.max(0, -left), clipTop = Math.max(0, -top);
  const clipped = await sharp(tile).extract({ left: clipLeft, top: clipTop,
    width: Math.min(side - clipLeft, 256 - Math.max(0, left)),
    height: Math.min(side - clipTop, 256 - Math.max(0, top)) }).png().toBuffer();
  frames.push({ input: clipped, left: i * 256 + Math.max(0, left), top: Math.max(0, top) });
}
await sharp({ create: { width: 1536, height: 256, channels: 4, background: '#00000000' } })
  .composite(frames).png().toFile(`${root}assets/player/jeong-suho-antianxiety.png`);
const icon = await sharp(`${root}assets/objects/items/antianxiety-source.png`)
  .extract({ left: 182, top: 357, width: 897, height: 557 })
  .resize(110, 109, { fit: 'inside', kernel: 'nearest' }).png().toBuffer();
const { width, height } = await sharp(icon).metadata();
await sharp({ create: { width: 134, height: 125, channels: 4, background: '#00000000' } })
  .composite([{ input: icon, left: Math.round((134 - width) / 2), top: Math.round((125 - height) / 2) }])
  .png().toFile(`${root}assets/objects/items/antianxiety-v2.png`);
