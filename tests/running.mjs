import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition, reachInitialCorridor } from './scene-transition.mjs';

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
  await reachInitialCorridor(page);
  // Keep the sprint route playable; blackout input locking is covered separately.
  await page.evaluate(() => triggerBuildingBlackout());
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); });
  await page.locator('#power-floor-grid [data-floor="17"]').dispatchEvent('click');
  await page.locator('#run-sheet').evaluate(img => img.decode());
  const state = () => page.locator('#player').evaluate(el => {
    const transform = new DOMMatrix(getComputedStyle(el).transform);
    return { x: transform.m41 + 96, feet: transform.m42 + 178, facing: transform.m11, animation: el.dataset.state };
  });
  const start = await state();
  await page.keyboard.down('d');
  await page.clock.runFor(300);
  const walking = await state();
  assert.equal(walking.animation, 'walk');
  assert(Math.abs(walking.x - start.x - 60) < 6);
  await page.evaluate(() => {
    window.runFrames = new Set();
    const sample = () => {
      const el = document.getElementById('player');
      if (el.dataset.state === 'run') window.runFrames.add(Number(el.dataset.frame));
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.keyboard.down('ShiftLeft');
  await page.clock.runFor(650);
  const running = await state();
  assert.equal(running.animation, 'run');
  assert(Math.abs(running.x - walking.x - 221) < 6, 'Sprint speed is 340px/s');
  assert((await page.evaluate(() => window.runFrames.size)) < 16, 'A run cycle takes longer than 650ms');
  await page.clock.runFor(350);
  assert(Math.abs((await state()).x - walking.x - 340) < 6, 'Slower animation preserves sprint movement speed');
  assert.deepEqual((await page.evaluate(() => [...window.runFrames])).sort((a, b) => a - b), Array.from({ length: 16 }, (_, i) => i));
  assert.equal(await page.locator('#player img:visible').count(), 1);
  assert(await page.locator('#run-sheet').evaluate(el => {
    const cellWidth = el.parentElement.clientWidth;
    const frame = Number(el.parentElement.dataset.frame);
    return el.naturalWidth === 4096 && el.naturalHeight === 256 && el.clientWidth === cellWidth * 16 &&
      Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41 + frame * cellWidth) < .01;
  }), 'Exactly one normalized run frame is displayed');
  await page.screenshot({ path: '.local/run-desktop.png' });
  await page.keyboard.down('ShiftRight');
  await page.keyboard.up('ShiftLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'run', 'Either Shift key can sustain running');
  await page.keyboard.up('ShiftRight');
  const released = await state();
  await page.clock.runFor(300);
  assert.equal((await state()).animation, 'walk');
  assert(Math.abs((await state()).x - released.x - 60) < 6, 'Shift release restores walking speed');
  await page.evaluate(() => setDebugSanity(30));
  await page.keyboard.down('ShiftLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'run', '30% still allows running');
  // 정신력이 낮아도(정전으로 어두운 곳 포함) 달릴 수 있다.
  await page.evaluate(() => { solarPoweredFloors = []; updatePowerState(); });
  assert.equal(await page.evaluate(() => world.dataset.blackout), 'true');
  for (const sanity of [29.9, 10, 0]) {
    await page.evaluate(value => setDebugSanity(value), sanity);
    await page.clock.runFor(300);
    assert.equal((await state()).animation, 'run', `${sanity}% still runs`);
  }
  // 낮은 정신력의 이동 속도 감소는 sanity.mjs가 확인한다. 아래 경계 확인은 정상 질주 속도로 한다.
  await page.evaluate(() => { setDebugSanity(100); solarPoweredFloors = [17]; updatePowerState(); });
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('d');
  await page.keyboard.down('ShiftLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'idle', 'Shift alone does not move');
  await page.keyboard.down('a');
  await page.keyboard.down('d');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'idle', 'Opposing directions cancel sprint movement');
  await page.keyboard.up('a');
  await page.clock.runFor(5000);
  assert((await state()).x > 2042, 'Sprint crosses both former box positions without jumping');
  assert.equal((await state()).animation, 'run');
  await page.keyboard.press('Space');
  await page.clock.runFor(150);
  assert.equal((await state()).animation, 'jump');
  assert((await state()).feet < 500);
  await page.clock.runFor(1000);
  assert.equal((await state()).animation, 'run', 'Landing resumes running');
  await page.clock.runFor(8000);
  assert(Math.abs((await state()).x - 4948) < 1, 'Extended map boundary still blocks sprinting');
  assert.equal((await state()).animation, 'idle', 'Blocked sprint does not animate in place');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('d');
  await page.keyboard.up('ShiftLeft');
  const blurred = await state();
  await page.clock.runFor(200);
  assert(Math.abs((await state()).x - blurred.x) < 1);
  await page.keyboard.down('a');
  await page.clock.runFor(150);
  assert.equal((await state()).animation, 'walk', 'Blur clears sprint input');
  await page.keyboard.down('ShiftRight');
  await page.clock.runFor(150);
  assert.equal((await state()).animation, 'run');
  assert.equal((await state()).facing, -1);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({ path: '.local/run-mobile.png' });
  await page.keyboard.up('a');
  await page.keyboard.up('ShiftRight');
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await reachInitialCorridor(page);
  await page.keyboard.down('d');
  await page.clock.runFor(2100);
  await page.keyboard.up('d');
  await page.clock.runFor(34);
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'office');
  await page.keyboard.down('d');
  await page.clock.runFor(150);
  assert.equal((await state()).animation, 'walk', 'Scene transitions clear held sprint input');
  await page.keyboard.up('d');
  await page.keyboard.up('ShiftLeft');
  assert.deepEqual(errors, []);
  console.log('PASS: Shift speed, sixteen frames, both Shift keys, low-sanity cancellation and recovery, release, collisions, jump, blur, scene reset and mobile layout.');
} finally {
  await browser.close();
}
