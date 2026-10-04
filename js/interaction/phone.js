// 휴대폰(P): UI를 열어 배터리를 확인하고 F 또는 버튼으로 라이트를 켠다.
const phonePanel = document.getElementById('phone');
const phoneBatteryOutput = document.getElementById('phone-battery');
const phoneBatteryFill = document.getElementById('phone-battery-fill');
const phoneLightButton = document.getElementById('phone-light');
let phoneDrainAccumulator = 0;
let phoneBlocked = [];

function refreshPhone() {
  const percent = Math.max(0, Math.ceil(phoneBattery));
  phoneBatteryOutput.value = `${percent}%`;
  phoneBatteryFill.style.width = `${percent}%`;
  phoneBatteryFill.style.background = percent <= 20 ? '#e27b68' : '#8fe06a';
  phoneLightButton.disabled = percent === 0;
  phoneLightButton.setAttribute('aria-pressed', String(phoneLightOn));
  phoneLightButton.setAttribute('aria-label', phoneLightOn ? '플래시 끄기' : '플래시 켜기');
  document.getElementById('phone-light-state').textContent = phoneLightOn ? '켜짐' : '꺼짐';
  document.getElementById('phone-help').textContent = percent === 0 ? '배터리가 소진되었습니다.' :
    phoneLightOn ? '앞을 비추고 있습니다. 화면을 닫고 이동하세요.' : '플래시를 켜면 앞을 비추며 걸을 수 있습니다.';
  world.dataset.flashlight = phoneLightOn ? 'on' : 'off';
}

function togglePhone() {
  if (playerCaught || blackoutSceneActive) return;
  if (usingPhone) return closePhone();
  usingPhone = true;
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
  if (!phoneLightOn && phoneBattery <= 0) return showStatus('휴대폰 배터리가 없습니다.');
  phoneLightOn = !phoneLightOn;
  phoneAwayTime = !phoneLightOn && !usingPhone ? 360 : 0;
  if (usingPhone || Math.abs(body.velocity.x) < .01) animate(0);
  refreshPhone();
  showStatus(`휴대폰 라이트를 ${phoneLightOn ? '켰습니다' : '껐습니다'}.`);
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
refreshPhone();
