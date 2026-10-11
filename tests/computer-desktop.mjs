import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  for (const [width, height, touch] of [[1280, 720, false], [390, 844, true], [844, 390, true]]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: touch });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click(); await page.locator('#opening-skip').click();
    await page.clock.pauseAt(new Date(Date.now() + 1000));
    await page.keyboard.press('e'); await finishSceneTransition(page);
    const state = app => page.locator(`.computer-app-window[data-app="${app}"]`);
    const task = app => page.locator(`[data-computer-task-app="${app}"]`);
    const launch = async app => { await page.locator('#computer-start-button').click(); await page.locator(`[data-start-app="${app}"]`).click(); };
    const initial = await page.evaluate(() => ({ x: body.position.x, battery: phoneBattery, sanity }));
    if (!touch) {
      await page.locator('.computer-shortcuts [data-computer-app="files"]').click();
      assert(await state('files').isHidden(), 'One click selects a desktop shortcut');
      await page.locator('.computer-shortcuts [data-computer-app="files"]').dblclick();
    } else await page.locator('.computer-shortcuts [data-computer-app="files"]').tap();
    assert(await state('files').isVisible());
    await launch('notes');
    assert(await state('files').isVisible(), 'Opening another app preserves the first window');
    assert(await state('notes').isVisible());
    await page.locator('#computer-note').fill('창을 옮겨도 남는 메모');
    await page.keyboard.press('Control+s');
    assert.equal(await page.locator('#computer-save-status').textContent(), '저장됨');
    await state('notes').locator('[data-window-minimize]').click();
    assert(await state('notes').isHidden());
    assert.equal(await task('notes').getAttribute('data-running'), 'true');
    await task('notes').click();
    assert(await state('notes').isVisible());
    assert.equal(await page.locator('#computer-note').inputValue(), '창을 옮겨도 남는 메모');
    if (!touch) {
      const rect = await state('notes').boundingBox();
      const bar = await state('notes').locator('.computer-titlebar').boundingBox();
      await page.mouse.move(bar.x + 90, bar.y + 22); await page.mouse.down();
      await page.mouse.move(bar.x + 170, bar.y + 62, { steps: 4 }); await page.mouse.up();
      const moved = await state('notes').boundingBox();
      assert(Math.abs(moved.x - rect.x - 80) < 2 && Math.abs(moved.y - rect.y - 40) < 2, 'Titlebar dragging moves the window');
      const corner = await state('notes').locator('.computer-resize-se').boundingBox();
      await page.mouse.move(corner.x + 6, corner.y + 6); await page.mouse.down();
      await page.mouse.move(corner.x + 76, corner.y + 36, { steps: 4 }); await page.mouse.up();
      const resized = await state('notes').boundingBox();
      assert(resized.width > moved.width && resized.height > moved.height, 'Corner drag resizes the window');
      await state('notes').locator('.computer-titlebar').dblclick({ position: { x: 80, y: 22 } });
      assert.equal(await state('notes').getAttribute('data-maximized'), 'true');
      await state('notes').locator('[data-window-maximize]').click();
      const restored = await state('notes').boundingBox();
      assert(Math.abs(restored.width - resized.width) < 2 && Math.abs(restored.x - resized.x) < 2, 'Restore keeps the normal position and size');
      await page.keyboard.press('Alt+Tab');
      assert.equal(await state('notes').getAttribute('data-active'), 'false', 'Alt+Tab switches running apps');
      await task('notes').click();
    }
    await page.locator('#computer-show-desktop').click();
    assert(await state('files').isHidden() && await state('notes').isHidden());
    if (!touch) {
      await page.mouse.click(width - 40, 40, { button: 'right' });
      assert(await page.locator('#computer-context-menu').isVisible());
      await page.locator('#computer-context-refresh').click();
      assert(await page.locator('#computer-context-menu').isHidden());
    }
    await page.locator('#computer-show-desktop').click();
    assert(await state('files').isVisible() && await state('notes').isVisible());
    await page.locator('#computer-start-button').click();
    await page.screenshot({ path: `.local/windows-start-${width}.png` });
    await page.locator('#computer-start-search').fill('계산기');
    assert.equal(await page.locator('#computer-start-apps button:visible').count(), 1);
    await page.keyboard.press('Enter');
    assert(await state('calculator').isVisible());
    await page.locator('#computer-start-button').click();
    await page.locator('#computer-start-search').fill('없는검색123');
    assert(await page.locator('#computer-start-empty').isVisible());
    await page.keyboard.press('Escape');
    assert(await page.locator('#computer-start-menu').isHidden());
    assert(await state('calculator').isVisible(), 'Escape dismisses Start without closing the app');
    await state('calculator').locator('[data-window-close]').click();
    assert.equal(await task('calculator').getAttribute('data-running'), 'false');
    await launch('files');
    await page.locator('[data-computer-document="weekly-report"]').dblclick();
    assert(await state('document').isVisible());
    assert(await state('files').isVisible(), 'A document opens beside Explorer');
    await page.screenshot({ path: `.local/windows-desktop-${width}.png` });
    await page.locator('#computer-start-button').click();
    assert.match(await page.locator('#computer-start-documents').textContent(), /ARCHI 주간 진행 현황/, 'Start shows the document that was actually opened');
    await page.keyboard.press('Escape');
    if (touch) {
      const window = await state('document').boundingBox();
      assert(window.x >= 0 && window.y >= 0 && window.x + window.width <= width + 1 && window.y + window.height <= height - 55, 'Mobile windows fit above the taskbar');
    }
    await page.evaluate(() => { collectedItems.add('solar-app-downloaded'); refreshSolarDownload(); });
    await launch('transfer');
    await page.locator('#computer-usb-open').click();
    await page.locator('#computer-usb-plug').click(); await page.locator('#computer-usb-port').click();
    await page.locator('#computer-solar-transfer').click();
    await state('transfer').locator('[data-window-minimize]').click();
    await launch('notes');
    await page.clock.runFor(8000);
    assert.equal(await page.evaluate(() => collectedItems.has('solar-app-installed')), true, 'A minimized transfer finishes while another app is open');
    assert.deepEqual(await page.evaluate(() => ({ x: body.position.x, battery: phoneBattery, sanity })), initial, 'Desktop input stays isolated from the player and paused survival timers');
    await page.evaluate(data => restoreProgress(data), await page.evaluate(() => progressSnapshot()));
    assert.equal(await page.evaluate(() => [...computerWindows.values()].some(state => state.open)), false, 'Restore clears transient desktop windows');
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: Windows desktop selection/double-click, touch launch, simultaneous apps, Ctrl+S, minimize/taskbar restore, drag/resize/maximize, Alt+Tab, Show Desktop, Start search, document windows, restore cleanup and three screen sizes.');
} finally { await browser.close(); }
