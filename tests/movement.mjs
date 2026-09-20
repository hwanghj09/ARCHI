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
  assert(await page.locator('#walk-sheet').evaluate(el => el.naturalWidth === 1536 && el.naturalHeight === 256));
  await page.locator('.action-sheet').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  const actionFrame = async (sheet, frame) => {
    assert(await page.locator(sheet).isVisible());
    assert.equal((await state()).frame, frame);
    assert.equal(await page.locator('#player img:visible').count(), 1);
    assert(await page.locator(sheet).evaluate((el, frame) =>
      el.naturalWidth === el.naturalHeight * 2 &&
      el.clientWidth === el.parentElement.clientWidth * 2 &&
      Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41 + frame * el.parentElement.clientWidth) < .01,
    frame), 'Action sheet must show the selected cell');
  };
  const tiles = page.locator('#background img');
  await tiles.evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await tiles.count(), 39, 'The 3200x720 stage must be covered by 13x3 tiles');
  assert(await tiles.evaluateAll(images => images.every((image, index) =>
    image.naturalWidth === 256 && image.naturalHeight === 256 &&
    image.offsetLeft === (index % 13) * 256 && image.offsetTop === Math.floor(index / 13) * 256)),
  'Background sprites must be 256x256 and meet without gaps');
  near((await state()).feet, 570, 'Player must stand on the floor');
  const doors = page.locator('.door');
  await doors.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await doors.count(), 4);
  const indicators = page.locator('.elevator-indicator');
  assert.deepEqual(await indicators.allTextContents(), ['01F', '01F', '01F']);
  assert(await doors.locator('img').evaluateAll(images => images.every(image =>
    image.naturalWidth === 512 && image.naturalHeight === 512)), 'Door sheets must contain two 256x512 frames');
  await page.keyboard.press('e');
  assert.equal(await page.locator('.door[data-open="true"]').count(), 0, 'Distant doors must ignore E');
  assert.equal(await page.locator('#interaction-hint').isVisible(), false);
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
  assert.deepEqual((await page.evaluate(() => [...window.walkFrames])).sort(), [0, 1, 2, 3, 4, 5]);
  assert(await page.locator('#walk-sheet').evaluate(el => {
    const frame = Number(el.parentElement.dataset.frame);
    const cellWidth = el.parentElement.clientWidth;
    return Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41 + frame * cellWidth) < .01 &&
      el.clientWidth === cellWidth * 6;
  }), 'The six-frame sheet must display exactly one aligned cell');
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
  await actionFrame('#jump-sheet', 0);
  await page.screenshot({ path: '.local/action-jump.png' });
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  assert((await state()).feet > 420, 'A second midair press must not double-jump');
  await page.clock.runFor(150);
  assert.equal((await state()).animation, 'fall');
  await actionFrame('#jump-sheet', 1);
  await page.screenshot({ path: '.local/action-fall.png' });
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
  assert.equal(await doors.nth(0).getAttribute('class'), 'door near');
  await page.keyboard.down('e');
  await page.keyboard.down('e');
  await page.keyboard.up('e');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'Calling must not open the elevator immediately');
  assert.match(await page.locator('#interaction-status').textContent(), /1번 엘리베이터.*호출했습니다/);
  assert.deepEqual(await indicators.allTextContents(), ['↑ 01F', '01F', '01F'], 'Only the called elevator starts moving');
  await actionFrame('#interact-sheet', 0);
  await page.clock.runFor(220);
  await actionFrame('#interact-sheet', 1);
  await page.clock.runFor(250);
  assert.equal((await state()).animation, 'idle');
  await page.clock.runFor(800);
  assert.equal(await indicators.nth(0).textContent(), '↑ 02F', 'The floor display must advance gradually');
  await page.keyboard.press('e');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'Repeated calls must not open a moving elevator');
  await page.screenshot({ path: '.local/elevator-ascending.png' });
  await page.clock.runFor(17700);
  assert.equal(await indicators.nth(0).textContent(), '↑ 16F', 'Repeated calls must not restart or accelerate travel');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'The door stays shut before arrival');
  await page.clock.runFor(400);
  assert.equal(await indicators.nth(0).textContent(), '17F');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'Arrival must automatically open the door');
  assert.match(await page.locator('#interaction-status').textContent(), /17층에 도착/);
  await page.screenshot({ path: '.local/door-elevator-open.png' });
  await page.keyboard.press('e');
  assert.equal(await page.locator('#floor-select').isHidden(), false, 'E on an open elevator offers floors to board');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'Boarding menu must not close the door');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#floor-select').isHidden(), true, 'Escape cancels the floor menu');
  await page.keyboard.press('ArrowUp');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'jump', 'Jump must cancel interaction');
  await page.keyboard.press('e');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'Jumping must prevent interaction');
  assert.equal(await page.locator('#interaction-hint').isVisible(), false);
  await hold('d', 400);
  await page.clock.runFor(500);
  near((await state()).feet, 482, 'Player must land on the higher cabinet');
  await hold('d', 6500);
  near((await state()).x, 3148, 'Right world wall must hold');
  near((await state()).camera, 1920, 'Camera must stop at the right world boundary');
  await page.screenshot({ path: '.local/sideview-exit.png' });

  for (const [index, x] of [[3, 2996], [2, 2552], [1, 2255]]) {
    await hold('a', ((await state()).x - x) / 200 * 1000);
    await page.keyboard.press('e');
    assert.equal(await doors.nth(index).getAttribute('data-open'), index === 3 ? 'true' : 'false',
      'Stairs open immediately while elevators must travel first');
  }
  await page.clock.runFor(19400);
  assert.deepEqual(await indicators.allTextContents(), ['17F', '17F', '17F'], 'Elevators keep travelling independently when the player walks away');
  for (const index of [3, 2, 1]) {
    assert.equal(await doors.nth(index).getAttribute('data-open'), 'true');
    assert(await doors.nth(index).locator('img').evaluate(image =>
      Math.abs(new DOMMatrix(getComputedStyle(image).transform).m41 + image.parentElement.clientWidth) < .1),
    'Open state must display the second sprite frame');
    if (index === 2) await page.screenshot({ path: '.local/doors-open.png' });
  }
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  assert.equal((await state()).animation, 'idle', 'Blur must cancel interaction');
  await page.keyboard.press('e');
  await page.keyboard.press('Escape');
  await page.keyboard.down('d');
  await page.clock.runFor(50);
  assert.equal((await state()).animation, 'walk', 'Movement must cancel interaction');
  await page.keyboard.up('d');
  await hold('d', 5000);
  near((await state()).x, 3148, 'Interaction must preserve movement and boundaries');
  assert.equal(await page.locator('#interaction-hint').isVisible(), false, 'Walking away hides the prompt');

  const beforeResize = await state();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  near((await state()).x, beforeResize.x, 'Resize must preserve world position');
  near((await state()).feet, beforeResize.feet, 'Resize must preserve floor contact');
  assert.equal(await page.locator('nav').count(), 1, 'On-screen controls must be present for touch');
  assert.equal(await page.locator('nav button').count(), 4, 'Left, right, interact and jump buttons must exist');

  const holdButton = async (selector, duration) => {
    const box = await page.locator(selector).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.clock.runFor(duration);
    await page.mouse.up();
    await page.clock.runFor(34);
  };
  const beforeButtons = await state();
  await holdButton('button[data-direction="-1"]', 400);
  const afterLeftButton = await state();
  assert(afterLeftButton.x < beforeButtons.x - 60, 'Left button must move the player left');
  await holdButton('button[data-direction="1"]', 400);
  assert((await state()).x > afterLeftButton.x + 60, 'Right button must move the player right');
  await page.locator('#jump').click();
  await page.clock.runFor(150);
  assert((await state()).feet < 500, 'Jump button must lift the player');
  await page.clock.runFor(900);

  await hold('a', 300);
  assert((await state()).x < beforeResize.x - 40, 'Keyboard must still move left');
  await page.keyboard.press('Space');
  await page.clock.runFor(200);
  assert((await state()).feet < 500, 'Keyboard jump must still work alongside the on-screen buttons');
  await actionFrame('#jump-sheet', 0);
  await page.screenshot({ path: '.local/action-mobile-jump.png' });
  await page.clock.runFor(1000);
  await page.screenshot({ path: '.local/sideview-mobile.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.clock.runFor(100);
  near((await state()).feet, 570, 'Landscape must preserve physics coordinates');
  await page.screenshot({ path: '.local/sideview-landscape.png' });

  // Board an already-open elevator to travel to a different, structurally distinct floor.
  const beforeTravel = await state();
  const stepsToElevator0 = (beforeTravel.x - 1818) / 200 * 1000;
  await hold(stepsToElevator0 > 0 ? 'a' : 'd', Math.abs(stepsToElevator0));
  await page.keyboard.press('e');
  await page.locator('#floor-select button', { hasText: '12층 · ARCHI 개발팀' }).click();
  await page.clock.runFor(6600);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'dynamic', 'Boarding must move the player to a dynamically built floor');
  assert.equal(await page.evaluate(() => document.getElementById('world').style.width), '3000px', 'Floor 12 must use its own width, not floor 17\'s');
  assert.equal(await page.locator('header span').textContent(), '12F · ARCHI 개발팀');
  assert.equal(await page.locator('.desk').count(), 2, 'Floor 12 must have its own distinct desk layout');
  assert.match(await page.locator('#interaction-status').textContent(), /12층 · ARCHI 개발팀에 도착/);
  assert.equal(await page.locator('#floor-select').isHidden(), true, 'Boarding must close the floor menu');
  await page.screenshot({ path: '.local/floor-12.png' });

  await page.keyboard.press('e');
  await page.locator('#floor-select button', { hasText: '17층 · 복도' }).click();
  await page.clock.runFor(6600);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor', 'Boarding must return the player to floor 17');
  assert.equal(await page.locator('header span').textContent(), '17F · 00:00');
  assert.match(await page.locator('#interaction-status').textContent(), /17층 · 복도에 도착/);

  assert.deepEqual(errors, []);
  console.log('PASS: delayed elevator calls, gradual floor indicators, independent travel, automatic arrival opening, repeated-call guards, multi-floor boarding across structurally distinct floors; doors, player animations, movement, collisions, camera and resize.');
} finally {
  await browser.close();
}
