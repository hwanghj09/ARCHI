import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => { if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(request.url()); });
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);

  const pc = page.locator('#computer');
  const phone = page.locator('#phone');
  const pcApp = name => pc.locator(`.computer-taskbar [data-computer-task-app="${name}"]`);
  const phoneApp = name => phone.locator(`[data-phone-app="${name}"]`);
  const pcCalc = pc.locator('[data-device-calculator]');
  const phoneCalc = phone.locator('[data-device-calculator]');
  const pcGuide = pc.locator('[data-building-guide]');
  const key = (calculator, value) => calculator.locator(`[data-calculator-key="${value}"]`);
  const display = calculator => calculator.locator('[data-calculator-display]').textContent();
  const closePhone = async () => {
    await phone.locator('#phone-close').click();
    assert(await phone.isHidden());
  };
  const boundsFit = async locator => {
    const box = await locator.boundingBox();
    const viewport = page.viewportSize();
    assert(box && box.width > 0 && box.height > 0);
    assert(box.x >= -1 && box.y >= -1 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1,
      `${await locator.getAttribute('id') || 'Control'} fits ${viewport.width}×${viewport.height}: ${JSON.stringify(box)}`);
  };
  const place = async x => {
    await page.evaluate(x => {
      Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; updateInteraction(); cameraX = cameraTarget(); render();
    }, x);
    await page.clock.runFor(50);
  };

  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await pc.isVisible());
  assert.equal(await pc.locator('.computer-shortcuts button').count(), 6);
  await pcApp('mail').click();
  assert.equal(await pc.locator('[data-computer-mail]').count(), 5);
  assert.equal(await pc.locator('#computer-mail-count').textContent(), '5개 메일 · 안 읽음 5개');
  await pc.locator('#computer-mail-search').fill('시설관리팀');
  assert.equal(await pc.locator('[data-computer-mail]:visible').count(), 2);
  await pc.locator('[data-computer-mail="power"]').click();
  assert.match(await pc.locator('#computer-mail-subject').textContent(), /태양광/);
  assert.match(await pc.locator('#computer-mail-body').textContent(), /레버.*엘리베이터/s);
  assert.equal(await pc.locator('#computer-mail-count').textContent(), '2개 메일 · 안 읽음 1개');
  await pc.locator('#computer-mail-back').click();
  assert.equal(await pc.locator('[data-computer-mail="power"]').getAttribute('data-read'), 'true');
  await pc.locator('#computer-mail-search').fill('없는메일123 <script>');
  assert(await pc.locator('#computer-mail-empty').isVisible());
  assert.equal(await pc.locator('[data-computer-mail]:visible').count(), 0);
  await pc.locator('#computer-mail-search').fill('');

  await pcApp('calculator').click();
  await page.keyboard.type('12.5+7.5=');
  assert.equal(await display(pcCalc), '20');
  for (const value of ['AC', '2', '+', '3', '×', '4', '=']) await key(pcCalc, value).click();
  assert.equal(await display(pcCalc), '20', 'Chained operations use the previous result');
  await key(pcCalc, 'AC').click();
  await page.keyboard.type('0.1+0.2=');
  assert.equal(await display(pcCalc), '0.3', 'Ordinary decimal results avoid floating point noise');
  await key(pcCalc, 'AC').click();
  await page.keyboard.type('50%');
  assert.equal(await display(pcCalc), '0.5');
  await key(pcCalc, 'AC').click();
  await page.keyboard.type('12');
  await key(pcCalc, '±').click();
  await page.keyboard.press('Backspace');
  assert.equal(await display(pcCalc), '-1');
  await key(pcCalc, 'AC').click();
  await page.keyboard.type('8/0=');
  assert.equal(await display(pcCalc), '오류');
  await page.keyboard.type('9+1=');
  assert.equal(await display(pcCalc), '10', 'A new number recovers from division by zero');
  await page.evaluate(() => openComputerApp('missing-app'));
  assert(await pc.locator('#computer-calculator').isVisible(), 'Unknown app leaves the active window intact');

  await pcApp('building').click();
  await pcGuide.locator('[data-building-floor]').selectOption('12');
  const floor12 = await page.evaluate(() => {
    return { powered: floorHasPower(12), chargerCount: [...floorById.values()]
      .filter(scene => scene.floor === 12).flatMap(scene => scene.fixtures || []).filter(item => item.phoneCharger).length };
  });
  assert.equal(await pcGuide.locator('[data-building-power]').getAttribute('data-powered'), String(floor12.powered));
  assert.match(await pcGuide.locator('[data-building-charger]').textContent(), new RegExp(`충전 콘센트 ${floor12.chargerCount}곳`));
  await pc.locator('#computer-exit').click();
  await finishSceneTransition(page);

  await page.keyboard.press('p');
  await phoneApp('notes').click();
  const initialPosition = await page.evaluate(() => ({ x: body.position.x, y: body.position.y }));
  await phone.locator('#phone-note').fill('단서: ');
  await page.keyboard.type('p f wasd e <img src=x>');
  await page.clock.runFor(300);
  assert(await phone.locator('#phone-notes').isVisible());
  assert.equal(await page.evaluate(() => phoneLightOn), false);
  const notePosition = await page.evaluate(() => ({ x: body.position.x, y: body.position.y }));
  assert.equal(notePosition.x, initialPosition.x, 'Typing in phone notes cannot move the player');
  assert(Math.abs(notePosition.y - initialPosition.y) < 0.001, 'Phone notes tolerate only physics rounding');
  const note = await phone.locator('#phone-note').inputValue();
  assert.match(note, /p f wasd e <img src=x>/);
  await phone.locator('#phone-note-save').click();
  assert.match(await phone.locator('#phone-note-status').textContent(), /저장했습니다/);
  await phone.locator('#phone-app-back').click();
  await phoneApp('notes').click();
  assert.equal(await phone.locator('#phone-note').inputValue(), note);
  await page.keyboard.press('Escape');
  assert(await phone.locator('#phone-app-window').isHidden());
  assert(await phone.isVisible());
  await phoneApp('calculator').click();
  assert.equal(await display(phoneCalc), '0', 'Phone and PC keep separate calculator state');
  for (const value of ['7', '×', '8', '=']) await key(phoneCalc, value).click();
  assert.equal(await display(phoneCalc), '56');
  await closePhone();

  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.reload();
  assert(await page.locator('#menu-continue').isVisible());
  await page.locator('#menu-continue').click();
  await page.keyboard.press('p');
  await phoneApp('notes').click();
  assert.equal(await phone.locator('#phone-note').inputValue(), note, 'Saved phone notes survive browser reload and Continue');
  await closePhone();

  // Native controls stay reachable in portrait and a short landscape viewport.
  await page.clock.runFor(100);
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await pc.isVisible(), 'The continued game can reopen the nearby computer');
  for (const viewport of [{ width: 390, height: 844 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    for (const name of ['files', 'notes', 'mail', 'calculator', 'building']) {
      await pc.locator('#computer-start-button').tap();
      await pc.locator(`[data-start-app="${name}"]`).tap();
      assert(await pc.locator(`#computer-${name}`).isVisible());
      await boundsFit(pc.locator('.computer-app-window[data-active="true"]'));
      assert(await pc.locator(`#computer-${name}`).evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${name} fits device width`);
      await pc.locator('#computer-window-close').tap();
    }
    for (const button of await pc.locator('.computer-taskbar button').all()) { if (await button.isVisible()) { await button.scrollIntoViewIfNeeded(); await boundsFit(button); } }
    await pc.locator('#computer-exit').tap();
    await finishSceneTransition(page);
    await page.locator('#phone-button').tap();
    for (const name of ['notes', 'calculator']) {
      await phoneApp(name).tap();
      assert(await phone.locator(`[data-phone-view="${name}"]`).isVisible());
      if (name === 'calculator') await key(phoneCalc, '=').tap();
      assert(await phone.locator('.phone-screen').evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${name} scrolls without sideways overflow`);
      await phone.locator('#phone-app-back').tap();
      assert(await phone.locator('#phone-app-window').isHidden());
    }
    await phone.locator('#phone-close').tap();
    assert(await phone.isHidden());
    if (viewport.width === 390) { await page.clock.runFor(100); await page.keyboard.press('e'); await finishSceneTransition(page); }
  }

  // The phone no longer has the guide, so check the PC guide's DOM directly while the PC is closed.
  const pickGuideFloor = floor => pcGuide.locator('[data-building-floor]').evaluate((select, value) => { select.value = value; select.dispatchEvent(new Event('change')); }, floor);
  await page.evaluate(() => { buildingBlackout = true; solarEnabled = false; solarPoweredFloors = []; updatePowerState(); });
  await pickGuideFloor('12');
  assert.equal(await pcGuide.locator('[data-building-power]').getAttribute('data-powered'), 'false');
  assert.match(await pcGuide.locator('[data-building-elevator]').textContent(), /관리실.*회선/);
  await page.evaluate(() => { setSolarPower(true); supplySolarFloor(12); });
  assert.deepEqual(await page.evaluate(() => solarPoweredFloors), [12]);
  assert.equal(await pcGuide.locator('[data-building-power]').getAttribute('data-powered'), 'true');
  assert.match(await pcGuide.locator('[data-building-elevator]').textContent(), /관리실.*회선/);
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
  assert.match(await pcGuide.locator('[data-building-elevator]').textContent(), /비상 UPS로 운행 가능/);
  // The guide follows the one-floor supply limit and updates when that floor is replaced.
  for (const supplied of [12, 7]) {
    if (supplied === 7) await page.evaluate(() => supplySolarFloor(7));
    assert.deepEqual(await page.evaluate(() => solarPoweredFloors), [supplied]);
    for (const floor of ['7', '13', '12']) {
      const powered = Number(floor) === supplied;
      await pickGuideFloor(floor);
      assert.equal(await pcGuide.locator('[data-building-power]').getAttribute('data-powered'), String(powered), `${floor}F guide power with ${supplied}F supplied`);
      assert.match(await pcGuide.locator('[data-building-charger]').textContent(), /충전 가능/, 'Emergency outlets are independent of the selected lighting floor');
    }
  }
  await page.evaluate(() => supplySolarFloor(12));

  // Pick up the real badge and authenticate the real gate, then inspect their guide status.
  await page.evaluate(() => performFloorChange('f16-cafe', null, 'exit'));
  await place(950);
  await page.keyboard.press('e');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => collectedItems.has('f16-badge')));
  await page.evaluate(() => performFloorChange('f12'));
  await pcGuide.locator('[data-building-here]').evaluate(button => button.click());
  assert.equal(await pcGuide.locator('[data-building-floor]').inputValue(), '12');
  assert.match(await pcGuide.locator('[data-building-current]').textContent(), /12층/);
  await place(1826);
  await page.keyboard.press('e');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2);

  await page.evaluate(() => { phoneBattery = 0; refreshPhone(); });
  await page.locator('#phone-button').tap();
  for (const name of ['notes', 'calculator']) assert(await phoneApp(name).isDisabled());
  await page.evaluate(() => openPhoneApp('notes'));
  assert(await phone.locator('#phone-app-window').isHidden(), 'Empty battery cannot launch a phone app');
  await closePhone();
  await page.evaluate(() => { phoneBattery = 20; refreshPhone(); });
  await page.evaluate(() => performFloorChange('f12-dev', 0, 'exit'));
  await place(await page.evaluate(() => { const charger = currentDoors.find(door => door.phoneCharger); return charger.x + charger.width / 2; }));
  await page.keyboard.press('e');
  assert(await page.evaluate(() => phoneDock?.floor === 12));
  await page.locator('#phone-button').tap();
  assert(await phone.isHidden(), 'Deposited phone cannot launch any app');
  await page.keyboard.press('e');
  assert.equal(await page.evaluate(() => phoneDock), null);

  await page.evaluate(() => openGameMenu());
  await page.locator('#menu-exit').tap();
  await page.locator('#menu-start').tap();
  await page.locator('#menu-new-confirm').tap();
  await page.locator('#opening-skip').click();
  await page.locator('#phone-button').tap();
  await phoneApp('notes').tap();
  assert.equal(await phone.locator('#phone-note').inputValue(), '', 'New game clears the previous phone note');
  assert.equal(await page.evaluate(() => localStorage.getItem('archi.phone.note')), null);
  const draft = '저장 실패에도 남아야 하는 p f 메모';
  await phone.locator('#phone-note').fill(draft);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('Unavailable storage'); }; });
  await phone.locator('#phone-note-save').tap();
  assert.match(await phone.locator('#phone-note-status').textContent(), /저장하지 못했습니다/);
  await phone.locator('#phone-app-back').tap();
  await phoneApp('notes').tap();
  assert.equal(await phone.locator('#phone-note').inputValue(), draft);
  await closePhone();
  await page.locator('#phone-button').tap();
  await phoneApp('notes').tap();
  assert.equal(await phone.locator('#phone-note').inputValue(), draft, 'Failed save never discards the in-memory draft');
  assert.deepEqual(errors, []);
  console.log('PASS: five usable computer apps, mail search/read/back, shared calculators and error recovery, phone typing isolation/note save/continue/new-game/failure, actual floor power/badges/gates, mobile/landscape touch and scroll, battery/dock restrictions.');
} finally {
  await browser.close();
}
