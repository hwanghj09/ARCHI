import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';
import { autoControl } from './auto-control.mjs';

await mkdir('.local', { recursive: true });
for (const [name, size] of [['lounge-sofa', [512, 152]], ['lounge-table', [512, 128]], ['projector-remote', [160, 40]]]) {
  const image = sharp(`assets/objects/floor02/${name}.png`);
  const metadata = await image.metadata();
  assert.deepEqual([metadata.width, metadata.height], size);
  assert(metadata.hasAlpha, `${name}: alpha channel`);
  const alpha = (await image.stats()).channels[3];
  assert.equal(alpha.min, 0, `${name}: transparent margin`);
  assert.equal(alpha.max, 255, `${name}: visible artwork`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await autoControl(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-16T00:01:00Z'));
  await page.evaluate(() => {
    triggerBuildingBlackout(); collectedItems.add('f17-emergency-linked'); solarEnabled = true; solarPoweredFloors = [2];
    updatePowerState();
  });
  const visit = id => page.evaluate(id => {
    closeInspection(); releaseInput();
    performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null); interactionTime = 0;
  }, id);
  const place = x => page.evaluate(x => {
    closeInspection(); interactionTime = 0;
    Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; updateInteraction(); cameraX = cameraTarget(); render();
  }, x);
  const remote = () => page.locator('#dynamic-scene .floor-prop[data-hidden-by="f2-remote"]');
  const furniture = () => page.locator('#dynamic-scene .floor-prop:not([data-hidden-by])');
  await visit('f2-lounge');
  assert.equal(await furniture().count(), 4, 'Two sofas and two tables are separate props');
  assert(await remote().isVisible(), 'Remote is visible before collection');
  await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await page.locator('.floor-background[src$="floor02-lounge-wall.png"]').count(), 1);
  await place(412);
  assert.equal(await page.evaluate(() => nearbyDoor?.name), '커피 테이블');
  await place(300);
  await page.screenshot({ path: '.local/floor02-lounge-before.png' });
  await place(412);
  await page.keyboard.press('e');
  assert(await page.evaluate(() => collectedItems.has('f2-remote')));
  assert(await remote().isHidden(), 'Only the remote disappears immediately');
  assert.equal(await furniture().filter({ visible: true }).count(), 4);
  await place(412);
  await page.keyboard.press('e');
  assert.match(await page.locator('#inspection').textContent(), /이미 챙겼다/);
  await place(535);
  assert.equal(await page.evaluate(() => nearbyDoor?.name), '소파 위 담요');
  await page.keyboard.press('e');
  assert.match(await page.locator('#inspection').textContent(), /다 녹음됨/);
  await place(300);
  await page.screenshot({ path: '.local/floor02-lounge-after.png' });
  await visit('f2'); await visit('f2-lounge');
  assert(await remote().isHidden(), 'Remote stays collected after re-entry');
  assert(await page.evaluate(() => saveProgress()));
  await page.reload();
  await page.locator('#menu-continue').click();
  assert.equal(await page.evaluate(() => dynamicFloorId), 'f2-lounge');
  assert(await remote().isHidden(), 'Remote stays collected after loading a save');
  await visit('f2-harmony');
  await page.evaluate(() => { collectedItems.add('f2-reel'); refreshReady(); });
  await place(565); await page.keyboard.press('e');
  assert(await page.evaluate(() => collectedItems.has('f2-projected')), 'The collected remote still powers the projector puzzle');
  await visit('f2-lounge');
  await page.setViewportSize({ width: 390, height: 844 });
  await place(412);
  await page.screenshot({ path: '.local/floor02-lounge-mobile.png' });
  await page.evaluate(() => { collectedItems.delete('f2-remote'); refreshReady(); });
  assert(await remote().isVisible(), 'Uncollected state restores the remote');
  assert.deepEqual(errors, []);
  console.log('PASS: 2F lounge separate furniture, pickup, repeated inspection, re-entry, save/load, projector puzzle and mobile render.');
} finally {
  await browser.close();
}
