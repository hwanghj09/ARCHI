import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-18T00:01:00Z'));
  const state = () => page.evaluate(() => ({ active: solarRestoreActive, elapsed: solarRestoreElapsed,
    floor: currentSceneFloor, room: dynamicFloorId, x: body.position.x, y: body.position.y, cameraX,
    supplied: [...solarPoweredFloors], light: solarRestoreScene.dataset.light, phase: solarRestoreScene.dataset.phase,
    locked: stage.inert, battery: phoneBattery, sanity, seen: collectedItems.has('story-solar-17-seen') }));
  const reset = async () => {
    await page.evaluate(() => {
      if (solarRestoreActive) finishSolarRestoreScene();
      for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
      collectedItems.delete('story-solar-17-seen');
      triggerBuildingBlackout(); setSolarPower(true); solarPoweredFloors = [];
      performFloorChange('rooftop', null);
      Body.setPosition(body, { x: 1040, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; updatePowerState(); updateInteraction(); cameraX = cameraTarget(); render();
      openPowerPanel();
    });
  };
  const start = async () => {
    await page.locator('#power-floor-grid [data-floor="17"]').click();
    await page.waitForFunction(() => solarRestoreReady || !solarRestoreActive);
    assert.equal((await state()).active, true);
  };
  const to = async time => page.clock.runFor(Math.max(0, time - (await state()).elapsed) + 17);
  await reset();
  const roof = await state();
  await start();
  assert(await page.locator('#power-panel').isHidden(), 'The supply panel clears before the camera cut');
  assert.equal((await state()).locked, true);
  assert.equal(await page.locator('#sanity-hud').evaluate(element => getComputedStyle(element).visibility), 'hidden');
  assert.equal(await page.evaluate(() => elevatorHasPower()), false, 'Solar lighting does not enable the emergency UPS');
  await to(900);
  assert.equal((await state()).phase, 'dark'); assert.equal((await state()).light, 'off');
  assert.equal(await page.locator('#solar-restore-fixtures .door').count(), 4);
  assert.equal(await page.locator('#solar-restore-scene #player').count(), 0, 'The player is never copied to 17F');
  await page.screenshot({ path: '.local/solar-restore-dark.png' });
  const changes = [];
  let last = 'off';
  while ((await state()).elapsed < 2900) {
    await page.clock.runFor(40);
    const now = await state();
    if (now.light !== last) { changes.push(now.light); last = now.light; }
  }
  assert(changes.length >= 7, 'Several irregular light changes precede the steady lighting');
  assert.equal((await state()).phase, 'lit'); assert.equal((await state()).light, 'on');
  assert.equal(await page.locator('#solar-restore-lit').evaluate(image => getComputedStyle(image).opacity), '1');
  assert.match(await page.locator('#solar-restore-caption').textContent(), /불이 들어왔다/);
  await page.screenshot({ path: '.local/solar-restore-lit.png' });
  // Navigation and movement keys cannot interrupt the remote shot or move the player.
  for (const key of ['d', 'Space', 'm', 'p', 'f', 'i']) await page.keyboard.press(key);
  const during = await state();
  for (const key of ['floor', 'room', 'x', 'y', 'cameraX', 'battery', 'sanity']) assert.equal(during[key], roof[key], key);
  assert.equal(await page.locator('#map-window').isVisible(), false);
  await page.clock.runFor(2200);
  assert.equal((await state()).active, false); assert.equal((await state()).locked, false);
  assert.equal((await state()).seen, true); assert.deepEqual((await state()).supplied, [17]);
  assert.equal((await state()).floor, 18); assert.equal((await state()).room, 'rooftop');
  assert.equal(await page.evaluate(() => world.dataset.lights), 'on');
  assert.equal(await page.evaluate(() => readProgress().scene.id), 'rooftop', 'Save data retains the rooftop location');
  assert(await page.evaluate(() => readProgress().items.includes('story-solar-17-seen')));
  await page.evaluate(() => { supplySolarFloor(17); supplySolarFloor(17); });
  assert.equal((await state()).active, false, 'The first restoration is remembered');
  await page.evaluate(() => performFloorChange('f17', 0));
  assert.equal(await page.evaluate(() => world.dataset.backgroundLights), 'on', 'Visiting 17F shows the restored lighting');
  assert(await page.locator('#background img[data-lit-src]').evaluate(image => image.getAttribute('src') === image.dataset.litSrc),
    'The real corridor uses its lit artwork after the cutaway');

  // Skip during departure, flicker and the steady shot, including a touch-sized view.
  for (const [at, method] of [[100, 'escape'], [1700, 'enter'], [3000, 'touch']]) {
    const mobile = method === 'touch';
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 });
    await reset(); await start(); await to(at);
    if (mobile) {
      await page.screenshot({ path: '.local/solar-restore-mobile.png' });
      await page.locator('#solar-restore-skip').tap();
    } else await page.keyboard.press(method === 'enter' ? 'Enter' : 'Escape');
    assert.equal((await state()).active, false); assert.equal((await state()).locked, false);
    assert.equal((await state()).seen, true); assert.deepEqual((await state()).supplied, [17]);
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await reset(); await start();
  for (const at of [1200, 1500, 1800, 2200, 2500]) { await to(at); assert.equal((await state()).light, 'off'); }
  await to(2900); assert.equal((await state()).light, 'on', 'Reduced motion uses one clean switch without flashing');
  await page.keyboard.press('Escape'); await page.emulateMedia({ reducedMotion: 'no-preference' });

  // Invalid selections, other floors and remote supplies outside the rooftop do not start it.
  await reset();
  await page.evaluate(() => { setSolarPower(false); supplySolarFloor(17); });
  assert.equal((await state()).active, false);
  await page.evaluate(() => { setSolarPower(true); supplySolarFloor(12); supplySolarFloor(99); });
  assert.equal((await state()).active, false);
  await page.evaluate(() => { closePowerPanel(); performFloorChange('f16', 0); supplySolarFloor(17); });
  assert.equal((await state()).active, false);

  // The rooftop phone app uses the same trigger and closes before the remote shot.
  await reset();
  await page.evaluate(() => {
    closePowerPanel(); collectedItems.add('solar-app-installed');
    togglePhone(); openPhoneApp('solar');
    document.getElementById('phone-solar-floor').value = '17'; refreshSolarApp();
  });
  await page.locator('#phone-solar-supply').click();
  await page.waitForFunction(() => solarRestoreReady);
  assert(await page.locator('#phone').isHidden()); assert.equal((await state()).active, true);
  await page.keyboard.press('Escape');

  // Loading during the cutaway clears it without applying the old scene's completion later.
  await reset();
  const saved = await page.evaluate(() => progressSnapshot());
  await start(); await to(1600);
  await page.evaluate(saved => restoreProgress(saved), saved);
  await page.clock.runFor(5000);
  assert.equal((await state()).active, false); assert.equal((await state()).locked, false);
  assert(await page.locator('#solar-restore-scene').isHidden());
  assert.equal((await state()).seen, false); assert.deepEqual((await state()).supplied, []);

  // A failed background cannot leave an invisible cutscene blocking the rooftop.
  await reset();
  await page.evaluate(() => { document.getElementById('solar-restore-lit').decode = () => Promise.reject(new Error('missing art')); });
  await page.locator('#power-floor-grid [data-floor="17"]').click();
  await page.waitForFunction(() => !solarRestoreActive);
  assert.equal((await state()).locked, false); assert.deepEqual((await state()).supplied, [17]);
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log('PASS: rooftop 17F supply via panel/app, remote camera, dark/flicker/lit sequence, frozen rooftop state, input lock, return/save/load, one-time trigger, skip/touch, reduced motion, selection guards and art-failure cleanup.');
