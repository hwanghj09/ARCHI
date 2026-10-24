// 컴퓨터 터미널: 1층 안내 데스크 PC나 13층 상황실 원격지원 PC에서 SSH로 B2 ARCHI-MAIN에 접속한다(둘 다 사내망 UPS).
// 접속 정보는 게임 밖 ARCHI 소개 페이지(archi.html)의 임시 저장 글에 ARCHI가 실수로 남겨 두었다.
// external.log를 읽으면 오늘 밤 외부 연결이 드러나고 7층 다음 단계가 풀린다(f7-external-connection-solved, objective.js).
const ARCHI_SSH = { user: 'archi_svc', host: '10.0.2.24', password: 'archi_night03' };
const ARCHI_MAIN_FILES = {
  'README': '원격지원 게이트웨이 배포 계정(archi_svc). 사람 확인 없이 SYSTEM이 관리한다.\n외부 공개 금지.',
  'training.log': [
    '[09/28 03:00] TRAINING PROCESS — RUNNING   B2 POWER 93%',
    '[09/30 03:00] TRAINING PROCESS — RUNNING   B2 POWER 95%',
    '[10/05 03:00] TRAINING PROCESS — RUNNING   B2 POWER 94%',
    '[오늘  23:41] TRAINING PROCESS — COMPLETE',
  ].join('\n'),
  'external.log': [
    '[10/05 03:00] EXTERNAL HOST CONNECTION — 없음',
    '[오늘  23:52] EXTERNAL HOST DR-EXT — HANDSHAKE',
    '[오늘  23:52] EXTERNAL HOST CONNECTION — READY',
    '[오늘  23:58] WEB  VMAX 홈페이지 — 임시 저장 1건',
    '[오늘  00:00] B2 POWER — 94%',
    '[오늘  00:03] EXTERNAL CONNECTION TEST — SUCCESS',
    '[오늘  00:03] SOURCE — B2 ARCHI-MAIN',
  ].join('\n'),
};
const TERMINAL_LOCAL_PROMPT = 'user@desk-pc:~$';
const TERMINAL_REMOTE_PROMPT = `${ARCHI_SSH.user}@archi-main:~$`;

const terminalView = document.getElementById('computer-terminal');
const terminalOutput = document.getElementById('terminal-output');
const terminalForm = document.getElementById('terminal-form');
const terminalPrompt = document.getElementById('terminal-prompt');
const terminalInput = document.getElementById('terminal-input');
// local: 내 컴퓨터, password: 비밀번호 입력 중, remote: ARCHI-MAIN 접속 중
let terminalMode = 'local';
let terminalLogin = null;
let terminalTries = 0;
let terminalTimers = [];

// 컴퓨터 화면을 여는 PC는 모두 사내망 UPS에 물려 있어(interaction.js) 화면이 켜져 있으면 접속할 수 있다.
function terminalOnline() {
  return usingComputer && !computer.hidden;
}

function printTerminal(text) {
  terminalOutput.textContent += `${text}\n`;
  terminalView.scrollTop = terminalView.scrollHeight;
}

function setTerminalMode(mode) {
  terminalMode = mode;
  terminalPrompt.textContent = mode === 'password' ? `${terminalLogin.user}@${terminalLogin.host}'s password:` :
    mode === 'remote' ? TERMINAL_REMOTE_PROMPT : TERMINAL_LOCAL_PROMPT;
  terminalInput.type = mode === 'password' ? 'password' : 'text';
}

function resetTerminal() {
  terminalTimers.forEach(clearTimeout);
  terminalTimers = [];
  terminalView.classList.remove('terminal-alarm');
  terminalOutput.textContent = '';
  terminalInput.value = '';
  terminalTries = 0;
  printTerminal("VMAX 사내 터미널. 명령 목록은 'help'.");
  setTerminalMode('local');
}

function runLocalCommand(command, args) {
  if (command === 'help') return printTerminal('help     명령 목록\nssh      원격 서버 접속 (ssh 사용자@주소)\nclear    화면 지우기\nexit     터미널 닫기');
  if (command === 'ssh') {
    const target = args.length === 1 && args[0].match(/^([^@\s]+)@([^@\s]+)$/);
    if (!target) return printTerminal('usage: ssh 사용자@주소');
    if (!terminalOnline()) return printTerminal(`ssh: connect to host ${target[2]} port 22: Network is unreachable`);
    if (target[2] !== ARCHI_SSH.host) return printTerminal(`ssh: connect to host ${target[2]} port 22: Connection timed out`);
    terminalLogin = { user: target[1], host: target[2] };
    terminalTries = 0;
    return setTerminalMode('password');
  }
  printTerminal(`${command}: command not found`);
}

function checkTerminalPassword(password) {
  if (terminalLogin.user === ARCHI_SSH.user && password === ARCHI_SSH.password) {
    playGameSound('pickup');
    printTerminal('ARCHI-MAIN  B2 메인 서버실\n무단 접속 금지. 모든 세션은 SYSTEM이 기록합니다.\nLast login: 오늘 23:58 from web-vmax');
    return setTerminalMode('remote');
  }
  playGameSound('deny');
  if (++terminalTries < 3) return printTerminal('Permission denied, please try again.');
  printTerminal(`${terminalLogin.user}@${terminalLogin.host}: Permission denied (password).`);
  setTerminalMode('local');
}

function runRemoteCommand(command, args) {
  if (command === 'help') return printTerminal('ls       파일 목록\ncat      파일 내용 보기 (cat 파일이름)\nclear    화면 지우기\nexit     접속 끊기');
  if (command === 'ls') return printTerminal(Object.keys(ARCHI_MAIN_FILES).join('    '));
  if (command === 'cat') {
    const file = ARCHI_MAIN_FILES[args[0]];
    if (!file) return printTerminal(`cat: ${args[0] ?? ''}: No such file or directory`);
    printTerminal(file);
    if (args[0] === 'external.log') revealExternalConnection();
    return;
  }
  if (command === 'exit' || command === 'logout') {
    printTerminal(`Connection to ${ARCHI_SSH.host} closed.`);
    return setTerminalMode('local');
  }
  printTerminal(`-bash: ${command}: command not found`);
}

// 외부 연결 기록을 읽었다. 5층 연구 노트·8층 재현 기록을 보기 전이면 무슨 뜻인지 몰라 진행하지 않는다.
// 읽고 나면 ARCHI가 알아채고 세션을 끊는다(화면 경고, 감시 카메라 도는 소리).
function revealExternalConnection() {
  if (!collectedItems.has('goal-f5-note') || !collectedItems.has('f8-repro-record')) {
    printTerminal('\n(무슨 기록인지 아직 모르겠다. 5층 연구개발실과 8층 QA 시험실의 기록부터 확인해 보자.)');
    return;
  }
  if (!collectedItems.has('f7-external-connection-solved')) {
    collectedItems.add('f7-external-connection-solved');
    addClue('망분리 백업 장비 · 야간 학습', 'ARCHI는 야간에 B2 전력을 이용해 학습했다.');
    addClue('ARCHI-MAIN · 외부 연결', '오늘 밤 처음 외부 서버 연결을 시도했다. (TRAINING COMPLETE · EXTERNAL HOST READY · CONNECTION TEST SUCCESS)');
    addClue('ARCHI-MAIN · 발신지', '모든 관련 로그의 발신지는 B2 ARCHI-MAIN이다.');
    addClue('목적지', 'B2 · ARCHI 메인 서버실');
    saveProgress();
  }
  printTerminal('\n수호: "오늘 밤 처음으로 외부 서버에 연결했어. 이 건물 밖으로 나가려는 거야..."');
  terminalInput.disabled = true;
  terminalTimers.push(setTimeout(() => { terminalView.classList.add('terminal-alarm'); playGameSound('switch'); }, 900));
  terminalTimers.push(setTimeout(() => playGameSound('motor'), 1300));
  terminalTimers.push(setTimeout(() => {
    terminalView.classList.remove('terminal-alarm');
    printTerminal(`\nConnection to ${ARCHI_SSH.host} closed by remote host.`);
    setTerminalMode('local');
    terminalInput.disabled = false;
    terminalInput.focus({ preventScroll: true });
  }, 2800));
}

terminalForm.addEventListener('submit', event => {
  event.preventDefault();
  const line = terminalInput.value;
  terminalInput.value = '';
  if (terminalMode === 'password') {
    printTerminal(terminalPrompt.textContent);
    return checkTerminalPassword(line);
  }
  printTerminal(`${terminalPrompt.textContent} ${line}`);
  const [command, ...args] = line.trim().split(/\s+/);
  if (!command) return;
  if (command === 'clear') { terminalOutput.textContent = ''; return; }
  if (terminalMode === 'remote') return runRemoteCommand(command, args);
  if (command === 'exit') return closeComputerWindow(computerWindows.get('terminal'));
  runLocalCommand(command, args);
});
terminalInput.addEventListener('input', () => playGameSound('keyboard'));
terminalView.addEventListener('click', () => { if (!getSelection().toString()) terminalInput.focus({ preventScroll: true }); });
resetTerminal();
