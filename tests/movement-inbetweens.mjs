import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const sheets = [
  [null, 'walk-eight', 8],
  [null, 'phone-walk-eight-off', 8], [null, 'phone-walk-eight-on', 8],
  ['run-eight', 'run-sixteen', 16], ['phone-run-off', 'phone-run-sixteen-off', 16],
  ['phone-run-on', 'phone-jump-on', 2],
];
let phoneArmPhases;
const walkHead = await sharp('assets/player/movement-inbetweens-source/walk-head.png').ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
assert.equal(walkHead.info.width, 56);
assert.equal(walkHead.info.height, 56);
const runMidpoint = await sharp('assets/player/jeong-suho-run-mid-01.png').ensureAlpha().raw()
  .toBuffer({ resolveWithObject: true });
assert.deepEqual([runMidpoint.info.width, runMidpoint.info.height], [256, 256]);

// These baselines protect the existing head, shirt and arm artwork during leg-only repairs.
const upperBodyHashes = {
  'walk-eight': '7362869cf879d98a69d8c96cdb51faaad1312d5cfdf3ff8fb5ec86128696246b',
  'phone-walk-eight-off': 'eb626c44b68af88a1211d248c49018d6ea1686d0b79349036811f4cdd6607c99',
  'phone-walk-eight-on': 'c998367f8d2e368a773519c92ed7582164cb8ffc1d3277205539215cde15d544',
  'run-sixteen': '4d2e3f540d0fed5ffc1229c3202cee0c53edc7049d0288b69476fc997cf68641',
  'phone-run-sixteen-off': 'f256b9664332985299272085c21720e045e19e36a0d5a3883e429f8f90b656cc',
};
function shoeParts(cell, minX = 5, minY = 145) {
  const seen = new Set(), parts = [];
  const shoe = (x, y) => {
    if (x < minX || x >= 250 || y < minY || y >= 250) return false;
    const p = (y * 256 + x) * 4, rgb = cell.subarray(p, p + 3);
    return cell[p + 3] >= 128 && Math.min(...rgb) >= 90 && Math.max(...rgb) - Math.min(...rgb) < 45;
  };
  for (let y = minY; y < 250; y++) for (let x = minX; x < 250; x++) {
    if (!shoe(x, y) || seen.has(y * 256 + x)) continue;
    const stack = [[x, y]]; let count = 0;
    while (stack.length) {
      const [u, v] = stack.pop(), key = v * 256 + u;
      if (seen.has(key) || !shoe(u, v)) continue;
      seen.add(key); count++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) stack.push([u + dx, v + dy]);
    }
    if (count > 130) parts.push(count); // Ignore small lace/gray panels inside one sneaker.
  }
  return parts.length;
}

for (const [original, expanded, frames] of sheets) {
  const before = original && await sharp(`assets/player/jeong-suho-${original}.png`).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  const airborne = expanded === 'phone-jump-on';
  const walking = expanded.includes('walk-eight');
  const running = expanded.includes('run-sixteen');
  const hasMidpoint = expanded === 'run-sixteen';
  const after = await sharp(`assets/player/jeong-suho-${expanded}.png`).ensureAlpha().raw()
    .toBuffer({ resolveWithObject: true });
  assert.equal(after.info.width, frames * 256, `${expanded}: complete square cells`);
  assert.equal(after.info.height, 256);
  if (upperBodyHashes[expanded]) assert.equal(createHash('sha256').update(after.data.subarray(0, after.info.width * 128 * 4)).digest('hex'),
    upperBodyHashes[expanded], `${expanded}: upper-body artwork stays pixel-identical`);
  const poses = new Set();
  const headTops = [], headCenters = [];
  const freeHandCenters = [];
  for (let frame = 0; frame < frames; frame++) {
    const cell = Buffer.alloc(256 * 256 * 4);
    const repairedFoot = running && !(hasMidpoint && frame === 1) &&
      (hasMidpoint ? [0, 3, 7] : [0]).includes(Math.floor(frame / 2));
    const repairedLegs = running && !(hasMidpoint && frame === 1) &&
      (hasMidpoint ? [1, 3, 6] : [1, 2, 5]).includes(Math.floor(frame / 2));
    for (let y = 0; y < 256; y++) {
      const from = (y * after.info.width + frame * 256) * 4;
      after.data.copy(cell, y * 256 * 4, from, from + 256 * 4);
      if (before && (airborne || running || frame % 2 === 0)) {
        const oldIndex = airborne ? [2, 6][frame] : Math.floor(frame / 2);
        const old = (y * before.info.width + oldIndex * 256) * 4;
        const expected = hasMidpoint && frame === 1 ? runMidpoint.data.subarray(y * 256 * 4, (y + 1) * 256 * 4) :
          before.data.subarray(old, old + 256 * 4);
        const actual = cell.subarray(y * 256 * 4, (y + 1) * 256 * 4);
        if (repairedLegs && y >= 128) {
          for (let x = 0; x < 256 && y < 165; x++) {
            const p = x * 4, rgb = expected.subarray(p, p + 3);
            const skin = expected[p] > 110 && expected[p] > expected[p + 1] + 20 && expected[p + 1] > expected[p + 2] + 10;
            const shirt = y < 140 && Math.min(...rgb) >= 110 && Math.max(...rgb) - Math.min(...rgb) < 50;
            if (expected[p + 3] >= 128 && (skin || shirt)) assert(actual.subarray(p, p + 4).equals(expected.subarray(p, p + 4)), 'Preserve the original hands and shirt hem');
          }
        } else if (repairedFoot && y >= 196) {
          assert(actual.subarray(0, 150 * 4).equals(expected.subarray(0, 150 * 4)) &&
            actual.subarray(250 * 4).equals(expected.subarray(250 * 4)), `${expanded}/${frame}: only the front ankle/shoe changes`);
        } else assert(actual.equals(expected), `${expanded}/${frame}: preserve the whole body outside the intended midpoint/shoe correction`);
      }
    }
    poses.add(cell.toString('base64'));
    let count = 0, top = 256, bottom = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const alpha = cell[(y * 256 + x) * 4 + 3];
      if (!before || hasMidpoint && frame === 1) assert(alpha === 0 || alpha === 255, `${expanded}/${frame}: crisp alpha without haze`);
      if (alpha < 32) continue;
      count++; top = Math.min(top, y); bottom = Math.max(bottom, y);
      assert(x > 5 && x < 250 && y > 5 && y < 250, `${expanded}/${frame}: unclipped margins`);
    }
    assert(count > 6000 && count < 33000, `${expanded}/${frame}: complete, isolated character`);
    assert(top >= 12 && top < 55 && bottom >= 210 && bottom <= 240, `${expanded}/${frame}: body scale and ground alignment`);
    if (walking || running) assert.equal(shoeParts(cell), 2,
      `${expanded}/${frame}: exactly two isolated sneaker silhouettes, with no extra heel/foot`);
    if (repairedFoot) {
      assert.equal(shoeParts(cell, 150, 196), 1, `${expanded}/${frame}: one continuous sneaker, without a second stacked heel/shoe`);
      let seam = 0;
      for (let x = 150; x < 250; x++) if (cell[(195 * 256 + x) * 4 + 3] >= 128 && cell[(196 * 256 + x) * 4 + 3] >= 128) seam++;
      assert(seam >= 3, `${expanded}/${frame}: the repaired ankle stays connected to the shin`);
    }
    if (walking) {
      assert(Math.abs(bottom - (expanded === 'walk-eight' ? 239 : 237)) <= 1, 'Walking always keeps a support foot planted');
      headTops.push(top);
      // Compare artwork, not just its center: scaling and leftover nape/face pixels must fail.
      for (let y = 0; y < 56; y++) for (let x = 0; x < 56; x++) {
        const h = (y * 56 + x) * 4, p = ((top + y) * 256 + 106 + x) * 4;
        if (walkHead.data[h + 3]) assert(cell.subarray(p, p + 4).equals(walkHead.data.subarray(h, h + 4)),
          `${expanded}/${frame}: identical unscaled head, jaw, neck and collar`);
      }
      for (let y = 0; y < top + 44; y++) for (let x = 85; x < 186; x++) {
        if (y >= top + 40 && x >= 114) continue; // The collar and phone begin below the face.
        const hx = x - 106, hy = y - top;
        const expected = hx >= 0 && hx < 56 && hy >= 0 && hy < 56 ? walkHead.data[(hy * 56 + hx) * 4 + 3] : 0;
        assert.equal(cell[(y * 256 + x) * 4 + 3], expected, `${expanded}/${frame}: no head halo or gray nape trail`);
      }
      for (let y = top + 30; y < top + 56; y++) for (let x = 114; x < 158; x++) {
        const h = ((y - top) * 56 + x - 106) * 4, p = (y * 256 + x) * 4;
        if (walkHead.data[h + 3] || !cell[p + 3]) continue;
        assert(!(cell[p] > 110 && cell[p] > cell[p + 1] + 20 && cell[p + 1] > cell[p + 2] + 10),
          `${expanded}/${frame}: no old chin or neck outside the shared head`);
      }
      let sum = 0, pixels = 0;
      const support = [];
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        if (cell[(y * 256 + x) * 4 + 3] < 128) continue;
        if (y < top + 30) { sum += x; pixels++; }
        if (y >= bottom - 7) support.push(x);
      }
      headCenters.push(sum / pixels);
      if (frame % 4 === 3) {
        assert(Math.max(...support) < 125, `${expanded}/${frame}: toe-off support stays behind the hip`);
        let frontShoeBottom = 0;
        for (let y = 170; y < 256; y++) for (let x = 136; x < 250; x++) {
          const p = (y * 256 + x) * 4;
          const rgb = cell.subarray(p, p + 3);
          if (cell[p + 3] >= 128 && Math.min(...rgb) > 130 && Math.max(...rgb) - Math.min(...rgb) < 30)
            frontShoeBottom = Math.max(frontShoeBottom, y);
        }
        assert(frontShoeBottom >= bottom - 24 && frontShoeBottom < bottom - 8,
          `${expanded}/${frame}: front shoe stays low over flat ground instead of a high knee lift`);
      }
    }
    if (expanded.startsWith('phone-walk-')) {
      // Below the phone-holding forearm, skin belongs to the swinging free arm/hand.
      let sum = 0, pixels = 0;
      for (let y = 116; y < 155; y++) for (let x = 65; x < 190; x++) {
        const p = (y * 256 + x) * 4;
        if (cell[p + 3] < 128 || cell[p] <= 110 || cell[p] <= cell[p + 1] + 20 || cell[p + 1] <= cell[p + 2] + 10) continue;
        sum += x; pixels++;
      }
      assert(pixels > 15, `${expanded}/${frame}: visible free hand`);
      freeHandCenters.push(sum / pixels);
    }
  }
  assert.equal(poses.size, hasMidpoint ? 9 : running ? 8 : frames, `${expanded}: one added midpoint or complete original movement poses`);
  if (hasMidpoint) {
    const malformedFirstPose = Buffer.alloc(256 * 256 * 4);
    for (let y = 0; y < 256; y++) before.data.copy(malformedFirstPose, y * 256 * 4,
      y * before.info.width * 4, (y * before.info.width + 256) * 4);
    assert.equal(shoeParts(malformedFirstPose, 150, 196), 2, 'The original stacked heel/shoe is detected by the regression check');
    assert.equal(shoeParts(malformedFirstPose), 3, 'The original extra foot fails the two-feet regression check');
    const anchors = [];
    for (const [image, frame] of [[before, 0], [runMidpoint, 0], [before, 1]]) {
      let headLeft = 256, headRight = 0, headX = 0, headPixels = 0, soleX = 0, solePixels = 0;
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        if (image.data[(y * image.info.width + frame * 256 + x) * 4 + 3] < 128) continue;
        if (y < 52) { headLeft = Math.min(headLeft, x); headRight = Math.max(headRight, x); headX += x; headPixels++; }
        if (y >= 232) { soleX += x; solePixels++; }
      }
      assert(headPixels > 0 && solePixels > 0, 'Complete head and grounded support foot');
      anchors.push({ head: headX / headPixels, width: headRight - headLeft, sole: soleX / solePixels });
    }
    const [a, mid, b] = anchors;
    assert(mid.head >= Math.min(a.head, b.head) - 1 && mid.head <= Math.max(a.head, b.head) + 1, 'Aligned head between neighboring poses');
    assert(Math.abs(mid.width - (a.width + b.width) / 2) <= 5, 'Midpoint retains neighboring head scale');
    assert(mid.sole > Math.min(a.sole, b.sole) + 5 && mid.sole < Math.max(a.sole, b.sole) - 5, 'The support foot is a real intermediate phase');
  }
  if (walking) {
    assert(Math.max(...headTops) - Math.min(...headTops) <= 4, `${expanded}: restrained vertical body bob`);
    assert(Math.max(...headCenters) - Math.min(...headCenters) < 3, `${expanded}: stable head anchor`);
  }
  if (freeHandCenters.length) {
    for (const frame of [0, 1, 7]) assert(freeHandCenters[frame] < 105, `${expanded}/${frame}: free hand swings behind hip`);
    for (const frame of [2, 6]) assert(freeHandCenters[frame] > 110 && freeHandCenters[frame] < 135,
      `${expanded}/${frame}: free hand passes through the middle of its swing`);
    for (const frame of [3, 4, 5]) assert(freeHandCenters[frame] > 135, `${expanded}/${frame}: free hand swings ahead of hip`);
    assert(freeHandCenters[4] - freeHandCenters[0] > 40,
      `${expanded}: free arm alternates forward and back`);
    freeHandCenters.forEach((x, frame) => assert(Math.abs(x - freeHandCenters[(frame + 1) % frames]) < 50,
      `${expanded}/${frame}: arm swing includes an intermediate pose`));
    if (phoneArmPhases) freeHandCenters.forEach((x, frame) => assert(Math.abs(x - phoneArmPhases[frame]) < 3,
      `${expanded}/${frame}: flashlight toggle preserves arm phase`));
    else phoneArmPhases = freeHandCenters;
  }
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
  await page.evaluate(() => {
    performFloorChange('f16', 0, null);
    Body.setPosition(body, { x: 1450, y: floorY - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
  });
  await page.locator('#walk-sheet, #run-sheet').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  for (const [motion, frames, duration] of [['walk', 8, 1100], ['run', 16, 1000]]) {
    await page.evaluate(motion => {
      window.observedMovementFrames = new Set();
      const sample = () => {
        if (sprite.dataset.state === motion) window.observedMovementFrames.add(Number(sprite.dataset.frame));
        window.movementSample = requestAnimationFrame(sample);
      };
      window.movementSample = requestAnimationFrame(sample);
    }, motion);
    await page.keyboard.down('d');
    if (motion === 'run') await page.keyboard.down('Shift');
    const startX = await page.evaluate(() => body.position.x);
    if (motion === 'run') {
      await page.clock.runFor(650);
      assert((await page.evaluate(() => window.observedMovementFrames.size)) < 16,
        'Running no longer completes a cycle in 650ms');
      await page.clock.runFor(duration - 650);
      assert(Math.abs(await page.evaluate(() => body.position.x) - startX - 340) < 6,
        'Slower run animation preserves 340px/s movement');
    } else await page.clock.runFor(duration);
    assert.deepEqual((await page.evaluate(() => [...window.observedMovementFrames])).sort((a, b) => a - b),
      Array.from({ length: frames }, (_, i) => i), `${motion}: full cycle at the real game frame rate`);
    assert.equal(await page.locator('#player img:visible').count(), 1);
    assert(await page.locator(`#${motion}-sheet`).evaluate((image, frames) => {
      return image.naturalWidth === frames * 256 && image.clientWidth === frames * 192 &&
        Math.abs(new DOMMatrix(getComputedStyle(image).transform).m41 + Number(sprite.dataset.frame) * 192) < .01;
    }, frames), `${motion}: one complete cell in the real game`);
    await page.screenshot({ path: `.local/inbetweens-${motion}.png` });
    await page.evaluate(() => cancelAnimationFrame(window.movementSample));
    await page.keyboard.up('d');
    if (motion === 'run') await page.keyboard.up('Shift');
    await page.clock.runFor(34);
    assert.equal(await page.locator('#player').getAttribute('data-state'), 'idle');
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
console.log('PASS: two sneaker silhouettes in all 56 walk/run timing cells, unchanged upper-body pixels and original hands/hem, one preserved midpoint, complete normal/phone movement cycles and unchanged sprint speed/cadence in Chromium.');
