import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.waitForFunction(() => currentObjective?.title === '퇴근하기');
  const slots = () => page.evaluate(() => slotKeys.map(key => { const data = readProgress(key); return data && { title: data.objective, kind: data.slotKind, at: data.savedAt }; }));
  assert.deepEqual(await slots(), [null, null, null, null, null], '처음에는 슬롯이 모두 비어 있다');

  // 목표가 갱신될 때마다 가장 오래된 칸(빈 칸이 먼저)을 덮어쓴다. 칸은 5개다.
  const step = async (change, title) => {
    await page.waitForTimeout(20);
    await page.evaluate(change);
    await page.waitForFunction(title => currentObjective?.title === title, title);
  };
  await step(() => { buildingBlackout = true; }, '정전');
  let saved = await slots();
  assert.equal(saved[0]?.title, '정전'); assert.equal(saved[0].kind, 'auto'); assert.equal(saved[1], null);
  await step(() => collectedItems.add('rooftop-unlocked'), '비상 전력 켜기');
  // 12층 이후 목표는 퍼즐 플래그를 차례로 따라간다(objective.js). 한 번에 여러 개를 넣어 그 목표로 바로 간다.
  await step(() => ['f12-evaluation-solved', 'goal-f5-note', 'f8-repro-record'].forEach(item => collectedItems.add(item)), '로그 분석');
  await step(() => ['f7-external-connection-solved', 'f13-backup-device', 'f2-projected'].forEach(item => collectedItems.add(item)), '지하에서 무슨 일이?');
  await step(() => collectedItems.add('b1-elevator'), 'B2 서버실 조사하기');
  assert.deepEqual((await slots()).map(slot => slot?.title), ['정전', '비상 전력 켜기', '로그 분석', '지하에서 무슨 일이?', 'B2 서버실 조사하기'], '다섯 칸이 차례로 채워진다');
  await step(() => collectedItems.add('goal-b2-console'), 'ARCHI 멈추기');
  assert.deepEqual((await slots()).map(slot => slot?.title), ['ARCHI 멈추기', '비상 전력 켜기', '로그 분석', '지하에서 무슨 일이?', 'B2 서버실 조사하기'], '가장 오래된 첫 칸을 덮어쓴다');

  // 메뉴의 저장 · 불러오기: 슬롯 5칸, 직접 저장과 불러오기.
  await page.evaluate(() => openGameMenu());
  await page.locator('#menu-exit').click();
  await page.locator('#menu-slots-button').click();
  assert.equal(await page.locator('#menu-slot-list li').count(), 5);
  await page.locator('[data-slot-save="4"]').click();
  assert.equal((await slots())[4].kind, 'manual');
  await page.locator('[data-slot-load="2"]').click(); // 슬롯 3 = '로그 분석' 시점의 저장
  await page.waitForFunction(() => !mainMenuActive);
  assert.equal(await page.evaluate(() => collectedItems.has('f7-external-connection-solved')), false, '불러오면 그 시점의 진행으로 돌아간다');
  await page.waitForFunction(() => currentObjective?.title === '로그 분석');
  await page.waitForTimeout(300);
  assert.deepEqual((await slots()).map(slot => slot?.title), ['ARCHI 멈추기', '비상 전력 켜기', '로그 분석', '지하에서 무슨 일이?', 'ARCHI 멈추기'], '불러오기 직후의 목표 표시는 슬롯을 덮어쓰지 않는다');
  for (const kind of ['robot', 'hallucination']) {
    await page.evaluate(kind => {
      if (kind === 'robot') {
        collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [1];
        performFloorChange('f1'); catchPlayer(); updateRobot(guardPatrol, 1200);
      }
      else triggerDevoured();
    }, kind);
    const capture = page.locator(kind === 'robot' ? '#guard-capture' : '#hallucination-caught');
    await capture.waitFor({ state: 'visible' });
    const stored = await page.evaluate(() => slotKeys.map(key => localStorage.getItem(key)));
    await capture.locator('.game-over-load').click();
    assert.equal(await page.locator('[data-slot-save]:enabled').count(), 0, `${kind}: game over only allows loading`);
    await page.keyboard.press('Escape');
    await page.locator('#menu-slots-button').click();
    assert.equal(await page.locator('[data-slot-save]:enabled').count(), 0, `${kind}: returning through home preserves the save restriction`);
    assert.equal(await page.evaluate(() => writeSlot(0, 'manual')), false, `${kind}: the shared writer also rejects caught states`);
    assert.deepEqual(await page.evaluate(() => slotKeys.map(key => localStorage.getItem(key))), stored, `${kind}: saved slots remain intact`);
    await page.locator('[data-slot-load="2"]').click();
    assert(await page.evaluate(() => !playerCaught && !hallucinationCaught && !mainMenuActive), 'Loading leaves game over');
  }
  await page.evaluate(() => openGameMenu());
  await page.locator('#menu-exit').click();
  await page.locator('#menu-slots-button').click();
  await page.locator('[data-slot-save="4"]').click();
  assert.equal((await slots())[4].kind, 'manual', 'Normal saving works after loading out of game over');
  assert.deepEqual(errors, []);
  console.log('save-slots: ok');
} finally {
  await browser.close();
}
