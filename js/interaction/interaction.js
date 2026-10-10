// 상호작용: 가까운 문·소품 찾기, E 힌트 문구, E를 눌렀을 때의 처리.
let nearbyDoor = null;

function updateInteraction() {
  if (openingActive || blackoutSceneActive || playerCaught) { hint.hidden = true; return; }
  if (room === 'dynamic') {
    const candidates = [...(guardPatrol.door ? [guardPatrol.door] : []),
      ...currentDoors.filter(door => door.accessGate && door.solid), ...currentDoors.filter(door => door.phoneCharger),
      ...currentDoors.filter(door => !door.accessGate && !door.phoneCharger)];
    nearbyDoor = candidates.find(door => grounded && Math.abs(body.bounds.max.y - (door.standY ?? floorY)) < 2 &&
      Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
    for (const door of currentDoors) door.element.classList.toggle('near', door === nearbyDoor);
    updateOutline();
    hint.hidden = !nearbyDoor;
    if (nearbyDoor) {
      hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
      hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
      hint.textContent = doorHintText(nearbyDoor);
    }
    return;
  }
  const activeDoors = room === 'corridor' ? [...doors.filter(door => door.phoneCharger), ...doors.filter(door => !door.phoneCharger),
    ...officeDoors.filter(door => door.room === room)] :
    [...officeDoors.filter(door => door.room === room), officeComputer];
  nearbyDoor = activeDoors.find(door => grounded && Math.abs(body.bounds.max.y - floorY) < 2 &&
    Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
  if (!buildingBlackout && room === 'corridor' && currentSceneFloor === 17 && nearbyDoor?.type === 'elevator') {
    startBlackoutScene(nearbyDoor);
    return;
  }
  for (const door of [...doors, ...officeDoors, officeComputer]) door.element.classList.toggle('near', door === nearbyDoor);
  updateOutline();
  hint.hidden = !nearbyDoor;
  if (nearbyDoor) {
    hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
    hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
    hint.textContent = nearbyDoor.type === 'office' ? (room === 'corridor' ? 'E · 사무실 들어가기' : 'E · 복도로 나가기') : doorHintText(nearbyDoor);
  }
}

function doorHintText(door) {
  if (door.type === 'computer') return floorHasPower(currentSceneFloor) ? 'E · 컴퓨터 사용' : 'E · 전원 없음';
  if (door.type === 'power') return 'E · 태양광 전력 제어';
  if (door.phoneCharger) return phoneChargerHint(door);
  if (door.accessGate) return door.element.dataset.open === 'true' ? '인증 완료 · 통과 가능' : 'E · 출입증 태그';
  if (door.type === 'inspect') return `E · ${door.name} 조사`;
  if (door.locked) return `E · ${door.name} (잠김)`;
  if (door.type === 'room') return door.hint;
  if (door.type === 'stairs') return currentSceneFloor === 18 ? 'E · 17층으로 내려가기' : 'E · 옥상으로 올라가기';
  if (door.type === 'panel') return 'E · 조사';
  if (door.type === 'elevator') {
    if (!elevatorHasPower()) return 'E · 엘리베이터 전력 없음';
    const car = elevatorCars[door.carIndex];
    if (car.travelling) return car.rider ? '이동 중…' : '호출 중…';
    if (car.floor === currentSceneFloor) return 'E · 탑승';
    return 'E · 호출';
  }
  return door.element.dataset.open === 'true' ? 'E · 닫기' : 'E · 열기';
}

function interact() {
  if (openingActive || blackoutSceneActive || playerCaught || transitioning || selectingFloor || usingComputer || usingKeypad || usingPhone || usingPowerPanel || usingInspection) return;
  updateInteraction();
  if (blackoutSceneActive) return;
  if (!nearbyDoor) return;
  if (nearbyDoor.type === 'computer') {
    // 정전 중에는 켜지지 않는다. 옥상 태양광 전력을 17층에 보내면 다시 쓸 수 있다.
    if (!floorHasPower(currentSceneFloor)) return showStatus('전원이 들어오지 않는다. 전력을 공급해야 한다.', 4000);
    computerReturnFocus = document.activeElement;
    transitionScene(() => {
      setOfficeComputerPower('on');
      usingComputer = true;
      computer.hidden = false;
      computerWindow.hidden = true;
      hint.hidden = true;
    });
    return;
  }
  if (nearbyDoor.type === 'power') {
    openPowerPanel();
    return;
  }
  if (nearbyDoor.type === 'inspect' || nearbyDoor.locked) {
    interactionTime = 420;
    facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
    animate(0);
    if (nearbyDoor.phoneCharger) {
      chargePhone(nearbyDoor);
      return;
    }
    if (nearbyDoor.container === 'hydrant') {
      openHydrant();
      return;
    }
    const { gives } = nearbyDoor;
    // 도어락(code): 잠긴 문이나 아직 열지 못한 소품은 키패드를 연다. 맞는 번호를 넣으면 문이 열리거나 gives를 챙긴다.
    if (nearbyDoor.code && (nearbyDoor.type === 'room' ? nearbyDoor.locked : !collectedItems.has(gives))) {
      openKeypad(nearbyDoor);
      return;
    }
    if (nearbyDoor.sequence) {
      advanceSequence(nearbyDoor);
      return;
    }
    // 잠깐 여는 버튼(opens, 3층 자동문)과 출력 선택기(cycle, 4층 UPS)는 puzzles.js가 처리한다.
    if (nearbyDoor.opens) {
      openTimedBarrier(nearbyDoor);
      return;
    }
    if (nearbyDoor.cycle) {
      advanceCycle(nearbyDoor);
      return;
    }
    // 울리는 전화(ring)는 벨이 울리는 동안에만 받을 수 있다. 받으면 벨이 멎고 아래에서 message와 gives를 준다.
    if (nearbyDoor.ring && !collectedItems.has(gives)) {
      if (nearbyDoor.ring.state !== 'ringing') {
        showStatus(nearbyDoor.ring.idleMessage, 5000);
        return;
      }
      nearbyDoor.ring.state = 'answered';
      nearbyDoor.element.dataset.ringing = 'false';
      activeCall = null;
      stopGameSound('call-ring');
    }
    // 어두운 방에서는 darkMessage가 있는 소품을 읽을 수 없다.
    const unreadable = world.dataset.dark === 'true' && nearbyDoor.darkMessage;
    // requires가 있는 소품(예: 13층 UPS 비상 회선에 물린 프린터)은 그 물건을 챙기기 전까지 missingMessage만 보인다.
    // requires는 물건 하나 또는 목록이다(10층 이중 잠금 서류함). 일부만 챙겼으면 partialMessage를 보이고, 다 챙기기 전에는
    // 그 소품의 gives도 주지 않는다.
    const required = [].concat(nearbyDoor.requires || []);
    const lacking = required.filter(item => !collectedItems.has(item)).length;
    if (nearbyDoor.accessGate && lacking && collectedItems.has('f17-badge')) {
      openInspection(nearbyDoor.name, '정수호의 출입증을 태그했다. "미등록 출입증 · 인증 거부". 칸막이가 열리지 않는다. 다른 유효한 사원증이 필요하다.');
      return;
    }
    const missing = !unreadable && lacking && nearbyDoor.missingMessage &&
      (lacking < required.length && nearbyDoor.partialMessage || nearbyDoor.missingMessage);
    const inspectionMessage = unreadable || missing || (gives && collectedItems.has(gives) ? nearbyDoor.takenMessage : nearbyDoor.message);
    // 글이 적힌 소품은 지금 보이는 문구에 맞는 표면을 펼친다(message는 소품, takenMessage·missingMessage는 그 sheet).
    openInspection(nearbyDoor.name, inspectionMessage, writingSheetFor(nearbyDoor, inspectionMessage));
    if (missing) return;
    if (!unreadable) recordClue(nearbyDoor);
    const alreadyCollected = gives && collectedItems.has(gives);
    if (gives) {
      collectedItems.add(gives);
      if (!alreadyCollected) playGameSound('pickup');
    }
    if (gives) refreshReady();
    if (gives) refreshInventoryCount();
    if (gives && room === 'dynamic' && floorById.get(dynamicFloorId).litBy === gives) world.dataset.dark = 'false';
    // 걷힌 장애물(barriers)은 그 자리에서 충돌체를 치운다.
    for (const barrier of currentDoors.filter(door => gives && door.gives === gives && door.solid)) {
      Composite.remove(engine.world, barrier.solid);
      currentTerrain = currentTerrain.filter(solid => solid !== barrier.solid);
      barrier.solid = null;
      barrier.element.dataset.open = 'true';
    }
    if (!unreadable && !alreadyCollected) playPropAnimation(nearbyDoor);
    // 등 뒤에서 잠긴 출구(exitLock)는 풀어 주는 물건을 챙기는 즉시 열린다.
    for (const door of currentDoors) {
      if (!door.locked || !door.lockedUntil || !collectedItems.has(door.lockedUntil)) continue;
      door.locked = false;
      door.element.setAttribute('aria-label', `${door.name} 출입문`);
    }
    return;
  }
  if (nearbyDoor.type === 'room') {
    const { target, arrivalKey } = nearbyDoor;
    // 방 안에서 복도 문으로 나오면 그 방 id를 챙긴 것으로 친다: 안쪽 걸쇠로 잠긴 방(unlockedBy: 자기 방 id)은
    // 한 번 안에서 열고 나오면 그 뒤로 복도에서도 열린다.
    if (nearbyDoor.key === 'exit') collectedItems.add(dynamicFloorId);
    playGameSound('door');
    changeRoom(() => performFloorChange(target, null, arrivalKey));
    return;
  }
  if (nearbyDoor.type === 'stairs') {
    const destId = currentSceneFloor === 18 ? 'f17' : 'rooftop';
    if (destId === 'rooftop' && !collectedItems.has('rooftop-unlocked')) {
      if (collectedItems.has('rooftop-key')) openRooftopLock();
      else openInspection('옥상문', '문이 잠겨 있다. 옥상문을 열 열쇠가 필요하다.');
      return;
    }
    if (destId === 'rooftop' && (!rooftopBackground.complete || !rooftopBackground.naturalWidth)) {
      showStatus('옥상 배경을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    playGameSound('door');
    changeRoom(() => performFloorChange(destId, null));
    return;
  }
  if (nearbyDoor.type === 'office') {
    playGameSound('door');
    changeRoom();
    return;
  }
  if (nearbyDoor.type === 'panel') {
    showStatus(`${nearbyDoor.name}입니다. (추후 구현 예정)`);
    return;
  }
  if (nearbyDoor.type === 'elevator') {
    const car = elevatorCars[nearbyDoor.carIndex];
    if (!elevatorHasPower() && car.floor !== currentSceneFloor) {
      showStatus(elevatorPowerMessage, 6000);
      return;
    }
    if (car.travelling) return;
    interactionTime = 420;
    facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
    animate(0);
    if (car.floor === currentSceneFloor) {
      enterCabin(nearbyDoor.carIndex);
      return;
    }
    car.travelling = true;
    car.rider = false;
    car.destination = currentSceneFloor;
    car.elapsed = 0;
    car.open = false;
    playGameSound('switch');
    updateFloorIndicator(nearbyDoor);
    showStatus(`${nearbyDoor.name}를 호출했습니다.`);
    updateInteraction();
    return;
  }
  interactionTime = 420;
  facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
  animate(0);
  const open = nearbyDoor.element.dataset.open !== 'true';
  playGameSound('door');
  setDoorOpen(nearbyDoor, open);
  showStatus(`${nearbyDoor.name} 문을 ${open ? '열었습니다' : '닫았습니다'}.`);
  updateInteraction();
}
