import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { measurePropOutlines } from '../scripts/build-prop-outlines.mjs';

// 근접 테두리는 대상마다 요소 상자가 아니라 보이는 물체 상자(outline)를 감싼 한 장(#interaction-outline)이다.
const html = await readFile('index.html', 'utf8');
assert(html.includes('id="interaction-outline"') && html.includes('js/interaction/outline.js') && html.includes('js/scene/prop-outlines.js'));
assert(!/\.near\s*\{[^}]*outline/.test(await readFile('css/game.css', 'utf8')), 'Per-element .near outlines are replaced by #interaction-outline');

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);

  assert.deepEqual(await page.evaluate(() => PROP_OUTLINES), await measurePropOutlines(page),
    'js/scene/prop-outlines.js must match the prop sprites: run node scripts/build-prop-outlines.mjs');

  // Every interactable in every scene has a non-empty outline that sits over its hit range and above the floor line.
  const problems = await page.evaluate(() => {
    const found = [];
    const scenes = ['office', ...floorById.keys()];
    for (const scene of scenes) {
      closeInspection();
      if (scene === 'office') {
        performFloorChange('f17', 0);
        performRoomChange();
      } else {
        const dest = floorById.get(scene);
        const fromCorridor = dest.interior && floorById.get(dest.parent).rooms?.some(entry => entry.target === scene);
        performFloorChange(scene, scene === 'rooftop' ? null : 0,
          dest.interior ? (fromCorridor ? 'exit' : `link:${dest.links[0].target}`) : null);
      }
      const active = room === 'dynamic' ? currentDoors : room === 'corridor' ? [...doors, officeDoors[0]] : [officeDoors[1]];
      for (const door of active) {
        const [x, y, width, height] = outlineBox(door);
        const label = `${scene} · ${door.name || door.type}`;
        if (!(width > 0 && height > 0)) found.push(`${label}: empty outline`);
        if (x > door.x + door.width + 28 || x + width < door.x - 28) {
          found.push(`${label}: outline x ${Math.round(x)}..${Math.round(x + width)} is away from its hit range ${door.x}..${door.x + door.width}`);
        }
        if (y < 0 || y + height > floorY + 2) found.push(`${label}: outline y ${Math.round(y)}..${Math.round(y + height)} leaves the wall`);
      }
    }
    return found;
  });
  assert.deepEqual(problems, []);

  const stand = (scene, name) => page.evaluate(([scene, name]) => {
    closeInspection();
    if (scene !== dynamicFloorId || room !== 'dynamic') performFloorChange(scene, 0, floorById.get(scene).interior ? 'exit' : null);
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true;
    updateInteraction();
    if (nearbyDoor !== door) throw new Error(`Wrong interaction target: ${name}`);
    const box = element => ['left', 'top', 'width', 'height'].map(key => parseFloat(element.style[key]));
    return { hidden: interactionOutline.hidden, outline: box(interactionOutline), element: box(door.element), near: door.element.classList.contains('near') };
  }, [scene, name]);

  // Sprite props: the outline wraps the drawn sprite inside its padded canvas, not the canvas.
  const bin = await stand('f17-restroom', '휴지통');
  assert(!bin.hidden && bin.near);
  const [ox, oy, ow, oh] = bin.outline;
  const [ex, ey, ew, eh] = bin.element;
  assert(ox > ex && oy >= ey && ox + ow < ex + ew && oy + oh <= ey + eh && ow < ew, `The bin outline ${bin.outline} sits inside its canvas ${bin.element}`);

  // Art doors and fixtures use measured boxes; relocated exits move the highlight with the painted door.
  assert.deepEqual((await stand('f1', 'Harmony Hall')).outline, [204, 261, 237, 296]);
  const robot = await stand('f1', '경비 로봇');
  assert.deepEqual(robot.outline, await page.evaluate(() => [guardPatrol.x - 70, floorY - 198, 140, 198]));
  assert.deepEqual((await stand('f1-harmony', '복도')).outline, [903, 257, 265, 311]);
  // Without an outline the element box is used.
  const elevator = await stand('f5', '1번 엘리베이터');
  assert.deepEqual(elevator.outline, elevator.element);

  // Walking away hides it; it never lingers on a door of the previous scene.
  assert(await page.evaluate(() => {
    Body.setPosition(body, { x: 1100, y: floorY - 81 });
    updateInteraction();
    return interactionOutline.hidden && !nearbyDoor;
  }));
  assert(await page.evaluate(() => {
    const stairs = currentDoors.find(door => door.type === 'stairs');
    Body.setPosition(body, { x: stairs.x + stairs.width / 2, y: floorY - 81 });
    updateInteraction();
    performFloorChange('f17-restroom', 0, 'exit');
    return interactionOutline.hidden === !nearbyDoor && (!nearbyDoor || nearbyDoor === currentDoors.find(door => door.key === 'exit'));
  }));
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
console.log('interaction outline checks passed');
