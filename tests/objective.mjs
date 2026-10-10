import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  const objective = page.locator('#objective');
  await objective.waitFor({ state: 'visible' });
  // 목표는 제목 → 내용 순서로 한 글자씩(띄어쓰기는 다음 글자와 함께) 0.1초 간격으로 쳐진다.
  const typed = () => page.evaluate(() => [objectiveTitle.textContent, objectiveText.textContent]);
  const waitTyped = (title, text) => page.waitForFunction(([title, text]) =>
    objectiveTitle.textContent === title && objectiveText.textContent === text, [title, text], { timeout: 15000 });
  await waitTyped('퇴근하기', '엘리베이터로 가자.');
  await page.evaluate(() => {
    window.typedFrames = [];
    new MutationObserver(() => typedFrames.push(`${objectiveTitle.textContent}|${objectiveText.textContent}`))
      .observe(objectivePanel, { childList: true, characterData: true, subtree: true });
  });
  const started = Date.now();
  await page.evaluate(() => { buildingBlackout = true; });
  await waitTyped('정전', '정전이 발생했다. 전력을 확보하기 위한 수단을 찾아보자.');
  const frames = [...new Set(await page.evaluate(() => typedFrames))].filter(frame => frame !== '|');
  const steps = ['정', '정전'].map(title => `${title}|`);
  const chars = [...'정전이 발생했다. 전력을 확보하기 위한 수단을 찾아보자.'];
  chars.forEach((char, index) => { if (char.trim()) steps.push(`정전|${chars.slice(0, index + 1).join('')}`); });
  assert.deepEqual(frames, steps);
  assert(Date.now() - started >= (steps.length - 2) * 100 + 400 - 50, 'Each character waits about 0.1s, and the text waits 0.4s after the title');
  assert.deepEqual(await typed(), ['정전', '정전이 발생했다. 전력을 확보하기 위한 수단을 찾아보자.']);

  // 제목은 내용 위에 있고 2pt(≈2.67px) 크다.
  const sizes = await page.evaluate(() => ['objective-title', 'objective-text'].map(id => {
    const element = document.getElementById(id);
    return { size: parseFloat(getComputedStyle(element).fontSize), top: element.getBoundingClientRect().top };
  }));
  assert(Math.abs(sizes[0].size - sizes[1].size - 8 / 3) < .05, `title ${sizes[0].size}px vs text ${sizes[1].size}px`);
  assert(sizes[0].top < sizes[1].top);

  // 메뉴·가방 버튼 아래에 놓인다.
  const box = await objective.boundingBox();
  for (const id of ['#game-menu-button', '#inventory-button']) {
    const button = await page.locator(id).boundingBox();
    assert(box.y >= button.y + button.height, `${id} sits above the objective`);
  }
  await page.screenshot({ path: '.local/objective.png' });

  const titleAfter = async change => {
    await page.evaluate(change);
    await page.waitForTimeout(100);
    return page.evaluate(() => currentObjective.title);
  };
  assert.equal(await titleAfter(() => collectedItems.add('rooftop-key')), '정전', 'Picking up the rooftop key keeps the blackout objective');
  assert.equal(await titleAfter(() => collectedItems.add('rooftop-unlocked')), '비상 전력 켜기');
  assert.equal(await titleAfter(() => { solarEnabled = true; }), '퇴근하기');
  await waitTyped('퇴근하기', '엘리베이터를 타고 1층으로 내려가자.');
  // 처음 1층에 내려오면 같은 제목 아래 내용이 '정문으로 나가자.'로 바뀌고, 다른 층으로 가도 유지된다.
  await page.evaluate(() => { solarPoweredFloors = [1]; updatePowerState(); performFloorChange('f1', 0); });
  await waitTyped('퇴근하기', '정문으로 나가자.');
  await page.evaluate(() => performFloorChange('f17', 0));
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => currentObjective.text), '정문으로 나가자.');

  // 층별 안내판을 읽으면 12층 조사로 넘어간다(실제 조사 경로).
  await page.evaluate(() => {
    solarPoweredFloors = [1]; updatePowerState();
    performFloorChange('f1', 0);
    const board = currentDoors.find(door => door.name === '층별 안내판');
    Body.setPosition(body, { x: board.x + board.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render(); updateInteraction();
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => currentObjective.title), '12층 조사하기');
  await page.keyboard.press('Escape');

  assert.equal(await titleAfter(() => collectedItems.add('goal-f12-memo')), '7층 조사하기');
  assert.equal(await titleAfter(() => collectedItems.add('goal-f7-log')), 'B2로 가는 길 찾기');
  assert.equal(await titleAfter(() => collectedItems.add('b1-elevator')), 'B2 서버실 조사하기');
  assert.equal(await titleAfter(() => collectedItems.add('goal-b2-console')), 'ARCHI 멈추기');

  // 진행도는 자동 저장으로 이어진다.
  await page.evaluate(() => saveProgress());
  await page.reload();
  await page.locator('#menu-start').click();
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => currentObjective?.title), 'ARCHI 멈추기');
  assert.deepEqual(errors, []);
  console.log('objective: ok');
} finally {
  await browser.close();
}
