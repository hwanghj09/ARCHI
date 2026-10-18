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
  assert.equal(await page.locator('#sanity-meter').getAttribute('aria-valuenow'), '85', '새 게임은 안정 상태인 정신력 85%로 시작한다');
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
    // 그림을 2배로 놓는다(출구 문 칸을 넣은 3층 고객센터 그림은 2168×475).
    const holder = document.createElement('div'); const art = document.createElement('img'); holder.append(art); document.body.append(holder);
    Object.assign(art.style, { left: '100px', top: '10px', width: '4336px', height: '950px' }); addBackgroundMonitors(art, 'assets/background/floor03/floor03-cs-interior.png');
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
  await page.clock.runFor(45100); // 45초 대기 후 첫 기척
  const charge1 = await page.evaluate(() => ({ phase: zeroEventPhase, side: zeroEventSide, mode: hallucinationMode }));
  assert.equal(charge1.phase, 'charging');
  assert.equal(charge1.mode, 'charge');
  assert([-1, 1].includes(charge1.side), '화면 안에서 접근 가능한 쪽에 나타난다');
  assert.equal(await page.evaluate(() => phoneLightOn), false, '꺼져 있던 플래시를 자동으로 켜지 않는다');
  assert(await page.locator('#flash-prompt').isVisible(), '돌진 동안 플래시 안내가 뜬다');
  await page.evaluate(side => { facing = side; phoneLightOn = true; }, charge1.side);
  await page.clock.runFor(400); // 방향을 확인하고 빛을 유지하면 회피
  assert.equal(await page.evaluate(() => zeroEventEvasions), 1);
  assert(await page.locator('#flash-prompt').isHidden(), '환각이 사라지면 안내도 사라진다');
  assert.equal((await state()).mode, null);
  assert.equal((await state()).hallucinationCaught, false);

  await page.evaluate(() => { facing = 1; phoneLightOn = false; });
  await page.clock.runFor(60100); // 회피 이후에는 60초 뒤 재시도
  const charge2 = await page.evaluate(() => ({ phase: zeroEventPhase, side: zeroEventSide }));
  assert.equal(charge2.phase, 'charging');
  await page.evaluate(side => { facing = side; phoneLightOn = true; }, charge2.side);
  await page.clock.runFor(400);
  assert.equal(await page.evaluate(() => zeroEventEvasions), 2);
  // ---- 회피하지 못하면 환각에게 잡아먹혀 게임 오버, 다시 정신을 차리고 이어간다 ----
  await page.evaluate(() => {
    sanity = 0; facing = 1; phoneLightOn = false; zeroEventEvasions = 0; zeroEventPhase = 'idle'; zeroEventTimer = 0;
  });
  await page.clock.runFor(45100);
  await page.clock.runFor(5500); // 예고와 접근 시간이 지난 뒤에만 잡힌다
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
  console.log('PASS: sanity HUD/clamps, dark-only drain, chase drain with boss exemption, ' +
    'fear tiers and speed penalty, 0% warning/approach/evade/retry chain, game over and recovery.');
} finally { await browser.close(); }
