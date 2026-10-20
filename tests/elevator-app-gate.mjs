import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { finishSceneTransition, interactionMessage } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(() => {
    triggerBuildingBlackout();
    solarEnabled = true;
    solarPoweredFloors = [1]; // Lighting the lobby on the roof must not bypass installation.
    collectedItems.add('f17-emergency-linked');
    performFloorChange('f17');
    setDebugSanity(100);
  });
  await page.clock.runFor(100);
  const approach = async (index, open) => {
    await page.evaluate(([index, open]) => {
      const door = doors.find(door => door.type === 'elevator' && door.carIndex === index);
      Object.assign(elevatorCars[index], { floor: 17, travelling: false, open });
      refreshSceneElevatorDoors();
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true;
    }, [index, open]);
    await page.clock.runFor(34);
  };
  for (const downloaded of [false, true]) {
    await page.evaluate(downloaded => {
      if (downloaded) collectedItems.add('solar-app-downloaded');
      refreshObjective();
    }, downloaded);
    for (let index = 0; index < 3; index++) {
      for (const open of [false, true]) {
        await approach(index, open);
        if (index === 2) await page.locator('nav #interact').dispatchEvent('click', { detail: 0 });
        else await page.keyboard.press('e');
        assert(await page.locator('#inspection').isVisible(), 'Every car must explain the missing installation');
        assert.match(await interactionMessage(page), /전력 앱.*휴대폰.*설치/);
        assert.equal(await page.evaluate(() => selectingFloor || transitioning), false, 'Neither an open door nor a downloaded file permits boarding');
      }
    }
  }
  await page.evaluate(() => {
    collectedItems.add('solar-app-installed');
    solarPoweredFloors = [];
    updatePowerState();
    refreshObjective();
  });
  await approach(0, true);
  await page.keyboard.press('e');
  assert.match(await interactionMessage(page), /1층 전력을 먼저 켜자/, 'Installation does not bypass the existing lobby-light gate');
  await page.evaluate(() => { supplySolarFloor(1); refreshObjective(); });
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await page.locator('#elevator-cabin').isVisible(), 'Installed app and lobby power permit boarding');
  await page.locator('#cabin-floor-buttons [data-floor="1"]').click();
  await page.clock.runFor(5000);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 1, 'The permitted ride reaches the lobby');
  // An older save outside 17F must retain a route back to the installation computer.
  await page.evaluate(() => {
    const legacy = progressSnapshot();
    legacy.cabin = null;
    legacy.scene.id = 'f16';
    legacy.items = legacy.items.filter(item => item !== 'solar-app-installed');
    restoreProgress(legacy);
    const door = currentDoors.find(door => door.type === 'elevator' && door.carIndex === 0);
    Object.assign(elevatorCars[0], { floor: 16, travelling: false, open: true });
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    grounded = true;
  });
  await page.clock.runFor(34);
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await page.locator('#elevator-cabin').isVisible(), 'Legacy progress on another floor can board to return to 17F');
  await page.locator('#cabin-floor-buttons [data-floor="17"]').click();
  await page.clock.runFor(3000);
  assert.equal(await page.evaluate(() => elevatorCars[0].floor), 17, 'An uninstalled legacy player can return for installation');
  assert.deepEqual(errors, []);
  console.log('PASS: all three 17F elevators reject missing/download-only apps through keyboard and button handlers, preserve the lobby-light prerequisite, allow a ride after installation, and preserve legacy returns to 17F.');
} finally { await browser.close(); }
