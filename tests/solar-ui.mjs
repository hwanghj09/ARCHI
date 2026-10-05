import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1280, 390]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 720 }, hasTouch: width === 390 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.locator('#opening-skip').click();
    await page.evaluate(() => {
      triggerBuildingBlackout(); performFloorChange('rooftop', null);
      Body.setPosition(body, { x: 900, y: floorY - 81 }); grounded = true; updateInteraction(); render();
    });
    await page.keyboard.press('e');
    const lever = page.locator('#power-lever');
    const floor = number => page.locator(`#power-floor-grid [data-floor="${number}"]`);
    const state = () => page.evaluate(() => ({ on: solarEnabled, floor: solarPoweredFloor }));
    assert(await page.locator('#power-panel').isVisible());
    assert(await lever.evaluate(el => el === document.activeElement));
    assert(await floor(17).isDisabled());
    await floor(17).dispatchEvent('click');
    assert.deepEqual(await state(), { on: false, floor: null }, 'Floor cannot supply power before the lever is down');
    const source = `data:image/png;base64,${(await readFile('assets/ui/power/panel-off-on.png')).toString('base64')}`;
    const bounds = await page.locator('.power-art img').evaluate(async (img, source) => {
      await img.decode();
      const sample = new Image(); sample.src = source; await sample.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const ctx = c.getContext('2d'); ctx.drawImage(sample, 0, 0);
      return { size: [c.width, c.height], corners: [ctx.getImageData(0, 0, 1, 1).data[3], ctx.getImageData(384, 0, 1, 1).data[3]],
        scale: img.clientWidth / img.parentElement.clientWidth };
    }, source);
    assert.deepEqual(bounds, { size: [768, 512], corners: [0, 0], scale: 2 });
    await page.screenshot({ path: `.local/solar-panel-off-${width}.png` });
    if (width === 390) await lever.tap();
    else {
      const box = await lever.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + 30); await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 30, { steps: 12 }); await page.mouse.up();
    }
    assert.deepEqual(await state(), { on: true, floor: null }, 'Lowering the lever enables selection without choosing a floor');
    assert(await floor(17).isEnabled());
    assert.equal(await page.locator('.solar-supply').getAttribute('data-active'), 'true');
    assert(await page.locator('.power-art img').evaluate(img => Math.abs(new DOMMatrix(getComputedStyle(img).transform).m41 + img.clientWidth / 2) < 1));
    await floor(17).focus(); await page.keyboard.press('Enter');
    assert.deepEqual(await state(), { on: true, floor: 17 });
    await floor(16).click();
    assert.equal(await floor(17).getAttribute('aria-pressed'), 'false');
    assert.equal(await floor(16).getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `.local/solar-panel-on-${width}.png` });
    const layout = await page.locator('#power-panel').evaluate(panel => [...panel.querySelectorAll('button')].every(button => {
      const r = button.getBoundingClientRect();
      return r.width >= 30 && r.height >= 30 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    }));
    assert(layout, 'Every control fits the viewport and remains touchable');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
    await page.keyboard.press('e');
    assert.deepEqual(await state(), { on: true, floor: 16 }, 'Closing and reopening preserves supply');
    if (width === 1280) {
      const box = await lever.boundingBox();
      // Dragging down again must leave an already lowered lever ON.
      await page.mouse.move(box.x + box.width / 2, box.y + 30); await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 30, { steps: 8 }); await page.mouse.up();
      assert.deepEqual(await state(), { on: true, floor: 16 });
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 8 }); await page.mouse.up();
    } else { await lever.focus(); await page.keyboard.press('Space'); }
    assert.deepEqual(await state(), { on: false, floor: null }, 'Raising the lever disconnects supply and clears floor selection');
    assert(await floor(16).isDisabled());
    await page.keyboard.press('Tab');
    assert(await page.locator('#power-close').evaluate(el => el === document.activeElement), 'Tab skips disabled floors');
    await page.keyboard.press('Enter');
    assert(await page.locator('#power-panel').isHidden());
    await page.evaluate(() => performFloorChange('f16'));
    assert.equal(await page.locator('#world').getAttribute('data-powered'), 'false');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: sprite dimensions/alpha, OFF gate, downward drag, touch, keyboard, one-floor output, persistence, OFF reset, scene synchronization and mobile.');
} finally { await browser.close(); }
