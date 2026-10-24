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

  // 공통 UI의 목표 제목(16px)은 내용(12px) 위에 놓인다.
  const sizes = await page.evaluate(() => ['objective-title', 'objective-text'].map(id => {
    const element = document.getElementById(id);
    return { size: parseFloat(getComputedStyle(element).fontSize), top: element.getBoundingClientRect().top };
  }));
  assert.deepEqual(sizes.map(entry => entry.size), [16, 12]);
  assert(sizes[0].top < sizes[1].top);

  // 공통 HUD: 위치·목표는 왼쪽 위, 지도·일시정지는 오른쪽 위, 도구는 오른쪽 아래에 있다.
  const box = await objective.boundingBox();
  const viewport = page.viewportSize();
  assert(box.x < 40 && box.y < 140, 'The objective sits at the top left');
  const place = await page.locator('header > span').boundingBox();
  const mapButton = await page.locator('#map-button').boundingBox();
  const pauseButton = await page.locator('#pause-button').boundingBox();
  assert(mapButton.x + mapButton.width <= pauseButton.x && pauseButton.x + pauseButton.width > viewport.width - 40 && mapButton.y < 40,
    'The map button sits beside pause at the top right');
  assert(place.x + place.width <= mapButton.x && place.y < 70, 'The current place sits left of the map button');
  const bag = await page.locator('#inventory-button').boundingBox();
  const phoneButton = await page.locator('#phone-button').boundingBox();
  assert(bag.x > viewport.width / 2 && bag.x + bag.width <= phoneButton.x && bag.y + bag.height > viewport.height - 40,
    'The bag button sits beside the phone at the bottom right');
  await page.screenshot({ path: '.local/objective.png' });

  const titleAfter = async change => {
    await page.evaluate(change);
    await page.evaluate(() => refreshObjective());
    return page.evaluate(() => currentObjective.title);
  };
  assert.equal(await titleAfter(() => collectedItems.add('rooftop-key')), '정전', 'Picking up the rooftop key keeps the blackout objective');
  assert.equal(await titleAfter(() => collectedItems.add('rooftop-unlocked')), '비상 전력 켜기');
  assert.equal(await titleAfter(() => setSolarPower(true)), '17층 전등 켜기');
  await waitTyped('17층 전등 켜기', '전력은 돌아왔지만 17층은 아직 어둡다.');
  assert.equal(await titleAfter(() => supplySolarFloor(17)), '관리실 비밀번호 찾기');
  assert.equal(await titleAfter(() => collectedItems.add('f17-manager-memo')), '관리실 열기');
  assert.equal(await titleAfter(() => collectedItems.add('f17-manager-unlocked')), '승강기 비상 회선 연결');
  assert.equal(await titleAfter(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); }), '퇴근하기');
  await waitTyped('퇴근하기', '승강기가 다시 움직인다. 아래로 내려가자.');

  // 어두운 1층: 정문으로 가 보면 문이 안 열리고, 혼잣말 뒤 안내 데스크를 가리킨다. 다른 층으로 가도 1층 목표가 유지된다.
  await page.evaluate(() => performFloorChange('f1', 0));
  await waitTyped('퇴근하기', '드디어 1층이다. 정문으로 나가자.');
  await page.evaluate(() => performFloorChange('f17', 0));
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => currentObjective.text), '드디어 1층이다. 정문으로 나가자.');
  const inspectNamed = name => page.evaluate(name => {
    const door = currentDoors.find(entry => entry.name === name);
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true; updateInteraction(); interact();
  }, name);
  await page.evaluate(() => performFloorChange('f1', 0));
  await inspectNamed('정문');
  assert.equal(await page.locator('#inspection-title').textContent(), '정문');
  await page.keyboard.press('Escape');
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '전기가 없으니 자동문도 안 열리네..');
  await page.keyboard.press('Escape');
  await waitTyped('퇴근하기', '정문에 전기가 없다. 안내 데스크에 로비 전원을 켤 방법이 있을지도.');

  // 안내 데스크 QR로 전력 앱이 설치된다.
  await inspectNamed('안내 데스크');
  assert.equal(await page.locator('#inspection-title').textContent(), '안내 데스크');
  assert.equal(await page.evaluate(() => collectedItems.has('solar-app-installed')), true, 'The lobby desk installs the power app');
  await page.keyboard.press('Escape');
  await waitTyped('퇴근하기', '휴대폰 전력 앱으로 1층에 전력을 보내자.');

  // 1층에 전력을 넣으면 1초 뒤 컷씬: 정문 화면에 내 이름이 뜨고, 깨어난 경비 로봇에게 쫓겨 1번 엘리베이터 앞까지 달아나고, 혼잣말을 한다.
  await page.evaluate(() => supplySolarFloor(1));
  await page.locator('#story-scene').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#story-caption').textContent(), '됐다, 불이 들어왔어. 이제 문만 열리면..');
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('#story-caption').textContent(), '됐다, 불이 들어왔어. 이제 문만 열리면..', '클릭하기 전에는 대사가 넘어가지 않는다');
  await page.locator('#story-caption').click();
  await page.waitForFunction(() => storyCaption.textContent.startsWith('정문 화면에..'), null, { timeout: 20000 });
  await page.locator('#story-caption').click();
  assert.equal(await page.locator('#story-caption').textContent(), '왜 내 이름이 저기 떠 있는 거야?');
  await page.locator('#story-caption').click();
  await page.waitForFunction(() => guardPatrol.mode === 'chase', null, { timeout: 20000 });
  await page.locator('#story-caption').click(); // 연출 중에는 클릭해도 넘어가지 않는다
  await page.waitForFunction(() => storyCaption.textContent === '헉.. 헉.. 저 로봇 왜 저래?', null, { timeout: 20000 });
  assert.deepEqual(await page.evaluate(() => [collectedItems.has('f1-chase-ended'), playerCaught, guardPatrol.mode !== 'chase',
    Math.abs(body.position.x - f1EscapeX()) < 10]), [true, false, true, true], 'Suho escapes to elevator 1 and the robot gives up');
  for (const line of ['정문엔 내 이름이 떠 있고, 로봇은 나만 쫓아왔어..', '으윽.. 야근해서 힘든 와중에 이런 일을 겪으니 너무 힘들다..',
    '항불안제라도 먹어야겠어..', '편의점이 몇 층이었더라?']) {
    await page.locator('#story-caption').click();
    assert.equal(await page.locator('#story-caption').textContent(), line);
  }
  await page.locator('#story-caption').click();
  await page.locator('#story-scene').waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => collectedItems.has('story-anxiety-seen')), true);
  await waitTyped('편의점은 몇 층?', '항불안제를 사러 편의점에 가야 한다. 엘리베이터 옆 층별 안내판을 확인하자.');
  // 층별 안내판을 보기 전에는 엘리베이터를 타지 않고 혼잣말만 한다.
  await page.evaluate(() => interact());
  assert.equal(await page.locator('#suho-line').textContent(), '편의점이 몇 층이더라…');
  assert.equal(await page.evaluate(() => selectingFloor || elevatorCars[0].travelling), false);
  await page.evaluate(() => { Body.setPosition(body, { x: 1483, y: body.position.y }); interact(); });
  assert.equal(await page.locator('#inspection-title').textContent(), '층별 안내판');
  await page.keyboard.press('Escape');
  await page.locator('#inspection').waitFor({ state: 'hidden' });
  await waitTyped('정신 불안', '머리가 어지럽다. 마음을 진정시킬 무언가가 필요하다. 편의점으로 가보자.');

  // 항불안제를 챙기거나 사용해도 목표는 유지되고, 사용하고 2초 뒤 두 번째 컷씬이 나오고, 끝나면 '나갈 방법 찾기' 목표가 생긴다.
  await page.evaluate(() => collectedItems.add('f16-antianxiety'));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => currentObjective.title), '정신 불안', '챙기기만 해서는 목표가 바뀌지 않는다');
  await waitTyped('정신 불안', '항불안제를 복용하자.'); // 항불안제를 찾은 뒤에는 내용이 복용으로 바뀐다
  await page.evaluate(() => collectedItems.add('f16-antianxiety-used'));
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(() => currentObjective.title), '정신 불안', '사용한 뒤 컷씬이 나오기 전까지도 목표가 유지된다');
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '휴.. 겨우 정신을 차렸네..');
  await page.keyboard.press('Escape');
  assert(await page.locator('#story-scene').isHidden());
  await waitTyped('나갈 방법 찾기', '정문은 SYSTEM이 내 이름으로 막아 두었다. 12층 ARCHI 개발팀을 조사해 보자.');

  // 나갈 방법 찾기 목표 도중 게이트에 출입증을 태우면(조사창을 닫은 뒤) 세 번째 컷씬이 나오고, 끝나면 '출입증 쌔비기' 목표가 바로 16층 카페를 가리킨다.
  await page.evaluate(() => collectedItems.add('story-gate-tagged'));
  await page.locator('#story-scene').waitFor({ state: 'visible', timeout: 10000 });
  assert.equal(await page.locator('#story-caption').textContent(), '아 맞다 나 일용직이었지');
  await page.keyboard.press('Escape');
  await waitTyped('출입증 쌔비기', '팀장은 16층 카페에 사원증을 자주 두고 간다. 카페에 가 보자.');

  // 사원증을 챙기면 목표가 '나갈 방법 찾기'로 돌아가고, 12층 게이트 앞에서 컷씬이 다시 나오지 않는다.
  await page.evaluate(() => { collectedItems.add('f16-badge'); collectedItems.add('story-badge-got-seen'); collectedItems.delete('story-gate-tagged'); }); // 사원증 컷씬은 아래 별도 확인에서 본다
  await waitTyped('나갈 방법 찾기', '정문은 SYSTEM이 내 이름으로 막아 두었다. 12층 ARCHI 개발팀을 조사해 보자.');
  await page.evaluate(() => { performFloorChange('f12'); });
  await page.waitForTimeout(500);
  assert(await page.locator('#story-scene').isHidden(), '컷씬은 다시 나오지 않는다');

  // 층 이동 혼잣말(story-scene.js)은 목표 갱신을 컷씬 뒤로 미루므로 이 순서 확인에서는 이미 본 것으로 둔다.
  await page.evaluate(() => ['story-repro-seen', 'story-external-seen', 'story-device-seen', 'story-rehearsal-seen'].forEach(flag => collectedItems.add(flag)));
  assert.equal(await titleAfter(() => collectedItems.add('goal-f12-memo')), '나갈 방법 찾기', 'Reading a memo does not bypass the authored evaluation puzzle');
  assert.equal(await titleAfter(() => collectedItems.add('f12-evaluation-solved')), '데이터 수집');
  assert.equal(await titleAfter(() => collectedItems.add('goal-f5-note')), '기록 재현');
  assert.equal(await titleAfter(() => collectedItems.add('f8-repro-record')), '로그 분석');
  assert.equal(await titleAfter(() => collectedItems.add('f7-training-time-solved')), 'ARCHI의 흔적');
  assert.equal(await titleAfter(() => collectedItems.add('f7-external-connection-solved')), '외부 연결 통로 찾기');
  assert.equal(await titleAfter(() => collectedItems.add('f13-backup-device')), '장치 확인하기');
  assert.match(await page.evaluate(() => currentObjective.text), /17층 내 자리 컴퓨터의 외부 저장 장치/);
  assert.equal(await titleAfter(() => collectedItems.add('f17-usb-played')), '2층 조사하기');
  assert.equal(await titleAfter(() => collectedItems.add('f2-projected')), '지하에서 무슨 일이?');
  // 12층 이후 목표는 갈 곳(층·방)을 알려 준다.
  assert.match(await page.evaluate(() => currentObjective.text), /B2/);
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
