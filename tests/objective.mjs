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
  await waitTyped('퇴근하기', '오늘 일은 끝났다. 집에 가자.');
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

  // 목표 창은 오른쪽 위, 현재 위치는 지도 버튼 왼쪽(오른쪽 위), 가방 버튼은 가운데 아래에 있다.
  const box = await objective.boundingBox();
  const viewport = page.viewportSize();
  assert(box.x + box.width > viewport.width - 40 && box.y < 140, 'The objective sits at the top right');
  const place = await page.locator('header span').boundingBox();
  const mapButton = await page.locator('#map-button').boundingBox();
  assert(mapButton.x + mapButton.width > viewport.width - 40 && mapButton.y < 40, 'The map button sits at the top right');
  assert(place.x + place.width <= mapButton.x && place.y < 70, 'The current place sits left of the map button');
  const bag = await page.locator('#inventory-button').boundingBox();
  assert(Math.abs(bag.x + bag.width / 2 - viewport.width / 2) < 2 && bag.y + bag.height > viewport.height - 40, 'The bag button sits at the bottom center');
  await page.screenshot({ path: '.local/objective.png' });

  const titleAfter = async change => {
    await page.evaluate(change);
    await page.waitForTimeout(100);
    return page.evaluate(() => currentObjective.title);
  };
  assert.equal(await titleAfter(() => collectedItems.add('rooftop-key')), '정전', 'Picking up the rooftop key keeps the blackout objective');
  assert.equal(await titleAfter(() => collectedItems.add('rooftop-unlocked')), '비상 전력 켜기');
  assert.equal(await titleAfter(() => setSolarPower(true)), '17층 전등 켜기');
  await waitTyped('17층 전등 켜기', '전력은 돌아왔지만 17층은 아직 어둡다.');
  assert.equal(await titleAfter(() => supplySolarFloor(17)), '관리실 비밀번호 찾기');
  assert.equal(await titleAfter(() => collectedItems.add('f17-manager-memo')), '관리실 열기');
  assert.equal(await titleAfter(() => collectedItems.add('f17-manager-unlocked')), '회로 안내도 확인');
  assert.equal(await titleAfter(() => collectedItems.add('f17-circuit-guide-read')), '승강기 비상 회선 연결');
  assert.equal(await titleAfter(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); }), '전력 앱 내려받기');
  await waitTyped('전력 앱 내려받기', '층마다 전력을 직접 돌릴 방법이 필요하다. 이 층 컴퓨터에 무언가 있을지도.');
  assert.equal(await titleAfter(() => collectedItems.add('solar-app-downloaded')), '전력 앱 설치하기');
  await waitTyped('전력 앱 설치하기', '받은 파일을 휴대폰으로 옮겨야 한다.');

  // 먼저 1층으로 가 버린 저장도, 설치를 마치기 전에는 정문으로 보내지 않는다.
  const beforeEarlyVisit = await page.evaluate(() => progressSnapshot());
  await page.evaluate(() => { performFloorChange('f1', 0); refreshObjective(); saveProgress(); });
  await page.reload(); await page.locator('#menu-continue').click();
  await page.waitForFunction(() => currentObjective?.title === '전력 앱 설치하기');
  assert(await page.evaluate(() => collectedItems.has('f1-reached')));
  assert.equal(await titleAfter(() => supplySolarFloor(1)), '전력 앱 설치하기', 'Emergency UPS keeps the 17F computer available when lighting is rerouted');
  await page.evaluate(data => restoreProgress(data), beforeEarlyVisit);
  assert.equal(await titleAfter(() => collectedItems.add('solar-app-installed')), '1층 전력 켜기');
  await waitTyped('1층 전력 켜기', '1층은 아직 어둠 속이다. 내려가기 전에 불을 밝혀야 한다.');
  assert.equal(await titleAfter(() => supplySolarFloor(1)), '퇴근하기');
  await waitTyped('퇴근하기', '승강기가 다시 움직인다. 아래로 내려가자.');
  // 처음 1층에 내려오면 같은 제목 아래 내용이 '드디어 1층이다. 이제 집에 가자.'로 바뀌고, 다른 층으로 가도 유지된다.
  await page.evaluate(() => { solarPoweredFloors = [1]; updatePowerState(); performFloorChange('f1', 0); });
  await waitTyped('퇴근하기', '드디어 1층이다. 이제 집에 가자.');
  await page.evaluate(() => performFloorChange('f17', 0));
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => currentObjective.text), '드디어 1층이다. 이제 집에 가자.');

  // 로봇 추격이 끝나고 3초 뒤 혼잣말 컷씬이 나오고, Esc로 끝내면 '정신 불안' 목표가 생긴다.
  await page.evaluate(() => {
    collectedItems.add('f1-chase-ended'); // 추격이 끝난 것으로 치면 3초 뒤 컷씬이 시작된다
    collectedItems.delete('solar-app-installed'); solarPoweredFloors = [17]; updatePowerState(); // 이전 저장의 후속 이야기는 설치 목표로 되돌리지 않는다
    performFloorChange('f1', 0);
  });
  await page.locator('#story-scene').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#story-caption').textContent(), '왜 경비 로봇이 나를 공격하려고 했던 거지?');
  await page.waitForTimeout(3500);
  assert.equal(await page.locator('#story-caption').textContent(), '왜 경비 로봇이 나를 공격하려고 했던 거지?', '클릭하기 전에는 대사가 넘어가지 않는다');
  await page.locator('#story-caption').click();
  assert(await page.locator('#story-caption').textContent().then(text => text.startsWith('으윽')), '클릭하면 다음 대사');
  await page.locator('#story-caption').click();
  await page.locator('#story-caption').click();
  assert(await page.locator('#story-caption').textContent().then(text => text.startsWith('편의점으로 가보자')));
  await page.locator('#story-caption').click();
  assert(await page.locator('#story-scene').isHidden(), '마지막 대사에서 클릭하면 끝난다');
  assert.equal(await page.evaluate(() => collectedItems.has('story-anxiety-seen')), true);
  await waitTyped('정신 불안', '머리가 어지럽다. 마음을 진정시킬 무언가가 필요하다. 편의점으로 가보자.');

  // 항불안제를 챙기거나 사용해도 목표는 유지되고, 사용하고 4초 뒤 두 번째 컷씬이 나오고, 끝나면 '로봇의 습격! 그 이유는?' 목표가 생긴다.
  await page.evaluate(() => collectedItems.add('f16-antianxiety'));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => currentObjective.title), '정신 불안', '챙기기만 해서는 목표가 바뀌지 않는다');
  await page.evaluate(() => collectedItems.add('f16-antianxiety-used'));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => currentObjective.title), '정신 불안', '사용한 뒤 컷씬이 나오기 전까지도 목표가 유지된다');
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '휴.. 겨우 정신을 차렸네..');
  await page.keyboard.press('Escape');
  assert(await page.locator('#story-scene').isHidden());
  await waitTyped('로봇의 습격! 그 이유는?', 'ARCHI를 만든 사람들은 무언가 알고 있을 것이다.');

  // 로봇의 습격! 그 이유는? 목표 도중 게이트에 출입증을 태우면(조사창을 닫은 뒤) 세 번째 컷씬이 나오고, 끝나면 '출입증 쌔비기' 목표가 생긴다.
  await page.evaluate(() => collectedItems.add('story-gate-tagged'));
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '아 맞다 나 일용직이였지');
  await page.keyboard.press('Escape');
  await waitTyped('출입증 쌔비기', '출입증이 필요하다. 가까운 곳에 빌릴 만한 사람이 없을까?');
  assert.equal(await page.evaluate(() => officePostit.element.hidden), false, '출입증 쌔비기가 시작되면 옆자리 포스트잇이 생긴다');
  // 포스트잇을 조사하면 같은 제목 아래 내용이 '쪽지에 적힌 그 사람이라면 출입증을 갖고 있겠지.'로 바뀐다.
  await page.evaluate(() => {
    performFloorChange('f17', null); performRoomChange?.();
    Body.setPosition(body, { x: officePostit.x + officePostit.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction();
  });
  await page.keyboard.press('e');
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => currentObjective.text), '출입증이 필요하다. 가까운 곳에 빌릴 만한 사람이 없을까?', '조사창이 열려 있는 동안은 목표가 그대로다');
  await page.keyboard.press('Escape');
  await waitTyped('출입증 쌔비기', '쪽지에 적힌 그 사람이라면 출입증을 갖고 있겠지.');

  // 사원증을 챙기면 목표가 '로봇의 습격! 그 이유는?'으로 돌아가고, 12층 게이트 앞에서 컷씬이 다시 나오지 않는다.
  await page.evaluate(() => { collectedItems.add('f16-badge'); collectedItems.delete('story-gate-tagged'); });
  await waitTyped('로봇의 습격! 그 이유는?', 'ARCHI를 만든 사람들은 무언가 알고 있을 것이다.');
  await page.evaluate(() => { performFloorChange('f12'); });
  await page.waitForTimeout(500);
  assert(await page.locator('#story-scene').isHidden(), '컷씬은 다시 나오지 않는다');

  assert.equal(await titleAfter(() => collectedItems.add('goal-f12-memo')), '로봇의 습격! 그 이유는?', 'Reading a memo does not bypass the authored evaluation puzzle');
  assert.equal(await titleAfter(() => collectedItems.add('f12-evaluation-solved')), '7층 조사하기');
  assert.equal(await titleAfter(() => collectedItems.add('f7-external-connection-solved')), '외부 연결 통로 찾기');
  assert.equal(await titleAfter(() => collectedItems.add('f13-backup-device')), '지하에서 무슨 일이?');
  assert.equal(await titleAfter(() => collectedItems.add('b1-elevator')), 'B2 서버실 조사하기');
  assert.equal(await titleAfter(() => collectedItems.add('goal-b2-console')), 'ARCHI 멈추기');

  // 진행도는 자동 저장으로 이어진다.
  await page.evaluate(() => saveProgress());
  await page.reload();
  await page.locator('#menu-continue').click();
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => currentObjective?.title), 'ARCHI 멈추기');
  assert.deepEqual(errors, []);
  console.log('objective: ok');
} finally {
  await browser.close();
}
