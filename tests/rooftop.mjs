import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { reachInitialCorridor, collectRooftopKey } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-09-20T00:01:00Z'));
  await reachInitialCorridor(page);
  await collectRooftopKey(page);
  const state = () => page.locator('#player').evaluate(el => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return { x: matrix.m41 + 96, feet: matrix.m42 + 178, room: el.parentElement.dataset.room };
  });
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.clock.runFor(ms);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const arrived = async room => {
    await page.clock.runFor(800);
    await page.waitForFunction(room => document.getElementById('world').dataset.room === room &&
      getComputedStyle(document.getElementById('room-transition')).opacity === '0', room);
    await page.clock.runFor(100);
    assert(Math.abs((await state()).feet - 570) < 1);
  };
  await hold('d', 13800);
  assert.match(await page.locator('#interaction-hint').textContent(), /옥상으로 올라가기/);
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'corridor', 'Airborne stair use is blocked');
  await page.clock.runFor(1000);
  await page.keyboard.down('e');
  await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await arrived('dynamic');
  await page.keyboard.down('e');
  await page.keyboard.up('e');
  assert.equal((await state()).room, 'dynamic', 'Held E must not immediately return');
  assert.equal(await page.locator('header > span').textContent(), 'RF · 옥상');
  assert.equal(await page.locator('#dynamic-scene .door').count(), 1);
  assert.equal(await page.locator('.elevator-indicator:visible').count(), 0);
  assert.equal(await page.locator('#cabin-floor-buttons button').count(), 19);
  assert.equal(await page.locator('#cabin-floor-buttons [data-floor="18"]').count(), 0);
  await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
  assert.deepEqual(await page.locator('#dynamic-scene > img').evaluate(img => [img.naturalWidth, img.naturalHeight]), [2400, 760]);
  const supply = page.locator('#dynamic-scene .solar-supply');
  assert.equal(await supply.count(), 1);
  assert(await supply.isVisible());
  assert(await supply.locator('img').evaluate(img => img.naturalWidth === 1774 && img.naturalHeight === 887 &&
    img.clientWidth === img.parentElement.clientWidth * 2 && getComputedStyle(img).transform === 'none'), 'Only the off frame is shown');
  assert(await supply.evaluate(el => Math.abs(parseFloat(el.style.top) + 691 * el.clientWidth / 887 - 570) < 1),
    'Solar device rests on the roof floor');
  await page.screenshot({ path: '.local/rooftop-desktop.png' });
  await hold('d', 3300); // 옛 태양광 작업 설명서 자리까지 걸어가던 이동은 태양광 장치 위치에 맞춰 그대로 둔다
  await hold('d', 900);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({ path: '.local/solar-supply-mobile.png' });
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'dynamic', 'The solar device is not a stair interaction');
  assert(await page.locator('#power-panel').isVisible(), 'The solar device opens its power controls');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 720 });
  await hold('d', 11000);
  assert(Math.abs((await state()).x - 2348) < 1, 'Roof boundary blocks movement');
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'dynamic', 'Distant stairs cannot be used');
  await page.keyboard.press('Space');
  await page.clock.runFor(150);
  assert((await state()).feet < 500, 'Roof physics allows jumping');
  await page.clock.runFor(1000);
  await hold('a', 11000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({ path: '.local/rooftop-mobile.png' });
  assert.match(await page.locator('#interaction-hint').textContent(), /17층으로 내려가기/);
  await page.keyboard.press('e');
  await arrived('corridor');
  assert.equal(await page.locator('header > span').textContent(), '17F · 복도');
  assert(Math.abs((await state()).x - 2946) < 1, 'Return to the 17F stair door');
  assert.equal(await page.locator('#dynamic-scene .door').count(), 0);
  assert.equal(await supply.count(), 0, 'Device is removed when leaving the roof');
  assert.equal(await manual.count(), 0, 'Manual is removed when leaving the roof');
  await page.keyboard.press('e');
  await arrived('dynamic');
  assert.equal(await page.locator('#dynamic-scene .door').count(), 1, 'Reentry does not duplicate doors');
  assert.equal(await supply.count(), 1, 'Reentry creates exactly one device');
  assert.equal(await manual.count(), 1, 'Reentry creates exactly one manual');
  await page.keyboard.press('e');
  await arrived('corridor');
  assert.deepEqual(errors, []);
  console.log('PASS: rooftop stair round trips, solar placement and cleanup, input guards, collisions, mobile controls, and no elevator roof stop.');
} finally {
  await browser.close();
}
