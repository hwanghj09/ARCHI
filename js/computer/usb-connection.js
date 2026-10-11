// 케이블은 컴퓨터를 사용하는 동안만 연결된다. 앱 설치 기록과 달리 저장하지 않는다.
const computerUsbBoard = document.getElementById('computer-usb-board');
const computerUsbPanel = document.getElementById('computer-usb-panel');
const computerUsbPlug = document.getElementById('computer-usb-plug');
const computerUsbPort = document.getElementById('computer-usb-port');
const computerUsbStatus = document.getElementById('computer-usb-status');
let computerUsbConnected = false;
let computerUsbArmed = false;
let computerUsbDrag = null;
let computerUsbBlocked = [];

function openComputerUsbConnection() {
  if (!computerUsbAvailable() || computerUsbConnected || !computerUsbPanel.hidden) return;
  computer.hidden = true;
  computerUsbPanel.hidden = false;
  computerUsbBlocked = [...document.body.children].filter(element => element !== computerUsbPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of computerUsbBlocked) element.inert = true;
  releaseInput();
  refreshComputerUsb();
  computerUsbPlug.focus({ preventScroll: true });
}

function closeComputerUsbConnection() {
  if (computerUsbPanel.hidden) return;
  cancelComputerUsbDrag();
  computerUsbArmed = false;
  computerUsbPanel.hidden = true;
  for (const element of computerUsbBlocked) element.inert = false;
  computerUsbBlocked = [];
  computer.hidden = !usingComputer;
  refreshSolarDownload();
  const target = document.getElementById(computerUsbConnected ? 'computer-solar-transfer' : 'computer-usb-open');
  (target.disabled ? document.getElementById('computer-window-close') : target).focus({ preventScroll: true });
}

function computerUsbAvailable() {
  return usingComputer && !transitioning && floorHasPower(17) && !phoneDock && phoneBattery > 0;
}

function computerUsbPoint(element) {
  const rect = element.getBoundingClientRect(), board = computerUsbBoard.getBoundingClientRect();
  return { x: rect.left + rect.width / 2 - board.left, y: rect.top + rect.height / 2 - board.top };
}

function drawComputerUsb() {
  if (!computerUsbBoard.getClientRects().length) return;
  const board = computerUsbBoard.getBoundingClientRect();
  const port = computerUsbPoint(computerUsbPort);
  const point = computerUsbDrag?.point || (computerUsbConnected ? { x: port.x, y: port.y + 16 } : { x: board.width * .48, y: 198 });
  computerUsbPlug.style.left = `${point.x}px`;
  computerUsbPlug.style.top = `${point.y}px`;
  const from = computerUsbPoint(document.getElementById('computer-usb-socket'));
  document.getElementById('computer-usb-cable').setAttribute('d', `M ${from.x} ${from.y} C ${from.x} 235, ${point.x} 235, ${point.x} ${point.y + 20}`);
}

function cancelComputerUsbDrag() {
  const drag = computerUsbDrag;
  computerUsbDrag = null;
  if (drag && computerUsbPlug.hasPointerCapture(drag.id)) computerUsbPlug.releasePointerCapture(drag.id);
  drawComputerUsb();
}

function refreshComputerUsb() {
  const available = computerUsbAvailable();
  if (!available) computerUsbConnected = false;
  if (!available || computerUsbPanel.hidden) {
    computerUsbArmed = false;
    cancelComputerUsbDrag();
  }
  computerUsbBoard.dataset.available = String(available);
  computerUsbBoard.dataset.connected = String(computerUsbConnected);
  computerUsbBoard.dataset.armed = String(computerUsbArmed);
  computerUsbPlug.disabled = computerUsbPort.disabled = !available || computerUsbConnected;
  computerUsbPlug.setAttribute('aria-pressed', String(computerUsbArmed || computerUsbConnected));
  computerUsbStatus.textContent = computerUsbConnected ? 'USB 연결됨 · 정수호의 휴대폰' :
    !available ? '컴퓨터 전력과 휴대폰 소지·배터리를 확인하세요.' : computerUsbArmed ? '휴대폰 아래 USB-C 포트를 선택하세요.' : 'USB 연결 안 됨 · 단자를 포트까지 끌어 주세요.';
  drawComputerUsb();
}

function connectComputerUsb() {
  if (!computerUsbAvailable() || computerUsbPanel.hidden) return;
  computerUsbConnected = true;
  computerUsbArmed = false;
  playGameSound('item-use');
  closeComputerUsbConnection();
}

computerUsbPlug.addEventListener('pointerdown', event => {
  if (event.button !== 0 || computerUsbPanel.hidden || !computerUsbAvailable() || computerUsbConnected) return;
  event.preventDefault();
  computerUsbPlug.focus({ preventScroll: true });
  computerUsbDrag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
  computerUsbPlug.setPointerCapture(event.pointerId);
});
computerUsbPlug.addEventListener('pointermove', event => {
  if (!computerUsbDrag || computerUsbDrag.id !== event.pointerId) return;
  if (Math.hypot(event.clientX - computerUsbDrag.startX, event.clientY - computerUsbDrag.startY) < 4 && !computerUsbDrag.moved) return;
  computerUsbDrag.moved = true;
  computerUsbArmed = false;
  computerUsbBoard.dataset.armed = 'false';
  const board = computerUsbBoard.getBoundingClientRect();
  computerUsbDrag.point = { x: Math.max(22, Math.min(board.width - 22, event.clientX - board.left)), y: Math.max(28, Math.min(board.height - 28, event.clientY - board.top)) };
  drawComputerUsb();
});
computerUsbPlug.addEventListener('pointerup', event => {
  if (!computerUsbDrag || computerUsbDrag.id !== event.pointerId) return;
  const moved = computerUsbDrag.moved;
  const port = computerUsbPort.getBoundingClientRect();
  cancelComputerUsbDrag();
  if (!moved) { computerUsbArmed = !computerUsbArmed; refreshComputerUsb(); return; }
  if (event.clientX >= port.left && event.clientX <= port.right && event.clientY >= port.top && event.clientY <= port.bottom) connectComputerUsb();
  else { refreshComputerUsb(); computerUsbStatus.textContent = '포트에 닿지 않았습니다. 단자를 다시 연결하세요.'; }
});
for (const event of ['pointercancel', 'lostpointercapture']) computerUsbPlug.addEventListener(event, cancelComputerUsbDrag);
computerUsbPlug.addEventListener('click', event => {
  if (event.detail !== 0 || computerUsbPlug.disabled) return;
  computerUsbArmed = !computerUsbArmed;
  refreshComputerUsb();
});
computerUsbPort.addEventListener('click', () => { if (computerUsbArmed) connectComputerUsb(); });
window.addEventListener('blur', cancelComputerUsbDrag);
new ResizeObserver(drawComputerUsb).observe(computerUsbBoard);
document.getElementById('computer-usb-open').addEventListener('click', openComputerUsbConnection);
document.getElementById('computer-usb-close').addEventListener('click', closeComputerUsbConnection);
computerUsbPanel.addEventListener('keydown', event => {
  if (event.code === 'Escape') { event.preventDefault(); event.stopPropagation(); closeComputerUsbConnection(); }
  if (event.code !== 'Tab') return;
  const buttons = [...computerUsbPanel.querySelectorAll('button:not(:disabled)')];
  const index = buttons.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); buttons.at(-1).focus(); }
  else if (!event.shiftKey && index === buttons.length - 1) { event.preventDefault(); buttons[0].focus(); }
});
