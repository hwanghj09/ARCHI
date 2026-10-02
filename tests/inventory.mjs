import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const approach = type => page.evaluate(type => {
    performFloorChange('f17', null);
    const door = doors.find(d => type === 'hydrant' ? d.container === 'hydrant' : d.type === type);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render(); updateInteraction();
  }, type);
  const ownsKey = () => page.evaluate(() => collectedItems.has('rooftop-key'));
  await page.keyboard.press('i');
  assert.match(await page.locator('#item-description').textContent(), /비어/);
  await page.keyboard.press('i');
  assert(await page.locator('#inspection').isHidden());
  await approach('stairs');
  await page.keyboard.press('e');
  assert.match(await page.locator('#inspection-description').textContent(), /잠겨.*열쇠/);
  await page.clock.runFor(900);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  await page.keyboard.press('Escape');
  await approach('hydrant');
  await page.keyboard.press('e');
  assert.equal(await ownsKey(), false, 'Opening the cabinet does not collect the key');
  assert.equal(await page.locator('#inspection-sheet').getAttribute('aria-hidden'), null);
  await page.keyboard.press('Escape');
  assert.equal(await ownsKey(), false, 'Closing without a click leaves the key');
  await page.keyboard.press('e');
  const key = page.getByRole('button', { name: '낡은 열쇠 줍기' });
  await key.hover();
  assert.match(await page.locator('#item-description').textContent(), /옥상문.*더럽다/);
  await page.screenshot({ path: '.local/hydrant-desktop.png' });
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await key.scrollIntoViewIfNeeded();
    assert(await key.isVisible());
    assert(await page.locator('#inspection').evaluate(el => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    }), 'Cabinet fits the viewport');
    await page.screenshot({ path: `.local/hydrant-${viewport.width}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator('#inspection-close').focus();
  await page.keyboard.press('Tab');
  assert(await key.evaluate(el => el === document.activeElement), 'Focus trap reaches the key');
  await page.keyboard.press('Space');
  assert.equal(await ownsKey(), true, 'Keyboard activation collects the key');
  assert.equal(await key.count(), 0);
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  assert.equal(await key.count(), 0, 'Reinspection cannot duplicate the item');
  assert.match(await page.locator('#item-description').textContent(), /이미 챙겼다/);
  await page.keyboard.press('Escape');
  await page.locator('#inventory-button').click();
  const item = page.locator('.inventory-item');
  assert.equal(await item.count(), 1);
  await item.hover();
  assert.match(await page.locator('#item-description').textContent(), /옥상문.*더럽다/);
  await page.setViewportSize({ width: 390, height: 844 });
  await item.click();
  assert.match(await page.locator('#item-description').textContent(), /옥상문.*더럽다/);
  await page.screenshot({ path: '.local/inventory-mobile.png' });
  await page.keyboard.press('Escape');
  await approach('stairs');
  await page.evaluate(() => rooftopBackground.decode());
  await page.keyboard.press('e');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 18);
  await page.keyboard.press('e');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  assert.equal(await ownsKey(), true, 'Round trip keeps the key');
  await page.evaluate(() => { usingPhone = true; });
  await page.keyboard.press('i');
  assert(await page.locator('#inspection').isHidden(), 'Inventory cannot overlap another modal');
  await page.evaluate(() => { usingPhone = false; });
  assert.equal(await page.evaluate(() => {
    usingComputer = true;
    const event = new KeyboardEvent('keydown', { code: 'KeyI', key: 'i', cancelable: true });
    window.dispatchEvent(event);
    usingComputer = false;
    return event.defaultPrevented;
  }), false, 'Inventory shortcut must not swallow typing in the computer');
  assert.deepEqual(errors, []);
  console.log('PASS: locked rooftop, explicit key pickup, no duplicates, inventory descriptions, keyboard/mobile layout, modal guards and rooftop round trip.');
} finally {
  await browser.close();
}
