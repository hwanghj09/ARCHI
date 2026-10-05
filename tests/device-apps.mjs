import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);

  const pc = page.locator('#computer');
  const phone = page.locator('#phone');
  const pcApp = name => pc.locator(`.computer-shortcuts [data-computer-app="${name}"]`);
  const phoneApp = name => phone.locator(`[data-phone-app="${name}"]`);
  const pcCalc = pc.locator('[data-device-calculator]');
  const phoneCalc = phone.locator('[data-device-calculator]');
  const pcGuide = pc.locator('[data-building-guide]');
  const phoneGuide = phone.locator('[data-building-guide]');
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
      `${await locator.getAttribute('id') || 'Control'} fits ${viewport.width}×${viewport.height}`);
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
  assert.equal(await pc.locator('.computer-shortcuts button').count(), 5);
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
  assert.match(await pcGuide.locator('[data-building-access]').textContent(), /필요.*하차 후 게이트/);
  const floor12 = await page.evaluate(() => {
    const scene = ALL_FLOORS.find(scene => scene.floor === 12);
    const gate = scene.barriers.find(item => item.accessGate);
    return { powered: floorHasPower(12), badge: INVENTORY_ITEMS[gate.requires].name, chargerCount: scene.fixtures.filter(item => item.phoneCharger).length };
  });
  assert.equal(await pcGuide.locator('[data-building-power]').getAttribute('data-powered'), String(floor12.powered));
  assert((await pcGuide.locator('[data-building-access]').textContent()).includes(floor12.badge));
  assert.match(await pcGuide.locator('[data-building-charger]').textContent(), new RegExp(`충전함 ${floor12.chargerCount}곳`));
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
  assert.deepEqual(await page.evaluate(() => ({ x: body.position.x, y: body.position.y })), initialPosition);
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
      await pcApp(name).tap();
      assert(await pc.locator(`#computer-${name}`).isVisible());
      await boundsFit(pc.locator('#computer-window'));
      assert(await pc.locator(`#computer-${name}`).evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${name} fits device width`);
      await pc.locator('#computer-window-close').tap();
    }
    for (const button of await pc.locator('.computer-taskbar button').all()) await boundsFit(button);
    await pc.locator('#computer-exit').tap();
    await finishSceneTransition(page);
    await page.locator('#phone-button').tap();
    for (const name of ['notes', 'calculator', 'building']) {
      await phoneApp(name).tap();
      assert(await phone.locator(`[data-phone-view="${name}"]`).isVisible());
      if (name === 'calculator') await key(phoneCalc, '=').tap();
      if (name === 'building') {
        await phoneGuide.locator('[data-building-floor]').selectOption('12');
        await phone.locator('.phone-screen').evaluate(element => { element.scrollTop = element.scrollHeight; });
      }
      assert(await phone.locator('.phone-screen').evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${name} scrolls without sideways overflow`);
      await phone.locator('#phone-app-back').tap();
      assert(await phone.locator('#phone-app-window').isHidden());
    }
    await phone.locator('#phone-close').tap();
    assert(await phone.isHidden());
    if (viewport.width === 390) { await page.clock.runFor(100); await page.keyboard.press('e'); await finishSceneTransition(page); }
  }

  await page.evaluate(() => { buildingBlackout = true; solarEnabled = false; solarPoweredFloor = null; updatePowerState(); });
  await page.locator('#phone-button').tap();
  await phoneApp('building').tap();
  await phoneGuide.locator('[data-building-floor]').selectOption('12');
  assert.equal(await phoneGuide.locator('[data-building-power]').getAttribute('data-powered'), 'false');
  assert.match(await phoneGuide.locator('[data-building-elevator]').textContent(), /레버/);
  await page.evaluate(() => { solarEnabled = true; solarPoweredFloor = 12; updatePowerState(); });
  assert.equal(await phoneGuide.locator('[data-building-power]').getAttribute('data-powered'), 'true');
  assert.match(await phoneGuide.locator('[data-building-elevator]').textContent(), /비상 전력으로 운행 가능/);
  await closePhone();

  // Pick up the real badge and authenticate the real gate, then inspect their guide status.
  await page.evaluate(() => performFloorChange('f16-cafe', null, 'exit'));
  await place(950);
  await page.keyboard.press('e');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => collectedItems.has('f16-badge')));
  await page.evaluate(() => performFloorChange('f12'));
  await page.locator('#phone-button').tap();
  await phoneApp('building').tap();
  await phoneGuide.locator('[data-building-here]').tap();
  assert.equal(await phoneGuide.locator('[data-building-floor]').inputValue(), '12');
  assert.match(await phoneGuide.locator('[data-building-current]').textContent(), /12층/);
  assert.match(await phoneGuide.locator('[data-building-access]').textContent(), /보유.*게이트/);
  await closePhone();
  await place(1826);
  await page.keyboard.press('e');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2);
  await page.locator('#phone-button').tap();
  await phoneApp('building').tap();
  assert.match(await phoneGuide.locator('[data-building-access]').textContent(), /층 인증 완료/);
  await closePhone();

  await page.evaluate(() => { phoneBattery = 0; refreshPhone(); });
  await page.locator('#phone-button').tap();
  for (const name of ['notes', 'calculator', 'building']) assert(await phoneApp(name).isDisabled());
  await page.evaluate(() => openPhoneApp('notes'));
  assert(await phone.locator('#phone-app-window').isHidden(), 'Empty battery cannot launch a phone app');
  await closePhone();
  await page.evaluate(() => { phoneBattery = 20; refreshPhone(); });
  await place(await page.evaluate(() => { const charger = currentDoors.find(door => door.phoneCharger); return charger.x + charger.width / 2; }));
  await page.keyboard.press('e');
  assert(await page.evaluate(() => phoneDock?.floor === 12));
  await page.locator('#phone-button').tap();
  assert(await phone.isHidden(), 'Deposited phone cannot launch any app');
  await page.keyboard.press('e');
  assert.equal(await page.evaluate(() => phoneDock), null);

  await page.locator('#game-menu-button').tap();
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
