import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);
  const source = `data:image/png;base64,${(await readFile('assets/ui/phone-device.png')).toString('base64')}`;
  const image = await page.evaluate(async source => {
    const img = new Image(); img.src = source; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    return { width: img.width, height: img.height, corner: ctx.getImageData(0, 0, 1, 1).data[3],
      screen: ctx.getImageData(img.width / 2, img.height / 2, 1, 1).data[3] };
  }, source);
  assert.equal(image.width, 887); assert.equal(image.height, 1774);
  assert.equal(image.corner, 0); assert(image.screen >= 250, 'Opaque screen with transparent outer margins');
  const state = () => page.evaluate(() => ({ held: sprite.dataset.phoneHeld, state: sprite.dataset.state,
    light: phoneLightOn, open: usingPhone, inert: stage.inert, x: body.position.x }));
  await page.keyboard.press('p');
  // 휴대폰을 켜도 게임은 멈추지 않는다(d661332): 뒤 화면을 막지 않고 이동은 그대로 된다.
  assert((await state()).open && !(await state()).inert);
  assert.equal(await page.locator('#phone-stow').count(), 0);
  assert(!/들고 이동|휴대폰 넣기/.test(await page.locator('#phone').textContent()));
  const before = (await state()).x;
  await page.keyboard.down('d'); await page.clock.runFor(300); await page.keyboard.up('d');
  assert((await state()).x > before, 'The player keeps moving with the phone open');
  assert((await state()).open);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.phoneApp), 'notes');
  await page.keyboard.press('Shift+Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'phone-light');
  await page.locator('#phone-close').focus();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'phone-light', 'Tab stays inside the phone');
  await page.locator('#phone-close').focus();
  await page.keyboard.press('Enter');
  assert.equal((await state()).state, 'phone-away');
  await page.clock.runFor(400);
  assert.equal((await state()).state, 'idle'); assert.equal((await state()).held, 'false');
  assert.equal((await state()).inert, false);
  // 휴대폰·가방 밖을 누르면 닫힌다.
  await page.keyboard.press('p');
  assert((await state()).open);
  await page.mouse.click(100, 300);
  assert.equal((await state()).open, false, 'Clicking outside the phone closes it');
  await page.evaluate(() => toggleInventory());
  assert(await page.evaluate(() => inventoryShown()));
  await page.mouse.click(100, 300);
  assert.equal(await page.evaluate(() => usingInspection), false, 'Clicking outside the bag closes it');
  await page.clock.runFor(400);

  for (const [name, width, height] of [['desktop', 1280, 720], ['mobile', 390, 844], ['landscape', 568, 320]]) {
    await page.setViewportSize({ width, height });
    await page.keyboard.press('p');
    await page.locator('.phone-hardware').evaluate(img => img.decode());
    for (const id of ['phone', 'phone-light', 'phone-close']) {
      const rect = await page.locator(`#${id}`).boundingBox();
      assert(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= width + 1 && rect.y + rect.height <= height + 1,
        `${name}/${id}: ${JSON.stringify(rect)}`);
      if (id !== 'phone') assert(rect.height >= 44, 'Touch targets are at least 44px high');
    }
    await page.screenshot({ path: `.local/phone-ui-${name}-off.png` });
    await page.locator('#phone-light').tap();
    assert.equal((await state()).light, true);
    assert.equal(await page.locator('#phone-light').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#phone-light-state').textContent(), '켜짐');
    await page.screenshot({ path: `.local/phone-ui-${name}-on.png` });
    await page.locator('#phone-close').tap();
    assert.equal((await state()).held, 'true'); assert.equal((await state()).state, 'phone-light');
    await page.keyboard.press('f'); await page.clock.runFor(400);
    assert.equal((await state()).held, 'false'); assert.equal((await state()).state, 'idle');
  }
  await page.keyboard.press('p'); await page.keyboard.press('Space');
  assert.equal((await state()).light, true, 'Space activates the focused flashlight button');
  await page.evaluate(() => { phoneBattery = 1; phoneDrainAccumulator = 0; refreshPhone(); });
  await page.clock.runFor(1100);
  assert.equal((await state()).light, false); assert.equal((await state()).state, 'phone');
  assert.equal(await page.locator('#phone-battery').textContent(), '0%');
  assert(await page.locator('#phone-light').isDisabled());
  await page.keyboard.press('Escape'); await page.clock.runFor(400);
  assert.equal((await state()).held, 'false'); assert.equal((await state()).inert, false);
  await page.keyboard.press('p');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'phone-close', 'Empty battery still leaves a keyboard exit');
  await page.keyboard.press('Enter'); assert.equal((await state()).open, false);
  await page.evaluate(() => {
    // 로봇은 태양광 조명이 아니라 17층 UPS 회선(f17-emergency-linked)으로 움직인다(floorHasPower).
    triggerBuildingBlackout(); collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [1]; performFloorChange('f1');
    Object.assign(guardPatrol, { x: 3000, facing: 1, mode: 'patrol', wait: 0, lostTime: 0, captureTime: 0 });
    Body.setPosition(body, { x: 3210, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; phoneBattery = 100; refreshPhone();
  });
  await page.keyboard.press('p');
  await page.clock.runFor(2000);
  assert(await page.evaluate(() => playerCaught && !usingPhone), 'Robot keeps chasing and closes the phone when capturing the player');
  assert(await page.locator('#guard-capture').isVisible());
  assert.equal(await page.evaluate(() => document.activeElement.id), 'guard-retry');
  await page.locator('#guard-retry').click();
  assert(await page.evaluate(() => !playerCaught && !stage.inert && phonePanel.hidden), 'Retry restores gameplay input after capture during phone use');
  assert.deepEqual(errors, []);
  console.log('PASS: generated transparent device, native controls, modal input/focus, flashlight-only carrying, automatic stow, battery exhaustion, desktop/portrait/landscape and touch.');
} finally { await browser.close(); }
