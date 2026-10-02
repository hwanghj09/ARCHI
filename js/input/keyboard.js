// 키보드 조작: A/D·방향키 이동, Space/W/위 점프, Shift 달리기, E 상호작용, Esc 닫기.
window.addEventListener('keydown', event => {
  if (transitioning) { event.preventDefault(); return; }
  if (event.code === 'KeyP' && !event.repeat && !selectingFloor && !usingComputer && !usingKeypad && !usingPowerPanel && !usingInspection) {
    event.preventDefault();
    togglePhone();
    return;
  }
  if (usingPhone) {
    if (event.code === 'Escape') closePhone();
    if (event.code === 'KeyF' && !event.repeat) togglePhoneLight();
    event.preventDefault();
    return;
  }
  if (usingPowerPanel) {
    if (event.code === 'Escape') closePowerPanel();
    event.preventDefault();
    return;
  }
  if (usingInspection) {
    if (event.code === 'Escape' || event.code === 'KeyE') {
      if (!event.repeat) {
        if (event.code === 'Escape') closeInspection();
        else advanceInspection();
      }
      event.preventDefault();
      return;
    }
    // 이동을 시작하면 조사 UI를 자연스럽게 접고 해당 입력은 그대로 게임에 전달한다.
    if (Object.hasOwn(movementKeys, event.code) || jumpKeys.has(event.code)) closeInspection();
    else {
      event.preventDefault();
      return;
    }
  }
  if (usingKeypad) {
    if (event.code === 'Escape') closeKeypad();
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
