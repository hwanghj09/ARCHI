// 휴대폰(P): 플래시와 개인 메모·계산기·건물 안내 앱을 사용한다.
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
  document.getElementById('phone-app-title').textContent = { notes: '개인 메모', calculator: '계산기', building: '건물 안내', solar: '비상 전력 제어', camera: '카메라', gallery: '갤러리' }[app];
  phonePanel.querySelector('.phone-owner').hidden = true;
  phonePanel.querySelector('.phone-controls').hidden = true;
  for (const element of phoneAppWindow.querySelectorAll('[data-phone-view]')) element.hidden = element !== view;
  phoneAppWindow.hidden = false;
  phonePanel.querySelector('.phone-screen').scrollTop = 0;
  if (app === 'building') refreshBuildingGuides();
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
  phoneButton.dataset.flashlight = phoneLightOn ? 'on' : 'off';
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
  if (phoneDock) return showStatus(`${phoneDockLocation()} 책상에 휴대폰을 두었다. 그 자리에서 ${bindingLabel('interact')} 키로 가져오자.`, 4000);
  usingPhone = true;
  playGameSound('phone');
  phoneTime = 0;
  phoneAwayTime = 0;
  phonePanel.hidden = false;
  closePhoneApp(false);
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
  closePhoneApp(false);
  phoneAwayTime = phoneLightOn ? 0 : 360;
  phonePanel.hidden = true;
  for (const element of phoneBlocked) element.inert = false;
  phoneBlocked = [];
  animate(0);
  stage.focus();
}

function togglePhoneLight() {
  if (photoCaptureTime > 0 || itemUseTime > 0 || playerCaught || hallucinationCaught || blackoutSceneActive || cctvSceneActive) return;
  if (phoneDock) return showStatus(`${phoneDockLocation()} 책상에 휴대폰을 두어 플래시를 사용할 수 없다.`, 4000);
  if (!phoneLightOn && phoneBattery <= 0) return showStatus('휴대폰 배터리가 없습니다.');
  phoneLightOn = !phoneLightOn;
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
    showStatus(`휴대폰을 가져왔다. 배터리 ${Math.ceil(phoneBattery)}%.`, 4000);
    return;
  }
  if (phoneDock) return showStatus(`${phoneDockLocation()} 책상에 둔 휴대폰을 먼저 가져와야 한다.`, 4000);
  if (!floorHasPower(currentSceneFloor)) return showStatus('이 층에 전력이 없어 충전할 수 없다. 전력을 공급해야 한다.', 4000);
  if (phoneBattery >= 100) {
    showStatus('휴대폰 배터리가 이미 100%다.', 3000);
    return;
  }
  phoneDock = { floor: door.floor, scene: door.scene, x: door.x };
  playGameSound('charger');
  phoneLightOn = false;
  phoneAwayTime = 0;
  phoneChargeAccumulator = 0;
  phoneDrainAccumulator = 0;
  refreshPhone();
  animate(0);
  showStatus(`충전기를 콘센트에 꽂고 휴대폰을 책상에 두었다. 충전 중에는 사용할 수 없다. 돌아와 ${bindingLabel('interact')} 키로 가져오자.`, 5000);
}

function updatePhoneCharging(elapsed) {
  if (!phoneDock || phoneBattery >= 100 || !floorHasPower(phoneDock.floor)) return;
  phoneChargeAccumulator += elapsed;
  if (phoneChargeAccumulator < 1000) return;
  phoneBattery = Math.min(100, phoneBattery + 2 * Math.floor(phoneChargeAccumulator / 1000));
  phoneChargeAccumulator %= 1000;
  refreshPhone();
  if (phoneBattery === 100) showStatus(`${phoneDockLocation()}의 휴대폰 충전이 끝났다. 맡긴 자리에서 ${bindingLabel('interact')} 키로 가져오자.`, 5000);
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

