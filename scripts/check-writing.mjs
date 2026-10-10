// 조사 UI 표면(writing) 점검: node scripts/check-writing.mjs <floor> [name] [--list]
// floor: 1..17, -1 (B1), -2 (B2). 그 층(복도와 방)의 writing이 있는 조사 대상을 데스크톱 1280x720, 모바일 390x844,
// 가로 844x390에서 펼쳐 배치 수치와 message에서 빠진 글자를 출력하고, 창 스크린숏을 .local/writing-check/<floor>/에 남긴다.
// --list: writing이 아직 없는 조사 대상(대화창으로 보이는 것)도 함께 나열한다. tests/writing-ui.mjs가 같은 규칙을 검사한다.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const listAll = args.includes('--list');
const [floorArg, onlyName] = args.filter(arg => arg !== '--list');
const floor = Number(floorArg);
if (!Number.isFinite(floor)) throw new Error('usage: node scripts/check-writing.mjs <floor> [name] [--list]');
const outDir = new URL(`../.local/writing-check/${floor}/`, import.meta.url);
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(new URL('../index.html', import.meta.url).href);
await page.locator('#menu-start').click();
if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
await page.locator('#opening-skip').click();
await page.evaluate(() => document.fonts.load("20px 'ARCHI Hand'"));
const { items, plain } = await page.evaluate(([floorNumber, name]) => {
  const found = [];
  const rest = [];
  for (const [sceneId, config] of floorById) {
    if (config.floor !== floorNumber) continue;
    for (const key of ['props', 'solids', 'fixtures', 'barriers', 'rooms']) {
      for (const item of config[key] || []) {
        if (!item.message || (name && item.name !== name)) continue;
        const surface = item.surface || WRITING_SURFACE_BY_FILE[item.file];
        const entry = { sceneId, kind: key, name: item.name, message: item.message, surface, look: item.look,
          writing: item.writing || null, caption: item.caption || null, image: item.image || null };
        (item.writing || item.image || surface ? found : rest).push(entry);
        for (const [state, message] of [['takenSheet', item.takenMessage], ['missingSheet', item.missingMessage]]) {
          if (item[state]) found.push({ sceneId, kind: state, name: `${item.name} (${state})`, message, ...item[state] });
        }
      }
    }
    if (config.exitLock?.message && (!name || name === '복도')) {
      (config.exitLock.writing ? found : rest).push({ sceneId, kind: 'exitLock', name: '복도', ...config.exitLock });
    }
  }
  return { items: found, plain: rest };
}, [floor, onlyName]);

function sheetText(item) {
  const parts = [item.caption || ''];
  for (const entry of item.writing || []) {
    if (typeof entry === 'string') { parts.push(entry); continue; }
    for (const key of ['text', 'title', 'hand', 'label']) if (entry[key]) parts.push(entry[key]);
    for (const row of entry.rows || []) for (const cell of row) {
      if (typeof cell === 'string') parts.push(cell);
      else parts.push(cell.text || '', cell.sticker || '');
    }
  }
  return parts.join('\n');
}
const squash = text => text.replace(/\s+/g, '');
const parityTokens = message => [...new Set(message.match(/[A-Za-z][A-Za-z_]*(?:-\d+)?|\d+(?:[.:,]\d+)*%?/g) || [])];
const hangulWords = message => [...new Set(message.replace(/["'“”‘’().,:!?·…]/g, ' ').split(/\s+/).filter(word => /[가-힣]{2,}/.test(word)))];

const views = [['desktop', 1280, 720], ['mobile', 390, 844], ['landscape', 844, 390]];
let problems = 0;
for (const item of items) {
  const report = { scene: item.sceneId, name: item.name, surface: item.surface, look: item.look };
  if (!item.writing && !item.image) { report.problem = 'no writing yet'; problems += 1; console.log(JSON.stringify(report)); continue; }
  const joined = squash(sheetText(item));
  report.missingTokens = parityTokens(item.message).filter(token => !joined.includes(token));
  const words = hangulWords(item.message);
  const absent = words.filter(word => !joined.includes(squash(word)));
  report.koreanWordCoverage = `${words.length - absent.length}/${words.length}`;
  report.wordsNotOnSheet = absent;
  report.views = {};
  for (const [view, width, height] of views) {
    await page.setViewportSize({ width, height });
    await page.evaluate(([name, message, sheet]) => { closeInspection(); openInspection(name, message, sheet); }, [item.name, item.message, item]);
    await page.waitForTimeout(260);
    const metrics = await page.evaluate(() => {
      const panel = document.getElementById('inspection').getBoundingClientRect();
      const nav = document.querySelector('nav').getBoundingClientRect();
      const sheet = document.getElementById('inspection-sheet');
      const pages = document.querySelector('.writing-pages');
      const spread = pages && getComputedStyle(pages).columnCount === '2' && getComputedStyle(pages).position === 'absolute';
      const frames = [...document.querySelectorAll('.writing-board, .writing-screen-glass, .writing-document, .writing-memo, .writing-receipt, .writing-label')];
      const outside = frames.reduce((count, frame) => {
        const box = frame.getBoundingClientRect();
        return count + [...frame.querySelectorAll(':scope > .writing-item, :scope > * > .writing-item')].filter(node => {
          const rect = node.getBoundingClientRect();
          return !node.matches('.writing-note, .writing-paper') && (rect.left < box.left - 2 || rect.right > box.right + 2);
        }).length;
      }, 0);
      return {
        surface: document.getElementById('inspection').dataset.surface || null,
        fitsAboveControls: panel.top >= 0 && panel.bottom <= nav.top + 0.5 && panel.left >= 0 && panel.right <= innerWidth,
        sheetScrolls: sheet.scrollHeight > sheet.clientHeight + 1,
        notebookOverflow: pages ? (spread ? pages.scrollWidth > pages.clientWidth + 1 || pages.scrollHeight > pages.clientHeight + 1 : false) : null,
        notebookPageScrolls: pages && !spread ? pages.scrollHeight > pages.clientHeight + 1 : null,
        itemsOutsideFrame: outside,
      };
    });
    metrics.screenshot = fileURLToPath(new URL(`./${item.sceneId}-${item.name.replace(/[\\/:*?"<>| ]/g, '_')}-${view}.png`, outDir));
    await page.locator('#inspection').screenshot({ path: metrics.screenshot });
    report.views[view] = metrics;
    if (!metrics.surface || !metrics.fitsAboveControls || metrics.notebookOverflow || metrics.itemsOutsideFrame ||
        (view === 'desktop' && metrics.sheetScrolls)) problems += 1;
  }
  if (report.missingTokens.length) problems += 1;
  console.log(JSON.stringify(report, null, 1));
}
if (listAll) for (const item of plain) console.log(JSON.stringify({ dialogue: `${item.sceneId} ${item.kind} ${item.name}`, message: item.message }));
console.log(JSON.stringify({ floor, items: items.length, dialogueOnly: plain.length, problems, pageErrors: errors }));
await browser.close();
