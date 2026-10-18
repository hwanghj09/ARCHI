import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

await mkdir('.local/horror-staging', { recursive: true });
const browser = await chromium.launch();
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 720 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.setDefaultTimeout(10000);
    await page.clock.install({ time: new Date('2026-10-18T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.locator('#opening-skip').click();
    await page.clock.pauseAt(new Date('2026-10-18T00:01:00Z'));
    assert.deepEqual(errors, [], 'Game starts without script errors');
    assert.equal(await page.evaluate(() => sanity), 85);
    const layout = await page.evaluate(() => {
      performFloorChange('b1');
      clearHallucinationEvents();
      collectedItems.add('b1-lights-out'); buildingBlackout = true; updatePowerState();
      sanity = 25; phoneBattery = 100; phoneLightOn = true; refreshPhone();
      updateSanity(0); render();
      startAmbientSighting(); hallucinationLife = 1000; render();
      return {
        inWorld: world.contains(hallucinations),
        width: hallucinationShadow.offsetWidth,
        top: parseFloat(hallucinationShadow.style.top),
        height: hallucinationShadow.offsetHeight,
        floor: floorY,
        stageAnimation: getComputedStyle(stage).animationName,
        layerAnimation: getComputedStyle(hallucinations).animationName,
        restored: ['dark-face', 'red-eyes', 'blink-flash', 'devoured-video', 'fear-overlay-red', 'hallucination-effects'].every(id => document.getElementById(id)),
      };
    });
    assert(layout.inWorld && layout.restored);
    assert.equal(layout.width, 192, 'Apparition uses the character frame size');
    assert.equal(layout.top + 178, layout.floor, 'Feet share the world floor');
    assert.equal(layout.stageAnimation, 'none'); assert.equal(layout.layerAnimation, 'none');

    const fixed = await page.evaluate(() => {
      const before = hallucinationShadow.getBoundingClientRect().x;
      cameraX += 40; render();
      const after = hallucinationShadow.getBoundingClientRect().x;
      cameraX -= 40; render();
      return { movement: after - before, expected: -40 * scale };
    });
    assert(Math.abs(fixed.movement - fixed.expected) < .1, 'Camera moves past the apparition without screen clamping');

    const rhythm = await page.evaluate(() => {
      endHallucinationSighting();
      const cooldown = ambientNextIn;
      updateAmbientSighting(180000, false);
      const sameRoom = hallucinationMode;
      ambientSeenScene = null; ambientTimer = 0; ambientNextIn = 45000;
      updateAmbientSighting(44999, false); const early = hallucinationMode;
      updateAmbientSighting(1, false); const onTime = hallucinationMode;
      return { cooldown, sameRoom, early, onTime };
    });
    assert(rhythm.cooldown >= 45000 && rhythm.cooldown <= 90000);
    assert.equal(rhythm.sameRoom, null, 'A room does not repeat its ambient apparition');
    assert.equal(rhythm.early, null); assert.equal(rhythm.onTime, 'ambient');

    const warning = await page.evaluate(() => {
      clearHallucinationEvents(); sanity = 0; phoneLightOn = true; facing = 1; refreshPhone();
      startZeroCharge(); facing = -zeroEventSide;
      const startX = zeroEventGhostX;
      updateZeroEvent(1700, false); render();
      return { startX, x: zeroEventGhostX, light: phoneLightOn, caught: hallucinationCaught,
        width: hallucinationShadow.offsetWidth, timer: zeroEventTimer, side: zeroEventSide };
    });
    assert(warning.light && !warning.caught);
    assert.equal(warning.x, warning.startX, 'Warning lasts 1.8 seconds before movement');
    assert.equal(warning.width, layout.width, 'Chase never enlarges the apparition');
    const prompt = await page.locator('#flash-prompt').boundingBox();
    assert(prompt.x >= 0 && prompt.x + prompt.width <= (mobile ? 390 : 1280));
    assert(prompt.y > (mobile ? 844 : 720) * .6, 'Compact cue stays below the action');
    assert.equal(await page.locator('#flash-prompt').evaluate(el => getComputedStyle(el).animationName), 'none');

    await page.evaluate(() => { updateZeroEvent(500, false); render(); });
    assert(await page.evaluate(() => !hallucinationCaught && hallucinationShadow.dataset.walking === 'true'));
    assert.notEqual(await page.evaluate(() => zeroEventGhostX), warning.startX);
    await page.screenshot({ path: `.local/horror-staging/chase-${mobile ? 'mobile' : 'desktop'}.png` });
    await page.evaluate(() => { facing = zeroEventSide; updateZeroEvent(200, false); });
    assert.equal(await page.evaluate(() => hallucinationMode), 'charge', 'A brief sweep does not finish the event');
    await page.evaluate(() => updateZeroEvent(150, false));
    assert.equal(await page.evaluate(() => hallucinationMode), null, 'Holding the beam for 350ms repels it');

    await page.evaluate(() => {
      startZeroCharge(); facing = zeroEventSide; phoneLightOn = true; render();
      world.style.setProperty('--beam-y', (floorY - 500) + 'px');
      updateZeroEvent(400, false);
    });
    assert.equal(await page.evaluate(() => hallucinationMode), 'charge', 'Facing the figure is insufficient when a jumping flashlight misses it');
    await page.evaluate(() => { render(); updateZeroEvent(350, false); });
    assert.equal(await page.evaluate(() => hallucinationMode), null);

    for (const blocked of ['battery', 'dock', 'inspection', 'story', 'phone', 'scene']) {
      await page.evaluate(blocked => {
        clearHallucinationEvents(); sanity = 0; phoneBattery = 100; phoneDock = null; phoneLightOn = false;
        startZeroCharge();
        if (blocked === 'battery') phoneBattery = 0;
        if (blocked === 'dock') phoneDock = { floor: -1 };
        if (blocked === 'inspection') usingInspection = true;
        if (blocked === 'story') storySceneActive = true;
        if (blocked === 'phone') usingPhone = true;
        if (blocked === 'scene') { performFloorChange('f17'); render(); }
        else updateSanity(16);
      }, blocked);
      assert.equal(await page.evaluate(() => hallucinationMode), null, `${blocked} safely ends the event`);
      await page.evaluate(() => { phoneDock = null; usingInspection = storySceneActive = usingPhone = false; });
    }

    const failure = await page.evaluate(() => {
      performFloorChange('b1'); sanity = 0; phoneBattery = 100; phoneLightOn = false;
      facing = 1; releaseInput();
      keys.add(Object.keys(movementKeys).find(code => movementKeys[code] === -1));
      update(); const turned = facing === -1;
      releaseInput(); Body.setVelocity(body, { x: 0, y: 0 });
      clearHallucinationEvents(); startZeroCharge();
      for (let i = 0; i < 140; i++) updateZeroEvent(20, false);
      const safeDuringReaction = !hallucinationCaught;
      for (let i = 0; i < 150 && !hallucinationCaught; i++) updateZeroEvent(20, false);
      return { turned, safeDuringReaction, caught: hallucinationCaught };
    });
    assert(failure.turned, 'Even at zero sanity, direction changes on the first input frame');
    assert(failure.safeDuringReaction && failure.caught, 'Unavoided contact still matters after a fair reaction window');
    await page.locator('#hallucination-retry').click();
    assert(await page.evaluate(() => sanity >= 50 && !hallucinationCaught), 'Retry provides a calm recovery');

    if (!mobile) {
      await page.evaluate(() => {
        performFloorChange('b1'); collectedItems.add('b1-lights-out'); updatePowerState();
        sanity = 25; updateSanity(0); phoneLightOn = false; refreshPhone(); render();
        startAmbientSighting(); hallucinationAnchorX = body.position.x + 220; hallucinationSide = 1;
        hallucinationLife = 1000; render();
      });
      const box = await page.locator('#hallucination-shadow').boundingBox();
      const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
      const pixels = async () => sharp(await page.screenshot({ clip })).removeAlpha().raw().toBuffer();
      const difference = (a, b) => a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0);
      const dark = await pixels();
      await page.evaluate(() => { hallucinationShadow.hidden = true; });
      const darkEmpty = await pixels();
      await page.evaluate(() => { hallucinationShadow.hidden = false; phoneLightOn = true; facing = 1; refreshPhone(); render(); });
      const lit = await pixels();
      await page.evaluate(() => { hallucinationShadow.hidden = true; });
      const litEmpty = await pixels();
      assert(difference(lit, litEmpty) > difference(dark, darkEmpty) + 1000, 'Actual darkness hides the figure; the flashlight reveals it');
      await page.evaluate(() => {
        hallucinationShadow.hidden = false;
        const cover = document.createElement('div'); cover.id = 'test-cover'; cover.className = 'floor-prop';
        Object.assign(cover.style, { left: hallucinationShadow.style.left, top: hallucinationShadow.style.top, width: '192px', height: '192px', background: '#53614a' });
        world.append(cover);
      });
      const covered = await pixels();
      await page.evaluate(() => { hallucinationShadow.hidden = true; });
      const coveredEmpty = await pixels();
      assert.equal(difference(covered, coveredEmpty), 0, 'Foreground props really occlude the figure');
      await page.evaluate(() => { document.getElementById('test-cover').remove(); hallucinationShadow.hidden = false; });
      await page.screenshot({ path: '.local/horror-staging/flashlight-desktop.png' });
    }
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: grounded world figures, lighting/occlusion, restored effects, rare sightings, fair chase, responsive layout, safe interruption');
} finally { await browser.close(); }
