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
  const reset = (index = 0, side = -1) => page.evaluate(([index, side]) => {
    if (blackoutSceneActive) finishBlackoutScene();
    buildingBlackout = true; performFloorChange('f17');
    collectedItems.delete("f17-emergency-linked"); buildingBlackout = false; solarEnabled = false; solarPoweredFloors = []; updatePowerState();
    const door = doors[index];
    Body.setPosition(body, { x: side < 0 ? door.x - 20 : door.x + door.width + 20, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    updateInteraction(); cameraX = cameraTarget(); render();
  }, [index, side]);
  const state = () => page.evaluate(() => ({ active: blackoutSceneActive, elapsed: blackoutElapsed,
    blackout: buildingBlackout, lights: world.dataset.backgroundLights, phase: world.dataset.blackoutScene,
    pose: sprite.dataset.state, frame: sprite.dataset.frame, x: body.position.x,
    called: elevatorCars.some(car => car.travelling), inert: stage.inert }));
  // Advance the real fixed-step clock to a named scene timestamp (no direct phase mutation).
  const advance = async time => {
    while ((await state()).active && (await state()).elapsed < time) await page.clock.runFor(17);
  };
  await reset();
  assert.equal((await state()).phase, 'approach'); assert.equal((await state()).pose, 'walk');
  await page.locator('#blackout-skip').evaluate(button => button.blur());
  for (const key of ['e', 'p', 'f', 'i', 'Space', 'd']) await page.keyboard.press(key);
  await page.locator('#phone-button').dispatchEvent('pointerdown', { pointerId: 1, button: 0 });
  assert(await page.evaluate(() => !usingPhone && !usingInspection && !phoneLightOn && !jumpQueued));
  assert.equal((await state()).called, false);
  await advance(1400);
  assert.equal((await state()).pose, 'blackout-call'); assert.equal((await state()).frame, '1');
  assert.deepEqual(await page.locator('#blackout-call-sheet').evaluate(img => [img.naturalWidth, img.naturalHeight]), [512, 256]);
  await page.screenshot({ path: '.local/blackout-call-reach.png' });
  const changes = [];
  let lastLight = 'on';
  while ((await state()).elapsed < 3050) {
    await page.clock.runFor(17);
    const current = await state();
    if (current.lights === lastLight) continue;
    changes.push({ light: current.lights, time: current.elapsed });
    lastLight = current.lights;
    if (changes.length === 1) {
      assert.equal(current.blackout, false, 'First dip does not yet shut down mains power');
      await page.screenshot({ path: '.local/blackout-flicker.png' });
    }
  }
  const flickers = changes.filter(change => change.time < 2900);
  assert.equal(flickers.filter(change => change.light === 'off').length, 8, 'Several quick dips precede the final outage');
  const durations = flickers.slice(1).map((change, index) => Math.round(change.time - flickers[index].time));
  assert(Math.max(...durations) < 200, 'Flickering intervals stay fast');
  assert(new Set(durations).size >= 4, 'Flickering intervals vary instead of following a regular beat');
  assert.equal(changes.at(-1).light, 'off', 'The final cut stays dark');
  assert.equal((await state()).phase, 'shock'); assert.equal((await state()).pose, 'startled');
  assert.equal((await state()).blackout, true); assert.equal((await state()).called, false);
  assert.equal(await page.locator('#player img:visible').count(), 1);
  await advance(3300);
  assert.equal(await page.evaluate(() => Math.round(blackoutCallX - body.position.x)), 24, 'Suho recoils a step');
  await page.screenshot({ path: '.local/blackout-startled.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.local/blackout-startled-mobile.png' });
  await advance(4900);
  assert.equal((await state()).active, false); assert.equal((await state()).inert, false);
  assert.equal((await state()).lights, 'off'); assert(await page.locator('#blackout-scene').isHidden());
  await page.keyboard.press('e'); assert.equal((await state()).called, false);
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); });
  await page.keyboard.press('e'); assert.equal((await state()).called, false);
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
  await page.keyboard.press('e'); assert.equal((await state()).called, true);
  await page.evaluate(() => { solarPoweredFloors = [17]; updatePowerState(); updateInteraction(); });
  assert.equal((await state()).active, false); assert.equal((await state()).lights, 'on');
  // Skip each stage on different cars and approach directions; it must always finish in darkness.
  for (const [index, side, time] of [[0, -1, 200], [1, 1, 1600], [2, -1, 3200]]) {
    await reset(index, side); await advance(time);
    await page.locator('#blackout-skip').tap();
    assert.equal((await state()).active, false); assert.equal((await state()).blackout, true);
    assert.equal((await state()).inert, false); assert.equal((await state()).lights, 'off');
  }
  await reset(); await page.keyboard.press('Escape'); assert.equal((await state()).active, false);
  await reset(); await page.evaluate(() => performFloorChange('f16'));
  assert.equal((await state()).active, false); assert.equal((await state()).inert, false);
  assert.equal(await page.locator('#world').getAttribute('data-power-flicker'), null);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await reset();
  for (const time of [1550, 2350]) { await advance(time); assert.equal((await state()).lights, 'on'); }
  await advance(3050); assert.equal((await state()).lights, 'off');
  await page.keyboard.press('Escape');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { phoneLightOn = true; refreshPhone(); });
  await reset(); await advance(1550);
  assert.equal(await page.locator('#darkness').evaluate(el => getComputedStyle(el).maskImage), 'none', 'Flashlight mask cannot override the cinematic light dip');
  await advance(3050);
  assert.equal(await page.locator('#darkness').evaluate(el => getComputedStyle(el).maskImage), 'none');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => phoneLightOn && sprite.dataset.phoneHeld === 'true'), 'The prior flashlight state resumes after the cutscene');
  assert.deepEqual(errors, []);
  console.log('PASS: call attempt, rapid irregular flickering, permanent outage, recoil, locked input, all cars/directions, skip/scene cleanup, no retrigger, reduced motion and mobile.');
} finally { await browser.close(); }
