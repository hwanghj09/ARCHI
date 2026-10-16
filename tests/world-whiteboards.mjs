import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

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
  const boards = await page.evaluate(() => {
    triggerBuildingBlackout(); setAllFloorsPower(true); setDebugSanity(100);
    return [...floorById.values()].flatMap(config => (config.props || []).flatMap((prop, index) =>
      (prop.surface || WRITING_SURFACE_BY_FILE[prop.file]) === 'whiteboard' ?
        [{ id: config.id, index, name: prop.name }] : []));
  });
  assert.equal(boards.length, 12, 'All registered whiteboard props are covered');
  for (const board of boards) {
    await page.evaluate(({ id, index }) => {
      const config = floorById.get(id);
      performFloorChange(id, config.interior ? null : 0, config.interior ? 'exit' : null);
      const prop = config.props[index];
      Body.setPosition(body, { x: prop.x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
    }, board);
    await page.evaluate(() => document.fonts.ready);
    const prop = page.locator('#dynamic-scene .floor-prop').nth(board.index);
    const writing = prop.locator('.world-whiteboard-writing');
    assert(await writing.isVisible(), `${board.id} ${board.name}: writing is visible before inspection`);
    assert.equal(await writing.getAttribute('aria-hidden'), 'true', 'The prop keeps its existing accessible description');
    assert(await writing.evaluate(element => {
      const board = element.parentElement.getBoundingClientRect(), text = element.getBoundingClientRect();
      return text.width > 100 && text.height > 30 && text.left >= board.left && text.right <= board.right &&
        text.top >= board.top && text.bottom < board.bottom;
    }), `${board.name}: writing stays inside the frame and above the wheels`);
    const preview = await writing.textContent();
    assert(preview.trim().length > 10, 'The preview contains real writing');
    await page.keyboard.press('e');
    assert(await page.locator('#inspection').isVisible(), `${board.name}: keyboard inspection still opens`);
    assert.equal(await page.locator('#inspection-sheet .writing-board').textContent(), preview,
      `${board.name}: world writing matches the inspection content`);
    await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: 12 world whiteboards, fitted writing, inspection parity and keyboard interaction');
} finally {
  await browser.close();
}
