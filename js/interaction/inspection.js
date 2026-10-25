// 조사 결과를 화면 하단 대화창에 표시한다. 글이 적힌 물건(writing: 화이트보드·노트·서류·화면·메모 ...)은
// 적힌 모습 그대로 크게 펼쳐 보인다.
const inspectionPanel = document.getElementById('inspection');
const inspectionLabel = inspectionPanel.querySelector('.inspection-label');
const inspectionTitle = document.getElementById('inspection-title');
const inspectionSheet = document.getElementById('inspection-sheet');
const inspectionText = document.getElementById('inspection-text');
const inspectionClose = document.getElementById('inspection-close');
const inspectionUse = document.getElementById('inspection-use'); // 가방에서 연 사용 가능한 물건(항불안제)에만 보인다
const inspectionDescription = document.getElementById('inspection-description');
const inspectionHelp = inspectionPanel.querySelector('.inspection-help');
let inspectionTypingTimer = null;

function finishInspectionText() {
  clearInterval(inspectionTypingTimer);
  inspectionTypingTimer = null;
  inspectionText.textContent = inspectionDescription.textContent;
  inspectionClose.textContent = '닫기 ▾';
  inspectionHelp.textContent = inspectionPanel.dataset.photoOnly === 'true' ? `${bindingLabel('interact')} · 사진 찍기` : `${bindingLabel('interact')} / Esc`;
}

// 한 단계 뒤로: 가방에서 연 카드(returnTo: 'inventory')는 가방 목록으로 돌아가고, 나머지는 닫는다.
function stepBackInspection() {
  if (inspectionPanel.dataset.photoOnly === 'true') return; // 층별 안내판을 처음 볼 때는 사진을 찍어야 닫힌다(photos.js)
  if (inspectionPanel.dataset.returnTo === 'inventory') closeInventoryCard();
  else if (inspectionPanel.dataset.returnTo === 'gallery') {
    closeInspection();
    togglePhone();
    openPhoneApp('gallery');
  }
  else closeInspection();
}

function advanceInspection() {
  // 층별 안내판을 처음 볼 때는 닫는 대신 E로 사진을 찍는다(photos.js). 안내 문구도 그렇게 바뀐다.
  if (inspectionPanel.dataset.photoOnly === 'true') { document.getElementById('inspection-photo').click(); return; }
  if (inspectionTypingTimer !== null) finishInspectionText();
  else stepBackInspection();
}

// sheet: { surface, look, writing, caption, image }를 가진 조사 대상. 펼친 표면은 보이기만 하고, 화면 낭독기는 message를 읽는다.
// 돌아갈 화면(returnTo)은 열 때마다 지운다. 가방의 카드처럼 필요한 쪽이 연 뒤에 다시 기록한다.
function openInspection(name, message, sheet) {
  if (!message) return;
  usingInspection = true;
  delete inspectionPanel.dataset.returnTo;
  delete inspectionPanel.dataset.acquiredItem;
  inspectionUse.hidden = true;
  document.getElementById('inspection-photo').hidden = true;
  delete inspectionPanel.dataset.photoOnly;
  inspectionClose.hidden = false;
  for (const button of inspectionPanel.querySelectorAll('.b2-action')) button.hidden = true; // B2 DELETE·확인 버튼(b2-ending.js)
  const surface = hasWritingSheet(sheet) ? sheet.surface : null;
  if (['document', 'memo', 'notebook'].includes(surface)) playGameSound('paper');
  inspectionTitle.textContent = name;
  inspectionDescription.textContent = message;
  finishInspectionText();
  if (!surface && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const characters = Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(message), part => part.segment);
    let cursor = 0;
    inspectionText.textContent = '';
    inspectionClose.textContent = '전체 보기 ▾';
    inspectionHelp.textContent = `${bindingLabel('interact')} · 전체 보기 / Esc · 닫기`;
    inspectionTypingTimer = setInterval(() => {
      inspectionText.textContent += characters[cursor++];
      if (cursor === characters.length) finishInspectionText();
    }, 30);
  }
  inspectionText.scrollTop = 0;
  inspectionText.tabIndex = surface ? -1 : 0;
  inspectionLabel.textContent = surface ? writingSurfaceLabel(sheet) : '조사';
  inspectionSheet.replaceChildren(...(surface ? [renderWritingSheet(sheet)] : []));
  inspectionSheet.hidden = !surface;
  inspectionSheet.setAttribute('aria-hidden', 'true');
  inspectionSheet.scrollTop = 0;
  if (surface) inspectionPanel.dataset.surface = surface;
  else delete inspectionPanel.dataset.surface;
  inspectionPanel.hidden = false;
  hint.hidden = true;
  releaseInput();
  inspectionClose.focus();
}

function closeInspection() {
  delete inspectionPanel.dataset.photoOnly;
  clearInterval(inspectionTypingTimer);
  inspectionTypingTimer = null;
  usingInspection = false;
  inspectionPanel.hidden = true;
  delete inspectionPanel.dataset.returnTo;
  delete inspectionPanel.dataset.acquiredItem;
  inspectionUse.hidden = true;
  document.getElementById('inventory-button').setAttribute('aria-expanded', 'false');
  (selectingFloor ? cabin : stage).focus();
  // B1 CCTV를 처음 전체 화면으로 본 뒤라면, 돌아온 방의 모니터 벽이 지직거리며 바뀐다(cctv-event.js).
  if (cctvRevealWall) revealCctvWall();
}

const INSPECTION_SCROLL_KEYS = { PageDown: 0.8, PageUp: -0.8, End: Infinity, Home: -Infinity };

inspectionClose.addEventListener('click', advanceInspection);
inspectionText.addEventListener('click', finishInspectionText);
inspectionPanel.addEventListener('keydown', event => {
  // 펼친 표면이 화면보다 길면 Page Up/Down·Home/End로 넘겨 본다(방향키는 이동이라 조사를 닫는다).
  if (!inspectionSheet.hidden && Object.hasOwn(INSPECTION_SCROLL_KEYS, event.key)) {
    const step = INSPECTION_SCROLL_KEYS[event.key];
    inspectionSheet.scrollTop = Number.isFinite(step) ? inspectionSheet.scrollTop + step * inspectionSheet.clientHeight :
      step > 0 ? inspectionSheet.scrollHeight : 0;
    event.preventDefault();
    return;
  }
  if (event.key !== 'Tab' || (inventoryShown() && !event.shiftKey && keyMatches('inventory', event.code))) return;
  event.preventDefault();
  const focusable = [...inspectionPanel.querySelectorAll('button:not(:disabled), [tabindex="0"]')].filter(element => !element.hidden);
  const index = focusable.indexOf(document.activeElement);
  focusable[(index + (event.shiftKey ? -1 : 1) + focusable.length) % focusable.length].focus();
});
