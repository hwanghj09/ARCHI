import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { interactionMessage, finishSceneTransition } from './scene-transition.mjs';
import { assertMirroredDoor, exitDoor, roomFront, worldWidth } from './room-geometry.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-25T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-09-25T00:01:00Z'));
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const walk = async x => {
    // Geometry routes use normal speed; sanity effects are covered by sanity.mjs.
    await page.evaluate(() => setDebugSanity(100));
    const start = await position();
    const key = x < start ? 'a' : 'd';
    await page.keyboard.down(key);
    await page.clock.runFor(Math.abs(x - start) / 200 * 1000);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const use = async x => {
    await walk(x);
    await page.keyboard.press('e');
    await finishSceneTransition(page);
  };
  const jumpFloor = async floor => {
    await page.selectOption('#debug-floor-select', floor);
    await page.locator('#debug-floor button').click();
    await finishSceneTransition(page);
    await page.clock.runFor(100);
  };
  const doorFiles = { cafeteria: 'cafeteria-door.png', shutter: 'cu-shutter-states.png',
    metal: 'restroom-door.png', 'restroom-exit': 'restroom-door.png', cafe: 'cafe-door.png', backdoor: 'service-door.png' };
  const checkDoors = async () => {
    for (const door of await page.locator('#dynamic-scene .room-door').all()) {
      const state = await door.evaluate(async el => {
        const style = getComputedStyle(el);
        const source = style.backgroundImage.match(/url\("?([^"\)]+)"?\)/)?.[1];
        if (source) {
          const image = new Image();
          image.src = source;
          await image.decode();
        }
        return { classes: [...el.classList], source, visible: style.visibility, size: style.backgroundSize,
          position: style.backgroundPositionX, unlocked: el.dataset.unlocked,
          bottom: parseFloat(el.style.top) + parseFloat(el.style.height) };
      });
      const kind = state.classes.find(name => doorFiles[name]);
      assert(state.source?.endsWith(doorFiles[kind]), `${kind} uses its own loaded door artwork`);
      assert.equal(state.visible, 'visible');
      assert.equal(state.bottom, 570, 'Door threshold stays at the collision floor');
      assert.equal(state.size, kind === 'shutter' ? '200% 100%' : '100% 100%');
      if (kind === 'shutter') assert.equal(state.position, state.unlocked === 'true' ? '100%' : '0px');
    }
  };
  const checkArt = async count => {
    assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'walls');
    await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
    const panels = await page.locator('.floor-background').evaluateAll(images => images.map(img => ({
      file: img.src.split('/').pop().replace('-off.png', '.png'), left: parseFloat(img.style.left), width: parseFloat(img.style.width),
      top: parseFloat(img.style.top), height: parseFloat(img.style.height), natural: [img.naturalWidth, img.naturalHeight],
    })));
    assert.equal(panels.length, count);
    assert.equal(await page.locator('.floor-background[data-lit-src]').count(), 1, 'Finished artwork retains power switching');
    const expected = await page.evaluate(() => ({ f16: 'corridor', 'f16-kitchen': 'kitchen', 'f16-cu': 'cu', 'f16-cafe': 'cafe' })[dynamicFloorId]);
    let edge = 0;
    for (const panel of panels) {
      assert.equal(panel.file, `floor16-${expected}.png`, 'The scene uses its finished amenity artwork');
      assert.deepEqual(panel.natural, [await worldWidth(page), 760], 'Finished artwork renders at its generated size');
      assert.equal(panel.left, edge, 'Background panels leave no horizontal gaps');
      edge += panel.width;
      assert.deepEqual([panel.top, panel.height], [0, 760], 'Finished artwork covers the full ceiling and floor');
    }
    assert.equal(edge, await worldWidth(page));
    assert.equal(await page.locator('#dynamic-scene > .floor').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    await checkDoors();
  };
  const capture = name => page.screenshot({ path: `.local/floor16-art-${name}.png` });
  await jumpFloor('f16');
  await checkArt(1);
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'false');
  await walk(620);
  await capture('kitchen-door');
  await walk(2400);
  await capture('elevators');
  await walk(1100);
  await capture('storefront');
  await use(1635);
  assert.equal(await page.locator('header span').textContent(), '16F · 편의시설', 'CU is still locked from the corridor');
  const front = await roomFront(page, 'The Kitchen');
  await use(594);
  await checkArt(1);
  assertMirroredDoor(front.room, front.door, await worldWidth(page), await exitDoor(page), 'Kitchen');
  await walk(750);
  await capture('dining');
  await use(2330);
  assert.match(await interactionMessage(page), /02:00~05:00/);
  await capture('kitchen');
  await walk(3410);
  await capture('service-door');
  await use(3515);
  assert.equal(await page.locator('header span').textContent(), '16F · CU 편의점');
  await checkArt(1);
  assert.equal(await page.locator('.fixture.pill-item').count(), 1, 'The medicine is on the upper shelf');
  assert.equal(await page.evaluate(() => movingParts[0].body.position.x), 415, 'The ramen box starts in front of the shelves');
  await walk(300);
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await page.keyboard.press('Space');
  await page.clock.runFor(900);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.clock.runFor(34);
  assert(await position() > 486, 'The shelf box can be cleared with a running jump');
  await capture('shelves');
  await use(1150);
  assert.match(await interactionMessage(page), /23:47/);
  await use(1640);
  assert.match(await interactionMessage(page), /명령 SYSTEM/);
  await capture('cu');
  const exit = await exitDoor(page);
  // The first exit by the shutter pulls the inner lever: record the store as open at once (a save in the middle of the
  // event keeps it open), rattle the shutter, then roll it up in the corridor. Later exits are a plain door.
  await page.evaluate(() => {
    window.soundLog = [];
    const original = playGameSound;
    playGameSound = (name, options) => { soundLog.push(name); original(name, options); };
  });
  const raiseMessage = '안쪽 수동 레버를 당기자 셔터가 덜컹거리며 말려 올라간다.';
  const status = () => page.locator('#interaction-status').textContent();
  const raising = () => page.locator('.room-door.shutter').getAttribute('data-raising');
  assert.equal(await page.evaluate(() => collectedItems.has('f16-cu')), false);
  await walk(exit.x + exit.width / 2);
  await page.evaluate(() => { soundLog.length = 0; });
  // The CSS roll runs on real time, not the test clock: hold it at its start so the checks below see it in progress.
  const holdRoll = await page.addStyleTag({ content: '.room-door.shutter[data-raising="true"]::after { animation-play-state: paused !important; }' });
  await page.keyboard.press('e');
  assert.equal(await page.locator('header span').textContent(), '16F · CU 편의점', 'The event starts before the corridor appears');
  assert(await page.evaluate(() => collectedItems.has('f16-cu') && progressSnapshot().items.includes('f16-cu')), 'The raised shutter is recorded when the event starts');
  assert.deepEqual(await page.evaluate(() => soundLog), ['shutter'], 'The lever rattles the shutter instead of a door sound');
  assert.equal(await status(), raiseMessage);
  await finishSceneTransition(page);
  assert.equal(await page.locator('header span').textContent(), '16F · 편의시설');
  assert.equal(await status(), raiseMessage, 'The lever line stays up over the arrival message');
  assert.equal(await raising(), 'true');
  assert(await page.locator('.room-door.shutter').evaluate(el => {
    const animation = el.getAnimations({ subtree: true }).find(item => item.animationName === 'cu-shutter-raise');
    const timing = animation?.effect.getComputedTiming();
    const style = getComputedStyle(el, '::after');
    return animation.effect.pseudoElement === '::after' && timing.duration === 900 && style.backgroundImage.includes('cu-shutter-states.png') &&
      style.backgroundPositionX === '0px' && style.backgroundSize === '200% 100%';
  }), 'The closed shutter frame rolls up over about a second');
  // Look at the roll halfway, then let it finish: the overlay clears and only the open frame remains.
  await page.locator('.room-door.shutter').evaluate(el => {
    el.getAnimations({ subtree: true }).find(item => item.animationName === 'cu-shutter-raise').currentTime = 405;
  });
  await capture('cu-shutter-raising');
  const halfway = await page.locator('.room-door.shutter').evaluate(el => getComputedStyle(el, '::after').clipPath);
  assert.match(halfway, /^inset\((?:4\d|5\d)(?:\.\d+)?%/, `The curtain is about half rolled up: ${halfway}`);
  await page.locator('.room-door.shutter').evaluate(async el => {
    const animation = el.getAnimations({ subtree: true }).find(item => item.animationName === 'cu-shutter-raise');
    animation.finish(); await animation.finished;
  });
  await page.waitForFunction(() => !document.querySelector('.room-door.shutter').dataset.raising);
  await holdRoll.evaluate(style => style.remove());
  assert.equal(await page.locator('.room-door.shutter').evaluate(el => getComputedStyle(el, '::after').content), 'none');
  assert.equal(await page.locator('.room-door.shutter').getAttribute('aria-label'), 'CU 편의점 출입문');
  await checkDoors();
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'true');
  await capture('cu-unlocked');
  await use(1635);
  await checkDoors();
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'true', 'Raised shutter persists inside');
  await walk(exit.x + exit.width / 2);
  await page.evaluate(() => { soundLog.length = 0; });
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.deepEqual(await page.evaluate(() => soundLog), ['door'], 'The second exit is an ordinary door');
  assert.equal(await raising(), null, 'The shutter is already up the second time');
  assert.equal(await status(), '복도로 나왔습니다.');
  await walk(4440);
  await capture('cafe-front');
  await use(4406);
  await checkArt(1);
  await use(1330);
  assert.match(await interactionMessage(page), /먼저 인사/);
  await capture('cafe');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await checkArt(1);
  await capture('mobile');
  await page.setViewportSize({ width: 1280, height: 720 });
  // With reduced motion the lever line and sound remain, and the corridor shows the raised shutter without the roll.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => { collectedItems.delete('f16-cu'); performFloorChange('f16-cu', null, 'link:f16-kitchen'); });
  await page.clock.runFor(100);
  // The stockroom entry is left of the shelf box, including on the reduced-motion route.
  await walk(300);
  await page.keyboard.down('Shift');
  await page.keyboard.down('d');
  await page.keyboard.press('Space');
  await page.clock.runFor(900);
  await page.keyboard.up('d');
  await page.keyboard.up('Shift');
  await page.clock.runFor(34);
  assert(await position() > 486, 'Reduced motion preserves the shelf-box jump');
  await walk(exit.x + exit.width / 2);
  await page.evaluate(() => { soundLog.length = 0; });
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.deepEqual(await page.evaluate(() => soundLog), ['shutter']);
  assert.equal(await status(), raiseMessage);
  assert.equal(await raising(), null, 'Reduced motion skips the roll');
  assert.equal(await page.locator('.room-door.shutter').getAttribute('data-unlocked'), 'true');
  await page.emulateMedia({ reducedMotion: null });
  await jumpFloor('f16');
  await walk(3684);
  await checkDoors();
  await capture('restroom-door');
  await use(3684);
  assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'true', 'Legacy single-image restroom still renders');
  await page.locator('.floor-background').evaluate(img => img.decode());
  await checkDoors();
  assert.equal(await page.locator('.floor-background').count(), 1);
  await jumpFloor('b1');
  assert.equal(await page.locator('#dynamic-scene').getAttribute('data-art'), 'walls', 'B1 uses the shared finished corridor');
  assert.equal(await page.locator('.floor-background').count(), 1);
  assert.deepEqual(errors, []);
  console.log('PASS 16F backgrounds: image loading, floor alignment, doors, room links, clues, first-exit CU shutter event, mobile and legacy rendering');
} finally {
  await browser.close();
}
