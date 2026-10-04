// 엘리베이터 내부 화면: 층 버튼, 문 열고 닫기, 비상벨, 내리기.
const cabin = document.getElementById('elevator-cabin');
const cabinScene = document.getElementById('cabin-scene');
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
    if (button.dataset.restricted && selectedFloor !== floor && !collectedItems.has(restrictionItem)) {
      cabinStatus.textContent = `${button.title}은 운행 제한 중이다. 버튼 옆 표시: "SYSTEM 제한 · 해제는 B1 방재 관제실".`;
      return;
    }
    selectedFloor = selectedFloor === floor ? null : floor;
    cabinAutoClose = selectedFloor === null ? 0 : 1600;
    cabinStatus.textContent = selectedFloor === null ? '층 선택 취소' : `${button.title} 선택`;
    refreshCabin();
  });
  document.getElementById('cabin-floor-buttons').append(button);
  cabinFloorButtons.push(button);
});

function enterCabin(carIndex) {
  if (transitioning) return;
  const art = document.getElementById('cabin-art');
  if (!art.complete || !art.naturalWidth) {
    showStatus('엘리베이터 내부 이미지를 불러오지 못했습니다. 다시 시도해 주세요.');
    return;
  }
  cabinReturnFocus = document.activeElement;
  transitionScene(() => showCabin(carIndex));
}

function showCabin(carIndex) {
  cabinCarIndex = carIndex;
  selectedFloor = null;
  cabinAutoClose = 0;
  cabinDoorAmount = 1;
  cabinScene.style.setProperty('--door-open', '1');
  selectingFloor = true;
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
  cabinScene.dataset.hallBlackout = String(buildingBlackout && car.floor > 0 && car.floor !== solarPoweredFloor);
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
  if (phase === (open ? 'open' : 'closed') || phase === (open ? 'opening' : 'closing')) return;
  car.open = open;
  cabinScene.dataset.door = open ? 'opening' : 'closing';
  cabinStatus.textContent = open ? '문이 열립니다.' : '문이 닫힙니다.';
  refreshSceneElevatorDoors();
  refreshCabin();
}

function updateCabin() {
  if (cabinCarIndex === null) return;
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
  if (elevatorHasPower() && !car.travelling && cabinScene.dataset.door === 'closed' && selectedFloor !== null && !cabinAutoClose) {
    car.destination = selectedFloor;
    car.travelling = true;
    car.elapsed = 0;
    cabinStatus.textContent = `${floorShortLabel(selectedFloor)} 이동 중`;
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
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext || gameVolume === 0) return;
  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  gain.gain.value = .08 * gameVolume;
  oscillator.frequency.value = 880;
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + .4);
  oscillator.onended = () => { audio.close(); };
});
cabin.addEventListener('keydown', event => {
  if (event.code !== 'Tab') return;
  const enabled = [...cabin.querySelectorAll('button:not(:disabled)')];
  const index = enabled.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
  else if (!event.shiftKey && (index === -1 || index === enabled.length - 1)) { event.preventDefault(); enabled[0].focus(); }
});
