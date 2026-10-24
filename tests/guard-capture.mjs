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
  await page.evaluate(() => { triggerBuildingBlackout(); collectedItems.add("f17-emergency-linked"); solarEnabled = true; solarPoweredFloors = [1]; performFloorChange('f1'); });
  const state = () => page.evaluate(() => ({ caught: playerCaught, mode: guardPatrol.mode, x: guardPatrol.x,
    playerX: body.position.x, time: guardPatrol.captureTime, frame: guardPatrol.door.element.dataset.frame }));
  const arrange = (x = 3210, facing = 1) => page.evaluate(([x, direction]) => {
    if (playerCaught) releaseGuardCapture();
    Object.assign(guardPatrol, { x: 3000, facing: direction, mode: 'patrol', wait: 0, lostTime: 0, captureTime: 0 });
    collectedItems.add("f17-emergency-linked"); solarPoweredFloors = [1]; updatePowerState();
    Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; updateInteraction(); cameraX = cameraTarget(); render();
  }, [x, facing]);
  for (const [file, width, count] of [['assets/objects/guard-robot/guard-humanoid-v2-grab.png', 384, 4], ['assets/player/jeong-suho-caught.png', 256, 4]]) {
    const source = `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
    const atlas = await page.evaluate(async ({ source, width, count }) => {
      const img = new Image(); img.src = source; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      return { size: [img.width, img.height], cells: Array.from({ length: count }, (_, index) => {
        const pixels = ctx.getImageData(index * width, 0, width, 256).data;
        let edge = 0, bottom = 0;
        for (let y = 0; y < 256; y++) for (let x = 0; x < width; x++) {
          if (pixels[(y * width + x) * 4 + 3] <= 32) continue;
          bottom = Math.max(bottom, y);
          if (!x || !y || x === width - 1 || y === 255) edge++;
        }
        return { edge, bottom };
      }) };
    }, { source, width, count });
    assert.deepEqual(atlas.size, [width * count, 256]);
    assert(atlas.cells.every(cell => !cell.edge && Math.abs(cell.bottom - (width === 384 ? 244 : 237)) <= 1), `${file}: intact arms/hands, alpha margins and grounded frames`);

  }
  await arrange(2800); await page.clock.runFor(300); assert.equal((await state()).mode, 'patrol', 'No detection behind the sensor at a distance');
  await arrange(3800); await page.clock.runFor(200); assert.equal((await state()).mode, 'patrol', 'No detection outside sensor range');
  await arrange(); await page.clock.runFor(34);
  assert.equal((await state()).mode, 'chase', 'Detection starts chasing immediately'); assert((await state()).x > 3000);
  await page.evaluate(() => guardPatrol.image.decode());
  assert.deepEqual(await page.evaluate(() => ({ src: guardPatrol.image.getAttribute('src'),
    size: [guardPatrol.image.naturalWidth, guardPatrol.image.naturalHeight],
    width: guardPatrol.door.element.firstElementChild.style.width })), {
    src: 'assets/objects/guard-robot/guard-humanoid-v2-run.png', size: [2048, 256], width: '224px'
  });
  const chaseFrames = new Set();
  await page.evaluate(() => { Body.setPosition(body, { x: 3500, y: floorY - 81 }); });
  for (let i = 0; i < 24; i++) { chaseFrames.add((await state()).frame); await page.clock.runFor(34); }
  assert.deepEqual([...chaseFrames].sort(), ['0', '1', '2', '3', '4', '5', '6', '7'], 'Chase animates all eight running poses');
  // 추격 중에는 수호가 앞에, 제압 중에는 로봇의 두 손이 수호의 팔뚝 앞에 그려진다.
  const robotOverPlayer = () => page.evaluate(() => Number(getComputedStyle(guardPatrol.door.element).zIndex) > Number(getComputedStyle(sprite).zIndex));
  assert.equal(await robotOverPlayer(), false, 'The chasing robot passes behind the player');
  await page.screenshot({ path: '.local/guard-detected.png' });
  // Sprinting is faster than the robot and can break contact.
  await page.keyboard.down('Shift'); await page.keyboard.down('d'); await page.clock.runFor(1200);
  await page.keyboard.up('d'); await page.keyboard.up('Shift'); assert.equal((await state()).caught, false);
  await arrange(1000); await page.evaluate(() => { guardPatrol.mode = 'chase'; });
  await page.clock.runFor(2000); assert.equal((await state()).mode, 'patrol', 'A lost target returns the robot to patrol');
  await arrange(3050); await page.evaluate(() => {
    guardPatrol.mode = 'chase'; Body.setPosition(body, { x: 3050, y: floorY - 240 }); grounded = false;
  });
  await page.clock.runFor(100); assert.equal((await state()).caught, false, 'The robot cannot snatch a player in mid-air');
  await arrange(); await page.evaluate(() => { collectedItems.add('f16-badge'); phoneBattery = 73; });
  await page.clock.runFor(600);
  assert.equal((await state()).caught, true); assert.equal((await state()).mode, 'grab');
  assert.equal(Math.round(Math.abs((await state()).playerX - (await state()).x)), 104, 'Capture holds Suho at the humanoid grip distance');
  assert.deepEqual(await page.evaluate(() => {
    const viewport = guardPatrol.door.element.firstElementChild;
    return { src: guardPatrol.image.getAttribute('src'), width: viewport.style.width,
      left: viewport.style.left, pivot: viewport.style.transformOrigin, flip: viewport.style.transform };
  }), { src: 'assets/objects/guard-robot/guard-humanoid-v2-grab.png', width: '336px',
    left: '-56px', pivot: '168px center', flip: 'scaleX(-1)' });
  assert(await robotOverPlayer(), 'Grabbing arms are drawn in front of the player');
  await page.screenshot({ path: '.local/guard-arms-out.png' });
  const armFrames = new Set();
  for (let i = 0; i < 36; i++) { armFrames.add((await state()).frame); await page.clock.runFor(32); }
  assert.deepEqual([...armFrames].sort(), ['0', '1', '2', '3'], 'The grab progresses through all four poses');
  assert.equal((await state()).mode, 'caught'); assert.equal((await state()).frame, '3');
  assert(await robotOverPlayer(), 'The robot keeps holding the player from the front');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'caught');
  assert(await page.locator('#guard-capture').isVisible());
  assert.equal(await page.locator('#guard-capture-title').textContent(), 'GAME OVER');
  assert(await page.locator('#guard-capture-title').evaluate(el => el.scrollWidth <= el.clientWidth), 'Title fits on one line');
  assert.equal(await page.locator('#guard-capture').evaluate(el => {
    const box = el.getBoundingClientRect();
    return box.top === 0 && box.left === 0 && box.width === innerWidth && box.height === innerHeight;
  }), true, 'Game over covers the viewport');
  const pinned = (await state()).playerX;
  await page.locator('#guard-capture .game-over-load').evaluate(button => button.blur());
  for (const key of ['d', 'a', 'Space', 'e', 'p', 'f', 'i', 'Escape']) await page.keyboard.press(key);
  await page.locator('nav #interact').dispatchEvent('pointerdown', { button: 0, pointerId: 1 });
  await page.clock.runFor(500);
  assert.equal((await state()).playerX, pinned, 'Caught player cannot escape using keyboard or touch');
  assert.equal(await page.evaluate(() => usingPhone || usingInspection || usingKeypad), false);
  await page.screenshot({ path: '.local/guard-caught-right.png' });
  await page.evaluate(() => retryGuardCapture());
  assert.equal((await state()).caught, false); assert((await state()).playerX < 2000);
  assert(await page.evaluate(() => collectedItems.has('f16-badge') && phoneBattery === 73 && !stage.inert));
  // x=2790 is west of R-01's stairs-beat (left=3040), so it no longer self-detects from 'patrol' there;
  // force 'chase' directly since this exercises the mirrored left-facing capture, not detection.
  await arrange(2790, -1); await page.evaluate(() => { guardPatrol.mode = 'chase'; });
  await page.clock.runFor(2300);
  assert.equal((await state()).caught, true);
  await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(100);
  assert(await page.locator('#guard-capture-title').evaluate(el => el.scrollWidth <= el.clientWidth), 'Title fits on mobile');
  assert(await page.locator('#guard-capture .game-over-load').evaluate(el => {
    const box = el.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
  }), 'Retry remains on screen on mobile');
  await page.screenshot({ path: '.local/guard-caught-left-mobile.png' });
  assert(await page.locator('.guard-robot-sprite').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11 === 1));
  await page.evaluate(() => retryGuardCapture()); assert.equal((await state()).caught, false);
  await arrange(); await page.clock.runFor(600);
  assert.equal((await state()).mode, 'grab', 'Cut power while the arms are still unfolding');
  await page.evaluate(() => { collectedItems.delete("f17-emergency-linked"); solarPoweredFloors = [2]; updatePowerState(); });
  assert.equal((await state()).caught, false); assert.equal((await state()).frame, '0');
  assert(await page.locator('#guard-capture').isHidden()); assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
  await page.keyboard.down('d'); await page.clock.runFor(150); await page.keyboard.up('d');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'walk');
  assert.deepEqual(errors, []);
  console.log('PASS: grounded atlases, eight running poses, centered four-frame grab, lost target, sprint escape, input lock, retry/progress, power release, both directions and mobile.');
} finally { await browser.close(); }
