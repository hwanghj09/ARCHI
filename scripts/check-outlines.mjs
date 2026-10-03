// 근접 테두리 점검: node scripts/check-outlines.mjs [장면,장면,...] [--overrides]
// 장면(floorById의 id와 'office', 생략하면 전부)마다 상호작용 대상을 하나씩 가까운 대상으로 두고 실제 근접 테두리
// (#interaction-outline)를 그린 화면을 잘라, 장면별 한 장(.local/outline-audit/<장면>.png)으로 모은다. 각 칸의 제목은
// `번호. 이름 [클래스] x,y,width,height`(테두리 상자, 월드 좌표)이고 `*`는 층 데이터의 outline으로 덮어쓴 상자다.
// --overrides: 덮어쓴 상자만 모아 .local/outline-audit/overrides.png 한 장으로 만든다.
// 그림 속 좌표를 재려면 scripts/scene-grid.mjs를 쓴다. tests/interaction-outline.mjs가 테두리 규칙을 검사한다.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const overridesOnly = args.includes('--overrides');
const only = args.find(arg => !arg.startsWith('--'))?.split(',');
const outDir = fileURLToPath(new URL('../.local/outline-audit/', import.meta.url));
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.clock.install();
await page.goto(new URL('../index.html', import.meta.url).href);
await page.locator('#opening-skip').click();
await page.clock.runFor(100);
await page.addStyleTag({ content: '#darkness, #player, #interaction-hint, #interaction-status, #debug-floor, #room-transition { display: none !important; }' });
// 게임 루프를 멈춰 카메라와 테두리가 단계 사이에 움직이지 않게 한다.
await page.evaluate(() => { window.update = () => {}; window.render = () => {}; });

const sheet = await browser.newPage({ viewport: { width: 1600, height: 400 } });
const cell = crop => `<div style="background:#222;padding:3px"><div>${crop.label}</div>
  <img src="data:image/png;base64,${crop.data}" style="display:block;max-width:1570px"></div>`;
const render = async (title, crops, path) => {
  await sheet.setContent(`<body style="margin:0;background:#444;font:12px Arial;color:#fff;display:flex;flex-wrap:wrap;gap:6px;padding:6px;width:1588px">
    <div style="width:100%;font-size:16px">${title}</div>${crops.map(cell).join('')}</body>`);
  await sheet.screenshot({ path, fullPage: true });
};

const scenes = await page.evaluate(() => ['office', ...floorById.keys()]);
const overrides = [];
for (const scene of scenes.filter(id => !only || only.includes(id))) {
  const items = await page.evaluate(scene => {
    closeInspection();
    releaseInput();
    if (scene === 'office') {
      performFloorChange('f17', 0);
      performRoomChange();
    } else {
      const dest = floorById.get(scene);
      const fromCorridor = dest.interior && floorById.get(dest.parent).rooms?.some(entry => entry.target === scene);
      performFloorChange(scene, scene === 'rooftop' ? null : 0,
        dest.interior ? (fromCorridor ? 'exit' : `link:${dest.links[0].target}`) : null);
    }
    world.dataset.dark = 'false';
    window.outlineAuditDoors = room === 'dynamic' ? currentDoors : room === 'corridor' ? [...doors, officeDoors[0]] :
      [officeDoors[1], officeComputer];
    return outlineAuditDoors.map((door, index) => ({ index, name: door.name || door.type, cls: door.element.className,
      override: Boolean(door.outline) && !['floor-prop', 'solar-supply'].some(name => door.element.classList.contains(name)) &&
        door.type !== 'computer' }));
  }, scene);
  const crops = [];
  for (const item of items) {
    const rect = await page.evaluate(index => {
      const door = outlineAuditDoors[index];
      nearbyDoor = door;
      outlinedDoor = null;
      updateOutline();
      const [x, y, width, height] = outlineBox(door);
      const element = door.element.getBoundingClientRect();
      const origin = world.getBoundingClientRect();
      const elementX = (element.left - origin.left) / scale;
      const left = Math.min(x, elementX);
      const right = Math.max(x + width, elementX + element.width / scale);
      const top = Math.min(y, (element.top - origin.top) / scale);
      const bottom = Math.max(y + height, (element.bottom - origin.top) / scale);
      cameraX = Math.max(0, Math.min(worldWidth - viewWidth, (left + right) / 2 - viewWidth / 2));
      world.style.transform = `translate(${-cameraX * scale}px, ${stage.clientHeight - worldHeight * scale}px) scale(${scale})`;
      return { left: (left - cameraX) * scale, top: top * scale + stage.clientHeight - worldHeight * scale,
        width: (right - left) * scale, height: (bottom - top) * scale, box: [x, y, width, height].map(Math.round) };
    }, item.index);
    const pad = 40;
    const clip = { x: Math.max(0, rect.left - pad), y: Math.max(0, rect.top - pad) };
    clip.width = Math.min(1600 - clip.x, rect.width + pad * 2);
    clip.height = Math.min(720 - clip.y, rect.height + pad * 2);
    const label = `${item.index}. ${item.name} [${item.cls.replace(' near', '')}]${item.override ? ' *' : ''} ${rect.box.join(',')}`;
    if (clip.width < 4 || clip.height < 4) {
      console.log(`${scene} ${label}: off screen`);
      continue;
    }
    const crop = { label, data: (await page.screenshot({ clip })).toString('base64') };
    crops.push(crop);
    if (item.override) overrides.push({ ...crop, label: `${scene} ${label}` });
  }
  if (!overridesOnly) await render(scene, crops, `${outDir}${scene}.png`);
  console.log(scene, items.length);
}
if (overridesOnly) await render('outline overrides', overrides, `${outDir}overrides.png`);
if (errors.length) console.log('page errors', errors);
await browser.close();
