// 케이블은 컴퓨터를 사용하는 동안만 연결된다. 앱 설치 기록과 달리 저장하지 않는다.
const computerUsbBoard = document.getElementById('computer-usb-board');
const computerUsbPanel = document.getElementById('computer-usb-panel');
const computerUsbPhone = document.getElementById('computer-usb-phone');
const computerUsbPlug = document.getElementById('computer-usb-plug');
const computerUsbPort = document.getElementById('computer-usb-port');
const computerUsbStatus = document.getElementById('computer-usb-status');
let computerUsbConnected = false;
let computerUsbArmed = false;
let computerUsbDrag = null;
let computerUsbBlocked = [];
let computerUsbPositions = { phone: { x: .4, y: .42 }, plug: { x: .62, y: .84 } };
let computerUsbGeometry = null;

function openComputerUsbConnection() {
  if (!computerUsbAvailable() || computerUsbConnected || !computerUsbPanel.hidden) return;
  computerUsbPositions = { phone: { x: .4, y: .42 }, plug: { x: .62, y: .84 } };
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

function drawComputerUsb() {
  if (!computerUsbBoard.getClientRects().length) return;
  const { width, height, top } = computerUsbBoard.getBoundingClientRect();
  const phoneArt = document.getElementById('computer-usb-phone-art');
  const plugArt = document.getElementById('computer-usb-plug-art');
  const phoneHeight = Math.min(440, height * .7, width * .9 / .5);
  const phoneWidth = phoneHeight * (phoneArt.naturalWidth / phoneArt.naturalHeight || .5);
  const plugHeight = phoneHeight * .22;
  const plugWidth = plugHeight * (plugArt.naturalWidth / plugArt.naturalHeight || .5);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const phone = computerUsbPositions.phone, plug = computerUsbPositions.plug;
  phone.x = clamp(phone.x * width, phoneWidth / 2 + 8, width - phoneWidth / 2 - 8) / width;
  phone.y = clamp(phone.y * height, phoneHeight / 2 + 8, height - phoneHeight / 2 - 8) / height;
  plug.x = clamp(plug.x * width, Math.max(22, plugWidth / 2) + 8, width - Math.max(22, plugWidth / 2) - 8) / width;
  plug.y = clamp(plug.y * height, 8, height - plugHeight - 8) / height;
  Object.assign(computerUsbPhone.parentElement.style, { left: `${phone.x * width}px`, top: `${phone.y * height}px`, width: `${phoneWidth}px`, height: `${phoneHeight}px` });
  // 스프라이트 아래 중앙의 실제 소켓과 금속 단자 끝을 맞춘다.
  Object.assign(computerUsbPort.style, { top: `${phoneHeight * .985 - 22}px`, bottom: 'auto', height: '44px' });
  const port = { x: phone.x * width, y: phone.y * height + phoneHeight * .485 };
  const tip = { x: plug.x * width, y: plug.y * height };
  const hitWidth = Math.max(44, plugWidth + 12), hitHeight = Math.max(44, plugHeight);
  Object.assign(computerUsbPlug.style, { left: `${tip.x}px`, top: `${tip.y}px`, width: `${hitWidth}px`, height: `${hitHeight}px` });
  Object.assign(plugArt.style, { top: '0px', width: `${plugWidth}px`, height: `${plugHeight}px` });
  const cordWidth = plugWidth * .3, cordTop = tip.y + plugHeight - 1;
  Object.assign(document.getElementById('computer-usb-cable').style, { left: `${tip.x - cordWidth / 2}px`, top: `${cordTop}px`, width: `${cordWidth}px`, height: `${window.innerHeight - top - cordTop}px` });
  const aligned = Math.abs(tip.x - port.x) <= 14 && Math.abs(tip.y - port.y) <= 14;
  computerUsbGeometry = { phone: { x: phone.x * width, y: phone.y * height }, plug: tip, port, aligned };
  computerUsbBoard.dataset.aligned = String(aligned);
}

function cancelComputerUsbDrag() {
  const drag = computerUsbDrag;
  computerUsbDrag = null;
  if (drag && drag.element.hasPointerCapture(drag.id)) drag.element.releasePointerCapture(drag.id);
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
  computerUsbPhone.disabled = computerUsbPlug.disabled = computerUsbPort.disabled = !available || computerUsbConnected;
  computerUsbPlug.setAttribute('aria-pressed', String(computerUsbArmed || computerUsbConnected));
  computerUsbStatus.textContent = computerUsbConnected ? 'USB 연결됨' :
    !available ? '전력 또는 휴대폰 배터리 부족' : computerUsbArmed ? '휴대폰 아래 포트를 선택하세요.' : '';
  drawComputerUsb();
}

function connectComputerUsb() {
  if (!computerUsbAvailable() || computerUsbPanel.hidden) return;
  computerUsbConnected = true;
  computerUsbArmed = false;
  playGameSound('item-use');
  closeComputerUsbConnection();
}

for (const [kind, element] of [['phone', computerUsbPhone], ['plug', computerUsbPlug]]) {
  element.addEventListener('pointerdown', event => {
    if (event.button !== 0 || computerUsbDrag || computerUsbPanel.hidden || !computerUsbAvailable() || computerUsbConnected) return;
    event.preventDefault();
    element.focus({ preventScroll: true });
    const board = computerUsbBoard.getBoundingClientRect(), point = computerUsbGeometry[kind];
    computerUsbDrag = { id: event.pointerId, element, kind, startX: event.clientX, startY: event.clientY, offsetX: event.clientX - board.left - point.x, offsetY: event.clientY - board.top - point.y, moved: false };
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener('pointermove', event => {
    const drag = computerUsbDrag;
    if (!drag || drag.id !== event.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 4 && !drag.moved) return;
    drag.moved = true;
    computerUsbArmed = false;
    computerUsbBoard.dataset.armed = 'false';
    const board = computerUsbBoard.getBoundingClientRect();
    computerUsbPositions[kind] = { x: (event.clientX - board.left - drag.offsetX) / board.width, y: (event.clientY - board.top - drag.offsetY) / board.height };
    drawComputerUsb();
  });
  element.addEventListener('pointerup', event => {
    if (!computerUsbDrag || computerUsbDrag.id !== event.pointerId) return;
    const moved = computerUsbDrag.moved;
    cancelComputerUsbDrag();
    if (!moved) { if (kind === 'plug') computerUsbArmed = !computerUsbArmed; refreshComputerUsb(); return; }
    if (computerUsbGeometry.aligned) connectComputerUsb();
    else { refreshComputerUsb(); computerUsbStatus.textContent = '단자 끝을 포트에 맞춰 주세요.'; }
  });
  for (const event of ['pointercancel', 'lostpointercapture']) element.addEventListener(event, () => {
    if (computerUsbDrag?.element === element) cancelComputerUsbDrag();
  });
  element.addEventListener('keydown', event => {
    const moves = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
    if (!moves[event.key]) return;
    event.preventDefault();
    const board = computerUsbBoard.getBoundingClientRect();
    computerUsbPositions[kind].x += moves[event.key][0] / board.width;
    computerUsbPositions[kind].y += moves[event.key][1] / board.height;
    drawComputerUsb();
    if (computerUsbGeometry.aligned) connectComputerUsb();
  });
}
computerUsbPlug.addEventListener('click', event => {
  if (event.detail !== 0 || computerUsbPlug.disabled) return;
  computerUsbArmed = !computerUsbArmed;
  refreshComputerUsb();
});
computerUsbPort.addEventListener('click', () => { if (computerUsbArmed) connectComputerUsb(); });
window.addEventListener('blur', cancelComputerUsbDrag);
new ResizeObserver(drawComputerUsb).observe(computerUsbBoard);
for (const img of computerUsbBoard.querySelectorAll('img')) img.addEventListener('load', drawComputerUsb);
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
