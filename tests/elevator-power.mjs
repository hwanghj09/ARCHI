import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { reachInitialCorridor, collectRooftopKey, finishSceneTransition } from './scene-transition.mjs';

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
  await page.evaluate(() => { sanity = 100; refreshSanity(); });
  await page.clock.runFor(100);
  assert(await page.evaluate(() => elevatorHasPower()), 'Mains power operates before the outage');
  await reachInitialCorridor(page);
  const walkTo = async target => {
    const from = await page.evaluate(() => body.position.x);
    const key = target > from ? 'd' : 'a';
    await page.keyboard.down(key); await page.clock.runFor(Math.abs(target - from) / 200 * 1000);
    await page.keyboard.up(key); await page.clock.runFor(34);
  };
  await walkTo(1858); if (await page.locator('#blackout-scene').isVisible()) await page.locator('#blackout-skip').click();
  assert(await page.evaluate(() => buildingBlackout && !solarEnabled && !elevatorHasPower()));
  for (const x of [1858, 2188, 2484]) {
    await walkTo(x); await page.keyboard.press('e');
    assert.match(await page.locator('#interaction-status').textContent(), /관리자실.*비상 전력 회선/);
    assert(await page.evaluate(() => elevatorCars.every(car => !car.travelling && car.floor === 1)));
  }
  // The complete recovery route stays reachable with all three cars stopped.
  await collectRooftopKey(page); await walkTo(2946);
  await page.keyboard.press('e'); await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => currentSceneFloor), 18);
  await walkTo(1040); await page.keyboard.press('e');
  assert(await page.locator('#power-panel').isVisible());
  assert(await page.locator('#power-floor-grid button').first().isDisabled());
  assert.equal(await page.evaluate(() => elevatorHasPower()), false);
  // The password and its post-success wire puzzle are covered in tests/solar-ui.mjs; this test is
  // about elevator power, so pre-fix the wiring and let the real lever alone turn power on.
  await page.evaluate(() => collectedItems.add('roof-wires-fixed'));
  // Keyboard operation of the real lever restores transport without selecting a lighting floor.
  await page.locator('#power-lever').focus(); await page.keyboard.press('Enter');
  assert(await page.evaluate(() => solarEnabled && !solarPoweredFloors.length && !elevatorHasPower()));
  assert.match(await page.locator('#power-help').textContent(), /전등 전용.*관리실 비상 회선/);
  await page.keyboard.press('Escape'); await walkTo(200); await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  // The full manager-room repair is covered in floor17-power-circuit.mjs; start this transport fixture after it.
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
  await walkTo(1858); await page.keyboard.press('e'); await page.clock.runFor(3600);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 17);
  await page.keyboard.press('e'); await finishSceneTransition(page);
  assert(await page.locator('#elevator-cabin').isVisible());
  await page.locator('#cabin-floor-buttons [data-floor="16"]').click();
  await page.locator('#cabin-close').click(); await page.clock.runFor(3700);
  await page.locator('#cabin-exit').click(); await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => currentSceneFloor), 16);
  assert.equal(await page.locator('#world').getAttribute('data-blackout'), 'true', 'Emergency equipment does not relight every floor');
  // Removing power pauses empty cars and cancels a cabin selection safely before departure.
  await page.evaluate(() => {
    elevatorCars[0].floor = 16; showCabin(0);
    elevatorCars[1].travelling = true; elevatorCars[1].destination = 17;
    elevatorCars[2].travelling = true; elevatorCars[2].destination = 17;
  });
  await page.locator('#cabin-floor-buttons [data-floor="15"]').click();
  await page.locator('#cabin-close').click(); await page.clock.runFor(100);
  assert(await page.evaluate(() => selectedFloor === 15 && !elevatorCars[0].travelling));
  await page.locator('#power-lever').dispatchEvent('click');
  assert(await page.evaluate(() => elevatorHasPower()), 'Solar shutoff cannot interrupt the separate elevator UPS');
  await page.evaluate(() => { collectedItems.delete('f17-emergency-linked'); updatePowerState(); });
  const stopped = await page.evaluate(() => elevatorCars.map(car => [car.floor, car.elapsed, car.destination]));
  await page.clock.runFor(3000);
  assert.deepEqual(await page.evaluate(() => elevatorCars.map(car => [car.floor, car.elapsed, car.destination])), stopped);
  assert.match(await page.locator('#cabin-status').textContent(), /전력이 없어/);
  assert.equal(await page.locator('#elevator-cabin').getAttribute('data-moving'), 'false');
  assert(await page.evaluate(() => selectedFloor === null && cabinScene.dataset.door === 'open'), 'Power loss cancels the pending ride and reopens the stationary cabin');
  assert(await page.locator('#cabin-exit').isEnabled(), 'The stationary cabin can be left safely');
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); solarEnabled = true; updatePowerState(); });
  await page.locator('#cabin-floor-buttons [data-floor="15"]').click(); await page.locator('#cabin-close').click();
  await page.clock.runFor(3700);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 15);
  assert(await page.evaluate(() => elevatorCars.slice(1).every(car => car.floor === 17 && !car.travelling)), 'Paused empty cars resume their calls');
  assert(await page.locator('#cabin-exit').isEnabled());
  // A moving occupied car restored from an older save also pauses without changing its trip.
  await page.evaluate(() => {
    const legacy = progressSnapshot();
    Object.assign(legacy.elevators[0], { travelling: true, destination: 14, elapsed: 100, open: false });
    Object.assign(legacy.cabin, { amount: 0, phase: 'closed' });
    restoreProgress(legacy);
    setSolarPower(false);
    collectedItems.delete('f17-emergency-linked'); updatePowerState();
  });
  const legacyTrip = await page.evaluate(() => [elevatorCars[0].floor, elevatorCars[0].elapsed, elevatorCars[0].destination]);
  await page.clock.runFor(3000);
  assert.deepEqual(await page.evaluate(() => [elevatorCars[0].floor, elevatorCars[0].elapsed, elevatorCars[0].destination]), legacyTrip);
  assert(await page.locator('#cabin-exit').isDisabled(), 'A paused legacy trip cannot be exited between floors');
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); }); await page.clock.runFor(1600);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 14);
  await page.locator('#cabin-exit').click(); await finishSceneTransition(page);
  // A stopped car already at the floor can be entered and safely left, but cannot depart.
  await page.evaluate(() => showCabin(0));
  await page.locator('#power-lever').dispatchEvent('click');
  await page.evaluate(() => { collectedItems.delete('f17-emergency-linked'); updatePowerState(); });
  assert(await page.locator('#cabin-floor-buttons [data-floor="14"]').isDisabled());
  await page.locator('#cabin-floor-buttons [data-floor="13"]').dispatchEvent('click');
  await page.clock.runFor(3000);
  assert(await page.evaluate(() => !elevatorCars[0].travelling && selectedFloor === null));
  assert(await page.locator('#cabin-exit').isEnabled());
  await page.locator('#cabin-exit').click(); await finishSceneTransition(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => setSolarPower(false));
  await page.evaluate(() => openPowerPanel());
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
  // The wiring is already fixed, so a touch tap on the lever alone restores power (no password).
  await page.locator('#power-lever').tap();
  assert(await page.evaluate(() => elevatorHasPower()));
  await page.locator('#power-floor-grid [data-floor="12"]').tap();
  assert(await page.evaluate(() => solarPoweredFloors.join() === '12' && elevatorHasPower()));
  await page.locator('#power-lever').tap();
  assert(await page.evaluate(() => !solarEnabled && !solarPoweredFloors.length && elevatorHasPower()));
  assert.deepEqual(errors, []);
  console.log('PASS: outage blocks all calls, full key→roof→lever→return→call→ride route, no lighting-floor dependency, empty-car and legacy occupied-trip pause/resume, pending-ride cancellation and safe stationary exit, keyboard/touch lever and floor selection.');
} finally { await browser.close(); }
