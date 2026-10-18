import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from 'playwright';

const css = await readFile(new URL('../css/manual-control.css', import.meta.url), 'utf8');
const images = [...new Set([...css.matchAll(/url\('\.\.\/(assets\/ui\/manual-control\/[^']+)'\)/g)].map(match => match[1]))];
assert.equal(images.length, 19, 'Every generated layer is used by the game');
for (const image of images) {
  const { data, info } = await sharp(fileURLToPath(new URL(`../${image}`, import.meta.url))).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert(info.width > 0 && info.height > 0);
  for (let x = 0; x < info.width; x++) {
    assert.equal(data[x * 4 + 3], 0, `${image}: transparent top margin`);
    assert.equal(data[((info.height - 1) * info.width + x) * 4 + 3], 0, `${image}: transparent bottom margin`);
  }
}

const specs = [
  { kind: 'lever', dir: 'down', ends: ['전송', '차단'] },
  { kind: 'switch', dir: 'up', ends: ['ON', 'OFF'] },
  { kind: 'key', ends: ['잠금', '해제'] },
  { kind: 'crank' }, { kind: 'clock' },
  { kind: 'selector', choices: ['조명', '승강기', '1F 주 전원'] },
  { kind: 'selector', choices: ['한정우', '김도윤', '이수민', '정수호'] },
  { kind: 'press', text: '퇴실' },
  { kind: 'press', item: 'f2-remote', text: '▼' },
  { kind: 'plug', dir: 'out', item: 'CAM', socket: 'B2 복도' },
  { kind: 'plug', dir: 'in', item: 'NAS', socket: '투입구' },
  { kind: 'plug', dir: 'in', item: '핸들', socket: '개방구' },
  { kind: 'card' },
];
await mkdir(new URL('../.local/', import.meta.url), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce', hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  await page.waitForFunction(() => openingReady);
  await page.evaluate(() => finishOpening());
  const previews = [];
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 720 });
    for (const [index, spec] of specs.entries()) {
      await page.evaluate(spec => {
        closeControl();
        openControl({ name: `직접 조작 · ${spec.kind}`, x: 100, width: 50, control: { label: '부품을 움직여 장치를 조작한다.', ...spec } });
      }, spec);
      const device = page.locator('#manual-control-device');
      assert(await device.isVisible());
      assert(await page.locator('#manual-control-title').evaluate(element => {
        const box = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
      }), 'The game HUD does not cover the control title');
      const rendered = await device.evaluate(async element => {
        const sources = new Set();
        for (const child of element.children) for (const pseudo of [null, '::before']) {
          const src = getComputedStyle(child, pseudo).backgroundImage.match(/^url\("?(.+?)"?\)$/)?.[1];
          if (src) sources.add(src);
        }
        for (const src of sources) { const image = new Image(); image.src = src; await image.decode(); }
        return sources.size;
      });
      assert(rendered >= (spec.item === 'f2-remote' ? 1 : 2), `${spec.kind}: its sprite layers decode`);
      for (const progress of [0, .5, 1]) {
        await page.evaluate(progress => { controlStep.value = controlStep.target * progress; renderControl(); }, progress);
        const geometry = await device.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          return [...element.querySelectorAll('.control-plate, .control-handle, .control-socket, .control-reader, .control-dial, .control-choice')].map(part => {
            const rect = part.getBoundingClientRect();
            return { name: part.className, left: rect.left - bounds.left, right: rect.right - bounds.left, top: rect.top - bounds.top, bottom: rect.bottom - bounds.top,
              width: bounds.width, height: bounds.height };
          });
        });
        for (const rect of geometry) assert(rect.left >= -1 && rect.right <= rect.width + 1 && rect.top >= -1 && rect.bottom <= rect.height + 1,
          `${width}px ${spec.kind}/${spec.item ?? ''} ${progress}: clipped ${JSON.stringify(rect)}`);
      }
      await page.evaluate(() => { controlStep.value = controlStep.target * .5; renderControl(); });
      if (width === 1280) previews.push(await page.locator('#manual-control').screenshot());
      if (spec.item === 'f2-remote') await page.locator('#manual-control').screenshot({ path: `.local/projector-remote-control-${width}.png` });
      if (width === 320 && spec.kind === 'press') {
        await device.locator('.control-handle').tap();
        assert.equal(await page.evaluate(() => controlStep.done), true, 'A real touch presses the button sprite');
      }
      if (width === 320 && spec.kind === 'card') {
        await page.screenshot({ path: '.local/manual-control-mobile.png' });
        const before = await device.locator('.control-handle').boundingBox();
        const bounds = await device.boundingBox();
        await page.mouse.move(bounds.x + 40, bounds.y + 100);
        await page.mouse.down();
        await page.mouse.move(bounds.x + 70, bounds.y + 100);
        const after = await device.locator('.control-handle').boundingBox();
        assert(after.x > before.x, 'Touch/pointer input moves the badge sprite');
        await page.mouse.up();
        assert.equal(await page.evaluate(() => controlStep.value), 0, 'Incomplete drag resets the sprite');
      }
    }
  }
  const tiles = await Promise.all(previews.map(buffer => sharp(buffer).resize(300, 340, { fit: 'contain', background: '#10191b' }).png().toBuffer()));
  await sharp({ create: { width: 1200, height: 1020, channels: 4, background: '#10191b' } })
    .composite(tiles.map((input, index) => ({ input, left: index % 4 * 300, top: Math.floor(index / 4) * 340 })))
    .png().toFile('.local/manual-control-preview.png');

  // 실제 층의 조사 경로도 이미지 UI로 들어와야 한다. 임시 장치만 확인해서 연결 누락을 놓치지 않는다.
  const targets = ['외부 회선 패널', '인터록 제어반', 'UPS', '재실 센서 제어함', '관찰 카메라', '셔터 제어함',
    '승강기 제어반', '이중 잠금 서류함', '방화셔터', '시험 단말', 'UPS 분배기', '퇴실 버튼', '비상 개방 버튼',
    '재현 벤치', '작업등', 'CCTV 모니터 벽', 'CCTV 분배함', '배터리 영사기', '스피드 게이트'];
  const locations = await page.evaluate(targets => targets.map(name => {
    for (const config of floorById.values()) {
      const objects = [...config.props || [], ...config.fixtures || [], ...config.barriers || []];
      if (objects.some(object => object.name === name && (object.control || object.shutterLever))) return { id: config.id, name };
    }
    throw new Error(`조작 대상이 없음: ${name}`);
  }), targets);
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const [index, location] of locations.entries()) {
    const expected = await page.evaluate(({ id, name }) => {
      closeControl(); closeInspection();
      collectedItems.add('b1-cctv-live');
      setDebugSanity(100);
      performFloorChange(id, 0, floorById.get(id).interior ? 'exit' : null);
      const door = currentDoors.find(door => door.name === name);
      for (const item of [].concat(door.requires || [])) collectedItems.add(item);
      // 앞 장치의 requires로 들어간 결과물(예: B1 승강기 제어반이 요구하는 f2-projected)은 지워서 이 장치를 아직 안 쓴 상태로 연다.
      if (door.gives) collectedItems.delete(door.gives);
      Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      interact(); cameraX = cameraTarget(); render();
      return door.shutterLever ? 'lever' : [].concat(door.control)[0].kind;
    }, location);
    const device = page.locator('#manual-control-device');
    assert(await page.locator('#manual-control').isVisible(), `${location.id}/${location.name}: inspection opens image controls`);
    assert.equal(await page.locator('#manual-control-title').textContent(), location.name);
    assert((await device.getAttribute('class')).includes(`control-${expected}`));
    const images = await device.evaluate(async element => {
      const sources = [...element.children].flatMap(part => [null, '::before'].map(pseudo =>
        getComputedStyle(part, pseudo).backgroundImage.match(/^url\("?(.+?)"?\)$/)?.[1])).filter(Boolean);
      for (const src of sources) { const image = new Image(); image.src = src; await image.decode(); }
      return sources.length;
    });
    assert(images >= (location.name === '배터리 영사기' ? 1 : 2), `${location.name}: generated sprites load in the real game`);
    if (index === 0) await page.screenshot({ path: '.local/manual-control-applied-b2.png' });
    if (location.name === '배터리 영사기' || location.name === '방화셔터') {
      await page.evaluate(() => completeControlStep());
      await page.waitForFunction(kind => controlStep.spec.kind === kind, location.name === '배터리 영사기' ? 'plug' : 'crank');
      const selector = location.name === '배터리 영사기' ? '.control-handle' : '.control-handle::before';
      const src = await device.evaluate((element, selector) => getComputedStyle(element.querySelector('.control-handle'), selector.includes('::') ? '::before' : null).backgroundImage, selector);
      assert(src.includes(location.name === '배터리 영사기' ? '/disc.png' : '/crank.png'), `${location.name}: the second step uses its dedicated sprite`);
    }
  }
  assert.deepEqual(errors, []);
  console.log('PASS: 19 sprite layers; 19 real game objects open image controls; 9 control types, disc/crank stages, selector positions, desktop/mobile bounds and pointer movement.');
} finally {
  await browser.close();
}
