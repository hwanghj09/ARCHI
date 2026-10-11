// 사건 기록은 기존 소지품/퍼즐 플래그에 저장하고, 짧은 연출은 불러올 때 재생하지 않는다.
let firstNightRoom = null;
let firstNightElapsed = 0;
let firstNightCue = null;

function firstNightLocation() {
  return gameStarted && !mainMenuActive && currentSceneFloor === 17 && !realBuildingBlackout() &&
    !selectingFloor && ['office', 'corridor'].includes(room) ? room : null;
}

function clearFirstNightCue() {
  firstNightCue = null;
  delete officeComputer.element.dataset.echo;
  for (const sound of ['night-static', 'night-relay', 'night-latch', 'night-track']) stopGameSound(sound);
}

function resetFirstNight() {
  clearFirstNightCue();
  firstNightRoom = null;
  firstNightElapsed = 0;
}

function renderFirstNight() {
  const location = firstNightLocation();
  if (location) world.dataset.firstNight = location;
  else delete world.dataset.firstNight;
  world.dataset.firstNightWatched = String(collectedItems.has('first-night-watch'));
  if (firstNightCue && location !== firstNightCue.room) clearFirstNightCue();
}

function startFirstNightCue(name, duration, message, sound, x) {
  clearFirstNightCue();
  collectedItems.add(`first-night-${name}`);
  firstNightCue = { name, room, remaining: duration };
  if (name === 'monitor') officeComputer.element.dataset.echo = 'true';
  playGameSound(sound, { x, pan: Math.max(-.8, Math.min(.8, (x - body.position.x) / 400)) });
  showStatus(message, duration + 1500);
}

function updateFirstNight(elapsed) {
  const location = firstNightLocation();
  if (!location) return;
  if (openingActive || blackoutSceneActive || storySceneActive || transitioning || usingComputer || usingPhone ||
      usingInspection || usingKeypad || usingPowerPanel || playerCaught || hallucinationCaught) return;
  if (location !== firstNightRoom) { firstNightRoom = location; firstNightElapsed = 0; }
  firstNightElapsed += elapsed;
  if (firstNightCue) {
    firstNightCue.remaining -= elapsed;
    if (firstNightCue.name === 'relays' && Math.abs(body.velocity.x) < .1) {
      stopGameSound('night-relay');
      if (!collectedItems.has('first-night-stopped')) {
        collectedItems.add('first-night-stopped');
        showStatus('멈추자, 천장의 릴레이 소리도 멎었다. 내 움직임에 반응하고 있다.', 3500);
      }
    }
    if (firstNightCue.remaining <= 0) clearFirstNightCue();
  }
  if (location === 'office') {
    if (firstNightElapsed >= 750 && officeComputer.element.dataset.power === 'off' && !collectedItems.has('first-night-monitor')) {
      startFirstNightCue('monitor', 2600, '종료한 모니터에 ARCHK의 ‘외부 연결 시도’가 떠올랐다.', 'night-static', 656);
    }
    return;
  }
  if (firstNightElapsed >= 650 && !collectedItems.has('first-night-door')) {
    startFirstNightCue('door', 1600, '뒤에서 출입문 잠금장치가 혼자 철컥거렸다.', 'night-latch', 644);
  }
  if (body.position.x >= 1050 && Math.abs(body.velocity.x) > .5 && !collectedItems.has('first-night-relays')) {
    startFirstNightCue('relays', 3000, '천장의 전력 릴레이가 내 이동을 따라 차례로 작동한다.', 'night-relay', body.position.x - 240);
  }
  if (body.position.x >= 1390 && !collectedItems.has('first-night-watch')) {
    startFirstNightCue('watch', 2400, 'CCTV가 내 쪽에서 멈췄다.', 'night-track', 1620);
  }
}
