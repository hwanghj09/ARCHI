import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { autoControl } from './auto-control.mjs';

// B2 엔딩 전체: 준비(외부 회선 레버, 항불안제) → DELETE → 체크포인트 → 로봇 3대 추격 → 엘리베이터 문 장면 → 1층 R-01 →
// 1층 전력 끊기 → 정문 → TRUE END · 크레딧, 그리고 각 단계의 베드엔딩. 정신력 45% 규칙에 따른 시간과 여유를 출력한다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await autoControl(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  const visible = selector => page.locator(selector).isVisible();
  const settle = async (done, limit = 200) => { for (let i = 0; i < limit && !(await page.evaluate(done)); i++) await page.clock.runFor(50); };
  const standAt = (scene, x) => page.evaluate(([scene, x]) => {
    performFloorChange(scene, null, 'exit');
    Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
  }, [scene, x]);
  const inspect = () => page.evaluate(() => { grounded = true; interact(); });

  // 1) 준비: 외부 회선을 끊기 전 DELETE는 회색으로 잠겨 있다. 전력·냉각실의 레버를 내리면 콘솔이 "외부 전송 차단됨"으로 바뀐다.
  await page.evaluate(() => { triggerBuildingBlackout(); solarEnabled = true; updatePowerState(); elevatorCars[0].floor = -2; elevatorCars[0].open = false; });
  await standAt('b2-main', 1400);
  await inspect();
  assert(await page.locator('#inspection-delete').isDisabled(), 'DELETE starts grey');
  assert.equal(await page.locator('#inspection-delete').textContent(), 'DELETE · 외부 연결 중에는 삭제할 수 없음');
  assert.match(await page.locator('#inspection-description').textContent(), /외부 연결 중/);
  await page.evaluate(() => closeInspection());
  await standAt('b2-power', 500);
  await inspect();
  assert(await page.evaluate(() => collectedItems.has('b2-transfer-cut')), 'Pulling the external line lever cuts the transfer');
  await page.evaluate(() => closeInspection());
  await standAt('b2-power', 1400);
  await inspect();
  assert(await page.evaluate(() => collectedItems.has('b2-antianxiety')), 'The antianxiety pill sits on the coolant log cabinet');
  await page.evaluate(() => { closeInspection(); sanity = 20; useInventoryItem('b2-antianxiety'); });
  assert.equal(await page.evaluate(() => sanity), 50, 'The B2 antianxiety lifts sanity to at least 50%');
  await page.evaluate(() => { sanity = 80; collectedItems.delete('b2-antianxiety-used'); itemUseTime = 0; useInventoryItem('b2-antianxiety'); });
  assert.equal(await page.evaluate(() => sanity), 80, 'It never lowers sanity');
  await page.clock.runFor(3000);
  await standAt('b2-main', 1400);
  await inspect();
  assert(!(await page.locator('#inspection-delete').isDisabled()), 'DELETE is enabled after the transfer is cut');
  assert.match(await page.locator('#inspection-description').textContent(), /외부 전송 차단됨/);
  await page.evaluate(() => closeInspection());

  const pressDelete = async () => {
    await inspect();
    await page.locator('#inspection-delete').click();
    assert.equal(await page.locator('#inspection-text').textContent(), '복구할 수 없습니다. 계속하시겠습니까?');
    await page.locator('#inspection-yes').click();
  };
  await page.evaluate(() => { sanity = 35; });
  await pressDelete();
  const started = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, alarm: world.dataset.alarm,
    bar: !document.getElementById('b2-delete-bar').hidden, checkpoint: JSON.parse(localStorage.getItem('archi.checkpoint.b2'))?.scene.id,
    saved: saveProgress() }));
  assert.deepEqual(started, { phase: 'running', robots: 3, alarm: 'true', bar: true, checkpoint: 'b2-main', saved: false });

  // 2) 서버실 안에 가만히 있으면 로봇이 복도를 지나 서버실 문으로 들어와 붙잡는다 → 베드엔딩 → 체크포인트.
  let entered = null;
  for (let t = 0; t < 40 && !(await visible('#b2-bad-ending')); t++) {
    await page.clock.runFor(1000);
    entered ??= await page.evaluate(() => b2Robots.some(robot => robot.where === 'b2-main') ? Math.round(b2Ending.elapsed / 1000) : null);
  }
  assert(entered !== null, 'Robots walked into the server room');
  assert(await visible('#b2-bad-ending'), 'Getting caught shows the bad ending');
  console.log(`sanity 35: robots entered the server room at ${entered}s; caught at ${Math.round(await page.evaluate(() => b2Ending.elapsed) / 1000)}s`);
  await page.locator('#b2-checkpoint').click();
  const back = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, caught: playerCaught, room: dynamicFloorId,
    near: Math.abs(body.position.x - 1400) < 160, bar: document.getElementById('b2-delete-bar').hidden, cut: collectedItems.has('b2-transfer-cut') }));
  assert.deepEqual(back, { phase: 'idle', robots: 0, caught: false, room: 'b2-main', near: true, bar: true, cut: true });

  // 체크포인트에서 정신력을 정하고 다시 DELETE를 누른 뒤 엘리베이터 1번까지 달리거나(Shift+D) 걸어서 탄다.
  const toCabin = async (walk, mind, lag = 0) => {
    await page.evaluate(mind => {
      if (mainMenuActive) closeMainMenu();
      restoreProgress(JSON.parse(localStorage.getItem('archi.checkpoint.b2')));
      Body.setPosition(body, { x: 1400, y: floorY - 81 }); grounded = true; stage.focus(); sanity = mind;
    }, mind);
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
    await page.clock.runFor(lag); // 엘리베이터 앞에서 E를 늦게 누르는 만큼
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
    return { result: await inLobby() ? 'escaped' : 'caught', gauge: gauge && Number(gauge.toFixed(2)), phone };
  };
  // 1층: 내리자마자 휴대폰 → 비상 전력 제어를 열고, 방해가 끝나자마자 1층 전력을 끈다. 끄는 순간 R-01이 몇 초 거리에 있는지 잰다.
  const lobby = () => page.evaluate(() => ({ mode: guardPatrol.mode, x: Math.round(guardPatrol.x), powered: world.dataset.powered,
    bar: document.getElementById('b2-delete-bar').textContent.replace(/\s+/g, ' ').trim(), caught: playerCaught,
    playerX: Math.round(body.position.x), speed: Math.round(b2ChaseSpeed()) }));
  const cutLobbyPower = async () => {
    await page.clock.runFor(500);
    await page.keyboard.press('KeyP');
    await page.locator('[data-phone-app="solar"]').click();
    assert.equal(await page.locator('#phone-solar-status').textContent(), 'ARCHI 방해 중…');
    assert(await page.locator('#phone-solar-supply').isDisabled(), 'ARCHI blocks the power buttons at first');
    for (let i = 0; i < 100 && await page.locator('#phone-solar-supply').isDisabled() && !(await page.evaluate(() => playerCaught)); i++) await page.clock.runFor(50);
    const at = await lobby();
    if (at.caught) return { ...at, margin: null };
    await page.locator('#phone-solar-supply').click();
    await page.clock.runFor(50);
    return { ...at, margin: Number(((at.x - at.playerX - 84) / at.speed).toFixed(2)) };
  };

  // 3) 정신력 60%: 달려 와서 바로 1층 → 1층 R-01 → 전력 끊기(여유 약 2초) → 정문 → TRUE END → 크레딧 → 메뉴.
  const boarded = await toCabin(false, 60);
  console.log(`sanity 60 run: in the cabin at ${boarded.time.toFixed(1)}s (robot ${await page.evaluate(() => Math.round(b2ChaseSpeed()))}px/s)`);
  assert(!boarded.caught && await visible('#elevator-cabin'), 'Running reaches the elevator cabin');
  assert.equal(await page.evaluate(() => { cabinScene.dataset.door = 'struggle'; b2Cabin.state = 'struggle';
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', bubbles: true }));
    b2Cabin.state = 'idle'; cabinScene.dataset.door = 'open'; return b2Cabin.gauge; }), 0, 'E no longer pushes the door');
  const fast = await escapeFrom(0, 0);
  assert.deepEqual(fast, { result: 'escaped', gauge: null, phone: true });
  const arrived = await lobby();
  assert.equal(arrived.powered, 'true', 'R-01 has power in the ending lobby');
  await page.evaluate(() => { const door = currentDoors.find(entry => entry.target === 'f1-harmony');
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 }); grounded = true; updateInteraction(); interact(); });
  assert.match(await page.locator('#inspection-description').textContent(), /ARCHI가 잠갔다/, '1F rooms are locked during the ending');
  assert.equal(await page.evaluate(() => dynamicFloorId), 'f1');
  await page.evaluate(() => { closeInspection(); Body.setPosition(body, { x: currentDoors.find(door => door.carIndex === 0).x + 40, y: floorY - 81 }); });
  const cut60 = await cutLobbyPower();
  console.log('sanity 60 lobby: R-01', arrived.x, '→', cut60.x, `at the cut, margin ${cut60.margin}s`);
  const off = await lobby();
  assert.equal(off.bar, 'ARCHI — OFFLINE', 'Cutting 1F power finishes the delete: ARCHI — OFFLINE');
  await page.clock.runFor(1000);
  assert.equal((await lobby()).x, off.x, 'R-01 stops where it was');
  await page.keyboard.press('KeyP');
  await page.evaluate(() => { Body.setPosition(body, { x: 4770, y: floorY - 81 }); grounded = true; updateInteraction(); });
  await page.keyboard.press('KeyE');
  assert(await visible('#b2-escape'), 'Leaving through the main gate starts the TRUE END');
  const step = () => page.evaluate(() => document.getElementById('b2-escape').dataset.step);
  assert.equal(await step(), 'white');
  await page.clock.runFor(3000);
  assert.equal(await step(), 'title');
  assert.equal(await page.locator('#b2-escape-title').textContent(), 'TRUE END — ARCHI OFFLINE');
  await page.clock.runFor(3500);
  assert.equal(await step(), 'credits');
  assert.equal((await page.locator('.b2-credits-roll').textContent()).replace(/\s+/g, ''), '기획정수호개발현준디자인윤찬사운드정래PM정민준');
  assert(!(await visible('#b2-escape-menu')), 'The menu button waits for the credits');
  await page.clock.runFor(9000);
  assert(await visible('#b2-escape-menu'), 'After the credits, [메인 메뉴로] appears');
  await page.locator('#b2-escape-menu').click();
  assert(await visible('#main-menu'), 'The TRUE END returns to the main menu');

  // 4) 1층에서 전력을 끊지 않으면 R-01에게 잡혀 베드엔딩.
  await toCabin(false, 60);
  await escapeFrom(0, 0);
  let ticks = 0;
  while (ticks < 600 && !(await page.evaluate(() => playerCaught))) { await page.clock.runFor(50); ticks++; }
  console.log(`sanity 60 lobby: R-01 grabs an idle Suho ${(ticks * .05).toFixed(1)}s after arriving`);
  await settle(() => !document.getElementById('b2-bad-ending').hidden);
  assert(await visible('#b2-bad-ending'), 'R-01 catching Suho before the power cut shows the bad ending');

  // 5) 정신력 60%, 칸 안에서 머뭇거리면 게이지. 연타가 빠르면 성공, 느리면 붙잡힌다.
  const table = [];
  for (const [wait, rate] of [[2500, 6], [2500, 3], [3500, 6], [3500, 4], [6000, 6]]) {
    await toCabin(false, 60);
    const outcome = await escapeFrom(wait, rate);
    table.push({ sanity: 60, wait, rate, ...outcome });
    if (outcome.result === 'caught') assert(await visible('#b2-bad-ending'), 'Losing the door fight shows the bad ending');
  }
  // 6) 정신력 40%: 로봇이 더 빠르다. 쉬지 않고 달려 바로 타고 바로 1층을 눌러야 겨우 산다(lag: 엘리베이터 앞에서 늦게 누른 ms,
  // wait: 칸 안에서 머뭇거린 ms). 비교로 정신력 60%에서 같이 늦어 본다.
  const low = [];
  for (const [mind, lag, wait, rate] of [[40, 0, 0, 6], [40, 300, 500, 6], [40, 300, 500, 8], [40, 1500, 0, 8], [60, 1200, 500, 6]]) {
    const run = await toCabin(false, mind, lag);
    const outcome = run.caught ? { result: 'caught in corridor' } : await escapeFrom(wait, rate);
    let lobbyEnd = null;
    if (outcome.result === 'escaped') {
      const cut = await cutLobbyPower();
      lobbyEnd = cut.caught ? 'caught' : `cut, margin ${cut.margin}s`;
      if (!cut.caught) await page.keyboard.press('KeyP');
    }
    low.push({ sanity: mind, lag, wait, rate, cabin: run.caught ? '-' : run.time.toFixed(1), ...outcome, lobby: lobbyEnd });
  }
  console.table([...table, ...low]);
  assert.equal(table[0].result, 'escaped', 'A short pause with steady mashing (6/s) still escapes');
  assert.equal(table[1].result, 'caught', 'Slow mashing (3/s) loses the door');
  assert.equal(table[4].result, 'caught before pressing', 'Standing in the open cabin gets Suho pulled out');
  assert(Math.abs(cut60.margin - 2) < .4, `About two seconds to spare at the cut (${cut60.margin}s)`);
  assert(low[0].lobby?.startsWith('cut'), 'Below 45%: a flawless run still ends the game');
  assert.equal(low[1].result, 'caught', 'Below 45%: a little late plus normal mashing (6/s) loses the door');
  assert(low[2].lobby?.startsWith('cut'), 'Below 45%: a little late is survivable with fast mashing (8/s)');
  assert.equal(low[3].result, 'caught in corridor', 'Below 45%: 1.5s late at the elevator is fatal');
  assert(low[4].lobby?.startsWith('cut'), 'Above 45%: being 1.2s late is forgiven');

  // 7) 걸어서 오면 잡힌다.
  const walked = await toCabin(true, 60);
  const walkEnd = walked.caught ? { result: 'caught in corridor' } : await escapeFrom(0, 6);
  console.log(`sanity 60 walk: ${walked.time.toFixed(1)}s`, walkEnd);
  assert.notEqual(walkEnd.result, 'escaped', 'Walking does not escape');
  assert.deepEqual(errors, []);
  console.log('B2 ending checks passed.');
} finally {
  await browser.close();
}
