// 13층 보안 자료실(js/interaction/vault-puzzle.js): 전자 잠금 → 전력을 켜고 들어가면 CCTV가 셔터를 내림 → 전력이 있는 동안
// 크랭크가 막힘 → 휴대폰으로 전력을 끊고 어둠 속에서 크랭크 → 다시 켜면 배치도는 보이지만 셔터도 다시 내려옴.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(500);
  await page.evaluate(() => {
    collectedItems.add('story-robot-seen'); collectedItems.add('solar-app-installed'); sanity = 80; refreshSanity();
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = []; updatePowerState();
    performFloorChange('f13-testbay', null, 'exit');
  });
  await page.clock.runFor(300);

  // 문·소품 앞에 서서 E. 방이 바뀌면 전환이 끝날 때까지 기다린다.
  const use = async name => {
    const result = await page.evaluate(name => {
      closeInspection();
      const door = currentDoors.find(entry => entry.name === name);
      Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      interact();
      return { control: usingControl, message: usingInspection ? document.getElementById('inspection-description').textContent : null };
    }, name);
    await page.clock.runFor(1200);
    return result;
  };
  const state = () => page.evaluate(() => ({ scene: dynamicFloorId, shut: collectedItems.has(VAULT_SHUTTER),
    down: document.querySelector('.fixture.vault-shutter')?.dataset.down, blackout: world.dataset.blackout, objective: currentObjective.title }));
  const power = async on => {
    await page.evaluate(on => { closeInspection(); if (solarPoweredFloors.includes(13) !== on) supplySolarFloor(13); }, on);
    await page.clock.runFor(100);
  };
  const crank = async () => {
    const result = await use('수동 개방 크랭크');
    if (result.control) {
      await page.evaluate(() => { while (usingControl) { controlStep.done = true; nextControlStep(); } });
      result.message = await page.evaluate(() => document.getElementById('inspection-description').textContent);
    }
    return result;
  };

  assert.equal((await state()).objective, '백업 장치 가져오기');
  assert.match((await use('보안 자료실')).message, /전자 잠금/, 'Unpowered, the electric lock stays shut');
  assert.equal((await state()).scene, 'f13-testbay');

  await power(true);
  await use('보안 자료실');
  let now = await state();
  assert.equal(now.scene, 'f13-secure', 'Power opens the electric lock');
  assert.equal(now.blackout, 'false', 'The vault is lit');
  assert.equal(now.shut, false, 'The shutter falls a moment after entering');
  await page.clock.runFor(1800);
  now = await state();
  assert.equal(now.shut, true, 'CCTV drops the shutter');
  assert.equal(now.down, 'true');
  assert.equal(now.objective, '셔터에 갇혔다');
  await page.screenshot({ path: '.local/vault-trapped.png' });

  assert.match((await use('장비 검증실')).message, /원격 잠금/, 'The shutter blocks the way out');
  assert.equal((await state()).scene, 'f13-secure');
  assert.match((await crank()).message, /전자 잠금 우선/, 'The crank is locked while powered');
  assert.equal((await state()).shut, true);
  assert.match((await use('시설 점검 기록')).message, /정전 시 전자 잠금 해제 → 수동 개방 가능/);
  assert.match((await use('내부 배치도')).message, /수동 개방 크랭크함/);
  await use('백업 장치 보관함');
  assert.equal(await page.evaluate(() => collectedItems.has('f13-backup-device')), true);

  await power(false);
  now = await state();
  assert.equal(now.blackout, 'true', 'Cutting the power darkens the vault');
  assert.equal(now.objective, '어둠 속 탈출');
  assert.match((await use('내부 배치도')).message, /너무 어두워/, 'The plan cannot be read in the dark');
  await page.screenshot({ path: '.local/vault-dark.png' });
  const cranked = await crank();
  assert.equal(cranked.control, true, 'In the dark the crank turns by hand');
  assert.match(cranked.message, /셔터가 천천히 올라간다/);
  assert.equal((await state()).shut, false);

  // 놓쳐도 다시 켜서 확인할 수 있다. 대신 셔터도 다시 내려온다.
  await power(true);
  await page.clock.runFor(1800);
  assert.equal((await state()).shut, true, 'Powering again re-arms the CCTV');
  assert.match((await use('내부 배치도')).message, /수동 개방 크랭크함/);
  await power(false);
  await crank();
  await use('장비 검증실');
  now = await state();
  assert.equal(now.scene, 'f13-testbay', 'The way out is open after cranking');
  assert.notEqual(now.objective, '백업 장치 가져오기', 'The side objective ends with the device');
  assert.deepEqual(errors, []);
  console.log('vault puzzle ok');
} finally {
  await browser.close();
}
