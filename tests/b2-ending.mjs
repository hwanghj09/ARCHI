import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// B2 엔딩 최소 버전: DELETE → 체크포인트 → 로봇 3대 추격(서버실 문으로 들어옴) → 베드엔딩 → 체크포인트 복귀,
// 그리고 콘솔에서 엘리베이터까지 실제로 달려서 임시 해피엔딩. 달리는 동안의 시간과 로봇 위치를 출력한다.
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
  const atConsole = () => page.evaluate(() => {
    triggerBuildingBlackout(); solarEnabled = true; updatePowerState();
    elevatorCars[0].floor = -2; elevatorCars[0].open = false;
    performFloorChange('b2-main', null, 'exit');
    Body.setPosition(body, { x: 1400, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; cameraX = cameraTarget(); render();
  });
  const pressDelete = async () => {
    await page.evaluate(() => { grounded = true; interact(); });
    assert(await page.locator('#inspection-delete').isVisible(), 'The main console offers DELETE');
    await page.locator('#inspection-delete').click();
    assert.equal(await page.locator('#inspection-text').textContent(), '복구할 수 없습니다. 계속하시겠습니까?');
    await page.locator('#inspection-yes').click();
  };

  await atConsole();
  await pressDelete();
  const started = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, alarm: world.dataset.alarm,
    bar: !document.getElementById('b2-delete-bar').hidden, checkpoint: JSON.parse(localStorage.getItem('archi.checkpoint.b2'))?.scene.id,
    saved: saveProgress() }));
  assert.deepEqual(started, { phase: 'running', robots: 3, alarm: 'true', bar: true, checkpoint: 'b2-main', saved: false });

  // 서버실 안에 가만히 있으면 로봇이 복도를 지나 서버실 문으로 들어와 붙잡는다.
  let entered = null;
  for (let t = 0; t < 40 && !(await page.locator('#b2-bad-ending').isVisible()); t++) {
    await page.clock.runFor(1000);
    entered ??= await page.evaluate(() => b2Robots.some(robot => robot.where === 'b2-main') ? Math.round(b2Ending.elapsed / 1000) : null);
  }
  assert(entered !== null, 'Robots walked into the server room');
  assert(await page.locator('#b2-bad-ending').isVisible(), 'Getting caught shows the bad ending');
  assert.equal(await page.locator('#b2-delete-percent').textContent() !== '', true);
  console.log(`robots entered the server room at ${entered}s; caught at ${Math.round(await page.evaluate(() => b2Ending.elapsed) / 1000)}s`);
  await page.locator('#b2-checkpoint').click();
  const back = await page.evaluate(() => ({ phase: b2Ending.phase, robots: b2Robots.length, caught: playerCaught, room: dynamicFloorId,
    near: Math.abs(body.position.x - 1400) < 160, bar: document.getElementById('b2-delete-bar').hidden }));
  assert.deepEqual(back, { phase: 'idle', robots: 0, caught: false, room: 'b2-main', near: true, bar: true });

  // 콘솔에서 Shift+D로 출구까지 달리고, 복도에서 엘리베이터까지 달려 탄다.
  await page.evaluate(() => { solarEnabled = true; updatePowerState(); elevatorCars[0].floor = -2; elevatorCars[0].open = false; });
  await pressDelete();
  await page.evaluate(() => stage.focus());
  const run = async (until, label) => {
    await page.keyboard.down('ShiftLeft'); await page.keyboard.down('KeyD');
    for (let i = 0; i < 400 && !(await page.evaluate(until)); i++) await page.clock.runFor(50);
    await page.keyboard.up('KeyD'); await page.keyboard.up('ShiftLeft');
    const at = await page.evaluate(() => ({ time: b2Ending.elapsed / 1000, x: Math.round(body.position.x),
      robots: b2Robots.map(robot => `${robot.where}@${Math.round(robot.x)}`).join(', ') }));
    console.log(`${label}: ${at.time.toFixed(1)}s, x=${at.x}, robots ${at.robots}`);
    return at;
  };
  await run(() => nearbyDoor?.key === 'exit', 'reached server room exit');
  await page.keyboard.press('KeyE');
  for (let i = 0; i < 100 && (await page.evaluate(() => transitioning || dynamicFloorId !== 'b2')); i++) await page.clock.runFor(50);
  await run(() => nearbyDoor?.type === 'elevator' && nearbyDoor.carIndex === 0, 'reached elevator 1');
  await page.keyboard.press('KeyE');
  for (let i = 0; i < 200 && !(await page.locator('#b2-escape').isVisible()) && !(await page.locator('#b2-bad-ending').isVisible()); i++) await page.clock.runFor(50);
  console.log(`escape screen at ${(await page.evaluate(() => b2Ending.elapsed) / 1000).toFixed(1)}s`);
  assert(await page.locator('#b2-escape').isVisible(), 'Boarding the elevator during the chase shows the temporary escape screen');
  assert(!(await page.locator('#elevator-cabin').isVisible()));
  await page.locator('#b2-escape-menu').click();
  assert(await page.locator('#main-menu').isVisible(), 'The escape screen returns to the main menu');
  assert(await page.locator('#menu-continue').isVisible(), 'Continue resumes from the save before DELETE');
  assert.deepEqual(errors, []);
  console.log('B2 ending checks passed.');
} finally {
  await browser.close();
}
