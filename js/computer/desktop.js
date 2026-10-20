// 기존 앱의 DOM과 저장 로직을 유지하고 창·시작 메뉴·작업표시줄만 관리한다.
const COMPUTER_APPS = {
  files: { title: '파일 탐색기', icon: 'files' },
  notes: { title: '메모장', icon: 'notes', width: 660 },
  mail: { title: '사내 메일', icon: 'mail' },
  calculator: { title: '계산기', icon: 'calculator', width: 380, height: 510 },
  building: { title: '시설 안내', icon: 'building' },
  browser: { title: '블로그', icon: 'blog', width: 950, height: 580 },
  transfer: { title: '파일 전송', icon: 'transfer', width: 570, height: 390 },
  usbdrive: { title: '외부 저장 장치', icon: 'files', width: 660, height: 480 }, // 13층 백업 장치 영상(usb-video.js)
  document: { title: '문서', icon: 'notes' }
};
const computerWindows = new Map();
const computerStartMenu = document.getElementById('computer-start-menu');
const computerStartButton = document.getElementById('computer-start-button');
const computerStartSearch = document.getElementById('computer-start-search');
const computerContextMenu = document.getElementById('computer-context-menu');
let computerActiveWindow = null;
let computerWindowOrder = 0;
let computerWindowDrag = null;
let computerContextApp = null;
let computerDesktopHidden = [];
let computerRecentDocuments = [];

for (const [app, config] of Object.entries(COMPUTER_APPS)) {
  const element = document.getElementById('computer-window-frame').content.firstElementChild.cloneNode(true);
  const view = document.getElementById(`computer-${app}`);
  element.dataset.app = app;
  element.querySelector('[data-window-icon]').dataset.appIcon = config.icon;
  element.append(view);
  for (const edge of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
    const handle = document.createElement('div');
    handle.className = `computer-resize computer-resize-${edge}`;
    handle.dataset.resize = edge;
    handle.setAttribute('aria-hidden', 'true');
    element.append(handle);
  }
  computerWindow.append(element);
  const taskButton = document.createElement('button');
  taskButton.type = 'button';
  taskButton.dataset.computerTaskApp = app;
  taskButton.setAttribute('aria-label', config.title);
  taskButton.title = config.title;
  const icon = document.createElement('span');
  icon.className = 'app-art';
  icon.dataset.appIcon = config.icon;
  icon.setAttribute('aria-hidden', 'true');
  taskButton.append(icon);
  taskButton.hidden = app === 'document';
  document.getElementById('computer-taskbar-windows').append(taskButton);
  const state = { app, element, view, taskButton, open: false, minimized: false, maximized: false, normal: null };
  computerWindows.set(app, state);
  taskButton.addEventListener('click', () => {
    if (computerActiveWindow === state && !state.minimized) minimizeComputerWindow(state);
    else if (app === 'document' && state.open) showComputerWindow(state);
    else openComputerApp(app);
  });
  element.addEventListener('pointerdown', () => activateComputerWindow(state));
  element.addEventListener('focusin', () => activateComputerWindow(state));
  element.querySelector('[data-window-close]').addEventListener('click', () => closeComputerWindow(state));
  element.querySelector('[data-window-minimize]').addEventListener('click', () => minimizeComputerWindow(state));
  element.querySelector('[data-window-maximize]').addEventListener('click', () => maximizeComputerWindow(state));
  element.querySelector('.computer-titlebar').addEventListener('dblclick', event => {
    if (!event.target.closest('button')) maximizeComputerWindow(state);
  });
  for (const handle of element.querySelectorAll('.computer-titlebar, .computer-resize')) {
    handle.addEventListener('pointerdown', event => beginComputerWindowDrag(event, state));
    handle.addEventListener('pointermove', moveComputerWindowDrag);
    handle.addEventListener('pointerup', endComputerWindowDrag);
    handle.addEventListener('pointercancel', cancelComputerWindowDrag);
    handle.addEventListener('lostpointercapture', cancelComputerWindowDrag);
  }
}

function refreshComputerWindows() {
  computerWindow.hidden = ![...computerWindows.values()].some(state => state.open && !state.minimized);
  for (const state of computerWindows.values()) {
    state.taskButton.dataset.running = String(state.open);
    state.taskButton.dataset.active = String(state === computerActiveWindow && !state.minimized);
    state.taskButton.setAttribute('aria-pressed', state.taskButton.dataset.active);
    state.taskButton.hidden = state.app === 'document' && !state.open;
    state.element.dataset.active = state.taskButton.dataset.active;
  }
}

function activateComputerWindow(state) {
  if (!state.open || state.minimized) return;
  if (computerActiveWindow !== state) {
    computerActiveWindow = state;
    state.element.style.zIndex = String(++computerWindowOrder);
  }
  for (const other of computerWindows.values()) {
    other.element.querySelector('[data-window-close]').removeAttribute('id');
    other.element.querySelector('[data-window-title]').removeAttribute('id');
  }
  state.element.querySelector('[data-window-close]').id = 'computer-window-close';
  state.element.querySelector('[data-window-title]').id = 'computer-window-title';
  refreshComputerWindows();
}

function layoutComputerWindow(state) {
  const bounds = computerWindow.getBoundingClientRect();
  if (!bounds.width || !bounds.height || !state.normal) return;
  const rect = state.normal;
  rect.width = Math.max(Math.min(320, bounds.width), Math.min(bounds.width, rect.width));
  rect.height = Math.max(Math.min(210, bounds.height), Math.min(bounds.height, rect.height));
  rect.x = Math.max(0, Math.min(bounds.width - rect.width, rect.x));
  rect.y = Math.max(0, Math.min(bounds.height - rect.height, rect.y));
  const visible = state.maximized ? { x: 0, y: 0, width: bounds.width, height: bounds.height } : rect;
  Object.assign(state.element.style, { left: `${visible.x}px`, top: `${visible.y}px`, width: `${visible.width}px`, height: `${visible.height}px` });
  state.element.dataset.maximized = String(state.maximized);
  const maximize = state.element.querySelector('[data-window-maximize]');
  maximize.setAttribute('aria-label', state.maximized ? '이전 크기로 복원' : '최대화');
  maximize.title = maximize.getAttribute('aria-label');
}

function showComputerWindow(state, title) {
  closeComputerStartMenu();
  computerContextMenu.hidden = true;
  const first = !state.open;
  state.open = true;
  state.minimized = false;
  state.element.hidden = state.view.hidden = false;
  computerWindow.hidden = false;
  if (title) {
    state.element.querySelector('[data-window-title]').textContent = title;
    state.element.setAttribute('aria-label', title);
    state.taskButton.setAttribute('aria-label', title);
    state.taskButton.title = title;
  }
  if (!state.normal) {
    const bounds = computerWindow.getBoundingClientRect(), config = COMPUTER_APPS[state.app];
    const index = [...computerWindows.keys()].indexOf(state.app);
    state.normal = { x: 160 + index * 20, y: 36 + index * 20, width: config.width || 800, height: config.height || 550 };
    state.maximized = bounds.width < 640 || bounds.height < 420;
  }
  layoutComputerWindow(state);
  activateComputerWindow(state);
  if (!first) state.element.querySelector('[data-window-close]').focus({ preventScroll: true });
}

function focusNextComputerWindow() {
  computerActiveWindow = null;
  const next = [...computerWindows.values()].filter(state => state.open && !state.minimized).sort((a, b) => Number(b.element.style.zIndex) - Number(a.element.style.zIndex))[0];
  if (next) {
    activateComputerWindow(next);
    next.element.querySelector('[data-window-close]').focus({ preventScroll: true });
  }
  refreshComputerWindows();
}

function minimizeComputerWindow(state) {
  cancelComputerWindowDrag();
  state.minimized = true;
  state.element.hidden = state.view.hidden = true;
  focusNextComputerWindow();
  if (!computerActiveWindow) state.taskButton.focus({ preventScroll: true });
}

function closeComputerWindow(state) {
  cancelComputerWindowDrag();
  state.open = false;
  state.minimized = false;
  state.element.hidden = state.view.hidden = true;
  focusNextComputerWindow();
  if (!computerActiveWindow) computerStartButton.focus({ preventScroll: true });
  refreshSolarDownload();
}

function maximizeComputerWindow(state) {
  cancelComputerWindowDrag();
  state.maximized = !state.maximized;
  layoutComputerWindow(state);
  activateComputerWindow(state);
}

function beginComputerWindowDrag(event, state) {
  if (event.button !== 0 || event.target.closest('button') || computerWindowDrag) return;
  event.preventDefault();
  const bounds = state.element.getBoundingClientRect();
  computerWindowDrag = { state, handle: event.currentTarget, id: event.pointerId, edge: event.currentTarget.dataset.resize, x: event.clientX, y: event.clientY, rect: { ...state.normal }, moved: false, grab: (event.clientX - bounds.left) / bounds.width };
  event.currentTarget.setPointerCapture(event.pointerId);
  computerContextMenu.hidden = true;
}

function moveComputerWindowDrag(event) {
  const drag = computerWindowDrag;
  if (!drag || drag.id !== event.pointerId) return;
  const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  drag.moved = true;
  const state = drag.state, bounds = computerWindow.getBoundingClientRect();
  if (state.maximized) {
    if (drag.edge) return;
    state.maximized = false;
    drag.rect.x = event.clientX - bounds.left - drag.rect.width * drag.grab - dx;
    drag.rect.y = event.clientY - bounds.top - 18 - dy;
  }
  const rect = { ...drag.rect };
  if (!drag.edge) { rect.x += dx; rect.y += dy; }
  else {
    const minWidth = Math.min(320, bounds.width), minHeight = Math.min(210, bounds.height);
    if (drag.edge.includes('e')) rect.width = Math.max(minWidth, Math.min(bounds.width - rect.x, rect.width + dx));
    if (drag.edge.includes('s')) rect.height = Math.max(minHeight, Math.min(bounds.height - rect.y, rect.height + dy));
    if (drag.edge.includes('w')) { rect.x = Math.max(0, Math.min(drag.rect.x + dx, drag.rect.x + drag.rect.width - minWidth)); rect.width = drag.rect.width + drag.rect.x - rect.x; }
    if (drag.edge.includes('n')) { rect.y = Math.max(0, Math.min(drag.rect.y + dy, drag.rect.y + drag.rect.height - minHeight)); rect.height = drag.rect.height + drag.rect.y - rect.y; }
  }
  state.normal = rect;
  layoutComputerWindow(state);
}

function endComputerWindowDrag(event) {
  const drag = computerWindowDrag;
  if (!drag || drag.id !== event.pointerId) return;
  if (drag.moved && !drag.edge && event.clientY <= computerWindow.getBoundingClientRect().top + 12) drag.state.maximized = true;
  layoutComputerWindow(drag.state);
  cancelComputerWindowDrag();
}

function cancelComputerWindowDrag() {
  const drag = computerWindowDrag;
  computerWindowDrag = null;
  if (drag?.handle.hasPointerCapture(drag.id)) drag.handle.releasePointerCapture(drag.id);
}
window.addEventListener('blur', cancelComputerWindowDrag);
new ResizeObserver(() => { for (const state of computerWindows.values()) layoutComputerWindow(state); }).observe(computerWindow);

function closeComputerStartMenu() {
  computerStartMenu.hidden = true;
  computerStartButton.setAttribute('aria-expanded', 'false');
}
function toggleComputerStartMenu() {
  if (!computerStartMenu.hidden) { closeComputerStartMenu(); computerStartButton.focus(); return; }
  computerContextMenu.hidden = true;
  computerStartMenu.hidden = false;
  computerStartButton.setAttribute('aria-expanded', 'true');
  computerStartSearch.value = '';
  filterComputerStartMenu();
  computerStartSearch.focus();
}
const startApps = document.getElementById('computer-start-apps');
for (const shortcut of computer.querySelectorAll('.computer-shortcuts [data-computer-app]')) {
  const button = shortcut.cloneNode(true);
  button.dataset.startApp = button.dataset.computerApp;
  delete button.dataset.computerApp;
  button.addEventListener('click', () => openComputerApp(button.dataset.startApp));
  startApps.append(button);
  shortcut.addEventListener('click', event => {
    for (const icon of computer.querySelectorAll('.computer-shortcuts button')) icon.dataset.selected = String(icon === shortcut);
    if (event.detail === 0 || event.pointerType === 'touch') openComputerApp(shortcut.dataset.computerApp);
  });
  shortcut.addEventListener('dblclick', () => openComputerApp(shortcut.dataset.computerApp));
}
computer.querySelectorAll('[data-computer-app]:not(.computer-shortcuts button)').forEach(button => {
  button.addEventListener('click', () => openComputerApp(button.dataset.computerApp));
});
function filterComputerStartMenu() {
  const query = computerStartSearch.value.trim().toLocaleLowerCase();
  for (const button of startApps.children) button.hidden = !`${button.textContent} ${COMPUTER_APPS[button.dataset.startApp].title}`.toLocaleLowerCase().includes(query);
  const records = query ? officeDocuments.filter(record => `${record.title} ${record.owner}`.toLocaleLowerCase().includes(query)) :
    computerRecentDocuments.map(id => officeDocuments.find(record => record.id === id)).slice(0, 3);
  document.getElementById('computer-start-documents').replaceChildren(...records.map(record => {
    const button = document.createElement('button');
    button.type = 'button';
    const icon = new Image(); icon.src = 'assets/vendor/lucide/file-text.svg'; icon.alt = '';
    button.append(icon, document.createTextNode(record.title));
    button.addEventListener('click', () => openComputerApp('document', record.id));
    return button;
  }));
  document.getElementById('computer-recent-title').textContent = query ? '문서' : '최근 문서';
  document.getElementById('computer-recent-title').hidden = !query && !records.length;
  document.getElementById('computer-start-empty').hidden = records.length > 0 || [...startApps.children].some(button => !button.hidden);
}
computerStartSearch.addEventListener('input', filterComputerStartMenu);
computerStartSearch.addEventListener('keydown', event => {
  if (event.key === 'Enter') (startApps.querySelector('button:not([hidden])') || document.querySelector('#computer-start-documents button'))?.click();
});
computerStartButton.addEventListener('click', toggleComputerStartMenu);
document.getElementById('computer-start-exit').addEventListener('click', exitComputer);

computer.addEventListener('pointerdown', event => {
  if (!event.target.closest('#computer-start-menu, #computer-start-button')) closeComputerStartMenu();
  if (!event.target.closest('#computer-context-menu')) computerContextMenu.hidden = true;
  if (!event.target.closest('button, .computer-app-window, #computer-start-menu, #computer-context-menu')) {
    for (const icon of computer.querySelectorAll('.computer-shortcuts button')) icon.dataset.selected = 'false';
  }
});
computer.addEventListener('contextmenu', event => {
  if (event.target.closest('.computer-app-window, .computer-taskbar, #computer-start-menu')) return;
  event.preventDefault();
  closeComputerStartMenu();
  computerContextApp = event.target.closest('[data-computer-app]')?.dataset.computerApp;
  document.getElementById('computer-context-open').hidden = !computerContextApp;
  computerContextMenu.hidden = false;
  const bounds = computerContextMenu.getBoundingClientRect(), desktop = computer.getBoundingClientRect();
  computerContextMenu.style.left = `${Math.min(event.clientX, desktop.width - bounds.width - 8)}px`;
  computerContextMenu.style.top = `${Math.min(event.clientY, desktop.height - bounds.height - 60)}px`;
  computerContextMenu.querySelector('button:not([hidden])').focus();
});
document.getElementById('computer-context-open').addEventListener('click', () => openComputerApp(computerContextApp));
document.getElementById('computer-context-refresh').addEventListener('click', () => { computerContextMenu.hidden = true; computer.focus(); });
document.getElementById('computer-context-sort').addEventListener('click', () => {
  const shortcuts = computer.querySelector('.computer-shortcuts');
  [...shortcuts.children].sort((a, b) => a.textContent.localeCompare(b.textContent, 'ko')).forEach(icon => shortcuts.append(icon));
  computerContextMenu.hidden = true;
});

function showComputerDesktop() {
  const visible = [...computerWindows.values()].filter(state => state.open && !state.minimized);
  if (visible.length) { computerDesktopHidden = visible; for (const state of visible) minimizeComputerWindow(state); }
  else {
    for (const state of computerDesktopHidden) if (state.open) showComputerWindow(state);
    computerDesktopHidden = [];
  }
}
document.getElementById('computer-show-desktop').addEventListener('click', showComputerDesktop);
computer.addEventListener('keydown', event => {
  if (event.key === 'Escape' && (!computerStartMenu.hidden || !computerContextMenu.hidden)) {
    event.preventDefault(); event.stopPropagation(); closeComputerStartMenu(); computerContextMenu.hidden = true; computerStartButton.focus();
  }
  if (event.altKey && event.key === 'F4') { event.preventDefault(); if (computerActiveWindow) closeComputerApp(); }
  if (event.altKey && event.key === 'Tab') {
    event.preventDefault();
    const running = [...computerWindows.values()].filter(state => state.open);
    const index = running.indexOf(computerActiveWindow);
    const next = running[(index + (event.shiftKey ? running.length - 1 : 1)) % running.length];
    if (next) showComputerWindow(next);
  }
  if (event.ctrlKey && event.key.toLowerCase() === 's' && computerActiveWindow?.app === 'notes') { event.preventDefault(); document.getElementById('computer-save').click(); }
});
function resetComputerDesktop() {
  cancelComputerWindowDrag();
  closeComputerStartMenu();
  computerContextMenu.hidden = true;
  computerDesktopHidden = [];
  computerActiveWindow = null;
  computerWindowOrder = 0;
  for (const state of computerWindows.values()) {
    state.open = state.minimized = state.maximized = false;
    state.normal = null;
    state.element.hidden = state.view.hidden = true;
  }
  refreshComputerWindows();
  if (typeof refreshUsbDrive === 'function') refreshUsbDrive(); // 13층 백업 장치를 가졌으면 바탕화면에 외부 저장 장치(usb-video.js)
}
// 게임 속은 자정이다: 휴대폰 상태 표시줄처럼 시각은 00:00으로 둔다(날짜만 오늘).
function refreshComputerClock() {
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  document.getElementById('computer-clock').textContent = `00:00\n${midnight.toLocaleDateString('ko-KR')}`;
  document.getElementById('computer-clock').dateTime = midnight.toISOString();
}
refreshComputerClock();
setInterval(refreshComputerClock, 60000);
