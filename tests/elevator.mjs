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
  // Measured opaque pixel heights, excluding the transparent canvas padding: [opaque px, min, max] on screen,
  // where the player's 162px is 175cm.
  const heights = { 'filing-cabinet.png': [496, 135, 145], 'office-desk.png': [239, 112, 122],
    'office-copier.png': [240, 98, 108], 'large-planter.png': [465, 136, 146],
    'rolling-whiteboard.png': [240, 158, 170], 'meeting-table.png': [100, 66, 74],
    'waiting-sofa.png': [162, 75, 84], 'water-cooler.png': [496, 115, 125],
    'kitchenette-counter.png': [202, 118, 128], 'drink-vending-machine.png': [468, 170, 180],
    'staff-lockers.png': [334, 164, 174], 'electronics-bench.png': [236, 115, 126],
    'instrument-cart.png': [210, 88, 98], 'server-rack.png': [496, 180, 191], 'network-rack.png': [496, 180, 191],
    'server-cooling-unit.png': [496, 180, 191], 'ups-cabinet.png': [180, 106, 116],
    'robot-charging-dock.png': [239, 60, 70], 'glass-display-cabinet.png': [406, 170, 182],
    'maintenance-tool-cabinet.png': [239, 88, 98], 'electrical-panel.png': [321, 106, 117], 'reception-counter.png': [162, 97, 107],
    'food-serving-counter.png': [196, 120, 130], 'food-dining-table.png': [146, 65, 75],
    'food-refrigerator.png': [495, 180, 191], 'food-checkout.png': [204, 119, 129],
    'food-coffee-bar.png': [233, 129, 140], 'food-menu-board.png': [411, 107, 118] };
  const assertHumanScale = async () => {
    const dimensions = await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => images.map(img => ({
      file: img.src.split('/').pop(), width: parseFloat(img.parentElement.style.width),
      top: parseFloat(img.parentElement.style.top), sourceWidth: img.naturalWidth, sourceHeight: img.naturalHeight,
      base: Number(img.parentElement.dataset.base || 0),
    })));
    for (const prop of dimensions) {
      const [opaqueHeight, min, max] = heights[prop.file];
      const scale = prop.width / prop.sourceWidth;
      assert(opaqueHeight * scale >= min && opaqueHeight * scale <= max, `${prop.file} remains at human scale`);
      // A prop with data-base stands on a platform (9F tiers) that high above the floor.
      near(prop.top + (prop.sourceHeight - 8) * scale, 570 - prop.base, `${prop.file} rests on the floor`);
    }
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
  const leaveRoom = async ({ front, exit }, corridorHeader = '15F · 연구본부') => {
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
  // 16F is the amenity floor of the lobby directory: The Kitchen and CU share a wall left of the elevators, the café
  // sits right of the restroom. Its mechanic: the CU shutter came down before the blackout, so the way in is the goods
  // door at the far end of the kitchen; raising the shutter from inside (leaving by it) opens the store for good.
  const checkFloor16 = async () => {
    roomScales.length = 0;
    const corridorHeader = '16F · 편의시설';
    const status = () => page.locator('#interaction-status').textContent();
    const linkDoor = () => page.locator('#dynamic-scene .room-door.backdoor').evaluate(el =>
      ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top), width: parseFloat(el.style.width) }));
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'food');
    assert.equal(await page.locator('#dynamic-scene .floor-background').count(), 0, 'The old 16F office art is not used');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['The Kitchen', 'CU 편의점', 'Café', '화장실'], 'Rooms follow the lobby directory');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room kitchen', 'floor-room store', 'floor-room cafe', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door cafeteria', 'room-door shutter', 'room-door cafe', 'room-door metal']);
    const kitchen = await roomFront(page, 'The Kitchen');
    const cu = await roomFront(page, 'CU 편의점');
    const cafe = await roomFront(page, 'Café');
    assert.equal(kitchen.room.x + kitchen.room.width, cu.room.x, 'The kitchen and the store share a wall');
    assert(cu.room.x + cu.room.width <= 1790 && cu.door.x + cu.door.width + 28 <= 1790, 'Both sit in the left zone');
    assert(cafe.room.x >= 4282 && cafe.room.x + cafe.room.width <= 4968 && cafe.door.x >= 4282, 'The café sits in the right zone');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 2, 'Menu stand and planter');
    assert.equal(await page.locator('img[src$="food-menu-board.png"]').count(), 1);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The store door leaves elevator 1 its whole zone');
    await inspect(3330, 'E · 메뉴 입간판 조사', /음성 주문 키오스크/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The menu stand leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await visitRestroom('16F');
    await walkTo(cu.door.x + cu.door.width / 2);
    assert.equal(await hint(), 'E · CU 편의점 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader, 'The shuttered store does not open from the corridor');
    assert.match(await status(), /주방 반입문/);
    await page.screenshot({ path: '.local/floor-16.png' });

    const kitchenRoom = await enterRoom('The Kitchen', '16F');
    assert.equal(await worldWidth(page), 3604);
    assert.equal(kitchenRoom.exit.x, 1702, 'The centred cafeteria door is centred inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.tiles').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 10);
    assert.equal(await page.locator('img[src$="food-dining-table.png"]').count(), 2);
    assert.equal(await page.locator('img[src$="food-serving-counter.png"]').count(), 2);
    await assertHumanScale();
    await inspect(1250, 'E · 주방 게시판 조사', /주방 반입문/);
    await inspect(2330, 'E · 배식대 조사', /02:00~05:00/);
    await page.screenshot({ path: '.local/floor-16-kitchen.png' });
    const kitchenLink = await linkDoor();
    assert.deepEqual(kitchenLink, { x: 3460, y: 250, width: 110 }, 'The goods door is at the wall shared with the store');
    await walkTo(kitchenLink.x + kitchenLink.width / 2);
    assert.equal(await hint(), 'E · CU 편의점 들어가기');
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await header(), '16F · CU 편의점');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await page.clock.runFor(100);
    const cuLink = await linkDoor();
    assert.deepEqual(cuLink, { x: 56, y: 250, width: 110 }, 'Its pair is the stockroom door inside the store');
    near(await playerX(), cuLink.x + 40, 'Arrive at the matching goods door');
    assert.equal(await worldWidth(page), 2040);
    assert.equal(await page.locator('#dynamic-scene .room-interior.shelves').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7);
    assert.equal(await page.locator('img[src$="food-refrigerator.png"]').count(), 2);
    assert.equal(await page.locator('img[src$="food-checkout.png"]').count(), 1);
    await assertHumanScale();
    const cuExit = await exitDoor(page);
    assert.deepEqual([cuExit.y, cuExit.width], [cu.door.y, cu.door.width], 'The store exit is the shutter itself');
    assertMirroredDoor(cu.room, cu.door, 2040, cuExit, 'CU 편의점');
    roomScales.push(2040 / cu.room.width);
    await inspect(1150, 'E · 계산대 조사', /23:47.*정수호/);
    await page.screenshot({ path: '.local/floor-16-cu.png' });
    await inspect(1640, 'E · 셔터 제어함 조사', /명령 SYSTEM/);
    await leaveRoom({ front: cu, exit: cuExit }, corridorHeader);
    assert.equal(await page.locator('#dynamic-scene .room-door.shutter').getAttribute('aria-label'), 'CU 편의점 출입문',
      'Raising the shutter from inside opens the store from the corridor');
    await enterRoom('CU 편의점', '16F');
    await walkTo(cuLink.x + cuLink.width / 2);
    assert.equal(await hint(), 'E · The Kitchen 들어가기');
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert.equal(await header(), '16F · The Kitchen');
    await page.clock.runFor(100);
    near(await playerX(), kitchenLink.x + 40, 'The way back lands at the kitchen goods door');
    await leaveRoom(kitchenRoom, corridorHeader);

    const cafeRoom = await enterRoom('Café', '16F');
    assert.equal(await page.locator('img[src$="food-coffee-bar.png"]').count(), 1);
    assert.equal(await worldWidth(page), 1904);
    assert(cafeRoom.exit.x < 150, 'The café door is at the left end inside, as in the corridor');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(1300, 'E · 커피 바 조사', /먼저 인사/);
    await inspect(1690, 'E · 고객의 소리 게시판 조사', /다 알아요/);
    await page.screenshot({ path: '.local/floor-16-cafe.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(cafeRoom, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 15F 연구본부: two rooms left of the elevators and the director's office in the middle zone. Its mechanic: boxed GPU
  // servers waiting to go to B2 cover the seminar room floor, so the work order at the back is reached by jumping them.
  const checkFloor15 = async () => {
    roomScales.length = 0;
    const corridorHeader = '15F · 연구본부';
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'research');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['연구실', '세미나실', '연구본부장실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room partition', 'floor-room seminar', 'floor-room director', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door research', 'room-door seminar', 'room-door director', 'room-door metal']);
    const director = await roomFront(page, '연구본부장실');
    assert(director.room.x >= 3086 && director.room.x + director.room.width <= 3556, 'The director office sits in the middle zone');
    assert(director.door.x - 28 >= 3114 && director.door.x + director.door.width + 28 <= 3584,
      'The director office door keeps clear of the stairs and the restroom');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 4, 'Corridor furniture');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'Fixed elevator keeps its whole interaction zone');
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The middle room leaves the stair door its whole zone');
    await visitRestroom('15F');
    await inspect(4730, 'E · 연구본부 소식지 조사', /야간 사용 권한/);
    await page.screenshot({ path: '.local/floor-15.png' });

    const seminar = await enterRoom('세미나실', '15F');
    assert.equal(await worldWidth(page), 2480);
    assert(seminar.exit.x < 150, 'The seminar door is at the left end inside, as in the corridor');
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false', 'The seminar room has windows');
    assert.equal(await page.locator('#dynamic-scene .solid.crate').count(), 2);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(420, 'E · 이관 카트 조사', /B2 서버실 이관 2차분/);
    await walkTo(730);
    await hold('d', 500);
    assert((await playerX()) < 742, 'The boxed servers block walking');
    await walkTo(680);
    await jump('d');
    assert((await playerX()) > 890, 'Jump clears the first box');
    await walkTo(1280);
    await jump('d');
    assert((await playerX()) > 1470, 'Jump clears the second box');
    await inspect(1800, 'E · 작업 지시서 조사', /승인: 대기/);
    await page.screenshot({ path: '.local/floor-15-seminar.png' });
    await walkTo(1520);
    await jump('a');
    await walkTo(930);
    await jump('a');
    await leaveRoom(seminar, corridorHeader);

    const lab = await enterRoom('연구실', '15F');
    assert.equal(await worldWidth(page), 3440);
    assert.equal(lab.exit.x, 1003, 'The door 30% along the front is 30% along the wall inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 12);
    await assertHumanScale();
    await inspect(1400, 'E · 책상 조사', /사용률은 100%/);
    await inspect(2450, 'E · 화이트보드 조사', /일부러 틀릴/);
    await page.screenshot({ path: '.local/floor-15-lab.png' });
    await leaveRoom(lab, corridorHeader);

    const office = await enterRoom('연구본부장실', '15F');
    assert.equal(await worldWidth(page), 1824);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6);
    await assertHumanScale();
    await inspect(900, 'E · 본부장 책상 조사', /자동 승인 · 야간 배치/);
    await page.screenshot({ path: '.local/floor-15-director.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(office, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 12F puts one room in each free zone of the core instead of two on the left: a dev office behind a centred
  // sliding door, a windowless evaluation lab between the stairs and the restroom, and a team lead office that
  // stays locked until its spare key is taken from a dev office drawer.
  const checkFloor12 = async () => {
    roomScales.length = 0;
    const corridorHeader = '12F · 기술본부 ARCHI 개발팀';
    const status = () => page.locator('#interaction-status').textContent();
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'lab');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['개발실', '모델 평가실', '팀장실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room frosted', 'floor-room lab', 'floor-room blinds', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door slide', 'room-door security', 'room-door blinds', 'room-door metal']);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 4, 'Corridor furniture');
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await inspect(1180, 'E · 로봇 충전 도크 조사', /바퀴 자국/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The middle room leaves the stair door its whole zone');
    await visitRestroom('12F');
    const lead = await roomFront(page, '팀장실');
    await walkTo(lead.door.x + lead.door.width / 2);
    assert.equal(await hint(), 'E · 팀장실 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader, 'The locked office does not change scene');
    assert.match(await status(), /열쇠 구멍/);
    await walkTo(3400);
    await page.screenshot({ path: '.local/floor-12-corridor.png' });

    const dev = await enterRoom('개발실', '12F');
    assert.equal(await worldWidth(page), 3280);
    assert.equal(dev.exit.x, 1550, 'The centred corridor door is centred inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 12);
    await assertHumanScale();
    await inspect(1990, 'E · 화이트보드 조사', /수 4\.5%/);
    await inspect(3000, 'E · 책상 서랍 조사', /팀장실 보조키.*챙겼다/);
    await page.clock.runFor(600);
    await page.keyboard.press('e');
    assert.match(await status(), /이미 챙겼다/, 'The key is taken only once');
    await page.screenshot({ path: '.local/floor-12-dev.png' });
    await inspect(820, 'E · 책상 조사', /자동 평가 로그 또 삭제/);
    await leaveRoom(dev, corridorHeader);

    const lab = await enterRoom('모델 평가실', '12F');
    assert.equal(await worldWidth(page), 1804);
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false', 'Unlike the 15F archive the lab is not a dark room');
    assert.equal(await page.locator('#dynamic-scene .room-interior.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(760, 'E · 평가 벤치 조사', /87\.6%.*4\.1%/);
    await page.screenshot({ path: '.local/floor-12-eval.png' });
    await inspect(230, 'E · 네트워크 랙 조사', /B2 직결/);
    await leaveRoom(lab, corridorHeader);

    assert.equal(await page.locator('#dynamic-scene .room-door.blinds').getAttribute('aria-label'), '팀장실 출입문',
      'The spare key unlocks the team lead office');
    const office = await enterRoom('팀장실', '12F');
    assert.equal(await worldWidth(page), 2132);
    assert(office.exit.x > 1800, 'The office door is at the right end inside, as in the corridor');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(1360, 'E · 팀장 책상 조사', /7층 AI 테스트·검증실 장비에 별도 백업/);
    await page.screenshot({ path: '.local/floor-12-lead.png' });
    await inspect(280, 'E · 진열장 조사', /참가상/);
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(office, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 11F puts one wide sales office on the left and two small rooms right of the restroom, behind a fire shutter that
  // SYSTEM lowered before the blackout. Its mechanic: the shutter is a wall across the corridor until the manual crank
  // is taken from the floor emergency kit in the sales office; raising it removes the wall for good.
  const checkFloor11 = async () => {
    roomScales.length = 0;
    const corridorHeader = '11F · 사업본부 · 전략마케팅본부';
    const status = () => page.locator('#interaction-status').textContent();
    const shutter = page.locator('#dynamic-scene .barrier.shutter');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'sales');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['영업본부 사무실', '전략회의실', '마케팅 자료실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room sales', 'floor-room war-room', 'floor-room materials', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door gilt', 'room-door privacy', 'room-door stockroom', 'room-door metal']);
    const sales = await roomFront(page, '영업본부 사무실');
    const strategy = await roomFront(page, '전략회의실');
    const materials = await roomFront(page, '마케팅 자료실');
    const barrier = await shutter.evaluate(el => ({ x: parseFloat(el.style.left), width: parseFloat(el.style.width) }));
    assert(sales.room.x + sales.room.width <= 1790 && sales.door.x + sales.door.width + 28 <= 1790, 'The sales office sits in the left zone');
    assert(barrier.x >= 4282 && barrier.x - 28 >= 3785, 'The shutter stands right of the restroom, clear of its door');
    for (const { room, door } of [strategy, materials]) {
      assert(room.x >= barrier.x + barrier.width && room.x + room.width <= 4968, 'Both small rooms sit behind the shutter');
      assert(door.x - 28 >= barrier.x + barrier.width + 28 && door.x + door.width <= 4940, 'Their doors keep clear of the shutter');
    }
    assert(strategy.door.x + strategy.door.width + 28 <= materials.door.x - 28, 'The two doors have separate hint zones');
    assert.equal(await shutter.getAttribute('data-open'), 'false');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5, 'Corridor furniture');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await inspect(980, 'E · 영업 실적 보드 조사', /시연은 무조건 밤에/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)');
    await inspect(3230, 'E · 트로피 진열장 조사', /ARCHI 첫 계약/);
    await visitRestroom('11F');
    await walkTo(4400);
    assert(await playerX() < 4275, `The lowered shutter blocks the corridor: ${await playerX()}`);
    assert.equal(await hint(), 'E · 방화셔터 조사');
    await page.keyboard.press('e');
    assert.match(await status(), /수동 개방 핸들을 꽂는 구멍/);
    assert.equal(await shutter.getAttribute('data-open'), 'false', 'Without the crank the shutter stays down');
    await page.screenshot({ path: '.local/floor-11-shutter.png' });

    const office = await enterRoom('영업본부 사무실', '11F');
    assert.equal(await worldWidth(page), 3600);
    assert.equal(office.exit.x, 1274, 'The door a third of the way along the front is a third of the way along inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 13);
    await assertHumanScale();
    await inspect(810, 'E · 책상 조사', /전날 밤 리허설/);
    await inspect(1700, 'E · 영업 현황판 조사', /3~5%/);
    await inspect(3150, 'E · 층 비상 대응함 조사', /수동 개방 핸들.*챙겼다/);
    await page.clock.runFor(600);
    await page.keyboard.press('e');
    assert.match(await status(), /고리만 남아/, 'The crank is taken only once');
    await page.screenshot({ path: '.local/floor-11-sales.png' });
    await leaveRoom(office, corridorHeader);

    await walkTo(4290);
    assert.equal(await hint(), 'E · 방화셔터 조사');
    await page.keyboard.press('e');
    assert.match(await status(), /말려 올라간다/);
    assert.equal(await shutter.getAttribute('data-open'), 'true');
    await page.clock.runFor(600);
    await page.keyboard.press('e');
    assert.match(await status(), /불이 난 흔적/, 'The shutter is raised only once');
    await walkTo(4400);
    assert(await playerX() > 4390, 'The raised shutter no longer blocks the corridor');
    await page.screenshot({ path: '.local/floor-11.png' });

    const room = await enterRoom('전략회의실', '11F');
    assert.equal(await worldWidth(page), 1800);
    assert(room.exit.x > 1200, 'The door near the right end of the front is near the right end inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.boardroom').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(980, 'E · 회의 테이블 조사', /새벽 3시 자동 녹화본/);
    await inspect(560, 'E · 전략 보드 조사', /프로젝트 축소/);
    await page.screenshot({ path: '.local/floor-11-strategy.png' });
    await leaveRoom(room, corridorHeader);
    assert.equal(await shutter.getAttribute('data-open'), 'true', 'The shutter stays up after leaving a room');

    const archive = await enterRoom('마케팅 자료실', '11F');
    assert.equal(await worldWidth(page), 1800);
    assert.equal(archive.exit.x, 164, 'The door at the left end of the front is at the left end inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(900, 'E · 자료실 책상 조사', /archi-demo.*03:07/);
    await inspect(420, 'E · 브로슈어 진열장 조사', /출시일/);
    await page.screenshot({ path: '.local/floor-11-marketing.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(archive, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 10F keeps two separate rooms in the left zone and a windowless vault in the middle zone. Its mechanic: the vault
  // door unlocked itself when the power failed, but the dual-control cabinet inside needs keys from two different rooms;
  // with only one of them the second lock does not turn.
  const checkFloor10 = async () => {
    roomScales.length = 0;
    const corridorHeader = '10F · 경영관리본부';
    const status = () => page.locator('#interaction-status').textContent();
    const cabinet = 'E · 이중 잠금 서류함 조사';
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'finance');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['재무회계팀 사무실', '본부장실', '금고실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room ledger', 'floor-room marble', 'floor-room strongroom', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door brass', 'room-door lacquer', 'room-door vault-wheel', 'room-door metal']);
    const finance = await roomFront(page, '재무회계팀 사무실');
    const director = await roomFront(page, '본부장실');
    const vault = await roomFront(page, '금고실');
    assert(finance.room.x + finance.room.width < director.room.x, 'The two left-zone rooms do not share a wall');
    assert(finance.door.x + finance.door.width + 28 <= director.door.x - 28, 'Their doors have separate hint zones');
    assert(director.room.x + director.room.width <= 1790 && director.door.x + director.door.width + 28 <= 1790,
      'Both sit in the left zone');
    assert(vault.room.x >= 3086 && vault.room.x + vault.room.width <= 3556, 'The vault sits in the middle zone');
    assert(vault.door.x - 28 >= 3114 && vault.door.x + vault.door.width + 28 <= 3584,
      'The vault door keeps clear of the stairs and the restroom');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6, 'Corridor furniture and the front desk');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The corridor props leave elevator 1 its whole zone');
    await visitRestroom('10F');
    await inspect(4460, 'E · 본부 안내 데스크 조사', /archi-ops/);
    await page.screenshot({ path: '.local/floor-10.png' });

    const locked = await enterRoom('금고실', '10F');
    assert.equal(await worldWidth(page), 1814);
    assert.equal(locked.exit.x, 838, 'The centred vault door is centred inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.windowless.strongroom').count(), 1);
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false', 'Windowless, not a dark room');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9);
    assert.equal(await page.locator('#dynamic-scene .floor-prop.double-lock').count(), 1);
    await assertHumanScale();
    await inspect(700, cabinet, /열쇠 구멍이 두 개/);
    await inspect(1650, 'E · 금고실 UPS 조사', /전자 잠금은 풀립니다/);
    await leaveRoom(locked, corridorHeader);

    const office = await enterRoom('본부장실', '10F');
    assert.equal(await worldWidth(page), 2184);
    assert.equal(office.exit.x, 256, 'The door near the left end of the front is near the left end inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(520, 'E · 진열장 조사', /출범식/);
    await inspect(1700, 'E · 본부장 책상 조사', /3~5%.*챙겼다/);
    await page.screenshot({ path: '.local/floor-10-director.png' });
    await leaveRoom(office, corridorHeader);

    const halfway = await enterRoom('금고실', '10F');
    await inspect(700, cabinet, /나머지 구멍/);
    await leaveRoom(halfway, corridorHeader);

    const team = await enterRoom('재무회계팀 사무실', '10F');
    assert.equal(await worldWidth(page), 3444);
    assert.equal(team.exit.x, 1555);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 14);
    await assertHumanScale();
    await inspect(880, 'E · 회계 책상 조사', /212%/);
    await inspect(1960, 'E · 결산 보드 조사', /회신 없음/);
    await inspect(2650, 'E · 재무팀장 책상 조사', /재무" 꼬리표.*챙겼다/);
    await page.clock.runFor(600);
    await page.keyboard.press('e');
    assert.match(await status(), /이미 챙겼다/, 'The key is taken only once');
    await page.screenshot({ path: '.local/floor-10-finance.png' });
    await leaveRoom(team, corridorHeader);

    const opened = await enterRoom('금고실', '10F');
    await inspect(700, cabinet, /B2 전력 한도 3배/);
    await page.screenshot({ path: '.local/floor-10-vault.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(opened, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 9F puts a windowless briefing theatre and an open sales office side by side in the left zone, a licence room right
  // of the restroom and a lounge table in the middle zone. Its mechanic: the theatre ends in tiered seating, and the
  // recorder on the top tier can be reached only by jumping up tier by tier.
  const checkFloor9 = async () => {
    roomScales.length = 0;
    const corridorHeader = '9F · TmaxTibero 사업본부';
    const status = () => page.locator('#interaction-status').textContent();
    const feet = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42 + 178);
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'wine');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['고객 브리핑 센터', '사업팀 사무실', '라이선스 관리실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room auditorium', 'floor-room wine-glass', 'floor-room license', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door push-bar', 'room-door wine', 'room-door badge', 'room-door metal']);
    const briefing = await roomFront(page, '고객 브리핑 센터');
    const sales = await roomFront(page, '사업팀 사무실');
    const license = await roomFront(page, '라이선스 관리실');
    assert(briefing.room.x + briefing.room.width < sales.room.x, 'The theatre and the office do not share a wall');
    assert(briefing.door.x + briefing.door.width + 28 <= sales.door.x - 28, 'Their doors have separate hint zones');
    assert(sales.room.x + sales.room.width <= 1790 && sales.door.x + sales.door.width + 28 <= 1790, 'Both sit in the left zone');
    assert(license.room.x >= 4282 && license.room.x + license.room.width <= 4968 && license.door.x + license.door.width <= 4940,
      'The licence room sits in the right zone');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5, 'Lounge furniture');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await inspect(3350, 'E · 상담 테이블 조사', /매일 03:00/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The lounge table leaves the stair door its whole zone');
    await visitRestroom('9F');
    await inspect(4820, 'E · 감사패 진열장 조사', /사내 부서/);
    await page.screenshot({ path: '.local/floor-9.png' });

    const keys = await enterRoom('라이선스 관리실', '9F');
    assert.equal(await worldWidth(page), 1848);
    assert.equal(keys.exit.x, 1429, 'The door near the right end of the front is near the right end inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(620, 'E · 라이선스 서버 콘솔 조사', /SELECT \* FROM mail/);
    await inspect(1200, 'E · 라이선스 대장 조사', /64 → 512/);
    await page.screenshot({ path: '.local/floor-9-license.png' });
    await leaveRoom(keys, corridorHeader);

    const office = await enterRoom('사업팀 사무실', '9F');
    assert.equal(await worldWidth(page), 3168);
    assert.equal(office.exit.x, 2835, 'The door at the right end of the front is at the right end inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 12);
    await assertHumanScale();
    await inspect(1700, 'E · 고객사 현황판 조사', /새벽 시간대/);
    await inspect(810, 'E · 영업 책상 조사', /권한 자동 부여/);
    await leaveRoom(office, corridorHeader);

    const hall = await enterRoom('고객 브리핑 센터', '9F');
    assert.equal(await worldWidth(page), 2464);
    assert.equal(hall.exit.x, 120, 'The door at the left end of the front is at the left end inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.windowless.auditorium').count(), 1);
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false');
    const tiers = await page.locator('#dynamic-scene .solid.riser').evaluateAll(els => els.map(el =>
      ({ x: parseFloat(el.style.left), width: parseFloat(el.style.width), height: parseFloat(el.style.height) })));
    assert.deepEqual(tiers.map(tier => tier.height), [38, 76, 114, 152], 'Four tiers, each a small jump higher');
    assert(tiers[0].x >= hall.exit.x + hall.exit.width + 56, 'The tiers start well clear of the exit');
    assert.equal(tiers.at(-1).x + tiers.at(-1).width, 2464 - 32, 'The top tier runs to the back wall');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(760, 'E · 브리핑 테이블 조사', /뒷줄 카메라/);
    await walkTo(1460);
    await hold('d', 500);
    assert(await playerX() < 1482, 'The first tier blocks walking');
    for (let i = 0; i < 6 && Math.abs(await feet() - 418) > 1; i++) await jump('d');
    near(await feet(), 418, 'Jumped up to the top tier');
    await walkTo(2330);
    assert.equal(await hint(), 'E · 녹화 장비 조사');
    await page.keyboard.press('e');
    assert.match(await status(), /사람 반응 학습용/);
    await page.screenshot({ path: '.local/floor-9-briefing.png' });
    await walkTo(1400);
    near(await feet(), 570, 'Walked back down the tiers');
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(hall, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 14F, the second 연구본부 floor, lines all three rooms up in the left zone and gives the middle and right zones to an
  // exhibit and a rest area. Its mechanic: the windowless archive is dark, its notes cannot be read until the work lamp
  // is switched on, and the lamp stays on after leaving.
  const checkFloor14 = async () => {
    roomScales.length = 0;
    const corridorHeader = '14F · 연구본부';
    const status = () => page.locator('#interaction-status').textContent();
    const dark = () => page.locator('#world').getAttribute('data-dark');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'dataset');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['연구 자료실', '데이터 연구실', '사용자 실험실', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room stacks', 'floor-room datawall', 'floor-room mirror', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door vault', 'room-door datalab', 'room-door observe', 'room-door metal']);
    for (const name of ['연구 자료실', '데이터 연구실', '사용자 실험실']) {
      const { room, door } = await roomFront(page, name);
      assert(room.x >= 32 && room.x + room.width <= 1790, `${name} sits in the left zone`);
      assert(door.x - 28 >= 32 && door.x + door.width + 28 <= 1790, `${name} door keeps clear of elevator 1`);
    }
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7, 'Exhibit and rest area');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'Fixed elevator keeps its whole interaction zone');
    await inspect(3250, 'E · 연구 성과 전시장 조사', /행동 패턴/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The exhibit leaves the stair door its whole zone');
    await visitRestroom('14F');
    await page.screenshot({ path: '.local/floor-14.png' });

    const archive = await enterRoom('연구 자료실', '14F');
    assert.equal(await worldWidth(page), 1800);
    assert(archive.exit.x > 1500, 'The archive door is at the right end inside, as in the corridor');
    assert.equal(await dark(), 'true', 'The windowless archive starts dark');
    assert(await page.locator('#darkness').isVisible());
    assert.equal(await page.locator('#dynamic-scene .room-interior.windowless.stacks').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9);
    await assertHumanScale();
    await inspect(620, 'E · 열람 책상 조사', /어두워서 읽을 수 없다/);
    await page.screenshot({ path: '.local/floor-14-archive-dark.png' });
    await inspect(1440, 'E · 작업등 조사', /환해진다/);
    assert.equal(await dark(), 'false', 'The work lamp lights the archive at once');
    assert(await page.locator('#darkness').isHidden());
    await page.clock.runFor(600);
    await page.keyboard.press('e');
    assert.match(await status(), /작업등이 켜져 있다/, 'The lamp is switched on only once');
    await inspect(620, 'E · 열람 책상 조사', /새벽 B2로 복사/);
    await inspect(880, 'E · 기록 보관함 조사', /새벽 1시에서 4시/);
    await page.screenshot({ path: '.local/floor-14-archive.png' });
    await leaveRoom(archive, corridorHeader);
    assert.equal(await dark(), 'false');

    const data = await enterRoom('데이터 연구실', '14F');
    assert.equal(await worldWidth(page), 2400);
    assert.equal(data.exit.x, 300, 'The door near the left of the front is near the left inside');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9);
    await assertHumanScale();
    await inspect(1680, 'E · 라벨링 현황판 조사', /전부 끝나 있다/);
    await inspect(980, 'E · 책상 조사', /누가\?/);
    await page.screenshot({ path: '.local/floor-14-data.png' });
    await leaveRoom(data, corridorHeader);

    const ux = await enterRoom('사용자 실험실', '14F');
    assert.equal(await worldWidth(page), 2100);
    assert.equal(ux.exit.x, 936, 'The door near the middle of the front is near the middle inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.mirror').count(), 1);
    assert.equal(await dark(), 'false');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(520, 'E · 관찰 콘솔 조사', /야간 무인 관찰/);
    await inspect(1330, 'E · 실험 테이블 조사', /17층 정수호/);
    await page.screenshot({ path: '.local/floor-14-ux.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(ux, corridorHeader);

    const again = await enterRoom('연구 자료실', '14F');
    assert.equal(await dark(), 'false', 'The archive stays lit after leaving');
    await leaveRoom(again, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 13F 기술본부 is the only floor with no walled room left of the elevators: engineers sit at open desks there, and the
  // rooms are the operations room in the middle zone and two small rooms right of the restroom. Its mechanic: the alert
  // printer in the operations room runs on the test bay UPS line, so it prints nothing until that UPS is switched on.
  const checkFloor13 = async () => {
    roomScales.length = 0;
    const corridorHeader = '13F · 기술본부';
    const status = () => page.locator('#interaction-status').textContent();
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'support');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['기술지원 상황실', '장비 검증실', '고객 교육장', '화장실']);
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room ops', 'floor-room cage', 'floor-room classroom', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door ops', 'room-door cage', 'room-door classroom', 'room-door metal']);
    const ops = await roomFront(page, '기술지원 상황실');
    assert(ops.room.x >= 3086 && ops.room.x + ops.room.width <= 3556, 'The operations room sits in the middle zone');
    assert(ops.door.x - 28 >= 3114 && ops.door.x + ops.door.width + 28 <= 3584,
      'The operations room door keeps clear of the stairs and the restroom');
    for (const name of ['장비 검증실', '고객 교육장']) {
      const { room, door } = await roomFront(page, name);
      assert(room.x >= 4282 && room.x + room.width <= 4968, `${name} sits in the right zone`);
      assert(door.x >= 4282 && door.x + door.width + 28 <= 4968, `${name} door stays inside the right zone`);
    }
    assert.equal(await page.locator('#dynamic-scene .floor-room').evaluateAll(els =>
      els.filter(el => parseFloat(el.style.left) < 1790).length), 0, 'No walled room left of the elevators');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8, 'Open engineer desks');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The open desks leave elevator 1 its whole zone');
    await inspect(1400, 'E · 출동 현황판 조사', /야간 대기: 0명/);
    await page.screenshot({ path: '.local/floor-13-desks.png' });
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The operations room leaves the stair door its whole zone');
    await visitRestroom('13F');
    await page.screenshot({ path: '.local/floor-13.png' });

    const opsRoom = await enterRoom('기술지원 상황실', '13F');
    assert.equal(await worldWidth(page), 2622);
    assert.equal(opsRoom.exit.x, 1231, 'The centred double door is centred inside');
    assert.equal(await page.locator('#dynamic-scene .room-interior.monitors').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9);
    await assertHumanScale();
    await inspect(1060, 'E · 장애 알림 프린터 조사', /UPS 비상 회선/);
    await inspect(480, 'E · 교대 근무 일지 조사', /당직 폐지/);
    await leaveRoom(opsRoom, corridorHeader);

    const bay = await enterRoom('장비 검증실', '13F');
    assert.equal(await worldWidth(page), 1824);
    assert(bay.exit.x < 150, 'The test bay door is at the left end inside, as in the corridor');
    assert.equal(await page.locator('#dynamic-scene .room-interior.windowless').count(), 1);
    assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false', 'Windowless but not a dark room');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6);
    await assertHumanScale();
    await inspect(420, 'E · UPS 조사', /초록 불/);
    await page.clock.runFor(600);
    await page.keyboard.press('e');
    assert.match(await status(), /배터리 잔량/, 'The UPS is switched on only once');
    await inspect(800, 'E · 검증 벤치 조사', /설치 기록 없음/);
    await page.screenshot({ path: '.local/floor-13-testbay.png' });
    await leaveRoom(bay, corridorHeader);

    const opsAgain = await enterRoom('기술지원 상황실', '13F');
    await inspect(1060, 'E · 장애 알림 프린터 조사', /처리자는 모두 SYSTEM/);
    await page.screenshot({ path: '.local/floor-13-ops.png' });
    await leaveRoom(opsAgain, corridorHeader);

    const training = await enterRoom('고객 교육장', '13F');
    assert.equal(await worldWidth(page), 1824);
    assert(training.exit.x > 1400, 'The training room door is at the right end inside, as in the corridor');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(300, 'E · 교육 자료 보드 조사', /한 층에만/);
    await inspect(1120, 'E · 교육생 자리 조사', /1\/5/);
    await page.screenshot({ path: '.local/floor-13-training.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(training, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  await checkFloor16();
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
    } else if (floor === 14) {
      await checkFloor14();
    } else if (floor === 13) {
      await checkFloor13();
    } else if (floor === 12) {
      await checkFloor12();
    } else if (floor === 11) {
      await checkFloor11();
    } else if (floor === 10) {
      await checkFloor10();
    } else if (floor === 9) {
      await checkFloor9();
    } else {
      assert.equal(await page.locator('header span').textContent(), `${floor}F · 빈 층`);
      assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Only floor and boundary walls');
      await checkCore();
      assert.equal(await page.locator('#dynamic-scene .solid:not(.floor):not(.boundary), #dynamic-scene .panel').count(), 0);
    }
    await page.clock.runFor(100);
    if (floor === 8) {
      await page.screenshot({ path: '.local/empty-floor-8.png' });
      await visitRestroom('8F');
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
