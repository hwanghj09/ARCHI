import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 전력이 필요한 장치(power.js needsFloorPower)는 그 층에 태양광 전력이 들어오지 않으면 반응하지 않는다: 힌트·테두리가 없고
// E를 눌러도 조사창·조작 창이 뜨지 않는다. 배터리·별도 회선 장치(selfPowered)와 지하(B1·B2)는 그대로 쓴다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.evaluate(() => { triggerBuildingBlackout(); collectedItems.add('f17-emergency-linked'); setSolarPower(true); });

  // 장면 scene에서 name(문은 target) 앞에 서서 E를 누른다. powered: 태양광을 이 층에 보낼지.
  const tryDevice = (scene, match, powered, arrivalKey = null, press = true) => page.evaluate(([scene, match, powered, arrivalKey, press]) => {
    if (usingControl) closeControl();
    if (usingInspection) closeInspection();
    performFloorChange(scene, null, arrivalKey);
    solarPoweredFloors = powered ? [currentSceneFloor] : [];
    updatePowerState();
    const door = currentDoors.find(entry => entry.name === match || entry.target === match);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; cameraX = cameraTarget(); render();
    updateInteraction();
    const near = nearbyDoor === door;
    const hintText = hint.hidden ? null : hint.textContent;
    if (press) interact();
    const result = { near, hint: hintText, opened: usingInspection || usingControl || usingKeypad };
    if (usingControl) closeControl();
    if (usingKeypad) closeKeypad();
    if (usingInspection) closeInspection();
    return result;
  }, [scene, match, powered, arrivalKey, press]);
  const silent = { near: false, hint: null, opened: false };

  // 12층 모델 평가실 카드 리더기: 전력이 없으면 잠겼다는 문구조차 없다. 전력을 보내면 카드키 조작 창이 열린다.
  await page.evaluate(() => collectedItems.add('f12-eval-keycard'));
  assert.deepEqual(await tryDevice(await page.evaluate(() => floorId(12)), 'f12-eval', false), silent, '12F card reader is dead without power');
  const lit12 = await tryDevice(await page.evaluate(() => floorId(12)), 'f12-eval', true);
  assert.equal(lit12.near, true);
  assert.match(lit12.hint, /카드키 태그/);
  assert.equal(lit12.opened, true, 'Powered 12F card reader opens the card control');
  await page.evaluate(() => collectedItems.delete('f12-eval-keycard'));
  const lockedNoCard = await tryDevice(await page.evaluate(() => floorId(12)), 'f12-eval', true);
  assert.equal(lockedNoCard.opened, true, 'Powered: the locked message still shows without the card');
  assert.deepEqual(await tryDevice(await page.evaluate(() => floorId(12)), 'f12-eval', false), silent, 'Unpowered: no locked message either');

  // 출입 게이트, 야간 로그 단말기, 17층 관리실 도어락, 16층 키오스크도 같다.
  assert.deepEqual(await tryDevice(await page.evaluate(() => floorId(13)), '13층 서쪽 인증 게이트', false), silent, 'Access gate is dead');
  assert.equal((await tryDevice(await page.evaluate(() => floorId(13)), '13층 서쪽 인증 게이트', true)).near, true, 'Powered access gate responds');
  assert.deepEqual(await tryDevice('f12-eval', '야간 로그 단말기', false, 'exit'), silent, 'Night log terminal is dead');
  // 옆 게시판은 그대로 조사할 수 있다. 꺼진 키오스크만 건너뛴다.
  const deadKiosk = await tryDevice('f16-cafe', '음성 주문 키오스크', false, 'exit');
  assert.equal(deadKiosk.near, false, 'Kiosk is dead');
  assert.doesNotMatch(deadKiosk.hint ?? '', /키오스크/);
  assert.equal(await page.evaluate(() => dynamicScene.querySelector('[data-powered-sprite]')?.dataset.spriteFrame), '0', 'Kiosk screen is off');
  assert.equal((await tryDevice('f16-cafe', '음성 주문 키오스크', true, 'exit')).opened, true, 'Powered kiosk responds');

  // 이미 열린 문, 소품 조사, 배터리·별도 회선 장치는 전력이 없어도 된다.
  assert.equal((await tryDevice(await page.evaluate(() => floorId(12)), 'f12-dev', false, null, false)).near, true, 'Unlocked doors still work');
  // 1층 로봇 정비 패널은 로봇이 멈춰 있을 때(UPS 연결 전) 보조 배터리로 켜진다.
  await page.evaluate(() => collectedItems.delete('f17-emergency-linked'));
  assert.equal((await tryDevice(await page.evaluate(() => floorId(1)), '경비 로봇', false)).opened, true, '1F robot panel runs on its backup battery');
  await page.evaluate(() => collectedItems.add('f17-emergency-linked'));
  assert.equal((await tryDevice('f7-verify', '인터록 제어반', false, 'exit')).near, true, '7F interlock runs on the B2 line');
  assert.equal((await tryDevice('f7-verify', '망분리 백업 장비', false, 'exit')).near, true, '7F backup device runs on battery');
  assert.equal((await tryDevice('f3-fitness', '비상 개방 버튼', false, 'exit')).near, true, '3F emergency button runs on battery');
  assert.equal((await tryDevice('b2-main', 'ARCHI 메인 콘솔', false, 'exit')).opened, true, 'Basement devices always have power');

  assert.deepEqual(errors, []);
  console.log('PASS: unpowered card readers, gates, terminals and kiosk stay silent; open doors, battery devices and basements still work.');
} finally {
  await browser.close();
}
