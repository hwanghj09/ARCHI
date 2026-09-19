import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-19T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-09-19T00:01:00Z'));
  await page.clock.runFor(100);
  const state = () => page.locator('#player').evaluate(el => {
    const player = new DOMMatrix(getComputedStyle(el).transform);
    const world = new DOMMatrix(getComputedStyle(el.parentElement).transform);
    return { x: player.m41 + 96, feet: player.m42 + 178, facing: player.m11,
      camera: -world.m41 / world.m11, animation: el.dataset.state, frame: Number(el.dataset.frame) };
  });
  const near = (actual, expected, message) => assert(Math.abs(actual - expected) < 1, message + ': ' + actual);
  const hold = async (key, duration) => {
    await page.keyboard.down(key);
    await page.clock.runFor(duration);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  assert(await page.locator('#idle-sprite').evaluate(el => el.naturalWidth === 256));
  assert(await page.locator('#walk-sheet').evaluate(el => el.naturalWidth === 1024 && el.naturalHeight === 256));
  const tiles = page.locator('#background img');
  await tiles.evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await tiles.count(), 39, 'The 3200x720 stage must be covered by 13x3 tiles');
  assert(await tiles.evaluateAll(images => images.every((image, index) =>
    image.naturalWidth === 256 && image.naturalHeight === 256 &&
    image.offsetLeft === (index % 13) * 256 && image.offsetTop === Math.floor(index / 13) * 256)),
  'Background sprites must be 256x256 and meet without gaps');
  near((await state()).feet, 570, 'Player must stand on the floor');
  await page.screenshot({ path: '.local/sideview-desktop.png' });

  const initial = await state();
  await hold('d', 400);
  const right = await state();
  assert(right.x > initial.x + 60, 'D must move right');
  assert.equal(right.facing, 1);
  assert.equal(right.animation, 'idle');
  assert.equal(right.frame, 0);
  await hold('ArrowLeft', 400);
  assert((await state()).x < right.x - 60, 'ArrowLeft must move left');
  assert.equal((await state()).facing, -1);
  await page.keyboard.down('a');
  await page.keyboard.down('ArrowRight');
  const opposed = await state();
  await page.clock.runFor(200);
  near((await state()).x, opposed.x, 'Opposing directions must cancel');
  await page.keyboard.up('a');
  await page.keyboard.up('ArrowRight');

  await page.evaluate(() => {
    window.walkFrames = new Set();
    function sample() {
      const player = document.getElementById('player');
      if (player.dataset.state === 'walk') window.walkFrames.add(Number(player.dataset.frame));
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.keyboard.down('d');
  await page.clock.runFor(1100);
  assert.deepEqual((await page.evaluate(() => [...window.walkFrames])).sort(), [0, 1, 2, 3]);
  assert(await page.locator('#walk-sheet').isVisible());
  assert.equal(await page.locator('#idle-sprite').isVisible(), false);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  const stopped = await state();
  await page.clock.runFor(200);
  near((await state()).x, stopped.x, 'Blur must release movement');
  await page.keyboard.up('d');

  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  assert((await state()).feet < 500, 'Jump must lift the player');
  assert.equal((await state()).animation, 'jump');
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  assert((await state()).feet > 420, 'A second midair press must not double-jump');
  await page.clock.runFor(900);
  near((await state()).feet, 570, 'Gravity must return the player to the floor');

  await hold('a', 5000);
  near((await state()).x, 52, 'Left world wall must hold');
  assert.equal((await state()).animation, 'idle');
  await hold('d', 5000);
  near((await state()).x, 960, 'Obstacle side must block movement');
  assert((await state()).camera > 200, 'Camera must follow beyond the first screen');
  assert.equal((await state()).animation, 'idle');

  await page.keyboard.press('Space');
  await hold('d', 400);
  await page.clock.runFor(500);
  near((await state()).feet, 514, 'Player must land on the crate');
  await page.screenshot({ path: '.local/sideview-obstacle.png' });
  await page.keyboard.press('w');
  await hold('d', 1000);
  near((await state()).feet, 570, 'Player must return to the floor after crossing the crate');
  await hold('d', 4000);
  near((await state()).x, 1910, 'Second obstacle must block movement');
  await page.keyboard.press('ArrowUp');
  await hold('d', 400);
  await page.clock.runFor(500);
  near((await state()).feet, 482, 'Player must land on the higher cabinet');
  await hold('d', 6500);
  near((await state()).x, 3148, 'Right world wall must hold');
  near((await state()).camera, 1920, 'Camera must stop at the right world boundary');
  await page.screenshot({ path: '.local/sideview-exit.png' });

  const beforeResize = await state();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  near((await state()).x, beforeResize.x, 'Resize must preserve world position');
  near((await state()).feet, beforeResize.feet, 'Resize must preserve floor contact');
  const cdp = await page.context().newCDPSession(page);
  const left = await page.locator('[data-direction="-1"]').boundingBox();
  const jump = await page.locator('#jump').boundingBox();
  const leftTouch = { x: left.x + left.width / 2, y: left.y + left.height / 2, id: 1 };
  const jumpTouch = { x: jump.x + jump.width / 2, y: jump.y + jump.height / 2, id: 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [leftTouch] });
  await page.clock.runFor(100);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [leftTouch, jumpTouch] });
  await page.clock.runFor(200);
  assert((await state()).x < beforeResize.x - 40, 'Touch must move left');
  assert((await state()).feet < 500, 'Two-finger input must move and jump together');
  await page.screenshot({ path: '.local/sideview-mobile-jump.png' });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
  await page.clock.runFor(34);
  const cancelled = await state();
  await page.clock.runFor(1000);
  near((await state()).x, cancelled.x, 'Cancelled touch must stop movement');
  near((await state()).feet, 570, 'Jump must land after touch cancellation');
  assert.equal(await page.locator('button.active').count(), 0);
  await page.locator('[data-direction="1"]').focus();
  await page.keyboard.press('Enter');
  await page.clock.runFor(250);
  assert((await state()).x > cancelled.x + 20, 'Native keyboard button activation must move through physics');
  await page.locator('#jump').focus();
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  assert((await state()).feet < 500, 'Focused jump button must accept Space');
  await page.clock.runFor(1000);
  await page.screenshot({ path: '.local/sideview-mobile.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  near((await state()).feet, 570, 'Landscape must preserve physics coordinates');
  const controlBounds = await page.locator('nav').boundingBox();
  const playerBounds = await page.locator('#player').boundingBox();
  assert(playerBounds.y + playerBounds.height < controlBounds.y, 'Controls must not overlap the player in landscape');
  await page.screenshot({ path: '.local/sideview-landscape.png' });
  assert.deepEqual(errors, []);
  console.log('PASS: four-frame animation, movement, gravity, jump, no double-jump, walls, obstacle landings, camera, resize, blur, multi-touch and keyboard controls.');
} finally {
  await browser.close();
}
