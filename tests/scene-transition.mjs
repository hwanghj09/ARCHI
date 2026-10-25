import assert from 'node:assert/strict';

export async function interactionMessage(page) {
  const message = await page.evaluate(() => document.getElementById('inspection').hidden ?
    '' : document.getElementById('inspection-description').textContent);
  // Route tests read the full accessible description, then dismiss the new modal before continuing.
  // Character-by-character rendering and reveal controls are covered by inspection-ui.mjs.
  if (await page.locator('#inspection').isVisible()) {
    await page.keyboard.press('Escape');
    assert(await page.locator('#inspection').isHidden());
  }
  return message;
}

export async function finishSceneTransition(page) {
  await page.clock.runFor(800);
  assert.equal(await page.locator('#room-transition').getAttribute('data-phase'), 'idle');
  assert.equal(await page.locator('#room-transition').evaluate(el => getComputedStyle(el).opacity), '0');
}

// 컴퓨터는 1층 안내 데스크 PC에서 켠다(17층 내 자리 컴퓨터는 장식). 데스크 앞에 세워 E를 누를 수 있게 한다.
export async function goToDeskComputer(page) {
  await page.evaluate(() => performFloorChange('f1', 0));
  await page.clock.runFor(1200);
  await page.evaluate(() => {
    const desk = currentDoors.find(door => door.deskComputer);
    Body.setPosition(body, { x: desk.x + desk.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction();
  });
  await page.clock.runFor(50);
}

export async function collectRooftopKey(page) {
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const start = await position();
  const hydrantX = await page.evaluate(() => { const door = doors.find(door => door.container === 'hydrant'); return door.x + door.width / 2; });
  for (const target of [hydrantX, start]) {
    const wasDark = await page.evaluate(() => buildingBlackout);
    const x = await position();
    const key = target > x ? 'd' : 'a';
    await page.keyboard.down(key);
    await page.clock.runFor(Math.abs(target - x) / 200 * 1000);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
    if (!wasDark && await page.evaluate(() => buildingBlackout || blackoutSceneActive)) {
      if (await page.locator("#blackout-scene").isVisible()) await page.locator("#blackout-skip").click();
      if (await page.locator('#story-scene').isVisible()) await page.locator('#story-skip').click(); // 정전 직후 혼잣말
      const remaining = target - await position();
      const resumeKey = remaining > 0 ? 'd' : 'a';
      await page.keyboard.down(resumeKey);
      await page.clock.runFor(Math.abs(remaining) / 200 * 1000);
      await page.keyboard.up(resumeKey);
      await page.clock.runFor(34);
    }
    if (target === hydrantX) { // 17층 소화전 안 선반(corridor17.js)
      await page.keyboard.press('e');
      await page.getByRole('button', { name: '낡은 열쇠 줍기' }).click();
      await page.keyboard.press('Escape');
    }
  }
}

export async function reachInitialCorridor(page) {
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'office');
  await page.locator('#office-background').evaluate(img => img.decode());
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const exit = await page.locator('.office-door[data-room="office"]').evaluate(el => parseFloat(el.style.left) + parseFloat(el.style.width) / 2);
  const key = exit > await position() ? 'd' : 'a';
  await page.keyboard.down(key);
  await page.clock.runFor(Math.abs(exit - await position()) / 200 * 1000);
  await page.keyboard.up(key);
  await page.clock.runFor(34);
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor');
  assert(Math.abs(await position() - 644) < 1, 'First office exit returns beside its corridor door');
  await page.keyboard.down('a');
  await page.clock.runFor((await position() - 220) / 200 * 1000);
  await page.keyboard.up('a');
  await page.clock.runFor(34);
}
