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
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  assert.equal(await page.locator('.phone-charger:visible').count(), 0);
  const state = () => page.evaluate(() => ({ battery: phoneBattery, light: phoneLightOn, dock: phoneDock,
    modal: usingPhone, x: body.position.x, held: sprite.dataset.phoneHeld }));
  const place = async (x, battery = null) => {
    await page.evaluate(({ x, battery }) => {
      if (battery !== null) { phoneBattery = battery; phoneLightOn = false; phoneDrainAccumulator = 0; }
      Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; refreshPhone(); animate(0); updateInteraction(); cameraX = cameraTarget(); render();
    }, { x, battery });
    await page.clock.runFor(50);
  };
  const charger = () => page.evaluate(() => { const door = currentDoors.find(door => door.phoneCharger); return door.x + door.width / 2; });
  // Before the outage, mains power charges even when the light switch is off.
  await page.evaluate(() => { performRoomChange(); world.dataset.lights = 'off'; });
  await place(await charger(), 20); await page.keyboard.press('e');
  await page.clock.runFor(2100); assert.equal((await state()).battery, 24);
  await page.keyboard.press('e'); assert.equal((await state()).dock, null);
  await page.evaluate(() => { triggerBuildingBlackout(); world.dataset.lights = 'on'; });
  let stations = 0;
  for (const floor of [-2, -1, ...Array.from({ length: 17 }, (_, i) => i + 1), 18]) {
    const id = floor === 18 ? 'rooftop' : floor < 0 ? `b${-floor}` : `f${floor}`;
    await page.evaluate(id => { solarEnabled = false; solarPoweredFloors = []; performFloorChange(id, id === 'rooftop' ? null : 0); }, id);
    const chargers = await page.evaluate(() => currentDoors.filter(door => door.phoneCharger).map(door => ({ x: door.x, width: door.width })));
    assert.equal(chargers.length, floor === 17 ? 2 : floor === 18 ? 0 : 1); stations += chargers.length;
    if (floor !== 17 && floor !== 18) assert(await page.evaluate(() => {
      const [first, second] = currentDoors.filter(door => door.type === 'elevator');
      const point = currentDoors.find(door => door.phoneCharger);
      return point.x >= first.x + first.width && point.x + point.width <= second.x;
    }), `${id} charger clears both elevator doors`);
    for (const point of chargers) {
      await place(point.x + point.width / 2, 0);
      if (floor > 0) {
        assert.match(await page.locator('#interaction-hint').textContent(), /전력 없음/);
        await page.keyboard.press('e'); assert.equal((await state()).dock, null);
        await page.clock.runFor(1000); assert.equal((await state()).battery, 0);
        await page.evaluate(floor => { solarEnabled = true; solarPoweredFloors = floor === 18 ? [] : [floor]; updatePowerState(); }, floor);
      }
      await page.keyboard.press('e');
      assert.deepEqual((await state()).dock, { floor, x: point.x });
      assert.equal((await state()).battery, 0, 'Docking does not instantly refill the battery');
      assert.equal(await page.locator('.docked-phone:visible').count(), 1);
      await page.clock.runFor(2100); assert.equal((await state()).battery, 4);
      await page.keyboard.press('e'); assert.equal((await state()).dock, null);
      assert.equal(await page.locator('.docked-phone:visible').count(), 0);
      await page.evaluate(() => { solarEnabled = false; solarPoweredFloors = []; updatePowerState(); });
    }
  }
  assert.equal(stations, 20);
  console.log('PASS: all 20 stations and their floor power/door clearance.');
  // Flashlight, device UI, motion and a different charging station while the phone is left behind.
  await page.evaluate(() => { solarEnabled = true; solarPoweredFloors = [12]; performFloorChange('f12'); });
  const at = await charger(); await place(at, 20);
  await page.keyboard.press('f'); await page.clock.runFor(300); await page.keyboard.press('e');
  assert.equal((await state()).light, false); assert.equal((await state()).held, 'false');
  await page.keyboard.press('p'); await page.keyboard.press('f');
  assert.equal((await state()).modal, false); assert.equal((await state()).light, false);
  assert(await page.locator('#phone').isHidden());
  const from = (await state()).x;
  await page.keyboard.down('Shift'); await page.keyboard.down('d'); await page.clock.runFor(650);
  await page.keyboard.up('d'); await page.keyboard.up('Shift');
  assert((await state()).x > from + 80, 'Player can run freely without the docked phone');
  assert.equal(await page.locator('.access-gate[data-open="false"]').count(), 2);
  await page.evaluate(() => performFloorChange('f13'));
  const beforeAway = (await state()).battery;
  await page.clock.runFor(3000); assert.equal((await state()).battery, beforeAway + 6, 'Charging follows the origin floor power');
  await place(await charger()); await page.keyboard.press('e'); assert.equal((await state()).dock.floor, 12);
  // Native power controls reroute power away from the phone's floor, then restore it.
  // A second floor (13F) joins 12F without cutting it; pressing lit 12F again turns off only 12F.
  await page.evaluate(() => openPowerPanel());
  await page.locator('#power-floor-grid button[data-floor="13"]').click(); await page.keyboard.press('Escape');
  const shared = (await state()).battery;
  await page.clock.runFor(3000); assert((await state()).battery > shared, 'Adding a second floor keeps 12F charging');
  await page.evaluate(() => openPowerPanel());
  await page.locator('#power-floor-grid button[data-floor="12"]').click(); await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(() => solarPoweredFloors), [13]);
  const stopped = (await state()).battery;
  await page.clock.runFor(3000); assert.equal((await state()).battery, stopped);
  await page.evaluate(() => performFloorChange('f12')); await place(at);
  assert.equal(await page.locator('.docked-phone:visible').count(), 1, 'The phone survives rebuilding the floor');
  assert.match(await page.locator('#interaction-hint').textContent(), /가져가기.*충전 중단/);
  await page.evaluate(() => openPowerPanel());
  await page.locator('#power-floor-grid button[data-floor="12"]').click(); await page.keyboard.press('Escape');
  await page.clock.runFor(2000); assert.equal((await state()).battery, stopped + 4);
  // Charging keeps running while the player is in the elevator or reading a document.
  await page.evaluate(() => { elevatorCars[0].floor = 12; showCabin(0); });
  const inCabin = (await state()).battery; await page.clock.runFor(2000);
  assert.equal((await state()).battery, inCabin + 4);
  await page.keyboard.press('Escape'); await page.clock.runFor(900);
  await page.evaluate(() => openInspection('메모', '휴대폰을 두고 문서를 읽는다.'));
  const reading = (await state()).battery; await page.clock.runFor(2000);
  assert.equal((await state()).battery, reading + 4); await page.keyboard.press('Escape');
  await place(at); await page.evaluate(() => { phoneBattery = 98; refreshPhone(); }); await page.clock.runFor(2100);
  assert.equal((await state()).battery, 100); assert((await state()).dock, 'Full charge still requires physical retrieval');
  await page.keyboard.press('p'); assert.equal((await state()).modal, false);
  await page.screenshot({ path: '.local/phone-charger-floor12.png' });
  // A power failure cannot prevent retrieval. Neither pickup nor completion auto-enables the flashlight.
  await page.evaluate(() => openPowerPanel()); await page.locator('#power-lever').click(); await page.keyboard.press('Escape');
  await place(at); await page.keyboard.press('e');
  assert.equal((await state()).dock, null); assert.equal((await state()).light, false);
  await page.keyboard.press('f'); await page.clock.runFor(1100); assert.equal((await state()).battery, 99);
  await page.keyboard.press('f');
  // Shared interaction guards reject distant, airborne and modal docking.
  await page.evaluate(() => { solarEnabled = true; solarPoweredFloors = [12]; updatePowerState(); });
  await place(at + 90, 15); await page.keyboard.press('e'); assert.equal((await state()).dock, null);
  await place(at, 15); await page.keyboard.press('Space'); await page.clock.runFor(150);
  await page.keyboard.press('e'); assert.equal((await state()).dock, null);
  await page.clock.runFor(1100); await page.keyboard.press('p'); await page.keyboard.press('e');
  assert.equal((await state()).dock, null); await page.keyboard.press('Escape');
  // Mobile docking, blocked device access and early retrieval.
  await page.setViewportSize({ width: 390, height: 844 }); await place(at, 10);
  await page.locator('#interact').tap(); await page.locator('#phone-button').tap();
  assert.equal((await state()).modal, false); await page.clock.runFor(2100);
  assert.equal((await state()).battery, 14);
  await page.screenshot({ path: '.local/phone-charger-mobile.png' });
  await page.locator('#interact').tap(); assert.equal((await state()).dock, null);
  await page.locator('#phone-button').tap(); assert.equal((await state()).modal, true);
  assert.equal(await page.locator('#phone-battery').textContent(), '14%'); await page.keyboard.press('Escape');
  await place(at, 100); await page.locator('#interact').tap(); assert.equal((await state()).dock, null);
  // Losing power before completion pauses progress and still allows partial pickup.
  await place(at, 10); await page.locator('#interact').tap(); await page.clock.runFor(2000);
  await page.evaluate(() => { solarEnabled = false; solarPoweredFloors = []; updatePowerState(); });
  const partial = (await state()).battery; await page.clock.runFor(5000);
  assert.equal((await state()).battery, partial); await page.locator('#interact').tap();
  assert.equal((await state()).dock, null); assert.equal((await state()).battery, partial);
  // The two stations on 17F are distinct; pickup requires returning to the original one.
  await page.evaluate(() => { solarEnabled = true; solarPoweredFloors = [17]; performFloorChange('f17'); });
  const points = await page.evaluate(() => currentDoors.filter(door => door.phoneCharger).map(door => ({ x: door.x, center: door.x + door.width / 2 })));
  await place(points[0].center, 10); await page.locator('#interact').tap();
  await place(points[1].center); await page.locator('#interact').tap();
  assert.equal((await state()).dock.x, points[0].x);
  await place(points[0].center); await page.locator('#interact').tap(); assert.equal((await state()).dock, null);
  assert.deepEqual(errors, []);
  console.log('PASS: 20 stations, mains/emergency/solar power, deposit/partial pickup, 2%/second, remote progress/power loss/resume, flashlight/device lock, free running, cabin/reading, capacity, interaction guards, mobile and scene rebuild.');
} finally { await browser.close(); }
