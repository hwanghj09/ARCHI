import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { finishSceneTransition } from './scene-transition.mjs';

// 1층 안내 데스크를 조사하면 휴대폰 USB 연결 화면이 열리고, 꽂으면 창이 닫히며 전력 앱이 설치된다.
for (const [file, width, height, alpha] of [['phone', 512, 1024, true], ['plug', 128, 320, true], ['cord', 40, 40, true], ['desk', 1536, 1024, false]]) {
  const meta = await sharp(fileURLToPath(new URL(`../assets/ui/usb-connection/${file}.png`, import.meta.url))).metadata(); // pathname은 Windows에서 /C:/... 가 된다
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
    await page.evaluate(() => performFloorChange('f1', 0));
    await finishSceneTransition(page);
    const openDesk = () => page.evaluate(() => {
      closeInspection();
      const desk = currentDoors.find(entry => entry.name === '안내 데스크');
      Body.setPosition(body, { x: desk.x + desk.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction(); interact();
    });
    const installed = () => page.evaluate(() => collectedItems.has('solar-app-installed'));
    const uninstall = () => page.evaluate(() => { collectedItems.delete('solar-app-installed'); closeInspection(); });
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
    const phoneVisible = async () => {
      const phone = await page.locator('#computer-usb-phone').boundingBox();
      const board = await page.locator('#computer-usb-board').boundingBox();
      assert(phone.x >= board.x && phone.y >= board.y && phone.x + phone.width <= board.x + board.width + 1 && phone.y + phone.height <= board.y + board.height + 1, 'The entire phone stays on the tabletop');
    };
    const expectInstalled = async message => {
      assert(await page.locator('#computer-usb-panel').isHidden(), 'Successful insertion closes the USB view');
      assert.equal(await installed(), true, message);
      assert.equal(await page.locator('#inspection-title').textContent(), '안내 데스크', 'The desk notice follows the install');
      assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
      await uninstall();
    };

    await openDesk();
    assert(await page.locator('#computer-usb-panel').isVisible(), 'Inspecting the lobby desk opens the USB view');
    assert.equal(await installed(), false, 'Nothing installs before the cable is in');
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), true);
    assert(await page.locator('.usb-desk').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await page.locator('#computer-usb-port').click();
    assert.equal(await page.evaluate(() => computerUsbConnected), false, 'The port alone does not connect');
    await page.locator('#computer-usb-phone-art').evaluate(img => img.decode());
    await page.locator('#computer-usb-plug-art').evaluate(img => img.decode());
    await phoneVisible();
    await page.screenshot({ path: `.local/usb-table-${width}.png` });
    await drag(await center('#computer-usb-phone'), { x: -100, y: -100 });
    await phoneVisible();
    assert.equal(await installed(), false, 'Moving the phone to the edge does not connect');
    await page.locator('#computer-usb-close').click();
    assert.equal(await installed(), false, 'Going back installs nothing');

    // 휴대폰을 가만히 있는 단자 위로 옮긴다(잡은 위치 차이를 유지).
    await openDesk();
    let from = await center('#computer-usb-phone');
    let geometry = await page.evaluate(() => computerUsbGeometry);
    await drag(from, { x: from.x + geometry.plug.x - geometry.port.x, y: from.y + geometry.plug.y - geometry.port.y }, async () => {
      await phoneVisible();
      assert.equal(await installed(), false, 'Insertion happens on release');
      assert.equal(await page.locator('#computer-usb-board').getAttribute('data-aligned'), 'true');
    });
    await expectInstalled('The phone can be dragged onto the cable');

    await openDesk();
    const board = await page.locator('#computer-usb-board').boundingBox();
    await drag(await center('#computer-usb-plug'), { x: board.x + 30, y: board.y + 30 });
    assert.equal(await installed(), false, 'A wrong drop keeps the cable loose');
    await drag(await center('#computer-usb-plug'), await center('#computer-usb-phone'));
    geometry = await page.evaluate(() => computerUsbGeometry);
    const phoneBox = await page.locator('#computer-usb-phone').boundingBox(), plugBox = await page.locator('#computer-usb-plug-art').boundingBox();
    assert(geometry.plug.y >= geometry.port.y - 1 || plugBox.x + plugBox.width <= phoneBox.x + 1 || plugBox.x >= phoneBox.x + phoneBox.width - 1, 'The connector cannot rest over the phone, so its cable never crosses it');
    assert.equal(await installed(), false);
    await page.locator('#computer-usb-close').click();

    await openDesk();
    from = await center('#computer-usb-plug');
    geometry = await page.evaluate(() => computerUsbGeometry);
    const cord = await page.locator('#computer-usb-cable').getAttribute('style');
    await drag(from, { x: from.x + geometry.port.x - geometry.plug.x, y: from.y + geometry.port.y - geometry.plug.y }, async () => {
      assert.notEqual(await page.locator('#computer-usb-cable').getAttribute('style'), cord, 'The sprite cable follows the connector');
      assert.equal(await installed(), false);
      await phoneVisible();
      await page.screenshot({ path: `.local/usb-physical-${width}.png` });
    });
    await expectInstalled('Plugging the connector into the port installs the app');

    await openDesk();
    await page.keyboard.press('Escape');
    assert(await page.locator('#computer-usb-panel').isHidden(), 'Escape closes the USB view');
    assert.equal(await installed(), false);
    if (!touch) {
      await openDesk();
      await page.locator('#computer-usb-plug').focus(); await page.keyboard.press('Space');
      await page.locator('#computer-usb-port').focus(); await page.keyboard.press('Enter');
      await expectInstalled('Keyboard selection also inserts the cable');
    }

    // 휴대폰을 충전함에 맡겼으면 연결 화면 대신 안내만 나온다.
    await page.evaluate(() => { phoneDock = { floor: 17, x: 0 }; });
    await openDesk();
    assert(await page.locator('#computer-usb-panel').isHidden(), 'No USB view without the phone');
    assert.match(await page.locator('#inspection-description').textContent(), /휴대폰이 없으면/);
    assert.equal(await installed(), false);
    await page.evaluate(() => { phoneDock = null; closeInspection(); });

    await openDesk();
    const snapshot = await page.evaluate(() => progressSnapshot());
    await page.evaluate(data => restoreProgress(data), snapshot);
    assert(await page.locator('#computer-usb-panel').isHidden(), 'Restore clears the modal and transient cable state');
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
    assert.equal(await installed(), false);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: lobby desk USB view, mouse/touch dragging of phone and connector, phone blocks the connector, wrong drops, install on insertion, Escape, keyboard, docked phone, restore cleanup and four viewport sizes.');
} finally { await browser.close(); }
