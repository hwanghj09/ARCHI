import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-23T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-23T00:01:00Z'));
  const light = () => page.evaluate(() => ({ on: phoneLightOn, raising: phoneRaising, pending: Boolean(phoneLightDelay) }));

  await page.keyboard.press('f');
  await page.clock.runFor(200);
  await page.keyboard.press('Escape');
  const paused = await light();
  assert.equal(paused.pending, true);
  await page.clock.runFor(1000);
  assert.deepEqual(await light(), paused, 'Pausing freezes the pending flashlight animation');
  await page.locator('#menu-resume').click();
  await page.clock.runFor(200);
  assert.equal((await light()).on, false, 'Resuming keeps the remaining raising time');
  await page.clock.runFor(150);
  assert.equal((await light()).on, true);
  await page.keyboard.press('f');

  const saved = await page.evaluate(() => progressSnapshot());
  await page.keyboard.press('f');
  await page.evaluate(saved => restoreProgress(saved), saved);
  await page.clock.runFor(600);
  assert.deepEqual(await light(), { on: false, raising: false, pending: false }, 'Loading discards an old flashlight request');

  await page.keyboard.press('f');
  await page.keyboard.press('Escape');
  await page.locator('#menu-exit').click();
  await page.locator('#menu-start').click();
  await page.locator('#menu-new-confirm').click();
  await page.clock.runFor(600);
  assert.deepEqual(await light(), { on: false, raising: false, pending: false }, 'A new opening cannot inherit a flashlight request');
  await page.locator('#opening-skip').click();

  await page.keyboard.press('f');
  await page.evaluate(() => { performFloorChange('f1'); catchPlayer(); });
  await page.clock.runFor(600);
  assert.deepEqual(await light(), { on: false, raising: false, pending: false }, 'A capture cancels a pending flashlight');
  await page.evaluate(saved => restoreProgress(saved), saved);

  await page.evaluate(() => { writeSlot(0, 'manual'); triggerDevoured(); });
  await page.locator('#hallucination-caught .game-over-load').click();
  await page.locator('[data-slot-load="0"]').click();
  assert(await page.evaluate(() => !hallucinationCaught && devouredVideo.hidden && devouredVideo.paused), 'Loading stops and hides the death video');
  assert.notEqual(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2)?.id), 'devoured-video', 'The death video cannot intercept the resumed game');
  await page.evaluate(() => triggerDevoured());
  await page.waitForFunction(() => !hallucinationDevouredElement.paused);
  await page.keyboard.press('Enter');
  assert(await page.evaluate(() => !hallucinationCaught && devouredVideo.hidden && hallucinationDevouredElement.paused), 'Retry stops the death audio as well as its video');
  for (const variant of [0, 1]) {
    await page.evaluate(variant => {
      const random = Math.random;
      try { Math.random = () => variant; playRedEyeBreakSound(); }
      finally { Math.random = random; }
    }, variant);
    await page.waitForFunction(variant => !(variant ? redEyeBreakUniversElement : redEyeBreakDragonElement).paused, variant);
    await page.keyboard.press('Escape');
    assert(await page.evaluate(() => redEyeBreakDragonElement.paused && redEyeBreakUniversElement.paused), 'The pause menu stops both native red-eye audio variants');
    await page.locator('#menu-pause-settings-button').click();
    await page.locator('#menu-volume').fill('0');
    assert(await page.evaluate(() => gameVolume === 0 && redEyeBreakDragonElement.paused && redEyeBreakUniversElement.paused));
    await page.locator('#menu-volume').fill('70');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: pending flashlight pause/resume, load, new game, capture and death-video cleanup.');
} finally { await browser.close(); }
