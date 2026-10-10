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

  // 로봇 추격이 끝나고 3초 뒤 혼잣말 컷씬이 나오고, Esc로 끝내면 '정신 불안' 목표가 생긴다.
  await page.evaluate(() => {
    collectedItems.add('f1-chase-ended'); // 추격이 끝난 것으로 치면 3초 뒤 컷씬이 시작된다
    performFloorChange('f1', 0);
  });
  await page.locator('#story-scene').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#story-caption').textContent(), '왜 경비 로봇이 나를 공격하려고 했던 거지?');
  await page.waitForFunction(() => storyCaption.textContent.startsWith('으윽'), null, { timeout: 5000 });
  await page.waitForFunction(() => storyCaption.textContent.startsWith('16층 편의점'), null, { timeout: 5000 });
  await page.keyboard.press('Escape');
  assert(await page.locator('#story-scene').isHidden(), 'Esc ends the scene');
  assert.equal(await page.evaluate(() => collectedItems.has('story-anxiety-seen')), true);
  await waitTyped('정신 불안', '16층 편의점에서 항불안제를 찾자.');

  // 항불안제를 챙기거나 사용해도 목표는 유지되고, 사용하고 4초 뒤 두 번째 컷씬이 나오고, 끝나면 '로봇의 습격! 그 이유는?' 목표가 생긴다.
  await page.evaluate(() => collectedItems.add('f16-antianxiety'));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => currentObjective.title), '정신 불안', '챙기기만 해서는 목표가 바뀌지 않는다');
  await page.evaluate(() => collectedItems.add('f16-antianxiety-used'));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => currentObjective.title), '정신 불안', '사용한 뒤 컷씬이 나오기 전까지도 목표가 유지된다');
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '휴.. 겨우 정신을 차렸네..');
  await page.waitForFunction(() => storyCaption.textContent.startsWith('12층 ARCHI'), null, { timeout: 12000 });
  await page.keyboard.press('Escape');
  assert(await page.locator('#story-scene').isHidden());
  await waitTyped('로봇의 습격! 그 이유는?', '12층 ARCHI 개발 팀을 조사하자.');

  // 로봇의 습격! 그 이유는? 목표 도중 게이트에 출입증을 태우면(조사창을 닫은 뒤) 세 번째 컷씬이 나오고, 끝나면 '출입증 쌔비기' 목표가 생긴다.
  await page.evaluate(() => collectedItems.add('story-gate-tagged'));
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '아 맞다 나 일용직이였지');
  await page.waitForFunction(() => storyCaption.textContent === '잠깐 빌리지 뭐', null, { timeout: 12000 });
  await page.keyboard.press('Escape');
  await waitTyped('출입증 쌔비기', '옆자리 직원의 자리를 조사하자.');

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
