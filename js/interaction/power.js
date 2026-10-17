// 태양광은 선택한 층의 조명만 공급한다. 승강기·비상 설비는 17층 관리실의 별도 UPS 회선을 쓴다.
// 한 층만 켜진다. 다른 층을 켜면 이전 층이 꺼지고, 켜진 층을 다시 누르면 공급을 끈다.
const powerPanel = document.getElementById('power-panel');
const powerGrid = document.getElementById('power-floor-grid');
const powerStatus = document.getElementById('power-status');
const powerLever = document.getElementById('power-lever');
let powerBlocked = [];

function floorHasLighting(floor) {
  if (floor === -1 || floor === -2) return true;
  if (floor === 18) return solarEnabled;
  return floor >= 1 && floor <= 17 && (!buildingBlackout || (solarEnabled && solarPoweredFloors.includes(floor)));
}

function floorHasPower(floor) {
  if (floor === -1 || floor === -2) return true;
  if (floor === 18) return solarEnabled;
  return floor >= 1 && floor <= 17 && (!buildingBlackout || collectedItems.has('f17-emergency-linked'));
}

// 전력이 있어야 반응하는 장치: 잠긴 문의 카드 리더기·도어락, 출입 게이트, 컴퓨터, 버튼·선택기·연속 조작 장비(opens·cycle·sequence),
// 화면·단말(surface 'screen', poweredSprite, needsPower). 그 층에 전력이 들어오지 않으면(floorHasLighting, 층별 태양광 공급) 힌트도
// 테두리도 없고 E를 눌러도 아무 반응이 없다(interaction.js). 지하(B1·B2)는 늘 켜져 있다. 휴대폰 충전기·엘리베이터는 UPS(floorHasPower)를 따른다.
// selfPowered: 배터리·별도 회선으로 정전 중에도 살아 있는 장치(층 문구가 정전 상태 기준으로 쓰인 3·4·7·8층 퍼즐, 1층 로봇 정비 패널 등).
function needsFloorPower(door) {
  if (door.selfPowered) return false;
  const electronic = Boolean(door.surface === 'screen' || door.needsPower || door.code || door.control?.kind === 'card');
  // 이미 열린 문은 그냥 드나든다. 잠긴 문의 전자 잠금·표시창만 전력이 필요하다.
  if (door.type === 'room') return Boolean(door.locked) && electronic;
  return electronic || door.type === 'computer' || Boolean(door.accessGate || door.opens || door.cycle || door.sequence || door.poweredSprite);
}

function deviceUnpowered(door) {
  return needsFloorPower(door) && !floorHasLighting(currentSceneFloor);
}

function openEmergencyCircuit() {
  if (collectedItems.has('f17-emergency-linked')) return openInspection('비상 전력 분배반', '회선 네 가닥이 올바르게 연결되어 있다. 별도 UPS가 승강기와 비상 설비에 전력을 공급한다.');
  if (!collectedItems.has('f17-circuit-guide-read')) return openInspection('비상 전력 분배반', '단자 표기가 서로 다르다. 옆 책상의 비상 전력 회로 안내도를 먼저 확인하자.');
  openWirePanel(() => {
    collectedItems.add('f17-emergency-linked');
    updatePowerState();
    playGameSound('switch');
    saveProgress();
    openInspection('비상 전력 연결 완료', 'UPS의 녹색 표시등이 켜졌다. 엘리베이터와 비상 설비에 전력이 공급된다. 태양광 조명을 꺼도 승강기는 멈추지 않는다.');
  }, 'elevator');
}

// 선택한 층과 공급 한도를 적는다. 예: 12F 전력 공급 중 (1/1)
function solarPowerStatus() {
  if (!solarEnabled) return '비상 전력 꺼짐';
  const count = `(${solarPoweredFloors.length}/${solarFloorLimit})`;
  return solarPoweredFloors.length ? `${solarPoweredFloors.map(floor => `${floor}F`).join(' · ')} 전력 공급 중 ${count}` : `공급할 층 선택 ${count}`;
}

function updatePowerState() {
  const solarPowered = solarEnabled && solarPoweredFloors.includes(currentSceneFloor);
  const aboveGround = currentSceneFloor >= 1 && currentSceneFloor <= 17;
  // B1 방재 관제실의 소등 컷씬(cctv-event.js)이 끝나면 지하(B1·B2)의 전등이 모두 꺼진다. 모든 층 전력 활성화(콘솔)를 켜면 다시 켜진다.
  const undergroundLightsOut = currentSceneFloor < 0 && collectedItems.has('b1-lights-out') && !allPowerOverride;
  const blackout = (aboveGround && buildingBlackout && !solarPowered) || undergroundLightsOut;
  world.dataset.blackout = String(blackout);
  world.dataset.powered = String(floorHasPower(currentSceneFloor));
  refreshBackgroundPower();
  refreshReady();
  updateGuardPatrol(0);
  document.querySelectorAll('#power-floor-grid button').forEach(button => {
    const active = solarPoweredFloors.includes(Number(button.dataset.floor));
    button.disabled = !solarEnabled;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  powerPanel.dataset.enabled = String(solarEnabled);
  powerLever.setAttribute('aria-pressed', String(solarEnabled));
  powerLever.setAttribute('aria-label', solarEnabled ? '레버 올리기 · 비상 전력 끄기' : '레버 내리기 · 비상 전력 켜기');
  document.getElementById('power-lever-label').textContent = solarEnabled ? 'ON · 올려서 끄기' : 'OFF · 내려서 켜기';
  powerStatus.value = solarPowerStatus();
  const supply = document.querySelector('.solar-supply');
  if (supply) {
    supply.dataset.active = String(solarEnabled);
    supply.setAttribute('aria-label', `태양광 임시 전력장치 · ${solarEnabled ? '전원 켜짐' : '전원 꺼짐'}`);
  }
  if (selectingFloor) refreshCabin();
  refreshOfficeComputerPower();
  refreshPhone();
  if (typeof refreshBuildingGuides === 'function') refreshBuildingGuides();
  if (typeof refreshSolarDownload === 'function') refreshSolarDownload();
}

function setSolarPower(enabled) {
  if (solarEnabled !== enabled) playGameSound('switch');
  solarEnabled = enabled;
  if (!enabled) solarPoweredFloors = [];
  updatePowerState();
}

function supplySolarFloor(floor) {
  if (!solarEnabled || !Number.isInteger(floor) || floor < 1 || floor > 17) return;
  playGameSound('switch');
  const button = powerGrid.querySelector(`[data-floor="${floor}"]`);
  button.classList.remove('suggested');
  button.removeAttribute('aria-label');
  if (solarPoweredFloors.includes(floor)) {
    solarPoweredFloors = solarPoweredFloors.filter(entry => entry !== floor);
    updatePowerState();
    return;
  }
  solarPoweredFloors = [...solarPoweredFloors, floor].slice(-solarFloorLimit);
  updatePowerState();
}

function refreshSolarApp() {
  const available = collectedItems.has('solar-app-installed') && phoneBattery > 0 && !phoneDock;
  document.getElementById('phone-solar-status').textContent = !available ? '휴대폰을 사용할 수 없습니다.' :
    `장치 연결됨 · ${solarPowerStatus()}`;
  document.getElementById('phone-solar-supply').disabled = !available || !solarEnabled;
  document.getElementById('phone-solar-floor').disabled = !available || !solarEnabled;
  document.getElementById('phone-solar-supply').textContent = solarPoweredFloors.includes(Number(document.getElementById('phone-solar-floor').value)) ? '선택 층 전력 끄기' : '선택 층 전력 공급';
}

// 콘솔 창의 '모든 층 전력 활성화'(테스트용): 켜면 건물 정전 상태를 잠시 해제해(buildingBlackout을 false로) 모든 층의 조명·컴퓨터·충전·
// 엘리베이터·경비 로봇 등 전력이 필요한 기능을 쓴다. 끄면 켜기 전의 정전 상태로 되돌린다. 켜 있는 동안에도 실제 정전 여부는
// realBuildingBlackout()이 기억하고, 저장·정전 컷씬·목표는 그 값을 따른다.
let allPowerOverride = false;
let allPowerSavedBlackout = false;

function realBuildingBlackout() {
  return allPowerOverride ? allPowerSavedBlackout : buildingBlackout;
}

function syncAllPowerButton() {
  const button = document.getElementById('debug-all-power');
  if (!button) return;
  button.setAttribute('aria-pressed', String(allPowerOverride));
  button.textContent = `모든 층 전력 활성화 · ${allPowerOverride ? 'ON' : 'OFF'}`;
}

function setAllFloorsPower(on) {
  if (on === allPowerOverride) return;
  allPowerOverride = on;
  if (on) {
    allPowerSavedBlackout = buildingBlackout;
    buildingBlackout = false;
  } else {
    buildingBlackout = allPowerSavedBlackout;
  }
  updatePowerState();
  syncAllPowerButton();
}

function triggerBuildingBlackout() {
  if (realBuildingBlackout()) return;
  playGameSound('blackout');
  if (allPowerOverride) {
    // 모든 층 전력이 켜져 있으면 정전은 기록만 해 두고, 콘솔을 끌 때 적용한다.
    allPowerSavedBlackout = true;
    return;
  }
  buildingBlackout = true;
  updatePowerState();
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
  if (floor === 17) {
    button.classList.add('suggested');
    button.setAttribute('aria-label', '17F · 조명 켜기');
  }
  button.addEventListener('click', () => {
    supplySolarFloor(floor);
  });
  powerGrid.append(button);
  document.getElementById('phone-solar-floor').add(new Option(`${floor}층`, String(floor)));
}

document.getElementById('phone-solar-supply').addEventListener('click', () => {
  if (!usingPhone || currentPhoneApp !== 'solar' || !collectedItems.has('solar-app-installed') || phoneBattery <= 0 || phoneDock) return;
  supplySolarFloor(Number(document.getElementById('phone-solar-floor').value));
  saveProgress();
});
document.getElementById('phone-solar-floor').addEventListener('change', refreshSolarApp);

let leverStartY = null;
let leverDrag = 0;
powerLever.addEventListener('click', () => {
  const wrongDirection = Math.abs(leverDrag) >= 24 && (leverDrag > 0) === solarEnabled;
  leverDrag = 0;
  if (wrongDirection) return;
  if (!solarEnabled) {
    // 비밀번호(와 전선 복구)는 처음 한 번만 — 그 뒤로는 레버만 내리면 바로 켜진다.
    if (collectedItems.has('roof-wires-fixed')) { setSolarPower(true); return; }
    closePowerPanel();
    openKeypad({ type: 'power', name: '태양광 비상 전력 승인', code: '1997',
      codePrompt: '4자리 승인번호를 입력하세요. ※ 승인번호는 관리 게시판에 게시되어 있습니다.' });
    return;
  }
  setSolarPower(false);
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
