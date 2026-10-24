import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-24T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-24T00:01:00Z'));
  const saved = await page.evaluate(() => progressSnapshot());
  for (const type of ['log']) {
    await page.evaluate(({ saved, type }) => {
      restoreProgress(saved);
      buildingBlackout = true; collectedItems.add('f17-emergency-linked');
      for (const scene of STORY_SCENES) collectedItems.add(scene.flag);
      const id = 'f12-eval';
      solarEnabled = true; solarPoweredFloors = [floorById.get(id).floor];
      performFloorChange(id, null, 'exit');
      roamerEnter(id, floorId(currentSceneFloor));
      Object.assign(roamer, { x: body.position.x + 240, facing: -1, mode: 'chase', stay: 60000, lostTime: 0 });
      openLogPuzzle();
    }, { saved, type });
    const before = await page.evaluate(() => ({ robot: roamer.x, player: body.position.x, elapsed: logPuzzle.elapsed }));
    await page.clock.runFor(2000);
    assert.equal(await page.evaluate(() => playerCaught), false, `${type}: an approaching robot cannot capture through a puzzle panel`);
    assert.deepEqual(await page.evaluate(() => ({ robot: roamer.x, player: body.position.x })),
      { robot: before.robot, player: before.player }, `${type}: the puzzle pauses the world like other control panels`);
    if (type === 'log') assert(await page.evaluate(elapsed => logPuzzle.elapsed > elapsed + 1000, before.elapsed), 'The independent online deletion timer keeps running');
    await page.keyboard.press('Escape');
    await page.clock.runFor(2500);
    assert(await page.evaluate(() => playerCaught), `${type}: closing the panel resumes the pursuing robot`);
    await page.evaluate(() => retryGuardCapture());
    assert(await page.evaluate(() => !playerCaught && logPanel.hidden && !stage.inert), 'Retry remains usable after the panel has closed');
  }
  assert.deepEqual(errors, []);
  console.log('PASS: log world pause, live deletion timer, resumed pursuit and usable retry.');
} finally { await browser.close(); }
