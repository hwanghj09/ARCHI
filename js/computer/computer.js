// 17층 사무실 컴퓨터: 파일, 업무 메모, 계산기, 블로그, 파일 전송(터미널·그림판·게임은 각 파일).
const computer = document.getElementById('computer');
const computerWindow = document.getElementById('computer-window');
const computerNote = document.getElementById('computer-note');
const computerSaveStatus = document.getElementById('computer-save-status');
let computerReturnFocus = null;
let computerSolarTask = null;

function exitComputer() {
  if (transitioning || !usingComputer) return;
  transitionScene(() => {
    usingComputer = false;
    computer.hidden = true;
    resetComputerDesktop();
    refreshSolarDownload();
    updateInteraction();
  });
}

function openComputerApp(app, documentId) {
  if (transitioning || !usingComputer) return;
  if (!computerWindows.has(app)) return;
  const record = app === 'document' ? officeDocuments.find(item => item.id === documentId) : null;
  if (app === 'document' && !record) return;
  const state = computerWindows.get(app);
  const wasClosed = !state.open;
  const title = record ? record.title : COMPUTER_APPS[app].title;
  showComputerWindow(state, title);
  if (wasClosed) COMPUTER_APPS[app].reset?.();
  if (app === 'document') {
    computerRecentDocuments = [record.id, ...computerRecentDocuments.filter(id => id !== record.id)];
    document.getElementById('computer-document-title').textContent = title;
    document.getElementById('computer-document-code').textContent = `${record.code} / REV ${record.revision}`;
    document.getElementById('computer-document-meta').textContent = `${record.category} · ${record.owner} · ${record.updated} · ${record.status}`;
    // Only authored local document markup is rendered here; user notes stay in the textarea.
    document.getElementById('computer-document-body').innerHTML = record.body;
    document.getElementById('computer-document-scroll').scrollTop = 0;
  }
  refreshSolarDownload();
  if (app === 'browser' && wasClosed) document.getElementById('computer-browser').scrollTop = 0;
  const focus = COMPUTER_APPS[app].focus;
  (focus ? document.querySelector(focus) : app === 'notes' ? computerNote : app === 'calculator' ?
    document.querySelector('#computer-calculator [data-calculator-key]') : app === 'browser' && !document.getElementById('computer-solar-page').hidden ?
    document.getElementById('computer-blog-list-title') : document.getElementById('computer-window-close')).focus({ preventScroll: true });
}

const computerBlogPosts = [...document.querySelectorAll('[data-blog-article]')];
function openComputerBlogPost(id) {
  const selected = computerBlogPosts.find(post => post.dataset.blogArticle === id);
  if (!usingComputer || transitioning || !floorHasPower(17) || !selected) return;
  for (const post of computerBlogPosts) post.hidden = post !== selected;
  for (const button of document.querySelectorAll('[data-blog-post]')) {
    if (button.dataset.blogPost === id) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  }
  const heading = selected.querySelector('h2');
  heading.scrollIntoView({ block: 'start' });
  heading.focus({ preventScroll: true });
}
document.querySelectorAll('[data-blog-post]').forEach(button => {
  button.addEventListener('click', () => openComputerBlogPost(button.dataset.blogPost));
});
document.getElementById('computer-blog-list-back').addEventListener('click', () => {
  const heading = document.getElementById('computer-blog-list-title');
  heading.scrollIntoView({ block: 'start' });
  heading.focus({ preventScroll: true });
});

function refreshSolarDownload() {
  const ready = floorHasPower(17);
  refreshComputerUsb();
  if (computerSolarTask && (transitioning || !usingComputer || !ready ||
      (computerSolarTask.kind === 'transfer' && !computerUsbConnected))) {
    clearInterval(computerSolarTask.timer);
    computerSolarTask = null;
  }
  const downloaded = collectedItems.has('solar-app-downloaded');
  const installed = collectedItems.has('solar-app-installed');
  const task = computerSolarTask;
  const percent = task ? Math.floor(task.elapsed / task.duration * 100) : 0;
  document.getElementById('computer-internet-status').textContent = ready ? '연결됨' :
    '17층 전력이 끊겨 연결할 수 없습니다.';
  document.getElementById('computer-solar-page').hidden = !ready;
  document.getElementById('computer-solar-download').disabled = !ready || downloaded || installed || Boolean(task);
  document.getElementById('computer-solar-transfer').disabled = !ready || !downloaded || installed || Boolean(task) || !computerUsbConnected;
  const connectButton = document.getElementById('computer-usb-open');
  connectButton.disabled = !computerUsbAvailable() || computerUsbConnected;
  connectButton.textContent = computerUsbConnected ? 'USB 연결됨' : '휴대폰 연결';
  for (const kind of ['download', 'transfer']) {
    const progress = document.getElementById(`computer-solar-${kind}-progress`);
    progress.hidden = task?.kind !== kind;
    progress.value = percent;
  }
  document.getElementById('computer-solar-status').textContent = task?.kind === 'download' ? `다운로드 ${percent}%` :
    downloaded || installed ? '다운로드 완료 · 파일 전송 앱에서 설치' : '';
  document.getElementById('computer-transfer-file').hidden = !downloaded && !installed;
  document.getElementById('computer-transfer-status').textContent = installed ? '등록 완료 · 휴대폰에서 전력 제어 가능' :
    task?.kind === 'transfer' ? `설치 ${percent}%` :
    !ready ? '17층 전력 필요' : !downloaded ? '블로그에서 앱 다운로드 필요' :
    phoneDock ? '충전함에서 휴대폰을 가져오세요.' : phoneBattery <= 0 ? '휴대폰 충전 필요' :
    !computerUsbConnected ? '휴대폰 연결 필요' :
    '';
}

function startSolarFileTask(kind) {
  const transfer = kind === 'transfer';
  if (!usingComputer || transitioning || !computerUsbPanel.hidden || computerWindow.hidden || document.getElementById(`computer-${transfer ? 'transfer' : 'browser'}`).hidden ||
      !floorHasPower(17) || (!transfer && document.getElementById('blog-post-solar').hidden) || computerSolarTask || collectedItems.has('solar-app-installed') ||
      (transfer ? !collectedItems.has('solar-app-downloaded') || !computerUsbConnected || !computerUsbAvailable() : collectedItems.has('solar-app-downloaded'))) return;
  const task = { kind, elapsed: 0, duration: transfer ? 8000 : 5000, started: Date.now(), timer: null };
  computerSolarTask = task;
  task.timer = setInterval(() => {
    task.elapsed = Math.min(Date.now() - task.started, task.duration);
    refreshSolarDownload();
    if (computerSolarTask !== task || task.elapsed < task.duration) return;
    clearInterval(task.timer);
    computerSolarTask = null;
    collectedItems.add(transfer ? 'solar-app-installed' : 'solar-app-downloaded');
    if (transfer) {
      playGameSound('phone');
      refreshPhone();
    }
    refreshSolarDownload();
    saveProgress();
  }, 100);
  refreshSolarDownload();
}

document.getElementById('computer-solar-download').addEventListener('click', () => startSolarFileTask('download'));
document.getElementById('computer-solar-transfer').addEventListener('click', () => startSolarFileTask('transfer'));

function closeComputerApp() {
  if (computerActiveWindow) closeComputerWindow(computerActiveWindow);
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
  button.addEventListener('click', event => {
    for (const row of fileRows) row.button.dataset.selected = String(row.button === button);
    if (event.detail === 0 || event.pointerType === 'touch') openComputerApp('document', record.id);
  });
  button.addEventListener('dblclick', () => openComputerApp('document', record.id));
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
  if (event.code !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
  const scope = !computerStartMenu.hidden ? computerStartMenu : computer;
  const enabled = [...scope.querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled && el.getClientRects().length);
  const index = enabled.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1)?.focus(); }
  else if (!event.shiftKey && (index === -1 || index === enabled.length - 1)) { event.preventDefault(); enabled[0]?.focus(); }
});
