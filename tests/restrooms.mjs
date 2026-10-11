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
  const floors = await page.evaluate(() => ALL_FLOORS.map(config => config.floor));
  assert.equal(floors.length, 19, 'B2 through 17F all have restrooms');
  let visits = 0;
  for (const mobile of [false, true]) {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 });
    for (const floor of mobile ? [7, 1, 12, 17] : floors) {
      const front = await page.evaluate(floor => {
        collectedItems.add(`f${floor}-access`);
        performFloorChange(floorId(floor), null, `room:${floorId(floor)}-restroom`);
        const door = currentDoors.find(door => door.target === `${floorId(floor)}-restroom`);
        Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
        Body.setVelocity(body, { x: 0, y: 0 });
        grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
        return { x: door.x, width: door.width, y: door.y };
      }, floor);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 화장실 들어가기');
      if (mobile) await page.locator('#interact').tap();
      else await page.keyboard.press('e');
      await finishSceneTransition(page);
      const exit = await page.evaluate(() => {
        const door = currentDoors.find(door => door.key === 'exit');
        return { x: door.x, y: door.y, width: door.width, style: door.style, image: getComputedStyle(door.element).backgroundImage,
          mirrorLeft: floorById.get(dynamicFloorId).fixtures[0].outline[0], playerX: body.position.x };
      });
      assert.deepEqual([exit.x, exit.y, exit.width, exit.style], [185, front.y, front.width, 'restroom-exit'], `${floor}F exit`);
      assert(exit.x + exit.width < Math.min(exit.mirrorLeft, 380 - 55 / 2), `${floor}F door clears mirror, sinks and bin`);
      assert(Math.abs(exit.playerX - exit.x - 40) < 1, `${floor}F entry spawn`);
      assert.match(exit.image, /assets\/objects\/floor16\/restroom-door\.png/);
      assert(await page.locator('.room-door.restroom-exit').isVisible());
      await page.evaluate(async image => {
        const img = new Image(); img.src = image.match(/url\(["']?(.*?)["']?\)/)[1]; await img.decode();
      }, exit.image);
      if ([1, 7, 12, 17].includes(floor)) await page.screenshot({ path: `.local/restroom-${floor}-${mobile ? 'mobile' : 'desktop'}.png` });
      await page.clock.runFor(100);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기');
      if (mobile) await page.locator('#interact').tap();
      else await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await page.evaluate(() => currentSceneFloor), floor);
      assert.equal(await page.evaluate(() => world.dataset.room), floor === 17 ? 'corridor' : 'dynamic');
      assert(Math.abs(await page.evaluate(() => body.position.x) - front.x - 40) < 1, `${floor}F returns to the original corridor door`);
      visits++;
    }
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${floors.length} floors, ${visits} restroom round trips, visible doors, fixture clearance, keyboard/touch`);
} finally {
  await browser.close();
}
