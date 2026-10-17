// 처음에는 게임 시계를 멈추고 실제 설정과 시작 버튼만 활성화한다.
const mainMenu = document.getElementById('main-menu');
const menuStart = document.getElementById('menu-start');
const menuContinue = document.getElementById('menu-continue');
const menuVolume = document.getElementById('menu-volume');
const menuBrightness = document.getElementById('menu-brightness');
const menuFullscreen = document.getElementById('menu-fullscreen');
const menuSettingsStatus = document.getElementById('menu-settings-status');
let menuBlocked = [];
let menuReturnButton = menuStart;

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

function showMainMenu() {
  pauseGameAudio();
  mainMenu.inert = false;
  mainMenu.hidden = false;
  menuBlocked = [...document.body.children].filter(el => el !== mainMenu && el.tagName !== 'SCRIPT' && !el.inert);
  for (const el of menuBlocked) el.inert = true;
  releaseInput();
  refreshContinue();
  showMenuView('home');
  (menuContinue.hidden ? menuStart : menuContinue).focus({ preventScroll: true });
}

function refreshContinue() {
  const saved = readProgress();
  menuContinue.hidden = !saved && !gameStarted;
  mainMenu.dataset.hasSave = String(!menuContinue.hidden);
  menuStart.lastElementChild.textContent = menuContinue.hidden ? '↗' : '01';
  const info = document.getElementById('menu-save-info');
  if (progressSaveFailed) info.textContent = '진행 상황을 저장하지 못했습니다. 현재 게임은 계속할 수 있습니다.';
  else if (saved) {
    const name = saved.scene.id === 'office' ? '17층 사무실' : floorById.get(saved.scene.id).label;
    const time = Number.isFinite(saved.savedAt) ? new Date(saved.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    info.textContent = `${name} · ${time} 자동 저장`;
  } else info.textContent = '진행 상황은 자동으로 저장됩니다.';
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
  if (!gameStarted || mainMenuActive || photoCaptureTime > 0 || openingActive || blackoutSceneActive || cctvSceneActive || playerCaught || hallucinationCaught || transitioning ||
      usingPhone || usingComputer || usingKeypad || usingControl || usingInspection || usingPowerPanel) return;
  saveProgress();
  mainMenuActive = true;
  document.body.dataset.mainMenu = 'true';
  showMainMenu();
}

function showMenuView(view) {
  for (const id of ['home', 'settings', 'controls', 'slots', 'new-game']) document.getElementById(`menu-${id}`).hidden = id !== view;
  mainMenu.dataset.view = view;
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
  closeMainMenu();
  if (!gameStarted) {
    try { restoreProgress(saved); }
    catch {
      mainMenuActive = true;
      document.body.dataset.mainMenu = 'true';
      showMainMenu();
      document.getElementById('menu-save-info').textContent = '저장한 진행 상황을 불러오지 못했습니다. 새 게임으로 시작할 수 있습니다.';
    }
  } else (selectingFloor ? cabin : stage).focus({ preventScroll: true });
});

for (const view of ['settings', 'controls']) {
  document.getElementById(`menu-${view}-button`).addEventListener('click', event => {
    menuReturnButton = event.currentTarget;
    showMenuView(view);
  });
}
for (const back of mainMenu.querySelectorAll('.menu-back')) back.addEventListener('click', () => showMenuView('home'));
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
  if (event.code === 'Escape' && mainMenu.dataset.view !== 'home') {
    event.preventDefault(); showMenuView('home');
  }
  if (event.code !== 'Tab') return;
  const enabled = [...mainMenu.querySelectorAll('button:not(:disabled), input')].filter(el => el.getClientRects().length);
  const index = enabled.indexOf(document.activeElement);
  if (event.shiftKey && index <= 0) { event.preventDefault(); enabled.at(-1).focus(); }
  else if (!event.shiftKey && index === enabled.length - 1) { event.preventDefault(); enabled[0].focus(); }
});

// 저장 · 불러오기: 슬롯 3칸. 자동 저장(목표가 바뀔 때, save.js)과 직접 저장이 같은 칸을 쓴다.
const menuSlotList = document.getElementById('menu-slot-list');
const menuSlotsStatus = document.getElementById('menu-slots-status');

function slotSummary(saved) {
  if (!saved) return '비어 있음';
  const name = saved.scene.id === 'office' ? '17층 사무실' : floorById.get(saved.scene.id).label;
  const time = Number.isFinite(saved.savedAt) ? new Date(saved.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return `${name} · ${time} · ${saved.slotKind === 'manual' ? '직접 저장' : '자동 저장'}${saved.objective ? ` · 목표: ${saved.objective}` : ''}`;
}

function renderSlots() {
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
    save.disabled = !gameStarted;
    load.disabled = !saved;
    buttons.append(save, load);
    item.append(info, buttons);
    return item;
  }));
}

document.getElementById('menu-slots-button').addEventListener('click', event => {
  menuReturnButton = event.currentTarget;
  menuSlotsStatus.textContent = gameStarted ? '목표가 바뀔 때마다 가장 오래된 칸에 자동으로 저장됩니다.' : '게임을 시작한 뒤에 저장할 수 있습니다. 저장된 칸은 불러올 수 있습니다.';
  renderSlots();
  showMenuView('slots');
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
    const saved = readProgress(slotKeys[Number(load.dataset.slotLoad)]);
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
});
