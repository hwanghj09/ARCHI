import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const { data, info } = await sharp('assets/player/jeong-suho-idle-four.png').ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
assert.deepEqual([info.width, info.height], [1254, 1254], 'Keep the existing idle cell sizes and anchors');
for (let frame = 0; frame < 4; frame++) {
  const left = frame % 2 * 627, top = Math.floor(frame / 2) * 627;
  // The broken poses abruptly swapped a whole horizontal strip of hand and trousers.
  for (let y = 310; y < 385; y++) {
    let abruptPixels = 0;
    for (let x = 220; x < 400; x++) {
      const p = ((top + y) * info.width + left + x) * 4, above = p - info.width * 4;
      if (data[p + 3] > 128 && data[above + 3] > 128 &&
        Math.abs(data[p] - data[above]) + Math.abs(data[p + 1] - data[above + 1]) +
        Math.abs(data[p + 2] - data[above + 2]) > 180) abruptPixels++;
    }
    assert(abruptPixels <= 25, `Idle frame ${frame}, row ${y}: no horizontal wrist/thigh tear (${abruptPixels} pixels)`);
  }
}

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-18T00:01:00Z'));
  await page.locator('#idle-sprite').evaluate(image => image.decode());
  for (const [key, direction] of [['d', 1], ['a', -1]]) {
    await page.keyboard.down(key);
    await page.clock.runFor(200);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
    const position = await page.evaluate(() => ({ ...body.position }));
    const frames = new Set();
    for (let elapsed = 0; elapsed < 6500; elapsed += 100) {
      const state = await page.evaluate(() => ({ state: sprite.dataset.state,
        frame: Number(sprite.dataset.frame), facing, x: body.position.x, y: body.position.y }));
      assert.equal(state.state, 'idle', 'Releasing movement returns to idle');
      assert.equal(state.facing, direction);
      assert(Math.abs(state.x - position.x) < 1 && Math.abs(state.y - position.y) < 1,
        'Breathing and blinking keep the player planted');
      assert.equal(await page.locator('#player img:visible').count(), 1, 'Only the selected sheet is visible');
      if (!frames.has(state.frame)) {
        await page.locator('#player').screenshot({ path: `.local/idle-after-${direction}-${state.frame}.png` });
        frames.add(state.frame);
      }
      await page.clock.runFor(100);
    }
    assert.deepEqual([...frames].sort(), [0, 1, 2, 3], 'Both directions play every idle pose over repeated loops');
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log('PASS: all four idle poses have continuous wrists/trousers; repeated breathing/blinking loops, planted feet and movement-to-idle transitions in both directions.');
