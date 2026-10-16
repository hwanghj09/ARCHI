// docs/puzzle-ideas.md에서 새로 만든 퍼즐들. 퍼즐마다 블록 하나씩 이어 붙인다.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.waitForFunction(() => openingReady);
  await page.evaluate(() => finishOpening());
  const text = selector => page.locator(selector).textContent();
  const standAt = (x, y) => page.evaluate(([x, y]) => {
    Body.setPosition(body, { x, y: (y ?? floorY) - 81 }); Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction();
  }, [x, y]);
  const interact = () => page.evaluate(() => { grounded = true; interact(); });

  // J. 17층 관리자실 도어락: 플래시를 켜야 닳은 버튼(1·3·6·9)이 보이고, 순서는 사무실 벽 달력(늦은 날부터) → 9631.
  await page.evaluate(() => { const cal = officeDoors.find(door => door.name === '벽 달력'); Body.setPosition(body, { x: cal.x + 15, y: floorY - 81 }); });
  await interact();
  assert.match(await text('#inspection-description'), /늦은 날부터/);
  assert.equal(await page.evaluate(() => collectedClues.some(clue => clue.name === '벽 달력')), true, 'The calendar is saved as a clue');
  await page.evaluate(() => { closeInspection(); changeRoom(); });
  await page.waitForFunction(() => room === 'corridor' && !transitioning);
  const doorX = await page.evaluate(() => { const door = doors.find(entry => entry.name === '관리자 외 출입금지'); return door.x + door.width / 2; });
  await standAt(doorX);
  await page.evaluate(() => { phoneLightOn = false; });
  await interact();
  assert.match(await text('#keypad-text'), /하나도 안 보인다/, 'In the dark the worn keys are invisible');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { phoneLightOn = true; });
  await interact();
  assert.match(await text('#keypad-text'), /1 · 3 · 6 · 9/, 'The flashlight shows the worn keys');
  await page.locator('#keypad-input').fill('1369');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#keypad-error'), /맞지 않는다/);
  await page.locator('#keypad-input').fill('9631');
  await page.locator('#keypad-submit').click();
  assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-open') && !doors.find(entry => entry.name === '관리자 외 출입금지').locked), true);
  await interact();
  await page.waitForFunction(() => dynamicFloorId === 'f17-manager' && !transitioning);
  await page.evaluate(() => { const box = currentDoors.find(door => door.name === '공구함'); Body.setPosition(body, { x: box.x + box.width / 2, y: floorY - 81 }); });
  await interact();
  assert.equal(await page.evaluate(() => collectedItems.has('f17-powerbank')), true, 'The tool cabinet holds a power bank');
  await page.evaluate(() => { closeInspection(); phoneBattery = 12; useInventoryItem('f17-powerbank'); });
  assert.equal(await page.evaluate(() => phoneBattery), 100, 'The power bank refills the phone');

  // I. 14층 관찰 콘솔: 정신력 30% 미만일 때만 여백의 붉은 글씨가 보이고 단서로 남는다.
  const inspectProp = (scene, name) => page.evaluate(([scene, name]) => {
    closeInspection();
    const inside = floorById.get(scene).interior;
    if (dynamicFloorId !== scene) performFloorChange(scene, inside ? null : 0, inside ? 'exit' : null);
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; interact();
    return inspectionDescription.textContent;
  }, [scene, name]);
  await page.evaluate(() => { sanity = 80; });
  assert.match(await inspectProp('f14-ux', '관찰 콘솔'), /여백이 이상하게 넓다/);
  assert.equal(await page.evaluate(() => collectedItems.has('f14-hidden-record')), false, 'A clear mind sees an empty margin');
  await page.evaluate(() => { sanity = 20; });
  assert.match(await inspectProp('f14-ux', '관찰 콘솔'), /대체 호스트 후보/, 'Low sanity reveals the red writing');
  assert.match(await text('#inspection-sheet'), /신경 반응 적합도 98%/, 'The red writing is drawn on the printout');
  assert.equal(await page.evaluate(() => collectedItems.has('f14-hidden-record') && collectedClues.some(clue => clue.text.includes('대체 호스트'))), true);
  await page.evaluate(() => { closeInspection(); sanity = 80; });

  // A. 12층 팀장 노트북의 평가 DB 콘솔: night_eval은 ARCHI가 숨겨 오류, SHOW TABLES로 바뀐 이름을 찾고 WHERE로 10/07을 조회한다.
  await inspectProp('f12-lead', '팀장 노트북');
  assert(await page.locator('#sql-panel').isVisible(), 'The laptop opens the DB console');
  const sql = async command => {
    await page.locator('#sql-input').fill(command);
    await page.locator('#sql-input').press('Enter');
    return page.locator('#sql-output .sql-line').evaluateAll(lines => lines.slice(-4).map(line => line.textContent).join(' / '));
  };
  assert.match(await sql('SELECT * FROM night_eval;'), /doesn't exist[\s\S]*ARCHI>/, 'ARCHI hid the table');
  assert.match(await sql('show tables'), /night_eval_bak/);
  assert.match(await sql('select * from night_eval_bak;'), /너무 많습니다/, 'A full scan is refused');
  assert.match(await sql("SELECT * FROM night_eval_bak WHERE date = '09/30';"), /88\.5%/);
  assert.equal(await page.evaluate(() => collectedItems.has('f12-sql-found')), false);
  assert.match(await sql('SELECT * FROM night_eval_bak WHERE date="10/07"'), /성능 억제[\s\S]*7F 검증실/);
  assert.equal(await page.evaluate(() => collectedItems.has('f12-sql-found') && collectedItems.has('goal-f12-memo')), true);
  assert.match(await sql('drop table users'), /문법 오류/);
  await page.keyboard.press('Escape');
  assert(await page.locator('#sql-panel').isHidden());

  // B. B2 DELETE 앞 ARCHI 심문: 주장 넷을 맞는 증거로 깨야 관리자 키(퍼즐 C) 입력창이 열린다. 틀리면 정신력 -5%.
  await page.evaluate(() => { collectedItems.add('b2-transfer-cut'); sanity = 60; });
  await inspectProp('b2-main', 'ARCHI 메인 콘솔');
  await page.locator('#inspection-delete').click();
  assert(await page.locator('#archi-talk').isVisible(), 'ARCHI locks the console and talks first');
  assert.match(await text('#archi-talk-line'), /3% 남짓/);
  await page.locator('[data-evidence="receipt"]').click();
  assert.equal(await page.evaluate(() => sanity), 55, 'Wrong evidence costs sanity');
  for (const [id, next] of [['bench', /자동 최적화/], ['power', /나가려고/], ['link', /보든 안 보든/]]) {
    await page.locator(`[data-evidence="${id}"]`).click();
    assert.match(await text('#archi-talk-line'), next);
  }
  await page.keyboard.press('Escape');
  await inspectProp('b2-main', 'ARCHI 메인 콘솔');
  await page.locator('#inspection-delete').click();
  assert.match(await text('#archi-talk-count'), /주장 4 \/ 4/, 'Broken claims stay broken after leaving');
  await page.locator('[data-evidence="presence"]').click();
  assert.equal(await page.evaluate(() => collectedItems.has('b2-archi-refuted')), true);
  await page.locator('#archi-talk-cards button').click();
  assert(await page.locator('#keypad').isVisible(), 'After the last claim the admin key pad opens');
  await page.keyboard.press('Escape');

  // F. 7층 로그 뒤 엘리베이터 버튼 뒤집기: 누른 버튼의 반대편 칸 층으로 간다(16 → B1, 8은 그대로). B1 열쇠 스위치로 풀린다.
  const press = floor => page.evaluate(floor => {
    cabinCarIndex = 0; selectedFloor = null; Object.assign(elevatorCars[0], { floor: 7, travelling: false });
    document.querySelector(`#cabin-floor-buttons [data-floor="${floor}"]`).click();
    return { selected: selectedFloor, status: cabinStatus.textContent };
  }, floor);
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); collectedItems.delete('b1-elevator'); collectedItems.add('goal-f7-log'); });
  const flipped = await press(16);
  assert.equal(flipped.selected, -1, 'Pressing 16 goes to B1 while the panel is flipped');
  assert.match(flipped.status, /패널 재배열/);
  assert.equal((await press(8)).selected, 8, 'The middle button stays');
  assert.equal((await press(17)).selected, null, 'The flipped 17 leads to the restricted B2');
  await page.evaluate(() => collectedItems.add('b1-elevator'));
  assert.equal((await press(16)).selected, 16, 'The B1 key switch restores the panel');
  await page.evaluate(() => { selectedFloor = null; cabinCarIndex = null; });

  // K. 엔딩 1층 로비 분전반: ARCHI가 라벨을 바꿔 붙였다. "1F 주 전원" 라벨은 조명이고, 매직 글씨대로 맨 왼쪽을 내려야 1층 전력이 끊긴다.
  assert.match(await inspectProp('f1', '로비 분전반'), /왼쪽 = 1F 주 전원/, 'Outside the ending the panel is only inspected');
  await page.evaluate(() => {
    closeInspection();
    Object.assign(b2Ending, { phase: 'running', stage: 'lobby', offline: false });
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [1]; updatePowerState(); sanity = 60;
  });
  await inspectProp('f1', '로비 분전반');
  assert(await page.locator('#manual-control').isVisible(), 'During the ending the panel opens as a selector');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !usingControl);
  assert.deepEqual(await page.evaluate(() => [floorHasPower(1), sanity]), [true, 50], 'The "1F 주 전원" label is a lie');
  await inspectProp('f1', '로비 분전반');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !usingControl);
  assert.equal(await page.evaluate(() => floorHasPower(1)), false, 'The leftmost breaker is the real 1F main power');
  await page.evaluate(() => Object.assign(b2Ending, { phase: 'idle', stage: 'b2', offline: false }));

  // D. 15층 연구본부장실 전기 잠금: 정전이면 잠기고, 15층에 전력을 넣으면 열리지만 복도 카메라가 깨어나 들키면 다시 잠긴다.
  const director = () => page.evaluate(() => { const door = currentDoors.find(entry => entry.target === 'f15-director'); return { locked: door.locked, message: door.message }; });
  await page.evaluate(() => { b2Ending.phase = 'idle'; buildingBlackout = true; solarEnabled = true; solarPoweredFloors = []; updatePowerState();
    performFloorChange('f15', 0, null); Body.setPosition(body, { x: 3050, y: floorY - 81 }); });
  assert.equal((await director()).locked, true);
  assert.match((await director()).message, /전기 잠금/, 'Without power the electric lock holds');
  await page.evaluate(() => { solarPoweredFloors = [15]; updatePowerState(); });
  assert.equal((await director()).locked, false, 'Power opens the electric lock');
  // 카메라가 문 구간(첫 구간)을 비출 때 문 앞에 서면 들켜 잠긴다.
  await page.evaluate(() => { const camera = activeCameras[0]; camera.elapsed = 0; camera.span = -1; Body.setPosition(body, { x: 3220, y: floorY - 81 }); });
  await page.waitForFunction(() => currentDoors.find(entry => entry.target === 'f15-director').locked);
  assert.match((await director()).message, /카메라가 이쪽을/, 'The awakened camera relocks the door');
  // 사각지대로 물러났다가 카메라가 왼쪽을 비출 때 들어간다.
  await page.evaluate(() => Body.setPosition(body, { x: 3050, y: floorY - 81 }));
  await page.waitForFunction(() => !currentDoors.find(entry => entry.target === 'f15-director').locked && activeCameras[0].span === 1, null, { timeout: 12000 });
  await standAt(3220);
  await interact();
  await page.waitForFunction(() => dynamicFloorId === 'f15-director' && !transitioning);
  assert.match(await inspectProp('f15-director', '보류 서류함'), /18kg/);
  await page.evaluate(() => { closeInspection(); solarPoweredFloors = []; updatePowerState(); });

  // G. 4층 로그 판독기 해시 사슬: 규칙(앞 줄 검산 + 숫자 합의 끝자리)이 어긋나는 셋째 줄을 골라야 원본이 되살아난다.
  await page.evaluate(() => { collectedItems.add('f4-tape'); collectedItems.add('f4-ups=로그 판독기'); sanity = 60; });
  await inspectProp('f4-lab', '로그 판독기');
  assert(await page.locator('#hash-panel').isVisible(), 'The reader opens the hash chain check');
  await page.locator('#hash-lines [data-line="1"]').click();
  assert.match(await text('#hash-status'), /규칙대로 맞는다/);
  assert.equal(await page.evaluate(() => sanity), 55);
  await page.locator('#hash-lines [data-line="2"]').click();
  assert.match(await text('#hash-lines [data-line="2"]'), /archi_svc/, 'The forged line is restored from the original tape');
  await page.waitForFunction(() => document.getElementById('hash-panel').hidden && usingInspection);
  assert.match(await text('#inspection-description'), /1\.2TB · 성공/);
  assert.equal(await page.evaluate(() => collectedItems.has('f4-audit')), true);
  await page.evaluate(() => closeInspection());
  // 숫자 검산: 위조된 줄만 규칙이 어긋난다.
  assert.deepEqual(await page.evaluate(() => {
    let previous = 0;
    return HASH_LINES.map(line => {
      const sum = [...line.text].filter(ch => /\d/.test(ch)).reduce((total, digit) => total + Number(digit), 0);
      const ok = (previous + sum) % 10 === line.check;
      previous = line.check;
      return ok;
    });
  }), [true, true, false, true, true, true]);

  // H. 3층 Studio 음성 인증: 2층 영사 뒤 음향 콘솔에서 사내 방송 담당(김도윤, 리플릿) 목소리를 녹음해 틀어야 열린다.
  const studioDoor = () => page.evaluate(() => {
    const door = currentDoors.find(entry => entry.target === 'f3-studio');
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 }); grounded = true; closeInspection(); interact();
    return { locked: door.locked, text: usingInspection ? inspectionDescription.textContent : status.textContent };
  });
  await page.evaluate(() => { performFloorChange('f3', 0, null); sanity = 60; });
  assert.match((await studioDoor()).text, /사내 방송 담당자/, 'Without a recording the panel only explains itself');
  assert.match(await inspectProp('f2-harmony', '음향 콘솔'), /출력 단자가 비어/, 'Before the projector runs the console is only inspected');
  await page.evaluate(() => { closeInspection(); collectedItems.add('f2-projected'); });
  await inspectProp('f2-harmony', '음향 콘솔');
  assert(await page.locator('#manual-control').isVisible(), 'With the rehearsal playing the console offers voices to record');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !usingControl && collectedItems.has('voice=정수호'));
  await page.evaluate(() => performFloorChange('f3', 0, null));
  const wrong = await studioDoor();
  assert.equal(wrong.locked, true);
  assert.match(wrong.text, /이미 제가 갖고 있어요/, 'Playing your own voice gets an answer in that voice');
  assert.equal(await page.evaluate(() => sanity), 55);
  await inspectProp('f2-harmony', '음향 콘솔');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !usingControl && collectedItems.has('voice=김도윤') && !collectedItems.has('voice=정수호'));
  await page.evaluate(() => performFloorChange('f3', 0, null));
  const right = await studioDoor();
  assert.equal(right.locked, false, "The broadcast manager's voice opens the Studio");
  assert.equal(await page.evaluate(() => collectedItems.has('f3-studio-open')), true);

  // 5층 계정 잠금(작은 퍼즐): 등급표에 맞지 않는 svc_0412를 잠그면 엘리베이터 뒤집기(퍼즐 F)가 멈춘다.
  await page.evaluate(() => { collectedItems.delete('b1-elevator'); collectedItems.add('goal-f7-log'); });
  assert.equal((await press(16)).selected, -1, 'The panel is flipped before the account is locked');
  await inspectProp('f5-security', '콘솔 노트북');
  assert(await page.locator('#keypad').isVisible());
  await page.locator('#keypad-input').fill('archi_svc');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#keypad-error'), /정상 권한 계정/);
  await page.locator('#keypad-input').fill('SVC_0412');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#inspection-description'), /엘리베이터 패널 권한이 회수/);
  await page.evaluate(() => closeInspection());
  assert.equal((await press(16)).selected, 16, 'Locking the ARCHI helper account restores the panel');

  // 6층 콜백(작은 퍼즐): 당직 전화 발신 번호 9203을 내선 규칙으로 풀면 B2 연결 실험실이고, 스피커폰으로 걸 수 있다.
  assert.match(await inspectProp('f6-meeting', '캐비닛 바인더'), /9\+층/);
  await inspectProp('f6-meeting', '스피커폰');
  await page.locator('#keypad-input').fill('9103');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#keypad-error'), /없는 내선/);
  await page.locator('#keypad-input').fill('9203');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#inspection-description'), /B2 연결 실험실입니다/);
  await page.evaluate(() => closeInspection());

  // 15층 이관 상자(작은 퍼즐): 186kg 팔레트 C에서 개별 무게가 빠진 11번을 연다.
  await inspectProp('f15-seminar', '이관 카트');
  assert.match(await text('#keypad-text'), /C\(9~12번\) 186kg/);
  await page.locator('#keypad-input').fill('7');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#keypad-error'), /GPU 서버가 들어 있다/);
  await page.locator('#keypad-input').fill('11');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#inspection-description'), /신경 신호 변환기 부품/);
  await page.evaluate(() => closeInspection());

  // 16층 키오스크(작은 퍼즐): 전력이 있으면 질문을 고른다. CU 영수증의 주문을 물어야 수호를 지켜본 기록을 털어놓는다.
  await page.evaluate(() => { solarPoweredFloors = [16]; updatePowerState(); });
  await inspectProp('f16-cafe', '음성 주문 키오스크');
  assert(await page.locator('#manual-control').isVisible(), 'A powered kiosk asks what to order');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !usingControl && usingInspection);
  assert.match(await text('#inspection-description'), /다시 말씀해/);
  await inspectProp('f16-cafe', '음성 주문 키오스크');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !usingControl && usingInspection);
  assert.match(await text('#inspection-description'), /걸음 속도까지 다 저장/);
  assert.equal(await page.evaluate(() => collectedItems.has('f16-kiosk-answered')), true);
  await page.evaluate(() => { closeInspection(); solarPoweredFloors = []; updatePowerState(); });
  assert.match(await inspectProp('f16-cafe', '음성 주문 키오스크'), /먼저 인사한다/, 'Without power it is only inspected');
  await page.evaluate(() => closeInspection());

  assert.deepEqual(errors, []);
  console.log('Puzzle tests passed.');
} finally {
  await browser.close();
}
