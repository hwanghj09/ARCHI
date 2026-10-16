import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 콘솔 창의 '모든 층 전력 활성화': 켜면 정전 중에도 모든 층에 전력이 들어오고, 끄면 원래 정전 상태로 돌아간다.
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
  await page.evaluate(() => { buildingBlackout = true; updatePowerState(); });
  const state = () => page.evaluate(() => ({
    blackout: buildingBlackout, real: realBuildingBlackout(), elevator: elevatorHasPower(),
    floors: [-2, -1, 1, 7, 12, 17].map(floor => floorHasPower(floor)),
  }));
  assert.deepEqual(await state(), { blackout: true, real: true, elevator: false, floors: [true, true, false, false, false, false] });

  await page.keyboard.press('F2');
  await page.locator('#debug-console-toggle').click();
  await page.locator('#debug-all-power').click();
  assert.equal(await page.locator('#debug-all-power').getAttribute('aria-pressed'), 'true');
  assert.deepEqual(await state(), { blackout: false, real: true, elevator: true, floors: [true, true, true, true, true, true] });
  assert.equal(await page.evaluate(() => world.dataset.powered), 'true');

  // 켜 있는 동안의 저장은 실제 정전 상태를 남긴다.
  assert.equal(await page.evaluate(() => progressSnapshot().blackout), true);

  await page.locator('#debug-all-power').click();
  assert.equal(await page.locator('#debug-all-power').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(await state(), { blackout: true, real: true, elevator: false, floors: [true, true, false, false, false, false] });
  assert.deepEqual(errors, []);
  console.log('all-power: ok');
} finally {
  await browser.close();
}
