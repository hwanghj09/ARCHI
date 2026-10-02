import assert from 'node:assert/strict';

export async function interactionMessage(page) {
  const message = await page.evaluate(() => document.getElementById('inspection').hidden ?
    document.getElementById('interaction-status').textContent : document.getElementById('inspection-description').textContent);
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

export async function collectRooftopKey(page) {
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const start = await position();
  for (const target of [4095, start]) {
    const x = await position();
    const key = target > x ? 'd' : 'a';
    await page.keyboard.down(key);
    await page.clock.runFor(Math.abs(target - x) / 200 * 1000);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
    if (target === 4095) {
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
