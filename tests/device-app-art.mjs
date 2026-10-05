import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { finishSceneTransition } from './scene-transition.mjs';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, hasTouch: true });
  const png = async name => `data:image/png;base64,${(await readFile(new URL(`../assets/ui/apps/${name}`, import.meta.url))).toString('base64')}`;
  const artwork = await page.evaluate(async sources => {
    const images = await Promise.all(sources.map(async source => {
      const image = new Image(); image.src = source; await image.decode(); return image;
    }));
    const atlas = images[0];
    const canvas = document.createElement('canvas'); canvas.width = atlas.width; canvas.height = atlas.height;
    const context = canvas.getContext('2d'); context.drawImage(atlas, 0, 0);
    const pixels = context.getImageData(0, 0, atlas.width, atlas.height).data;
    const cellWidth = atlas.width / 6;
    let transparent = 0;
    const cells = Array.from({ length: 6 }, (_, column) => {
      let left = cellWidth, right = -1, top = atlas.height, bottom = -1, count = 0;
      for (let y = 0; y < atlas.height; y++) for (let x = 0; x < cellWidth; x++) {
        const alpha = pixels[(y * atlas.width + column * cellWidth + x) * 4 + 3];
        if (alpha === 0) transparent++;
        // Ignore nearly invisible alpha noise outside the generated icon bodies.
        if (alpha <= 16) continue;
        count++; left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
      return { left, right, top, bottom, count };
    });
    return { width: atlas.width, height: atlas.height, transparent, cells, wallpaper: { width: images[1].width, height: images[1].height } };
  }, [await png('app-icons.png'), await png('phone-wallpaper.png')]);
  assert.equal(artwork.width, 2172);
  assert.equal(artwork.height, 724);
  assert(artwork.transparent > artwork.width * artwork.height / 4, 'Icon sheet has a true transparent background');
  const cellWidth = artwork.width / 6;
  for (const cell of artwork.cells) {
    assert(cell.count > cellWidth * cellWidth / 2, 'Each icon cell contains artwork');
    assert(cell.left > 0 && cell.right < cellWidth - 1, 'Neighboring cells have separate transparent borders');
  }
  assert(artwork.wallpaper.height > artwork.wallpaper.width, 'The phone wallpaper uses a portrait image');
  assert(artwork.wallpaper.width >= 720 && artwork.wallpaper.height >= 1280, 'Wallpaper resolution keeps the phone screen sharp');

  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(request.url()));
  await page.clock.install({ time: new Date('2026-10-04T00:00:00Z') });
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date('2026-10-04T00:01:00Z'));
  await page.clock.runFor(100);
  const pc = page.locator('#computer');
  const phone = page.locator('#phone');
  const apps = ['files', 'notes', 'mail', 'calculator', 'building', 'flashlight'];
  const checkIcon = async icon => {
    const visual = await icon.evaluate(element => {
      const style = getComputedStyle(element), box = element.getBoundingClientRect(), button = element.closest('button').getBoundingClientRect();
      return { name: element.dataset.appIcon, image: style.backgroundImage, size: style.backgroundSize, x: style.backgroundPositionX, y: style.backgroundPositionY, width: box.width, height: box.height,
        inside: box.left >= button.left - 1 && box.top >= button.top - 1 && box.right <= button.right + 1 && box.bottom <= button.bottom + 1 };
    });
    assert.match(visual.image, /app-icons\.png/);
    assert.equal(visual.size, '600% 200%');
    assert.equal(parseFloat(visual.x), apps.indexOf(visual.name) * 20);
    assert(visual.width >= 20 && visual.width <= 64 && visual.height === visual.width, `${visual.name} keeps a square device icon`);
    assert(visual.inside, `${visual.name} stays inside its native button`);
    const top = (artwork.height - cellWidth) * parseFloat(visual.y) / 100;
    const cell = artwork.cells[apps.indexOf(visual.name)];
    assert(cell.top >= top && cell.bottom < top + cellWidth, `${visual.name} artwork fits the vertical sprite crop`);
  };

  await page.keyboard.press('e');
  await finishSceneTransition(page);
  for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 568, height: 320 }]) {
    await page.setViewportSize(viewport);
    for (const name of apps.slice(0, 5)) {
      const shortcut = pc.locator(`.computer-shortcuts [data-computer-app="${name}"]`);
      await shortcut.tap();
      assert(await pc.locator(`#computer-${name}`).isVisible(), `Painted ${name} shortcut still opens its app`);
      await checkIcon(shortcut.locator('.app-art'));
      await pc.locator('#computer-window-close').tap();
      await checkIcon(pc.locator(`.computer-taskbar [data-computer-app="${name}"] .app-art`));
    }
    await pc.locator('.computer-taskbar [data-computer-app="calculator"]').tap();
    assert(await pc.locator('#computer-calculator').isVisible(), 'Painted taskbar icons keep their click targets');
    await pc.locator('#computer-window-close').tap();
    if (viewport.width === 1280) {
      await mkdir('.local', { recursive: true });
      await pc.screenshot({ path: '.local/app-art-computer.png' });
    }
    await pc.locator('#computer-exit').tap();
    await finishSceneTransition(page);
    await page.locator('#phone-button').tap();
    assert.match(await phone.locator('.phone-screen').evaluate(element => getComputedStyle(element).backgroundImage), /phone-wallpaper\.png/);
    for (const name of ['notes', 'calculator', 'building']) {
      const shortcut = phone.locator(`[data-phone-app="${name}"]`);
      await shortcut.scrollIntoViewIfNeeded();
      await checkIcon(shortcut.locator('.app-art'));
      await shortcut.tap();
      assert(await phone.locator(`[data-phone-view="${name}"]`).isVisible(), `Painted phone ${name} icon still opens its app`);
      await phone.locator('#phone-app-back').tap();
    }
    await phone.locator('#phone-light').scrollIntoViewIfNeeded();
    await checkIcon(phone.locator('#phone-light .app-art'));
    await phone.locator('#phone-light').tap();
    assert.equal(await phone.locator('#phone-light').getAttribute('aria-pressed'), 'true');
    await phone.locator('#phone-light').tap();
    assert.equal(await phone.locator('#phone-light').getAttribute('aria-pressed'), 'false');
    assert(await phone.locator('.phone-screen').evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Wallpaper and icon sprites do not widen the phone screen');
    if (viewport.width === 1280) await phone.screenshot({ path: '.local/app-art-phone.png' });
    await phone.locator('#phone-close').tap();
    await page.clock.runFor(100);
    if (viewport.width !== 568) { await page.keyboard.press('e'); await finishSceneTransition(page); }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: transparent six-cell PNG artwork and portrait wallpaper, complete sprite crops, device icon bounds, native app/flashlight clicks across desktop, portrait and landscape.');
} finally {
  await browser.close();
}
