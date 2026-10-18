import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { autoControl } from './auto-control.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  await autoControl(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  // 효과음은 이름만 기록한다(헤드리스 Windows에는 오디오 장치가 없을 수 있다).
  await page.evaluate(() => {
    window.soundLog = [];
    const play = playGameSound;
    playGameSound = (name, options) => { soundLog.push(name); return play(name, options); };
  });
  const enter = (seen = false) => page.evaluate(seen => {
    if (cctvSceneActive) finishCctvScene();
    if (seen) collectedItems.add('b1-cctv-live'); else collectedItems.delete('b1-cctv-live');
    collectedItems.delete('b1-cctv-seen'); collectedItems.delete('b1-lights-out');
    sanity = 100; soundLog.length = 0;
    performFloorChange('b1-control', null, 'exit');
  }, seen);
  const state = () => page.evaluate(() => {
    const wall = document.querySelector('#dynamic-scene .fixture.cctv-wall');
    return { active: cctvSceneActive, elapsed: cctvElapsed, phase: world.dataset.cctvScene ?? null, x: Math.round(body.position.x),
      pose: sprite.dataset.state, acting: sprite.dataset.cutscenePose, facing, zoom: cameraZoom, shake: Math.hypot(cameraShake.x, cameraShake.y), live: wall?.dataset.live,
      seen: collectedItems.has('b1-cctv-live'), inert: stage.inert, hidden: document.getElementById('cctv-scene').hidden,
      caption: document.getElementById('cctv-caption').textContent, sounds: [...soundLog],
      dim: Number(document.getElementById('cctv-dim').style.opacity || 0), bgm: cctvBgmPlaying() };
  });
  const advance = async time => {
    while ((await state()).active && (await state()).elapsed < time) {
      // 소등 컷씬은 대사에서 멈춰 클릭을 기다린다(scene-gate.js).
      if (await page.evaluate(() => cctvLightsGate.waiting)) await page.evaluate(() => cctvScene.click());
      await page.clock.runFor(17);
    }
  };

  // 처음 들어오면 문 앞에서 컷씬이 시작된다. 벽은 CCTV 에셋 위에 검은 막을 덮은 꺼진 모습이고(HTML 칸 없음), 자막은 없다.
  await enter();
  let now = await state();
  assert.equal(now.active, true); assert.equal(now.phase, 'enter'); assert.equal(now.x, 815);
  assert.equal(now.live, 'false'); assert.equal(now.inert, true); assert.equal(now.hidden, false);
  assert.equal(now.caption, '');
  assert.deepEqual(await page.locator('#dynamic-scene .cctv-wall').evaluate(el =>
    [getComputedStyle(el).backgroundImage.includes('cctv-wall.png'), getComputedStyle(el, '::before').opacity, el.children.length]), [true, '0.9', 0]);
  assert.deepEqual(await page.locator('#dynamic-scene .cctv-wall').evaluate(el => [el.offsetWidth, el.offsetHeight]), [419, 279]);
  assert.equal(await page.locator('#world').evaluate(el => getComputedStyle(el).filter), 'brightness(1)', 'The control room uses the normal room brightness (floor-b1.js)');
  await page.locator('#cctv-skip').evaluate(button => button.blur());
  for (const key of ['e', 'p', 'f', 'i', 'Space', 'a']) await page.keyboard.press(key);
  assert(await page.evaluate(() => !usingPhone && !usingInspection && !phoneLightOn && !jumpQueued && keys.size === 0), 'Input stays locked');
  await page.screenshot({ path: '.local/cctv-enter.png' });

  // 평소 걸음(초당 200px)으로 벽 앞까지 걸어간다. 카메라는 벽 아래와 수호를 함께 잡는 곳으로 옮겨 가며 확대된다.
  const untilPhase = async phase => {
    for (let i = 0; i < 800 && (await state()).active && (await state()).phase !== phase; i++) await page.clock.runFor(17);
    return state();
  };
  now = await untilPhase('walk');
  await page.clock.runFor(1000);
  now = await state();
  assert.equal(now.phase, 'walk'); assert.equal(now.pose, 'walk'); assert.equal(now.facing, 1);
  assert(now.x > 980 && now.x < 1060, `Walks at the normal pace (${now.x})`);
  assert(now.sounds.includes('step') && now.sounds.includes('cctv-rise'), 'Footsteps and the rising drone play');
  assert.equal(now.bgm, false, 'The control-room BGM waits for the screens to die');
  now = await untilPhase('look');
  assert.equal(now.x, 1247); assert.equal(now.pose, 'cutscene'); assert.equal(now.acting, 'look-up');
  assert.equal(now.live, 'false', 'All screens are still off');

  // 아홉 칸이 한꺼번에 밝은 잡음으로 지지직 켜진다. 수호의 모습은 어디에도 비치지 않는다.
  const noiseMasks = () => page.locator('#dynamic-scene .cctv-wall').evaluate(el => {
    const after = getComputedStyle(el, '::after');
    return after.backgroundImage.includes('svg') ? after.maskImage.split('linear-gradient').length - 1 : 0;
  });
  const signal = () => page.locator('#dynamic-scene .cctv-wall').getAttribute('data-signal');
  now = await untilPhase('on');
  assert.equal(now.live, 'true'); assert.equal(await signal(), 'on'); assert.equal(await noiseMasks(), 9, 'Static in all nine screens');
  assert(now.sounds.includes('cctv-on') && now.sounds.includes('cctv-static')); assert(!now.sounds.includes('cctv-beep'), 'No beep yet');
  await page.screenshot({ path: '.local/cctv-all-static.png' });

  // CCTV 한가운데로 확 빨려 들어가는 동안 "삐——"가 울린다.
  now = await untilPhase('plunge');
  assert(now.sounds.includes('cctv-beep'), 'The beep starts');
  await page.clock.runFor(800);
  now = await state();
  assert(now.zoom > 1.8, `Camera plunges into the CCTV (${now.zoom})`);
  assert.deepEqual(await page.evaluate(() => [cameraFocus.x, cameraFocus.y]), [1326.5, 286.5], 'Zooms around the center of the CCTV');

  // "삐——"가 뚝 끊기는 순간 쾅 소리와 함께 화면들이 칸마다 붉은 가로 실선으로 꺼지고 붉은 빛이 화면을 스친다. 배경음이 깔린다.
  now = await untilPhase('lost');
  assert.equal(await signal(), 'collapse'); assert(now.sounds.includes('switch') && now.sounds.includes('cctv-hit'));
  assert.equal(await page.locator('#cctv-dim').getAttribute('data-tint'), 'red'); assert(now.dim > .2, 'A red flash');
  assert.equal(now.bgm, true);
  // 흔들림은 물러난 뒤가 아니라 꺼지는 그때, 확대된 채로 온다.
  await page.clock.runFor(200);
  now = await state();
  assert(now.shake > 5, 'Camera quakes as the screens die'); assert(now.zoom > 1.8, `Still zoomed in (${now.zoom})`);
  await page.screenshot({ path: '.local/cctv-signal-lost.png' });
  // 붉은 빛이 지나가면 흔들리는 동안 화면 전체가 고르게 조금만 어두워진다.
  await page.clock.runFor(500);
  now = await state();
  assert(now.dim > .4 && now.dim < .7, `Partial darkness (${now.dim})`);
  assert.equal(await page.locator('#cctv-dim').getAttribute('data-tint'), '');
  assert.equal(now.pose, 'cutscene'); assert.equal(now.acting, 'startled'); assert.equal(now.facing, 1);
  await page.screenshot({ path: '.local/cctv-quake.png' });

  // 흔들림이 잦아든 뒤에야 흔들림 없이 천천히 물러난다. 잡음은 조금 어두워진 회색으로 남는다.
  now = await untilPhase('settle');
  assert.equal(now.shake, 0); assert.equal(now.dim, 0); assert.equal(await signal(), null);
  assert.equal(await page.locator('#dynamic-scene .cctv-wall').evaluate(el => getComputedStyle(el, '::after').opacity), '0.5', 'The static dims');
  await page.clock.runFor(1000);
  assert((await state()).zoom < 1.6, 'Pulls back slowly');

  // 물러나면 자막 없이 바로 끝난다. 조작이 돌아오고, CCTV를 보기 전까지 벽은 아홉 칸 모두 어두운 잡음이다.
  for (let i = 0; i < 200 && (await state()).active; i++) await page.clock.runFor(17);
  now = await state();
  assert.equal(now.active, false); assert.equal(now.seen, true); assert.equal(now.inert, false); assert.equal(now.hidden, true);
  assert.equal(now.phase, null); assert.equal(now.bgm, true); assert.equal(now.live, 'true'); assert.equal(await noiseMasks(), 9, 'Dark static until the CCTV is viewed');
  assert.equal(await page.evaluate(() => soundLog.includes('heartbeat')), false, 'No turn-around beat');
  assert.equal(await page.locator('#interaction-hint').textContent(), 'E · CCTV 모니터 벽 조사');
  assert.deepEqual(await page.locator('#interaction-outline').evaluate(el => ['left', 'top', 'width', 'height'].map(key => Math.round(parseFloat(el.style[key])))),
    [1117, 147, 419, 279], 'The outline matches the wall while zoomed');
  await page.clock.runFor(1000);
  assert.equal((await state()).zoom, 1, 'Zoom eases back quickly after the scene');
  await page.keyboard.press('e');
  await page.clock.runFor(100);
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'full-image');
  const image = page.locator('#inspection .full-image img');
  await image.evaluate(img => img.decode());
  assert.deepEqual(await image.evaluate(img => [img.naturalWidth, img.naturalHeight, img.getAttribute('src')]),
    [1536, 1024, 'assets/objects/b1/cctv-wall.png']);
  // object-fit: contain이므로 실제로 그려진 크기는 칸 안에서 3:2 비율로 맞춘 크기다.
  const box = await image.boundingBox();
  const drawnHeight = Math.min(box.height, box.width / 1.5);
  assert(drawnHeight > 620, `The CCTV wall fills the screen (${box.width}x${box.height}, drawn height ${drawnHeight})`);
  assert.match(await page.locator('#inspection-description').textContent(), /추적 대상 1 · 정수호.*B2 칸만/);
  assert((await state()).sounds.includes('cctv-static'));
  assert.deepEqual(await page.locator('#inspection .full-image-static').evaluateAll(spans => spans.map(span =>
    getComputedStyle(span).maskImage.split('linear-gradient').length - 1)), [9], 'The first view starts with static in each screen');
  // 처음 켜 보는 동안에는 기괴하고 음산한 배경음(cctv-dread)이 흐른다.
  assert.equal(await page.evaluate(() => cctvDreadPlaying()), true, 'The eerie BGM plays during the first view');
  await page.screenshot({ path: '.local/cctv-full-image.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: '.local/cctv-full-image-mobile.png' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.keyboard.press('Escape');
  assert(await page.locator('#inspection').isHidden());
  assert.equal(await page.evaluate(() => cctvDreadPlaying()), false);
  // 처음 본 전체 화면을 닫으면 소등 컷씬이 돈다: 지지직거리지 않고 먼저 "그동안 날 지켜보고 있었던 거야?" → 벽이 지직거림 →
  // 원래 조명이 1.6초 동안 탁 꺼짐 → 붉은 비상등이 깜빡이며 켜지고 "불이 왜 꺼지는 거지?" → 정신력 급감.
  // 그동안 조사 힌트는 보이지 않고 입력도 막힌다.
  const sanityBefore = await page.evaluate(() => sanity);
  now = await state();
  assert.equal(now.active, true); assert.equal(now.phase, 'watch'); assert.equal(now.live, 'all');
  assert.equal(await page.locator('#dynamic-scene .cctv-wall').getAttribute('data-glitch'), null, 'No static right after closing');
  assert.equal(await page.locator('#interaction-hint').evaluate(el => getComputedStyle(el).visibility), 'hidden');
  await page.keyboard.press('e');
  assert.equal(await page.evaluate(() => usingInspection), false);
  await advance(500);
  assert.match((await state()).caption, /그동안 계속 날 지켜보고 있었던 거야/);
  await page.screenshot({ path: '.local/cctv-lights-watch.png' });
  await page.clock.runFor(4000);
  assert.equal((await state()).elapsed, 2999, '클릭하기 전에는 첫 대사에서 멈춰 있다');
  assert(await page.locator('#cctv-scene .scene-next').isVisible(), '클릭 안내가 보인다');
  await advance(3100);
  now = await state();
  assert.equal(now.phase, 'glitch'); assert.equal(await page.locator('#dynamic-scene .cctv-wall').getAttribute('data-glitch'), 'true');
  await page.screenshot({ path: '.local/cctv-lights-glitch.png' });
  // 불이 나가기 전까지는 원래 푸른 조명과 밝기 그대로다.
  assert.equal(await page.locator('#world').getAttribute('data-alarm'), 'false');
  assert.doesNotMatch(await page.locator('#world').evaluate(el => getComputedStyle(el).filter), /brightness\(0\.4\)/);
  // 원래 조명이 탁 나가 1.6초 동안 캄캄하다. 그동안 배경음도 끊긴다.
  await advance(4000);
  now = await state();
  assert.equal(now.phase, 'out'); assert.equal(now.caption, ''); assert.equal(now.dim, 1); assert.equal(now.bgm, false);
  assert(now.sounds.includes('blackout'));
  assert.equal(await page.locator('#world').getAttribute('data-alarm'), 'true', 'The red light waits under the black');
  await page.screenshot({ path: '.local/cctv-lights-out.png' });
  // 캄캄하다가 붉은 비상등이 형광등처럼 깜빡깜빡하며 켜진다.
  const flicker = [];
  for (const at of [5330, 5420, 5500, 5600, 5750, 5950]) { await advance(at); flicker.push((await state()).dim); }
  assert.deepEqual(flicker, [0, 1, 0, 1, 0, 0], 'On, off, on, off, on and stays on');
  now = await state();
  assert.equal(now.phase, 'back'); assert.equal(now.bgm, true);
  await advance(6200);
  now = await state();
  assert.match(now.caption, /불이 왜 꺼지는 거지/);
  await page.screenshot({ path: '.local/cctv-lights-on.png' });
  assert.equal(await page.locator('#world').getAttribute('data-dark'), 'false', 'Not a dark room: the red light comes back');
  assert.match(await page.locator('#world').evaluate(el => getComputedStyle(el).filter), /brightness\(0\.4\)/, 'Darker under the red light');
  assert.equal(await page.evaluate(() => sanity), Math.max(0, sanityBefore - 35), 'Sanity drops at once');
  await advance(8700);
  now = await state();
  assert.equal(now.active, false); assert.equal(now.inert, false);
  assert(await page.evaluate(() => collectedItems.has('b1-lights-out')));
  assert.equal(await page.evaluate(() => world.dataset.blackout), 'true', '소등 컷씬이 끝나면 지하 전등이 꺼진다');
  assert.equal(await page.locator('#dynamic-scene .cctv-wall').evaluate(el => getComputedStyle(el, '::before').opacity), '0');
  await page.screenshot({ path: '.local/cctv-after.png' });
  // 두 번째로 열면 잡음 없이 뜨고, 소등 컷씬도 다시 돌지 않는다. 다시 들어와도 붉은 조명이고, 다른 방은 그대로다.
  await page.keyboard.press('e');
  await page.clock.runFor(100);
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'full-image');
  assert.equal(await page.locator('#inspection .full-image-static').count(), 0);
  await page.keyboard.press('Escape');
  assert.equal((await state()).active, false, 'The lights-out scene plays once');
  await page.evaluate(() => performFloorChange('b1-control', null, 'exit'));
  assert.equal((await state()).live, 'all');
  assert.equal(await page.locator('#world').getAttribute('data-alarm'), 'true', 'Still red when re-entering');
  await page.evaluate(() => performFloorChange('b1'));
  assert.equal(await page.locator('#world').getAttribute('data-alarm'), 'false', 'Only the control room is red');
  assert.equal(await page.locator('#world').getAttribute('data-blackout'), 'true', 'The whole basement stays dark');
  assert.equal(await page.evaluate(() => { performFloorChange('b2'); return world.dataset.blackout; }), 'true', 'B2 lights are off too');
  assert.equal(await page.evaluate(() => { performFloorChange('f1'); return world.dataset.blackout; }), 'false', 'Upper floors keep their lights');
  await page.evaluate(() => performFloorChange('b1'));

  // 소등 컷씬도 건너뛰면 결과(붉은 비상등 조명, 정신력 급감)를 남긴다.
  await enter(true);
  await page.evaluate(() => { openFullImage(currentDoors.find(door => door.seenBy), '테스트'); closeInspection(); });
  assert.equal((await state()).active, true);
  await advance(2000);
  await page.keyboard.press('Escape');
  now = await state();
  assert.equal(now.active, false); assert.equal(now.dim, 0);
  assert.equal(await page.locator('#world').getAttribute('data-alarm'), 'true');
  assert.equal(await page.evaluate(() => sanity), 65);

  // 다시 들어와도 재생하지 않고, 벽은 아홉 칸 모두 잡음이다.
  await enter(true);
  now = await state();
  assert.equal(now.active, false); assert.equal(now.live, 'true');

  // 건너뛰기(Esc·버튼)와 장면 전환은 모두 한 번 본 것으로 끝낸다.
  await enter(); await advance(1500);
  await page.keyboard.press('Escape');
  now = await state();
  assert.equal(now.active, false); assert.equal(now.seen, true); assert.equal(now.live, 'true'); assert.equal(now.inert, false);
  assert.equal(now.shake, 0);
  await enter(); await advance(4000);
  await page.locator('#cctv-skip').tap();
  assert.equal((await state()).active, false);
  await enter(); await advance(3000);
  await page.evaluate(() => performFloorChange('b1'));
  now = await state();
  assert.equal(now.active, false); assert.equal(now.seen, true); assert.equal(now.zoom, 1); assert.equal(now.inert, false);

  // 장면 전환을 거쳐 들어오면 화면이 밝아진 뒤에 시작한다.
  await page.evaluate(() => { collectedItems.delete('b1-cctv-live'); changeRoom(() => performFloorChange('b1-control', null, 'exit')); });
  await page.clock.runFor(400);
  assert.equal((await state()).active, false, 'Not during the fade');
  await page.clock.runFor(800);
  assert.equal((await state()).active, true);
  await page.keyboard.press('Escape');

  // 컷씬 도중 저장한 진행은 불러오면 처음부터 다시 재생한다.
  await enter(); await advance(2000);
  await page.evaluate(() => { saveProgress(); restoreProgress(readProgress()); });
  assert.equal((await state()).active, false);
  await page.clock.runFor(100);
  assert.equal((await state()).active, true);
  await page.keyboard.press('Escape');

  // 움직임 줄이기: 확대와 흔들림 없이 진행한다.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(); now = await untilPhase('lost'); await page.clock.runFor(700);
  now = await state();
  assert.equal(now.zoom, 1); assert.equal(now.shake, 0); assert.equal(now.phase, 'lost'); assert(now.dim > .4, 'Darkening is not motion');
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  console.log('PASS: first-entry CCTV scene (normal-pace walk, nine static screens, beep, framed push-in, red screen-off with a zoomed-in quake, slow pull-back), static in every screen until the CCTV is viewed, per-screen static on the CCTV view, lights-out scene (line, then blackout, red light, second line) with sanity loss, no replay, skip/scene cleanup, fade, save, reduced motion.');
} finally { await browser.close(); }
