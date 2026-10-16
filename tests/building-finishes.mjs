import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const manifest = JSON.parse(await readFile('assets/background/finish-manifest.json', 'utf8'));
for (const asset of manifest.assets) {
  const png = await readFile(asset.output);
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [asset.width, 760], asset.output);
}
const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  const fixed = await page.evaluate(async () => {
    const results = [];
    for (const [name, width, images] of [['office', 2400, [officeBackground]],
      ['corridor', 5000, [corridorBackground, extension.querySelector('img')]]]) {
      await Promise.all(images.map(image => image.decode()));
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = 760;
      const ctx = canvas.getContext('2d');
      for (const image of images) {
        const style = getComputedStyle(image);
        ctx.drawImage(image, parseFloat(style.left), parseFloat(style.top), parseFloat(style.width), parseFloat(style.height));
      }
      const data = ctx.getImageData(0, 0, width, 760).data;
      let gaps = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 255) gaps++;
      results.push([name, gaps]);
    }
    return results;
  });
  assert.deepEqual(fixed, [['office', 0], ['corridor', 0]], 'Both fixed 17F scenes cover the full canvas');
  const ids = await page.evaluate(() => {
    setDebugSanity(100);
    collectedItems.add('b1-cctv-live'); collectedItems.add('b1-cctv-seen');
    return [...floorById.keys()].filter(id => id !== 'f17');
  });
  const incomplete = [];
  for (const id of ids) {
    const result = await page.evaluate(async id => {
      performFloorChange(id, null, floorById.get(id).interior ? 'exit' : null);
      const images = [...dynamicScene.querySelectorAll('.floor-background, :scope > img')];
      await Promise.all(images.map(image => image.decode()));
      const canvas = document.createElement('canvas');
      canvas.width = worldWidth; canvas.height = 760;
      const ctx = canvas.getContext('2d');
      for (const image of images) {
        const crop = image.parentElement.classList.contains('floor-art-crop') ? image.parentElement : null;
        const x = crop ? parseFloat(crop.style.left) : 0, y = crop ? parseFloat(crop.style.top) : 0;
        ctx.save();
        if (crop) { ctx.beginPath(); ctx.rect(x, y, parseFloat(crop.style.width), parseFloat(crop.style.height)); ctx.clip(); }
        ctx.drawImage(image, x + (parseFloat(image.style.left) || 0), y + (parseFloat(image.style.top) || 0),
          parseFloat(image.style.width), parseFloat(image.style.height));
        ctx.restore();
      }
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let gaps = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] < 255) gaps++;
      return { id: dynamicFloorId, gaps, images: images.length };
    }, id);
    assert.equal(result.id, id, 'The requested scene loaded');
    assert(result.images > 0, `${id}: a finished background exists`);
    if (result.gaps) incomplete.push([id, result.gaps]);
  }
  assert.deepEqual(incomplete, [], 'All ceilings, walls and floors cover y=0..760');
  assert.deepEqual(errors, []);
  console.log(`PASS: ${manifest.assets.length} remaining background variants, ${ids.length} scenes including all restrooms cover y=0..760.`);
} finally { await browser.close(); }
