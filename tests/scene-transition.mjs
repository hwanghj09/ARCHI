import assert from 'node:assert/strict';

export async function finishSceneTransition(page) {
  await page.clock.runFor(800);
  assert.equal(await page.locator('#room-transition').getAttribute('data-phase'), 'idle');
  assert.equal(await page.locator('#room-transition').evaluate(el => getComputedStyle(el).opacity), '0');
}

export async function reachInitialCorridor(page) {
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'office');
  await page.locator('#office-background').evaluate(img => img.decode());
  await page.keyboard.down('a');
  await page.clock.runFor(2500);
  await page.keyboard.up('a');
  await page.clock.runFor(34);
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert.equal(await page.locator('#world').getAttribute('data-room'), 'corridor');
  const position = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  assert(Math.abs(await position() - 644) < 1, 'First office exit returns beside its corridor door');
  await page.keyboard.down('a');
  await page.clock.runFor((await position() - 220) / 200 * 1000);
  await page.keyboard.up('a');
  await page.clock.runFor(34);
}
