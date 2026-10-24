import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition, reachInitialCorridor, collectRooftopKey } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-21T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-09-21T00:01:00Z'));
  // Keep timed route movement at its nominal speed; low-sanity slowdown is covered by sanity.mjs.
  await page.evaluate(() => { sanity = 100; });
  // The switch can illuminate 17F only after the rooftop generator supplies it.
  assert(await page.locator('#darkness').isHidden(), 'The building starts with mains power');
  await page.evaluate(() => triggerBuildingBlackout());
  assert(await page.locator('#darkness').isVisible(), 'The outage removes mains power');
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); });
  await page.locator('#power-floor-grid [data-floor="17"]').dispatchEvent('click');
  await page.locator('#office-background').evaluate(img => img.decode());
  // 17층 조명 스위치는 HUD 개편으로 화면에서 숨겨졌다(css/game.css). 같은 change 처리기로 상태를 바꾼다.
  const lights = page.locator('#floor17-lights');
  const setLights = on => lights.evaluate((el, on) => { el.checked = on; el.dispatchEvent(new Event('change')); }, on);
  const filter = selector => page.locator(selector).evaluate(el => getComputedStyle(el).filter);
  const darkness = page.locator('#darkness');
  const alignedSight = () => page.locator('#player').evaluate(el => {
    const transform = new DOMMatrix(getComputedStyle(el).transform);
    const world = el.parentElement;
    return Math.abs(parseFloat(world.style.getPropertyValue('--sight-x')) - transform.m41 - 96) < 1 &&
      Math.abs(parseFloat(world.style.getPropertyValue('--sight-y')) - transform.m42 - 97) < 1;
  });
  assert(await lights.isChecked());
  assert.equal(await filter('#office-background'), 'none');
  assert(await darkness.isHidden());
  await page.screenshot({ path: '.local/lights-on-desktop.png' });
  await setLights(false);
  assert(await darkness.isVisible());
  assert(await alignedSight());
  assert.equal(await filter('#player'), 'none');
  assert.equal(await page.locator('#floor17-light-state').textContent(), '조명 꺼짐');
  await page.screenshot({ path: '.local/lights-off-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({ path: '.local/lights-off-mobile.png' });
  await page.locator('#stage').focus();
  await page.keyboard.down('d');
  await page.clock.runFor(500);
  await page.keyboard.up('d');
  await page.keyboard.press('Space');
  await page.clock.runFor(150);
  assert(await alignedSight(), 'Visibility circle follows movement, camera and jump');
  await page.screenshot({ path: '.local/lights-off-jump.png' });
  await page.clock.runFor(1000);
  await page.keyboard.down('a');
  await page.clock.runFor(500);
  await page.keyboard.up('a');
  await page.clock.runFor(34);
  await setLights(true);
  assert(await lights.isChecked());
  assert.equal(await filter('#office-background'), 'none');
  assert(await darkness.isHidden());
  await setLights(false);
  await reachInitialCorridor(page);
  await collectRooftopKey(page);
  assert(await darkness.isVisible(), 'Corridor shares the office light state');
  assert(await alignedSight());
  await page.keyboard.down('d');
  await page.clock.runFor(13800);
  await page.keyboard.up('d');
  await page.clock.runFor(34);
  await page.keyboard.press('e');
  await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('header > span').textContent(), 'RF · 옥상');
  assert(await page.locator('#floor17-light-switch').isHidden());
  assert(await darkness.isHidden(), 'Rooftop is not covered by 17F darkness');
  assert.equal(await filter('#dynamic-scene > img'), 'none');
  assert.equal(await filter('#dynamic-scene .door'), 'none', 'Rooftop door is not dimmed');
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await lights.isChecked(), false);
  assert(await darkness.isVisible(), '17F remembers lights after returning');
  assert(await alignedSight());
  await setLights(true);
  assert(await darkness.isHidden());
  assert.equal(await filter('#background'), 'none');
  assert.deepEqual(errors, []);
  console.log('PASS: 17F lighting, shared office/corridor state, rooftop exclusion, and persistence.');
} finally {
  await browser.close();
}
