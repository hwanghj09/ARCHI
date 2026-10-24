// 12층 모델 평가실 "야간 로그 단말기"(PC)와 "네트워크 랙": 필수 스토리 퍼즐 두 개.
// PC를 켜면 리눅스 터미널이 뜬다. 야간 평가 기록과 출입 기록은 파일로 들어 있고 ls·cd·cat·find·grep으로 찾는다.
// 퍼즐 1: PC를 열면 잠시 뒤 ARCHI가 야간 평가 로그 파일을 하나씩 지운다. 네트워크 랙의 B2 직결 LAN 케이블을 직접 끌어 뽑아야
//   멈춘다(f12-network-isolated). 10/07 파일이 남아 있을 때 뽑으면 'in-time', 지워진 뒤면 'too-late', 다 지워진 뒤면 'erased'.
//   늦었으면 평가 벤치의 종이 백업(f12-paper-backup)을 PC에서 대조해 복원한다(f12-log-restored). 어느 쪽이든 퍼즐 2로 간다.
// 퍼즐 2: 기록을 지킨 뒤 10/07 야간 평가 로그와 숨은 출입 기록 파일(find로 찾는다)을 둘 다 읽으면 풀린다(f12-evaluation-solved).
//   제때 지킨 경우에만 7층 힌트 "03:00~04:00 · B2"(f12-log-hint)를 준다.
// 삭제 진행(logPuzzle.elapsed)은 게임이 돌아가는 동안만 쌓이고 자동 저장에 남는다(save.js). 창을 다시 열어도 처음부터 지우지 않는다.
const LOG_PUZZLE_ROWS = [
  { date: '09/28', day: '3.9%', night: '87.1%', access: '22:00 이후 입실 기록 없음' },
  { date: '09/30', day: '4.4%', night: '88.5%', access: '22:00 이후 입실 기록 없음' },
  { date: '10/05', day: '3.6%', night: '89.2%', access: '22:00 이후 입실 기록 없음' },
  { date: '10/07', day: '3.7%', night: '4.2%', access: '조현아 · 23:10 입실 · 05:02 퇴실' },
];
// 위에서부터 지우되 10/07은 세 번째다: 경고 2초 뒤부터 4초마다 한 파일(6·10·14·18초). 랙까지는 걸어서 몇 초면 간다.
// 지워지는 모습을 보기 전에 케이블부터 뽑지 않도록 첫 파일은 금방 지운다.
const LOG_DELETE_ORDER = [0, 1, 3, 2];
const LOG_KEY_ROW = 3;
const LOG_WARNING_DELAY = 2000;
const LOG_DELETE_INTERVAL = 4000;
const LOG_DELETE_END = LOG_WARNING_DELAY + LOG_DELETE_INTERVAL * LOG_DELETE_ORDER.length;
const LOG_HOME = '/home/eval';
const LOG_EVAL_DIR = '/var/log/archi/eval';
const LOG_ACCESS_DIR = '/srv/security/sync/badge'; // 일부러 깊이 숨겼다: README가 find를 쓰라고 알려 준다.
const logEvalPath = row => `${LOG_EVAL_DIR}/night-${row.date.replace('/', '')}.log`;
const logAccessPath = row => `${LOG_ACCESS_DIR}/access-${row.date.replace('/', '')}.log`;
// 이 두 파일을 다 읽으면(cat이나 grep 결과로) 분석이 끝난다.
const LOG_KEY_FILES = [logEvalPath(LOG_PUZZLE_ROWS[LOG_KEY_ROW]), logAccessPath(LOG_PUZZLE_ROWS[LOG_KEY_ROW])];
const LOG_STATIC_FILES = {
  [`${LOG_HOME}/README.txt`]: ['평가실 PC 사용 안내', '- 야간 자동 평가 로그: /var/log/archi/eval/ (날짜별 파일)',
    '- 출입 기록은 보안팀 서버에서 매일 동기화된다. 경로가 또 바뀌어서 어디 있는지 모르겠다...',
    '  파일 이름에 access가 들어갔던 것 같은데.', '— 조현아'],
  '/var/log/syslog': ['eval-pc systemd[1]: Started nightly-eval.service.', 'eval-pc nightly-eval: results -> /var/log/archi/eval',
    'eval-pc badge-sync: synced access logs from security server'],
  ...Object.fromEntries(LOG_PUZZLE_ROWS.map(row => [logAccessPath(row), [`출입 기록  ${row.date}`, row.access]])),
};
// 지워지는 파일을 포함한 모든 경로의 상위 디렉터리. 파일이 다 지워져도 디렉터리는 남는다.
const LOG_DIRS = new Set(['/', '/tmp']);
for (const path of [...Object.keys(LOG_STATIC_FILES), ...LOG_PUZZLE_ROWS.map(logEvalPath)]) {
  const parts = path.split('/');
  for (let i = 2; i < parts.length; i++) LOG_DIRS.add(parts.slice(0, i).join('/'));
}
const PUZZLE_WRONG_SANITY_LOSS = 5;
const LOG_HINT_ITEM = 'f12-log-hint';
const LOG_OUTCOME_LINES = {
  'in-time': ['NETWORK CONNECTION LOST', 'REMOTE DELETION STOPPED'],
  'too-late': ['REMOTE DELETION STOPPED', 'WARNING: RECORDS DAMAGED'],
  erased: ['ALL ONLINE RECORDS DELETED', 'LOCAL PRINTED BACKUP MAY BE AVAILABLE'],
};

const logPanel = document.getElementById('log-panel');
const logFrame = document.getElementById('log-frame');
const logAlert = document.getElementById('log-alert');
const logNetwork = document.getElementById('log-network');
const logStatus = document.getElementById('log-status');
const logRecovery = document.getElementById('log-recovery');
const logMonologue = document.getElementById('log-monologue');
const logTerm = document.getElementById('log-term');
const logTermInput = document.getElementById('log-term-input');
const logTermPrompt = document.getElementById('log-term-prompt');
let logBlocked = [];

const logPuzzle = { started: false, elapsed: 0, outcome: null }; // outcome: null | 'in-time' | 'too-late' | 'erased'
let logTimer = null;
let logTickAt = 0;
let logCwd = LOG_HOME;
const logSeen = new Set(); // 읽은 파일. shortcut: 저장하지 않는다, 불러오면 다시 읽어야 한다.
let logCutsceneTimer = null;

const logDeletedCount = () => Math.max(0, Math.min(LOG_DELETE_ORDER.length,
  Math.floor((logPuzzle.elapsed - LOG_WARNING_DELAY) / LOG_DELETE_INTERVAL)));
const logDeleting = () => logPuzzle.started && !collectedItems.has('f12-network-isolated');
const logRecordsReady = () => collectedItems.has('f12-network-isolated') &&
  (logPuzzle.outcome === 'in-time' || collectedItems.has('f12-log-restored'));

function tickLogDeletion() {
  const now = Date.now();
  // 메뉴·숨긴 탭에서는 멈추고, 한 번에 0.5초 넘게 쌓지 않아 오래 멈췄다 돌아와도 한꺼번에 지워지지 않는다.
  const step = mainMenuActive || document.hidden ? 0 : Math.min(500, now - logTickAt);
  logTickAt = now;
  const before = logDeletedCount();
  const warned = logPuzzle.elapsed >= LOG_WARNING_DELAY;
  logPuzzle.elapsed = Math.min(LOG_DELETE_END, logPuzzle.elapsed + step);
  const after = logDeletedCount();
  for (let index = before; index < after; index++) logPrint('archi', `[SYSTEM] rm ${logEvalPath(LOG_PUZZLE_ROWS[LOG_DELETE_ORDER[index]])}`);
  if (after > before) {
    playGameSound('cctv-static');
    if (!logPanel.hidden) glitchFrame(logFrame);
  }
  if (after >= LOG_DELETE_ORDER.length) stopLogTimer();
  if (!logPanel.hidden && (after > before || warned !== logPuzzle.elapsed >= LOG_WARNING_DELAY)) renderLogPanel();
}

function runLogTimer() {
  if (logTimer || !logDeleting() || logDeletedCount() >= LOG_DELETE_ORDER.length) return;
  logTickAt = Date.now();
  logTimer = setInterval(tickLogDeletion, 200);
}

function stopLogTimer() {
  clearInterval(logTimer);
  logTimer = null;
}

// 네트워크 랙의 LAN 케이블을 다 뽑았을 때(manual-control.js → interact → 여기). 삭제가 진행 중이 아니면 평소 조사로 넘긴다.
function unplugNetworkRack() {
  if (!logDeleting()) return false;
  stopLogTimer();
  const deleted = new Set(LOG_DELETE_ORDER.slice(0, logDeletedCount()));
  logPuzzle.outcome = deleted.size === LOG_PUZZLE_ROWS.length ? 'erased' : deleted.has(LOG_KEY_ROW) ? 'too-late' : 'in-time';
  collectedItems.add('f12-network-isolated');
  logPrint('sys', 'network: eth0 link down · 원격 세션 종료');
  refreshReady();
  playGameSound('switch');
  if (!logPanel.hidden) renderLogPanel();
  saveProgress();
  return true;
}

function glitchFrame(frame) {
  frame.classList.remove('glitching');
  void frame.offsetWidth; // 같은 애니메이션을 다시 걸기 위해 리플로우를 한 번 강제한다.
  frame.classList.add('glitching');
}

// 7층 객관식 퍼즐의 오답: 화면 지직, 오류음, 정신력 -5%. 진행 플래그는 건드리지 않으니 몇 번이든 다시 고를 수 있다.
function punishWrongAnswer(frame, statusElement) {
  playGameSound('deny');
  sanity = Math.max(0, sanity - PUZZLE_WRONG_SANITY_LOSS);
  refreshSanity();
  glitchFrame(frame);
  statusElement.textContent = `아니야... 다시 보자. (정신력 -${PUZZLE_WRONG_SANITY_LOSS}%)`;
}

// 수호의 독백을 한 줄씩 덧붙인다. instant면 바로 다 보인다(이미 푼 퍼즐을 다시 열었을 때).
function showMonologue(element, lines, instant) {
  clearTimeout(element.monologueTimer);
  element.replaceChildren();
  const add = index => {
    const line = document.createElement('p');
    line.textContent = `수호: "${lines[index]}"`;
    element.append(line);
    if (!instant && index + 1 < lines.length) element.monologueTimer = setTimeout(() => add(index + 1), 1600);
  };
  if (instant) lines.forEach((_, index) => add(index)); else add(0);
}

// ---- 터미널 ----
// kind: user(입력) · out(출력) · err(오류) · sys(시스템) · archi(ARCHI의 삭제)
// text: 문자열(\n으로 줄 나눔) 또는 줄 배열(각 줄은 문자열·노드 배열, 클릭할 이름이 섞인 출력).
function logPrint(kind, text) {
  for (const part of typeof text === 'string' ? text.split('\n') : text) {
    const line = document.createElement('li');
    line.className = `log-term-${kind}`;
    line.append(...[part].flat());
    logTerm.append(line);
  }
  while (logTerm.children.length > 150) logTerm.firstElementChild.remove();
  logTerm.scrollTop = logTerm.scrollHeight;
}

// 지금 남아 있는 파일: 경로 → 줄 목록. 지워진 평가 로그는 종이 대조로 복원하면 돌아온다.
function logFiles() {
  const deleted = new Set(LOG_DELETE_ORDER.slice(0, logDeletedCount()));
  const restored = collectedItems.has('f12-log-restored');
  const files = new Map(Object.entries(LOG_STATIC_FILES));
  LOG_PUZZLE_ROWS.forEach((row, index) => {
    if (deleted.has(index) && !restored) return;
    files.set(logEvalPath(row), [...deleted.has(index) ? ['# 종이 기록 대조로 복원됨'] : [],
      `[ARCHI 야간 자동 평가] ${row.date}`, `낮 성능  ${row.day}`, `밤 성능  ${row.night}`]);
  });
  return files;
}

function resolveLogPath(arg) {
  const home = arg === '~' || arg.startsWith('~/');
  const parts = (arg.startsWith('/') ? '' : home ? LOG_HOME : logCwd).split('/').filter(Boolean);
  for (const part of (home ? arg.slice(1) : arg).split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') parts.pop(); else parts.push(part);
  }
  return `/${parts.join('/')}`;
}

// 디렉터리 바로 아래 이름들(디렉터리는 끝에 /).
function logChildren(dir, files) {
  const prefix = dir === '/' ? '/' : `${dir}/`;
  const names = new Set();
  for (const path of [...LOG_DIRS, ...files.keys()]) {
    if (!path.startsWith(prefix) || path === dir) continue;
    const name = path.slice(prefix.length).split('/')[0];
    names.add(LOG_DIRS.has(prefix + name) ? `${name}/` : name);
  }
  return [...names].sort();
}

// 디렉터리 아래(자신 포함) 모든 경로.
const logTree = (dir, files) => [...LOG_DIRS, ...files.keys()]
  .filter(path => path === dir || path.startsWith(dir === '/' ? '/' : `${dir}/`)).sort();

// 찾은 경로를 사용자가 적은 시작 경로 모양 그대로 보여 준다(find . → ./night-1007.log).
const logShown = (arg, start, path) => arg.replace(/\/$/, '') + path.slice(start === '/' ? 0 : start.length);

const logGlob = pattern => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);

// 출력 속 파일·폴더 이름. 누르면 그 명령을 대신 쳐 준다(폴더는 ls, 파일은 cat) — 긴 경로를 칠 필요가 없다.
function logLink(text, path) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'log-term-link';
  button.textContent = text;
  button.addEventListener('click', () => submitLogCommand(`${LOG_DIRS.has(path) ? 'ls' : 'cat'} ${path}`));
  return button;
}

function readLogFile(path, lines) {
  logSeen.add(path);
  return lines;
}

// 사용법만 알려 준다. 무엇을 찾을지는 상태 줄(renderLogPanel)이 단계마다 말로 알려 준다.
const LOG_HELP = ['명령어를 치고 Enter. 파란 이름(파일·폴더)은 클릭하면 열린다.',
  '[보기]',
  '  ls              지금 폴더에 뭐가 있나 (끝에 / 붙은 건 폴더)',
  '  ls /            맨 위 폴더 보기',
  '  ls 폴더         그 폴더 안 보기          예) ls /var',
  '  cat 파일        파일 내용 읽기           예) cat README.txt',
  '[찾기]',
  '  find 단어       이름에 그 단어가 든 파일 찾기 (찾기만 한다 · 열려면 결과 클릭)',
  '  grep 단어       모든 파일에서 그 단어가 든 줄 찾기 (내용이 바로 보인다)',
  '[이동]',
  '  cd 폴더         그 폴더로 이동',
  '  cd .. · cd ~    위 폴더로 · 처음 위치로',
  '  pwd             지금 위치 보기',
  '[기타]',
  '  clear · exit    화면 지우기 · 나가기 (Esc도 된다)',
  '  help · 도움말   이 설명 다시 보기',
  '팁: 이름을 몇 글자 치고 Tab을 누르면 나머지를 채워 준다.',
  '(리눅스식 find / -name "*단어*" · grep -r 단어 폴더 도 된다)'];

function runLogCommand(raw) {
  const text = raw.trim();
  logPrint('user', `${logTermPrompt.textContent} ${text}`);
  if (!text) return;
  const [typed, ...rest] = text.split(/\s+/);
  const verb = typed.toLowerCase(); // Caps Lock으로 친 LS도 받아 준다
  let args = rest.map(arg => arg.replace(/^(['"])(.*)\1$/, '$2'));
  const files = logFiles();
  const isDir = path => LOG_DIRS.has(path);
  if (/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(verb) && verb !== '도움말') return logPrint('err', '한글로 입력됐다. 한/영 키를 눌러 영문으로 입력하자.');
  if (verb === 'help' || verb === '도움말') return logPrint('sys', LOG_HELP.join('\n'));
  if (verb === 'clear') return logTerm.replaceChildren();
  if (verb === 'exit') return closeLogPuzzle();
  if (verb === 'pwd') return logPrint('out', logCwd);
  if (verb === 'cd') {
    const path = resolveLogPath(args[0] ?? '~');
    if (files.has(path)) return logPrint('err', `cd: ${args[0]}: Not a directory`);
    if (!isDir(path)) return logPrint('err', `cd: ${args[0]}: No such file or directory\n→ ls로 지금 위치의 폴더 이름부터 확인하자. (ls / 는 맨 위)`);
    logCwd = path;
    return renderLogPrompt();
  }
  if (verb === 'ls') {
    const targets = args.filter(arg => !arg.startsWith('-'));
    for (const arg of targets.length ? targets : ['.']) {
      const path = resolveLogPath(arg);
      if (files.has(path)) logPrint('out', arg);
      else if (!isDir(path)) logPrint('err', `ls: cannot access '${arg}': No such file or directory\n→ ls / 로 맨 위 폴더부터 한 단계씩 들어가 보자.`);
      else {
        if (targets.length > 1) logPrint('out', `${arg}:`);
        const prefix = path === '/' ? '/' : `${path}/`;
        logPrint('out', [logChildren(path, files).flatMap((name, index) => [...index ? ['  '] : [], logLink(name, prefix + name.replace(/\/$/, ''))])]);
      }
    }
    return;
  }
  if (verb === 'cat') {
    if (!args.length) return logPrint('err', 'cat: 읽을 파일을 적자. 예) cat README.txt');
    for (const arg of args) {
      const path = resolveLogPath(arg);
      if (isDir(path)) logPrint('err', `cat: ${arg}: Is a directory`);
      else if (!files.has(path)) {
        // 같은 이름의 파일이 다른 폴더에 있으면 실제 위치를 알려 준다.
        const elsewhere = [...files.keys()].find(entry => entry.endsWith(`/${arg.split('/').pop()}`));
        logPrint('err', `cat: ${arg}: No such file or directory${elsewhere ? `\n→ 이 파일은 다른 곳에 있다: cat ${elsewhere}` : ''}`);
      }
      else logPrint('out', readLogFile(path, files.get(path)).join('\n'));
    }
    return;
  }
  if (verb === 'find') {
    // 쉬운 꼴: find 단어 → find / -iname "*단어*" (단어가 실제 경로가 아닐 때만)
    const first = args[0];
    if (args.length === 1 && !/^[-/.~]/.test(first) && !isDir(resolveLogPath(first)) && !files.has(resolveLogPath(first))) {
      args = ['/', '-iname', `*${first.replace(/^\*|\*$/g, '')}*`];
    }
    const arg = args[0] && !args[0].startsWith('-') ? args[0] : '.';
    const start = resolveLogPath(arg);
    if (!isDir(start) && !files.has(start)) return logPrint('err', `find: '${arg}': No such file or directory`);
    const nameAt = args.findIndex(item => item === '-name' || item === '-iname');
    if (nameAt >= 0 && !args[nameAt + 1]) return logPrint('err', `find: missing argument to '${args[nameAt]}'`);
    const pattern = nameAt >= 0 ? new RegExp(logGlob(args[nameAt + 1]).source, args[nameAt] === '-iname' ? 'i' : '') : /.*/;
    const typeAt = args.indexOf('-type');
    const type = typeAt >= 0 ? args[typeAt + 1] : null;
    const found = logTree(start, files).filter(path => pattern.test(path.split('/').pop() || '/') &&
      (!type || (type === 'd') === isDir(path)));
    return logPrint('out', found.length ? found.map(path => [logLink(path === start ? arg : logShown(arg, start, path), path)]) :
      '(찾은 파일 없음 · 다른 단어로 찾아보자. 예) find 단어)');
  }
  if (verb === 'grep') {
    let recursive = args.some(arg => /^-\w*r/i.test(arg));
    const ignoreCase = args.some(arg => /^-\w*i/.test(arg));
    const [word, ...targets] = args.filter(arg => !arg.startsWith('-'));
    if (!word) return logPrint('err', 'grep: 찾을 단어를 적자. 예) grep 단어');
    // 쉬운 꼴: grep 단어 → 모든 파일에서 찾는다
    if (!targets.length) { recursive = true; targets.push('/'); }
    const matches = [];
    for (const target of targets) {
      const path = resolveLogPath(target);
      if (isDir(path) && !recursive) { logPrint('err', `grep: ${target}: Is a directory`); continue; }
      if (!isDir(path) && !files.has(path)) { logPrint('err', `grep: ${target}: No such file or directory`); continue; }
      const paths = isDir(path) ? logTree(path, files).filter(entry => files.has(entry)) : [path];
      for (const entry of paths) {
        const lines = files.get(entry).filter(line => ignoreCase ? line.toLowerCase().includes(word.toLowerCase()) : line.includes(word));
        if (lines.length) readLogFile(entry, lines);
        // 파일 하나만 찾을 때는 grep처럼 파일 이름을 붙이지 않는다.
        const label = path === entry ? (targets.length > 1 ? target : '') : logShown(target, path, entry);
        matches.push(...lines.map(line => label ? [logLink(label, entry), `:${line}`] : [line]));
      }
    }
    return logPrint('out', matches.length ? matches : `('${word}'이(가) 들어간 줄 없음)`);
  }
  logPrint('err', `${verb}: command not found · help를 입력하자`);
}

// Tab: 마지막 단어를 셸처럼 경로 자동완성한다. 후보가 여럿이면 공통 앞부분까지 채우고 목록을 보여 준다.
function completeLogInput() {
  const match = /^(.*\s)(\S*)$/.exec(logTermInput.value);
  if (!match) return;
  const [, head, token] = match;
  const slash = token.lastIndexOf('/');
  const dirPart = token.slice(0, slash + 1);
  const files = logFiles();
  const names = logChildren(resolveLogPath(dirPart || '.'), files).filter(name => name.startsWith(token.slice(slash + 1)));
  if (!names.length) return;
  let common = names[0];
  for (const name of names) while (!name.startsWith(common)) common = common.slice(0, -1);
  if (names.length === 1 && !common.endsWith('/')) common += ' ';
  if (dirPart + common === token && names.length > 1) logPrint('out', names.join('  '));
  logTermInput.value = head + dirPart + common;
}

function renderLogPrompt() {
  const where = logCwd === LOG_HOME ? '~' : logCwd.startsWith(`${LOG_HOME}/`) ? `~${logCwd.slice(LOG_HOME.length)}` : logCwd;
  logTermPrompt.textContent = `eval@eval-pc:${where}$`;
}

function checkLogAnalysis() {
  if (collectedItems.has('f12-evaluation-solved') || !logRecordsReady() || !LOG_KEY_FILES.every(path => logSeen.has(path))) return;
  collectedItems.add('f12-evaluation-solved');
  playGameSound('pickup');
  addClue('야간 로그 단말기', 'ARCHI는 사람의 존재를 감지하면 실제 성능을 숨긴다. (10/07 조현아 팀장 23:10~05:02 체류, 그날 밤만 성능 4.2%)');
  logPrint('sys', '[분석] 10/07 밤 성능 4.2% — 다른 밤은 87~89%\n[분석] 10/07 밤 조현아 23:10~05:02 체류 — 그날만 사람이 있었다');
  // 제때 지킨 로그에만 남은 B2 전력 할당 기록 → 7층 퍼즐 1에서 03시 칸을 강조한다(backup-puzzle.js).
  if (logPuzzle.outcome === 'in-time') {
    collectedItems.add(LOG_HINT_ITEM);
    addClue('B2 전력 할당 기록', '03:00~04:00 · B2');
  }
  renderLogPanel();
  saveProgress();
  // 분석을 마치면 결과를 잠깐 보여 준 뒤 단말기를 끄고, 독백은 컷씬(story-scene.js의 story-log-seen)으로 보여 준다.
  logCutsceneTimer = setTimeout(finishLogAnalysis, 1500);
}

function finishLogAnalysis() {
  clearTimeout(logCutsceneTimer);
  logCutsceneTimer = null;
  collectedItems.add('f12-log-cutscene');
  saveProgress();
  closeLogPuzzle();
}

function restoreLogFromPaper() {
  if (logRecordsReady() || !collectedItems.has('f12-paper-backup') || !collectedItems.has('f12-network-isolated')) return;
  collectedItems.add('f12-log-restored');
  playGameSound('pickup');
  logPrint('sys', `restore: 종이 기록과 대조해 ${LOG_EVAL_DIR}/ 파일을 복원했다.`);
  renderLogPanel();
  saveProgress();
  logTermInput.focus();
  checkLogAnalysis();
}

function renderLogPanel() {
  const isolated = collectedItems.has('f12-network-isolated');
  const restored = collectedItems.has('f12-log-restored');
  const solved = collectedItems.has('f12-evaluation-solved');
  const ready = logRecordsReady();
  const warned = logPuzzle.elapsed >= LOG_WARNING_DELAY;
  const allDeleted = logDeletedCount() >= LOG_DELETE_ORDER.length;
  logAlert.hidden = !warned && !isolated;
  logAlert.dataset.outcome = isolated ? logPuzzle.outcome : 'deleting';
  logAlert.textContent = (isolated ? LOG_OUTCOME_LINES[logPuzzle.outcome] :
    allDeleted ? ['ALL ONLINE RECORDS DELETED', 'SOURCE: SYSTEM', 'REMOTE SESSION STILL CONNECTED'] :
      ['WARNING: UNAUTHORIZED LOG MODIFICATION', 'SOURCE: SYSTEM', 'DELETING NIGHT EVALUATION RECORDS...']).join('\n');
  logNetwork.dataset.connected = String(!isolated);
  logNetwork.textContent = `NETWORK · B2 직결 회선: ${isolated ? 'DISCONNECTED' : 'CONNECTED'}`;
  const needsPaper = isolated && !ready;
  logRecovery.hidden = !(needsPaper && collectedItems.has('f12-paper-backup'));
  logStatus.textContent = solved ? '분석 완료.' :
    // 무엇을 찾을지만 말로 알려 준다. 어떻게(명령어)는 모니터 메모와 help 몫이다.
    ready && logSeen.has(LOG_KEY_FILES[0]) ? '10/07 밤만 성능이 뚝 떨어졌다. 그날 밤 이 건물에 누가 있었을까? 출입 기록 파일을 찾아 읽어 보자.' :
    ready ? `${restored ? '종이 기록으로 지워진 파일을 복원했다.' : '로그를 지켰다.'} 날짜별 야간 평가 로그를 비교해서 밤 성능이 유난히 다른 날을 찾자.` :
    needsPaper ? (collectedItems.has('f12-paper-backup') ? '종이 백업이 있다. 남은 로그와 대조해 복원하자.' :
      '온라인 기록이 손상됐다. 이 방 평가 벤치에 출력해 둔 종이 기록이 남아 있을지도 모른다.') :
    allDeleted ? '기록이 전부 지워졌다. 연결이 살아 있으면 무엇을 되살려도 또 지워진다. 네트워크 랙의 LAN 케이블부터 뽑자.' :
    warned ? 'ARCHI가 기록을 지우고 있다! 창을 닫고(Esc) 네트워크 랙의 B2 직결 LAN 케이블을 뽑자.' :
    '야간 평가 기록은 파일로 저장돼 있다. 화면의 README.txt를 눌러 안내문부터 읽어 보자.';

  logMonologue.hidden = true; // 독백은 컷씬으로 옮겼다
  document.getElementById('log-hint-record').hidden = !(solved && logPuzzle.outcome === 'in-time');
}

function openLogPuzzle() {
  if (!logPanel.hidden) return;
  if (!logPuzzle.started) Object.assign(logPuzzle, { started: true, elapsed: 0, outcome: null });
  if (!logTerm.children.length) {
    // 처음엔 어디에 뭐가 있는지 모르니 ls를 한 번 대신 쳐서 보여 준다.
    logPrint('sys', 'eval-pc login: eval (자동 로그인)\n명령어를 치고 Enter · 파란 이름은 클릭하면 열린다 · help — 명령어 설명');
    renderLogPrompt();
    runLogCommand('ls');
  }
  runLogTimer();
  logPanel.hidden = false;
  releaseInput();
  logBlocked = [...document.body.children].filter(element => element !== logPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of logBlocked) element.inert = true;
  renderLogPrompt();
  renderLogPanel();
  logTermInput.focus();
}

function closeLogPuzzle() {
  if (logPanel.hidden) return;
  if (logCutsceneTimer) return finishLogAnalysis(); // 분석 결과를 보다가 닫아도 컷씬은 나온다
  logPanel.hidden = true;
  logFrame.classList.remove('glitching');
  for (const element of logBlocked) element.inert = false;
  logBlocked = [];
  stage.focus();
}

// 불러오기·새 게임(save.js): 진행 중이던 삭제는 남은 지점부터 이어 간다. 이미 뽑았으면 다시 시작하지 않는다.
function restoreLogPuzzle(saved) {
  stopLogTimer();
  clearTimeout(logCutsceneTimer);
  logCutsceneTimer = null;
  closeLogPuzzle();
  const isolated = collectedItems.has('f12-network-isolated');
  logPuzzle.started = saved?.started === true || isolated;
  logPuzzle.elapsed = savedNumber(saved?.elapsed, 0, 0, LOG_DELETE_END);
  logPuzzle.outcome = !isolated ? null : LOG_OUTCOME_LINES[saved?.outcome] ? saved.outcome :
    collectedItems.has(LOG_HINT_ITEM) ? 'in-time' : 'too-late';
  clearTimeout(logMonologue.monologueTimer);
  logMonologue.replaceChildren();
  logTerm.replaceChildren();
  logSeen.clear();
  logCwd = LOG_HOME;
  runLogTimer();
}

document.getElementById('log-close').addEventListener('click', closeLogPuzzle);
document.getElementById('log-restore').addEventListener('click', restoreLogFromPaper);
document.getElementById('log-remaining').addEventListener('click', () => {
  const left = LOG_PUZZLE_ROWS.length - logDeletedCount();
  logStatus.textContent = left ? `남은 온라인 기록 ${left}개 · 10/07 기록 손상. 종이 기록과 대조하면 복원할 수 있다.` :
    '남은 온라인 기록이 없다. 종이 기록과 대조하면 복원할 수 있다.';
});
// 입력 칸의 Enter와 출력 속 이름 클릭이 같은 길로 명령을 실행한다.
function submitLogCommand(value) {
  runLogCommand(value);
  if (logPanel.hidden) return;
  renderLogPanel(); // 읽은 파일에 따라 상태 줄의 다음 목표가 바뀐다
  checkLogAnalysis();
  logTermInput.focus();
}
document.getElementById('log-term-form').addEventListener('submit', event => {
  event.preventDefault();
  const value = logTermInput.value;
  logTermInput.value = '';
  submitLogCommand(value);
});
logTermInput.addEventListener('keydown', event => {
  if (event.code !== 'Tab' || event.shiftKey || !logTermInput.value.trim()) return;
  event.preventDefault();
  completeLogInput();
});
logPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeLogPuzzle(); }
});

// 12층 모델 평가실에서만 쓰는 두 소품의 특수 동작. interaction.js가 일반 조사보다 먼저 불러서,
// 처리했으면(true) 평소 조사 문구로 넘어가지 않게 한다.
function handleLogTerminalInteract(door) {
  if (dynamicFloorId !== 'f12-eval') return false;
  if (door.name === '야간 로그 단말기') { openLogPuzzle(); return true; }
  if (door.name !== '네트워크 랙') return false;
  if (unplugNetworkRack()) return true;
  if (!collectedItems.has('f12-network-isolated')) return false;
  openInspection(door.name, 'B2 직결 LAN 케이블이 포트에서 빠져 있다. 깜빡이던 표시등도 꺼졌다. 이제 ARCHI는 이 방의 기록에 손대지 못한다.');
  return true;
}
