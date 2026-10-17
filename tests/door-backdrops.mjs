import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import sharp from 'sharp';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  await page.evaluate(() => {
    triggerBuildingBlackout(); setAllFloorsPower(true); setDebugSanity(100);
    collectedItems.add('story-blackout-seen');
  });
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  let states = 0;
  for (const [id, key] of [['f3', 'room:f3-fitness'], ['f4', 'room:f4-dev'], ['f4-meeting', 'exit']]) {
    const sample = await page.evaluate(async ([id, key]) => {
      const config = floorById.get(id);
      performFloorChange(id, 0, config.interior ? 'exit' : null);
      const door = currentDoors.find(door => door.key === key);
      const source = new Image(); source.src = door.sprite; await source.decode();
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      cameraX = Math.round(cameraTarget() * scale) / scale; render();
      // A bright wall behind a glass door must never become a second frame or fill its opening.
      const probe = document.createElement('div'); probe.id = 'door-backdrop-probe';
      Object.assign(probe.style, { position: 'absolute', left: `${door.x}px`, top: `${door.y}px`,
        width: `${door.width}px`, height: `${floorY - door.y}px` });
      dynamicScene.insertBefore(probe, door.element);
      const rect = door.element.getBoundingClientRect();
      return { x: Math.round(rect.x + rect.width * .25), y: Math.round(rect.y + rect.height * .2), width: 16, height: 16 };
    }, [id, key]);
    for (const open of [false, true]) {
      await page.evaluate(({ key, open }) => {
        setDoorOpen(currentDoors.find(door => door.key === key), open);
        document.getElementById('door-backdrop-probe').style.background = '#ff00ff';
      }, { key, open });
      const magenta = await page.screenshot({ clip: sample });
      await page.locator('#door-backdrop-probe').evaluate(element => { element.style.background = '#00ff00'; });
      const green = await page.screenshot({ clip: sample });
      const difference = await sharp(await sharp(magenta).composite([{ input: green, blend: 'difference' }]).toBuffer()).stats();
      assert(difference.channels.slice(0, 3).every(channel => channel.max <= 2), `${id}: wall bleeds through ${open ? 'open' : 'closed'} door`);
      states++;
    }
  }
  console.log(`PASS: ${states} open/closed glass door states hide the wall and its frames, inside and outside.`);
} finally {
  await browser.close();
}
