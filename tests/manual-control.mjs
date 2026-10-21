// 직접 조작하는 장치(js/interaction/manual-control.js): 레버·스위치·열쇠·선택기·버튼을 플레이어가 끝까지 조작해야 결과가 나온다.
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
  const open = (id, name, items = []) => page.evaluate(({ id, name, items }) => {
    closeInspection();
    closeControl();
    for (const item of items) collectedItems.add(item);
    if (dynamicFloorId !== id) performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null);
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    interact();
    return { control: usingControl, inspection: usingInspection, label: manualControlLabel.textContent };
  }, { id, name, items });
  const has = item => page.evaluate(item => collectedItems.has(item), item);
  const controlClosed = () => page.waitForFunction(() => !usingControl);

  // 레버: 반쯤 끌고 놓으면 제자리로 돌아가고, 끝까지 내려야 회선이 끊긴다.
  assert.deepEqual(await open('b2-power', '외부 회선 패널'),
    { control: true, inspection: false, label: '비상 차단 레버를 끝까지 내리자.' });
  const device = page.locator('#manual-control-device');
  const box = await device.locator('.control-handle').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 60, { steps: 4 });
  await page.mouse.up();
  assert.equal(await page.evaluate(() => controlStep.value), 0, 'A half-pulled lever springs back');
  assert.equal(await has('b2-transfer-cut'), false);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 200, { steps: 8 });
  await page.mouse.up();
  await controlClosed();
  assert.equal(await has('b2-transfer-cut'), true, 'Pulling the lever all the way cuts the line');
  assert.equal(await page.evaluate(() => usingInspection), true, 'The result opens after the lever');
  assert.deepEqual(await open('b2-power', '외부 회선 패널'), { control: false, inspection: true, label: '비상 차단 레버를 끝까지 내리자.' },
    'A lever already pulled is only inspected');

  // Esc는 조작을 그만두고 아무것도 바꾸지 않는다. 스위치는 방향키로도 올린다.
  assert.equal((await open('f13-testbay', 'UPS')).control, true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => usingControl || usingInspection), false);
  assert.equal(await has('f13-ups'), false, 'Leaving the switch keeps the UPS off');
  await open('f13-testbay', 'UPS');
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowUp');
  await controlClosed();
  assert.equal(await has('f13-ups'), true, 'Flipping the switch up turns the UPS on');

  // 필요한 물건이 없으면 조작 창 대신 무엇이 모자란지 보인다.
  assert.deepEqual(await open('f11', '방화셔터'), { control: false, inspection: true, label: '비상 출력 스위치를 올리자.' });
  // 여러 단계: 핸들을 꽂고(왼쪽으로) 두 바퀴 돌린다.
  assert.equal((await open('f11', '방화셔터', ['f11-crank'])).control, true);
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => manualControlLabel.textContent.includes('두 바퀴'));
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  assert.equal(await has('f11-shutter-open'), false, 'One turn is not enough');
  for (let i = 0; i < 12; i++) await page.keyboard.press('ArrowRight');
  await controlClosed();
  assert.equal(await has('f11-shutter-open'), true, 'Two full turns raise the shutter');

  // 실제 B1 제어반의 열쇠를 포인터로 돌린다.
  await open('b1-control', '승강기 제어반', ['b1-cctv-live', 'f7-external-connection-solved', 'f13-backup-device', 'f2-projected', 'b1-lights-out']);
  const dial = await device.locator('.control-dial').boundingBox();
  const cx = dial.x + dial.width / 2, cy = dial.y + dial.height / 2;
  await page.mouse.move(cx, cy - 70);
  await page.mouse.down();
  for (let a = 10; a <= 100; a += 10) await page.mouse.move(cx + 70 * Math.sin(a * Math.PI / 180), cy - 70 * Math.cos(a * Math.PI / 180));
  await page.mouse.up();
  await controlClosed();
  assert.equal(await has('b1-elevator'), true, 'The real key switch releases B2 access');
  assert.deepEqual(errors, []);
  console.log('Manual control test passed.');
} finally {
  await browser.close();
}
