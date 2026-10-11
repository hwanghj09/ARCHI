import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await page.evaluate(() => {
    sanity = 100; updateSanity(0);
    solarEnabled = true;
    solarPoweredFloors = Array.from({ length: 17 }, (_, i) => i + 1);
    collectedItems.add('f7-release');
  });

  // Compare the same furniture, rather than imposing one size on unlike objects.
  const furniture = await page.evaluate(() => {
    const manager = floorById.get('f17-manager');
    return manager.props.map(prop => {
      const peers = [...floorById.values()].filter(config => config !== manager)
        .flatMap(config => config.props || []).filter(other => other.file === prop.file)
        .map(other => other.worldWidth).sort((a, b) => a - b);
      return { file: prop.file, width: prop.worldWidth, typical: peers[Math.floor(peers.length / 2)] };
    });
  });
  for (const prop of furniture) {
    assert(prop.typical > 0);
    assert(prop.width / prop.typical >= .75 && prop.width / prop.typical <= 1.4,
      `${prop.file}: ordinary furniture in the manager room has the same scale as other rooms`);
  }

  // Opaque sprite bounds matter: transparent sheet padding can overlap safely.
  for (const id of ['f1-harmony', 'f1-clinic', 'f7-test', 'f7-verify']) {
    const geometry = await page.evaluate(async id => {
      performFloorChange(id, 0, 'exit');
      await Promise.all([...dynamicScene.querySelectorAll('img')].map(img => img.decode()));
      const door = currentDoors.find(door => door.key === 'exit');
      const config = floorById.get(id);
      const props = [...dynamicScene.querySelectorAll('.floor-prop')].map((element, index) => {
        const prop = config.props[index];
        return { name: prop.file, rect: spriteOutline(element.firstChild.getAttribute('src'),
          parseFloat(element.style.left), parseFloat(element.style.top),
          parseFloat(element.style.width), parseFloat(element.style.height)) };
      });
      const chair = currentDoors.find(door => door.name === '인터페이스 의자');
      if (chair) props.push({ name: chair.name, rect: outlineBox(chair) });
      return { exit: outlineBox(door), props, seats: config.fixtures?.find(fixture => fixture.style === 'stall-rows') };
    }, id);
    const [x, y, w, h] = geometry.exit;
    for (const prop of geometry.props) {
      const [px, py, pw, ph] = prop.rect;
      const overlapX = Math.min(x + w, px + pw) - Math.max(x, px);
      const overlapY = Math.min(y + h, py + ph) - Math.max(y, py);
      assert(overlapX <= 1 || overlapY <= 1, `${id}: ${prop.name} leaves the exit visible`);
    }
    if (geometry.seats) assert(geometry.seats.x + geometry.seats.width < x, 'Hall seating ends before the exit');
  }

  const exits = await page.evaluate(() => [...floorById.values()]
    .filter(config => config.exitWall || ['f2-lounge', 'f4-meeting', 'f6-meeting', 'f9-sales'].includes(config.id))
    .map(config => config.id));
  assert.equal(exits.length, 20, 'Every repaired painted-room exit is exercised');
  let trips = 0;
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const id of exits) {
      const geometry = await page.evaluate(async id => {
        performFloorChange(id, 0, 'exit');
        const config = floorById.get(id);
        const exit = currentDoors.find(door => door.key === 'exit');
        const outside = floorById.get(config.parent).rooms.find(room => room.target === id);
        const wall = dynamicScene.querySelector('.floor-exit-wall');
        const rect = wall && { x: parseFloat(wall.style.left), y: parseFloat(wall.style.top),
          w: parseFloat(wall.style.width), h: parseFloat(wall.style.height) };
        if (wall) {
          const image = new Image();
          image.src = getComputedStyle(wall).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
          await image.decode();
        }
        Body.setPosition(body, { x: exit.x + exit.width / 2, y: floorY - 81 });
        Body.setVelocity(body, { x: 0, y: 0 });
        grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
        return { rect, hasWall: Boolean(config.exitWall), exit: { x: exit.x, y: exit.y, w: exit.width },
          width: config.width, floorY, parent: config.parent, outsideX: outside.doorX,
          clues: (config.fixtures || []).filter(fixture => fixture.message) };
      }, id);
      if (geometry.hasWall) {
        const r = geometry.rect;
        assert(r && r.x >= 32 && r.x + r.w <= geometry.width - 32, `${id}: wall stays inside the room`);
        assert.equal(r.y + r.h, geometry.floorY, `${id}: wall meets the walking floor`);
        assert(r.x < geometry.exit.x && r.x + r.w > geometry.exit.x + geometry.exit.w,
          `${id}: furniture is cleared beside both edges of the door`);
        for (const clue of geometry.clues) {
          const overlapX = Math.min(r.x + r.w, clue.x + clue.width) - Math.max(r.x, clue.x);
          const overlapY = Math.min(r.y + r.h, clue.y + (clue.height ?? geometry.floorY - clue.y)) - Math.max(r.y, clue.y);
          assert(overlapX <= 0 || overlapY <= 0, `${id}: exit wall preserves ${clue.name}`);
        }
      } else assert.equal(geometry.rect, null, `${id}: clear aisles use their original background`);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기', `${id}: aligned exit interaction`);
      if (viewport.width === 390) await page.locator('#interact').tap();
      else await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await page.evaluate(() => dynamicFloorId), geometry.parent);
      assert(Math.abs(await page.evaluate(() => body.position.x) - geometry.outsideX - 40) < 1,
        `${id}: returns to the original corridor doorway`);
      trips++;
    }
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: furniture scale, opaque doorway clearance, ${trips} keyboard/touch exit trips, readable clues and floor alignment`);
} finally {
  await browser.close();
}
