import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const camera = await readFile(new URL('../js/scene/camera.js', import.meta.url), 'utf8');
const lamps = runInNewContext(`${camera}\n;({ run: runLitPhoneLamps, crouch: crouchPhoneLamps });`);
for (const motion of ['run', 'crouch']) {
  const count = motion === 'run' ? 16 : 4, name = motion === 'run' ? 'run-sixteen' : 'crouch';
  const load = file => sharp(fileURLToPath(new URL(`../assets/player/jeong-suho-${file}.png`, import.meta.url)))
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [on, off, base] = await Promise.all([load(`phone-${name}-on`), load(`phone-${name}-off`), load(name)]);
  assert.deepEqual([on.info.width, on.info.height], [count * 256, 256]);
  assert.deepEqual([off.info.width, off.info.height], [count * 256, 256]);
  const poses = new Set();
  for (let frame = 0; frame < count; frame++) {
    const [lx, ly] = lamps[motion][frame];
    const cell = Buffer.alloc(256 * 256 * 4);
    let top = 256, bottom = 0, pixels = 0, led = 0, differences = 0, originalBottom = 0;
    let headIntersection = 0, headUnion = 0, legIntersection = 0, legUnion = 0;
    for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
      const p = (y * count * 256 + frame * 256 + x) * 4;
      on.data.copy(cell, (y * 256 + x) * 4, p, p + 4);
      assert.equal(on.data[p + 3], off.data[p + 3], 'ON/OFF silhouettes stay identical');
      if (!on.data.subarray(p, p + 4).equals(off.data.subarray(p, p + 4))) {
        differences++;
        assert(Math.abs(x - lx) <= 3 && Math.abs(y - ly) <= 3, 'Only the phone LED changes when switching off');
      }
      if (motion === 'crouch' && !base.data.subarray(p, p + 4).equals(on.data.subarray(p, p + 4)))
        assert(x >= 165 && y >= 138 && y < 214, 'Crouching keeps its original head, back and feet');
      if (base.data[p + 3] >= 128) originalBottom = Math.max(originalBottom, y);
      if (motion === 'run') {
        if (x < lx - 18 || x >= lx + 7 || y < ly - 4 || y >= ly + 23)
          assert(base.data.subarray(p, p + 4).equals(on.data.subarray(p, p + 4)), 'Original run pixels stay identical outside the phone/grip');
        const a = base.data[p + 3] >= 128, b = on.data[p + 3] >= 128;
        if (y < 70) { if (a || b) headUnion++; if (a && b) headIntersection++; }
        if (y >= 132) { if (a || b) legUnion++; if (a && b) legIntersection++; }
      }
      if (on.data[p + 3] < 128) continue;
      pixels++; top = Math.min(top, y); bottom = Math.max(bottom, y);
      assert(x > 0 && x < 255 && y > 0 && y < 255, 'Every pose has unclipped transparent margins');
      if (Math.abs(x - lx) <= 2 && Math.abs(y - ly) <= 2) led = Math.max(led, Math.min(...on.data.subarray(p, p + 3)));
    }
    poses.add(cell.toString('base64'));
    assert(pixels > 5000 && pixels < 20000 && bottom <= 239, `${motion}/${frame}: complete calibrated character`);
    assert(led > 210 && differences > 0, `${motion}/${frame}: beam overlaps the actual phone LED`);
    if (motion === 'run') {
      assert(top >= 15 && top <= 40 && bottom >= 205, 'Full-body run poses retain a consistent scale');
      assert(lx >= 70 && lx <= 230 && ly >= 65 && ly <= 150, 'Phone travels with the original running hand');
      assert(Math.abs(bottom - originalBottom) <= 1, 'The complete figure keeps the original run foot anchor');
      assert.equal(headIntersection, headUnion, 'Head silhouette remains identical to the original run');
      assert(legIntersection / legUnion > .9, `Frame ${frame}: original running leg silhouette (${legIntersection / legUnion})`);
      if (frame % 2 === 1 && frame !== 1) for (let y = 0; y < 256; y++) {
        const p = (y * count * 256 + frame * 256) * 4;
        assert(on.data.subarray(p, p + 1024).equals(on.data.subarray(p - 1024, p)), 'Pose holds match the original run timing');
      }
      // A floating hand, sleeve or leftover matte would form a second component.
      const queue = [ly * 256 + lx], seen = new Uint8Array(256 * 256); seen[queue[0]] = 1;
      for (let i = 0; i < queue.length; i++) {
        const x = queue[i] % 256, y = Math.floor(queue[i] / 256);
        for (let yy = Math.max(0, y - 1); yy <= Math.min(255, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(255, x + 1); xx++) {
          const p = yy * 256 + xx;
          if (!seen[p] && cell[p * 4 + 3] >= 128) { seen[p] = 1; queue.push(p); }
        }
      }
      assert(queue.length > pixels * .99, 'The phone and gripping hand connect to the full character');
      for (let p = 0; p < seen.length; p++) if (!seen[p] && cell[p * 4 + 3] >= 128) {
        const original = (Math.floor(p / 256) * count * 256 + frame * 256 + p % 256) * 4;
        assert(cell.subarray(p * 4, p * 4 + 4).equals(base.data.subarray(original, original + 4)), 'No new detached prop pixels');
      }
    }
  }
  assert.equal(poses.size, motion === 'run' ? 9 : 4, 'Pose count matches the original animation');
}
console.log('PASS: original run head/leg silhouettes, foot anchors, nine-pose timing, connected figures, ON/OFF matching and moving phone LEDs.');
