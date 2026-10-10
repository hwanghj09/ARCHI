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
  await page.clock.runFor(100);
  assert(await page.evaluate(() => elevatorHasPower()), 'Mains power operates before the outage');
  await reachInitialCorridor(page);
  const walkTo = async target => {
    const from = await page.evaluate(() => body.position.x);
    const key = target > from ? 'd' : 'a';
    await page.keyboard.down(key); await page.clock.runFor(Math.abs(target - from) / 200 * 1000);
    await page.keyboard.up(key); await page.clock.runFor(34);
  };
  await walkTo(1858); await page.clock.runFor(5000);
  assert(await page.evaluate(() => buildingBlackout && !solarEnabled && !elevatorHasPower()));
  for (const x of [1858, 2188, 2484]) {
    await walkTo(x); await page.keyboard.press('e');
    assert.match(await page.locator('#interaction-status').textContent(), /옥상.*태양광 비상 전력/);
    assert(await page.evaluate(() => elevatorCars.every(car => !car.travelling && car.floor === 1)));
  }
  // The complete recovery route stays reachable with all three cars stopped.
  await collectRooftopKey(page); await walkTo(2946);
  await page.keyboard.press('e'); await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => currentSceneFloor), 18);
  await walkTo(900); await page.keyboard.press('e');
  assert(await page.locator('#power-panel').isVisible());
  assert(await page.locator('#power-floor-grid button').first().isDisabled());
  // Keyboard operation of the real lever restores transport without selecting a lighting floor.
  await page.locator('#power-lever').focus(); await page.keyboard.press('Enter');
  assert(await page.locator('#keypad').isVisible());
  assert.equal(await page.evaluate(() => elevatorHasPower()), false);
  await page.locator('#keypad-input').fill('1997'); await page.keyboard.press('Enter');
  assert(await page.evaluate(() => solarEnabled && !solarPoweredFloors.length && elevatorHasPower()));
  assert.match(await page.locator('#power-help').textContent(), /엘리베이터 운행 복구/);
  await page.keyboard.press('Escape'); await walkTo(200); await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  await walkTo(1858); await page.keyboard.press('e'); await page.clock.runFor(19400);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 17);
  await page.keyboard.press('e'); await finishSceneTransition(page);
  assert(await page.locator('#elevator-cabin').isVisible());
  await page.locator('#cabin-floor-buttons [data-floor="16"]').click();
  await page.locator('#cabin-close').click(); await page.clock.runFor(3700);
  await page.locator('#cabin-exit').click(); await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => currentSceneFloor), 16);
  assert.equal(await page.locator('#world').getAttribute('data-powered'), 'false', 'Transport does not relight every floor');
  // Removing power pauses all cars, including an occupied car, without advancing floor or elapsed time.
  await page.evaluate(() => {
    elevatorCars[0].floor = 16; showCabin(0);
    elevatorCars[1].travelling = true; elevatorCars[1].destination = 17;
    elevatorCars[2].travelling = true; elevatorCars[2].destination = 17;
  });
  await page.locator('#cabin-floor-buttons [data-floor="15"]').click();
  await page.locator('#cabin-close').click(); await page.clock.runFor(1400);
  await page.locator('#power-lever').dispatchEvent('click');
  const stopped = await page.evaluate(() => elevatorCars.map(car => [car.floor, car.elapsed, car.destination]));
  await page.clock.runFor(3000);
  assert.deepEqual(await page.evaluate(() => elevatorCars.map(car => [car.floor, car.elapsed, car.destination])), stopped);
  assert.match(await page.locator('#cabin-status').textContent(), /전력이 없어/);
  assert.equal(await page.locator('#elevator-cabin').getAttribute('data-moving'), 'false');
  assert(await page.locator('#cabin-exit').isDisabled(), 'Cannot exit a paused occupied car');
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); }); await page.clock.runFor(3000);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 15);
  assert(await page.locator('#cabin-exit').isEnabled());
  await page.locator('#cabin-exit').click(); await finishSceneTransition(page);
  // A stopped car already at the floor can be entered and safely left, but cannot depart.
  await page.evaluate(() => showCabin(0));
  await page.locator('#power-lever').dispatchEvent('click');
  assert(await page.locator('#cabin-floor-buttons [data-floor="14"]').isDisabled());
  await page.locator('#cabin-floor-buttons [data-floor="14"]').dispatchEvent('click');
  await page.clock.runFor(3000);
  assert(await page.evaluate(() => !elevatorCars[0].travelling && selectedFloor === null));
  assert(await page.locator('#cabin-exit').isEnabled());
  await page.locator('#cabin-exit').click(); await finishSceneTransition(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => openPowerPanel());
  await page.locator('#power-lever').tap();
  await page.locator('#keypad-input').fill('1997'); await page.locator('#keypad-submit').tap();
  assert(await page.evaluate(() => elevatorHasPower()));
  await page.locator('#power-floor-grid [data-floor="12"]').tap();
  assert(await page.evaluate(() => solarPoweredFloors.join() === '12' && elevatorHasPower()));
  await page.locator('#power-lever').tap();
  assert(await page.evaluate(() => !solarEnabled && !solarPoweredFloors.length && !elevatorHasPower()));
  assert.deepEqual(errors, []);
  console.log('PASS: outage blocks all calls, full key→roof→lever→return→call→ride route, no lighting-floor dependency, three-car pause/resume, safe stationary exit, keyboard/touch lever and floor selection.');
} finally { await browser.close(); }
