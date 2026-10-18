// 상호작용: 가까운 문·소품 찾기, E 힌트 문구, E를 눌렀을 때의 처리.
let nearbyDoor = null;

function updateInteraction() {
  if (photoCaptureTime > 0 || itemUseTime > 0 || openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught) { hint.hidden = true; return; }
  if (room === 'dynamic') {
    if (shouldStartCctvScene()) {
      startCctvScene();
      return;
    }
    // 전력이 들어온 채 감지했던 자리로 걸어 돌아가는('return') 로봇은 감지를 끈 채 움직이고 있어 바로 옆까지
    // 갈 수 있다. 정비 패널은 멈춘 로봇의 보조 배터리 화면이므로 그동안은 조사 대상에서 뺀다.
    const returningRobot = guardPatrolPowered(guardPatrol) && guardPatrol.mode === 'return' ? guardPatrol.door : null;
    const candidates = [...(guardPatrol.door ? [guardPatrol.door] : []),
      ...currentDoors.filter(door => door.accessGate && door.solid), ...currentDoors.filter(door => door.phoneCharger),
      ...currentDoors.filter(door => !door.accessGate && !door.phoneCharger)]
      // hideWhenTaken 설비(16층 항불안제)는 챙기고 나면 사라지므로 더는 조사 대상이 아니다. 전력이 없는 층의 전자 장치도 빠진다(power.js).
      .filter(door => door !== returningRobot && !(door.hideWhenTaken && collectedItems.has(door.gives)) && !deviceUnpowered(door));
    // standYs: 설비를 조사할 수 있는 발 높이가 여럿일 때(16층 선반: 바닥에서, 또는 인라면 박스 위에서) 쓴다.
    nearbyDoor = candidates.find(door => grounded && [].concat(door.standYs ?? door.standY ?? floorY).some(y => Math.abs(body.bounds.max.y - y) < 2) &&
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
    [...officeDoors.filter(door => door.room === room), officeComputer, ...(officePostit.element.hidden ? [] : [officePostit])];
  nearbyDoor = activeDoors.find(door => !deviceUnpowered(door) && grounded && Math.abs(body.bounds.max.y - floorY) < 2 &&
    Math.abs(body.position.x - door.x - door.width / 2) < door.width / 2 + 28) || null;
  if (!realBuildingBlackout() && room === 'corridor' && currentSceneFloor === 17 && nearbyDoor?.type === 'elevator') {
    startBlackoutScene(nearbyDoor);
    return;
  }
  for (const door of [...doors, ...officeDoors, officeComputer]) door.element.classList.toggle('near', door === nearbyDoor);
  updateOutline();
  hint.hidden = !nearbyDoor;
  if (nearbyDoor) {
    hint.style.left = `${nearbyDoor.x + nearbyDoor.width / 2}px`;
    hint.style.top = `${nearbyDoor.y - (nearbyDoor.type === 'elevator' ? 72 : 42)}px`;
    hint.textContent = nearbyDoor.type === 'office' ? `${bindingLabel('interact')} · ${room === 'corridor' ? '사무실 들어가기' : '복도로 나가기'}` : doorHintText(nearbyDoor);
  }
}

function doorHintText(door) {
  const key = bindingLabel('interact');
  if (door.type === 'computer') return floorHasPower(currentSceneFloor) ? `${key} · 컴퓨터 사용` : `${key} · 전원 없음`;
  if (door.type === 'power') return `${key} · 태양광 전력 제어`;
  if (door.phoneCharger) return phoneChargerHint(door);
  if (door.accessGate) return door.element.dataset.open === 'true' ? '인증 완료 · 통과 가능' : `${key} · 출입증 태그`;
  // 12층 야간 로그 삭제가 진행 중일 때만 네트워크 랙의 힌트를 "뽑기"로 바꿔 지금 할 일을 알려 준다(log-puzzle.js).
  if (door.name === '네트워크 랙' && dynamicFloorId === 'f12-eval' && logDeleting()) return `${key} · LAN 케이블 뽑기`;
  if (door.shutterLever) return collectedItems.has(door.shutterLever) ? `${key} · 셔터 내리기` : `${key} · 셔터 올리기`;
  if (door.type === 'inspect') return `${key} · ${door.name} 조사`;
  if (door.locked && door.control && [].concat(door.requires || []).every(item => collectedItems.has(item))) return `${key} · ${door.name} 카드키 태그`;
  if (door.locked) return `${key} · ${door.name} (잠김)`;
  if (door.type === 'room') return door.hint;
  if (door.type === 'stairs') return currentSceneFloor === 18 ? `${key} · 17층으로 내려가기` : `${key} · 옥상으로 올라가기`;
  if (door.type === 'panel') return `${key} · 조사`;
  if (door.type === 'elevator') {
    if (!elevatorHasPower()) return `${key} · 엘리베이터 전력 없음`;
    const car = elevatorCars[door.carIndex];
    if (car.travelling) return car.rider ? '이동 중…' : '호출 중…';
    if (car.floor === currentSceneFloor) return `${key} · 탑승`;
    return `${key} · 호출`;
  }
  return door.element.dataset.open === 'true' ? `${key} · 닫기` : `${key} · 열기`;
}

function interact() {
  if (!wirePanel.hidden) return;
  if (photoCaptureTime > 0 || itemUseTime > 0 || openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning || selectingFloor || usingComputer || usingKeypad || usingControl || usingPhone || usingPowerPanel || usingInspection) return;
  updateInteraction();
  if (blackoutSceneActive || cctvSceneActive) return;
  if (!nearbyDoor) return;
  // 레버·열쇠·전원선 같은 장치(control)는 먼저 직접 조작하게 하고, 다 하면 이 함수를 다시 불러 결과를 보인다(manual-control.js).
  if (needsControl(nearbyDoor)) { openControl(nearbyDoor); return; }
  if (nearbyDoor.type === 'computer') {
    // 정전 중에는 켜지지 않는다. 옥상 태양광 전력을 17층에 보내면 다시 쓸 수 있다.
    if (!floorHasPower(currentSceneFloor)) return;
    computerReturnFocus = document.activeElement;
    transitionScene(() => {
      setOfficeComputerPower('on');
      usingComputer = true;
      computer.hidden = false;
      resetComputerDesktop();
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
    if (nearbyDoor.container === 'cleaning-cart') { openCleaningCart(); return; }
    if (nearbyDoor.powerCircuit) { openEmergencyCircuit(); return; }
    if (handleB2Console(nearbyDoor)) return; // B2 삭제 중 메인 콘솔: 문을 막은 뒤면 루트 터미널(b2-ending.js)
    if (handleLogTerminalInteract(nearbyDoor)) return; // 12층 야간 로그 단말기·네트워크 랙(log-puzzle.js)
    if (handleBackupDeviceInteract(nearbyDoor)) return; // 7층 망분리 백업 장비(backup-puzzle.js)
    if (handleVaultInteract(nearbyDoor)) return; // 13층 보안 자료실 크랭크·배치도(vault-puzzle.js)
    if (dynamicFloorId === 'f12-dev' && nearbyDoor.name === '맨 왼쪽 서랍') { openDrawerPuzzle(); return; }
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
    // condition: 물건이 아닌 현재 상태(16층 박스를 끝까지 밀고 그 위에 서기)로 정하는 조건. 못 채우면 물건 하나가 모자란 것과 같다.
    const lacking = required.filter(item => !collectedItems.has(item)).length + (nearbyDoor.condition && !nearbyDoor.condition() ? 1 : 0);
    if (nearbyDoor.accessGate && lacking && collectedItems.has('f17-badge')) {
      // 거부 화면은 미등록 출입증이라는 사실만 알려 준다(유효한 사원증의 단서는 컴퓨터 건물 안내 앱이 따로 준다).
      playGameSound('deny');
      openInspection(nearbyDoor.name, '정수호의 출입증을 태그했다. "미등록 출입증입니다, 팀장 이상의 직급이 요구됩니다." 칸막이가 열리지 않았다.');
      // 이상 행동 목표 도중이면 이 조사창을 닫은 뒤 세 번째 컷씬(story-scene.js)이 이어진다.
      if (currentObjective?.title === '이상 행동' && !collectedItems.has('story-badge-seen')) collectedItems.add('story-gate-tagged'); // 컷씬은 한 번만(이미 봤으면 다시 나오지 않는다)
      return;
    }
    const missing = !unreadable && lacking && nearbyDoor.missingMessage &&
      (lacking < required.length && nearbyDoor.partialMessage || nearbyDoor.missingMessage);
    const inspectionMessage = unreadable || missing || (gives && collectedItems.has(gives) ? nearbyDoor.takenMessage : nearbyDoor.message);
    // 글이 적힌 소품은 지금 보이는 문구에 맞는 표면을 펼친다(message는 소품, takenMessage·missingMessage는 그 sheet).
    // fullImage가 있는 설비(B1 CCTV 모니터 벽)는 그 그림을 화면 전체에 띄운다.
    if (nearbyDoor.fullImage && !unreadable && !missing) openFullImage(nearbyDoor, inspectionMessage);
    else openInspection(nearbyDoor.name, inspectionMessage, writingSheetFor(nearbyDoor, inspectionMessage));
    offerArchiDelete(nearbyDoor); // B2 메인 콘솔이면 DELETE 버튼(b2-ending.js)
    if (missing) return;
    if (!unreadable) {
      recordClue(nearbyDoor); noteObjectiveRead(nearbyDoor);
      offerInspectionPhoto(nearbyDoor, inspectionMessage);
    }
    const alreadyCollected = gives && collectedItems.has(gives);
    if (gives) {
      collectedItems.add(gives);
      // 처음 챙길 때의 효과음: requires를 써서 움직인 설비(인증 게이트·2층 영사기)는 사용음, 가방에 들어가는 소지품
      // (INVENTORY_ITEMS)은 획득음, 그 밖의 단서·진행은 pickup이다. sound가 있는 설비(11층 방화셔터)는 그 소리를 낸다.
      if (!alreadyCollected) playGameSound(nearbyDoor.sound || (required.length ? 'item-use' : INVENTORY_ITEMS[gives] ? 'item-get' : 'pickup'));
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
    // 한 번 안에서 열고 나오면 그 뒤로 복도에서도 열린다. 16층 VU 셔터는 안의 레버(shutterLever)로 따로 올리고 내린다.
    if (nearbyDoor.key === 'exit') collectedItems.add(dynamicFloorId);
    nearbyDoor.element.dataset.open = 'true';
    playGameSound('door');
    changeRoom(() => performFloorChange(target, null, arrivalKey));
    return;
  }
  if (nearbyDoor.type === 'stairs') {
    const destId = currentSceneFloor === 18 ? 'f17' : 'rooftop';
    if (destId === 'rooftop' && !collectedItems.has('rooftop-unlocked')) {
      if (collectedItems.has('rooftop-key')) openRooftopLock();
      else openInspection('옥상문', '문 위 표지판: "옥상 · 태양광 비상전원 설비". 문이 잠겨 있다. 비상용 열쇠라면… 비상 장비 근처에 두지 않았을까?');
      return;
    }
    if (destId === 'rooftop' && (!rooftopBackground.complete || !rooftopBackground.naturalWidth)) {
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
    return;
  }
  if (nearbyDoor.type === 'elevator') {
    if (b2Ending.phase === 'running') return; // ARCHI가 B2 승강기를 멈췄다
    if (needsF1Directory()) { sayLine('편의점이 몇 층이더라…'); return; } // 층별 안내판을 먼저 본다(objective.js)
    const car = elevatorCars[nearbyDoor.carIndex];
    if (!elevatorHasPower() && car.floor !== currentSceneFloor) {
      sayLine(solarEnabled ? '불은 켜졌는데 엘리베이터는 안 와… 승강기 전기는 따로 연결해야 하나?' : '전기가 없으니 엘리베이터도 안 오겠지…');
      return;
    }
    if (car.travelling) return;
    // 1층 전력 켜기 목표 도중에는 칸이 와 있어도 탈 수 없다(호출은 된다).
    if (car.floor === currentSceneFloor && currentObjective?.title === '1층 전력 켜기') { openInspection('엘리베이터', '1층 전력을 먼저 켜자.'); return; }
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
    updateInteraction();
    return;
  }
  interactionTime = 420;
  facing = body.position.x <= nearbyDoor.x + nearbyDoor.width / 2 ? 1 : -1;
  animate(0);
  const open = nearbyDoor.element.dataset.open !== 'true';
  playGameSound('door');
  setDoorOpen(nearbyDoor, open);
  updateInteraction();
}

