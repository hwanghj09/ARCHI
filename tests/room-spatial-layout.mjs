import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { assertMirroredDoor } from './room-geometry.mjs';
import { finishSceneTransition } from './scene-transition.mjs';

const repaired = ['f1-harmony', 'f1-vision', 'f1-clinic', 'f2-lounge', 'f4-meeting', 'f6-meeting',
  'f7-vip', 'f7-test', 'f7-verify', 'f9-sales', 'f12-dev', 'f12-eval', 'f12-lead',
  'f1-restroom', 'f7-restroom', 'f12-restroom'];
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
  const entries = await page.evaluate(() => {
    sanity = 100; updateSanity(0);
    solarEnabled = true;
    solarPoweredFloors = Array.from({ length: 17 }, (_, i) => i + 1);
    collectedItems.add('b1-cctv-live');
    const entries = [...floorById.values()].flatMap(parent => (parent.rooms || [])
      .filter(front => floorById.get(front.target)?.interior)
      .map(front => ({ id: front.target, parent: parent.id, name: front.name,
        front: { x: front.x, width: front.width }, corridorWidth: parent.width ?? BUILDING_CORE.width })));
    for (const config of floorById.values()) {
      if (config.exitLock) collectedItems.add(config.exitLock.until);
      for (const front of config.rooms || []) if (front.unlockedBy) collectedItems.add(front.unlockedBy);
      if (!config.interior) collectedItems.add(`f${config.floor}-access`);
    }
    return entries;
  });
  assert(entries.length >= 74, 'Every registered corridor room is included');
  for (const entry of entries) {
    assert(entry.front.x >= 0 && entry.front.x + entry.front.width <= entry.corridorWidth,
      `${entry.id}: room frontage stays inside the corridor`);
    for (const neighbour of entries.filter(other => other.parent === entry.parent && other.id !== entry.id)) {
      const overlap = Math.min(entry.front.x + entry.front.width, neighbour.front.x + neighbour.front.width) -
        Math.max(entry.front.x, neighbour.front.x);
      assert(overlap <= 0, `${entry.id} and ${neighbour.id}: separate rooms occupy separate corridor space`);
    }
    // Check assembled doors, including authored exitX values, rather than exempting painted rooms.
    const geometry = await page.evaluate(({ id, parent }) => {
      const box = door => ({ x: parseFloat(door.element.style.left), y: parseFloat(door.element.style.top),
        width: parseFloat(door.element.style.width) });
      performFloorChange(parent, null, `room:${id}`);
      const outside = box(currentDoors.find(door => door.key === `room:${id}`));
      performFloorChange(id, null, 'exit');
      const exit = currentDoors.find(door => door.key === 'exit');
      const config = floorById.get(id);
      const rect = element => element && [parseFloat(element.style.left), parseFloat(element.style.top),
        parseFloat(element.style.width), parseFloat(element.style.height)];
      const crop = part => {
        const element = dynamicScene.querySelector(`.floor-art-crop[data-part="${part}"]`);
        return element && { rect: rect(element), image: rect(element.firstChild),
          source: element.firstChild.getAttribute('src'), signs: [...element.querySelectorAll('.luminous-sign')].map(rect) };
      };
      const props = config.exitArt && [...dynamicScene.querySelectorAll('.floor-prop')].map((element, i) => ({
        name: config.props[i].file, rect: spriteOutline(element.firstChild.getAttribute('src'), ...rect(element)) }));
      const chair = currentDoors.find(door => door.name === '인터페이스 의자');
      if (props && chair) props.push({ name: chair.name, rect: outlineBox(chair) });
      return { outside, inside: box(exit), width: worldWidth, outline: outlineBox(exit),
        art: config.exitArt, originalOutline: config.exitOutline,
        signRects: config.exitArt && luminousSigns[config.backgroundImage.src.replace(/^assets\/background\/|\.png$/g, '')]?.[2],
        unmovedSigns: dynamicScene.querySelectorAll(':scope > .luminous-sign').length,
        props,
        moved: crop('exit-art'), covered: crop('old-exit-wall'),
        background: rect(dynamicScene.querySelector(':scope > .floor-background')),
        backgroundSource: dynamicScene.querySelector(':scope > .floor-background')?.getAttribute('src'),
        extension: config.leftWallExtension,
        wall: [...dynamicScene.querySelectorAll('.floor-art-crop:not([data-part])')].map(rect),
        shifted: config.leftWallExtension && {
          props: config.props.map((prop, i) => prop.x - restroomInterior.props[i].x),
          fixtures: config.fixtures.map((fixture, i) => fixture.x - restroomInterior.fixtures[i].x),
          outlines: config.fixtures.filter(fixture => fixture.outline).map(fixture =>
            fixture.outline[0] - restroomInterior.fixtures.find(original => original.name === fixture.name).outline[0]) },
        floorY };
    }, entry);
    assert(geometry.outside.x >= entry.front.x && geometry.outside.x + geometry.outside.width <= entry.front.x + entry.front.width,
      `${entry.id}: corridor doorway belongs to its room`);
    assert(geometry.outside.x >= 32 && geometry.outside.x + geometry.outside.width <= entry.corridorWidth - 32,
      `${entry.id}: corridor doorway stays between the outer walls`);
    assert(geometry.inside.x >= 32 && geometry.inside.x + geometry.inside.width <= geometry.width - 32,
      `${entry.id}: interior doorway stays inside its walls`);
    assertMirroredDoor(entry.front, geometry.outside, geometry.width, geometry.inside, entry.id);
    if (geometry.art) {
      const { crop, fill, x } = geometry.art;
      const offset = geometry.inside.x - x;
      assert.deepEqual(geometry.covered.rect, crop, `${entry.id}: old painted doorway is covered`);
      assert.deepEqual(geometry.covered.image.slice(0, 2), fill.map(value => -value), `${entry.id}: fill uses the approved wall`);
      assert.deepEqual(geometry.moved.rect, [crop[0] + offset, ...crop.slice(1)], `${entry.id}: painted door follows its interaction position`);
      assert.deepEqual(geometry.moved.image.slice(0, 2), [-crop[0], -crop[1]], `${entry.id}: relocated art contains the original door`);
      assert.deepEqual(geometry.moved.image.slice(2), geometry.background.slice(2), `${entry.id}: moving the door preserves image scale`);
      assert.equal(geometry.moved.source, geometry.backgroundSource, `${entry.id}: door uses the original room artwork`);
      assert.equal(geometry.unmovedSigns, 0, `${entry.id}: no luminous exit sign remains at the old doorway`);
      if (geometry.signRects) assert.deepEqual(geometry.moved.signs,
        geometry.signRects.map(([x, y, width, height]) => [x - crop[0], y - crop[1], width, height]),
        `${entry.id}: emergency exit signs move with the door artwork`);
      assert.deepEqual(geometry.outline, [geometry.originalOutline[0] + offset, ...geometry.originalOutline.slice(1)],
        `${entry.id}: highlight follows the painted door`);
      const [artX, artY, artWidth, artHeight] = geometry.moved.rect;
      const [outlineX, outlineY, outlineWidth, outlineHeight] = geometry.outline;
      assert(artX <= outlineX && artX + artWidth >= outlineX + outlineWidth &&
        artY <= outlineY && artY + artHeight >= outlineY + outlineHeight,
      `${entry.id}: the visible door crop contains the painted door highlight`);
      for (const prop of geometry.props) {
        const [x, y, width, height] = prop.rect;
        const overlapX = Math.min(outlineX + outlineWidth, x + width) - Math.max(outlineX, x);
        const overlapY = Math.min(outlineY + outlineHeight, y + height) - Math.max(outlineY, y);
        assert(overlapX <= 1 || overlapY <= 1, `${entry.id}: ${prop.name} leaves the relocated painted door clear`);
      }
    }
    if (geometry.extension) {
      assert.deepEqual(geometry.background.slice(0, 3), [geometry.extension, 0, 1800], `${entry.id}: bathroom art moves without stretching`);
      let edge = 0;
      for (const [x, y, width, height] of geometry.wall) {
        assert.equal(x, edge, `${entry.id}: extended wall has no gaps`);
        assert.equal(y, 0); assert(height >= geometry.floorY, `${entry.id}: extended wall reaches the walking floor`);
        edge += width;
      }
      assert.equal(edge, geometry.extension, `${entry.id}: visible wall reaches the original room art`);
      for (const offset of Object.values(geometry.shifted).flat()) {
        assert.equal(offset, geometry.extension, `${entry.id}: furniture, inspection and highlight move with the bathroom`);
      }
    }
  }
  const office = await page.evaluate(() => ({ outside: { x: officeDoors[0].x, width: officeDoors[0].width },
    inside: { x: officeDoors[1].x, width: officeDoors[1].width }, width: officeWidth }));
  assertMirroredDoor({ x: 32, width: 1523 }, office.outside, office.width, office.inside, '17F initial office');
  const narrowerOutside = { x: 32, width: 500, doorX: 390, doorWidth: 100 };
  const adjustedExit = await page.evaluate(front => exitDoorX(front, 1000, 145), narrowerOutside);
  assertMirroredDoor(narrowerOutside, { x: 390, width: 100 }, 1000, { x: adjustedExit, width: 145 },
    'Corridor and interior door artwork with different widths');

  let trips = 0;
  for (const mobile of [false, true]) {
    await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 });
    for (const id of [...repaired, 'f3-cs', 'f16-kitchen']) {
      const entry = entries.find(entry => entry.id === id);
      assert(entry, `${id}: round-trip fixture exists`);
      const front = await page.evaluate(({ id, parent }) => {
        performFloorChange(parent, null, `room:${id}`);
        const door = currentDoors.find(door => door.key === `room:${id}`);
        Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
        Body.setVelocity(body, { x: 0, y: 0 });
        grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
        return { x: door.x, y: door.y, width: door.width, key: nearbyDoor?.key };
      }, entry);
      assert.equal(front.key, `room:${id}`, `${id}: visible corridor doorway selects its own room`);
      assert.equal(await page.locator('#interaction-hint').textContent(), `E · ${entry.name} 들어가기`);
      if (mobile) await page.locator('#interact').tap();
      else await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await page.evaluate(() => dynamicFloorId), id);
      const inside = await page.evaluate(async () => {
        await Promise.all([...dynamicScene.querySelectorAll('img')].map(image => image.decode()));
        const exit = currentDoors.find(door => door.key === 'exit');
        return { x: exit.x, y: exit.y, width: exit.width, worldWidth, playerX: body.position.x,
          facing, key: nearbyDoor?.key, connected: exit.element.isConnected };
      });
      assertMirroredDoor(entry.front, front, inside.worldWidth, inside, `${id} ${mobile ? 'touch' : 'keyboard'} entry`);
      assert(Math.abs(inside.playerX - inside.x - 40) < 1, `${id}: entry places the player at the same doorway`);
      assert.equal(inside.facing, inside.x < inside.worldWidth / 2 ? 1 : -1, `${id}: player faces into the room`);
      assert(inside.connected, `${id}: interior exit has a scene element`);
      assert.equal(inside.key, 'exit', `${id}: entry leaves the return doorway reachable`);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기');
      if (mobile) await page.locator('#interact').tap();
      else await page.keyboard.press('e');
      await finishSceneTransition(page);
      const returned = await page.evaluate(() => ({ id: dynamicFloorId, x: body.position.x }));
      assert.equal(returned.id, entry.parent);
      assert(Math.abs(returned.x - front.x - 40) < 1, `${id}: returns to the corridor door used to enter`);
      trips++;
    }
  }
  for (const id of ['f7-vip', 'f1-restroom', 'f7-restroom', 'f12-restroom']) {
    const states = await page.evaluate(async id => {
      buildingBlackout = true;
      setSolarPower(false);
      performFloorChange(id, null, 'exit');
      const images = [...dynamicScene.querySelectorAll('img[data-lit-src]')];
      const geometry = () => images.map(image => image.getAttribute('style'));
      await Promise.all(images.map(image => image.decode()));
      const off = images.every(image => image.getAttribute('src') === image.dataset.unlitSrc);
      const before = geometry();
      setSolarPower(true);
      powerGrid.querySelector(`[data-floor="${currentSceneFloor}"]`).click();
      await Promise.all(images.map(image => image.decode()));
      const on = images.every(image => image.getAttribute('src') === image.dataset.litSrc);
      return { off, on, count: images.length, before, after: geometry() };
    }, id);
    assert(states.count >= 3, `${id}: original art and wall/door crops participate in power changes`);
    assert(states.off && states.on, `${id}: cropped art follows the floor's actual power switch`);
    assert.deepEqual(states.after, states.before, `${id}: power changes preserve the assembled room geometry`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${entries.length + 1} room door ratios, valid separate frontages, ${trips} keyboard/touch round trips, arrival direction and cropped art power states`);
} finally {
  await browser.close();
}
