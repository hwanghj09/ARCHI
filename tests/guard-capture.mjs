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
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  await page.evaluate(() => { triggerBuildingBlackout(); solarEnabled = true; solarPoweredFloor = 1; performFloorChange('f1'); });
  const state = () => page.evaluate(() => ({ caught: playerCaught, mode: guardPatrol.mode, x: guardPatrol.x,
    playerX: body.position.x, time: guardPatrol.captureTime, frame: guardPatrol.door.element.dataset.frame }));
  const arrange = (x = 3210, facing = 1) => page.evaluate(([x, direction]) => {
    if (playerCaught) releaseGuardCapture();
    Object.assign(guardPatrol, { x: 3000, facing: direction, mode: 'patrol', wait: 0, lostTime: 0, captureTime: 0 });
    solarPoweredFloor = 1; updatePowerState();
    Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; updateInteraction(); cameraX = cameraTarget(); render();
  }, [x, facing]);
  for (const [file, width, count] of [['assets/objects/guard-robot/guard-capture.png', 384, 8], ['assets/player/jeong-suho-caught.png', 256, 4]]) {
    const source = `data:image/png;base64,${(await readFile(file)).toString('base64')}`;
    const atlas = await page.evaluate(async ({ source, width, count }) => {
      const img = new Image(); img.src = source; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
      return { size: [img.width, img.height], cells: Array.from({ length: count }, (_, index) => {
        const pixels = ctx.getImageData(index * width, 0, width, 256).data;
        let edge = 0, bottom = 0, redMonitor = 0, ivoryShell = 0;
        for (let y = 0; y < 256; y++) for (let x = 0; x < width; x++) {
          if (pixels[(y * width + x) * 4 + 3] <= 32) continue;
          bottom = Math.max(bottom, y);
          const p = (y * width + x) * 4;
          if (y < 88 && x > 145 && pixels[p] > 100 && pixels[p] > pixels[p + 1] * 1.7 && pixels[p] > pixels[p + 2] * 1.7) redMonitor++;
          if (y < 88 && x < 145 && pixels[p] > 160 && pixels[p + 1] > 150 && pixels[p + 2] > 120) ivoryShell++;
          if (!x || !y || x === width - 1 || y === 255) edge++;
        }
        return { edge, bottom, redMonitor, ivoryShell };
      }) };
    }, { source, width, count });
    assert.deepEqual(atlas.size, [width * count, 256]);
    assert(atlas.cells.every(cell => !cell.edge && Math.abs(cell.bottom - 237) <= 1), `${file}: intact arms/hands, alpha margins and grounded frames`);
    if (width === 384) assert(atlas.cells.every(cell => cell.redMonitor > 60 && cell.ivoryShell > 500), 'Only the inset monitor turns red; the head casing stays ivory in every pose');
  }
  await arrange(2800); await page.clock.runFor(300); assert.equal((await state()).mode, 'patrol', 'No detection behind the sensor at a distance');
  await arrange(3420); await page.clock.runFor(200); assert.equal((await state()).mode, 'patrol', 'No detection outside sensor range');
  await arrange(); await page.clock.runFor(34);
  assert.equal((await state()).mode, 'chase', 'Detection starts chasing immediately'); assert((await state()).x > 3000);
  const chaseFrames = new Set();
  for (let i = 0; i < 6; i++) { chaseFrames.add((await state()).frame); await page.clock.runFor(34); }
  assert.deepEqual([...chaseFrames].sort(), ['0', '1'], 'Red-monitor chase animates its wheels');
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
  await page.screenshot({ path: '.local/guard-arms-out.png' });
  const armFrames = new Set();
  for (let i = 0; i < 36; i++) { armFrames.add((await state()).frame); await page.clock.runFor(32); }
  assert.deepEqual([...armFrames].sort(), ['2', '3', '4', '5', '6', '7'], 'Both arms unfold, extend, close and hold through all six poses');
  assert.equal((await state()).mode, 'caught'); assert.equal((await state()).frame, '7');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'caught');
  assert(await page.locator('#guard-capture').isVisible());
  const pinned = (await state()).playerX;
  await page.locator('#guard-retry').evaluate(button => button.blur());
  for (const key of ['d', 'a', 'Space', 'e', 'p', 'f', 'i', 'Escape']) await page.keyboard.press(key);
  await page.locator('nav [data-direction="1"]').dispatchEvent('pointerdown', { button: 0, pointerId: 1 });
  await page.clock.runFor(500);
  assert.equal((await state()).playerX, pinned, 'Caught player cannot escape using keyboard or touch');
  assert.equal(await page.evaluate(() => usingPhone || usingInspection || usingKeypad), false);
  await page.screenshot({ path: '.local/guard-caught-right.png' });
  await page.locator('#guard-retry').focus(); await page.keyboard.press('Enter');
  assert.equal((await state()).caught, false); assert((await state()).playerX < 2000);
  assert(await page.evaluate(() => collectedItems.has('f16-badge') && phoneBattery === 73 && !stage.inert));
  await arrange(2790, -1); await page.clock.runFor(2300);
  assert.equal((await state()).caught, true);
  await page.setViewportSize({ width: 390, height: 844 }); await page.clock.runFor(100);
  await page.screenshot({ path: '.local/guard-caught-left-mobile.png' });
  assert(await page.locator('.guard-robot-sprite').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11 === -1));
  await page.locator('#guard-retry').click(); assert.equal((await state()).caught, false);
  await arrange(); await page.clock.runFor(600);
  assert.equal((await state()).mode, 'grab', 'Cut power while the arms are still unfolding');
  await page.evaluate(() => { solarPoweredFloor = 2; updatePowerState(); });
  assert.equal((await state()).caught, false); assert.equal((await state()).frame, '7');
  assert(await page.locator('#guard-capture').isHidden()); assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
  await page.keyboard.down('d'); await page.clock.runFor(150); await page.keyboard.up('d');
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'walk');
  assert.deepEqual(errors, []);
  console.log('PASS: red monitor/ivory casing, immediate chase, wheels, lost target, sprint escape, grounded catch, six arm deployment poses, input lock, retry/progress, power release, both directions and mobile.');
} finally { await browser.close(); }
