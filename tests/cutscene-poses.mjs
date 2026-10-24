import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const { data, info } = await sharp('assets/player/jeong-suho-cutscene.png').ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
assert.deepEqual([info.width, info.height], [2560, 256]);
const heights = [], poses = new Set();
for (let frame = 0; frame < 10; frame++) {
  let top = 256, bottom = 0, pixels = 0;
  const cell = Buffer.alloc(256 * 256 * 4);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const p = (y * info.width + frame * 256 + x) * 4;
    data.copy(cell, (y * 256 + x) * 4, p, p + 4);
    assert(data[p + 3] === 0 || data[p + 3] === 255, 'No translucent fringe');
    if (!data[p + 3]) continue;
    pixels++; top = Math.min(top, y); bottom = Math.max(bottom, y);
    assert(x > 5 && x < 250 && y > 5 && y < 250, `Pose ${frame} has unclipped margins`);
  }
  assert(pixels > 4500 && pixels < 20000, `Pose ${frame} is a complete isolated character`);
  assert(Math.abs(bottom - 237) <= 1, `Pose ${frame} keeps its feet on the gameplay baseline`);
  heights.push(bottom - top); poses.add(cell.toString('base64'));
}
assert.equal(poses.size, 10, 'Ten distinct newly drawn poses');
assert(heights[4] < heights[0] - 12 && heights[5] < heights[0] - 12, 'Bending forward does not enlarge the body');
assert(Math.abs(heights[4] - heights[5]) <= 5, 'The panting pair keeps the same scale');

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-18T00:01:00Z'));
  await page.locator('#cutscene-sheet').evaluate(image => image.decode());
  const pose = () => page.locator('#player').getAttribute('data-cutscene-pose');
  const visible = async expected => {
    assert.equal(await pose(), expected);
    assert.equal(await page.locator('#player img:visible').count(), 1);
    assert(await page.locator('#cutscene-sheet').isVisible());
    assert(await page.locator('#cutscene-sheet').evaluate(image =>
      Math.abs(new DOMMatrix(getComputedStyle(image).transform).m41 + Number(sprite.dataset.frame) * 192) < .01));
  };
  // Every named pose, breathing cell and mirrored direction uses one complete cell.
  for (const direction of [1, -1]) for (const name of ['alert', 'startled', 'look-up', 'look-back', 'pant', 'think', 'anxious', 'relieved', 'badge']) {
    await page.evaluate(({ name, direction }) => { facing = direction; showCutscenePose(name); render(); }, { name, direction });
    await visible(name);
    await page.locator('#player').screenshot({ path: `.local/cutscene-${name}-${direction}.png` });
  }
  await page.evaluate(() => showCutscenePose('pant', 480));
  assert.equal(await page.locator('#player').getAttribute('data-frame'), '5');

  // Real dialogue entries select their own acting poses and return control without a stale pose.
  const sceneCount = await page.evaluate(() => STORY_SCENES.length);
  for (let index = -1; index < sceneCount; index++) {
    if (index === 0) continue; // Movement and waits are checked below, without summoning a live robot.
    await page.evaluate(index => startStoryScene(index < 0 ? BLACKOUT_MONOLOGUE : STORY_SCENES[index]), index);
    while (await page.evaluate(() => storySceneActive)) {
      const expected = await page.evaluate(() => storySteps[storyStep].pose);
      await visible(expected);
      await page.clock.runFor(50);
      await page.locator('#story-scene').click();
    }
    assert.equal(await pose(), null);
    assert.equal(await page.evaluate(() => stage.inert), false);
  }
  await page.evaluate(() => startStoryScene({ steps: [
    { wait: 1100, pose: 'pant' }, { say: '숨 고르기', pose: 'pant' },
    { walk: () => body.position.x + 60 }, { say: '진정하기', pose: 'relieved' },
  ] }));
  await visible('pant');
  await page.clock.runFor(550);
  assert.equal(await page.locator('#player').getAttribute('data-frame'), '5');
  await page.clock.runFor(600); await visible('pant');
  await page.locator('#story-scene').click(); await page.clock.runFor(100);
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'walk');
  await page.clock.runFor(400); await visible('relieved');
  await page.locator('#story-skip').click(); assert.equal(await pose(), null);

  // Do not suspend the character in midair when a dialogue starts during a jump.
  await page.evaluate(() => {
    grounded = false; Body.setPosition(body, { x: body.position.x, y: floorY - 260 });
    startStoryScene({ lines: ['착지 후 생각하기'] });
  });
  assert.notEqual(await page.locator('#player').getAttribute('data-state'), 'cutscene');
  await page.clock.runFor(1200); await visible('think');
  await page.locator('#story-skip').click();

  // Run the actual first-floor chase through to the new post-sprint breathing pose.
  await page.evaluate(() => {
    triggerBuildingBlackout(); collectedItems.add('f17-emergency-linked');
    solarEnabled = true; solarPoweredFloors = [1]; updatePowerState();
    collectedItems.delete('f1-chase-ended'); collectedItems.delete('story-anxiety-seen');
    performFloorChange('f1', 0); sanity = 70; startStoryScene(STORY_SCENES[0]);
  });
  await visible('relieved'); await page.locator('#story-scene').click();
  const chaseSanity = [];
  for (let i = 0; i < 250 && await pose() !== 'pant'; i++) { await page.clock.runFor(100); chaseSanity.push(await page.evaluate(() => [body.position.x, sanity])); }
  await visible('pant');
  assert.deepEqual(await page.evaluate(() => [playerCaught, collectedItems.has('f1-chase-ended'), sanity]), [false, true, 20]);
  assert(chaseSanity.some(([, value]) => value > 21 && value < 69), '쫓기는 동안 정신력이 서서히 20%로 깎인다');
  const spotted = chaseSanity.findIndex(([, value]) => value < 70);
  const reached = chaseSanity.findIndex(([, value]) => value === 20);
  assert(reached - spotted >= 30 && reached - spotted <= 37, `들킨 뒤 3~4초 안에 20%가 된다(${(reached - spotted) / 10}초)`);
  await page.clock.runFor(1300);
  assert.match(await page.locator('#story-caption').textContent(), /헉/);
  await page.screenshot({ path: '.local/cutscene-chase-breathing.png' });
  while (await page.evaluate(() => storySceneActive)) await page.locator('#story-scene').click();
  assert.equal(await pose(), null);

  await page.evaluate(() => {
    collectedItems.delete('f17-emergency-linked'); solarEnabled = false; solarPoweredFloors = [];
    performFloorChange('f17'); buildingBlackout = false; updatePowerState();
    collectedItems.delete('story-blackout-seen');
    startBlackoutScene(doors[0]);
  });
  await page.clock.runFor(1200); await page.locator('#blackout-scene').click();
  await page.clock.runFor(2200); await page.locator('#blackout-scene').click();
  await page.clock.runFor(400); await visible('startled');
  assert(await page.locator('#caught-sheet').isHidden(), 'Outage reaction is separate from being captured');
  await page.screenshot({ path: '.local/cutscene-blackout.png' });
  await page.locator('#blackout-skip').click(); await visible('look-back');
  await page.locator('#story-skip').click();

  await page.evaluate(() => { collectedItems.delete('b1-cctv-live'); performFloorChange('b1-control', null, 'exit'); });
  const screensAt = await page.evaluate(() => cctvScreensAt);
  const cctvTo = async time => page.clock.runFor(Math.max(0, time - await page.evaluate(() => cctvElapsed)) + 17);
  await cctvTo(screensAt + 100); await visible('look-up');
  await page.screenshot({ path: '.local/cutscene-cctv-look.png' });
  await cctvTo(screensAt + 3600); await visible('startled');
  await cctvTo(screensAt + 4900); await visible('look-back');
  await page.locator('#cctv-skip').click(); assert.equal(await pose(), null);
  await page.evaluate(() => startCctvLights(currentDoors.find(door => door.liveBy === cctvLiveItem)));
  await visible('look-up');
  await page.clock.runFor(3100); await page.locator('#cctv-scene').click();
  await page.clock.runFor(300); await visible('alert');
  await page.clock.runFor(1000); await visible('startled');
  await page.clock.runFor(1700); await visible('look-back');
  await page.locator('#cctv-skip').click(); assert.equal(await pose(), null);

  // A missing optional art sheet must leave the existing character visible.
  await page.evaluate(() => {
    Object.defineProperty(cutsceneSheet, 'naturalWidth', { configurable: true, value: 0 });
    startStoryScene({ lines: ['이미지 실패 복구'] });
  });
  await page.clock.runFor(100);
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'idle');
  assert.equal(await page.locator('#player img:visible').count(), 1);
  await page.locator('#story-skip').click();
  await page.evaluate(() => { delete cutsceneSheet.naturalWidth; });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => startStoryScene({ lines: ['생각 중'], pose: 'think' }));
  await visible('think'); await page.screenshot({ path: '.local/cutscene-dialogue-mobile.png' });
  await page.locator('#story-skip').click();
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log('PASS: 10 new poses, alpha/margins/scale/feet, mirrored cells, dialogue acting, panting, movement/landing, blackout/CCTV reactions, skip cleanup, missing-art fallback and mobile.');
