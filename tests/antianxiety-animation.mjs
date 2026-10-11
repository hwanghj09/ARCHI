import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createContext, runInContext, Script } from 'node:vm';
import { inflateSync } from 'node:zlib';

// Decode exported PNGs without adding a runtime/test dependency.
function png(path) {
  const buffer = readFileSync(new URL(`../${path}`, import.meta.url));
  assert.equal(buffer.subarray(1, 4).toString(), 'PNG');
  const width = buffer.readUInt32BE(16), height = buffer.readUInt32BE(20);
  assert.equal(buffer[24], 8); assert.equal(buffer[25], 6, 'RGBA export');
  const data = [];
  for (let p = 8; p < buffer.length;) {
    const size = buffer.readUInt32BE(p), type = buffer.toString('ascii', p + 4, p + 8);
    if (type === 'IDAT') data.push(buffer.subarray(p + 8, p + 8 + size));
    p += size + 12;
  }
  const packed = inflateSync(Buffer.concat(data)), stride = width * 4;
  const pixels = Buffer.alloc(height * stride);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  for (let y = 0; y < height; y++) {
    const filter = packed[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const a = x >= 4 ? pixels[y * stride + x - 4] : 0, b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= 4 ? pixels[(y - 1) * stride + x - 4] : 0;
      const pred = filter === 0 ? 0 : filter === 1 ? a : filter === 2 ? b : filter === 3 ? Math.floor((a + b) / 2) : paeth(a, b, c);
      pixels[y * stride + x] = (packed[y * (stride + 1) + x + 1] + pred) & 255;
    }
  }
  return { width, height, pixels };
}
const icon = png('assets/objects/items/antianxiety-v2.png');
const sheet = png('assets/player/jeong-suho-antianxiety.png');
assert.deepEqual([icon.width, icon.height], [134, 125]);
assert.deepEqual([sheet.width, sheet.height], [1536, 256]);
for (let i = 0; i < 6; i++) {
  let bottom = 0, count = 0;
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    const alpha = sheet.pixels[(y * sheet.width + i * 256 + x) * 4 + 3];
    if (alpha > 128) { bottom = Math.max(bottom, y); count++; }
    if (x === 0 || x === 255 || y === 0 || y === 255) assert.equal(alpha, 0, `frame ${i}: transparent border`);
  }
  assert(count > 3000, `frame ${i}: full character`);
  assert(Math.abs(bottom - 237) <= 1, `frame ${i}: aligned soles at ${bottom}`);
}

const elements = new Map(), listeners = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, dataset: {}, style: {}, hidden: false, naturalWidth: id === 'antianxiety-sheet' ? 1536 : 0, naturalHeight: 256,
    addEventListener() {}, classList: { remove() {}, toggle() {} }, getAttribute() {}, setAttribute() {}, focus() {},
  });
  return elements.get(id);
}
const noop = () => {};
const context = createContext({ console, Element: class {},
  document: { getElementById: element, querySelectorAll: () => [], addEventListener: noop },
  window: { addEventListener: (type, fn) => listeners.set(type, fn) },
  sprite: element('player'), world: element('world'), body: { position: { x: 400, y: 489 }, velocity: { x: 0, y: 0 } },
  Body: { setVelocity: (body, v) => { body.velocity = v; } },
  engine: { pairs: { list: [] } }, Engine: { update: (engine, elapsed) => { context.body.position.x += context.body.velocity.x; } },
  hint: element('hint'), status: element('status'), statusTimer: null, setTimeout: () => 0, clearTimeout: noop,
  guardPatrol: { captureTime: 0 }, cameraX: 0, cameraZoom: 1, viewWidth: 1280,
  refreshSanity: noop, refreshPhone: () => runInContext("world.dataset.flashlight = phoneLightOn && itemUseTime <= 0 ? 'on' : 'off'", context),
  showStatus: message => { context.status.textContent = message; }, playGameSound: noop,
  updateGameAudio: noop, updatePhoneCharging: noop, updateSanity: noop, updatePhone: noop,
  updateGuardPatrol: noop, updateElevators: noop, updateInteraction: noop, updateCall: noop, checkStoryScenes: noop,
  updateTimedBarriers: noop, updateCameras: noop, cameraTarget: () => 0,
  sanitySpeedFactor: () => 1,
  pushPushables: (direction, amount) => amount,
  closeInspection: () => runInContext('usingInspection = false', context),
});
context.engine.pairs.list.push({ isActive: true, bodyA: context.body, bodyB: {}, collision: { normal: { y: -1 } } });
const load = path => runInContext(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), context, { filename: path });
const evaluate = source => runInContext(source, context);
for (const path of ['js/core/config.js', 'js/core/state.js', 'js/player/player.js', 'js/input/input.js', 'js/input/keyboard.js', 'js/interaction/inventory.js', 'js/core/loop.js']) load(path);
evaluate("mainMenuActive = openingActive = false; usingInspection = true; grounded = true; sanity = 40; collectedItems.add('f16-antianxiety')");
evaluate("useInventoryItem('f16-antianxiety')");
assert.equal(evaluate('sanity'), 90);
assert.equal(evaluate('usingInspection'), false);
assert.equal(evaluate("ownedInventoryIds().includes('f16-antianxiety')"), false);
assert.equal(element('player').dataset.state, 'consume');
assert.equal(evaluate('itemUseTime'), 1500);
evaluate("useInventoryItem('f16-antianxiety')");
assert.equal(evaluate('sanity'), 90, 'Repeated use never restores twice');
const key = { code: 'ArrowRight', preventDefault: noop, target: { id: 'stage' }, repeat: false };
listeners.get('keydown')(key);
assert.equal(evaluate('keys.size'), 0, 'Keyboard input blocked');
evaluate("keys.add('ArrowRight'); jumpQueued = true; update()");
assert.equal(context.body.position.x, 400, 'Held input cannot move the player');
assert.equal(context.body.velocity.y, 0, 'Queued jumps blocked');
evaluate('keys.clear(); itemUseTime = itemUseDuration');
const frames = new Set([0]);
for (let i = 0; i < 90; i++) { evaluate('animate(0, false, step)'); frames.add(Number(element('player').dataset.frame)); }
assert.deepEqual([...frames].sort(), [0, 1, 2, 3, 4, 5], 'All six poses are reached');
evaluate('animate(0, false, step)');
assert.equal(element('player').dataset.state, 'idle');
assert.equal(evaluate('itemUseTime'), 0);
listeners.get('keydown')(key);
assert.equal(evaluate("keys.has('ArrowRight')"), true, 'Keyboard input resumes');
evaluate("keys.clear(); collectedItems.delete('f16-antianxiety-used'); sanity = 80; useInventoryItem('f16-antianxiety')");
assert.equal(evaluate('sanity'), 100, 'Restore caps at 100');
evaluate('playerCaught = true; animate(0)');
assert.equal(evaluate('itemUseTime'), 0, 'Capture interrupts use');
assert.equal(element('player').dataset.state, 'caught');
evaluate("playerCaught = false; phoneLightOn = true; collectedItems.delete('f16-antianxiety-used'); startItemUseAnimation(); animate(0, false, 1500)");
assert.equal(element('world').dataset.flashlight, 'on', 'Flashlight restores');
element('antianxiety-sheet').naturalWidth = 0;
evaluate("collectedItems.delete('f16-antianxiety-used'); sanity = 40; useInventoryItem('f16-antianxiety')");
assert.equal(evaluate('sanity'), 40, 'Missing/unloaded art does not consume the item');
assert.equal(evaluate("collectedItems.has('f16-antianxiety-used')"), false);

for (const path of readdirSync(new URL('../js/', import.meta.url), { recursive: true }).filter(path => path.endsWith('.js'))) {
  new Script(readFileSync(new URL(`../js/${path}`, import.meta.url), 'utf8'), { filename: path });
}
console.log('antianxiety-animation: PNG dimensions/alpha/anchors, use/restore, all poses, input lock/resume, duplicate use, capture, flashlight and missing asset checks passed');
