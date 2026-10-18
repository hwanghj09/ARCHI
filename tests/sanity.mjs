import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  assert.equal(await page.locator('#sanity-meter').getAttribute('aria-valuenow'), '35', '새 게임은 정신력 35%로 시작한다');
  assert(await page.locator('#sanity-hud').isHidden(), 'Opening hides the gameplay meter');
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);
  const state = () => page.evaluate(() => ({ sanity, exposure: sanityExposure(), fearTier, hallucinating: !hallucinations.hidden,
    mode: hallucinationMode, battery: phoneBattery, caught: playerCaught, hallucinationCaught, x: body.position.x }));
  const near = (actual, expected) => assert(Math.abs(actual - expected) < .08, `${actual} ≈ ${expected}`);
  await page.evaluate(() => { sanity = 100; });
  await page.clock.runFor(2000); assert.equal((await state()).sanity, 100, '밝은 곳에서는 정신력이 100을 넘지 않는다');
  await page.evaluate(() => triggerBuildingBlackout());
  assert.equal((await state()).exposure, 'dark');
  // 어두운 곳: 3초에 1%(=1/3%/초)씩 준다.
  await page.clock.runFor(3000); near((await state()).sanity, 99);
  await page.keyboard.press('f');
  const shielded = await state();
  assert.equal(shielded.exposure, 'flashlight');
  // 플래시도 밝은 곳과 마찬가지로 감소만 막을 뿐, 더 이상 올려주지는 않는다.
  await page.clock.runFor(3000); near((await state()).sanity, shielded.sanity);
  assert((await state()).battery < shielded.battery, 'Protection still consumes the phone battery');
  await page.keyboard.press('f');
  await page.keyboard.press('p');
  const reading = (await state()).sanity;
  await page.clock.runFor(5000); near((await state()).sanity, reading - 5 / 3);
  await page.keyboard.press('Escape');
  await page.evaluate(() => openInspection('메모', '읽는 동안에는 정신력이 줄지 않는다.'));
  await page.clock.runFor(4000); near((await state()).sanity, reading - 5 / 3);
  await page.keyboard.press('Escape');
  await page.evaluate(() => { solarEnabled = true; solarPoweredFloors = [17]; updatePowerState(); });
  await page.clock.runFor(2500); near((await state()).sanity, reading - 5 / 3); // 밝은 곳에서는 더 이상 회복되지 않는다
  // 17층 조명 스위치는 화면에서 숨겨졌으니 같은 change 처리기로 끈다.
  await page.locator('#floor17-lights').evaluate(el => { el.checked = false; el.dispatchEvent(new Event('change')); });
  await page.clock.runFor(3000); near((await state()).sanity, reading - 5 / 3 - 1);
  await page.evaluate(() => {
    phoneBattery = 1; phoneLightOn = true; phoneDrainAccumulator = 0; refreshPhone();
  });
  const untilEmpty = (await state()).sanity;
  await page.clock.runFor(1000); near((await state()).sanity, untilEmpty);
  await page.clock.runFor(3000); assert((await state()).sanity < untilEmpty - .6, 'Depleted phone removes darkness protection');

  // ---- 단계별 공포 연출(fearTier) ----
  await page.evaluate(() => { sanity = 45; updateSanity(1); });
  assert.equal((await state()).fearTier, 1, '50% 미만부터 1단계');
  await page.evaluate(() => { sanity = 25; updateSanity(1); });
  assert.equal((await state()).fearTier, 3, '30% 미만부터 3단계(지친 모습·이동 저하·먼 환각)');
  assert.equal(await page.evaluate(() => document.body.dataset.weary), 'true');
  const speedAt25 = await page.evaluate(() => sanitySpeedFactor());
  assert(speedAt25 < 1, '30% 미만에서는 이동 속도가 줄어든다');
  await page.evaluate(() => { sanity = 5; updateSanity(1); });
  assert.equal((await state()).fearTier, 5, '10% 미만부터 5단계');
  const speedAt5 = await page.evaluate(() => sanitySpeedFactor());
  assert(speedAt5 < speedAt25, '10% 미만에서는 한 번 더 느려진다');
  await page.evaluate(() => { sanity = 100; updateSanity(1); });
  assert.equal((await state()).fearTier, 0);

  // ---- 경비 로봇에게 쫓기는 동안의 급격한 감소(보스전 예외) ----
  await page.evaluate(() => { sanity = 100; guardPatrol.mode = 'chase'; bossFightActive = false; updateSanity(1000); });
  near((await state()).sanity, 90);
  await page.evaluate(() => { guardPatrol.mode = 'patrol'; });
  // 쫓겨서는 10% 아래로 줄지 않고, 이미 10% 아래면 더 줄지 않는다.
  await page.evaluate(() => { sanity = 12; guardPatrol.mode = 'chase'; bossFightActive = false; updateSanity(1000); });
  assert.equal((await state()).sanity, 10, '추격 감소는 10%에서 멈춘다');
  await page.evaluate(() => { sanity = 7; updateSanity(1000); });
  assert.equal((await state()).sanity, 7, '10% 아래에서는 쫓겨도 더 줄지 않는다');
  await page.evaluate(() => { guardPatrol.mode = 'patrol'; });
  await page.evaluate(() => { sanity = 100; guardPatrol.mode = 'chase'; bossFightActive = true; updateSanity(1000); });
  near((await state()).sanity, 100 - 1 / 3); // 보스전은 추격 감소만 제외하고 어둠의 기본 소모는 유지한다.
  await page.evaluate(() => { sanity = 100; phoneLightOn = true; phoneBattery = 100; updateSanity(1000); });
  assert.equal((await state()).sanity, 100, '보스전 중 빛을 비추면 추격·어둠 감소가 모두 없다');
  await page.evaluate(() => { guardPatrol.mode = 'patrol'; bossFightActive = false; phoneLightOn = false; });

  // ---- 추격 후 10%에서도 약을 찾으러 이동할 여유가 있다. 빛 유무와 무관하게 초당 0.1% 감소 ----
  await page.evaluate(() => {
    collectedItems.add('story-anxiety-seen'); sanity = 10; phoneLightOn = true; phoneBattery = 100;
    updateSanity(5000);
  });
  near((await state()).sanity, 9.5);
  await page.evaluate(() => updateSanity(55000));
  near((await state()).sanity, 4); // 이동·탐색 1분 뒤에도 고갈되지 않는다.
  await page.evaluate(() => { phoneLightOn = false; });
  await page.evaluate(() => { collectedItems.add('story-anxiety-seen'); sanity = 50; updateSanity(1000); });
  near((await state()).sanity, 49.9);
  await page.evaluate(() => { collectedItems.add('f16-antianxiety-used'); collectedItems.add('sanity-drain-resume'); sanity = 50; updateSanity(1000); });
  near((await state()).sanity, 50 - 1 / 3); // 임무 감소만 멈추고 어둠의 기본 소모는 유지한다.
  await page.evaluate(() => { sanity = 50; phoneLightOn = true; phoneBattery = 100; updateSanity(1000); });
  assert.equal((await state()).sanity, 50, '항불안제 사용 후 빛을 비추면 임무·어둠 감소가 모두 없다');
  await page.evaluate(() => { collectedItems.delete('story-anxiety-seen'); collectedItems.delete('f16-antianxiety-used'); collectedItems.delete('sanity-drain-resume'); phoneLightOn = false; });

  // ---- 정신력 0%: 방향 전환에 0.1초(sanityZeroTurnDelayMs)가 걸리고(그동안 제자리), 같은 방향이거나 정신력이 있으면 지연 없음 ----
  const turn = await page.evaluate(() => {
    const out = {};
    sanity = 0; facing = 1; zeroTurnTimer = 0;
    out.same = applyZeroSanityTurnDelay(1);
    let ticks = 0;
    while (applyZeroSanityTurnDelay(-1) === 0 && ticks < 100) ticks++;
    out.waited = ticks * step;
    sanity = 50; zeroTurnTimer = 0;
    out.normal = applyZeroSanityTurnDelay(-1);
    return out;
  });
  assert.equal(turn.same, 1);
  assert(turn.waited >= 80 && turn.waited <= 120, `turn delay ${turn.waited}ms`);
  assert.equal(turn.normal, -1, '정신력이 있으면 바로 돌아선다');

  // ---- 붉은 눈: 깜빡일 때마다 수호 주변의 벽에 1~2개씩 늘고 눈동자가 수호를 따라본다 ----
  const eyes = await page.evaluate(() => {
    redEyes.replaceChildren();
    spawnRedEyes();
    const first = redEyes.children.length;
    spawnRedEyes();
    const second = redEyes.children.length;
    for (let i = 0; i < 6; i++) spawnRedEyes();
    const fullEye = redEyes.firstElementChild;
    spawnRedEyes();
    render();
    return {
      first, second,
      count: redEyes.children.length,
      keepsOld: redEyes.firstElementChild === fullEye,
      inWorld: world.contains(redEyes),
      around: [...redEyes.children].every(eye => Math.abs(Number(eye.dataset.x) - body.position.x) <= 460),
      clearOfPlayer: [...redEyes.children].every(eye => Number(eye.dataset.y) - body.position.y <= -60 && (Math.abs(Number(eye.dataset.x) - body.position.x) >= 85 || Number(eye.dataset.y) - body.position.y <= -150)),
      pupil: [...redEyes.children].every(eye => eye.style.getPropertyValue('--px') !== ''),
      ranges: [3, 4, 5].map(tier => blinkIntervalRangeByTier[tier]),
    };
  });
  assert(eyes.first >= 1 && eyes.first <= 2, '붉은 눈은 한 번에 1~2개씩 생긴다');
  assert(eyes.second - eyes.first >= 1 && eyes.second - eyes.first <= 2, '다음 깜빡임에 기존 눈을 두고 1~2개 더 생긴다');
  assert(eyes.count <= 6 && eyes.inWorld, '붉은 눈은 최대 6개까지 월드 안에 머문다');
  assert(eyes.keepsOld, '최대 개수가 차면 오래된 눈을 지우고 새로 만들지 않는다');
  assert(eyes.around, '화면 전체가 아니라 수호 주변에 모인다');
  assert(eyes.clearOfPlayer, '수호 몸을 가리지 않고 양옆·머리 위에만 생긴다');
  assert.equal(eyes.pupil, true, '눈동자 위치가 계산된다');
  const moved = await page.evaluate(() => {
    const original = { ...body.position };
    const eye = redEyes.firstElementChild;
    updateRedEyes();
    const position = () => [eye.dataset.x, eye.dataset.y, eye.style.left, eye.style.top];
    const pupil = () => [eye.style.getPropertyValue('--px'), eye.style.getPropertyValue('--py')];
    const before = position(), pupilBefore = pupil();
    Body.setPosition(body, { x: original.x + 120, y: original.y - 40 });
    for (let i = 0; i < 120; i++) updateRedEyes();
    const after = position(), pupilAfter = pupil();
    Body.setPosition(body, original); updateRedEyes();
    return { before, after, pupilBefore, pupilAfter };
  });
  assert.deepEqual(moved.after, moved.before, '수호가 움직여도 눈 전체는 생성된 벽 위치에 고정된다');
  assert.notDeepEqual(moved.pupilAfter, moved.pupilBefore, '고정된 눈 안의 눈동자만 수호를 따라 움직인다');
  const gaze = await page.evaluate(async () => {
    const eye = redEyes.firstElementChild;
    const original = { ...eye.dataset };
    // 가까이 가면 눈이 깨지므로(RED_EYE_BREAK_DISTANCE), 방금 불이 켜졌던 것으로 두어 (0, 0) 시선에서도 깨지지 않게 한다.
    redEyeBrightAt = performance.now();
    // 수호가 눈에서 (dx, dy)만큼 떨어진 자리에 있도록 눈을 옮겨 본다.
    const look = (dx, dy) => {
      Object.assign(eye.dataset, { x: body.position.x - dx, y: body.position.y - 20 - dy });
      updateRedEyes();
    };
    const offsets = [];
    for (const dx of [-200, 200]) {
      look(dx, 0);
      offsets.push(parseFloat(eye.style.getPropertyValue('--px')));
    }
    const irisRatios = [];
    const opening = eye.style.getPropertyValue('--eye-open');
    for (const open of [.8, 1.05]) {
      eye.style.setProperty('--eye-open', open);
      for (const [dx, dy] of [[0, 0], [-200, 0], [200, 0], [0, -200], [0, 200], [200, 200]]) {
        look(dx, dy);
        const iris = getComputedStyle(eye, '::before');
        const matrix = new DOMMatrix(iris.transform);
        irisRatios.push(parseFloat(iris.height) * matrix.d * open / (parseFloat(iris.width) * matrix.a));
      }
    }
    eye.style.setProperty('--eye-open', opening);
    Object.assign(eye.dataset, original); updateRedEyes();
    redEyeBrightAt = -Infinity;
    const backgrounds = [getComputedStyle(eye).backgroundImage, getComputedStyle(eye, '::before').backgroundImage];
    const loaded = await Promise.all(backgrounds.map(background => new Promise(resolve => {
      const image = new Image(); image.onload = () => resolve(image.naturalWidth > 0);
      image.onerror = () => resolve(false); image.src = background.slice(5, -2);
    })));
    return { offsets, irisRatios, backgrounds, loaded };
  });
  assert(gaze.offsets[0] < 0 && gaze.offsets[1] > 0, '홍채와 동공이 캐릭터의 좌우 이동을 따라본다');
  assert(gaze.offsets.every(offset => Math.abs(offset) <= 80 * .08 + .001), '홍채가 눈꺼풀 안에 머문다');
  assert(gaze.irisRatios.every(ratio => Math.abs(ratio - 1) < .01), '시선과 눈꺼풀 벌어짐이 달라도 홍채의 원형이 유지된다');
  assert(gaze.backgrounds[0].includes('red-eye-sclera-pixel.png') && gaze.backgrounds[1].includes('red-eye-iris-pixel.png'));
  assert(gaze.loaded.every(Boolean), '분리된 흰자와 홍채 에셋이 로드된다');
  assert(Math.abs(eyes.ranges[1][1] / eyes.ranges[0][1] - 2 / 3) < .01 && Math.abs(eyes.ranges[2][1] / eyes.ranges[1][1] - 2 / 3) < .01, '깜빡이는 간격이 단계마다 1/3씩 짧아진다');

  // ---- 어둠 속 얼굴: 15% 미만·불 꺼진 어둠에서 9초마다 나오고, 직전 얼굴은 건너뛰며, 밝아지면 즉시 사라진다 ----
  const faces = await page.evaluate(() => {
    const out = { seq: [] };
    buildingBlackout = true; updatePowerState(); phoneLightOn = false; sanity = 10; darkFace.hidden = true; darkFaceTimer = darkFaceLife = 0; darkFaceLast = -1;
    updateDarkFace(8999, false); out.early = !darkFace.hidden;
    for (let i = 0; i < 8; i++) { updateDarkFace(9000, false); out.seq.push(darkFaceLast); }
    out.shown = !darkFace.hidden;
    updateDarkFace(2000, false); out.gone = darkFace.hidden;
    updateDarkFace(9000, false); phoneLightOn = true; updateDarkFace(16, false); out.flash = darkFace.hidden;
    phoneLightOn = false; sanity = 20; updateDarkFace(9000, false); out.highSanity = darkFace.hidden;
    sanity = 100; darkFaceTimer = 0; out.forced = debugTriggerJumpscare() && !darkFace.hidden; updateDarkFace(2000, false); out.forcedGone = darkFace.hidden;
    return out;
  });
  assert.equal(faces.early, false, '9초가 지나기 전에는 나오지 않는다');
  assert.equal(faces.shown, true);
  assert(faces.seq.every((face, index) => index === 0 || face !== faces.seq[index - 1]), '직전 얼굴은 연달아 나오지 않는다');
  assert.equal(faces.gone, true, '2초 뒤 사라진다');
  assert.equal(faces.flash, true, '플래시를 켜면 즉시 사라진다');
  assert.equal(faces.highSanity, true, '15% 이상에서는 나오지 않는다');
  assert.equal(faces.forced, true, '콘솔 버튼은 조건과 상관없이 얼굴을 띄운다');
  assert.equal(faces.forcedGone, true);

  // ---- 정신력이 0%보다 높아지면 진행 중이던 추격(콘솔로 시작한 것 포함)이 중지된다 ----
  const stopped = await page.evaluate(() => {
    const out = {};
    sanity = 0; zeroEventForced = false; zeroEventPhase = 'idle'; hallucinationMode = null; facing = 1; phoneLightOn = false;
    debugTriggerChaseHallucination(); out.started = zeroEventPhase === 'charging' && !flashPrompt.hidden;
    sanity = 20; updateZeroEvent(16, false);
    out.phase = zeroEventPhase; out.mode = hallucinationMode; out.prompt = flashPrompt.hidden;
    sanity = 100; return out;
  });
  assert.equal(stopped.started, true);
  assert.deepEqual([stopped.phase, stopped.mode, stopped.prompt], ['idle', null, true], '정신력이 오르면 추격이 중지된다');

  // ---- 20% 미만: 컴퓨터 안의 창이 아니라 배경의 켜진 모니터 화면이 바뀐다 ----
  const monitor = await page.evaluate(() => {
    const out = {};
    sanity = 15; updateSanity(0); out.low = officeComputer.element.dataset.fearStill;
    out.windowGone = document.getElementById('computer-fear-window') === null;
    sanity = 100; updateSanity(0); out.normal = officeComputer.element.dataset.fearStill ?? null;
    return out;
  });
  assert(['off', 'color-bars', 'boot-error', 'static-noise'].includes(monitor.low), '20% 미만이면 배경 모니터 화면이 바뀐다');
  assert.equal(monitor.windowGone, true, '컴퓨터 안의 오류 창은 없다');
  assert.equal(monitor.normal, null, '정신력이 오르면 원래 화면으로 돌아온다');

  // ---- 20% 미만: 배경의 모든 모니터(책상 소품·사무실 그림 속 모니터)가 같은 식으로 바뀐다 ----
  const screens = await page.evaluate(() => {
    const out = {};
    sanity = 15; updateSanity(0);
    out.office = document.querySelectorAll('.fear-screen.office').length;
    out.corridor = document.querySelectorAll('.fear-screen.corridor').length;
    const holder = document.createElement('div'); const art = document.createElement('img'); holder.append(art); document.body.append(holder);
    Object.assign(art.style, { left: '100px', top: '10px', width: '3692px', height: '950px' }); addBackgroundMonitors(art, 'assets/background/floor03/floor03-cs-interior.png');
    const placed = [...holder.querySelectorAll('.fear-screen')].sort((a, b) => parseFloat(a.style.left) - parseFloat(b.style.left));
    out.bg = [placed.length, placed[0]?.style.left, placed[0]?.style.top]; holder.remove();
    out.officeShown = [...document.querySelectorAll('.fear-screen.office')].every(el => getComputedStyle(el).display === 'block');
    performFloorChange('f12-dev', 0, 'exit'); updateSanity(0);
    out.propScreens = document.querySelectorAll('#dynamic-scene .floor-prop .fear-screen').length;
    sanity = 100; updateSanity(0);
    out.hidden = [...document.querySelectorAll('.fear-screen')].every(el => getComputedStyle(el).display === 'none');
    return out;
  });
  assert.equal(screens.office, 5);
  assert.equal(screens.corridor, 7, '복도 유리벽 너머의 모니터도 바뀐다');
  assert.deepEqual(screens.bg, [13, '246px', '660px'], '층 배경 그림 속 모니터는 그림 배율에 맞춰 놓인다');
  assert.equal(screens.propScreens > 0, true, '책상 소품의 모니터 화면도 바뀐다');
  assert.equal(screens.hidden, true, '정신력이 오르면 모두 원래대로 돌아온다');

  // ---- 항불안제를 쓴 뒤에는 다시 닳기 시작하는 조건(sanity-drain-resume)이 생기기 전까지 정신력이 닳지 않는다 ----
  const calm = await page.evaluate(() => {
    const out = {};
    collectedItems.add('f16-antianxiety-used'); sanity = 50; guardPatrol.mode = 'chase'; bossFightActive = false;
    updateSanity(1000); out.calm = sanity;
    collectedItems.add('sanity-drain-resume'); sanity = 50; updateSanity(1000); out.resumed = sanity;
    guardPatrol.mode = 'patrol'; collectedItems.delete('sanity-drain-resume'); collectedItems.delete('f16-antianxiety-used'); sanity = 100;
    return out;
  });
  assert.equal(calm.calm, 50, '항불안제를 쓴 뒤에는 쫓겨도 정신력이 닳지 않는다');
  assert(Math.abs(calm.resumed - 40) < .1, '조건이 생기면 원래 규칙(쫓길 때 초당 10%)으로 돌아간다');

  // ---- 0%가 되기 전에는 예고 환각이 나타나지 않는다 ----
  await page.evaluate(() => { sanity = 2; hallucinationMode = null; updateSanity(16); });
  assert.equal((await state()).mode, null, '0% 직전에도 다가오는 예고 환각은 없다');


  // ---- 플래시를 쓸 수 없는 동안(배터리 0%)에는 돌진하지 않는다 ----
  await page.evaluate(() => {
    sanity = 0; facing = 1; phoneLightOn = false; phoneBattery = 0; zeroEventEvasions = 0; zeroEventPhase = 'idle'; zeroEventTimer = 0;
  });
  await page.clock.runFor(16000);
  assert.equal(await page.evaluate(() => zeroEventPhase), 'waiting', '배터리가 없으면 피할 수 없으니 돌진하지 않는다');

  // ---- 0% 돌진: 회피 두 번, 또는 회피 실패 → 잡아먹힘 ----
  await page.evaluate(() => {
    sanity = 0; facing = 1; phoneLightOn = false; phoneBattery = 100; zeroEventEvasions = 0; zeroEventPhase = 'idle'; zeroEventTimer = 0;
  });
  await page.clock.runFor(15100); // 15초 대기 후 첫 돌진
  const charge1 = await page.evaluate(() => ({ phase: zeroEventPhase, side: zeroEventSide, mode: hallucinationMode }));
  assert.equal(charge1.phase, 'charging');
  assert.equal(charge1.mode, 'charge');
  assert.equal(charge1.side, -1, '플레이어가 바라보던 오른쪽의 반대쪽(왼쪽)에서 나타난다');
  assert.equal(await page.evaluate(() => phoneLightOn), false, '돌진이 시작되면 켜져 있던 플래시가 꺼진다');
  assert(await page.locator('#flash-prompt').isVisible(), '돌진 동안 플래시 안내가 뜬다');
  await page.evaluate(side => { facing = side; phoneLightOn = true; }, charge1.side);
  await page.clock.runFor(100); // 바라보며 플래시를 비추면 회피
  assert.equal(await page.evaluate(() => zeroEventEvasions), 1);
  assert(await page.locator('#flash-prompt').isHidden(), '환각이 사라지면 안내도 사라진다');
  assert.equal((await state()).mode, null);
  assert.equal((await state()).hallucinationCaught, false);

  await page.evaluate(() => { facing = 1; phoneLightOn = false; });
  await page.clock.runFor(10100); // 회피 이후에는 10초 뒤 재시도
  const charge2 = await page.evaluate(() => ({ phase: zeroEventPhase, side: zeroEventSide }));
  assert.equal(charge2.phase, 'charging');
  await page.evaluate(side => { facing = side; phoneLightOn = true; }, charge2.side);
  await page.clock.runFor(100);
  assert.equal(await page.evaluate(() => zeroEventEvasions), 2);
  // ---- 회피하지 못하면 환각에게 잡아먹혀 게임 오버, 다시 정신을 차리고 이어간다 ----
  await page.evaluate(() => {
    sanity = 0; facing = 1; phoneLightOn = false; zeroEventEvasions = 0; zeroEventPhase = 'idle'; zeroEventTimer = 0;
  });
  await page.clock.runFor(15100);
  await page.clock.runFor(2500); // 회피하지 않으면 돌진 지속 시간 안에 잡아먹힌다
  assert.equal((await state()).hallucinationCaught, true);
  assert.equal(await page.locator('#hallucination-caught').isHidden(), false);
  assert.equal(await page.locator('#hallucination-caught-title').textContent(), 'GAME OVER');
  assert.equal(await page.locator('#hallucination-caught').evaluate(el => {
    const box = el.getBoundingClientRect();
    return box.top === 0 && box.left === 0 && box.width === innerWidth && box.height === innerHeight;
  }), true, 'Hallucination game over covers the viewport');
  await page.locator('#hallucination-retry').click();
  const recovered = await state();
  assert.equal(recovered.caught, false);
  assert(recovered.sanity > 0, '잡아먹힌 뒤에는 정신력을 조금 되찾고 같은 자리에서 다시 시작한다');
  assert.equal(await page.locator('#hallucination-caught').isHidden(), true);

  assert.deepEqual(errors, []);
  console.log('PASS: sanity HUD/clamps, dark-only drain (no bright/flashlight recovery), chase drain with boss exemption, ' +
    'fear tiers and speed penalty, pre-zero warning sighting, 0% charge/evade/retry chain, devoured game over and recovery.');
} finally { await browser.close(); }
