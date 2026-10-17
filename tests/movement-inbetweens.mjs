import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const sheets = [
  ['walk-six', 'walk-twelve', 6], ['run-eight', 'run-sixteen', 8],
  ...['off', 'on'].flatMap(light => [
    [`phone-walk-${light}`, `phone-walk-twelve-${light}`, 6],
    [`phone-run-${light}`, `phone-run-sixteen-${light}`, 8],
  ]),
];

for (const [original, expanded, frames] of sheets) {
  const before = await sharp(`assets/player/jeong-suho-${original}.png`).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const after = await sharp(`assets/player/jeong-suho-${expanded}.png`).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(after.info.width, frames * 2 * 256, `${expanded}: complete square cells`);
  assert.equal(after.info.height, 256);
  const poses = new Set();
  for (let frame = 0; frame < frames * 2; frame++) {
    const cell = Buffer.alloc(256 * 256 * 4);
    for (let y = 0; y < 256; y++) {
      const from = (y * after.info.width + frame * 256) * 4;
      after.data.copy(cell, y * 256 * 4, from, from + 256 * 4);
      if (frame % 2 === 0) {
        const old = (y * before.info.width + frame / 2 * 256) * 4;
        assert(cell.subarray(y * 256 * 4, (y + 1) * 256 * 4)
          .equals(before.data.subarray(old, old + 256 * 4)), `${expanded}/${frame}: original pixels preserved`);
      }
    }
    poses.add(cell.toString('base64'));
    let count = 0, top = 256, bottom = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const alpha = cell[(y * 256 + x) * 4 + 3];
      if (frame % 2) assert(alpha === 0 || alpha === 255, `${expanded}/${frame}: crisp alpha without haze`);
      if (alpha < 32) continue;
      count++; top = Math.min(top, y); bottom = Math.max(bottom, y);
      assert(x > 5 && x < 250 && y > 5 && y < 250, `${expanded}/${frame}: unclipped margins`);
    }
    assert(count > 6000 && count < 33000, `${expanded}/${frame}: complete, isolated character`);
    assert(top >= 12 && top < 55 && bottom >= 210 && bottom <= 240, `${expanded}/${frame}: body scale and ground alignment`);
    if (expanded === 'walk-twelve') assert(Math.abs(bottom - 239) <= 1, 'Walking always keeps a support foot planted');
  }
  assert.equal(poses.size, frames * 2, `${expanded}: every pose is distinct`);
}
await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  await page.evaluate(() => {
    performFloorChange('f16', 0, null);
    Body.setPosition(body, { x: 1450, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
  });
  await page.locator('#walk-sheet, #run-sheet').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  for (const [motion, frames, duration] of [['walk', 12, 1100], ['run', 16, 650]]) {
    await page.evaluate(motion => {
      window.observedMovementFrames = new Set();
      const sample = () => {
        if (sprite.dataset.state === motion) window.observedMovementFrames.add(Number(sprite.dataset.frame));
        window.movementSample = requestAnimationFrame(sample);
      };
      window.movementSample = requestAnimationFrame(sample);
    }, motion);
    await page.keyboard.down('d');
    if (motion === 'run') await page.keyboard.down('Shift');
    await page.clock.runFor(duration);
    assert.deepEqual((await page.evaluate(() => [...window.observedMovementFrames])).sort((a, b) => a - b),
      Array.from({ length: frames }, (_, i) => i), `${motion}: full cycle at the real game frame rate`);
    assert.equal(await page.locator('#player img:visible').count(), 1);
    assert(await page.locator(`#${motion}-sheet`).evaluate((image, frames) => {
      return image.naturalWidth === frames * 256 && image.clientWidth === frames * 192 &&
        Math.abs(new DOMMatrix(getComputedStyle(image).transform).m41 + Number(sprite.dataset.frame) * 192) < .01;
    }, frames), `${motion}: one complete cell in the real game`);
    await page.screenshot({ path: `.local/inbetweens-${motion}.png` });
    await page.evaluate(() => cancelAnimationFrame(window.movementSample));
    await page.keyboard.up('d');
    if (motion === 'run') await page.keyboard.up('Shift');
    await page.clock.runFor(34);
    assert.equal(await page.locator('#player').getAttribute('data-state'), 'idle');
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log('PASS: six expanded sheets, 42 new poses, original pixels, alpha, margins, grounded walk; complete 12/16-frame cycles, cropping and idle in Chromium.');
