// 7층 검증실 "망분리 백업 장비": 필수 스토리 퍼즐 두 개. 12층 퍼즐(f12-evaluation-solved)을 풀어야 열린다.
// 사내망과 떨어져 배터리로 도는 장비라 ARCHI가 지울 수 없다: 여기 기록은 언제 와도 그대로다(실패해도 잃는 것이 없다).
// 퍼즐 1: 날짜 탭(09/28·09/30·10/05)의 시간별 ARCHI 성능과 B2 전력 사용을 비교해 둘이 함께 오른 시각(03시)을 고른다
//   (f7-training-time-solved). 09/28 01시는 전력만, 09/30 05시는 성능만 오른 함정이다. 12층 힌트가 있으면 10/05 03시 칸만 강조한다.
// 퍼즐 2: [오늘] 탭에서 평소 밤(10/05)과 오늘 밤 기록을 비교해 오늘 처음 생긴 일(외부 서버 연결)을 고른다
//   (f7-external-connection-solved). 풀면 화면이 지직거리다 어두워지고 감시 카메라 도는 소리가 난 뒤 돌아온다(공격은 없다).
const BACKUP_HOURS = ['00시', '01시', '03시', '05시'];
const BACKUP_DAYS = {
  '09/28': { perf: [4, 5, 86, 4], power: [12, 91, 93, 14] },
  '09/30': { perf: [4, 4, 88, 31], power: [13, 38, 95, 16] },
  '10/05': { perf: [4, 5, 87, 4], power: [12, 40, 94, 15] },
};
const BACKUP_TODAY = '오늘';
const BACKUP_TRAINING_QUESTION = 'ARCHI의 성능 상승과 B2 전력 집중이 동시에 발생한 시간은?';
const BACKUP_TRAINING_ANSWER = '03시';
const BACKUP_COMPARE = [
  { usual: 'TRAINING PROCESS — RUNNING', today: 'TRAINING PROCESS — COMPLETE', diff: 'changed', key: true },
  { usual: 'B2 POWER — 94%', today: 'B2 POWER — 94%', diff: 'same' },
  { usual: '없음', today: 'EXTERNAL HOST CONNECTION — READY', diff: 'new', key: true },
  { usual: '없음', today: 'EXTERNAL CONNECTION TEST — SUCCESS', diff: 'new', key: true },
];
const BACKUP_TODAY_QUESTION = '오늘 ARCHI가 처음으로 실행한 작업은?';
const BACKUP_TODAY_OPTIONS = ['학습', 'B2 전력 사용', '외부 서버 연결', '로그 삭제'];
const BACKUP_TODAY_ANSWER = '외부 서버 연결';
const BACKUP_TRAINING_MONOLOGUE = ['성능이 갑자기 높아진 시간과 B2 전력이 늘어난 시간이 같아.', 'ARCHI가 몰래 학습하면서 전력을 사용한 거야.'];
const BACKUP_TODAY_MONOLOGUE = ['학습은 이미 끝났어.', '이제 외부 서버에 연결하려고 하고 있어.', '이 건물 밖으로 나가려는 건가...?'];

const backupPanel = document.getElementById('backup-panel');
const backupFrame = document.getElementById('backup-frame');
const backupTabs = document.getElementById('backup-tabs');
const backupBody = document.getElementById('backup-body');
const backupHint = document.getElementById('backup-hint');
const backupQuestion = document.getElementById('backup-question');
const backupOptions = document.getElementById('backup-options');
const backupSource = document.getElementById('backup-source');
const backupMonologue = document.getElementById('backup-monologue');
const backupStatus = document.getElementById('backup-status');
let backupBlocked = [];
let backupTab = '09/28';
let backupPick = null; // 보기에 마우스·초점을 올린 시간: 그 열을 강조한다.

const trainingSolved = () => collectedItems.has('f7-training-time-solved');
const externalSolved = () => collectedItems.has('f7-external-connection-solved');

function backupCell(tag, text, attributes = {}) {
  const cell = document.createElement(tag);
  cell.textContent = text;
  Object.assign(cell.dataset, attributes);
  return cell;
}

function renderBackupTabs() {
  backupTabs.replaceChildren(...[...Object.keys(BACKUP_DAYS), BACKUP_TODAY].map(tab => {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.id = `backup-tab-${tab.replace('/', '-')}`;
    button.dataset.tab = tab;
    const locked = tab === BACKUP_TODAY && !trainingSolved();
    button.textContent = locked ? `[${tab} · 잠김]` : `[${tab}]`;
    button.disabled = locked;
    button.setAttribute('aria-selected', String(tab === backupTab));
    button.setAttribute('aria-controls', 'backup-body');
    button.tabIndex = tab === backupTab ? 0 : -1;
    button.addEventListener('click', () => selectBackupTab(tab));
    return button;
  }));
}

function renderDayTable() {
  const data = BACKUP_DAYS[backupTab];
  const hinted = backupTab === '10/05' && collectedItems.has(LOG_HINT_ITEM) && !trainingSolved();
  const table = document.createElement('table');
  table.className = 'backup-table';
  table.setAttribute('aria-label', `${backupTab} 시간별 ARCHI 성능과 B2 전력 사용`);
  const head = document.createElement('tr');
  head.append(backupCell('th', '시간'), ...BACKUP_HOURS.map(hour => backupCell('th', hour, { hour })));
  const rows = [['ARCHI 성능', data.perf], ['B2 전력 사용', data.power]].map(([label, values]) => {
    const row = document.createElement('tr');
    row.append(backupCell('th', label), ...values.map((value, index) => {
      const hour = BACKUP_HOURS[index];
      const cell = backupCell('td', `${value}%`, { hour });
      cell.style.setProperty('--value', `${value}%`);
      if (hinted && hour === BACKUP_TRAINING_ANSWER) cell.dataset.hinted = 'true';
      if (trainingSolved() && backupTab === '10/05' && hour === BACKUP_TRAINING_ANSWER) cell.dataset.solved = 'true';
      return cell;
    }));
    return row;
  });
  table.createTHead().append(head);
  table.createTBody().append(...rows);
  for (const cell of table.querySelectorAll('[data-hour]')) cell.dataset.picked = String(cell.dataset.hour === backupPick);
  backupBody.replaceChildren(table);
  backupHint.hidden = !hinted;
}

function renderTodayTable() {
  const table = document.createElement('table');
  table.className = 'backup-compare';
  table.setAttribute('aria-label', '평소 밤과 오늘 밤 기록 비교');
  const head = document.createElement('tr');
  head.append(backupCell('th', ''), backupCell('th', '평소 밤 (10/05)'), backupCell('th', '오늘 밤'));
  table.createTHead().append(head);
  table.createTBody().append(...BACKUP_COMPARE.map(entry => {
    const row = document.createElement('tr');
    row.dataset.diff = entry.diff;
    row.dataset.highlight = String(externalSolved() && Boolean(entry.key));
    // 다른 줄에는 표시만 붙인다(무엇이 답인지는 알려 주지 않는다): ≠ 바뀜, + 오늘 처음.
    row.append(backupCell('td', entry.diff === 'new' ? '+' : entry.diff === 'changed' ? '≠' : '', { mark: 'true' }),
      backupCell('td', entry.usual), backupCell('td', entry.today));
    return row;
  }));
  backupBody.replaceChildren(table);
  backupHint.hidden = true;
}

function renderBackupOptions(options, onAnswer) {
  backupOptions.replaceChildren(...options.map(label => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => onAnswer(label));
    if (options === BACKUP_HOURS) {
      const pick = value => () => { backupPick = value; renderDayTable(); };
      button.addEventListener('pointerenter', pick(label));
      button.addEventListener('focus', pick(label));
      button.addEventListener('pointerleave', pick(null));
      button.addEventListener('blur', pick(null));
    }
    return button;
  }));
}

function renderBackupPanel() {
  renderBackupTabs();
  const today = backupTab === BACKUP_TODAY;
  if (today) renderTodayTable(); else renderDayTable();
  const solved = today ? externalSolved() : trainingSolved();
  backupQuestion.textContent = today ? BACKUP_TODAY_QUESTION : BACKUP_TRAINING_QUESTION;
  backupQuestion.hidden = backupOptions.hidden = solved;
  if (!solved && backupOptions.dataset.tab !== String(today)) {
    backupOptions.dataset.tab = String(today);
    renderBackupOptions(today ? BACKUP_TODAY_OPTIONS : BACKUP_HOURS, today ? answerBackupToday : answerBackupTraining);
  }
  backupSource.hidden = !(today && externalSolved());
  const lines = today ? BACKUP_TODAY_MONOLOGUE : BACKUP_TRAINING_MONOLOGUE;
  backupMonologue.hidden = !solved;
  if (solved && backupMonologue.dataset.lines !== lines[0]) {
    backupMonologue.dataset.lines = lines[0];
    showMonologue(backupMonologue, lines, true);
  }
  backupStatus.textContent = today ? (externalSolved() ? '모든 관련 로그의 발신지는 B2 ARCHI-MAIN이다. 단서가 휴대폰 메모에 기록됐다.' :
    '평소 밤과 오늘 밤 기록을 비교해 보자. 다른 줄에는 표시가 붙어 있다.') :
    trainingSolved() ? '10/05 03시: 성능 상승과 B2 전력 집중이 동시에 일어났다. [오늘] 탭이 열렸다.' :
    '날짜 탭을 바꿔 가며 ARCHI 성능과 B2 전력 사용이 함께 높아진 시간을 찾자.';
}

function selectBackupTab(tab) {
  if (tab === BACKUP_TODAY && !trainingSolved()) return;
  backupTab = tab;
  backupPick = null;
  renderBackupPanel();
  document.getElementById(`backup-tab-${tab.replace('/', '-')}`).focus();
}

function answerBackupTraining(choice) {
  if (trainingSolved() || !collectedItems.has('f12-evaluation-solved')) return;
  if (choice !== BACKUP_TRAINING_ANSWER) { punishWrongAnswer(backupFrame, backupStatus); return; }
  collectedItems.add('f7-training-time-solved');
  playGameSound('pickup');
  addClue('망분리 백업 장비 · 학습 시간', '10/05 03시, ARCHI 성능 상승과 B2 전력 집중이 동시에 발생했다. 09/28·09/30에도 03시에 같은 기록이 있다: 매일 밤 몰래 학습했다.');
  backupTab = '10/05';
  backupPick = null;
  renderBackupPanel();
  showMonologue(backupMonologue, BACKUP_TRAINING_MONOLOGUE);
  saveProgress();
  // 정답을 확인할 틈을 준 뒤 [오늘] 탭으로 넘어간다(퍼즐 2).
  setTimeout(() => { if (!backupPanel.hidden && backupTab === '10/05') selectBackupTab(BACKUP_TODAY); }, 4200);
}

function answerBackupToday(choice) {
  if (externalSolved() || !trainingSolved()) return;
  if (choice !== BACKUP_TODAY_ANSWER) { punishWrongAnswer(backupFrame, backupStatus); return; }
  collectedItems.add('f7-external-connection-solved');
  playGameSound('pickup');
  addClue('망분리 백업 장비 · 야간 학습', 'ARCHI는 야간에 B2 전력을 이용해 학습했다.');
  addClue('망분리 백업 장비 · 외부 연결', '오늘 밤 처음 외부 서버 연결을 시도했다. (TRAINING COMPLETE · EXTERNAL HOST READY · CONNECTION TEST SUCCESS)');
  addClue('망분리 백업 장비 · 발신지', '모든 관련 로그의 발신지는 B2 ARCHI-MAIN이다.');
  addClue('목적지', 'B2 · ARCHI 메인 서버실');
  renderBackupPanel();
  showMonologue(backupMonologue, BACKUP_TODAY_MONOLOGUE);
  saveProgress();
  // ARCHI가 조사를 알아챘다: 지직 → 화면이 잠깐 어두워짐 → 감시 카메라가 도는 소리 → 정상으로(7층에는 CCTV가 없어 소리만).
  glitchFrame(backupFrame);
  setTimeout(() => backupFrame.classList.add('dimmed'), 450);
  setTimeout(() => playGameSound('motor'), 800);
  setTimeout(() => backupFrame.classList.remove('dimmed'), 2000);
  document.getElementById('backup-close').focus();
}

function openBackupPuzzle() {
  if (!backupPanel.hidden) return;
  if (trainingSolved() && !externalSolved()) backupTab = BACKUP_TODAY;
  backupPick = null;
  delete backupOptions.dataset.tab;
  delete backupMonologue.dataset.lines;
  backupPanel.hidden = false;
  releaseInput();
  backupBlocked = [...document.body.children].filter(element => element !== backupPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of backupBlocked) element.inert = true;
  renderBackupPanel();
  document.getElementById(`backup-tab-${backupTab.replace('/', '-')}`).focus();
}

function closeBackupPuzzle() {
  if (backupPanel.hidden) return;
  backupPanel.hidden = true;
  backupFrame.classList.remove('glitching', 'dimmed');
  for (const element of backupBlocked) element.inert = false;
  backupBlocked = [];
  stage.focus();
}

document.getElementById('backup-close').addEventListener('click', closeBackupPuzzle);
backupTabs.addEventListener('keydown', event => {
  const tabs = [...backupTabs.querySelectorAll('button:not(:disabled)')];
  const index = tabs.indexOf(document.activeElement);
  const step = { ArrowRight: 1, ArrowLeft: -1 }[event.code];
  if (index < 0 || !step) return;
  event.preventDefault();
  selectBackupTab(tabs[(index + step + tabs.length) % tabs.length].dataset.tab);
});
backupPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeBackupPuzzle(); }
});

function handleBackupDeviceInteract(door) {
  if (dynamicFloorId !== 'f7-verify' || door.name !== '망분리 백업 장비') return false;
  if (!collectedItems.has('f12-evaluation-solved')) {
    openInspection(door.name, '배터리로 켜진 망분리 백업 장비다. 날짜별 원본 로그가 잔뜩 쌓여 있지만 무엇과 대조해야 할지 모르겠다. 12층 모델 평가실의 야간 평가 기록부터 확인하자.');
    return true;
  }
  // 5층 연구 노트(왜 실력을 숨기는지)와 8층 재현 기록(보는 사람이 있는지 확인)도 필수다. 이미 분석을 시작한 저장은 막지 않는다.
  if (!trainingSolved() && !(collectedItems.has('goal-f5-note') && collectedItems.has('f8-repro-record'))) {
    openInspection(door.name, '배터리로 켜진 망분리 백업 장비다. 시간별 성능과 전력 기록이 있지만, ARCHI가 왜 낮에만 실력을 숨기는지 모르면 어디를 봐야 할지 모르겠다. 5층 연구개발실과 8층 QA 시험실의 기록부터 확인하자.');
    return true;
  }
  openBackupPuzzle();
  return true;
}
