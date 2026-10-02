// 옥상 태양광 발전기: 1~17층 중 한 층만 선택해 정전 상태를 해제한다.
const powerPanel = document.getElementById('power-panel');
const powerGrid = document.getElementById('power-floor-grid');
const powerStatus = document.getElementById('power-status');

function updatePowerState() {
  const emergencyPowered = currentSceneFloor === -1 || currentSceneFloor === -2;
  const solarPowered = currentSceneFloor === solarPoweredFloor;
  const blackout = currentSceneFloor >= 1 && currentSceneFloor <= 17 && !solarPowered;
  world.dataset.blackout = String(blackout);
  world.dataset.powered = String(emergencyPowered || solarPowered);
  refreshBackgroundPower();
  refreshReady();
  document.querySelectorAll('#power-floor-grid button').forEach(button => {
    button.classList.toggle('active', Number(button.dataset.floor) === solarPoweredFloor);
    button.setAttribute('aria-pressed', String(Number(button.dataset.floor) === solarPoweredFloor));
  });
  powerStatus.value = solarPoweredFloor ? `${solarPoweredFloor}층 전력 공급 중` : '공급 중인 층 없음';
  document.querySelector('.solar-supply')?.setAttribute('data-active', String(solarPoweredFloor !== null));
}

function openPowerPanel() {
  usingPowerPanel = true;
  powerPanel.hidden = false;
  releaseInput();
  updatePowerState();
  powerGrid.querySelector('button')?.focus();
}

function closePowerPanel() {
  usingPowerPanel = false;
  powerPanel.hidden = true;
  stage.focus();
}

for (let floor = 17; floor >= 1; floor -= 1) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.floor = String(floor);
  button.textContent = `${floor}F`;
  button.addEventListener('click', () => {
    solarPoweredFloor = floor;
    updatePowerState();
    showStatus(`${floor}층에 태양광 비상 전력을 공급합니다.`);
  });
  powerGrid.append(button);
}

document.getElementById('power-off').addEventListener('click', () => {
  solarPoweredFloor = null;
  updatePowerState();
  showStatus('태양광 비상 전력 공급을 중단했습니다.');
});
document.getElementById('power-close').addEventListener('click', closePowerPanel);
updatePowerState();
