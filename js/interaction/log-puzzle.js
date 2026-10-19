// 12층 모델 평가실 "야간 로그 단말기"(PC)와 "네트워크 랙": 필수 스토리 퍼즐 두 개.
// 퍼즐 1: PC를 열면 잠시 뒤 ARCHI가 야간 평가 로그를 한 줄씩 지운다. 네트워크 랙의 B2 직결 LAN 케이블을 직접 끌어 뽑아야
//   멈춘다(f12-network-isolated). 10/07 줄이 남아 있을 때 뽑으면 'in-time', 지워진 뒤면 'too-late', 다 지워진 뒤면 'erased'.
//   늦었으면 평가 벤치의 종이 백업(f12-paper-backup)을 PC에서 대조해 복원한다(f12-log-restored). 어느 쪽이든 퍼즐 2로 간다.
// 퍼즐 2: 기록과 출입 기록으로 "10/07 밤 성능이 낮은 이유"를 고른다(f12-evaluation-solved). 오답은 정신력 -5%, 다시 고를 수 있다.
//   제때 지킨 경우에만 7층 힌트 "03:00~04:00 · B2"(f12-log-hint)를 준다.
// 삭제 진행(logPuzzle.elapsed)은 게임이 돌아가는 동안만 쌓이고 자동 저장에 남는다(save.js). 창을 다시 열어도 처음부터 지우지 않는다.
const LOG_PUZZLE_ROWS = [
  { date: '09/28', day: '3.9%', night: '87.1%' },
  { date: '09/30', day: '4.4%', night: '88.5%' },
  { date: '10/05', day: '3.6%', night: '89.2%' },
  { date: '10/07', day: '3.7%', night: '4.2%', anomaly: true },
];
// 위에서부터 지우되 10/07은 세 번째다: 경고 2초 뒤부터 4초마다 한 줄(6·10·14·18초). 랙까지는 걸어서 몇 초면 간다.
// 지워지는 모습을 보기 전에 케이블부터 뽑지 않도록 첫 줄은 금방 지운다.
const LOG_DELETE_ORDER = [0, 1, 3, 2];
const LOG_KEY_ROW = 3;
const LOG_WARNING_DELAY = 2000;
const LOG_DELETE_INTERVAL = 4000;
const LOG_DELETE_END = LOG_WARNING_DELAY + LOG_DELETE_INTERVAL * LOG_DELETE_ORDER.length;
const LOG_ACCESS_RECORD = '출입 기록  10/07 — 조현아 · 23:10 입실 · 05:02 퇴실';
const LOG_QUIZ_QUESTION = '10/07 밤에는 왜 ARCHI의 성능이 낮았을까?';
const LOG_QUIZ_OPTIONS = ['정전', '서버 점검', '건물에 사람이 있었음', '업데이트'];
const LOG_QUIZ_ANSWER = '건물에 사람이 있었음';
const PUZZLE_WRONG_SANITY_LOSS = 5;
const LOG_HINT_ITEM = 'f12-log-hint';
const LOG_OUTCOME_LINES = {
  'in-time': ['NETWORK CONNECTION LOST', 'REMOTE DELETION STOPPED'],
  'too-late': ['REMOTE DELETION STOPPED', 'WARNING: RECORDS DAMAGED'],
  erased: ['ALL ONLINE RECORDS DELETED', 'LOCAL PRINTED BACKUP MAY BE AVAILABLE'],
};

const logPanel = document.getElementById('log-panel');
const logFrame = document.getElementById('log-frame');
const logRows = document.getElementById('log-rows');
const logAlert = document.getElementById('log-alert');
const logNetwork = document.getElementById('log-network');
const logAccess = document.getElementById('log-access');
const logStatus = document.getElementById('log-status');
const logRecovery = document.getElementById('log-recovery');
const logQuiz = document.getElementById('log-quiz');
const logMonologue = document.getElementById('log-monologue');
let logBlocked = [];

const logPuzzle = { started: false, elapsed: 0, outcome: null }; // outcome: null | 'in-time' | 'too-late' | 'erased'
let logTimer = null;
let logTickAt = 0;
let logGlitchRow = -1; // 막 지워지는 줄: 잠깐 글자가 깨졌다가 [DELETED]로 바뀐다.

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
  if (after > before) {
    logGlitchRow = LOG_DELETE_ORDER[after - 1];
    playGameSound('cctv-static');
    setTimeout(() => { logGlitchRow = -1; if (!logPanel.hidden) renderLogPanel(); }, 650);
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

// 12층·7층 객관식 퍼즐의 오답: 화면 지직, 오류음, 정신력 -5%. 진행 플래그는 건드리지 않으니 몇 번이든 다시 고를 수 있다.
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

function restoreLogFromPaper() {
  if (logRecordsReady() || !collectedItems.has('f12-paper-backup') || !collectedItems.has('f12-network-isolated')) return;
  collectedItems.add('f12-log-restored');
  playGameSound('pickup');
  renderLogPanel();
  saveProgress();
  logQuizOptionButtons[0].focus();
}

function answerLogQuiz(choice) {
  if (collectedItems.has('f12-evaluation-solved') || !logRecordsReady()) return;
  if (choice !== LOG_QUIZ_ANSWER) { punishWrongAnswer(logFrame, logStatus); return; }
  collectedItems.add('f12-evaluation-solved');
  playGameSound('pickup');
  addClue('야간 로그 단말기', 'ARCHI는 사람의 존재를 감지하면 실제 성능을 숨긴다. (10/07 조현아 팀장 23:10~05:02 체류, 그날 밤만 성능 4.2%)');
  // 제때 지킨 로그에만 남은 B2 전력 할당 기록 → 7층 퍼즐 1에서 03시 칸을 강조한다(backup-puzzle.js).
  if (logPuzzle.outcome === 'in-time') {
    collectedItems.add(LOG_HINT_ITEM);
    addClue('B2 전력 할당 기록', '03:00~04:00 · B2');
  }
  renderLogPanel();
  // 분석을 마치면 단말기를 끄고, 독백은 단말기 안이 아니라 컷씬(story-scene.js의 story-log-seen)으로 보여 준다.
  collectedItems.add('f12-log-cutscene');
  saveProgress();
  closeLogPuzzle();
}

function logRowText(row, index, deleted) {
  const text = `${row.date}    낮 ${row.day.padStart(5)}    밤 ${row.night.padStart(5)}`;
  if (index === logGlitchRow) return [...text].map(char => char === ' ' || Math.random() < .4 ? char : '#%@$&?'[Math.floor(Math.random() * 6)]).join('');
  return deleted ? `${row.date}    [DELETED]` : text;
}

function renderLogPanel() {
  const isolated = collectedItems.has('f12-network-isolated');
  const restored = collectedItems.has('f12-log-restored');
  const solved = collectedItems.has('f12-evaluation-solved');
  const ready = logRecordsReady();
  const deletedIndexes = new Set(LOG_DELETE_ORDER.slice(0, logDeletedCount()));
  const header = document.createElement('p');
  header.className = 'log-row log-head';
  header.textContent = '날짜        낮 성능      밤 성능';
  logRows.replaceChildren(header, ...LOG_PUZZLE_ROWS.map((row, index) => {
    const deleted = deletedIndexes.has(index) && !restored && index !== logGlitchRow;
    const line = document.createElement('p');
    line.className = 'log-row';
    line.dataset.anomaly = String(Boolean(row.anomaly) && !deleted);
    line.dataset.deleted = String(deleted);
    line.dataset.glitching = String(index === logGlitchRow);
    line.dataset.restored = String(restored && deletedIndexes.has(index));
    line.dataset.highlight = String(solved && index === LOG_KEY_ROW);
    line.textContent = logRowText(row, index, deleted) + (line.dataset.restored === 'true' ? '   (종이 대조)' : '');
    return line;
  }));
  const warned = logPuzzle.elapsed >= LOG_WARNING_DELAY;
  const allDeleted = logDeletedCount() >= LOG_DELETE_ORDER.length;
  logAlert.hidden = !warned && !isolated;
  logAlert.dataset.outcome = isolated ? logPuzzle.outcome : 'deleting';
  logAlert.textContent = (isolated ? LOG_OUTCOME_LINES[logPuzzle.outcome] :
    allDeleted ? ['ALL ONLINE RECORDS DELETED', 'SOURCE: SYSTEM', 'REMOTE SESSION STILL CONNECTED'] :
      ['WARNING: UNAUTHORIZED LOG MODIFICATION', 'SOURCE: SYSTEM', 'DELETING NIGHT EVALUATION RECORDS...']).join('\n');
  logNetwork.dataset.connected = String(!isolated);
  logNetwork.textContent = `NETWORK · B2 직결 회선: ${isolated ? 'DISCONNECTED' : 'CONNECTED'}`;
  logAccess.hidden = !ready;
  logAccess.textContent = LOG_ACCESS_RECORD;
  logAccess.dataset.highlight = String(solved);
  const needsPaper = isolated && !ready;
  logRecovery.hidden = !(needsPaper && collectedItems.has('f12-paper-backup'));
  logQuiz.hidden = !ready || solved;
  logStatus.textContent = solved ? '분석 완료.' :
    ready ? (restored ? '종이 기록으로 손상된 줄을 복원했다. 기록과 출입 기록을 비교해 보자.' : '로그를 지켰다. 기록과 출입 기록을 비교해 보자.') :
    needsPaper ? (collectedItems.has('f12-paper-backup') ? '종이 백업이 있다. 남은 로그와 대조해 복원하자.' :
      '온라인 기록이 손상됐다. 이 방 평가 벤치에 출력해 둔 종이 기록이 남아 있을지도 모른다.') :
    allDeleted ? '기록이 전부 지워졌다. 연결이 살아 있으면 무엇을 되살려도 또 지워진다. 네트워크 랙의 LAN 케이블부터 뽑자.' :
    warned ? 'ARCHI가 기록을 지우고 있다! 창을 닫고(Esc) 네트워크 랙의 B2 직결 LAN 케이블을 뽑자.' :
    '저장된 야간 평가 기록이다.';

  logMonologue.hidden = true; // 독백은 컷씬으로 옮겼다
  document.getElementById('log-hint-record').hidden = !(solved && logPuzzle.outcome === 'in-time');
}

function openLogPuzzle() {
  if (!logPanel.hidden) return;
  if (!logPuzzle.started) Object.assign(logPuzzle, { started: true, elapsed: 0, outcome: null });
  runLogTimer();
  logPanel.hidden = false;
  releaseInput();
  logBlocked = [...document.body.children].filter(element => element !== logPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of logBlocked) element.inert = true;
  renderLogPanel();
  (!logQuiz.hidden ? logQuizOptionButtons[0] : !logRecovery.hidden ? document.getElementById('log-restore') :
    document.getElementById('log-close')).focus();
}

function closeLogPuzzle() {
  if (logPanel.hidden) return;
  logPanel.hidden = true;
  logFrame.classList.remove('glitching');
  for (const element of logBlocked) element.inert = false;
  logBlocked = [];
  stage.focus();
}

// 불러오기·새 게임(save.js): 진행 중이던 삭제는 남은 지점부터 이어 간다. 이미 뽑았으면 다시 시작하지 않는다.
function restoreLogPuzzle(saved) {
  stopLogTimer();
  closeLogPuzzle();
  logGlitchRow = -1;
  const isolated = collectedItems.has('f12-network-isolated');
  logPuzzle.started = saved?.started === true || isolated;
  logPuzzle.elapsed = savedNumber(saved?.elapsed, 0, 0, LOG_DELETE_END);
  logPuzzle.outcome = !isolated ? null : LOG_OUTCOME_LINES[saved?.outcome] ? saved.outcome :
    collectedItems.has(LOG_HINT_ITEM) ? 'in-time' : 'too-late';
  clearTimeout(logMonologue.monologueTimer);
  logMonologue.replaceChildren();
  runLogTimer();
}

const logQuizOptionButtons = LOG_QUIZ_OPTIONS.map(label => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.addEventListener('click', () => answerLogQuiz(label));
  document.getElementById('log-quiz-options').append(button);
  return button;
});
document.getElementById('log-quiz-question').textContent = LOG_QUIZ_QUESTION;
document.getElementById('log-close').addEventListener('click', closeLogPuzzle);
document.getElementById('log-restore').addEventListener('click', restoreLogFromPaper);
document.getElementById('log-remaining').addEventListener('click', () => {
  const left = LOG_PUZZLE_ROWS.length - logDeletedCount();
  logStatus.textContent = left ? `남은 온라인 기록 ${left}줄 · 10/07 기록 손상. 종이 기록과 대조하면 복원할 수 있다.` :
    '남은 온라인 기록이 없다. 종이 기록과 대조하면 복원할 수 있다.';
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
