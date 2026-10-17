import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [['desktop', 1280, 720], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    await page.locator('#opening-skip').click();
    await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
    const near = async key => page.evaluate(key => {
      const door = currentDoors.find(door => door.name === key || door.key === key || door.target === key);
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
    }, key);
    const enter = async key => {
      await near(key);
      await page.keyboard.press('e');
      await finishSceneTransition(page);
    };
    await page.evaluate(() => { collectedItems.add('f12-access'); performFloorChange('f12'); });
    await near('f12-eval');
    assert.match(await page.locator('#interaction-hint').textContent(), /모델 평가실 \(잠김\)/);
    await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => dynamicFloorId), 'f12');
    assert.match(await page.locator('#inspection-description').textContent(), /전용 카드키/);
    await page.keyboard.press('Escape');
    await enter('f12-dev');
    assert.equal(await page.evaluate(() => {
      const props = floorById.get('f12-dev').props.filter(prop => prop.file === 'filing-cabinet');
      return props.reduce((left, prop) => prop.x < left.x ? prop : left).name;
    }), '맨 왼쪽 서랍');
    await near('맨 왼쪽 서랍');
    await page.keyboard.press('e');
    const papers = page.locator('.drawer-paper');
    const top = page.locator('.drawer-paper:not(:disabled)');
    const card = page.getByRole('button', { name: '모델 평가실 카드키 줍기' });
    const touch = name === 'mobile' ? await page.context().newCDPSession(page) : null;
    assert.equal(await papers.count(), 5);
    assert(await card.isDisabled());
    await top.click();
    assert.equal(await papers.count(), 5, 'A mouse click alone does not clear paper');
    const drag = async (fraction, cancel = false) => {
      const box = await top.boundingBox();
      const distance = await page.locator('.drawer-tray').evaluate(el => el.clientWidth) * fraction;
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      if (touch) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - distance, y }] });
        await touch.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
        await page.clock.runFor(350);
      } else {
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x - distance, y, { steps: 6 });
        if (cancel) await top.dispatchEvent('pointercancel', { pointerId: 1 });
        await page.mouse.up();
      }
    };
    await drag(.1);
    assert.equal(await papers.count(), 5, 'A short drag puts the paper back');
    await drag(.5, true);
    assert.equal(await papers.count(), 5, 'A cancelled drag puts the paper back');
    await page.screenshot({ path: `.local/floor12-drawer-${name}.png` });
    await drag(.5);
    assert.equal(await papers.count(), 4);
    assert(await card.isDisabled(), 'The card stays blocked below the remaining papers');
    await page.keyboard.press('Escape');
    await page.keyboard.press('e');
    assert.equal(await papers.count(), 4, 'Closing the drawer preserves cleared paper');
    const snapshot = await page.evaluate(() => progressSnapshot());
    await page.evaluate(data => restoreProgress(data), snapshot);
    assert(await page.locator('#inspection').isHidden(), 'Loading closes the drawer');
    await near('맨 왼쪽 서랍');
    await page.keyboard.press('e');
    assert.equal(await papers.count(), 4, 'Saving and loading preserves the paper puzzle');
    for (let count = 4; count > 0; count--) await drag(.5);
    assert(await card.isEnabled());
    await card.locator('img').evaluate(img => img.decode());
    assert.equal(await page.evaluate(() => collectedItems.has('f12-eval-keycard')), false, 'Revealing is not collecting');
    await page.screenshot({ path: `.local/floor12-drawer-revealed-${name}.png` });
    if (name === 'mobile') await card.tap();
    else await card.click();
    await page.clock.runFor(350);
    assert.equal(await page.evaluate(() => ownedInventoryIds().filter(id => id === 'f12-eval-keycard').length), 1);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem(progressKey)));
    assert(saved.items.includes('f12-eval-keycard'), 'Pickup immediately saves the card');
    await page.keyboard.press('Escape');
    await page.keyboard.press('e');
    assert.equal(await papers.count(), 0);
    assert(await card.isHidden(), 'The card cannot be taken twice');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Tab');
    await page.locator('.inventory-item[data-item="f12-eval-keycard"]').click();
    assert.match(await page.locator('#inspection-description').textContent(), /모델 평가실 문을 열 수 있다/);
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await page.evaluate(data => restoreProgress(data), saved);
    await enter('exit');
    await near('f12-eval');
    assert.match(await page.locator('#interaction-hint').textContent(), /모델 평가실 들어가기/);
    await enter('f12-eval');
    assert.equal(await page.evaluate(() => dynamicFloorId), 'f12-eval');
    await enter('exit');
    await enter('f12-dev');
    // The existing team lead key remains a separate pickup.
    await near('책상 서랍'); await page.keyboard.press('e');
    assert.equal(await page.evaluate(() => collectedItems.has('f12-lead-key')), true);
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      for (const item of [...collectedItems]) if (item.startsWith('f12-drawer-paper-') || item === 'f12-eval-keycard') collectedItems.delete(item);
    });
    await near('맨 왼쪽 서랍'); await page.keyboard.press('e');
    for (let count = 5; count > 0; count--) await page.keyboard.press('Enter');
    assert.equal(await papers.count(), 0, 'Keyboard users can lift the papers');
    await page.keyboard.press('Enter');
    assert.equal(await page.evaluate(() => collectedItems.has('f12-eval-keycard')), true);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: 12F drawer mouse puzzle, mobile pickup, keyboard, partial save/load, inventory and evaluation room lock');
} finally {
  await browser.close();
}
