import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { Script } from 'node:vm';
import { chromium } from 'playwright';

const scripts = (await readdir('js', { recursive: true })).filter(file => file.endsWith('.js'));
for (const file of scripts) new Script(await readFile(`js/${file}`, 'utf8'), { filename: file });

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText}`));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  const scenes = await page.evaluate(() => [...floorById.keys()]);
  const images = new Set();
  for (const id of scenes) {
    const sources = await page.evaluate(async id => {
      closeInspection();
      performFloorChange(id, id === 'rooftop' ? null : 0, floorById.get(id).interior ? 'exit' : null);
      // The computer fear overlay leaves its image empty until an event assigns a frame.
      await Promise.all([...document.querySelectorAll('img[src]')].filter(image => image.getAttribute('src')).map(image => image.decode()));
      return [...new Set([...document.querySelectorAll('#world, #world *')].flatMap(element =>
        [null, '::before', '::after'].flatMap(pseudo =>
          [...getComputedStyle(element, pseudo).backgroundImage.matchAll(/url\(["']?(.*?)["']?\)/g)].map(match => match[1]))))];
    }, id);
    for (const source of sources) {
      if (images.has(source)) continue;
      await page.evaluate(async source => {
        const image = new Image();
        image.src = source;
        await image.decode();
      }, source);
      images.add(source);
    }
    assert.deepEqual(errors, [], `${id}: scripts and assets load without browser errors`);
  }
  console.log(`PASS: ${scripts.length} scripts parse; ${scenes.length} scenes and ${images.size} CSS images load without browser errors.`);
} finally {
  await browser.close();
}
