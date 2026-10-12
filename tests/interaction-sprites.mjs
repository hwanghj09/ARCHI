import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.evaluate(() => triggerBuildingBlackout());
  await page.clock.runFor(100);
  await mkdir('.local', { recursive: true });
  // Decode every delivered sheet, including transient animation frames.
  const manifest = JSON.parse(await readFile('assets/interaction-sprites/manifest.json', 'utf8'));
  for (const asset of manifest.assets) {
    assert.deepEqual(await page.evaluate(async src => {
      const image = new Image(); image.src = src; await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, asset.path), asset.sheetSize);
  }
  const visit = id => page.evaluate(id => {
    closeInspection(); releaseInput();
    performFloorChange(id, 0, floorById.get(id).interior ? 'exit' : null);
    interactionTime = 0;
  }, id);
  const inspect = name => page.evaluate(name => {
    closeInspection();
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    interact(); cameraX = cameraTarget(); render();
    if (nearbyDoor !== door) throw new Error(`Wrong interaction target: ${name}`);
  }, name);
  const prop = name => page.locator(`.floor-prop[aria-label="${name}"]`);
  const checkFrame = async (name, frame) => {
    assert.equal(await prop(name).getAttribute('data-sprite-frame'), String(frame));
    assert(await prop(name).evaluate(el => {
      const img = el.querySelector('img');
      const shift = new DOMMatrix(getComputedStyle(img).transform).m41;
      return Math.abs(shift + Number(el.dataset.spriteFrame) * el.getBoundingClientRect().width) < 1;
    }), `${name}: exactly one frame is aligned`);
  };
  for (const [room, name] of [['f16-cafe', '카페 테이블'], ['f14-archive', '작업등'],
    ['f13-testbay', 'UPS'], ['f11-sales', '층 비상 대응함']]) {
    await visit(room); await checkFrame(name, 0);
    await inspect(name); await checkFrame(name, 1);
    if (room === 'f14-archive') assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false');
    await visit(room); await checkFrame(name, 1);
  }
  await visit('f16-cu'); await checkFrame('셔터 제어함', 0);
  await page.evaluate(() => {
    closeInspection();
    const exit = currentDoors.find(door => door.key === 'exit');
    Body.setPosition(body, { x: exit.x + exit.width / 2, y: floorY - 81 }); grounded = true; interact();
  });
  await page.clock.runFor(850);
  await visit('f16-cu'); await checkFrame('셔터 제어함', 1);
  await visit('f14-data'); await checkFrame('라벨링 현황판', 1);

  await visit('f13-ops');
  await page.evaluate(() => { collectedItems.delete('f13-ups'); refreshReady(); });
  await inspect('장애 알림 프린터'); await checkFrame('장애 알림 프린터', 0);
  assert.equal(await prop('장애 알림 프린터').locator('img').evaluate(img => img.getAnimations().length), 0);
  await page.evaluate(() => { collectedItems.add('f13-ups'); refreshReady(); });
  await inspect('장애 알림 프린터');
  assert((await prop('장애 알림 프린터').locator('img').getAttribute('src')).endsWith('printer-feed.png'));
  // Repeat before completion: cancel/restart must still restore the original state sheet.
  await inspect('장애 알림 프린터');
  await prop('장애 알림 프린터').locator('img').evaluate(async img => {
    const animation = img.getAnimations()[0]; animation.finish(); await animation.finished;
  });
  await page.waitForFunction(() => document.querySelector('[aria-label="장애 알림 프린터"] img').src.endsWith('incident-printer-states.png'));
  await checkFrame('장애 알림 프린터', 1);

  await visit('f11');
  await page.evaluate(() => { collectedItems.delete('f11-crank'); });
  await inspect('방화셔터');
  assert.equal(await page.locator('.barrier.shutter').getAttribute('data-open'), 'false');
  await page.evaluate(() => { collectedItems.add('f11-crank'); });
  await inspect('방화셔터');
  assert.equal(await page.locator('.barrier.shutter').getAttribute('data-open'), 'true');
  assert(await page.evaluate(() => !currentDoors.find(door => door.name === '방화셔터').solid));
  await page.locator('.barrier.shutter img').evaluate(async img => {
    const animation = img.getAnimations()[0]; animation.finish(); await animation.finished;
  });
  await page.waitForFunction(() => document.querySelector('.barrier.shutter img').src.endsWith('fire-shutter-states.png'));
  await visit('f11');
  assert.equal(await page.locator('.barrier.shutter').getAttribute('data-open'), 'true');

  await visit('f16-cafe'); await checkFrame('음성 주문 키오스크', 0);
  await page.evaluate(() => {
    setSolarPower(true);
    powerGrid.querySelector('[data-floor="16"]').click();
  });
  await checkFrame('음성 주문 키오스크', 1);
  await page.evaluate(() => {
    Body.setPosition(body, { x: 1400, y: floorY - 81 });
    cameraX = cameraTarget(); updateInteraction(); render();
  });
  await page.screenshot({ path: '.local/interaction-cafe.png' });
  await inspect('음성 주문 키오스크');
  assert.equal(await prop('음성 주문 키오스크').locator('img').evaluate(img => img.getAnimations().length), 1);
  await prop('음성 주문 키오스크').locator('img').evaluate(async img => {
    const animation = img.getAnimations()[0]; animation.finish(); await animation.finished;
  });
  await page.evaluate(() => { solarPoweredFloors = []; updatePowerState(); closeInspection(); });
  await checkFrame('음성 주문 키오스크', 0);

  await page.keyboard.press('p');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'phone');
  await page.clock.runFor(240);
  assert.equal(await page.locator('#player').getAttribute('data-frame'), '1');
  await page.clock.runFor(240);
  assert.equal(await page.locator('#player').getAttribute('data-frame'), '2');
  await page.keyboard.press('f');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'phone-light');
  await page.clock.runFor(270);
  assert.equal(await page.locator('#player').getAttribute('data-frame'), '1');
  assert.equal(await page.locator('#player img:visible').count(), 1);
  await page.keyboard.press('p');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'phone-light');
  await page.screenshot({ path: '.local/interaction-phone-light.png' });
  await page.keyboard.down('d'); await page.clock.runFor(100); await page.keyboard.up('d');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'walk');
  await page.keyboard.press('p'); await page.keyboard.press('f'); await page.keyboard.press('p');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'phone-away');
  await page.clock.runFor(210);
  assert.equal(await page.locator('#player').getAttribute('data-frame'), '1');
  await page.clock.runFor(200);
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'idle');
  await page.keyboard.press('p'); await page.keyboard.press('f');
  await page.evaluate(() => { phoneBattery = 1; phoneDrainAccumulator = 0; });
  await page.clock.runFor(1100);
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'phone');
  assert.equal(await page.locator('#world').getAttribute('data-flashlight'), 'off');
  await page.keyboard.press('p');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(400);
  await page.screenshot({ path: '.local/interaction-mobile.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: 13 sheets, state changes/re-entry, power, blocked actions, animation restart, phone frames/movement/battery and mobile.');
} finally {
  await browser.close();
}
