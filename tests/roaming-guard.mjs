import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 순찰 로봇 R-03: 엘리베이터로 층을 옮겨 다니고, 전등이 꺼진 층은 복도만, 켜진 층은 방까지 돈다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  const state = () => page.evaluate(() => ({ where: roamer.where, next: roamer.next, x: roamer.x, mode: roamer.mode,
    mounted: Boolean(roamer.door), sprites: document.querySelectorAll('.roaming-guard-bot').length }));

  // 정전 전에는 움직이지 않는다.
  await page.clock.runFor(70000);
  assert.deepEqual([(await state()).where, (await state()).x], ['f9', 0], 'R-03 waits on 9F until the blackout');

  // 전등이 꺼진 층(5층): 엘리베이터 앞에 내려 복도만 돈다. 층 전력이 없어도 움직인다.
  await page.evaluate(() => {
    triggerBuildingBlackout(); performFloorChange('f5');
    Body.setPosition(body, { x: 4700, y: floorY - 81 }); cameraX = cameraTarget();
    Math.random = () => 0; roamer.lastFloor = null; // 첫 후보(B1)는 켜져 있으니 막고 5층을 고르게 한다
    roamerEnter('f5', 'elevator');
  });
  let s = await state();
  assert.equal(s.where, 'f5'); assert(s.mounted); assert.equal(s.sprites, 1);
  assert.equal(s.next, 'elevator', 'Unlit floor: corridor only');
  assert.equal(await page.evaluate(() => world.dataset.powered), 'false');
  const startX = s.x; await page.clock.runFor(1000);
  assert(Math.abs((await state()).x - startX - 70) < 3, 'Self-powered patrol rolls at 70 px/s on an unpowered floor');

  // 엘리베이터 도착음은 수호가 멀리 있어도(같은 층 방 안에서도) 들린다. 다른 층이면 안 들린다.
  const chimes = await page.evaluate(() => {
    const heard = [];
    const original = playGameSound;
    playGameSound = (name, options = {}) => { if (name === 'elevator-arrive') heard.push(options.x ?? null); };
    const keep = { ...roamer };
    roamerEnter('f5', 'elevator'); // 수호는 4700, 엘리베이터는 1900쯤: 800px보다 멀다
    performFloorChange('f5-rnd', 0, 'exit'); roamerEnter('f5', 'elevator');
    performFloorChange('f6'); roamerEnter('f5', 'elevator');
    playGameSound = original;
    performFloorChange('f5'); Object.assign(roamer, keep); Body.setPosition(body, { x: 4700, y: floorY - 81 });
    document.querySelectorAll('.roaming-guard-bot').forEach(element => element.remove()); mountGuardPatrol();
    return heard;
  });
  assert.deepEqual(chimes, [null, null], 'The arrival chime plays at full volume on Suho\'s floor only');

  // 승강기 전력이 없으면 엘리베이터를 못 타고 이 층을 계속 돈다.
  await page.evaluate(() => { roamer.stay = 0; });
  await page.clock.runFor(100);
  s = await state();
  assert.equal(s.where, 'f5'); assert.equal(s.mode, 'patrol', 'Without elevator power R-03 keeps patrolling');

  // 머무는 시간이 끝나면 실제 엘리베이터를 불러 문이 열리면 타고, 칸이 다음 층으로 운행해 문이 열리면 내린다.
  const trip = () => page.evaluate(() => {
    const index = roamer.car ?? 0, car = elevatorCars[index];
    const door = currentDoors.find(entry => entry.type === 'elevator' && entry.carIndex === index);
    return { phase: roamer.trip?.phase ?? null, remaining: roamer.trip?.time ?? 0,
      index, floor: car.floor, travelling: car.travelling, carOpen: car.open, doorOpen: door?.element.dataset.open };
  });
  await page.evaluate(() => {
    collectedItems.add('f17-emergency-linked'); updatePowerState();
    elevatorCars.forEach((car, index) => Object.assign(car, { floor: index ? 12 : 1, travelling: false, destination: null, open: false, rider: false }));
    Object.assign(roamer, { next: 'elevator', stay: 0, mode: 'patrol', wait: 0 });
  });
  await page.clock.runFor(100);
  assert.equal((await state()).mode, 'return', 'Heads to the elevator');
  await page.evaluate(() => { roamer.x = roamerElevatorX() + 2; });
  await page.clock.runFor(200);
  let t = await trip();
  assert.deepEqual([t.phase, t.index, t.travelling], ['call', 0, true], 'Calls the nearest idle car up from 1F');
  await page.clock.runFor(1000);
  t = await trip();
  assert.deepEqual([t.phase, t.floor, t.doorOpen], ['board', 5, 'true'], 'The car arrives and its doors open');
  assert.equal((await state()).sprites, 1, 'R-03 waits at the open doors');
  await page.clock.runFor(1500);
  t = await trip(); s = await state();
  assert.deepEqual([s.where, s.sprites, t.phase, t.floor, t.travelling], [null, 0, 'close', 5, false], 'R-03 boards while the car stays put to close its doors');
  assert.equal(t.doorOpen, 'false', 'The doors close behind it');
  // 전력이 끊기면 문 닫힘 대기도 멈추고, 복구한 뒤 남은 시간을 기다린다.
  await page.evaluate(() => { collectedItems.delete('f17-emergency-linked'); updatePowerState(); });
  const paused = await trip();
  await page.clock.runFor(600);
  assert.deepEqual(await trip(), paused, 'No departure or closing countdown without elevator power');
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
  const recalled = await page.evaluate(() => {
    const car = elevatorCars[roamer.car];
    car.travelling = true; // 다른 층 호출도 같은 칸의 travelling을 켠다.
    updateElevators();
    return [car.travelling, car.floor];
  });
  assert.deepEqual(recalled, [false, 5], 'A simultaneous hall call cannot bypass door closing');
  await page.clock.runFor(Math.floor((await trip()).remaining) - 100);
  assert.deepEqual([(await trip()).phase, (await trip()).floor, (await trip()).travelling], ['close', 5, false], 'No movement before the full door-closing interval');
  await page.clock.runFor(200);
  assert.deepEqual([(await trip()).phase, (await trip()).travelling], ['ride', true], 'Departure follows completed door closing');
  for (let i = 0; i < 30 && (await trip()).phase !== 'exit'; i++) await page.clock.runFor(100);
  t = await trip(); s = await state();
  assert.deepEqual([s.where, t.phase, t.floor, t.travelling], [null, 'exit', -1, false], 'R-03 remains inside while the arrival doors open');
  await page.evaluate(() => {
    elevatorCars[roamer.car].open = false; // 조사창을 읽는 동안 자동으로 닫힌 경우.
    updateRoamerTrip(step);
  });
  t = await trip();
  assert.deepEqual([t.carOpen, t.remaining], [true, 1400], 'Reclosed arrival doors reopen and restart the full wait');
  await page.clock.runFor(Math.floor(t.remaining) - 100);
  assert.equal((await state()).where, null, 'R-03 cannot appear before the full door-opening interval');
  await page.clock.runFor(200);
  t = await trip(); s = await state();
  assert.deepEqual([s.where, t.phase, t.floor], [await page.evaluate(() => floorId(-1)), null, -1], 'The car carries R-03 to B1 and it steps out');

  // 수호가 도착 문 앞에 있으면 내리지 않고, 다시 문을 완전히 닫은 뒤 다른 층으로 간다.
  await page.evaluate(() => {
    performFloorChange('f5');
    Body.setPosition(body, { x: roamerElevatorX(0, 'f5'), y: floorY - 81 });
    Object.assign(elevatorCars[0], { floor: 5, travelling: false, open: true, rider: false });
    Object.assign(roamer, { where: null, car: 0, trip: { phase: 'ride', time: 0 }, mode: 'patrol' });
  });
  await page.clock.runFor(1500);
  t = await trip();
  assert.deepEqual([(await state()).where, t.phase, t.floor, t.travelling, t.doorOpen], [null, 'close', 5, false, 'false'], 'A blocked exit closes the doors before rerouting');
  await page.clock.runFor(Math.floor(t.remaining) - 100);
  assert.equal((await trip()).travelling, false, 'Rerouting also waits for fully closed doors');
  await page.clock.runFor(200);
  assert.equal((await trip()).travelling, true, 'The rerouted car then departs');
  await page.clock.runFor(3000);

  // 전등이 켜진 층: 복도 다음 방을 둘러본다. 다른 장면이면 바로 옮긴다.
  await page.evaluate(() => {
    collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [5]; updatePowerState();
    Math.random = () => 0; roamerEnter('f5', 'elevator');
  });
  s = await state();
  assert.equal(s.next, 'f5-rnd', 'Lit floor: visits a room');
  await page.evaluate(() => { performFloorChange('f17'); roamer.stay = 0; });
  await page.clock.runFor(100);
  s = await state();
  assert.equal(s.where, 'f5-rnd'); assert.equal(s.next, 'f5', 'Rooms lead back to the corridor');

  // 같은 방에 있으면 문을 열고 들어온다.
  await page.evaluate(() => { performFloorChange('f5-rnd', 0, 'exit'); performFloorChange('f5'); roamer.stay = 0; });
  await page.clock.runFor(100);
  assert.equal((await state()).where, 'f5'); assert.equal((await state()).sprites, 1, 'Enters the player scene from the room door');

  // 수호가 나온 문 앞에 있으면 떨어뜨리고 반대쪽을 본다.
  const clear = await page.evaluate(() => {
    performFloorChange('f17'); roamer.x = roamerElevatorX(); roamer.stay = 99999;
    performFloorChange('f5', 0);
    return { gap: Math.abs(roamer.x - body.position.x), away: Math.sign(roamer.x - body.position.x) === roamer.facing };
  });
  assert(clear.gap >= 800 && clear.away, `R-03 is moved away from the door Suho exits: ${JSON.stringify(clear)}`);
  // 수호가 서 있는 문으로는 바로 들어오지 않는다.
  await page.evaluate(() => {
    performFloorChange('f17'); roamerEnter('f5-rnd', 'f5'); roamer.next = 'f5'; roamer.stay = 0;
    performFloorChange('f5', 0); Body.setPosition(body, { x: sceneDoorX('f5', 'f5-rnd'), y: floorY - 81 });
  });
  await page.clock.runFor(500);
  assert.equal((await state()).where, 'f5-rnd', 'Waits while Suho stands at the door');
  await page.evaluate(() => Body.setPosition(body, { x: 4700, y: floorY - 81 }));
  await page.clock.runFor(2200);
  assert.equal((await state()).where, 'f5', 'Comes in once Suho moves away');

  // 켜진 층을 더 자주 고른다(가중치 3배).
  const picks = await page.evaluate(() => {
    let seed = 7; Math.random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    roamer.lastFloor = null; solarPoweredFloors = [5]; collectedItems.add('b1-lights-out');
    const counts = {};
    for (let i = 0; i < 4000; i++) { const id = pickRoamerFloor(); counts[id] = (counts[id] ?? 0) + 1; }
    return counts;
  });
  assert(!picks.f1 && !picks.f17 && !picks.b2 && !picks[await page.evaluate(() => floorId(-2))], 'Never 1F, 17F or B2');
  assert(picks.f5 > 2.2 * picks.f6, `Lit floor is preferred: f5 ${picks.f5} vs f6 ${picks.f6}`);

  // 전방 센서는 480px로 화면 절반(640px)보다 짧다: 화면에 보이는 로봇에게 바로 감지되지는 않는다.
  const spotted = await page.evaluate(() => [520, 440].map(dx => {
    Object.assign(roamer, { x: 3000, mode: 'patrol', facing: 1, stay: 99999, wait: 0 });
    Body.setPosition(body, { x: 3000 + dx, y: floorY - 81 }); grounded = true;
    updateRobot(roamer, 16);
    return roamer.mode;
  }));
  assert.deepEqual(spotted, ['patrol', 'chase'], 'R-03 spots Suho within 480 px ahead');

  // 16층 VU 편의점 인라면 박스 위의 수호에게는 손이 닿지 않는다: 감지하지 않고, 쫓던 중이면 놓치고 순찰로 돌아가 내려올 수 있다.
  const onBox = await page.evaluate(() => {
    roamer.where = 'f16-cu';
    performFloorChange('f16-cu');
    const box = movingParts.find(part => part.pushable);
    const top = box.body.position.y - box.height / 2;
    Body.setPosition(body, { x: box.body.position.x, y: top - (body.bounds.max.y - body.position.y) }); grounded = true;
    const standing = playerOnPushable();
    Object.assign(roamer, { x: box.body.position.x - 300, mode: 'patrol', facing: 1, stay: 99999, wait: 0 });
    updateRobot(roamer, 16);
    const ignored = roamer.mode;
    Object.assign(roamer, { x: box.body.position.x, mode: 'chase', lostTime: 0 });
    for (let t = 0; t < 2000; t += 16) updateRobot(roamer, 16);
    return { standing, ignored, after: roamer.mode, caught: playerCaught };
  });
  assert.deepEqual(onBox, { standing: true, ignored: 'patrol', after: 'patrol', caught: false }, 'R-03 gives up on Suho standing on the box');
  await page.evaluate(() => { roamer.where = 'f5'; performFloorChange('f5'); });

  // 붙잡히면 '다시 시도' 창이 뜨고 그 층(5층) 엘리베이터 앞에서 다시 한다. R-03은 다른 층으로 가고, 1층 추격 기록은 남기지 않는다.
  await page.evaluate(() => {
    roamer.x = 3000; roamer.mode = 'patrol'; roamer.facing = 1; roamer.stay = 99999; roamer.wait = 0;
    Body.setPosition(body, { x: 3060, y: floorY - 81 }); grounded = true;
  });
  await page.clock.runFor(1500);
  assert(await page.locator('#guard-capture').isVisible(), 'R-03 catches Suho');
  assert.equal(await page.evaluate(() => dynamicFloorId), 'f5');
  await page.evaluate(() => retryGuardCapture());
  const retry = await page.evaluate(() => ({ scene: dynamicFloorId, where: roamer.where, mounted: Boolean(roamer.door),
    atElevator: Math.abs(body.position.x - (currentDoors.find(door => door.carIndex === 0).x + 40)) < 1 }));
  assert.deepEqual([retry.scene, retry.atElevator, retry.mounted], ['f5', true, false], 'Retry starts at this floor\'s elevator without R-03');
  assert.notEqual(retry.where, 'f5', 'R-03 is sent to another floor');
  assert.equal(await page.evaluate(() => collectedItems.has('f1-chase-ended')), false);

  // 쫓기다 엘리베이터에 타면 R-03이 문 앞까지 와서 문을 억지로 연다. 연타로 닫으면 고른 층으로 간다.
  const toCabin = (floor = '3') => page.evaluate(floor => {
    collectedItems.add('story-robot-seen'); refreshObjective(); // 퇴근하기 도중에는 1층 버튼만 눌린다(cabin.js)
    performFloorChange('f5'); releaseInput();
    const door = currentDoors.find(entry => entry.type === 'elevator' && entry.carIndex === 0);
    const center = door.x + door.width / 2;
    Object.assign(elevatorCars[0], { floor: 5, travelling: false, destination: null, open: true });
    roamerEnter('f5', 'elevator');
    Object.assign(roamer, { x: center + 160, mode: 'chase', stay: 99999 });
    Body.setPosition(body, { x: center, y: floorY - 81 });
    showCabin(0);
    if (floor) document.querySelector(`#cabin-floor-buttons button[data-floor="${floor}"]`).click();
  }, floor);
  const cabinState = () => page.evaluate(() => {
    const art = document.querySelector('#cabin-pry-robot img');
    return { door: cabinScene.dataset.door, gauge: !document.getElementById('cabin-pry-gauge').hidden,
      robot: !document.getElementById('cabin-pry-robot').hidden, art: art.complete && art.naturalWidth > 0, floor: elevatorCars[0].floor };
  });
  await toCabin();
  await page.clock.runFor(800);
  let c = await cabinState();
  assert.equal(c.door, 'struggle', 'R-03 pries the closing door'); assert(c.gauge && c.robot);
  assert.equal(c.art, true, 'The door-gap robot art (elevator-gap-robot.png) is loaded');
  await page.screenshot({ path: '.local/roaming-guard-pry.png' });
  for (let i = 0; i < 20 && (await cabinState()).door === 'struggle'; i++) { await page.keyboard.press('Enter'); await page.clock.runFor(60); }
  c = await cabinState();
  assert.equal(c.gauge, false); assert.equal(c.robot, false);
  await page.clock.runFor(3000);
  assert.equal((await cabinState()).floor, 3, 'Winning the door fight rides to the chosen floor');
  assert.equal(await page.locator('#guard-capture').isVisible(), false);
  await page.evaluate(() => exitCabin()); await page.clock.runFor(1500);

  // 연타하지 않으면 끌려 나와 붙잡힌다.
  await toCabin();
  await page.clock.runFor(800);
  assert.equal((await cabinState()).door, 'struggle');
  await page.clock.runFor(6000);
  assert(await page.locator('#guard-capture').isVisible(), 'Losing the door fight gets Suho caught');
  assert.equal(await page.evaluate(() => selectingFloor), false);
  await page.evaluate(() => retryGuardCapture());

  // 층을 안 고르고 문이 열린 채여도 같은 대결이 된다. 스페이스 연타로 이기면 문이 닫히고 칸은 그 층에 그대로 있다.
  await toCabin(null);
  await page.clock.runFor(800);
  assert.equal((await cabinState()).door, 'struggle', 'R-03 pries the open door too');
  for (let i = 0; i < 20 && (await cabinState()).door === 'struggle'; i++) { await page.keyboard.press('Space'); await page.clock.runFor(60); }
  c = await cabinState();
  assert.deepEqual([c.door, c.gauge, c.floor], ['closed', false, 5], 'Space mashing shuts the open door');
  assert.equal(await page.locator('#guard-capture').isVisible(), false);
  assert.deepEqual(errors, []);
  console.log('PASS: R-03 blackout patrol, rooms, elevator closing/opening waits, power pause, competing call, reopened arrival doors, blocked-exit rerouting, lit-floor priority, capture and door prying.');
} finally { await browser.close(); }
