// 소품 장치: 울리는 전화(ring)와 차례대로 조사하는 소품 묶음(sequences).
// 방의 전화(ring)는 들어온 뒤 after ms에 울리기 시작해 duration ms 뒤에 끊긴다. 끊기면 방에 다시 들어와야 또 울린다.
function updateCall() {
  if (!activeCall) return;
  const call = activeCall.ring;
  call.elapsed += step;
  if (call.state === 'waiting' && call.elapsed >= call.after) {
    call.state = 'ringing';
    activeCall.element.dataset.ringing = 'true';
    showStatus(call.startMessage, call.duration);
  } else if (call.state === 'ringing' && call.elapsed >= call.after + call.duration) {
    call.state = 'missed';
    activeCall.element.dataset.ringing = 'false';
    showStatus(call.missedMessage, 4000);
    activeCall = null;
  }
}

// 차례대로 조사하는 소품: 다음 차례면 한 단계 나아가고(data-done), 마지막 단계에서 묶음의 gives를 준다. 같은 단계를 다시
// 조사하면 그대로이고, 순서가 틀리면 처음부터다(첫 단계를 조사한 것이면 그 단계까지는 된 것으로 친다).
function advanceSequence(door) {
  const { id, step: order, steps, gives, wrongMessage } = door.sequence;
  if (collectedItems.has(gives)) {
    showStatus(door.takenMessage || door.message, 5000);
    return;
  }
  const progress = sequenceProgress.get(id) || 0;
  if (order === progress || order === progress + 1) {
    sequenceProgress.set(id, order);
    door.element.dataset.done = 'true';
    showStatus(door.message, 5000);
    if (order === steps) collectedItems.add(gives);
    return;
  }
  for (const entry of currentDoors) if (entry.sequence?.id === id) entry.element.dataset.done = 'false';
  sequenceProgress.set(id, order === 1 ? 1 : 0);
  if (order === 1) door.element.dataset.done = 'true';
  showStatus(order === 1 ? door.message : wrongMessage, 5000);
}

// 버튼(소품·설비의 opens: { barrier, duration })은 같은 장면의 장애물(barriers) 하나를 duration ms 동안 연다(3층 배터리 자동문).
// 열린 동안 다시 누르면 시간을 처음부터 센다. 시간이 다 됐을 때 수호가 문 자리에 서 있으면 비킬 때까지 기다렸다가 닫는다.
function openTimedBarrier(button) {
  const barrier = currentDoors.find(door => door.element.classList.contains('barrier') && door.name === button.opens.barrier);
  showStatus(button.message, 4000);
  if (!barrier || collectedItems.has(barrier.gives)) return;
  barrier.closesIn = button.opens.duration;
  if (!barrier.solid) return;
  Composite.remove(engine.world, barrier.solid);
  currentTerrain = currentTerrain.filter(solid => solid !== barrier.solid);
  barrier.parked = barrier.solid;
  barrier.solid = null;
  barrier.element.dataset.open = 'true';
  timedBarriers.push(barrier);
}

function updateTimedBarriers() {
  for (const barrier of [...timedBarriers]) {
    barrier.closesIn -= step;
    if (barrier.closesIn > 0 || Math.abs(body.position.x - barrier.x - barrier.width / 2) < barrier.width / 2 + 24) continue;
    Composite.add(engine.world, barrier.parked);
    currentTerrain = [...currentTerrain, barrier.parked];
    barrier.solid = barrier.parked;
    barrier.parked = null;
    barrier.element.dataset.open = 'false';
    timedBarriers.splice(timedBarriers.indexOf(barrier), 1);
    if (barrier.closedMessage) showStatus(barrier.closedMessage, 2500);
  }
}

// requires가 있는 설비(data-requires)의 data-ready를 지금 챙긴 물건에 맞춘다. 장면을 그릴 때와 물건을 챙기거나 출력을 옮길 때
// 부르므로, 같은 방에서 조건이 채워지면 그림도 바로 바뀐다(2층 영사실 관람창).
function refreshReady() {
  for (const element of dynamicScene.querySelectorAll('[data-requires]')) {
    element.dataset.ready = String(element.dataset.requires.split('|').every(item => collectedItems.has(item)));
  }
}

// 출력 선택기(소품의 cycle: { id, states, messages, initial }, 4층 연구실 UPS): 조사할 때마다 states의 다음 칸으로 넘어간다.
// 고른 칸만 `${id}=${칸}` 물건으로 챙긴 것으로 치므로, 다른 소품의 requires나 방 문의 unlockedBy가 그 이름을 보면 전원이 들어간
// 장비만 동작한다. 아무 칸도 고르지 않았으면 initial(기본 0) 칸이다.
function cycleState(cycle) {
  const index = cycle.states.findIndex(state => collectedItems.has(`${cycle.id}=${state}`));
  return index < 0 ? cycle.initial ?? 0 : index;
}

function advanceCycle(door) {
  const { cycle } = door;
  const current = cycleState(cycle);
  const next = (current + 1) % cycle.states.length;
  collectedItems.delete(`${cycle.id}=${cycle.states[current]}`);
  collectedItems.add(`${cycle.id}=${cycle.states[next]}`);
  door.element.dataset.state = String(next);
  refreshReady();
  showStatus(cycle.messages[next], 5000);
}
