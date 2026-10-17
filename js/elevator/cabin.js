// 엘리베이터 내부 화면: 층 버튼, 문 열고 닫기, 비상벨, 내리기.
const cabin = document.getElementById('elevator-cabin');
const cabinScene = document.getElementById('cabin-scene');
const cabinDoorway = document.getElementById('cabin-doorway');
const cabinStatus = document.getElementById('cabin-status');
const cabinDisplay = document.getElementById('cabin-display');
const cabinOpen = document.getElementById('cabin-open');
const cabinClose = document.getElementById('cabin-close');
const cabinExit = document.getElementById('cabin-exit');
let cabinCarIndex = null;
let selectedFloor = null;
let cabinDoorAmount = 1;
let cabinAutoClose = 0;
let cabinReturnFocus = null;
let cabinArrivalOpen = false;

// Hotspots use the source artwork's 1536x1024 coordinates; CSS scales them with the scene.
const cabinFloorButtons = [];
const panelFloors = [null, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, -1, -2];
// B2는 ARCHI가 23:59에 운행을 막아 두었다(SYSTEM 운행 제한). B1 방재 관제실 승강기 제어반의 열쇠 스위치로 수동 해제해야
// (restrictionItem) 버튼이 눌린다.
const restrictedFloors = [-2];
const restrictionItem = 'b1-elevator';
panelFloors.forEach((floor, index) => {
  if (floor === null) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'cabin-hit';
  button.dataset.floor = floor;
  if (restrictedFloors.includes(floor)) button.dataset.restricted = 'true';
  button.title = floor < 0 ? `지하 ${-floor}층` : `${floor}층`;
  button.setAttribute('aria-label', button.title);
  button.setAttribute('aria-pressed', 'false');
  Object.assign(button.style, {
    left: `${(1073 + index % 4 * 77) / 1536 * 100}%`, top: `${(261 + Math.floor(index / 4) * 74) / 1024 * 100}%`,
    width: `${60 / 1536 * 100}%`, height: `${57 / 1024 * 100}%`,
  });
  button.addEventListener('click', () => {
    const car = elevatorCars[cabinCarIndex];
    if (transitioning || !car || car.travelling || floor === car.floor) return;
    if (!elevatorHasPower()) {
      cabinStatus.textContent = elevatorPowerMessage;
      return;
    }
    // 퇴근하기 목표 도중(정전 전의 첫 '엘리베이터로 가자.'는 제외)에는 1층 버튼만 눌린다.
    if (currentObjective?.title === '퇴근하기' && currentObjective.text !== '엘리베이터로 가자.' && floor !== 1) {
      cabinStatus.textContent = '1층으로 가서 퇴근하자.';
      playGameSound('deny');
      return;
    }
    if (button.dataset.restricted && selectedFloor !== floor && !collectedItems.has(restrictionItem)) {
      // 7층에서 B2가 목적지라는 걸 안 뒤에는 제한 화면과 함께 B1 시설관리실로 안내한다(objective.js).
      if (collectedItems.has('f7-external-connection-solved')) {
        collectedItems.add('b2-restricted-seen');
        cabinStatus.textContent = 'B2 · ACCESS RESTRICTED · MANUAL OVERRIDE REQUIRED — 시설관리실에서 운행 제한을 해제해야 한다.';
        playGameSound('deny');
      } else cabinStatus.textContent = '버튼을 눌렀으나 아무 반응도 없었다.';
      return;
    }
    if (selectedFloor !== null) return;
    selectedFloor = floor;
    playGameSound('switch');
    // 문이 닫힌 뒤 updateCabin이 페이드 아웃으로 층을 바꾸고, 페이드 인이 끝나면 문을 연다.
    if (cabinScene.dataset.door === 'closed') cabinStatus.textContent = `${button.title} 이동 중`;
    else setCabinDoor(false);
    refreshCabin();
  });
  document.getElementById('cabin-floor-buttons').append(button);
  cabinFloorButtons.push(button);
});

function enterCabin(carIndex) {
  if (transitioning || elevatorEntering) return;
  const art = document.getElementById('cabin-art');
  if (!art.complete || !art.naturalWidth) {
    return;
  }
  cabinReturnFocus = document.activeElement;
  const car = elevatorCars[carIndex];
  // 닫혀 있으면 문이 열리는 동안 기다렸다가 탄다(전력이 없어 문이 못 열릴 때는 바로 들어간다).
  if (!car.open && elevatorHasPower()) {
    car.open = true;
    elevatorOpenTime[carIndex] = 0;
    playGameSound('elevator-door');
    refreshSceneElevatorDoors();
    elevatorEntering = { carIndex, remaining: 1200 };
    return;
  }
  if (!car.open) playGameSound('elevator-door');
  transitionScene(() => showCabin(carIndex));
}

function showCabin(carIndex) {
  cabinCarIndex = carIndex;
  selectedFloor = null;
  cabinArrivalOpen = false;
  cabinAutoClose = 0;
  cabinDoorAmount = 1;
  cabinScene.style.setProperty('--door-open', '1');
  selectingFloor = true;
  renderHallucination();
  releaseInput();
  elevatorCars[carIndex].rider = true;
  elevatorCars[carIndex].open = true;
  cabinScene.dataset.door = 'open';
  stage.inert = true;
  cabin.hidden = false;
  cabinStatus.textContent = `${floorShortLabel(elevatorCars[carIndex].floor)} · 문 열림`;
  refreshCabin();
  cabin.scrollLeft = cabin.scrollWidth - cabin.clientWidth;
}

function arriveCabinAt(car, floor) {
  car.floor = floor;
  car.destination = null;
  car.travelling = false;
  car.elapsed = 0;
  selectedFloor = null;
  cabinAutoClose = 0;
  car.open = false;
  cabinDoorAmount = 0;
  cabinScene.style.setProperty('--door-open', '0');
  cabinScene.dataset.door = 'closed';
  cabinArrivalOpen = true;
  playGameSound('elevator-arrive');
  cabinStatus.textContent = `${floorShortLabel(floor)} 도착`;
  refreshSceneElevatorDoors();
  refreshCabin();
}

function refreshCabin() {
  if (cabinCarIndex === null) return;
  const car = elevatorCars[cabinCarIndex];
  const label = car.floor < 0 ? `B${-car.floor}` : String(car.floor);
  const powered = elevatorHasPower();
  const display = `${car.travelling && powered ? (car.destination > car.floor ? '↑' : '↓') : ''}${label}`;
  if (cabinDisplay.textContent !== display) cabinDisplay.textContent = display;
  cabin.dataset.moving = String(car.travelling && powered);
  cabinScene.dataset.powered = String(powered);
  cabin.dataset.floor = car.floor;
  cabinScene.dataset.floor = car.floor;
  // The cabin uses the building circuit; restoring one floor does not relight a moving car.
  cabinScene.dataset.blackout = String(buildingBlackout);
  const hallBlackout = !floorHasLighting(car.floor) || (car.floor === 17 && world.dataset.lights === 'off');
  cabinScene.dataset.hallBlackout = String(hallBlackout);
  // Read the same artwork as the corridor so new floors and art replacements stay in sync.
  const hallArt = car.floor === 17 ? corridorBackground.dataset.litSrc : FLOOR_LAYOUTS[car.floor].backgroundImage.src;
  const hallSrc = hallBlackout && switchableBackgrounds.has(hallArt) ? hallArt.replace(/\.png$/, '-off.png') : hallArt;
  const hallImage = `url("${hallSrc}")`;
  if (cabinDoorway.style.backgroundImage !== hallImage) cabinDoorway.style.backgroundImage = hallImage;
  cabinOpen.disabled = car.travelling;
  cabinClose.disabled = !powered || car.travelling;
  cabinExit.disabled = car.travelling || cabinScene.dataset.door !== 'open';
  for (const button of cabinFloorButtons) {
    button.disabled = !powered || car.travelling || Number(button.dataset.floor) === car.floor;
    button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === (car.travelling ? car.destination : selectedFloor)));
  }
  if (!powered) cabinStatus.textContent = elevatorPowerMessage;
  else if (cabinStatus.textContent === elevatorPowerMessage) cabinStatus.textContent = car.travelling ?
    `${floorShortLabel(car.destination)} 이동 중` : `${floorShortLabel(car.floor)} · 문 열림`;
}

function setCabinDoor(open) {
  const car = elevatorCars[cabinCarIndex];
  if (transitioning || !car || car.travelling) return;
  if (!open && !elevatorHasPower()) {
    cabinStatus.textContent = elevatorPowerMessage;
    return;
  }
  cabinAutoClose = 0;
  const phase = cabinScene.dataset.door;
  if (phase === 'struggle') return; // 로봇과 문을 두고 버티는 중(cabin-pry.js)
  if (phase === (open ? 'open' : 'closed') || phase === (open ? 'opening' : 'closing')) return;
  playGameSound('elevator-door');
  car.open = open;
  cabinScene.dataset.door = open ? 'opening' : 'closing';
  cabinStatus.textContent = open ? '문이 열립니다.' : '문이 닫힙니다.';
  refreshSceneElevatorDoors();
  refreshCabin();
}

function updateCabin() {
  if (cabinCarIndex === null) return;
  if (updateCabinPry()) return; // 쫓던 순찰 로봇이 문을 억지로 여는 장면(cabin-pry.js)
  const car = elevatorCars[cabinCarIndex];
  if (!elevatorHasPower() && !car.travelling) {
    selectedFloor = null;
    cabinAutoClose = 0;
    setCabinDoor(true);
  }
  if (cabinAutoClose > 0) {
    cabinAutoClose = Math.max(0, cabinAutoClose - step);
    if (!cabinAutoClose) setCabinDoor(false);
  }
  if (cabinScene.dataset.door === 'opening' || cabinScene.dataset.door === 'closing') {
    cabinDoorAmount = Math.max(0, Math.min(1, cabinDoorAmount + (car.open ? 1 : -1) * step / 1100));
    cabinScene.style.setProperty('--door-open', cabinDoorAmount);
    if (cabinDoorAmount === (car.open ? 1 : 0)) cabinScene.dataset.door = car.open ? 'open' : 'closed';
  }
  if (selectedFloor !== null && cabinScene.dataset.door === 'open') setCabinDoor(false);
  if (cabinArrivalOpen && !transitioning) {
    cabinArrivalOpen = false;
    setCabinDoor(true);
  }
  if (elevatorHasPower() && !transitioning && !car.travelling && cabinScene.dataset.door === 'closed' && selectedFloor !== null) {
    const floor = selectedFloor;
    cabinStatus.textContent = `${floorShortLabel(floor)} 이동 중`;
    transitionScene(() => arriveCabinAt(car, floor));
  }
  refreshCabin();
}

function exitCabin() {
  if (transitioning || cabinCarIndex === null || cabinExit.disabled) return;
  transitionScene(leaveCabin);
}

function leaveCabin() {
  const car = elevatorCars[cabinCarIndex];
  const destination = ALL_FLOORS.find(entry => entry.floor === car.floor);
  car.rider = false;
  selectingFloor = false;
  cabin.hidden = true;
  stage.inert = false;
  releaseInput();
  performFloorChange(destination.id, cabinCarIndex);
  cabinCarIndex = null;
}
cabinOpen.addEventListener('click', () => setCabinDoor(true));
cabinClose.addEventListener('click', () => setCabinDoor(false));
cabinExit.addEventListener('click', exitCabin);
document.getElementById('cabin-alarm').addEventListener('click', () => {
  if (transitioning) return;
  cabinStatus.textContent = '비상벨 작동';
  playGameSound('elevator-alarm');
});
cabin.addEventListener('keydown', event => {
  if (event.code !== 'Tab') return;
  const enabled = [...cabin.querySelectorAll('button:not(:disabled)')];
  const index = enabled.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
  else if (!event.shiftKey && (index === -1 || index === enabled.length - 1)) { event.preventDefault(); enabled[0].focus(); }
});
