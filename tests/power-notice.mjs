import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
  const channel = value / 255;
  return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
}).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click(); await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  for (const [name, width, height] of [['desktop', 1280, 720], ['portrait', 390, 844], ['landscape', 844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => {
      performFloorChange('b1');
      const notice = currentDoors.find(door => door.name === '비상 전원 안내판');
      Body.setPosition(body, { x: notice.x + notice.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true; cameraX = cameraTarget(); render(); updateInteraction();
    });
    const notice = page.locator('.fixture.power-notice');
    const text = await notice.evaluate(el => {
      const board = el.getBoundingClientRect();
      return [...el.querySelectorAll('span')].map(span => {
        const rect = span.getBoundingClientRect(), style = getComputedStyle(span);
        return { text: span.textContent, ink: style.color, paper: getComputedStyle(el).backgroundColor,
          fits: rect.left >= board.left && rect.right <= board.right && rect.top >= board.top && rect.bottom <= board.bottom };
      });
    });
    assert.deepEqual(text.map(line => line.text), ['비상 전원 안내', '정전 시 B1 · B2 자체 운전']);
    for (const line of text) {
      const ink = luminance(line.ink), paper = luminance(line.paper);
      assert((Math.max(ink, paper) + .05) / (Math.min(ink, paper) + .05) >= 4.5, `${name}: readable text contrast`);
      assert(line.fits, `${name}: the full text stays inside the paper`);
    }
    await page.screenshot({ path: `.local/power-notice-${name}.png` });
    if (name === 'desktop') await page.keyboard.press('e'); else await page.locator('#interact').tap();
    assert(await page.locator('#inspection-sheet').isVisible());
    assert.match(await page.locator('#inspection-sheet').textContent(), /비상 전원 안내/);
    assert.match(await page.locator('#inspection-sheet').textContent(), /비상 발전기와 UPS/);
    assert.match(await page.locator('#inspection-sheet').textContent(), /SYSTEM 자동/);
    await page.screenshot({ path: `.local/power-notice-reading-${name}.png` });
    await page.keyboard.press('Escape');
  }
  await page.evaluate(() => performFloorChange('rooftop', null));
  assert.equal(await page.locator('.fixture.power-notice').evaluate(el => el.offsetHeight), 5, 'The flat rooftop instruction paper keeps its original size');
  assert.deepEqual(errors, []);
  console.log('PASS: emergency notice contrast, complete lines, desktop/portrait/landscape inspection and rooftop paper');
} finally { await browser.close(); }
