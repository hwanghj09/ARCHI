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
  assert.deepEqual(await slots(), [null, null, null], '처음에는 슬롯이 모두 비어 있다');

  // 목표가 갱신될 때마다 가장 오래된 칸(빈 칸이 먼저)을 덮어쓴다.
  await page.evaluate(() => { buildingBlackout = true; });
  await page.waitForFunction(() => currentObjective?.title === '정전');
  let saved = await slots();
  assert.equal(saved[0]?.title, '정전'); assert.equal(saved[0].kind, 'auto'); assert.equal(saved[1], null);
  await page.waitForTimeout(20);
  await page.evaluate(() => collectedItems.add('rooftop-unlocked'));
  await page.waitForFunction(() => currentObjective?.title === '비상 전력 켜기');
  await page.waitForTimeout(20);
  await page.evaluate(() => collectedItems.add('goal-f12-memo'));
  await page.waitForFunction(() => currentObjective?.title === '7층 조사하기');
  saved = await slots();
  assert.deepEqual(saved.map(slot => slot?.title), ['정전', '비상 전력 켜기', '7층 조사하기'], '세 칸이 차례로 채워진다');
  await page.waitForTimeout(20);
  await page.evaluate(() => collectedItems.add('goal-f7-log'));
  await page.waitForFunction(() => currentObjective?.title === '지하에서 무슨 일이?');
  assert.deepEqual((await slots()).map(slot => slot?.title), ['지하에서 무슨 일이?', '비상 전력 켜기', '7층 조사하기'], '가장 오래된 첫 칸을 덮어쓴다');

  // 메뉴의 저장 · 불러오기: 슬롯 3칸, 직접 저장과 불러오기.
  await page.evaluate(() => openGameMenu());
  await page.locator('#menu-slots-button').click();
  assert.equal(await page.locator('#menu-slot-list li').count(), 3);
  await page.locator('[data-slot-save="1"]').click();
  assert.equal((await slots())[1].kind, 'manual');
  await page.evaluate(() => { collectedItems.add('b1-elevator'); });
  await page.locator('[data-slot-load="2"]').click(); // 슬롯 3 = '7층 조사하기' 시점의 저장
  await page.waitForFunction(() => !mainMenuActive);
  assert.equal(await page.evaluate(() => collectedItems.has('goal-f7-log')), false, '불러오면 그 시점의 진행으로 돌아간다');
  await page.waitForFunction(() => currentObjective?.title === '7층 조사하기');
  await page.waitForTimeout(300);
  assert.deepEqual((await slots()).map(slot => slot?.title), ['지하에서 무슨 일이?', '지하에서 무슨 일이?', '7층 조사하기'], '불러오기 직후의 목표 표시는 슬롯을 덮어쓰지 않는다');
  assert.deepEqual(errors, []);
  console.log('save-slots: ok');
} finally {
  await browser.close();
}
