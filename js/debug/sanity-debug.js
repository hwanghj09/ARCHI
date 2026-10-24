// 테스트용 정신력 조정: 슬라이더/숫자 입력으로 sanity를 즉시 바꾸고, 공포 연출(fearTier 등)도 그 자리에서 다시 계산한다.
// 평소에는 실제 정신력 값을 그대로 보여주다가, 입력에 포커스가 가 있는 동안만 사용자가 끄는 값을 따른다.
const debugSanity = document.getElementById('debug-sanity');
const debugSanityRange = document.getElementById('debug-sanity-range');
const debugSanityNumber = document.getElementById('debug-sanity-number');
debugSanity.addEventListener('keydown', event => event.stopPropagation());
debugSanity.addEventListener('submit', event => event.preventDefault());

function setDebugSanity(value) {
  sanity = Math.max(0, Math.min(100, Number(value) || 0));
  updateSanity(0);
}
debugSanityRange.addEventListener('input', () => setDebugSanity(debugSanityRange.value));
debugSanityNumber.addEventListener('input', () => setDebugSanity(debugSanityNumber.value));

function syncDebugSanity() {
  // 두 입력 중 포커스가 없는 쪽만 맞춘다 — 슬라이더를 끄는 동안에도 숫자 칸은 실시간으로 따라와야 한다.
  const rounded = String(Math.round(sanity));
  if (document.activeElement !== debugSanityRange && debugSanityRange.value !== rounded) debugSanityRange.value = rounded;
  if (document.activeElement !== debugSanityNumber && debugSanityNumber.value !== rounded) debugSanityNumber.value = rounded;
  syncDebugSidebar();
  requestAnimationFrame(syncDebugSanity);
}
syncDebugSanity();

// 콘솔 창: 버튼으로 환각 이벤트를 바로 실행한다(추격 이벤트 1회, 플레이어 근처의 공격하지 않는 환각 1회).
const debugConsole = document.getElementById('debug-console');
const debugConsoleToggle = document.getElementById('debug-console-toggle');
const debugConsolePanel = document.getElementById('debug-console-panel');
debugConsole.addEventListener('keydown', event => event.stopPropagation());
debugConsoleToggle.addEventListener('click', () => {
  debugConsolePanel.hidden = !debugConsolePanel.hidden;
  debugConsoleToggle.setAttribute('aria-expanded', String(!debugConsolePanel.hidden));
  debugConsoleToggle.textContent = debugConsolePanel.hidden ? '이벤트 펼치기' : '이벤트 접기';
});
for (const [id, trigger] of [['debug-chase-hallucination', debugTriggerChaseHallucination], ['debug-spawn-hallucination', debugTriggerAmbientHallucination], ['debug-jumpscare', debugTriggerJumpscare], ['debug-eye-flash', debugTriggerEyeFlash], ['debug-b2-phase2', debugB2Progress60], ['debug-auditory-hallucination', debugTriggerAuditoryHallucination]]) {
  document.getElementById(id).addEventListener('click', () => {
    trigger();
    stage.focus({ preventScroll: true }); // 버튼에 포커스가 남아 이동 키가 막히지 않게 한다
  });
}

// 모든 층 전력 활성화: 누를 때마다 켜고 끈다(power.js의 setAllFloorsPower). 컷씬·오프닝 중에는 바꾸지 않는다.
document.getElementById('debug-all-power').addEventListener('click', () => {
  if (gameStarted && !mainMenuActive && !openingActive && !blackoutSceneActive) setAllFloorsPower(!allPowerOverride);
  stage.focus({ preventScroll: true });
});
