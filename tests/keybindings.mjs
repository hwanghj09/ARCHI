import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  const keyButton = action => page.locator(`[data-key-action="${action}"]`);
  const bindings = () => page.evaluate(() => keyBindings);
  const bind = async (action, key) => {
    await keyButton(action).click();
    await page.keyboard.press(key);
    assert.match(await page.locator('#menu-keys-status').textContent(), /저장했습니다/);
  };
  await page.locator('#menu-settings-button').click();
  await page.locator('#menu-keybindings-button').click();
  assert.equal(await keyButton('right').textContent(), 'D / →');
  await keyButton('right').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('a');
  assert.match(await page.locator('#menu-keys-status').textContent(), /왼쪽 이동.*사용 중/);
  assert.deepEqual((await bindings()).right, ['KeyD', 'ArrowRight']);
  await page.keyboard.press('F2');
  assert.match(await page.locator('#menu-keys-status').textContent(), /지원하지/);
  await page.keyboard.press('Escape');
  assert(await page.locator('#menu-controls').isVisible(), 'Escape cancels capture before leaving controls');
  assert.equal(await keyButton('right').getAttribute('aria-pressed'), 'false');
  await keyButton('right').click();
  await page.keyboard.press('Tab');
  assert.equal(await keyButton('right').getAttribute('aria-pressed'), 'false', 'Tab cancels capture and keeps navigation');

  const custom = { left: 'j', right: 'l', jump: 'k', run: 'r', crouch: 'c', interact: 'q', phone: 'o', light: 'g', inventory: 'i' };
  for (const [action, key] of Object.entries(custom)) await bind(action, key);
  const saved = await bindings();
  assert.equal(await page.locator('#interact').textContent(), 'Q');
  assert.match(await page.locator('#inventory-button').textContent(), /^가방.* · I$/);
  assert(await page.evaluate(() => officeDocuments[0].body.includes('<td>Q</td>')));
  assert.match(await page.evaluate(() => doorHintText(officeComputer)), /^Q ·/);
  assert.match(await page.evaluate(() => phoneChargerHint({ scene: 'office', floor: 17, x: -100, width: 10 })), /^Q ·/);
  await page.keyboard.press('Escape');
  await page.locator('#menu-settings-button').click();
  await page.locator('#menu-volume').fill('35');
  await page.reload();
  await page.clock.runFor(100);
  assert.deepEqual(await bindings(), saved, 'Volume changes and reload preserve all bindings');
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  const hold = async (key, ms = 150) => {
    await page.keyboard.down(key);
    await page.clock.runFor(ms);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const x = () => page.evaluate(() => body.position.x);
  let before = await x();
  await hold('d'); await hold('ArrowRight');
  assert.equal(await x(), before, 'Rebinding removes both original right movement aliases');
  await hold('l');
  assert((await x()) > before + 20, 'Custom movement reaches the physics loop');
  before = await x();
  await hold('j');
  assert((await x()) < before - 20);
  await page.keyboard.down('r');
  await page.keyboard.down('l');
  await page.clock.runFor(100);
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'run');
  await page.keyboard.up('l'); await page.keyboard.up('r');
  await page.keyboard.down('c');
  await page.clock.runFor(100);
  assert(await page.evaluate(() => crouching));
  await page.keyboard.up('c'); await page.clock.runFor(100);
  assert.equal(await page.evaluate(() => crouching), false);
  await hold('k', 100);
  assert(await page.evaluate(() => body.bounds.max.y < floorY - 10), 'Custom jump leaves the floor');
  await page.clock.runFor(1200);

  await page.keyboard.press('i');
  assert(await page.evaluate(() => inventoryShown()));
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => inventoryShown()), 'Tab navigates the bag after its shortcut is changed');
  await page.keyboard.press('i');
  assert.equal(await page.evaluate(() => usingInspection), false);
  await page.keyboard.press('p');
  assert.equal(await page.evaluate(() => usingPhone), false, 'Original phone shortcut is released');
  await page.keyboard.press('o');
  assert(await page.evaluate(() => usingPhone));
  await page.keyboard.press('g');
  assert(await page.evaluate(() => phoneLightOn));
  await page.evaluate(() => openPhoneApp('notes'));
  await page.locator('#phone-note').fill('qoilg');
  await page.locator('#phone-note').press('o');
  assert(await page.evaluate(() => usingPhone), 'Custom shortcuts leave text input alone');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.keyboard.press('g');
  assert.equal(await page.evaluate(() => phoneLightOn), false);
  await page.evaluate(() => openInspection('테스트', '키 변경 검사'));
  assert.match(await page.locator('.inspection-help').textContent(), /Q/);
  await page.keyboard.press('q');
  assert.equal(await page.evaluate(() => inspectionTypingTimer), null);
  await page.keyboard.press('q');
  assert.equal(await page.evaluate(() => usingInspection), false);

  await page.keyboard.down('l');
  await page.clock.runFor(50);
  await page.keyboard.press('Escape');
  await page.keyboard.up('l');
  assert.equal(await page.evaluate(() => keys.size), 0, 'Opening settings releases held keys');
  await page.locator('#menu-controls-button').click();
  await bind('run', 'ShiftRight');
  await bind('crouch', 'ControlRight');
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await keyButton('inventory').scrollIntoViewIfNeeded();
    assert(await keyButton('inventory').isVisible());
    assert(await page.evaluate(() => document.getElementById('main-menu').scrollWidth <= innerWidth), 'No horizontal overflow');
    await page.screenshot({ path: `.local/keybindings-${viewport.width}.png` });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator('#menu-keys-reset').click();
  assert.deepEqual(await bindings(), await page.evaluate(() => defaultKeyBindings));
  await page.screenshot({ path: '.local/keybindings-desktop.png' });
  await page.reload(); await page.clock.runFor(100);
  assert.deepEqual(await bindings(), await page.evaluate(() => defaultKeyBindings), 'Reset survives reload');

  for (const invalid of ['{', JSON.stringify({ right: ['Escape'] }), JSON.stringify({ ...saved, right: saved.left }),
    JSON.stringify({ ...saved, right: ['<script>'] }), JSON.stringify({ ...saved, inventory: [] })]) {
    await page.evaluate(value => localStorage.setItem('archi.keybindings', value), invalid);
    await page.reload(); await page.clock.runFor(100);
    assert.deepEqual(await bindings(), await page.evaluate(() => defaultKeyBindings), 'Invalid stored bindings fall back safely');
  }
  await page.evaluate(() => {
    Storage.prototype.setItem = () => { throw new Error('Storage denied'); };
  });
  await page.locator('#menu-controls-button').click();
  await keyButton('right').click(); await page.keyboard.press('l');
  assert.deepEqual((await bindings()).right, ['KeyL']);
  assert.match(await page.locator('#menu-keys-status').textContent(), /저장할 수 없습니다/);
  assert.deepEqual(errors, []);
  console.log('PASS: all bindings, capture/cancel/conflicts/reserved keys, movement/run/crouch/jump, phone/editing, bag/focus, inspection/hints, persistence/reset/corrupt storage/storage failure and responsive UI.');
} finally { await browser.close(); }
