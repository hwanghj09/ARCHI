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
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  const reset = (options = {}) => page.evaluate(options => {
    finishStoryScene();
    closePhone(); closeKeypad(); closeInspection(); closePowerPanel(); releaseInput();
    // Story cutscenes have their own route tests; keep independent robot cases on the simulation clock.
    for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
    sanity = 100;
    triggerBuildingBlackout(); collectedItems.add("f17-emergency-linked"); solarEnabled = true; solarPoweredFloors = [1];
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
      // x=4000: even the farthest offset tested (721px) never crosses the stairs-beat boundary
      // (left=3040), so this stays a pure sensor-geometry test, unaffected by the beat gate below.
      for (const facing of [-1, 1]) for (const dx of [-130, -129, 0, 129, 130, 719, 720, 721]) {
        for (const height of [0, 179, 180, 181]) {
          Object.assign(guardPatrol, { x: 4000, facing, mode: 'patrol', wait: 0, lostTime: 0 });
          Body.setPosition(body, { x: 4000 + dx * facing, y: floorY - 81 - height });
          grounded = false; updateGuardPatrol(1);
          results.push({ facing, dx, height, actual: guardPatrol.mode,
            expected: height < 180 && (Math.abs(dx) < 130 || dx > 0 && dx < 720) ? 'chase' : 'patrol' });
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
      // mode: 'chase' bypasses the stairs-beat detection gate (real-world x < left is out of R-01's
      // beat and never triggers seesPlayer) — this test is about wall clamping during a grab, not detection.
      await reset({ playerX: direction < 0 ? 53 : 4947,
        robot: { x: direction < 0 ? 80 : 4920, facing: direction, mode: 'chase' } });
      await page.clock.runFor(200);
      const captured = await state(); assert(captured.caught);
      await page.screenshot({ path: `.local/guard-boundary-${direction}.png` });
      assert(captured.min >= 31.9 && captured.max <= captured.width - 31.9, JSON.stringify(captured));
      assert.equal(Math.round(Math.abs(captured.playerX - captured.x)), 82, 'Grippers retain their alignment');
    }
  });
  await check('Phone keeps an active chase running and closes on capture', async () => {
    await reset({ playerX: 3340, robot: { mode: 'chase' } });
    await page.evaluate(() => togglePhone());
    assert(await page.evaluate(() => usingPhone));
    const before = await state(); await page.clock.runFor(500);
    assert((await state()).x > before.x);
    assert.equal((await state()).caught, false);
    assert(await page.evaluate(() => usingPhone));
    await page.clock.runFor(2000);
    assert((await state()).caught);
    assert(await page.evaluate(() => !usingPhone && phonePanel.hidden));
    assert(await page.locator('#guard-capture').isVisible());
  });
  await check('Inventory, keypad and power modals pause chase and resume without a jump', async () => {
    for (const modal of ['inventory', 'keypad', 'power']) {
      await reset({ playerX: 3340, robot: { mode: 'chase' } });
      await page.evaluate(modal => {
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
      await page.evaluate(() => { collectedItems.delete("f17-emergency-linked"); solarPoweredFloors = [2]; updatePowerState(); });
      assert.equal((await state()).caught, false); assert.equal((await state()).inert, false);
      assert(await page.locator('#guard-capture').isHidden());
      const stopped = await state(); await page.clock.runFor(100);
      assert.equal((await state()).x, stopped.x);
      await page.evaluate(() => { collectedItems.add("f17-emergency-linked"); solarPoweredFloors = [1]; updatePowerState(); });
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
  // 3400에서 왼쪽을 보던 로봇에게 감지된 뒤, 250px 앞서 달아나 3번 엘리베이터 앞(감지 지점에서 200px 넘게)까지 간다.
  const escapeToElevator = () => page.evaluate(() => {
    const dt = 1000 / 60, { speed } = guardPatrol.door.patrol;
    updateGuardPatrol(dt);
    const detected = { mode: guardPatrol.mode, origin: guardPatrol.chaseOriginX };
    let before = guardPatrol.x, frames = 0;
    while (guardPatrol.mode === 'chase' && frames++ < 600) {
      Body.setPosition(body, { x: guardPatrol.x - 250, y: floorY - 81 });
      before = guardPatrol.x; updateGuardPatrol(dt);
    }
    return { detected, mode: guardPatrol.mode, before, x: guardPatrol.x, limit: speed * dt, playerX: body.position.x,
      status: document.getElementById('interaction-status').textContent };
  });
  const sprite = () => page.evaluate(() => ({ src: guardPatrol.image.getAttribute('src'), phase: guardPatrol.door.element.dataset.patrol,
    frame: guardPatrol.door.element.dataset.frame, width: guardPatrol.door.element.firstElementChild.style.width,
    flip: guardPatrol.door.element.firstElementChild.style.transform }));
  await check('Elevator escape walks back to the detection point at patrol speed, then resumes patrol', async () => {
    await reset({ playerX: 3200, robot: { x: 3400, facing: -1, firstEncounter: false } });
    const escape = await escapeToElevator();
    assert.deepEqual(escape.detected, { mode: 'chase', origin: 3400 });
    assert.equal(escape.mode, 'return', JSON.stringify(escape));
    assert.match(escape.status, /감지했던 자리로 돌아가기 시작했다/);
    assert(escape.x > escape.before && escape.x - escape.before <= escape.limit + 1e-9, `No teleport on escape: ${JSON.stringify(escape)}`);
    assert(escape.x < 3100, 'The chase carried the robot well away from its detection point');
    const returning = await sprite();
    assert.equal(returning.src, 'assets/objects/guard-robot/guard-patrol.png', 'Returning uses the patrol sheet, not the capture sheet');
    assert.equal(returning.phase, 'move'); assert.equal(returning.width, '160px'); assert.equal(returning.flip, 'scaleX(1)');
    // 전력이 들어온 채 돌아가는 로봇 바로 옆에서도 정비 패널(보조 배터리 화면)은 열리지 않는다. 수호가 비상계단과
    // 안내 데스크 조사 범위 사이(3068~3121)에 서도록 로봇이 3125를 지날 때 30px 뒤에 세운다.
    const panel = await page.evaluate(() => {
      Body.setPosition(body, { x: 2000, y: floorY - 81 });
      for (let i = 0; i < 600 && guardPatrol.x < 3125; i++) updateGuardPatrol(1000 / 60);
      Body.setPosition(body, { x: guardPatrol.x - 30, y: floorY - 81 }); grounded = true;
      updateInteraction();
      const near = nearbyDoor?.name ?? null, hintShown = !hint.hidden;
      interact();
      return { near, hintShown, usingKeypad, keypadHidden: document.getElementById('keypad').hidden, mode: guardPatrol.mode };
    });
    assert.deepEqual(panel, { near: null, hintShown: false, usingKeypad: false, keypadHidden: true, mode: 'return' }, JSON.stringify(panel));
    const trip = await page.evaluate(() => {
      const dt = 1000 / 60, { left, right, speed } = guardPatrol.door.patrol;
      // Far from the whole beat, so this walk is undisturbed and only its own mechanics are observed
      // (returning is not immunity — a nearby player re-detects it, checked separately below).
      Body.setPosition(body, { x: 2000, y: floorY - 81 }); grounded = true;
      const start = guardPatrol.x, result = { maxStep: 0, backward: 0, frames: 0, min: Infinity, max: -Infinity,
        srcs: new Set(), phases: new Set(), cells: new Set(), modes: new Set(), caught: false };
      while (guardPatrol.mode === 'return' && result.frames++ < 2000) {
        const before = guardPatrol.x; updateGuardPatrol(dt);
        result.maxStep = Math.max(result.maxStep, Math.abs(guardPatrol.x - before));
        if (guardPatrol.x < before) result.backward++;
        result.min = Math.min(result.min, guardPatrol.x); result.max = Math.max(result.max, guardPatrol.x);
        result.srcs.add(guardPatrol.image.getAttribute('src')); result.phases.add(guardPatrol.door.element.dataset.patrol);
        if (guardPatrol.mode === 'return') result.cells.add(guardPatrol.door.element.dataset.frame);
        result.modes.add(guardPatrol.mode); result.caught ||= playerCaught;
      }
      return { ...result, srcs: [...result.srcs], phases: [...result.phases], cells: [...result.cells].sort(), modes: [...result.modes],
        start, left, right, limit: speed * dt, x: guardPatrol.x, origin: guardPatrol.chaseOriginX, mode: guardPatrol.mode,
        wait: guardPatrol.wait, pause: guardPatrol.door.patrol.pause, facing: guardPatrol.facing };
    });
    assert(trip.maxStep <= trip.limit + 1e-9, `Never moves more than speed * dt per step: ${JSON.stringify(trip)}`);
    assert.equal(trip.backward, 0, 'Walks steadily toward the detection point');
    assert(trip.frames >= Math.floor((trip.origin - trip.start) / trip.limit), `Takes the whole walk: ${trip.frames} frames`);
    assert(trip.min >= trip.left && trip.max <= trip.right, 'Stays inside the patrol bounds');
    assert.equal(trip.caught, false); assert.deepEqual(trip.modes, ['return', 'patrol'], 'Undisturbed, the walk finishes on its own');
    assert.deepEqual(trip.srcs, ['assets/objects/guard-robot/guard-patrol.png'], 'Walking back uses the patrol sheet, not the capture sheet');
    assert.deepEqual(trip.cells, ['0', '1', '2', '3'], 'Returning animates the patrol wheel frames');
    assert.equal(trip.x, trip.origin); assert.equal(trip.mode, 'patrol'); assert.equal(trip.wait, trip.pause);
    assert.equal(trip.facing, 1); assert.equal((await sprite()).phase, 'scan', 'Arrival scans before patrolling on');
    const resumed = await page.evaluate(() => {
      const dt = 1000 / 60, { pause, speed } = guardPatrol.door.patrol;
      Body.setPosition(body, { x: 2000, y: floorY - 81 });
      let scanned = 0;
      while (guardPatrol.facing === 1 && scanned++ < 200) updateGuardPatrol(dt);
      const turned = { x: guardPatrol.x, facing: guardPatrol.facing, mode: guardPatrol.mode };
      for (let i = 0; i < 30; i++) updateGuardPatrol(dt);
      const walked = turned.x - guardPatrol.x;
      Body.setPosition(body, { x: guardPatrol.x - 200, y: floorY - 81 }); updateGuardPatrol(dt);
      return { turned, scanned, frames: pause / dt, walked, expected: speed * dt / 1000 * 30, mode: guardPatrol.mode };
    });
    assert.deepEqual(resumed.turned, { x: 3400, facing: -1, mode: 'patrol' }, JSON.stringify(resumed));
    assert(Math.abs(resumed.scanned - resumed.frames) <= 1, `Scans for the patrol pause: ${JSON.stringify(resumed)}`);
    assert(Math.abs(resumed.walked - resumed.expected) < 2, `Patrol resumes at patrol speed: ${JSON.stringify(resumed)}`);
    assert.equal(resumed.mode, 'chase', 'Detection is back once the robot is on patrol again');
  });
  await check('Returning is not immunity: standing right next to it re-detects it mid-walk', async () => {
    await reset({ playerX: 3200, robot: { x: 3400, facing: -1, firstEncounter: false } });
    const escape = await escapeToElevator();
    assert.equal(escape.mode, 'return', JSON.stringify(escape));
    const reacquired = await page.evaluate(() => {
      Body.setPosition(body, { x: guardPatrol.x + 100, y: floorY - 81 }); grounded = true;
      updateGuardPatrol(1000 / 60);
      return { mode: guardPatrol.mode, x: guardPatrol.x, playerX: body.position.x };
    });
    assert.equal(reacquired.mode, 'chase', `Close range beats the return state: ${JSON.stringify(reacquired)}`);
  });
  await check('A player already waiting at the elevator is chased, not re-spotted every frame', async () => {
    // 1번 엘리베이터 앞에서 359px 떨어진 로봇에게 보이면, 달아나기 전이므로 탈출로 치지 않는다. 엘리베이터
    // 구역은 R-01의 순찰 구간(비상계단 앞부터) 밖이라 'patrol' 상태로는 거기서 감지되지 않으므로, 이미
    // 막 감지된 직후('chase', spottedX=현재 위치)라고 가정하고 fledFar/nearElevator 쪽만 검증한다.
    await reset({ playerX: 2046, robot: { x: 2405, facing: -1, mode: 'chase', spottedX: 2046 } });
    const spotted = await page.evaluate(() => {
      const statuses = new Set(), modes = new Set();
      for (let i = 0; i < 30; i++) {
        updateGuardPatrol(1000 / 60);
        statuses.add(document.getElementById('interaction-status').textContent); modes.add(guardPatrol.mode);
      }
      return { x: guardPatrol.x, modes: [...modes], statuses: [...statuses] };
    });
    assert.deepEqual(spotted.modes, ['chase'], JSON.stringify(spotted));
    assert(spotted.x < 2405 - 100, `The robot actually moves in: ${spotted.x}`);
    assert(spotted.statuses.every(text => !/돌아가기/.test(text)), 'No escape message before fleeing');
  });
  await check('Returning in the live loop: gradual motion, first-encounter lines and leaving mid-return', async () => {
    await reset({ playerX: 3200, robot: { x: 3400, facing: -1, firstEncounter: true } });
    const escape = await escapeToElevator();
    assert.equal(escape.mode, 'return');
    assert.match(escape.status, /돌아가기 시작했다/);
    let previous = escape.x;
    for (let i = 0; i < 25; i++) {
      await page.clock.runFor(100);
      const now = await state(), look = await sprite();
      // 100ms 안에 고정 간격 업데이트가 7번까지 몰릴 수 있다.
      assert(now.x >= previous && now.x - previous <= 80 * 7 / 60 + 1e-9, `Gradual live return: ${previous} -> ${now.x}`);
      assert.equal(now.mode, 'return'); assert.equal(now.caught, false);
      assert.equal(look.src, 'assets/objects/guard-robot/guard-patrol.png'); assert.equal(look.phase, 'move');
      previous = now.x;
      if (i === 10) await page.screenshot({ path: '.local/guard-returning.png' });
    }
    assert(previous - escape.x > 150 && previous < 3400, 'Still on the way back after 2.5 seconds');
    assert.match(await page.locator('#interaction-status').textContent(), /단순 정전이 아니다/, 'First-encounter line follows the return message');
    await page.clock.runFor(4200);
    assert.match(await page.locator('#interaction-status').textContent(), /층별 안내판/);
    assert.equal(await page.evaluate(() => guardPatrol.firstEncounter), false);
    // 다시 돌아가는 도중에 층을 떠나면 그 자리에서 순찰 상태로 정리되고, 돌아와도 로봇이 하나만 남는다.
    await reset({ playerX: 3200, robot: { x: 3400, facing: -1, firstEncounter: false } });
    await escapeToElevator();
    await page.clock.runFor(1000);
    const midway = await state();
    assert.equal(midway.mode, 'return');
    await page.evaluate(() => performFloorChange('f17'));
    assert.equal((await state()).mode, 'patrol');
    await page.clock.runFor(500);
    await page.evaluate(() => performFloorChange('f1'));
    const back = await state();
    assert.equal(back.x, midway.x, 'Leaving mid-return keeps the robot where it was');
    assert.equal(back.mode, 'patrol'); assert.equal(await page.locator('.guard-robot-sprite').count(), 1);
    assert.equal((await sprite()).src, 'assets/objects/guard-robot/guard-patrol.png');
    await page.evaluate(() => Body.setPosition(body, { x: 1000, y: floorY - 81 }));
    await page.clock.runFor(1000);
    const after = await state();
    assert(Math.abs(Math.abs(after.x - back.x) - 80) < 3 && after.x >= 3040 && after.x <= 4540, `Patrols on inside bounds: ${back.x} -> ${after.x}`);
  });
  await check('Maintenance wrong/correct code, clue persistence and repeated retry', async () => {
    await reset({ playerX: 3000 });
    await page.evaluate(() => { collectedItems.delete("f17-emergency-linked"); solarPoweredFloors = [2]; updatePowerState(); updateInteraction(); });
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
      assert(await page.evaluate(() => collectedItems.has('f1-robot-log') && keys.size === 0));
      assert.equal(await page.locator('.guard-robot-sprite').count(), 1);
    }
  });
  await check('Phone/light and held movement inputs are cleared on capture', async () => {
    await reset({ playerX: 3060 });
    await page.keyboard.press('f'); await page.keyboard.down('d');
    await page.clock.runFor(100); assert((await state()).caught);
    assert(await page.evaluate(() => !usingPhone && !phoneLightOn && !jumpQueued && keys.size === 0));
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
    await reset({ playerX: 1000, robot: { x: 3040 } });
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
    assert.equal(patrol.min, 3040); assert.equal(patrol.max, 4540);
    assert.equal(patrol.mode, 'patrol'); assert.equal(patrol.sprites, 1);
  });
  await check('No script or network errors', async () => assert.deepEqual(errors, []));
  assert.deepEqual(failures, [], `${failures.length} regression groups failed`);
  console.log(`PASS: ${checks} guard regression groups (${process.env.GUARD_BROWSER || 'chromium'} ${browser.version()}).`);
} finally { await browser.close(); }
