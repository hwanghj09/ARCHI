import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
const context = createContext({});
runInContext(readFileSync('js/core/brands.js', 'utf8'), context);
const run = code => runInContext(code, context);
assert.equal(run("brandText('CU / VU 편의점 · 신라면 · 진라면 · TmaxSoft · TmaxTibero · Tibero')"),
  'VU / VU 편의점 · 인라면 · 인라면 · ARCHI Soft · ARCHI Data · ARCHI DB');
run("Object.assign(BRAND_NAMES, { store: '마음상점', ramen: '$&라면', softwareCompany: '내 회사', databaseCompany: '새 DB사', databaseProduct: '새 DB' })");
assert.equal(run("brandText('VU가 · CU에 · 인라면 박스 · TmaxSoft · TmaxTibero · Tibero')"),
  '마음상점가 · 마음상점에 · $&라면 박스 · 내 회사 · 새 DB사 · 새 DB');
run("var floor = { id: 'f16-cu', unlockedBy: 'f16-cu', image: 'assets/cu-shutter-states.png', name: 'VU 편의점', children: [{ name: '인라면 박스' }] }; floor.shared = floor.children; floor.loop = floor; applyBrandNames(floor)");
assert.equal(run('floor.name'), '마음상점 편의점');
assert.equal(run('floor.children[0].name'), '$&라면 박스');
assert.equal(run('floor.id'), 'f16-cu');
assert.equal(run('floor.unlockedBy'), 'f16-cu');
assert.equal(run('floor.image'), 'assets/cu-shutter-states.png');
// Render names as text, including markup-like custom names.
run(`var nodes = []; var document = { createElement: tag => ({ tag, style: {}, children: [], setAttribute() {}, append(...children) { this.children.push(...children); } }) }; var Image = function() {}; var parent = { append(node) { nodes.push(node); } }; BRAND_NAMES.store = '<상점>'; BRAND_NAMES.ramen = '<라면>'; addBrandSign(parent, {x:1,y:2,width:150,height:40}); addCartonBrand(parent);`);
assert.equal(run('nodes[0].children[1].textContent'), '<상점>');
assert.equal(run('nodes[2].textContent'), '<라면>');
assert.equal(run('nodes[3].textContent'), '<라면>');
console.log('Brand configuration: custom names, literal text, shared/cyclic data and stable save IDs passed.');

const { chromium } = await import('playwright');
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install();
  await page.goto(new URL('../index.html', import.meta.url).href);
  await page.locator('#menu-start').click();
  if (await page.locator('#menu-new-confirm').isVisible()) await page.locator('#menu-new-confirm').click();
  await page.locator('#opening-skip').click();
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.evaluate(() => {
    sanity = 100; performFloorChange('f16-cu', null, 'exit');
    Body.setPosition(body, { x: 590, y: floorY - 81 });
    cameraX = cameraTarget(); render();
  });
  const box = page.locator('.ramen-box');
  assert.deepEqual(await box.evaluate(el => [el.style.width, el.style.height, el.getAttribute('aria-label')]), ['186px', '117px', '인라면 박스']);
  assert.equal(await box.locator('.carton-label').count(), 2);
  assert.match(await box.locator('.carton-label-front').textContent(), /^인라면IN RAMEN$/);
  assert(await box.locator('.carton-art').evaluate(async img => { await img.decode(); return img.naturalWidth === 568 && img.naturalHeight === 357; }));
  assert.equal(await page.locator('#dynamic-scene > .brand-sign span').textContent(), 'VU');
  assert.equal(await page.locator('.room-door.shutter .brand-sign span').textContent(), 'VU');
  const strings = await page.evaluate(() => JSON.stringify([...floorById.values()], (key, value) => typeof value === 'function' ? undefined : value));
  assert(!/TmaxSoft|TmaxTibero|TMAXSOFT|\bTibero\b|\bCU\b|진라면|신라면/.test(strings));
  await page.screenshot({ path: 'docs/previews/floor16-fictional-brands.png' });
  assert.deepEqual(errors, []);
  console.log('Browser: store/carton labels, dimensions, asset loading and fictional floor text passed.');
} finally { await browser.close(); }
