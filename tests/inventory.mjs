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
  await page.keyboard.press('i');
  assert.equal(await page.locator('.inventory-item').count(), 1);
  assert(await page.locator('[data-item="f17-badge"]').isVisible(), 'The starting inventory contains Suho’s badge');
  // A card opened from the bag steps back to the list (close button, E, Esc); I closes the whole bag.
  const panel = () => page.evaluate(() => ({ open: usingInspection && !inspectionPanel.hidden, surface: !inspectionPanel.hidden && inspectionPanel.dataset.surface || null,
    returnTo: inspectionPanel.dataset.returnTo || null, expanded: inventoryButton.getAttribute('aria-expanded'),
    focus: document.activeElement.dataset.item || document.activeElement.id }));
  const bagCard = { open: true, surface: 'card', returnTo: 'inventory', expanded: 'true', focus: 'inspection-close' };
  const bagList = item => ({ open: true, surface: 'inventory', returnTo: null, expanded: 'true', focus: item });
  const bagClosed = { open: false, surface: null, returnTo: null, expanded: 'false', focus: 'inventory-button' };
  const badge = page.locator('[data-item="f17-badge"]');
  await badge.click();
  assert.deepEqual(await panel(), bagCard, 'Clicking a badge opens its card over the bag');
  assert.match(await page.locator('#inspection-sheet img').getAttribute('src'), /jeong-suho/);
  await page.locator('#inspection-close').click();
  assert.deepEqual(await panel(), bagList('f17-badge'), 'The close button returns to the list with focus on the item');
  assert.match(await page.locator('#item-description').textContent(), /늘 지니고 다니는 내 출입증/);
  await page.keyboard.press('Enter');
  assert.deepEqual(await panel(), bagCard, 'Enter on the focused item reopens its card');
  await page.keyboard.press('e');
  assert.deepEqual(await panel(), bagList('f17-badge'), 'E returns to the list');
  // Holding Enter on the card's close button returns to the list once instead of flipping between card and list.
  await page.keyboard.press('Enter');
  for (let i = 0; i < 4; i++) {
    await page.keyboard.down('Enter');
    assert.deepEqual(await panel(), bagList('f17-badge'), 'Auto-repeated Enter does not reopen the card');
  }
  await page.keyboard.up('Enter');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  assert.deepEqual(await panel(), bagList('f17-badge'), 'Esc on the card steps back to the list');
  await page.keyboard.press('Escape');
  assert.deepEqual(await panel(), { open: false, surface: null, returnTo: null, expanded: 'false', focus: 'stage' }, 'Esc on the list closes the bag');
  await page.keyboard.press('i');
  await badge.click();
  await page.keyboard.press('i');
  assert.deepEqual(await panel(), bagClosed, 'I on a bag card closes the whole bag');
  await page.keyboard.press('i');
  assert.deepEqual(await panel(), bagList('inspection-close'), 'I reopens the bag at the list');
  await page.keyboard.press('i');
  assert.deepEqual(await panel(), bagClosed, 'I on the plain list closes the bag');
  await page.locator('#inventory-button').click();
  assert.deepEqual(await panel(), bagList('inspection-close'), 'The bag button opens the list');
  await page.locator('#inventory-button').click();
  assert.deepEqual(await panel(), bagClosed, 'The bag button closes the plain list');
  await page.keyboard.press('i');
  await badge.click();
  await page.locator('#inventory-button').click();
  assert.equal((await panel()).open, false, 'The bag button also closes the bag from a card');
  await page.keyboard.press('i');
  await badge.click();
  await page.keyboard.press('d');
  assert.equal((await panel()).returnTo, null, 'Walking away from a bag card closes it without a return marker');
  assert(await page.locator('#inspection').isHidden());
  await approach('hydrant');
  await page.keyboard.press('e');
  assert.equal((await panel()).surface, 'hydrant');
  await page.keyboard.press('e');
  assert(await page.locator('#inspection').isHidden(), 'A later non-bag inspection closes instead of reopening the bag');
  await approach('stairs');
  await page.keyboard.press('e');
  assert.match(await page.locator('#inspection-description').textContent(), /잠겨.*열쇠/);
  await page.clock.runFor(900);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  await page.keyboard.press('Escape');
  assert(await page.locator('#inspection').isHidden(), 'Esc closes a plain inspection');
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
  await page.keyboard.press('Space');
  assert.equal(await ownsKey(), true, 'Keyboard activation collects the key');
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
  await page.keyboard.press('Enter');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 18);
  await page.keyboard.press('e');
  await page.clock.runFor(1000);
  assert.equal(await page.evaluate(() => currentSceneFloor), 17);
  assert.equal(await ownsKey(), true, 'Round trip keeps the key');
  await page.keyboard.press('e');
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
  // A card opened outside the bag (the café table) still closes directly, and I leaves it alone.
  await page.evaluate(() => {
    const table = floorById.get('f16-cafe').props.find(prop => prop.gives === 'f16-badge');
    openInspection(table.name, table.message, table);
  });
  assert.equal((await panel()).surface, 'card');
  await page.keyboard.press('i');
  assert.deepEqual(await panel(), { open: true, surface: 'card', returnTo: null, expanded: 'false', focus: 'inspection-close' }, 'I ignores a card opened outside the bag');
  await page.keyboard.press('e');
  assert(await page.locator('#inspection').isHidden(), 'A non-bag card closes with E');
  // Returning from the second badge restores focus to that badge, not the first item.
  await page.evaluate(() => { collectedItems.add('f16-badge'); refreshInventoryCount(); });
  await page.keyboard.press('i');
  await page.locator('[data-item="f16-badge"]').click();
  assert.match(await page.locator('#inspection-sheet img').getAttribute('src'), /jo-hyeon-a/);
  await page.keyboard.press('Escape');
  assert.deepEqual(await panel(), bagList('f16-badge'));
  // The key has no card art: clicking it only describes it and keeps the list open.
  await page.locator('[data-item="rooftop-key"]').click();
  assert.deepEqual(await panel(), bagList('rooftop-key'));
  assert.match(await page.locator('#item-description').textContent(), /옥상문.*더럽다/);
  await page.keyboard.press('Escape');
  assert(await page.locator('#inspection').isHidden());
  assert.deepEqual(errors, []);
  console.log('PASS: locked rooftop, explicit key pickup, no duplicates, inventory descriptions, keyboard/mobile layout, modal guards and rooftop round trip.');
} finally {
  await browser.close();
}
