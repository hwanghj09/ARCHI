import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';
import { assertMirroredDoor, exitDoor, roomFront, worldWidth } from './room-geometry.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-25T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-09-25T00:01:00Z'));
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const walk = async x => {
    const start = await position();
    const key = x < start ? 'a' : 'd';
    await page.keyboard.down(key);
    await page.clock.runFor(Math.abs(x - start) / 200 * 1000);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const use = async x => {
    await walk(x);
    await page.keyboard.press('e');
    await finishSceneTransition(page);
  };
  const jumpFloor = async floor => {
    await page.selectOption('#debug-floor-select', floor);
    await page.locator('#debug-floor button').click();
    await finishSceneTransition(page);
    await page.clock.runFor(100);
  };
  const ground = {
    'amenity-corridor-left.png': 562, 'amenity-corridor-core.png': 601, 'amenity-corridor-right.png': 563,
    'amenity-kitchen-dining.png': 571, 'amenity-kitchen-service.png': 591,
    'amenity-cu-interior.png': 602, 'amenity-cafe-interior.png': 596,
  };
  const doorFiles = { cafeteria: 'cafeteria-door.png', shutter: 'cu-shutter-states.png',
    metal: 'restroom-door.png', cafe: 'cafe-door.png', backdoor: 'service-door.png' };
  const checkDoors = async () => {
    for (const door of await page.locator('#dynamic-scene .room-door').all()) {
      const state = await door.evaluate(async el => {
        const style = getComputedStyle(el);
        const source = style.backgroundImage.match(/url\("?([^"\)]+)"?\)/)?.[1];
        if (source) {
          const image = new Image();
          image.src = source;
          await image.decode();
        }
        return { classes: [...el.classList], source, visible: style.visibility, size: style.backgroundSize,
          position: style.backgroundPositionX, unlocked: el.dataset.unlocked,
          bottom: parseFloat(el.style.top) + parseFloat(el.style.height) };
      });
      const kind = state.classes.find(name => doorFiles[name]);
      assert(state.source?.endsWith(doorFiles[kind]), `${kind} uses its own loaded door artwork`);
      assert.equal(state.visible, 'visible');
      assert.equal(state.bottom, 570, 'Door threshold stays at the collision floor');
      assert.equal(state.size, kind === 'shutter' ? '200% 100%' : '100% 100%');
      if (kind === 'shutter') assert.equal(state.position, state.unlocked === 'true' ? '100%' : '0px');
    }
  };
  const checkArt = async count => {
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'walls');
    await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    const panels = await page.locator('.floor-background').evaluateAll(images => images.map(img => ({
      file: img.src.split('/').pop(), left: parseFloat(img.style.left), width: parseFloat(img.style.width),
      top: parseFloat(img.style.top), height: parseFloat(img.style.height), natural: [img.naturalWidth, img.naturalHeight],
    })));
    assert.equal(panels.length, count);
    let edge = 0;
    for (const panel of panels) {
      assert.deepEqual(panel.natural, [1983, 793], 'Generated image loads at its original resolution');
      assert.equal(panel.left, edge, 'Background panels leave no horizontal gaps');
      edge += panel.width;
      assert(Math.abs(panel.top + ground[panel.file] * panel.height / 793 - 570) < .01, 'Painted floor meets collision floor');
    }
    assert.equal(edge, await worldWidth(page));
    assert.equal(await page.locator('#dynamic-scene > .floor').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    await checkDoors();
  };
  const capture = name => page.screenshot({ path: `.local/floor16-art-${name}.png` });
  await jumpFloor('f16');
  await checkArt(3);
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'false');
  await walk(620);
  await capture('kitchen-door');
  await walk(2400);
  await capture('elevators');
  await walk(1100);
  await capture('storefront');
  await use(1635);
  assert.equal(await page.locator('header span').textContent(), '16F · 편의시설', 'CU is still locked from the corridor');
  const front = await roomFront(page, 'The Kitchen');
  await use(594);
  await checkArt(2);
  assertMirroredDoor(front.room, front.door, await worldWidth(page), await exitDoor(page), 'Kitchen');
  await walk(750);
  await capture('dining');
  await use(2330);
  assert.match(await page.locator('#interaction-status').textContent(), /02:00~05:00/);
  await capture('kitchen');
  await walk(3410);
  await capture('service-door');
  await use(3515);
  assert.equal(await page.locator('header span').textContent(), '16F · CU 편의점');
  await checkArt(1);
  await use(470);
  assert.match(await page.locator('#interaction-status').textContent(), /새벽 전원 차단/);
  await capture('refrigerators');
  await use(1150);
  assert.match(await page.locator('#interaction-status').textContent(), /23:47/);
  await capture('cu');
  const exit = await exitDoor(page);
  await use(exit.x + exit.width / 2);
  assert.equal(await page.locator('.room-door.shutter').getAttribute('aria-label'), 'CU 편의점 출입문');
  await checkDoors();
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'true');
  await capture('cu-unlocked');
  await use(1635);
  await checkDoors();
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'true', 'Raised shutter persists inside');
  await use(exit.x + exit.width / 2);
  await walk(4440);
  await capture('cafe-front');
  await use(4406);
  await checkArt(1);
  await use(1330);
  assert.match(await page.locator('#interaction-status').textContent(), /먼저 인사/);
  await capture('cafe');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await checkArt(1);
  await capture('mobile');
  await page.setViewportSize({ width: 1280, height: 720 });
  await jumpFloor('f16');
  await walk(3684);
  await checkDoors();
  await capture('restroom-door');
  await use(3684);
  assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'true', 'Legacy single-image restroom still renders');
  await page.locator('.floor-background').evaluate(img => img.decode());
  await checkDoors();
  assert.equal(await page.locator('.floor-background').count(), 1);
  await jumpFloor('f15');
  assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'false', 'CSS floors retain their original renderer');
  assert.equal(await page.locator('.floor-background').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS 16F backgrounds: image loading, floor alignment, doors, room links, clues, mobile and legacy rendering');
} finally {
  await browser.close();
}
