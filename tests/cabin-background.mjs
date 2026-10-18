import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-16T00:01:00Z'));
  const hallImage = () => page.locator('#cabin-doorway').evaluate(async element => {
    const url = getComputedStyle(element).backgroundImage.match(/url\("(.+)"\)/)?.[1];
    if (!url) throw new Error('The cabin doorway has no corridor image');
    const image = new Image();
    image.src = url;
    await image.decode();
    return url;
  });
  const corridorImage = () => page.evaluate(() => currentSceneFloor === 17 ? corridorBackground.src :
    document.querySelector('#dynamic-scene > .floor-background').src);
  const floors = await page.evaluate(() => ALL_FLOORS.map(({ id, floor }) => ({ id, floor })));
  for (const { id, floor } of floors) {
    for (const powered of [true, false]) {
      await page.evaluate(({ id, floor, powered }) => {
        cabinCarIndex = null; cabin.hidden = true; selectingFloor = false; stage.inert = false;
        buildingBlackout = true; collectedItems.add("f17-emergency-linked"); solarEnabled = true; solarPoweredFloors = powered ? [floor] : [];
        world.dataset.lights = 'on';
        performFloorChange(id, 0); updatePowerState(); setDebugSanity(100);
        elevatorCars[0].floor = floor;
      }, { id, floor, powered });
      const expected = await corridorImage();
      await page.evaluate(() => showCabin(0));
      assert.equal(await hallImage(), expected, `${floor}: cabin matches the ${powered ? 'powered' : 'unpowered'} corridor`);
      if (powered && [1, 16, 17].includes(floor)) await page.screenshot({ path: `.local/cabin-background-${floor}.png` });
    }
  }
  // The origin stays on 17F during a ride; the doorway must use the destination's power circuit.
  await page.evaluate(() => {
    buildingBlackout = true; collectedItems.add("f17-emergency-linked"); solarEnabled = true; solarPoweredFloors = [17];
    world.dataset.lights = 'on'; elevatorCars[0].floor = 17; showCabin(0);
    // 처음 목표('퇴근하기')에서는 1층 버튼만 눌린다(cabin.js). 바꾼 진행 상태로 목표를 다시 고른다.
    refreshObjective();
  });
  await page.locator('#cabin-floor-buttons [data-floor="16"]').click();
  await page.clock.runFor(3600);
  assert.equal(await page.locator('#elevator-cabin').getAttribute('data-floor'), '16');
  assert.equal(await page.locator('#cabin-scene').getAttribute('data-hall-blackout'), 'true');
  const darkArrival = await hallImage();
  assert.match(darkArrival, /floor16-corridor-off\.png$/);
  await page.evaluate(() => { solarPoweredFloors = [16]; updatePowerState(); });
  assert.match(await hallImage(), /floor16-corridor\.png$/);
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await hallImage(), await corridorImage(), 'The restored destination matches the corridor after exiting');
  await page.evaluate(() => {
    world.dataset.lights = 'off'; solarPoweredFloors = [17]; elevatorCars[0].floor = 17; showCabin(0);
  });
  assert.match(await hallImage(), /floor17-finished-off\.png$/, 'The 17F room light switch still applies');
  assert.deepEqual(errors, []);
  console.log('PASS: all 19 cabin corridor images, power states, destination arrival and 17F lights');
} finally {
  await browser.close();
}
