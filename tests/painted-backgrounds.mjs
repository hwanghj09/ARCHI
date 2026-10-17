import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const atlas = sharp('assets/background/painted-walls/interior-atlas.png');
const metadata = await atlas.metadata();
assert.equal(metadata.width, metadata.height * 2, 'The four wall materials share a 2×2 atlas');
assert((await atlas.stats()).channels.every(channel => channel.stdev > 10), 'The artwork contains material detail');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await page.evaluate(() => {
    triggerBuildingBlackout(); setAllFloorsPower(true); setDebugSanity(100);
    collectedItems.add('story-blackout-seen'); collectedItems.add('b1-cctv-seen');
    collectedItems.add('b1-cctv-live');
  });
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const scenes = await page.evaluate(() => [...floorById.values()].filter(config => config.wallArt)
    .map(config => ({ id: config.id, floor: config.floor, interior: config.interior,
      preserve: config.wallArt.preserve || [], pillars: config.wallArt.pillars || [] })));
  assert.equal(scenes.filter(scene => scene.interior).length, 19, 'Every unfinished room is covered');
  assert.equal(scenes.filter(scene => !scene.interior).length, 15, 'Every unfinished corridor is covered');
  for (const scene of scenes) {
    if (!scene.interior) {
      const folder = scene.floor < 0 ? `b${-scene.floor}` : `floor${String(scene.floor).padStart(2, '0')}`;
      const layout = JSON.parse(await readFile(`assets/background/${folder}/walls-layout.json`, 'utf8'));
      assert.deepEqual(scene.preserve, layout.segments.filter(segment => segment.wall !== 'wall-concrete')
        .map(segment => [segment.x, 100, segment.width, 456]), `${scene.id}: the glass frontage follows the authored layout`);
      assert.deepEqual(scene.pillars, [...new Set(layout.segments.flatMap(segment => [segment.x, segment.x + segment.width]))]
        .sort((a, b) => a - b), `${scene.id}: complete 48px pillars follow the authored layout`);
    }
    const sample = await page.evaluate(async id => {
      const config = floorById.get(id);
      performFloorChange(id, 0, config.interior ? 'exit' : null);
      await Promise.all([...dynamicScene.querySelectorAll('img')].map(image => image.decode()));
      const layer = dynamicScene.querySelector('.painted-wall');
      const tile = layer.firstChild;
      const style = getComputedStyle(tile);
      const source = style.backgroundImage.match(/url\("(.*)"\)/)[1];
      const image = new Image(); image.src = source; await image.decode();
      const windows = (config.exteriorWindows || []).map(({ x, y, width, height }) => [x, y, width, height]);
      const pillars = (config.wallArt.pillars || []).map(x => [x - 24, 100, 48, 456]);
      const doors = currentDoors.filter(door => ['room', 'stairs', 'elevator'].includes(door.type));
      const openings = doors.map(door => [door.x, door.y, door.width, door.height ?? floorY - door.y]);
      const holes = [...(config.wallArt.preserve || []), ...windows, ...pillars, ...openings];
      const path = new Path2D(layer.style.clipPath.match(/"(.*)"/)[1]);
      const context = document.createElement('canvas').getContext('2d');
      const inside = (x, y, [rx, ry, w, h]) => x > rx && x < rx + w && y > ry && y < ry + h;
      for (let x = 32.5; x < config.width - 32; x += 17) for (let y = 100.5; y < 556; y += 19) {
        if (context.isPointInPath(path, x, y, 'evenodd') !== !holes.some(rect => inside(x, y, rect))) {
          throw new Error(`${id}: wall/opening overlap at ${x},${y}`);
        }
      }
      if (!config.interior) for (const door of doors.filter(door => door.type === 'room')) {
        for (const x of config.wallArt.pillars) {
          if (door.x < x + 32 && door.x + door.width > x - 32) throw new Error(`${id}: ${door.name} crosses a pillar or its 8px clearance`);
        }
      }
      const hole = holes[0];
      if (hole) {
        Body.setPosition(body, { x: hole[0] + hole[2] / 2, y: floorY - 81 });
        Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
        cameraX = Math.round(Math.max(0, Math.min(worldWidth - viewWidth,
          hole[0] + hole[2] / 2 - viewWidth * .65)) * scale) / scale; render();
      }
      return { valid: CSS.supports('clip-path', layer.style.clipPath),
        tileSize: [parseFloat(style.width), parseFloat(style.height)],
        hole: hole && { left: Math.round((hole[0] + hole[2] / 2 - cameraX) * scale) - 8,
          top: Math.round((hole[1] + hole[3] / 2) * scale) - 8, width: 16, height: 16 } };
    }, scene.id);
    assert(sample.valid, `${scene.id}: the browser applies the wall cutouts`);
    assert.deepEqual(sample.tileSize, [912, 456], `${scene.id}: materials preserve their aspect ratio`);
    const painted = await page.screenshot();
    await page.locator('.painted-wall').evaluate(element => { element.style.opacity = '0'; });
    const original = await page.screenshot();
    let difference = await sharp(await sharp(painted).composite([{ input: original, blend: 'difference' }]).toBuffer()).stats();
    if (sample.hole) {
      const holeBefore = await sharp(painted).extract(sample.hole).toBuffer();
      const holeAfter = await sharp(original).extract(sample.hole).toBuffer();
      const holeDifference = await sharp(await sharp(holeBefore)
        .composite([{ input: holeAfter, blend: 'difference' }]).toBuffer()).stats();
      // Chrome can round composited colors by one level when the wall's opacity changes.
      assert(holeDifference.channels.slice(0, 3).every(channel => channel.max <= 2),
        `${scene.id}: original glass/screen pixels are preserved (${holeDifference.channels.map(channel => channel.max)})`);
    }
    // A full glass frontage can fill the first view; its wall material is visible at the corridor core.
    if (!difference.channels.slice(0, 3).some(channel => channel.max > 20)) {
      await page.evaluate(() => {
        dynamicScene.querySelector('.painted-wall').style.opacity = '1';
        cameraX = Math.round(Math.max(0, (worldWidth - viewWidth) / 2) * scale) / scale; render();
      });
      const corePainted = await page.screenshot();
      await page.locator('.painted-wall').evaluate(element => { element.style.opacity = '0'; });
      const coreOriginal = await page.screenshot();
      difference = await sharp(await sharp(corePainted).composite([{ input: coreOriginal, blend: 'difference' }]).toBuffer()).stats();
    }
    assert(difference.channels.slice(0, 3).some(channel => channel.max > 20), `${scene.id}: the drawn background actually renders`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${scenes.length} painted scenes, complete pillars, clear doorways, overlapping cutouts and original window/monitor pixels.`);
} finally {
  await browser.close();
}
