import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const errors = [];
try {
  const newGame = async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-24T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    await page.locator('#opening-skip').click();
    await page.clock.pauseAt(new Date('2026-10-24T00:01:00Z'));
    return page;
  };
  const use = (page, name) => page.evaluate(name => {
    const door = (room === 'office' ? officeDoors : currentDoors).find(door => door.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    interact();
  }, name);
  const pressFloor = (page, floor) => page.locator(`#cabin-floor-buttons [data-floor="${floor}"]`).click();

  // 충전기에 둔 휴대폰은 저장을 불러와도 회수할 수 있고, 다른 층의 진행 제한은 유지한다.
  const phone = await newGame();
  await phone.evaluate(() => {
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [17];
    collectedItems.add('f17-emergency-linked'); updatePowerState();
    phoneBattery = 50; chargePhone(officeCharger);
    performFloorChange('f1'); refreshObjective();
    saveProgress(); restoreProgress(readProgress()); refreshObjective();
    elevatorCars[0].floor = 1; showCabin(0);
  });
  assert.match(await phone.evaluate(() => currentObjective.text), /충전기에 두고 왔다/);
  await pressFloor(phone, 16);
  assert.equal(await phone.evaluate(() => selectedFloor), null, 'Unrelated floors remain restricted');
  await pressFloor(phone, 17);
  assert.equal(await phone.evaluate(() => selectedFloor), 17, 'The docked phone floor is reachable');
  await phone.clock.runFor(4000);
  await phone.locator('#cabin-exit').click();
  await phone.clock.runFor(800);
  assert.equal(await phone.evaluate(() => currentSceneFloor), 17);
  await phone.evaluate(() => performRoomChange());
  await use(phone, '휴대폰 충전 콘센트');
  assert.equal(await phone.evaluate(() => phoneDock), null, 'The original outlet gives the phone back');
  await phone.evaluate(() => { elevatorCars[0].floor = 17; showCabin(0); });
  await pressFloor(phone, 16);
  assert.equal(await phone.evaluate(() => selectedFloor), null, 'Retrieval does not unlock other story floors');
  await pressFloor(phone, 1);
  await phone.clock.runFor(4000);
  await phone.locator('#cabin-exit').click();
  await phone.clock.runFor(800);
  assert.deepEqual(await phone.evaluate(() => [currentSceneFloor, phoneDock]), [1, null]);
  await phone.close();
  console.log('PASS phone recovery: save/load, return to 17F, pickup and return to 1F');

  // 추격 전 정비 성공은 불이 들어온 뒤 대체 장면으로 이어진다. 끝까지 보기와 건너뛰기를 모두 확인한다.
  for (const skip of [false, true]) {
    const page = await newGame();
    await page.evaluate(() => {
      buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [];
      for (const flag of ['f17-emergency-linked', 'solar-app-installed', 'f1-door-checked', 'story-f1-door-seen']) collectedItems.add(flag);
      performFloorChange('f1'); updatePowerState();
    });
    await use(page, '경비 로봇');
    await page.locator('#keypad-input').fill('0914');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    assert(await page.evaluate(() => collectedItems.has('f1-robot-log')));
    assert.equal(await page.evaluate(() => storyScenePending()), false, 'The dark lobby still waits for lighting');
    await page.evaluate(() => {
      saveProgress(); restoreProgress(readProgress());
      solarPoweredFloors = [1]; updatePowerState();
    });
    await page.clock.runFor(1200);
    assert.equal(await page.evaluate(() => storyFlag), 'f1-chase-ended');
    if (skip) await page.locator('#story-skip').click();
    else {
      await page.locator('#story-scene').click();
      assert.match(await page.locator('#story-caption').textContent(), /로봇은 정비 코드로 멈췄지만/);
      await page.locator('#story-scene').click();
    }
    assert(await page.evaluate(() => collectedItems.has('f1-chase-ended')));
    await page.clock.runFor(3200);
    assert.equal(await page.evaluate(() => storyFlag), 'story-anxiety-seen');
    assert.match(await page.locator('#story-caption').textContent(), /나만 나갈 수 없게/);
    await page.locator('#story-skip').click();
    assert.deepEqual(await page.evaluate(() => [collectedItems.has('story-anxiety-seen'), playerCaught, guardPatrolPowered(guardPatrol)]), [true, false, false]);
    await use(page, '층별 안내판');
    await page.keyboard.press('Escape');
    await page.evaluate(() => { elevatorCars[0].floor = 1; showCabin(0); });
    await pressFloor(page, 16);
    assert.equal(await page.evaluate(() => selectedFloor), 16, 'The next mission floor is unlocked');
    await page.clock.runFor(4000);
    await page.locator('#cabin-exit').click();
    await page.clock.runFor(800);
    await page.evaluate(() => { collectedItems.add('f16-antianxiety'); useInventoryItem('f16-antianxiety'); });
    await page.clock.runFor(6500);
    assert.equal(await page.evaluate(() => storyFlag), 'story-robot-seen');
    assert(await page.evaluate(() => storySteps.every(step => !/공격했던|쫓아오고/.test(step.say || ''))), 'Follow-up dialogue does not invent a chase');
    await page.locator('#story-skip').click();
    assert.equal(await page.evaluate(() => currentObjective.title), '나갈 방법 찾기');
    await page.evaluate(() => { saveProgress(); restoreProgress(readProgress()); });
    await page.clock.runFor(1500);
    assert.equal(await page.evaluate(() => storySceneActive), false, 'Completed scenes do not replay after load');
    await page.close();
    console.log(`PASS early robot maintenance: ${skip ? 'skip' : 'finish'}, medication and save/load`);
  }

  // 안내된 1층 PC는 조명·13층 UPS 없이도 실제로 USB를 연결하고 영상을 재생한다.
  const usb = await newGame();
  await usb.evaluate(() => {
    for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
    for (const flag of ['f17-emergency-linked', 'f7-external-connection-solved', 'f13-backup-device']) collectedItems.add(flag);
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [];
    performFloorChange('f1'); updatePowerState(); refreshObjective();
  });
  await use(usb, '안내 데스크');
  await usb.clock.runFor(900);
  assert(await usb.evaluate(() => usbDriveAvailable() && !floorHasLighting(1) && !collectedItems.has('f13-ups')));
  await usb.locator('[data-computer-app="usbdrive"]').dblclick();
  await usb.locator('#usb-drive-plug').click();
  await usb.clock.runFor(4000);
  await usb.evaluate(() => closeComputerWindow(computerWindows.get('usbdrive')));
  await usb.clock.runFor(6000);
  assert.equal(await usb.evaluate(() => collectedItems.has('f17-usb-played')), false, 'Closing early at the lobby PC does not count');
  await usb.locator('[data-computer-app="usbdrive"]').dblclick();
  await usb.locator('#usb-drive-plug').click();
  await usb.clock.runFor(9500);
  assert(await usb.evaluate(() => collectedItems.has('f17-usb-played')));
  await usb.evaluate(() => { saveProgress(); restoreProgress(readProgress()); refreshObjective(); });
  assert.equal(await usb.evaluate(() => currentObjective.title), '2층 조사하기');
  await usb.close();
  assert.deepEqual(errors, []);
  console.log('PASS lobby USB: powered-off floor, interrupted/full playback and save/load');
} finally {
  await browser.close();
}
