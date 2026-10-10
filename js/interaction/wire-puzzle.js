// 옥상 배전반 전선 퍼즐(어몽어스 'Fix Wiring' 방식): 왼쪽 전선 끝을 당겨 같은 색 오른쪽 단자에 놓으면 연결된다.
// 단서 없이 색만 보고 푸는 퍼즐이라 양쪽 다 순서를 무작위로 섞는다. 포인터 드래그가 기본이고, 클릭으로 왼쪽을
// 먼저 고른 뒤 오른쪽을 클릭하는 방식도 함께 지원한다(키보드·터치 보조).
const WIRE_COLORS = [
  { id: 'red', label: '빨강', hex: '#d8453a' },
  { id: 'yellow', label: '노랑', hex: '#d9b03a' },
  { id: 'blue', label: '파랑', hex: '#3a7ad8' },
  { id: 'green', label: '초록', hex: '#3fae5c' },
];
// wire-cable.png는 빨강 한 장만 있다(assets/ui/wire-puzzle/CABLE-PROMPT.md) — 나머지 색은 그 빨강의
// 실측 색상각(≈4°) 기준 상대 회전각만큼 CSS hue-rotate()로 우려낸다. 소켓 색(WIRE_COLORS의 hex)과
// 어울리도록 그 색들의 HSL 색상각 차이로 계산했다.
const WIRE_HUE_ROTATE = { red: 0, yellow: 40, blue: 212, green: 132 };
const wirePanel = document.getElementById('wire-panel');
const wireBoard = document.getElementById('wire-board');
const wireLeft = document.getElementById('wire-left');
const wireRight = document.getElementById('wire-right');
const wireStatus = document.getElementById('wire-status');
let wireBlocked = [];
let wireOnSolved = null;
let wireConnected = new Set();
let wireArmed = null;
let wireDrag = null;

function shuffledWireColors() {
  const list = [...WIRE_COLORS];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function wirePlugCenter(button) {
  const boardRect = wireBoard.getBoundingClientRect();
  const rect = button.getBoundingClientRect();
  const fromLeft = button.parentElement === wireLeft;
  return { x: (fromLeft ? rect.right : rect.left) - boardRect.left, y: rect.top + rect.height / 2 - boardRect.top };
}

function buildWireColumn(container, side, order) {
  container.replaceChildren();
  for (const color of order) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.color = color.id;
    button.dataset.side = side;
    button.style.setProperty('--wire-color', color.hex);
    button.setAttribute('aria-label', `${color.label} 전선 ${side === 'left' ? '왼쪽 끝' : '오른쪽 단자'}`);
    container.append(button);
  }
}

function openWirePanel(onSolved) {
  wireOnSolved = onSolved;
  wireConnected = new Set();
  wireArmed = null;
  wireDrag = null;
  // 그림의 아래쪽 명판 한 줄(#wire-status)이 안내문과 진행 상황을 함께 보여준다 — 첫 연결부터는
  // attemptConnection()이 이 자리를 덮어쓴다.
  wireStatus.textContent = '왼쪽 전선 끝을 당기거나 클릭해 같은 색 오른쪽 단자에 연결하자.';
  buildWireColumn(wireLeft, 'left', shuffledWireColors());
  buildWireColumn(wireRight, 'right', shuffledWireColors());
  for (const cable of wireBoard.querySelectorAll('.wire-cable')) cable.remove();
  wirePanel.hidden = false;
  releaseInput();
  wireBlocked = [...document.body.children].filter(element => element !== wirePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of wireBlocked) element.inert = true;
  stage.inert = true;
  wireLeft.querySelector('button')?.focus();
}

function closeWirePanel() {
  if (wirePanel.hidden) return;
  wirePanel.hidden = true;
  for (const element of wireBlocked) element.inert = false;
  wireBlocked = [];
  stage.inert = false;
  // 전선 패널은 항상 옥상 전력 패널에서만 열린다 — 풀었든 나중에로 취소했든 전력 패널로 돌아간다.
  openPowerPanel();
}

// 두 점을 실제 전선 그림(wire-cable.png, 가로로 반복되는 타일)으로 잇는다. 왼쪽 몇 번째 줄이
// 오른쪽 몇 번째 줄과 이어질지 매번 랜덤이라 선의 길이·각도가 매번 달라지므로, 고정된 그림 한
// 장 대신 두 점 사이 거리만큼 가로로 늘어나는 띠(div, background-repeat: repeat-x)를 그 각도로
// 돌려서 쓴다(assets/ui/wire-puzzle/CABLE-PROMPT.md 참고).
function drawWireLine(id, from, to, colorId) {
  let cable = wireBoard.querySelector(`.wire-cable[data-wire="${id}"]`);
  if (!cable) {
    cable = document.createElement('div');
    cable.className = 'wire-cable';
    cable.dataset.wire = id;
    wireBoard.append(cable);
  }
  const dx = to.x - from.x, dy = to.y - from.y;
  cable.style.width = `${Math.hypot(dx, dy)}px`;
  cable.style.left = `${from.x}px`;
  cable.style.top = `${from.y}px`;
  cable.style.transform = `rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)`;
  cable.style.filter = `hue-rotate(${WIRE_HUE_ROTATE[colorId] ?? 0}deg)`;
}

function removeWireLine(id) {
  wireBoard.querySelector(`.wire-cable[data-wire="${id}"]`)?.remove();
}

function setArmed(button) {
  wireArmed?.classList.remove('armed');
  wireArmed = button || null;
  wireArmed?.classList.add('armed');
}

// 왼쪽 전선(color)을 오른쪽 단자(target)에 연결 시도한다. 색이 같고 아직 안 이어졌으면 성공.
function attemptConnection(leftButton, rightButton) {
  if (leftButton.dataset.color !== rightButton.dataset.color) {
    wireStatus.textContent = '색이 맞지 않는다.';
    playGameSound('deny');
    return false;
  }
  const color = WIRE_COLORS.find(entry => entry.id === leftButton.dataset.color);
  leftButton.disabled = true; rightButton.disabled = true;
  leftButton.classList.add('connected'); rightButton.classList.add('connected');
  drawWireLine(color.id, wirePlugCenter(leftButton), wirePlugCenter(rightButton), color.id);
  wireConnected.add(color.id);
  playGameSound('item-use');
  wireStatus.textContent = `${color.label} 전선을 연결했다.`;
  if (wireConnected.size === WIRE_COLORS.length) {
    // 지연 없이 바로 닫는다 — 잠깐이라도 열어 두면 그 틈에 Esc를 눌러 이 닫기와 타이머로 예약된 닫기가
    // 겹쳐서(이중 close) 입력이 먹통되는 경합이 생겼었다.
    const solved = wireOnSolved;
    closeWirePanel();
    solved?.();
  }
  return true;
}

wireLeft.addEventListener('pointerdown', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  event.preventDefault();
  wireDrag = { button, moved: false, pointerId: event.pointerId };
  button.setPointerCapture(event.pointerId);
});
wireLeft.addEventListener('pointermove', event => {
  if (!wireDrag || event.pointerId !== wireDrag.pointerId) return;
  if (!wireDrag.moved) setArmed(null); // a real drag starts: leave the click-to-arm flow
  wireDrag.moved = true;
  const boardRect = wireBoard.getBoundingClientRect();
  drawWireLine('drag', wirePlugCenter(wireDrag.button),
    { x: event.clientX - boardRect.left, y: event.clientY - boardRect.top }, wireDrag.button.dataset.color);
});
function endWireDrag(event) {
  if (!wireDrag || event.pointerId !== wireDrag.pointerId) return;
  const { button, moved } = wireDrag;
  wireDrag = null;
  removeWireLine('drag');
  if (!moved) { setArmed(wireArmed === button ? null : button); return; }
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('button');
  if (target?.parentElement === wireRight && !target.disabled) attemptConnection(button, target);
}
wireLeft.addEventListener('pointerup', endWireDrag);
wireLeft.addEventListener('pointercancel', () => { wireDrag = null; removeWireLine('drag'); });
// 마우스·터치는 전부 포인터 이벤트로 처리한다(위). event.detail === 0은 Enter/Space 같은 키보드 활성화에서만
// 참이라, 이 리스너는 키보드 전용으로 걸려도 마우스 클릭과 겹쳐 두 번 토글되지 않는다.
wireLeft.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || event.detail !== 0) return;
  setArmed(wireArmed === button ? null : button);
});
wireRight.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || !wireArmed) return;
  attemptConnection(wireArmed, button);
  setArmed(null);
});
document.getElementById('wire-cancel').addEventListener('click', closeWirePanel);
wirePanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeWirePanel(); }
});
