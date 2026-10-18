import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const acquired = async id => {
    await page.clock.runFor(200);
    assert.equal(await page.locator('#inspection').getAttribute('data-acquired-item'), id);
    assert.match(await page.locator('#inspection-title').textContent(), /획득$/);
    assert.equal(await page.locator('.inspection-label').textContent(), '획득');
    assert.match(await page.locator('#inspection-description').textContent(), /획득 · 가방에 넣었다/);
    if (id === 'f17-manager-memo') {
      assert(await page.locator('.writing-memo').isVisible());
      assert.match(await page.locator('.writing-memo').evaluate(memo => getComputedStyle(memo).backgroundImage), /manager-memo\.png/);
    } else {
      assert(await page.locator('#inspection-sheet img').isVisible(), `${id} shows its image`);
      await page.locator('#inspection-sheet img').evaluate(image => image.decode());
      assert(await page.locator('#inspection-sheet img').evaluate(image => image.naturalWidth > 0));
      const sprite = { 'f2-remote': 'projector-remote-v2', 'f12-lead-key': 'lead-key', 'f12-eval-keycard': 'eval-keycard', 'f13-backup-device': 'backup-device' }[id];
      if (sprite) {
        assert.equal(await page.locator('#inspection-sheet img').getAttribute('src'), `assets/objects/items/${sprite}.png`);
        assert.equal(await page.locator('#inspection-sheet img').evaluate(image => getComputedStyle(image).imageRendering), 'pixelated');
      }
    }
    assert(await page.locator('#inspection-use').isHidden(), 'Acquisition never automatically uses an item');
    assert.equal(await page.evaluate(id => ownedInventoryIds().filter(item => item === id).length, id), 1);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'inspection-close', `${id} focuses the close button`);
  };
  const approach = (floor, id) => page.evaluate(([floor, id]) => {
    closeInspection();
    sanity = 100;
    performFloorChange(floor, null, 'exit');
    const door = currentDoors.find(door => door.gives === id);
    let y = floorY - 81;
    if (id === 'f16-antianxiety') {
      Body.setPosition(movingParts[0].body, { x: 880, y: movingParts[0].body.position.y });
      y -= 117;
    }
    Body.setPosition(body, { x: door.x + door.width / 2, y });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
  }, [floor, id]);

  for (const [floor, id] of [
    ['f2-server', 'f2-reel'], ['f2-lounge', 'f2-remote'],
    ['f16-cu', 'f16-antianxiety'], ['f16-cafe', 'f16-badge'], ['f12-dev', 'f12-lead-key'],
    ['f13-secure', 'f13-backup-device'], ['b2-power', 'b2-antianxiety'],
  ]) {
    await approach(floor, id);
    await page.keyboard.press('e');
    await acquired(id);
    for (const [width, height] of [[1280, 720], [390, 844], [844, 390]]) {
      await page.setViewportSize({ width, height });
      assert(await page.locator('#inspection').evaluate(panel => {
        const bounds = panel.getBoundingClientRect();
        return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight;
      }), `${id} fits ${width}×${height}`);
      await page.locator('#inspection-close').click();
      assert(await page.locator('#inspection').isHidden(), 'One click dismisses the acquisition');
      await page.evaluate(id => showItemAcquired(id), id);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.clock.runFor(200);
    await page.screenshot({ path: `.local/item-acquisition-${id}.png` });
    await page.keyboard.press('Escape');
    await page.keyboard.press('e');
    assert.equal(await page.locator('#inspection').getAttribute('data-acquired-item'), null, 'Reinspection does not replay acquisition');
    assert.equal(await page.evaluate(id => ownedInventoryIds().filter(item => item === id).length, id), 1);
  }

  await page.evaluate(() => { closeInspection(); performFloorChange('f17', null); openHydrant(); });
  await page.clock.runFor(250);
  await page.getByRole('button', { name: '낡은 열쇠 줍기' }).click();
  await acquired('rooftop-key');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    for (let index = 0; index < 5; index++) collectedItems.add(`f12-drawer-paper-${index}`);
    openDrawerPuzzle();
  });
  await page.getByRole('button', { name: '모델 평가실 카드키 줍기' }).tap();
  await acquired('f12-eval-keycard');
  await page.keyboard.press('Escape');
  await page.evaluate(() => {
    for (let index = 0; index < 3; index++) collectedItems.add(`f17-cart-tool-${index}`);
    openCleaningCart();
  });
  await page.getByRole('button', { name: '관리실 비상 출입 메모 줍기' }).click();
  await acquired('f17-manager-memo');
  assert((await page.locator('#inspection-description').textContent()).includes(await page.evaluate(() => MANAGER_MEMO_TEXT)), 'The acquired memo keeps its puzzle clue');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  assert.equal(await page.locator('#inspection').getAttribute('data-acquired-item'), null, 'Opening the bag resets acquisition styling');
  assert.deepEqual(errors, []);
  console.log('PASS: all 10 collectible items show image/name/acquisition, keep clues, avoid duplicates, and fit desktop/mobile.');
} finally {
  await browser.close();
}
