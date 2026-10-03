import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { reachInitialCorridor } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
    const state = () => page.evaluate(() => ({ blackout: buildingBlackout, powered: world.dataset.powered,
      lights: world.dataset.backgroundLights, called: elevatorCars.some(car => car.travelling) }));
    assert.deepEqual(await state(), { blackout: false, powered: 'true', lights: 'on', called: false });
    assert(await page.locator('#darkness').isHidden());
    if (viewport.width === 1280) await page.clock.runFor(5700);
    else await page.locator('#opening-skip').click();
    assert(await page.locator('#opening').isHidden());
    assert.equal(await page.locator('#office-computer').getAttribute('data-power'), 'off');
    assert.equal((await state()).lights, 'on', 'Computer shutdown leaves room lights on');
    await page.screenshot({ path: `.local/blackout-office-lit-${viewport.width}.png` });
    await reachInitialCorridor(page);
    assert.equal((await state()).blackout, false, 'Leaving the office does not cause the outage');
    // Walk to just outside the existing call range, then jump into it.
    const distance = await page.evaluate(() => doors[0].x - 40 - body.position.x);
    await page.keyboard.down('d'); await page.clock.runFor(distance / 200 * 1000); await page.keyboard.up('d');
    await page.clock.runFor(34);
    assert.equal((await state()).blackout, false, 'Corridor stays lit until the call position');
    await page.screenshot({ path: `.local/blackout-corridor-lit-${viewport.width}.png` });
    await page.keyboard.press('Space'); await page.keyboard.down('d');
    await page.clock.runFor(200); await page.keyboard.up('d');
    assert.equal((await state()).blackout, false, 'Only standing in the call range triggers the outage');
    await page.clock.runFor(1000);
    assert.deepEqual(await state(), { blackout: true, powered: 'false', lights: 'off', called: false });
    assert(await page.locator('#darkness').isVisible());
    assert.match(await page.locator('#interaction-status').textContent(), /건물 전체의 불이 꺼졌다/);
    assert(await page.locator('img[data-lit-src]').evaluateAll(imgs => imgs.every(img => img.getAttribute('src') === img.dataset.unlitSrc)),
      'Both office and corridor switch to their unlit art');
    await page.locator('img[data-lit-src]').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    await page.screenshot({ path: `.local/blackout-elevator-${viewport.width}.png` });
    await page.keyboard.press('e');
    assert.equal((await state()).called, true, 'Elevator remains callable after the outage');
    await page.evaluate(() => { performRoomChange(); });
    assert.equal((await state()).lights, 'off', 'Office remains dark on return');
    await page.evaluate(() => { solarPoweredFloor = 17; updatePowerState(); performRoomChange(); });
    assert.deepEqual(await state(), { blackout: true, powered: 'true', lights: 'on', called: true });
    assert(await page.locator('#darkness').isHidden(), 'Returning to the elevator does not repeat the outage after restoration');
    await page.evaluate(() => performFloorChange('f16'));
    assert.equal((await state()).powered, 'false', 'Other above-ground floors lost mains power too');
    await page.evaluate(() => performFloorChange('b1'));
    assert.equal((await state()).powered, 'true', 'Basement emergency circuit remains operational');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: bright opening and corridor, grounded approach triggers one outage before calling, persistence, solar recovery, basement emergency power, desktop and mobile.');
} finally {
  await browser.close();
}
