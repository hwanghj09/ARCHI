import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);
  // 17층 조명 스위치는 HUD 개편으로 화면에서 숨겨졌다. 같은 change 처리기로 상태를 바꾼다.
  const setLights = on => page.locator('#floor17-lights').evaluate((el, on) => { el.checked = on; el.dispatchEvent(new Event('change')); }, on);
  const glow = page.locator('#flashlight-glow');
  const badge = page.locator('#phone-flash-state');
  assert(await page.locator('#darkness').isHidden(), 'Start in a lit office');
  assert(await glow.isHidden());
  assert.equal(await badge.textContent(), '플래시 꺼짐');

  await page.keyboard.press('f');
  await page.clock.runFor(await page.evaluate(() => phoneLightDelayMs + 34));
  assert(await glow.isVisible(), 'The source remains visible in a lit room');
  assert(await page.locator('#flashlight-beam').isHidden(), 'Keep the large beam limited to darkness');
  assert.equal(await badge.textContent(), '플래시 켜짐');
  assert.match(await page.locator('#phone-button').getAttribute('aria-label'), /플래시 켜짐/);
  for (const direction of ['a', 'd']) {
    await page.keyboard.down(direction);
    await page.clock.runFor(120);
    await page.keyboard.up(direction);
    assert(await glow.evaluate(el => {
      const style = getComputedStyle(el), world = document.getElementById('world');
      return Math.abs(parseFloat(style.left) - parseFloat(world.style.getPropertyValue('--beam-x'))) < .01 &&
        Math.abs(parseFloat(style.top) - parseFloat(world.style.getPropertyValue('--beam-y'))) < .01 && style.pointerEvents === 'none';
    }), 'The glow follows the same hand coordinates as the directional beam');
  }
  await page.screenshot({ path: '.local/phone-flash-bright-desktop.png' });
  await setLights(false);
  assert(await glow.isVisible());
  assert(await page.locator('#flashlight-beam').isVisible(), 'Dark rooms retain the beam');
  await setLights(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#phone-button').tap();
  await page.locator('#phone-light').tap();
  await page.clock.runFor(await page.evaluate(() => phoneLightDelay ? phoneLightDelayMs + 100 : 0));
  await page.locator('#phone-close').tap();
  assert(await glow.isHidden());
  assert.equal(await badge.textContent(), '플래시 꺼짐');
  await page.locator('#phone-button').tap();
  await page.locator('#phone-light').tap();
  await page.clock.runFor(await page.evaluate(() => phoneLightDelay ? phoneLightDelayMs + 100 : 0));
  await page.locator('#phone-close').tap();
  assert(await glow.isVisible());
  assert.equal(await badge.textContent(), '플래시 켜짐');
  // 플래시 글자(#phone-flash-state)는 HUD 개편으로 숨겨졌고, 화면에서는 빛나는 플래시 버튼이 상태를 보여 준다.
  assert.equal(await page.locator('#flash-button').getAttribute('data-flashlight'), 'on');
  const rect = await page.locator('#flash-button').boundingBox();
  assert(rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= 390 && rect.y + rect.height <= 844);
  await page.screenshot({ path: '.local/phone-flash-bright-mobile.png' });

  await page.evaluate(() => { phoneBattery = 1; phoneDrainAccumulator = 0; updatePhone(1000); });
  assert(await glow.isHidden(), 'Battery exhaustion removes the glow');
  assert.equal(await badge.textContent(), '플래시 꺼짐');
  await page.evaluate(() => {
    phoneBattery = 50; togglePhoneLight();
    if (room !== 'office') { performFloorChange('f17'); performRoomChange(); }
    chargePhone(officeCharger);
  });
  assert(await glow.isHidden(), 'Leaving the phone in a charger removes the glow');
  assert(await badge.isHidden(), 'Charging status replaces the flashlight badge');
  assert.match(await page.locator('#phone-button').getAttribute('aria-label'), /충전 콘센트/);
  assert.deepEqual(errors, []);
  console.log('PASS: lit/dark flashlight visibility, hand tracking, desktop/mobile state, keyboard/touch, battery and charging');
} finally {
  await browser.close();
}
