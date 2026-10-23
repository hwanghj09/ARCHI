import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { chromium } from 'playwright';

for (const [path, width, frames] of [
  ['assets/player/jeong-suho-unconscious.png', 768, 3],
  ['assets/player/jeong-suho-drag-four.png', 1280, 4],
  ['assets/objects/guard-robot/guard-transport.png', 1536, 4],
]) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.deepEqual([info.width, info.height], [width, 256]);
  const size = width / frames, poses = new Set();
  for (let frame = 0; frame < frames; frame++) {
    const cell = Buffer.alloc(size * 256 * 4);
    let count = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < size; x++) {
      const p = (y * width + frame * size + x) * 4;
      data.copy(cell, (y * size + x) * 4, p, p + 4);
      assert(data[p + 3] === 0 || data[p + 3] === 255, 'Clean alpha');
      if (!data[p + 3]) continue;
      count++;
      assert(x > 3 && x < size - 3 && y > 3 && y < 252, 'Complete unclipped sprite');
    }
    assert(count > 1800, 'Complete body/robot');
    poses.add(cell.toString('base64'));
  }
  assert.equal(poses.size, frames, 'Every new pose is distinct');
}
const strike = await sharp('assets/ending/b2-capture/robot-strike.png').metadata();
assert.deepEqual([strike.width, strike.height], [7680, 1080], 'The approved impact sequence stays intact');
await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-18T00:01:00Z'));
  await page.evaluate(() => {
    triggerBuildingBlackout(); collectedItems.add('f17-emergency-linked'); collectedItems.add('b2-transfer-cut');
    solarEnabled = true; updatePowerState(); performFloorChange('b2-main', null, 'exit');
    Body.setPosition(body, { x: 1400, y: floorY - 81 }); grounded = true; sanity = 60; startArchiDelete();
  });
  const checkpoint = await page.evaluate(() => localStorage.getItem('archi.checkpoint.b2'));
  const catchSuho = async () => {
    await page.evaluate(() => {
      const robot = b2Robots[0];
      Object.assign(robot, { where: dynamicFloorId, hold: 0, x: body.position.x - 82 });
      mountB2Robot(robot); catchPlayer(robot);
    });
    await page.clock.runFor(1200);
    assert.equal(await page.evaluate(() => b2CaptureActive), true);
  };
  const at = async time => page.evaluate(time => {
    while (b2CaptureActive && b2CaptureElapsed < time) update();
    render();
  }, time);
  const state = () => page.evaluate(() => ({ phase: b2CaptureScene.dataset.phase, room: dynamicFloorId,
    x: body.position.x, y: body.position.y, frame: sprite.dataset.frame, pose: sprite.dataset.state,
    camera: cameraX, caught: playerCaught, active: b2CaptureActive }));
  const screenshot = async name => {
    await page.evaluate(async () => { await Promise.all([...world.querySelectorAll('img')].map(image => image.decode())); });
    await page.screenshot({ path: '.local/b2-live-' + name + '.png' });
  };
  await catchSuho();
  assert(await page.locator('#b2-bad-ending').isHidden());
  assert.equal(await page.locator('#b2-capture-caption, #b2-capture-location, #b2-upload').count(), 0, 'No narration or upload dialog');
  for (const [time, frame] of [[1000, '1'], [1600, '2'], [1800, '3']]) {
    await at(time);
    assert.equal(await page.locator('#b2-capture-view').getAttribute('data-frame'), frame);
  }
  await at(2400);
  assert.equal((await state()).phase, 'black');
  assert.equal(await page.locator('#b2-capture-eyelids').evaluate(el => el.style.getPropertyValue('--eye-open')), '0');

  for (const [open, closed, room] of [[5200, 6600, 'b2-main'], [8400, 9500, 'b2'], [11500, 13000, 'b2'], [15000, 16200, 'b2-link']]) {
    await at(open);
    const before = await state();
    assert.equal(before.phase, 'drag'); assert.equal(before.room, room); assert.equal(before.pose, 'dragged');
    assert(await page.locator('#drag-sheet').isVisible());
    assert(await page.locator('#b2-capture-view').isHidden(), 'Transport shows the actual world instead of another fullscreen image');
    assert.equal(await page.locator('#player img:visible').count(), 1);
    assert.equal(await page.locator('#b2-transport-robot').count(), 1);
    await screenshot('drag-' + open);
    const frames = new Set([before.frame]);
    for (const offset of [50, 150, 300, 450]) {
      await at(open + offset); frames.add((await state()).frame);
    }
    const gripBefore = await page.evaluate(() => parseFloat(b2TransportRobot.style.left) - body.position.x);
    await at(open + 500); frames.add((await state()).frame);
    const after = await state();
    assert.equal(frames.size, 4, 'All four redrawn dragging frames animate while the player moves');
    assert(after.x > before.x + 10, 'The real player body is being dragged feet first');
    assert(after.camera > before.camera || room === 'b2-link', 'The camera follows the actual transport');
    const gripAfter = await page.evaluate(() => parseFloat(b2TransportRobot.style.left) - body.position.x);
    assert(Math.abs(gripAfter - gripBefore) < .1, 'The grip stays attached instead of the robot and body drifting apart');
    await at(closed);
    assert.equal((await state()).phase, 'black', 'Only separate brief glimpses are visible');
  }
  for (const time of [17400, 17800, 18400, 19200, 20000]) {
    await at(time); assert.equal((await state()).phase, 'black');
    assert.equal(await page.locator('#b2-capture-eyelids').evaluate(el => el.style.getPropertyValue('--eye-open')), '0',
      'Loading onto the chair is completely omitted during the blackout');
  }
  await at(20700);
  assert.equal((await state()).phase, 'connect'); assert.equal((await state()).room, 'b2-link');
  assert.equal((await state()).pose, 'unconscious'); assert.equal((await state()).frame, '2');
  assert(await page.locator('#drag-sprite').isHidden()); await screenshot('on-chair');
  const cableBefore = await page.locator('#b2-connection-cable .connector').getAttribute('cx');
  await at(21600);
  assert.notEqual(await page.locator('#b2-connection-cable .connector').getAttribute('cx'), cableBefore, 'Connector moves onto the headrest');
  assert.equal(await page.locator('#b2-connection-cable').getAttribute('data-connected'), 'true');
  await screenshot('connected');
  const frozen = (await state()).x;
  await page.locator('#b2-capture-scene').focus();
  for (const key of ['KeyM', 'KeyD', 'Space', 'KeyP']) await page.keyboard.press(key);
  assert.equal((await state()).x, frozen); assert(await page.locator('#map-window').isHidden());
  await at(24900); assert.equal((await state()).phase, 'connected'); await screenshot('final-glimpse');
  await at(27800);
  assert.equal((await state()).active, false); assert.equal((await state()).caught, true);
  assert(await page.locator('#b2-bad-ending').isVisible());
  // 결말 제목·한 줄 설명과 함께 체크포인트·불러오기·메인 메뉴·처음부터 버튼을 보인다(QA 보고 7·24번).
  assert.equal(await page.locator('#b2-bad-ending h2').textContent(), 'BAD END — 연결');
  assert.deepEqual(await page.locator('#b2-bad-ending button').allTextContents(), ['체크포인트로 이동', '불러오기', '메인 메뉴', '처음부터 다시하기']);
  assert.equal(await page.evaluate(() => document.activeElement.id), 'b2-checkpoint');
  assert.equal(await page.evaluate(() => localStorage.getItem('archi.checkpoint.b2')), checkpoint);
  assert.equal(await page.evaluate(() => saveProgress()), false);
  await page.clock.runFor(300); assert.equal((await state()).pose, 'unconscious', 'The completed scene stays frozen');
  await screenshot('ending');
  await page.locator('#b2-checkpoint').click();
  assert.equal((await state()).room, 'b2-main'); assert.equal((await state()).caught, false);
  assert(await page.locator('#b2-capture-scene').isHidden());
  assert.equal(await page.locator('#b2-transport-robot, #b2-connection-cable').count(), 0);
  assert.equal(await page.evaluate(() => world.hasAttribute('data-b2-capture')), false);

  // Portrait, reduced motion, skipping and checkpoint recovery use the same live scene.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => startArchiDelete()); await catchSuho(); await at(5200);
  assert.equal(await page.evaluate(() => Math.hypot(cameraShake.x, cameraShake.y)), 0);
  await screenshot('mobile-drag');
  const mobilePlayer = await page.locator('#player').boundingBox();
  assert(mobilePlayer.x >= 0 && mobilePlayer.x + mobilePlayer.width <= 390, 'The fallen body stays fully visible in portrait');
  const mobileArms = await page.locator('#drag-sprite').boundingBox();
  assert(mobileArms.x >= 0, 'The hands trailing beyond the head stay visible in portrait');
  await page.keyboard.press('Escape');
  assert.equal((await state()).room, 'b2-link'); assert(await page.locator('#b2-bad-ending').isVisible());
  await page.locator('#b2-checkpoint').click();
  await page.clock.fastForward(40000);
  assert(await page.locator('#b2-capture-scene').isHidden(), 'No stale callback after restore');
  await page.evaluate(() => startArchiDelete()); await catchSuho(); await at(15000);
  await page.evaluate(() => restoreProgress(JSON.parse(localStorage.getItem('archi.checkpoint.b2'))));
  assert.equal((await state()).active, false);
  assert.equal(await page.locator('#b2-transport-robot, #b2-connection-cable').count(), 0);
  // [메인 메뉴]: 엔딩을 지우고 메인 메뉴로 간다. DELETE 직전 이어하기 저장이 남아 '계속하기'로 서버실에 돌아온다.
  await page.evaluate(() => startArchiDelete()); await catchSuho(); await at(5200);
  await page.locator('#b2-capture-skip').click(); await page.locator('#b2-bad-menu').click();
  assert(await page.locator('#main-menu').isVisible() && await page.locator('#menu-home').isVisible());
  assert(await page.locator('#b2-bad-ending').isHidden() && await page.locator('#b2-capture-scene').isHidden());
  await page.locator('#menu-continue').click(); await page.clock.runFor(500);
  assert.equal((await state()).room, 'b2-main'); assert.equal(await page.evaluate(() => b2Ending.phase), 'idle');
  // [불러오기]: 붙잡힌 상태는 저장하지 못하게 막은 저장 칸 창을 연다.
  await page.evaluate(() => startArchiDelete()); await catchSuho(); await at(5200);
  await page.locator('#b2-capture-skip').click(); await page.locator('#b2-bad-ending .game-over-load').click();
  assert(await page.locator('#menu-slots').isVisible());
  assert(await page.locator('#menu-slot-list [data-slot-save]').evaluateAll(buttons => buttons.every(button => button.disabled)));
  await page.evaluate(() => { closeMainMenu(); restoreProgress(JSON.parse(localStorage.getItem('archi.checkpoint.b2'))); });
  await page.evaluate(() => { Body.setPosition(body, { x: worldWidth - 170, y: floorY - 81 }); startArchiDelete(); });
  await catchSuho(); await at(5200);
  const nearWall = (await state()).x;
  await at(5500); assert((await state()).x > nearWall, 'A catch near the right wall still drags feet first after blackout');
  await page.locator('#b2-capture-skip').click(); await page.locator('#b2-restart').click();
  assert(await page.locator('#b2-capture-scene').isHidden());
  assert.equal(await page.evaluate(() => localStorage.getItem('archi.checkpoint.b2')), null);
  assert.deepEqual(errors, []);
  console.log('PASS: four redrawn dragging frames, original impact, live-world ankle dragging, chair loading omitted in blackout, lab connection without narration, camera/input/ending freeze, checkpoint/reset and portrait/reduced motion.');
} finally { await browser.close(); }
