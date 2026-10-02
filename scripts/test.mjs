import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const helpers = new Set(['room-geometry.mjs', 'scene-transition.mjs']);
const tests = readdirSync(new URL('../tests/', import.meta.url)).filter(name => name.endsWith('.mjs') && !helpers.has(name)).sort();
let failures = 0;
for (const test of tests) {
  console.log(`RUN ${test}`);
  const result = spawnSync(process.execPath, [`tests/${test}`], {
    cwd: root, stdio: 'inherit', timeout: test === 'elevator.mjs' ? 3_600_000 : 300_000,
  });
  const passed = result.status === 0;
  console.log(`${passed ? 'PASS' : 'FAIL'} ${test}`);
  if (!passed) {
    failures++;
    if (result.error) console.error(result.error.message);
  }
}
console.log(`${tests.length - failures}/${tests.length} test files passed.`);
process.exitCode = failures ? 1 : 0;
