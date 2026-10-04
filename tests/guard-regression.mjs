import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch({ channel: process.env.GUARD_BROWSER || undefined });
const failures = [];
let checks = 0;
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {
    // Replacing a scene/power background cancels its obsolete image request.
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  const reset = (options = {}) => page.evaluate(options => {
    closePhone(); closeKeypad(); closeInspection(); closePowerPanel(); releaseInput();
    triggerBuildingBlackout(); solarEnabled = true; solarPoweredFloor = 1;
    performFloorChange('f1');
    Object.assign(guardPatrol, { x: 3000, facing: 1, mode: 'patrol', wait: 0,
      elapsed: 0, lostTime: 0, captureTime: 0 }, options.robot);
    Body.setPosition(body, { x: options.playerX ?? 3210, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    updateGuardPatrol(0); updateInteraction(); cameraX = cameraTarget(); render();
  }, options);
  const state = () => page.evaluate(() => ({ mode: guardPatrol.mode, x: guardPatrol.x,
    facing: guardPatrol.facing, caught: playerCaught, time: guardPatrol.captureTime,
    playerX: body.position.x, min: body.bounds.min.x, max: body.bounds.max.x,
    width: worldWidth, inert: stage.inert, frame: guardPatrol.door?.element.dataset.frame }));
  async function check(name, run) {
    try { await run(); checks++; console.log(`PASS: ${name}`); }
    catch (error) { failures.push(`${name}: ${error.message}`); console.error(`FAIL: ${name}: ${error.message}`); }
  }

  await check('Sensor boundaries in both directions (64 cases)', async () => {
    await reset();
    const cases = await page.evaluate(() => {
      const results = [];
      for (const facing of [-1, 1]) for (const dx of [-65, -64, 0, 64, 65, 359, 360, 361]) {
        for (const height of [0, 179, 180, 181]) {
          Object.assign(guardPatrol, { x: 3000, facing, mode: 'patrol', wait: 0, lostTime: 0 });
          Body.setPosition(body, { x: 3000 + dx * facing, y: floorY - 81 - height });
          grounded = false; updateGuardPatrol(1);
          results.push({ facing, dx, height, actual: guardPatrol.mode,
            expected: height < 180 && (Math.abs(dx) < 65 || dx > 0 && dx < 360) ? 'chase' : 'patrol' });
        }
      }
      return results;
    });
    for (const test of cases) assert.equal(test.actual, test.expected, JSON.stringify(test));
  });
  await check('Chase speed, player crossing, scan interruption and reacquisition', async () => {
    await reset({ robot: { wait: 1300 } });
    // An exact simulation delta avoids including the initial requestAnimationFrame warm-up.
    await page.evaluate(() => updateGuardPatrol(200));
    assert.equal((await state()).mode, 'chase');
    assert.equal((await state()).x, 3054);
    await page.evaluate(() => Body.setPosition(body, { x: guardPatrol.x - 250, y: floorY - 81 }));
    await page.clock.runFor(100); assert.equal((await state()).facing, -1);
    await page.evaluate(() => { Body.setPosition(body, { x: 4700, y: floorY - 81 }); guardPatrol.lostTime = 1750; });
    await page.clock.runFor(100); assert.equal((await state()).mode, 'patrol');
    await page.evaluate(() => Body.setPosition(body, { x: guardPatrol.x + guardPatrol.facing * 250, y: floorY - 81 }));
    await page.clock.runFor(50); assert.equal((await state()).mode, 'chase');
  });
  await check('Left and right wall capture keeps Suho inside collision boundaries', async () => {
    for (const direction of [-1, 1]) {
      await reset({ playerX: direction < 0 ? 53 : 4947,
        robot: { x: direction < 0 ? 80 : 4920, facing: direction } });
      await page.clock.runFor(200);
      const captured = await state(); assert(captured.caught);
      await page.screenshot({ path: `.local/guard-boundary-${direction}.png` });
      assert(captured.min >= 31.9 && captured.max <= captured.width - 31.9, JSON.stringify(captured));
      assert.equal(Math.round(Math.abs(captured.playerX - captured.x)), 82, 'Grippers retain their alignment');
    }
  });
  await check('Every modal pauses an active chase and resumes without a jump', async () => {
    for (const modal of ['phone', 'inventory', 'keypad', 'power']) {
      await reset({ playerX: 3340, robot: { mode: 'chase' } });
      await page.evaluate(modal => {
        if (modal === 'phone') togglePhone();
        if (modal === 'inventory') toggleInventory();
        if (modal === 'keypad') openKeypad(guardPatrol.door);
        if (modal === 'power') openPowerPanel();
      }, modal);
      const before = await state(); await page.clock.runFor(2000);
      assert.deepEqual(await state(), before, modal);
      await page.keyboard.press('Escape'); await page.clock.runFor(100);
      assert((await state()).x > before.x && (await state()).x - before.x < 35, modal);
    }
  });
  await check('Power cut releases every deployment/hold stage, and restores detection', async () => {
    for (const time of [0, 160, 320, 480, 640, 800, 1200]) {
      await reset({ playerX: 3060 });
      await page.clock.runFor(50 + time); assert((await state()).caught);
      await page.evaluate(() => { solarPoweredFloor = 2; updatePowerState(); });
      assert.equal((await state()).caught, false); assert.equal((await state()).inert, false);
      assert(await page.locator('#guard-capture').isHidden());
      const stopped = await state(); await page.clock.runFor(100);
      assert.equal((await state()).x, stopped.x);
      await page.evaluate(() => { solarPoweredFloor = 1; updatePowerState(); });
      await page.clock.runFor(100); assert((await state()).caught);
    }
  });
  await check('Scene changes during chase, deployment and hold remove all capture state', async () => {
    for (const time of [100, 600, 1900]) {
      await reset(); await page.clock.runFor(time);
      await page.evaluate(() => performFloorChange('f17'));
      assert.equal((await state()).caught, false); assert.equal((await state()).inert, false);
      assert(await page.locator('#guard-capture').isHidden());
      assert.equal(await page.locator('.guard-robot-sprite, .robot-dock-patch').count(), 0);
      await page.clock.runFor(100);
      await page.evaluate(() => performFloorChange('f1'));
      assert.equal(await page.locator('.guard-robot-sprite').count(), 1);
      assert.equal(await page.locator('.robot-dock-patch').count(), 1);
      assert.equal((await state()).mode, 'patrol');
    }
  });
  await check('Maintenance wrong/correct code, clue persistence and repeated retry', async () => {
    await reset({ playerX: 3000 });
    await page.evaluate(() => { solarPoweredFloor = 2; updatePowerState(); updateInteraction(); });
    await page.keyboard.press('e'); assert(await page.locator('#keypad').isVisible());
    await page.locator('#keypad-input').fill('0000'); await page.keyboard.press('Enter');
    assert.match(await page.locator('#keypad-error').textContent(), /맞지/);
    await page.locator('#keypad-input').fill('0914'); await page.keyboard.press('Enter');
    assert(await page.evaluate(() => collectedItems.has('f1-robot-log')));
    await page.keyboard.press('Escape');
    for (let i = 0; i < 5; i++) {
      await reset({ playerX: 3060 }); await page.clock.runFor(1300);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'guard-retry');
      if (i % 2) await page.keyboard.press('Space');
      else await page.locator('#guard-retry').click();
      assert.equal((await state()).caught, false); assert.equal((await state()).inert, false);
      assert(await page.evaluate(() => collectedItems.has('f1-robot-log') && keys.size === 0 && pointers.size === 0));
      assert.equal(await page.locator('.guard-robot-sprite').count(), 1);
    }
  });
  await check('Phone/light and held movement inputs are cleared on capture', async () => {
    await reset({ playerX: 3060 });
    await page.keyboard.press('f'); await page.keyboard.down('d');
    await page.clock.runFor(100); assert((await state()).caught);
    assert(await page.evaluate(() => !usingPhone && !phoneLightOn && !jumpQueued && keys.size === 0 && pointers.size === 0));
    await page.clock.runFor(1200); await page.locator('#guard-retry').click();
    const x = (await state()).playerX; await page.clock.runFor(200);
    assert(Math.abs((await state()).playerX - x) < 1, 'A held key must not leak into retry');
    await page.keyboard.up('d');
  });
  await check('Small mobile landscape keeps retry visible and touch-operable', async () => {
    await page.setViewportSize({ width: 568, height: 320 });
    await reset({ playerX: 3060 }); await page.clock.runFor(1300);
    const rect = await page.locator('#guard-retry').boundingBox();
    assert(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 568 && rect.y + rect.height <= 320);
    await page.screenshot({ path: '.local/guard-mobile-landscape.png' });
    await page.locator('#guard-retry').tap(); assert.equal((await state()).caught, false);
  });
  await check('Ten simulated minutes of patrol stay bounded and keep reversing', async () => {
    await reset({ playerX: 1000 });
    const patrol = await page.evaluate(() => {
      Body.setPosition(body, { x: 1000, y: floorY - 1000 }); grounded = false;
      let turns = 0, min = Infinity, max = -Infinity;
      for (let i = 0; i < 36000; i++) {
        const facing = guardPatrol.facing;
        updateGuardPatrol(1000 / 60);
        if (facing !== guardPatrol.facing) turns++;
        min = Math.min(min, guardPatrol.x); max = Math.max(max, guardPatrol.x);
      }
      return { turns, min, max, mode: guardPatrol.mode,
        sprites: document.querySelectorAll('.guard-robot-sprite').length };
    });
    assert(patrol.turns >= 14, JSON.stringify(patrol));
    assert.equal(patrol.min, 1510); assert.equal(patrol.max, 4540);
    assert.equal(patrol.mode, 'patrol'); assert.equal(patrol.sprites, 1);
  });
  await check('No script or network errors', async () => assert.deepEqual(errors, []));
  assert.deepEqual(failures, [], `${failures.length} regression groups failed`);
  console.log(`PASS: ${checks} guard regression groups (${process.env.GUARD_BROWSER || 'chromium'} ${browser.version()}).`);
} finally { await browser.close(); }
