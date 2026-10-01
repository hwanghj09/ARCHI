// 게시판·포스트잇·서류·일반 소품의 조사 결과를 읽을 수 있는 모달 UI로 보여 준다.
const inspectionPanel = document.getElementById('inspection');
const inspectionTitle = document.getElementById('inspection-title');
const inspectionText = document.getElementById('inspection-text');
const inspectionClose = document.getElementById('inspection-close');

function inspectionKind(name, message) {
  if (/포스트잇|메모/.test(message)) return 'note';
  if (/게시판|보드|현황판|일지|기록|서류|출력|안내|표/.test(`${name} ${message}`)) return 'paper';
  return 'object';
}

function openInspection(name, message) {
  if (!message) return;
  usingInspection = true;
  inspectionTitle.textContent = name;
  inspectionText.textContent = message;
  inspectionPanel.dataset.kind = inspectionKind(name, message);
  inspectionPanel.hidden = false;
  releaseInput();
  inspectionClose.focus();
}

function closeInspection() {
  usingInspection = false;
  inspectionPanel.hidden = true;
  stage.focus();
}

inspectionClose.addEventListener('click', closeInspection);
