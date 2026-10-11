import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

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

  for (const [name, width, height] of [['desktop', 1280, 720], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      collectedItems.add('f12-access');
      performFloorChange('f12');
      const door = currentDoors.find(door => door.target === 'f12-restroom');
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
    });
    assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 화장실 들어가기');
    if (name === 'mobile') await page.locator('#interact').tap();
    else await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await page.locator('header span').textContent(), '12F · 화장실');
    const exit = await page.evaluate(() => {
      const door = currentDoors.find(door => door.key === 'exit');
      return { x: door.x, y: door.y, width: door.width, height: parseFloat(door.element.style.height),
        image: getComputedStyle(door.element).backgroundImage,
        mirrorLeft: floorById.get('f12-restroom').fixtures[0].outline[0], playerX: body.position.x };
    });
    assert.deepEqual([exit.x, exit.y, exit.width, exit.height], [185, 210, 145, 360]);
    assert(exit.x + exit.width < exit.mirrorLeft, 'The door stays clear of the mirror and sinks');
    assert(exit.x + exit.width < 380 - 55 / 2, 'The door stays clear of the waste bin');
    assert.match(exit.image, /assets\/objects\/floor16\/restroom-door\.png/);
    await page.evaluate(async image => {
      const img = new Image(); img.src = image.match(/url\(["']?(.*?)["']?\)/)[1]; await img.decode();
    }, exit.image);
    assert(Math.abs(exit.playerX - (exit.x + 40)) < 1, 'Enter beside the corrected exit');
    await page.screenshot({ path: `.local/floor12-restroom-${name}.png` });
    await page.clock.runFor(100);
    assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기');
    if (name === 'mobile') await page.locator('#interact').tap();
    else await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await page.evaluate(() => dynamicFloorId), 'f12');
    assert(Math.abs(await page.evaluate(() => body.position.x) - 3728) < 1, 'Return beside the original corridor door');
  }
  await page.evaluate(() => performFloorChange('f17-restroom', null, 'exit'));
  assert.equal(await page.evaluate(() => currentDoors.find(door => door.key === 'exit').x), 185, '17F exit is unchanged');
  assert.deepEqual(errors, []);
  console.log('PASS: 12F restroom door art, sink clearance, desktop/mobile entry and exit, 17F position');
} finally {
  await browser.close();
}
