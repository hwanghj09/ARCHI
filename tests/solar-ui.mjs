import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  // 360 is the narrowest common phone width; the supplied-floor status must still fit there.
  for (const [width, height] of [[1280, 720], [390, 844], [360, 740]]) {
    const mobile = width < 768;
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: mobile });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
    await page.locator('#opening-skip').click();
    // The painted board below the CCTV opens through the real corridor interaction.
    await page.evaluate(() => {
      triggerBuildingBlackout();
      performFloorChange('f17', null);
      Body.setPosition(body, { x: 1714, y: floorY - 81 }); grounded = true; updateInteraction(); render();
    });
    assert.equal(await page.locator('#interaction-hint').textContent(), 'E · CCTV 아래 게시판 조사');
    assert.deepEqual(await page.locator('#interaction-outline').evaluate(element =>
      ['left', 'top', 'width', 'height'].map(key => parseFloat(element.style[key]))), [1580, 273, 135, 159],
    'The board outline follows the painted frame at desktop and mobile scales');
    assert(await page.locator('#interaction-outline').isVisible());
    if (width === 390) await page.locator('#interact').tap();
    else await page.keyboard.press('e');
    assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'corkboard');
    assert.equal(await page.locator('#inspection-sheet .writing-note').count(), 6);
    assert.match(await page.locator('#inspection-sheet .writing-note').nth(3).textContent(), /태양광.*1997/s);
    assert.match(await page.locator('#inspection-description').textContent(), /1997/);
    assert(await page.locator('.writing-note').evaluateAll(notes => notes.every(note => {
      const box = note.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth;
    })), 'Post-it notes fit desktop and mobile');
    await page.screenshot({ path: `.local/solar-hint-board-${width}.png` });
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      triggerBuildingBlackout(); performFloorChange('rooftop', null);
      Body.setPosition(body, { x: 1040, y: floorY - 81 }); grounded = true; updateInteraction(); render();
    });
    await page.keyboard.press('e');
    const lever = page.locator('#power-lever');
    const floor = number => page.locator(`#power-floor-grid [data-floor="${number}"]`);
    const state = () => page.evaluate(() => ({ on: solarEnabled, floors: [...solarPoweredFloors] }));
    // The status reads like '12F 전력 공급 중 (1/1)' and must stay on one line inside its painted window.
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
    if (mobile) await lever.tap();
    else {
      const box = await lever.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + 30); await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 30, { steps: 12 }); await page.mouse.up();
    }
    assert(await page.locator('#keypad').isVisible());
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Lowering the lever requires approval');
    assert.equal(await page.locator('#keypad-input').getAttribute('maxlength'), '4');
    await page.locator('#keypad-input').fill('199'); await page.locator('#keypad-submit').click();
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Partial code cannot enable power');
    await page.locator('#keypad-input').fill('1234'); await page.locator('#keypad-submit').click();
    assert.match(await page.locator('#keypad-error').textContent(), /맞지/);
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Wrong code cannot enable power');
    await page.keyboard.press('Escape');
    assert(await page.locator('#power-panel').isVisible());
    assert(await page.locator('#keypad').isHidden());
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Cancellation leaves power off');
    await lever.click();
    assert.equal(await page.locator('#keypad-input').inputValue(), '', 'Retry clears the previous code');
    await page.locator('#keypad-input').fill('1997'); await page.keyboard.press('Enter');
    assert(await page.locator('#wire-panel').isVisible(), 'The first success blows the wiring instead of turning power on');
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Power stays off until the wires are reconnected');
    // 색만 보고 고르는 퍼즐이라 왼쪽 전선마다 같은 색 오른쪽 단자를 찾아 순서대로 클릭한다(순서는 상관없다).
    // element.click()은 detail: 0인 클릭을 내보내 코드의 키보드 선택 경로(마우스 드래그와 겹치지 않는 쪽)를 탄다.
    await page.evaluate(() => {
      for (const left of document.querySelectorAll('#wire-left button')) {
        left.click();
        document.querySelector(`#wire-right button[data-color="${left.dataset.color}"]`).click();
      }
    });
    await page.waitForSelector('#wire-panel', { state: 'hidden' });
    assert(await page.evaluate(() => collectedItems.has('roof-wires-fixed')), 'Solving the wires is remembered');
    assert(await page.locator('#power-panel').isVisible());
    assert.deepEqual(await state(), { on: true, floors: [] }, 'Fixed wiring then enables selection without choosing a floor');
    assert(await floor(17).isEnabled());
    assert.equal(await page.locator('.solar-supply').getAttribute('data-active'), 'true');
    assert(await page.locator('.power-art img').evaluate(img => Math.abs(new DOMMatrix(getComputedStyle(img).transform).m41 + img.clientWidth / 2) < 1));
    assert(await floor(17).evaluate(el => el.classList.contains('suggested') && getComputedStyle(el).animationName === 'power-suggest-pulse'), '17F pulses for computer power restoration');
    // Holding Enter sends repeated keydowns; a floor toggles on every press, so only the first one counts.
    await floor(12).focus();
    for (let i = 0; i < 4; i += 1) await page.keyboard.down('Enter');
    await page.keyboard.up('Enter');
    assert.deepEqual(await state(), { on: true, floors: [12] }, 'Holding Enter presses a floor once');
    await status('12F 전력 공급 중 (1/1)');
    // Selecting another floor replaces the currently supplied floor.
    await floor(7).click();
    assert.deepEqual(await state(), { on: true, floors: [7] }, 'Powering 7F replaces 12F');
    await status('7F 전력 공급 중 (1/1)');
    await pressed([7], [12, 17, 1]);
    assert(await page.evaluate(() => !floorHasLighting(12) && floorHasLighting(7) && !floorHasLighting(13) && !elevatorHasPower()));
    assert(await page.locator('#power-floor-grid button.active').evaluateAll(buttons =>
      buttons.every(button => getComputedStyle(button).backgroundColor === 'rgb(40, 76, 57)')), 'The supplied floor uses the lit button art');
    await page.screenshot({ path: `.local/solar-panel-replacement-${width}.png` });
    // Selecting a new floor drops the one that was supplied.
    await floor(1).click();
    assert.deepEqual(await state(), { on: true, floors: [1] }, 'Selecting 1F replaces 7F');
    await status('1F 전력 공급 중 (1/1)');
    await pressed([1], [7, 12]);
    assert(await floor(1).evaluate(el => !el.classList.contains('suggested') && !el.hasAttribute('aria-label')));
    // Pressing the lit floor stops supply without raising the lever.
    await floor(1).click();
    assert.deepEqual(await state(), { on: true, floors: [] }, 'Clicking the supplied floor turns it off');
    await status('공급할 층 선택 (0/1)');
    await pressed([], [1, 7, 12]);
    await floor(16).click();
    assert.deepEqual(await state(), { on: true, floors: [16] });
    await page.screenshot({ path: `.local/solar-panel-on-${width}.png` });
    const layout = await page.locator('#power-panel').evaluate(panel => [...panel.querySelectorAll('button')].every(button => {
      const r = button.getBoundingClientRect();
      return r.width >= 30 && r.height >= 30 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    }));
    assert(layout, 'Every control fits the viewport and remains touchable');
    // The plate's light face is rows 427-449 and columns 82-303 of each 384x512 half of panel-off-on.png.
    assert(await page.locator('#power-help').evaluate(el => {
      const range = document.createRange(); range.selectNodeContents(el);
      const cabinet = el.parentElement.getBoundingClientRect(); const lines = [...range.getClientRects()].filter(line => line.width > 0);
      const face = { left: cabinet.left + cabinet.width * 82 / 384, right: cabinet.left + cabinet.width * 304 / 384,
        top: cabinet.top + cabinet.height * 427 / 512, bottom: cabinet.top + cabinet.height * 450 / 512 };
      const label = document.getElementById('power-lever-label').getBoundingClientRect();
      return el.textContent.includes('전등 전용') && el.textContent.includes('관리실 비상 회선') && lines.length >= 1 && lines.every(line => line.left >= face.left && line.right <= face.right &&
        line.top >= face.top && line.bottom <= face.bottom && (line.top >= label.bottom || line.left >= label.right));
    }), 'The lever and floor-button help sits on the painted plate clear of the lever label');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
    await page.keyboard.press('e');
    assert.deepEqual(await state(), { on: true, floors: [16] }, 'Closing and reopening preserves supply');
    await status('16F 전력 공급 중 (1/1)');
    if (width === 1280) {
      const box = await lever.boundingBox();
      // Dragging down again must leave an already lowered lever ON.
      await page.mouse.move(box.x + box.width / 2, box.y + 30); await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 30, { steps: 8 }); await page.mouse.up();
      assert.deepEqual(await state(), { on: true, floors: [16] });
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + 30, { steps: 8 }); await page.mouse.up();
    } else { await lever.focus(); await page.keyboard.press('Space'); }
    assert.deepEqual(await state(), { on: false, floors: [] }, 'Raising the lever disconnects supply and clears the selected floor');
    await status('비상 전력 꺼짐');
    await pressed([], [1, 16]);
    assert(await floor(16).isDisabled());
    await page.keyboard.press('Tab');
    assert(await page.locator('#power-close').evaluate(el => el === document.activeElement), 'Tab skips disabled floors');
    await page.keyboard.press('Enter');
    assert(await page.locator('#power-panel').isHidden());
    // The wiring is already fixed (from earlier in this run), so the lever alone turns it back on —
    // the password is only ever needed once per save.
    await page.keyboard.press('e'); await lever.click();
    assert(await page.locator('#keypad').isHidden(), 'Fixed wiring skips the password entirely');
    assert.deepEqual(await state(), { on: true, floors: [] }, 'The lever alone re-enables power once fixed');
    await lever.click();
    assert.deepEqual(await state(), { on: false, floors: [] });
    await page.locator('#power-close').click();
    await page.evaluate(() => performFloorChange('f16'));
    assert.equal(await page.locator('#world').getAttribute('data-powered'), 'false');
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log('PASS: CCTV board with six Post-its, 1997 approval, partial/wrong code and cancellation, repeat activation, drag/touch/keyboard, floor supply, persistence, OFF reset and mobile.');
} finally { await browser.close(); }
