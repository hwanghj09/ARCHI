import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { autoControl } from './auto-control.mjs';
import { finishSceneTransition } from './scene-transition.mjs';

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await autoControl(page);
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  const count = () => page.evaluate(() => collectedPhotos.length);
  const go = async id => {
    await page.evaluate(id => performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null), id);
    await finishSceneTransition(page);
    await page.clock.runFor(100);
  };
  const inspect = async x => {
    await page.evaluate(x => {
      closeInspection();
      Body.setPosition(body, { x, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 });
      grounded = true;
      updateInteraction(); cameraX = cameraTarget(); render();
    }, x);
    await page.clock.runFor(50);
    await page.keyboard.press('e');
    await page.clock.runFor(100);
  };

  // 휴대폰의 카메라 앱은 삭제되었고(9bda9e8), 새 사진은 photo: true인 1층 층별 안내판만 찍는다(d661332).
  await page.keyboard.press('p');
  assert.equal(await page.locator('[data-phone-app="camera"]').count(), 0);
  await page.locator('[data-phone-app="gallery"]').click();
  assert(await page.locator('#phone-gallery-empty').isVisible());
  await page.locator('#phone-close').click();

  await go('f11-sales');
  await inspect(810);
  assert(await page.locator('#inspection-photo').isHidden(), 'An ordinary prop has no photo action');
  await inspect(1700);
  assert(await page.locator('#inspection-photo').isHidden(), 'A clue alone is not a photo target');

  await go('f1');
  await inspect(1480);
  assert.match(await page.locator('#inspection-title').textContent(), /층별 안내판/);
  assert(await page.locator('#inspection-photo').isEnabled(), 'The 1F directory is a photo target');
  assert.equal(await count(), 0, 'Inspecting the directory does not automatically take a photo');
  await page.locator('#phone-sheet').evaluate(image => image.decode());
  await page.locator('#phone-away-sheet').evaluate(image => image.decode());
  await page.locator('#inspection-photo').click();
  const x = await page.evaluate(() => body.position.x);
  assert.equal(await page.locator('#player').getAttribute('data-state'), 'photo');
  assert(await page.locator('#inspection').isHidden());
  await page.keyboard.down('d');
  await page.keyboard.press('Space');
  await page.keyboard.press('p');
  await page.keyboard.press('Escape');
  await page.clock.runFor(400);
  assert.equal(await count(), 0, 'Photo is added at the shutter, after the phone is raised');
  assert.equal(await page.evaluate(() => body.position.x), x, 'Movement is locked during capture');
  assert(await page.locator('#phone').isHidden());
  assert(await page.locator('#main-menu').isHidden());
  await page.screenshot({ path: '.local/phone-photo-motion.png' });
  await page.clock.runFor(200);
  assert.equal(await count(), 1);
  assert(await page.locator('#photo-shutter').isVisible());
  await page.clock.runFor(800);
  await page.keyboard.up('d');
  assert.equal(await page.evaluate(() => photoCaptureTime), 0);
  assert(await page.locator('#photo-shutter').isHidden());
  await page.keyboard.down('d');
  await page.clock.runFor(100);
  await page.keyboard.up('d');
  assert(await page.evaluate(before => body.position.x > before, x), 'Movement resumes');
  await inspect(1480);
  assert(await page.locator('#inspection-photo').isDisabled(), 'Duplicate photos are prevented');
  await page.keyboard.press('Escape');

  await page.keyboard.press('p');
  await page.locator('[data-phone-app="gallery"]').click();
  assert.equal(await page.locator('#phone-gallery-list li').count(), 1);
  assert.match(await page.locator('#phone-gallery-list').textContent(), /층별 안내판/);
  await page.screenshot({ path: '.local/phone-photo-gallery.png' });
  await page.locator('.phone-photo-card').click();
  assert(await page.locator('#phone').isHidden());
  assert.match(await page.locator('#inspection-title').textContent(), /사진 · 층별 안내판/);
  assert.match(await page.locator('#inspection-sheet').textContent(), /17F/);
  assert(await page.locator('#inspection-photo').isHidden(), 'Viewing a saved photo cannot take another');
  await page.screenshot({ path: '.local/phone-photo-expanded.png' });
  await page.keyboard.press('Escape');
  assert(await page.locator('#phone-gallery').isVisible(), 'Back returns to the gallery');
  await page.locator('#phone-close').click();

  // 배터리·충전·붙잡힘 조건은 갤러리를 비우고 같은 안내판으로 확인한다.
  await page.evaluate(() => restorePhotos([]));
  await page.evaluate(() => { phoneBattery = 0; refreshPhone(); });
  await inspect(1480);
  assert(await page.locator('#inspection-photo').isDisabled(), 'An empty battery blocks capture');
  await page.evaluate(() => { phoneBattery = 100; phoneDock = { scene: 'office', floor: 17, x: 0 }; });
  await inspect(1480);
  assert(await page.locator('#inspection-photo').isDisabled(), 'A docked phone cannot take a photo');
  await page.evaluate(() => { phoneDock = null; refreshPhone(); });
  await inspect(1480);
  await page.locator('#inspection-photo').click();
  await page.evaluate(() => { hallucinationCaught = true; });
  await page.clock.runFor(100);
  assert.equal(await page.evaluate(() => photoCaptureTime), 0, 'Capture is cancelled when Suho is caught');
  assert.equal(await count(), 0, 'An interrupted capture does not save a photo');
  await page.evaluate(() => { hallucinationCaught = false; });
  await inspect(1480);
  await page.locator('#inspection-photo').click();
  await page.clock.runFor(1400);
  assert.equal(await count(), 1, 'The 1F directory can be photographed after a cancelled capture');

  const badge = await page.evaluate(() => {
    const original = renderPhonePhoto({ scene: 'f16-cafe', name: '카페 테이블', variant: 'original' });
    const taken = renderPhonePhoto({ scene: 'f16-cafe', name: '카페 테이블', variant: 'taken' });
    return { original: original.querySelector('img').getAttribute('src'),
      taken: taken.querySelector('img').getAttribute('src'), frame: taken.querySelector('img').style.left };
  });
  assert.equal(badge.original, 'assets/objects/id-cards/jo-hyeon-a.png');
  assert.equal(badge.taken, 'assets/objects/floor16/cafe-table-badge-states.png');
  assert.equal(badge.frame, '-100%', 'A photo after pickup shows the table without the badge');

  // Restores accept only known photo subjects and deduplicate, without trusting stored markup or URLs.
  await page.evaluate(() => restorePhotos([...photoSnapshot(), ...photoSnapshot(), null, { scene: 'f1', name: '<img onerror=alert(1)>', variant: 'original' }]));
  assert.equal(await count(), 1);
  assert(await page.evaluate(() => saveProgress()));
  await page.reload();
  await page.locator('#menu-continue').click();
  await page.clock.runFor(200);
  assert.equal(await count(), 1, 'Photos survive save and continue');
  await page.keyboard.press('p');
  await page.locator('[data-phone-app="gallery"]').click();
  assert.match(await page.locator('.phone-photo-card').first().textContent(), /층별 안내판/);
  for (const [width, height] of [[390, 844], [568, 320]]) {
    await page.setViewportSize({ width, height });
    await page.locator('.phone-photo-card').first().click();
    const close = await page.locator('#inspection-close').boundingBox();
    assert(close.x >= 0 && close.y >= 0 && close.x + close.width <= width + 1 && close.y + close.height <= height + 1);
    await page.keyboard.press('Escape');
    assert(await page.locator('#phone-gallery').isVisible());
  }
  await page.locator('#phone-close').click();
  await page.evaluate(() => startNewGame());
  assert.equal(await count(), 0, 'New game clears the gallery');
  assert.deepEqual(errors, []);
  console.log('PASS phone photos: 1F directory only, inspection action, motion, input locks, gallery viewer, battery, dock, cancellation, save/continue/reset and mobile layouts');
} finally {
  await browser.close();
}
