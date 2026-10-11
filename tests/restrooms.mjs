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
        const room = floorById.get(floorId(floor)).rooms.find(room => room.target === `${floorId(floor)}-restroom`);
        return { x: door.x, width: door.width, y: door.y, roomX: room.x, roomWidth: room.width };
      }, floor);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 화장실 들어가기');
      if (mobile) await page.locator('#interact').tap();
      else await page.keyboard.press('e');
      await finishSceneTransition(page);
      const exit = await page.evaluate(() => {
        const door = currentDoors.find(door => door.key === 'exit');
        const config = floorById.get(dynamicFloorId);
        const bin = config.props.find(prop => prop.file === 'restroom-bin');
        return { x: door.x, y: door.y, width: door.width, style: door.style, image: getComputedStyle(door.element).backgroundImage,
          configX: config.exitX, configWidth: config.exitWidth, roomWidth: config.width,
          mirrorLeft: config.fixtures[0].outline[0], binLeft: bin.x - bin.worldWidth / 2,
          padding: config.leftWallExtension || 0, background: config.backgroundImage, playerX: body.position.x };
      });
      assert.deepEqual([exit.x, exit.y, exit.width, exit.style], [exit.configX, front.y, exit.configWidth, 'restroom-exit'], `${floor}F interior door follows the room geometry`);
      const outsideRatio = (front.x - front.roomX) / (front.roomWidth - front.width);
      const expectedX = 32 + outsideRatio * (exit.roomWidth - 64 - exit.width);
      assert(Math.abs(exit.x - expectedX) <= 1, `${floor}F has the same wall space beside the door inside and outside`);
      assert.equal(exit.x, 185 + exit.padding, `${floor}F door moves with the original room artwork`);
      assert.equal(exit.mirrorLeft, 411 + exit.padding, `${floor}F mirror outline moves with the original room artwork`);
      if (exit.padding) {
        assert.equal(exit.background.left, exit.padding);
        assert.equal(exit.background.width, 1800, 'The room artwork keeps its original scale');
      } else assert.equal(exit.roomWidth, 1800);
      assert(exit.x + exit.width < Math.min(exit.mirrorLeft, exit.binLeft), `${floor}F door clears mirror, sinks and bin`);
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
  console.log(`PASS: ${floors.length} floors, ${visits} restroom round trips, matching wall space, visible doors, fixture clearance, keyboard/touch`);
} finally {
  await browser.close();
}
