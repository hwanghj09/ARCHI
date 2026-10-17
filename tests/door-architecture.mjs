import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import sharp from 'sharp';

const profiles = { 'f3-studio': 'office-solid', 'b1-office': 'office-solid', 'f17-manager': 'office-solid',
  'f13-training': 'office-wood', 'f14-archive': 'office-wood', 'f15-seminar': 'office-lab' };
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click(); await page.locator('#opening-skip').click();
  await page.clock.runFor(100);
  const scenes = await page.evaluate(() => {
    triggerBuildingBlackout(); setAllFloorsPower(true); setDebugSanity(100);
    collectedItems.add('story-blackout-seen'); collectedItems.add('b1-cctv-seen'); collectedItems.add('b1-cctv-live');
    return [...floorById.values()].filter(config => config.id !== 'f17')
      .map(config => ({ id: config.id, floor: config.floor, interior: config.interior, walls: config.backgroundWallsOnly }));
  });
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  let bays = 0, normalDoors = 0;
  for (const scene of scenes) {
    let glass = [];
    if (!scene.interior && scene.walls && scene.id !== 'rooftop') {
      const folder = scene.floor < 0 ? `b${-scene.floor}` : `floor${String(scene.floor).padStart(2, '0')}`;
      glass = JSON.parse(await readFile(`assets/background/${folder}/walls-layout.json`, 'utf8'))
        .segments.filter(segment => segment.wall !== 'wall-concrete');
    }
    const doors = await page.evaluate(({ id, glass }) => {
      const config = floorById.get(id);
      performFloorChange(id, id === 'rooftop' ? null : 0, config.interior ? 'exit' : null);
      return currentDoors.filter(door => door.type === 'room').map(door => {
        const style = getComputedStyle(door.element), bayStyle = door.bay && getComputedStyle(door.bay);
        const expectedBay = config.interior ? door.key === 'exit' && Boolean(config.exitBay) :
          glass.some(segment => door.x < segment.x + segment.width && door.x + door.width > segment.x);
        const windows = config.exteriorWindows || [];
        const bayRect = door.bay && { x: parseFloat(bayStyle.left), y: parseFloat(bayStyle.top),
          width: parseFloat(bayStyle.width), height: parseFloat(bayStyle.height) };
        return { name: door.name, key: door.key, target: door.target, classes: [...door.element.classList], source: style.backgroundImage,
          restroom: config.name === '화장실' || door.target.endsWith('-restroom'), expectedBay,
          bounds: [door.x, door.y, door.width, floorY - door.y], bay: bayRect,
          bayBehind: door.bay && Boolean(door.bay.compareDocumentPosition(door.element) & Node.DOCUMENT_POSITION_FOLLOWING),
          bayBehindLabels: door.bay && [...dynamicScene.querySelectorAll('.floor-room')]
            .every(front => Boolean(door.bay.compareDocumentPosition(front) & Node.DOCUMENT_POSITION_FOLLOWING)),
          crossesWindow: bayRect && windows.some(w => bayRect.x < w.x + w.width && bayRect.x + bayRect.width > w.x &&
            bayRect.y < w.y + w.height && bayRect.y + bayRect.height > w.y) };
      });
    }, { id: scene.id, glass });
    for (const door of doors) {
      if (!door.restroom) assert(!/fire-exit|stairs\.png|restroom-door/.test(door.source), `${scene.id}: ${door.name} uses an ordinary room door`);
      const profile = door.key === 'exit' ? profiles[scene.id] : profiles[door.target];
      if (profile) {
        assert(door.classes.includes(profile), `${scene.id}: door design follows room use on both sides`); normalDoors++;
        assert(door.source.endsWith('/room-doors/matched-office-doors.png")'), `${scene.id}: ordinary doors share the background-matched material set`);
      }
      if (['f13-testbay', 'f13-secure'].includes(scene.id) && door.key.startsWith('link:'))
        assert(door.classes.includes('office-solid'), `${scene.id}: the connecting door has a real lever-handle sprite`);
      assert.equal(Boolean(door.bay), door.expectedBay, `${scene.id}: glass frontages and interior exit bays have solid wall openings`);
      if (door.bay) {
        assert.deepEqual(door.bay, { x: door.bounds[0] - 8, y: 100, width: door.bounds[2] + 16, height: 470 });
        assert(door.bayBehind && door.bayBehindLabels && !door.crossesWindow,
          `${scene.id}: structural jambs stop at external windows and stay behind doors and room labels`); bays++;
      }
    }
  }
  assert.equal(normalDoors, 11, 'Five paired ordinary doors and the manager room interior are covered');
  assert(bays >= 40, 'Every glass-fronted doorway has a full-height wall section');
  for (const [id, key] of [['f3', 'room:f3-fitness'], ['f15', 'room:f15-seminar'], ['f4-meeting', 'exit']]) {
    const sample = await page.evaluate(async ([id, key]) => {
      const config = floorById.get(id); performFloorChange(id, 0, config.interior ? 'exit' : null);
      const door = currentDoors.find(door => door.key === key);
      const image = new Image(); image.src = 'assets/background/painted-walls/interior-atlas.png'; await image.decode();
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      cameraX = Math.round(cameraTarget() * scale) / scale; render();
      const probe = document.createElement('div'); probe.id = 'header-window-probe';
      Object.assign(probe.style, { position: 'absolute', inset: '0', background: '#ff00ff' });
      dynamicScene.insertBefore(probe, door.bay);
      const rect = door.element.getBoundingClientRect();
      return { x: Math.round(rect.x + rect.width / 2), y: Math.round(rect.y - 50 * scale), width: 16, height: 16 };
    }, [id, key]);
    const first = await page.screenshot({ clip: sample });
    await page.locator('#header-window-probe').evaluate(element => { element.style.background = '#00ff00'; });
    const second = await page.screenshot({ clip: sample });
    const difference = await sharp(await sharp(first).composite([{ input: second, blend: 'difference' }]).toBuffer()).stats();
    assert(difference.channels.slice(0, 3).every(channel => channel.max <= 2), `${id}: a window or mullion cannot show through the door header`);
  }
  assert.deepEqual(errors, []);
  console.log(`PASS: ${scenes.length} scenes, ${bays} full-height door bays, ${normalDoors} ordinary door faces and opaque headers.`);
} finally { await browser.close(); }
