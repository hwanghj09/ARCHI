import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { autoControl } from './auto-control.mjs';

// B2 엔딩 전체: 준비(외부 회선 레버, 항불안제) → DELETE → 체크포인트 → 로봇 3대가 서버실로 온다 → 장비 운반 상자로 출입문 막기 →
// 메인 콘솔 루트 터미널에서 명령어로 ARCHI의 방해를 막는 삭제 배틀 → ARCHI — OFFLINE → TRUE END · 크레딧, 그리고 각 단계의
// 베드엔딩(문을 못 막음, 바리케이드가 무너짐). 정신력 45% 규칙에 따른 시간과 여유를 출력한다.
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
  await page.evaluate(() => { triggerBuildingBlackout(); collectedItems.add('f17-emergency-linked'); solarEnabled = true; updatePowerState(); elevatorCars[0].floor = -2; elevatorCars[0].open = false; });
  await standAt('b2-main', 1400);
  await inspect();
  assert(await page.locator('#inspection-delete').isDisabled(), 'DELETE starts grey');
  assert.equal(await page.locator('#inspection-delete').textContent(), 'DELETE · 외부 전송 회선 연결 중 · 회선 패널에서 먼저 차단하십시오');
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
  const crate = () => page.evaluate(() => {
    const part = movingParts.find(entry => entry.barricadeSpec);
    return { pushable: Boolean(part.pushable), left: Math.round(part.body.bounds.min.x), right: Math.round(part.body.bounds.max.x) };
  });
  assert.equal((await crate()).pushable, false, 'The crate does not move before DELETE');

  const pressDelete = async () => {
    await inspect();
    await page.locator('#inspection-delete').click();
    assert.equal(await page.locator('#inspection-text').textContent(), '복구할 수 없습니다. 계속하시겠습니까?');
    await page.locator('#inspection-yes').click();
  };
  await page.evaluate(() => { sanity = 60; });
  await pressDelete();
  const started = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length,
    bar: !document.getElementById('b2-delete-bar').hidden, checkpoint: JSON.parse(localStorage.getItem('archi.checkpoint.b2'))?.scene.id,
    saved: saveProgress() }));
  assert.deepEqual(started, { phase: 'running', robots: 3, bar: true, checkpoint: 'b2-main', saved: false });
  assert.equal((await crate()).pushable, true, 'DELETE frees the crate');

  // 2) 서버실 안에 가만히 있으면 로봇이 복도를 지나 서버실 문으로 들어와 붙잡는다 → 베드엔딩 → 체크포인트.
  let entered = null;
  for (let t = 0; t < 400 && !(await visible('#b2-capture-scene')); t++) {
    await page.clock.runFor(100);
    entered ??= await page.evaluate(() => b2Robots.some(robot => robot.where === 'b2-main') ? Math.round(performance.now()) : null);
  }
  assert(entered !== null, 'Robots walked into the server room');
  assert(await visible('#b2-capture-scene'), 'Getting caught starts the first-person knockout scene');
  await page.locator('#b2-capture-skip').click();
  assert(await visible('#b2-bad-ending'), 'Getting caught shows the bad ending');
  await page.locator('#b2-checkpoint').click();
  const back = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, caught: playerCaught, room: dynamicFloorId,
    near: Math.abs(body.position.x - 1400) < 160, bar: document.getElementById('b2-delete-bar').hidden, cut: collectedItems.has('b2-transfer-cut') }));
  assert.deepEqual(back, { phase: 'idle', robots: 0, caught: false, room: 'b2-main', near: true, bar: true, cut: true });

  // 체크포인트에서 정신력을 정하고 다시 DELETE를 누른 뒤, 상자 쪽으로 달려가(Shift+D) 출입문까지 민다. 로봇이 문에 오는 시각과 비교한다.
  const fromCheckpoint = async mind => {
    await page.evaluate(mind => {
      if (mainMenuActive) closeMainMenu();
      restoreProgress(JSON.parse(localStorage.getItem('archi.checkpoint.b2')));
      Body.setPosition(body, { x: 1400, y: floorY - 81 }); grounded = true; stage.focus(); sanity = mind;
    }, mind);
    await pressDelete();
  };
  const barricade = async () => {
    const start = await page.evaluate(() => performance.now());
    await page.keyboard.down('ShiftLeft');
    await page.keyboard.down('KeyD');
    await settle('playerCaught || b2Ending.barricaded', 600);
    await page.keyboard.up('KeyD'); await page.keyboard.up('ShiftLeft');
    const done = await page.evaluate(() => performance.now());
    // 문에 첫 로봇이 닿는 시각
    let arrive = null;
    for (let i = 0; i < 600 && arrive === null && !(await page.evaluate(() => playerCaught)); i++) {
      await page.clock.runFor(50);
      if (await page.evaluate(() => b2Robots.some(robot => robot.banging || robot.where === 'b2-main'))) arrive = await page.evaluate(() => performance.now());
    }
    return { barricaded: await page.evaluate(() => b2Ending.barricaded), pushTime: (done - start) / 1000, robotTime: arrive && (arrive - start) / 1000 };
  };

  // 3) 정신력 60%: 문 막기 → 로봇이 두드린다 → 터미널 배틀 → OFFLINE → TRUE END → 크레딧 → 메뉴.
  await fromCheckpoint(60);
  const run60 = await barricade();
  console.log(`sanity 60: barricaded in ${run60.pushTime.toFixed(1)}s, robots at the door at ${run60.robotTime?.toFixed(1)}s`);
  assert(run60.barricaded && run60.robotTime > run60.pushTime + 3, 'Running straight to the crate barricades the door with time to spare');
  const blocked = await page.evaluate(() => {
    const door = currentDoors.find(entry => entry.key === 'exit');
    return { locked: door.locked, pushable: Boolean(movingParts.find(entry => entry.barricadeSpec).pushable), banging: b2Robots.some(robot => robot.banging),
      inside: b2Robots.some(robot => robot.where === 'b2-main'), barricade: b2Ending.barricade, line: !document.getElementById('b2-barricade-line').hidden };
  });
  assert.equal(blocked.locked, true, 'The exit is blocked');
  assert.equal(blocked.pushable, false, 'The crate stays put once the door is covered');
  assert.equal(blocked.banging, true, 'Robots pound on the blocked door');
  assert.equal(blocked.inside, false, 'Robots stay outside');
  assert(blocked.line, 'The barricade gauge appears');
  await page.clock.runFor(2000);
  assert((await page.evaluate(() => b2Ending.barricade)) < blocked.barricade, 'Pounding wears the barricade down');
  const { left, right } = await crate();
  const door = await page.evaluate(() => { const exit = currentDoors.find(entry => entry.key === 'exit'); return { x: exit.x, width: exit.width }; });
  assert(left <= door.x && right >= door.x + door.width, `The crate covers the door (${left}-${right} vs ${door.x}-${door.x + door.width})`);

  // 엘리베이터는 ARCHI가 멈췄다(복도에서 호출해도 타지 못한다).
  assert.equal(await page.evaluate(() => {
    const before = selectingFloor;
    const door = { type: 'elevator', carIndex: 0, x: 0, width: 10, y: 0 };
    const saved = nearbyDoor; nearbyDoor = door; interact(); nearbyDoor = saved;
    return before === selectingFloor && !selectingFloor;
  }), true, 'The elevator does not answer during the ending');

  // 메인 콘솔로 걸어가 E: 터미널이 열린다. 키보드로 친 글자(e 포함)가 수호 조작으로 새지 않는다.
  await page.evaluate(() => { Body.setPosition(body, { x: 1530, y: floorY - 81 }); grounded = true; updateInteraction(); });
  await page.keyboard.press('KeyE');
  assert(await visible('#b2-terminal'), 'The console opens the root terminal after the door is blocked');
  assert.match(await page.locator('#b2-terminal-log').textContent(), /삭제를 거부합니다/);
  await page.keyboard.type('help');
  await page.keyboard.press('Enter');
  const log = await page.locator('#b2-terminal-log').textContent();
  assert.match(log, /# help/, 'Typed letters reach the terminal');
  assert.match(log, /kill <PID>/);
  assert.match(log, /rm <경로>/);
  assert(!(await visible('#inspection')), 'Typing E in the terminal does not inspect anything');
  const terminal = () => page.evaluate(() => ({ progress: b2Ending.progress, barricade: b2Ending.barricade, threat: b2Battle.threat?.answer ?? null,
    offline: b2Ending.offline, open: b2TerminalOpen }));
  const type = async text => { await page.locator('#b2-terminal-input').fill(text); await page.keyboard.press('Enter'); };
  await type('킬 1234');
  assert.match(await page.locator('#b2-terminal-log').textContent(), /한\/영 키/, 'Korean input gets a hint');
  await settle(() => b2Battle.threat !== null, 400);
  const first = await terminal();
  assert(first.threat, 'ARCHI starts interfering');
  assert(await visible('#b2-terminal-threat'), 'The threat and its timer are shown');
  assert.match(await page.locator('#b2-terminal-log').textContent(), /대응: /, 'The first threat of a kind explains the counter');
  await type('kill 0');
  const wrong = await terminal();
  assert(wrong.progress < first.progress, 'A wrong command costs progress');
  assert.equal(wrong.threat, first.threat, 'A wrong command does not clear the threat');
  await type(first.threat.toUpperCase().replace(' ', '   '));
  assert.equal((await terminal()).threat, null, 'The right command blocks the threat (case and spacing do not matter)');
  // 파일 경로는 Tab으로 자동완성된다(백업 복원 방해를 하나 띄워 확인). 경로와 맞지 않는 앞부분은 채우지 않는다.
  const rmAnswer = await page.evaluate(() => {
    const kind = b2ThreatKinds.find(entry => entry.verb === 'rm');
    b2Battle.threat = { ...kind.make(), kind, left: 13000, total: 13000 };
    return b2Battle.threat.answer;
  });
  const input = page.locator('#b2-terminal-input');
  await input.fill('rm /x');
  await input.press('Tab');
  assert.equal(await input.inputValue(), 'rm /x', 'Tab ignores a path that does not match');
  await input.fill('rm /b');
  await input.press('Tab');
  assert.equal(await input.inputValue(), rmAnswer, 'Tab completes the backup image path');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'b2-terminal-input', 'Tab keeps focus in the terminal');
  await page.keyboard.press('Enter');
  assert.equal((await terminal()).threat, null, 'The completed command blocks the threat');
  // 끝까지: 방해가 뜨면 1.5초 뒤에 막는다.
  let blockedCount = 1;
  for (let i = 0; i < 2000 && !(await terminal()).offline; i++) {
    const state = await terminal();
    if (state.threat) {
      await page.clock.runFor(1500);
      await type(state.threat);
      blockedCount++;
    } else await page.clock.runFor(100);
  }
  const won = await terminal();
  console.log(`sanity 60 battle: blocked ${blockedCount} threats, barricade left ${Math.round(won.barricade)}%`);
  assert.equal(won.offline, true, 'Blocking every threat finishes the delete');
  assert(won.barricade > 20, 'A clean run keeps a safe margin on the barricade');
  assert.equal((await page.locator('#b2-delete-bar').textContent()).replace(/\s+/g, ' ').trim().startsWith('ARCHI — OFFLINE 100%'), true);
  assert.match(await page.locator('#b2-terminal-log').textContent(), /ARCHI — OFFLINE/);
  assert.equal(await page.evaluate(() => b2Robots.every(robot => !robot.banging)), true, 'Robots stop pounding');
  await page.clock.runFor(4100);
  assert(!(await visible('#b2-terminal')), 'The terminal closes for the finale');
  assert(await visible('#b2-escape'), 'OFFLINE leads to the TRUE END');
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

  // 4) 문을 막았지만 터미널에서 방해를 막지 않으면 삭제가 되돌아가고 바리케이드가 무너져 베드엔딩.
  await fromCheckpoint(60);
  await barricade();
  await page.evaluate(() => { Body.setPosition(body, { x: 1530, y: floorY - 81 }); grounded = true; updateInteraction(); });
  await page.keyboard.press('KeyE');
  let ticks = 0;
  while (ticks < 3000 && !(await page.evaluate(() => playerCaught))) { await page.clock.runFor(100); ticks++; }
  console.log(`sanity 60 idle at the terminal: barricade broke ${(ticks / 10).toFixed(1)}s after opening it`);
  assert(await page.evaluate(() => playerCaught), 'An ignored battle ends with the robots breaking in');
  await settle(() => b2CaptureActive);
  await page.locator('#b2-capture-skip').click();
  assert(await visible('#b2-bad-ending'), 'Breaking in shows the bad ending');
  assert(!(await visible('#b2-terminal')), 'The terminal closes when the robots break in');

  // 5) 정신력 30%: 로봇이 더 빠르다. 바로 달려가 밀면 겨우 막는다. 걸어서 밀면 늦는다.
  await page.locator('#b2-checkpoint').click();
  await fromCheckpoint(30);
  const run30 = await barricade();
  console.log(`sanity 30: barricaded in ${run30.pushTime.toFixed(1)}s, robots at the door at ${run30.robotTime?.toFixed(1)}s`);
  assert(run30.barricaded, 'Below 45%: running straight to the crate still blocks the door');
  await page.evaluate(() => { b2Ending.barricade = 0.01; });
  await settle(() => playerCaught, 100);
  await settle(() => b2CaptureActive);
  await page.locator('#b2-capture-skip').click();
  await page.locator('#b2-checkpoint').click();
  await fromCheckpoint(30);
  await page.keyboard.down('KeyD');
  await settle('playerCaught', 800);
  await page.keyboard.up('KeyD');
  const walked = await page.evaluate(() => ({ barricaded: b2Ending.barricaded, caught: playerCaught }));
  console.log('sanity 30 walking push:', walked);
  assert.deepEqual(walked, { barricaded: false, caught: true }, 'Below 45%, walking the crate over is too slow: a robot gets in first');

  assert.deepEqual(errors, []);
  console.log('B2 ending checks passed.');
} finally {
  await browser.close();
}
