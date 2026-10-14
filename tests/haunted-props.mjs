import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

for (const name of ['office-desk', 'filing-cabinet', 'large-planter']) {
  const sprite = await readFile(new URL(`../assets/objects/fear/${name}.png`, import.meta.url));
  assert.equal(sprite[25], 6, `${name} has an RGBA canvas`);
  assert(sprite.readUInt32BE(16) > 0 && sprite.readUInt32BE(20) > 0);
}
const workstation = await readFile(new URL('../assets/objects/floor17/workstation.png', import.meta.url));
const workstationFear = await readFile(new URL('../assets/objects/floor17/workstation-fear.png', import.meta.url));
assert.equal(workstation[25], 6);
assert.equal(workstationFear[25], 6);
assert.deepEqual(workstation.subarray(16, 24), workstationFear.subarray(16, 24), 'Desk variants share one canvas');
const emptyBackground = await readFile(new URL('../assets/background/floor17/workstation-empty.png', import.meta.url));
assert.equal(emptyBackground[25], 2, 'The empty background is opaque RGB');
assert(!emptyBackground.includes(Buffer.from('tRNS')), 'The replacement background has no transparent color');
await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  const setSanity = percent => page.evaluate(percent => { sanity = percent; updateSanity(0); render(); }, percent);
  const desk = page.locator('#office-workstation');
  const deskImage = desk.locator('img');
  const backdrop = page.locator('.office-desk-backdrop');
  await backdrop.evaluate(image => image.decode());
  await deskImage.evaluate(image => image.decode());
  const deskBox = await desk.boundingBox();
  assert.deepEqual(await backdrop.boundingBox(), deskBox, 'Opaque empty background erases the entire original workstation');
  assert.equal(await deskImage.count(), 1, 'Only one desk sprite is mounted');
  assert.equal(await page.locator('.office-haunted-prop').count(), 0, 'The old overlapping overlay is removed');
  for (const percent of [100, 30, 29, 20, 9, 100]) {
    await setSanity(percent);
    await deskImage.evaluate(image => image.decode());
    assert.equal(await deskImage.getAttribute('src'), `assets/objects/floor17/workstation${percent < 30 ? '-fear' : ''}.png`);
    assert.deepEqual(await desk.boundingBox(), deskBox, 'Sprite replacement preserves the desk position and size');
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '.local/haunted-office17-normal.png' });
  await desk.evaluate(element => { element.style.visibility = 'hidden'; });
  await page.screenshot({ path: '.local/haunted-office17-empty.png' });
  await desk.evaluate(element => { element.style.visibility = ''; });
  await setSanity(29);
  await deskImage.evaluate(image => image.decode());
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '.local/haunted-office17.png' });

  await page.evaluate(() => {
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [12];
    performFloorChange('f12-dev', 0, 'exit');
    Body.setPosition(body, { x: 1240, y: floorY - 81 });
    cameraX = 80; render();
  });
  assert(await desk.isHidden() && await backdrop.isHidden(), 'The fixed workstation stays out of other scenes');
  const variants = page.locator('.floor-prop[data-haunted] > .haunted-prop');
  await variants.evaluateAll(images => Promise.all(images.map(image => image.decode())));
  const names = await variants.evaluateAll(images => [...new Set(images.map(image => image.getAttribute('src').split('/').at(-1)))]);
  assert.deepEqual(names.sort(), ['filing-cabinet.png', 'large-planter.png', 'office-desk.png']);
  const geometry = () => page.locator('.floor-prop[data-haunted]').evaluateAll(props => props.map(prop =>
    [prop.style.left, prop.style.top, prop.style.width, prop.style.height, prop.firstElementChild.getAttribute('src')]));
  const original = await geometry();
  for (const [percent, opacity] of [[50, 0], [30, 0], [29, .35], [20, .35], [19, .75], [10, .75], [9, 1], [100, 0]]) {
    await setSanity(percent);
    const alphas = await variants.evaluateAll(images => images.map(image => Number(getComputedStyle(image).opacity)));
    assert(alphas.every(alpha => Math.abs(alpha - opacity) < .001), `${percent}% applies the correct haunting strength`);
    const bases = await page.locator('.floor-prop[data-haunted] > img:first-child').evaluateAll(images => images.map(image => Number(getComputedStyle(image).opacity)));
    assert(bases.every(alpha => Math.abs(alpha - (1 - opacity)) < .001), 'The original art fades back on recovery');
    assert.deepEqual(await geometry(), original, 'Haunting leaves positions, sizes and original sprites unchanged');
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '.local/haunted-props-normal.png' });
  await setSanity(9);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '.local/haunted-props-critical.png' });
  await page.evaluate(() => performFloorChange('f16-cafe', 0, 'exit'));
  const badgeTable = page.locator('.floor-prop[data-state-by="f16-badge"]');
  assert.equal(await badgeTable.locator('.haunted-prop').count(), 0, 'Item-state sprite sheets retain their own art');
  assert.deepEqual(errors, []);
  console.log('PASS: three generated sprites, erased background desk, single registered workstation sprite, sanity thresholds/recovery, stable geometry and item-state art.');
} finally { await browser.close(); }
