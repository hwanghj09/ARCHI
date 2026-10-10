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
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  await page.clock.runFor(100);
  const status = () => page.evaluate(() => ({ active: openingActive, ready: openingReady, phase: world.dataset.opening,
    power: officeComputer.element.dataset.power, frame: Number(sprite.dataset.frame), x: body.position.x,
    feet: body.bounds.max.y, grounded, facing, blocked: stage.inert, phone: usingPhone, computer: usingComputer }));
  assert.deepEqual(await page.locator('#opening-sheet').evaluate(img => [img.naturalWidth, img.naturalHeight]), [1536, 256]);
  const png = await readFile('assets/player/jeong-suho-opening.png');
  const bounds = await page.evaluate(async src => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = 1536; c.height = 256;
    const ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0);
    return Array.from({ length: 6 }, (_, i) => {
      const pixels = ctx.getImageData(i * 256, 0, 256, 256).data;
      let top = 256, bottom = 0, edge = 0;
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        if (pixels[(y * 256 + x) * 4 + 3] < 32) continue;
        top = Math.min(top, y); bottom = Math.max(bottom, y);
        if (x === 0 || x === 255 || y === 0 || y === 255) edge++;
      }
      return { top, bottom, edge };
    });
  }, `data:image/png;base64,${png.toString('base64')}`);
  assert(bounds.every(b => b.edge === 0 && b.top > 5 && b.bottom >= 235 && b.bottom <= 239), 'Every pose has clean margins and aligned feet');
  assert(bounds[0].top > bounds[5].top + 20, 'Seated pose is lower than standing');
  assert.equal((await status()).phase, 'work');
  assert.equal(await page.locator('#world').getAttribute('data-powered'), 'true');
  assert(await page.locator('#darkness').isHidden(), 'Office lighting stays on during the opening');
  assert.equal((await status()).blocked, true);
  assert.equal(await page.locator('#player img:visible').count(), 1);
  const chair = page.locator('#opening-chair-front');
  assert(await chair.isVisible(), 'Chair back is in front during seated poses');
  const chairBounds = await chair.boundingBox();
  const shirtPixel = { x: Math.floor(chairBounds.x + chairBounds.width * .5),
    y: Math.floor(chairBounds.y + chairBounds.height * .35), width: 1, height: 1 };
  const brightness = async () => {
    const shot = await page.screenshot({ clip: shirtPixel });
    return page.evaluate(async src => {
      const img = new Image(); img.src = src; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      return r + g + b;
    }, `data:image/png;base64,${shot.toString('base64')}`);
  };
  const chairPixel = await brightness();
  await chair.evaluate(el => { el.style.visibility = 'hidden'; });
  const exposedShirtPixel = await brightness();
  await chair.evaluate(el => { el.style.visibility = ''; });
  assert(chairPixel < exposedShirtPixel * .6, 'Rendered chair back covers the white shirt');
  await page.screenshot({ path: '.local/opening-chair-layer.png', clip: {
    x: Math.floor(chairBounds.x - 140), y: Math.floor(chairBounds.y - 90), width: 340, height: 240 } });
  await page.keyboard.down('d');
  for (const key of ['e', 'p', 'f', 'i']) await page.keyboard.press(key);
  await page.clock.runFor(100);
  assert.equal((await status()).x, 590, 'Gameplay keys cannot move a seated player');
  assert.equal((await status()).phone, false); assert.equal((await status()).computer, false);
  await page.keyboard.up('d');
  await page.screenshot({ path: '.local/opening-01-back.png' });
  // Record every painted frame so a one-frame flash of another sheet cannot slip between checks.
  await page.evaluate(() => {
    window.openingPaints = [];
    const raf = window.requestAnimationFrame;
    window.requestAnimationFrame = callback => raf(time => {
      callback(time);
      const visible = [...sprite.querySelectorAll('img')].filter(img => getComputedStyle(img).display !== 'none');
      openingPaints.push({ elapsed: openingElapsed, active: openingActive, visible: visible.map(img => img.id).join(),
        cell: Math.round(-new DOMMatrix(getComputedStyle(openingSheet).transform).m41 / 192), x: body.position.x, feet: body.bounds.max.y });
    });
  });
  for (const [at, phase, frame, power] of [[1750, 'shutdown', 1, 'shutting-down'], [2700, 'off', 2, 'off'],
    [3275, 'turn', 3, 'off'], [3600, 'rising', 4, 'off']]) {
    await page.clock.runFor(Math.max(0, at - await page.evaluate(() => openingElapsed)) + 34);
    const current = await status();
    assert.equal(current.phase, phase); assert.equal(current.frame, frame); assert.equal(current.power, power);
    assert.equal(await chair.isVisible(), frame <= 3, 'Chair foreground clears when the player rises');
    assert(await page.locator('#opening-sheet').evaluate((img, frame) =>
      Math.abs(new DOMMatrix(getComputedStyle(img).transform).m41 + frame * 192) < .01, frame));
    await page.screenshot({ path: `.local/opening-${phase}.png` });
  }
  // The sheet's last cell is mid-stride, so once up he stands in the gameplay idle pose.
  const pose = () => page.evaluate(() => {
    const idle = getComputedStyle(document.getElementById('idle-sprite'));
    return { state: sprite.dataset.state, frame: sprite.dataset.frame, transform: idle.transform, clip: idle.clipPath,
      visible: [...sprite.querySelectorAll('img')].filter(img => getComputedStyle(img).display !== 'none').map(img => img.id).join() };
  });
  await page.clock.runFor(4400 - await page.evaluate(() => openingElapsed));
  const standing = await status();
  assert.equal(standing.phase, 'standing'); assert.equal(standing.power, 'off'); assert.equal(standing.facing, 1);
  assert(Math.abs(standing.x - 656) < 1 && Math.abs(standing.feet - 570) < 1, 'He stands where gameplay starts');
  assert(await chair.isHidden());
  assert.equal(await page.locator('#opening-caption').textContent(), '늦었네. 이제 퇴근하자.');
  const standingPose = await pose();
  assert.deepEqual([standingPose.state, standingPose.frame, standingPose.visible], ['idle', '0', 'idle-sprite'],
    'Standing uses the idle sprite, not the walking cell of the opening sheet');
  await page.screenshot({ path: '.local/opening-standing.png' });
  await page.clock.runFor(1400);
  const completed = await status();
  assert.equal(completed.active, false); assert.equal(completed.blocked, false); assert.equal(completed.power, 'off');
  assert.equal(completed.facing, 1); assert.equal(completed.grounded, true);
  assert(Math.abs(completed.x - 656) < 1 && Math.abs(completed.feet - 570) < 1, 'Handoff lands at the existing gameplay position');
  assert.deepEqual(await pose(), standingPose, 'Gameplay keeps the same idle frame and alignment after the handoff');
  const paints = await page.evaluate(() => openingPaints);
  assert(paints.some(paint => paint.active && paint.elapsed >= 3800) && paints.some(paint => !paint.active));
  assert(paints.every(paint => paint.visible === (paint.active && paint.elapsed < 3800 ? 'opening-sheet' : 'idle-sprite')),
    'No painted frame flashes another sheet between rising, standing and gameplay');
  assert(paints.every(paint => paint.visible !== 'opening-sheet' || paint.cell < 5), 'The walking cell is never painted');
  assert(paints.filter(paint => paint.active && paint.elapsed >= 3800)
    .every(paint => Math.abs(paint.x - 656) < .01 && Math.abs(paint.feet - 570) < .01), 'The idle pose appears in place and never slides');
  assert(await page.locator('#opening').isHidden());
  assert(await chair.isHidden(), 'Chair foreground is hidden after the opening');
  assert(await page.locator('#darkness').isHidden(), 'Shutting down the computer does not turn off the room lights');
  await page.keyboard.down('d'); await page.clock.runFor(200); await page.keyboard.up('d');
  assert((await status()).x > 690, 'Movement resumes after opening');
  await page.evaluate(() => { performRoomChange(); performRoomChange(); });
  assert(await page.locator('#opening').isHidden(), 'Re-entering office does not replay the opening');
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.keyboard.press('Escape');
  assert.equal((await status()).active, false); assert.equal((await status()).power, 'off');
  assert.equal((await status()).x, 656, 'Skip uses the same completed state');
  assert.deepEqual(await pose(), standingPose, 'Skip lands in the same idle pose');
  assert(await chair.isHidden(), 'Skipping clears the chair foreground');
  await page.keyboard.press('e'); await page.clock.runFor(800);
  assert.equal((await status()).computer, true); assert.equal((await status()).power, 'on', 'Computer can be powered back on for documents');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click(); await page.clock.runFor(100);
  await page.screenshot({ path: '.local/opening-mobile-back.png' });
  const skip = await page.locator('#opening-skip').boundingBox();
  assert(skip.x >= 0 && skip.x + skip.width <= 390 && skip.height >= 44);
  await page.locator('#opening-skip').click();
  assert.equal((await status()).active, false); assert.equal((await status()).blocked, false);
  await page.route('**/jeong-suho-opening.png', route => route.abort());
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.waitForFunction(() => !openingActive, null, { polling: 50 });
  assert.equal((await status()).blocked, false, 'Missing artwork cannot trap gameplay');
  assert.deepEqual(errors, []);
  console.log('PASS: chair foreground occlusion, rear seated poses, shutdown, right turn, rise, idle standing pose without flashes, handoff, input lock, skip, office re-entry, computer restart, mobile and missing-art recovery.');
} finally { await browser.close(); }
