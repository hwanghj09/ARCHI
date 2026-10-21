// 휴대폰 메모: 새 정보는 직접 적는다. 과거 저장에 단서가 있을 때만 단서 탭을 표시한다.
const phoneClueTabs = { memo: document.getElementById('phone-tab-memo'), clues: document.getElementById('phone-tab-clues') };
const phoneCluePanes = { memo: document.getElementById('phone-memo-pane'), clues: document.getElementById('phone-clue-pane') };
const phoneClueList = document.getElementById('phone-clue-list');
const phoneClueEmpty = document.getElementById('phone-clue-empty');
const phoneClueCount = document.getElementById('phone-clue-count');
let collectedClues = [];

function showPhoneNoteTab(tab) {
  if (tab === 'clues' && !collectedClues.length) tab = 'memo';
  for (const [name, button] of Object.entries(phoneClueTabs)) {
    button.setAttribute('aria-selected', String(name === tab));
    button.tabIndex = name === tab ? 0 : -1;
    phoneCluePanes[name].hidden = name !== tab;
  }
}

function renderClues() {
  // 최근에 찾은 단서가 위에 온다.
  phoneClueList.replaceChildren(...[...collectedClues].reverse().map(clue => {
    const item = document.createElement('li');
    const place = document.createElement('span');
    place.className = 'phone-clue-place';
    place.textContent = `${clue.place} · ${clue.name}`;
    const text = document.createElement('p');
    text.textContent = clue.text;
    item.append(place, text);
    return item;
  }));
  phoneClueEmpty.hidden = collectedClues.length > 0;
  phoneClueCount.textContent = collectedClues.length ? String(collectedClues.length) : '';
  phoneClueTabs.clues.hidden = !collectedClues.length;
  if (!collectedClues.length) showPhoneNoteTab('memo');
}

// 자동 수집은 지원하지 않는다. 기존 저장의 단서만 열람하고 새 정보는 개인 메모에 적는다.
function recordClue(door) {}

// 이전 퍼즐 호출과 저장 형식은 유지하되 자동 수집하지 않는다.
function addClue(name, text) {}

function clueSnapshot() {
  return collectedClues.map(({ place, name, text }) => ({ place, name, text }));
}

function restoreClues(saved) {
  const valid = clue => ['place', 'name', 'text'].every(key => typeof clue?.[key] === 'string' && clue[key].length < 512);
  collectedClues = Array.isArray(saved) ? saved.slice(0, 256).filter(valid).map(({ place, name, text }) => ({ place, name, text })) : [];
  renderClues();
}

for (const [name, button] of Object.entries(phoneClueTabs)) button.addEventListener('click', () => {
  showPhoneNoteTab(name);
  playGameSound('ui');
});
document.getElementById('phone-notes').querySelector('[role="tablist"]').addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (!collectedClues.length) return;
  event.preventDefault();
  const next = phoneClueTabs.memo.getAttribute('aria-selected') === 'true' ? 'clues' : 'memo';
  showPhoneNoteTab(next);
  phoneClueTabs[next].focus();
});
showPhoneNoteTab('memo');
renderClues();
