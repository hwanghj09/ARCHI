import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const folder = 'assets/background/room-exit-fixes';
const specs = JSON.parse(await readFile(`${folder}/manifest.json`, 'utf8'));
const greenPixels = pixels => {
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b] = pixels.subarray(i, i + 3);
    if (g > 70 && g > r * 1.25 && g > b * 1.1) count++;
  }
  return count;
};
for (const { id, base, box: [left, top, width, height] } of specs) {
  const patch = await sharp(`${folder}/${id}-fixed.png`).ensureAlpha().raw().toBuffer();
  const before = await sharp(`${folder}/${id}-before.png`).resize(width, height, { kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
  assert(greenPixels(before) > 30, `${id}: original crop reproduces the green sign`);
  assert(greenPixels(patch) < greenPixels(before) * .1, `${id}: sign and green light are removed`);
  for (const suffix of ['.png', '-finished.png']) {
    const applied = await sharp(`assets/background/${base}${suffix}`)
      .extract({ left, top, width, height }).ensureAlpha().raw().toBuffer();
    assert.deepEqual(applied, patch, `${id}${suffix}: source and runtime art contain the correction`);
  }
}

await mkdir('docs/previews/room-exit-fixed', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await page.evaluate(() => {
    setDebugSanity(100);
    for (const flag of ['story-blackout-seen', 'f12-access', 'f12-eval-door-opened', 'f12-lead-key', 'f1-robot-log']) collectedItems.add(flag);
  });
  for (const { id } of specs) {
    for (const powered of [false, true]) {
      const state = await page.evaluate(async ({ id, powered }) => {
        buildingBlackout = true; setAllFloorsPower(powered);
        performFloorChange(id, null, 'exit');
        await Promise.all([...dynamicScene.querySelectorAll('img')].map(image => image.decode()));
        const door = currentDoors.find(door => door.key === 'exit');
        Body.setPosition(body, { x: door.x - 70, y: floorY - 81 });
        Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
        cameraX = Math.max(0, Math.min(worldWidth - viewWidth, door.x + door.width / 2 - viewWidth / 2)); render();
        updateInteraction();
        return { signs: dynamicScene.querySelectorAll('.luminous-sign').length,
          target: door.target, parent: floorById.get(id).parent, hint: door.hint };
      }, { id, powered });
      assert.equal(state.signs, 0, `${id}: no emergency sign returns with power ${powered}`);
      assert.equal(state.target, state.parent, `${id}: exit still leads to the corridor`);
      assert.equal(state.hint, 'E · 복도로 나가기');
      await page.screenshot({ path: `docs/previews/room-exit-fixed/${id}-${powered ? 'on' : 'off'}.png` });
    }
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 720 });
      const parent = await page.evaluate(id => {
        const parent = floorById.get(id).parent;
        performFloorChange(parent, null, `room:${id}`);
        const door = currentDoors.find(door => door.key === `room:${id}`);
        Body.setPosition(body, { x: door.x + 40, y: floorY - 81 });
        Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
        cameraX = cameraTarget(); render(); updateInteraction();
        return parent;
      }, id);
      await page.keyboard.press('e'); await finishSceneTransition(page);
      assert.equal(await page.evaluate(() => dynamicFloorId), id, `${id}: room entry at width ${width}`);
      await page.keyboard.press('e'); await finishSceneTransition(page);
      assert.equal(await page.evaluate(() => dynamicFloorId), parent, `${id}: corridor return at width ${width}`);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  for (const id of ['f1', 'f12']) {
    await page.evaluate(id => performFloorChange(id, 0), id);
    assert(await page.locator('#dynamic-scene .luminous-sign').count() > 0, `${id}: real emergency stair signage is preserved`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: four corrected exits, source/runtime art, no green signs with power on/off, eight desktop/mobile keyboard round trips, emergency stair signage preserved');
} finally {
  await browser.close();
}
