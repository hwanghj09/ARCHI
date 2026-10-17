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
  assert.equal((await state()).where, null, 'R-03 waits until the blackout');

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
  assert(Math.abs((await state()).x - startX - 110) < 3, 'Self-powered patrol rolls at 110 px/s on an unpowered floor');

  // 머무는 시간이 끝나면 엘리베이터까지 걸어가서 떠난다.
  await page.evaluate(() => { roamer.stay = 0; });
  await page.clock.runFor(100);
  assert.equal((await state()).mode, 'return', 'Heads to the elevator');
  await page.evaluate(() => { roamer.x = roamerElevatorX() + 2; });
  await page.clock.runFor(300);
  s = await state();
  assert.equal(s.where, null); assert.equal(s.sprites, 0, 'Leaves by elevator');

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

  // 붙잡히면 '다시 시도' 창이 뜨고 1층 로비로 돌아간다. 1층 추격 기록은 남기지 않는다.
  await page.evaluate(() => {
    roamer.x = 3000; roamer.mode = 'patrol'; roamer.facing = 1; roamer.stay = 99999; roamer.wait = 0;
    Body.setPosition(body, { x: 3060, y: floorY - 81 }); grounded = true;
  });
  await page.clock.runFor(1500);
  assert(await page.locator('#guard-capture').isVisible(), 'R-03 catches Suho');
  await page.locator('#guard-retry').click();
  assert.equal(await page.evaluate(() => dynamicFloorId), 'f1');
  assert.equal(await page.evaluate(() => collectedItems.has('f1-chase-ended')), false);

  // 쫓기다 엘리베이터에 타면 R-03이 문 앞까지 와서 문을 억지로 연다. 연타로 닫으면 고른 층으로 간다.
  const toCabin = () => page.evaluate(() => {
    performFloorChange('f5'); releaseInput();
    const door = currentDoors.find(entry => entry.type === 'elevator' && entry.carIndex === 0);
    const center = door.x + door.width / 2;
    Object.assign(elevatorCars[0], { floor: 5, travelling: false, destination: null, open: true });
    roamerEnter('f5', 'elevator');
    Object.assign(roamer, { x: center + 160, mode: 'chase', stay: 99999 });
    Body.setPosition(body, { x: center, y: floorY - 81 });
    showCabin(0);
    document.querySelector('#cabin-floor-buttons button[data-floor="3"]').click();
  });
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
  await page.locator('#guard-retry').click();
  assert.deepEqual(errors, []);
  console.log('PASS: R-03 waits for blackout, self-powered corridor patrol on unlit floors, rooms on lit floors, elevator exit, lit-floor priority, capture, elevator door prying (win and lose).');
} finally { await browser.close(); }
