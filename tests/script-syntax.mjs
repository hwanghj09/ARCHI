// index.html이 불러오는 스크립트를 브라우저처럼 일반 스크립트로 파싱한다.
// 한 파일이라도 문법 오류(예: 닫는 중괄호 누락)가 있거나 파일이 없으면 그 파일 전체가 실행되지 않아
// 새 게임·컷씬이 멈추므로, 커밋 전(.githooks/pre-commit)과 npm test에서 여기서 막는다.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = readFileSync(`${root}index.html`, 'utf8');
const sources = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1]);
let failures = 0;
for (const src of sources) {
  const file = `${root}${src}`;
  if (!existsSync(file)) {
    console.error(`MISSING ${src} (index.html이 불러오지만 파일이 없음)`);
    failures++;
    continue;
  }
  try {
    new Script(readFileSync(file, 'utf8'), { filename: src });
  } catch (error) {
    console.error(`SYNTAX ${src}\n${error.stack.split('\n').slice(0, 5).join('\n')}`);
    failures++;
  }
}
if (!sources.length) { console.error('index.html에서 스크립트를 찾지 못함'); failures++; }
console.log(`${sources.length - failures}/${sources.length} scripts parsed.`);
process.exitCode = failures ? 1 : 0;
