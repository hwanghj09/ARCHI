import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const [html, inspection, interaction, helpers] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('js/interaction/inspection.js', 'utf8'),
  readFile('js/interaction/interaction.js', 'utf8'),
  readFile('js/floors/helpers.js', 'utf8'),
]);

assert(html.includes('id="inspection"') && html.includes('id="inspection-title"') && html.includes('id="inspection-text"'));
assert(html.includes('inspection.js'));
assert(html.includes('assets/ui/dialogue-frame.png'));
assert(interaction.includes('openInspection(nearbyDoor.name, inspectionMessage, '));
for (const name of ['위생용품 수납장', '휴지통', '미끄럼 주의 표지', '세면대 거울', '화장실 칸', '비상 호출 버튼']) {
  assert(helpers.includes(name), `restroom should expose ${name}`);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(async () => {
    const image = new Image(); image.src = 'assets/ui/dialogue-frame.png'; await image.decode();
    solarPoweredFloors = [16];
    performFloorChange('f16-cafe', 0, 'exit');
    Body.setPosition(body, { x: 950, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render(); interact();
  });
  assert.equal(await page.locator('#inspection-title').textContent(), '카페 테이블');
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'card', 'First inspection displays the ID card');
  assert(await page.locator('#inspection').evaluate(panel => {
    const layer = Number(getComputedStyle(panel).zIndex);
    return ['sanity-hud', 'game-menu-button'].every(id => layer > Number(getComputedStyle(document.getElementById(id)).zIndex));
  }), 'Gameplay HUD and menu stay behind the inspection content');
  await page.keyboard.press('Escape');
  await page.keyboard.press('e');
  assert(await page.locator('#inspection-sheet').isHidden(), 'Reinspection uses the plain dialogue');
  await page.keyboard.press('e');
  assert(await page.locator('#inspection').isVisible(), 'E reveals the text before closing');
  assert.match(await page.locator('#inspection-text').textContent(), /사원증/);
  assert.equal(await page.locator('#interaction-status').textContent(), '');
  assert(await page.locator('#inspection-close').evaluate(el => document.activeElement === el));
  await page.keyboard.press('Tab');
  assert(await page.locator('#inspection-text').evaluate(el => document.activeElement === el));
  await page.keyboard.press('Shift+Tab');
  assert(await page.locator('#inspection-close').evaluate(el => document.activeElement === el));
  await mkdir('.local', { recursive: true });
  await page.screenshot({ path: '.local/dialogue-desktop.png' });
  const fits = () => page.evaluate(() => {
    const panel = document.getElementById('inspection').getBoundingClientRect();
    const controls = document.querySelector('nav').getBoundingClientRect();
    const close = document.getElementById('inspection-close').getBoundingClientRect();
    return panel.left >= 0 && panel.right <= innerWidth && panel.top >= 0 &&
      panel.bottom <= controls.top && close.bottom <= panel.bottom;
  });
  assert(await fits(), 'Desktop dialogue stays above controls');
  await page.setViewportSize({ width: 390, height: 844 });
  assert(await fits(), 'Mobile dialogue fits above controls');
  await page.screenshot({ path: '.local/dialogue-mobile.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => openInspection('긴 조사 기록', '긴 기록도 대화창 안에서 끝까지 읽을 수 있다.\n'.repeat(30)));
  await page.locator('#inspection-close').click();
  assert(await fits(), 'Landscape dialogue fits and close button remains visible');
  assert(await page.locator('#inspection-text').evaluate(el => el.scrollHeight > el.clientHeight));
  await page.keyboard.press('Escape');
  assert(await page.locator('#inspection').isHidden());
  await page.evaluate(() => openInspection('메모', '다시 조사한다.'));
  assert.equal(await page.locator('#inspection-text').evaluate(el => el.scrollTop), 0);
  await page.keyboard.press('e');
  assert(await page.locator('#inspection').isVisible());
  await page.keyboard.press('e');
  assert(await page.locator('#inspection').isHidden());
  await page.evaluate(() => openInspection('메모', '이동하면 닫힌다.'));
  await page.keyboard.press('d');
  assert(await page.locator('#inspection').isHidden());
  await page.evaluate(() => openInspection('메모', '터치로 닫는다.'));
  await page.locator('#inspection-close').click();
  assert(await page.locator('#inspection').isVisible());
  await page.locator('#inspection-close').click();
  assert(await page.locator('#inspection').isHidden());

  // Control time to verify partial output, grapheme boundaries, completion and stale timers.
  const message = '한글👩‍🔧 조사';
  await page.evaluate(text => openInspection('타이핑', text), message);
  assert.equal(await page.locator('#inspection-text').textContent(), '');
  assert.equal(await page.locator('#inspection-description').textContent(), message);
  await page.clock.runFor(30);
  assert.equal(await page.locator('#inspection-text').textContent(), '한');
  await page.clock.runFor(60);
  assert.equal(await page.locator('#inspection-text').textContent(), '한글👩‍🔧');
  await page.clock.runFor(90);
  assert.equal(await page.locator('#inspection-text').textContent(), message);
  assert.equal(await page.locator('#inspection-close').textContent(), '닫기 ▾');
  await page.evaluate(() => openInspection('닫기', '닫으면 타이머도 멈춘다.'));
  await page.clock.runFor(30);
  await page.keyboard.press('Escape');
  await page.clock.runFor(300);
  assert.equal(await page.locator('#inspection-text').textContent(), '닫');
  await page.evaluate(() => {
    openInspection('이전', '이전 문장이 섞이면 안 된다.');
    openInspection('새 조사', '새 문장');
  });
  await page.clock.runFor(120);
  assert.equal(await page.locator('#inspection-text').textContent(), '새 문장');
  await page.evaluate(() => openInspection('반복 입력', '길게 누른 E로 건너뛰지 않는다.'));
  await page.keyboard.down('e');
  await page.keyboard.down('e');
  await page.keyboard.up('e');
  assert(await page.locator('#inspection').isVisible(), 'Held E does not close after revealing');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => openInspection('동작 줄이기', '바로 표시한다.'));
  assert.equal(await page.locator('#inspection-text').textContent(), '바로 표시한다.');
  assert.deepEqual(errors, []);
  console.log('PASS: typewriter timing, Korean/emoji graphemes, reveal/close, timer cleanup, reduced motion, dialogue layout and focus.');
} finally {
  await browser.close();
}
