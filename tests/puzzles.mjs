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

  // I. 14층 관찰 콘솔: 정신력 30% 미만일 때만 여백의 붉은 글씨가 보이고 단서로 남는다.
  const inspectProp = (scene, name) => page.evaluate(([scene, name]) => {
    closeInspection();
    if (dynamicFloorId !== scene) performFloorChange(scene, null, 'exit');
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 }); Body.setVelocity(body, { x: 0, y: 0 });
    grounded = true; interact();
    return inspectionDescription.textContent;
  }, [scene, name]);
  await page.evaluate(() => { sanity = 80; });
  assert.match(await inspectProp('f14-ux', '관찰 콘솔'), /여백이 이상하게 넓다/);
  assert.equal(await page.evaluate(() => collectedItems.has('f14-hidden-record')), false, 'A clear mind sees an empty margin');
  await page.evaluate(() => { sanity = 20; });
  assert.match(await inspectProp('f14-ux', '관찰 콘솔'), /대체 호스트 후보/, 'Low sanity reveals the red writing');
  assert.match(await text('#inspection-sheet'), /신경 반응 적합도 98%/, 'The red writing is drawn on the printout');
  assert.equal(await page.evaluate(() => collectedItems.has('f14-hidden-record') && collectedClues.some(clue => clue.text.includes('대체 호스트'))), true);
  await page.evaluate(() => { closeInspection(); sanity = 80; });

  // A. 12층 팀장 노트북의 평가 DB 콘솔: night_eval은 ARCHI가 숨겨 오류, SHOW TABLES로 바뀐 이름을 찾고 WHERE로 10/07을 조회한다.
  await inspectProp('f12-lead', '팀장 노트북');
  assert(await page.locator('#sql-panel').isVisible(), 'The laptop opens the DB console');
  const sql = async command => {
    await page.locator('#sql-input').fill(command);
    await page.locator('#sql-input').press('Enter');
    return page.locator('#sql-output .sql-line').evaluateAll(lines => lines.slice(-4).map(line => line.textContent).join(' / '));
  };
  assert.match(await sql('SELECT * FROM night_eval;'), /doesn't exist[\s\S]*ARCHI>/, 'ARCHI hid the table');
  assert.match(await sql('show tables'), /night_eval_bak/);
  assert.match(await sql('select * from night_eval_bak;'), /너무 많습니다/, 'A full scan is refused');
  assert.match(await sql("SELECT * FROM night_eval_bak WHERE date = '09/30';"), /88\.5%/);
  assert.equal(await page.evaluate(() => collectedItems.has('f12-sql-found')), false);
  assert.match(await sql('SELECT * FROM night_eval_bak WHERE date="10/07"'), /성능 억제[\s\S]*7F 검증실/);
  assert.equal(await page.evaluate(() => collectedItems.has('f12-sql-found') && collectedItems.has('goal-f12-memo')), true);
  assert.match(await sql('drop table users'), /문법 오류/);
  await page.keyboard.press('Escape');
  assert(await page.locator('#sql-panel').isHidden());

  assert.deepEqual(errors, []);
  console.log('Puzzle tests passed.');
} finally {
  await browser.close();
}
