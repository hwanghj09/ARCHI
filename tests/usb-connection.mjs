import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  for (const [width, height, touch] of [[1280, 720, false], [390, 844, true], [844, 390, true], [568, 320, false]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    await page.locator('#opening-skip').click();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    await page.evaluate(() => { collectedItems.add('solar-app-downloaded'); refreshSolarDownload(); });
    await page.locator('[data-computer-app="transfer"]').click();
    assert(await page.locator('#computer-solar-transfer').isDisabled());
    await page.locator('#computer-solar-transfer').dispatchEvent('click');
    assert.equal(await page.evaluate(() => computerSolarTask), null, 'No transfer before physical connection');
    assert.equal(await page.locator('#computer #computer-usb-board').count(), 0, 'The cable is outside the computer desktop');
    await page.locator('#computer-usb-open').click();
    assert(await page.locator('#computer').isHidden());
    assert(await page.locator('#computer-usb-panel').isVisible());
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), true);
    assert(await page.locator('.usb-desk').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await page.locator('#computer-usb-port').click();
    assert.equal(await page.evaluate(() => computerUsbConnected), false, 'The port alone does not connect');
    await page.locator('#computer-usb-plug').scrollIntoViewIfNeeded();
    const center = async selector => {
      const box = await page.locator(selector).boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    let from = await center('#computer-usb-plug');
    const board = await page.locator('#computer-usb-board').boundingBox();
    await page.mouse.move(from.x, from.y); await page.mouse.down();
    await page.mouse.move(board.x + 15, board.y + 25, { steps: 4 }); await page.mouse.up();
    assert.equal(await page.evaluate(() => computerUsbConnected), false, 'A wrong drop returns the loose cable');
    assert(await page.locator('#computer-solar-transfer').isDisabled());
    await page.locator('#computer-usb-plug').scrollIntoViewIfNeeded();
    from = await center('#computer-usb-plug');
    const to = await center('#computer-usb-port');
    assert(from.x >= 0 && to.x >= 0 && from.y > 0 && to.y > 0 && from.y < height && to.y < height);
    const path = await page.locator('#computer-usb-cable').getAttribute('d');
    if (touch) {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from.x, y: from.y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: to.x, y: to.y }] });
      assert.notEqual(await page.locator('#computer-usb-cable').getAttribute('d'), path, 'The cable follows a real touch drag');
      assert.equal(await page.evaluate(() => computerUsbConnected), false);
      await page.screenshot({ path: `.local/usb-physical-${width}.png` });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(from.x, from.y); await page.mouse.down();
      await page.mouse.move(to.x, to.y, { steps: 8 });
      assert.notEqual(await page.locator('#computer-usb-cable').getAttribute('d'), path, 'The cable follows the mouse');
      assert.equal(await page.evaluate(() => computerUsbConnected), false);
      await page.screenshot({ path: `.local/usb-physical-${width}.png` });
      await page.mouse.up();
    }
    assert.equal(await page.evaluate(() => computerUsbConnected), true);
    assert(await page.locator('#computer-usb-panel').isHidden(), 'Successful insertion returns to the desktop');
    assert(await page.locator('#computer').isVisible());
    assert.equal(await page.locator('#computer').evaluate(el => el.inert), false);
    assert(await page.locator('#computer-solar-transfer').isEnabled());
    await page.locator('#computer-solar-transfer').click();
    await page.clock.runFor(4000);
    assert.equal(await page.locator('#computer-solar-transfer-progress').evaluate(el => el.value), 50);
    await page.evaluate(() => { buildingBlackout = true; updatePowerState(); });
    await page.clock.runFor(5000);
    assert.equal(await page.evaluate(() => computerUsbConnected), false);
    assert.equal(await page.evaluate(() => computerSolarTask), null);
    assert.equal(await page.evaluate(() => collectedItems.has('solar-app-installed')), false, 'Power loss aborts the connected transfer');
    await page.evaluate(() => { buildingBlackout = false; updatePowerState(); });
    await page.locator('#computer-usb-open').click();
    await page.keyboard.press('Escape');
    assert(await page.locator('#computer-usb-panel').isHidden());
    assert(await page.locator('#computer-window').isVisible(), 'Escape closes only the physical view');
    assert.equal(await page.evaluate(() => computerUsbConnected), false);
    if (!touch) {
      await page.locator('#computer-usb-open').click();
      await page.locator('#computer-usb-plug').focus(); await page.keyboard.press('Space');
      await page.locator('#computer-usb-port').focus(); await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => computerUsbConnected), true, 'Keyboard selection also inserts the cable');
      await page.evaluate(() => { phoneDock = { floor: 17, x: 0 }; startSolarFileTask('transfer'); });
      assert.equal(await page.evaluate(() => computerSolarTask), null, 'Task guard checks a newly docked phone even before repaint');
      await page.evaluate(() => { phoneDock = null; phoneBattery = 0; refreshSolarDownload(); });
      assert.equal(await page.evaluate(() => computerUsbConnected), false);
      await page.evaluate(() => { phoneBattery = 100; refreshSolarDownload(); });
      await page.locator('#computer-usb-open').click();
      const snapshot = await page.evaluate(() => progressSnapshot());
      await page.evaluate(data => restoreProgress(data), snapshot);
      assert(await page.locator('#computer-usb-panel').isHidden(), 'Restore clears the modal and transient cable state');
      assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
      assert.equal(await page.evaluate(() => computerUsbConnected), false);
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: separate physical view, mouse/touch insertion, wrong drops, transfer gate, 8-second transfer timing, power/battery/dock guards, Escape, keyboard, restore cleanup and four viewport sizes.');
} finally { await browser.close(); }
