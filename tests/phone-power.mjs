import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, phone, power, keyboard, scene] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('js/interaction/phone.js', 'utf8'),
  readFile('js/interaction/power.js', 'utf8'),
  readFile('js/input/keyboard.js', 'utf8'),
  readFile('js/scene/scene-builder.js', 'utf8'),
]);

assert(html.includes('id="phone"') && html.includes('id="phone-battery"') && html.includes('id="phone-light"'));
assert(html.includes('id="power-panel"') && html.includes('id="power-floor-grid"'));
assert(keyboard.includes("event.code === 'KeyP'") && keyboard.includes("event.code === 'KeyF'"));
assert(phone.includes('phoneBattery = Math.max(0') && phone.includes('world.dataset.flashlight'));
assert(power.includes('for (let floor = 17; floor >= 1; floor -= 1)'));
assert(power.includes('currentSceneFloor === solarPoweredFloor'));
assert(scene.includes("type: 'power'") && scene.includes("name: '태양광 발전기'"));

console.log('phone and rooftop power source tests passed');
