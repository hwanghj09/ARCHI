import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
const overlap = (a, b) => Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]) > 2 &&
  Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]) > 2;
// Authored layers: the lobby PC stands on its counter; lounge tables sit in front of sofas, with a remote on one table.
const layeredProps = { f1: [[2, 3]], 'f2-lounge': [[0, 2], [0, 4], [1, 3], [2, 4]] };
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  const ids = await page.evaluate(() => {
    triggerBuildingBlackout(); setAllFloorsPower(true); setDebugSanity(100);
    collectedItems.add('story-blackout-seen');
    collectedItems.add('b1-cctv-live'); collectedItems.add('b1-cctv-seen');
    return [...floorById.keys()].filter(id => id !== 'f17');
  });
  let windows = 0;
  for (const id of ids) {
    const scene = await page.evaluate(async id => {
      const config = floorById.get(id);
      performFloorChange(id, id === 'rooftop' ? null : 0, config.interior ? 'exit' : null);
      await Promise.all([...dynamicScene.querySelectorAll('img')].map(image => image.decode()));
      const props = [...dynamicScene.querySelectorAll('.floor-prop')].map((element, index) => {
        const rect = ['left', 'top', 'width', 'height'].map(key => parseFloat(element.style[key]));
        const prop = config.props[index];
        const image = element.firstChild;
        return { file: image.getAttribute('src'), rect: spriteOutline(image.getAttribute('src'), ...rect),
          grounded: Math.abs(rect[1] + (prop.size[1] - 8) * rect[2] / prop.size[0] + (prop.base || 0) - floorY) < .01,
          correctSize: image.naturalWidth === prop.size[0] * (prop.sprite ? prop.frames || 2 : 1) && image.naturalHeight === prop.size[1] };
      });
      const doors = currentDoors.filter(door => ['room', 'stairs', 'elevator'].includes(door.type)).map(outlineBox);
      // Painted inspection regions and desk outlets share their supporting art; link-bed is an invisible inspection region.
      const fixtures = (config.fixtures || []).filter(fixture => fixture.style &&
        !['art-spot', 'phone-charger', 'link-bed'].includes(fixture.style))
        .map(fixture => ({ name: fixture.name, rect: fixture.outline ||
          [fixture.x, fixture.y, fixture.width, fixture.height ?? floorY - fixture.y] }));
      const obstacles = [...(config.solids || []), ...(config.movables || [])]
        .map(solid => ({ name: solid.name || solid.kind || 'crate', rect: [solid.x, floorY - solid.height, solid.width, solid.height] }));
      const windows = [...dynamicScene.querySelectorAll('.exterior-window')].map(element => {
        const style = getComputedStyle(element);
        return { rect: ['left', 'top', 'width', 'height'].map(key => parseFloat(style[key])),
          image: style.backgroundImage, position: style.backgroundPosition, filter: style.filter };
      });
      return { width: worldWidth, props, doors, fixtures, obstacles, windows, windowless: Boolean(config.windowless) };
    }, id);
    for (const prop of scene.props) {
      assert(prop.correctSize, `${id}: ${prop.file} uses its natural aspect ratio`);
      assert(prop.grounded, `${id}: ${prop.file} rests on its floor or authored support`);
      assert(prop.rect[0] >= 32 && prop.rect[0] + prop.rect[2] <= scene.width - 32,
        `${id}: ${prop.file} stays within the room walls`);
      for (const door of scene.doors) assert(!overlap(prop.rect, door), `${id}: ${prop.file} leaves the doorway clear`);
      for (const other of [...scene.fixtures, ...scene.obstacles]) assert(!overlap(prop.rect, other.rect),
        `${id}: ${prop.file} leaves ${other.name} clear`);
    }
    for (let i = 0; i < scene.props.length; i++) {
      for (let j = i + 1; j < scene.props.length; j++) {
        if (layeredProps[id]?.some(([a, b]) => a === i && b === j)) continue;
        assert(!overlap(scene.props[i].rect, scene.props[j].rect),
          `${id}: ${scene.props[i].file} and ${scene.props[j].file} do not intersect`);
      }
    }
    for (const window of scene.windows) {
      assert(!scene.windowless, `${id}: observation rooms and windowless rooms keep their original walls`);
      assert(window.image.endsWith('/assets/background/rooftop/rooftop-finished.png")'), `${id}: the exterior shares the rooftop city`);
      assert(window.rect[0] >= 32 && window.rect[0] + window.rect[2] <= scene.width - 32);
      for (const door of scene.doors) assert(!overlap(window.rect, door), `${id}: the exterior stops at door frames`);
      windows++;
    }
    if (scene.windows.length) {
      const unpowered = await page.evaluate(() => {
        setAllFloorsPower(false); solarEnabled = false; updatePowerState();
        return [...dynamicScene.querySelectorAll('.exterior-window')].map(element => {
          const style = getComputedStyle(element);
          return { image: style.backgroundImage, position: style.backgroundPosition, filter: style.filter };
        });
      });
      assert.deepEqual(unpowered, scene.windows.map(({ image, position, filter }) => ({ image, position, filter })),
        `${id}: a local power failure does not switch off the neighbouring buildings`);
      await page.evaluate(() => setAllFloorsPower(true));
    }
  }
  assert(windows >= 25, 'The upper-floor exterior windows are all exercised');
  for (const viewport of [{ width: 1920, height: 1080 }, { width: 2560, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.clock.runFor(34);
    const framing = await page.evaluate(() => {
      performFloorChange('f17-manager', 0, 'exit'); render();
      const scene = dynamicScene.getBoundingClientRect();
      return { left: scene.left, right: innerWidth - scene.right, width: scene.width,
        scale, expectedWidth: worldWidth * scale, player: sprite.getBoundingClientRect() };
    });
    assert(Math.abs(framing.left - framing.right) < 1, 'Small rooms stay centred on desktop and ultrawide screens');
    assert(Math.abs(framing.width - framing.expectedWidth) < 1, 'Room framing preserves sprite scale');
    assert(framing.player.left >= framing.left && framing.player.right <= viewport.width - framing.right);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${ids.length} scenes, sprite aspect ratios and floor alignment, opaque doorway/furniture clearance, ${windows} exterior windows and independent exterior lighting.`);
} finally {
  await browser.close();
}
