import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const manifest = JSON.parse(await readFile('assets/background/power-off-manifest.json', 'utf8'));
for (const asset of manifest.assets) {
  const [on, off] = await Promise.all([readFile(asset.original), readFile(asset.output)]);
  assert.deepEqual(off.subarray(16, 24), on.subarray(16, 24), `${asset.output}: original canvas dimensions`);
  assert(!on.equals(off), `${asset.output}: separate painted lighting state`);
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  const decode = () => page.locator('img[data-lit-src]').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
  const check = off => page.locator('img[data-lit-src]').evaluateAll((imgs, off) =>
    imgs.every(img => img.getAttribute('src') === (off ? img.dataset.unlitSrc : img.dataset.litSrc)), off);
  await decode();
  assert(await check(false), 'Initial 17F office and corridor are lit');
  await page.evaluate(() => triggerBuildingBlackout());
  await decode();
  assert(await check(true), 'The outage switches both backgrounds off');
  await page.evaluate(() => { phoneLightOn = true; refreshPhone(); });
  assert(await check(true), 'Flashlight does not turn background lamps on');
  await mkdir('.local', { recursive: true });
  await page.screenshot({ path: '.local/background-office-off.png' });
  await page.evaluate(() => { setSolarPower(true); powerGrid.querySelector('[data-floor="17"]').click(); });
  await decode(); assert(await check(false));
  const before = await page.locator('#office-background').boundingBox();
  await page.screenshot({ path: '.local/background-office-on.png' });
  await page.locator('#floor17-lights').uncheck();
  await decode(); assert(await check(true), 'Local light switch overrides supplied power');
  assert.deepEqual(await page.locator('#office-background').boundingBox(), before, 'Lighting preserves geometry');
  await page.locator('#floor17-lights').check();
  await decode(); assert(await check(false));
  await page.evaluate(() => powerLever.click());
  await decode(); assert(await check(true));

  const scenes = await page.evaluate(() => [...floorById.values()]
    .filter(c => c.backgroundImage || (!c.interior && c.id !== 'rooftop')).map(c => c.id));
  for (const id of scenes) {
    await page.evaluate(id => {
      performFloorChange(id, 0, floorById.get(id).interior ? 'exit' : null);
    }, id);
    await decode();
    const floor = await page.evaluate(() => currentSceneFloor);
    assert(await check(floor > 0), `${id}: power state on entry, including shared restrooms`);
    if (floor > 0) {
      const [second, third] = [17, 16, 15].filter(other => other !== floor);
      await page.evaluate(floor => { setSolarPower(true); powerGrid.querySelector(`[data-floor="${floor}"]`).click(); }, floor);
      await decode(); assert(await check(false), `${id}: power restored`);
      await page.evaluate(other => powerGrid.querySelector(`[data-floor="${other}"]`).click(), second);
      await decode(); assert(await check(false), `${id}: a second floor keeps this floor lit`);
      await page.evaluate(other => powerGrid.querySelector(`[data-floor="${other}"]`).click(), third);
      await decode(); assert(await check(true), `${id}: a third floor turns off the earliest one`);
      await page.evaluate(() => powerLever.click());
    } else assert.equal(await page.locator('#world').getAttribute('data-powered'), 'true');
  }
  // Two-floor rule on a painted floor: 12F then 7F stay on together, a third drops the earliest,
  // pressing a lit floor turns off only that floor, and the lever clears every floor.
  const press = number => page.evaluate(number => powerGrid.querySelector(`[data-floor="${number}"]`).click(), number);
  const supply = () => page.evaluate(() => ({ floors: [...solarPoweredFloors], f12: floorHasPower(12), f7: floorHasPower(7) }));
  await page.evaluate(() => { performFloorChange('f7'); setSolarPower(true); });
  assert(await page.locator('img[data-lit-src]').count() > 0, '7F corridor uses switchable painted backgrounds');
  await press(12); await decode(); assert(await check(true), '7F stays dark while only 12F is supplied');
  await press(7); await decode(); assert(await check(false));
  assert.deepEqual(await supply(), { floors: [12, 7], f12: true, f7: true }, 'Powering 12F then 7F keeps both on');
  await press(7); await decode(); assert(await check(true));
  assert.deepEqual(await supply(), { floors: [12], f12: true, f7: false }, 'Pressing a lit floor turns off only that floor');
  await press(7); await press(16); await decode(); assert(await check(false));
  assert.deepEqual(await supply(), { floors: [7, 16], f12: false, f7: true }, 'A third floor turns off the earliest (12F)');
  await press(1); await decode(); assert(await check(true), 'The next floor drops 7F, now the earliest');
  assert.deepEqual((await supply()).floors, [16, 1]);
  await page.evaluate(() => powerLever.click()); await decode(); assert(await check(true));
  assert.deepEqual(await supply(), { floors: [], f12: false, f7: false }, 'Raising the lever clears both floors');
  assert.equal(await page.locator('#world').getAttribute('data-powered'), 'false');
  await page.evaluate(() => {
    performFloorChange('f14-archive', 0, 'exit');
    collectedItems.add('f14-archive-lamp'); refreshReady();
  });
  assert.equal(await page.locator('[aria-label="작업등"]').getAttribute('data-sprite-frame'), '1', 'Battery worklight is independent');
  assert(await page.locator('#darkness').isHidden(), 'The battery worklight illuminates its room during a blackout');
  assert.equal(await page.locator('#world').getAttribute('data-powered'), 'false', 'A battery lamp does not restore floor power');
  await page.evaluate(() => {
    performFloorChange('f16-cafe', 0, 'exit');
    Body.setPosition(body, { x: 1380, y: floorY - 81 });
    cameraX = cameraTarget(); render();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await decode(); assert(await check(true));
  assert(await page.locator('#darkness').isVisible(), 'Battery illumination does not leak into other rooms');
  await page.screenshot({ path: '.local/background-cafe-off-mobile.png' });
  assert.deepEqual(errors, []);
  console.log(`PASS: ${manifest.assets.length} painted backgrounds; ${scenes.length} scenes; power restoration, two-floor supply with earliest-first drop, single-floor off and lever reset, shared restrooms, emergency power, battery lamp, flashlight, geometry and mobile.`);
} finally {
  await browser.close();
}
