// 장면 좌표 격자: node scripts/scene-grid.mjs <장면> <x0> <x1> [y0=0] [y1=720] [배율=1]
// 장면의 월드 구간 x0..x1, y0..y1을 50px 격자(100px마다 숫자)와 함께 .local/outline-audit/grid-<장면>-<x0>-<x1>.png로 찍는다.
// 초록 상자는 상호작용 대상마다 지금 근접 테두리 상자(번호는 scripts/check-outlines.mjs와 같다), 빨간 띠는 판정 범위(x..x+width)다.
// 그림 속 문·설비의 상자를 재어 층 데이터의 outline(doorOutline, exitOutline …)에 적을 때 쓴다. 찍힌 그림의 한 점은
// 월드 좌표 (x0 + 그림x / 배율, y0 + 그림y / 배율)이다.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const [scene, ...numbers] = process.argv.slice(2);
const [x0, x1, y0 = 0, y1 = 720, zoom = 1] = numbers.map(Number);
if (!scene || !(x1 > x0)) throw new Error('usage: node scripts/scene-grid.mjs <scene> <x0> <x1> [y0] [y1] [zoom]');
const outDir = fileURLToPath(new URL('../.local/outline-audit/', import.meta.url));
await mkdir(outDir, { recursive: true });

const width = Math.ceil((x1 - x0) * zoom);
const height = Math.ceil((y1 - y0) * zoom);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: Math.max(200, height) } });
await page.clock.install();
await page.goto(new URL('../index.html', import.meta.url).href);
await page.locator('#opening-skip').click();
await page.clock.runFor(100);
await page.addStyleTag({ content: `#darkness, #player, #interaction-hint, #debug-floor, #room-transition, header, nav { display: none !important; }
  .grid-line { position: absolute; z-index: 5; pointer-events: none; }
  .grid-label { position: absolute; z-index: 6; padding: 0 2px; background: #000a; color: #ff0; font: 11px monospace; }
  .grid-box { position: absolute; z-index: 5; outline: 1px solid #0f0; pointer-events: none; }
  .grid-box span { position: absolute; left: 0; top: -14px; padding: 0 2px; background: #000c; color: #0f0; font: bold 12px monospace; }
  .grid-hit { position: absolute; z-index: 5; height: 4px; background: #f008; pointer-events: none; }` });
await page.evaluate(() => { window.update = () => {}; window.render = () => {}; });
await page.evaluate(({ scene, x0, x1, y0, zoom }) => {
  closeInspection();
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
  const active = room === 'dynamic' ? currentDoors : room === 'corridor' ? [...doors, officeDoors[0]] : [officeDoors[1], officeComputer];
  const add = (className, style, text) => {
    const element = document.createElement('div');
    element.className = className;
    Object.assign(element.style, style);
    if (text) element.append(Object.assign(document.createElement('span'), { textContent: text }));
    world.append(element);
    return element;
  };
  for (let x = Math.ceil(x0 / 50) * 50; x <= x1; x += 50) {
    add('grid-line', { left: `${x}px`, top: '0px', width: '1px', height: '720px', background: x % 100 ? '#ff04' : '#ff08' });
    if (x % 100 === 0) add('grid-label', { left: `${x + 2}px`, top: `${y0 + 2}px` }).textContent = x;
  }
  for (let y = 0; y <= 720; y += 50) {
    add('grid-line', { left: '0px', top: `${y}px`, width: `${worldWidth}px`, height: '1px', background: y % 100 ? '#ff04' : '#ff08' });
    if (y % 100 === 0) add('grid-label', { left: `${x0 + 2}px`, top: `${y + 2}px` }).textContent = y;
  }
  active.forEach((door, index) => {
    const [x, y, width, height] = outlineBox(door);
    add('grid-box', { left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` }, String(index));
    add('grid-hit', { left: `${door.x}px`, top: `${(door.standY ?? floorY) - 4}px`, width: `${door.width}px` });
  });
  world.style.transform = `translate(${-x0 * zoom}px, ${-y0 * zoom}px) scale(${zoom})`;
}, { scene, x0, x1, y0, zoom });
const path = `${outDir}grid-${scene}-${x0}-${x1}.png`;
await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
console.log(path);
await browser.close();
