// 키보드 조작: A/D·방향키 이동, Space/W/위 점프, Shift 달리기, E 상호작용, Esc 닫기.
window.addEventListener('keydown', event => {
  if (transitioning) { event.preventDefault(); return; }
  if (usingKeypad) {
    if (event.code === 'Escape') closeKeypad();
    return;
  }
  if (usingGenerator) {
    if (event.code === 'Escape') closeGenerator();
    return;
  }
  if (usingComputer) {
    if (event.code === 'Escape' && !event.repeat) {
      event.preventDefault();
      if (computerWindow.hidden) exitComputer();
      else closeComputerApp();
    }
    return;
  }
  if (selectingFloor) {
    if (event.code === 'Escape') exitCabin();
    return;
  }
  if (event.target instanceof Element && event.target.closest('button, input') && event.code === 'Space') return;
  if (event.code === 'KeyE') {
    event.preventDefault();
    if (!event.repeat) interact();
    return;
  }
  if (!Object.hasOwn(movementKeys, event.code) && !jumpKeys.has(event.code) && !runKeys.has(event.code)) return;
  event.preventDefault();
  if (jumpKeys.has(event.code)) {
    if (!event.repeat) jumpQueued = true;
  } else keys.add(event.code);
});
window.addEventListener('keyup', event => keys.delete(event.code));
