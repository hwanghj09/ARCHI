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
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const approach = type => page.evaluate(type => {
    performFloorChange('f17', null);
    const door = doors.find(d => type === 'hydrant' ? d.container === 'hydrant' : d.type === type);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render(); updateInteraction();
  }, type);
  const ownsKey = () => page.evaluate(() => collectedItems.has('rooftop-key'));
  await page.evaluate(() => {
    window.soundLog = [];
    const original = playGameSound;
    playGameSound = (name, options) => { soundLog.push(name); original(name, options); };
  });
  const sounds = () => page.evaluate(() => soundLog.splice(0).filter(name => name !== 'step'));
  await page.keyboard.press('i');
  assert.equal(await page.locator('.inventory-item').count(), 1);
  assert(await page.locator('[data-item="f17-badge"]').isVisible(), 'The starting inventory contains Suho’s badge');
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
  await key.locator('img').evaluate(image => image.decode());
  assert(await key.locator('img').evaluate(image => image.naturalWidth === 256 && image.naturalHeight === 256 &&
    getComputedStyle(image).imageRendering === 'pixelated'), 'Key uses a loaded 256x256 pixel-art sprite');
  await page.locator('.hydrant-cabinet > img').evaluate(image => image.decode());
  assert(await page.locator('.hydrant-cabinet > img').evaluate(image => image.naturalWidth === 256 && image.naturalHeight === 256 &&
    getComputedStyle(image).imageRendering === 'pixelated'), 'Cabinet uses the 256x256 pixel-art sprite specification');
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
  await sounds();
  await page.keyboard.press('Space');
  assert.equal(await ownsKey(), true, 'Keyboard activation collects the key');
  assert.deepEqual(await sounds(), ['item-get'], 'Picking up the key plays the item chime');
  assert.equal(await key.count(), 0);
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  assert.equal(await key.count(), 0, 'Reinspection cannot duplicate the item');
  assert.match(await page.locator('#item-description').textContent(), /이미 챙겼다/);
  await page.keyboard.press('Escape');
  await page.locator('#inventory-button').click();
  assert.equal(await page.locator('.inventory-item').count(), 2);
  const item = page.locator('[data-item="rooftop-key"]');
  assert.equal(await item.count(), 1);
  assert.equal(await item.locator('img').getAttribute('src'), 'assets/ui/rooftop-key.png', 'Inventory reuses the same key art');
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
  const useKey = page.getByRole('button', { name: '열쇠 사용하기', exact: true });
  assert(await useKey.isVisible());
  assert.equal(await page.evaluate(() => currentSceneFloor), 17, 'Owning the key does not automatically use it');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => collectedItems.has('rooftop-unlocked')), false, 'Closing cancels key use');
  await page.keyboard.press('e');
  await page.keyboard.press('d');
  assert(await page.locator('#inspection').isHidden(), 'Walking cancels key use');
  assert.equal(await page.evaluate(() => collectedItems.has('rooftop-unlocked')), false);
  await approach('stairs');
  await page.keyboard.press('e');
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await useKey.scrollIntoViewIfNeeded();
    assert(await useKey.isVisible());
    assert(await useKey.evaluate(button => {
      const rect = button.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && rect.top >= 0 && rect.bottom <= innerHeight;
    }), 'Key use button is reachable on desktop and mobile');
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.local/rooftop-use-key.png' });
  await page.locator('#inspection-close').focus();
  await page.keyboard.press('Tab');
  assert(await useKey.evaluate(button => button === document.activeElement));
  await sounds();
  await page.keyboard.press('Enter');
  assert.deepEqual(await sounds(), ['item-use', 'door'], 'Using the key clacks the lock before the door opens');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 18);
  await page.keyboard.press('e');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  assert.equal(await ownsKey(), true, 'Round trip keeps the key');
  await sounds();
  await page.keyboard.press('e');
  assert.deepEqual(await sounds(), ['door'], 'An unlocked rooftop door needs no key sound');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 18, 'Unlocked rooftop no longer asks to use the key');
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
  console.log('PASS: locked rooftop, explicit key pickup, no duplicates, item get/use sounds, inventory descriptions, keyboard/mobile layout, modal guards and rooftop round trip.');
} finally {
  await browser.close();
}
