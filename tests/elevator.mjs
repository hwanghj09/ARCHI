import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition, reachInitialCorridor } from './scene-transition.mjs';
import { assertMirroredDoor, exitDoor, roomFront, worldWidth } from './room-geometry.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-09-20T00:01:00Z'));
  await page.clock.runFor(100);
  await reachInitialCorridor(page);
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.clock.runFor(ms);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  await hold('d', 8200);
  await page.keyboard.press('e');
  await page.clock.runFor(19400);
  await page.keyboard.press('e');
  const cabin = page.locator('#elevator-cabin');
  const fade = page.locator('#room-transition');
  assert(await cabin.isHidden(), 'Cabin must not appear before fade-out');
  await page.clock.runFor(150);
  assert(await cabin.isHidden());
  const partialOpacity = Number(await fade.evaluate(el => getComputedStyle(el).opacity));
  assert(partialOpacity > 0 && partialOpacity < 1, 'Fade must animate through partial black');
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  assert.equal(await fade.getAttribute('data-phase'), 'out', 'Repeated input cannot restart the transition');
  for (let i = 0; i < 30 && await fade.getAttribute('data-phase') !== 'black'; i++) await page.clock.runFor(16);
  assert.equal(await fade.getAttribute('data-phase'), 'black');
  assert.equal(await fade.evaluate(el => getComputedStyle(el).opacity), '1');
  assert(await cabin.isHidden(), 'Old scene remains until completely black');
  await page.screenshot({ path: '.local/transition-black.png' });
  await page.clock.runFor(17);
  assert(await cabin.isVisible(), 'Scene switches behind the black overlay');
  assert.equal(await fade.evaluate(el => getComputedStyle(el).opacity), '1');
  assert(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).id === 'room-transition'),
    'Black layer covers the cabin and intercepts pointer input');
  assert(await cabin.evaluate(el => el.inert));
  await page.locator('[data-floor="16"]').dispatchEvent('click');
  assert.equal(await page.locator('[data-floor="16"]').getAttribute('aria-pressed'), 'false', 'Floor input blocked during fade');
  await finishSceneTransition(page);
  assert.equal(await cabin.evaluate(el => el.inert), false);
  assert(await cabin.evaluate(el => document.activeElement === el), 'Focus moves into the cabin after fade-in');
  assert(await cabin.isVisible());
  assert(await page.locator('#stage').evaluate(el => el.inert));
  assert.equal(await page.locator('#cabin-art').evaluate(el => el.naturalWidth), 1536);
  const floorButtons = page.locator('#cabin-floor-buttons button');
  assert.deepEqual(await floorButtons.evaluateAll(els => els.map(el => Number(el.dataset.floor))),
    [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2]);
  for (const button of await floorButtons.all()) {
    if (await button.isDisabled()) continue;
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
  }
  await page.screenshot({ path: '.local/cabin-desktop-open.png' });
  const playerPosition = await page.locator('#player').getAttribute('style');
  await hold('d', 200);
  assert.equal(await page.locator('#player').getAttribute('style'), playerPosition, 'World input is locked inside');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(1200);
  assert.equal(await page.locator('#cabin-scene').getAttribute('data-door'), 'closed');
  await page.keyboard.press('Escape');
  assert(await cabin.isVisible(), 'Cannot exit a closed cabin');
  await page.screenshot({ path: '.local/cabin-desktop-closed.png' });
  await page.locator('#cabin-open').click();
  await page.clock.runFor(1200);
  await page.locator('[data-floor="16"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(300);
  await page.locator('#cabin-open').click();
  await page.clock.runFor(1800);
  assert.equal(await cabin.getAttribute('data-floor'), '17', 'Reopening cancels departure');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(1300);
  assert.equal(await cabin.getAttribute('data-moving'), 'true');
  assert(await page.locator('#cabin-open').isDisabled());
  assert(await page.locator('#cabin-exit').isDisabled());
  await page.keyboard.press('Escape');
  assert(await cabin.isVisible());
  await page.clock.runFor(2400);
  assert.equal(await cabin.getAttribute('data-floor'), '16');
  await page.locator('#cabin-exit').click();
  assert(await cabin.isVisible(), 'Cabin remains visible until departure fade reaches black');
  assert.equal(await page.locator('header span').textContent(), '17F · 00:00');
  await page.clock.runFor(150);
  assert(await cabin.isVisible());
  assert(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).id === 'room-transition'));
  await page.keyboard.press('Escape');
  await finishSceneTransition(page);
  const header = () => page.locator('header span').textContent();
  const near = (actual, expected, message) => assert(Math.abs(actual - expected) < 1, `${message}: ${actual}`);
  const playerX = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const walkTo = async x => {
    const from = await playerX();
    await hold(x < from ? 'a' : 'd', Math.abs(x - from) / 200 * 1000);
  };
  const hint = () => page.locator('#interaction-hint').textContent();
  const inspect = async (x, hintText, message) => {
    await walkTo(x);
    assert.equal(await hint(), hintText);
    await page.keyboard.press('e');
    assert.match(await page.locator('#interaction-status').textContent(), message);
  };
  // Every floor shares the 17F building core: width, three elevators and the stair door never move.
  const checkCore = async () => {
    assert.equal(await page.locator('#world').evaluate(el => el.style.width), '5000px');
    const geometry = els => els.map(el => [parseFloat(el.style.left), parseFloat(el.style.top), parseFloat(el.style.width)]);
    assert.deepEqual(await page.locator('#dynamic-scene .door.elevator').evaluateAll(geometry),
      [[1818, 220, 218], [2148, 220, 214], [2444, 220, 216]], 'Elevators match 17F');
    assert.deepEqual(await page.locator('#dynamic-scene .door:not(.elevator)').evaluateAll(geometry),
      [[2906, 232, 180]], 'Stair door matches 17F');
    assert.equal(await page.locator('#dynamic-scene .floor-number-sign').count(), 1);
    const restroom = await roomFront(page, '화장실');
    assert.deepEqual([restroom.room.x, restroom.room.width, restroom.door], [3556, 726, { x: 3612, y: 210, width: 145 }],
      'Restroom matches 17F');
  };
  // Every floor's restroom is the same room as 17F's, entered from the same door.
  const visitRestroom = async short => {
    const corridorHeader = await header();
    const front = await roomFront(page, '화장실');
    await walkTo(front.door.x + front.door.width / 2);
    assert.equal(await hint(), 'E · 화장실 들어가기');
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await header(), `${short} · 화장실`);
    assert.equal(await worldWidth(page), 1800);
    const exit = await exitDoor(page);
    assert.deepEqual([exit.y, exit.width], [210, 145], 'Restroom exit is the same door');
    assertMirroredDoor(front.room, front.door, 1800, exit, `${short} restroom`);
    await page.clock.runFor(100);
    await walkTo(exit.x + exit.width / 2);
    assert.equal(await hint(), 'E · 복도로 나가기');
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await header(), corridorHeader);
    await page.clock.runFor(100);
    near(await playerX(), front.door.x + 40, 'Return to the restroom door');
  };
  // Measured opaque pixel heights, excluding the transparent canvas padding: [opaque, minPx, maxPx].
  const propHeights = { 'filing-cabinet.png': [496, 135, 145], 'office-desk.png': [239, 112, 122],
    'office-copier.png': [240, 98, 108], 'large-planter.png': [465, 136, 146],
    'rolling-whiteboard.png': [240, 158, 170], 'meeting-table.png': [100, 66, 74],
    'waiting-sofa.png': [162, 75, 84], 'water-cooler.png': [496, 115, 125],
    'kitchenette-counter.png': [202, 118, 128], 'drink-vending-machine.png': [468, 170, 180],
    'staff-lockers.png': [334, 164, 174] };
  const checkHumanScale = async () => {
    const dimensions = await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => images.map(img => ({
      file: img.src.split('/').pop(), width: parseFloat(img.parentElement.style.width),
      top: parseFloat(img.parentElement.style.top), sourceWidth: img.naturalWidth, sourceHeight: img.naturalHeight,
    })));
    for (const prop of dimensions) {
      const [opaqueHeight, min, max] = propHeights[prop.file];
      const scale = prop.width / prop.sourceWidth;
      assert(opaqueHeight * scale >= min && opaqueHeight * scale <= max, `${prop.file} remains at human scale`);
      near(prop.top + (prop.sourceHeight - 8) * scale, 570, `${prop.file} rests on the floor`);
    }
  };
  // Corridor with three enterable rooms around the shared core; ends where it started.
  const checkRoomFloor = async (floor, corridorHeader, rooms) => {
    assert.equal(await header(), corridorHeader);
    await checkCore();
    const checkBackground = async filename => {
      const image = page.locator('#dynamic-scene .floor-background');
      await image.evaluate(img => img.decode());
      assert.match(await image.getAttribute('src'), new RegExp(`/floor16/${filename}\\.png$`));
      assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'true');
      assert.equal(await page.locator('#dynamic-scene > .floor').evaluate(el => getComputedStyle(el).visibility), 'hidden');
      const geometry = await image.evaluate(img => ({ top: parseFloat(img.style.top), height: parseFloat(img.style.height), sourceHeight: img.naturalHeight }));
      const sourceFloor = filename === 'corridor' ? 482 : 504;
      near(geometry.top + sourceFloor * geometry.height / geometry.sourceHeight, 570, 'Artwork meets the physics floor');
    };
    assert.equal(await page.locator('#dynamic-scene .floor-background').count(), 0,
      'The old 3700px corridor art does not match the shared core');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      [...rooms.map(entry => entry.name).reverse(), '화장실'], `${floor}F corridor has three rooms and the restroom`);
    assert.equal(await page.locator('#dynamic-scene .room-door').count(), 4, 'One door per room');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3, 'Corridor rest area');
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await inspect(3300, 'E · 복도 소파 조사', /사원증 줄/);
    await visitRestroom(`${floor}F`);
    await walkTo(2996);
    assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 비상계단 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await page.locator('#world').getAttribute('data-room'), 'dynamic', 'Locked stairs do not change scene');
    assert.equal(await header(), corridorHeader);
    assert.match(await page.locator('#interaction-status').textContent(), /비상계단 문이 잠겨/);
    await page.screenshot({ path: `.local/floor-${floor}.png` });
    const scales = [];
    for (const [index, { name, width, props, inspectX, hintText, message }] of rooms.entries()) {
      const front = await roomFront(page, name);
      const entrance = front.door;
      scales.push(width / front.room.width);
      assert.equal(entrance.y, 360, 'Corridor door matches the painted 210px interior door');
      const doorCenter = entrance.x + entrance.width / 2;
      await walkTo(doorCenter);
      assert.equal(await page.locator('#interaction-hint').textContent(), `E · ${name} 들어가기`);
      await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await header(), `${floor}F · ${name}`);
      await checkBackground(['pantry', 'meeting', 'office'][index]);
      assert.equal(await worldWidth(page), width);
      const exit = await exitDoor(page);
      assert.deepEqual(exit, { x: 68, y: 360, width: 144 }, 'Exit covers the door painted in the background');
      assertMirroredDoor(front.room, entrance, width, exit, name);
      assert.equal(await page.locator('#dynamic-scene .door').count(), 0, 'Rooms have no elevators');
      assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Props do not collide');
      await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
      assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), props);
      await checkHumanScale();
      await page.clock.runFor(100);
      assert(Math.abs(await playerX() - 108) < 1, 'Enter at the room door');
      await walkTo(inspectX);
      assert.equal(await page.locator('#interaction-hint').textContent(), hintText);
      await page.keyboard.press('e');
      assert.match(await page.locator('#interaction-status').textContent(), message);
      await page.screenshot({ path: `.local/floor-${floor}-room-${index}.png` });
      await walkTo(140);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기');
      await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await header(), corridorHeader);
      await page.clock.runFor(100);
      assert(Math.abs(await playerX() - (entrance.x + 40)) < 1, 'Return to the same room door');
    }
    assert(Math.max(...scales) / Math.min(...scales) < 1.02, `Room fronts scale with their interiors: ${scales}`);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // The exit inside is the corridor door itself: same size, same share of the wall on each side.
  // Reusable for any room floor: pass the floor's short label, and reset roomScales when a floor check starts.
  const roomScales = [];
  const enterRoom = async (name, short = '15F') => {
    const front = await roomFront(page, name);
    await walkTo(front.door.x + front.door.width / 2);
    assert.equal(await hint(), `E · ${name} 들어가기`);
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await header(), `${short} · ${name}`);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.clock.runFor(100);
    const exit = await exitDoor(page);
    assert.deepEqual([exit.y, exit.width], [front.door.y, front.door.width], `${name} exit is the same door`);
    assertMirroredDoor(front.room, front.door, await worldWidth(page), exit, name);
    near(await playerX(), exit.x + 40, `Enter at the ${name} door`);
    roomScales.push(await worldWidth(page) / front.room.width);
    return { front, exit };
  };
  const leaveRoom = async ({ front, exit }, corridorHeader = '15F · 인사총무팀') => {
    await walkTo(exit.x + exit.width / 2);
    assert.equal(await hint(), 'E · 복도로 나가기');
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await header(), corridorHeader);
    await page.clock.runFor(100);
    assert(Math.abs(await playerX() - (front.door.x + 40)) < 1, 'Return to the same room door');
  };
  const jump = async key => {
    await page.keyboard.down(key);
    await page.keyboard.press('Space');
    await page.clock.runFor(1300);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  // 15F shares the core with 16F but differs inside: warm finish, other rooms and door styles,
  // differently sized rooms, a right-hand exit in the lounge and a dark archive with crates to jump.
  const checkFloor15 = async () => {
    roomScales.length = 0;
    assert.equal(await header(), '15F · 인사총무팀');
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'warm');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['문서 보관실', '인사팀 사무실', '방문객 대기실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door metal', 'room-door wood', 'room-door double', 'room-door metal']);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3, 'Corridor furniture');
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'Fixed stair door keeps its whole interaction zone');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'Fixed elevator keeps its whole interaction zone');
    await inspect(3240, 'E · 음료 자판기 조사', /고장 신고/);
    await visitRestroom('15F');
    await walkTo(2996);
    assert.equal(await hint(), 'E · 비상계단 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), '15F · 인사총무팀');
    await page.screenshot({ path: '.local/floor-15.png' });

    const archive = await enterRoom('문서 보관실');
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'true', 'Windowless archive is dark');
    assert(await page.locator('#darkness').isVisible());
    assert.equal(await page.locator('#dynamic-scene .solid.crate').count(), 2);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9);
    await walkTo(870);
    await hold('d', 500);
    assert((await playerX()) < 882, 'Crate blocks walking');
    await walkTo(820);
    await jump('d');
    assert((await playerX()) > 1030, 'Jump clears the first crate');
    await walkTo(1480);
    await jump('d');
    assert((await playerX()) > 1670, 'Jump clears the second crate');
    await inspect(1950, 'E · 출입 기록 캐비닛 조사', /변경자: SYSTEM/);
    await page.screenshot({ path: '.local/floor-15-archive.png' });
    await walkTo(1720);
    await jump('a');
    await walkTo(1070);
    await jump('a');
    await leaveRoom(archive);
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false');
    assert(await page.locator('#darkness').isHidden());

    const hr = await enterRoom('인사팀 사무실');
    assert.equal(await page.locator('#world').evaluate(el => el.style.width), '3000px');
    assert(hr.exit.x > 2700, 'HR door is at the right end inside, as in the corridor');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9);
    await inspect(1950, 'E · 화이트보드 조사', /보안 로봇 인식 DB/);
    await inspect(870, 'E · 책상 조사', /야간 잔류 인원/);
    await leaveRoom(hr);

    const lounge = await enterRoom('방문객 대기실');
    assert.equal(await page.locator('#world').evaluate(el => el.style.width), '1800px');
    near(await playerX(), 1550, 'Lounge exit is on the right');
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await inspect(1100, 'E · 안내 데스크 조사', /방문 기록 태블릿/);
    await page.screenshot({ path: '.local/floor-15-lounge.png' });
    await leaveRoom(lounge);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 12F: cold lab finish, the first room in the middle zone, a wide open office entered through the middle of its
  // front, and a performance lab whose powerless automatic door stays shut but shows the night result through the glass.
  // 12F walls, doors and signs are 1:1 background images; the DOM keeps positions and interaction only.
  const checkFlatArt = async (file, width) => {
    const image = page.locator('#dynamic-scene .floor-background');
    await image.evaluate(img => img.decode());
    assert.match(await image.getAttribute('src'), new RegExp(`/floor12/${file}\\.png$`));
    assert.deepEqual(await image.evaluate(img => [img.naturalWidth, img.naturalHeight, parseFloat(img.style.width),
      parseFloat(img.style.height), parseFloat(img.style.top)]), [width, 720, width, 720, 0], `${file}.png is drawn 1:1`);
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'flat');
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), '', '12F has no CSS theme');
    assert.equal(await page.locator('#dynamic-scene > .floor').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    assert(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.every(el => {
      const style = getComputedStyle(el);
      return style.backgroundImage === 'none' && style.borderTopColor === 'rgba(0, 0, 0, 0)';
    })), 'Doors are painted in the image, not by CSS');
    assert(await page.locator('#dynamic-scene .floor-prop img').evaluateAll(els => els.every(el => getComputedStyle(el).filter === 'none')),
      'Props keep their colours on 1:1 art');
  };
  const checkFloor12 = async () => {
    roomScales.length = 0;
    const corridorHeader = '12F · ARCHI 개발팀';
    assert.equal(await header(), corridorHeader);
    await checkCore();
    await checkFlatArt('corridor', 5000);
    assert(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.every(el => {
      const style = getComputedStyle(el);
      return style.visibility === 'visible' && style.backgroundImage === 'none' && style.borderTopWidth === '0px';
    })), 'Room fronts are painted in the art; only the sign is drawn by DOM (art has no text)');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['ARCHI 개발실', '성능 평가실', '개발자 휴게실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door badge', 'room-door auto', 'room-door pocket', 'room-door metal']);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3, 'Corridor furniture');
    assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'No obstacles on 12F');
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'Charging dock leaves the elevator zone alone');
    await inspect(1650, 'E · 로봇 충전독 조사', /충전독이 비어/);
    await inspect(300, 'E · 전시 진열장 조사', /정답률 4\.8%/);
    await visitRestroom('12F');
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'Middle-zone room keeps clear of the stair door');
    await walkTo(2996);
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await page.locator('#interaction-status').textContent(), /비상계단 문이 잠겨/);

    const lab = await roomFront(page, '성능 평가실');
    assert.deepEqual([lab.room.x, lab.room.width, lab.door], [3100, 452, { x: 3290, y: 260, width: 160 }]);
    await walkTo(lab.door.x + lab.door.width / 2);
    assert.equal(await hint(), 'E · 성능 평가실 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader, 'Powerless automatic door does not open');
    assert.match(await page.locator('#interaction-status').textContent(), /87\.4%/);
    await page.screenshot({ path: '.local/floor-12-lab.png' });

    const dev = await enterRoom('ARCHI 개발실', '12F');
    assert.equal(await worldWidth(page), 3600);
    await checkFlatArt('dev', 3600);
    assert.equal(dev.exit.x, 1775, 'Exit matches the door painted in dev.png');
    assert(dev.exit.x > 1700 && dev.exit.x < 1800, 'Door in the middle of the front opens into the middle of the room');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 12);
    await checkHumanScale();
    await inspect(520, 'E · 성능 평가 보드 조사', /3\.1%/);
    await inspect(3180, 'E · 팀장 책상 조사', /7층 AI 테스트·검증실/);
    await page.screenshot({ path: '.local/floor-12-dev.png' });
    await leaveRoom(dev, corridorHeader);

    const lounge = await enterRoom('개발자 휴게실', '12F');
    assert.equal(await worldWidth(page), 2560);
    await checkFlatArt('lounge', 2560);
    assert.equal(lounge.exit.x, 1833, 'Exit matches the door painted in lounge.png');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7);
    await checkHumanScale();
    await inspect(1000, 'E · 소파 조사', /사용률 91%/);
    await inspect(1450, 'E · 사물함 조사', /시설관리실/);
    await page.screenshot({ path: '.local/floor-12-lounge.png' });
    await leaveRoom(lounge, corridorHeader);
    roomScales.push(1808 / lab.room.width);
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  await checkRoomFloor(16, '16F · 경영지원팀', [
    { name: '탕비실', width: 1890, props: 6, inspectX: 960, hintText: 'E · 음료 자판기 조사', message: /자판기 불이 꺼져/ },
    { name: '소회의실', width: 2400, props: 6, inspectX: 580, hintText: 'E · 화이트보드 조사', message: /ARCHI팀 전력 예산/ },
    { name: '경영지원팀 사무실', width: 2400, props: 8, inspectX: 2110, hintText: 'E · 복합기 조사', message: /B2 서버실/ },
  ]);
  assert(await page.locator('#player').evaluate(el =>
    Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42 + 178 - 570) < 1));
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await cabin.isVisible(), 'Can reboard at the arrival floor');
  for (let floor = 15; floor >= 1; floor--) {
    await page.locator(`#cabin-floor-buttons [data-floor="${floor}"]`).click();
    if (floor !== 15) await page.locator('#cabin-close').click();
    await page.clock.runFor(floor === 15 ? 5300 : 3600);
    assert.equal(await cabin.getAttribute('data-floor'), String(floor));
    await page.locator('#cabin-exit').click();
    await finishSceneTransition(page);
    if (floor === 15) {
      await checkFloor15();
    } else if (floor === 12) {
      await checkFloor12();
    } else {
      assert.equal(await page.locator('header span').textContent(), `${floor}F · 빈 층`);
      assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Only floor and boundary walls');
      await checkCore();
      assert.equal(await page.locator('#dynamic-scene .solid:not(.floor):not(.boundary), #dynamic-scene .panel').count(), 0);
    }
    await page.clock.runFor(100);
    if (floor === 10) {
      await page.screenshot({ path: '.local/empty-floor-10.png' });
      await visitRestroom('10F');
      await walkTo(1858);
    }
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert(await cabin.isVisible(), `Floor ${floor} must allow reboarding`);
  }
  const seen = new Set();
  await page.locator('[data-floor="-2"]').click();
  await page.locator('#cabin-close').click();
  for (let i = 0; i < 10; i++) {
    await page.clock.runFor(500);
    seen.add(await cabin.getAttribute('data-floor'));
  }
  assert(seen.has('-1') && seen.has('-2') && !seen.has('0'), 'Basement travel skips floor zero');
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('header span').textContent(), 'B2 · 빈 층');
  assert.equal(await page.locator('#dynamic-scene .solid').count(), 3);
  await checkCore();
  await page.clock.runFor(100);
  await visitRestroom('B2');
  await walkTo(1858);
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await cabin.evaluate(el => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
  await page.locator('[data-floor="-1"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(3600);
  assert.equal(await cabin.getAttribute('data-floor'), '-1');
  await page.locator('#cabin-alarm').click();
  assert.equal(await page.locator('#cabin-status').textContent(), '비상벨 작동');
  await page.screenshot({ path: '.local/cabin-mobile.png' });
  await page.locator('#cabin-exit').focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.getElementById('elevator-cabin').contains(document.activeElement)));
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('header span').textContent(), 'B1 · 빈 층');
  assert.equal(await page.locator('#dynamic-scene .solid').count(), 3);
  assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
  assert.deepEqual(errors, []);
  console.log('PASS: 19 mouse floor buttons, door controls, reopen cancellation, travel locks, same-car reboarding, all-floor destinations, basement numbering, alarm, keyboard focus and mobile cabin.');
} finally {
  await browser.close();
}
