import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';
import { autoControl } from './auto-control.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await autoControl(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);

  const clueCount = () => page.evaluate(() => collectedClues.length);
  const go = async id => {
    await page.evaluate(id => performFloorChange(id, null, 'exit'), id);
    await finishSceneTransition(page);
    await page.clock.runFor(100);
  };
  const place = async x => {
    await page.evaluate(x => {
      Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; updateInteraction(); cameraX = cameraTarget(); render();
    }, x);
    await page.clock.runFor(50);
  };
  // 조사 창을 닫은 뒤 E를 누른다.
  const inspect = async x => {
    await page.clock.runFor(3000);
    await closeInspection(); // 소품 동작 뒤에 늦게 뜬 조사 창이 남아 있으면 닫는다.
    await place(x);
    await page.keyboard.press('e');
    await page.clock.runFor(100);
  };
  const closeInspection = async () => {
    if (await page.locator('#inspection').isVisible()) await page.locator('#inspection-close').click();
    await page.clock.runFor(100);
  };

  // 평범한 소품: 처음 조사하면 기록되고, 다시 조사해도 쌓이지 않는다.
  await go('f11-sales');
  await inspect(1700);
  assert.equal(await clueCount(), 1);
  await page.screenshot({ path: '.local/phone-clues-recorded.png' });
  await closeInspection();
  await inspect(1700);
  assert.equal(await clueCount(), 1, 'The same clue is not recorded twice');
  await closeInspection();

  // requires: UPS를 켜기 전에는 missingMessage만 보이고 기록되지 않는다.
  await go('f13-ops');
  await inspect(1060);
  assert.equal(await clueCount(), 1, 'A clue behind a missing item is not recorded');
  await closeInspection();
  await page.evaluate(() => { collectedItems.add('f13-ups'); refreshReady(); });
  await inspect(1060);
  assert.equal(await clueCount(), 2);
  await closeInspection();

  // 어두운 방: 작업등을 켜기 전에는 읽을 수 없어 기록되지 않는다.
  await go('f14-archive');
  assert.equal(await page.locator('#world').getAttribute('data-dark'), 'true');
  await inspect(880);
  await page.clock.runFor(2000); // 조사 문구가 한 글자씩 타이핑되는 동안 기다린다.
  assert.match(await page.locator('#inspection-text').textContent(), /어두워서/);
  assert.equal(await clueCount(), 2, 'A clue in the dark is not recorded');
  await page.screenshot({ path: '.local/phone-clues-dark.png' });
  await closeInspection();
  await inspect(1440);
  await closeInspection();
  assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false');
  await inspect(880);
  assert.equal(await clueCount(), 3);
  await closeInspection();

  // gives: 사원증을 주는 소품도 기록된다.
  await go('f16-cafe');
  await inspect(950);
  assert.equal(await clueCount(), 4);
  assert(await page.evaluate(() => collectedItems.has('f16-badge')));
  await closeInspection();

  // 휴대폰 메모 → 단서 탭: 최근 단서가 위에 온다. 직접 쓰는 메모는 그대로다.
  await page.keyboard.press('p');
  await page.locator('#phone [data-phone-app="notes"]').click();
  assert(await page.locator('#phone-note').isVisible());
  await page.locator('#phone-note').fill('직접 쓴 메모');
  await page.locator('#phone-note-save').click();
  await page.locator('#phone-tab-clues').click();
  assert(await page.locator('#phone-clue-pane').isVisible());
  assert(await page.locator('#phone-note').isHidden());
  assert.equal(await page.locator('#phone-clue-count').textContent(), '4');
  const places = await page.locator('#phone-clue-list .phone-clue-place').allTextContents();
  assert.deepEqual(places, ['16F · Café · 카페 테이블', '14F · 연구 자료실 · 기록 보관함',
    '13F · 기술지원 상황실 · 장애 알림 프린터', '11F · 영업본부 사무실 · 영업 현황판']);
  await page.screenshot({ path: '.local/phone-clues-tab.png' });
  await page.locator('#phone-tab-memo').click();
  assert.equal(await page.locator('#phone-note').inputValue(), '직접 쓴 메모');
  await page.locator('#phone-close').click();

  // 자동 저장 후 이어하기에서도 남는다.
  assert(await page.evaluate(() => saveProgress()));
  await page.reload();
  await page.locator('#menu-continue').click();
  await page.clock.runFor(200);
  assert.equal(await clueCount(), 4, 'Clues survive continue');
  assert.equal(await page.locator('#phone-clue-list li').count(), 4);

  // 새 게임이면 비워진다.
  await page.evaluate(() => startNewGame());
  await page.clock.runFor(200);
  assert.equal(await clueCount(), 0, 'A new game clears clues');
  assert(await page.locator('#phone-clue-empty').evaluate(el => !el.hidden));
  assert.equal(await page.locator('#phone-clue-count').textContent(), '');

  assert.deepEqual(errors, []);
  console.log('PASS phone clues: record once, skip dark and missing, list in phone notes, save, continue and new game');
} finally {
  await browser.close();
}
