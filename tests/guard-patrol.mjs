import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
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
  await page.evaluate(() => {
    triggerBuildingBlackout(); performFloorChange('f1');
    Body.setPosition(body, { x: 4800, y: floorY - 81 }); cameraX = cameraTarget(); render();
  });
  const robot = page.locator('.fixture.guard-bot');
  const state = () => page.evaluate(() => ({ x: guardPatrol.x, facing: guardPatrol.facing, wait: guardPatrol.wait,
    phase: guardPatrol.door?.element.dataset.patrol, frame: guardPatrol.door?.element.dataset.frame }));
  const source = `data:image/png;base64,${(await readFile('assets/objects/guard-robot/guard-patrol.png')).toString('base64')}`;
  const frames = await page.evaluate(async src => {
    const image = new Image(); image.src = src; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0);
    return { size: [image.width, image.height], bounds: Array.from({ length: 8 }, (_, i) => {
      const data = ctx.getImageData(i * 256, 0, 256, 256).data;
      let top = 256, bottom = 0, edge = 0;
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        if (data[(y * 256 + x) * 4 + 3] <= 32) continue;
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        if (!x || !y || x === 255 || y === 255) edge++;
      }
      return { top, bottom, edge };
    }) };
  }, source);
  assert.deepEqual(frames.size, [2048, 256]);
  assert(frames.bounds.every(b => b.edge === 0 && Math.abs(b.bottom - 237) <= 1 && b.top >= 30), 'All eight cells have intact margins and the same wheel baseline');
  assert.equal((await state()).phase, 'off');
  const stopped = await state(); await page.clock.runFor(2000); assert.deepEqual(await state(), stopped);
  await page.locator('#dynamic-scene img').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
  await page.screenshot({ path: '.local/guard-off.png' });
  // 정전 중에는 경비 로봇도 배경처럼 어둠 막 아래에 있어서, 시야 원 밖에서는 보이지 않는다.
  const robotPixel = async () => {
    const clip = await page.evaluate(() => {
      const rect = world.getBoundingClientRect();
      return { x: Math.round(rect.left + guardPatrol.x * scale), y: Math.round(rect.top + (floorY - 60) * scale), width: 1, height: 1 };
    });
    const shot = await page.screenshot({ clip });
    return page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return r + g + b;
    }, `data:image/png;base64,${shot.toString('base64')}`);
  };
  const setVisibility = (selector, value) => page.locator(selector).evaluate((el, value) => { el.style.visibility = value; }, value);
  const darkRobot = await robotPixel();
  await setVisibility('#darkness', 'hidden');
  const bareRobot = await robotPixel();
  await setVisibility('.fixture.guard-bot', 'hidden');
  const bareWall = await robotPixel();
  await setVisibility('.fixture.guard-bot', ''); await setVisibility('#darkness', '');
  assert(Math.abs(bareRobot - bareWall) > 20, `The sample point is on the robot casing: ${bareRobot} vs wall ${bareWall}`);
  assert(darkRobot <= 3, `The unpowered robot outside the sight circle stays in the dark: ${darkRobot}`);
  // R-01은 처음 감지하기 전까지 도크에 서 있고('dock'), 뒤쪽 320px도 본다(c4de95d). 순찰 속도는 첫 추격이 끝난 'patrol' 상태에서,
  // 수호를 순찰 구간(3040~) 밖 감지 거리 바깥에 두고 잰다.
  await page.evaluate(() => {
    collectedItems.add("f17-emergency-linked"); solarEnabled = true; solarPoweredFloors = [1]; updatePowerState();
    guardPatrol.mode = 'patrol'; Body.setPosition(body, { x: 1500, y: floorY - 81 });
  });
  const before = await state(); await page.clock.runFor(1000);
  assert(Math.abs(before.x - (await state()).x - 80) < 3, 'Powered patrol rolls at 80 pixels per second');
  const usedFrames = new Set();
  for (let i = 0; i < 12; i++) { await page.clock.runFor(50); usedFrames.add((await state()).frame); }
  assert.equal(usedFrames.size, 4, 'Moving patrol animates every wheel frame');
  await page.evaluate(() => { Body.setPosition(body, { x: guardPatrol.x - 180, y: floorY - 81 }); cameraX = cameraTarget(); render(); });
  await page.screenshot({ path: '.local/guard-patrol-left.png' });
  // Keep the real simulation clock; only place it close to the endpoint to shorten the trip.
  await page.evaluate(() => { guardPatrol.x = 3042; });
  await page.clock.runFor(100); assert.equal((await state()).phase, 'scan');
  assert.equal((await state()).x, 3040);
  const scanFrames = new Set();
  for (let i = 0; i < 12; i++) { scanFrames.add((await state()).frame); await page.clock.runFor(100); }
  assert.deepEqual([...scanFrames].sort(), ['4', '5', '6']);
  await page.clock.runFor(400); assert.equal((await state()).facing, 1);
  assert((await state()).x > 3040, 'Endpoint scan finishes by turning around');
  await page.evaluate(() => { collectedItems.delete("f17-emergency-linked"); solarPoweredFloors = [2]; updatePowerState(); });
  const unpowered = await state(); await page.clock.runFor(1000); assert.deepEqual(await state(), unpowered);
  assert.equal(unpowered.frame, '7');
  await page.evaluate(() => { collectedItems.add("f17-emergency-linked"); solarPoweredFloors = [1]; updatePowerState(); togglePhone(); });
  const reading = await state(); await page.clock.runFor(1000);
  assert(Math.abs((await state()).x - reading.x - 80) < 3, 'Phone keeps the powered patrol running');
  assert(await page.evaluate(() => usingPhone));
  await page.keyboard.press('Escape');
  await page.evaluate(() => toggleInventory());
  const paused = await state(); await page.clock.runFor(1000); assert.deepEqual(await state(), paused, 'Modal pauses patrol');
  await page.keyboard.press('Escape');
  await page.evaluate(() => performFloorChange('f1-vision', 0, 'exit'));
  const away = (await state()).x; await page.clock.runFor(1000);
  assert.equal((await state()).x, away); assert.equal(await robot.count(), 0);
  await page.evaluate(() => performFloorChange('f1'));
  assert.equal((await state()).x, away, 'Returning keeps patrol progress without duplicating the robot');
  assert.equal(await robot.count(), 1); assert.equal(await page.locator('.robot-dock-patch').count(), 1);
  await page.evaluate(() => {
    collectedItems.delete("f17-emergency-linked"); solarPoweredFloors = [2]; updatePowerState();
    Body.setPosition(body, { x: guardPatrol.x, y: floorY - 81 }); grounded = true; updateInteraction();
    cameraX = cameraTarget(); render();
  });
  assert.match(await page.locator('#interaction-hint').textContent(), /경비 로봇/);
  await page.clock.runFor(100);
  assert(await page.evaluate(() => Math.abs(parseFloat(interactionOutline.style.left) - guardPatrol.x + 39) < .01),
    'The powered-down robot retains its correct maintenance outline');
  await page.keyboard.press('e'); assert(await page.locator('#keypad').isVisible(), 'Maintenance interaction moves with the robot');
  const maintenance = await state(); await page.clock.runFor(700); assert.deepEqual(await state(), maintenance);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { Body.setPosition(body, { x: guardPatrol.x + 110, y: floorY - 81 }); cameraX = cameraTarget(); render(); });
  await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(100);
  await page.screenshot({ path: '.local/guard-mobile.png' });
  await page.evaluate(() => {
    collectedItems.add("f17-emergency-linked"); solarPoweredFloors = [1]; updatePowerState();
    guardPatrol.x = 4538; guardPatrol.facing = 1; guardPatrol.wait = 0; guardPatrol.mode = 'patrol';
    Body.setPosition(body, { x: 1500, y: floorY - 81 });
  });
  await page.clock.runFor(100);
  assert.equal((await state()).x, 4540); assert.equal((await state()).phase, 'scan');
  await page.clock.runFor(1700); assert.equal((await state()).facing, -1);
  assert((await state()).x < 4540, 'The other endpoint also scans and turns without overshooting');
  await page.evaluate(() => performFloorChange('f17'));
  assert.equal(await robot.count(), 0); assert.equal(await page.locator('.robot-dock-patch').count(), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: eight aligned frames, rolling/scan/turn, power pause/resume, phone continues, inventory pause, room persistence, moving maintenance target, scene cleanup and mobile.');
} finally { await browser.close(); }
