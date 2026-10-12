import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// B2 엔딩 최소 버전: DELETE → 체크포인트 → 로봇 3대 추격(서버실 문으로 들어옴) → 베드엔딩 → 체크포인트 복귀,
// 그리고 콘솔에서 엘리베이터까지 실제로 달려서 임시 해피엔딩. 달리는 동안의 시간과 로봇 위치를 출력한다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  const atConsole = () => page.evaluate(() => {
    triggerBuildingBlackout(); solarEnabled = true; updatePowerState();
    elevatorCars[0].floor = -2; elevatorCars[0].open = false;
    performFloorChange('b2-main', null, 'exit');
    Body.setPosition(body, { x: 1400, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; cameraX = cameraTarget(); render();
  });
  const pressDelete = async () => {
    await page.evaluate(() => { grounded = true; interact(); });
    assert(await page.locator('#inspection-delete').isVisible(), 'The main console offers DELETE');
    await page.locator('#inspection-delete').click();
    assert.equal(await page.locator('#inspection-text').textContent(), '복구할 수 없습니다. 계속하시겠습니까?');
    await page.locator('#inspection-yes').click();
  };

  await atConsole();
  await pressDelete();
  const started = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, alarm: world.dataset.alarm,
    bar: !document.getElementById('b2-delete-bar').hidden, checkpoint: JSON.parse(localStorage.getItem('archi.checkpoint.b2'))?.scene.id,
    saved: saveProgress() }));
  assert.deepEqual(started, { phase: 'running', robots: 3, alarm: 'true', bar: true, checkpoint: 'b2-main', saved: false });

  // 서버실 안에 가만히 있으면 로봇이 복도를 지나 서버실 문으로 들어와 붙잡는다.
  let entered = null;
  for (let t = 0; t < 40 && !(await page.locator('#b2-bad-ending').isVisible()); t++) {
    await page.clock.runFor(1000);
    entered ??= await page.evaluate(() => b2Robots.some(robot => robot.where === 'b2-main') ? Math.round(b2Ending.elapsed / 1000) : null);
  }
  assert(entered !== null, 'Robots walked into the server room');
  assert(await page.locator('#b2-bad-ending').isVisible(), 'Getting caught shows the bad ending');
  assert.equal(await page.locator('#b2-delete-percent').textContent() !== '', true);
  console.log(`robots entered the server room at ${entered}s; caught at ${Math.round(await page.evaluate(() => b2Ending.elapsed) / 1000)}s`);
  await page.locator('#b2-checkpoint').click();
  const back = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, caught: playerCaught, room: dynamicFloorId,
    near: Math.abs(body.position.x - 1400) < 160, bar: document.getElementById('b2-delete-bar').hidden }));
  assert.deepEqual(back, { phase: 'idle', robots: 0, caught: false, room: 'b2-main', near: true, bar: true });


  // 체크포인트에서 다시 DELETE를 누르고 엘리베이터 1번까지 달리거나(Shift+D) 걸어서 탄다.
  const visible = selector => page.locator(selector).isVisible();
  const settle = async (done, limit = 200) => { for (let i = 0; i < limit && !(await page.evaluate(done)); i++) await page.clock.runFor(50); };
  const toCabin = async walk => {
    await page.evaluate(() => {
      if (mainMenuActive) closeMainMenu();
      restoreProgress(JSON.parse(localStorage.getItem('archi.checkpoint.b2')));
      Body.setPosition(body, { x: 1400, y: floorY - 81 }); grounded = true; stage.focus();
    });
    await pressDelete();
    const move = async until => {
      if (!walk) await page.keyboard.down('ShiftLeft');
      await page.keyboard.down('KeyD');
      await settle(`playerCaught || (${until})`, 400);
      await page.keyboard.up('KeyD'); if (!walk) await page.keyboard.up('ShiftLeft');
    };
    await move("nearbyDoor?.key === 'exit'");
    await page.keyboard.press('KeyE');
    await settle(() => !transitioning && dynamicFloorId === 'b2');
    await move("nearbyDoor?.type === 'elevator' && nearbyDoor.carIndex === 0");
    if (!(await page.evaluate(() => playerCaught))) await page.keyboard.press('KeyE');
    await settle(() => playerCaught || (selectingFloor && !transitioning));
    return page.evaluate(() => ({ caught: playerCaught, time: b2Ending.elapsed / 1000 }));
  };
  // 칸 안에서 wait ms 기다렸다가 1층을 누르고, 게이지가 뜨면 1초에 rate번 Enter(짝수 번째는 스페이스)를 누른다.
  const inLobby = () => page.evaluate(() => b2Ending.stage === 'lobby' && !transitioning && dynamicFloorId === 'f1');
  const escapeFrom = async (wait, rate) => {
    await page.clock.runFor(wait);
    if (!(await page.evaluate(() => selectingFloor))) return { result: 'caught before pressing' };
    await page.locator('[data-floor="1"].cabin-hit').click();
    let gauge = null, phone = false, presses = 0;
    for (let i = 0; i < 400 && !(await inLobby()) && !(await visible('#b2-bad-ending')); i++) {
      if (await visible('#b2-door-gauge')) {
        gauge ??= await page.evaluate(() => b2Cabin.gauge);
        await page.keyboard.press(presses++ % 2 ? 'Space' : 'Enter');
        await page.clock.runFor(1000 / rate);
      } else await page.clock.runFor(50);
      phone ||= await visible('#b2-phone-message');
    }
    return { result: await inLobby() ? 'escaped' : 'caught', gauge, phone };
  };

  // 1) 달려 와서 바로 1층: 로봇이 아직 안 와서 게이지 없이 닫히고, 휴대폰에 ARCHI 메시지, 1층 로비에 내린다.
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); elevatorCars[0].floor = -2; elevatorCars[0].open = false; });
  const boarded = await toCabin(false);
  console.log(`run: in the cabin at ${boarded.time.toFixed(1)}s`);
  assert(!boarded.caught && await visible('#elevator-cabin'), 'Running reaches the elevator cabin');
  assert.equal(await page.evaluate(() => { cabinScene.dataset.door = 'struggle'; b2Cabin.state = 'struggle';
    const pressed = new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }); window.dispatchEvent(pressed);
    b2Cabin.state = 'idle'; cabinScene.dataset.door = 'open'; return b2Cabin.gauge; }), 0, 'E no longer pushes the door');
  const fast = await escapeFrom(0, 0);
  console.log('run, press 1F at once:', fast);
  assert.deepEqual(fast, { result: 'escaped', gauge: null, phone: true });

  // 2) 1층: R-01이 정문 앞에서 수호를 보고 쫓는다. 1층 전력이 원래 꺼져 있어도 이 장면에서는 켜져 있다. 삭제는 99%에서 멈춘다.
  const lobby = () => page.evaluate(() => ({ mode: guardPatrol.mode, x: Math.round(guardPatrol.x), powered: world.dataset.powered,
    percent: document.getElementById('b2-delete-bar').textContent.replace(/\s+/g, ' ').trim(), caught: playerCaught, playerX: Math.round(body.position.x) }));
  const arrived = await lobby();
  await page.clock.runFor(500);
  assert.equal(arrived.powered, 'true', 'R-01 has power in the ending lobby');
  assert.equal((await lobby()).mode, 'chase', 'R-01 sees Suho step out of the elevator and chases');
  // 휴대폰 → 비상 전력 제어: 처음 3.5초는 "ARCHI 방해 중…"이라 눌리지 않는다. 그동안에도 R-01은 다가온다.
  const before = await lobby();
  assert.equal(before.caught, false);
  await page.keyboard.press('KeyP');
  await page.locator('[data-phone-app="solar"]').click();
  assert.equal(await page.locator('#phone-solar-status').textContent(), 'ARCHI 방해 중…');
  assert(await page.locator('#phone-solar-supply').isDisabled(), 'ARCHI blocks the power buttons at first');
  await page.clock.runFor(1500);
  assert((await lobby()).x < before.x, 'R-01 keeps coming while the app is jammed');
  await page.clock.runFor(2100);
  assert(!(await page.locator('#phone-solar-supply').isDisabled()), 'The jam ends after about 3.5 seconds');
  assert.equal(await page.locator('#phone-solar-floor').inputValue(), '1');
  await page.locator('#phone-solar-supply').click();
  await page.clock.runFor(100);
  const off = await lobby();
  assert.equal(off.percent, 'ARCHI — OFFLINE', 'Cutting 1F power finishes the delete: ARCHI — OFFLINE');
  assert.equal(off.powered, 'false');
  await page.clock.runFor(1000);
  assert.equal((await lobby()).x, off.x, 'R-01 stops where it was');
  console.log(`lobby: R-01 ${arrived.x} → ${before.x} (0.5s) → stopped at ${off.x} after the 3.5s jam`);
  await page.keyboard.press('KeyP');
  await page.evaluate(() => { Body.setPosition(body, { x: 4770, y: floorY - 81 }); grounded = true; updateInteraction(); });
  await page.keyboard.press('KeyE');
  assert(await visible('#b2-escape'), 'Leaving through the main gate shows the TRUE END');
  assert.equal(await page.locator('#b2-escape-title').textContent(), 'TRUE END — ARCHI OFFLINE (임시)');
  await page.locator('#b2-escape-menu').click();
  assert(await visible('#main-menu'), 'The TRUE END returns to the main menu');
  assert(await visible('#menu-continue'), 'Continue resumes from the save before DELETE');

  // 3) 1층에서 전력을 끊지 않으면 R-01에게 잡혀 베드엔딩.
  await toCabin(false);
  await escapeFrom(0, 0);
  let ticks = 0;
  while (ticks < 600 && !(await page.evaluate(() => playerCaught))) { await page.clock.runFor(50); ticks++; }
  const lobbyCatch = ticks * .05;
  console.log(`lobby: R-01 grabs an idle Suho ${lobbyCatch.toFixed(1)}s after arriving`);
  await settle(() => !document.getElementById('b2-bad-ending').hidden);
  assert(await visible('#b2-bad-ending'), 'R-01 catching Suho before the power cut shows the bad ending');

  // 4) 칸 안에서 머뭇거리면 로봇이 문 앞에 와서 게이지가 뜬다. 연타가 빠르면 성공, 느리면 붙잡힌다.
  const table = [];
  for (const [wait, rate] of [[1500, 6], [1500, 3], [2500, 6], [2500, 4], [4000, 6]]) {
    await toCabin(false);
    const outcome = await escapeFrom(wait, rate);
    table.push({ wait, rate, ...outcome });
    if (outcome.result === 'caught') {
      assert(await visible('#b2-bad-ending'), 'Losing the door fight shows the bad ending');
      assert.equal(await page.evaluate(() => [selectingFloor, playerCaught].join()), 'false,true', 'Suho is pulled out and grabbed');
    }
  }
  console.table(table);
  assert.equal(table[0].result, 'escaped', 'A short pause with steady mashing (6/s) still escapes');
  assert.equal(table[1].result, 'caught', 'Slow mashing (3/s) loses the door');
  assert.notEqual(table[0].gauge, null, 'A robot at the closing door starts the gauge');
  assert.equal(table[2].result, 'escaped', 'Fumbling for the button (2.5s) is still winnable with 6 presses a second');
  assert.equal(table[4].result, 'caught before pressing', 'Standing in the open cabin gets Suho pulled out');

  // 5) 걸어서 오면 잡힌다.
  const walked = await toCabin(true);
  const walkEnd = walked.caught ? { result: 'caught in corridor' } : await escapeFrom(0, 6);
  console.log(`walk: ${walked.time.toFixed(1)}s`, walkEnd);
  assert.notEqual(walkEnd.result, 'escaped', 'Walking does not escape');
  assert.deepEqual(errors, []);
  console.log('B2 ending checks passed.');
} finally {
  await browser.close();
}
