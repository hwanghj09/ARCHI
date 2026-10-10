import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 16층 CU 편의점: 진라면 박스를 밀어(플레이어 속도의 절반) 계산대 앞 오른쪽 끝에 세우고 그 위에 올라서야 선반의 항불안제를 챙길 수 있다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const box = () => page.evaluate(() => ({ x: movingParts[0].body.position.x, ...movingParts[0].pushable }));
  const place = (x, y = floorY - 81) => page.evaluate(([x, y]) => {
    Body.setPosition(body, { x, y }); Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render(); updateInteraction();
  }, [x, y]);

  await page.evaluate(() => performFloorChange('f16-cu', null));
  const start = await box();
  assert.equal(start.x, 415);
  assert.equal(start.maxX, 928);

  // 바닥에서는 항불안제에 손이 닿지 않는다.
  await place(904);
  assert.equal(await page.evaluate(() => nearbyDoor?.name), '항불안제');
  await page.keyboard.press('e');
  assert.match(await page.locator('#inspection-description').textContent(), /너무 높아서 손이 닿지 않는다/);
  assert.equal(await page.evaluate(() => collectedItems.has('f16-antianxiety')), false);
  await page.keyboard.press('Escape');

  // 왼쪽에서 오른쪽으로 밀면 박스가 플레이어 속도(200px/s)의 절반(100px/s)으로 밀린다.
  await place(start.x - 71 - 20 - 1);
  await page.keyboard.down('ArrowRight');
  await page.clock.runFor(500); // 먼저 박스에 닿는다
  const before = await box();
  await page.clock.runFor(1000);
  const pushed = await box();
  assert(Math.abs(pushed.x - before.x - 100) < 12, `pushed ${pushed.x - before.x}px in 1s`);
  // 계속 밀면 박스 오른쪽 끝이 계산대 왼쪽 끝에 닿는 자리(maxX)에서 멈춘다.
  await page.clock.runFor(6000);
  await page.keyboard.up('ArrowRight');
  assert.equal((await box()).x, 928);

  // 박스 위에 올라서면 손이 닿는다(박스가 끝에 있을 때만).
  await place(920, floorY - 90 - 81);
  await page.clock.runFor(200);
  assert.equal(await page.evaluate(() => nearbyDoor?.name), '항불안제');
  await page.keyboard.press('e');
  assert.equal(await page.evaluate(() => collectedItems.has('f16-antianxiety')), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.fixture.pill-item').isHidden(), true, 'The pill disappears from the shelf');

  // 오른쪽에서 왼쪽으로도 밀리고, 처음 자리보다 더 왼쪽으로는 밀리지 않는다.
  await place(928 + 71 + 20 + 1);
  await page.keyboard.down('ArrowLeft');
  await page.clock.runFor(8000);
  await page.keyboard.up('ArrowLeft');
  assert.equal((await box()).x, 415);

  await page.keyboard.press('Tab');
  assert(await page.locator('[data-item="f16-antianxiety"]').isVisible(), 'The pill is listed in the bag');

  // 가방에서 항불안제를 누르면 사용하기 버튼이 뜨고, 쓰면 정신력이 오르고 가방에서 사라진다(선반에는 다시 나타나지 않는다).
  await page.evaluate(() => { sanity = 40; });
  await page.locator('[data-item="f16-antianxiety"]').click();
  assert(await page.locator('#inspection-use').isVisible(), 'The use button appears for the pill');
  await page.locator('#inspection-use').click();
  assert.equal(await page.evaluate(() => sanity), 90, '항불안제를 쓰면 정신력이 50 오른다');
  assert.equal(await page.locator('[data-item="f16-antianxiety"]').count(), 0, 'The used pill leaves the bag');
  assert.equal(await page.evaluate(() => collectedItems.has('f16-antianxiety')), true, 'The pickup mark stays so the shelf stays empty');
  assert.deepEqual(errors, []);
  console.log('antianxiety: ok');
} finally {
  await browser.close();
}
