// 휴대폰 메모의 단서 탭: 소품·고정물에 clue가 있으면 실제로 읽은 순간(어둡거나 필요한 물건이 없을 때는 제외)
// 그 자리의 층·장소와 함께 한 번만 기록한다. 자동 저장(save.js)에 함께 남고 새 게임이면 비워진다.
const phoneClueTabs = { memo: document.getElementById('phone-tab-memo'), clues: document.getElementById('phone-tab-clues') };
const phoneCluePanes = { memo: document.getElementById('phone-memo-pane'), clues: document.getElementById('phone-clue-pane') };
const phoneClueList = document.getElementById('phone-clue-list');
const phoneClueEmpty = document.getElementById('phone-clue-empty');
const phoneClueCount = document.getElementById('phone-clue-count');
let collectedClues = [];

function showPhoneNoteTab(tab) {
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
}

// 장면을 만들 때 조사 대상에는 정해진 항목만 옮겨지므로, clue는 지금 장면 설정의 같은 소품·고정물에서 읽는다.
function clueFor(door) {
  if (door.clue) return door.clue;
  const config = room === 'dynamic' ? floorById.get(dynamicFloorId) : null;
  const source = [...(config?.props || []), ...(config?.fixtures || []), ...(config?.barriers || [])]
    .find(entry => entry.clue && entry.name === door.name);
  return source?.clue || null;
}

function recordClue(door) {
  const text = clueFor(door);
  if (!text) return;
  const place = document.querySelector('header span').textContent;
  if (collectedClues.some(clue => clue.place === place && clue.name === door.name)) return;
  collectedClues.push({ place, name: door.name, text });
  renderClues();
  showStatus('단서 기록됨 · 휴대폰 메모 → 단서', 2500);
}

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
  event.preventDefault();
  const next = phoneClueTabs.memo.getAttribute('aria-selected') === 'true' ? 'clues' : 'memo';
  showPhoneNoteTab(next);
  phoneClueTabs[next].focus();
});
showPhoneNoteTab('memo');
renderClues();
