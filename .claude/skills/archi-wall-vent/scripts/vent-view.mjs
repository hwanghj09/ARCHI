// 환풍구 확인 사진: 장면마다 환풍구 앞(밖에서 본 모습)과, 숨었을 때 덕트 안에서 본 바깥 풍경을
// 전등이 켜진 상태와 정전 상태로 찍고, 정전 사진에는 R-03이 구멍 바로 앞을 지나가게 둔다.
// 사용: node .claude/skills/archi-wall-vent/scripts/vent-view.mjs <출력 폴더> <장면 id> [장면 id ...]
// 예:   node .claude/skills/archi-wall-vent/scripts/vent-view.mjs .local/vents f5 f5-rnd
// 출력: <장면>-vent<번호>-wall.png(닫힌 덮개), -open.png(뜯은 뒤 구멍과 바닥에 떨어진 덮개), -lit.png, -dark.png.
// 끝에 장면별 환풍구 수와 페이지 오류를 JSON으로 찍는다.
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const [out, ...scenes] = process.argv.slice(2);
if (!out || !scenes.length) { console.error('usage: vent-view.mjs <out dir> <scene id> [...]'); process.exit(2); }
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const report = {};
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-03T00:00:00Z') });
  await page.goto(new URL('../../../../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-03T00:01:00Z'));

  // 환풍구 앞에 앉는다(index번째). 숨지 않은 채로 밖에서 본 모습을 찍을 수 있게 들어가는 건 따로 한다.
  // open: 덮개를 뜯어 둔 상태로 짓는다(vent-pry.js의 ventOpenKey). 아니면 처음 상태(닫힌 덮개)다.
  const goTo = (scene, index, open = true) => page.evaluate(([scene, index, open]) => {
    if (hidingInVent) setVentHiding(false);
    for (const fixture of floorById.get(scene).fixtures || []) {
      if (fixture.hideSpot) collectedItems[open ? 'add' : 'delete'](ventOpenKey(scene, fixture));
    }
    performFloorChange(scene, 0, floorById.get(scene).interior ? 'exit' : null); // 방은 출구(없으면 연결문) 앞에서 시작
    const vents = currentDoors.filter(door => door.type === 'vent');
    const vent = vents[index];
    if (!vent) return vents.length;
    Body.setPosition(body, { x: vent.x + vent.width / 2, y: floorY - 81 }); grounded = true; cameraX = cameraTarget();
    keys.add('ControlLeft');
    return vents.length;
  }, [scene, index, open]);
  const hide = async () => { await page.evaluate(() => interact()); await page.clock.runFor(1000); };
  const robotInFront = () => page.evaluate(() => {
    const scene = dynamicFloorId;
    roamerEnter(scene, floorById.get(scene).interior ? floorById.get(scene).parent : 'elevator');
    Object.assign(roamer, { x: ventSpot.x + ventSpot.width / 2 - 60, mode: 'patrol', facing: 1, wait: 0, stay: 1e9 });
  });

  // 1) 전등이 켜진 상태(정전 전)
  for (const scene of scenes) {
    report[scene] = await goTo(scene, 0);
    for (let index = 0; index < report[scene]; index++) {
      await goTo(scene, index, false);
      await page.clock.runFor(300);
      await page.screenshot({ path: `${out}/${scene}-vent${index}-wall.png` }); // 처음 상태: 닫힌 덮개
      await goTo(scene, index);
      await page.clock.runFor(300);
      await page.screenshot({ path: `${out}/${scene}-vent${index}-open.png` }); // 뜯은 뒤: 구멍과 바닥의 덮개
      await hide();
      await page.screenshot({ path: `${out}/${scene}-vent${index}-lit.png` });
    }
  }
  // 2) 정전 상태: R-03이 구멍 바로 앞을 지나간다
  await page.evaluate(() => { if (hidingInVent) setVentHiding(false); triggerBuildingBlackout(); });
  for (const scene of scenes) {
    for (let index = 0; index < report[scene]; index++) {
      await goTo(scene, index);
      await page.clock.runFor(200);
      await hide();
      await robotInFront();
      await page.clock.runFor(800);
      await page.screenshot({ path: `${out}/${scene}-vent${index}-dark.png` });
    }
  }
  console.log(JSON.stringify({ vents: report, errors }));
} finally { await browser.close(); }
