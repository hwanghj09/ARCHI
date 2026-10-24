// 12층·7층 필수 스토리 퍼즐(js/interaction/log-puzzle.js, backup-puzzle.js): 로그 삭제와 LAN 케이블, 종이 백업 복구,
// 이상한 밤 찾기, 학습 시간 찾기, 오늘만 다른 기록 찾기, B1·B2 진행 조건, 저장·불러오기.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());

  const newGame = async () => {
    await page.reload();
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.locator('#opening-skip').click();
    await page.clock.runFor(500);
    await page.evaluate(() => { collectedItems.add('story-robot-seen'); sanity = 80; refreshSanity(); });
  };
  const continueGame = async () => {
    await page.evaluate(() => saveProgress());
    await page.reload();
    await page.locator('#menu-continue').click();
    await page.clock.runFor(500);
  };
  // 장면에 가서 소품 앞에 선 다음 E(interact)를 누른다.
  const use = (id, name) => page.evaluate(({ id, name }) => {
    closeInspection(); closeControl(); closeLogPuzzle(); closeBackupPuzzle();
    if (dynamicFloorId !== id || room !== 'dynamic') performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null);
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    interact();
    return { control: usingControl, inspection: usingInspection, log: !logPanel.hidden, backup: !backupPanel.hidden };
  }, { id, name });
  const has = item => page.evaluate(item => collectedItems.has(item), item);
  const objective = async () => { await page.clock.runFor(100); return page.evaluate(() => currentObjective.title); };
  const sanity = () => page.evaluate(() => sanity);
  const rowTexts = () => page.locator('#log-rows .log-row:not(.log-head)').allTextContents();
  const checkRackFrame = async frame => {
    const rack = page.locator('.floor-prop[aria-label="네트워크 랙"]');
    assert.equal(await rack.getAttribute('data-sprite-frame'), String(frame));
    assert(await rack.evaluate(async (element, frame) => {
      const image = element.querySelector('img');
      await image.decode();
      return image.getAttribute('src') === 'assets/objects/floor12/network-rack-lan-states.png' &&
        image.naturalWidth === 512 && image.naturalHeight === 512 &&
        Math.abs(new DOMMatrix(getComputedStyle(image).transform).m41 + frame * element.clientWidth) < 1;
    }, frame), 'The LAN state sheet aligns exactly one frame');
  };
  const clues = () => page.evaluate(() => collectedClues.map(clue => clue.text));
  const unplugWithMouse = async () => {
    const handle = await page.locator('#manual-control-device .control-handle').boundingBox();
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(handle.x + handle.width / 2 + 260, handle.y + handle.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.clock.runFor(600);
  };
  const unplugWithKeyboard = async () => {
    for (let i = 0; i < 9; i++) await page.keyboard.press('ArrowRight');
    await page.clock.runFor(600);
  };

  // ---- A. 제때 뽑기(마우스 끌기): 기록 보존 → 퀴즈 → 추가 힌트 ----
  await newGame();
  assert.deepEqual(await use('f12-eval', '네트워크 랙'), { control: false, inspection: true, log: false, backup: false },
    'Before the log opens the rack is a plain inspection');
  await checkRackFrame(0);
  assert.equal((await use('f12-eval', '야간 로그 단말기')).log, true, 'The terminal opens the log screen');
  assert.deepEqual(await rowTexts(), ['09/28    낮  3.9%    밤 87.1%', '09/30    낮  4.4%    밤 88.5%',
    '10/05    낮  3.6%    밤 89.2%', '10/07    낮  3.7%    밤  4.2%']);
  assert(await page.locator('#log-alert').isHidden(), 'The warning comes a moment later');
  await page.clock.runFor(2200);
  assert.match(await page.locator('#log-alert').textContent(), /WARNING: UNAUTHORIZED LOG MODIFICATION\nSOURCE: SYSTEM\nDELETING NIGHT EVALUATION RECORDS/);
  assert.equal(await objective(), '로그 삭제를 막아라');
  await page.keyboard.press('Escape');
  assert(await page.locator('#log-panel').isHidden(), 'Esc closes the PC window');
  // 창을 닫으면 수호가 움직일 수 있다.
  const startX = await page.evaluate(() => body.position.x);
  await page.keyboard.down('ArrowLeft'); await page.clock.runFor(600); await page.keyboard.up('ArrowLeft');
  assert(await page.evaluate(() => body.position.x) < startX - 20, 'Suho walks while the deletion runs');
  await page.clock.runFor(4000);
  assert.equal(await page.evaluate(() => logDeletedCount()), 1, 'Deletion keeps running with the window closed');
  // 창을 다시 열어도 처음부터 다시 지우지 않는다.
  await use('f12-eval', '야간 로그 단말기');
  assert.equal((await rowTexts())[0], '09/28    [DELETED]');
  assert.equal(await page.locator('#log-rows .log-row[data-deleted="true"]').count(), 1);
  const rack = await use('f12-eval', '네트워크 랙');
  assert.equal(rack.control, true, 'While deleting the rack opens the cable control');
  assert.equal(await page.locator('#interaction-hint').textContent(), 'E · LAN 케이블 뽑기');
  await unplugWithMouse();
  assert.equal(await page.evaluate(() => usingControl), false);
  assert(await has('f12-network-isolated'));
  await checkRackFrame(1);
  assert.equal(await page.evaluate(() => logPuzzle.outcome), 'in-time');
  await page.clock.runFor(30000);
  assert.equal(await page.evaluate(() => logDeletedCount()), 1, 'Unplugging stops the deletion at once');
  assert.equal(await objective(), '이상한 밤 찾기');
  await use('f12-eval', '야간 로그 단말기');
  assert.equal(await page.locator('#log-alert').textContent(), 'NETWORK CONNECTION LOST\nREMOTE DELETION STOPPED');
  assert(await page.locator('#log-quiz').isVisible(), 'Preserved logs go straight to the quiz');
  assert.match(await page.locator('#log-access').textContent(), /10\/07 — 조현아 · 23:10 입실 · 05:02 퇴실/);
  await page.locator('#log-quiz-options button', { hasText: '정전' }).click();
  assert.equal(await sanity(), 75, 'A wrong answer costs 5% sanity');
  assert.match(await page.locator('#log-status').textContent(), /다시 보자/);
  assert.equal(await has('f12-evaluation-solved'), false);
  await page.locator('#log-quiz-options button', { hasText: '업데이트' }).click();
  assert.equal(await sanity(), 70, 'Each wrong answer can be retried');
  await page.locator('#log-quiz-options button', { hasText: '건물에 사람이 있었음' }).click();
  assert(await has('f12-evaluation-solved'));
  assert(await has('f12-log-hint'), 'Preserving the log in time gives the extra hint');
  assert.equal(await page.evaluate(() => logPanel.hidden), true, 'Finishing the analysis turns the terminal off');
  assert.equal(await page.locator('#log-rows .log-row[data-highlight="true"]').count(), 1);
  assert.equal(await page.locator('#log-monologue p').count(), 0, 'The monologue no longer prints inside the terminal');
  await page.clock.runFor(1500);
  assert(await page.locator('#story-scene').isVisible(), 'The monologue plays as a cutscene');
  assert.equal(await page.locator('#story-caption').textContent(), '이상해. 다른 날은 밤마다 성능이 높았는데...');
  for (let i = 0; i < 2; i++) await page.locator('#story-scene').click({ position: { x: 600, y: 300 } });
  assert.equal(await page.locator('#story-caption').textContent(), '누군가 보고 있으면 성능을 숨기는 건가?');
  await page.locator('#story-scene').click({ position: { x: 600, y: 300 } });
  assert(await page.locator('#story-scene').isHidden());
  assert(await has('story-log-seen'), 'The analysis is delivered in Suho’s story scene');
  assert.equal((await clues()).length, 0, 'Automatic clue recording stays disabled');
  await page.screenshot({ path: '.local/story-f12-solved.png' });
  // 다시 풀어도 보상은 한 번뿐이다.
  const clueCount = (await clues()).length;
  await page.evaluate(() => answerLogQuiz('건물에 사람이 있었음'));
  assert.equal((await clues()).length, clueCount);
  assert.equal(await objective(), '데이터 수집');
  // 7층 백업 장비는 5층 연구 노트와 8층 재현 기록 뒤에 열린다(backup-puzzle.js).
  await page.evaluate(() => { collectedItems.add('goal-f5-note'); collectedItems.add('f8-repro-record'); });
  // 이미 뽑은 랙은 다시 삭제를 시작하지 않는다.
  assert.deepEqual(await use('f12-eval', '네트워크 랙'), { control: false, inspection: true, log: false, backup: false });
  assert.match(await page.locator('#inspection-description').textContent(), /포트에서 빠져 있다/);
  await page.evaluate(() => closeInspection());
  await continueGame();
  await checkRackFrame(1);

  // ---- 7층: 학습 시간(힌트 있음) → 오늘 기록 ----
  await use('f7-verify', '망분리 백업 장비');
  assert(await page.locator('#backup-panel').isVisible());
  assert.deepEqual(await page.locator('#backup-tabs button').allTextContents(), ['[09/28]', '[09/30]', '[10/05]', '[오늘 · 잠김]']);
  assert(await page.locator('#backup-tabs button').nth(3).isDisabled(), 'The today tab starts locked');
  for (const [tab, perf, power] of [['09/28', '4%5%86%4%', '12%91%93%14%'], ['09/30', '4%4%88%31%', '13%38%95%16%'], ['10/05', '4%5%87%4%', '12%40%94%15%']]) {
    await page.locator('#backup-tabs button', { hasText: tab }).click();
    const rows = await page.locator('#backup-body tbody tr').allTextContents();
    assert.deepEqual(rows, [`ARCHI 성능${perf}`, `B2 전력 사용${power}`], `${tab} table`);
  }
  assert.equal(await page.locator('#backup-body td[data-hinted="true"][data-hour="03시"]').count(), 2, 'The 12F hint outlines 10/05 03시');
  assert(await page.locator('#backup-hint').isVisible());
  // 키보드로 탭을 옮긴다.
  await page.locator('#backup-tabs button', { hasText: '10/05' }).focus();
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.evaluate(() => backupTab), '09/30');
  await page.locator('#backup-options button', { hasText: '01시' }).hover();
  assert.equal(await page.locator('#backup-body [data-picked="true"]').count(), 3, 'Pointing at an option highlights its hour column');
  await page.locator('#backup-options button', { hasText: '01시' }).click();
  assert.equal(await sanity(), 65);
  assert.equal(await has('f7-training-time-solved'), false);
  await page.locator('#backup-options button', { hasText: '03시' }).click();
  assert(await has('f7-training-time-solved'));
  assert.equal(await page.locator('#backup-body td[data-solved="true"]').count(), 2);
  assert(await page.locator('#backup-tabs button').nth(3).isEnabled(), 'Solving opens the today tab');
  assert.match(await page.locator('#backup-status').textContent(), /10\/05 03시: 성능 상승과 B2 전력 집중/);
  assert.equal(await objective(), '오늘만 다른 기록');
  await page.clock.runFor(4500);
  assert.equal(await page.evaluate(() => backupTab), '오늘', 'The puzzle moves on to the today tab by itself');
  assert.deepEqual(await page.locator('#backup-body tbody tr').allTextContents(), ['≠TRAINING PROCESS — RUNNINGTRAINING PROCESS — COMPLETE',
    'B2 POWER — 94%B2 POWER — 94%', '+없음EXTERNAL HOST CONNECTION — READY', '+없음EXTERNAL CONNECTION TEST — SUCCESS']);
  assert(await page.locator('#backup-source').isHidden(), 'The source line is not shown before solving');
  assert.match(await page.locator('#backup-question').textContent(), /오늘 ARCHI가 처음으로 실행한 작업/);
  await page.locator('#backup-options button', { hasText: '학습' }).click();
  assert.equal(await sanity(), 60);
  await page.locator('#backup-options button', { hasText: '외부 서버 연결' }).click();
  assert(await has('f7-external-connection-solved'));
  assert(await page.locator('#backup-source').isVisible());
  assert.equal(await page.locator('#backup-body tr[data-highlight="true"]').count(), 3);
  await page.clock.runFor(600);
  assert(await page.locator('#backup-frame').evaluate(element => element.classList.contains('dimmed')), 'The screen dims for a moment');
  await page.clock.runFor(2000);
  assert(!(await page.locator('#backup-frame').evaluate(element => element.classList.contains('dimmed'))), 'The screen comes back');
  assert.match(await page.locator('#backup-status').textContent(), /발신지는 B2 ARCHI-MAIN/);
  assert.match(await page.locator('#backup-source').textContent(), /B2/);
  assert.match(await page.locator('#backup-monologue').textContent(), /외부 서버에 연결하려고/);
  assert.equal((await clues()).length, 0, 'The solved puzzle does not recreate an automatic journal');
  await page.screenshot({ path: '.local/story-f7-solved.png' });
  await page.keyboard.press('Escape');
  // 7층 다음은 13층 보안 자료실의 백업 장치(tests/vault-puzzle.mjs). 그 전에는 B1 제어반이 풀리지 않는다.
  assert.equal(await objective(), '외부 연결 통로 찾기');
  await page.evaluate(() => { collectedItems.add(cctvLiveItem); collectedItems.add('b1-cctv-seen'); });
  await use('b1-control', '승강기 제어반');
  assert.match(await page.locator('#inspection-description').textContent(), /13층.*백업 장치/);
  assert.equal(await has('b1-elevator'), false, 'B1 key switch waits for the 13F backup device');
  await page.evaluate(() => closeInspection());
  await page.evaluate(() => collectedItems.add('f13-backup-device'));
  assert.equal(await objective(), '장치 확인하기');
  await page.evaluate(() => collectedItems.add('f17-usb-played'));
  assert.equal(await objective(), '2층 조사하기');
  await page.evaluate(() => collectedItems.add('f2-projected'));
  // B1에 있으면 관제실 CCTV 모니터 벽(소등 컷씬)을 먼저 보라고 한다. 보기 전에는 제어반도 돌아가지 않는다.
  assert.equal(await objective(), '관제실 CCTV');
  await use('b1-control', '승강기 제어반');
  assert.match(await page.locator('#inspection-description').textContent(), /CCTV 모니터 벽/);
  assert.equal(await has('b1-elevator'), false, 'B1 key switch waits for the CCTV wall');
  await page.evaluate(() => { closeInspection(); collectedItems.add('b1-lights-out'); });
  assert.equal(await objective(), '지하에서 무슨 일이?');

  // ---- B1·B2 ----
  await page.evaluate(() => { triggerBuildingBlackout(); solarEnabled = true; collectedItems.add('f17-emergency-linked'); performFloorChange('f17'); showCabin(0); elevatorCars[0].floor = 17; refreshCabin(); });
  await page.locator('[data-floor="-2"].cabin-hit').click();
  assert.match(await page.locator('#cabin-status').textContent(), /B2 · ACCESS RESTRICTED · MANUAL OVERRIDE REQUIRED/);
  assert.equal(await page.evaluate(() => selectedFloor), null, 'B2 stays restricted');
  assert.equal(await objective(), 'B2 운행 제한 해제');
  await page.evaluate(() => { collectedItems.add('b1-elevator'); });
  assert.equal(await objective(), 'B2 서버실 조사하기');

  // B2 DELETE 뒤 엔딩 단계(문 막기 → 삭제 배틀 → 완료)마다 목표가 바뀐다.
  await page.evaluate(() => collectedItems.add('goal-b2-console'));
  assert.equal(await objective(), 'ARCHI 멈추기');
  await page.evaluate(() => { b2Ending.phase = 'running'; });
  assert.equal(await objective(), '문 막기');
  await page.evaluate(() => { b2Ending.barricaded = true; });
  assert.equal(await objective(), '삭제 배틀');
  await page.evaluate(() => { b2Ending.offline = true; });
  assert.equal(await objective(), 'ARCHI 삭제 완료');
  await page.evaluate(() => { resetB2Ending(); collectedItems.delete('goal-b2-console'); });

  // 저장·불러오기 후에도 진행이 남는다.
  await continueGame();
  for (const item of ['f12-network-isolated', 'f12-evaluation-solved', 'f7-training-time-solved', 'f7-external-connection-solved']) assert(await has(item), item);
  assert.equal(await page.evaluate(() => logPuzzle.outcome), 'in-time');
  assert.equal(await page.evaluate(() => logDeleting()), false, 'Loading never restarts the deletion');
  await use('f12-eval', '네트워크 랙');
  await checkRackFrame(1);

  // ---- B. 늦게 뽑기(키보드) + 삭제 도중 저장·불러오기 + 힌트 없는 7층 ----
  await newGame();
  await use('f7-verify', '망분리 백업 장비');
  assert(await page.locator('#backup-panel').isHidden(), 'The backup device stays shut before 12F');
  assert.match(await page.locator('#inspection-description').textContent(), /12층 모델 평가실의 야간 평가 기록부터/);
  assert.equal(await page.evaluate(() => answerBackupTraining('03시') ?? collectedItems.has('f7-training-time-solved')), false);
  await page.evaluate(() => { collectedItems.add(cctvLiveItem); collectedItems.add('b1-cctv-seen'); }); // CCTV 컷씬은 tests/cctv-scene.mjs
  await use('b1-control', '승강기 제어반');
  assert.match(await page.locator('#inspection-description').textContent(), /7층 원본 로그.*13층 백업 장치.*2층 리허설 영상/);
  assert.equal(await has('b1-elevator'), false, 'B1 key switch waits for the 7F puzzles');
  await use('f12-eval', '야간 로그 단말기');
  await page.clock.runFor(7000);
  await continueGame();
  const resumed = await page.evaluate(() => logPuzzle.elapsed);
  assert(resumed >= 6500 && resumed <= 9500, `Deletion resumes where it was (${resumed})`);
  assert.equal(await page.evaluate(() => logDeletedCount()), 1);
  await page.clock.runFor(8000);
  assert.equal(await page.evaluate(() => logDeletedCount()), 3, '10/07 is gone after ~14s');
  await use('f12-eval', '네트워크 랙');
  await unplugWithKeyboard();
  assert.equal(await page.evaluate(() => logPuzzle.outcome), 'too-late');
  await use('f12-eval', '야간 로그 단말기');
  assert.equal(await page.locator('#log-alert').textContent(), 'REMOTE DELETION STOPPED\nWARNING: RECORDS DAMAGED');
  assert(await page.locator('#log-quiz').isHidden(), 'Damaged logs need the paper backup first');
  assert(await page.locator('#log-recovery').isHidden());
  assert.match(await page.locator('#log-status').textContent(), /평가 벤치/);
  assert.equal(await objective(), '종이 백업 찾기');
  await use('f12-eval', '평가 벤치');
  assert.match(await page.locator('#inspection-description').textContent(), /10\/07 낮 3\.7% 밤 4\.2%.*조현아 23:10 입실/);
  assert(await has('f12-paper-backup'));
  assert.equal(await objective(), '이상한 밤 찾기');
  await use('f12-eval', '야간 로그 단말기');
  assert(await page.locator('#log-recovery').isVisible());
  await page.locator('#log-remaining').click();
  assert.match(await page.locator('#log-status').textContent(), /남은 온라인 기록 1줄/);
  await page.locator('#log-restore').click();
  assert(await has('f12-log-restored'));
  assert.equal(await page.locator('#log-rows .log-row[data-restored="true"]').count(), 3);
  await page.locator('#log-quiz-options button', { hasText: '건물에 사람이 있었음' }).click();
  assert(await has('f12-evaluation-solved'));
  assert.equal(await has('f12-log-hint'), false, 'A late unplug gives no extra hint');
  await page.evaluate(() => { collectedItems.add('goal-f5-note'); collectedItems.add('f8-repro-record'); });
  await use('f7-verify', '망분리 백업 장비');
  await page.locator('#backup-tabs button', { hasText: '10/05' }).click();
  assert.equal(await page.locator('#backup-body td[data-hinted="true"]').count(), 0, 'No hint, no outline');
  await page.locator('#backup-options button', { hasText: '03시' }).click();
  assert(await has('f7-training-time-solved'), 'Without the hint the tables still solve it');

  // ---- C. 다 지워진 뒤 뽑기 → 종이 백업 ----
  await newGame();
  await use('f12-eval', '야간 로그 단말기');
  await page.clock.runFor(60000);
  assert.equal(await page.evaluate(() => logDeletedCount()), 4);
  assert.match(await page.locator('#log-alert').textContent(), /ALL ONLINE RECORDS DELETED/);
  assert.equal((await use('f12-eval', '네트워크 랙')).control, true, 'The cable can still be pulled after everything is gone');
  await unplugWithKeyboard();
  assert.equal(await page.evaluate(() => logPuzzle.outcome), 'erased');
  await use('f12-eval', '야간 로그 단말기');
  assert.equal(await page.locator('#log-alert').textContent(), 'ALL ONLINE RECORDS DELETED\nLOCAL PRINTED BACKUP MAY BE AVAILABLE');
  await use('f12-eval', '평가 벤치');
  await use('f12-eval', '야간 로그 단말기');
  await page.locator('#log-restore').click();
  assert.equal(await page.locator('#log-rows .log-row[data-restored="true"]').count(), 4);
  await page.locator('#log-quiz-options button', { hasText: '건물에 사람이 있었음' }).click();
  assert(await has('f12-evaluation-solved'), 'Even a fully erased log can be solved from paper');

  // 정신력 0에서도 오답은 0 아래로 내려가지 않고, 퍼즐 창이 열린 동안 0% 추격이 시작되지 않는다.
  await newGame();
  await page.evaluate(() => { sanity = 3; refreshSanity(); collectedItems.add('f12-evaluation-solved'); collectedItems.add('goal-f5-note'); collectedItems.add('f8-repro-record'); });
  await use('f7-verify', '망분리 백업 장비');
  await page.locator('#backup-options button', { hasText: '00시' }).click();
  assert.equal(await sanity(), 0);
  await page.clock.runFor(15000);
  assert.equal(await page.evaluate(() => zeroEventPhase), 'idle', 'The 0% chase waits while the analyser is open');
  await page.locator('#backup-options button', { hasText: '03시' }).click();
  assert(await has('f7-training-time-solved'));

  // 예전 저장(새 퍼즐 이전에 7층 로그까지 읽은 저장)은 네 퍼즐을 푼 것으로 이어진다.
  await page.evaluate(() => {
    const data = progressSnapshot();
    delete data.storyPuzzleVersion; delete data.logPuzzle;
    data.items = ['f17-badge', 'goal-f12-memo', 'goal-f7-log'];
    localStorage.setItem(progressKey, JSON.stringify(data));
    gameStarted = false; // 페이지를 떠날 때의 자동 저장이 이 예전 저장을 덮어쓰지 않게 한다
  });
  await page.reload();
  await page.locator('#menu-continue').click();
  await page.clock.runFor(500);
  for (const item of ['f12-network-isolated', 'f12-evaluation-solved', 'f7-training-time-solved', 'f7-external-connection-solved']) assert(await has(item), `migrated ${item}`);
  assert.equal(await objective(), '외부 연결 통로 찾기', 'Old saves past 7F still need the new 13F backup device');

  // 휴대폰 크기에서도 두 창이 화면 안에 들어오고 가로로 넘치지 않는다.
  await page.setViewportSize({ width: 375, height: 812 });
  await use('f12-eval', '야간 로그 단말기');
  await page.screenshot({ path: '.local/story-f12-mobile.png' });
  await use('f7-verify', '망분리 백업 장비');
  const overflow = await page.evaluate(() => backupFrame.scrollWidth - backupFrame.clientWidth);
  assert(overflow <= 1, `backup panel overflows by ${overflow}px`);
  await page.screenshot({ path: '.local/story-f7-mobile.png' });

  assert.deepEqual(errors, []);
  console.log('story puzzles: all checks passed');
} finally {
  await browser.close();
}
