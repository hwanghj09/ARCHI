// 휴대폰(P): UI를 열어 배터리를 확인하고 F 또는 버튼으로 라이트를 켠다.
const phonePanel = document.getElementById('phone');
const phoneBatteryOutput = document.getElementById('phone-battery');
const phoneBatteryFill = document.getElementById('phone-battery-fill');
const phoneLightButton = document.getElementById('phone-light');
let phoneDrainAccumulator = 0;

function refreshPhone() {
  const percent = Math.max(0, Math.ceil(phoneBattery));
  phoneBatteryOutput.value = `${percent}%`;
  phoneBatteryFill.style.width = `${percent}%`;
  phoneBatteryFill.style.background = percent <= 20 ? '#e27b68' : '#8fe06a';
  phoneLightButton.disabled = percent === 0;
  phoneLightButton.setAttribute('aria-pressed', String(phoneLightOn));
  phoneLightButton.firstChild.textContent = phoneLightOn ? '라이트 끄기 ' : '라이트 켜기 ';
  world.dataset.flashlight = phoneLightOn ? 'on' : 'off';
}

function togglePhone() {
  if (playerCaught) return;
  if (usingPhone) return closePhone();
  usingPhone = true;
  phoneHeld = true;
  phoneTime = 0;
  phoneAwayTime = 0;
  phonePanel.hidden = false;
  releaseInput();
  animate(0);
  refreshPhone();
  phoneLightButton.focus();
}

function closePhone() {
  if (!usingPhone) return;
  usingPhone = false;
  phoneAwayTime = 0;
  phonePanel.hidden = true;
  animate(0);
  stage.focus();
}

function togglePhoneLight() {
  if (playerCaught) return;
  if (!phoneLightOn && phoneBattery <= 0) return showStatus('휴대폰 배터리가 없습니다.');
  phoneLightOn = !phoneLightOn;
  phoneHeld = true;
  phoneAwayTime = 0;
  if (usingPhone) animate(0);
  refreshPhone();
  showStatus(`휴대폰 라이트를 ${phoneLightOn ? '켰습니다' : '껐습니다'}.`);
}

function stowPhone() {
  closePhone();
  phoneHeld = false;
  phoneLightOn = false;
  phoneAwayTime = 360;
  animate(0);
  refreshPhone();
}

function updatePhone(elapsed) {
  if (!phoneLightOn) return;
  phoneDrainAccumulator += elapsed;
  if (phoneDrainAccumulator < 1000) return;
  phoneBattery = Math.max(0, phoneBattery - Math.floor(phoneDrainAccumulator / 1000));
  phoneDrainAccumulator %= 1000;
  if (phoneBattery === 0) {
    phoneLightOn = false;
    showStatus('휴대폰 배터리가 모두 소모되어 라이트가 꺼졌습니다.');
  }
  refreshPhone();
}

phoneLightButton.addEventListener('click', togglePhoneLight);
document.getElementById('phone-close').addEventListener('click', closePhone);
document.getElementById('phone-stow').addEventListener('click', stowPhone);
refreshPhone();
