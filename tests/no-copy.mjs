// 마우스로 글자 고르기·끌기·복사·오른쪽 클릭 메뉴를 막는다(js/input/no-copy.js). 플레이어가 쓰는 입력 칸은 그대로 쓴다.
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
  const blocked = (selector, type) => page.evaluate(([selector, type]) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    document.querySelector(selector).dispatchEvent(event);
    return event.defaultPrevented;
  }, [selector, type]);
  for (const type of ['selectstart', 'dragstart', 'copy', 'cut', 'contextmenu']) {
    assert.equal(await blocked('#interaction-hint', type), true, `${type} is blocked on game text`);
    assert.equal(await blocked('#phone-note', type), false, `${type} still works in the phone note`);
  }
  assert.equal(await page.evaluate(() => getComputedStyle(document.body).userSelect), 'none', 'Game text cannot be selected');
  assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('phone-note')).userSelect), 'text');
  // 마우스로 화면을 끌어도 아무 글자도 선택되지 않는다.
  await page.mouse.move(40, 30); await page.mouse.down(); await page.mouse.move(900, 700, { steps: 6 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => String(getSelection())), '', 'Dragging across the screen selects nothing');
  assert.deepEqual(errors, []);
  console.log('No-copy test passed.');
} finally {
  await browser.close();
}
