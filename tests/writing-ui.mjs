import assert from 'node:assert/strict';
import { mkdir, readFile, stat } from 'node:fs/promises';
import { chromium } from 'playwright';

const [html, css, writing, inspection, interaction, builder] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('writing.css', 'utf8'),
  readFile('js/interaction/writing.js', 'utf8'),
  readFile('js/interaction/inspection.js', 'utf8'),
  readFile('js/interaction/interaction.js', 'utf8'),
  readFile('js/scene/scene-builder.js', 'utf8'),
]);
assert(html.includes('href="writing.css"') && html.includes('js/interaction/writing.js') && html.includes('id="inspection-sheet"'));
assert(html.indexOf('js/interaction/writing.js') < html.indexOf('js/scene/scene-builder.js'), 'writing.js loads before scenes are built');
assert(css.includes("url('assets/vendor/fonts/archi-hand.woff2')") && css.includes("url('assets/ui/notebook/notebook-open-blank.png')"));
assert((await stat('assets/vendor/fonts/archi-hand.woff2')).size < 700_000, 'handwriting font stays subset');
await stat('assets/vendor/fonts/ARCHI-HAND-OFL.txt');
assert(writing.includes('WRITING_SURFACE_BY_FILE') && inspection.includes('renderWritingSheet'));
assert(interaction.includes('writingSheetFor(nearbyDoor, inspectionMessage)'), 'the shown message picks its surface');
assert(builder.includes('writing: prop.writing'));

const WRITING_SURFACES = {
  whiteboard: [], notebook: [], corkboard: [], chalkboard: [], card: [], receipt: [],
  memo: ['sticky', 'sticky-pink', 'sticky-blue', 'sticky-green', 'slip'],
  document: ['sheet', 'notice', 'sign', 'poster', 'certificate', 'plaque'],
  screen: ['monitor', 'terminal', 'lcd'],
  label: ['tape', 'sticker', 'warning', 'plate', 'tag'],
};
// Message tokens with digits or Latin letters (times, %, IDs, SYSTEM, ARCHI ...) must survive on the surface.
const parityTokens = message => [...new Set(message.match(/[A-Za-z][A-Za-z_]*(?:-\d+)?|\d+(?:[.:,]\d+)*%?/g) || [])];
function sheetText(item) {
  const parts = [item.caption || ''];
  for (const entry of item.writing || []) {
    if (typeof entry === 'string') { parts.push(entry); continue; }
    parts.push(entry.text || '', entry.title || '', entry.hand || '', entry.label || '');
    for (const row of entry.rows || []) for (const cell of row) parts.push(typeof cell === 'string' ? cell : `${cell.text || ''}${cell.sticker || ''}`);
  }
  return parts.join('').replace(/\s+/g, '');
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  assert(await page.evaluate(async () => { await document.fonts.load("24px 'ARCHI Hand'"); return document.fonts.check("24px 'ARCHI Hand'"); }),
    'ARCHI Hand font loads from file://');
  const items = await page.evaluate(() => {
    const found = [];
    for (const [sceneId, config] of floorById) {
      for (const key of ['props', 'solids', 'fixtures', 'barriers', 'rooms']) {
        for (const item of config[key] || []) {
          const surface = item.surface || WRITING_SURFACE_BY_FILE[item.file];
          if (item.message && (item.writing || item.image || surface)) {
            found.push({ sceneId, kind: key, name: item.name, message: item.message, surface, look: item.look, writing: item.writing,
              caption: item.caption, image: item.image, file: item.file });
          }
          // 챙긴 뒤(takenSheet)·조건이 모자랄 때(missingSheet)의 표면도 같은 규칙을 지킨다.
          for (const [state, message] of [['takenSheet', item.takenMessage], ['missingSheet', item.missingMessage]]) {
            if (item[state]) found.push({ sceneId, kind: state, name: item.name, message, ...item[state] });
          }
        }
      }
      if (config.exitLock?.writing) found.push({ sceneId, kind: 'exitLock', name: '복도', ...config.exitLock });
    }
    return found;
  });
  const counts = {};
  for (const item of items) {
    assert(item.writing?.length || item.image, `${item.sceneId} ${item.name}: a ${item.surface} prop needs writing`);
    assert(Object.keys(WRITING_SURFACES).includes(item.surface), `${item.name}: unknown surface ${item.surface}`);
    if (item.look) assert(WRITING_SURFACES[item.surface].includes(item.look), `${item.name}: ${item.surface} has no look ${item.look}`);
    const text = sheetText(item);
    const missing = parityTokens(item.message).filter(token => !text.includes(token));
    assert.deepEqual(missing, [], `${item.sceneId} ${item.name}: message details missing on the surface`);
    counts[item.surface] = (counts[item.surface] || 0) + 1;
  }
  assert(counts.whiteboard >= 23 && counts.notebook >= 7 && counts.corkboard >= 2 && counts.chalkboard >= 1, JSON.stringify(counts));
  assert(counts.document >= 40 && counts.screen >= 15 && counts.memo >= 10 && counts.label >= 15 && counts.receipt >= 1 && counts.card >= 1,
    JSON.stringify(counts));
  // 완성 그림(image)은 실제 파일이어야 한다. 없는 그림을 켜면 조사창에 깨진 그림이 뜬다.
  for (const item of items.filter(entry => entry.image)) await stat(item.image);

  const views = [['desktop', 1280, 720], ['mobile', 390, 844], ['landscape', 844, 390]];
  for (const [view, width, height] of views) {
    await page.setViewportSize({ width, height });
    for (const item of items) {
      const layout = await page.evaluate(([entry]) => {
        closeInspection();
        openInspection(entry.name, entry.message, entry);
        const panel = document.getElementById('inspection').getBoundingClientRect();
        const controls = document.querySelector('nav').getBoundingClientRect();
        const sheet = document.getElementById('inspection-sheet');
        const pages = document.querySelector('.writing-pages');
        const spread = pages && getComputedStyle(pages).position === 'absolute' && getComputedStyle(pages).columnCount === '2';
        const board = document.querySelector('.writing-board')?.getBoundingClientRect();
        return {
          fits: panel.top >= 0 && panel.left >= 0 && panel.right <= innerWidth && panel.bottom <= controls.top + 0.5,
          scrolls: sheet.scrollHeight > sheet.clientHeight + 1,
          overflow: Boolean(spread && (pages.scrollWidth > pages.clientWidth + 1 || pages.scrollHeight > pages.clientHeight + 1)),
          outside: board ? [...document.querySelectorAll('.writing-item')].filter(node => {
            const box = node.getBoundingClientRect();
            return box.left < board.left - 2 || box.right > board.right + 2;
          }).length : 0,
          surface: document.getElementById('inspection').dataset.surface,
        };
      }, [item]);
      const label = `${view} ${item.sceneId} ${item.name}`;
      assert.equal(layout.surface, item.surface, label);
      assert(layout.fits, `${label}: stays above the controls`);
      assert(!layout.overflow, `${label}: notebook text fits on its two pages`);
      assert.equal(layout.outside, 0, `${label}: writing stays on the board`);
      if (view === 'desktop') assert(!layout.scrolls, `${label}: fits on screen without scrolling`);
    }
  }

  // 실제 조사: 12층 화이트보드는 화이트보드로 펼치고, 낭독기용 설명은 message 그대로다.
  await page.setViewportSize({ width: 1280, height: 720 });
  const inspectAt = (sceneId, name) => page.evaluate(([id, propName]) => {
    closeInspection();
    performFloorChange(id, 0, 'exit');
    const door = currentDoors.find(entry => entry.name === propName);
    Body.setPosition(body, { x: door.x + door.width / 2, y: (door.standY ?? floorY) - 81 });
    Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
    cameraX = cameraTarget(); render(); interact();
    const panel = document.getElementById('inspection');
    return { surface: panel.dataset.surface || null, label: panel.querySelector('.inspection-label').textContent,
      text: document.getElementById('inspection-text').textContent, sheetHidden: document.getElementById('inspection-sheet').hidden,
      hiddenFromReaders: document.getElementById('inspection-sheet').getAttribute('aria-hidden'),
      lines: [...document.querySelectorAll('#inspection-sheet .writing-item')].map(node => node.textContent) };
  }, [sceneId, name]);
  const board = await inspectAt('f12-dev', '화이트보드');
  assert.equal(board.surface, 'whiteboard');
  assert.equal(board.label, '화이트보드');
  assert(!board.sheetHidden && board.hiddenFromReaders === 'true');
  assert.match(board.text, /주간 성능 평가: 월 4\.2%/);
  assert(board.lines.includes('목표 30%'));
  await mkdir('.local', { recursive: true });
  await page.screenshot({ path: '.local/writing-whiteboard.png' });
  assert(await page.locator('#inspection-close').evaluate(el => document.activeElement === el));
  await page.keyboard.press('Tab');
  assert(await page.locator('#inspection-close').evaluate(el => document.activeElement === el), 'focus stays on close while the surface is shown');
  await page.keyboard.press('Escape');
  assert(await page.locator('#inspection').isHidden());

  // 5층 서가 꼭대기(solid)의 숨긴 노트도 노트로 펼친다.
  const shelf = await inspectAt('f5-library', '서가 꼭대기');
  assert.equal(shelf.surface, 'notebook');
  await page.screenshot({ path: '.local/writing-notebook.png' });

  // 14층 어두운 자료실: 불을 켜기 전에는 읽을 수 없다는 문구만, 켠 뒤에는 노트를 펼친다.
  const dark = await inspectAt('f14-archive', '열람 책상');
  assert.equal(dark.surface, null);
  assert(dark.sheetHidden);
  assert.match(dark.text, /어두워서 읽을 수 없다/);
  await page.evaluate(() => { collectedItems.add('f14-archive-lamp'); });
  const lit = await inspectAt('f14-archive', '열람 책상');
  assert.equal(lit.surface, 'notebook');
  assert.equal(lit.label, '노트');

  // 1층 경비 로봇: 정비 코드를 맞히면 정비 패널의 기록이 조사 창(표면)으로 열린다.
  await page.evaluate(() => {
    closeInspection();
    performFloorChange('f1', 0);
    openKeypad(currentDoors.find(entry => entry.name === '경비 로봇'));
  });
  await page.fill('#keypad-input', '0914');
  await page.press('#keypad-input', 'Enter');
  assert(await page.locator('#keypad').isHidden());
  assert(await page.locator('#inspection').isVisible(), 'The opened maintenance panel shows in the inspection panel');
  assert.match(await page.locator('#inspection-text').textContent(), /차단 대상: 미등록 출입증 1명/);
  assert.equal(await page.locator('#inspection').getAttribute('data-surface'), 'screen');
  await page.keyboard.press('Escape');

  // 8층 결함 재현실: 마지막 단계(재현 벤치)의 출력지는 서류로 펼치고, 중간 단계는 상태 문구다.
  const steps = await page.evaluate(() => {
    closeInspection();
    performFloorChange('f8-repro', 0, 'exit');
    const result = [];
    for (const name of ['시험 단말', '재실 센서 제어함', '관찰 카메라', '재현 벤치']) {
      closeInspection();
      const door = currentDoors.find(entry => entry.name === name);
      Body.setPosition(body, { x: door.x + door.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      interact();
      result.push({ name, panel: !document.getElementById('inspection').hidden, surface: document.getElementById('inspection').dataset.surface || null,
        status: document.getElementById('interaction-status').textContent });
    }
    return result;
  });
  assert.deepEqual(steps.slice(0, 3).map(step => step.panel), [false, false, false], 'Intermediate steps stay in the status line');
  assert.match(steps[2].status, /조건 3\/3/);
  assert.deepEqual([steps[3].panel, steps[3].surface], [true, 'document'], 'The bench prints its record as a document');
  assert.match(await page.locator('#inspection-text').textContent(), /정답률 91%/);
  await page.screenshot({ path: '.local/writing-repro.png' });
  await page.keyboard.press('Escape');

  // 잠긴 방 문에 붙은 글(rooms의 writing)도 표면으로 열린다.
  for (const door of items.filter(item => item.kind === 'rooms')) {
    const shown = await page.evaluate(([sceneId, name]) => {
      closeInspection();
      performFloorChange(sceneId, 0, floorById.get(sceneId).parent ? 'exit' : null);
      const entry = currentDoors.find(candidate => candidate.type === 'room' && candidate.name === name);
      if (!entry?.locked || entry.code) return 'skip';
      Body.setPosition(body, { x: entry.x + entry.width / 2, y: floorY - 81 });
      Body.setVelocity(body, { x: 0, y: 0 }); grounded = true;
      interact();
      return document.getElementById('inspection').dataset.surface || null;
    }, [door.sceneId, door.name]);
    if (shown !== 'skip') assert.equal(shown, door.surface, `${door.sceneId} ${door.name}: locked door notice opens its surface`);
  }

  // 16층 카페 테이블은 조현아 팀장의 사원증을 그림 그대로 보여 준다.
  await page.evaluate(() => { solarPoweredFloor = 16; });
  const table = await inspectAt('f16-cafe', '카페 테이블');
  assert.equal(table.surface, 'card');
  assert.equal(await page.locator('#inspection-sheet .writing-card img').getAttribute('src'), 'assets/objects/id-cards/jo-hyeon-a.png');
  await page.screenshot({ path: '.local/writing-card.png' });

  // B1 CCTV 모니터 벽: 그림(cctv-wall-screen.png)이 없으면 LCD 글자 화면이다. 그림은 같은 조사 경로에서 글자 대신 보이고,
  // 단서 글씨는 caption으로 옮긴다. 그림이 아직 없으면 같은 1536x864 비율의 임시 그림으로 배치를 확인한다.
  const cctvSaved = await page.evaluate(() => {
    const wall = floorById.get('b1-control').fixtures.find(fixture => fixture.name === 'CCTV 모니터 벽');
    return { image: wall.image ?? null, caption: wall.caption };
  });
  const cctvCaption = '한 칸에 이 관제실이 비친다. 화면 속 수호가 모니터를 올려다보고 있다. 구석 글씨: "추적 대상 1 · 정수호". 다른 칸들은 17층부터 수호가 지나온 층을 되감는다. B2 칸만 검다.';
  assert(await readFile('js/floors/floor-b1.js', 'utf8').then(source => source.includes(`caption: '${cctvCaption}'`)), 'floor-b1.js keeps the caption for the artwork');
  if (!cctvSaved.image) {
    const cctv = await inspectAt('b1-control', 'CCTV 모니터 벽');
    assert.equal(cctv.surface, 'screen');
    assert(cctv.lines.includes('추적 대상 1 · 정수호'), 'The LCD writing shows the clue while the artwork is missing');
    assert.equal(await page.locator('#inspection-sheet .writing-art').count(), 0, 'No broken image while the artwork is missing');
    await page.screenshot({ path: '.local/writing-cctv-lcd.png' });
    const placeholder = await page.evaluate(() => {
      const canvas = Object.assign(document.createElement('canvas'), { width: 1536, height: 864 });
      const context = canvas.getContext('2d');
      context.fillStyle = '#1d2a28'; context.fillRect(0, 0, 1536, 864);
      context.fillStyle = '#000'; context.fillRect(1152, 576, 384, 288);
      return canvas.toDataURL();
    });
    await page.evaluate(([src, caption]) => {
      Object.assign(floorById.get('b1-control').fixtures.find(fixture => fixture.name === 'CCTV 모니터 벽'), { image: src, caption });
    }, [placeholder, cctvCaption]);
  }
  for (const [view, width, height] of views) {
    await page.setViewportSize({ width, height });
    await inspectAt('b1-control', 'CCTV 모니터 벽');
    const art = page.locator('#inspection-sheet .writing-art');
    await art.evaluate(image => image.decode());
    assert.equal(await page.locator('#inspection-sheet .writing-screen').count(), 0, `${view}: the artwork replaces the LCD writing`);
    assert.match(await page.locator('#inspection-sheet .writing-caption').textContent(), /구석 글씨: "추적 대상 1 · 정수호"/);
    assert(await art.evaluate(image => {
      const sheet = document.getElementById('inspection-sheet').getBoundingClientRect();
      const panel = document.getElementById('inspection').getBoundingClientRect();
      const controls = document.querySelector('nav').getBoundingClientRect();
      const box = image.getBoundingClientRect();
      return box.width > 0 && box.left >= sheet.left && box.right <= sheet.right + 1 && box.top >= sheet.top - 1 &&
        box.bottom <= sheet.bottom + 1 && panel.bottom <= controls.top + 0.5 && Math.abs(box.width / box.height - 16 / 9) < 0.02;
    }), `${view}: the CCTV artwork fits uncropped above the controls`);
    if (view === 'mobile') await page.screenshot({ path: '.local/writing-cctv-art-mobile.png' });
  }
  await page.evaluate(saved => {
    const wall = floorById.get('b1-control').fixtures.find(fixture => fixture.name === 'CCTV 모니터 벽');
    if (saved.image) wall.image = saved.image;
    else delete wall.image;
    wall.caption = saved.caption;
  }, cctvSaved);
  await page.setViewportSize({ width: 1280, height: 720 });

  // 글이 없는 일반 소품은 다시 하단 대화창으로 돌아온다.
  const plain = await inspectAt('f16-restroom', '휴지통');
  assert.equal(plain.surface, null);
  assert(plain.sheetHidden);
  assert.equal(plain.label, '조사');
  await page.keyboard.press('Tab');
  assert(await page.locator('#inspection-text').evaluate(el => document.activeElement === el));

  // 길어진 표면은 Page Down으로 넘겨 본다.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    closeInspection();
    openInspection('긴 화이트보드', '줄이 많은 화이트보드.', { surface: 'whiteboard', writing: Array.from({ length: 24 }, (_, index) => `줄 ${index + 1}`) });
    document.getElementById('inspection-close').focus();
  });
  await page.keyboard.press('PageDown');
  assert(await page.locator('#inspection-sheet').evaluate(el => el.scrollTop > 0));
  assert(await page.locator('#inspection').isVisible(), 'Page Down scrolls instead of closing');
  await page.screenshot({ path: '.local/writing-landscape.png' });
  // 텍스트만, 완성 그림만, 글 사이의 그림을 같은 조사 UI에서 지원한다.
  for (const [, width, height] of views) {
    await page.setViewportSize({ width, height });
    for (const surface of ['whiteboard', 'notebook']) {
      for (const imageOnly of [true, false]) {
        await page.evaluate(({ surface, imageOnly }) => {
          closeInspection();
          openInspection('이미지 단서', '옥상 열쇠에 관한 기록이다.', {
            surface,
            ...(imageOnly ? { image: 'assets/ui/notebook/notebook-open-blank.png' } : {
              writing: ['옥상 열쇠', { as: 'image', src: 'assets/ui/rooftop-key.png', alt: '낡은 황동 열쇠' }, '소화전 안에서 찾았다.'],
            }),
          });
        }, { surface, imageOnly });
        const image = page.locator(imageOnly ? '.writing-art' : '.writing-image');
        await image.evaluate(image => image.decode());
        assert(await image.isVisible());
        assert.equal(await page.locator('#inspection').getAttribute('data-surface'), surface);
        assert.equal(await page.locator('#inspection-description').textContent(), '옥상 열쇠에 관한 기록이다.');
        assert(await image.evaluate(image => {
          const panel = document.getElementById('inspection-sheet').getBoundingClientRect();
          const rect = image.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.left >= panel.left && rect.right <= panel.right + 1;
        }), `${surface} image fits at ${width}x${height}`);
        if (!imageOnly) {
          assert.match(await page.locator('#inspection-sheet').textContent(), /소화전 안에서 찾았다/);
          assert(await page.locator('.writing-pages').evaluateAll(pages => pages.every(page =>
            getComputedStyle(page).overflowY === 'auto' || page.scrollWidth <= page.clientWidth + 1)), 'Notebook does not clip image columns');
        }
      }
    }
  }
  // 실제 소품 데이터의 image가 장면 생성과 E 조사 경로를 통과하는지도 확인한다.
  await page.evaluate(() => {
    const board = floorById.get('f12-dev').props.find(prop => prop.name === '화이트보드');
    board.image = 'assets/ui/notebook/notebook-open-blank.png';
  });
  await inspectAt('f12-dev', '화이트보드');
  assert.equal(await page.locator('.writing-art').getAttribute('src'), 'assets/ui/notebook/notebook-open-blank.png');
  assert.equal(await page.locator('.writing-board').count(), 0, 'Finished artwork takes precedence over text rendering');
  await page.evaluate(() => { delete floorById.get('f12-dev').props.find(prop => prop.name === '화이트보드').image; });
  assert.deepEqual(errors, []);
  console.log(`PASS: ${items.length} writing surfaces (${Object.entries(counts).map(([key, value]) => `${key} ${value}`).join(', ')}) keep message details, fit desktop/mobile/landscape, open from real inspection (dark room waits for the lamp), and normal inspection keeps the dialogue box.`);
} finally {
  await browser.close();
}
