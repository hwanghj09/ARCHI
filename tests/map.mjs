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
  await page.locator('#map-button').waitFor({ state: 'visible' });

  // 지도 버튼을 누르면 화면 가운데에 지도 창이 뜨고, 뒤 화면은 어두워지지 않으며, 수호 표시 하나와 상호작용 물체 수만큼 청록 점이 찍힌다.
  await page.locator('#map-button').click();
  await page.locator('#map-window').waitFor({ state: 'visible' });
  const panel = await page.locator('#map-window').boundingBox();
  assert(Math.abs(panel.x + panel.width / 2 - 640) < 2 && Math.abs(panel.y + panel.height / 2 - 360) < 2, 'The map sits in the center');
  assert(panel.width <= 960, 'The map window is compact'); // HUD 크기 조정으로 1.5배(최대 960px)
  const cover = await page.evaluate(() => document.elementFromPoint(20, 400)?.closest('#map-window') ?? null);
  assert.equal(cover, null, 'The rest of the screen is not covered by the map window');
  assert.equal(await page.locator('#map-view .map-player').count(), 1);
  const expected = await page.evaluate(() => mapInteractables().length);
  assert(expected > 0);
  assert.equal(await page.locator('#map-view .map-dot').count(), expected);
  // 약도는 장면의 이미지나 소품을 복제하지 않고 출입구 이름만 표시한다.
  assert.equal(await page.locator('#map-view img, #map-view #world, #map-view .floor-prop').count(), 0);
  assert.equal(await page.locator('#map-view .map-label').count(), expected);
  assert.match(await page.locator('#map-window').innerText(), /출입구 약도/);
  // 얼굴 아이콘은 원형이다.
  assert.equal(await page.locator('#map-view .map-player').evaluate(el => getComputedStyle(el).borderRadius), '50%');

  // 게임은 멈추지 않는다: 지도가 열린 채 이동하면 수호 표시가 같은 비율로 따라 움직인다.
  assert.equal(await page.evaluate(() => usingInspection), false, 'The game keeps running while the map is open');
  const before = await page.evaluate(() => body.position.x);
  await page.keyboard.down('d');
  await page.waitForTimeout(600);
  await page.keyboard.up('d');
  assert(await page.evaluate(x => body.position.x > x + 20, before), 'Suho can move with the map open');
  const ratio = await page.evaluate(() => body.position.x / worldWidth);
  const view = await page.locator('#map-view').boundingBox();
  const player = await page.locator('#map-view .map-player').boundingBox();
  assert(Math.abs(player.x + player.width / 2 - (view.x + view.width * ratio)) < 4);

  // Esc로 지도를 닫는다.
  await page.keyboard.press('Escape');
  assert(await page.locator('#map-window').isHidden());
  assert.deepEqual(errors, []);
  console.log('map: ok');
} finally {
  await browser.close();
}
