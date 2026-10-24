import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition, reachInitialCorridor } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-19T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-09-19T00:01:00Z'));
  await page.clock.runFor(100);
  await reachInitialCorridor(page);
  // This suite checks powered movement after the first departure; outage, app installation and first-departure gates have their own regression routes.
  await page.evaluate(() => triggerBuildingBlackout());
  // 태양광은 전등만 켠다. 승강기는 17층 비상 UPS 회선(f17-emergency-linked)으로 움직인다(elevators.js).
  // 순찰 로봇 R-03은 정전 중 승강기를 타고 층을 옮긴다(roaming-guard.mjs). 칸 배정을 흔들지 않게 9층에 머물게 한다.
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); collectedItems.add('solar-app-installed'); collectedItems.add('story-robot-seen'); solarEnabled = true; updatePowerState(); roamer.stay = Infinity; });
  await page.locator('#power-floor-grid [data-floor="17"]').dispatchEvent('click');
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
  assert(await page.locator('#idle-sprite').evaluate(el => el.naturalWidth === 1254 && el.naturalHeight === 1254));
  assert(await page.locator('#walk-sheet').evaluate(el => el.naturalWidth === 2048 && el.naturalHeight === 256));
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
  const tiles = page.locator('#background img:not(.luminous-sign)');
  await tiles.evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await tiles.count(), 1, 'The corridor uses one registered power-switchable atlas');
  assert(await tiles.evaluateAll(images => images.every(image =>
    image.naturalWidth === 3328 && image.naturalHeight === 760 &&
    image.offsetLeft === 0 && image.offsetTop === 0 && image.clientWidth === 3328 && image.clientHeight === 760)),
  'The finished corridor atlas retains its world alignment');
  near((await state()).feet, 570, 'Player must stand on the floor');
  const doors = page.locator('.door');
  await doors.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  assert.equal(await doors.count(), 4);
  await doors.nth(0).evaluate(async door => {
    const panels = door.querySelector('.elevator-panels');
    const offsets = () => ['::before', '::after'].map(pseudo => {
      const transform = getComputedStyle(panels, pseudo).transform;
      return transform === 'none' ? 0 : new DOMMatrix(transform).m41;
    });
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    check(offsets().every(x => x === 0), 'Door panels start closed');
    for (const open of [true, false]) {
      door.dataset.open = String(open);
      offsets(); // Flush style to create the native CSS transitions.
      const animations = panels.getAnimations({ subtree: true });
      check(animations.length === 2, 'Both door panels must animate');
      for (const animation of animations) { animation.pause(); animation.currentTime = 700; }
      const [left, right] = offsets();
      const travel = door.clientWidth * .38;
      check(left < 0 && left > -travel && right > 0 && right < travel,
        'Panels must slide in opposite directions through an intermediate position');
      check(Math.abs(left + right) < .01, 'The central opening stays symmetrical');
      for (const animation of animations) animation.finish();
      const end = offsets();
      check(Math.abs(end[0] - (open ? -travel : 0)) < .1 &&
        Math.abs(end[1] - (open ? travel : 0)) < .1, 'Panels reach fully open and fully closed positions');
    }
  });
  const indicators = page.locator('.elevator-indicator');
  const elevatorFloorMs = await page.evaluate(() => elevatorFloorTime);
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
  const idleFrames = new Set();
  for (let elapsed = 0; elapsed < 3300; elapsed += 100) {
    const idle = await state();
    idleFrames.add(idle.frame);
    assert.equal(idle.animation, 'idle');
    near(idle.x, right.x, 'Idle animation must not move the character');
    assert.equal(await page.locator('#player img:visible').count(), 1);
    assert(await page.locator('#idle-sprite').evaluate(el => {
      const frame = Number(el.parentElement.dataset.frame);
      const transform = new DOMMatrix(getComputedStyle(el).transform);
      const scale = el.getBoundingClientRect().width / el.naturalWidth /
        new DOMMatrix(getComputedStyle(document.getElementById('world')).transform).m11;
      return getComputedStyle(el).clipPath === ['inset(0% 50% 50% 0%)', 'inset(0% 0% 50% 50%)',
        'inset(50% 50% 0% 0%)', 'inset(50% 0% 0% 50%)'][frame] &&
        Math.abs([325, 925, 325, 925][frame] * scale + transform.m41 - 96) < .1 &&
        Math.abs([619, 619, 1234, 1235][frame] * scale + transform.m42 - 178) < .1;
    }), 'Every idle pose must keep its hip centered and soles on the ground');
    await page.clock.runFor(100);
  }
  assert.deepEqual([...idleFrames].sort(), [0, 1, 2, 3], 'Idle must play the complete breathing and blink loop');
  assert.equal((await state()).frame, 0, 'Idle loop returns to neutral');
  await page.screenshot({ path: '.local/idle-desktop.png' });
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
  assert.deepEqual((await page.evaluate(() => [...window.walkFrames])).sort((a, b) => a - b), Array.from({ length: 8 }, (_, i) => i));
  assert(await page.locator('#walk-sheet').evaluate(el => {
    const frame = Number(el.parentElement.dataset.frame);
    const cellWidth = el.parentElement.clientWidth;
    return Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41 + frame * cellWidth) < .01 &&
      el.clientWidth === cellWidth * 8;
  }), 'The eight-frame sheet must display exactly one aligned cell');
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
  assert((await state()).x > 1000, 'Walking crosses the former box position');
  assert.equal(await page.locator('.solid:not(.floor):not(.boundary)').count(), 0, 'No box obstacles remain');
  assert((await state()).camera > 200, 'Camera must follow beyond the first screen');
  assert.equal((await state()).animation, 'idle');

  near((await state()).feet, 570, 'Former box position is flat ground');
  await page.screenshot({ path: '.local/corridor-no-boxes.png' });
  await hold('d', (1910 - (await state()).x) / 200 * 1000);
  assert(await doors.nth(0).evaluate(door => door.classList.contains('near')));
  await page.keyboard.down('e');
  await page.keyboard.down('e');
  await page.keyboard.up('e');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'Calling must not open the elevator immediately');
  assert.deepEqual(await indicators.allTextContents(), ['↑ 01F', '01F', '01F'], 'Only the called elevator starts moving');
  await actionFrame('#interact-sheet', 0);
  await page.clock.runFor(220);
  await actionFrame('#interact-sheet', 1);
  assert.equal(await indicators.nth(0).textContent(), '↑ 02F', 'The floor display advances before arrival');
  await page.clock.runFor(250);
  assert.equal((await state()).animation, 'idle');
  await page.keyboard.press('e');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'Repeated calls must not open a moving elevator');
  await page.screenshot({ path: '.local/elevator-ascending.png' });
  await page.clock.runFor(16 * elevatorFloorMs - 470 - elevatorFloorMs / 2);
  assert.equal(await indicators.nth(0).textContent(), '↑ 16F', 'Repeated calls must not restart or accelerate travel');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'The door stays shut before arrival');
  await page.clock.runFor(elevatorFloorMs);
  assert.equal(await indicators.nth(0).textContent(), '17F');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'Arrival must automatically open the door');
  await page.screenshot({ path: '.local/door-elevator-open.png' });
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await page.locator('#elevator-cabin').isHidden(), false, 'E enters the first-person cabin');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'Boarding menu must not close the door');
  await page.keyboard.press('Escape');
  await finishSceneTransition(page);
  assert.equal(await page.locator('#elevator-cabin').isHidden(), true, 'Escape exits only with an open door');
  await page.keyboard.press('ArrowUp');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'jump', 'Jump must cancel interaction');
  await page.keyboard.press('e');
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'Jumping must prevent interaction');
  assert.equal(await page.locator('#interaction-hint').isVisible(), false);
  await hold('d', 400);
  await page.clock.runFor(500);
  near((await state()).feet, 570, 'Former cabinet position is flat ground');
  await hold('d', 16000);
  near((await state()).x, 4948, 'Extended right world wall must hold');
  near((await state()).camera, 3720, 'Camera must stop at the extended right world boundary');
  await page.screenshot({ path: '.local/sideview-exit.png' });

  for (const [index, x] of [[2, 2552], [1, 2255]]) {
    await hold('a', ((await state()).x - x) / 200 * 1000);
    await page.keyboard.press('e');
    assert.equal(await doors.nth(index).getAttribute('data-open'), 'false',
      'Elevators must travel before opening');
  }
  await page.clock.runFor(16 * elevatorFloorMs + 100);
  assert.deepEqual(await indicators.allTextContents(), ['17F', '17F', '17F'], 'Elevators keep travelling independently when the player walks away');
  for (const index of [2, 1]) {
    assert.equal(await doors.nth(index).getAttribute('data-open'), 'true');
    assert(await doors.nth(index).locator('img').evaluate(image =>
      Math.abs(new DOMMatrix(getComputedStyle(image).transform).m41 + image.parentElement.clientWidth) < .1),
    'Open state must display the second sprite frame');
    if (index === 2) await page.screenshot({ path: '.local/doors-open.png' });
  }
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  assert.equal((await state()).animation, 'idle', 'Blur must cancel interaction');
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  await page.keyboard.press('Escape');
  await finishSceneTransition(page);
  await page.keyboard.down('d');
  await page.clock.runFor(50);
  assert.equal((await state()).animation, 'walk', 'Movement must cancel interaction');
  await page.keyboard.up('d');
  await hold('d', 15000);
  near((await state()).x, 4948, 'Interaction must preserve movement and boundaries');
  // 오른쪽 끝벽 앞에는 청소 카트(관리실 메모, corridor17.js)가 있어 엘리베이터 안내 대신 카트 안내가 뜬다.
  assert.match(await page.locator('#interaction-hint').textContent(), /^E · 청소 카트/, 'Walking away replaces the elevator prompt');

  const beforeResize = await state();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  near((await state()).x, beforeResize.x, 'Resize must preserve world position');
  near((await state()).feet, beforeResize.feet, 'Resize must preserve floor contact');
  assert.equal(await page.locator('nav button').count(), 3, 'Only interact, flash and phone screen buttons remain'); // 플래시 버튼 추가(94c0924)
  assert.equal(await page.locator('nav [data-direction], nav #jump').count(), 0, 'Movement and jump use the keyboard');

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

  // Walking around lets the car auto-close; re-open it before boarding and make a return trip.
  const beforeTravel = await state();
  const stepsToElevator0 = (beforeTravel.x - 1818) / 200 * 1000;
  await hold(stepsToElevator0 > 0 ? 'a' : 'd', Math.abs(stepsToElevator0));
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'false', 'An idle car closes while the player walks away');
  await page.keyboard.press('e');
  await page.clock.runFor(1500);
  assert.equal(await doors.nth(0).getAttribute('data-open'), 'true', 'A closed door opens first');
  assert(await page.locator('#elevator-cabin').isHidden(), 'Opening the door does not board the car');
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await page.locator('#elevator-cabin').isVisible(), 'Reopening a parked car enters the cabin');
  await page.locator('#cabin-floor-buttons [data-floor="12"]').click();
  assert.equal(await page.locator('#cabin-floor-buttons [data-floor="12"]').getAttribute('aria-pressed'), 'true');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(8500);
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'dynamic', 'Boarding must move the player to a dynamically built floor');
  assert.equal(await page.evaluate(() => document.getElementById('world').style.width), '5000px', 'Every floor shares the 17F width');
  assert.equal(await page.locator('header > span').textContent(), '12F · 기술본부 ARCHI 개발팀');
  assert.equal(await page.locator('#dynamic-scene .solid:not(.floor):not(.boundary)').count(), 0, 'The 12F corridor has no extra box obstacles');
  assert.equal(await page.locator('#elevator-cabin').isHidden(), true, 'Exiting must close the cabin view');
  await page.screenshot({ path: '.local/floor-12.png' });

  await page.keyboard.press('e');
  await finishSceneTransition(page);
  await page.locator('#cabin-floor-buttons [data-floor="17"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(8500);
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor', 'Boarding must return the player to floor 17');
  assert.equal(await page.locator('header > span').textContent(), '17F · 복도');

  assert.deepEqual(errors, []);
  console.log('PASS: delayed elevator calls, gradual floor indicators, independent travel, automatic arrival opening, repeated-call guards, multi-floor boarding across structurally distinct floors; doors, player animations, movement, collisions, camera and resize.');
} finally {
  await browser.close();
}
