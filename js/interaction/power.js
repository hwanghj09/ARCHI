// 옥상 태양광 발전기: 1~17층 중 한 층만 선택해 정전 상태를 해제한다.
const powerPanel = document.getElementById('power-panel');
const powerGrid = document.getElementById('power-floor-grid');
const powerStatus = document.getElementById('power-status');
const powerLever = document.getElementById('power-lever');
let powerBlocked = [];

function updatePowerState() {
  const emergencyPowered = currentSceneFloor === -1 || currentSceneFloor === -2;
  const solarPowered = currentSceneFloor === solarPoweredFloor;
  const aboveGround = currentSceneFloor >= 1 && currentSceneFloor <= 17;
  const mainsPowered = aboveGround && !buildingBlackout;
  const blackout = aboveGround && buildingBlackout && !solarPowered;
  world.dataset.blackout = String(blackout);
  world.dataset.powered = String(emergencyPowered || mainsPowered || solarPowered);
  refreshBackgroundPower();
  refreshReady();
  document.querySelectorAll('#power-floor-grid button').forEach(button => {
    button.disabled = !solarEnabled;
    button.classList.toggle('active', Number(button.dataset.floor) === solarPoweredFloor);
    button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === solarPoweredFloor));
  });
  powerPanel.dataset.enabled = String(solarEnabled);
  powerLever.setAttribute('aria-pressed', String(solarEnabled));
  powerLever.setAttribute('aria-label', solarEnabled ? '레버 올리기 · 비상 전력 끄기' : '레버 내리기 · 비상 전력 켜기');
  document.getElementById('power-lever-label').textContent = solarEnabled ? 'ON · 올려서 끄기' : 'OFF · 내려서 켜기';
  powerStatus.value = !solarEnabled ? '비상 전력 꺼짐' : solarPoweredFloor ? `${solarPoweredFloor}층 전력 공급 중` : '비상 전력 켜짐 · 층 선택';
  const supply = document.querySelector('.solar-supply');
  if (supply) {
    supply.dataset.active = String(solarEnabled);
    supply.setAttribute('aria-label', `태양광 임시 전력장치 · ${solarEnabled ? '전원 켜짐' : '전원 꺼짐'}`);
  }
}

function triggerBuildingBlackout() {
  if (buildingBlackout) return;
  buildingBlackout = true;
  updatePowerState();
  showStatus('갑자기 건물 전체의 불이 꺼졌다. 휴대폰(P)의 라이트를 켜 보자.', 6000);
}

function openPowerPanel() {
  usingPowerPanel = true;
  powerPanel.hidden = false;
  releaseInput();
  powerBlocked = [...document.body.children].filter(element => element !== powerPanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of powerBlocked) element.inert = true;
  updatePowerState();
  (solarEnabled ? powerGrid.querySelector('button.active') || powerGrid.querySelector('button') : powerLever).focus();
}

function closePowerPanel() {
  usingPowerPanel = false;
  powerPanel.hidden = true;
  for (const element of powerBlocked) element.inert = false;
  powerBlocked = [];
  stage.focus();
}

for (let floor = 17; floor >= 1; floor -= 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.floor = String(floor);
  button.textContent = `${floor}F`;
  button.addEventListener('click', () => {
    if (!solarEnabled) return;
    solarPoweredFloor = floor;
    updatePowerState();
    showStatus(`${floor}층에 태양광 비상 전력을 공급합니다.`);
  });
  powerGrid.append(button);
}

let leverStartY = null;
let leverDrag = 0;
powerLever.addEventListener('click', () => {
  const wrongDirection = Math.abs(leverDrag) >= 24 && (leverDrag > 0) === solarEnabled;
  leverDrag = 0;
  if (wrongDirection) return;
  solarEnabled = !solarEnabled;
  if (!solarEnabled) solarPoweredFloor = null;
  updatePowerState();
});
// Dragging down operates the same native button as click, touch and keyboard.
powerLever.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  leverStartY = event.clientY;
  leverDrag = 0;
  powerLever.setPointerCapture(event.pointerId);
});
powerLever.addEventListener('pointerup', event => {
  if (leverStartY === null) return;
  leverDrag = event.clientY - leverStartY;
  leverStartY = null;
});
powerLever.addEventListener('pointercancel', () => { leverStartY = null; leverDrag = 0; });
document.getElementById('power-close').addEventListener('click', closePowerPanel);
updatePowerState();
