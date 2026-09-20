import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-09-20T00:01:00Z'));
  await page.clock.runFor(100);
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.clock.runFor(ms);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  await hold('d', 4000);
  await page.keyboard.press('Space');
  await hold('d', 400);
  await page.clock.runFor(500);
  await page.keyboard.press('Space');
  await hold('d', 4400);
  await page.keyboard.press('e');
  await page.clock.runFor(19400);
  await page.keyboard.press('e');
  const cabin = page.locator('#elevator-cabin');
  assert(await cabin.isVisible());
  assert(await page.locator('#stage').evaluate(el => el.inert));
  assert.equal(await page.locator('#cabin-art').evaluate(el => el.naturalWidth), 1536);
  const floorButtons = page.locator('#cabin-floor-buttons button');
  assert.deepEqual(await floorButtons.evaluateAll(els => els.map(el => Number(el.dataset.floor))),
    [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2]);
  for (const button of await floorButtons.all()) {
    if (await button.isDisabled()) continue;
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
  }
  await page.screenshot({ path: '.local/cabin-desktop-open.png' });
  const playerPosition = await page.locator('#player').getAttribute('style');
  await hold('d', 200);
  assert.equal(await page.locator('#player').getAttribute('style'), playerPosition, 'World input is locked inside');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(1200);
  assert.equal(await page.locator('#cabin-scene').getAttribute('data-door'), 'closed');
  await page.keyboard.press('Escape');
  assert(await cabin.isVisible(), 'Cannot exit a closed cabin');
  await page.screenshot({ path: '.local/cabin-desktop-closed.png' });
  await page.locator('#cabin-open').click();
  await page.clock.runFor(1200);
  await page.locator('[data-floor="16"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(300);
  await page.locator('#cabin-open').click();
  await page.clock.runFor(1800);
  assert.equal(await cabin.getAttribute('data-floor'), '17', 'Reopening cancels departure');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(1300);
  assert.equal(await cabin.getAttribute('data-moving'), 'true');
  assert(await page.locator('#cabin-open').isDisabled());
  assert(await page.locator('#cabin-exit').isDisabled());
  await page.keyboard.press('Escape');
  assert(await cabin.isVisible());
  await page.clock.runFor(2400);
  assert.equal(await cabin.getAttribute('data-floor'), '16');
  await page.locator('#cabin-exit').click();
  assert.equal(await page.locator('header span').textContent(), '16F · 빈 층');
  await page.clock.runFor(100);
  assert(await page.locator('#player').evaluate(el =>
    Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42 + 178 - 570) < 1));
  await page.keyboard.press('e');
  assert(await cabin.isVisible(), 'Can reboard at the arrival floor');
  for (let floor = 15; floor >= 1; floor--) {
    await page.locator(`#cabin-floor-buttons [data-floor="${floor}"]`).click();
    if (floor !== 15) await page.locator('#cabin-close').click();
    await page.clock.runFor(floor === 15 ? 5300 : 3600);
    assert.equal(await cabin.getAttribute('data-floor'), String(floor));
    await page.locator('#cabin-exit').click();
    assert.equal(await page.locator('header span').textContent(), `${floor}F · 빈 층`);
    assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Only floor and boundary walls');
    assert.equal(await page.locator('#dynamic-scene .door').count(), 3, 'Three return elevators');
    assert.equal(await page.locator('#dynamic-scene .solid:not(.floor):not(.boundary), #dynamic-scene .panel').count(), 0);
    await page.clock.runFor(100);
    if (floor === 10) await page.screenshot({ path: '.local/empty-floor-10.png' });
    await page.keyboard.press('e');
    assert(await cabin.isVisible(), `Floor ${floor} must allow reboarding`);
  }
  const seen = new Set();
  await page.locator('[data-floor="-2"]').click();
  await page.locator('#cabin-close').click();
  for (let i = 0; i < 10; i++) {
    await page.clock.runFor(500);
    seen.add(await cabin.getAttribute('data-floor'));
  }
  assert(seen.has('-1') && seen.has('-2') && !seen.has('0'), 'Basement travel skips floor zero');
  await page.locator('#cabin-exit').click();
  assert.equal(await page.locator('header span').textContent(), 'B2 · 빈 층');
  assert.equal(await page.locator('#dynamic-scene .solid').count(), 3);
  await page.clock.runFor(100);
  await page.keyboard.press('e');
  await page.setViewportSize({ width: 390, height: 844 });
  await cabin.evaluate(el => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
  await page.locator('[data-floor="-1"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(3600);
  assert.equal(await cabin.getAttribute('data-floor'), '-1');
  await page.locator('#cabin-alarm').click();
  assert.equal(await page.locator('#cabin-status').textContent(), '비상벨 작동');
  await page.screenshot({ path: '.local/cabin-mobile.png' });
  await page.locator('#cabin-exit').focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.getElementById('elevator-cabin').contains(document.activeElement)));
  await page.locator('#cabin-exit').click();
  assert.equal(await page.locator('header span').textContent(), 'B1 · 빈 층');
  assert.equal(await page.locator('#dynamic-scene .solid').count(), 3);
  assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
  assert.deepEqual(errors, []);
  console.log('PASS: 19 mouse floor buttons, door controls, reopen cancellation, travel locks, same-car reboarding, all-floor destinations, basement numbering, alarm, keyboard focus and mobile cabin.');
} finally {
  await browser.close();
}
