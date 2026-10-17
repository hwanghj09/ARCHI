// 키보드 조작: A/D·방향키 이동, Space/W/위 점프, Shift 달리기, E 상호작용, Esc 닫기.
window.addEventListener('keydown', event => {
  if (mainMenuActive) return;
  // 지도 창(map.js)은 게임을 멈추지 않는다: Esc만 지도를 닫고 나머지 입력은 그대로 게임에 간다.
  if (!mapWindow.hidden && event.code === 'Escape') { if (!event.repeat) closeMap(); event.preventDefault(); return; }
  if (storySceneActive) {
    if (event.code === 'Escape') { event.preventDefault(); finishStoryScene(); }
    else if (event.code !== 'Tab' && !(event.target.id === 'story-skip' && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  if (blackoutSceneActive) {
    if (event.code === 'Escape') { event.preventDefault(); finishBlackoutScene(); }
    else if (event.code !== 'Tab' && !(event.target.id === 'blackout-skip' && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  if (cctvSceneActive) {
    if (event.code === 'Escape') { event.preventDefault(); finishCctvScene(); }
    else if (event.code !== 'Tab' && !(event.target.id === 'cctv-skip' && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  // B2 엔딩 창(b2-ending.js)의 버튼만 누를 수 있고, 뒤의 수호는 움직이지 않는다.
  const endingButton = event.target.closest?.('#b2-bad-ending button, #b2-escape button');
  if (playerCaught || endingButton) {
    if (event.code !== 'Tab' && !(['Enter', 'Space'].includes(event.code) && (event.target.id === 'guard-retry' || endingButton))) event.preventDefault();
    return;
  }
  if (hallucinationCaught) {
    if (event.code !== 'Tab' && !(['Enter', 'Space'].includes(event.code) && event.target.id === 'hallucination-retry')) event.preventDefault();
    return;
  }
  if (openingActive) {
    if (event.code === 'Escape') { event.preventDefault(); finishOpening(); }
    else if (event.code !== 'Tab' && !(event.target.id === 'opening-skip' && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  if (photoCaptureTime > 0 || itemUseTime > 0 && event.code !== 'Escape') { event.preventDefault(); return; }
  if (transitioning) { event.preventDefault(); return; }
  // 조작 창(manual-control.js)은 자기 keydown에서 입력을 받는다. 창 밖에 초점이 있어도 수호는 움직이지 않는다.
  if (usingControl) { if (event.code === 'Escape') closeControl(); event.preventDefault(); return; }
  // 전력 회선 퍼즐: 연결한 단자가 비활성화돼 초점이 창 밖으로 빠져도 이동을 막고 Esc로 닫는다.
  if (!wirePanel.hidden) {
    if (event.code === 'Tab') return;
    if (event.code === 'Escape') closeWirePanel();
    event.preventDefault();
    return;
  }
  // 12층 야간 로그 단말기(log-puzzle.js): 퀴즈를 맞히면 누른 버튼이 숨겨져 초점이 창 밖으로 빠지므로, 여기서도 Esc로 닫는다.
  // 7층 망분리 백업 장비(backup-puzzle.js)도 같은 이유로 막는다.
  if (!logPanel.hidden || !backupPanel.hidden) {
    if (event.code === 'Tab') return;
    if (event.code === 'Escape') { closeLogPuzzle(); closeBackupPuzzle(); }
    event.preventDefault();
    return;
  }
  if (event.code === 'Tab' && !event.shiftKey && !selectingFloor && !usingComputer && !usingKeypad && !usingControl &&
      !usingPhone && !usingPowerPanel && (!usingInspection || inventoryShown())) {
    event.preventDefault();
    if (!event.repeat) toggleInventory();
    return;
  }
  if (event.code === 'KeyP' && !event.repeat && !usingPhone && !selectingFloor && !usingComputer && !usingKeypad && !usingControl && !usingPowerPanel && !usingInspection) {
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
    if (event.repeat && ['Enter', 'Space'].includes(event.code) && event.target.closest('#phone button')) {
      event.preventDefault(); return;
    }
    if (event.code === 'Tab' || (['Enter', 'Space'].includes(event.code) && event.target.closest('#phone button'))) return;
    if (event.code === 'KeyP' && !event.repeat) closePhone();
    if (event.code === 'KeyF' && !event.repeat) togglePhoneLight();
    event.preventDefault();
    return;
  }
  if (usingPowerPanel) {
    // 층 버튼과 레버는 누를 때마다 켜고 끄므로, Enter를 꾹 눌러 반복 입력이 들어와도 한 번만 누른 것으로 친다.
    if (event.repeat && ['Enter', 'Space'].includes(event.code)) { event.preventDefault(); return; }
    if (event.code === 'Tab' || (['Enter', 'Space'].includes(event.code) && event.target.closest('#power-panel button'))) return;
    if (event.code === 'Escape') closePowerPanel();
    event.preventDefault();
    return;
  }
  if (usingInspection) {
    // 조사창 안의 실제 물건 버튼은 Enter/Space로도 누를 수 있다. 누르고 있을 때의 반복 입력은 막는다
    // (가방 카드의 닫기가 포커스를 물건으로 옮기므로, 반복되면 카드와 목록을 오간다).
    if ((event.code === 'Enter' || event.code === 'Space') && event.target.closest('button')) {
      if (event.repeat) event.preventDefault();
      return;
    }
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
    // B2 엔딩의 "문 닫기" 게이지(b2-ending.js): Enter·스페이스 연타. 꾹 누르기(반복 입력)는 치지 않는다.
    if (['Enter', 'Space'].includes(event.code) && b2DoorStruggling()) {
      event.preventDefault();
      if (!event.repeat) pushB2Door();
    }
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

