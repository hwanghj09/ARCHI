import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.keyboard.press('p');
  await page.locator('#phone [data-phone-app="notes"]').click();
  assert(await page.locator('#phone-tab-clues').isHidden(), 'New players never see a nonfunctional empty clue tab');
  assert.match(await page.locator('#phone-notes').innerText(), /직접 메모.*시간이 흐르/);
  await page.locator('#phone-note').fill('17층 옥상 · 승인번호 1997');
  await page.locator('#phone-note-save').click();
  await page.evaluate(() => {
    recordClue({ name: '시험 단서', clue: '자동으로 기록되지 않는다' });
    addClue('시험 단서', '자동으로 기록되지 않는다');
  });
  assert.equal(await page.evaluate(() => collectedClues.length), 0);
  await page.locator('#phone-close').click();
  await page.evaluate(() => saveProgress());
  await page.reload();
  await page.locator('#menu-continue').click();
  await page.keyboard.press('p');
  await page.locator('#phone [data-phone-app="notes"]').click();
  assert.equal(await page.locator('#phone-note').inputValue(), '17층 옥상 · 승인번호 1997');
  assert(await page.locator('#phone-tab-clues').isHidden());
  const oldClues = [{ place: '17F · 복도', name: '게시판', text: '기존 저장의 단서' }];
  await page.evaluate(oldClues => restoreClues(oldClues), oldClues);
  await page.locator('#phone-tab-clues').click();
  assert.match(await page.locator('#phone-clue-list').innerText(), /기존 저장의 단서/);
  assert.deepEqual(await page.evaluate(() => progressSnapshot().clues), oldClues, 'Legacy clues remain available and saveable');
  await page.evaluate(() => restoreClues([]));
  assert(await page.locator('#phone-tab-clues').isHidden());
  assert(await page.locator('#phone-memo-pane').isVisible(), 'An empty legacy tab returns to the personal memo');
  await page.locator('#phone-close').click();
  await page.evaluate(() => startNewGame());
  assert.equal(await page.evaluate(() => collectedClues.length), 0);
  assert.equal(await page.locator('#phone-note').inputValue(), '');
  assert.deepEqual(errors, []);
  console.log('PASS: explicit manual notes, hidden empty tab, no automatic collection, persistent personal notes, readable legacy clues and new-game reset.');
} finally { await browser.close(); }
