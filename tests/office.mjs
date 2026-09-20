import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.clock.runFor(100);
  await page.locator('#office-background').evaluate(image => image.decode());
  const state = () => page.locator('#player').evaluate(el => {
    const transform = new DOMMatrix(getComputedStyle(el).transform);
    return { x: transform.m41 + 96, feet: transform.m42 + 178, room: el.parentElement.dataset.room };
  });
  const hold = async (key, duration) => {
    await page.keyboard.down(key);
    await page.clock.runFor(duration);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const near = (actual, expected) => assert(Math.abs(actual - expected) < 1, `${actual} should equal ${expected}`);
  const transition = async room => {
    await page.clock.runFor(800);
    await page.waitForFunction(room => document.getElementById('world').dataset.room === room &&
      getComputedStyle(document.getElementById('room-transition')).opacity === '0', room, { polling: 50 });
    await page.clock.runFor(100);
    assert.equal((await state()).room, room);
    near((await state()).feet, 570);
  };

  await page.keyboard.press('e');
  assert.equal((await state()).room, 'corridor', 'A distant door cannot be entered');
  await hold('d', 2100);
  const entrance = await state();
  assert.match(await page.locator('#interaction-hint').textContent(), /사무실 들어가기/);
  await page.screenshot({ path: '.local/office-entrance.png' });
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'corridor', 'Airborne entry is blocked');
  await page.clock.runFor(1000);
  await page.keyboard.down('e');
  await transition('office');
  await page.keyboard.down('e');
  await page.keyboard.up('e');
  assert.equal((await state()).room, 'office', 'Held E must not immediately exit');
  assert.equal(await page.locator('.door:visible, .elevator-indicator:visible, .solid:visible').count(), 0);
  assert.equal(await page.locator('#office-background').isVisible(), true);
  near((await state()).x, 160);
  await page.screenshot({ path: '.local/office-desktop.png' });

  await hold('d', 6000);
  assert((await state()).x > 1300, 'Corridor obstacles must not block the office');
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'office', 'Exit requires being near the door');
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  assert((await state()).feet < 500, 'Office jump uses the same physics');
  await page.clock.runFor(1000);
  near((await state()).feet, 570);
  await hold('d', 7000);
  near((await state()).x, 2348);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  near((await state()).feet, 570);
  await page.screenshot({ path: '.local/office-mobile.png' });
  await hold('a', 12000);
  near((await state()).x, 52);
  await hold('d', 540);
  await page.locator('#interact').click();
  await transition('corridor');
  near((await state()).x, entrance.x);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.clock.runFor(100);
  await hold('d', 2000);
  near((await state()).x, 960);
  await page.keyboard.press('Space');
  await hold('d', 400);
  await page.clock.runFor(500);
  await page.keyboard.press('Space');
  await hold('d', 1200);
  await page.clock.runFor(100);
  const secondEntrance = await state();
  assert.match(await page.locator('#interaction-hint').textContent(), /사무실 들어가기/);
  await page.keyboard.press('e');
  await transition('office');
  await page.keyboard.press('e');
  await transition('corridor');
  near((await state()).x, secondEntrance.x);
  assert.equal(await page.locator('.elevator-indicator').first().textContent(), '01F');
  assert.deepEqual(errors, []);
  console.log('PASS: both office entrances, return positions, held/distant/airborne E guards, floor/wall collisions, jump, camera and mobile rendering.');
} finally {
  await browser.close();
}
