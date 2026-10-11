import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.clock.runFor(100);
  const phone = page.locator('#phone');
  const panel = page.locator('#phone-quick-panel');
  const screen = () => page.locator('.phone-screen').getAttribute('data-screen');
  const visible = selector => page.locator(selector).evaluate(el => getComputedStyle(el).display !== 'none');
  assert.equal(await page.locator('nav button').count(), 5, 'The phone navigation bar does not join the game touch controls');

  await page.keyboard.press('p');
  assert.equal(await screen(), 'home');
  assert.equal(await page.locator('.phone-hardware').getAttribute('src'), 'assets/ui/phone-device.svg');
  assert(await page.locator('.phone-camera').isVisible(), 'Punch-hole camera sits on the screen');

  // Quick panel: status bar opens it, tiles work, Esc closes it back to the status bar.
  await page.locator('#phone-quick-open').click();
  assert(await panel.isVisible());
  assert.equal(await page.locator('#phone-quick-open').getAttribute('aria-expanded'), 'true');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'phone-qs-light');
  assert(await page.locator('#phone-home').evaluate(el => el.inert), 'Home under the panel is inert');
  await page.locator('#phone-qs-light').click();
  assert.equal(await page.evaluate(() => phoneLightOn), true);
  assert.equal(await page.locator('#phone-light').getAttribute('aria-pressed'), 'true', 'Quick tile and home widget share the flashlight');
  await page.locator('[data-quick-toggle="wifi"]').click();
  assert.equal(await visible('.phone-status-wifi'), false);
  await page.locator('[data-quick-toggle="plane"]').click();
  assert.equal(await visible('.phone-status-plane'), true);
  assert.equal(await visible('.phone-status-signal'), false);
  await page.evaluate(() => { window.phoneSounds = []; const original = playGameSound; window.playGameSound = (name, options) => { phoneSounds.push(name); return original(name, options); }; });
  await page.locator('[data-quick-toggle="sound"]').click();
  assert.equal(await page.locator('[data-sound-label]').textContent(), '무음');
  assert.equal(await visible('.phone-status-mute'), true);
  await page.locator('#phone-qs-light').click();
  assert.deepEqual(await page.evaluate(() => phoneSounds), [], 'Silent mode mutes phone sounds');
  await page.locator('[data-quick-toggle="sound"]').click();
  await page.locator('#phone-brightness').fill('40');
  assert.equal(await page.locator('.phone-screen').evaluate(el => getComputedStyle(el).filter), 'brightness(0.4)');
  await page.keyboard.press('Escape');
  assert(await panel.isHidden());
  assert.equal(await page.evaluate(() => [document.activeElement.id, usingPhone]).then(v => v.join()), 'phone-quick-open,true');

  // Swipe down from the status bar opens it and swipe up closes it.
  const bar = await page.locator('.phone-owner').boundingBox();
  await page.mouse.move(bar.x + 60, bar.y + 10); await page.mouse.down();
  await page.mouse.move(bar.x + 62, bar.y + 90, { steps: 5 }); await page.mouse.up();
  assert(await panel.isVisible(), 'Swiping down opens the quick panel');
  const head = await page.locator('.phone-quick-empty').boundingBox();
  await page.mouse.move(head.x + 40, head.y + 5); await page.mouse.down();
  await page.mouse.move(head.x + 40, head.y - 80, { steps: 5 }); await page.mouse.up();
  assert(await panel.isHidden(), 'Swiping up closes the quick panel');

  // Apps, the three navigation keys and recent apps.
  await page.locator('[data-phone-app="calculator"]').click();
  assert.equal(await screen(), 'app');
  await page.locator('#phone-nav-home').click();
  assert.equal(await screen(), 'home');
  await page.locator('[data-phone-app="notes"]').click();
  await page.locator('#phone-nav-recents').click();
  assert.equal(await screen(), 'recents');
  assert.deepEqual(await page.locator('[data-phone-recent]').evaluateAll(cards => cards.map(card => card.dataset.phoneRecent)), ['notes', 'calculator']);
  await page.locator('[data-phone-recent="calculator"]').click();
  assert(await page.locator('#phone-calculator').isVisible(), 'A recent card reopens its app');
  await page.locator('#phone-nav-back').click();
  assert.equal(await screen(), 'home');
  await page.locator('#phone-nav-recents').click();
  await page.locator('#phone-recent-clear').click();
  assert.equal(await page.locator('[data-phone-recent]').count(), 0);
  assert(await page.locator('#phone-recent-empty').isVisible());
  await page.keyboard.press('Escape');
  assert.equal(await screen(), 'home', 'Back leaves recents for home');
  await page.locator('[data-phone-app="building"]').click();
  await page.keyboard.press('Escape');
  assert.equal(await screen(), 'home');
  await page.locator('#phone-nav-back').click();
  assert.equal(await page.evaluate(() => usingPhone), false, 'Back on the home screen puts the phone away');

  // The side key turns the screen off from anywhere.
  await page.keyboard.press('p');
  await page.locator('[data-phone-app="notes"]').click();
  await page.locator('#phone-close').click();
  assert.equal(await page.evaluate(() => usingPhone), false);
  await page.evaluate(() => { phoneLightOn = false; phoneBattery = 0; refreshPhone(); });
  await page.keyboard.press('p');
  assert(await page.locator('#phone-qs-light').isDisabled());
  await page.locator('#phone-nav-recents').click();
  assert(await page.locator('#phone-recent-list button').first().isDisabled(), 'An empty battery disables recent cards');
  await page.locator('#phone-close').click();

  for (const [width, height] of [[390, 844], [568, 320]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => { phoneBattery = 80; refreshPhone(); });
    await page.keyboard.press('p');
    const frame = await page.locator('.phone-screen').boundingBox();
    for (const id of ['phone-nav-recents', 'phone-nav-home', 'phone-nav-back', 'phone-quick-open']) {
      const box = await page.locator(`#${id}`).boundingBox();
      assert(box.x >= frame.x - 1 && box.x + box.width <= frame.x + frame.width + 1 && box.y + box.height <= frame.y + frame.height + 1, `${id} stays on the ${width}×${height} screen`);
    }
    await page.locator('#phone-quick-open').click();
    assert(await page.locator('#phone-qs-light').isVisible());
    await phone.screenshot({ path: `.local/phone-oneui-quick-${width}.png` });
    await page.locator('#phone-nav-home').click();
    assert(await panel.isHidden(), 'Home closes the quick panel');
    await page.locator('#phone-close').click();
  }
  assert.deepEqual(errors, []);
  console.log('PASS: One UI frame and punch-hole, quick panel tiles/status icons/silent mode/brightness, swipe down/up, recents/home/back keys, side key, empty battery and small screens.');
} finally { await browser.close(); }
