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
  await page.locator('#cabin-art').evaluate(img => img.decode());
  const ghost = page.locator('#hallucinations');
  const shadow = page.locator('#hallucination-shadow');
  const state = () => page.evaluate(() => ({ mode: hallucinationMode, life: hallucinationLife, phase: zeroEventPhase, timer: zeroEventTimer }));
  for (const mobile of [false, true]) {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 });
    for (const mode of ['ambient', 'charge']) {
      await page.evaluate(mode => {
        endHallucinationSighting(); zeroEventPhase = 'idle'; zeroEventTimer = 0; zeroEventForced = false;
        sanity = mode === 'charge' ? 0 : 25;
        performFloorChange('b1');
        elevatorCars[0].floor = -1;
        if (mode === 'ambient') startAmbientSighting();
        else if (mode === 'charge') startZeroCharge();
        hallucinationLife = 400; zeroEventTimer = 200; renderHallucination();
      }, mode);
      assert(await ghost.isVisible(), `${mode} is visible in the hall before boarding`);
      // 엘리베이터에 타면 복도 환각·돌진은 멈추는 것이 아니라 끝난다(sanity.js updateSanity, 3447290).
      const cleared = { mode: null, life: (await state()).life, phase: 'idle', timer: 0 };
      const immediatelyHidden = await page.evaluate(() => { showCabin(0); return hallucinations.hidden && hallucinationShadow.hidden; });
      assert(immediatelyHidden, `${mode} disappears synchronously when the cabin opens`);
      await page.clock.runFor(3000);
      assert(await ghost.isHidden()); assert(await shadow.isHidden());
      assert(await page.locator('#hallucination-effects').isHidden());
      assert.equal(await page.locator('body').getAttribute('data-hallucinating'), null);
      assert.deepEqual(await state(), cleared, 'The hallway hallucination ends when the ride starts');
      assert.equal(await page.evaluate(() => debugTriggerAmbientHallucination()), false);
      assert.equal(await page.evaluate(() => debugTriggerChaseHallucination()), false);
      const destination = page.locator('#cabin-floor-buttons [data-floor="1"]');
      if (mobile) await destination.tap(); else await destination.click();
      await page.clock.runFor(1200);
      assert(await ghost.isHidden(), 'Door closing does not reveal a hallucination');
      await page.clock.runFor(3000);
      assert.equal(await page.evaluate(() => elevatorCars[0].floor), 1);
      assert(await page.locator('#cabin-exit').isEnabled(), 'The player can arrive and leave normally');
      assert(await ghost.isHidden(), 'Arrival does not reveal a hallucination');
      assert.deepEqual(await state(), cleared);
      assert.equal(await page.evaluate(() => hallucinationCaught), false, 'An ended charge cannot capture the rider');
      if (mode === 'ambient') await page.screenshot({ path: `.local/cabin-no-hallucination-${mobile ? 'mobile' : 'desktop'}.png` });
      await page.evaluate(() => { leaveCabin(); startAmbientSighting(); hallucinationLife = 400; renderHallucination(); });
      assert(await ghost.isVisible(), 'Hallway hallucinations can render again after leaving');
      await page.evaluate(() => { endHallucinationSighting(); zeroEventPhase = 'idle'; sanity = 35; });
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: ambient/charge hidden while boarding, closing, moving and arriving; attacks end on boarding, debug guards, hallway resumption; desktop/touch');
} finally {
  await browser.close();
}
