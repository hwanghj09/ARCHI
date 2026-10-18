// 게임 조작키는 input.js의 설정을 사용한다. Esc와 창 안의 탐색 키는 고정한다.
// 컷씬: Esc는 건너뛰기, 상호작용 키(E)와 Enter는 화면 클릭처럼 다음 대사로 넘긴다(건너뛰기 버튼에 초점이 있어도).
// Space는 점프 키라 넘기지 않는다. 나머지 키는 막는다.
function handleSceneKey(event, scene, skip) {
  if (event.code === 'Escape') { event.preventDefault(); skip(); }
  else if (keyMatches('interact', event.code) || event.code === 'Enter') { event.preventDefault(); if (!event.repeat) scene.click(); }
  else if (event.code !== 'Tab') event.preventDefault();
}

window.addEventListener('keydown', event => {
  if (mainMenuActive) return;
  if (solarRestoreActive) {
    if (event.code === 'Enter' && event.target.id === 'solar-restore-skip' && !event.repeat) return;
    return handleSceneKey(event, solarRestoreScene, finishSolarRestoreScene);
  }
  if (!b2CaptureScene.hidden) {
    const captureButton = event.target.closest?.('#b2-capture-skip, #b2-bad-ending button');
    if (event.code === 'Escape' && b2CaptureActive) { event.preventDefault(); finishB2CaptureScene(); }
    else if (event.code !== 'Tab' && !(captureButton && ['Enter', 'Space'].includes(event.code))) event.preventDefault();
    return;
  }
  // 지도 창(map.js)은 게임을 멈추지 않는다: Esc만 지도를 닫고 나머지 입력은 그대로 게임에 간다.
  if (!mapWindow.hidden && event.code === 'Escape') { if (!event.repeat) closeMap(); event.preventDefault(); return; }
  // M: 지도 버튼을 누른 것과 같다. 글을 쓰는 칸에서는 글자로 입력된다.
  if (event.code === 'KeyM' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey && !event.target.closest?.('textarea, input, select')) { event.preventDefault(); toggleMap(); return; }
  if (storySceneActive) return handleSceneKey(event, storyScene, skipStoryScene);
  if (blackoutSceneActive) return handleSceneKey(event, blackoutScene, finishBlackoutScene);
  if (cctvSceneActive) return handleSceneKey(event, cctvScene, finishCctvScene);
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
  if (openingActive) return handleSceneKey(event, opening, finishOpening);
  if (photoCaptureTime > 0 || itemUseTime > 0 && event.code !== 'Escape') { event.preventDefault(); return; }
  if (transitioning) { event.preventDefault(); return; }
  // B2 삭제 배틀 터미널(b2-ending.js)은 입력 칸이 키를 받는다. Esc로 닫는다.
  if (b2TerminalOpen) {
    if (event.code === 'Escape' && !event.repeat) { event.preventDefault(); closeB2Terminal(); }
    return;
  }
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
  if (keyMatches('inventory', event.code) && !(event.code === 'Tab' && event.shiftKey) && !usingComputer && !usingKeypad && !usingControl &&
      !usingPhone && !usingPowerPanel && (!usingInspection || inventoryShown())) {
    event.preventDefault();
    if (!event.repeat) toggleInventory();
    return;
  }
  if (keyMatches('phone', event.code) && !event.repeat && !usingPhone && !usingComputer && !usingKeypad && !usingControl && !usingPowerPanel && !usingInspection) {
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
    if (keyMatches('phone', event.code) && !event.repeat) closePhone();
    if (keyMatches('light', event.code) && !event.repeat) togglePhoneLight();
    // 휴대폰을 켠 채로도 이동·점프·달리기·웅크리기는 되고(아래 일반 처리), 나머지 키는 휴대폰 안에서만 쓰인다.
    if (!Object.hasOwn(movementKeys, event.code) && !jumpKeys.has(event.code) && !runKeys.has(event.code) && !crouchKeys.has(event.code)) {
      event.preventDefault();
      return;
    }
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
    // 대화창을 넘기는 닫기 버튼은 Space로 누를 수 없다(E·Esc·클릭만).
    if (event.code === 'Space' && event.target.id === 'inspection-close') { event.preventDefault(); return; }
    if ((event.code === 'Enter' || event.code === 'Space') && event.target.closest('button')) {
      if (event.repeat) event.preventDefault();
      return;
    }
    // Esc는 한 단계 뒤로 간다(가방에서 연 카드 → 가방 목록 → 닫기).
    if (event.code === 'Escape' || keyMatches('interact', event.code)) {
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
    if (keyMatches('light', event.code) && !event.repeat) { event.preventDefault(); togglePhoneLight(); } // 엘리베이터 안에서도 휴대폰·가방·플래시를 쓴다
    // 로봇이 문을 억지로 여는 중(cabin-pry.js): 스페이스·Enter 연타. 꾹 누르기(반복 입력)는 치지 않는다.
    if (['Enter', 'Space'].includes(event.code) && cabinPryStruggling()) {
      event.preventDefault();
      if (!event.repeat) pushCabinPry();
    }
    return;
  }
  if (event.code === 'Escape') {
    event.preventDefault();
    if (!event.repeat && performance.now() - modalClosedAt > 700) openGameMenu();
    return;
  }
  if (keyMatches('light', event.code)) {
    event.preventDefault();
    if (!event.repeat) togglePhoneLight();
    return;
  }
  if (event.target instanceof Element && event.target.closest('button, input') && event.code === 'Space') return;
  if (keyMatches('interact', event.code)) {
    event.preventDefault();
    if (!event.repeat) interact();
    return;
  }
  if (!Object.hasOwn(movementKeys, event.code) && !jumpKeys.has(event.code) && !runKeys.has(event.code) && !crouchKeys.has(event.code)) return;
  event.preventDefault();
  if (jumpKeys.has(event.code)) {
    if (!event.repeat) jumpQueued = true;
  } else keys.add(event.code);
});
window.addEventListener('keyup', event => keys.delete(event.code));


// Space로는 컷씬·대화를 넘기지 못한다. 버튼은 Space를 뗄 때 눌리므로 keyup도 막는다.
window.addEventListener('keyup', event => {
  if (event.code === 'Space' && (solarRestoreActive || storySceneActive || blackoutSceneActive || cctvSceneActive || openingActive ||
      (usingInspection && event.target.id === 'inspection-close'))) event.preventDefault();
}, true);
