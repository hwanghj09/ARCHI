import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(() => { triggerBuildingBlackout(); collectedItems.add('story-blackout-seen'); });

  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => { collectedItems.delete('rooftop-key'); openHydrant(); });
    const key = page.getByRole('button', { name: '낡은 열쇠 줍기', exact: true });
    assert(await key.evaluate(element => document.activeElement === element));
    assert.match(await key.innerText(), /줍기.*Enter/);
    const label = await key.locator('.item-name').boundingBox();
    assert(label.x >= 0 && label.x + label.width <= viewport.width && label.y + label.height <= viewport.height);
    await page.screenshot({ path: `.local/priority-key-${viewport.width}.png` });
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => collectedItems.has('rooftop-key')), 'The focused key can be collected with Enter');
    await page.keyboard.press('Escape');
  }

  await page.evaluate(() => {
    sanity = 10; collectedItems.add('f16-antianxiety'); useInventoryItem('f16-antianxiety');
  });
  assert.match(await page.locator('#sanity-calm').innerText(), /진정 효과.*60초/);
  assert.match(await page.evaluate(() => INVENTORY_ITEMS['f16-antianxiety'].description), /50%p.*60초/);
  await page.clock.runFor(2000);
  await page.evaluate(() => { antianxietyCalm = 1000; updateSanity(1000); });
  assert(await page.locator('#sanity-calm').isHidden());
  assert.match(await page.locator('#suho-line').textContent(), /진정 효과가 끝났다/);

  await page.evaluate(() => {
    collectedItems.add('story-anxiety-seen'); currentSceneFloor = 1;
    collectedItems.delete('goal-f1-directory'); collectedItems.delete('goal-facilities-read');
  });
  assert(await page.evaluate(() => needsF1Directory()));
  // The real facilities app records the same useful knowledge as the lobby directory.
  await page.evaluate(() => {
    usingComputer = true; openComputerApp('building'); usingComputer = false;
  });
  assert.equal(await page.evaluate(() => needsF1Directory()), false, 'Players who read the facilities app need not inspect the same directory again');

  await page.evaluate(() => {
    if (storySceneActive) finishStoryScene();
    collectedItems.add('story-robot-seen');
    currentSceneFloor = 17; collectedItems.delete('story-anxiety-seen');
    collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [];
    performFloorChange('f17'); elevatorCars[0].floor = 17; refreshObjective();
  });
  assert.match(await page.evaluate(() => doorHintText(doors.find(door => door.type === 'elevator'))), /문 열기|탑승/, 'The 17F elevator no longer waits for the power app');

  if (await page.locator('#story-scene').isVisible()) await page.locator('#story-skip').click();
  await page.evaluate(() => {
    performFloorChange('f16-cu', null, 'exit');
    solarEnabled = true; solarPoweredFloors = []; updatePowerState(); openMap();
  });
  assert.equal(await page.locator('#map-view img, #map-view .floor-prop').count(), 0, 'Dark-room art and hidden items never appear on the schematic');
  assert(await page.locator('#map-view .map-label').count() > 0);
  await page.screenshot({ path: '.local/priority-map-mobile.png' });
  await page.evaluate(() => closeMap());

  await page.evaluate(() => {
    if (usingInspection) closeInspection();
    performFloorChange('rooftop', null);
    solarEnabled = false; solarPoweredFloors = [];
    openKeypad({ name: '태양광 발전기', type: 'power', code: '1997' });
  });
  await page.locator('#keypad-input').fill('1997');
  await page.locator('#keypad-input').press('Enter');
  for (const color of ['red', 'yellow', 'blue', 'green']) {
    await page.locator(`#wire-left [data-color="${color}"]`).click();
    await page.locator(`#wire-right [data-color="${color}"]`).click();
  }
  assert.deepEqual(await page.evaluate(() => solarPoweredFloors), []);
  assert.match(await page.locator('#suho-line').textContent(), /장치가 켜졌다.*17층을 고르자/);
  assert.deepEqual(errors, []);
  console.log('PASS: visible Enter pickup, responsive labels, calm countdown/expiry, facilities knowledge, gate hints, dark-room schematic and truthful solar activation feedback.');
} finally { await browser.close(); }
