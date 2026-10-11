// 휴대폰(P): 플래시와 개인 메모·계산기·건물 안내 앱을 사용한다.
// 안드로이드(One UI)처럼 상태 표시줄을 내려 빠른 설정을 열고, 아래 최근 앱·홈·뒤로 버튼과 측면 버튼(화면 끄기)으로 조작한다.
const phonePanel = document.getElementById('phone');
const phoneBatteryOutput = document.getElementById('phone-battery');
const phoneBatteryFill = document.getElementById('phone-battery-fill');
const phoneLightButton = document.getElementById('phone-light');
const phoneButton = document.getElementById('phone-button');
const phoneAppWindow = document.getElementById('phone-app-window');
const phoneNote = document.getElementById('phone-note');
const phoneNoteStatus = document.getElementById('phone-note-status');
const phoneScreen = phonePanel.querySelector('.phone-screen');
const phoneHome = document.getElementById('phone-home');
const phoneRecents = document.getElementById('phone-recents');
const phoneQuickPanel = document.getElementById('phone-quick-panel');
const phoneQuickOpen = document.getElementById('phone-quick-open');
const phoneQuickLight = document.getElementById('phone-qs-light');
const PHONE_APP_TITLES = { notes: '개인 메모', calculator: '계산기', building: '건물 안내', solar: '비상 전력 제어' };
let currentPhoneApp = null;
let phoneRecentApps = [];
let phoneSwipe = null;
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
  phoneRecentApps = [app, ...phoneRecentApps.filter(item => item !== app)];
  document.getElementById('phone-app-title').textContent = PHONE_APP_TITLES[app];
  closePhoneQuickPanel(false);
  for (const element of phoneAppWindow.querySelectorAll('[data-phone-view]')) element.hidden = element !== view;
  showPhoneScreen('app');
  if (app === 'building') refreshBuildingGuides();
  if (app === 'solar') {
    document.getElementById('phone-solar-floor').value = String(solarPoweredFloors[0] || 17);
    refreshSolarApp();
  }
  playPhoneSound();
  (app === 'notes' ? phoneNote : app === 'calculator' ? view.querySelector('[data-calculator-key]') : document.getElementById('phone-app-back')).focus();
}

function showPhoneScreen(name) {
  phoneScreen.dataset.screen = name;
  phoneHome.hidden = name !== 'home';
  phoneRecents.hidden = name !== 'recents';
  phoneAppWindow.hidden = name !== 'app';
  phoneScreen.scrollTop = 0;
}

function playPhoneSound(name = 'phone') {
  if (phonePanel.dataset.sound !== 'false') playGameSound(name);
}

function closePhoneApp(focus = true) {
  const previousApp = currentPhoneApp;
  currentPhoneApp = null;
  showPhoneScreen('home');
  if (focus && usingPhone) {
    const button = phonePanel.querySelector(`[data-phone-app="${previousApp}"]`);
    (phoneBattery > 0 ? button || phoneLightButton : document.getElementById('phone-close')).focus();
  }
}

function showPhoneRecents() {
  if (!usingPhone) return;
  closePhoneQuickPanel(false);
  currentPhoneApp = null;
  showPhoneScreen('recents');
  const unusable = phoneBattery <= 0 || Boolean(phoneDock);
  const cards = phoneRecentApps.filter(app => app !== 'solar' || collectedItems.has('solar-app-installed')).map(app => {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.phoneRecent = app;
    card.disabled = unusable;
    const icon = document.createElement('span');
    icon.className = 'phone-app-icon app-art';
    icon.dataset.appIcon = phonePanel.querySelector(`[data-phone-app="${app}"] .app-art`).dataset.appIcon;
    icon.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span');
    title.textContent = PHONE_APP_TITLES[app];
    card.append(icon, title);
    card.addEventListener('click', () => openPhoneApp(app));
    return card;
  });
  document.getElementById('phone-recent-list').replaceChildren(...cards);
  document.getElementById('phone-recent-empty').hidden = cards.length > 0;
  document.getElementById('phone-recent-clear').hidden = !cards.length;
  (cards.find(card => !card.disabled) || document.getElementById('phone-nav-home')).focus();
}

function showPhoneHome() {
  closePhoneQuickPanel(false);
  if (currentPhoneApp) return closePhoneApp();
  showPhoneScreen('home');
  (phoneLightButton.disabled ? document.getElementById('phone-close') : phoneLightButton).focus();
}

function openPhoneQuickPanel() {
  if (!usingPhone || !phoneQuickPanel.hidden) return;
  phoneQuickPanel.hidden = false;
  phoneQuickOpen.setAttribute('aria-expanded', 'true');
  for (const element of [phoneQuickOpen, phoneHome, phoneRecents, phoneAppWindow]) element.inert = true;
  (phoneQuickLight.disabled ? document.getElementById('phone-quick-close') : phoneQuickLight).focus();
}

function closePhoneQuickPanel(focus = true) {
  if (phoneQuickPanel.hidden) return;
  phoneQuickPanel.hidden = true;
  phoneQuickOpen.setAttribute('aria-expanded', 'false');
  for (const element of [phoneQuickOpen, phoneHome, phoneRecents, phoneAppWindow]) element.inert = false;
  if (focus) phoneQuickOpen.focus();
}

// Esc·뒤로: 빠른 설정 → 앱·최근 앱 → 홈 → 휴대폰 닫기 순으로 한 단계씩 돌아간다.
function phoneBack() {
  if (!phoneQuickPanel.hidden) closePhoneQuickPanel();
  else if (currentPhoneApp) closePhoneApp();
  else if (phoneScreen.dataset.screen === 'recents') showPhoneHome();
  else closePhone();
}

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
  phoneLightButton.disabled = phoneQuickLight.disabled = percent === 0 || Boolean(phoneDock);
  phoneQuickLight.setAttribute('aria-pressed', String(phoneLightOn));
  phonePanel.dataset.batteryLow = String(percent <= 15);
  for (const button of phonePanel.querySelectorAll('[data-phone-app]')) button.disabled = percent === 0 || Boolean(phoneDock);
  phonePanel.querySelector('[data-phone-app="solar"]').hidden = !collectedItems.has('solar-app-installed');
  if (percent === 0 && currentPhoneApp) closePhoneApp();
  phoneLightButton.setAttribute('aria-pressed', String(phoneLightOn));
  phoneLightButton.setAttribute('aria-label', phoneLightOn ? '플래시 끄기' : '플래시 켜기');
  document.getElementById('phone-light-state').textContent = phoneLightOn ? '켜짐' : '꺼짐';
  document.getElementById('phone-help').textContent = percent === 0 ? '배터리 없음 · 충전함에서 충전하세요.' : '';
  world.dataset.flashlight = phoneLightOn && itemUseTime <= 0 ? 'on' : 'off';
  phoneButton.dataset.flashlight = phoneLightOn ? 'on' : 'off';
  const flashState = `플래시 ${phoneLightOn ? '켜짐' : '꺼짐'}`;
  document.getElementById('phone-flash-state').textContent = flashState;
  document.getElementById('phone-flash-state').hidden = Boolean(phoneDock);
  phoneButton.dataset.docked = String(Boolean(phoneDock));
  phoneButton.dataset.charge = phoneDock ? `${phoneDockLocation()} · ${percent}% · ${phoneChargeState()}` : '';
  phoneButton.setAttribute('aria-label', phoneDock ? `${phoneButton.dataset.charge} · 충전함에서 휴대폰 가져오기` : `휴대폰 열기 · ${flashState}`);
  refreshPhoneChargers();
  if (typeof refreshSolarApp === 'function') refreshSolarApp();
}

function togglePhone() {
  if (itemUseTime > 0 || playerCaught || hallucinationCaught || blackoutSceneActive || cctvSceneActive) return;
  if (usingPhone) return closePhone();
  if (phoneDock) return showStatus(`${phoneDockLocation()} 충전함에 휴대폰을 두었다. 그 충전함 앞에서 E로 가져오자.`, 4000);
  usingPhone = true;
  playPhoneSound();
  phoneTime = 0;
  phoneAwayTime = 0;
  phonePanel.hidden = false;
  closePhoneQuickPanel(false);
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
  closePhoneQuickPanel(false);
  closePhoneApp(false);
  phoneAwayTime = phoneLightOn ? 0 : 360;
  phonePanel.hidden = true;
  for (const element of phoneBlocked) element.inert = false;
  phoneBlocked = [];
  animate(0);
  stage.focus();
}

function togglePhoneLight() {
  if (itemUseTime > 0 || playerCaught || hallucinationCaught || blackoutSceneActive || cctvSceneActive) return;
  if (phoneDock) return showStatus(`${phoneDockLocation()} 충전함에 휴대폰을 두어 플래시를 사용할 수 없다.`, 4000);
  if (!phoneLightOn && phoneBattery <= 0) return showStatus('휴대폰 배터리가 없습니다.');
  phoneLightOn = !phoneLightOn;
  playPhoneSound();
  phoneAwayTime = !phoneLightOn && !usingPhone ? 360 : 0;
  if (usingPhone || Math.abs(body.velocity.x) < .01) animate(0);
  refreshPhone();
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
phoneQuickLight.addEventListener('click', togglePhoneLight);
document.getElementById('phone-close').addEventListener('click', closePhone);
phoneQuickOpen.addEventListener('click', openPhoneQuickPanel);
document.getElementById('phone-quick-close').addEventListener('click', () => closePhoneQuickPanel());
document.getElementById('phone-nav-back').addEventListener('click', phoneBack);
document.getElementById('phone-nav-home').addEventListener('click', showPhoneHome);
document.getElementById('phone-nav-recents').addEventListener('click', () => (phoneScreen.dataset.screen === 'recents' ? showPhoneHome() : showPhoneRecents()));
document.getElementById('phone-recent-clear').addEventListener('click', () => { phoneRecentApps = []; showPhoneRecents(); });
// 와이파이·블루투스·비행기 탑승 모드·방해 금지는 상태 표시줄 아이콘만 바꾼다. 소리를 끄면 휴대폰 효과음이 나지 않는다.
for (const tile of phonePanel.querySelectorAll('[data-quick-toggle]')) {
  tile.addEventListener('click', () => {
    const on = tile.getAttribute('aria-pressed') !== 'true';
    tile.setAttribute('aria-pressed', String(on));
    phonePanel.dataset[tile.dataset.quickToggle] = String(on);
    if (tile.dataset.quickToggle === 'sound') tile.querySelector('[data-sound-label]').textContent = on ? '소리' : '무음';
    playPhoneSound('ui');
  });
}
document.getElementById('phone-brightness').addEventListener('input', event => phoneScreen.style.setProperty('--phone-brightness', String(event.target.value / 100)));
// 상태 표시줄이나 시계 위젯에서 아래로 쓸면 빠른 설정이 내려오고, 빠른 설정에서 위로 쓸면 닫힌다.
phoneScreen.addEventListener('pointerdown', event => {
  const panel = !phoneQuickPanel.hidden;
  if (panel ? !event.target.closest('button, input') : event.target.closest('.phone-statusbar, .phone-owner')) phoneSwipe = { id: event.pointerId, x: event.clientX, y: event.clientY, panel };
});
phoneScreen.addEventListener('pointerup', event => {
  const swipe = phoneSwipe;
  phoneSwipe = null;
  if (swipe?.id !== event.pointerId) return;
  const dy = event.clientY - swipe.y;
  if (Math.abs(dy) < 40 || Math.abs(event.clientX - swipe.x) > Math.abs(dy)) return;
  if (swipe.panel && dy < 0) closePhoneQuickPanel();
  else if (!swipe.panel && dy > 0) openPhoneQuickPanel();
});
phoneScreen.addEventListener('pointercancel', () => { phoneSwipe = null; });
for (const button of phonePanel.querySelectorAll('[data-phone-app]')) {
  button.addEventListener('click', () => openPhoneApp(button.dataset.phoneApp));
}
document.getElementById('phone-app-back').addEventListener('click', () => {
  playPhoneSound();
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
    playPhoneSound('ui');
  } catch {
    phoneNoteStatus.textContent = '메모를 저장하지 못했습니다. 내용은 화면에 남아 있습니다.';
  }
});
phonePanel.addEventListener('keydown', event => {
  if (!usingPhone || event.key !== 'Tab') return;
  event.stopPropagation();
  const controls = [...phonePanel.querySelectorAll('button, input, textarea, select, [tabindex]')]
    .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[inert]'));
  const first = controls[0], last = controls.at(-1);
  if (!controls.includes(document.activeElement) || event.shiftKey && document.activeElement === first || !event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
});
loadPhoneNote();

