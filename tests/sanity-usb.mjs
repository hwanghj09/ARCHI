import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// A. 항불안제를 먹으면 60초 동안 정신력이 닳지 않고, 그 뒤엔 평소대로 닳는다. 어둠 속 플래시는 감소를 절반으로 줄인다.
// B. 13층 USB를 17층 수호의 컴퓨터에 직접 연결하고 깨진 리허설 영상을 끝까지 보면
//    f17-usb-played가 남아 목표가 '장치 확인하기' → '2층 조사하기'로 넘어간다. 도중에 닫으면 남지 않는다.
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-20T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-20T00:01:00Z'));

  // A. 어두운 17층 복도에서 플래시를 끄고 잰다.
  await page.evaluate(() => { triggerBuildingBlackout(); performFloorChange('f17'); phoneLightOn = false; refreshPhone(); });
  const sample = async ms => {
    const before = await page.evaluate(() => sanity);
    await page.clock.runFor(ms);
    return Number(((before - await page.evaluate(() => sanity)) / (ms / 1000)).toFixed(3));
  };
  assert.equal(await page.evaluate(() => sanityExposure()), 'dark');
  await page.evaluate(() => { sanity = 80; });
  const dark = await sample(3000);
  await page.evaluate(() => { sanity = 60; collectedItems.add('f16-antianxiety'); collectedItems.delete('f16-antianxiety-used');
    itemUseTime = 0; useInventoryItem('f16-antianxiety'); });
  await page.clock.runFor(4000); // 복용 동작
  const calm = await sample(50000);
  const calmLeft = await page.evaluate(() => antianxietyCalm);
  await page.clock.runFor(Math.max(0, calmLeft) + 100);
  const after = await sample(3000);
  await page.evaluate(() => { phoneLightOn = true; refreshPhone(); });
  assert.equal(await page.evaluate(() => sanityExposure()), 'flashlight');
  const flashlight = await sample(3000);
  console.table([{ case: '어둠 · 플래시 끔', perSecond: dark }, { case: '항불안제 뒤 60초 안', perSecond: calm },
    { case: '60초 뒤 · 어둠', perSecond: after }, { case: '어둠 · 플래시 켬', perSecond: flashlight }]);
  assert(Math.abs(dark - 1 / 3) < .01, `dark drain ${dark}`);
  assert.equal(calm, 0, 'No drain for 60 seconds after the antianxiety');
  assert(Math.abs(after - 1 / 3) < .01, `drain resumes after 60 seconds (${after})`);
  assert(Math.abs(flashlight - 1 / 6) < .01, `flashlight halves the dark drain (${flashlight})`);
  await page.evaluate(() => { phoneLightOn = false; refreshPhone(); sanity = 80; });

  // B. 17층 컴퓨터(17층 전력 필요). 장치가 없으면 아이콘도 없다.
  const openComputer = () => page.evaluate(() => {
    collectedItems.add('f17-emergency-linked');
    solarEnabled = true; solarPoweredFloors = [17]; updatePowerState();
    if (room !== 'office') { performFloorChange('f17'); performRoomChange(); }
    usingComputer = true; computer.hidden = false; resetComputerDesktop();
  });
  const shortcut = '#computer .computer-shortcuts [data-computer-app="usbdrive"]';
  await page.evaluate(() => collectedItems.add('f7-external-connection-solved'));
  await openComputer();
  assert(await page.locator(shortcut).isHidden(), 'No drive icon without the 13F device');
  await page.evaluate(() => openComputerApp('usbdrive'));
  assert.equal(await page.evaluate(() => computerWindows.get('usbdrive').open), false, 'Other launch paths cannot play a missing USB');
  await page.evaluate(() => { usingComputer = false; computer.hidden = true; collectedItems.add('f13-backup-device'); refreshObjective(); });
  await page.clock.runFor(200);
  assert.equal(await page.evaluate(() => currentObjective.title), '장치 확인하기');
  assert.match(await page.evaluate(() => currentObjective.text), /17층 내 자리 컴퓨터의 외부 저장 장치/);
  await openComputer();
  assert(await page.locator(shortcut).isVisible(), 'The drive appears on the desktop');
  // 도중에 닫으면 기록하지 않는다.
  await page.locator(shortcut).dblclick();
  assert(await page.locator('#usb-drive-plug').isVisible());
  assert(await page.locator('#usb-video').isHidden(), 'Possessing the USB does not start playback');
  await page.clock.runFor(10000);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-usb-played')), false);
  await page.locator('#usb-drive-plug').click();
  await page.clock.runFor(4000);
  assert.equal(await page.evaluate(() => usbVideo.dataset.state === 'clear' || usbVideo.dataset.state === 'glitch'), true);
  for (const [width, height] of [[844, 390], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.clock.runFor(100);
    assert(await page.evaluate(() => {
      const caption = usbVideoCaption.getBoundingClientRect();
      const view = computerWindows.get('usbdrive').view.getBoundingClientRect();
      return caption.top >= view.top && caption.bottom <= view.bottom;
    }), `Rehearsal subtitles fit the visible window at ${width}x${height}`);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.evaluate(() => closeComputerWindow(computerWindows.get('usbdrive')));
  await page.clock.runFor(8000);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-usb-played')), false, 'Closing early does not count');
  // 최소화·전력 차단도 관람 완료로 처리하지 않는다. 다시 열면 연결부터 재시도할 수 있다.
  await page.locator(shortcut).dblclick();
  await page.locator('#usb-drive-plug').click();
  await page.clock.runFor(4000);
  await page.locator('[data-app="usbdrive"] [data-window-minimize]').click();
  await page.clock.runFor(8000);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-usb-played')), false, 'Minimizing early does not count');
  await page.locator('[data-computer-task-app="usbdrive"]').click();
  await page.locator('#usb-drive-plug').click();
  await page.clock.runFor(4000);
  await page.evaluate(() => { collectedItems.delete('f17-emergency-linked'); updatePowerState(); });
  await page.clock.runFor(8000);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-usb-played')), false, 'Unpowered playback cannot complete');
  assert(await page.locator('#usb-drive-plug').isDisabled());
  await page.evaluate(() => { collectedItems.add('f17-emergency-linked'); updatePowerState(); });
  // 미완료 상태의 저장을 불러와도 2층 목표가 먼저 나오지 않는다.
  await page.evaluate(() => { saveProgress(); restoreProgress(readProgress()); refreshObjective(); });
  await page.clock.runFor(200);
  assert.equal(await page.evaluate(() => currentObjective.title), '장치 확인하기');
  assert.equal(await page.evaluate(() => collectedItems.has('f17-usb-played')), false);
  await openComputer();
  // 끝까지 보면 오류 화면과 함께 기록·목표 변경.
  await page.locator(shortcut).dblclick();
  // 터치나 키보드도 같은 연결 버튼을 사용한다.
  await page.locator('#usb-drive-plug').focus();
  await page.keyboard.press('Enter');
  await page.clock.runFor(1000);
  assert.match(await page.locator('.usb-video-footage').evaluate(el => getComputedStyle(el).backgroundImage), /floor02-hall-interior/);
  await page.screenshot({ path: '.local/usb-rehearsal-playing.png' });
  const states = new Set();
  for (let t = 0; t < 10000; t += 250) { await page.clock.runFor(250); states.add(await page.evaluate(() => usbVideo.dataset.state)); }
  console.log('video states:', [...states].join(' → '));
  assert(['clear', 'glitch', 'black', 'error'].every(state => states.has(state)), 'Clear, glitch, black and error frames all play');
  assert(await page.locator('#usb-video-error').isVisible());
  assert.match(await page.locator('#usb-video-error').textContent(), /2F 서버실 녹화 NAS · 04:00 자동 삭제 예정/);
  assert.equal(await page.evaluate(() => collectedItems.has('f17-usb-played')), true);
  await page.screenshot({ path: '.local/usb-video.png' });
  await page.evaluate(() => { usingComputer = false; computer.hidden = true; });
  await page.clock.runFor(200);
  assert.equal(await page.evaluate(() => currentObjective.title), '2층 조사하기');
  await page.evaluate(() => { saveProgress(); restoreProgress(readProgress()); refreshObjective(); });
  await page.clock.runFor(200);
  assert.equal(await page.evaluate(() => currentObjective.title), '2층 조사하기', 'Watched USB progress survives reload');
  assert.deepEqual(errors, []);
  console.log('Sanity calm/flashlight and 13F USB video checks passed.');
} finally {
  await browser.close();
}
