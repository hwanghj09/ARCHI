// 17층 사무실 컴퓨터: 바탕화면, 파일 검색, 문서 보기, 업무 메모 저장.
const computer = document.getElementById('computer');
const computerWindow = document.getElementById('computer-window');
const computerNote = document.getElementById('computer-note');
const computerSaveStatus = document.getElementById('computer-save-status');
let computerReturnFocus = null;

function exitComputer() {
  if (transitioning || !usingComputer) return;
  transitionScene(() => {
    usingComputer = false;
    computer.hidden = true;
    updateInteraction();
  });
}

function openComputerApp(app, documentId) {
  if (transitioning || !usingComputer) return;
  const record = app === 'document' ? officeDocuments.find(item => item.id === documentId) : null;
  if (app === 'document' && !record) return;
  computerWindow.hidden = false;
  for (const view of ['files', 'notes', 'document']) {
    document.getElementById(`computer-${view}`).hidden = view !== app;
  }
  let title = app === 'files' ? '파일' : '업무 메모';
  if (app === 'document') {
    title = record.title;
    document.getElementById('computer-document-title').textContent = title;
    document.getElementById('computer-document-code').textContent = `${record.code} / REV ${record.revision}`;
    document.getElementById('computer-document-meta').textContent = `${record.category} · ${record.owner} · ${record.updated} · ${record.status}`;
    // Only authored local document markup is rendered here; user notes stay in the textarea.
    document.getElementById('computer-document-body').innerHTML = record.body;
    document.getElementById('computer-document-scroll').scrollTop = 0;
  }
  document.getElementById('computer-window-title').textContent = title;
  (app === 'notes' ? computerNote : document.getElementById('computer-window-close')).focus();
}

function closeComputerApp() {
  computerWindow.hidden = true;
  computer.querySelector('button').focus();
}

const fileSearch = document.getElementById('computer-search');
const fileCategory = document.getElementById('computer-category');
const fileRows = officeDocuments.map(record => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.computerDocument = record.id;
  const icon = new Image();
  icon.src = 'assets/vendor/lucide/file-text.svg';
  icon.alt = '';
  const description = document.createElement('span');
  description.className = 'computer-file-description';
  const title = document.createElement('strong');
  title.textContent = record.title;
  const summary = document.createElement('small');
  summary.textContent = record.summary;
  description.append(title, summary);
  const metadata = document.createElement('span');
  metadata.className = 'computer-file-metadata';
  metadata.textContent = `${record.category} · ${record.owner}\n${record.updated} · ${record.status}`;
  button.append(icon, description, metadata);
  button.addEventListener('click', () => openComputerApp('document', record.id));
  document.getElementById('computer-file-list').append(button);
  return { record, button };
});
function filterComputerFiles() {
  const query = fileSearch.value.trim().toLocaleLowerCase();
  let count = 0;
  for (const { record, button } of fileRows) {
    button.hidden = Boolean(fileCategory.value && record.category !== fileCategory.value) ||
      !`${record.title} ${record.owner} ${record.code} ${record.summary}`.toLocaleLowerCase().includes(query);
    if (!button.hidden) count++;
  }
  document.getElementById('computer-file-count').textContent = `${count}개 문서`;
  document.getElementById('computer-files-empty').hidden = count !== 0;
}
fileSearch.addEventListener('input', filterComputerFiles);
fileCategory.addEventListener('change', filterComputerFiles);
filterComputerFiles();

computer.querySelectorAll('[data-computer-app]').forEach(button => {
  button.addEventListener('click', () => openComputerApp(button.dataset.computerApp));
});
document.getElementById('computer-window-close').addEventListener('click', closeComputerApp);
document.getElementById('computer-exit').addEventListener('click', exitComputer);
try {
  computerNote.value = localStorage.getItem('archi.office17.note') || '';
} catch {
  computerSaveStatus.textContent = '저장소를 읽을 수 없음';
}
computerNote.addEventListener('input', () => { computerSaveStatus.textContent = '저장되지 않음'; });
document.getElementById('computer-save').addEventListener('click', () => {
  try {
    localStorage.setItem('archi.office17.note', computerNote.value);
    computerSaveStatus.textContent = '저장됨';
  } catch {
    computerSaveStatus.textContent = '저장 실패 · 입력 내용은 유지됩니다';
  }
});
computer.addEventListener('keydown', event => {
  if (event.code !== 'Tab') return;
  const enabled = [...computer.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(el => !el.closest('[hidden]'));
  const index = enabled.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
  else if (!event.shiftKey && (index === -1 || index === enabled.length - 1)) { event.preventDefault(); enabled[0].focus(); }
});
