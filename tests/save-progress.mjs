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
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  assert(await page.locator('#menu-continue').isHidden());
  await page.locator('#menu-start').click(); await page.locator('#opening-skip').click();
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem(progressKey)));
  const state = () => page.evaluate(() => ({ id: room === 'office' ? 'office' : room === 'corridor' ? 'f17' : dynamicFloorId,
    x: body.position.x, battery: phoneBattery, sanity, dock: phoneDock, items: [...collectedItems],
    solarEnabled, solarPoweredFloors, blackout: buildingBlackout, cabin: selectingFloor }));
  const checkpoint = () => page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  const reloadContinue = async () => {
    await checkpoint(); const save = await stored();
    await page.reload(); assert(await page.locator('#menu-continue').isVisible());
    await page.clock.runFor(2000); assert.deepEqual(await stored(), save, 'Title screen does not overwrite or advance the saved game');
    await page.locator('#menu-continue').click(); return save;
  };
  assert.equal((await stored()).scene.id, 'office');
  // A real phone deposit plus acquired items, gate progress, power and a non-default sanity level.
  await page.evaluate(() => {
    collectedItems.add('f17-badge'); collectedItems.add('f16-badge'); collectedItems.add('f12-access');
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [12, 7];
    performFloorChange('f12'); phoneBattery = 40; sanity = 15;
    const point = currentDoors.find(door => door.phoneCharger);
    Body.setPosition(body, { x: point.x + point.width / 2, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; refreshPhone(); updateInteraction(); cameraX = cameraTarget(); render();
  });
  await page.keyboard.press('e'); assert((await state()).dock);
  await page.keyboard.down('d'); await page.clock.runFor(500); await page.keyboard.up('d');
  await page.clock.runFor(2200);
  const automatic = await stored(); assert.equal(automatic.scene.id, 'f12'); assert(automatic.battery > 40);
  const saved = await reloadContinue();
  const resumed = await state();
  assert.equal(resumed.id, 'f12'); assert(Math.abs(resumed.x - saved.scene.x) < 1);
  assert.equal(resumed.battery, saved.battery); assert.equal(resumed.sanity, saved.sanity);
  assert.deepEqual(resumed.dock, saved.dock); assert.deepEqual(resumed.items, saved.items);
  assert.deepEqual(saved.solarPoweredFloors, [12, 7]); assert.deepEqual(resumed.solarPoweredFloors, [12, 7], 'Both powered floors resume in the order they were turned on');
  assert(await page.evaluate(() => floorHasPower(12) && floorHasPower(7) && !floorHasPower(13))); assert.equal(resumed.blackout, true);
  assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2);
  assert.equal(await page.locator('.docked-phone:visible').count(), 1);
  assert(await page.locator('#opening').isHidden(), 'Continue never replays the opening');
  await page.keyboard.press('p'); await page.keyboard.press('f'); assert(await page.locator('#phone').isHidden());
  await page.clock.runFor(2100); assert.equal((await state()).battery, saved.battery + 4);
  // Escape and the touch menu pause the live game; cancellation preserves the existing slot.
  await page.keyboard.press('Escape'); assert(await page.locator('#main-menu').isVisible());
  const paused = await state(); const unchanged = await stored();
  await page.clock.runFor(3000); assert.deepEqual(await state(), paused); assert.deepEqual(await stored(), unchanged);
  await page.locator('#menu-start').click(); assert(await page.locator('#menu-new-game').isVisible());
  await page.locator('#menu-new-game .menu-back').click(); assert.deepEqual(await stored(), unchanged);
  await page.screenshot({ path: '.local/save-menu-desktop.png' });
  await page.locator('#menu-continue').click(); assert(await page.locator('#main-menu').isHidden());
  // Room-local puzzle steps and moving platforms survive a browser reload.
  await page.evaluate(() => {
    performFloorChange('f8-qa', null, 'exit');
    advanceSequence(currentDoors.find(door => door.sequence?.step === 1));
    advanceSequence(currentDoors.find(door => door.sequence?.step === 2)); closeInspection();
  });
  await reloadContinue();
  assert.equal(await page.evaluate(() => sequenceProgress.get('f8-repro-steps')), 2);
  assert.equal(await page.locator('[data-done="true"]').count(), 2);
  await page.evaluate(() => {
    performFloorChange('f5-rnd', null, 'exit');
    Body.setPosition(movingParts[0].body, { x: 1600, y: floorY - movingParts[0].height / 2 });
    Body.setPosition(body, { x: 1600, y: floorY - movingParts[0].height - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
  });
  await reloadContinue();
  assert.equal((await state()).id, 'f5-rnd'); assert.equal((await state()).x, 1600);
  assert.equal(await page.evaluate(() => movingParts[0].body.position.x), 1600);
  // Temporary doors restore before the player's physics body, avoiding a closed-door trap.
  await page.evaluate(() => { performFloorChange('f3-fitness', null, 'exit'); openTimedBarrier(currentDoors.find(door => door.opens)); });
  const timerSave = await reloadContinue();
  assert.equal(await page.evaluate(() => timedBarriers.length), 1);
  assert.equal(await page.evaluate(() => timedBarriers[0].closesIn), timerSave.runtime.timed[0].remaining);
  // A trip resumes with its doors, destination and elapsed travel time intact.
  await page.evaluate(() => { performFloorChange('f16'); elevatorCars[0].floor = 16; showCabin(0); });
  await page.locator('#cabin-floor-buttons [data-floor="15"]').click(); await page.locator('#cabin-close').click();
  await page.clock.runFor(1400); assert(await page.evaluate(() => elevatorCars[0].travelling));
  const trip = await reloadContinue();
  assert((await state()).cabin); assert.equal(await page.evaluate(() => elevatorCars[0].elapsed), trip.elevators[0].elapsed);
  assert.equal(await page.locator('#cabin-scene').getAttribute('data-door'), 'closed');
  await page.clock.runFor(1500); assert.equal(await page.evaluate(() => elevatorCars[0].floor), 15);
  await page.clock.runFor(1300); await page.locator('#cabin-exit').click(); await page.clock.runFor(900);
  assert.equal((await state()).id, 'f15');
  // A mid-blackout quit commits the one-time event; capture resumes from the lobby checkpoint.
  await page.evaluate(() => {
    buildingBlackout = true; performFloorChange('f17'); buildingBlackout = false; solarEnabled = false; solarPoweredFloors = []; updatePowerState();
    Body.setPosition(body, { x: doors[0].x - 20, y: floorY - 81 }); grounded = true; updateInteraction();
  });
  assert(await page.evaluate(() => blackoutSceneActive)); await page.clock.runFor(500); await reloadContinue();
  assert(await page.evaluate(() => buildingBlackout && !blackoutSceneActive));
  await page.evaluate(() => { performFloorChange('f1'); catchPlayer(); }); await reloadContinue();
  assert(await page.evaluate(() => !playerCaught && guardPatrol.mode === 'patrol' && currentSceneFloor === 1));
  // 감지했던 자리로 걸어 돌아가는 도중에 저장해도 그 자리에서 순찰로 이어 간다.
  await page.evaluate(() => Object.assign(guardPatrol, { x: 3200, facing: 1, wait: 0, mode: 'return', chaseOriginX: 3600 }));
  await reloadContinue();
  const resumedGuard = await page.evaluate(() => ({ mode: guardPatrol.mode, x: guardPatrol.x, facing: guardPatrol.facing }));
  assert(resumedGuard.mode === 'patrol' && resumedGuard.facing === 1 && Math.abs(resumedGuard.x - 3200) < 5, JSON.stringify(resumedGuard));
  // Browser hiding flushes the newest values, without waiting for the two-second autosave.
  await page.evaluate(() => {
    sanity = 37;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange')); delete document.hidden;
  });
  assert.equal((await stored()).sanity, 37);
  await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#game-menu-button').tap();
  await page.screenshot({ path: '.local/save-menu-mobile.png' });
  await page.locator('#menu-start').tap(); await page.locator('#menu-new-confirm').tap(); await page.locator('#opening-skip').click();
  const fresh = await state();
  assert.equal(fresh.id, 'office'); assert.equal(fresh.battery, 100); assert.equal(fresh.sanity, 35);
  assert.deepEqual(fresh.items, ['f17-badge']); assert.equal(fresh.dock, null); assert.equal(fresh.blackout, false); assert.equal(fresh.solarEnabled, false);
  assert.deepEqual((await stored()).items, ['f17-badge']);
  // Saves made before the badge became a starting item retain their location and other items.
  await page.locator('#game-menu-button').tap();
  await page.evaluate(() => {
    const legacy = JSON.parse(localStorage.getItem(progressKey));
    legacy.items = ['rooftop-key'];
    legacy.scene.id = 'f16'; legacy.scene.x = 2222;
    localStorage.setItem(progressKey, JSON.stringify(legacy));
  });
  await page.reload(); await page.locator('#menu-continue').click();
  const migrated = await state();
  assert.equal(migrated.id, 'f16'); assert.equal(migrated.x, 2222);
  assert.deepEqual(migrated.items, ['f17-badge', 'rooftop-key']);
  assert.equal(await page.locator('#office-badge').count(), 0);
  await checkpoint();
  assert.deepEqual((await stored()).items, ['f17-badge', 'rooftop-key']);
  // Saves from the one-floor power rule load a numeric floor as one powered floor; an empty value powers none.
  for (const [legacyFloor, expected, status] of [[7, [7], '7F 전력 공급 중 (1/2)'], [null, [], '공급할 층 선택 (0/2)']]) {
    await page.locator('#game-menu-button').tap();
    await page.evaluate(floor => {
      const legacy = JSON.parse(localStorage.getItem(progressKey));
      delete legacy.solarPoweredFloors;
      Object.assign(legacy, { blackout: true, solarEnabled: true, solarPoweredFloor: floor });
      localStorage.setItem(progressKey, JSON.stringify(legacy));
    }, legacyFloor);
    await page.reload(); await page.locator('#menu-continue').click();
    assert.deepEqual((await state()).solarPoweredFloors, expected);
    assert.equal(await page.evaluate(() => floorHasPower(7)), expected.length > 0);
    assert.equal(await page.locator('#power-status').textContent(), status);
    await checkpoint();
    const resaved = await stored();
    assert.deepEqual(resaved.solarPoweredFloors, expected); assert(!('solarPoweredFloor' in resaved), 'New saves use only the array');
  }
  // Invalid saves are ignored, and blocked storage cannot prevent a fresh game.
  await page.evaluate(() => {
    const saved = localStorage.getItem(progressKey);
    try {
      for (const id of ['f2-booth', 'f3-hanuri', 'f4-log', 'f4-ups', 'f4-vault', 'f4-office',
        'f5-library', 'f5-council', 'f6-remote', 'f6-line', 'f6-duty', 'f8-repro', 'f8-blind',
        'f9-briefing', 'f9-license', 'f10-finance', 'f10-director', 'f10-vault']) {
        localStorage.setItem(progressKey, JSON.stringify({ version: 1, scene: { id, x: 1600, y: 400 }, items: ['rooftop-key'] }));
        const migrated = readProgress();
        if (migrated?.scene.id !== id.split('-')[0] || migrated.scene.x !== BUILDING_CORE.elevators[0].x + 40 ||
            migrated.items[0] !== 'rooftop-key') throw new Error(`Legacy room save lost: ${id}`);
      }
    } finally { localStorage.setItem(progressKey, saved); }
  });
  await page.locator('#game-menu-button').tap();
  await page.evaluate(() => localStorage.setItem(progressKey, JSON.stringify({ version: 1, scene: { id: 'missing', x: 1, y: 1 }, items: [] })));
  await page.reload(); assert(await page.locator('#menu-continue').isHidden());
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('storage blocked'); }; });
  await page.reload(); await page.locator('#menu-start').click(); await page.locator('#opening-skip').click();
  assert(await page.evaluate(() => gameStarted && progressSaveFailed && !mainMenuActive));
  assert.deepEqual(errors, []);
  console.log('PASS: autosave/pagehide/visibility, continue/new game/cancel, pause and touch, position/items/gates/power/battery/sanity/dock, puzzle steps/platforms/timed doors, active elevator trip, blackout/capture checkpoints, two-floor power and legacy one-floor saves, invalid data and blocked storage.');
} finally { await browser.close(); }
