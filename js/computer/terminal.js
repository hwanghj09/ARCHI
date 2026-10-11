// 17층 컴퓨터 터미널: 사내 문서·열린 창·17층 전력 같은 실제 게임 상태를 읽는 명령 프롬프트.
const terminalView = document.getElementById('computer-terminal');
const terminalOutput = document.getElementById('computer-terminal-output');
const terminalInput = document.getElementById('computer-terminal-input');
const terminalPrompt = 'C:\\Users\\정수호>';
let terminalHistory = [];
let terminalHistoryIndex = 0;

function printTerminal(...lines) {
  for (const text of lines) {
    const line = document.createElement('div');
    line.textContent = text;
    terminalOutput.append(line);
  }
  terminalView.scrollTop = terminalView.scrollHeight;
}

function resetTerminal() {
  terminalOutput.replaceChildren();
  terminalHistory = [];
  terminalHistoryIndex = 0;
  terminalInput.value = '';
  printTerminal('ARCHI OS [버전 17.0.1017]', '(c) ARCHI Corporation. All rights reserved.', '', "명령 목록은 'help'를 입력하세요.", '');
}
COMPUTER_APPS.terminal.reset = resetTerminal;

function terminalFile(name) {
  const query = name.replace(/\.txt$/i, '').toLocaleLowerCase();
  return officeDocuments.find(record => [record.id, record.code, record.title].some(value => value.toLocaleLowerCase() === query));
}

function terminalDocumentText(record) {
  const page = new DOMParser().parseFromString(record.body, 'text/html');
  return [`${record.code} / REV ${record.revision} · ${record.title}`, `${record.category} · ${record.owner} · ${record.updated}`, '',
    ...[...page.body.querySelectorAll('h2, p, li, tr')].map(element => element.matches('tr') ?
      [...element.cells].map(cell => cell.textContent.trim()).join(' | ') :
      element.matches('h2') ? `[${element.textContent.trim()}]` : element.textContent.trim())];
}

function terminalApp(name) {
  const query = name.replace(/\s/g, '').toLocaleLowerCase();
  return Object.keys(COMPUTER_APPS).find(app => app !== 'document' &&
    (app === query || COMPUTER_APPS[app].title.replace(/\s/g, '').toLocaleLowerCase() === query));
}

const terminalCommands = {
  help: () => [
    '명령        설명',
    'cls         화면을 지웁니다.',
    'dir         사내 공유 문서 목록을 봅니다.',
    'type 파일   문서 내용을 출력합니다. 예) type HLP-001',
    'start 앱    앱을 엽니다. 예) start 지뢰찾기, start paint',
    'calc 식     계산합니다. 예) calc (12+8)*3',
    'tasklist    실행 중인 앱을 봅니다.',
    'taskkill 앱 앱을 닫습니다.',
    'echo 글     글을 그대로 출력합니다.',
    'date, time  오늘 날짜와 현재 시각',
    'ipconfig    네트워크 상태',
    'ping 주소   연결을 확인합니다.',
    'ver, whoami, hostname',
    'exit        터미널을 닫습니다.  shutdown  컴퓨터 사용을 끝냅니다.'
  ],
  cls: () => { terminalOutput.replaceChildren(); return []; },
  echo: args => [args],
  date: () => [`현재 날짜: ${new Date().toLocaleDateString('ko-KR', { dateStyle: 'full' })}`],
  time: () => [`현재 시간: ${new Date().toLocaleTimeString('ko-KR', { hour12: false })}`],
  ver: () => ['ARCHI OS [버전 17.0.1017]'],
  whoami: () => ['archi\\jung.suho'],
  hostname: () => ['ARCHI-17F-DEV04'],
  dir: () => [' C:\\Users\\정수호\\사내 공유 디렉터리', '',
    ...officeDocuments.map(record => `${record.updated}    ${`${record.code}.txt`.padEnd(12)}  ${record.title}`),
    `               ${officeDocuments.length}개 파일`],
  type: args => {
    if (!args) return ['파일 이름을 입력하세요. 예) type HLP-001'];
    const record = terminalFile(args);
    return record ? terminalDocumentText(record) : ['지정된 파일을 찾을 수 없습니다.'];
  },
  start: args => {
    const app = terminalApp(args);
    if (!app) return [args ? `'${args}' 앱을 찾을 수 없습니다. 'tasklist' 또는 'help'를 확인하세요.` : '열 앱 이름을 입력하세요. 예) start 메모장'];
    openComputerApp(app);
    return [];
  },
  calc: args => {
    if (!/^[\d\s.+\-*/%()]+$/.test(args)) return ['숫자와 + - * / % ( )만 사용할 수 있습니다.'];
    try {
      // 위 정규식이 숫자와 연산자만 허용하므로 Function은 산술식만 평가한다.
      const value = Function(`"use strict"; return (${args});`)();
      return [Number.isFinite(value) ? String(Number(value.toPrecision(12))) : '계산할 수 없습니다.'];
    } catch { return ['식이 올바르지 않습니다.']; }
  },
  tasklist: () => ['이미지 이름', '==========',
    ...[...computerWindows.values()].filter(state => state.open).map(state =>
      `${state.app.padEnd(12)}${state.element.querySelector('[data-window-title]').textContent}${state.minimized ? ' (최소화)' : ''}`)],
  taskkill: args => {
    const state = computerWindows.get(terminalApp(args.replace(/^\/im\s+/i, '')));
    if (!state?.open) return ['실행 중인 해당 앱이 없습니다.'];
    if (state.app === 'terminal') return ['터미널은 exit로 닫으세요.'];
    closeComputerWindow(state);
    terminalInput.focus({ preventScroll: true });
    return [`성공: "${state.app}" 앱을 종료했습니다.`];
  },
  ipconfig: () => floorHasPower(17) ?
    ['이더넷 어댑터 사내망:', '   연결 상태 . . . . : 연결됨', '   IPv4 주소 . . . . : 10.17.0.42', '   기본 게이트웨이 . : 10.17.0.1'] :
    ['이더넷 어댑터 사내망:', '   미디어 상태 . . . : 미디어 연결 끊김'],
  ping: args => {
    const host = args || 'blog.naver.com';
    if (!floorHasPower(17)) return [`Ping 요청에서 ${host} 호스트를 찾을 수 없습니다.`];
    return [`${host}에 Ping을 보내는 중:`, ...[12, 14, 11, 13].map(ms => `응답: 시간=${ms}ms TTL=54`), '패킷: 보냄 = 4, 받음 = 4, 손실 = 0 (0% 손실)'];
  },
  exit: () => { closeComputerWindow(computerWindows.get('terminal')); return []; },
  shutdown: () => { exitComputer(); return ['시스템을 종료합니다...']; }
};
Object.assign(terminalCommands, { clear: terminalCommands.cls, ls: terminalCommands.dir, cat: terminalCommands.type, open: terminalCommands.start });

function runTerminalCommand(line) {
  printTerminal(`${terminalPrompt}${line}`);
  const [, name = '', args = ''] = line.trim().match(/^(\S*)\s*(.*)$/);
  if (!name) return;
  const command = terminalCommands[name.toLowerCase()];
  printTerminal(...(command ? command(args.trim()) : [`'${name}'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다.`]));
  if (command && terminalOutput.childElementCount) printTerminal('');
}

document.getElementById('computer-terminal-form').addEventListener('submit', event => {
  event.preventDefault();
  const line = terminalInput.value;
  terminalInput.value = '';
  if (line.trim()) terminalHistory.push(line);
  terminalHistoryIndex = terminalHistory.length;
  runTerminalCommand(line);
});
terminalInput.addEventListener('keydown', event => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  event.preventDefault();
  terminalHistoryIndex = Math.max(0, Math.min(terminalHistory.length, terminalHistoryIndex + (event.key === 'ArrowUp' ? -1 : 1)));
  terminalInput.value = terminalHistory[terminalHistoryIndex] ?? '';
});
terminalView.addEventListener('click', () => { if (!getSelection().toString()) terminalInput.focus({ preventScroll: true }); });
