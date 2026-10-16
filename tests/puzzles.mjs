// docs/puzzle-ideas.md에서 새로 만든 퍼즐들. 퍼즐마다 블록 하나씩 이어 붙인다.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.waitForFunction(() => openingReady);
  await page.evaluate(() => finishOpening());
  const text = selector => page.locator(selector).textContent();
  const standAt = (x, y) => page.evaluate(([x, y]) => {
    Body.setPosition(body, { x, y: (y ?? floorY) - 81 }); Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction();
  }, [x, y]);
  const interact = () => page.evaluate(() => { grounded = true; interact(); });

  // J. 17층 관리자실 도어락: 플래시를 켜야 닳은 버튼(1·3·6·9)이 보이고, 순서는 사무실 벽 달력(늦은 날부터) → 9631.
  await page.evaluate(() => { const cal = officeDoors.find(door => door.name === '벽 달력'); Body.setPosition(body, { x: cal.x + 15, y: floorY - 81 }); });
  await interact();
  assert.match(await text('#inspection-description'), /늦은 날부터/);
  assert.equal(await page.evaluate(() => collectedClues.some(clue => clue.name === '벽 달력')), true, 'The calendar is saved as a clue');
  await page.evaluate(() => { closeInspection(); changeRoom(); });
  await page.waitForFunction(() => room === 'corridor' && !transitioning);
  const doorX = await page.evaluate(() => { const door = doors.find(entry => entry.name === '관리자 외 출입금지'); return door.x + door.width / 2; });
  await standAt(doorX);
  await page.evaluate(() => { phoneLightOn = false; });
  await interact();
  assert.match(await text('#keypad-text'), /하나도 안 보인다/, 'In the dark the worn keys are invisible');
  await page.keyboard.press('Escape');
  await page.evaluate(() => { phoneLightOn = true; });
  await interact();
  assert.match(await text('#keypad-text'), /1 · 3 · 6 · 9/, 'The flashlight shows the worn keys');
  await page.locator('#keypad-input').fill('1369');
  await page.locator('#keypad-submit').click();
  assert.match(await text('#keypad-error'), /맞지 않는다/);
  await page.locator('#keypad-input').fill('9631');
  await page.locator('#keypad-submit').click();
  assert.equal(await page.evaluate(() => collectedItems.has('f17-manager-open') && !doors.find(entry => entry.name === '관리자 외 출입금지').locked), true);
  await interact();
  await page.waitForFunction(() => dynamicFloorId === 'f17-manager' && !transitioning);
  await page.evaluate(() => { const box = currentDoors.find(door => door.name === '공구함'); Body.setPosition(body, { x: box.x + box.width / 2, y: floorY - 81 }); });
  await interact();
  assert.equal(await page.evaluate(() => collectedItems.has('f17-powerbank')), true, 'The tool cabinet holds a power bank');
  await page.evaluate(() => { closeInspection(); phoneBattery = 12; useInventoryItem('f17-powerbank'); });
  assert.equal(await page.evaluate(() => phoneBattery), 100, 'The power bank refills the phone');

  assert.deepEqual(errors, []);
  console.log('Puzzle tests passed.');
} finally {
  await browser.close();
}
