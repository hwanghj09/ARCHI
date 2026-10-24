import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { autoControl } from './auto-control.mjs';

await mkdir('.local/puzzle-prop-states', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await autoControl(page);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-23T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-23T00:01:00Z'));
  await page.evaluate(() => {
    buildingBlackout = true; solarEnabled = true; solarPoweredFloors = [];
    sanity = 100;
    for (const id of ['f17-emergency-linked', 'story-robot-seen', 'b1-cctv-live', 'b1-cctv-seen', 'b1-lights-out']) collectedItems.add(id);
    updatePowerState();
  });
  const visit = id => page.evaluate(id => {
    closeInspection(); closeControl();
    performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null);
  }, id);
  const use = name => page.evaluate(name => {
    closeInspection();
    const door = currentDoors.find(entry => entry.name === name);
    if (!door) throw new Error(`Missing target: ${name}`);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    interact(); cameraX = cameraTarget(); render();
  }, name);
  const frame = async (file, expected) => {
    const element = page.locator('.floor-prop').filter({ has: page.locator(`img[src$="${file}"]`) });
    assert.equal(await element.getAttribute('data-sprite-frame'), String(expected), file);
    assert(await element.evaluate((element, expected) =>
      Math.abs(new DOMMatrix(getComputedStyle(element.querySelector('img')).transform).m41 + expected * element.clientWidth) < 1,
    expected), `${file}: one frame aligned`);
  };
  const reload = async () => {
    await page.evaluate(() => { closeInspection(); saveProgress(); });
    await page.reload();
    await page.locator('#menu-continue').click();
    await page.clock.runFor(100);
  };
  const capture = async name => {
    await page.evaluate(() => { closeInspection(); cameraX = cameraTarget(); render(); });
    await page.screenshot({ path: `.local/puzzle-prop-states/${name}.png` });
  };

  await visit('b1-control');
  await frame('elevator-override-states.png', 0);
  await use('승강기 제어반');
  await frame('elevator-override-states.png', 0);
  await page.evaluate(() => {
    for (const id of ['f7-external-connection-solved', 'f13-backup-device', 'f2-projected']) collectedItems.add(id);
  });
  await use('승강기 제어반');
  assert(await page.evaluate(() => collectedItems.has('b1-elevator')), 'The ready key switch releases B2');
  await frame('elevator-override-states.png', 1);
  await reload();
  await frame('elevator-override-states.png', 1);
  await capture('b1-released');

  await visit('b2-power');
  await frame('transfer-breaker-states.png', 0);
  await use('외부 회선 패널');
  await frame('transfer-breaker-states.png', 1);
  await reload();
  await frame('transfer-breaker-states.png', 1);
  await capture('b2-disconnected');
  await visit('b2-main'); await visit('b2-power');
  await frame('transfer-breaker-states.png', 1);

  await page.evaluate(() => { collectedItems.delete('f13-backup-device'); solarPoweredFloors = [13]; updatePowerState(); });
  await visit('f13-secure');
  await frame('backup-storage-states.png', 0);
  await frame('manual-crank-states.png', 1);
  await page.evaluate(() => { collectedItems.add(VAULT_SHUTTER); updateVaultPuzzle(0); });
  await use('수동 개방 크랭크');
  assert(await page.evaluate(() => collectedItems.has(VAULT_SHUTTER)), 'The powered interlock still blocks the crank');
  await use('백업 장치 보관함');
  await frame('backup-storage-states.png', 1);
  await page.evaluate(() => { closeInspection(); solarPoweredFloors = []; updatePowerState(); });
  await frame('manual-crank-states.png', 0);
  await use('수동 개방 크랭크');
  assert.equal(await page.evaluate(() => collectedItems.has(VAULT_SHUTTER)), false, 'The crank works without electricity');
  await reload();
  await frame('backup-storage-states.png', 1);
  await frame('manual-crank-states.png', 0);
  assert.equal(await page.evaluate(() => collectedItems.has(VAULT_SHUTTER)), false);
  await page.evaluate(() => { solarPoweredFloors = [13]; updatePowerState(); updateVaultPuzzle(VAULT_DETECT_MS); });
  await frame('manual-crank-states.png', 1);
  assert(await page.evaluate(() => collectedItems.has(VAULT_SHUTTER)), 'Power restoration re-arms the shutter');
  await capture('f13-backup-empty');
  await use('수동 개방 크랭크');
  await capture('f13-crank-locked');

  await visit('f2-server');
  await frame('nas-disc-tray-states.png', 0);
  await use('녹화 NAS');
  await frame('nas-disc-tray-states.png', 1);
  await reload();
  await frame('nas-disc-tray-states.png', 1);
  await capture('f2-nas-empty');
  await visit('f2-lounge'); await visit('f2-server');
  await frame('nas-disc-tray-states.png', 1);

  await visit('b2-main');
  await frame('cctv-distribution-states.png', 0);
  await use('CCTV 분배함');
  await frame('cctv-distribution-states.png', 1);
  await reload();
  await frame('cctv-distribution-states.png', 1);
  await visit('b2');
  assert.equal(await page.locator('.dormant-bots .docked-robot img').count(), 3);
  assert.equal(await page.locator('.dormant-bots').getAttribute('data-active'), 'false');
  await page.evaluate(() => { b2Ending.phase = 'running'; mountB2Robots(); });
  assert(await page.locator('.docked-robot').first().evaluate(el => getComputedStyle(el).visibility === 'hidden'));
  assert(await page.locator('.dormant-bots').evaluate(el => getComputedStyle(el).backgroundImage.includes('robot-charging-dock.png')));
  await page.evaluate(() => { resetB2Ending(); mountB2Robots(); });
  assert(await page.locator('.docked-robot').first().evaluate(el => getComputedStyle(el).visibility === 'visible'));
  await capture('b2-docked-robots');

  await visit('f7-verify');
  await frame('interlock-panel-states.png', 0);
  await use('인터록 제어반');
  await frame('interlock-panel-states.png', 1);
  await reload();
  await frame('interlock-panel-states.png', 1);

  await visit('f12-dev');
  await frame('key-desk-states.png', 0);
  await frame('card-cabinet-states.png', 0);
  await use('책상 서랍');
  await frame('key-desk-states.png', 1);
  await use('맨 왼쪽 서랍');
  for (let index = 0; index < 5; index++) await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  assert(await page.evaluate(() => collectedItems.has('f12-eval-keycard')));
  await frame('card-cabinet-states.png', 1);
  await reload();
  await frame('key-desk-states.png', 1);
  await frame('card-cabinet-states.png', 1);

  await visit('f13-secure');
  assert(await page.locator('.vault-shutter').evaluate(el => getComputedStyle(el).backgroundImage.includes('vault-shutter-curtain.png')));
  assert(await page.locator('.vault-cctv').evaluate(el => getComputedStyle(el).backgroundImage.includes('vault-camera.png')));

  await page.evaluate(() => collectedItems.delete('b2-transfer-cut'));
  await visit('b2-main');
  const transfer = page.locator('.transfer-screen');
  assert.equal(await transfer.getAttribute('data-transfer-state'), 'active');
  assert.match(await transfer.textContent(), /61%/);
  await visit('b2-power');
  await use('외부 회선 패널');
  await visit('b2-main');
  assert.equal(await transfer.getAttribute('data-transfer-state'), 'cut');
  assert.match(await transfer.textContent(), /전송 차단됨/);
  assert.doesNotMatch(await transfer.textContent(), /61%/);
  assert.equal(await transfer.evaluate(el => el.style.getPropertyValue('--transfer-progress')), '0%');
  await use('외부 전송 현황');
  assert.match(await page.locator('#inspection-description').textContent(), /전송 차단됨/);
  await reload();
  assert.equal(await transfer.getAttribute('data-transfer-state'), 'cut');
  await page.evaluate(() => { closeInspection(); finishArchiDelete(); });
  assert.equal(await transfer.getAttribute('data-transfer-state'), 'offline');
  assert.match(await transfer.textContent(), /ARCHI OFFLINE/);
  await capture('b2-transfer-offline');
  await page.evaluate(() => resetB2Ending());
  assert.equal(await transfer.getAttribute('data-transfer-state'), 'cut');
  assert.deepEqual(errors, []);
  console.log('PASS: nine puzzle props, reused art, transfer screen/inspection, power, immediate frames and saved states.');
} finally {
  await browser.close();
}
