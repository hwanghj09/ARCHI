// 직접 조작하는 장치(소품·설비의 control): 레버를 내리고, 열쇠를 돌리고, 전원선을 뽑는 일을 문구로 넘기지 않고 플레이어가 직접 한다.
// control은 단계 하나 또는 단계 목록이다(2층 영사기: 리모컨 버튼 → 디스크 투입). 단계마다 kind:
//   lever·switch(dir 'down'|'up'), plug(dir 'out'|'in'), card — 끝까지 끌어야 한다(놓으면 제자리로 돌아간다).
//   key·crank·clock — 시계 방향으로 turn도까지 돌린다. selector — 4층 UPS처럼 cycle 칸 하나를 골라 놓는다. press — 누른다.
// 마우스·터치로 끌거나 방향키(·WASD)로 움직이고, 버튼·선택은 Enter/Space/E로 누른다. 다 하면 원래 조사(문구·gives)가 이어진다.
// doneBy: gives가 없는 설비가 이미 조작됐는지 보는 물건(B1 CCTV는 seenBy). when: 지금만 조작하는 설비(12층 네트워크 랙).
const manualControl = document.getElementById('manual-control');
const manualControlDevice = document.getElementById('manual-control-device');
const manualControlLabel = document.getElementById('manual-control-label');
const manualControlHelp = document.getElementById('manual-control-help');
let controlDoor = null;
let controlSteps = [];
let controlStep = null; // { spec, value, target, done }
let controlDrag = null;

const LINEAR_CONTROLS = { lever: 170, switch: 70, plug: 150, card: 170 };
const ROTARY_CONTROLS = { key: 90, crank: 720, clock: 90 };

// 지금 조작해야 하는가: 필요한 물건이 모자라면(missingMessage를 먼저 보여야 하면) 아직 아니다.
function needsControl(door) {
  if (door.shutterLever) return true; // 16층 VU 셔터 레버는 누를 때마다 올리거나 내린다(doors.js toggleShutter).
  const { control } = door;
  if (!control) return false;
  if (door.controlPassed) { door.controlPassed = false; return false; }
  if (control.when) return Boolean(control.when());
  if ([].concat(door.requires || []).some(item => !collectedItems.has(item)) || (door.condition && !door.condition())) return false;
  if (door.sequence) return !collectedItems.has(door.sequence.gives) && door.element.dataset.done !== 'true';
  if (door.opens || door.cycle) return true;
  const doneBy = control.doneBy ?? door.gives;
  return doneBy ? !collectedItems.has(doneBy) : !door.controlDone;
}

function openControl(door) {
  controlDoor = door;
  controlSteps = [].concat(door.shutterLever ? shutterLeverStep(door) : door.control);
  usingControl = true;
  releaseInput();
  hint.hidden = true;
  interactionTime = 420;
  facing = body.position.x <= door.x + door.width / 2 ? 1 : -1;
  animate(0);
  document.getElementById('manual-control-title').textContent = door.name;
  manualControl.hidden = false;
  stage.inert = true;
  nextControlStep();
}

function closeControl() {
  if (!usingControl) return;
  usingControl = false;
  modalClosedAt = performance.now();
  controlDoor = null;
  controlStep = null;
  controlDrag = null;
  manualControl.hidden = true;
  stage.inert = false;
  stage.focus({ preventScroll: true });
}

function nextControlStep() {
  const spec = controlSteps.shift();
  if (!spec) return finishControl();
  const { kind } = spec;
  // 선택기는 소품의 cycle 칸을 고르거나, cycle이 없으면 spec.choices 중에서 고른다.
  const choices = kind === 'selector' ? spec.choices ?? controlDoor.cycle.states : null;
  controlStep = { spec, done: false, value: 0, target: LINEAR_CONTROLS[kind] ? 1 : spec.turn ?? ROTARY_CONTROLS[kind] ?? 1,
    choices, choice: choices ? spec.choices ? spec.initial ?? 0 : cycleState(controlDoor.cycle) : null };
  manualControlLabel.textContent = spec.label;
  manualControlHelp.textContent = kind === 'press' ? '클릭 · Enter / Space / E' :
    kind === 'selector' ? '돌려서 고르기 · ←/→ 고르고 Enter' :
    ROTARY_CONTROLS[kind] ? '원을 따라 돌리기 · → 방향키' :
    `${{ down: '아래로', up: '위로', out: '오른쪽으로 당겨', in: '왼쪽으로 밀어' }[spec.dir] ?? '오른쪽으로'} 끝까지 · 방향키`;
  manualControlDevice.className = `control-device control-${kind}`;
  manualControlDevice.dataset.dir = spec.dir || '';
  manualControlDevice.dataset.item = spec.item || '';
  manualControlDevice.dataset.done = 'false';
  manualControlDevice.setAttribute('aria-label', spec.label);
  manualControlDevice.replaceChildren(...buildControlParts(spec, choices));
  renderControl();
  manualControlDevice.focus({ preventScroll: true });
}

// 고정 바탕판과 움직이는 스프라이트를 겹친다. --p는 이동 정도, --angle은 회전 각도다.
function buildControlParts(spec, choices) {
  const part = (className, text) => {
    const element = document.createElement('div');
    element.className = className;
    if (text) element.textContent = text;
    return element;
  };
  const ends = (spec.ends || []).map((text, index) => part(`control-end control-end-${index}`, text));
  switch (spec.kind) {
    case 'lever': case 'switch': return [part('control-plate'), part('control-handle'), ...ends];
    case 'plug': return [part('control-socket', spec.socket), part('control-handle'), ...ends];
    case 'card': return [part('control-reader', spec.reader ?? '태그'), part('control-handle')];
    case 'press': return [part('control-plate'), part('control-handle', spec.text ?? '')];
    case 'selector': return [part('control-dial'), part('control-handle'),
      ...choices.map((text, index) => {
        const label = part('control-choice', text);
        label.style.setProperty('--at', `${selectorAngle(index, choices.length)}deg`);
        return label;
      })];
    default: return [part('control-dial'), part('control-handle'), ...ends];
  }
}

function selectorAngle(index, count) { return (index - (count - 1) / 2) * 70; }

function renderControl() {
  const step = controlStep;
  const { kind } = step.spec;
  if (kind === 'selector') {
    manualControlDevice.style.setProperty('--angle', `${controlDrag?.angle ?? selectorAngle(step.choice, step.choices.length)}deg`);
    manualControlDevice.querySelectorAll('.control-choice').forEach((label, index) => label.classList.toggle('active', index === step.choice));
    return;
  }
  manualControlDevice.style.setProperty('--p', String(step.value / step.target));
  manualControlDevice.style.setProperty('--angle', `${step.value}deg`);
}

function moveControl(amount) {
  const step = controlStep;
  if (!step || step.done) return;
  step.value = Math.max(0, Math.min(step.target, step.value + amount));
  renderControl();
  if (step.value >= step.target) completeControlStep();
}

function completeControlStep() {
  const step = controlStep;
  step.done = true;
  step.value = step.target;
  renderControl();
  manualControlDevice.dataset.done = 'true';
  controlDrag = null;
  const cue = step.spec.kind === 'card' ? 'card-scan' : step.spec.kind === 'plug' ? 'plug' :
    ['selector', 'key', 'crank', 'clock'].includes(step.spec.kind) ? 'dial' : step.spec.kind === 'press' ? 'mouse-click' : 'lever';
  playGameSound(cue);
  setTimeout(() => { if (controlStep === step) nextControlStep(); }, 380);
}

function finishControl() {
  const door = controlDoor;
  const choice = controlStep?.choice;
  closeControl();
  if (door.shutterLever) { toggleShutter(door); return; }
  door.controlDone = true;
  door.controlPassed = true;
  // 잠긴 방 문(12층 모델 평가실 카드 리더): 열리면 아래 interact가 그대로 방에 들어간다.
  if (door.type === 'room' && door.locked) {
    unlockRoomDoor(door);
  }
  if (door.cycle) door.controlChoice = choice;
  interact();
}

function pointerAngle(event) {
  const box = manualControlDevice.querySelector('.control-dial').getBoundingClientRect();
  return Math.atan2(event.clientX - box.left - box.width / 2, box.top + box.height / 2 - event.clientY) * 180 / Math.PI;
}

// 끌기: 직선 장치는 끈 거리, 회전 장치는 중심을 도는 각도만큼 움직인다. 직선 장치를 끝까지 못 끌고 놓으면 제자리로 돌아간다.
manualControlDevice.addEventListener('pointerdown', event => {
  const step = controlStep;
  if (!step || step.done || event.button !== 0) return;
  event.preventDefault();
  manualControlDevice.setPointerCapture(event.pointerId);
  const { kind, dir } = step.spec;
  if (kind === 'press') { completeControlStep(); return; }
  if (LINEAR_CONTROLS[kind]) {
    const vertical = kind === 'lever' || kind === 'switch';
    const sign = dir === 'up' || dir === 'in' ? -1 : 1;
    controlDrag = { origin: vertical ? event.clientY : event.clientX, vertical, sign, start: step.value };
    manualControlDevice.dataset.dragging = 'true';
    return;
  }
  controlDrag = { last: pointerAngle(event), angle: kind === 'selector' ? selectorAngle(step.choice, step.choices.length) : null };
  manualControlDevice.dataset.dragging = 'true';
});
manualControlDevice.addEventListener('pointermove', event => {
  const step = controlStep;
  if (!controlDrag || !step || step.done) return;
  const { kind } = step.spec;
  if (LINEAR_CONTROLS[kind]) {
    const travel = (controlDrag.vertical ? event.clientY : event.clientX) - controlDrag.origin;
    step.value = controlDrag.start;
    moveControl(controlDrag.sign * travel / LINEAR_CONTROLS[kind]);
    return;
  }
  const angle = pointerAngle(event);
  const delta = ((angle - controlDrag.last + 540) % 360) - 180;
  controlDrag.last = angle;
  if (kind === 'selector') {
    const limit = selectorAngle(step.choices.length - 1, step.choices.length) + 15;
    controlDrag.angle = Math.max(-limit, Math.min(limit, controlDrag.angle + delta));
    const count = step.choices.length;
    step.choice = Math.max(0, Math.min(count - 1, Math.round(controlDrag.angle / 70 + (count - 1) / 2)));
    renderControl();
    return;
  }
  // 거꾸로 돌리면 되감기만 하고, 한 번에 크게 튀는 각도(중심을 가로지른 움직임)는 버린다.
  if (Math.abs(delta) < 60) moveControl(delta);
});
const releaseControl = () => {
  const step = controlStep;
  if (!controlDrag || !step) return;
  manualControlDevice.dataset.dragging = 'false';
  const selecting = step.spec.kind === 'selector';
  controlDrag = null;
  if (selecting) { renderControl(); completeControlStep(); return; }
  if (!step.done && LINEAR_CONTROLS[step.spec.kind]) { step.value = 0; renderControl(); }
};
manualControlDevice.addEventListener('pointerup', releaseControl);
manualControlDevice.addEventListener('pointercancel', releaseControl);

const CONTROL_KEYS = { ArrowDown: 'down', KeyS: 'down', ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', KeyD: 'right', ArrowLeft: 'left', KeyA: 'left' };
manualControl.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Tab') return;
  if (event.code === 'Escape') { event.preventDefault(); closeControl(); return; }
  if (event.target.id === 'manual-control-close' && ['Enter', 'Space'].includes(event.code)) return;
  event.preventDefault();
  const step = controlStep;
  if (!step || step.done) return;
  const { kind, dir } = step.spec;
  const key = CONTROL_KEYS[event.code];
  const confirm = ['Enter', 'Space', 'KeyE'].includes(event.code);
  if (kind === 'press') { if (confirm && !event.repeat) completeControlStep(); return; }
  if (kind === 'selector') {
    if (confirm && !event.repeat) completeControlStep();
    else if (key === 'left' || key === 'right') {
      step.choice = Math.max(0, Math.min(step.choices.length - 1, step.choice + (key === 'right' ? 1 : -1)));
      renderControl();
    }
    return;
  }
  if (!key) return;
  if (LINEAR_CONTROLS[kind]) {
    const forward = { down: 'down', up: 'up', out: 'right', in: 'left' }[dir] ?? 'right';
    const backward = { down: 'up', up: 'down', right: 'left', left: 'right' }[forward];
    if (key === forward || key === backward) moveControl((key === forward ? 1 : -1) * 0.125);
    return;
  }
  const amount = Math.max(15, step.target / 12);
  if (key === 'right' || key === 'down') moveControl(amount);
  else moveControl(-amount);
});
document.getElementById('manual-control-close').addEventListener('click', closeControl);
