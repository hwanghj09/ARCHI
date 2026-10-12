import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { interactionMessage, finishSceneTransition } from './scene-transition.mjs';
import { assertMirroredDoor, exitDoor, roomFront, worldWidth } from './room-geometry.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-25T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
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
  const jump = async key => {
    await page.keyboard.down(key);
    await page.keyboard.press('Space');
    await page.clock.runFor(1300);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const jumpFloor = async floor => {
    await page.selectOption('#debug-floor-select', floor);
    await page.locator('#debug-floor button').click();
    await finishSceneTransition(page);
    await page.clock.runFor(100);
  };
  const capture = name => page.screenshot({ path: `.local/floor15-art-${name}.png` });
  const heights = { 'research-workstation.png': [231, 120], 'research-board.png': [229, 162],
    'gpu-transfer-cart.png': [240, 94], 'research-director-desk.png': [206, 120] };
  const checkArt = async () => {
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'research');
    const props = await page.locator('#dynamic-scene .floor-prop img').evaluateAll(async images => {
      await Promise.all(images.map(img => img.decode()));
      return images.map(img => ({ file: img.src.split('/').pop(), width: parseFloat(img.parentElement.style.width),
        top: parseFloat(img.parentElement.style.top), naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }));
    });
    for (const prop of props) {
      const scale = prop.width / prop.naturalWidth;
      assert(Math.abs(prop.top + (prop.naturalHeight - 8) * scale - 570) < .01, 'Furniture rests on floor');
      if (heights[prop.file]) {
        const [opaque, expected] = heights[prop.file];
        assert(Math.abs(opaque * scale - expected) < 2, prop.file + ' is at human scale');
      }
    }
    const doors = await page.locator('#dynamic-scene .room-door:is(.research,.seminar,.director)').evaluateAll(async elements =>
      Promise.all(elements.map(async el => {
        const style = getComputedStyle(el);
        const source = style.backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
        const img = new Image();
        img.src = source;
        await img.decode();
        return { kind: [...el.classList].find(name => ['research', 'seminar', 'director'].includes(name)),
          source, size: style.backgroundSize, bottom: parseFloat(el.style.top) + parseFloat(el.style.height) };
      })));
    assert(doors.length > 0);
    for (const door of doors) {
      assert(door.source.endsWith('/floor15/' + door.kind + '-door.png'));
      assert.equal(door.size, '100% 100%');
      assert.equal(door.bottom, 570);
    }
    return props;
  };
  const enter = async name => {
    const front = await roomFront(page, name);
    await use(front.door.x + front.door.width / 2);
    assert.equal(await page.locator('header span').textContent(), '15F · ' + name);
    const door = await exitDoor(page);
    assertMirroredDoor(front.room, front.door, await worldWidth(page), door, name);
    return door.x + door.width / 2;
  };
  // Collect the team card and authenticate the floor before walking through its gates.
  await page.evaluate(() => {
    performFloorChange('f16-cafe', null, 'exit');
    Body.setPosition(body, { x: 950, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    updateInteraction(); render();
  });
  await page.keyboard.press('e');
  assert.match(await interactionMessage(page), /조현아/);
  assert(await page.evaluate(() => collectedItems.has('f16-badge')));
  await jumpFloor('f15');
  await page.evaluate(() => {
    Body.setPosition(body, { x: 1826, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    updateInteraction(); render();
  });
  await page.keyboard.press('e');
  assert.match(await interactionMessage(page), /조현아 팀장 사원증 인증 완료/);
  await page.clock.runFor(500);
  assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2);
  assert((await checkArt()).some(p => p.file === 'research-news-board.png'));
  await use(4730);
  assert.match(await interactionMessage(page), /야간 사용 권한/);
  await walk(650);
  await capture('doors');

  const labExit = await enter('연구실');
  assert.equal((await checkArt()).filter(p => p.file === 'research-workstation.png').length, 6);
  await use(1400);
  assert.match(await interactionMessage(page), /사용률은 100%/);
  await capture('workstations');
  await use(2450);
  assert.match(await interactionMessage(page), /일부러 틀릴/);
  await capture('research-board');
  await use(labExit);

  const seminarExit = await enter('세미나실');
  assert((await checkArt()).some(p => p.file === 'gpu-transfer-cart.png'));
  const crates = await page.locator('#dynamic-scene > .crate').evaluateAll(async elements =>
    Promise.all(elements.map(async el => {
      const img = new Image();
      img.src = getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/)[1];
      await img.decode();
      return [parseFloat(el.style.width), parseFloat(el.style.height), img.src.split('/').pop()];
    })));
  assert.deepEqual(crates, [[110, 50, 'gpu-shipping-crate.png'], [90, 60, 'gpu-shipping-crate.png']]);
  await use(420);
  assert.match(await interactionMessage(page), /B2 서버실 이관 2차분/);
  await walk(730);
  await page.keyboard.down('d');
  await page.clock.runFor(500);
  await page.keyboard.up('d');
  assert(await position() < 742, 'Crate blocks walking');
  await capture('gpu-cart-crate');
  await walk(680);
  await jump('d');
  assert(await position() > 890, 'Jump clears first crate');
  await walk(1280);
  await jump('d');
  assert(await position() > 1470, 'Jump clears second crate');
  await use(1800);
  assert.match(await interactionMessage(page), /승인: 대기/);
  await capture('seminar');
  await walk(1520);
  await jump('a');
  await walk(930);
  await jump('a');
  await use(seminarExit);

  const directorExit = await enter('연구본부장실');
  assert((await checkArt()).some(p => p.file === 'research-director-desk.png'));
  await use(900);
  assert.match(await interactionMessage(page), /자동 승인/);
  await capture('director');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await checkArt();
  await capture('mobile');
  await use(directorExit);
  assert.equal(await page.locator('header span').textContent(), '15F · 연구본부');
  await page.setViewportSize({ width: 1280, height: 720 });
  await jumpFloor('f14');
  assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'dataset');
  assert.equal(await page.locator('#dynamic-scene').evaluate(el => getComputedStyle(el.querySelector('.room-door')).backgroundImage.includes('/floor15/')), false);
  assert.deepEqual(errors, []);
  console.log('PASS 15F sprites: assets, scale, floor contact, unique doors, room links, clues, crate collision/jumps and mobile');
} finally {
  await browser.close();
}

