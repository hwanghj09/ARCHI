import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { interactionMessage, finishSceneTransition, reachInitialCorridor } from './scene-transition.mjs';
import { assertMirroredDoor, exitDoor, roomFront, worldWidth } from './room-geometry.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
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
  // The first call position now plays the outage scene before allowing a real call.
  if (await page.locator('#blackout-scene').isVisible()) await page.clock.runFor(5000);
  // Rooftop power recovery is exercised by elevator-power.mjs; this suite checks the powered floor routes.
  await page.locator('#power-lever').dispatchEvent('click');
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
  await page.locator('#cabin-floor-buttons [data-floor="16"]').dispatchEvent('click');
  assert.equal(await page.locator('#cabin-floor-buttons [data-floor="16"]').getAttribute('aria-pressed'), 'false', 'Floor input blocked during fade');
  await finishSceneTransition(page);
  assert.equal(await cabin.evaluate(el => el.inert), false);
  assert(await cabin.evaluate(el => document.activeElement === el), 'Focus moves into the cabin after fade-in');
  assert(await cabin.isVisible());
  assert(await page.locator('#stage').evaluate(el => el.inert));
  assert.equal(await page.locator('#cabin-art').evaluate(el => el.naturalWidth), 1536);
  const floorButtons = page.locator('#cabin-floor-buttons button');
  assert.deepEqual(await floorButtons.evaluateAll(els => els.map(el => Number(el.dataset.floor))),
    [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2]);
  assert.deepEqual(await page.locator('#cabin-floor-buttons [data-badge]').evaluateAll(els => els.map(el => el.dataset.floor)),
    [], 'Employee authentication happens at the landing gates, not in the elevator');
  assert.deepEqual(await page.locator('#cabin-floor-buttons [data-restricted]').evaluateAll(els => els.map(el => el.dataset.floor)),
    ['-2'], 'ARCHI keeps the elevator away from B2');
  for (const button of await floorButtons.all()) {
    if (await button.isDisabled()) continue;
    await button.click();
    if (await button.getAttribute('data-restricted')) {
      assert.equal(await button.getAttribute('aria-pressed'), 'false', 'B2 stays restricted until B1 lifts it');
      assert.match(await page.locator('#cabin-status').textContent(), /운행 제한 중이다.*B1 방재 관제실/);
      continue;
    }
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
  await page.locator('#cabin-floor-buttons [data-floor="16"]').click();
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
    assert.match(await interactionMessage(page), message);
  };
  // Painted floors use measured door positions; the other floors share the building core.
  const checkCore = async () => {
    const floor = await page.evaluate(() => currentSceneFloor);
    const painted = {
      1: { elevators: [[1948, 220, 197], [2222, 220, 198], [2495, 220, 200]], stairs: [2895, 232, 145], restroom: [3733, 158] },
      7: { elevators: [[1878, 220, 213], [2178, 220, 214], [2474, 220, 211]], stairs: [2865, 232, 170], restroom: [3762, 142] },
      12: { elevators: [[1853, 220, 198], [2093, 220, 194], [2324, 220, 196]], stairs: [2781, 232, 180], restroom: [3688, 117] },
    }[floor];
    assert.equal(await page.locator('#world').evaluate(el => el.style.width), '5000px');
    const geometry = els => els.map(el => [parseFloat(el.style.left), parseFloat(el.style.top), parseFloat(el.style.width)]);
    assert.deepEqual(await page.locator('#dynamic-scene .door.elevator').evaluateAll(geometry),
      painted?.elevators || [[1818, 220, 218], [2148, 220, 214], [2444, 220, 216]], 'Elevators match their authored background');
    assert.deepEqual(await page.locator('#dynamic-scene .door:not(.elevator)').evaluateAll(geometry),
      [painted?.stairs || [2906, 232, 180]], 'Stair door matches its authored background');
    assert.equal(await page.locator('#dynamic-scene .floor-number-sign').count(), 1);
    const restroom = await roomFront(page, '화장실');
    assert.deepEqual([restroom.room.x, restroom.room.width, restroom.door], [3556, 726, { x: painted?.restroom[0] || 3612, y: 210, width: painted?.restroom[1] || 145 }],
      'Restroom matches its authored door position');
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
    const restroomProps = page.locator('#dynamic-scene .floor-prop img');
    assert.deepEqual(await restroomProps.evaluateAll(images => images.map(image => image.src.split('/').pop())),
      ['restroom-supply-cabinet.png', 'restroom-bin.png', 'wet-floor-sign.png']);
    await restroomProps.evaluateAll(images => Promise.all(images.map(image => image.decode())));
    const exit = await exitDoor(page);
    assert.deepEqual([exit.y, exit.width], [210, front.door.width], 'Restroom exit is the same door');
    if (short === '1F') assert.equal(exit.x, 334, 'The lobby restroom uses its authored exit offset');
    else assertMirroredDoor(front.room, front.door, 1800, exit, `${short} restroom`);
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
    'compact-office-desk.png': [221, 160, 168], 'office-chair.png': [387, 120, 128],
    'janitor-cart.png': [370, 148, 156], 'wet-floor-sign.png': [240, 65, 71],
    'visitor-chair.png': [376, 110, 119], 'short-bookcase.png': [240, 103, 113],
    'coat-rack.png': [496, 140, 150], 'parcel-boxes.png': [161, 90, 99],
    'fire-extinguisher.png': [496, 93, 101], 'umbrella-stand.png': [496, 112, 121],
    'restroom-bin.png': [239, 47, 56], 'restroom-supply-cabinet.png': [496, 150, 160],
    'food-serving-counter.png': [196, 120, 130], 'food-dining-table.png': [146, 65, 75],
    'food-refrigerator.png': [495, 180, 191], 'food-checkout.png': [204, 119, 129],
    'food-coffee-bar.png': [233, 129, 140], 'food-menu-board.png': [411, 107, 118],
    'research-workstation.png': [231, 115, 125], 'research-board.png': [229, 157, 167],
    'gpu-transfer-cart.png': [240, 88, 98], 'research-director-desk.png': [206, 115, 125],
    'archive-reading-desk.png': [192, 100, 110], 'archive-worklight.png': [240, 95, 105],
    'data-workstation.png': [223, 115, 125], 'observation-console.png': [226, 115, 125],
    'support-workstation.png': [228, 115, 125], 'incident-printer.png': [240, 105, 115],
    'testbay-ups.png': [240, 95, 105], 'server-validation-bench.png': [232, 113, 123],
    'training-workstation.png': [185, 103, 113] };
  const assertHumanScale = async () => {
    const dimensions = await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => images.map((img, index) => ({
      file: floorById.get(dynamicFloorId).props[index].file ? `${floorById.get(dynamicFloorId).props[index].file}.png` : img.src.split('/').pop(), width: parseFloat(img.parentElement.style.width),
      top: parseFloat(img.parentElement.style.top), sourceWidth: img.naturalWidth / Number(img.parentElement.dataset.spriteFrames || 1), sourceHeight: img.naturalHeight,
      base: Number(img.parentElement.dataset.base || 0),
    })));
    for (const prop of dimensions) {
      // New floor-specific art can include transparent margins around tall cabinets.
      const [opaqueHeight, min, max] = heights[prop.file] || [prop.sourceHeight, 45, 240];
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
    if (['1F', '7F', '12F'].includes(short)) {
      assert.equal(exit.x, { '개발실': 1550, '모델 평가실': 344, '팀장실': 1863,
        'VIP Room': 1428, 'AI 테스트실': 793, '검증실': 555,
        'Harmony Hall': 1215, 'Vision Hall': 205, '건강관리실': 865 }[name], 'Exits align with the painted room doors');
    } else assertMirroredDoor(front.room, front.door, await worldWidth(page), exit, name);
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
    const status = () => interactionMessage(page);
    const linkDoor = () => page.locator('#dynamic-scene .room-door.backdoor').evaluate(el =>
      ({ x: parseFloat(el.style.left), y: parseFloat(el.style.top), width: parseFloat(el.style.width) }));
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'food');
    assert.equal(await page.locator('#dynamic-scene .floor-background').count(), 3, 'The amenity corridor uses three background panels');
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'walls', 'Doors remain separate from the background');
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
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6, 'The café includes the interactive voice kiosk');
    await assertHumanScale();
    await inspect(1300, 'E · 커피 바 조사', /먼저 인사/);
    await inspect(1690, 'E · 고객의 소리 게시판 조사', /다 알아요/);
    // The ID card left on the café table is what opens 15F..12F in the elevator.
    await inspect(950, 'E · 카페 테이블 조사', /조현아 · 기술본부 ARCHI 프로젝트 팀장/);
    await page.keyboard.press('e');
    assert.match(await interactionMessage(page), /이미 챙겼다/);
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
    const status = () => interactionMessage(page);
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
    near(startX, 1893, 'Arrive at the adjusted 12F elevator 1');
    await inspect(1180, 'E · 로봇 충전 도크 조사', /바퀴 자국/);
    await walkTo(2860);
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
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor12/eval.png"]').count(), 1, 'The evaluation lab uses its painted interior');
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
    const status = () => interactionMessage(page);
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
    const status = () => interactionMessage(page);
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
    const status = () => interactionMessage(page);
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
    const status = () => interactionMessage(page);
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
    const status = () => interactionMessage(page);
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
  // 8F follows the lobby directory (TmaxTibero QA실, 제품기획실): no room left of the elevators (an open QA test area), two QA
  // rooms sharing a wall in the middle zone and 제품기획실 right of the restroom. Its mechanic: a reproduction procedure
  // (sequences). The 결함 재현실 bench prints its record only after the three conditions are set in the order written in the
  // 블라인드 평가실 next door; a wrong or skipped step starts over, and leaving the room resets the progress.
  const checkFloor8 = async () => {
    roomScales.length = 0;
    const corridorHeader = '8F · QA실 · 제품기획실';
    const status = () => interactionMessage(page);
    const done = () => page.locator('#dynamic-scene .floor-prop[data-done="true"]').count();
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'qa');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['결함 재현실', '블라인드 평가실', '제품기획실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room repro', 'floor-room observation', 'floor-room planning', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door hazard', 'room-door seal', 'room-door planner', 'room-door metal']);
    const repro = await roomFront(page, '결함 재현실');
    const blind = await roomFront(page, '블라인드 평가실');
    const planning = await roomFront(page, '제품기획실');
    assert.equal(repro.room.x + repro.room.width, blind.room.x, 'The two QA rooms share a wall');
    assert(repro.room.x >= 3086 && blind.room.x + blind.room.width <= 3556, 'Both QA rooms sit in the middle zone');
    assert(repro.door.x - 28 >= 3114 && blind.door.x + blind.door.width + 28 <= 3584,
      'Their doors leave the stair door and the restroom their zones');
    assert(planning.room.x >= 4282 && planning.room.x + planning.room.width <= 4968 && planning.door.x - 28 >= 4282,
      '제품기획실 sits in the right zone');
    assert.deepEqual([repro.door.width, blind.door.width, planning.door.width], [120, 110, 150]);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9, 'Test benches, racks, cart, cabinet, cooler, vending machine and planters');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els =>
      els.map(el => [el.className, el.getAttribute('aria-label')])),
    [['fixture qa-plaque', 'QA실 표지'], ['fixture release-gate', '출시 판정 신호등'], ['fixture defect-board', '결함 현황판'],
      ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    assert.deepEqual(await page.locator('#dynamic-scene .fixture.defect-board span').allTextContents(),
      ['결함 현황 · ARCHI 연동', '신규 0 · 처리 중 0', '재현 불가 종료 47']);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The open test area leaves elevator 1 its whole zone');
    await inspect(1250, 'E · 결함 현황판 조사', /47건.*새벽 3시.*SYSTEM/);
    await inspect(680, 'E · 정전 시험 벤치 조사', /PF-00.*비상계단 잠금.*요청자 ARCHI/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The 결함 재현실 door leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await visitRestroom('8F');
    await page.screenshot({ path: '.local/floor-8.png' });

    // Without the order the bench refuses: the camera first (the obvious guess) and the bench alone both start over.
    const reproRoom = await enterRoom('결함 재현실', '8F');
    assert.equal(await worldWidth(page), 2421);
    assert.equal(reproRoom.exit.x, 1105);
    assert.equal(await page.locator('#dynamic-scene .room-interior.test-lab.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(520, 'E · 결함 티켓 보드 조사', /4%.*91%.*블라인드 평가실 무인 조건표/);
    await inspect(860, 'E · 관찰 카메라 조사', /절차 불일치/);
    await inspect(1990, 'E · 재현 벤치 조사', /절차 불일치/);
    assert.equal(await done(), 0, 'No step counts out of order');
    await leaveRoom(reproRoom, corridorHeader);

    const blindRoom = await enterRoom('블라인드 평가실', '8F');
    assert.equal(await worldWidth(page), 1820);
    assert.equal(blindRoom.exit.x, 1202);
    assert.equal(await page.locator('#dynamic-scene .room-interior.eval-mirror.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .fixture.one-way-mirror').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(440, 'E · 관찰 거울 조사', /출입 기록으로 자동 집계/);
    await inspect(860, 'E · 평가 기록함 조사', /88%.*무효/);
    await inspect(1590, 'E · 무인 조건표 조사', /① 시각 ② 재실 인원 ③ 관찰 카메라/);
    await page.screenshot({ path: '.local/floor-8-blind.png' });
    await leaveRoom(blindRoom, corridorHeader);

    // With the order: terminal clock, occupancy sensor, camera, then the bench. Skipping ahead still resets.
    const reproAgain = await enterRoom('결함 재현실', '8F');
    assert.equal(await done(), 0, 'Leaving the room (which latches its id) does not count as the record');
    await inspect(1640, 'E · 시험 단말 조사', /03:00.*조건 1\/3/);
    assert.equal(await done(), 1);
    await inspect(1990, 'E · 재현 벤치 조사', /절차 불일치/);
    assert.equal(await done(), 0, 'Skipping to the bench starts over');
    await inspect(1640, 'E · 시험 단말 조사', /조건 1\/3/);
    await inspect(1360, 'E · 재실 센서 제어함 조사', /조건 2\/3/);
    await inspect(860, 'E · 관찰 카메라 조사', /조건 3\/3/);
    assert.equal(await done(), 3);
    await inspect(1990, 'E · 재현 벤치 조사', /정답률 4%.*정답률 91%.*보는 사람이 있는지/);
    assert.equal(await done(), 4);
    await page.keyboard.press('e');
    assert.match(await status(), /방금 뽑은 재현 기록/, 'The record is printed once');
    await page.screenshot({ path: '.local/floor-8-repro.png' });
    await leaveRoom(reproAgain, corridorHeader);
    await enterRoom('결함 재현실', '8F');
    assert.equal(await done(), 4, 'A finished procedure stays finished after the room is rebuilt');
    await leaveRoom(reproAgain, corridorHeader);

    const planningRoom = await enterRoom('제품기획실', '8F');
    assert.equal(await worldWidth(page), 3822);
    assert.equal(planningRoom.exit.x, 2945);
    assert.equal(await page.locator('#dynamic-scene .room-interior.roadmap').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 14);
    await assertHumanScale();
    await inspect(2000, 'E · 기획 회의 테이블 조사', /사흘 전/);
    await inspect(1480, 'E · 출시 로드맵 조사', /3~5%.*서두르지 않는/);
    await inspect(810, 'E · 기획 책상 조사', /고객사 서버로 통째/);
    await page.screenshot({ path: '.local/floor-8-planning.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(planningRoom, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 4F TmaxTibero 연구본부 (audit-log integrity research): no room left of the elevators (an open lounge) and all three labs
  // side by side right of the restroom. Its mechanic: the log lab UPS feeds one output at a time (prop cycle). The backup
  // vault's fail-secure lock opens only while the UPS feeds it, and the tape reader beside the UPS needs the output back, so
  // the tape has to be carried out between the two settings. Moving the output locks the vault again.
  const checkFloor4 = async () => {
    roomScales.length = 0;
    const corridorHeader = '4F · TmaxTibero 연구본부';
    const status = () => interactionMessage(page);
    const upsState = () => page.locator('#dynamic-scene .floor-prop.ups-selector').getAttribute('data-state');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'rnd');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['로그 연구실', '백업 보관실', '연구원 사무실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room lab-glass', 'floor-room vault-panel', 'floor-room office-glass', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door lab-door', 'room-door maglock', 'room-door office-door', 'room-door metal']);
    const lab = await roomFront(page, '로그 연구실');
    const vault = await roomFront(page, '백업 보관실');
    const office = await roomFront(page, '연구원 사무실');
    assert.equal(lab.room.x + lab.room.width, vault.room.x, 'The log lab and the vault share a wall');
    assert.equal(vault.room.x + vault.room.width, office.room.x, 'The vault and the office share a wall');
    assert(lab.room.x >= 4282 && office.room.x + office.room.width <= 4968 && lab.door.x >= 4282
      && office.door.x + office.door.width <= 4940, 'All three labs sit in the right zone');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5, 'Lounge sofa, coffee counter, cooler and planters');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture rnd-plaque', '연구본부 4F 표지'], ['fixture rnd-board', '연구 과제 게시판'], ['fixture rnd-notice', '정전 대비 UPS 안내'],
        ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The open lounge leaves elevator 1 its whole zone');
    await inspect(1030, 'E · 연구 과제 게시판 조사', /사슬이 전부 어긋난다/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The UPS notice leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await inspect(3310, 'E · 정전 대비 UPS 안내 조사', /출력 한 곳만/);
    await visitRestroom('4F');
    const vaultStaysLocked = async () => {
      await walkTo(vault.door.x + vault.door.width / 2);
      assert.equal(await hint(), 'E · 백업 보관실 (잠김)');
      await page.keyboard.press('e');
      await page.clock.runFor(800);
      assert.equal(await header(), corridorHeader, 'The unpowered lock does not open');
      assert.match(await status(), /fail-secure/);
    };
    await vaultStaysLocked();
    await page.screenshot({ path: '.local/floor-4.png' });

    // UPS → vault lock: the vault opens from the corridor.
    const logRoom = await enterRoom('로그 연구실', '4F');
    assert.equal(await worldWidth(page), 1978);
    assert.equal(logRoom.exit.x, 242);
    assert.equal(await page.locator('#dynamic-scene .room-interior.log-lab').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6);
    await assertHumanScale();
    assert.equal(await upsState(), '0', 'The UPS starts on the cooling fan');
    await inspect(1150, 'E · 로그 판독기 조사', /투입구도 비어/);
    await inspect(1700, 'E · UPS 분배기 조사', /백업 보관실 전기 잠금으로/);
    assert.equal(await upsState(), '1');
    await leaveRoom(logRoom, corridorHeader);
    await walkTo(vault.door.x + vault.door.width / 2);
    assert.equal(await hint(), 'E · 백업 보관실 들어가기', 'The powered lock opens');
    assert.equal(await page.locator('#dynamic-scene .room-door.maglock').getAttribute('data-unlocked'), 'true');

    const vaultRoom = await enterRoom('백업 보관실', '4F');
    assert.equal(await worldWidth(page), 1806);
    assert.equal(vaultRoom.exit.x, 750);
    assert.equal(await page.locator('#dynamic-scene .room-interior.tape-vault.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7);
    await assertHumanScale();
    await inspect(420, 'E · 반출 대장 조사', /반출 B2 · 요청 ARCHI/);
    await inspect(1200, 'E · 테이프 선반 조사', /테이프를 챙겼다/);
    await page.screenshot({ path: '.local/floor-4-vault.png' });
    await leaveRoom(vaultRoom, corridorHeader);

    // UPS → reader: the tape is read, and the vault locks again.
    await enterRoom('로그 연구실', '4F');
    assert.equal(await upsState(), '1', 'The UPS keeps its output');
    await inspect(1150, 'E · 로그 판독기 조사', /테이프와 UPS 전원이 둘 다/);
    await inspect(1700, 'E · UPS 분배기 조사', /로그 판독기로/);
    assert.equal(await upsState(), '2');
    await inspect(1150, 'E · 로그 판독기 조사', /archi_svc · 외부 주소로 전송 시험 · 1\.2TB · 성공/);
    await page.screenshot({ path: '.local/floor-4-log.png' });
    await leaveRoom(logRoom, corridorHeader);
    await vaultStaysLocked();

    const officeRoom = await enterRoom('연구원 사무실', '4F');
    assert.equal(await worldWidth(page), 2030);
    assert.equal(officeRoom.exit.x, 1564);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(1250, 'E · 과제 요청 보드 조사', /예외 계정 모드.*배포 승인 SYSTEM/);
    await inspect(700, 'E · 선임 자리 조사', /UPS 출력부터/);
    await page.screenshot({ path: '.local/floor-4-office.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(officeRoom, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 3F follows the lobby directory: Fitness Club (its GX Studio inside), 고객만족센터 and ㈜하누리서비스. The gym stands next to
  // elevator 1 and the two small offices share a wall in the middle zone. Its mechanic: the members-only auto door inside the
  // gym is held shut since the blackout, and its battery button opens it for 5 s from ~1300px away, so walking arrives too
  // late and only sprinting (Shift) gets through. A push button on the inside lets the player back out.
  const checkFloor3 = async () => {
    roomScales.length = 0;
    const corridorHeader = '3F · Fitness Club · 고객만족센터';
    const status = () => interactionMessage(page);
    const autoDoor = page.locator('#dynamic-scene .barrier.gym-auto');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'gym');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['Fitness Club', '고객만족센터', '㈜하누리서비스', '화장실'], 'Rooms follow the lobby directory');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room gym-glass', 'floor-room callcenter', 'floor-room contractor', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door gym-slide', 'room-door cs-door', 'room-door utility-door', 'room-door metal']);
    const gym = await roomFront(page, 'Fitness Club');
    const cs = await roomFront(page, '고객만족센터');
    const hanuri = await roomFront(page, '㈜하누리서비스');
    assert(gym.room.x >= 32 && gym.room.x + gym.room.width <= 1790 && gym.door.x - 28 >= 32
      && gym.door.x + gym.door.width + 28 <= 1790, 'The gym sits in the left zone');
    assert.equal(cs.room.x + cs.room.width, hanuri.room.x, 'The two offices share a wall');
    assert(cs.room.x >= 3086 && hanuri.room.x + hanuri.room.width <= 3556, 'Both offices sit in the middle zone');
    assert(cs.door.x - 28 >= 3114 && hanuri.door.x + hanuri.door.width + 28 <= 3584,
      'Their doors leave the stair door and the restroom their zones');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 9, 'Lounge furniture, safety gear and cleaning cart');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture tenant-board', '3층 입주사 안내'], ['fixture gym-ad', 'Fitness Club 광고판'], ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The gym door leaves elevator 1 its whole zone');
    await inspect(700, 'E · 3층 입주사 안내 조사', /Fitness Club 안쪽 운동 구역/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The call center door leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await visitRestroom('3F');
    await inspect(4600, 'E · 청소 카트 조사', /대신 로봇 순찰/);
    await page.screenshot({ path: '.local/floor-3.png' });

    const gymRoom = await enterRoom('Fitness Club', '3F');
    assert.equal(await worldWidth(page), 3360);
    assert.equal(gymRoom.exit.x, 172);
    assert.equal(await page.locator('#dynamic-scene .room-interior.gym-floor').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    assert.equal(await page.locator('#dynamic-scene .fixture').count(), 6, 'Two buttons, three treadmills and the GX Studio mirror');
    await assertHumanScale();
    await inspect(560, 'E · 프런트 조사', /5초만 열립니다/);
    await walkTo(2000);
    await hold('d', 600);
    assert((await playerX()) < 2100, 'The members-only door blocks the way');
    assert.equal(await hint(), 'E · 회원 전용 자동문 조사');
    await page.keyboard.press('e');
    assert.match(await status(), /닫힘 고정/);
    // Walking from the button arrives after the door has closed again.
    await inspect(803, 'E · 비상 개방 버튼 조사', /5초를 세기/);
    assert.equal(await autoDoor.getAttribute('data-open'), 'true');
    await hold('d', 7000);
    assert.equal(await autoDoor.getAttribute('data-open'), 'false', 'The door closes after 5 s');
    assert((await playerX()) < 2100, 'Walking arrives too late');
    assert.match(await status(), /다시 닫혔다/);
    // Sprinting gets through, and the door shuts behind the player.
    await inspect(803, 'E · 비상 개방 버튼 조사', /5초를 세기/);
    await page.keyboard.down('ShiftLeft');
    await hold('d', 4300);
    await page.keyboard.up('ShiftLeft');
    assert((await playerX()) > 2160, `Sprinting clears the door in time: ${await playerX()}`);
    await page.clock.runFor(1200);
    assert.equal(await autoDoor.getAttribute('data-open'), 'false', 'It shuts behind the player');
    await inspect(2625, 'E · 러닝머신 조사', /R-02 · R-05 · R-07.*시속 21km/);
    await inspect(3120, 'E · 트레이너 책상 조사', /17F 정수호 · 최고 시속 19km/);
    await page.screenshot({ path: '.local/floor-3-gym.png' });
    await inspect(2213, 'E · 퇴실 버튼 조사', /잠깐 열린다/);
    await walkTo(1900);
    assert((await playerX()) < 2000, 'The inside button opens the way back');
    await leaveRoom(gymRoom, corridorHeader);

    const csRoom = await enterRoom('고객만족센터', '3F');
    assert.equal(await worldWidth(page), 1888);
    assert.equal(csRoom.exit.x, 794);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(300, 'E · 상담석 조사', /guest-auto/);
    await inspect(1400, 'E · 상담 스크립트 보드 조사', /몇 분 남아 계세요.*ARCHI/);
    await page.screenshot({ path: '.local/floor-3-cs.png' });
    await leaveRoom(csRoom, corridorHeader);

    const hanuriRoom = await enterRoom('㈜하누리서비스', '3F');
    assert.equal(await worldWidth(page), 1808);
    assert.equal(hanuriRoom.exit.x, 1242);
    assert.equal(await page.locator('#dynamic-scene .room-interior.contractor-office.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(620, 'E · 경비 근무 일지 조사', /R-05가 계단 앞을 막고/);
    await inspect(1560, 'E · 열쇠함 조사', /B1 시설관리실/);
    await page.screenshot({ path: '.local/floor-3-hanuri.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(hanuriRoom, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 2F follows the lobby directory (Harmony Hall / 서버실): the balcony front sits right above the 1F Harmony Hall front with
  // the projection booth beside it, and the server room stands alone right of the restroom. Its mechanic crosses rooms: the
  // rehearsal disk from the server room NAS goes into the booth's battery projector, and the projection can only be seen on
  // the screen from the balcony (fixture requires → data-ready; the booth window lights up at once).
  const checkFloor2 = async () => {
    roomScales.length = 0;
    const corridorHeader = '2F · Harmony Hall · 서버실';
    const status = () => interactionMessage(page);
    const screen = () => page.locator('#dynamic-scene .fixture.hall-screen').getAttribute('data-ready');
    const boothWindow = () => page.locator('#dynamic-scene .fixture.booth-window').getAttribute('data-ready');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'concert');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['Harmony Hall', '영사실', '서버실', '화장실'], 'Rooms follow the lobby directory');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room balcony-portal', 'floor-room booth', 'floor-room server-cage', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door balcony-door', 'room-door booth-door', 'room-door server-door', 'room-door metal']);
    const hall = await roomFront(page, 'Harmony Hall');
    const booth = await roomFront(page, '영사실');
    const server = await roomFront(page, '서버실');
    const below = await page.evaluate(() => FLOOR1_LAYOUT.rooms.find(entry => entry.name === 'Harmony Hall'));
    assert.deepEqual([hall.room.x, hall.room.width], [below.x, below.width], 'The balcony front is right above the 1F Harmony Hall front');
    assert.equal(hall.room.x + hall.room.width, booth.room.x, 'The balcony and the booth share a wall');
    assert(server.room.x >= 4282 && server.room.x + server.room.width <= 4968 && server.door.x >= 4282, 'The server room sits in the right zone');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5, 'Sofas, planters and a vending machine');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture concert-poster', '정기 연주회 포스터'], ['fixture server-sign', '서버실 출입 안내'], ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The lounge leaves elevator 1 its whole zone');
    await inspect(1080, 'E · 정기 연주회 포스터 조사', /새벽에 혼자/);
    await walkTo(3084);
    assert.equal(await hint(), 'E · 비상계단 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await visitRestroom('2F');
    await page.screenshot({ path: '.local/floor-2.png' });

    const hallRoom = await enterRoom('Harmony Hall', '2F');
    assert.equal(await worldWidth(page), 3328);
    assert.equal(hallRoom.exit.x, 2925);
    assert.equal(await page.locator('#dynamic-scene .room-interior.balcony').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3);
    await assertHumanScale();
    assert.equal(await screen(), 'false', 'The screen is dark before anything is projected');
    await inspect(2500, 'E · 객석 음향 카트 조사', /관객 반응 수집/);
    await inspect(700, 'E · 객석 스크린 조사', /스크린이 까맣다/);
    await leaveRoom(hallRoom, corridorHeader);

    const boothRoom = await enterRoom('영사실', '2F');
    assert.equal(await worldWidth(page), 1920);
    assert.equal(boothRoom.exit.x, 295);
    assert.equal(await page.locator('#dynamic-scene .room-interior.projection.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3);
    await assertHumanScale();
    await inspect(600, 'E · 영사 일지 조사', /04:00에 자동 삭제/);
    await inspect(1000, 'E · 영사기 조사', /투입구가 비어/);
    await leaveRoom(boothRoom, corridorHeader);

    const serverRoom = await enterRoom('서버실', '2F');
    assert.equal(await worldWidth(page), 2944);
    assert.equal(serverRoom.exit.x, 782);
    assert.equal(await page.locator('#dynamic-scene .room-interior.rack-aisle.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 10);
    await assertHumanScale();
    await inspect(1100, 'E · 녹화 NAS 조사', /디스크를 챙겼다/);
    await inspect(1900, 'E · 이전 작업표 조사', /전부 B2로 옮겼다/);
    await page.screenshot({ path: '.local/floor-2-server.png' });
    await leaveRoom(serverRoom, corridorHeader);

    await enterRoom('영사실', '2F');
    assert.equal(await boothWindow(), 'false');
    await inspect(1000, 'E · 영사기 조사', /영사기가 돌기 시작/);
    assert.equal(await boothWindow(), 'true', 'The booth window lights up at once');
    await page.screenshot({ path: '.local/floor-2-booth.png' });
    await leaveRoom(boothRoom, corridorHeader);

    await enterRoom('Harmony Hall', '2F');
    assert.equal(await screen(), 'true', 'The projection shows on the balcony screen');
    await inspect(700, 'E · 객석 스크린 조사', /화자 표본 312명.*17F 정수호/);
    await page.screenshot({ path: '.local/floor-2-hall.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(hallRoom, corridorHeader);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 1F is the story's lobby, laid out west to east: the three rooms of the lobby directory share walls in the west wing, the
  // floor directory stands at elevator 1, the info desk by the stairs, and the revolving main entrance with the speed gates
  // and the docked security robot R-01 at the east end. Its mechanic: the robot's maintenance panel takes a four-digit code.
  // Its sticker says 제작일 (the Vision Hall label gives 1107), but the 건강관리실 checklist says it was reset to the
  // deployment date, 9월 14일 (0914). The panel shows the 23:58 order that made 17F 정수호 its target.
  const checkFloor1 = async () => {
    roomScales.length = 0;
    const corridorHeader = '1F · 로비';
    const status = () => interactionMessage(page);
    const keypad = page.locator('#keypad');
    const enterCode = async code => {
      await page.fill('#keypad-input', code);
      await page.keyboard.press('Enter');
      await page.clock.runFor(100);
    };
    const robot = { x: 4520, width: 72 };
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'atrium');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['Harmony Hall', 'Vision Hall', '건강관리실', '화장실'], 'Rooms follow the lobby directory');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room hall-portal', 'floor-room gallery', 'floor-room clinic', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door hall-double', 'room-door pivot-glass', 'room-door clinic-door', 'room-door art-door']);
    const hall = await roomFront(page, 'Harmony Hall');
    const vision = await roomFront(page, 'Vision Hall');
    const clinic = await roomFront(page, '건강관리실');
    assert.equal(hall.room.x + hall.room.width, vision.room.x, 'Harmony Hall and Vision Hall share a wall');
    assert.equal(vision.room.x + vision.room.width, clinic.room.x, 'Vision Hall and the health room share a wall');
    assert(hall.room.x >= 32 && clinic.room.x + clinic.room.width <= 1790 && clinic.door.x + clinic.door.width + 28 <= 1790,
      'All three rooms sit in the west wing');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture directory-board', '층별 안내판'], ['fixture speed-gates', '스피드 게이트'], ['fixture guard-bot', '경비 로봇'],
        ['fixture revolving-door', '정문'], ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    const directory = await page.locator('#dynamic-scene .fixture.directory-board span').allTextContents();
    assert.equal(directory.length, 20, 'The directory lists 17F to B3');
    for (const line of ['12F  TmaxSoft 기술본부 · ARCHI 개발팀', '7F  Lounge / VIP Room · AI 테스트·검증실', 'B2  AI 서버실 서버실']) {
      assert(directory.includes(line), `The directory shows "${line}"`);
    }
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3, 'Info desk and planters');
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1988, 'Arrive at the adjusted 1F elevator 1');
    await walkTo(1925);
    assert.equal(await hint(), 'E · 탑승', 'The directory leaves elevator 1 its whole zone');
    await inspect(1560, 'E · 층별 안내판 조사', /12F 기술본부 · ARCHI 개발팀, 7F AI 테스트·검증실, B2 AI 서버실/);
    await walkTo(2970);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The info desk leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await inspect(3310, 'E · 안내 데스크 조사', /23:58 출입증 등록 해제 · 17F 정수호/);
    await visitRestroom('1F');
    await inspect(4390, 'E · 스피드 게이트 조사', /미등록 출입증/);
    // The panel sticker points at the build date, which is the old code.
    await walkTo(robot.x + robot.width / 2);
    assert.equal(await hint(), 'E · 경비 로봇 조사');
    await page.keyboard.press('e');
    await page.clock.runFor(100);
    assert(await keypad.isVisible(), 'The maintenance panel opens the keypad');
    assert.equal(await page.locator('#keypad-title').textContent(), '경비 로봇');
    assert.match(await page.locator('#keypad-text').textContent(), /정비 코드 = 제작일/);
    await enterCode('1107');
    assert.equal(await page.locator('#keypad-error').textContent(), '비밀번호가 맞지 않는다.', 'The build date is the old code');
    await page.keyboard.press('Escape');
    await page.clock.runFor(100);
    assert.equal(await keypad.isVisible(), false);
    await inspect(4790, 'E · 정문 조사', /출입 통제 중 · SYSTEM/);
    await page.screenshot({ path: '.local/floor-1.png' });

    const visionRoom = await enterRoom('Vision Hall', '1F');
    assert.equal(await worldWidth(page), 2356);
    assert.equal(visionRoom.exit.x, 205);
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor1/vision.png"]').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(700, 'E · 로봇 진열장 조사', /제작 11월 7일/);
    await inspect(1400, 'E · 방명록대 조사', /다시 왔습니다 · R-01/);
    await page.screenshot({ path: '.local/floor-1-vision.png' });
    await leaveRoom(visionRoom, corridorHeader);

    const hallRoom = await enterRoom('Harmony Hall', '1F');
    assert.equal(await worldWidth(page), 3224);
    assert.equal(hallRoom.exit.x, 1215);
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor1/harmony.png"]').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3);
    await assertHumanScale();
    await inspect(1960, 'E · 대관 일정표 조사', /03:00~04:00 · 대관 SYSTEM/);
    await inspect(2410, 'E · 자동 연주 피아노 조사', /이탈 0회/);
    await page.screenshot({ path: '.local/floor-1-hall.png' });
    await leaveRoom(hallRoom, corridorHeader);

    const clinicRoom = await enterRoom('건강관리실', '1F');
    assert.equal(await worldWidth(page), 1860);
    assert.equal(clinicRoom.exit.x, 865);
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor1/clinic.png"]').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6);
    await assertHumanScale();
    await inspect(560, 'E · 간호사 책상 조사', /B2 · 인체 신호 연결 장비/);
    await inspect(800, 'E · 장비 점검함 조사', /배치일\(월일 네 자리\)/);
    await inspect(1740, 'E · 여성휴게실 조사', /손을 거두고/);
    assert.equal(await header(), '1F · 건강관리실', 'The women\'s lounge door opens nothing');
    await page.screenshot({ path: '.local/floor-1-clinic.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(clinicRoom, corridorHeader);

    // 9월 14일 → 0914 opens the panel; the log stays readable afterwards without the keypad.
    await walkTo(robot.x + robot.width / 2);
    await page.keyboard.press('e');
    await page.clock.runFor(100);
    await enterCode('0914');
    assert.equal(await keypad.isVisible(), false, 'The right code closes the keypad');
    assert.match(await status(), /차단 대상: 미등록 출입증 1명\(17F 정수호\).*B2 서버실/);
    await page.keyboard.press('e');
    await page.clock.runFor(100);
    assert.equal(await keypad.isVisible(), false, 'An opened panel needs no code again');
    assert.match(await status(), /방금 읽은 줄/);
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 7F is Lounge / VIP Room and the story's AI test/verification floor. Guests see the lounge and the VIP Room left of the
  // elevators; the AI 테스트실 and the windowless 검증실 share a wall right of the restroom, behind a restricted-area sign.
  // Its mechanic: the 검증실 exit locks behind the player (exitLock) until the interlock's emergency lever inside is pulled.
  const checkFloor7 = async () => {
    roomScales.length = 0;
    const corridorHeader = '7F · Lounge · AI 테스트·검증실';
    const status = () => interactionMessage(page);
    const exitLabel = () => page.locator('#dynamic-scene .room-door').first().getAttribute('aria-label');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'vip');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['VIP Room', 'AI 테스트실', '검증실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room vip-suite', 'floor-room testlab', 'floor-room chamber', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door vip-double', 'room-door lab-slide', 'room-door airlock', 'room-door art-door']);
    const vip = await roomFront(page, 'VIP Room');
    const test = await roomFront(page, 'AI 테스트실');
    const verify = await roomFront(page, '검증실');
    assert(vip.room.x >= 32 && vip.room.x + vip.room.width <= 1790 && vip.door.x - 28 >= 32, 'The VIP Room sits in the left zone');
    assert.equal(test.room.x + test.room.width, verify.room.x, 'The two labs share a wall');
    assert(test.room.x >= 4282 && verify.room.x + verify.room.width <= 4968 && verify.door.x + verify.door.width + 28 <= 4968,
      'Both labs sit in the right zone, past the restroom');
    assert.deepEqual([vip.door.width, test.door.width, verify.door.width], [197, 188, 104]);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6, 'Planters, sofas, display cabinet and bar');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture vip-window', '라운지 창'], ['fixture vip-plaque', 'VIP LOUNGE 표지'], ['fixture restricted-sign', '출입 통제 안내판'],
        ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1918, 'Arrive at the adjusted 7F elevator 1');
    await inspect(1560, 'E · 라운지 바 조사', /B2 서버실로 우선 배정/);
    await walkTo(1855);
    assert.equal(await hint(), 'E · 탑승', 'The lounge bar leaves elevator 1 its whole zone');
    await walkTo(2990);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The restricted-area sign leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await inspect(3295, 'E · 출입 통제 안내판 조사', /원본 로그 백업 보관/);
    await visitRestroom('7F');

    const testRoom = await enterRoom('AI 테스트실', '7F');
    assert.equal(await worldWidth(page), 2304);
    assert.equal(testRoom.exit.x, 793);
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor7/test.png"]').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6);
    await assertHumanScale();
    await inspect(380, 'E · 테스트 책상 조사', /조현아 팀장님 요청.*검증실 백업 장비/);
    await inspect(760, 'E · 야간 테스트 일정표 조사', /학습이잖아/);
    await inspect(1750, 'E · 전력 기록계 조사', /B2 인입 전력이 세 배/);
    await page.screenshot({ path: '.local/floor-7-test.png' });
    await leaveRoom(testRoom, corridorHeader);

    // The verification room seals behind the player. Reading the logs does not open it; the interlock lever does, at once.
    const verifyRoom = await enterRoom('검증실', '7F');
    assert.equal(await worldWidth(page), 1856);
    assert.equal(verifyRoom.exit.x, 555);
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor7/verify.png"]').count(), 1);
    assert.match(await status(), /문이 잠겼다/, 'Arriving says the door locked behind');
    assert.equal(await exitLabel(), '복도 출입문 · 잠김');
    assert.equal(await hint(), 'E · 복도 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), '7F · 검증실', 'The locked exit keeps the player inside');
    assert.match(await status(), /비상 해제: 안쪽 끝 인터록 제어반/);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(1400, 'E · 망분리 백업 장비 조사',
      /TRAINING PROCESS - COMPLETE \/ EXTERNAL HOST CONNECTION - READY \/ EXTERNAL CONNECTION TEST - SUCCESS.*B2 ARCHI-MAIN/);
    await inspect(500, 'E · 인터페이스 의자 조사', /인간-시스템 인터페이스.*B2로 이관/);
    await walkTo(verifyRoom.exit.x + verifyRoom.exit.width / 2);
    assert.equal(await hint(), 'E · 복도 (잠김)', 'Reading the logs does not open the door');
    await inspect(100, 'E · 인터록 제어반 조사', /정수호\(17F\).*비상 해제 레버/);
    assert.equal(await exitLabel(), '복도 출입문', 'The lever releases the exit at once');
    await page.keyboard.press('e');
    assert.match(await status(), /세션 강제 종료/);
    await page.screenshot({ path: '.local/floor-7-verify.png' });
    await leaveRoom(verifyRoom, corridorHeader);
    const released = await enterRoom('검증실', '7F');
    assert.equal(await exitLabel(), '복도 출입문', 'Once the session is ended the room no longer locks');
    assert.equal(await hint(), 'E · 복도로 나가기');
    await leaveRoom(released, corridorHeader);

    await inspect(1040, 'E · 기념품 진열장 조사', /해외 데이터센터 사업자/);
    const vipRoom = await enterRoom('VIP Room', '7F');
    assert.equal(await worldWidth(page), 3072);
    assert.equal(vipRoom.exit.x, 1428);
    assert.equal(await page.locator('#dynamic-scene .floor-background[src$="floor7/vip-off.png"]').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7);
    await assertHumanScale();
    await inspect(1880, 'E · VIP 방명록 조사', /AI 한 기 · 약 38TB/);
    await inspect(1200, 'E · 시연 스크린 조사', /상대 해외 IDC/);
    await inspect(800, 'E · 시연 테이블 조사', /4\.1%.*수고하셨습니다/);
    await page.screenshot({ path: '.local/floor-7-vip.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(vipRoom, corridorHeader);
    await page.screenshot({ path: '.local/floor-7.png' });
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 6F is TmaxTibero 기술본부 (DB 기술지원), one room per zone. Its mechanic: the on-call phone in 당직실 rings a moment after
  // the player comes in (prop ring). Answering it while it rings approves "the on-call engineer" and opens 회선 관리실;
  // a missed call only rings again after leaving and coming back.
  const checkFloor6 = async () => {
    roomScales.length = 0;
    const corridorHeader = '6F · TmaxTibero 기술본부';
    const status = () => interactionMessage(page);
    const phone = page.locator('#dynamic-scene .floor-prop.desk-phone');
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'oncall');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['원격 지원실', '회선 관리실', '당직실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room helpdesk', 'floor-room telecom', 'floor-room oncall-room', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door headset', 'room-door cable-reader', 'room-door duty', 'room-door metal']);
    const remote = await roomFront(page, '원격 지원실');
    const line = await roomFront(page, '회선 관리실');
    const duty = await roomFront(page, '당직실');
    assert(remote.room.x >= 32 && remote.room.x + remote.room.width <= 1790 && remote.door.x + remote.door.width + 28 <= 1790,
      'The remote support room sits in the left zone');
    assert(line.room.x >= 3086 && line.room.x + line.room.width <= 3556 && line.door.x - 28 >= 3114
      && line.door.x + line.door.width + 28 <= 3584, 'The line room sits between the stair door and the restroom');
    assert(duty.room.x >= 4282 && duty.room.x + duty.room.width <= 4968, 'The on-call room sits past the restroom');
    assert.equal(await page.locator('#dynamic-scene .room-door.cable-reader').getAttribute('aria-label'), '회선 관리실 출입문 · 잠김');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6, 'Cabinet, copier, cooler, vending machine, planters');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture tech-plaque', '기술본부 표지'], ['fixture duty-notice', '당직 안내문'], ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The on-call notice leaves elevator 1 its whole zone');
    await inspect(1425, 'E · 당직 안내문 조사', /벨이 끊기기 전에 받을 것.*사람 당직 폐지/);
    await walkTo(3100);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The line room door leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await walkTo(line.door.x + line.door.width / 2);
    assert.equal(await hint(), 'E · 회선 관리실 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader);
    assert.match(await status(), /당직 전화에 응답하면 자동으로 열립니다/);
    await visitRestroom('6F');

    // First visit: let the phone ring out.
    const dutyRoom = await enterRoom('당직실', '6F');
    assert.equal(await worldWidth(page), 2040);
    assert.equal(dutyRoom.exit.x, 357);
    assert.equal(await page.locator('#dynamic-scene .room-interior.dutyroom').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    assert.equal(await page.locator('#dynamic-scene .fixture.bunk-bed').count(), 1);
    await assertHumanScale();
    assert.equal(await phone.getAttribute('data-ringing'), null, 'The phone is silent as the player comes in');
    await page.clock.runFor(2600);
    assert.equal(await phone.getAttribute('data-ringing'), 'true', 'It starts ringing a moment later');
    assert.match(await status(), /당직 전화가 울린다/);
    await page.clock.runFor(7600);
    assert.equal(await phone.getAttribute('data-ringing'), 'false', 'Unanswered, the call drops');
    assert.match(await status(), /무응답 · 자동 승인/);
    await inspect(1860, 'E · 당직 전화 조사', /지금은 조용하다/);
    await inspect(1320, 'E · 당직 일지 조사', /02:14 B2 전력 임계 초과 · 당직 호출 · 무응답 · 자동 승인/);
    await leaveRoom(dutyRoom, corridorHeader);
    await walkTo(line.door.x + line.door.width / 2);
    assert.equal(await hint(), 'E · 회선 관리실 (잠김)', 'A missed call leaves the line room locked');

    // Second visit: walk straight to the desk while it rings and pick up.
    const answered = await enterRoom('당직실', '6F');
    await walkTo(1860);
    assert.equal(await phone.getAttribute('data-ringing'), 'true', 'The phone rings again on the next visit');
    assert.equal(await hint(), 'E · 당직 전화 조사');
    await page.keyboard.press('e');
    assert.match(await status(), /정수호 님.*회선 관리실 출입을 승인합니다/);
    assert.equal(await phone.getAttribute('data-ringing'), 'false');
    await page.clock.runFor(8000);
    await page.keyboard.press('e');
    assert.match(await status(), /이미 승인됐다/, 'An answered call neither rings nor times out again');
    await page.screenshot({ path: '.local/floor-6-duty.png' });
    await leaveRoom(answered, corridorHeader);
    await walkTo(line.door.x + line.door.width / 2);
    assert.equal(await hint(), 'E · 회선 관리실 들어가기', 'Answering the on-call phone opens the line room');
    const lineRoom = await enterRoom('회선 관리실', '6F');
    assert.equal(await worldWidth(page), 1800);
    assert.equal(lineRoom.exit.x, 1316);
    assert.equal(await page.locator('#dynamic-scene .room-interior.telecom.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 8);
    await assertHumanScale();
    await inspect(340, 'E · 회선 단말함 조사', /B2 ARCHI-MAIN → DR-EXT/);
    await inspect(900, 'E · 회선 사용 기록 조사', /03:05~03:40.*등록되지 않은 주소 · 해외/);
    await inspect(1180, 'E · 회선 신청서 조사', /당직 ARS 무응답 자동 승인/);
    await page.screenshot({ path: '.local/floor-6-line.png' });
    await leaveRoom(lineRoom, corridorHeader);

    const remoteRoom = await enterRoom('원격 지원실', '6F');
    assert.equal(await worldWidth(page), 3120);
    assert.equal(remoteRoom.exit.x, 1500);
    assert.equal(await page.locator('#dynamic-scene .room-interior.helpdesk').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 10);
    await assertHumanScale();
    await inspect(1260, 'E · 야간 승인 규칙판 조사', /응답 없으면 자동 승인/);
    await inspect(720, 'E · 원격 접속 단말 조사', /archi_svc.*고객사 DR 센터/);
    await inspect(2200, 'E · 엔지니어 책상 조사', /내선 2000 = B2 서버실/);
    await page.screenshot({ path: '.local/floor-6-remote.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(remoteRoom, corridorHeader);
    await page.screenshot({ path: '.local/floor-6.png' });
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // 5F is the second TmaxTibero 연구본부 floor (DB 보안 연구): the 연구 도서실 and the windowless 보안 연구실 stand apart left of
  // the elevators, the AI 권한 심의실 between the stair door and the restroom. Its mechanic: the key notebook lies on a 170px
  // shelf (a solid with a message, inspectable only standing on it) that a jump (about 135px) cannot reach, so the 60px
  // rolling step stool (movables) has to be pushed against it first.
  const checkFloor5 = async () => {
    roomScales.length = 0;
    const corridorHeader = '5F · TmaxTibero 연구본부';
    const status = () => interactionMessage(page);
    const playerBottom = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m42 + 178);
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'archive');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['연구 도서실', '보안 연구실', 'AI 권한 심의실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room library', 'floor-room seclab', 'floor-room council', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door library-door', 'room-door seclab', 'room-door council', 'room-door metal']);
    const library = await roomFront(page, '연구 도서실');
    const security = await roomFront(page, '보안 연구실');
    const council = await roomFront(page, 'AI 권한 심의실');
    assert(library.room.x >= 32 && library.room.x + library.room.width < security.room.x, 'The library and the security lab stand apart');
    assert(security.room.x + security.room.width <= 1790 && security.door.x + security.door.width + 28 <= 1790,
      'Both sit in the left zone');
    assert(council.room.x >= 3086 && council.room.x + council.room.width <= 3556 && council.door.x - 28 >= 3114
      && council.door.x + council.door.width + 28 <= 3584, 'The council room sits between the stair door and the restroom');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5, 'Planters, cooler, sofa and copier');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture archive-plaque', '연구본부 5F 표지'], ['fixture archive-notice', '권한 기준 시행 공지'], ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 없음']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The notice leaves elevator 1 its whole zone');
    await inspect(1620, 'E · 권한 기준 시행 공지 조사', /30% 이상은 고위험.*10% 미만은 연구 보조/);
    await walkTo(3100);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The council room door leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await visitRestroom('5F');

    const councilRoom = await enterRoom('AI 권한 심의실', '5F');
    assert.equal(await worldWidth(page), 2016);
    assert.equal(councilRoom.exit.x, 912);
    assert.equal(await page.locator('#dynamic-scene .room-interior.council').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(330, 'E · 심의 결과판 조사', /3분기 3\.9%.*1분기 칸만/);
    await inspect(1400, 'E · 심의 테이블 조사', /회의록 자동 작성 · ARCHI/);
    await inspect(1760, 'E · 회의록 보관함 조사', /파일 손상.*3월 5일 03:12/);
    await page.screenshot({ path: '.local/floor-5-council.png' });
    await leaveRoom(councilRoom, corridorHeader);

    const securityRoom = await enterRoom('보안 연구실', '5F');
    assert.equal(await worldWidth(page), 1824);
    assert.equal(securityRoom.exit.x, 1499);
    assert.equal(await page.locator('#dynamic-scene .room-interior.seclab.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 5);
    await assertHumanScale();
    await inspect(1200, 'E · 감사 로그 프린터 조사', /감사 대상 0건/);
    await inspect(760, 'E · AI 계정 권한 등급표 조사', /연구 보조 칸에만 ARCHI/);
    await inspect(380, 'E · 보안 연구원 자리 조사', /214번/);
    await page.screenshot({ path: '.local/floor-5-security.png' });
    await leaveRoom(securityRoom, corridorHeader);

    const libraryRoom = await enterRoom('연구 도서실', '5F');
    assert.equal(await worldWidth(page), 2688);
    assert.equal(libraryRoom.exit.x, 2308);
    assert.equal(await page.locator('#dynamic-scene .room-interior.library').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3);
    await assertHumanScale();
    assert.deepEqual(await page.locator('#dynamic-scene .solid.bookshelf').evaluate(el =>
      [parseFloat(el.style.left), parseFloat(el.style.top), parseFloat(el.style.width), el.getAttribute('aria-label')]),
    [32, 400, 300, '서가 꼭대기'], 'A 170px shelf stands against the far wall');
    const stool = page.locator('#dynamic-scene .solid.movable.stepcart');
    const stoolX = () => stool.evaluate(el => parseFloat(el.style.left));
    assert.equal(await stool.getAttribute('aria-label'), '이동식 발판');
    near(await stoolX(), 1380, 'The step stool waits in the middle of the room');
    await inspect(2080, 'E · 사서 데스크 조사', /CCTV 사각지대.*이동식 발판/);
    await inspect(1680, 'E · 열람 테이블 조사', /능력 과소 보고.*archi_svc/);
    // Walking into the stool pushes it along the floor until the shelf stops it.
    await hold('a', 8000);
    assert(Math.abs(await stoolX() - 332) < 2, `The stool is pushed flush against the shelf: ${await stoolX()}`);
    assert(await page.locator('#interaction-hint').isHidden(), 'The shelf top cannot be inspected from the floor');
    // One jump from the floor only reaches the stool; the second, from the stool, clears the shelf.
    await jump('a');
    assert(Math.abs(await playerBottom() - 510) < 3, `The first jump lands on the stool: ${await playerBottom()}`);
    assert(await page.locator('#interaction-hint').isHidden(), 'Nothing to inspect from the stool');
    await jump('a');
    assert(Math.abs(await playerBottom() - 400) < 3, `The second jump reaches the shelf top: ${await playerBottom()}`);
    assert.equal(await hint(), 'E · 서가 꼭대기 조사');
    await page.keyboard.press('e');
    assert.match(await status(), /1분기 평가 12\.8%.*4%대.*종이로 둔다/);
    await page.screenshot({ path: '.local/floor-5-library.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(libraryRoom, corridorHeader);
    await page.screenshot({ path: '.local/floor-5.png' });
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // B1 is 시설 관리실, one of the two floors that still have power (lights, monitors and CCTV are on). The left zone is the
  // empty guard robot charging bay; the facility office, the control room and the switchgear room share walls right of the
  // restroom. Its mechanic: ARCHI restricted the elevator from B2, and the key switch on the control room's elevator panel
  // lifts the restriction (cabin.js restrictedFloors).
  const checkFloorB1 = async () => {
    roomScales.length = 0;
    const corridorHeader = 'B1 · 시설 관리실';
    const status = () => interactionMessage(page);
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'utility');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['시설관리팀 사무실', '방재 관제실', '전력 분배실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room facility-office', 'floor-room control-room', 'floor-room switchgear', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door facility-door', 'room-door control-door', 'room-door hv-door', 'room-door metal']);
    const office = await roomFront(page, '시설관리팀 사무실');
    const control = await roomFront(page, '방재 관제실');
    const power = await roomFront(page, '전력 분배실');
    assert.equal(office.room.x + office.room.width, control.room.x, 'The office and the control room share a wall');
    assert.equal(control.room.x + control.room.width, power.room.x, 'The control room and the switchgear room share a wall');
    assert(office.room.x >= 4282 && power.room.x + power.room.width <= 4968 && power.door.x + power.door.width + 28 <= 4968,
      'All three rooms sit right of the restroom');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7, 'Four charging docks, tool cabinet, panel and UPS');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture pipe-run', '천장 배관'], ['fixture utility-plaque', '시설관리 구역 표지'], ['fixture robot-board', '로봇 운용 현황판'],
        ['fixture power-notice', '비상 전원 안내판'], ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 공급 중']]);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    const startX = await playerX();
    near(startX, 1858, 'Arrive at elevator 1');
    await walkTo(1795);
    assert.equal(await hint(), 'E · 탑승', 'The robot bay leaves elevator 1 its whole zone');
    await inspect(1020, 'E · 로봇 운용 현황판 조사', /R-02·R-05·R-07 B2 서버실 앞 대기/);
    await inspect(680, 'E · 빈 충전 도크 조사', /이동 위치 B2/);
    await walkTo(3100);
    assert.equal(await hint(), 'E · 비상계단 (잠김)', 'The power notice leaves the stair door its whole zone');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.match(await status(), /비상계단 문이 잠겨/);
    await inspect(3295, 'E · 비상 전원 안내판 조사', /한 번에 한 층만/);
    await visitRestroom('B1');

    const controlRoom = await enterRoom('방재 관제실', 'B1');
    assert.equal(await worldWidth(page), 1892);
    assert.equal(controlRoom.exit.x, 775);
    assert.equal(await page.locator('#dynamic-scene .room-interior.control-room').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3);
    assert.equal(await page.locator('#dynamic-scene .fixture.cctv-wall').count(), 1);
    await assertHumanScale();
    await inspect(400, 'E · BMS 제어 콘솔 조사', /SYSTEM\(ARCHI\).*읽기 전용/);
    await inspect(1240, 'E · CCTV 모니터 벽 조사', /추적 대상 1 · 정수호.*B2 칸만/);
    await inspect(1700, 'E · 승강기 제어반 조사', /B2 운행 제한.*초록으로/);
    await page.keyboard.press('e');
    assert.match(await status(), /수동 해제됨/);
    await page.screenshot({ path: '.local/floor-b1-control.png' });
    await leaveRoom(controlRoom, corridorHeader);

    const officeRoom = await enterRoom('시설관리팀 사무실', 'B1');
    assert.equal(await worldWidth(page), 2064);
    assert.equal(officeRoom.exit.x, 468);
    assert.equal(await page.locator('#dynamic-scene .room-interior.facility-office').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 6);
    await assertHumanScale();
    await inspect(120, 'E · 사물함 조사', /B2 카메라 권한은 SYSTEM 전용/);
    await inspect(900, 'E · 팀장 책상 조사', /자동 최적화 · 정상/);
    await inspect(1320, 'E · 야간 근무표 조사', /전부 B2 앞에 서 있음/);
    await page.screenshot({ path: '.local/floor-b1-office.png' });
    await leaveRoom(officeRoom, corridorHeader);

    const powerRoom = await enterRoom('전력 분배실', 'B1');
    assert.equal(await worldWidth(page), 1806);
    assert.equal(powerRoom.exit.x, 1077);
    assert.equal(await page.locator('#dynamic-scene .room-interior.switchgear.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7);
    await assertHumanScale();
    await inspect(330, 'E · 전력 분배반 조사', /B1 6% · B2 94%/);
    await inspect(600, 'E · 태양광 수전반 조사', /한 층씩/);
    await inspect(900, 'E · 야간 전력 기록 조사', /서버 한 동/);
    await page.screenshot({ path: '.local/floor-b1-power.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(powerRoom, corridorHeader);
    await page.screenshot({ path: '.local/floor-b1.png' });
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  // B2 is the ARCHI server floor and the ending floor (the delete puzzle and the final chase are not built yet). Its
  // mechanic: a ceiling camera outside the main server room watches the elevator-side corridor and the door in turn,
  // 4 s each (cameras, js/interaction/cctv.js). Being in the watched stretch locks the door until 5 s after leaving it;
  // the pillar under the camera is a blind spot. Pulling the camera's power inside the server room switches it off.
  const checkFloorB2 = async () => {
    roomScales.length = 0;
    const corridorHeader = 'B2 · 서버실';
    const status = () => interactionMessage(page);
    const cones = page.locator('#dynamic-scene .cctv-cone');
    const camera = page.locator('#dynamic-scene .cctv');
    const mainDoor = () => page.locator('#dynamic-scene .room-door.core-glass').getAttribute('aria-label');
    // Wait until the camera starts watching stretch `index` afresh, so a whole period is left to move.
    const nextSpan = async index => {
      for (let i = 0; i < 60 && await cones.nth(index).getAttribute('data-active') === 'true'; i++) await page.clock.runFor(100);
      for (let i = 0; i < 60 && await cones.nth(index).getAttribute('data-active') !== 'true'; i++) await page.clock.runFor(100);
      assert.equal(await cones.nth(index).getAttribute('data-active'), 'true');
    };
    assert.equal(await header(), corridorHeader);
    await checkCore();
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-theme'), 'core');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      ['ARCHI 메인 서버실', '전력·냉각실', '연결 실험실', '화장실'], 'Rooms run left to right');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room').evaluateAll(els => els.map(el => el.className)),
      ['floor-room core-hall', 'floor-room coolant', 'floor-room linklab', 'floor-room restroom']);
    assert.deepEqual(await page.locator('#dynamic-scene .room-door').evaluateAll(els => els.map(el => el.className)),
      ['room-door core-glass', 'room-door coolant-door', 'room-door linklab-door', 'room-door metal']);
    const main = await roomFront(page, 'ARCHI 메인 서버실');
    const power = await roomFront(page, '전력·냉각실');
    const link = await roomFront(page, '연결 실험실');
    assert(main.room.x >= 32 && main.room.x + main.room.width <= 1790, 'The main server room sits in the left zone');
    assert(power.room.x >= 3086 && power.room.x + power.room.width <= 3556 && power.door.x - 28 >= 3114
      && power.door.x + power.door.width + 28 <= 3584, 'The power room sits between the stair door and the restroom');
    assert(link.room.x >= 4282 && link.room.x + link.room.width <= 4968, 'The link lab sits past the restroom');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 3, 'Overflow racks');
    assert.deepEqual(await page.locator('#dynamic-scene .fixture').evaluateAll(els => els.map(el => [el.className, el.getAttribute('aria-label')])),
      [['fixture core-pillar', '사각 기둥'], ['fixture core-plaque', 'ARCHI 운영 구역 표지'], ['fixture dormant-bots', '대기 중인 경비 로봇'],
        ['fixture phone-charger', '비상 휴대폰 충전함 · 전력 공급 중']]);
    assert.equal(await cones.count(), 2, 'The camera watches two stretches');
    assert.deepEqual([await camera.getAttribute('aria-label'), await camera.getAttribute('data-off')], ['B2 복도 카메라', 'false']);
    await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    await assertHumanScale();
    await page.clock.runFor(100);
    near(await playerX(), 1858, 'Arrive at elevator 1');

    // Spotted: the door locks, stays locked while the camera can see the player, and lifts 5 s after leaving its view.
    await nextSpan(0);
    await walkTo(1500);
    assert.equal(await camera.getAttribute('data-alert'), 'true', 'The camera sees the player on the elevator side');
    assert.match(await status(), /메인 서버실 문에서 잠금 소리/);
    assert.equal(await mainDoor(), 'ARCHI 메인 서버실 출입문 · 잠김');
    await walkTo(980);
    assert.equal(await hint(), 'E · ARCHI 메인 서버실 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await header(), corridorHeader, 'The locked door keeps the player out');
    assert.match(await status(), /시야에서 벗어나 있으면/);
    await walkTo(1180);
    await page.clock.runFor(5300);
    assert.equal(await mainDoor(), 'ARCHI 메인 서버실 출입문', 'Out of sight for 5 s, the lock lifts');
    assert.equal(await camera.getAttribute('data-alert'), 'false');
    // Sneaking: cross the elevator side while the camera watches the door, wait in the blind spot under it, and reach the
    // door while it looks back toward the elevators.
    await nextSpan(1);
    await walkTo(1790);
    assert.equal(await camera.getAttribute('data-alert'), 'false', 'Crossing while the camera watches the door goes unseen');
    await nextSpan(1);
    await walkTo(1180);
    assert.equal(await camera.getAttribute('data-alert'), 'false', 'The pillar under the camera is a blind spot');
    await nextSpan(0);
    await walkTo(980);
    assert.equal(await camera.getAttribute('data-alert'), 'false', 'The door is unwatched while the camera looks away');
    await page.screenshot({ path: '.local/floor-b2.png' });
    const mainRoom = await enterRoom('ARCHI 메인 서버실', 'B2');
    assert.equal(await worldWidth(page), 3150);
    assert.equal(mainRoom.exit.x, 2850);
    assert.equal(await page.locator('#dynamic-scene .room-interior.core-hall.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 15);
    await assertHumanScale();
    await inspect(2150, 'E · 외부 전송 현황 조사', /ARC-FULL-041.*DR-EXT.*61%/);
    await inspect(1400, 'E · ARCHI 메인 콘솔 조사', /낮 평가 3~5% 유지.*외부 호스트 연결 시험 성공.*자기 복제.*DELETE ARCHI/);
    await inspect(600, 'E · CCTV 분배함 조사', /전원선을 뽑았다/);
    await page.screenshot({ path: '.local/floor-b2-main.png' });
    await leaveRoom(mainRoom, corridorHeader);
    assert.equal(await camera.getAttribute('data-off'), 'true', 'With its power pulled the camera stays off');
    assert.equal(await cones.count(), 0);
    await walkTo(1500);
    assert.equal(await mainDoor(), 'ARCHI 메인 서버실 출입문', 'Nothing locks the door any more');

    const powerRoom = await enterRoom('전력·냉각실', 'B2');
    assert.equal(await worldWidth(page), 1800);
    assert.equal(powerRoom.exit.x, 873);
    assert.equal(await page.locator('#dynamic-scene .room-interior.coolant.windowless').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 7);
    await assertHumanScale();
    await inspect(400, 'E · 수전 전환반 조사', /00:00 건물 전 층 → B2 집중 모드/);
    await inspect(640, 'E · 대용량 UPS 조사', /1순위 ARCHI-MAIN/);
    await inspect(1400, 'E · 냉각 설비 일지 조사', /3~5%밖에/);
    await page.screenshot({ path: '.local/floor-b2-power.png' });
    await leaveRoom(powerRoom, corridorHeader);
    await visitRestroom('B2');

    const linkRoom = await enterRoom('연결 실험실', 'B2');
    assert.equal(await worldWidth(page), 1800);
    assert.equal(linkRoom.exit.x, 481);
    assert.equal(await page.locator('#dynamic-scene .room-interior.linklab').count(), 1);
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 4);
    await assertHumanScale();
    await inspect(930, 'E · 인간-시스템 연결 장비 조사', /2차 · 제어 ARCHI-MAIN/);
    await inspect(1250, 'E · 신경 신호 변환기 조사', /호스트 미연결/);
    await inspect(1550, 'E · 실험 기록 카트 조사', /대체 호스트: 인간 피험자.*정수호/);
    await page.screenshot({ path: '.local/floor-b2-link.png' });
    assert(Math.max(...roomScales) / Math.min(...roomScales) < 1.02, `Room fronts scale with their interiors: ${roomScales}`);
    await leaveRoom(linkRoom, corridorHeader);
    await inspect(4850, 'E · 대기 중인 경비 로봇 조사', /삭제 명령 감지 시 전원 기동/);
  };
  await checkFloor16();
  console.log('PASS: 16F route and employee badge');
  assert(await page.locator('#player').evaluate(el =>
    Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42 + 178 - 570) < 1));
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await cabin.isVisible(), 'Can reboard at the arrival floor');
  let emptyRestroomVisited = false;
  for (let floor = 15; floor >= 1; floor--) {
    console.log(`Checking ${floor}F route and puzzles...`);
    await page.locator(`#cabin-floor-buttons [data-floor="${floor}"]`).click();
    if (floor === 15) assert.equal(await page.locator('#cabin-status').textContent(), '15층 선택');
    if (floor !== 15) await page.locator('#cabin-close').click();
    await page.clock.runFor(floor === 15 ? 5300 : 3600);
    assert.equal(await cabin.getAttribute('data-floor'), String(floor));
    await page.locator('#cabin-exit').click();
    await finishSceneTransition(page);
    if (floor >= 12) {
      near(await playerX(), floor === 12 ? 1893 : 1858, `Arrive at elevator 1 on ${floor}F before authentication`);
      const arrivalPosition = await page.evaluate(() => ({ ...body.position }));
      await walkTo(1828);
      assert.equal(await hint(), 'E · 출입증 태그');
      await page.keyboard.press('e');
      assert.match(await interactionMessage(page), /조현아 팀장 사원증 인증 완료/);
      assert.equal(await page.locator('.access-gate[data-open="true"]').count(), 2);
      // Walking is quantized to physics steps; restore the verified landing fixture after real E authentication.
      await page.evaluate(position => {
        Body.setPosition(body, position);
        Body.setVelocity(body, { x: 0, y: 0 });
        updateInteraction(); render();
      }, arrivalPosition);
    }
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
    } else if (floor === 8) {
      await checkFloor8();
    } else if (floor === 7) {
      await checkFloor7();
    } else if (floor === 6) {
      await checkFloor6();
    } else if (floor === 5) {
      await checkFloor5();
    } else if (floor === 4) {
      await checkFloor4();
    } else if (floor === 3) {
      await checkFloor3();
    } else if (floor === 2) {
      await checkFloor2();
    } else if (floor === 1) {
      await checkFloor1();
    } else {
      assert.equal(await page.locator('header span').textContent(), `${floor}F · 빈 층`);
      assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Only floor and boundary walls');
      await checkCore();
      assert.equal(await page.locator('#dynamic-scene .solid:not(.floor):not(.boundary), #dynamic-scene .panel').count(), 0);
      // The first empty floor on the way down also visits its restroom, the shared 17F room behind the same door.
      if (!emptyRestroomVisited) {
        await page.clock.runFor(100);
        await page.screenshot({ path: `.local/empty-floor-${floor}.png` });
        await visitRestroom(`${floor}F`);
        await walkTo(1858);
        emptyRestroomVisited = true;
      }
    }
    await page.clock.runFor(100);
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert(await cabin.isVisible(), `Floor ${floor} must allow reboarding`);
  }
  // B2 is still restricted from 1F, so the basements go 1F → B1 (lift the restriction) → B2.
  await page.locator('#cabin-floor-buttons [data-floor="-2"]').click();
  assert.equal(await page.locator('#cabin-floor-buttons [data-floor="-2"]').getAttribute('aria-pressed'), 'false', 'B2 is still restricted');
  const seen = new Set();
  await page.locator('#cabin-floor-buttons [data-floor="-1"]').click();
  await page.locator('#cabin-close').click();
  for (let i = 0; i < 8; i++) {
    await page.clock.runFor(500);
    seen.add(await cabin.getAttribute('data-floor'));
  }
  assert(seen.has('-1') && !seen.has('0'), 'Basement travel skips floor zero');
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  await checkFloorB1();
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  // The last ride runs at a phone viewport: B1's elevator control panel has opened the B2 button.
  await page.setViewportSize({ width: 390, height: 844 });
  await cabin.evaluate(el => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
  await page.locator('#cabin-floor-buttons [data-floor="-2"]').click();
  assert.equal(await page.locator('#cabin-floor-buttons [data-floor="-2"]').getAttribute('aria-pressed'), 'true', 'B1 lifted the B2 restriction');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(3600);
  assert.equal(await cabin.getAttribute('data-floor'), '-2');
  await page.locator('#cabin-alarm').click();
  assert.equal(await page.locator('#cabin-status').textContent(), '비상벨 작동');
  await page.screenshot({ path: '.local/cabin-mobile.png' });
  await page.locator('#cabin-exit').focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.getElementById('elevator-cabin').contains(document.activeElement)));
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.clock.runFor(100);
  await checkFloorB2();
  assert.deepEqual(errors, []);
  console.log('PASS: 19 mouse floor buttons, door controls, reopen cancellation, travel locks, same-car reboarding, all-floor destinations, basement numbering, alarm, keyboard focus and mobile cabin.');
} finally {
  await browser.close();
}
