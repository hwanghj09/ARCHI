import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const checkpoint = await page.evaluate(() => {
    collectedItems.add('b2-transfer-cut');
    performFloorChange('b2-main', null, 'exit');
    Body.setPosition(body, { x: 1400, y: floorY - 81 });
    const data = progressSnapshot();
    showB2BadEnding();
    return data;
  });
  await page.locator('#b2-capture-skip').click();
  const state = () => page.evaluate(() => ({
    scene: dynamicFloorId, phase: b2Ending.phase, opening: openingActive,
    badEnding: !b2BadEnding.hidden, items: [...collectedItems],
  }));
  const before = await state();
  for (const data of [
    '{broken', JSON.stringify({ ...checkpoint, items: null }),
    JSON.stringify({ ...checkpoint, scene: { ...checkpoint.scene, id: 'missing-room' } }),
    JSON.stringify({ ...checkpoint, version: 99 }),
  ]) {
    await page.evaluate(data => localStorage.setItem(b2CheckpointKey, data), data);
    await page.locator('#b2-checkpoint').click();
    assert.deepEqual(await state(), before, 'An invalid checkpoint preserves the ending and current game');
    assert.deepEqual(errors, [], 'Invalid checkpoint data must not enter restoreProgress');
  }
  await page.evaluate(data => localStorage.setItem(b2CheckpointKey, JSON.stringify(data)), checkpoint);
  await page.locator('#b2-checkpoint').click();
  const restored = await state();
  assert.equal(restored.phase, 'idle');
  assert.equal(restored.scene, 'b2-main');
  assert.equal(restored.opening, false);
  assert.equal(restored.badEnding, false);
  assert(restored.items.includes('b2-transfer-cut'));
  assert.deepEqual(errors, []);
  console.log('PASS: malformed checkpoint rejection and valid B2 checkpoint recovery.');
} finally { await browser.close(); }
