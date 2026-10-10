// 키보드 조작: A/D·방향키 이동, Space/W/위 점프, Shift 달리기, E 상호작용, Esc 닫기.
window.addEventListener('keydown', event => {
  if (mainMenuActive) return;
  if (blackoutSceneActive) {
    if (event.code === 'Escape') { event.preventDefault(); finishBlackoutScene(); }
    else if (event.code !== 'Tab' && !(event.target.id === 'blackout-skip' && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  if (playerCaught) {
    if (event.code !== 'Tab' && !(['Enter', 'Space'].includes(event.code) && event.target.id === 'guard-retry')) event.preventDefault();
    return;
  }
  if (openingActive) {
    if (event.code === 'Escape') { event.preventDefault(); finishOpening(); }
    else if (event.code !== 'Tab' && !(event.target.id === 'opening-skip' && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  if (transitioning) { event.preventDefault(); return; }
  if (event.code === 'KeyI' && !event.repeat && !selectingFloor && !usingComputer && !usingKeypad &&
      !usingPhone && !usingPowerPanel && (!usingInspection || inventoryShown())) {
    event.preventDefault();
    toggleInventory();
    return;
  }
  if (event.code === 'KeyP' && !event.repeat && !usingPhone && !selectingFloor && !usingComputer && !usingKeypad && !usingPowerPanel && !usingInspection) {
    event.preventDefault();
    togglePhone();
    return;
  }
  if (usingPhone) {
    if (event.code === 'Escape') {
      event.preventDefault();
      if (!event.repeat) { if (phoneAppWindow.hidden) closePhone(); else closePhoneApp(); }
      return;
    }
    // 앱에서 글을 쓰거나 층을 고를 때 P/F와 방향키도 해당 입력으로 전달한다.
    if (event.target.closest('textarea, input, select')) return;
    if (event.code === 'Tab' || (['Enter', 'Space'].includes(event.code) && event.target.closest('#phone button'))) return;
    if (event.code === 'KeyP' && !event.repeat) closePhone();
    if (event.code === 'KeyF' && !event.repeat) togglePhoneLight();
    event.preventDefault();
    return;
  }
  if (usingPowerPanel) {
    if (event.code === 'Tab' || (['Enter', 'Space'].includes(event.code) && event.target.closest('#power-panel button'))) return;
    if (event.code === 'Escape') closePowerPanel();
    event.preventDefault();
    return;
  }
  if (usingInspection) {
    // 조사창 안의 실제 물건 버튼은 Enter/Space로도 누를 수 있다.
    if ((event.code === 'Enter' || event.code === 'Space') && event.target.closest('button')) return;
    // Esc는 한 단계 뒤로 간다(가방에서 연 카드 → 가방 목록 → 닫기).
    if (event.code === 'Escape' || event.code === 'KeyE') {
      if (!event.repeat) {
        if (event.code === 'Escape') stepBackInspection();
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
  if (event.code === 'Escape') {
    event.preventDefault();
    openGameMenu();
    return;
  }
  if (event.code === 'KeyF') {
    event.preventDefault();
    if (!event.repeat) togglePhoneLight();
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
