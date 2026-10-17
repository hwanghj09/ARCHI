import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { interactionMessage, finishSceneTransition, reachInitialCorridor } from './scene-transition.mjs';
import { assertMirroredDoor, exitDoor } from './room-geometry.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const start = async () => {
    await page.clock.install({ time: new Date('2026-09-24T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.locator('#opening-skip').click();
    // Geometry checks use a constant walking speed, without low-sanity penalties.
    await page.evaluate(() => { sanity = 100; updateSanity(0); });
    await page.clock.pauseAt(new Date('2026-09-24T00:01:00Z'));
    await reachInitialCorridor(page);
    await page.locator('#floor17-extension > img').evaluate(img => img.decode());
  };
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const walkTo = async x => {
    const wasDark = await page.evaluate(() => buildingBlackout);
    const from = await position();
    const key = x > from ? 'd' : 'a';
    await page.keyboard.down(key);
    await page.clock.runFor(Math.abs(x - from) / 200 * 1000);
    await page.keyboard.up(key);
    await page.clock.runFor(100);
    if (!wasDark && await page.evaluate(() => buildingBlackout || blackoutSceneActive)) {
      if (await page.locator('#blackout-scene').isVisible()) await page.clock.runFor(5000);
      await walkTo(x);
    }
  };
  const enter = async () => {
    await page.keyboard.press('e');
    await finishSceneTransition(page);
  };
  const hint = () => page.locator('#interaction-hint').textContent();
  await start();
  assert.equal(await page.locator('#world').evaluate(el => el.style.width), '5000px');
  await walkTo(3200);
  assert(Math.abs(await position() - 3200) < 5, 'Old boundary is traversable');
  await page.screenshot({ path: '.local/floor17-extension-seam.png' });
  await walkTo(3684);
  assert.equal(await hint(), 'E · 화장실 들어가기');
  await page.keyboard.press('Space');
  await page.clock.runFor(150);
  await page.keyboard.press('e');
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor', 'Airborne entry stays blocked');
  await page.clock.runFor(1000);
  await enter();
  assert.equal(await page.locator('header span').textContent(), '17F · 화장실');
  assert(await page.locator('#floor17-extension').isHidden());
  await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
  assert.equal(await page.locator('#dynamic-scene .room-door').count(), 1);
  // The corridor shows wall on both sides of the restroom door (pilasters at x=3556 and 4282), so the same
  // 145x360 door sits away from the interior wall at the same share, on the blank tiles before the sinks.
  const restroomExit = await exitDoor(page);
  assert.deepEqual(restroomExit, { x: 185, y: 210, width: 145 });
  assertMirroredDoor({ x: 3556, width: 726 }, { x: 3612, width: 145 }, 1800, restroomExit, '17F restroom');
  assert(Math.abs(await position() - (restroomExit.x + 40)) < 1, 'Enter at the restroom door');
  await page.getByRole('checkbox', { name: '17층 조명' }).uncheck();
  assert(await page.locator('#darkness').isVisible(), 'Restroom shares 17F lighting');
  await page.getByRole('checkbox', { name: '17층 조명' }).check();
  await walkTo(850);
  await page.screenshot({ path: '.local/floor17-restroom.png' });
  await walkTo(1748);
  await page.keyboard.down('d');
  await page.clock.runFor(500);
  await page.keyboard.up('d');
  assert(Math.abs(await position() - 1748) < 1, 'Restroom has real floor and boundary collisions');
  await walkTo(32 + 20);
  assert(Math.abs(await position() - 52) < 1, 'Wall space left of the restroom door is walkable');
  await walkTo(restroomExit.x + restroomExit.width / 2);
  await enter();
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor');
  assert(Math.abs(await position() - 3652) < 1, 'Exit returns beside the correct corridor door');
  await walkTo(4095);
  assert.equal(await hint(), 'E · 소화전 조사');
  await page.keyboard.press('e');
  await page.getByRole('button', { name: '낡은 열쇠 줍기' }).click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  assert.match(await interactionMessage(page), /호스와 관창/);
  await page.screenshot({ path: '.local/floor17-extension.png' });
  await walkTo(4463);
  assert.equal(await hint(), 'E · 관리자 외 출입금지 (잠김)');
  await page.keyboard.press('e');
  await page.clock.runFor(800);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor');
  assert(await page.locator('#keypad').isVisible());
  assert.match(await page.locator('#keypad-text').textContent(), /관리자실 문이 잠겨/);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.locator('#interact').click();
  assert.equal(await page.locator('#room-transition').getAttribute('data-phase'), 'idle', 'Touch cannot bypass lock');
  await page.screenshot({ path: '.local/floor17-manager-locked-mobile.png' });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 720 });
  await walkTo(4990);
  assert(Math.abs(await position() - 4948) < 1, 'Extended corridor ends at the new wall');
  await walkTo(2996);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('header span').textContent(), 'RF · 옥상');
  await enter();
  assert.equal(await page.locator('#world').evaluate(el => el.style.width), '5000px');
  assert.equal(await page.locator('#floor17-extension .room-door').count(), 2, 'Stair round trip does not duplicate extension doors');

  // The real keypad unlocks the authored compact room; no routed source-code bypass is needed.
  await walkTo(4463);
  await page.keyboard.press('e');
  await page.locator('#keypad-input').fill('1706');
  await page.locator('#keypad-input').press('Enter');
  assert.equal(await hint(), 'E · 관리자 외 출입금지 들어가기');
  await enter();
  assert.equal(await page.locator('header span').textContent(), '17F · 관리자실');
  assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 2);
  await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
  const managerExit = await exitDoor(page);
  assert.deepEqual(managerExit, { x: 182, y: 210, width: 171 });
  assertMirroredDoor({ x: 4282, width: 686 }, { x: 4378, width: 171 }, 1040, managerExit, '17F manager room');
  await walkTo(900);
  await page.screenshot({ path: '.local/floor17-manager-interior.png' });
  await walkTo(managerExit.x + managerExit.width / 2);
  await enter();
  assert(Math.abs(await position() - 4418) < 1, 'Future unlocked room already supports exit to its own door');
  assert.deepEqual(errors, []);
  console.log('PASS: 17F extension, restroom round trip, hydrant, locked manager room, authored unlock path, lighting, stairs, boundaries and mobile.');
} finally {
  await browser.close();
}
