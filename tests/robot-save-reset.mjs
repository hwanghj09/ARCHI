import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  assert.equal(await page.evaluate(() => guardPatrol.mode), 'dock', 'New games keep R-01 in its dock');

  await page.evaluate(() => {
    // 1층 조명은 휴대폰 전력 앱의 태양광 공급으로 켜져 있다. R-01은 이 1층 회선을 쓴다(guard-patrol.js guardPatrolPowered).
    buildingBlackout = true; collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [1];
    for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
    performFloorChange('f1');
    Body.setPosition(body, { x: 1500, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    updatePowerState();
  });
  const dockX = await page.evaluate(() => guardPatrol.x);
  await page.clock.runFor(1000);
  assert.deepEqual(await page.evaluate(() => ({ x: guardPatrol.x, mode: guardPatrol.mode })), { x: dockX, mode: 'dock' });
  await page.evaluate(() => { performFloorChange('f17'); performFloorChange('f1'); saveProgress(); });
  assert.equal(await page.evaluate(() => guardPatrol.mode), 'dock', 'Scene changes preserve the first encounter');
  await page.reload();
  await page.locator('#menu-continue').click();
  assert.equal(await page.evaluate(() => guardPatrol.mode), 'dock', 'A browser reload preserves an unseen guard');
  await page.evaluate(() => {
    Body.setPosition(body, { x: guardPatrol.x - 400, y: floorY - 81 });
    updateGuardPatrol(16);
  });
  assert.equal(await page.evaluate(() => guardPatrol.mode), 'chase', 'First detection still starts pursuit');
  await page.evaluate(() => restoreProgress(progressSnapshot()));
  assert.equal(await page.evaluate(() => guardPatrol.mode), 'patrol', 'A guard already encountered resumes patrol');
  await page.evaluate(() => {
    const data = progressSnapshot(); delete data.guard.mode; restoreProgress(data);
  });
  assert.equal(await page.evaluate(() => guardPatrol.mode), 'patrol', 'Legacy guard saves remain compatible');

  // Prepare actual boarding phases, then load an earlier checkpoint in the same browser session.
  for (const phase of ['call', 'board', 'close', 'ride', 'exit']) {
    for (const index of [0, 1, 2]) {
      const result = await page.evaluate(({ phase, index }) => {
        performFloorChange('f17');
        const saved = progressSnapshot();
        elevatorCars.forEach(car => Object.assign(car, { floor: 9, travelling: false, open: false, rider: false, playerCall: false }));
        Object.assign(roamer, { where: 'f9', next: 'elevator', car: index, trip: null, stay: 0, mode: 'patrol' });
        roamerToElevator();
        if (phase !== 'call') updateRoamerTrip(0);
        if (['close', 'ride', 'exit'].includes(phase)) updateRoamerTrip(elevatorDoorMs);
        if (['ride', 'exit'].includes(phase)) updateRoamerTrip(elevatorDoorMs);
        if (phase === 'exit') {
          const car = elevatorCars[index];
          car.floor = car.destination; car.travelling = false; car.open = true;
          updateRoamerTrip(0);
        }
        const before = roamer.trip.phase;
        elevatorCars[index].playerCall = true; elevatorOpenTime[index] = 5900;
        hideCabinPry(); cabinPry.state = 'struggle';
        restoreProgress(saved);
        for (let i = 0; i < 120; i++) { updateRoamer(16); updateElevators(); }
        return { before, where: roamer.where, car: roamer.car, trip: roamer.trip,
          floorsValid: elevatorCars.every(car => savedFloor(car.floor)),
          reservations: elevatorCars.map(car => car.playerCall), pry: cabinPry.state };
      }, { phase, index });
      assert.equal(result.before, phase, 'The fixture reaches the real boarding phase');
      assert.deepEqual(result, { before: phase, where: 'f9', car: null, trip: null,
        floorsValid: true, reservations: [false, false, false], pry: 'idle' }, `${phase}, car ${index}: loading clears stale robot trips`);
    }
  }

  for (const id of ['f12', 'f13-testbay']) {
    await page.evaluate(id => {
      buildingBlackout = true; collectedItems.add('f17-emergency-linked');
      const config = floorById.get(id);
      performFloorChange(id, config.interior ? null : 0, config.interior ? 'exit' : null);
      roamerEnter(id, config.interior ? floorId(config.floor) : 'elevator');
      Object.assign(roamer, { x: body.position.x + 50, facing: -1, mode: 'chase', stay: 60000, lostTime: 0 });
    }, id);
    await page.clock.runFor(2500);
    const expected = id === 'f12' ? 'f12' : 'f13';
    assert(await page.evaluate(() => playerCaught && caughtBy === roamer), 'The patrol robot reaches a real capture');
    assert.equal(await page.evaluate(() => readProgress().scene.id), expected, 'Autosave keeps the captured floor');
    await page.reload();
    await page.locator('#menu-continue').click();
    assert.equal(await page.evaluate(() => dynamicFloorId), expected, 'Continue returns to that floor corridor');
    assert.equal(await page.evaluate(() => playerCaught), false);
    assert(await page.evaluate(() => Math.abs(body.position.x - (BUILDING_CORE.elevators[0].x + 40)) < 1), 'Continue uses the elevator checkpoint');
  }

  await page.evaluate(() => {
    Object.assign(roamer, { where: null, car: 0, trip: { phase: 'close', time: 1400 } });
    startNewGame(); finishOpening();
  });
  assert.deepEqual(await page.evaluate(() => ({ mode: guardPatrol.mode, where: roamer.where, car: roamer.car, trip: roamer.trip })),
    { mode: 'dock', where: 'f9', car: null, trip: null }, 'Starting over also resets both robots');
  await page.evaluate(() => {
    buildingBlackout = true; collectedItems.add('f17-emergency-linked'); updatePowerState();
    for (let i = 0; i < 120; i++) { updateRoamer(16); updateElevators(); }
  });
  assert(await page.evaluate(() => elevatorCars.every(car => savedFloor(car.floor) && !car.travelling)), 'Power restoration cannot send an empty destination to floor zero');
  assert.deepEqual(errors, []);
  console.log('PASS: first guard encounter, legacy/reloaded saves, all 5 R-03 trip phases across 3 cars, new game and power restoration.');
} finally { await browser.close(); }
