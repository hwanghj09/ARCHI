import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);
  const hold = async (key, ms) => {
    await page.keyboard.down(key); await page.clock.runFor(ms); await page.keyboard.up(key); await page.clock.runFor(34);
  };
  const place = async x => {
    await page.evaluate(x => { Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction(); render(); }, x);
    await page.clock.runFor(100);
  };
  const message = () => page.locator('#inspection-description').textContent();
  const close = () => page.keyboard.press('Escape');
  await page.locator('#office-badge img').evaluate(img => img.decode());
  assert(await page.locator('#office-badge').isVisible());
  assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 컴퓨터 사용');
  await hold('d', 450);
  assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 출입증 챙기기');
  await page.screenshot({ path: '.local/suho-badge-desk.png' });
  await page.keyboard.press('e');
  assert.match(await message(), /내 출입증.*정수호/);
  assert(await page.locator('#office-badge').isHidden());
  assert.equal(await page.locator('#inventory-button').textContent(), '가방 (1) · I');
  await page.locator('#inspection-sheet img').evaluate(img => img.decode());
  await page.clock.runFor(600);
  await page.screenshot({ path: '.local/suho-badge-inspection.png' });
  await close();
  await page.keyboard.press('i');
  await page.locator('[data-item="f17-badge"]').click();
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'card');
  assert.match(await page.locator('#inspection-sheet img').getAttribute('src'), /jeong-suho/);
  await close();
  await page.evaluate(() => { performRoomChange(); performRoomChange(); });
  assert(await page.locator('#office-badge').isHidden(), 'Returning to desk must not respawn the badge');
  await page.evaluate(() => { triggerBuildingBlackout(); performFloorChange('f17'); showCabin(0); elevatorCars[0].floor = 17; refreshCabin(); });
  // All formerly restricted floor buttons work with no badge at all; keep B2 restriction.
  await page.evaluate(() => collectedItems.delete('f17-badge'));
  for (const floor of [12, 13, 14, 15]) {
    const button = page.locator(`[data-floor="${floor}"].cabin-hit`);
    await button.click(); assert.equal(await button.getAttribute('aria-pressed'), 'true'); await button.click();
  }
  await page.locator('[data-floor="-2"].cabin-hit').click();
  assert.match(await page.locator('#cabin-status').textContent(), /운행 제한/);
  await page.locator('[data-floor="15"].cabin-hit').click();
  await page.locator('#cabin-close').click(); await page.clock.runFor(5000);
  await page.locator('#cabin-exit').click(); await page.clock.runFor(800);
  assert.equal(await page.evaluate(() => currentSceneFloor), 15, 'Ride and alight with no employee card');
  await hold('a', 600);
  assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 출입증 태그');
  await page.keyboard.press('e'); assert.match(await message(), /출입증이 없으면/); await close();
  await page.evaluate(() => collectedItems.add('f17-badge'));
  await page.keyboard.press('e'); assert.match(await message(), /미등록 출입증 · 인증 거부/); await close();
  for (const floor of [15, 14, 13, 12]) {
    for (const car of [0, 1, 2]) {
      await page.evaluate(({ floor, car }) => performFloorChange(`f${floor}`, car), { floor, car });
      assert.equal(await page.locator('.access-gate').count(), 2);
      assert(await page.evaluate(() => body.position.x > 1806 && body.position.x < 2740));
    }
    for (const [x, key, min, max] of [[1850, 'a', 1825, 1827], [2695, 'd', 2719, 2721]]) {
      await place(x); await hold(key, 800);
      let at = await page.evaluate(() => body.position.x);
      assert(at >= min && at <= max, `${floor}F ${key} gate blocks walking: ${at}`);
      await page.keyboard.down(key); await page.keyboard.press('Space'); await page.clock.runFor(1400); await page.keyboard.up(key);
      at = await page.evaluate(() => body.position.x);
      assert(at >= min && at <= max, `${floor}F ${key} gate blocks jumping: ${at}`);
    }
    await place(2720); await page.keyboard.press('e'); assert.match(await message(), /미등록/); await close();
  }
  // Acquire the real team card from its existing table interaction, then authenticate every floor separately.
  await page.evaluate(() => performFloorChange('f16-cafe', null, 'exit'));
  await place(950); await page.keyboard.press('e'); assert.match(await message(), /조현아/); await close();
  assert(await page.evaluate(() => collectedItems.has('f16-badge')));
  assert.equal(await page.locator('#inventory-button').textContent(), '가방 (2) · I');
  for (const floor of [12, 13, 14, 15]) {
    await page.evaluate(floor => { performFloorChange(`f${floor}`); solarEnabled = true; solarPoweredFloor = floor; updatePowerState(); }, floor);
    assert.equal(await page.locator('.access-gate[data-open="false"]').count(), 2, 'Other floors remain locked');
    await place(1826);
    if (floor === 12) await page.screenshot({ path: '.local/access-gate-closed.png' });
    await page.keyboard.press('e'); assert.match(await message(), /조현아 팀장 사원증 인증 완료/); await close();
    await page.clock.runFor(500);
    assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2);
    assert(await page.evaluate(() => currentDoors.filter(door => door.accessGate).every(door => !door.solid)));
    if (floor === 12) await page.screenshot({ path: '.local/access-gate-open.png' });
    await hold('a', 650); assert(await page.evaluate(() => body.position.x < 1774));
    await place(2695); await hold('d', 800); assert(await page.evaluate(() => body.position.x > 2772));
    await page.evaluate(floor => { performFloorChange('f16'); performFloorChange(`f${floor}`); }, floor);
    assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2, 'Revisit preserves access');
  }
  await page.evaluate(() => performFloorChange('f11'));
  assert.equal(await page.locator('.access-gate').count(), 0, 'Other floor barriers stay intact');
  assert.equal(await page.locator('.barrier.shutter').count(), 1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#inventory-button').tap();
  await page.locator('[data-item="f17-badge"]').tap();
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'card');
  await page.locator('#inspection-sheet img').evaluate(img => img.decode());
  await page.clock.runFor(600);
  const cardBox = await page.locator('#inspection-sheet img').boundingBox();
  assert(cardBox.width > 100 && cardBox.height > 100 && cardBox.x >= 0 && cardBox.x + cardBox.width <= 390, 'Mobile card is visible within the viewport');
  await page.screenshot({ path: '.local/suho-badge-mobile.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: desk pickup, inventory/card/touch, unrestricted elevator travel, all 4 floors × 3 landings, bilateral walk/jump blocking, missing/revoked/valid badges, per-floor authentication and persistent reopening.');
} finally { await browser.close(); }
