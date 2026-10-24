// 처음에는 게임 시계를 멈추고 실제 설정과 시작 버튼만 활성화한다.
const mainMenu = document.getElementById('main-menu');
const menuStart = document.getElementById('menu-start');
const menuContinue = document.getElementById('menu-continue');
const menuVolume = document.getElementById('menu-volume');
const menuBrightness = document.getElementById('menu-brightness');
const menuFullscreen = document.getElementById('menu-fullscreen');
const menuSettingsStatus = document.getElementById('menu-settings-status');
const menuKeyList = document.getElementById('menu-key-list');
const menuKeysStatus = document.getElementById('menu-keys-status');
let pendingKeyAction = null;
let menuBlocked = [];
let menuReturnButton = menuStart;

menuKeyList.innerHTML = Object.entries(keyBindingActions).map(([action, label]) =>
  `<div><dt>${label}</dt><dd><button type="button" data-key-action="${action}" aria-pressed="false"></button></dd></div>`).join('');

function refreshKeyBindingUI() {
  for (const button of menuKeyList.querySelectorAll('button')) {
    const action = button.dataset.keyAction;
    button.textContent = pendingKeyAction === action ? '키를 누르세요…' : bindingLabel(action);
    button.setAttribute('aria-label', `${keyBindingActions[action]} 키 변경: ${bindingLabel(action)}`);
    button.setAttribute('aria-pressed', String(pendingKeyAction === action));
  }
  document.getElementById('interact').textContent = bindingLabel('interact');
  document.getElementById('interact').title = `상호작용 (${bindingLabel('interact')})`;
  document.getElementById('phone-button').title = `휴대폰 (${bindingLabel('phone')})`;
  for (const next of document.querySelectorAll('.scene-next, #story-next')) next.textContent = `클릭 · ${bindingLabel('interact')}로 계속 ▸`;
  refreshInventoryCount();
  for (const [id, action] of [['flash-button', 'light'], ['phone-button', 'phone'], ['inventory-button', 'inventory']]) {
    document.getElementById(id).dataset.key = keyLabel(keyBindings[action][0]);
  }
}

function cancelKeyBinding() {
  if (!pendingKeyAction) return;
  pendingKeyAction = null;
  refreshKeyBindingUI();
  menuKeysStatus.textContent = '키 변경을 취소했습니다.';
}

function saveKeyBindings() {
  releaseInput();
  refreshKeyBindingUI();
  try {
    localStorage.setItem('archi.keybindings', JSON.stringify(keyBindings));
    menuKeysStatus.textContent = '조작키를 저장했습니다.';
  } catch { menuKeysStatus.textContent = '조작키를 적용했습니다. 이 브라우저에서는 저장할 수 없습니다.'; }
}

for (const button of menuKeyList.querySelectorAll('button')) {
  button.addEventListener('click', () => {
    pendingKeyAction = button.dataset.keyAction;
    refreshKeyBindingUI();
    menuKeysStatus.textContent = `${keyBindingActions[pendingKeyAction]}에 사용할 키를 누르세요. Esc로 취소합니다.`;
  });
  button.addEventListener('blur', cancelKeyBinding);
}
document.getElementById('menu-keys-reset').addEventListener('click', () => {
  pendingKeyAction = null;
  applyKeyBindings(defaultKeyBindings);
  saveKeyBindings();
});
document.getElementById('menu-keybindings-button').addEventListener('click', () => showMenuView('controls'));
refreshKeyBindingUI();

function applyMenuSettings() {
  gameVolume = Number(menuVolume.value) / 100;
  refreshGameAudioVolume();
  document.documentElement.style.setProperty('--scene-brightness', Number(menuBrightness.value) / 100);
  document.getElementById('menu-volume-value').value = `${menuVolume.value}%`;
  document.getElementById('menu-brightness-value').value = `${menuBrightness.value}%`;
}

try {
  const saved = JSON.parse(localStorage.getItem('archi.settings'));
  if (Number.isFinite(saved?.volume)) menuVolume.value = Math.max(0, Math.min(100, saved.volume));
  if (Number.isFinite(saved?.brightness)) menuBrightness.value = Math.max(75, Math.min(125, saved.brightness));
} catch { /* 저장소를 사용할 수 없어도 기본 설정으로 시작할 수 있다. */ }
applyMenuSettings();

function showMainMenu(view = 'home') {
  pauseGameAudio();
  mainMenu.inert = false;
  mainMenu.hidden = false;
  menuBlocked = [...document.body.children].filter(el => el !== mainMenu && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of menuBlocked) el.inert = true;
  releaseInput();
  refreshContinue();
  showMenuView(view);
  if (view === 'home') (menuContinue.hidden ? menuStart : menuContinue).focus({ preventScroll: true });
}

function refreshContinue() {
  const saved = readProgress();
  menuContinue.hidden = !saved && !gameStarted;
  mainMenu.dataset.hasSave = String(!menuContinue.hidden);
  menuStart.lastElementChild.textContent = menuContinue.hidden ? '→' : '01';
  const info = document.getElementById('menu-save-info');
  if (progressSaveFailed) info.textContent = '진행 상황을 저장하지 못했습니다. 현재 게임은 계속할 수 있습니다.';
  else if (saved) {
    const name = saved.scene.id === 'office' ? '17층 사무실' : floorById.get(saved.scene.id).label;
    const time = Number.isFinite(saved.savedAt) ? new Date(saved.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    info.textContent = `${name} · ${time} 자동 저장`;
  } else {
    let cleared = false;
    try { cleared = Boolean(localStorage.getItem(clearedKey)); } catch { /* 저장소가 없으면 표시하지 않는다. */ }
    info.textContent = cleared ? '★ TRUE END 클리어 · 새 게임으로 다시 시작할 수 있습니다.' : '진행 상황은 자동으로 저장됩니다.';
  }
}

function closeMainMenu() {
  mainMenuActive = false;
  mainMenu.hidden = true;
  mainMenu.inert = true;
  delete document.body.dataset.mainMenu;
  for (const el of menuBlocked) el.inert = false;
  menuBlocked = [];
  releaseInput();
}

function openGameMenu() {
  if (!gameStarted || mainMenuActive || photoCaptureTime > 0 || openingActive || blackoutSceneActive || cctvSceneActive || solarRestoreActive || b2Ending.offline || b2Ending.phase === 'over' || playerCaught || hallucinationCaught || transitioning ||
      usingPhone || usingComputer || usingKeypad || usingControl || usingInspection || usingPowerPanel) return;
  saveProgress();
  mainMenuActive = true;
  document.body.dataset.mainMenu = 'true';
  showMainMenu('pause');
}
document.getElementById('pause-button').addEventListener('click', openGameMenu);

function showMenuView(view) {
  cancelKeyBinding();
  for (const id of ['home', 'pause', 'settings', 'controls', 'slots', 'new-game']) document.getElementById(`menu-${id}`).hidden = id !== view;
  mainMenu.dataset.view = view;
  mainMenu.setAttribute('aria-label', view === 'pause' ? '일시정지 메뉴' : 'ARCHI 메인 메뉴');
  if (view === 'home') menuReturnButton.focus({ preventScroll: true });
  else document.getElementById(`menu-${view}`).querySelector('button').focus({ preventScroll: true });
}

menuStart.addEventListener('click', () => {
  if (!mainMenuActive) return;
  if (gameStarted || readProgress()) {
    menuReturnButton = menuStart;
    showMenuView('new-game');
    return;
  }
  closeMainMenu();
  startNewGame();
});
document.getElementById('menu-new-confirm').addEventListener('click', () => { closeMainMenu(); startNewGame(); });
menuContinue.addEventListener('click', () => {
  if (!mainMenuActive) return;
  const saved = readProgress();
  if (!gameStarted && !saved) return refreshContinue();
  // 게임 오버(로봇·환각·B2 배드 엔딩) 중이면 창으로 돌아가지 않고 이어하기 저장을 불러온다.
  const gameOver = playerCaught || hallucinationCaught || b2Ending.phase === 'over';
  closeMainMenu();
  if (!gameStarted || gameOver && saved) {
    try { restoreProgress(saved); }
    catch {
      mainMenuActive = true;
      document.body.dataset.mainMenu = 'true';
      showMainMenu();
      document.getElementById('menu-save-info').textContent = '저장한 진행 상황을 불러오지 못했습니다. 새 게임으로 시작할 수 있습니다.';
    }
  } else (selectingFloor ? cabin : stage).focus({ preventScroll: true });
});

document.getElementById('menu-resume').addEventListener('click', () => {
  closeMainMenu();
  (selectingFloor ? cabin : stage).focus({ preventScroll: true });
});
document.getElementById('menu-exit').addEventListener('click', () => {
  refreshContinue();
  menuReturnButton = menuContinue;
  showMenuView('home');
});
for (const id of ['menu-settings-button', 'menu-pause-settings-button']) {
  document.getElementById(id).addEventListener('click', event => {
    menuReturnButton = event.currentTarget;
    document.querySelector('#menu-settings .menu-back').textContent = id === 'menu-pause-settings-button' ? '← 일시정지로' : '← 메인으로';
    showMenuView('settings');
  });
}
function backMenuView() {
  const fromControls = mainMenu.dataset.view === 'controls';
  const fromPauseSettings = mainMenu.dataset.view === 'settings' && menuReturnButton.id === 'menu-pause-settings-button';
  showMenuView(fromControls ? 'settings' : fromPauseSettings ? 'pause' : 'home');
  if (fromControls) document.getElementById('menu-keybindings-button').focus({ preventScroll: true });
  else if (fromPauseSettings) menuReturnButton.focus({ preventScroll: true });
}
for (const back of mainMenu.querySelectorAll('.menu-back')) back.addEventListener('click', backMenuView);
for (const input of [menuVolume, menuBrightness]) input.addEventListener('input', () => {
  applyMenuSettings();
  try {
    localStorage.setItem('archi.settings', JSON.stringify({ volume: Number(menuVolume.value), brightness: Number(menuBrightness.value) }));
    menuSettingsStatus.textContent = '설정을 저장했습니다.';
  } catch { menuSettingsStatus.textContent = '현재 설정은 적용되었습니다. 이 브라우저에서는 저장할 수 없습니다.'; }
});

menuFullscreen.disabled = !document.fullscreenEnabled;
menuFullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else {
      await document.documentElement.requestFullscreen();
      try { await navigator.keyboard?.lock?.(['Escape']); } catch { /* 잠금을 허용하지 않으면 브라우저의 Esc 동작을 쓴다. */ }
    }
  } catch { menuSettingsStatus.textContent = '전체화면을 사용할 수 없습니다.'; }
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) navigator.keyboard?.unlock?.();
  menuFullscreen.textContent = document.fullscreenElement ? '전체화면 해제 ↙' : '전체화면으로 전환 ↗';
});
mainMenu.addEventListener('keydown', event => {
  if (pendingKeyAction) {
    if (event.code === 'Tab') cancelKeyBinding();
    else {
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat || event.isComposing) return;
      if (event.code === 'Escape') return cancelKeyBinding();
      if (!isBindableKey(event.code) || event.altKey || event.metaKey ||
          event.ctrlKey && !event.code.startsWith('Control') || event.shiftKey && !event.code.startsWith('Shift')) {
        menuKeysStatus.textContent = '이 키는 창 조작에 사용하거나 지원하지 않습니다. 다른 키 하나를 누르세요.';
        return;
      }
      const conflict = Object.keys(keyBindings).find(action => action !== pendingKeyAction && keyMatches(action, event.code));
      if (conflict) {
        menuKeysStatus.textContent = `${keyLabel(event.code)} 키는 ${keyBindingActions[conflict]}에 사용 중입니다. 다른 키를 누르세요.`;
        return;
      }
      applyKeyBindings({ ...keyBindings, [pendingKeyAction]: [event.code] });
      pendingKeyAction = null;
      saveKeyBindings();
      return;
    }
  }
  if (event.code === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      if (mainMenu.dataset.view === 'pause') document.getElementById('menu-resume').click();
      else if (mainMenu.dataset.view !== 'home') backMenuView();
    }
  }
  if (event.code !== 'Tab') return;
  const enabled = [...mainMenu.querySelectorAll('button:not(:disabled), input')].filter(el => el.getClientRects().length);
  const index = enabled.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
  else if (!event.shiftKey && index === enabled.length - 1) { event.preventDefault(); enabled[0].focus(); }
});

// 저장 · 불러오기: 슬롯 5칸. 자동 저장(목표가 바뀔 때, save.js)과 직접 저장이 같은 칸을 쓴다.
const menuSlotList = document.getElementById('menu-slot-list');
const menuSlotsStatus = document.getElementById('menu-slots-status');

function slotSummary(saved) {
  if (!saved) return '비어 있음';
  const name = saved.scene.id === 'office' ? '17층 사무실' : floorById.get(saved.scene.id).label;
  const time = Number.isFinite(saved.savedAt) ? new Date(saved.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return `${name} · ${time} · ${saved.slotKind === 'manual' ? '직접 저장' : '자동 저장'}${saved.objective ? ` · 목표: ${saved.objective}` : ''}`;
}

// 가장 최근에 저장한 칸(저장 시각이 가장 늦은 칸)의 번호. 저장된 칸이 없으면 -1.
function latestSlotIndex() {
  let best = -1, bestTime = -Infinity;
  slotKeys.forEach((key, index) => {
    const saved = readProgress(key);
    const time = Number.isFinite(saved?.savedAt) ? saved.savedAt : saved ? 0 : -Infinity;
    if (time > bestTime) { best = index; bestTime = time; }
  });
  return best;
}

function renderSlots() {
  const latest = document.getElementById('menu-slot-latest');
  const latestIndex = latestSlotIndex();
  latest.disabled = latestIndex < 0;
  latest.textContent = latestIndex < 0 ? '가장 최근 저장으로 불러오기' : `가장 최근 저장으로 불러오기 · 슬롯 ${latestIndex + 1}`;
  menuSlotList.replaceChildren(...slotKeys.map((key, index) => {
    const saved = readProgress(key);
    const item = document.createElement('li');
    const info = document.createElement('div');
    const title = document.createElement('strong');
    const detail = document.createElement('small');
    title.textContent = `슬롯 ${index + 1}`;
    detail.textContent = slotSummary(saved);
    info.append(title, detail);
    const buttons = document.createElement('div');
    const save = document.createElement('button');
    const load = document.createElement('button');
    save.type = load.type = 'button';
    save.textContent = '저장'; load.textContent = '불러오기';
    save.dataset.slotSave = load.dataset.slotLoad = String(index);
    save.disabled = !gameStarted || slotsLoadOnly;
    load.disabled = !saved;
    buttons.append(save, load);
    item.append(info, buttons);
    return item;
  }));
}

// 게임 오버 창(로봇·환각)의 [불러오기]도 이 창을 연다. 그때는 붙잡힌 상태를 저장하지 않게 저장 버튼을 막는다(slotsLoadOnly).
// '← 메인으로'를 누르면 메인 메뉴로, 거기서 '계속하기'를 누르면 이어하기 저장을 불러온다(저장이 없으면 게임 오버 창으로 돌아간다).
let slotsLoadOnly = false;
for (const button of document.querySelectorAll('.game-over-load')) button.addEventListener('click', () => {
  slotsLoadOnly = true;
  menuReturnButton = menuContinue;
  mainMenuActive = true;
  document.body.dataset.mainMenu = 'true';
  menuSlotsStatus.textContent = '불러올 칸을 고르세요. 붙잡힌 지금 상태는 저장하지 않습니다.';
  renderSlots();
  showMainMenu('slots');
});

document.getElementById('menu-slots-button').addEventListener('click', event => {
  slotsLoadOnly = playerCaught || hallucinationCaught;
  menuReturnButton = event.currentTarget;
  menuSlotsStatus.textContent = slotsLoadOnly ? '불러올 칸을 고르세요. 붙잡힌 지금 상태는 저장하지 않습니다.' : gameStarted ? '목표가 바뀔 때마다 가장 오래된 칸에 자동으로 저장됩니다.' : '게임을 시작한 뒤에 저장할 수 있습니다. 저장된 칸은 불러올 수 있습니다.';
  renderSlots();
  showMenuView('slots');
});

// 고른 저장 칸을 불러온다(칸의 [불러오기]와 [가장 최근 저장으로 불러오기]가 같이 쓴다).
function loadSlotProgress(saved) {
  if (!saved) return renderSlots();
  closeMainMenu();
  try { restoreProgress(saved); saveProgress(); }
  catch {
    mainMenuActive = true;
    document.body.dataset.mainMenu = 'true';
    showMainMenu();
    document.getElementById('menu-save-info').textContent = '저장한 진행 상황을 불러오지 못했습니다.';
  }
}

document.getElementById('menu-slot-latest').addEventListener('click', () => {
  const index = latestSlotIndex();
  if (index >= 0) loadSlotProgress(readProgress(slotKeys[index]));
});

menuSlotList.addEventListener('click', event => {
  const save = event.target.closest('[data-slot-save]');
  const load = event.target.closest('[data-slot-load]');
  if (save) {
    const index = Number(save.dataset.slotSave);
    menuSlotsStatus.textContent = writeSlot(index, 'manual') ? `슬롯 ${index + 1}에 저장했습니다.` : '지금은 저장할 수 없습니다.';
    renderSlots();
    menuSlotList.querySelector(`[data-slot-save="${index}"]`)?.focus({ preventScroll: true });
  } else if (load) {
    loadSlotProgress(readProgress(slotKeys[Number(load.dataset.slotLoad)]));
  }
});

// 스크린샷 모드: 화면의 UI를 모두 숨긴다(css/main-menu.css). \ 키를 누르면 어디서든 바로 켜지고, Esc나 \ 키를 다시 눌러야만 꺼진다.
// 일시정지 창의 [스크린샷 모드] 버튼으로 켜면 게임은 멈춘 채로이고, 끄면 일시정지 창으로 돌아온다. \ 키로 켜면 게임은 그대로 진행된다.
function setScreenshotMode(on) {
  if (on) {
    document.body.dataset.screenshot = 'true';
    document.activeElement?.blur();
  } else {
    delete document.body.dataset.screenshot;
    if (mainMenuActive) mainMenu.querySelector('.menu-view:not([hidden]) button')?.focus({ preventScroll: true }); // 메뉴가 열린 채였으면 메뉴로 돌아간다
    else (selectingFloor ? cabin : stage).focus({ preventScroll: true });
  }
}

document.getElementById('menu-screenshot').addEventListener('click', () => setScreenshotMode(true));

window.addEventListener('keydown', event => {
  const screenshot = document.body.dataset.screenshot === 'true';
  if (screenshot && event.code === 'Escape') { // 스크린샷 모드의 Esc는 일시정지 창을 열지 않고 모드만 끈다
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!event.repeat) setScreenshotMode(false);
    return;
  }
  if (event.code !== 'Backslash' || event.ctrlKey || event.altKey || event.metaKey) return;
  // 글자를 입력하는 칸이나 조작키를 바꾸는 중이거나 \를 조작키로 쓰고 있으면 건드리지 않는다.
  if (event.target.closest?.('input, textarea, [contenteditable="true"]') || pendingKeyAction) return;
  if (Object.values(keyBindings).some(keys => keys.includes('Backslash'))) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (!event.repeat) setScreenshotMode(!screenshot);
}, true);
