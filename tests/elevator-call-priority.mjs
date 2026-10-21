import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.locator('#cabin-art').evaluate(image => image.decode());

  const prepare = (phase, floor = 1) => page.evaluate(({ phase, floor }) => {
    closeInspection(); releaseInput();
    for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
    ['solar-app-installed', 'f17-emergency-linked', 'f1-robot-log'].forEach(item => collectedItems.add(item));
    buildingBlackout = true;
    performFloorChange(floorId(floor));
    elevatorCars.forEach((car, index) => Object.assign(car, {
      floor: index ? 15 + index : 5, destination: null, elapsed: 0,
      travelling: false, rider: false, open: false, playerCall: false,
    }));
    elevatorOpenTime.fill(0);
    Object.assign(roamer, { where: ['call', 'board'].includes(phase) ? 'f5' : null,
      car: 0, trip: { phase, time: 1 }, mode: 'patrol', door: null, image: null });
    const door = currentDoors.find(entry => entry.type === 'elevator' && entry.carIndex === 0);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    interactionTime = 0; updateInteraction(); refreshObjective();
  }, { phase, floor });

  // R-03이 타기 전의 호출·탑승 대기를 플레이어 호출이 선점한다.
  for (const phase of ['board', 'call']) {
    await prepare(phase);
    await page.keyboard.press('e');
    const result = await page.evaluate(() => {
      updateRoamerTrip(step);
      return { destination: elevatorCars[0].destination, reserved: elevatorCars[0].playerCall,
        robotWhere: roamer.where, robotTrip: roamer.trip };
    });
    assert.deepEqual(result, { destination: 1, reserved: true, robotWhere: 'f5', robotTrip: null }, `${phase}: the robot yields before boarding`);
  }

  // 이미 로봇이 탄 칸도 호출 층에서 승객을 기다리고, 1층이 로봇 순찰 대상이 아니라는 이유로 즉시 출발하지 않는다.
  for (const phase of ['close', 'exit']) {
    await prepare(phase);
    await page.keyboard.press('e');
    const arrival = await page.evaluate(() => {
      for (let i = 0; i < 600 && elevatorCars[0].floor !== 1; i++) {
        updateElevators(); updateRoamerTrip(step);
      }
      return [elevatorCars[0].floor, elevatorCars[0].open, elevatorCars[0].playerCall];
    });
    assert.deepEqual(arrival, [1, true, true], `${phase}: the player call reaches 1F`);
    const waiting = await page.evaluate(() => {
      for (let i = 0; i < 300; i++) { updateElevators(); updateRoamerTrip(step); }
      return [elevatorCars[0].floor, elevatorCars[0].open, elevatorCars[0].travelling, elevatorCars[0].destination];
    });
    assert.deepEqual(waiting, [1, true, false, 1], `${phase}: doors stay open for boarding instead of random departure`);
    await page.keyboard.press('e');
    await page.clock.runFor(1000);
    assert(await page.evaluate(() => selectingFloor && elevatorCars[0].rider), 'Suho can board the reserved car');
    assert.equal(await page.evaluate(() => selectedFloor), null, 'No unsolicited destination inside the cabin');
    await page.locator('#cabin-exit').click();
    await page.clock.runFor(1000);
  }

  await prepare('exit');
  await page.keyboard.press('e');
  const ignored = await page.evaluate(() => {
    for (let i = 0; i < 600 && elevatorCars[0].floor !== 1; i++) { updateElevators(); updateRoamerTrip(step); }
    for (let i = 0; i < 600 && elevatorCars[0].destination === 1; i++) { updateElevators(); updateRoamerTrip(step); }
    return [elevatorCars[0].playerCall, elevatorCars[0].open, roamer.trip.phase, elevatorCars[0].destination !== 1];
  });
  assert.deepEqual(ignored, [false, false, 'close', true], 'The onboard robot resumes its route after an unused call expires');

  await prepare('close', 5);
  await page.keyboard.press('e');
  const interruptedClosing = await page.evaluate(() => {
    updateRoamerTrip(step);
    return [elevatorCars[0].open, elevatorCars[0].playerCall, roamer.trip.phase, elevatorCars[0].travelling];
  });
  assert.deepEqual(interruptedClosing, [true, true, 'close', false], 'Opening a departing robot car also holds it for boarding');

  // 같은 층에서 닫힌 문만 여는 첫 상호작용도 예약이다. 탑승 전 한 번 더 누르는 동안 빼앗지 않는다.
  await prepare('board', 5);
  await page.keyboard.press('e');
  const opened = await page.evaluate(() => {
    updateRoamerTrip(step);
    return [elevatorCars[0].open, elevatorCars[0].playerCall, roamer.where, roamer.trip];
  });
  assert.deepEqual(opened, [true, true, 'f5', null], 'Opening the local car reserves it before entering');

  // 타지 않으면 기존 6초 뒤 닫힘·예약 해제를 유지한다.
  const released = await page.evaluate(() => {
    for (let i = 0; i < 370; i++) updateElevators();
    return [elevatorCars[0].open, elevatorCars[0].playerCall];
  });
  assert.deepEqual(released, [false, false], 'Unused reservations expire normally');
  assert.deepEqual(errors, []);
  console.log('PASS: player calls preempt robot boarding, occupied robot cars wait on 1F, local door opening reserves boarding, unused calls expire.');
} finally { await browser.close(); }
