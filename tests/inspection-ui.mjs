import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, inspection, interaction, helpers] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('js/interaction/inspection.js', 'utf8'),
  readFile('js/interaction/interaction.js', 'utf8'),
  readFile('js/floors/helpers.js', 'utf8'),
]);

assert(html.includes('id="inspection"') && html.includes('id="inspection-title"') && html.includes('id="inspection-text"'));
assert(html.includes('inspection.js'));
assert(inspection.includes("return 'note'") && inspection.includes("return 'paper'"));
assert(interaction.includes('openInspection(nearbyDoor.name, inspectionMessage)'));
for (const name of ['위생용품 수납장', '휴지통', '미끄럼 주의 표지', '세면대 거울', '화장실 칸', '비상 호출 버튼']) {
  assert(helpers.includes(name), `restroom should expose ${name}`);
}

console.log('inspection UI and restroom interaction source tests passed');
