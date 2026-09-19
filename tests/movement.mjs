import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.waitForFunction(() => document.getElementById('idle-sprite').naturalWidth === 256 && document.getElementById('walk-sheet').naturalWidth === 1024 && document.getElementById('walk-sheet').naturalHeight === 256);
  const state = () => page.locator('#player').evaluate(el => {
    const transform = new DOMMatrix(getComputedStyle(el).transform);
    return { x: transform.m41, facing: transform.m11, width: el.clientWidth, animation: el.dataset.state, frame: Number(el.dataset.frame) };
  });
  const hold = async (key, duration) => {
    await page.keyboard.down(key);
    await page.waitForTimeout(duration);
    await page.keyboard.up(key);
  };
  const initial = await state();
  await hold('d', 400);
  const right = await state();
  assert(right.x > initial.x + 30, 'D must move right');
  assert.equal(right.facing, 1);
  await page.waitForFunction(() => document.getElementById('player').dataset.state === 'idle');
  assert.equal((await state()).frame, 0);
  await hold('ArrowLeft', 400);
  assert((await state()).x < right.x - 30, 'ArrowLeft must move left');
  assert.equal((await state()).facing, -1);
  await page.keyboard.down('a');
  await page.keyboard.down('ArrowRight');
  const opposed = await state();
  await page.waitForTimeout(180);
  assert.equal((await state()).x, opposed.x, 'Opposing directions must cancel');
  assert.equal((await state()).animation, 'idle');
  await page.keyboard.up('a');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('d');
  const frames = await page.evaluate(() => new Promise(resolve => {
    const seen = new Set();
    const start = performance.now();
    function sample(time) {
      const player = document.getElementById('player');
      if (player.dataset.state === 'walk') seen.add(Number(player.dataset.frame));
      if (time - start >= 1000) resolve([...seen]);
      else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }));
  assert.deepEqual(frames.sort(), [0, 1, 2, 3], 'Walking must cycle through exactly four frames');
  assert(await page.locator('#walk-sheet').isVisible());
  assert.equal(await page.locator('#idle-sprite').isVisible(), false);
  await page.screenshot({ path: '.local/player-walking-right.png' });
  await page.keyboard.up('d');
  await page.keyboard.down('a');
  await page.waitForTimeout(180);
  assert.equal((await state()).facing, -1);
  assert.equal((await state()).animation, 'walk');
  await page.screenshot({ path: '.local/player-walking-left.png' });
  await page.keyboard.up('a');
  await page.keyboard.down('d');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const stopped = await state();
  await page.waitForTimeout(180);
  assert.equal((await state()).x, stopped.x, 'Blur must release movement');
  assert.equal((await state()).animation, 'idle');
  await page.keyboard.up('d');
  await page.screenshot({ path: '.local/player-desktop.png' });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  await hold('a', 1400);
  assert.equal((await state()).x, 0, 'Left edge must hold');
  assert.equal((await state()).animation, 'idle', 'Walking must stop at a wall');
  await hold('ArrowRight', 1400);
  const edge = await state();
  assert.equal(edge.x + edge.width, 390, 'Right edge must hold');
  const cdp = await page.context().newCDPSession(page);
  const button = await page.locator('[data-direction="-1"]').boundingBox();
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart', touchPoints: [{ x: button.x + button.width / 2, y: button.y + button.height / 2, id: 1 }],
  });
  await page.waitForTimeout(350);
  assert((await state()).x < edge.x - 25, 'Touch must move left');
  assert.equal((await state()).animation, 'walk');
  await page.screenshot({ path: '.local/player-walking-mobile.png' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  const cancelled = await state();
  await page.waitForTimeout(180);
  assert.equal((await state()).x, cancelled.x, 'Cancelled touch must stop');
  assert.equal((await state()).animation, 'idle');
  await page.locator('[data-direction="1"]').focus();
  await page.keyboard.press('Enter');
  assert((await state()).x > cancelled.x, 'Keyboard button activation must work');
  await page.screenshot({ path: '.local/player-mobile.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: sprite load, four-frame walk cycle, idle, direction, bounds, blur, touch cancellation, accessible controls.');
} finally {
  await browser.close();
}
