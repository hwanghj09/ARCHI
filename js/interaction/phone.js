// 휴대폰(P): 플래시와 개인 메모·계산기 앱을 사용한다.
const phonePanel = document.getElementById('phone');
const phoneBatteryOutput = document.getElementById('phone-battery');
const phoneBatteryFill = document.getElementById('phone-battery-fill');
const phoneLightButton = document.getElementById('phone-light');
const phoneButton = document.getElementById('phone-button');
const phoneAppWindow = document.getElementById('phone-app-window');
const phoneNote = document.getElementById('phone-note');
const phoneNoteStatus = document.getElementById('phone-note-status');
let currentPhoneApp = null;
let savedPhoneNote = '';
let phoneDrainAccumulator = 0;
let phoneChargeAccumulator = 0;
let phoneBlocked = [];

function loadPhoneNote() {
  try {
    savedPhoneNote = (localStorage.getItem('archi.phone.note') || '').slice(0, 4000);
    phoneNoteStatus.textContent = savedPhoneNote ? '저장됨' : '';
  } catch {
    phoneNoteStatus.textContent = '저장소에 접근할 수 없습니다. 메모는 이 화면에 남아 있습니다.';
    return;
  }
  phoneNote.value = savedPhoneNote;
}

function openPhoneApp(app) {
  if (!usingPhone || phoneDock || phoneBattery <= 0) return;
  if (app === 'solar' && !collectedItems.has('solar-app-installed')) return;
  const view = [...phoneAppWindow.querySelectorAll('[data-phone-view]')].find(element => element.dataset.phoneView === app);
  if (!view) return;
  currentPhoneApp = app;
  document.getElementById('phone-app-title').textContent = { notes: '개인 메모', calculator: '계산기', solar: '비상 전력 제어', camera: '카메라', gallery: '갤러리' }[app];
  phonePanel.querySelector('.phone-owner').hidden = true;
  phonePanel.querySelector('.phone-controls').hidden = true;
  for (const element of phoneAppWindow.querySelectorAll('[data-phone-view]')) element.hidden = element !== view;
  phoneAppWindow.hidden = false;
  phonePanel.querySelector('.phone-screen').scrollTop = 0;
  if (app === 'camera') refreshPhoneCamera();
  if (app === 'gallery') renderPhoneGallery();
  if (app === 'solar') {
    document.getElementById('phone-solar-floor').value = String(solarPoweredFloors[0] || 17);
    refreshSolarApp();
  }
  playGameSound('phone');
  (app === 'notes' ? phoneNote : app === 'calculator' ? view.querySelector('[data-calculator-key]') : document.getElementById('phone-app-back')).focus();
}

function closePhoneApp(focus = true) {
  const previousApp = currentPhoneApp;
  currentPhoneApp = null;
  phoneAppWindow.hidden = true;
  phonePanel.querySelector('.phone-owner').hidden = false;
  phonePanel.querySelector('.phone-controls').hidden = false;
  if (focus && usingPhone) {
    const button = phonePanel.querySelector(`[data-phone-app="${previousApp}"]`);
    (phoneBattery > 0 ? button || phoneLightButton : document.getElementById('phone-close')).focus();
  }
}

function phoneDockLocation() {
  const floor = phoneDock.floor < 0 ? `지하 ${-phoneDock.floor}층` : `${phoneDock.floor}층`;
  const name = phoneDock.scene === 'office' ? '개발팀 사무실' : floorById.get(phoneDock.scene)?.name;
  return name ? `${floor} ${name}` : floor;
}

function isPhoneDock(door) {
  return Boolean(door) && phoneDock?.scene === door.scene && phoneDock?.floor === door.floor && phoneDock.x === door.x;
}

function phoneChargeState() {
  return phoneBattery >= 100 ? '충전 완료' : floorHasPower(phoneDock.floor) ? '충전 중' : '전력 없음 · 충전 중단';
}

function phoneChargerHint(door) {
  if (isPhoneDock(door)) return `${bindingLabel('interact')} · 휴대폰 가져가기 · ${Math.ceil(phoneBattery)}% · ${phoneChargeState()}`;
  if (phoneDock) return `휴대폰은 ${phoneDockLocation()} 충전 콘센트에 있습니다`;
  return floorHasPower(currentSceneFloor) ? `${bindingLabel('interact')} · 휴대폰 맡겨 충전` : `${bindingLabel('interact')} · 충전 불가 · 전력 없음`;
}

function refreshPhoneChargers() {
  for (const door of new Set([...officeDoors, ...currentDoors])) {
    if (!door.phoneCharger) continue;
    const docked = isPhoneDock(door);
    door.element.dataset.powered = String(floorHasPower(door.floor));
    door.element.dataset.docked = String(docked);
    let image = door.element.querySelector('.docked-phone');
    if (docked && !image) {
      image = new Image();
      image.className = 'docked-phone';
      image.src = 'assets/ui/phone-device.png';
      image.alt = '';
      door.element.append(image);
    } else if (!docked) image?.remove();
    door.element.setAttribute('aria-label', `${door.name} · ${docked ? `${Math.ceil(phoneBattery)}% · ${phoneChargeState()}` : floorHasPower(door.floor) ? '전력 공급 중' : '전력 없음'}`);
  }
}

function refreshPhone() {
  const percent = Math.max(0, Math.ceil(phoneBattery));
  phoneBatteryOutput.value = `${percent}%`;
  phoneBatteryFill.style.width = `${percent}%`;
  phoneBatteryFill.style.background = percent <= 20 ? '#e27b68' : '#8fe06a';
  phoneLightButton.disabled = percent === 0 || Boolean(phoneDock);
  for (const button of phonePanel.querySelectorAll('[data-phone-app]')) button.disabled = percent === 0 || Boolean(phoneDock);
  phonePanel.querySelector('[data-phone-app="solar"]').hidden = !collectedItems.has('solar-app-installed');
  if (percent === 0 && currentPhoneApp) closePhoneApp();
  phoneLightButton.setAttribute('aria-pressed', String(phoneLightOn));
  phoneLightButton.setAttribute('aria-label', phoneLightOn ? '플래시 끄기' : '플래시 켜기');
  document.getElementById('phone-light-state').textContent = phoneLightOn ? '켜짐' : '꺼짐';
  document.getElementById('phone-help').textContent = percent === 0 ? '배터리 없음 · 카페나 사무실 콘센트에서 충전하세요.' : '';
  world.dataset.flashlight = phoneLightOn && itemUseTime <= 0 ? 'on' : 'off';
  // 플래시가 켜지면 휴대폰 버튼이 아니라 플래시 버튼이 빛난다.
  const flashButton = document.getElementById('flash-button');
  flashButton.dataset.flashlight = phoneLightOn ? 'on' : 'off';
  flashButton.setAttribute('aria-pressed', String(phoneLightOn));
  flashButton.setAttribute('aria-label', phoneLightOn ? '플래시 끄기 (F)' : '플래시 켜기 (F)');
  const flashState = `플래시 ${phoneLightOn ? '켜짐' : '꺼짐'}`;
  document.getElementById('phone-flash-state').textContent = flashState;
  document.getElementById('phone-flash-state').hidden = Boolean(phoneDock);
  phoneButton.dataset.docked = String(Boolean(phoneDock));
  phoneButton.dataset.charge = phoneDock ? `${phoneDockLocation()} · ${percent}% · ${phoneChargeState()}` : '';
  phoneButton.setAttribute('aria-label', phoneDock ? `${phoneButton.dataset.charge} · 충전 콘센트에서 휴대폰 가져오기` : `휴대폰 열기 · ${flashState}`);
  refreshPhoneChargers();
  if (typeof refreshSolarApp === 'function') refreshSolarApp();
}

function togglePhone() {
  if (photoCaptureTime > 0 || itemUseTime > 0 || playerCaught || hallucinationCaught || blackoutSceneActive || cctvSceneActive) return;
  if (usingPhone) return closePhone();
  if (phoneDock) return sayLine('아, 휴대폰은 충전기에 두고 왔지.');
  usingPhone = true;
  playGameSound('phone');
  phoneTime = 0;
  phoneAwayTime = 0;
  phonePanel.hidden = false;
  closePhoneApp(false);
  releaseInput();
  animate(0);
  refreshPhone();
  phoneBlocked = []; // 휴대폰을 켜도 게임은 멈추지 않으니 뒤 화면을 막지(inert) 않는다: 이동·점프는 그대로 된다
  for (const element of phoneBlocked) element.inert = true;
  (phoneBattery > 0 ? phoneLightButton : document.getElementById('phone-close')).focus();
}

function closePhone() {
  if (!usingPhone) return;
  usingPhone = false;
  closePhoneApp(false);
  phoneAwayTime = phoneLightOn ? 0 : 360;
  phonePanel.hidden = true;
  for (const element of phoneBlocked) element.inert = false;
  phoneBlocked = [];
  animate(0);
  (selectingFloor ? cabin : stage).focus();
}

let phoneLightDelay = 0; // 플래시 점등까지 남은 게임 시간(ms)
const phoneLightDelayMs = 500;

function cancelPhoneLightDelay() {
  phoneLightDelay = 0;
  phoneRaising = false;
}

function togglePhoneLight() {
  if (phoneLightDelay) { cancelPhoneLightDelay(); animate(0); return; } // 켜지는 중에 다시 누르면 취소
  if (photoCaptureTime > 0 || itemUseTime > 0 || playerCaught || hallucinationCaught || blackoutSceneActive || cctvSceneActive) return;
  if (phoneDock) return sayLine('아, 휴대폰은 충전기에 두고 왔지.');
  if (!phoneLightOn && phoneBattery <= 0) return sayLine('배터리가 다 됐어… 충전할 데를 찾아야 해.');
  if (!phoneLightOn) {
    playGameSound('phone');
    phoneRaising = true;
    phoneLightDelay = phoneLightDelayMs;
    animate(0);
    return;
  }
  phoneLightOn = false;
  playGameSound('phone');
  phoneAwayTime = !phoneLightOn && !usingPhone ? 360 : 0;
  if (usingPhone || Math.abs(body.velocity.x) < .01) animate(0);
  refreshPhone();
}

function chargePhone(door) {
  if (!door?.phoneCharger) return;
  if (isPhoneDock(door)) {
    playGameSound('pickup');
    phoneDock = null;
    phoneChargeAccumulator = 0;
    phoneDrainAccumulator = 0;
    refreshPhone();
    return;
  }
  if (phoneDock) return;
  if (!floorHasPower(currentSceneFloor)) return;
  if (phoneBattery >= 100) return sayLine('휴대폰 배터리는 이미 100%야. 충전할 필요는 없겠어.');
  cancelPhoneLightDelay();
  phoneDock = { floor: door.floor, scene: door.scene, x: door.x };
  playGameSound('charger');
  sayLine('충전하는 동안 여기 두고… 나중에 꼭 챙기자.');
  phoneLightOn = false;
  phoneAwayTime = 0;
  phoneChargeAccumulator = 0;
  phoneDrainAccumulator = 0;
  refreshPhone();
  animate(0);
}

function updatePhoneCharging(elapsed) {
  if (!phoneDock || phoneBattery >= 100 || !floorHasPower(phoneDock.floor)) return;
  phoneChargeAccumulator += elapsed;
  if (phoneChargeAccumulator < 1000) return;
  phoneBattery = Math.min(100, phoneBattery + 2 * Math.floor(phoneChargeAccumulator / 1000));
  phoneChargeAccumulator %= 1000;
  refreshPhone();
}

function updatePhone(elapsed) {
  if (phoneLightDelay > 0) {
    const raisingTime = Math.min(elapsed, phoneLightDelay);
    phoneLightDelay = Math.max(0, phoneLightDelay - elapsed);
    if (phoneLightDelay > 0) return;
    phoneRaising = false;
    if (phoneDock || phoneBattery <= 0 || phoneLightOn) return;
    phoneLightOn = true;
    phoneAwayTime = 0;
    if (usingPhone || Math.abs(body.velocity.x) < .01) animate(0);
    refreshPhone();
    elapsed -= raisingTime;
  }
  if (phoneDock || phoneBattery <= 0) return;
  // 1%가 닳는 시간: 플래시 1초, 화면 보기 1분, 그냥 들고 다니기 3분.
  phoneDrainAccumulator += elapsed / (phoneLightOn ? 1000 : usingPhone ? 60000 : 180000);
  if (phoneDrainAccumulator < 1) return;
  phoneBattery = Math.max(0, phoneBattery - Math.floor(phoneDrainAccumulator));
  phoneDrainAccumulator %= 1;
  if (phoneBattery === 0) {
    sayLine('배터리가 나갔어… 충전할 데를 찾아야 해.');
    if (phoneLightOn) phoneAwayTime = usingPhone ? 0 : 360;
    phoneLightOn = false;
  }
  refreshPhone();
}

// 상태 표시줄과 잠금 화면 시계는 게임 속 시각(00:00부터 흐름)을 보여 준다.
function refreshPhoneClock() {
  const time = gameClockText();
  phonePanel.querySelector('.phone-statusbar > span').textContent = time;
  phonePanel.querySelector('.phone-clock').textContent = time;
}
refreshPhoneClock();
setInterval(refreshPhoneClock, 1000);

// 휴대폰 밖을 누르면 닫는다. 캡처 단계라 휴대폰 버튼 자체의 토글보다 먼저 돌고, 그 버튼은 제외한다.
document.addEventListener('pointerdown', event => {
  if (usingPhone && !phonePanel.contains(event.target) && !phoneButton.contains(event.target)) closePhone();
}, true);
phoneLightButton.addEventListener('click', togglePhoneLight);
document.getElementById('phone-close').addEventListener('click', closePhone);
for (const button of phonePanel.querySelectorAll('[data-phone-app]')) {
  button.addEventListener('click', () => openPhoneApp(button.dataset.phoneApp));
}
document.getElementById('phone-app-back').addEventListener('click', () => {
  playGameSound('phone');
  closePhoneApp();
});
phoneNote.addEventListener('input', () => {
  phoneNoteStatus.textContent = phoneNote.value === savedPhoneNote ? '저장된 메모입니다.' : '저장하지 않은 메모가 있습니다.';
});
document.getElementById('phone-note-save').addEventListener('click', () => {
  try {
    localStorage.setItem('archi.phone.note', phoneNote.value);
    savedPhoneNote = phoneNote.value;
    phoneNoteStatus.textContent = '메모를 저장했습니다.';
    playGameSound('ui');
  } catch {
    phoneNoteStatus.textContent = '메모를 저장하지 못했습니다. 내용은 화면에 남아 있습니다.';
  }
});
phonePanel.addEventListener('keydown', event => {
  if (!usingPhone || event.key !== 'Tab') return;
  event.stopPropagation();
  const controls = [...phonePanel.querySelectorAll('button, input, textarea, select, [tabindex]')]
    .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
  const first = controls[0], last = controls.at(-1);
  if (!controls.includes(document.activeElement) || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
});
loadPhoneNote();

