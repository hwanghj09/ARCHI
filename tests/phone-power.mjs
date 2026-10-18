import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, phone, power, keyboard, input, scene] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('js/interaction/phone.js', 'utf8'),
  readFile('js/interaction/power.js', 'utf8'),
  readFile('js/input/keyboard.js', 'utf8'),
  readFile('js/input/input.js', 'utf8'),
  readFile('js/scene/scene-builder.js', 'utf8'),
]);

assert(html.includes('id="phone"') && html.includes('id="phone-battery"') && html.includes('id="phone-light"'));
assert(html.includes('id="power-panel"') && html.includes('id="power-floor-grid"'));
// 조작키는 키 설정(input.js)을 따른다. 기본값은 휴대폰 P, 플래시 F.
assert(keyboard.includes("keyMatches('phone', event.code)") && keyboard.includes("keyMatches('light', event.code)"));
assert(input.includes("phone: ['KeyP']") && input.includes("light: ['KeyF']"));
assert(phone.includes('phoneBattery = Math.max(0') && phone.includes('world.dataset.flashlight'));
assert(power.includes('for (let floor = 17; floor >= 1; floor -= 1)'));
assert(power.includes('solarPoweredFloors.includes(currentSceneFloor)'));
assert(scene.includes("type: 'power'") && scene.includes("name: '태양광 발전기'"));

console.log('phone and rooftop power source tests passed');
