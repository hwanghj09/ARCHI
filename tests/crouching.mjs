import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import sharp from 'sharp';

const { data, info } = await sharp(fileURLToPath(new URL('../assets/player/jeong-suho-crouch.png', import.meta.url)))
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
assert.deepEqual([info.width, info.height], [1024, 256]);
for (let i = 0; i < 4; i++) {
  let bottom = 0, top = 256, count = 0;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const alpha = data[(y * 1024 + i * 256 + x) * 4 + 3];
    if (alpha > 128) { bottom = Math.max(bottom, y); top = Math.min(top, y); count++; }
    if (x === 0 || x === 255 || y === 0 || y === 255) assert.equal(alpha, 0, `Frame ${i}: transparent border`);
  }
  assert(count > 5000, `Frame ${i}: complete sprite`);
  assert(Math.abs(bottom - 237) <= 1, `Frame ${i}: aligned feet (${bottom})`);
  assert(bottom - top >= 120 && bottom - top <= 140, `Frame ${i}: crouching height`);
}

await mkdir('.local', { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-17T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-17T00:01:00Z'));
  await page.clock.runFor(100);
  await page.locator('#crouch-sheet').evaluate(image => image.decode());
  const state = () => page.evaluate(() => ({ x: body.position.x, feet: body.bounds.max.y,
    height: Math.max(...body.vertices.map(v => v.y)) - Math.min(...body.vertices.map(v => v.y)), inertia: body.inertia, crouching,
    animation: sprite.dataset.state, frame: Number(sprite.dataset.frame), facing,
    savedY: progressSnapshot().scene.y, flash: world.dataset.flashlight }));
  const standing = await state();
  assert.equal(standing.animation, 'idle');
  await page.keyboard.down('ControlLeft');
  await page.clock.runFor(100);
  let pose = await state();
  assert.equal(pose.animation, 'crouch');
  assert.equal(pose.frame, 0);
  assert(Math.abs(pose.height - 96) < .1);
  assert(Math.abs(pose.feet - standing.feet) < .1, 'Crouching keeps feet planted');
  assert.equal(pose.inertia, Infinity, 'Resizing keeps the character upright');
  assert(Math.abs(pose.savedY - standing.savedY) < .1, 'Saves retain standing coordinates');
  assert.equal(await page.locator('#player img:visible').count(), 1);
  await page.screenshot({ path: '.local/crouch.png' });
  await page.keyboard.down('ShiftLeft');
  await page.keyboard.down('d');
  const frames = new Set();
  for (let i = 0; i < 12; i++) {
    await page.clock.runFor(100);
    pose = await state();
    assert.equal(pose.animation, 'crouch');
    frames.add(pose.frame);
  }
  assert.equal(frames.size, 4, 'Crouch movement reaches all four frames');
  assert(Math.abs(pose.x - standing.x - 108) < 5, 'Crouching moves at 90px/s, including with Shift');
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  assert(Math.abs((await state()).feet - standing.feet) < .1, 'Crouching blocks jumping');
  await page.keyboard.up('d');
  await page.keyboard.up('ShiftLeft');
  await page.keyboard.up('ControlLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'idle');
  assert(Math.abs((await state()).height - 162) < .1);
  await page.keyboard.down('ControlRight');
  await page.keyboard.down('a');
  await page.clock.runFor(100);
  assert.equal((await state()).facing, -1);
  assert.equal((await state()).animation, 'crouch');
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await page.keyboard.up('a');
  await page.keyboard.up('ControlRight');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'idle', 'Blur releases crouch');

  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await page.keyboard.down('ControlLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).crouching, false, 'Airborne Ctrl does not resize the body');
  await page.clock.runFor(1000);
  assert.equal((await state()).animation, 'crouch', 'Holding Ctrl crouches on landing');
  await page.keyboard.press('f');
  await page.clock.runFor(100);
  assert.equal((await state()).animation, 'crouch', 'Raising the phone preserves the crouching pose');
  assert.equal((await state()).flash, 'off');
  await page.clock.runFor(await page.evaluate(() => phoneLightDelayMs));
  assert.equal((await state()).animation, 'crouch');
  assert.equal((await state()).flash, 'on');
  await page.keyboard.press('f');

  await page.evaluate(() => {
    window.crouchTestCeiling = Bodies.rectangle(body.position.x, floorY - 120, 220, 20, { isStatic: true });
    Composite.add(engine.world, window.crouchTestCeiling);
  });
  await page.keyboard.up('ControlLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).crouching, true, 'A low ceiling prevents standing through solids');
  await page.keyboard.down('d');
  await page.clock.runFor(1800);
  await page.keyboard.up('d');
  await page.clock.runFor(100);
  assert.equal((await state()).crouching, false, 'Walking out from under the ceiling restores standing');
  await page.evaluate(() => Composite.remove(engine.world, window.crouchTestCeiling));

  await page.keyboard.down('ControlLeft');
  await page.clock.runFor(100);
  await page.evaluate(() => transitionScene(performRoomChange));
  await page.clock.runFor(800);
  await page.keyboard.up('ControlLeft');
  await page.clock.runFor(100);
  assert.equal((await state()).crouching, false, 'Scene transitions clear held Ctrl');
  assert(Math.abs((await state()).height - 162) < .1);
  assert(Math.abs((await state()).feet - standing.feet) < .1);
  assert.deepEqual(errors, []);
  console.log('PASS: crouch sprite alpha/alignment, both Ctrl keys, speed, four frames, Shift/jump priority, landing, blur, flashlight, headroom, save coordinates and scene reset.');
} finally {
  await browser.close();
}
