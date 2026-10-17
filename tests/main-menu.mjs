import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  const url = new URL('../index.html', import.meta.url).href;
  await page.addInitScript(() => {
    window.keyboardLockCalls = [];
    Object.defineProperty(navigator, 'keyboard', { configurable: true, value: {
      lock: async keys => {
        keyboardLockCalls.push(keys);
        if (window.rejectKeyboardLock) throw new Error('Permission denied');
      },
      unlock: () => keyboardLockCalls.push('unlock'),
    } });
  });
  await page.goto(url);
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  assert(await page.locator('#main-menu').isVisible());
  assert(await page.locator('#opening').isHidden());
  assert(await page.locator('#sanity-hud').isHidden());
  assert(await page.locator('#menu-start').evaluate(el => el === document.activeElement));
  const frozen = () => page.evaluate(() => ({ x: body.position.x, sanity, battery: phoneBattery, openingElapsed }));
  const before = await frozen();
  await page.keyboard.down('d');
  for (const key of ['e', 'p', 'f', 'i', 'Escape']) await page.keyboard.press(key);
  await page.clock.runFor(3000); await page.keyboard.up('d');
  assert.deepEqual(await frozen(), before, 'The menu pauses gameplay and the opening');
  assert(await page.evaluate(() => mainMenuActive && stage.inert && !usingPhone && !usingInspection));
  await page.keyboard.press('Shift+Tab'); assert(await page.locator('#menu-controls-button').evaluate(el => el === document.activeElement));
  await page.keyboard.press('Tab'); assert(await page.locator('#menu-start').evaluate(el => el === document.activeElement));
  await page.screenshot({ path: '.local/main-menu-desktop.png' });
  await page.locator('#menu-settings-button').click();
  assert(await page.locator('#menu-settings').isVisible()); assert(await page.locator('#menu-home').isHidden());
  await page.keyboard.press('Tab'); assert(await page.locator('#menu-volume').evaluate(el => el === document.activeElement));
  await page.keyboard.press('Home'); assert.equal(await page.evaluate(() => gameVolume), 0);
  await page.locator('#menu-brightness').focus(); await page.keyboard.press('End');
  assert.equal(await page.locator('#menu-brightness-value').textContent(), '125%');
  assert.equal(await page.locator('#world').evaluate(el => getComputedStyle(el).filter), 'brightness(1.25)');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('archi.settings')));
  assert.deepEqual(saved, { volume: 0, brightness: 125 });
  await page.screenshot({ path: '.local/main-menu-settings.png' });
  if (await page.locator('#menu-fullscreen').isEnabled()) {
    await page.locator('#menu-fullscreen').click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    // 정지된 테스트 시계에서 fullscreenchange가 전달될 프레임을 진행한다.
    await page.clock.runFor(100);
    assert.match(await page.locator('#menu-fullscreen').textContent(), /해제/);
    assert.deepEqual(await page.evaluate(() => keyboardLockCalls), [['Escape']]);
    await page.locator('#menu-fullscreen').click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.clock.runFor(100);
    assert.deepEqual(await page.evaluate(() => keyboardLockCalls), [['Escape'], 'unlock']);
    await page.evaluate(() => { window.rejectKeyboardLock = true; });
    await page.locator('#menu-fullscreen').click();
    await page.waitForFunction(() => keyboardLockCalls.length === 3);
    assert(await page.evaluate(() => Boolean(document.fullscreenElement)), 'Denied keyboard lock keeps fullscreen available');
    await page.locator('#menu-fullscreen').click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.clock.runFor(100);
    await page.evaluate(() => { Object.defineProperty(navigator, 'keyboard', { value: undefined }); });
    await page.locator('#menu-fullscreen').click();
    await page.waitForFunction(() => Boolean(document.fullscreenElement));
    await page.clock.runFor(100);
    await page.locator('#menu-fullscreen').click();
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.clock.runFor(100);
  }
  await page.keyboard.press('Escape');
  assert(await page.locator('#menu-settings-button').evaluate(el => el === document.activeElement));
  await page.locator('#menu-controls-button').click();
  assert.equal(await page.locator('.menu-key-list > div').count(), 9);
  await page.keyboard.press('Escape');
  await page.reload(); await page.clock.runFor(100);
  assert(await page.locator('#main-menu').isVisible()); assert.deepEqual(await frozen(), before);
  await page.locator('#menu-settings-button').click();
  assert.equal(await page.locator('#menu-volume').inputValue(), '0');
  assert.equal(await page.locator('#menu-brightness').inputValue(), '125');
  await page.keyboard.press('Escape'); await page.locator('#menu-start').focus(); await page.keyboard.press('Enter');
  await page.waitForFunction(() => openingReady);
  assert(await page.locator('#main-menu').isHidden()); assert(await page.locator('#opening').isVisible());
  assert.equal(await page.locator('#world').getAttribute('data-opening'), 'work');
  await page.clock.runFor(1750); assert.equal(await page.locator('#world').getAttribute('data-opening'), 'work', '첫 대사에서 클릭을 기다린다');
  await page.locator('#opening').click({ position: { x: 300, y: 300 } }); await page.clock.runFor(100);
  assert.equal(await page.locator('#world').getAttribute('data-opening'), 'shutdown');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => !mainMenuActive && !openingActive && !stage.inert));
  const startX = (await frozen()).x;
  await page.keyboard.down('d'); await page.clock.runFor(200); await page.keyboard.up('d');
  assert((await frozen()).x > startX + 20, 'Starting the game hands off to movement');
  // The saved volume controls the shared audio output, including the elevator bell.
  await page.evaluate(() => {
    elevatorCars[0].floor = 17; showCabin(0);
    window.sharedAudio = gameAudioContext;
  });
  await page.locator('#cabin-alarm').click();
  assert(await page.evaluate(() => ![...gameAudioEffects].some(effect => effect.name === 'elevator-alarm') && gameAudioAppliedVolume === 0));
  await page.evaluate(() => { gameVolume = .5; }); await page.locator('#cabin-alarm').click();
  assert(await page.evaluate(() => gameAudioContext === window.sharedAudio && gameAudioAppliedVolume === .5 && [...gameAudioEffects].some(effect => effect.name === 'elevator-alarm')));
  // Touch, narrow and short landscape layouts stay within the menu viewport.
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport); await page.reload(); await page.clock.runFor(100);
    for (const id of ['menu-start', 'menu-settings-button', 'menu-controls-button']) {
      const rect = await page.locator(`#${id}`).boundingBox();
      assert(rect.x >= 0 && rect.x + rect.width <= viewport.width && rect.height >= 44);
    }
    await page.screenshot({ path: `.local/main-menu-${viewport.width}.png` });
    await page.locator('#menu-settings-button').tap();
    assert(await page.locator('#menu-volume').isVisible());
    await page.locator('#menu-settings .menu-back').tap();
    await page.locator('#menu-start').tap();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').tap();
    await page.locator('#opening-skip').click();
    assert(await page.evaluate(() => !openingActive && !stage.inert));
  }
  // Malformed values or blocked storage do not prevent settings or game start.
  await page.evaluate(() => localStorage.setItem('archi.settings', '{broken'));
  await page.reload(); assert.equal(await page.evaluate(() => gameVolume), .7);
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('blocked storage'); }; });
  await page.reload(); await page.locator('#menu-settings-button').click();
  await page.locator('#menu-volume').focus(); await page.keyboard.press('Home');
  assert.equal(await page.evaluate(() => gameVolume), 0);
  assert.match(await page.locator('#menu-settings-status').textContent(), /저장할 수 없습니다/);
  await page.keyboard.press('Escape'); await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  assert.deepEqual(errors, []);
  console.log('PASS: title/menu pause, input/focus lock, native settings/persistence/storage fallback, brightness, actual bell volume/mute, fullscreen, controls, opening handoff, movement and desktop/portrait/landscape touch.');
} finally { await browser.close(); }
