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
  assert.equal(await page.locator('#sanity-meter').getAttribute('aria-valuenow'), '100');
  assert(await page.locator('#sanity-hud').isHidden(), 'Opening hides the gameplay meter');
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);
  const state = () => page.evaluate(() => ({ sanity, exposure: sanityExposure(), fearTier, hallucinating: !hallucinations.hidden,
    mode: hallucinationMode, battery: phoneBattery, caught: playerCaught, hallucinationCaught, x: body.position.x }));
  const near = (actual, expected) => assert(Math.abs(actual - expected) < .08, `${actual} ≈ ${expected}`);
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
  await page.evaluate(() => { sanity = 100; guardPatrol.mode = 'chase'; bossFightActive = true; updateSanity(1000); });
  assert.equal((await state()).sanity, 100, '보스전 중에는 추격 감소가 없다');
  await page.evaluate(() => { guardPatrol.mode = 'patrol'; bossFightActive = false; });

  // ---- 17층 사무실 시작 지점 근처 항불안제 ----
  await page.evaluate(() => { sanity = 40; Body.setPosition(body, { x: 1760, y: floorY - 81 }); grounded = true; updateInteraction(); });
  assert.equal(await page.evaluate(() => nearbyDoor?.gives), 'sanity-pill-start');
  await page.evaluate(() => interact());
  assert.equal((await state()).sanity, 58, '항불안제를 복용하면 정신력이 회복된다');
  assert(await page.evaluate(() => collectedItems.has('sanity-pill-start')));
  await page.keyboard.press('Escape'); // interact()가 연 조사창을 닫아야 이어지는 테스트에서 정신력 진행이 멈추지 않는다

  // ---- 0%가 되기 전의 1회성 예고 환각 ----
  await page.evaluate(() => { sanity = 2; zeroEventApproachDone = false; hallucinationMode = null; updateSanity(16); });
  assert.equal((await state()).mode, 'approach');
  assert.equal(await page.evaluate(() => zeroEventApproachDone), true);
  await page.evaluate(() => { hallucinationMode = null; updateSanity(16); });
  assert.equal((await state()).mode, null, '예고는 한 번만 나타난다');

  // ---- 0% 돌진: 회피 두 번 → 항불안제 생성 → 복용, 또는 회피 실패 → 잡아먹힘 ----
  await page.evaluate(() => {
    sanity = 0; facing = 1; phoneLightOn = false; zeroEventEvasions = 0; zeroEventPhase = 'idle'; zeroEventTimer = 0;
    bonusPillActive = false; anxietyPill.hidden = true;
  });
  await page.clock.runFor(15100); // 15초 대기 후 첫 돌진
  const charge1 = await page.evaluate(() => ({ phase: zeroEventPhase, side: zeroEventSide, mode: hallucinationMode }));
  assert.equal(charge1.phase, 'charging');
  assert.equal(charge1.mode, 'charge');
  assert.equal(charge1.side, -1, '플레이어가 바라보던 오른쪽의 반대쪽(왼쪽)에서 나타난다');
  assert.equal(await page.evaluate(() => phoneLightOn), false, '돌진이 시작되면 켜져 있던 플래시가 꺼진다');
  await page.evaluate(side => { facing = side; phoneLightOn = true; }, charge1.side);
  await page.clock.runFor(100); // 바라보며 플래시를 비추면 회피
  assert.equal(await page.evaluate(() => zeroEventEvasions), 1);
  assert.equal((await state()).mode, null);
  assert.equal((await state()).hallucinationCaught, false);

  await page.evaluate(() => { facing = 1; phoneLightOn = false; });
  await page.clock.runFor(5100); // 회피 이후에는 5초 뒤 재시도
  const charge2 = await page.evaluate(() => ({ phase: zeroEventPhase, side: zeroEventSide }));
  assert.equal(charge2.phase, 'charging');
  await page.evaluate(side => { facing = side; phoneLightOn = true; }, charge2.side);
  await page.clock.runFor(100);
  assert.equal(await page.evaluate(() => zeroEventEvasions), 2);
  assert.equal(await page.evaluate(() => bonusPillActive), true, '두 번째 회피 이후 항불안제가 나타난다');
  assert.equal(await page.locator('#anxiety-pill').isHidden(), false);

  const pillX = await page.evaluate(() => bonusPillX);
  await page.evaluate(x => { Body.setPosition(body, { x, y: floorY - 81 }); grounded = true; }, pillX);
  const beforePill = (await state()).sanity;
  await page.evaluate(() => interact());
  assert(( await state()).sanity > beforePill, '반짝이는 항불안제를 복용하면 정신력이 돌아온다');
  assert.equal(await page.evaluate(() => bonusPillActive), false);

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
    'fear tiers and speed penalty, start/bonus anxiety pills, pre-zero warning sighting, 0% charge/evade/retry chain, devoured game over and recovery.');
} finally { await browser.close(); }
