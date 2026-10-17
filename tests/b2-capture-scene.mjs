import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { chromium } from 'playwright';

for (const [file, width] of [['robot-strike', 7680], ['drag-pov', 1920], ['upload-pov', 1920]]) {
  const art = await sharp(`assets/ending/b2-capture/${file}.png`).metadata();
  assert.equal(art.width, width, `${file}: fixed frame width`);
  assert.equal(art.height, 1080, `${file}: fixed frame height`);
  assert.equal((await sharp(`assets/ending/b2-capture/${file}.png`).stats()).isOpaque, true, `${file}: opaque scene`);
}
await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED') errors.push(`${request.url()}: ${request.failure()?.errorText}`);
  });
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  await page.evaluate(() => {
    triggerBuildingBlackout();
    collectedItems.add('f17-emergency-linked');
    collectedItems.add('b2-transfer-cut');
    solarEnabled = true;
    updatePowerState();
    performFloorChange('b2-main', null, 'exit');
    Body.setPosition(body, { x: 1400, y: floorY - 81 });
    grounded = true;
    sanity = 60;
    startArchiDelete();
  });
  const checkpoint = await page.evaluate(() => localStorage.getItem('archi.checkpoint.b2'));
  const catchSuho = () => page.evaluate(() => {
    const robot = b2Robots[0];
    Object.assign(robot, { where: dynamicFloorId, hold: 0, x: body.position.x - 82 });
    mountB2Robot(robot);
    catchPlayer(robot);
  });
  const state = () => page.evaluate(() => ({ active: b2CaptureActive, time: b2CaptureElapsed,
    phase: b2CaptureScene.dataset.phase, frame: b2CaptureView.dataset.frame,
    room: dynamicFloorId, percent: b2UploadProgress.value, caught: playerCaught }));
  const at = async time => {
    await page.evaluate(time => {
      while (b2CaptureActive && b2CaptureElapsed < time) update();
      render();
    }, time);
  };
  const screenshot = async name => {
    await page.evaluate(async () => { await Promise.all(Object.values(b2CaptureArt).map(src => { const image = new Image(); image.src = src; return image.decode(); })); });
    await page.screenshot({ path: `.local/b2-capture-${name}.png` });
  };

  // 실제 경비로봇 포획 콜백에서 시작한다. 타격은 팔 들기 → 휘두르기 → 접촉 순서다.
  await catchSuho();
  await page.clock.runFor(1200);
  assert.equal((await state()).active, true);
  assert.equal((await state()).frame, '0');
  assert(await page.locator('#b2-bad-ending').isHidden(), 'Outcome waits for the complete scene');
  assert(await page.locator('body > #stage').evaluate(el => el.inert));
  const bodyX = await page.evaluate(() => body.position.x);
  await page.keyboard.press('KeyM');
  await page.keyboard.press('KeyD');
  assert.equal(await page.evaluate(() => body.position.x), bodyX);
  assert(await page.locator('#map-window').isHidden());
  await at(1000);
  assert.equal((await state()).frame, '1');
  await screenshot('arm-raised');
  await at(1600);
  assert.equal((await state()).frame, '2');
  await screenshot('arm-swing');
  await at(1800);
  assert.equal((await state()).frame, '3');
  await screenshot('impact');
  await at(2400);
  assert.equal((await state()).phase, 'black');
  assert.equal(await page.locator('#b2-capture-view').evaluate(el => getComputedStyle(el).visibility), 'hidden');
  for (const [open, closed] of [[5200, 6300], [8300, 9200], [11600, 13000]]) {
    await at(open);
    assert.equal((await state()).phase, 'drag');
    await screenshot(`drag-${open}`);
    await at(closed);
    assert.equal((await state()).phase, 'black', 'Transport is only visible in separate glimpses');
  }
  await at(15600);
  assert.equal((await state()).room, 'b2-link', 'Actual game location moves to B2 connection lab');
  assert.equal((await state()).caught, true);
  await screenshot('restrained');
  await at(26300);
  assert.equal((await state()).phase, 'upload');
  assert((await state()).percent > 40 && (await state()).percent < 60);
  await screenshot('upload');
  await at(33000);
  assert.equal((await state()).percent, 100);
  assert.match(await page.locator('#b2-upload-status').textContent(), /제어권: ARCHI/);
  await at(35700);
  assert.equal((await state()).active, false);
  assert(await page.locator('#b2-bad-ending').isVisible());
  assert.equal(await page.evaluate(() => document.activeElement.id), 'b2-checkpoint');
  assert.match(await page.locator('#b2-bad-ending').textContent(), /정수호에게 ARCHI가 업로드/);
  await screenshot('ending');
  assert.equal(await page.evaluate(() => localStorage.getItem('archi.checkpoint.b2')), checkpoint, 'Ending never overwrites checkpoint');
  assert.equal(await page.evaluate(() => saveProgress()), false);
  await page.locator('#b2-checkpoint').click();
  assert.equal(await page.evaluate(() => b2Ending.phase), 'idle');
  assert.equal((await state()).room, 'b2-main');
  assert.equal((await state()).caught, false);
  assert(await page.locator('#b2-capture-scene').isHidden());
  assert.deepEqual(await page.evaluate(() => [...document.body.children].filter(el => el.inert && el.id !== 'main-menu').map(el => el.id)), []);

  // 모바일·모션 감소에서도 같은 이야기와 업로드 결과. Esc는 컷씬만 건너뛴다.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => startArchiDelete());
  await catchSuho();
  await page.clock.runFor(1200);
  await at(5200);
  assert.equal(await page.locator('#b2-capture-view').evaluate(el => getComputedStyle(el).transform), 'none');
  await screenshot('mobile-drag');
  await page.keyboard.press('Escape');
  assert.equal((await state()).room, 'b2-link');
  assert.equal((await state()).percent, 100);
  assert(await page.locator('#b2-bad-ending').isVisible());
  for (const id of ['b2-checkpoint', 'b2-restart']) {
    const box = await page.locator(`#${id}`).boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 844, `${id}: mobile button fits viewport`);
  }
  await screenshot('mobile-ending');
  await page.locator('#b2-checkpoint').click();
  await page.clock.fastForward(40000);
  assert(await page.locator('#b2-capture-scene').isHidden(), 'No stale ending callback after checkpoint');

  // 중간 불러오기는 타임라인도 지운다. 버튼 건너뛰기와 새 게임도 확인한다.
  await page.evaluate(() => startArchiDelete());
  await catchSuho();
  await page.clock.runFor(1200);
  await page.evaluate(() => restoreProgress(JSON.parse(localStorage.getItem('archi.checkpoint.b2'))));
  assert(await page.locator('#b2-capture-scene').isHidden());
  assert.equal((await state()).active, false);
  await page.evaluate(() => startArchiDelete());
  await catchSuho();
  await page.clock.runFor(1200);
  await page.locator('#b2-capture-skip').click();
  await page.locator('#b2-restart').click();
  assert.equal((await state()).active, false);
  assert(await page.locator('#b2-capture-scene').isHidden());
  assert.equal(await page.evaluate(() => localStorage.getItem('archi.checkpoint.b2')), null);
  assert.deepEqual(errors, []);
  console.log('PASS: B2 first-person strike, blackout glimpses, lab transfer, upload, checkpoint, skip, reset and mobile/reduced motion.');
} finally {
  await browser.close();
}
