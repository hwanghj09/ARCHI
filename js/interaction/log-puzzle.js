// 12층 모델 평가실 "야간 로그 단말기"(PC)와 "네트워크 랙" 퍼즐.
// PC를 열면 ARCHI가 야간 로그를 한 줄씩 지우기 시작한다(가장 결정적인 10/07 줄부터). 네트워크 랙을 뽑으면 멈춘다.
// 10/07 줄이 지워지기 전에 뽑으면(제때) 로그가 그대로 남아 퀴즈("그날 밤엔 왜 성능이 낮았을까?")로 이어지고,
// 정답("건물에 사람이 있었음")을 맞히면 7층 단서로 이어지는 힌트("03:00~04:00, B2")가 휴대폰 단서 탭에 저장된다.
// 10/07 줄이 지워진 뒤에 뽑으면(늦음) 정상 야간 수치 3개만 남고 퀴즈는 열리지 않는다. 끝까지 안 뽑으면 로그가 전부 지워진다
// (이 경우에도 팀장실 메모·평가 벤치 출력지로 게임 진행에는 지장이 없다).
const LOG_PUZZLE_ROWS = [
  { date: '09/18', day: '4.1%', night: '86.4%' },
  { date: '09/20', day: '3.7%', night: '87.9%' },
  { date: '09/23', day: '4.5%', night: '86.8%' },
  { date: '09/26', day: '3.8%', night: '88.1%' },
  { date: '09/28', day: '3.9%', night: '87.1%' },
  { date: '09/30', day: '4.4%', night: '88.5%' },
  { date: '10/05', day: '3.6%', night: '89.2%' },
  { date: '10/07', day: '3.7%', night: '4.2%', anomaly: true },
];
// 지워지는 순서: 가장 결정적인 10/07(마지막 인덱스)부터 먼저, 그다음은 원래 순서대로.
const LOG_DELETE_ORDER = [7, 0, 1, 2, 3, 4, 5, 6];
const LOG_DELETE_INTERVAL = 4000;
const LOG_ACCESS_RECORD = '출입 기록: 10/07 조현아 23:10 입실 ~ 05:02 퇴실';
const LOG_QUIZ_QUESTION = '10/07 밤에는 왜 성능이 낮았을까?';
const LOG_QUIZ_OPTIONS = ['정전', '서버 점검', '건물에 사람이 있었음', '업데이트'];
const LOG_QUIZ_ANSWER = '건물에 사람이 있었음';
const LOG_QUIZ_WRONG_SANITY_LOSS = 5;
const LOG_HINT_ITEM = 'f12-log-hint';

const logPanel = document.getElementById('log-panel');
const logFrame = document.getElementById('log-frame');
const logRows = document.getElementById('log-rows');
const logStatus = document.getElementById('log-status');
const logQuiz = document.getElementById('log-quiz');
const logQuizRecord = document.getElementById('log-quiz-record');
let logBlocked = [];

let logPuzzleTimer = null;
let logPuzzleStartedAt = 0;
let logPuzzleDeletedCount = 0;
let logPuzzleJustDeleted = -1; // 이번 렌더에서 막 지워진 줄(지직 효과용), 한 번 그리면 비운다.
let logPuzzleStopped = null; // null | 'in-time' | 'too-late' | 'erased'

function tickLogDeletion() {
  const target = Math.min(LOG_DELETE_ORDER.length, Math.floor((Date.now() - logPuzzleStartedAt) / LOG_DELETE_INTERVAL));
  if (target <= logPuzzleDeletedCount) return;
  logPuzzleJustDeleted = LOG_DELETE_ORDER[logPuzzleDeletedCount];
  logPuzzleDeletedCount = target;
  if (logPuzzleDeletedCount >= LOG_DELETE_ORDER.length) { finishLogDeletion('erased'); return; }
  if (!logPanel.hidden) renderLogPanel();
}

function startLogDeletion() {
  if (logPuzzleTimer || logPuzzleStopped) return;
  logPuzzleStartedAt = Date.now();
  logPuzzleTimer = setInterval(tickLogDeletion, 250);
}

function finishLogDeletion(outcome) {
  clearInterval(logPuzzleTimer);
  logPuzzleTimer = null;
  logPuzzleStopped = outcome;
  if (!logPanel.hidden) renderLogPanel();
}

// 네트워크 랙을 뽑아 로그 삭제를 멈춘다. 퍼즐과 무관하면(아직 안 지워지는 중이면) false를 돌려줘 평소 조사로 넘긴다.
function unplugNetworkRack() {
  if (!logPuzzleTimer) return false;
  const outcome = logPuzzleDeletedCount === 0 ? 'in-time' : 'too-late';
  finishLogDeletion(outcome);
  playGameSound('switch');
  showStatus(outcome === 'in-time' ? '네트워크 스위치를 뽑았다. 로그 삭제가 멈췄다.' :
    '네트워크 스위치를 뽑았다. 하지만 10/07 기록은 이미 지워졌다.', 4000);
  return true;
}

function grantLogHint() {
  if (collectedItems.has(LOG_HINT_ITEM)) return;
  collectedItems.add(LOG_HINT_ITEM);
  const place = document.querySelector('header span').textContent;
  collectedClues.push({ place, name: '야간 로그 단말기', text: '03:00~04:00, B2' });
  renderClues();
  showStatus('단서 기록됨 · 휴대폰 메모 → 단서', 2500);
  saveProgress();
}

function glitchLogScreen() {
  logFrame.classList.remove('glitching');
  void logFrame.offsetWidth; // 같은 애니메이션을 다시 걸기 위해 리플로우를 한 번 강제한다.
  logFrame.classList.add('glitching');
}

function answerLogQuiz(choice) {
  if (collectedItems.has(LOG_HINT_ITEM)) return;
  if (choice === LOG_QUIZ_ANSWER) {
    playGameSound('pickup');
    grantLogHint();
    renderLogPanel();
  } else {
    playGameSound('deny');
    sanity = Math.max(0, sanity - LOG_QUIZ_WRONG_SANITY_LOSS);
    refreshSanity();
    glitchLogScreen();
    showStatus(`화면이 지직거린다. 정신력 -${LOG_QUIZ_WRONG_SANITY_LOSS}%`, 2500);
  }
}

function renderLogPanel() {
  const deletedIndexes = new Set(LOG_DELETE_ORDER.slice(0, logPuzzleDeletedCount));
  logRows.replaceChildren(...LOG_PUZZLE_ROWS.map((row, index) => {
    const deleted = deletedIndexes.has(index);
    const line = document.createElement('p');
    line.className = 'log-row';
    line.dataset.anomaly = String(Boolean(row.anomaly));
    line.dataset.deleted = String(deleted);
    line.dataset.glitching = String(index === logPuzzleJustDeleted);
    line.textContent = deleted ? `${row.date}   [ 기록 삭제됨 ]` : `${row.date}   낮 ${row.day}   밤 ${row.night}`;
    return line;
  }));
  logPuzzleJustDeleted = -1;
  const solved = collectedItems.has(LOG_HINT_ITEM);
  const showQuiz = logPuzzleStopped === 'in-time' && !solved;
  logQuiz.hidden = !showQuiz;
  if (showQuiz) logQuizRecord.textContent = LOG_ACCESS_RECORD;
  logStatus.textContent = solved ? '분석 완료 — 단서가 휴대폰 메모에 기록됐다.' :
    logPuzzleStopped === 'in-time' ? '네트워크 스위치를 뽑아 로그를 지켰다. 아래 기록을 분석하자.' :
    logPuzzleStopped === 'too-late' ? '핵심 기록(10/07)이 지워진 뒤에 스위치를 뽑았다. 나머지 야간 기록은 정상 범위다.' :
    logPuzzleStopped === 'erased' ? '모든 야간 로그가 삭제됐다. 네트워크 스위치를 진작 뽑았어야 했다.' :
    '경고: ARCHI가 야간 로그를 지우고 있다! 네트워크 랙의 스위치를 뽑아야 멈춘다.';
}

function openLogPuzzle() {
  if (!logPanel.hidden) return;
  startLogDeletion();
  logPanel.hidden = false;
  releaseInput();
  logBlocked = [...document.body.children].filter(element => element !== logPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of logBlocked) element.inert = true;
  renderLogPanel();
  (logQuiz.hidden ? document.getElementById('log-close') : logQuizOptionButtons[0]).focus();
}

function closeLogPuzzle() {
  if (logPanel.hidden) return;
  logPanel.hidden = true;
  logFrame.classList.remove('glitching');
  for (const element of logBlocked) element.inert = false;
  logBlocked = [];
  stage.focus();
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
logPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeLogPuzzle(); }
});

// 12층 모델 평가실에서만 쓰는 두 소품의 특수 동작. interaction.js가 일반 조사보다 먼저 불러서,
// 처리했으면(true) 평소 조사 문구로 넘어가지 않게 한다.
function handleLogTerminalInteract(door) {
  if (dynamicFloorId !== 'f12-eval') return false;
  if (door.name === '야간 로그 단말기') { openLogPuzzle(); return true; }
  if (door.name === '네트워크 랙') return unplugNetworkRack();
  return false;
}
