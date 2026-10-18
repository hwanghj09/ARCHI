import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { reachInitialCorridor } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
    const state = () => page.evaluate(() => ({ blackout: buildingBlackout, powered: world.dataset.powered,
      lights: world.dataset.backgroundLights, called: elevatorCars.some(car => car.travelling) }));
    assert.deepEqual(await state(), { blackout: false, powered: 'true', lights: 'on', called: false });
    assert(await page.locator('#darkness').isHidden());
    if (viewport.width === 1280) {
      // 오프닝 대사에서 멈춰 클릭을 기다리면(scene-gate.js) 화면을 클릭해 넘기며 끝까지 본다.
      for (let i = 0; i < 10 && await page.evaluate(() => openingActive); i++) {
        await page.clock.runFor(1500);
        if (await page.evaluate(() => openingGate.waiting)) await page.evaluate(() => opening.click());
      }
    }
    else await page.locator('#opening-skip').click();
    assert(await page.locator('#opening').isHidden());
    assert.equal(await page.locator('#office-computer').getAttribute('data-power'), 'off');
    assert.equal((await state()).lights, 'on', 'Computer shutdown leaves room lights on');
    await page.screenshot({ path: `.local/blackout-office-lit-${viewport.width}.png` });
    await reachInitialCorridor(page);
    assert.equal((await state()).blackout, false, 'Leaving the office does not cause the outage');
    // Walk to just outside the existing call range, then jump into it.
    const distance = await page.evaluate(() => doors[0].x - 40 - body.position.x);
    await page.keyboard.down('d'); await page.clock.runFor(distance / 200 * 1000); await page.keyboard.up('d');
    await page.clock.runFor(34);
    assert.equal((await state()).blackout, false, 'Corridor stays lit until the call position');
    await page.screenshot({ path: `.local/blackout-corridor-lit-${viewport.width}.png` });
    // 밝은 복도에서는 플래시를 켜도 노란 빛 쐐기를 그림 위에 깔지 않는다(빛 색은 어둠 막이 있을 때만).
    await page.evaluate(() => { phoneLightOn = true; refreshPhone(); });
    assert(await page.locator('#flashlight-beam').isHidden(), 'A flashlight in the lit corridor adds no beam tint over the art');
    await page.evaluate(() => { phoneLightOn = false; refreshPhone(); });
    await page.keyboard.press('Space'); await page.keyboard.down('d');
    await page.clock.runFor(200); await page.keyboard.up('d');
    assert.equal((await state()).blackout, false, 'Only standing in the call range triggers the outage');
    await page.clock.runFor(1000);
    assert.equal(await page.evaluate(() => blackoutSceneActive), true, 'Landing starts the call attempt cutscene');
    assert.equal((await state()).blackout, false, 'Approach is still illuminated');
    const phases = new Set();
    for (let i = 0; i < 80 && await page.evaluate(() => blackoutSceneActive); i++) {
      phases.add(await page.locator('#world').getAttribute('data-power-flicker'));
      // 대사에서 멈춰 클릭을 기다리면(scene-gate.js) 화면을 클릭해 넘긴다.
      if (await page.evaluate(() => blackoutGate.waiting)) await page.evaluate(() => blackoutScene.click());
      await page.clock.runFor(100);
    }
    assert(phases.has('off') && phases.has('on'), 'Lights flicker before the permanent outage');
    assert.equal(await page.evaluate(() => blackoutSceneActive), false);
    // 정전 직후 혼잣말(story-scene.js)은 조작을 막으므로 건너뛰고 이어서 검사한다.
    assert(await page.locator('#story-scene').isVisible(), 'The blackout monologue follows the outage');
    await page.locator('#story-skip').click();
    assert.deepEqual(await state(), { blackout: true, powered: 'false', lights: 'off', called: false });
    assert(await page.locator('#darkness').isVisible());
    assert(await page.locator('img[data-lit-src]').evaluateAll(imgs => imgs.every(img => img.getAttribute('src') === img.dataset.unlitSrc)),
      'Both office and corridor switch to their unlit art');
    await page.locator('img[data-lit-src]').evaluateAll(imgs => Promise.all(imgs.map(img => img.decode())));
    await page.screenshot({ path: `.local/blackout-elevator-${viewport.width}.png` });
    if (viewport.width === 1280) {
      // 정전 중에는 엘리베이터 문도 배경처럼 어둠 막 아래에 깔리고, 플래시 빛은 문 위에 겹쳐 문 경계에서 끊기지 않는다.
      const layers = await page.evaluate(() => [doors[0].element, ...['flashlight-beam', 'darkness', 'player', 'interaction-hint']
        .map(id => document.getElementById(id))].map(el => el.parentElement === world && Number(getComputedStyle(el).zIndex)));
      assert(layers.every((z, i) => z !== false && (i === 0 || z > layers[i - 1])), `Door < beam < darkness < player < hint in #world: ${layers}`);
      const saved = await page.evaluate(() => ({ x: body.position.x, y: body.position.y, cameraX }));
      const place = (x, light) => page.evaluate(([x, light]) => {
        releaseInput(); facing = 1; phoneLightOn = light;
        Body.setPosition(body, { x, y: floorY - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
        grounded = true; animate(0); refreshPhone(); cameraX = x - 500; updateInteraction(); render();
        return parseFloat(world.style.getPropertyValue('--beam-y'));
      }, [x, light]);
      const pixel = async (x, y) => {
        const clip = await page.evaluate(([x, y]) => {
          const rect = world.getBoundingClientRect();
          return { x: Math.round(rect.left + x * scale), y: Math.round(rect.top + y * scale), width: 1, height: 1 };
        }, [x, y]);
        const shot = await page.screenshot({ clip });
        return page.evaluate(async src => {
          const img = new Image(); img.src = src; await img.decode();
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          return r + g + b;
        }, `data:image/png;base64,${shot.toString('base64')}`);
      };
      const hidden = async (selector, read) => {
        await page.locator(selector).evaluate(el => { el.style.visibility = 'hidden'; });
        const value = await read();
        await page.locator(selector).evaluate(el => { el.style.visibility = ''; });
        return value;
      };
      const door = await page.evaluate(() => ({ x: doors[0].x, width: doors[0].width }));
      await place(door.x - 380, false);
      const farDoor = () => pixel(door.x + door.width * .25, 400);
      const darkDoor = await farDoor();
      const bareDoor = await hidden('#darkness', farDoor);
      assert(darkDoor <= 3 && bareDoor >= 30, `An elevator door outside the sight circle is as dark as the wall: ${darkDoor} (door art ${bareDoor})`);
      await page.screenshot({ path: '.local/blackout-door-dark.png' });
      const beamY = await place(door.x - 180, true);
      const litDoor = () => pixel(door.x + 40, beamY);
      const beamed = await litDoor();
      const unbeamed = await hidden('#flashlight-beam', litDoor);
      assert(beamed >= unbeamed + 15, `The flashlight beam tints the elevator door it reaches: ${beamed} vs ${unbeamed} without the beam`);
      await page.screenshot({ path: '.local/blackout-door-flashlight.png' });
      await page.evaluate(({ x, y, cameraX: savedCamera }) => {
        phoneLightOn = false; refreshPhone();
        Body.setPosition(body, { x, y }); Body.setVelocity(body, { x: 0, y: 0 });
        grounded = true; animate(0); cameraX = savedCamera; updateInteraction(); render();
      }, saved);
    }
    await page.keyboard.press('e');
    assert.equal((await state()).called, false, 'Elevator is stopped until rooftop emergency power is enabled');
    await page.evaluate(() => { performRoomChange(); });
    assert.equal((await state()).lights, 'off', 'Office remains dark on return');
    await page.evaluate(() => { solarEnabled = true; solarPoweredFloors = [17]; updatePowerState(); performRoomChange(); });
    await page.keyboard.press('e');
    assert.equal((await state()).called, false, 'Solar lighting alone leaves elevators stopped');
    await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
    await page.keyboard.press('e');
    assert.deepEqual(await state(), { blackout: true, powered: 'true', lights: 'on', called: true });
    assert(await page.locator('#darkness').isHidden(), 'Returning to the elevator does not repeat the outage after restoration');
    await page.evaluate(() => performFloorChange('f16'));
    assert.equal((await state()).powered, 'true', 'Emergency equipment bus also supplies other floors independently of their lights');
    await page.evaluate(() => performFloorChange('b1'));
    assert.equal((await state()).powered, 'true', 'Basement emergency circuit remains operational');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: bright opening and corridor, grounded approach triggers one outage before calling, persistence, solar recovery, basement emergency power, desktop and mobile.');
} finally {
  await browser.close();
}
