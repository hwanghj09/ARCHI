import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const root = new URL('../', import.meta.url);
const patch = await sharp(fileURLToPath(new URL('assets/background/floor12/source/office-exit-corridor.png', root))).ensureAlpha().raw().toBuffer();
for (const name of ['office.png', 'office-finished.png']) {
  const pixels = await sharp(fileURLToPath(new URL(`assets/background/floor12/${name}`, root)))
    .extract({ left: 1490, top: 210, width: 257, height: 360 }).ensureAlpha().raw().toBuffer();
  assert.deepEqual(pixels, patch, `${name}: corrected indoor exit is present`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1304, height: 1016 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('index.html', root).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await page.evaluate(() => {
    sanity = 100; updateSanity(0);
    collectedItems.add('story-blackout-seen');
    collectedItems.add('f12-access');
  });
  await mkdir(new URL('docs/previews/', root), { recursive: true });
  for (const powered of [false, true]) {
    const state = await page.evaluate(async powered => {
      buildingBlackout = true; setAllFloorsPower(powered);
      performFloorChange('f12-dev', null, 'exit');
      await Promise.all([...dynamicScene.querySelectorAll('img')].map(image => image.decode()));
      const exit = currentDoors.find(door => door.key === 'exit');
      Body.setPosition(body, { x: exit.x - 60, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      cameraX = cameraTarget(); render(); updateInteraction();
      return { signs: dynamicScene.querySelectorAll('.luminous-sign').length,
        target: exit.target, hint: exit.hint,
        source: dynamicScene.querySelector('[data-part="exit-art"] img').getAttribute('src') };
    }, powered);
    assert.equal(state.signs, 0, 'Regular corridor exit has no emergency exit overlay');
    assert.equal(state.target, 'f12');
    assert.equal(state.hint, 'E · 복도로 나가기');
    assert.equal(state.source, 'assets/background/floor12/office-finished.png');
    await page.screenshot({ path: fileURLToPath(new URL(`docs/previews/floor12-room-exit-${powered ? 'on' : 'off'}.png`, root)) });
  }
  for (const mobile of [false, true]) {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 });
    await page.evaluate(() => {
      performFloorChange('f12', null, 'room:f12-dev');
      const door = currentDoors.find(door => door.key === 'room:f12-dev');
      Body.setPosition(body, { x: door.x + 40, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      cameraX = cameraTarget(); render(); updateInteraction();
    });
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await page.evaluate(() => dynamicFloorId), 'f12-dev');
    assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기');
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await page.evaluate(() => dynamicFloorId), 'f12');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: indoor exit art, no emergency sign with power on/off, keyboard round trips at desktop/mobile sizes');
} finally {
  await browser.close();
}
