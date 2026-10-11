// 단일 자동 저장 슬롯. 메뉴에서는 이전 저장을 덮어쓰지 않는다.
const progressKey = 'archi.progress.v1';
let restoringProgress = false;
let progressSaveFailed = false;
const savedNumber = (value, fallback, min, max) => Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
const savedFloor = value => Number.isInteger(value) && (value === -2 || value === -1 || (value >= 1 && value <= 17));

function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(progressKey));
    // 단면 에셋으로 교체되어 사라진 방의 저장은 같은 층 복도에서 재개한다. 소지품·전력·퍼즐 기록은 유지한다.
    if (data?.version === 1 && ['f2-booth', 'f3-hanuri', 'f4-log', 'f4-ups', 'f4-vault', 'f4-office',
      'f5-library', 'f5-council', 'f6-remote', 'f6-line', 'f6-duty', 'f8-repro', 'f8-blind',
      'f9-briefing', 'f9-license', 'f10-finance', 'f10-director', 'f10-vault'].includes(data.scene?.id) &&
      Number.isFinite(data.scene.x) && Number.isFinite(data.scene.y)) {
      Object.assign(data.scene, { id: data.scene.id.split('-')[0], x: BUILDING_CORE.elevators[0].x + 40,
        y: floorY - 81, velocity: { x: 0, y: 0 }, arrivalKey: null });
    }
    if (data?.version !== 1 || !data.scene || !(data.scene.id === 'office' || floorById.has(data.scene.id)) ||
        !Number.isFinite(data.scene.x) || !Number.isFinite(data.scene.y) || !Array.isArray(data.items) ||
        data.items.length > 1024 || !data.items.every(item => typeof item === 'string' && item.length < 256)) return null;
    return data;
  } catch { return null; }
}

function progressSnapshot() {
  // ponytail: 컷씬·포획은 조작 가능한 위치로 저장한다. 컷씬 프레임 재개가 필요할 때 별도로 보존한다.
  const scene = { id: room === 'office' ? 'office' : room === 'corridor' ? 'f17' : dynamicFloorId,
    x: body.position.x, y: body.position.y, velocity: { ...body.velocity }, facing, returnX,
    arrivalKey: currentDoors.find(door => door.key === 'exit')?.key || currentDoors.find(door => door.key)?.key };
  if (openingActive) Object.assign(scene, { id: 'office', x: 656, y: floorY - 81, velocity: { x: 0, y: 0 } });
  if (playerCaught) Object.assign(scene, { id: 'f1', x: BUILDING_CORE.elevators[0].x + 40, y: floorY - 81, velocity: { x: 0, y: 0 } });
  return { version: 1, savedAt: Date.now(), scene, items: [...collectedItems], clues: clueSnapshot(),
    battery: phoneBattery, sanity, light: phoneLightOn, dock: phoneDock && { ...phoneDock },
    phoneChargeAccumulator, phoneDrainAccumulator,
    blackout: realBuildingBlackout() || blackoutSceneActive, solarEnabled, solarPoweredFloors: [...solarPoweredFloors],
    lights: world.dataset.lights, computerPower: openingActive ? 'off' : officeComputer.element.dataset.power,
    elevators: elevatorCars.map(({ name, ...car }) => ({ ...car })),
    cabin: selectingFloor ? { index: cabinCarIndex, selectedFloor, autoClose: cabinAutoClose,
      amount: cabinDoorAmount, phase: cabinScene.dataset.door } : null,
    guard: { x: playerCaught ? 4530 : guardPatrol.x, facing: guardPatrol.facing, wait: guardPatrol.wait, elapsed: guardPatrol.elapsed },
    runtime: { sequences: [...sequenceProgress],
      moving: movingParts.map(part => ({ position: { ...part.body.position }, velocity: { ...part.body.velocity } })),
      timed: timedBarriers.map(door => ({ name: door.name, remaining: door.closesIn })),
      call: currentDoors.find(door => door.ring)?.ring && { ...currentDoors.find(door => door.ring).ring } } };
}

function saveProgress() {
  if (!gameStarted || mainMenuActive || restoringProgress) return false;
  try {
    localStorage.setItem(progressKey, JSON.stringify(progressSnapshot()));
    progressSaveFailed = false;
    return true;
  } catch {
    if (!progressSaveFailed) showStatus('진행 상황을 저장할 수 없습니다. 브라우저 저장 공간을 확인해 주세요.', 6000);
    progressSaveFailed = true;
    return false;
  }
}

function restoreProgress(data) {
  restoringProgress = true;
  try {
    itemUseTime = 0;
    closeComputerUsbConnection();
    resetComputerDesktop();
    releaseInput();
    // 재개할 때 조사·휴대폰 등의 창은 닫는다. 퍼즐 진행과 실제 게임 상태는 복원한다.
    usingPhone = usingComputer = usingKeypad = usingPowerPanel = usingInspection = selectingFloor = false;
    transitioning = playerCaught = blackoutSceneActive = storySceneActive = hallucinationCaught = cctvSceneActive = false;
    cameraZoom = 1; cameraShake.x = cameraShake.y = 0; cctvRevealWall = null; cctvFirstViewOpen = false;
    openingActive = true; // 장면을 조립하는 동안 정전 컷씬과 입력이 시작되지 않게 한다.
    sceneTransition = null;
    cabinCarIndex = null;
    selectedFloor = null;
    for (const element of [phonePanel, computer, keypad, powerPanel, inspectionPanel, cabin, guardCapturePanel, hallucinationCapturePanel, opening, blackoutScene, storyScene, cctvScene]) element.hidden = true;
    for (const element of document.body.children) if (element !== mainMenu) element.inert = false;
    phoneBlocked = powerBlocked = guardBlocked = hallucinationBlocked = openingBlocked = blackoutBlocked = cctvBlocked = [];
    zeroEventPhase = 'idle'; zeroEventTimer = 0; zeroEventEvasions = 0; zeroEventApproachDone = false;
    endHallucinationSighting();
    clearInterval(inspectionTypingTimer);
    inspectionTypingTimer = null;
    delete inspectionPanel.dataset.returnTo;
    inventoryButton.setAttribute('aria-expanded', 'false');
    roomTransition.classList.remove('visible');
    roomTransition.dataset.phase = 'idle';
    for (const key of ['opening', 'blackoutScene', 'powerFlicker', 'cctvScene']) delete world.dataset[key];
    collectedItems.clear();
    // 자신의 출입증은 기본 소지품이며, 이전 저장에도 진행 상황을 유지한 채 추가한다.
    collectedItems.add('f17-badge');
    for (const item of data.items) collectedItems.add(item);
    restoreClues(data.clues);
    allPowerOverride = false; // 불러오거나 새로 시작하면 콘솔의 전력 활성화는 꺼진다
    buildingBlackout = data.blackout === true;
    if (typeof syncAllPowerButton === 'function') syncAllPowerButton();
    solarEnabled = data.solarEnabled === true;
    // 한 층만 켜던 예전 저장은 숫자 solarPoweredFloor를 [숫자]로 읽는다. 켠 순서를 지키고 최근 두 층만 남긴다.
    const solarFloors = Array.isArray(data.solarPoweredFloors) ? data.solarPoweredFloors : [data.solarPoweredFloor];
    solarPoweredFloors = solarEnabled ?
      [...new Set(solarFloors.filter(floor => Number.isInteger(floor) && floor >= 1 && floor <= 17))].slice(-solarFloorLimit) : [];
    world.dataset.lights = data.lights === 'off' ? 'off' : 'on';
    document.getElementById('floor17-lights').checked = world.dataset.lights === 'on';
    phoneBattery = savedNumber(data.battery, 100, 0, 100);
    sanity = savedNumber(data.sanity, 100, 0, 100);
    phoneDock = null;
    if (data.dock && Number.isFinite(data.dock.x)) {
      const config = data.dock.floor === 18 ? ROOFTOP : ALL_FLOORS.find(entry => entry.floor === data.dock.floor);
      if (config?.fixtures?.some(fixture => fixture.phoneCharger && fixture.x === data.dock.x)) phoneDock = { floor: data.dock.floor, x: data.dock.x };
    }
    phoneLightOn = data.light === true && phoneBattery > 0 && !phoneDock;
    phoneAwayTime = phoneTime = 0;
    phoneChargeAccumulator = savedNumber(data.phoneChargeAccumulator, 0, 0, 999);
    phoneDrainAccumulator = savedNumber(data.phoneDrainAccumulator, 0, 0, 999);
    const cars = elevatorCars.map((car, index) => {
      const saved = data.elevators?.[index];
      const floor = savedFloor(saved?.floor) ? saved.floor : 1;
      const destination = savedFloor(saved?.destination) ? saved.destination : null;
      return { floor, destination, travelling: saved?.travelling === true && destination !== null && destination !== floor,
        elapsed: savedNumber(saved?.elapsed, 0, 0, elevatorFloorTime), rider: false, open: saved?.open === true, pendingDestId: null };
    });
    elevatorCars.forEach((car, index) => Object.assign(car, cars[index]));
    for (const door of doors.filter(door => door.type === 'room')) {
      const config = FLOOR17.rooms.find(entry => entry.target === door.target);
      door.locked = Boolean(config?.locked && !collectedItems.has(config.unlockedBy));
    }
    const id = data.scene.id === 'office' ? 'f17' : data.scene.id;
    const dest = floorById.get(id);
    const arrival = dest.interior ? data.scene.arrivalKey || 'exit' : null;
    performFloorChange(id, dest.interior || id === 'rooftop' ? null : 0, arrival);
    if (data.scene.id === 'office') performRoomChange();
    returnX = savedNumber(data.scene.returnX, 644, 52, corridorWidth - 52);
    const runtime = data.runtime || {};
    sequenceProgress.clear();
    for (const [id, step] of Array.isArray(runtime.sequences) ? runtime.sequences.filter(Array.isArray) : []) {
      const door = currentDoors.find(entry => entry.sequence?.id === id);
      if (door && Number.isInteger(step)) sequenceProgress.set(id, Math.max(0, Math.min(door.sequence.steps, step)));
    }
    for (const door of currentDoors.filter(entry => entry.sequence)) {
      door.element.dataset.done = String(collectedItems.has(door.sequence.gives) || door.sequence.step <= (sequenceProgress.get(door.sequence.id) || 0));
    }
    movingParts.forEach((part, index) => {
      const saved = runtime.moving?.[index];
      if (!saved?.position) return;
      Body.setPosition(part.body, { x: savedNumber(saved.position.x, part.body.position.x, 52, worldWidth - 52),
        y: savedNumber(saved.position.y, part.body.position.y, 0, floorY - part.height / 2) });
      Body.setVelocity(part.body, { x: savedNumber(saved.velocity?.x, 0, -20, 20), y: savedNumber(saved.velocity?.y, 0, -20, 20) });
    });
    for (const saved of Array.isArray(runtime.timed) ? runtime.timed : []) {
      const button = currentDoors.find(door => door.opens?.barrier === saved?.name);
      if (!button) continue;
      openTimedBarrier(button);
      const barrier = timedBarriers.find(door => door.name === saved.name);
      if (barrier) barrier.closesIn = savedNumber(saved.remaining, 0, 0, button.opens.duration);
    }
    if (activeCall && runtime.call) {
      activeCall.ring.elapsed = savedNumber(runtime.call.elapsed, 0, 0, activeCall.ring.after + activeCall.ring.duration);
      activeCall.ring.state = ['waiting', 'ringing', 'missed'].includes(runtime.call.state) ? runtime.call.state : 'waiting';
      activeCall.element.dataset.ringing = String(activeCall.ring.state === 'ringing');
      if (activeCall.ring.state === 'missed') activeCall = null;
    }
    Body.setPosition(body, { x: savedNumber(data.scene.x, 656, 52, worldWidth - 52), y: savedNumber(data.scene.y, floorY - 81, -100, floorY - 81) });
    Body.setVelocity(body, { x: savedNumber(data.scene.velocity?.x, 0, -20, 20), y: savedNumber(data.scene.velocity?.y, 0, -20, 20) });
    facing = data.scene.facing === -1 ? -1 : 1;
    grounded = false;
    Object.assign(guardPatrol, { x: savedNumber(data.guard?.x, 4530, 114, corridorWidth - 114), facing: data.guard?.facing === 1 ? 1 : -1,
      wait: savedNumber(data.guard?.wait, 0, 0, 2000), elapsed: savedNumber(data.guard?.elapsed, 0, 0, 1e9), mode: 'patrol', lostTime: 0, captureTime: 0 });
    openingActive = false;
    setOfficeComputerPower(data.computerPower === 'on' ? 'on' : 'off');
    if (data.cabin && Number.isInteger(data.cabin.index) && data.cabin.index >= 0 && data.cabin.index < 3) {
      showCabin(data.cabin.index);
      elevatorCars.forEach((car, index) => Object.assign(car, cars[index]));
      elevatorCars[cabinCarIndex].rider = true;
      selectedFloor = savedFloor(data.cabin.selectedFloor) ? data.cabin.selectedFloor : null;
      cabinAutoClose = savedNumber(data.cabin.autoClose, 0, 0, 1800);
      cabinDoorAmount = savedNumber(data.cabin.amount, 1, 0, 1);
      cabinScene.dataset.door = ['open', 'closed', 'opening', 'closing'].includes(data.cabin.phase) ? data.cabin.phase : 'open';
      cabinScene.style.setProperty('--door-open', cabinDoorAmount);
      refreshCabin();
    }
    Engine.clear(engine);
    refreshReady(); refreshInventoryCount(); refreshPhone(); refreshSanity(); updatePowerState();
    cameraX = cameraTarget(); animate(0); updateInteraction(); render();
    gameStarted = true;
    showStatus('저장한 진행 상황을 이어서 시작합니다.', 3000);
    (selectingFloor ? cabin : stage).focus({ preventScroll: true });
  } finally { restoringProgress = false; }
}

function startNewGame() {
  restoreProgress({ version: 1, scene: { id: 'office', x: 656, y: floorY - 81, facing: 1 }, items: [], sanity: newGameSanity });
  try {
    localStorage.removeItem('archi.office17.note');
    localStorage.removeItem('archi.phone.note');
  } catch { /* 새 게임은 저장소가 없어도 실행한다. */ }
  computerNote.value = '';
  computerSaveStatus.textContent = '저장됨';
  phoneNote.value = ''; savedPhoneNote = '';
  phoneNoteStatus.textContent = '필요한 단서를 적고 저장하세요.';
  showPhoneNoteTab('memo');
  phoneRecentApps = [];
  openingActive = true;
  openingElapsed = 0; openingReady = false;
  world.dataset.opening = 'loading';
  opening.hidden = false;
  startOpening();
  saveProgress();
}

setInterval(saveProgress, 2000);
window.addEventListener('pagehide', saveProgress);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveProgress(); });

