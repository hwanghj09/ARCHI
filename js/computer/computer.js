// 컴퓨터 화면(1층 안내 데스크 PC·13층 상황실 원격지원 PC에서 연다): 파일, 업무 메모, 사내 메일, 계산기, 건물 안내, 블로그, 파일 전송.
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
  if (app === 'usbdrive' && !usbDriveAvailable()) return;
  const record = app === 'document' ? officeDocuments.find(item => item.id === documentId) : null;
  if (app === 'document' && !record) return;
  const state = computerWindows.get(app);
  const wasClosed = !state.open;
  const title = record ? record.title : COMPUTER_APPS[app].title;
  showComputerWindow(state, title);
  if (app === 'document') {
    computerRecentDocuments = [record.id, ...computerRecentDocuments.filter(id => id !== record.id)];
    document.getElementById('computer-document-title').textContent = title;
    document.getElementById('computer-document-code').textContent = `${record.code} / REV ${record.revision}`;
    document.getElementById('computer-document-meta').textContent = `${record.category} · ${record.owner} · ${record.updated} · ${record.status}`;
    // Only authored local document markup is rendered here; user notes stay in the textarea.
    document.getElementById('computer-document-body').innerHTML = record.body;
    document.getElementById('computer-document-scroll').scrollTop = 0;
  }
  if (app === 'mail' && wasClosed) showComputerMailInbox();
  if (app === 'usbdrive' && wasClosed) resetUsbVideo();
  if (app === 'terminal' && wasClosed) resetTerminal();
  if (app === 'building') {
    // 새로 열 때는 지금 서 있는 층을 보여 준다(처음 불러온 17층에 머물지 않게).
    if (wasClosed) for (const select of document.querySelectorAll('[data-building-floor]')) select.value = String(currentSceneFloor);
    refreshBuildingGuides();
    collectedItems.add('goal-facilities-read');
  }
  refreshSolarDownload();
  if (app === 'browser' && wasClosed) document.getElementById('computer-browser').scrollTop = 0;
  (app === 'notes' ? computerNote : app === 'terminal' ? document.getElementById('terminal-input') : app === 'mail' ? computerMailSearch : app === 'calculator' ?
    document.querySelector('#computer-calculator [data-calculator-key]') : app === 'browser' && !document.getElementById('computer-solar-page').hidden ?
    document.getElementById('computer-blog-list-title') : document.getElementById('computer-window-close')).focus({ preventScroll: true });
}

const computerBlogPosts = [...document.querySelectorAll('[data-blog-article]')];
function openComputerBlogPost(id) {
  const selected = computerBlogPosts.find(post => post.dataset.blogArticle === id);
  // 블로그는 1층 안내 데스크 PC(사내망 UPS로 늘 켜져 있다)에서 본다. 켜진 컴퓨터를 쓰는 중이면 글을 바꾼다.
  if (!usingComputer || transitioning || !selected) return;
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

// 컴퓨터는 1층 안내 데스크·13층 상황실 PC에서 사내망 UPS로 켜지므로, 켜져 있는 동안은 층 전력과 상관없이 연결돼 있다.
function refreshSolarDownload() {
  const ready = usingComputer;
  refreshComputerUsb();
  if (typeof refreshUsbDrive === 'function') refreshUsbDrive();
  // 다운로드는 컴퓨터를 나가도 백그라운드에서 이어서 받는다. USB 전송만 연결이 끊기면 중단한다.
  if (computerSolarTask?.kind === 'transfer' && (transitioning || !ready || !computerUsbConnected)) cancelSolarFileTask();
  const downloaded = collectedItems.has('solar-app-downloaded');
  const installed = collectedItems.has('solar-app-installed');
  const task = computerSolarTask;
  const percent = task ? Math.floor(task.elapsed / task.duration * 100) : 0;
  document.getElementById('computer-internet-status').textContent = ready ? '연결됨' : '연결할 수 없습니다.';
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
    !downloaded ? '블로그에서 앱 다운로드 필요' :
    phoneDock ? '충전하던 책상에서 휴대폰을 가져오세요.' : phoneBattery <= 0 ? '휴대폰 충전 필요' :
    !computerUsbConnected ? '휴대폰 연결 필요' :
    '';
}

function cancelSolarFileTask() {
  if (!computerSolarTask) return;
  clearInterval(computerSolarTask.timer);
  computerSolarTask = null;
}

function startSolarFileTask(kind) {
  const transfer = kind === 'transfer';
  if (!usingComputer || transitioning || !computerUsbPanel.hidden || computerWindow.hidden || document.getElementById(`computer-${transfer ? 'transfer' : 'browser'}`).hidden ||
      (!transfer && document.getElementById('blog-post-solar').hidden) || computerSolarTask || collectedItems.has('solar-app-installed') ||
      (transfer ? !collectedItems.has('solar-app-downloaded') || !computerUsbConnected || !computerUsbAvailable() : collectedItems.has('solar-app-downloaded'))) return;
  const task = { kind, elapsed: 0, duration: transfer ? solarTransferMs : solarDownloadMs, started: Date.now(), timer: null };
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

const computerMailSearch = document.getElementById('computer-mail-search');
const computerMailList = document.getElementById('computer-mail-list');
const computerMailReader = document.getElementById('computer-mail-reader');
const computerMailRead = new Set();
const computerMailRows = [
  {
    id: 'overtime', subject: '오늘 야근 마무리 안내', sender: 'ARCHI 운영지원', date: '오늘 18:10',
    body: '수호님, 오늘도 수고 많으셨습니다.\n\n퇴근 전 업무 자료를 정리하고 컴퓨터를 종료해 주세요. 책상 위 개인 물품과 가방 속 출입증을 확인해 주시기 바랍니다.\n\n엘리베이터는 사무실 밖 복도에 있습니다. 야간에는 혼자 이동하므로 휴대폰 배터리를 확인한 후 출발해 주세요.'
  },
  {
    id: 'power', subject: '정전 시 태양광 비상 전력 사용 안내', sender: '시설관리팀', date: '오늘 16:40',
    body: '태양광은 전등 전용입니다. 옥상 배전반에서 레버를 내린 뒤 조명을 켤 층을 선택해 주세요.\n\n엘리베이터는 17층 관리자실의 비상 전력 분배반에서 회선을 연결해야 운행됩니다. 관리실 출입 비밀번호는 복도 청소 카트에 숨겨 둔 메모에 있습니다.\n\n비상 회선을 연결하면 작업용 컴퓨터와 충전 콘센트도 별도 UPS로 복구됩니다. 조명은 한 번에 한 층만 공급합니다.'
  },
  {
    id: 'charging', subject: '휴대폰 충전 거치대 사용 방법', sender: '시설관리팀', date: '오늘 15:20',
    body: '충전 거치대는 해당 장소에 전력이 공급되고 있을 때 사용할 수 있습니다. 지하 1층과 지하 2층은 별도 전력을 사용합니다.\n\n거치대에 휴대폰을 맡긴 동안에는 화면과 플래시를 사용할 수 없습니다. 휴대폰을 두고 이동할 수 있으니, 돌아와서 기기를 회수해 주세요.\n\n전력 공급이 끊기면 충전도 중단됩니다. 배터리가 부족할 때는 밝고 전력이 공급되는 장소에서 충전하세요.'
  },
  {
    id: 'security', subject: '야간 경비 로봇 순찰 안내', sender: '보안관리실', date: '오늘 13:50',
    body: '로비의 경비 로봇은 야간 순찰 중 움직임을 감지합니다. 경계 상태가 되면 모니터가 붉게 바뀌고 감지한 대상을 따라갑니다.\n\n로봇과 가까이 붙으면 양쪽 팔이 전개됩니다. 경계 중인 로봇에 접근하지 말고 거리를 확보해 주세요.\n\n어두운 곳에서 오래 머물면 정신력이 떨어질 수 있습니다. 조명이 켜진 장소에서 숨을 고르고 이동 경로를 확인하세요.'
  },
  {
    id: 'colleague', subject: '공유 자료 정리해 두었어요', sender: '조현아 · 설계팀', date: '오늘 12:05',
    body: '수호님, 사내 공유 폴더에 프로젝트 자료와 층별 안내를 정리해 두었어요. 파일 앱에서 제목이나 담당자 이름으로 검색하면 빨리 찾을 수 있어요.\n\n작업 중 기억할 내용은 업무 메모에 적고 저장해 주세요. 건물 안내 앱에서도 층별 시설과 전력 상태를 확인할 수 있어요.\n\n계산기는 평수나 일정 정리할 때 편하게 사용하세요. 저는 먼저 퇴근할게요!'
  }
].map(record => {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.computerMail = record.id;
  const title = document.createElement('strong');
  title.textContent = record.subject;
  const metadata = document.createElement('span');
  metadata.textContent = `${record.sender} · ${record.date}`;
  const status = document.createElement('small');
  status.className = 'computer-mail-read';
  button.append(title, metadata, status);
  button.addEventListener('click', () => {
    computerMailRead.add(record.id);
    filterComputerMail();
    computerMailList.hidden = true;
    document.getElementById('computer-mail-empty').hidden = true;
    document.getElementById('computer-mail-subject').textContent = record.subject;
    document.getElementById('computer-mail-meta').textContent = `${record.sender} → 정수호 · ${record.date}`;
    document.getElementById('computer-mail-body').textContent = record.body;
    computerMailReader.hidden = false;
    document.getElementById('computer-mail').scrollTop = 0;
    document.getElementById('computer-mail-back').focus();
  });
  computerMailList.append(button);
  return { record, button, status };
});

function filterComputerMail() {
  const query = computerMailSearch.value.trim().toLocaleLowerCase();
  let count = 0;
  let unread = 0;
  for (const { record, button, status } of computerMailRows) {
    button.hidden = !`${record.subject} ${record.sender} ${record.body}`.toLocaleLowerCase().includes(query);
    const read = computerMailRead.has(record.id);
    button.dataset.read = String(read);
    status.textContent = read ? '읽음' : '안 읽음';
    if (!button.hidden) { count++; if (!read) unread++; }
  }
  document.getElementById('computer-mail-count').textContent = `${count}개 메일 · 안 읽음 ${unread}개`;
  document.getElementById('computer-mail-empty').hidden = count !== 0 || !computerMailReader.hidden;
}
function showComputerMailInbox() {
  computerMailReader.hidden = true;
  computerMailList.hidden = false;
  filterComputerMail();
}
computerMailSearch.addEventListener('input', showComputerMailInbox);
document.getElementById('computer-mail-back').addEventListener('click', () => {
  showComputerMailInbox();
  computerMailSearch.focus();
});
showComputerMailInbox();

document.getElementById('computer-exit').addEventListener('click', exitComputer);
try {
  computerNote.value = localStorage.getItem('archi.office17.note') || '';
} catch {
  computerSaveStatus.textContent = '저장소를 읽을 수 없음';
}
computerNote.addEventListener('input', () => {
  computerSaveStatus.textContent = '저장되지 않음';
  playGameSound('keyboard');
});
computer.addEventListener('click', event => {
  if (usingComputer && event.target.closest('button:not(:disabled)')) playGameSound('mouse-click');
});
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
