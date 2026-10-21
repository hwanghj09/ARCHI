import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(() => {
    for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
    ['f17-emergency-linked', 'solar-app-installed', 'f7-external-connection-solved'].forEach(item => collectedItems.add(item));
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [];
    roamer.stay = 1e9; sanity = 100;
    updatePowerState(); refreshObjective();
  });

  const enter = name => page.evaluate(name => {
    const door = currentDoors.find(door => door.name === name);
    assertDoor(door);
    function assertDoor(door) { if (!door || door.locked) throw new Error(`Entry unavailable: ${name}`); }
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; interactionTime = 0;
    interact();
  }, name);
  const progress = () => page.evaluate(() => [...collectedItems].filter(item => !floorById.has(item)).sort());
  const before = await progress();
  let rooms = 0;
  for (const floor of [3, 4, 6, 9, 10]) {
    const fronts = await page.evaluate(floor => FLOOR_LAYOUTS[floor].rooms.map(room => ({ name: room.name, id: room.target })), floor);
    for (const front of fronts) {
      await page.evaluate(floor => performFloorChange(floorId(floor)), floor);
      await enter(front.name);
      await page.clock.runFor(900);
      assert.equal(await page.evaluate(() => dynamicFloorId), front.id);
      assert(await page.evaluate(() => !activeCall && currentDoors.every(door => !door.gives && !door.ring && !door.requires)), `${front.id}: no subplot clue or puzzle gate`);
      assert.equal(await page.locator('.fixture.art-spot').count(), 0);
      if (front.id === 'f6-engineering') {
        await page.clock.runFor(12000);
        assert(await page.evaluate(() => !activeCall), '6F never starts a delayed incoming call');
        await page.screenshot({ path: '.local/floor6-no-subplot.png' });
      }
      await enter('복도');
      await page.clock.runFor(900);
      assert.equal(await page.evaluate(() => dynamicFloorId), `f${floor}`);
      rooms++;
    }
  }
  assert.deepEqual(await progress(), before, 'Exploration floors cannot advance the main mystery');

  for (const id of ['f11-marketing', 'f14-ux', 'f15', 'f15-seminar', 'f15-director']) {
    const result = await page.evaluate(id => {
      const interior = floorById.get(id).interior;
      performFloorChange(id, interior ? null : 0, interior ? 'exit' : null);
      return { config: JSON.stringify(floorById.get(id)),
        doors: currentDoors.map(door => door.name),
        images: [...dynamicScene.querySelectorAll('.floor-prop img')].map(image => image.src) };
    }, id);
    assert.doesNotMatch(result.config, /archi-demo|피험자 명단|17층 정수호|야간 무인 관찰 모드|GPU 서버.*이관|야간 사용 권한 부여/);
    assert(!result.doors.some(name => ['자료실 책상', '관찰 콘솔', '실험 테이블', '이관 카트', '작업 지시서', '본부장 책상'].includes(name)));
    assert(result.images.length > 0, `${id}: furniture artwork remains`);
    await page.locator('.floor-prop img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  }
  assert(await page.evaluate(() => floorById.get('f14-archive').props.some(prop => prop.gives === 'f14-archive-lamp')));
  assert(await page.evaluate(() => floorById.get('f11').barriers.some(barrier => barrier.requires === 'f11-crank')));

  // Old saves may retain the retired flag/call timer, but must not recreate the removed phone or lock.
  await page.evaluate(() => {
    performFloorChange('f6-engineering', null, 'exit');
    const data = progressSnapshot();
    data.items.push('f6-oncall', 'f4-tape', 'f9-report');
    data.runtime.call = { state: 'ringing', elapsed: 3000 };
    restoreProgress(data); refreshObjective();
  });
  await page.clock.runFor(12000);
  assert(await page.evaluate(() => !activeCall && currentObjective.title === '외부 연결 통로 찾기'));
  for (const [item, title] of [['f13-backup-device', '장치 확인하기'], ['f17-usb-played', '2층 조사하기'], ['f2-projected', '지하에서 무슨 일이?']]) {
    const actual = await page.evaluate(item => { collectedItems.add(item); refreshObjective(); return currentObjective.title; }, item);
    assert.equal(actual, title, 'Explicitly requested main story extensions remain');
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${rooms} exploration rooms enter/exit without invented subplots, 6F stays silent, legacy saves and main story progression remain valid.`);
} finally { await browser.close(); }
