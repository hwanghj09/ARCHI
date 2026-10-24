import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// 5층 복도 환풍구: 앞에 앉아서 E를 누르면 화면을 전환해 안에 숨는다. 숨은 동안 R-03은 보지도 붙잡지도 못한다. E로 나온다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));
  const state = () => page.evaluate(() => ({ hiding: hidingInVent, view: !document.getElementById('vent-view').hidden,
    sprite: sprite.style.visibility, caught: playerCaught, robot: roamer.mode }));

  const toVent = () => page.evaluate(() => {
    const door = currentDoors.find(entry => entry.type === 'vent');
    Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 }); grounded = true; cameraX = cameraTarget();
    return { x: door.x, state: door.element.dataset.vent, image: getComputedStyle(door.element).backgroundImage };
  });
  let vent = await page.evaluate(() => { triggerBuildingBlackout(); performFloorChange('f5'); });
  vent = await toVent();
  assert.equal(vent.x, 1560);
  assert.match(vent.image, /wall-vent\/vent-closed\.png/, 'Vents start with the cover screwed on');

  // 빠루 없이는 조사만 된다.
  await page.clock.runFor(100);
  assert.match(await page.locator('#interaction-hint').textContent(), /환풍구 조사/);
  await page.evaluate(() => interact());
  assert.deepEqual(await page.evaluate(() => [usingInspection, ventPrying()]), [true, false], 'Without the crowbar the cover only gets inspected');
  await page.evaluate(() => closeInspection());

  // 빠루가 있으면 E로 뜯기 시작한다: 덮개가 들린 그림, 빠루, 게이지. 가만히 있으면 게이지가 줄어든다.
  await page.evaluate(() => collectedItems.add('f17-crowbar'));
  await page.clock.runFor(100);
  assert.match(await page.locator('#interaction-hint').textContent(), /빠루로 덮개 뜯기/);
  await page.evaluate(() => interact());
  const prying = await page.evaluate(() => {
    const door = currentDoors.find(entry => entry.type === 'vent');
    return { state: door.element.dataset.vent, crowbar: Boolean(ventPry.crowbar?.isConnected), gauge: !ventPryGauge.hidden,
      crouching, facing, right: body.position.x > door.x + door.width };
  });
  assert.deepEqual(prying, { state: 'prying', crowbar: true, gauge: true, crouching: true, facing: -1, right: true }, 'Crowbar + E starts prying');

  // 스킬체크: 바늘(한 바퀴 0.7초)이 흰 칸에 오기 전에 누르면 실패, 칸을 그냥 지나쳐도 실패다.
  // 앞쪽 끝 노란 '완벽' 칸은 한 번에, 흰 칸은 두 번(연속 아니어도) 맞추면 열린다.
  const check = () => page.evaluate(() => ({ wait: ventPry.wait, angle: ventPry.angle, zone: ventPry.zone, great: ventPryGreat }));
  const toNeedle = async where => { // 쉬는 시간이 끝나고 바늘이 칸 앞('before')·흰 칸('white')·완벽 칸('great')에 올 때까지 시간을 흘린다
    for (let i = 0; i < 200; i++) {
      const { wait, angle, zone: [from, to], great } = await check();
      const at = { before: angle > 20 && angle < from - 20, white: angle >= from + great + 2 && angle <= to - 2, great: angle >= from && angle <= from + great };
      if (wait <= 0 && at[where]) return;
      await page.clock.runFor(16);
    }
    throw new Error(`needle never reached ${where}`);
  };
  const hit = async (key, where = 'white') => { await toNeedle(where); await page.keyboard.press(key); };
  await toNeedle('before');
  await page.screenshot({ path: '.local/wall-vent-prying.png' });
  await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(() => [ventPrying(), ventPry.wait > 0]), [true, true], 'Pressing before the zone fails and waits for a new check');
  await page.clock.runFor(900 + 800); // 다음 바늘이 칸을 그냥 지나치도록 둔다
  assert.deepEqual(await page.evaluate(() => [ventPrying(), ventPry.wait > 0]), [true, true], 'Letting the needle pass the zone fails');
  // Esc로 그만두면 닫힌 덮개로 돌아간다.
  await page.keyboard.press('Escape');
  assert.deepEqual(await page.evaluate(() => [ventPrying(), currentDoors.find(entry => entry.type === 'vent').element.dataset.vent]), [false, 'closed'], 'Esc stops prying');

  // 완벽 칸은 한 번에 연다.
  await page.clock.runFor(500);
  await toVent();
  await page.evaluate(() => interact());
  await hit('Space', 'great');
  assert.equal(await page.evaluate(() => collectedItems.has('vent-open:f5@1560')), true, 'One perfect hit pries the cover off');
  await page.evaluate(() => { closeInspection(); collectedItems.delete('vent-open:f5@1560'); performFloorChange('f5'); });

  // 흰 칸은 두 번: 한 번 맞추고 한 번 빗나가도 다음에 한 번 더 맞추면 떨어진다. 저장된 채로 장면을 다시 지어도 열려 있다.
  await toVent();
  await page.clock.runFor(100);
  await page.evaluate(() => interact());
  await hit('Enter');
  assert.deepEqual(await page.evaluate(() => [ventPrying(), ventPry.score]), [true, 1], 'One white hit is not enough');
  await toNeedle('before');
  await page.keyboard.press('Space');
  await hit('Enter');
  const opened = await page.evaluate(() => {
    const door = currentDoors.find(entry => entry.type === 'vent');
    return { state: door.element.dataset.vent, cover: Boolean(dynamicScene.querySelector('.vent-cover-fallen')), saved: collectedItems.has('vent-open:f5@1560'), message: usingInspection };
  });
  assert.deepEqual(opened, { state: 'open', cover: true, saved: true, message: true }, 'Two white hits (a miss between is fine) pry the cover off');
  await page.clock.runFor(600);
  await page.screenshot({ path: '.local/wall-vent-opened.png' });
  await page.evaluate(() => { closeInspection(); performFloorChange('f5'); });
  vent = await toVent();
  assert.match(vent.image, /wall-vent\/vent-open\.png/, 'An opened vent stays open');

  // 서서 E를 누르면 들어가지 않고 앉으라는 안내만 보인다.
  await page.clock.runFor(100);
  assert.match(await page.locator('#interaction-hint').textContent(), /앉아서 들어가기/);
  await page.evaluate(() => interact());
  await page.clock.runFor(1000);
  assert.equal((await state()).hiding, false, 'Standing E does not enter the vent');

  // 앉아서 E: 화면이 전환되고 숨는다.
  await page.evaluate(() => keys.add('ControlLeft'));
  await page.clock.runFor(100);
  assert.match(await page.locator('#interaction-hint').textContent(), /환풍구에 숨기/);
  await page.evaluate(() => interact());
  await page.clock.runFor(1000);
  assert.deepEqual(await state(), { hiding: true, view: true, sprite: 'hidden', caught: false, robot: 'patrol' }, 'Crouch + E hides in the vent');

  // 쫓아오던 R-03도 숨은 수호를 붙잡지 못하고 놓친 뒤 순찰로 돌아간다. 숨은 동안 움직이는 키는 듣지 않는다.
  const x = await page.evaluate(() => {
    roamerEnter('f5', 'elevator');
    Object.assign(roamer, { x: body.position.x + 300, mode: 'chase', facing: -1, stay: 99999, lostTime: 0 });
    keys.add('KeyD');
    return body.position.x;
  });
  await page.clock.runFor(2500);
  await page.screenshot({ path: '.local/wall-vent-hidden.png' });
  // 구멍 너머는 복도 배경 그림이고, 근처 로봇은 그 위에 같은 그림으로 그려진다.
  assert.deepEqual(await page.evaluate(() => [Boolean(document.querySelector('#vent-world img.floor-background[src*="floor05/walls.png"]') && document.querySelector('#vent-world .painted-wall')),
    document.getElementById('vent-robot').hidden, /guard-(patrol|capture)\.png/.test(document.querySelector('#vent-robot img').src)]),
    [true, false, true], 'The duct shows the corridor art with the nearby robot');
  let s = await state();
  assert.deepEqual([s.caught, s.robot], [false, 'patrol'], 'R-03 loses Suho hidden in the vent');
  assert.equal(await page.evaluate(() => body.position.x), x, 'Suho does not move while hidden');

  // E로 나온다.
  await page.evaluate(() => { keys.delete('KeyD'); interact(); });
  await page.clock.runFor(1000);
  s = await state();
  assert.deepEqual([s.hiding, s.view, s.sprite], [false, false, ''], 'E leaves the vent');

  // 모든 층·방의 환풍구 배치 규칙(.claude/skills/archi-wall-vent): 크기·높이 고정, 벽 안쪽, 문·엘리베이터·조사 대상과 안 겹침,
  // 복도는 한 개까지, viewX는 배경 그림 안(구멍 너머가 비지 않게), 17층 복도(scene-builder로 짓지 않는 장면)에는 두지 않는다.
  const layout = await page.evaluate(() => {
    const problems = [], placed = {};
    for (const [id, config] of floorById) {
      const vents = (config.fixtures || []).filter(fixture => fixture.hideSpot);
      if (!vents.length) continue;
      placed[id] = vents.length;
      if (id === 'f17') { problems.push('f17: corridor 17F is not a dynamic scene'); continue; }
      if (id === 'f1' || id === 'b2') { problems.push(`${id}: no vents on 1F and B2 (user decision)`); continue; }
      if (!config.interior && vents.length > 1) problems.push(`${id}: ${vents.length} vents in one corridor`);
      performFloorChange(id, 0, config.interior ? 'exit' : null);
      const artWidth = Math.max(...[config.backgroundImage].flat().filter(Boolean).map(art => (art.left ?? 0) + (art.width ?? config.width)));
      for (const vent of vents) {
        const name = `${id}@${vent.x}`;
        if (vent.y !== 454 || vent.width !== 132 || vent.height !== 108 || vent.style !== 'wall-vent') problems.push(`${name}: must be { y: 454, width: 132, height: 108, style: 'wall-vent' }`);
        if (vent.x < 32 || vent.x + vent.width > config.width - 32) problems.push(`${name}: outside the walls`);
        for (const door of currentDoors) {
          if (door.type === 'vent' || door.x >= vent.x + vent.width + 20 || door.x + door.width <= vent.x - 20) continue;
          problems.push(`${name}: overlaps ${door.type} ${door.name ?? door.key ?? ''}`);
        }
        // 뜯을 자리: 덮개가 떨어지는 쪽 120px에는 문·소품이 없어야 하고(덮개가 계속 남는다), 수호가 웅크리는 쪽 90px에는
        // 소품이 없어야 한다(문 앞에 잠깐 웅크리는 건 괜찮다). pryFrom: 'left'면 좌우가 바뀐다.
        const left = vent.pryFrom === 'left';
        const cover = left ? [vent.x + vent.width, vent.x + vent.width + 120] : [vent.x - 120, vent.x];
        const crouch = left ? [vent.x - 90, vent.x] : [vent.x + vent.width, vent.x + vent.width + 90];
        const doors = currentDoors.filter(door => door.type !== 'vent').map(door => [door.x, door.x + door.width, `${door.type} ${door.name ?? ''}`]);
        const props = [...dynamicScene.querySelectorAll('.floor-prop')].filter(el => parseFloat(el.style.top) + el.offsetHeight >= 440)
          .map(el => [parseFloat(el.style.left), parseFloat(el.style.left) + el.offsetWidth, `prop ${el.getAttribute('aria-label') || el.querySelector('img')?.src.split('/').pop()}`]);
        for (const [[a, b], blockers, what] of [[cover, [...doors, ...props], 'cover'], [crouch, props, 'crouch']]) {
          for (const [from, to, label] of blockers) if (from < b - 4 && to > a + 4) problems.push(`${name}: ${what} space ${Math.round(a)}-${Math.round(b)} blocked by ${label}`);
        }
        const viewX = vent.viewX ?? vent.x + vent.width / 2;
        if (viewX < 260 || viewX > artWidth - 260) problems.push(`${name}: viewX ${viewX} leaves the background art (260..${artWidth - 260})`);
      }
    }
    return { problems, placed };
  });
  assert.deepEqual(layout.problems, [], `Vent layout rules: ${JSON.stringify(layout.placed)}`);
  assert.deepEqual(errors, []);
  console.log(`PASS: wall vents: crouch + E hides with a screen transition, R-03 loses Suho, E leaves; layout rules hold for ${JSON.stringify(layout.placed)}.`);
} finally { await browser.close(); }
