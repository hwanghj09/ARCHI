import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { reachInitialCorridor, collectRooftopKey } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-09-20T00:01:00Z'));
  await reachInitialCorridor(page);
  await collectRooftopKey(page);
  const state = () => page.locator('#player').evaluate(el => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    return { x: matrix.m41 + 96, feet: matrix.m42 + 178, room: el.parentElement.dataset.room };
  });
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.clock.runFor(ms);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  const arrived = async room => {
    await page.clock.runFor(800);
    await page.waitForFunction(room => document.getElementById('world').dataset.room === room &&
      getComputedStyle(document.getElementById('room-transition')).opacity === '0', room);
    await page.clock.runFor(100);
    assert(Math.abs((await state()).feet - 570) < 1);
  };
  await hold('d', 13800);
  assert.match(await page.locator('#interaction-hint').textContent(), /옥상으로 올라가기/);
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'corridor', 'Airborne stair use is blocked');
  await page.clock.runFor(1000);
  await page.keyboard.down('e');
  await page.getByRole('button', { name: '열쇠 사용하기', exact: true }).click();
  await arrived('dynamic');
  await page.keyboard.down('e');
  await page.keyboard.up('e');
  assert.equal((await state()).room, 'dynamic', 'Held E must not immediately return');
  assert.equal(await page.locator('header > span').textContent(), 'RF · 옥상');
  assert.equal(await page.locator('#dynamic-scene .door').count(), 1);
  assert.equal(await page.locator('.elevator-indicator:visible').count(), 0);
  assert.equal(await page.locator('#cabin-floor-buttons button').count(), 19);
  assert.equal(await page.locator('#cabin-floor-buttons [data-floor="18"]').count(), 0);
  await page.locator('#dynamic-scene img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
  assert.deepEqual(await page.locator('#dynamic-scene > img').evaluate(img => [img.naturalWidth, img.naturalHeight]), [2400, 760]);
  const supply = page.locator('#dynamic-scene .solar-supply');
  assert.equal(await supply.count(), 1);
  assert(await supply.isVisible());
  assert(await supply.locator('img').evaluate(img => img.naturalWidth === 1774 && img.naturalHeight === 887 &&
    img.clientWidth === img.parentElement.clientWidth * 2 && getComputedStyle(img).transform === 'none'), 'Only the off frame is shown');
  assert(await supply.evaluate(el => Math.abs(parseFloat(el.style.top) + 691 * el.clientWidth / 887 - 570) < 1),
    'Solar device rests on the roof floor');
  await page.screenshot({ path: '.local/rooftop-desktop.png' });
  const manual = page.locator('#dynamic-scene .fixture[aria-label="태양광 작업 설명서"]');
  assert.equal(await manual.count(), 1);
  assert(await manual.isVisible());
  assert(await manual.evaluate(el => el.offsetHeight === 5 && parseFloat(el.style.top) + el.offsetHeight === 415 &&
    parseFloat(el.style.left) >= 780 && parseFloat(el.style.left) + el.offsetWidth <= 940),
    'Manual rests on the solar panel top as a thin sheet');
  await hold('d', 3300);
  assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 태양광 작업 설명서 조사');
  await page.keyboard.press('e');
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'document');
  const manualLines = [
    '태양광 임시 전력 장치 — 비상 운용 안내',
    '① 비상 전력 레버를 내리십시오.',
    '② 네 자리 승인번호를 입력하십시오.',
    '③ 조명을 켤 층을 선택하십시오.',
    // 17층 비상 UPS 회로(69e8dc6)가 생기며 조명 전용 안내와 관리실 메모 위치로 바뀌었다.
    '태양광은 선택한 층의 전등만 공급합니다. 승강기는 17층 관리자실 비상 UPS 회선을 별도로 연결하십시오.',
    '관리실 출입 메모: 17층 복도 청소 카트. 회로 안내도: 관리실 책상.',
    '전용 앱을 설치하면 휴대폰으로 전력 공급 상태를 확인하고 원격으로 제어할 수 있습니다.',
    '앱 다운로드 및 장치 등록에는 작업용 컴퓨터를 이용하십시오.',
  ];
  assert.deepEqual(await page.locator('#inspection-sheet .writing-item').allTextContents(), manualLines);
  // 읽기용 설명(message)은 종이 문구와 따로 쓴 같은 제목으로 시작하는 요약이다.
  assert.equal(await page.locator('#inspection-description').textContent(),
    await page.evaluate(() => floorById.get('rooftop').fixtures[0].message));
  assert.match(await page.locator('#inspection-description').textContent(), /^태양광 임시 전력 장치 — 비상 운용 안내\n\n/);
  assert.equal(await page.locator('#inspection-sheet [data-bold="true"]').textContent(), manualLines[6]);
  await page.screenshot({ path: '.local/solar-manual-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileLayout = await page.locator('#inspection').evaluate(panel => {
    const bounds = panel.getBoundingClientRect();
    const close = document.getElementById('inspection-close').getBoundingClientRect();
    const sheet = document.getElementById('inspection-sheet');
    return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight &&
      close.bottom <= bounds.bottom && sheet.scrollWidth <= sheet.clientWidth + 1;
  });
  assert(mobileLayout, 'Manual and close button fit mobile without horizontal scrolling');
  await page.screenshot({ path: '.local/solar-manual-mobile.png' });
  await page.keyboard.press('Escape');
  assert(await page.locator('#inspection').isHidden());
  await hold('d', 900);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({ path: '.local/solar-supply-mobile.png' });
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'dynamic', 'The solar device is not a stair interaction');
  assert(await page.locator('#power-panel').isVisible(), 'The solar device opens its power controls');
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1280, height: 720 });
  await hold('d', 11000);
  assert(Math.abs((await state()).x - 2348) < 1, 'Roof boundary blocks movement');
  await page.keyboard.press('e');
  assert.equal((await state()).room, 'dynamic', 'Distant stairs cannot be used');
  await page.keyboard.press('Space');
  await page.clock.runFor(150);
  assert((await state()).feet < 500, 'Roof physics allows jumping');
  await page.clock.runFor(1000);
  await hold('a', 11000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.runFor(100);
  await page.screenshot({ path: '.local/rooftop-mobile.png' });
  assert.match(await page.locator('#interaction-hint').textContent(), /17층으로 내려가기/);
  await page.keyboard.press('e');
  await arrived('corridor');
  assert.equal(await page.locator('header > span').textContent(), '17F · 복도');
  assert(Math.abs((await state()).x - 2946) < 1, 'Return to the 17F stair door');
  assert.equal(await page.locator('#dynamic-scene .door').count(), 0);
  assert.equal(await supply.count(), 0, 'Device is removed when leaving the roof');
  assert.equal(await manual.count(), 0, 'Manual is removed when leaving the roof');
  await page.keyboard.press('e');
  await arrived('dynamic');
  assert.equal(await page.locator('#dynamic-scene .door').count(), 1, 'Reentry does not duplicate doors');
  assert.equal(await supply.count(), 1, 'Reentry creates exactly one device');
  assert.equal(await manual.count(), 1, 'Reentry creates exactly one manual');
  await page.keyboard.press('e');
  await arrived('corridor');
  assert.deepEqual(errors, []);
  console.log('PASS: rooftop stair round trips, solar placement and cleanup, input guards, collisions, mobile controls, and no elevator roof stop.');
} finally {
  await browser.close();
}
