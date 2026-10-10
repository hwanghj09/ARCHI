// 테스트용 정신력 조정: 슬라이더/숫자 입력으로 sanity를 즉시 바꾸고, 공포 연출(fearTier 등)도 그 자리에서 다시 계산한다.
// 평소에는 실제 정신력 값을 그대로 보여주다가, 입력에 포커스가 가 있는 동안만 사용자가 끄는 값을 따른다.
const debugSanity = document.getElementById('debug-sanity');
const debugSanityRange = document.getElementById('debug-sanity-range');
const debugSanityNumber = document.getElementById('debug-sanity-number');
debugSanity.addEventListener('keydown', event => event.stopPropagation());

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
  requestAnimationFrame(syncDebugSanity);
}
syncDebugSanity();
