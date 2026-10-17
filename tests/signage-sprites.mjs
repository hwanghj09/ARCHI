import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  for (const name of ['bronze-plaque', 'steel-plaque', 'notice-board', 'warning-sign']) {
    const size = await page.evaluate(async name => {
      const image = new Image(); image.src = `assets/objects/signage/${name}.png`; await image.decode();
      return [image.naturalWidth, image.naturalHeight];
    }, name);
    assert.equal(size[0], 512);
    assert(size[1] >= 300 && size[1] <= 350, `${name}: trimmed sprite dimensions`);
  }
  const styles = ['wall-notice', 'power-notice', 'vip-plaque', 'archive-plaque', 'core-plaque',
    'utility-plaque', 'restricted-sign', 'robot-board', 'history-wall'];
  const extensionLabels = await page.locator('#floor17-extension .floor-room-sign').evaluateAll(elements =>
    elements.map(el => getComputedStyle(el).backgroundImage));
  assert.equal(extensionLabels.length, 2);
  for (const image of extensionLabels) assert.match(image, /assets\/objects\/signage\//, '17F extension labels have sprites');
  const scenes = await page.evaluate(styles => [...floorById.values()].filter(config =>
    !config.interior || config.fixtures?.some(fixture => styles.includes(fixture.style))).map(config => config.id), styles);
  let fixtures = 0, labels = 0;
  for (const id of scenes) {
    const result = await page.evaluate(({ id, styles }) => {
      const config = floorById.get(id);
      performFloorChange(id, null, config.interior ? 'exit' : null);
      const boards = (config.fixtures || []).filter(fixture => styles.includes(fixture.style)).map(fixture => {
        const element = [...dynamicScene.querySelectorAll('.fixture')].find(el => el.getAttribute('aria-label') === fixture.name);
        const rect = element.getBoundingClientRect();
        return { name: fixture.name, expected: fixture.lines || [], actual: [...element.querySelectorAll('span')].map(span => span.textContent),
          image: getComputedStyle(element).backgroundImage,
          fits: [...element.querySelectorAll('span')].every(span => {
            const box = span.getBoundingClientRect();
            return box.left >= rect.left - 1 && box.right <= rect.right + 1 && box.top >= rect.top - 1 && box.bottom <= rect.bottom + 1;
          }) };
      });
      return { boards, labels: [...dynamicScene.querySelectorAll('.floor-room-sign, .floor-number-sign')].map(el =>
        ({ text: el.textContent, image: getComputedStyle(el).backgroundImage })) };
    }, { id, styles });
    for (const board of result.boards) {
      assert.match(board.image, /assets\/objects\/signage\//, `${id}: ${board.name} has a sprite`);
      assert.deepEqual(board.actual, board.expected, `${id}: ${board.name} keeps its wording`);
      assert(board.fits, `${id}: ${board.name} keeps its text inside its frame`);
      fixtures++;
    }
    for (const label of result.labels) {
      assert(label.text.trim());
      assert.match(label.image, /assets\/objects\/signage\//, `${id}: ${label.text} has a sprite`);
      labels++;
    }
  }
  assert(fixtures >= 15 && labels >= 70, 'All notice fixtures, room labels and floor plates are covered');
  await mkdir('.local', { recursive: true });
  for (const [id, x] of [['b1', 3100], ['f7', 3100], ['f3', 3100]]) {
    await page.evaluate(({ id, x }) => {
      performFloorChange(id); Body.setPosition(body, { x, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); cameraX = cameraTarget(); render();
    }, { id, x });
    await page.screenshot({ path: `.local/signage-${id}.png` });
  }
  await page.evaluate(() => performFloorChange('f1'));
  assert.equal(await page.locator('.directory-board span').count(), 15, 'The background-painted lobby directory stays intact');
  assert.equal(await page.locator('.directory-board').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
  for (const [name, width, height] of [['portrait', 390, 844], ['landscape', 844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      performFloorChange('b1');
      const notice = currentDoors.find(door => door.name === '비상 전원 안내판');
      Body.setPosition(body, { x: notice.x + notice.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      cameraX = cameraTarget(); render(); updateInteraction();
    });
    await page.keyboard.press('e');
    assert(await page.locator('#inspection-sheet').isVisible(), `${name}: the notice opens for inspection`);
    assert.match(await page.locator('#inspection-sheet').textContent(), /비상 발전기와 UPS/);
    await page.keyboard.press('Escape');
    await page.screenshot({ path: `.local/signage-${name}.png` });
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: four sprites, ${fixtures} notice fixtures, ${labels + extensionLabels.length} room/floor labels, wording, text bounds, mobile inspection and lobby directory.`);
} finally { await browser.close(); }
