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
// 어울리도록 그 색들의 HSL 색상각 차이로 계산했다. 노랑은 색상각만 돌리면 어두운 빨강이 주황·갈색으로
// 남아서 조금 더 돌리고 밝기를 올려 소켓 노랑(#d9b03a)에 맞춘다.
const WIRE_CABLE_FILTER = { red: 'none', yellow: 'hue-rotate(58deg) brightness(2)', blue: 'hue-rotate(212deg)', green: 'hue-rotate(132deg)' };
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
let wireMode = 'solar';
let wireTargets = new Map();

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
    const circuit = wireMode === 'elevator' && EMERGENCY_CIRCUITS.find(circuit => circuit.color === color.id);
    button.textContent = circuit ? side === 'left' ? circuit.source : circuit.target : '';
    button.setAttribute('aria-label', circuit ? `${side === 'left' ? '전력 공급' : '엘리베이터'} 단자 ${button.textContent}` :
      `${color.label} 전선 ${side === 'left' ? '왼쪽 끝' : '오른쪽 단자'}`);
    container.append(button);
  }
}

function openWirePanel(onSolved, mode = 'solar') {
  wireMode = mode;
  wirePanel.dataset.mode = mode;
  const elevator = mode === 'elevator';
  document.getElementById('wire-title').textContent = elevator ? '비상 전력 회선 연결' : '배전반 내부';
  wirePanel.querySelector('.wire-art img').src = elevator ? 'assets/ui/floor17/emergency-panel-states.png' : 'assets/ui/wire-puzzle/wire-panel.png';
  const reference = document.getElementById('wire-reference');
  reference.hidden = !elevator;
  reference.open = false;
  const rows = document.getElementById('wire-reference-rows');
  rows.replaceChildren();
  if (elevator) for (const [from, to] of [
    ...EMERGENCY_CIRCUITS.map(circuit => [circuit.source, circuit.relay]),
    ...[...EMERGENCY_CIRCUITS].sort((a, b) => a.relay.localeCompare(b.relay)).map(circuit => [circuit.relay, circuit.target]),
  ]) {
    const row = document.createElement('tr');
    for (const text of [from, '→', to]) {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.append(cell);
    }
    rows.append(row);
  }
  document.getElementById('wire-test').hidden = !elevator;
  wireOnSolved = onSolved;
  wireConnected = new Set();
  wireTargets = new Map();
  wireArmed = null;
  wireDrag = null;
  // 그림의 아래쪽 명판 한 줄(#wire-status)이 안내문과 진행 상황을 함께 보여준다 — 첫 연결부터는
  // attemptConnection()이 이 자리를 덮어쓴다.
  wireStatus.textContent = elevator ? 'S→R→E로 연결 · 회로 검사 · 공급 단자를 누르면 해제' : '왼쪽 전선 끝을 당기거나 클릭해 같은 색 오른쪽 단자에 연결하자.';
  buildWireColumn(wireLeft, 'left', elevator ? WIRE_COLORS : shuffledWireColors());
  buildWireColumn(wireRight, 'right', elevator ? [...WIRE_COLORS].sort((a, b) =>
    EMERGENCY_CIRCUITS.find(c => c.color === a.id).target.localeCompare(EMERGENCY_CIRCUITS.find(c => c.color === b.id).target)) : shuffledWireColors());
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
  modalClosedAt = performance.now();
  wireDrag = null;
  wireOnSolved = null;
  setArmed(null);
  for (const element of wireBlocked) element.inert = false;
  wireBlocked = [];
  stage.inert = false;
  if (wireMode === 'solar') openPowerPanel();
  else stage.focus({ preventScroll: true });
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
  cable.style.filter = WIRE_CABLE_FILTER[colorId] ?? 'none';
}

function removeWireLine(id) {
  wireBoard.querySelector(`.wire-cable[data-wire="${id}"]`)?.remove();
}

function setArmed(button) {
  wireArmed?.classList.remove('armed');
  wireArmed = button || null;
  wireArmed?.classList.add('armed');
}

function detachWire(button) {
  const target = wireTargets.get(button.dataset.color);
  if (!target) return;
  target.disabled = false;
  target.classList.remove('connected');
  button.classList.remove('connected');
  wireTargets.delete(button.dataset.color);
  wireConnected.delete(button.dataset.color);
  removeWireLine(button.dataset.color);
}

function finishWirePuzzle() {
  const solved = wireOnSolved;
  closeWirePanel();
  solved?.();
}

function testEmergencyCircuit() {
  if (wirePanel.hidden || wireMode !== 'elevator') return;
  if (wireConnected.size !== 4) {
    wireStatus.textContent = `네 가닥을 모두 연결해야 검사할 수 있다. 현재 ${wireConnected.size}/4.`;
    playGameSound('deny');
    return;
  }
  const wrong = EMERGENCY_CIRCUITS.filter(circuit => wireTargets.get(circuit.color)?.dataset.color !== circuit.color);
  if (wrong.length) {
    wireStatus.textContent = wrong.some(circuit => circuit.color === 'green') ? '접지 연속성 불량. 통전 차단. 안내도를 보고 다시 연결하자.' :
      '구동·제어 회로 불일치. 통전 차단. 중계 릴레이 경로를 다시 확인하자.';
    playGameSound('deny');
    return;
  }
  finishWirePuzzle();
}

// 옥상은 같은 색을 즉시 고정하고, 관리실은 오접속도 남겨 둔 뒤 별도 회로 검사로 판단한다.
function attemptConnection(leftButton, rightButton) {
  if (wirePanel.hidden || leftButton.parentElement !== wireLeft || rightButton.parentElement !== wireRight ||
      leftButton.disabled || rightButton.disabled) return false;
  if (wireMode !== 'elevator' && leftButton.dataset.color !== rightButton.dataset.color) {
    wireStatus.textContent = '색이 맞지 않는다.';
    playGameSound('deny');
    return false;
  }
  const color = WIRE_COLORS.find(entry => entry.id === leftButton.dataset.color);
  if (wireMode === 'elevator') detachWire(leftButton);
  leftButton.disabled = wireMode !== 'elevator'; rightButton.disabled = true;
  leftButton.classList.add('connected'); rightButton.classList.add('connected');
  drawWireLine(color.id, wirePlugCenter(leftButton), wirePlugCenter(rightButton), color.id);
  wireConnected.add(color.id);
  wireTargets.set(color.id, rightButton);
  playGameSound('item-use');
  const circuit = wireMode === 'elevator' && EMERGENCY_CIRCUITS.find(circuit => circuit.color === color.id);
  wireStatus.textContent = circuit ? `${circuit.source} → ${rightButton.textContent} 연결 · ${wireConnected.size}/4 · 검사 전까지 통전 금지` : `${color.label} 전선을 연결했다.`;
  if (wireMode !== 'elevator' && wireConnected.size === WIRE_COLORS.length) {
    // 지연 없이 바로 닫는다 — 잠깐이라도 열어 두면 그 틈에 Esc를 눌러 이 닫기와 타이머로 예약된 닫기가
    // 겹쳐서(이중 close) 입력이 먹통되는 경합이 생겼었다.
    finishWirePuzzle();
  }
  return true;
}

wireLeft.addEventListener('pointerdown', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  event.preventDefault();
  if (wireMode === 'elevator') detachWire(button);
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
  if (wireMode === 'elevator') detachWire(button);
  setArmed(wireArmed === button ? null : button);
});
wireRight.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled || !wireArmed) return;
  attemptConnection(wireArmed, button);
  setArmed(null);
});
document.getElementById('wire-cancel').addEventListener('click', closeWirePanel);
document.getElementById('wire-test').addEventListener('click', testEmergencyCircuit);
wirePanel.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); closeWirePanel(); }
});
