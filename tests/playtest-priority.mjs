import assert from 'node:assert/strict';
import { chromium } from 'playwright';

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
    triggerBuildingBlackout();
    solarEnabled = true;
    solarPoweredFloors = [17];
    collectedItems.add('f17-manager-unlocked');
    performFloorChange('f17-manager', null, 'exit');
    refreshObjective();
  });
  assert.equal(await page.evaluate(() => currentObjective.title), '회로 안내도 확인', 'A known code skips the memo objective after unlocking');
  await page.evaluate(() => {
    collectedItems.add('f17-emergency-linked');
    updatePowerState(); refreshObjective();
  });
  assert.equal(await page.evaluate(() => currentObjective.text), '승강기가 다시 움직인다. 아래로 내려가자.');

  await page.evaluate(() => {
    collectedItems.delete('f17-manager-unlocked');
    performFloorChange('f17');
    solarPoweredFloors = [];
    updatePowerState();
    const door = [...doors, ...officeDoors].find(door => door.code === '1706');
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
  });
  await page.clock.runFor(34);
  await page.keyboard.press('e');
  assert(await page.locator('#inspection').isVisible());
  assert.match(await page.locator('#inspection-description').textContent(), /전원이 없어.*17층/);
  assert(await page.locator('#keypad').isHidden(), 'No keypad or control may activate without power');
  assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-unlocked')), false);
  await page.keyboard.press('Escape');
  await page.evaluate(() => supplySolarFloor(17));
  await page.keyboard.press('e');
  assert(await page.locator('#keypad').isVisible(), 'Restored power still opens the actual keypad');
  await page.keyboard.press('Escape');

  const cctv = await page.evaluate(() => floorById.get('b1-control').fixtures.find(entry => entry.name === 'CCTV 모니터 벽'));
  assert.match(cctv.message, /아직 가본 기억이 없는/);
  assert.match(cctv.caption, /기록인지 예측인지/);
  assert.doesNotMatch(cctv.message + cctv.caption, /지나온 층을.*되감/);

  for (let attempt = 0; attempt < 3; attempt++) {
    const before = await page.evaluate(() => {
      sanity = 0; zeroEventPhase = 'charging';
      const result = { items: [...collectedItems], x: body.position.x };
      triggerDevoured();
      return result;
    });
    await page.evaluate(() => releaseHallucinationCapture());
    assert.deepEqual(await page.evaluate(() => ({ sanity, items: [...collectedItems], x: body.position.x,
      caught: hallucinationCaught, phase: zeroEventPhase, timer: zeroEventTimer })),
    { sanity: 0, ...before, caught: false, phase: 'idle', timer: 0 }, 'Repeated retries never create free healing or remove progress');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: priority fixes — retry without healing, mixed CCTV records, code-first objectives, explicit powerless-device feedback and precise PC guidance.');
} finally { await browser.close(); }
