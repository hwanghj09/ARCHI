import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  const fits = async selector => {
    const r = await page.locator(selector).boundingBox();
    const { width, height } = page.viewportSize();
    assert(r && r.x >= -1 && r.y >= -1 && r.x + r.width <= width + 1 && r.y + r.height <= height + 1,
      `${width}×${height} ${selector}: ${JSON.stringify(r)}`);
    return r;
  };
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [320, 568]]) {
    await page.setViewportSize({ width, height });
    await fits('#menu-start');
    await page.locator('#menu-settings-button').click();
    await page.locator('#menu-fullscreen').scrollIntoViewIfNeeded();
    await fits('#menu-fullscreen');
    await page.keyboard.press('Escape');
  }
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.clock.runFor(3000);
  await page.evaluate(() => {
    Object.keys(INVENTORY_ITEMS).forEach(id => collectedItems.add(id));
    refreshInventoryCount();
    applyKeyBindings({ ...keyBindings, light: ['KeyL'] });
    refreshKeyBindingUI();
  });
  assert.equal(await page.locator('#flash-button').getAttribute('data-key'), 'L', 'HUD hints follow remapped keys');
  assert.equal(await page.locator('.hud-count').textContent(), String(await page.evaluate(() => ownedInventoryIds().length)));
  for (const [width, height] of [[1440, 900], [1280, 720], [390, 844], [844, 390], [568, 320], [320, 568]]) {
    await page.setViewportSize({ width, height });
    const status = await fits('#sanity-hud');
    const controls = [];
    for (const id of ['map-button', 'pause-button', 'inventory-button', 'flash-button', 'phone-button']) {
      const r = await fits(`#${id}`);
      assert(r.width >= 44 && r.height >= 44, `${id} has a usable touch target`);
      controls.push(r);
    }
    const overlap = (a, b) => Math.min(a.x + a.width, b.x + b.width) > Math.max(a.x, b.x) + 1 &&
      Math.min(a.y + a.height, b.y + b.height) > Math.max(a.y, b.y) + 1;
    for (const [i, r] of controls.entries()) {
      assert(!overlap(r, status), 'Controls do not cover survival status');
      for (const other of controls.slice(i + 1)) assert(!overlap(r, other), 'HUD controls do not overlap');
    }
    await page.locator('#pause-button').tap();
    assert(await page.locator('#menu-pause').isVisible(), 'Touch users can pause without Escape');
    const before = await page.evaluate(() => ({ x: body.position.x, battery: phoneBattery, sanity }));
    await page.clock.runFor(1000);
    assert.deepEqual(await page.evaluate(() => ({ x: body.position.x, battery: phoneBattery, sanity })), before);
    await fits('#menu-pause-settings-button');
    await page.locator('#menu-pause-settings-button').tap();
    assert(await page.locator('#menu-settings').isVisible());
    await page.locator('#menu-settings .menu-back').tap();
    assert(await page.locator('#menu-pause').isVisible(), 'Touch settings return to the paused game menu');
    await page.locator('#menu-resume').tap();
    await page.locator('#inventory-button').tap();
    await fits('#inspection'); await fits('#inspection-close');
    const items = page.locator('.inventory-grid .inventory-item');
    assert.equal(await items.count(), await page.evaluate(() => ownedInventoryIds().length));
    await items.last().scrollIntoViewIfNeeded();
    await fits('.inventory-grid .inventory-item:last-child');
    await page.locator('#inspection-close').click();
    await page.locator('#phone-button').tap();
    await fits('#phone');
    for (const id of ['phone-light', 'phone-close']) {
      const r = await fits(`#${id}`);
      assert(r.height >= 44, 'Phone actions remain touch accessible');
    }
    await page.locator('#phone-light').tap();
    await page.clock.runFor(await page.evaluate(() => phoneLightDelayMs) + 20);
    assert(await page.evaluate(() => phoneLightOn));
    await page.locator('#phone-light').tap();
    assert.equal(await page.evaluate(() => phoneLightOn), false);
    await page.locator('#phone-close').tap();
    await page.evaluate(() => { openInspection('조사 기록', '아직 건물 안에 누군가 남아 있다.\n'.repeat(30)); finishInspectionText(); });
    await fits('#inspection'); await fits('#inspection-close');
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: six viewport layouts, touch targets, non-overlapping HUD, remapped key hints, touch pause, full inventory scrolling, phone light and long inspections.');
} finally { await browser.close(); }
