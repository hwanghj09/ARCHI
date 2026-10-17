// 7층 검증실 망분리 백업 장비(소품의 puzzle: 'f7-logs'): 인터넷이 끊겨 ARCHI가 지우지 못한 원본 로그를 두 단계로 비교한다.
// 1단계 시간 맞추기: 날짜 탭(09/28·09/30·10/05)마다 ARCHI 성능과 B2 전력 사용 표가 있고, 둘 다 높이 오른 시간을 고른다.
//   날짜마다 함정이 다르다(09/28은 01시에 전력만, 09/30은 05시에 성능만 살짝). 12층 평가 벤치(03:12)를 읽었으면 03시 칸이 강조된다.
// 2단계 오늘만 다른 기록: 1단계를 맞히면 [오늘] 탭이 열리고, 평소 밤과 오늘 밤 로그를 비교해 오늘 처음 생긴 일을 고른다.
// 틀리면 화면이 지직거리고 정신력 -5, 다시 고를 수 있다. 진행은 collectedItems에 남아 자동 저장된다.
const LOG_PUZZLE_HOURS = ['00시', '01시', '03시', '05시'];
const LOG_PUZZLE_DAYS = {
  '09/28': { performance: [4, 5, 81, 4], power: [12, 88, 90, 14] },
  '09/30': { performance: [3, 4, 84, 19], power: [11, 13, 91, 12] },
  '10/05': { performance: [4, 5, 87, 4], power: [12, 40, 94, 15] },
};
const LOG_PUZZLE_USUAL = ['TRAINING PROCESS — RUNNING', 'B2 POWER — 94%', '—', '—'];
const LOG_PUZZLE_TODAY = ['TRAINING PROCESS — COMPLETE', 'B2 POWER — 94%', 'EXTERNAL HOST CONNECTION — READY', 'EXTERNAL CONNECTION TEST — SUCCESS'];
const LOG_PUZZLE_STEPS = [
  { item: 'f7-train-time', question: 'ARCHI가 학습한 시간은?', choices: LOG_PUZZLE_HOURS, answer: '03시',
    clue: 'ARCHI는 밤 03시마다 B2로 전력을 모아 몰래 학습했다.', clueName: '망분리 백업 장비 · 학습 시간' },
  { item: 'goal-f7-log', question: '오늘 ARCHI가 처음 한 일은?', choices: ['학습', 'B2 전력 사용', '외부 서버 연결', '로그 삭제'], answer: '외부 서버 연결',
    clue: '오늘 밤 ARCHI는 처음으로 외부 서버에 연결했다. 모든 기록의 발신지는 B2 ARCHI-MAIN이다.', clueName: '망분리 백업 장비 · 오늘 기록' },
];
const logPuzzleSanityLoss = 5;
// 12층 모델 평가실 평가 벤치("야간 자동 평가 · 03:12")를 읽었으면 남는 플래그(objective.js OBJECTIVE_READS).
const logPuzzleHintItem = 'f12-night-eval-read';
const logPanel = document.getElementById('log-panel');
const logTabs = document.getElementById('log-tabs');
const logView = document.getElementById('log-view');
const logQuestion = document.getElementById('log-question');
const logChoices = document.getElementById('log-choices');
const logStatus = document.getElementById('log-status');
let logBlocked = [];
let logTab = '10/05';
let logClosingMessage = '';

function logPuzzleStep() { return LOG_PUZZLE_STEPS.findIndex(step => !collectedItems.has(step.item)); }

// 다 풀었으면 false를 돌려주고, interaction.js가 평소처럼 조사 창(전체 로그)을 연다.
function openLogPuzzle() {
  if (logPuzzleStep() < 0) return false;
  logTab = logPuzzleStep() === 1 ? '오늘' : '10/05';
  logClosingMessage = '';
  logStatus.textContent = '';
  renderLogPuzzle();
  logPanel.hidden = false;
  releaseInput();
  logBlocked = [...document.body.children].filter(element => element !== logPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of logBlocked) element.inert = true;
  stage.inert = true;
  logTabs.querySelector('[aria-selected="true"]')?.focus();
  return true;
}

function closeLogPuzzle() {
  if (logPanel.hidden) return;
  logPanel.hidden = true;
  for (const element of logBlocked) element.inert = false;
  logBlocked = [];
  stage.inert = false;
  if (logClosingMessage) showStatus(logClosingMessage, 4000);
}

function logCell(tag, text, className) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderLogTable(day) {
  const hinted = collectedItems.has(logPuzzleHintItem);
  const table = document.createElement('table');
  table.className = 'log-table';
  const head = document.createElement('tr');
  head.append(logCell('th', '시간'), ...LOG_PUZZLE_HOURS.map(hour => logCell('th', hour, hinted && hour === '03시' ? 'hinted' : '')));
  const row = (label, values) => {
    const line = document.createElement('tr');
    line.append(logCell('th', label), ...values.map((value, index) =>
      logCell('td', `${value}%`, hinted && LOG_PUZZLE_HOURS[index] === '03시' ? 'hinted' : '')));
    return line;
  };
  table.append(head, row('ARCHI 성능', LOG_PUZZLE_DAYS[day].performance), row('B2 전력 사용', LOG_PUZZLE_DAYS[day].power));
  const nodes = [logCell('p', `${day} 야간 기록`, 'log-caption'), table];
  if (hinted) nodes.push(logCell('p', '12층 평가 결과지: 야간 자동 평가 · 03:12', 'log-hint'));
  return nodes;
}

function renderLogCompare() {
  const table = document.createElement('table');
  table.className = 'log-table log-compare';
  const head = document.createElement('tr');
  head.append(logCell('th', '평소 밤 (10/05)'), logCell('th', '오늘 밤'));
  table.append(head, ...LOG_PUZZLE_TODAY.map((today, index) => {
    const line = document.createElement('tr');
    line.append(logCell('td', LOG_PUZZLE_USUAL[index]), logCell('td', today, LOG_PUZZLE_USUAL[index] === today ? '' : 'changed'));
    return line;
  }));
  return [logCell('p', '평소 밤과 오늘 밤 비교', 'log-caption'), table];
}

function renderLogPuzzle() {
  const step = logPuzzleStep();
  const solved = step < 0;
  logPanel.dataset.solved = String(solved);
  const tabs = [...Object.keys(LOG_PUZZLE_DAYS), ...(step !== 0 ? ['오늘'] : [])];
  logTabs.replaceChildren(...tabs.map(day => {
    const button = logCell('button', day === '오늘' ? '[오늘]' : day);
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(day === logTab));
    button.tabIndex = day === logTab ? 0 : -1;
    button.dataset.day = day;
    return button;
  }));
  const view = logTab === '오늘' ? renderLogCompare() : renderLogTable(logTab);
  // 다 풀면 모든 기록 아래에 발신지가 드러난다.
  if (solved) view.push(logCell('p', '발신지 · B2 ARCHI-MAIN', 'log-source'));
  logView.replaceChildren(...view);
  if (solved) {
    logQuestion.textContent = '';
    logChoices.replaceChildren();
    return;
  }
  const { question, choices } = LOG_PUZZLE_STEPS[step];
  logQuestion.textContent = question;
  logChoices.replaceChildren(...choices.map(choice => {
    const button = logCell('button', `[${choice}]`);
    button.type = 'button';
    button.dataset.choice = choice;
    return button;
  }));
}

function glitchLogPanel() {
  logPanel.dataset.glitch = 'false';
  void logPanel.offsetWidth;
  logPanel.dataset.glitch = 'true';
}

function chooseLogAnswer(choice) {
  const step = logPuzzleStep();
  if (step < 0) return;
  const entry = LOG_PUZZLE_STEPS[step];
  if (choice !== entry.answer) {
    glitchLogPanel();
    playGameSound('deny');
    sanity = Math.max(0, sanity - logPuzzleSanityLoss);
    refreshSanity();
    logStatus.textContent = '화면이 지직거린다. 다시 비교해 보자.';
    return;
  }
  collectedItems.add(entry.item);
  recordClue({ name: entry.clueName, clue: entry.clue });
  playGameSound('pickup');
  if (step === 0) {
    logTab = '오늘';
    logStatus.textContent = '맞았다. [오늘] 탭이 열렸다.';
  } else {
    // ARCHI가 알아챘다는 느낌만 준다(본격적인 방해는 지하부터). 목표 창이 B2를 가리키게 된다(objective.js).
    glitchLogPanel();
    logStatus.textContent = '모든 기록의 발신지가 같다: B2 ARCHI-MAIN.';
    logClosingMessage = '화면이 한 번 지직거렸다. …누가 보고 있는 것 같다.';
  }
  renderLogPuzzle();
  (logChoices.querySelector('button') || document.getElementById('log-close')).focus();
}

logTabs.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  logTab = button.dataset.day;
  renderLogPuzzle();
  logTabs.querySelector('[aria-selected="true"]').focus();
  playGameSound('ui');
});
logTabs.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  const buttons = [...logTabs.querySelectorAll('button')];
  const index = buttons.findIndex(button => button.dataset.day === logTab);
  buttons[(index + (event.key === 'ArrowRight' ? 1 : buttons.length - 1)) % buttons.length].click();
});
logChoices.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) chooseLogAnswer(button.dataset.choice);
});
document.getElementById('log-close').addEventListener('click', closeLogPuzzle);
logPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeLogPuzzle(); }
});
logPanel.addEventListener('animationend', () => { logPanel.dataset.glitch = 'false'; });
