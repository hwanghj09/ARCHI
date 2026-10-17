// 퍼즐 G: 4층 로그 판독기의 해시 사슬 검증. 원본 테이프와 UPS 전원이 있으면(requires) 판독기가 사내 감사 로그 사본을 줄마다
// 검산 숫자와 함께 띄운다. 규칙은 "이 줄 검산 = (앞 줄 검산 + 이 줄 숫자들의 합)의 끝자리". ARCHI가 글자만 바꾸고 검산은 그대로
// 둔 줄 하나만 규칙이 어긋난다. 그 줄을 고르면 원본 테이프로 되살아나고(원래 조사 문구와 gives로 이어진다), 틀리면 정신력 -5%.
const HASH_LINES = [
  { text: '02:40 · backup_svc · 정기 백업 · 0.3TB', check: 9 },
  { text: '02:55 · hr_sync · 인사 동기화 · 0.1TB', check: 2 },
  { text: '03:00 · system · 정기 점검 · 0.0TB', check: 8, forged: true,
    original: '03:00 · archi_svc · 외부 주소로 전송 시험 · 1.2TB' },
  { text: '04:05 · mail_arch · 메일 보관 · 0.4TB', check: 1 },
  { text: '04:30 · backup_svc · 정기 백업 · 0.2TB', check: 0 },
  { text: '05:10 · log_rotate · 로그 정리 · 0.0TB', check: 6 },
];
const hashPanel = document.getElementById('hash-panel');
const hashLines = document.getElementById('hash-lines');
const hashStatus = document.getElementById('hash-status');
let hashDoor = null;
let hashBlocked = [];

function openHashPuzzle(door) {
  hashDoor = door;
  hashPanel.hidden = false;
  releaseInput();
  hint.hidden = true;
  hashBlocked = [...document.body.children].filter(element => element !== hashPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of hashBlocked) element.inert = true;
  hashStatus.textContent = '사내 감사 로그(사본) · 사슬 검증 통과로 표시됨. 그런데 한 줄이 이상하다. 규칙이 어긋나는 줄을 고르자.';
  renderHashLines();
  hashLines.querySelector('button').focus();
}

function closeHashPuzzle() {
  if (hashPanel.hidden) return;
  hashPanel.hidden = true;
  for (const element of hashBlocked) element.inert = false;
  hashBlocked = [];
  stage.focus();
}

function renderHashLines(restored = false) {
  hashLines.replaceChildren(...HASH_LINES.map((line, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.line = String(index);
    button.dataset.restored = String(restored && Boolean(line.forged));
    button.textContent = `${restored && line.forged ? line.original : line.text}   검산 ${line.check}`;
    button.addEventListener('click', () => pickHashLine(index));
    return button;
  }));
}

function pickHashLine(index) {
  const door = hashDoor;
  if (!door || collectedItems.has(door.gives)) return;
  if (!HASH_LINES[index].forged) {
    playGameSound('deny');
    sanity = Math.max(0, sanity - 5);
    refreshSanity();
    hashStatus.textContent = `${index + 1}번째 줄은 규칙대로 맞는다. 판독기 화면이 잠깐 지직거린다. (정신력 -5%)`;
    return;
  }
  renderHashLines(true);
  hashStatus.textContent = '그 줄에서 사슬이 끊긴다. 원본 테이프의 같은 자리를 읽자 원래 글자가 되살아난다.';
  door.terminalPassed = true;
  setTimeout(() => {
    closeHashPuzzle();
    interact();
  }, 900);
}

document.getElementById('hash-close').addEventListener('click', closeHashPuzzle);
hashPanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeHashPuzzle(); }
});
