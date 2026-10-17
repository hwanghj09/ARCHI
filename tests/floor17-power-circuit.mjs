import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { reachInitialCorridor, finishSceneTransition } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  await reachInitialCorridor(page);
  const approach = async name => {
    await page.evaluate(name => {
      closeInspection();
      const door = currentDoors.find(door => door.name === name);
      if (!door) throw new Error(`Missing object: ${name}`);
      Body.setPosition(body, { x: door.type === 'power' ? door.x + door.width - 30 : door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      setDebugSanity(100); releaseInput(); updateInteraction(); cameraX = cameraTarget(); render();
    }, name);
    await page.keyboard.press('e');
  };
  const state = () => page.evaluate(() => ({ lift: elevatorHasPower(), equipment: floorHasPower(17), lights: floorHasLighting(17),
    solved: collectedItems.has('f17-emergency-linked') }));
  const drag = async (left, right) => {
    const a = await left.boundingBox(), b = await right.boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 10 });
    await page.mouse.up();
  };
  await page.evaluate(() => triggerBuildingBlackout());
  assert.deepEqual(await state(), { lift: false, equipment: false, lights: false, solved: false });
  // 도구를 모두 치운 뒤 직접 메모를 집어야 비밀번호가 보이고 가방에 들어간다.
  const cartStart = await page.evaluate(() => progressSnapshot());
  for (const [input, viewport] of [
    ['mouse', { width: 1280, height: 720 }], ['touch', { width: 390, height: 844 }], ['keyboard', { width: 844, height: 390 }],
  ]) {
    await page.evaluate(data => restoreProgress(data), cartStart);
    await page.setViewportSize(viewport);
    await approach('청소 카트');
    const tools = page.locator('.cleaning-tool');
    const pickup = page.getByRole('button', { name: '관리실 비상 출입 메모 줍기', includeHidden: true });
    assert.equal(await tools.count(), 3);
    assert(await pickup.isHidden());
    assert.equal(await page.locator('.writing-memo').count(), 0);
    assert.doesNotMatch(await page.locator('#inspection').textContent(), /1706/);
    await pickup.evaluate(button => button.click());
    assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-memo')), false, 'Covered memo cannot be collected');
    await tools.evaluateAll(buttons => Promise.all(buttons.map(button => {
      const sprite = button.querySelector('.cleaning-tool-sprite');
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = resolve; image.onerror = reject;
        image.src = getComputedStyle(sprite).backgroundImage.slice(5, -2);
      });
    })));
    await page.locator('.cleaning-cart-tray > img').evaluate(image => image.decode());
    assert(await tools.evaluateAll(buttons => buttons.every(button => {
      const r = button.getBoundingClientRect();
      return r.width >= 20 && r.height >= 40 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    })), 'Tools remain usable on desktop, portrait and landscape screens');
    await page.screenshot({ path: `.local/floor17-cart-${input}.png` });
    const touchSession = input === 'touch' ? await page.context().newCDPSession(page) : null;
    const dragTool = async (outside, cancel = false) => {
      const tool = tools.first();
      const r = await tool.boundingBox();
      const cart = await page.locator('.cleaning-cart-tray').boundingBox();
      const start = { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      const end = { x: start.x + 8, y: outside ? cart.y - 12 : start.y + 8 };
      if (touchSession) {
        await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
        await touchSession.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [end] });
      } else {
        await page.mouse.move(start.x, start.y); await page.mouse.down();
        await page.mouse.move(end.x, end.y, { steps: 6 });
      }
      assert.notEqual(await tool.evaluate(element => element.style.translate), '', 'The actual tool sprite follows the pointer');
      if (touchSession) await touchSession.send('Input.dispatchTouchEvent', { type: cancel ? 'touchCancel' : 'touchEnd', touchPoints: [] });
      else await page.mouse.up();
    };
    await tools.first().click();
    assert.equal(await tools.count(), 3, 'A mouse click alone cannot clear tools');
    if (input !== 'keyboard') {
      await dragTool(false);
      assert.equal(await tools.count(), 3, 'Dropping inside the cart returns the tool');
      assert.equal(await tools.first().evaluate(element => element.style.translate), '');
      if (touchSession) {
        await dragTool(true, true);
        assert.equal(await tools.count(), 3, 'Canceled touch cannot clear a tool');
      }
    }
    const clearTool = async () => {
      if (input === 'keyboard') { await tools.first().focus(); await page.keyboard.press('Enter'); }
      else await dragTool(true);
    };
    await clearTool();
    await page.keyboard.press('Escape');
    await approach('청소 카트');
    assert.equal(await tools.count(), 2, 'Closing the cart preserves cleared tools');
    const partial = await page.evaluate(() => readProgress());
    assert(partial.items.includes('f17-cart-tool-0'));
    await clearTool();
    await page.evaluate(data => restoreProgress(data), partial);
    await approach('청소 카트');
    assert.equal(await tools.count(), 2, 'Loading restores partially cleared tools');
    await clearTool();
    assert(await pickup.isHidden(), 'One remaining tool still hides the memo');
    await clearTool();
    assert(await pickup.isVisible());
    assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-memo')), false, 'Uncovering is separate from collecting');
    assert.doesNotMatch(await page.locator('#inspection').textContent(), /1706/);
    if (input === 'touch') await pickup.tap();
    else if (input === 'keyboard') { await pickup.focus(); await page.keyboard.press('Space'); }
    else await pickup.click();
    assert(await page.locator('.writing-memo').isVisible(), `${input}: picking up the memo opens it`);
    assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-memo')), true);
  }
  const memo = await page.locator('.writing-memo').textContent();
  const code = memo.match(/비밀번호:\s*(\d{4})/)[1];
  assert.match(memo, /태양광은 전등 전용/);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-memo')), true, 'Picking up the uncovered memo puts it in the bag');
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 720 }]) {
    await page.setViewportSize(viewport);
    assert(await page.locator('.writing-memo').evaluate(paper => {
      const bounds = paper.getBoundingClientRect();
      return [...paper.querySelectorAll('.writing-item')].every(line => {
        const rect = line.getBoundingClientRect();
        return parseFloat(getComputedStyle(line).fontSize) >= 20 && rect.left >= bounds.left + 40 &&
          rect.right <= bounds.right - 40 && rect.bottom <= bounds.bottom - 40;
      });
    }), 'Memo text stays on the paper');
    await page.screenshot({ path: `.local/floor17-memo-${viewport.width}.png` });
  }
  await page.screenshot({ path: '.local/floor17-power-memo.png' });
  await page.keyboard.press('Escape');
  await approach('청소 카트');
  assert.equal(await page.locator('#inspection-description').textContent(), '아무것도 없다.', 'The emptied cart has nothing left');
  await page.keyboard.press('Escape');
  await page.locator('#inventory-button').click();
  await page.locator('[data-item="f17-manager-memo"]').click();
  assert.equal(await page.locator('.writing-memo').textContent(), memo, 'Inventory opens the same written memo');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'inventory');
  await approach('소화전');
  await page.getByRole('button', { name: '낡은 열쇠 줍기' }).click();
  await approach('비상계단');
  await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await finishSceneTransition(page);
  await approach('태양광 발전기');
  await page.locator('#power-lever').click();
  await page.locator('#keypad-input').fill('1997');
  await page.locator('#keypad-input').press('Enter');
  assert.equal(await page.locator('#wire-panel').getAttribute('data-mode'), 'solar');
  for (const color of ['red', 'yellow', 'blue', 'green']) {
    await drag(page.locator(`#wire-left [data-color="${color}"]`), page.locator(`#wire-right [data-color="${color}"]`));
  }
  assert(await page.locator('#power-panel').isVisible());
  await page.locator('#power-floor-grid [data-floor="17"]').click();
  assert.deepEqual(await state(), { lift: false, equipment: false, lights: true, solved: false }, 'Solar power supplies lights only');
  await page.keyboard.press('Escape');
  await approach('17층 계단');
  await finishSceneTransition(page);
  await approach('관리자 외 출입금지');
  assert(await page.locator('#keypad').isVisible());
  await page.locator('#keypad-input').fill('0000'); await page.locator('#keypad-input').press('Enter');
  assert.match(await page.locator('#keypad-error').textContent(), /맞지/);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-unlocked')), false);
  await page.locator('#keypad-input').fill(code); await page.locator('#keypad-input').press('Enter');
  assert.equal(await page.locator('#floor17-extension [aria-label="관리자 외 출입금지 출입문"]').getAttribute('data-unlocked'), 'true');
  await page.keyboard.press('e'); await finishSceneTransition(page);
  assert.equal(await page.evaluate(() => dynamicFloorId), 'f17-manager');
  assert.equal(await page.evaluate(() => worldWidth), 1040, 'Manager room is compact');
  await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.screenshot({ path: '.local/floor17-power-room.png' });
  await approach('비상 전력 분배반');
  assert(await page.locator('#wire-panel').isHidden(), 'Read the circuit diagram before touching terminals');
  assert.match(await page.locator('#inspection-description').textContent(), /안내도를 먼저/);
  await approach('비상 전력 회로 안내도');
  assert.equal(await page.evaluate(() => collectedItems.has('f17-circuit-guide-read')), true);
  assert.match(await page.locator('#inspection-sheet').textContent(), /중계 릴레이/);
  await approach('비상 전력 분배반');
  assert.equal(await page.locator('#wire-panel').getAttribute('data-mode'), 'elevator');
  await page.locator('.wire-art img').evaluate(image => image.decode());
  await page.locator('#wire-reference summary').click();
  assert.equal(await page.locator('#wire-reference tr').count(), 8, 'Two-stage relay diagram has no direct S-to-E answer table');
  await page.screenshot({ path: '.local/floor17-power-circuit.png' });
  await page.locator('#wire-reference summary').click();
  const pending = await page.evaluate(() => progressSnapshot());
  await page.locator('#wire-test').click();
  assert.match(await page.locator('#wire-status').textContent(), /네 가닥/);
  for (let i = 0; i < 4; i++) await drag(page.locator('#wire-left button').nth(i), page.locator('#wire-right button').nth(i));
  assert.equal(await page.locator('.wire-cable').count(), 4, 'Wrong connections remain visible for diagnosis');
  assert.equal((await state()).lift, false, 'Four attached wires alone do not energize the lift');
  await page.locator('#wire-test').click();
  assert.match(await page.locator('#wire-status').textContent(), /접지 연속성 불량/);
  assert.equal((await state()).solved, false);
  await page.getByRole('button', { name: '전력 공급 단자 S2', exact: true }).click();
  await page.getByRole('button', { name: '전력 공급 단자 S4', exact: true }).click();
  await drag(page.getByRole('button', { name: '전력 공급 단자 S2', exact: true }), page.getByRole('button', { name: '엘리베이터 단자 E4', exact: true }));
  await drag(page.getByRole('button', { name: '전력 공급 단자 S4', exact: true }), page.getByRole('button', { name: '엘리베이터 단자 E2', exact: true }));
  await page.locator('#wire-test').click();
  assert.match(await page.locator('#wire-status').textContent(), /구동·제어 회로 불일치/);
  for (let i = 0; i < 4; i++) await page.locator('#wire-left button').nth(i).click();
  assert.equal(await page.locator('.wire-cable').count(), 0, 'Supply terminals disconnect the old cable');
  const circuits = await page.evaluate(() => EMERGENCY_CIRCUITS);
  for (const circuit of circuits) {
    await drag(page.getByRole('button', { name: `전력 공급 단자 ${circuit.source}`, exact: true }),
      page.getByRole('button', { name: `엘리베이터 단자 ${circuit.target}`, exact: true }));
  }
  assert.equal((await state()).lift, false, 'Even correct wiring requires a deliberate circuit test');
  await page.locator('#wire-test').click();
  assert(await page.locator('#wire-panel').isHidden());
  assert(await page.locator('#power-panel').isHidden(), 'Manager puzzle never opens the roof panel');
  assert.deepEqual(await state(), { lift: true, equipment: true, lights: true, solved: true });
  assert.equal(await page.locator('[aria-label="비상 전력 분배반"]').getAttribute('data-sprite-frame'), '1');
  await page.evaluate(() => { closeInspection(); setSolarPower(false); saveProgress(); });
  assert.deepEqual(await state(), { lift: true, equipment: true, lights: false, solved: true }, 'The independent emergency UPS survives solar shutoff');
  const completed = await page.evaluate(() => progressSnapshot());
  await page.reload(); await page.locator('#menu-continue').click();
  assert.equal((await state()).solved, true);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-unlocked')), true);
  await page.evaluate(data => restoreProgress(data), pending);
  await page.setViewportSize({ width: 390, height: 844 });
  await approach('비상 전력 분배반');
  const before = await page.evaluate(() => body.position.x);
  await page.evaluate(() => setDebugSanity(50));
  await page.keyboard.down('d'); await page.clock.runFor(500); await page.keyboard.up('d');
  assert.equal(await page.evaluate(() => body.position.x), before, 'Player stays still during wiring');
  assert.equal(await page.evaluate(() => sanity), 50, 'Wiring pauses sanity changes and hallucination triggers');
  const a = await page.getByRole('button', { name: '전력 공급 단자 S4', exact: true }).boundingBox();
  const b = await page.getByRole('button', { name: '엘리베이터 단자 E2', exact: true }).boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const point = rect => ({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point(a)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point(b)] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  assert.equal(await page.locator('.wire-cable').count(), 1, 'Real touch drag connects a cable');
  await page.getByRole('button', { name: '전력 공급 단자 S1', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: '엘리베이터 단자 E3', exact: true }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('.wire-cable').count(), 2, 'Keyboard users can select both terminals');
  await page.screenshot({ path: '.local/floor17-power-mobile.png' });
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('Escape');
  assert.equal((await state()).solved, false, 'Canceling cannot grant power');
  assert(await page.locator('#power-panel').isHidden());
  assert.equal(await page.locator('body > #stage').evaluate(element => element.inert), false);
  await approach('비상 전력 분배반');
  assert.equal(await page.locator('.wire-cable').count(), 0, 'A canceled session never leaves stale connections');
  await page.keyboard.press('Escape');
  await page.evaluate(data => restoreProgress(data), completed);
  const legacy = { ...completed, scene: { ...completed.scene, id: 'f16', x: 2200 }, items: completed.items.filter(item => item !== 'f17-emergency-linked') };
  delete legacy.powerCircuitVersion;
  await page.evaluate(data => restoreProgress(data), legacy);
  assert.equal((await state()).lift, true, 'Old saves below 17F retain a return route');
  await page.evaluate(data => restoreProgress({ ...data, powerCircuitVersion: 1 }), legacy);
  assert.equal((await state()).lift, false, 'New saves cannot bypass the puzzle through migration');
  assert.deepEqual(errors, []);
  console.log('PASS: key/memo→solar lights→locked compact room→relay guide→wrong wiring/repair/test→independent elevator UPS; save/reload, legacy recovery, sprite states and mobile touch.');
} finally { await browser.close(); }
