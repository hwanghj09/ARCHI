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
    const state = () => page.evaluate(() => ({ on: solarEnabled, floors: [...solarPoweredFloors] }));
    // The status reads like '12F · 7F 전력 공급 중 (2/2)' and must stay on one line inside its painted window.
    const status = async text => {
      assert.equal(await page.locator('#power-status').textContent(), text);
      assert(await page.locator('#power-status').evaluate(el => {
        const range = document.createRange(); range.selectNodeContents(el);
        const box = el.getBoundingClientRect(); const text = range.getClientRects();
        return text.length === 1 && text[0].left >= box.left - 1 && text[0].right <= box.right + 1;
      }), `${text}: fits on one line`);
    };
    const pressed = async (on, off) => {
      for (const number of on) assert.equal(await floor(number).getAttribute('aria-pressed'), 'true', `${number}F lit`);
      for (const number of off) assert.equal(await floor(number).getAttribute('aria-pressed'), 'false', `${number}F unlit`);
      assert.equal(await page.locator('#power-floor-grid button.active').count(), on.length);
    };
    assert(await page.locator('#power-panel').isVisible());
    assert(await lever.evaluate(el => el === document.activeElement));
    assert(await floor(17).isDisabled());
    await floor(17).dispatchEvent('click');
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Floor cannot supply power before the lever is down');
    await status('비상 전력 꺼짐');
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
    assert.deepEqual(await state(), { on: true, floors: [] }, 'Lowering the lever enables selection without choosing a floor');
    await status('공급할 층 선택 (0/2)');
    assert(await floor(17).isEnabled());
    assert.equal(await page.locator('.solar-supply').getAttribute('data-active'), 'true');
    assert(await page.locator('.power-art img').evaluate(img => Math.abs(new DOMMatrix(getComputedStyle(img).transform).m41 + img.clientWidth / 2) < 1));
    assert(await floor(1).evaluate(el => el.classList.contains('suggested') && getComputedStyle(el).animationName === 'power-suggest-pulse'), '1F pulses as the first suggestion');
    await floor(12).focus(); await page.keyboard.press('Enter');
    assert.deepEqual(await state(), { on: true, floors: [12] });
    await status('12F 전력 공급 중 (1/2)');
    // Two floors stay lit together, in the order they were turned on.
    await floor(7).click();
    assert.deepEqual(await state(), { on: true, floors: [12, 7] }, 'Powering 12F then 7F keeps both on');
    await status('12F · 7F 전력 공급 중 (2/2)');
    await pressed([12, 7], [17, 1]);
    assert(await page.evaluate(() => floorHasPower(12) && floorHasPower(7) && !floorHasPower(13)));
    assert(await page.locator('#power-floor-grid button.active').evaluateAll(buttons =>
      buttons.every(button => getComputedStyle(button).backgroundColor === 'rgb(40, 76, 57)')), 'Both lit floors use the lit button art');
    await page.screenshot({ path: `.local/solar-panel-two-${width}.png` });
    // A third floor drops the earliest one; the 1F suggestion ends once 1F is chosen.
    await floor(1).click();
    assert.deepEqual(await state(), { on: true, floors: [7, 1] }, 'A third floor turns off the oldest');
    await status('7F · 1F 전력 공급 중 (2/2)');
    await pressed([7, 1], [12]);
    assert(await floor(1).evaluate(el => !el.classList.contains('suggested') && !el.hasAttribute('aria-label')));
    assert.match(await page.locator('#interaction-status').textContent(), /1층.*먼저 켠 12층은 꺼집니다/);
    // Pressing a lit floor turns off only that floor.
    await floor(7).click();
    assert.deepEqual(await state(), { on: true, floors: [1] }, 'Clicking a powered floor turns only it off');
    await status('1F 전력 공급 중 (1/2)');
    await pressed([1], [7, 12]);
    await floor(16).click();
    assert.deepEqual(await state(), { on: true, floors: [1, 16] });
    await page.screenshot({ path: `.local/solar-panel-on-${width}.png` });
    const layout = await page.locator('#power-panel').evaluate(panel => [...panel.querySelectorAll('button')].every(button => {
      const r = button.getBoundingClientRect();
      return r.width >= 30 && r.height >= 30 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    }));
    assert(layout, 'Every control fits the viewport and remains touchable');
    assert(await page.locator('#power-help').evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const box = el.getBoundingClientRect(); const lines = [...range.getClientRects()].filter(line => line.width > 0);
      return el.textContent.includes('최대 두 층') && lines.length >= 2 && lines.every(line => line.left >= box.left - 1 && line.right <= box.right + 1);
    }), 'Both help steps, including the two-floor limit, fit on the painted plate');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
    await page.keyboard.press('e');
    assert.deepEqual(await state(), { on: true, floors: [1, 16] }, 'Closing and reopening preserves supply');
    await status('1F · 16F 전력 공급 중 (2/2)');
    if (width === 1280) {
      const box = await lever.boundingBox();
      // Dragging down again must leave an already lowered lever ON.
      await page.mouse.move(box.x + box.width / 2, box.y + 30); await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 30, { steps: 8 }); await page.mouse.up();
      assert.deepEqual(await state(), { on: true, floors: [1, 16] });
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 8 }); await page.mouse.up();
    } else { await lever.focus(); await page.keyboard.press('Space'); }
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Raising the lever disconnects supply and clears both floors');
    await status('비상 전력 꺼짐');
    await pressed([], [1, 16]);
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
  console.log('PASS: sprite dimensions/alpha, OFF gate, downward drag, touch, keyboard, two-floor output with oldest-first drop and single-floor off, status text, 1F suggestion, persistence, OFF reset, scene synchronization and mobile.');
} finally { await browser.close(); }
