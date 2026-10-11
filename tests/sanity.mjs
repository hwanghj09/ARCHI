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
  await page.getByRole('checkbox', { name: '17층 조명' }).uncheck();
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
  assert.equal((await state()).sanity, 100, '보스전 중에는 추격 감소가 없다');
  await page.evaluate(() => { guardPatrol.mode = 'patrol'; bossFightActive = false; });

  // ---- 정신 불안 임무 동안은 어디서든 1초에 2%씩 줄고, 항불안제를 쓰면 멈춘다 ----
  await page.evaluate(() => { collectedItems.add('story-anxiety-seen'); sanity = 50; updateSanity(1000); });
  near((await state()).sanity, 48);
  await page.evaluate(() => { collectedItems.add('f16-antianxiety-used'); sanity = 50; updateSanity(1000); });
  assert.equal((await state()).sanity, 50, '항불안제를 쓰면 임무 감소가 멈춘다');
  await page.evaluate(() => { collectedItems.delete('story-anxiety-seen'); collectedItems.delete('f16-antianxiety-used'); });

  // ---- 정신력 0%: 방향 전환에 0.2초가 걸리고(그동안 제자리), 같은 방향이거나 정신력이 있으면 지연 없음 ----
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
  assert(turn.waited >= 180 && turn.waited <= 220, `turn delay ${turn.waited}ms`);
  assert.equal(turn.normal, -1, '정신력이 있으면 바로 돌아선다');

  // ---- 붉은 눈: 월드 좌표의 일반 배경에 생기고, 눈동자가 수호 쪽으로 움직이며, 깜빡이는 간격이 20%/10% 미만에서 1/3씩 짧아진다 ----
  const eyes = await page.evaluate(() => {
    redEyes.replaceChildren();
    for (let i = 0; i < 4; i++) spawnRedEye();
    render();
    return {
      count: redEyes.children.length,
      inWorld: world.contains(redEyes),
      ys: [...redEyes.children].map(eye => Number(eye.dataset.y)),
      nearDoor: [...redEyes.children].some(eye => currentDoors.some(door => Number(eye.dataset.x) > door.x - 50 && Number(eye.dataset.x) < door.x + door.width + 50)),
      pupil: [...redEyes.children].every(eye => eye.style.getPropertyValue('--px') !== ''),
      ranges: [3, 4, 5].map(tier => blinkIntervalRangeByTier[tier]),
    };
  });
  assert(eyes.count >= 1 && eyes.inWorld, '붉은 눈은 월드 안에 생긴다');
  assert(eyes.ys.every(y => y >= 200 && y <= 330), '너무 낮지도 높지도 않은 높이');
  assert.equal(eyes.nearDoor, false, '상호작용 대상 옆에는 생기지 않는다');
  assert.equal(eyes.pupil, true, '눈동자 위치가 계산된다');
  assert(Math.abs(eyes.ranges[1][1] / eyes.ranges[0][1] - 2 / 3) < .01 && Math.abs(eyes.ranges[2][1] / eyes.ranges[1][1] - 2 / 3) < .01, '깜빡이는 간격이 단계마다 1/3씩 짧아진다');

  // ---- 0%가 되기 전의 1회성 예고 환각 ----
  await page.evaluate(() => { sanity = 2; zeroEventApproachDone = false; hallucinationMode = null; updateSanity(16); });
  assert.equal((await state()).mode, 'approach');
  assert.equal(await page.evaluate(() => zeroEventApproachDone), true);
  await page.evaluate(() => { hallucinationMode = null; updateSanity(16); });
  assert.equal((await state()).mode, null, '예고는 한 번만 나타난다');

  // ---- 0% 돌진: 회피 두 번, 또는 회피 실패 → 잡아먹힘 ----
  await page.evaluate(() => {
    sanity = 0; facing = 1; phoneLightOn = false; zeroEventEvasions = 0; zeroEventPhase = 'idle'; zeroEventTimer = 0;
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
  await page.clock.runFor(5100); // 회피 이후에는 5초 뒤 재시도
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
  await page.locator('#hallucination-retry').click();
  const recovered = await state();
  assert.equal(recovered.caught, false);
  assert(recovered.sanity > 0, '잡아먹힌 뒤에는 정신력을 조금 되찾고 같은 자리에서 다시 시작한다');
  assert.equal(await page.locator('#hallucination-caught').isHidden(), true);

  assert.deepEqual(errors, []);
  console.log('PASS: sanity HUD/clamps, dark-only drain (no bright/flashlight recovery), chase drain with boss exemption, ' +
    'fear tiers and speed penalty, pre-zero warning sighting, 0% charge/evade/retry chain, devoured game over and recovery.');
} finally { await browser.close(); }
