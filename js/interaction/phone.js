// 휴대폰(P): UI를 열어 배터리를 확인하고 F 또는 버튼으로 라이트를 켠다.
const phonePanel = document.getElementById('phone');
const phoneBatteryOutput = document.getElementById('phone-battery');
const phoneBatteryFill = document.getElementById('phone-battery-fill');
const phoneLightButton = document.getElementById('phone-light');
const phoneButton = document.getElementById('phone-button');
let phoneDrainAccumulator = 0;
let phoneChargeAccumulator = 0;
let phoneBlocked = [];

function phoneDockLocation() {
  return phoneDock.floor === 18 ? '옥상' : phoneDock.floor < 0 ? `지하 ${-phoneDock.floor}층` : `${phoneDock.floor}층`;
}

function isPhoneDock(door) {
  return phoneDock?.floor === currentSceneFloor && phoneDock.x === door.x;
}

function phoneChargeState() {
  return phoneBattery >= 100 ? '충전 완료' : floorHasPower(phoneDock.floor) ? '충전 중' : '전력 없음 · 충전 중단';
}

function phoneChargerHint(door) {
  if (isPhoneDock(door)) return `E · 휴대폰 가져가기 · ${Math.ceil(phoneBattery)}% · ${phoneChargeState()}`;
  if (phoneDock) return `휴대폰은 ${phoneDockLocation()} 충전함에 있습니다`;
  return floorHasPower(currentSceneFloor) ? 'E · 휴대폰 맡겨 충전' : 'E · 충전 불가 · 전력 없음';
}

function refreshPhoneChargers() {
  for (const door of new Set([...doors, ...currentDoors])) {
    if (!door.phoneCharger) continue;
    const docked = isPhoneDock(door);
    door.element.dataset.powered = String(floorHasPower(currentSceneFloor));
    door.element.dataset.docked = String(docked);
    let image = door.element.querySelector('.docked-phone');
    if (docked && !image) {
      image = new Image();
      image.className = 'docked-phone';
      image.src = 'assets/ui/phone-device.png';
      image.alt = '';
      door.element.append(image);
    } else if (!docked) image?.remove();
    door.element.setAttribute('aria-label', `${door.name} · ${docked ? `${Math.ceil(phoneBattery)}% · ${phoneChargeState()}` : floorHasPower(currentSceneFloor) ? '전력 공급 중' : '전력 없음'}`);
  }
}

function refreshPhone() {
  const percent = Math.max(0, Math.ceil(phoneBattery));
  phoneBatteryOutput.value = `${percent}%`;
  phoneBatteryFill.style.width = `${percent}%`;
  phoneBatteryFill.style.background = percent <= 20 ? '#e27b68' : '#8fe06a';
  phoneLightButton.disabled = percent === 0 || Boolean(phoneDock);
  phoneLightButton.setAttribute('aria-pressed', String(phoneLightOn));
  phoneLightButton.setAttribute('aria-label', phoneLightOn ? '플래시 끄기' : '플래시 켜기');
  document.getElementById('phone-light-state').textContent = phoneLightOn ? '켜짐' : '꺼짐';
  document.getElementById('phone-help').textContent = percent === 0 ? '배터리가 소진되었습니다. 전력이 공급되는 충전함 앞에서 E로 휴대폰을 맡기세요.' :
    phoneLightOn ? '앞을 비추고 있습니다. 화면을 닫고 이동하세요.' : '플래시를 켜면 앞을 비추며 걸을 수 있습니다.';
  world.dataset.flashlight = phoneLightOn ? 'on' : 'off';
  phoneButton.dataset.docked = String(Boolean(phoneDock));
  phoneButton.dataset.charge = phoneDock ? `${phoneDockLocation()} · ${percent}% · ${phoneChargeState()}` : '';
  phoneButton.setAttribute('aria-label', phoneDock ? `${phoneButton.dataset.charge} · 충전함에서 휴대폰 가져오기` : '휴대폰 열기');
  refreshPhoneChargers();
}

function togglePhone() {
  if (playerCaught || blackoutSceneActive) return;
  if (usingPhone) return closePhone();
  if (phoneDock) return showStatus(`${phoneDockLocation()} 충전함에 휴대폰을 두었다. 그 충전함 앞에서 E로 가져오자.`, 4000);
  usingPhone = true;
  playGameSound('phone');
  phoneTime = 0;
  phoneAwayTime = 0;
  phonePanel.hidden = false;
  releaseInput();
  animate(0);
  refreshPhone();
  phoneBlocked = [...document.body.children].filter(element => element !== phonePanel && element.tagName !== 'SCRIPT' && !element.inert);
  for (const element of phoneBlocked) element.inert = true;
  (phoneBattery > 0 ? phoneLightButton : document.getElementById('phone-close')).focus();
}

function closePhone() {
  if (!usingPhone) return;
  usingPhone = false;
  phoneAwayTime = phoneLightOn ? 0 : 360;
  phonePanel.hidden = true;
  for (const element of phoneBlocked) element.inert = false;
  phoneBlocked = [];
  animate(0);
  stage.focus();
}

function togglePhoneLight() {
  if (playerCaught || blackoutSceneActive) return;
  if (phoneDock) return showStatus(`${phoneDockLocation()} 충전함에 휴대폰을 두어 플래시를 사용할 수 없다.`, 4000);
  if (!phoneLightOn && phoneBattery <= 0) return showStatus('휴대폰 배터리가 없습니다.');
  phoneLightOn = !phoneLightOn;
  playGameSound('phone');
  phoneAwayTime = !phoneLightOn && !usingPhone ? 360 : 0;
  if (usingPhone || Math.abs(body.velocity.x) < .01) animate(0);
  refreshPhone();
  showStatus(`휴대폰 라이트를 ${phoneLightOn ? '켰습니다' : '껐습니다'}.`);
}

function chargePhone(door) {
  if (isPhoneDock(door)) {
    playGameSound('pickup');
    phoneDock = null;
    phoneChargeAccumulator = 0;
    phoneDrainAccumulator = 0;
    refreshPhone();
    showStatus(`휴대폰을 가져왔다. 배터리 ${Math.ceil(phoneBattery)}%.`, 4000);
    return;
  }
  if (phoneDock) return showStatus(`${phoneDockLocation()} 충전함에 둔 휴대폰을 먼저 가져와야 한다.`, 4000);
  if (!floorHasPower(currentSceneFloor)) return showStatus('이 층에 전력이 없어 충전할 수 없다. 전력을 공급해야 한다.', 4000);
  if (phoneBattery >= 100) {
    showStatus('휴대폰 배터리가 이미 100%다.', 3000);
    return;
  }
  phoneDock = { floor: currentSceneFloor, x: door.x };
  playGameSound('charger');
  phoneLightOn = false;
  phoneAwayTime = 0;
  phoneChargeAccumulator = 0;
  phoneDrainAccumulator = 0;
  refreshPhone();
  animate(0);
  showStatus('휴대폰을 충전함에 두었다. 충전 중에는 사용할 수 없다. 돌아와 E로 가져오자.', 5000);
}

function updatePhoneCharging(elapsed) {
  if (!phoneDock || phoneBattery >= 100 || !floorHasPower(phoneDock.floor)) return;
  phoneChargeAccumulator += elapsed;
  if (phoneChargeAccumulator < 1000) return;
  phoneBattery = Math.min(100, phoneBattery + 2 * Math.floor(phoneChargeAccumulator / 1000));
  phoneChargeAccumulator %= 1000;
  refreshPhone();
  if (phoneBattery === 100) showStatus(`${phoneDockLocation()}의 휴대폰 충전이 끝났다. 충전함에서 E로 가져오자.`, 5000);
}

function updatePhone(elapsed) {
  if (!phoneLightOn) return;
  phoneDrainAccumulator += elapsed;
  if (phoneDrainAccumulator < 1000) return;
  phoneBattery = Math.max(0, phoneBattery - Math.floor(phoneDrainAccumulator / 1000));
  phoneDrainAccumulator %= 1000;
  if (phoneBattery === 0) {
    phoneLightOn = false;
    phoneAwayTime = usingPhone ? 0 : 360;
    showStatus('휴대폰 배터리가 모두 소모되어 라이트가 꺼졌습니다.');
  }
  refreshPhone();
}

phoneLightButton.addEventListener('click', togglePhoneLight);
document.getElementById('phone-close').addEventListener('click', closePhone);
