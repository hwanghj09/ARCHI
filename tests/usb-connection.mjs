import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { finishSceneTransition } from './scene-transition.mjs';

for (const [file, width, height, alpha] of [['phone', 512, 1024, true], ['plug', 128, 320, true], ['cord', 40, 40, true], ['desk', 1536, 1024, false]]) {
  const meta = await sharp(new URL(`../assets/ui/usb-connection/${file}.png`, import.meta.url).pathname).metadata();
  assert.deepEqual([meta.width, meta.height, meta.hasAlpha], [width, height, alpha], `${file} sprite format`);
}
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
    const center = async selector => {
      const box = await page.locator(selector).boundingBox();
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const drag = async (from, to, beforeRelease = () => {}) => {
      if (touch) {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [to] });
        await beforeRelease();
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else {
        await page.mouse.move(from.x, from.y); await page.mouse.down();
        await page.mouse.move(to.x, to.y, { steps: 8 });
        await beforeRelease();
        await page.mouse.up();
      }
    };
    await page.locator('#computer-usb-phone-art').evaluate(img => img.decode());
    await page.locator('#computer-usb-plug-art').evaluate(img => img.decode());
    const phoneVisible = async () => {
      const phone = await page.locator('#computer-usb-phone').boundingBox();
      const board = await page.locator('#computer-usb-board').boundingBox();
      assert(phone.x >= board.x && phone.y >= board.y && phone.x + phone.width <= board.x + board.width + 1 && phone.y + phone.height <= board.y + board.height + 1, 'The entire phone stays on the tabletop');
    };
    await phoneVisible();
    await page.screenshot({ path: `.local/usb-table-${width}.png` });
    await drag(await center('#computer-usb-phone'), { x: -100, y: -100 });
    await phoneVisible();
    assert.equal(await page.evaluate(() => computerUsbConnected), false, 'Moving the phone to the edge does not connect');
    await page.locator('#computer-usb-close').click();
    await page.locator('#computer-usb-open').click();
    // Move the phone onto the stationary connector, preserving the pointer grab offset.
    let from = await center('#computer-usb-phone');
    let geometry = await page.evaluate(() => computerUsbGeometry);
    await drag(from, { x: from.x + geometry.plug.x - geometry.port.x, y: from.y + geometry.plug.y - geometry.port.y }, async () => {
      await phoneVisible();
      assert.equal(await page.evaluate(() => computerUsbConnected), false, 'Insertion happens on release');
      assert.equal(await page.locator('#computer-usb-board').getAttribute('data-aligned'), 'true');
    });
    assert.equal(await page.evaluate(() => computerUsbConnected), true, 'The phone can be dragged onto the cable');
    await page.evaluate(() => { computerUsbConnected = false; refreshSolarDownload(); });
    await page.locator('#computer-usb-open').click();
    const board = await page.locator('#computer-usb-board').boundingBox();
    await drag(await center('#computer-usb-plug'), { x: board.x + 30, y: board.y + 30 });
    assert.equal(await page.evaluate(() => computerUsbConnected), false, 'A wrong drop keeps the cable loose');
    assert(await page.locator('#computer-solar-transfer').isDisabled());
    from = await center('#computer-usb-plug');
    geometry = await page.evaluate(() => computerUsbGeometry);
    const cord = await page.locator('#computer-usb-cable').getAttribute('style');
    await drag(from, { x: from.x + geometry.port.x - geometry.plug.x, y: from.y + geometry.port.y - geometry.plug.y }, async () => {
      assert.notEqual(await page.locator('#computer-usb-cable').getAttribute('style'), cord, 'The sprite cable follows the connector');
      assert.equal(await page.evaluate(() => computerUsbConnected), false);
      await phoneVisible();
      await page.screenshot({ path: `.local/usb-physical-${width}.png` });
    });
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
  console.log('PASS: tabletop sprites, mouse/touch dragging of phone and connector, full phone containment, wrong drops, transfer gate, power/battery/dock guards, Escape, keyboard, restore cleanup and four viewport sizes.');
} finally { await browser.close(); }
