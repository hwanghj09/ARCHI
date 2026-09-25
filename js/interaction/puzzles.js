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
