// 개발 도구의 퍼즐 열기: 목록의 퍼즐마다 그 장소로 옮겨 퍼즐 화면(또는 퍼즐 방 입구)을 연다. F3·F4·F5는 바로 연다.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 열린 화면: 전선·로그 단말·키패드·조작창·컴퓨터 앱·조사창 제목, 없으면 서 있는 장소.
const screen = () => (document.getElementById('wire-panel').hidden ? '' : 'wire') ||
  (document.getElementById('log-panel').hidden ? '' : 'log') || (usingKeypad && 'keypad') || (usingControl && 'control') ||
  (usingComputer && (computerActiveWindow?.app || 'computer')) || (usingInspection && document.getElementById('inspection-title').textContent) ||
  (room === 'dynamic' ? dynamicFloorId : room);
const CASES = [
  [0, 'keypad'], [1, 'wire'], [2, '17층 청소 카트'], [3, 'keypad'], [4, 'wire'], [5, 'computer'], [6, 'f16-kitchen'], [7, 'f16-cu'],
  [8, 'keypad'], [9, '개발실 · 맨 왼쪽 서랍'], [10, 'log'], [11, 'log'], [12, 'f14-archive'], [13, 'f5-rnd'], [14, 'control'],
  [15, 'f7-verify'], [16, 'ARCHI 포스터'], [17, 'terminal'], [18, 'f13-secure'], [19, 'computer'], [20, 'control'], [21, 'b2'],
  [22, 'ARCHI 메인 콘솔'], ['F3', 'wire'], ['F4', 'ARCHI 포스터'], ['F5', 'log'],
];

const browser = await chromium.launch();
try {
  for (const [target, expected] of CASES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-16T00:00:00Z') });
    await page.goto(new URL('../index.html', import.meta.url).href);
    await page.locator('#menu-start').click();
    await page.locator('#opening-skip').click();
    await page.clock.runFor(100);
    if (typeof target === 'number') await page.evaluate(index => openPuzzle(PUZZLE_OPENERS[index]), target);
    else await page.keyboard.press(target);
    await page.clock.runFor(2500);
    assert.equal(await page.evaluate(screen), expected, String(target));
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(`puzzle-open: ${CASES.length} cases ok`);
} finally {
  await browser.close();
}
