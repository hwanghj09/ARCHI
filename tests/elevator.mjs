import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition, reachInitialCorridor } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.clock.pauseAt(new Date('2026-09-20T00:01:00Z'));
  await page.clock.runFor(100);
  await reachInitialCorridor(page);
  const hold = async (key, ms) => {
    await page.keyboard.down(key);
    await page.clock.runFor(ms);
    await page.keyboard.up(key);
    await page.clock.runFor(34);
  };
  await hold('d', 8200);
  await page.keyboard.press('e');
  await page.clock.runFor(19400);
  await page.keyboard.press('e');
  const cabin = page.locator('#elevator-cabin');
  const fade = page.locator('#room-transition');
  assert(await cabin.isHidden(), 'Cabin must not appear before fade-out');
  await page.clock.runFor(150);
  assert(await cabin.isHidden());
  const partialOpacity = Number(await fade.evaluate(el => getComputedStyle(el).opacity));
  assert(partialOpacity > 0 && partialOpacity < 1, 'Fade must animate through partial black');
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  assert.equal(await fade.getAttribute('data-phase'), 'out', 'Repeated input cannot restart the transition');
  for (let i = 0; i < 30 && await fade.getAttribute('data-phase') !== 'black'; i++) await page.clock.runFor(16);
  assert.equal(await fade.getAttribute('data-phase'), 'black');
  assert.equal(await fade.evaluate(el => getComputedStyle(el).opacity), '1');
  assert(await cabin.isHidden(), 'Old scene remains until completely black');
  await page.screenshot({ path: '.local/transition-black.png' });
  await page.clock.runFor(17);
  assert(await cabin.isVisible(), 'Scene switches behind the black overlay');
  assert.equal(await fade.evaluate(el => getComputedStyle(el).opacity), '1');
  assert(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).id === 'room-transition'),
    'Black layer covers the cabin and intercepts pointer input');
  assert(await cabin.evaluate(el => el.inert));
  await page.locator('[data-floor="16"]').dispatchEvent('click');
  assert.equal(await page.locator('[data-floor="16"]').getAttribute('aria-pressed'), 'false', 'Floor input blocked during fade');
  await finishSceneTransition(page);
  assert.equal(await cabin.evaluate(el => el.inert), false);
  assert(await cabin.evaluate(el => document.activeElement === el), 'Focus moves into the cabin after fade-in');
  assert(await cabin.isVisible());
  assert(await page.locator('#stage').evaluate(el => el.inert));
  assert.equal(await page.locator('#cabin-art').evaluate(el => el.naturalWidth), 1536);
  const floorButtons = page.locator('#cabin-floor-buttons button');
  assert.deepEqual(await floorButtons.evaluateAll(els => els.map(el => Number(el.dataset.floor))),
    [17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2]);
  for (const button of await floorButtons.all()) {
    if (await button.isDisabled()) continue;
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'true');
    await button.click();
    assert.equal(await button.getAttribute('aria-pressed'), 'false');
  }
  await page.screenshot({ path: '.local/cabin-desktop-open.png' });
  const playerPosition = await page.locator('#player').getAttribute('style');
  await hold('d', 200);
  assert.equal(await page.locator('#player').getAttribute('style'), playerPosition, 'World input is locked inside');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(1200);
  assert.equal(await page.locator('#cabin-scene').getAttribute('data-door'), 'closed');
  await page.keyboard.press('Escape');
  assert(await cabin.isVisible(), 'Cannot exit a closed cabin');
  await page.screenshot({ path: '.local/cabin-desktop-closed.png' });
  await page.locator('#cabin-open').click();
  await page.clock.runFor(1200);
  await page.locator('[data-floor="16"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(300);
  await page.locator('#cabin-open').click();
  await page.clock.runFor(1800);
  assert.equal(await cabin.getAttribute('data-floor'), '17', 'Reopening cancels departure');
  await page.locator('#cabin-close').click();
  await page.clock.runFor(1300);
  assert.equal(await cabin.getAttribute('data-moving'), 'true');
  assert(await page.locator('#cabin-open').isDisabled());
  assert(await page.locator('#cabin-exit').isDisabled());
  await page.keyboard.press('Escape');
  assert(await cabin.isVisible());
  await page.clock.runFor(2400);
  assert.equal(await cabin.getAttribute('data-floor'), '16');
  await page.locator('#cabin-exit').click();
  assert(await cabin.isVisible(), 'Cabin remains visible until departure fade reaches black');
  assert.equal(await page.locator('header span').textContent(), '17F · 00:00');
  await page.clock.runFor(150);
  assert(await cabin.isVisible());
  assert(await page.evaluate(() => document.elementFromPoint(innerWidth / 2, innerHeight / 2).id === 'room-transition'));
  await page.keyboard.press('Escape');
  await finishSceneTransition(page);
  const header = () => page.locator('header span').textContent();
  const playerX = () => page.locator('#player').evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m41 + 96);
  const walkTo = async x => {
    const from = await playerX();
    await hold(x < from ? 'a' : 'd', Math.abs(x - from) / 200 * 1000);
  };
  // Corridor with three enterable rooms, three elevators and a locked stair door; ends where it started.
  const checkRoomFloor = async (floor, corridorHeader, rooms) => {
    assert.equal(await header(), corridorHeader);
    assert.equal(await page.locator('#world').evaluate(el => el.style.width), '3700px');
    assert.deepEqual(await page.locator('#dynamic-scene .floor-room-sign').allTextContents(),
      rooms.map(entry => entry.name).reverse(), `${floor}F corridor has three room fronts`);
    assert.equal(await page.locator('#dynamic-scene .room-door').count(), 3, 'One door per room');
    assert.equal(await page.locator('#dynamic-scene .door.elevator').count(), 3);
    assert.equal(await page.locator('#dynamic-scene .door:not(.elevator)').count(), 1, 'One stair door');
    assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), 0, 'Props live inside the rooms');
    await page.clock.runFor(100);
    const startX = await playerX();
    await walkTo(3510);
    assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 비상계단 (잠김)');
    await page.keyboard.press('e');
    await page.clock.runFor(800);
    assert.equal(await page.locator('#world').getAttribute('data-room'), 'dynamic', 'Locked stairs do not change scene');
    assert.equal(await header(), corridorHeader);
    assert.match(await page.locator('#interaction-status').textContent(), /비상계단 문이 잠겨/);
    await page.screenshot({ path: `.local/floor-${floor}.png` });
    for (const [index, { name, props, inspectX, hintText, message }] of rooms.entries()) {
      const doorCenter = [2400, 1600, 800][index];
      await walkTo(doorCenter);
      assert.equal(await page.locator('#interaction-hint').textContent(), `E · ${name} 들어가기`);
      await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await header(), `${floor}F · ${name}`);
      assert.equal(await page.locator('#world').evaluate(el => el.style.width), '2400px');
      assert.equal(await page.locator('#dynamic-scene .door').count(), 0, 'Rooms have no elevators');
      assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Props do not collide');
      await page.locator('#dynamic-scene .floor-prop img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
      assert.equal(await page.locator('#dynamic-scene .floor-prop').count(), props);
      await page.clock.runFor(100);
      assert(Math.abs(await playerX() - 108) < 1, 'Enter at the room door');
      await walkTo(inspectX);
      assert.equal(await page.locator('#interaction-hint').textContent(), hintText);
      await page.keyboard.press('e');
      assert.match(await page.locator('#interaction-status').textContent(), message);
      await page.screenshot({ path: `.local/floor-${floor}-room-${index}.png` });
      await walkTo(140);
      assert.equal(await page.locator('#interaction-hint').textContent(), 'E · 복도로 나가기');
      await page.keyboard.press('e');
      await finishSceneTransition(page);
      assert.equal(await header(), corridorHeader);
      await page.clock.runFor(100);
      assert(Math.abs(await playerX() - (doorCenter - 20)) < 1, 'Return to the same room door');
    }
    await walkTo(startX);
    await page.clock.runFor(100);
  };
  await checkRoomFloor(16, '16F · 경영지원팀', [
    { name: '탕비실', props: 7, inspectX: 960, hintText: 'E · 음료 자판기 조사', message: /자판기 불이 꺼져/ },
    { name: '소회의실', props: 6, inspectX: 580, hintText: 'E · 화이트보드 조사', message: /ARCHI팀 전력 예산/ },
    { name: '경영지원팀 사무실', props: 8, inspectX: 2110, hintText: 'E · 복합기 조사', message: /B2 서버실/ },
  ]);
  assert(await page.locator('#player').evaluate(el =>
    Math.abs(new DOMMatrix(getComputedStyle(el).transform).m42 + 178 - 570) < 1));
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  assert(await cabin.isVisible(), 'Can reboard at the arrival floor');
  for (let floor = 15; floor >= 1; floor--) {
    await page.locator(`#cabin-floor-buttons [data-floor="${floor}"]`).click();
    if (floor !== 15) await page.locator('#cabin-close').click();
    await page.clock.runFor(floor === 15 ? 5300 : 3600);
    assert.equal(await cabin.getAttribute('data-floor'), String(floor));
    await page.locator('#cabin-exit').click();
    await finishSceneTransition(page);
    if (floor === 15) {
      await checkRoomFloor(15, '15F · 인사총무팀', [
        { name: '문서 보관실', props: 8, inspectX: 630, hintText: 'E · 출입 기록 캐비닛 조사', message: /변경자: SYSTEM/ },
        { name: '방문객 대기실', props: 6, inspectX: 520, hintText: 'E · 안내 데스크 조사', message: /방문 기록 태블릿/ },
        { name: '인사팀 사무실', props: 8, inspectX: 1850, hintText: 'E · 화이트보드 조사', message: /보안 로봇 인식 DB/ },
      ]);
    } else {
      assert.equal(await page.locator('header span').textContent(), `${floor}F · 빈 층`);
      assert.equal(await page.locator('#dynamic-scene .solid').count(), 3, 'Only floor and boundary walls');
      assert.equal(await page.locator('#dynamic-scene .door').count(), 3, 'Three return elevators');
      assert.equal(await page.locator('#dynamic-scene .solid:not(.floor):not(.boundary), #dynamic-scene .panel').count(), 0);
    }
    await page.clock.runFor(100);
    if (floor === 10) await page.screenshot({ path: '.local/empty-floor-10.png' });
    await page.keyboard.press('e');
    await finishSceneTransition(page);
    assert(await cabin.isVisible(), `Floor ${floor} must allow reboarding`);
  }
  const seen = new Set();
  await page.locator('[data-floor="-2"]').click();
  await page.locator('#cabin-close').click();
  for (let i = 0; i < 10; i++) {
    await page.clock.runFor(500);
    seen.add(await cabin.getAttribute('data-floor'));
  }
  assert(seen.has('-1') && seen.has('-2') && !seen.has('0'), 'Basement travel skips floor zero');
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('header span').textContent(), 'B2 · 빈 층');
  assert.equal(await page.locator('#dynamic-scene .solid').count(), 3);
  await page.clock.runFor(100);
  await page.keyboard.press('e');
  await finishSceneTransition(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await cabin.evaluate(el => { el.scrollLeft = el.scrollWidth - el.clientWidth; });
  await page.locator('[data-floor="-1"]').click();
  await page.locator('#cabin-close').click();
  await page.clock.runFor(3600);
  assert.equal(await cabin.getAttribute('data-floor'), '-1');
  await page.locator('#cabin-alarm').click();
  assert.equal(await page.locator('#cabin-status').textContent(), '비상벨 작동');
  await page.screenshot({ path: '.local/cabin-mobile.png' });
  await page.locator('#cabin-exit').focus();
  await page.keyboard.press('Tab');
  assert(await page.evaluate(() => document.getElementById('elevator-cabin').contains(document.activeElement)));
  await page.locator('#cabin-exit').click();
  await finishSceneTransition(page);
  assert.equal(await page.locator('header span').textContent(), 'B1 · 빈 층');
  assert.equal(await page.locator('#dynamic-scene .solid').count(), 3);
  assert.equal(await page.locator('#stage').evaluate(el => el.inert), false);
  assert.deepEqual(errors, []);
  console.log('PASS: 19 mouse floor buttons, door controls, reopen cancellation, travel locks, same-car reboarding, all-floor destinations, basement numbering, alarm, keyboard focus and mobile cabin.');
} finally {
  await browser.close();
}
