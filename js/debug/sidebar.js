// 개발 UI는 기본적으로 숨긴다. F2 또는 설정 메뉴로 현재 실행에서만 켠다.
const debugSidebar = document.getElementById('debug-sidebar');
const menuDebugToggle = document.getElementById('menu-debug-toggle');
const debugBattery = document.getElementById('debug-battery');
const debugState = document.getElementById('debug-state');

function setDebugSidebar(open) {
  releaseInput();
  debugSidebar.hidden = !open;
  menuDebugToggle.setAttribute('aria-pressed', String(open));
  menuDebugToggle.textContent = `개발 UI · ${open ? 'ON' : 'OFF'} (F2)`;
  if (open && !debugSidebar.inert) document.getElementById('debug-close').focus();
  else if (!open && debugSidebar.contains(document.activeElement)) stage.focus({ preventScroll: true });
}
menuDebugToggle.addEventListener('click', () => setDebugSidebar(debugSidebar.hidden));
document.getElementById('debug-close').addEventListener('click', () => setDebugSidebar(false));
window.addEventListener('keydown', event => {
  if (event.code !== 'F2') return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (!event.repeat) setDebugSidebar(debugSidebar.hidden);
}, true);
debugSidebar.addEventListener('focusin', releaseInput);
debugSidebar.addEventListener('keydown', event => {
  event.stopPropagation();
  if (event.code === 'Escape') { event.preventDefault(); setDebugSidebar(false); }
}, true);

function debugCanAct() {
  return gameStarted && !mainMenuActive && !openingActive && !blackoutSceneActive && !storySceneActive && !cctvSceneActive &&
    !transitioning && !selectingFloor && !usingComputer && !usingPhone && !usingKeypad && !usingControl && !usingInspection && !usingPowerPanel &&
    !playerCaught && !hallucinationCaught && photoCaptureTime <= 0 && itemUseTime <= 0 && b2Ending.phase === 'idle';
}

const debugRoomSelect = document.getElementById('debug-room-select');
debugRoomSelect.add(new Option('17F · 사무실', 'office'));
for (const config of floorById.values()) {
  if (config.interior) debugRoomSelect.add(new Option(config.header, config.id));
}
document.getElementById('debug-room').addEventListener('submit', event => {
  event.preventDefault();
  if (!debugCanAct()) return;
  const id = debugRoomSelect.value;
  stage.focus({ preventScroll: true });
  transitionScene(() => {
    if (id === 'office') { performFloorChange('f17', null); performRoomChange(); }
    else performFloorChange(id, null, 'exit');
  });
});

function setDebugBattery(value) {
  phoneBattery = Math.max(0, Math.min(100, Number(value) || 0));
  phoneDrainAccumulator = 0;
  if (!phoneBattery) { phoneLightOn = false; phoneAwayTime = 360; }
  refreshPhone();
}
debugBattery.addEventListener('input', () => { if (debugCanAct()) setDebugBattery(debugBattery.value); });
document.getElementById('debug-restore').addEventListener('click', () => {
  if (!debugCanAct()) return;
  setDebugSanity(100); setDebugBattery(100);
  stage.focus({ preventScroll: true });
});

function syncDebugSidebar() {
  if (debugSidebar.hidden || debugSidebar.inert) return;
  if (document.activeElement !== debugBattery) debugBattery.value = String(Math.ceil(phoneBattery));
  const id = room === 'office' ? 'office' : room === 'corridor' ? 'f17' : dynamicFloorId;
  const text = `${id} · ${currentSceneFloor === 18 ? 'RF' : floorShortLabel(currentSceneFloor)}\nx ${Math.round(body.position.x)} · y ${Math.round(body.position.y)}\n전력 ${world.dataset.powered === 'true' ? 'ON' : 'OFF'} · 배터리 ${Math.ceil(phoneBattery)}%`;
  if (debugState.textContent !== text) debugState.textContent = text;
}
