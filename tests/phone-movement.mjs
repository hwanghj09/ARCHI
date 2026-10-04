import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.evaluate(() => triggerBuildingBlackout());
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  await page.clock.runFor(100);
  for (const motion of ['walk', 'run']) {
    const frames = motion === 'walk' ? 6 : 8;
    for (const light of ['off', 'on']) {
      const png = await readFile(`assets/player/jeong-suho-phone-${motion}-${light}.png`);
      const cells = await page.evaluate(async ({ src, frames, motion }) => {
        const img = new Image(); img.src = src; await img.decode();
        if (img.naturalWidth !== frames * 256 || img.naturalHeight !== 256) return [];
        const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        return Array.from({ length: frames }, (_, frame) => {
          ctx.clearRect(0, 0, 256, 256); ctx.drawImage(img, -frame * 256, 0);
          const pixels = ctx.getImageData(0, 0, 256, 256).data;
          let top = 256, bottom = 0, count = 0, edge = 0;
          for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
            if (pixels[(y * 256 + x) * 4 + 3] < 32) continue;
            top = Math.min(top, y); bottom = Math.max(bottom, y); count++;
            if (x === 0 || x === 255 || y === 0 || y === 255) edge++;
          }
          sprite.dataset.state = motion; sprite.dataset.frame = frame; render();
          const ledX = Math.round((parseFloat(world.style.getPropertyValue('--beam-x')) - body.position.x) * facing / .75 + 128);
          const ledY = Math.round((parseFloat(world.style.getPropertyValue('--beam-y')) - body.bounds.max.y + 178) / .75);
          let led = 0;
          for (let y = ledY - 2; y <= ledY + 2; y++) for (let x = ledX - 2; x <= ledX + 2; x++) {
            const offset = (y * 256 + x) * 4;
            led = Math.max(led, Math.min(...pixels.slice(offset, offset + 3)) * pixels[offset + 3] / 255);
          }
          return { top, bottom, count, edge, led, sample: canvas.toDataURL() };
        });
      }, { src: `data:image/png;base64,${png.toString('base64')}`, frames, motion });
      assert.equal(cells.length, frames, `${motion}/${light}: sheet dimensions`);
      assert.equal(new Set(cells.map(cell => cell.sample)).size, frames, 'Distinct animation phases');
      for (const cell of cells) {
        assert(cell.top > 5 && cell.top < 55 && cell.bottom >= 216 && cell.bottom <= 239,
          `${motion}/${light}: full body and calibrated foot line ${JSON.stringify({ top: cell.top, bottom: cell.bottom })}`);
        assert(cell.count > 6000 && cell.count < 33000 && cell.edge === 0, 'Transparent margins without clipped sprites');
        if (light === 'on') assert(cell.led > 210, 'Beam origin overlaps the painted phone LED in every frame');
      }
    }
  }
  const state = () => page.locator('#player').evaluate(el => ({ ...el.dataset }));
  const active = () => page.locator('#player img:visible');
  await page.keyboard.press('p');
  await page.keyboard.press('p');
  assert.equal((await state()).state, 'phone-away', 'Closing with the flashlight OFF automatically puts the phone away');
  await page.clock.runFor(400);
  assert.equal((await state()).state, 'idle');
  await page.evaluate(() => {
    performFloorChange('f16', 0, null);
    Body.setPosition(body, { x: 1450, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render();
  });
  for (const direction of ['d', 'a']) for (const sprinting of [false, true]) {
    const motion = sprinting ? 'run' : 'walk';
    await page.keyboard.down(direction);
    if (sprinting) await page.keyboard.down('Shift');
    await page.clock.runFor(120);
    assert.equal((await state()).state, motion);
    const before = await page.evaluate(() => ({ x: body.position.x, phase: walkDistance + runDistance }));
    for (const light of ['on', 'off']) {
      const activeMotion = light === 'on' ? 'walk' : motion;
      await page.keyboard.press('f');
      await page.clock.runFor(34);
      await active().evaluate(img => img.decode());
      assert.equal(await active().count(), 1, 'Exactly one character sheet is displayed');
      assert.equal((await state()).state, activeMotion, 'Light ON forces walking even with Shift held');
      assert.equal(await active().getAttribute('id'), `${light === 'on' ? 'phone-' : ''}${activeMotion}-sheet`);
      if (light === 'on') assert((await active().getAttribute('src')).endsWith(`${activeMotion}-on.png`));
      assert(await page.evaluate(running => Math.abs(Math.abs(body.velocity.x) - (running ? runSpeed : speed) / 60) < .01,
        activeMotion === 'run'), 'Physics speed matches the allowed gait');
      assert.equal(await page.locator('#world').getAttribute('data-flashlight'), light);
      const pose = await page.evaluate(() => ({ facing, x: body.position.x, beamX: parseFloat(world.style.getPropertyValue('--beam-x')),
        angle: world.style.getPropertyValue('--beam-angle'), phase: walkDistance + runDistance }));
      assert.equal(pose.facing, direction === 'd' ? 1 : -1);
      assert((pose.beamX - pose.x) * pose.facing > 15, 'Beam originates at the forward hand');
      assert.equal(pose.angle, direction === 'd' ? '68deg' : '248deg');
      assert((pose.x - before.x) * pose.facing > 0, 'Light toggle does not block movement');
      if (!sprinting) assert(pose.phase > before.phase, 'Light toggle preserves walking stride phase');
      assert(await active().evaluate(el => {
        const frames = el.naturalWidth / 256;
        return Math.abs(new DOMMatrix(getComputedStyle(el).transform).m41 + Number(el.parentElement.dataset.frame) * 192) < .01 &&
          el.clientWidth === frames * 192;
      }), 'Frame transform selects one complete cell');
      await page.screenshot({ path: `.local/phone-${activeMotion}-${light}-${direction}.png` });
    }
    await page.keyboard.up(direction);
    if (sprinting) await page.keyboard.up('Shift');
    await page.clock.runFor(34);
  }
  await page.keyboard.press('f');
  await page.keyboard.press('Space');
  await page.clock.runFor(150);
  assert.equal((await state()).state, 'jump');
  assert.equal(await active().getAttribute('id'), 'phone-run-sheet', 'Airborne pose retains the lit phone');
  await page.clock.runFor(1200);
  await page.evaluate(() => { phoneBattery = 1; phoneDrainAccumulator = 0; });
  await page.keyboard.down('d');
  await page.clock.runFor(1100);
  assert.equal(await page.locator('#world').getAttribute('data-flashlight'), 'off');
  assert.equal(await active().getAttribute('id'), 'walk-sheet', 'Battery exhaustion restores empty-handed movement');
  await page.keyboard.up('d');
  await page.keyboard.press('f');
  assert.equal(await page.evaluate(() => phoneLightOn), false, 'Empty battery cannot turn on');
  await page.keyboard.press('p');
  await page.locator('#phone-close').click();
  assert.equal((await state()).state, 'phone-away');
  await page.clock.runFor(400);
  assert.equal((await state()).state, 'idle');
  await page.keyboard.down('d'); await page.clock.runFor(100); await page.keyboard.up('d');
  assert.equal(await active().getAttribute('id'), 'walk-sheet', 'Stowing restores ordinary movement');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#phone-button').click();
  await page.evaluate(() => { phoneBattery = 50; refreshPhone(); });
  await page.locator('#phone-light').click();
  await page.locator('#phone-close').click();
  await page.locator('nav [data-direction="-1"]').dispatchEvent('pointerdown', { pointerId: 1, button: 0 });
  await page.clock.runFor(100);
  assert.equal(await active().getAttribute('id'), 'phone-walk-sheet');
  assert((await active().getAttribute('src')).endsWith('walk-on.png'));
  await page.screenshot({ path: '.local/phone-walk-mobile.png' });
  await page.locator('nav [data-direction="-1"]').dispatchEvent('pointerup', { pointerId: 1, button: 0 });
  // Sample the actual CSS darkness mask over white to verify forward light and dark rear.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.clock.runFor(34);
  await page.addStyleTag({ content: '#world { background: white !important; } #world > * { visibility: hidden; } #world > #darkness { visibility: visible; }' });
  for (const facingDirection of [1, -1]) {
    await page.evaluate(direction => {
      releaseInput(); facing = direction; phoneLightOn = true;
      Body.setPosition(body, { x: 1500, y: floorY - 81 });
      grounded = true; animate(0); refreshPhone(); cameraX = 860; render();
    }, facingDirection);
    const shot = await page.screenshot({ path: `.local/phone-mask-${facingDirection}.png` });
    // Screenshot flushes native ResizeObserver callbacks even while the game clock is paused.
    const origin = await page.evaluate(() => {
      const rect = world.getBoundingClientRect();
      return { x: rect.left + parseFloat(world.style.getPropertyValue('--beam-x')) * scale,
        y: rect.top + parseFloat(world.style.getPropertyValue('--beam-y')) * scale, distance: 200 * scale };
    });
    const [front, rear] = await page.evaluate(async ({ src, origin, direction }) => {
      const img = new Image(); img.src = src; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
      return [1, -1].map(side => ctx.getImageData(Math.round(origin.x + side * direction * origin.distance), Math.round(origin.y), 1, 1).data[0]);
    }, { src: `data:image/png;base64,${shot.toString('base64')}`, origin, direction: facingDirection });
    assert(front > 100 && rear < 20, `Directional mask ${facingDirection} illuminates ahead only: ${front}/${rear} at ${JSON.stringify(origin)}`);
  }
  assert.deepEqual(errors, []);
  console.log('PASS: transparent sheets, every frame/LED, both directions, flashlight-only carrying, sprint gating, jump, automatic stow, battery, touch and directional light.');
} finally {
  await browser.close();
}
